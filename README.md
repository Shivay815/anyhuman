# anyhuman

**Post any task. A human shows up.**

A two-sided marketplace for arbitrary services. Urban Company-style discovery (categories, budgets, trust cues, one-tap booking) but with no service catalogue limits: fix a tap, teach a chord, assemble a desk, or just sit with someone who shouldn't be alone.

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19 + TypeScript + Vite               |
| Backend  | Node 20 + Express 5                        |
| Storage  | JSON file (`data/db.json`, seeded on boot) |
| Deploy   | Docker + Docker Compose (+ Caddy)          |

## Features

- Post a task with category, budget (₹0 allowed), place, time, and description.
- Browse, search, and filter tasks by category or open/matched status.
- Helpers accept tasks with a name and optional note; posters can mark matched tasks done.
- Live marketplace stats (open requests, matches, jobs done, humans helping).
- Seed data so the app looks alive on first boot.
- Responsive, mobile-first UI with dialogs and accessible focus handling.
- Single container in production: Express serves both the API and the built SPA.
- Persistent data via a named Docker volume.

## Local development

Requires Node 20.19+.

```bash
npm install
npm --prefix web install

# terminal 1 - API on :3000
npm run dev

# terminal 2 - Vite dev server on :5173 (proxies /api to :3000)
npm run dev:web
```

Open http://localhost:5173.

Production-style run:

```bash
npm run build   # builds web/dist
npm start       # http://localhost:3000
```

The first boot copies `server/seed.json` into `data/db.json`. Delete `data/` to reset.

## API

| Method | Path                     | Body                                   | Notes                              |
| ------ | ------------------------ | -------------------------------------- | ---------------------------------- |
| GET    | `/api/health`            | -                                      | Liveness probe                     |
| GET    | `/api/tasks`             | -                                      | Filters: `?status=open\|matched\|done`, `?category=`, `?q=` |
| GET    | `/api/stats`             | -                                      | Counts for the landing page        |
| POST   | `/api/tasks`             | `title, description, category, budget, location, when, postedBy` | Creates an open task |
| POST   | `/api/tasks/:id/accept`  | `helper, note`                         | 409 if the task is already taken   |
| POST   | `/api/tasks/:id/complete`| -                                      | Only accepted tasks can be completed |

Example:

```bash
curl -s localhost:3000/api/tasks | head
curl -s -X POST localhost:3000/api/tasks \
  -H 'content-type: application/json' \
  -d '{"title":"Teach me to make biryani","category":"Tutoring","budget":600,"location":"Indiranagar","when":"Sunday, 11 AM","postedBy":"Aarav"}'
```

## Deploy to a home server

### 1. Prepare the server

```bash
# Debian/Ubuntu example
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"   # log out and back in after this
```

### 2. Copy the app over

```bash
ssh user@homeserver 'mkdir -p ~/apps/anyhuman'
rsync -av --exclude node_modules --exclude web/node_modules --exclude web/dist --exclude .git \
  ./ user@homeserver:~/apps/anyhuman/
```

Or clone straight from GitHub:

```bash
ssh user@homeserver
git clone https://github.com/Shivay815/anyhuman.git ~/apps/anyhuman
```

### 3. Run it

```bash
ssh user@homeserver
cd ~/apps/anyhuman
docker compose up -d --build
docker compose ps
curl -s localhost:3000/api/health
```

The container binds to `127.0.0.1:3000` by default so only a local reverse proxy can reach it. For LAN-only access, change the port mapping to `"3000:3000"` in `docker-compose.yml`.

Data lives in the `anyhuman-data` volume. Back it up with:

```bash
docker run --rm -v anyhuman-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/anyhuman-data-$(date +%F).tar.gz -C /data .
```

### 4. Put a domain and HTTPS in front

Install Caddy on the host, point `anyhuman.example.com` at your server (A/AAAA record or Tailscale), then:

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo sed -i 's/anyhuman.example.com/your.domain/' /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy handles certificates automatically. No Caddy? Use nginx or Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

### 5. Update later

```bash
ssh user@homeserver 'cd ~/apps/anyhuman && git pull && docker compose up -d --build'
```

## Project structure

```
server/
  index.js        Express app, validation, static serving, SPA fallback
  store.js        JSON persistence + task lifecycle
  seed.json       Demo marketplace data
web/
  src/App.tsx     Feed, filters, stats, dialogs orchestration
  src/api.ts      Typed fetch client
  src/components/ TaskCard, PostTaskDialog, AcceptDialog, Modal, Icons
  src/styles.css  Design system (Fraunces + Inter, cream/coral/ink)
Dockerfile        Multi-stage build (Vite -> Node runtime)
docker-compose.yml
deploy/Caddyfile
```

## Security and scope

This is a functional demo, not a production marketplace:

- No accounts, authentication, or authorization. Anyone can post or accept with a typed name.
- No payments, messaging, notifications, moderation, or geolocation.
- JSON storage is single-process by design. Fine for a home server; move to Postgres before multi-user scale.
- Inputs are length-checked server-side and rendered as text (React escapes by default).

Natural next steps: magic-link auth, Postgres + Prisma, provider profiles and ratings, in-app chat, payments/escrow, and a moderation queue for task categories.
