# OBS Remote Media Controller

Control the images (and a shared YouTube player) of an OBS stream from any device — a phone, an iPad, a laptop.
Made for running tabletop sessions: prepare a session's images, then switch between them, or let several rotate,
without the players being distracted by sudden changes.

- **Controller:** [obs-media-control.piogino.ch](https://obs-media-control.piogino.ch) (needs the admin key)
- **API:** `https://api.piogino.ch/obs/api` — reading is open, changing needs the key

## What it does

- **Slots** — each slot is one image shown in OBS: a browser source with `/display?slot=N`.
- **Quick images** — ten prepared images below each slot (2 rows of 5). A click shows one; keys **1–9, 0** do the
  same for the slot last used. Drop an image file onto a quick image (or paste into a chosen one) to upload it there.
- **Rotation** — "Rotate…": choose several quick images in order and the seconds per image (10 by default, the
  last value is remembered, adjustable while it runs). **Space** starts the last rotation again or stops it.
- **Calm changes** — every change fades: the new image fades in while the old one fades out, with complementary
  curves so the picture never becomes see-through halfway (2 s; in a rotation up to 2.5 s). The display preloads
  the slot's quick images, so a change starts on time. The controller's preview fades the same way.
- **Library** — upload, paste, add by URL; thumbnails; images from the **Adenai map**'s media library (search,
  category, tags) can be picked directly and are shown from there, not copied.
- **Scenes** — save and load all slots, quick images and rotations included (one scene per session).
- **Player** — a YouTube player shared by every device.

## Using it in OBS

Add a **Browser** source with the URL `https://obs-media-control.piogino.ch/display?slot=1` (2 for slot 2 …), at
the canvas size (e.g. 1920 × 1080). The page is transparent; set the background in the scene or in the source's
*Custom CSS*. After a deploy, right-click the source → **Refresh** to load the new version.

## Layout

```
backend/    Express + Socket.IO (pm2: obs-remote-backend, port 3003; nginx: api.piogino.ch/obs/)
  src/routes/          slots, scenes, images, player
  src/services/        slotState.js (what a slot holds, how a change applies), storage.js (JSON files),
                       websocketService.js (live updates), playerService.js
  data/  uploads/      runtime data — on the server only, not in git
  test/                unit and API tests
frontend/   React + Vite + Tailwind, on GitHub Pages
  src/pages/           Control, Display (OBS), Library, Scenes, Player
  src/components/      control/SlotControl, control/QuickSlots, common/CrossfadeImage, common/LibraryPicker …
  test/e2e/            browser tests (Playwright)
scripts/githooks/      pre-push: runs all tests
```

## Configuration

`backend/.env` (only on the server): `PORT`, `ADMIN_API_KEY` (the key for every change), `ALLOWED_ORIGINS`
(comma-separated), `API_BASE_URL` (the public address uploads are served from), `MAX_FILE_SIZE`.
For tests and local runs: `OBS_DATA_DIR` and `OBS_UPLOADS_DIR` point the server at other folders.
(`UPLOAD_DIR` and `DATABASE_PATH` in the server's `.env` are no longer read.)

`frontend/.env.production`: `VITE_API_BASE_URL`, `VITE_WS_URL`; `frontend/.env.e2e` points a test build at the
local test server.

## Tests

```bash
cd backend && npm test              # unit tests + the API against a server of their own (temporary folders)
cd frontend && npm run test:e2e     # the app in a browser against a seeded test server (port 3113)
```

Neither touches the live data. `git config core.hooksPath scripts/githooks` once per checkout: every push runs both.

## Deploy

```bash
git push                                   # the pre-push hook runs the tests
pm2 restart obs-remote-backend             # when backend/ changed — before the frontend
cd frontend && GIT_SSH_COMMAND="ssh -i ~/.ssh/obs_controller_deploy -o IdentitiesOnly=yes" npm run deploy
```

`npm run deploy` runs the browser tests, builds, and publishes to the `gh-pages` branch. Restart the backend first
when its API changed: a new frontend against the old server could lose slot data.

Older, more detailed notes: `docs/API.md`, `docs/ARCHITECTURE.md`, `frontend/DEPLOY.md` (partly out of date).

## License

MIT
