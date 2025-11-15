# Code Style & Conventions
- React + TS with functional components and explicit prop interfaces; use 2-space indentation.
- Component files use PascalCase, hooks camelCase with `use` prefix, utilities live under `src/lib`. Keep handlers next to related state (see `App.tsx`).
- Styling via Tailwind utility classes plus CSS variables defined in `src/styles/globals.css`. Extend/create Radix UI wrappers once under `src/components/ui` (no one-off overrides). Prefer `ImageWithFallback` for remote imagery, adjust tokens in `globals.css` for theme changes.
- Keep JSX sections presentation-focused; shared media helpers in `src/components/figma`; mock/shared logic in `src/lib` (e.g., `mockData.ts`). Maintain asset credits in `src/Attributions.md` when adding media.