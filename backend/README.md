# StoryCircle Backend (FastAPI)

This prototype FastAPI service powers the story recording → transcription → publish → reaction loop described in the hackathon brief. It stores stories, tracks reactions/reporting, and exposes thin wrappers for ElevenLabs STT/TTS so the frontend can orchestrate the flow quickly.

## Project Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI factory + routers
│   ├── config.py            # Pydantic settings (STORYCIRCLE_* env vars)
│   ├── database.py          # SQLModel engine + session helpers (SQLite default)
│   ├── models.py            # Story, Reaction, Report tables
│   ├── routers/
│   │   ├── stories.py       # CRUD, transcription, reactions, reporting
│   │   └── admin.py         # Report review + moderation endpoints
│   ├── services/
│   │   ├── storage.py       # Local audio persistence (storage/audio)
│   │   ├── elevenlabs.py    # Async STT/TTS client with graceful fallback
│   │   └── security.py      # Share-token + admin helpers
│   └── tests/               # Pytest suite covering MVP stories
└── requirements.txt         # FastAPI + SQLModel + pytest deps
```

## Environment Variables

Every setting is prefixed with `STORYCIRCLE_` (see `app/config.py`). The most important ones:

- `STORYCIRCLE_DATABASE_URL` – defaults to `sqlite:///./storycircle.db`. Override with Postgres later.
- `STORYCIRCLE_STORAGE_DIR` – folder for uploaded audio. Defaults to `storage/audio` (auto-created).
- `STORYCIRCLE_ELEVENLABS_API_KEY` – **fill in your team key** to enable live transcription/tts; blank uses deterministic stubs.
- `STORYCIRCLE_ELEVENLABS_VOICE_ID` – optional default voice for `/stories/{id}/tts` (future use).
- `STORYCIRCLE_ELEVENLABS_AGENT_ID` – agent ID from the ElevenLabs dashboard; required for generating WebRTC conversation tokens.
- `STORYCIRCLE_OPENAI_API_KEY` – OpenAI key used by the Responses API to turn transcripts into polished stories. If empty, the service falls back to the raw transcript.
- `STORYCIRCLE_OPENAI_MODEL` – defaults to `gpt-5-mini`; override if you want another Responses-compatible model.
- `STORYCIRCLE_OPENAI_REASONING_EFFORT` – reasoning effort passed to the Responses API (`minimal`, `low`, `medium`, `high`).
- `STORYCIRCLE_ADMIN_TOKEN` – set to any secret; pass via `x-admin-token` header for moderation endpoints.
- `STORYCIRCLE_SHARE_TOKEN_SECRET` – tweak for production randomness if you persist tokens externally.

Create a `.env` next to `backend/` or export vars in your shell before running.

## Running the API

```bash
# From repo root
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The starter data uses SQLite, so the API is ready immediately. Audio uploads land in `storage/audio`; the ElevenLabs service reads from disk when invoking STT. If no API key is configured the service simulates a transcript (useful for demos/tests). When running through `scripts/dev.sh`, the script automatically invokes `poetry run uvicorn …` before launching Vite.

## Tests

Pytest validates the user stories and moderation rules:

```bash
cd backend
poetry run pytest app/tests -q
```

The suite spins up an in-memory SQLite database, fakes audio uploads, verifies transcription flow, public wall filtering, reaction rate limiting, and admin report handling.

## Admin & Moderation

- `POST /stories/{id}/report` flags a story; flagged stories surface in `GET /admin/reports` (requires `x-admin-token`).
- `PATCH /admin/reports/{id}` marks a report handled and `DELETE /admin/stories/{id}` (204) soft-deletes content by setting `moderation_status=removed`.

## Conversational AI Helpers

- `POST /conversations/token` proxies ElevenLabs’ `convai/conversation/token` API and returns a short-lived token for the React client to open a WebRTC session. This endpoint requires both `STORYCIRCLE_ELEVENLABS_API_KEY` and `STORYCIRCLE_ELEVENLABS_AGENT_ID`. When the API key is missing the endpoint returns a placeholder token (`dev-token-*`) so UI code can surface a configuration warning without crashing.
- `POST /stories/from-transcript` accepts a live-agent transcript, optionally tags/metadata, calls the OpenAI Responses API with `gpt-5-mini`, and persists the resulting narrative + raw transcript as a private story. This keeps transcripts server-side and reuses the existing Story model immediately.

## ElevenLabs Integration Notes

- Real STT is triggered by `POST /stories/{id}/transcribe`: the audio file saved during `/stories` creation is POSTed to `https://api.elevenlabs.io/v1/speech-to-text`. Plug your key into `STORYCIRCLE_ELEVENLABS_API_KEY` and, if desired, set a specific voice for TTS playback via `STORYCIRCLE_ELEVENLABS_VOICE_ID`.
- `app/services/elevenlabs.py` handles both real calls (with `httpx`) and offline fallbacks. In addition to transcription/TTS it can now mint WebRTC conversation tokens via `create_conversation_token`, so the frontend never needs direct access to the ElevenLabs API key.

Frontends can call the API in this order: `POST /stories` → `POST /stories/{id}/transcribe` → `PUT /stories/{id}` (to set visibility) → `GET /stories/public` / `GET /stories/{id}` for viewing. React/report endpoints are ready for low-friction listener feedback.
