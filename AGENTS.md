# Project Guidance

## User Preferences

- Beginner-friendly, simple, well-explained project suitable for an internship submission
- Responsive chat frontend with dynamic message updates
- Professional README and clear project structure

## Verified Commands

- **typecheck**: `mops check --fix`
- **build**: `mops build`

## Learnings

- Read receipts must aggregate OTHER members' read markers (exclude the sender's own), or the sender's messages self-report as read.
- A Tailwind color utility like bg-success only works when the token is declared in tailwind.config.js colors; a CSS variable alone generates no rule.
- With darkMode: ['class'], the dark class must be added to document.documentElement at runtime for the dark theme to apply.
- Keep exactly ONE pending migration file: mops check --fix aborts with 'too many pending migrations for check-limit=1' when src/backend/migrations/ has more than one migration not in the deployed .most baseline.
- A migration's NewActor must exactly match main.mo's stable declarations or the build fails with M0169.
- Backend timestamps are nanosecond bigints; convert via new Date(Number(ts / 1_000_000n)).
- Biome enforces import ordering; run pnpm exec biome check --fix src after writing frontend files.
