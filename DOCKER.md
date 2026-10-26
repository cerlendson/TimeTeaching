# Abby O'Clock Docker deployment

Abby O'Clock is a static web app, so the container only serves the files in `dist`. It runs as the unprivileged `node` user, uses a read-only filesystem in Compose, and needs no database, secrets, or mounted data directory. Student progress stays in each browser's local storage.

## Run the published image

The GitHub Actions workflow publishes multi-platform images for `linux/amd64` and `linux/arm64` to:

```text
ghcr.io/cerlendson/abby-oclock:latest
```

From this repository, start the service with:

```sh
docker compose pull
docker compose up -d
```

Open `http://localhost:4173`. To stop the service, run `docker compose down`. To update it later, run `docker compose pull` followed by `docker compose up -d`.

The host port defaults to `4173`. To use another port or limit access to this machine, copy `.env.example` to `.env` and edit `WEBUI_PORT` or set `WEBUI_BIND=127.0.0.1`.

If the GHCR package is private, authenticate with `docker login ghcr.io` before pulling. To allow unauthenticated downloads, change the package visibility to public in the repository's GitHub Packages settings.

## Upgrade from Tick Tock Club

The app keeps the existing browser save key, so progress is retained. After updating this repository, replace the old Compose container with the Abby O'Clock image:

```sh
docker compose down --remove-orphans
docker compose pull
docker compose up -d
```

For an existing Unraid container, edit its Repository field to `ghcr.io/cerlendson/abby-oclock:latest` and click **Apply**. You can also rename the container to `abby-oclock`.

## Build from source

Build a local image and run it without Compose:

```sh
docker build -t abby-oclock:local .
docker run -d --name abby-oclock --restart unless-stopped -p 4173:4173 --read-only --cap-drop=ALL --security-opt=no-new-privileges:true abby-oclock:local
```

Open `http://localhost:4173`. The image includes a health check at `/health`.

## Unraid

Use the template at `unraid/abby-oclock.xml`, or add a container manually with repository `ghcr.io/cerlendson/abby-oclock:latest`, bridge networking, and a host-to-container port mapping such as `4173:4173`. No path mappings are required. If the image is private, configure GHCR credentials or make the package public.

## Network access

The app has no sign-in or server-side access controls. By default Compose publishes it on all host interfaces. Keep it on a trusted network, or put it behind a reverse proxy that provides HTTPS and authentication before exposing it beyond your local network.

If port `4173` is already in use, change `WEBUI_PORT` in `.env` and recreate the service with `docker compose up -d`.
