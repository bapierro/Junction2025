# StoryCircle Mobile Web App
- Mobile-first storytelling experience built with Vite + React + TypeScript; backend FastAPI service (under `backend/`) powers ElevenLabs conversation flows.
- `src/main.tsx` mounts `App.tsx`. Individual screens live under `src/components/*Screen.tsx`, shared UI primitives in `src/components/ui`, media helpers in `src/components/figma`, utilities in `src/lib`, and Tailwind styles in `src/index.css` + `src/styles/globals.css`.
- Figma design reference: https://www.figma.com/design/XIbyxmhOicdCjGGp2tQFIi/StoryCircle-Mobile-Web-App.
- ElevenLabs integration requires `STORYCIRCLE_ELEVENLABS_API_KEY` and `STORYCIRCLE_ELEVENLABS_AGENT_ID` in the repo-root `.env`. Frontend talks to backend via `/conversations/token`, `/stories`, `/admin` endpoints (backend must run on :8000).
- Assets credits tracked in `src/Attributions.md`; keep UI copy and flows synchronized with `src/guidelines` documentation.