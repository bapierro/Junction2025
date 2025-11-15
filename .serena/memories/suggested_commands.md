# Suggested Commands
- `npm install` – install frontend dependencies.
- `cd backend && poetry install` – install FastAPI backend deps (uses Poetry) then `cd ..`.
- `npm run dev` – start Vite dev server (frontend-only prototyping).
- `npm run dev:full` – run `scripts/dev.sh` to boot backend on :8000 then Vite on :3000 for fully functional flow.
- `npm run build` – create production build (outputs to `dist/`).
- `npx vite preview` – preview production bundle locally after `npm run build`.
- Backend env vars live in root `.env`: `STORYCIRCLE_ELEVENLABS_API_KEY`, `STORYCIRCLE_ELEVENLABS_AGENT_ID`. Export before running backend if not using `.env`.