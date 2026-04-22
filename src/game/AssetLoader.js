// AssetLoader — currently generates procedural sprites so the game runs with
// zero binary assets. The API mirrors an image-loader so you can swap in real
// artwork by dropping PNGs into /assets and wiring their paths below.
//
// To replace with real art, populate `IMAGE_SOURCES` with paths under /assets/
// and set `USE_IMAGES = true`. Each expected name is documented there.

const USE_IMAGES = false;

const IMAGE_SOURCES = {
  // 'player_shadow':  './assets/player_shadow.png',
  // 'player_crimson': './assets/player_crimson.png',
  // 'player_azure':   './assets/player_azure.png',
  // 'player_gold':    './assets/player_gold.png',
  // 'bg_sky':         './assets/bg_sky.png',
  // 'bg_city_far':    './assets/bg_city_far.png',
  // 'bg_city_mid':    './assets/bg_city_mid.png',
  // 'bg_dunes':       './assets/bg_dunes.png',
  // 'drone':          './assets/drone.png',
  // 'coin':           './assets/coin.png',
};

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this._promise = null;
  }

  ready() {
    if (this._promise) return this._promise;
    if (!USE_IMAGES) { this._promise = Promise.resolve(); return this._promise; }
    const tasks = Object.entries(IMAGE_SOURCES).map(([name, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { this.images.set(name, img); resolve(); };
        img.onerror = () => { console.warn('Missing asset:', src); resolve(); };
        img.src = src;
      });
    });
    this._promise = Promise.all(tasks);
    return this._promise;
  }

  get(name) { return this.images.get(name) || null; }
  has(name) { return this.images.has(name); }
}
