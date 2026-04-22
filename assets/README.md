# الأصول البصرية — Asset Pack

This folder holds **optional external art** for زيوني. By default the game
runs entirely procedurally (all sprites drawn on canvas from the skin palette
defined in `src/game/Skins.js`), so no files are required here. When you want
to drop in hand-drawn or pixel art, put PNGs here and flip the toggle in
`src/game/AssetLoader.js`.

## How to enable external art

1. Drop PNGs into this folder using the names below.
2. Open `src/game/AssetLoader.js`.
3. Change `USE_IMAGES = true` and uncomment the entries in `IMAGE_SOURCES`.
4. Reload the page. The loader will await all images before the game starts.

## Expected asset names

| Filename | Purpose | Suggested size |
| --- | --- | --- |
| `player_shadow.png`  | Base ninja skin (silhouette + teal accent) | 128x128 |
| `player_crimson.png` | Crimson skin | 128x128 |
| `player_azure.png`   | Azure skin | 128x128 |
| `player_gold.png`    | Gold skin | 128x128 |
| `player_phantom.png` | Phantom skin | 128x128 |
| `bg_sky.png`         | Sky + stars layer (seamless horizontally) | 1024x512 |
| `bg_city_far.png`    | Far-city silhouette (seamless) | 1024x360 |
| `bg_city_mid.png`    | Mid-city silhouette (seamless) | 1024x420 |
| `bg_dunes.png`       | Foreground dunes band (seamless) | 1024x180 |
| `drone.png`          | Patrol drone | 64x40 |
| `coin.png`           | Collectible coin (ideally 8 spin frames) | 320x40 |
| `spike.png`          | Single spike tooth | 32x48 |
| `blade.png`          | Blade wall | 32x160 |

All art should follow the style guide in the top-level README: dark elegant
silhouettes, teal + magenta neon accents, warm amber highlights for coins.
