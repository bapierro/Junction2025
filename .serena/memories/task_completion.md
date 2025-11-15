# Task Completion Checklist
- Run `npm run build` (and `npx vite preview` if needed) to ensure Vite bundle compiles after changes.
- When backend changes are involved, re-run `npm run dev:full` (or backend server via Poetry) to confirm `/conversations/token` and other endpoints still respond.
- Document updates to `src/Attributions.md`, mock data, configuration, or environment expectations in your change notes/PR description.
- Provide screenshots or clips for UI changes per repo guidelines; call out ElevenLabs/mock-data adjustments explicitly.