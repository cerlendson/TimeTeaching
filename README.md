# Tick Tock Club

A static, dependency-free clock learning game for Grades 3–5. Four levels mix reading an analog clock and setting its hands, then build up to elapsed time and hour/minute arithmetic.

## Run locally

Requires Node.js. From this folder, run `npm start` and open `http://127.0.0.1:4173`. Run `npm test` for the learning-logic tests. Deploy the `dist` directory to any static host. No build step or backend is required.

## Run in Docker

With Docker Compose installed, run `docker compose up -d` and open `http://localhost:4173`. The Compose file uses the image published to GitHub Container Registry. To change the host port or network binding, copy `.env.example` to `.env` and edit those values. See [DOCKER.md](DOCKER.md) for build, update, Unraid, and troubleshooting instructions.

The container serves the static game only; it has no database or server-side student records. Progress remains in each browser's local storage, so no container volume is needed.

## Files

- `dist/index.html`: accessible single-page screens and dialogs.
- `dist/styles.css`: responsive layout, clock styling, and reduced-motion-aware celebrations.
- `dist/clock.mjs`: SVG analog clock with pointer and keyboard controls.
- `dist/engine.mjs`: balanced question generation, time math, progress validation, and achievements.
- `dist/app.js`: navigation, questions, local storage, lessons, and feedback.

## Learning and scoring

Each question's first valid check counts once toward totals, accuracy, and streaks. Incorrect answers reset the current streak; students can retry or reveal an explanation without additional scoring. Hints are available on demand. Five correct first answers at a level bring a suggestion on the progress screen to try the next level. All levels remain available for teacher choice. Questions are unlimited and avoid the most recent 32 question identities. Mode bags balance reading and setting; math levels also balance forward and backward questions.

Clocks use a 12-hour cycle without AM/PM. The hour hand advances proportionally as minutes change. Level 1 minute controls snap to five-minute increments. Crossing 12 with the minute hand moves the hour correctly. Pointer, keyboard arrow, and large +/− controls offer multiple ways to set the clock. The controls have no numeric readouts. Reduced motion follows the browser preference.

Progress lives only in this browser under `tick-tock-club-progress-v1`; no accounts, analytics, or remote student records. Restricted storage falls back to the current visit, with an on-screen notice. The game shows only a small current-streak indicator. My progress shows streaks and badges, with accuracy, totals, highest level visited, and per-level results inside a teacher/parent disclosure.
