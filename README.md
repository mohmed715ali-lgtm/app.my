# زيوني — Ziyoni

> لعبة نينجا عربية متصفحية — ركض وتحدٍّ ومهارة في مدينة الصحراء الليلية.

A browser-based 2D action runner with an Arabic Ninja theme. Built with
vanilla HTML, CSS, and ES-Module JavaScript on a single `<canvas>`. Zero
dependencies, GitHub Pages ready.

**مشروع تخرّج للطالب: زين العابدين راضي**

---

## Features

- **Skill-based survival runner** with progressive difficulty scaling
- **Hand-designed obstacle chunks** — not purely random; every pattern is
  beatable but tightens as you go
- **Obstacles:** ground spikes, patrolling drones, timed blade walls, neon
  walls
- **Abilities:** Dash (pierces some enemies), Double Jump — unlocked via coins
- **Skins:** five ninja palettes (Shadow, Crimson, Azure, Gold, Phantom)
- **Coin economy** persisted to `localStorage`
- **Juice:** particles, camera shake, slow-mo on hit, dash trail, screen flash,
  smooth parallax background (sky, crescent moon, domes + minarets, dunes)
- **Full Arabic RTL UI:** start menu, shop, pause, game-over, toasts
- **Touch support** — bottom half of screen = jump, top half = dash

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Jump / Double Jump | `Space`, `↑`, or `W` | tap lower half |
| Dash | `Shift`, `X`, or `D` | tap upper half |
| Pause | `P` or `Esc` | pause button |

## Project layout

```
/
├── index.html                 # Entry page
├── style.css                  # DOM chrome (menus, credits)
├── src/
│   ├── main.js                # Boot + canvas fit + system wiring
│   └── game/
│       ├── Game.js            # State machine + main loop
│       ├── Player.js          # Physics + procedural ninja silhouette
│       ├── Obstacle.js        # Spike / Drone / BladeWall / Wall
│       ├── Chunks.js          # Hand-designed pattern catalog + generator
│       ├── CoinSystem.js      # Coin entity + pickup logic
│       ├── AbilitySystem.js   # Dash + Double Jump registry + cooldowns
│       ├── ParticleSystem.js  # Pooled dots / streaks / shards
│       ├── Camera.js          # Smooth follow + shake + slow-mo
│       ├── Background.js      # Parallax sky, city silhouettes, dunes
│       ├── Skins.js           # Skin palettes
│       ├── Storage.js         # localStorage wrapper
│       ├── Input.js           # Keyboard + touch with edge-detection
│       ├── UI.js              # DOM overlays (menu, shop, gameover)
│       └── AssetLoader.js     # Procedural by default; image-ready hooks
└── assets/                    # Optional PNG pack (see assets/README.md)
```

## Run locally

The game uses ES Modules, so you need to serve it over HTTP (not `file://`).

Any static server works. A few options:

```bash
# Python 3
python3 -m http.server 8000
# Node (if you have it)
npx serve .
# PHP
php -S localhost:8000
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

1. Commit your changes and push to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Ziyoni"
   git push
   ```
2. In your repo on GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Pick the branch (usually `main`) and folder `/ (root)`. Click **Save**.
5. After a minute, your game is live at
   `https://<your-username>.github.io/<your-repo>/`.

All paths in the game are relative, so no extra configuration is needed.

> If your repo is not at the user root (e.g. served at `/app.my/`), the
> relative paths still work — just make sure `index.html` stays at the
> repo root.

## Replacing the art

The game ships without binary assets; sprites are drawn procedurally from the
skin palette. To swap in real art, see `assets/README.md` — drop PNGs with
the expected names and flip `USE_IMAGES` in `src/game/AssetLoader.js`.

## Notes on code style

- One class per file, ES modules only.
- Particles are pooled; no allocation during hot loops after warmup.
- The main loop caps `dt` at 50ms to avoid tunneling after tab switches.
- Camera uses a time-independent easing (`1 - exp(-k·dt)`) so follow feel
  doesn't change with framerate.

حقوق الطالب زين العابدين راضي.
