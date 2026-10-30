# Abby O'Clock

A static, dependency-free clock learning game for kids aged 6–10 (works on phones, tablets, and desktops). Four levels mix reading an analog clock and setting its hands, then build up to elapsed time and hour/minute arithmetic.

## Run locally

Requires Node.js. From this folder, run `npm start` and open `http://127.0.0.1:4173`. Run `npm test` for the learning-logic tests. Deploy the `dist` directory to any static host. No build step or backend is required.

## Run in Docker

With Docker Compose installed, run `docker compose up -d` and open `http://localhost:4173`. The Compose file uses the image published to GitHub Container Registry. To change the host port or network binding, copy `.env.example` to `.env` and edit those values. See [DOCKER.md](DOCKER.md) for build, update, Unraid, and troubleshooting instructions.

The container serves the static game only; it has no database or server-side student records. Progress remains in each browser's local storage, so no container volume is needed.

Upgrading from Tick Tock Club? Switch to the new `ghcr.io/cerlendson/abby-oclock:latest` image. Existing browser progress is preserved.

## Install on Unraid

The public image is `ghcr.io/cerlendson/abby-oclock:latest`. You can install it with the included Unraid template or add it manually.

### Use the included template

In an Unraid Web Terminal, download the template into Unraid's user templates folder:

```sh
mkdir -p /boot/config/plugins/dockerMan/templates-user
wget -O /boot/config/plugins/dockerMan/templates-user/abby-oclock.xml https://raw.githubusercontent.com/cerlendson/TimeTeaching/main/unraid/abby-oclock.xml
```

Then open **Docker → Add Container**, select **Abby O'Clock** from the template list, and click **Apply**. Unraid will pull the image and create the container.

### Add it manually

1. Open **Docker → Add Container** in Unraid.
2. Set **Name** to `abby-oclock` and **Repository** to `ghcr.io/cerlendson/abby-oclock:latest`.
3. Select **Bridge** networking and add a TCP port mapping from host port `4173` to container port `4173`.
4. Click **Apply**, then open `http://<unraid-ip>:4173` in a browser on your network.

No volume mappings are needed. The game saves progress in each browser's local storage. If host port `4173` is already in use, change the host port and keep the container port at `4173`. The app has no sign-in, so keep it on a trusted network or put it behind a reverse proxy that provides authentication before exposing it beyond your local network.

## Files

- `dist/index.html`: accessible single-page screens and dialogs.
- `dist/styles.css`: responsive layout, clock styling, and reduced-motion-aware celebrations.
- `dist/clock.mjs`: SVG analog clock with pointer and keyboard controls.
- `dist/engine.mjs`: balanced question generation, time math, progress validation, and achievements.
- `dist/app.js`: navigation, questions, local storage, lessons, and feedback.

## Learning and scoring

Each question's first valid check counts once toward totals, accuracy, and streaks. Incorrect answers reset the current streak; students can retry or reveal an explanation without additional scoring. Hints are available on demand. Five correct first answers at a level bring a suggestion on the progress screen to try the next level. All levels remain available for teacher choice. Questions are unlimited and avoid the most recent 32 question identities. Mode bags balance reading and setting; math levels also balance forward and backward questions.

Clocks use a 12-hour cycle without AM/PM. The hour hand advances proportionally as minutes change. Level 1 minute controls snap to five-minute increments. Crossing 12 with the minute hand moves the hour correctly. Pointer, keyboard arrow, and large +/− controls offer multiple ways to set the clock. The controls have no numeric readouts. Reduced motion follows the browser preference.

Progress lives only in this browser; no accounts, analytics, or remote student records. The existing browser save key is retained so returning players keep their progress after the rebrand. Restricted storage falls back to the current visit, with an on-screen notice. The game shows only a small current-streak indicator. My progress shows streaks and badges, with accuracy, totals, highest level visited, and per-level results inside a teacher/parent disclosure.
