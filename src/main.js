// Entrypoint: wire up canvas, game, UI bindings.
import { Game } from './game/Game.js';
import { UI } from './game/UI.js';
import { Input } from './game/Input.js';
import { AssetLoader } from './game/AssetLoader.js';
import { Storage } from './game/Storage.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

const storage = new Storage('ziyoni.v1');
const assets = new AssetLoader();
const input = new Input(canvas);
const ui = new UI(document.getElementById('ui'), storage);

const game = new Game({ canvas, ctx, input, ui, assets, storage });

// Screen boot sequence
(async () => {
  await assets.ready(); // procedural — returns immediately, but keeps pipeline future-proof
  ui.bindGame(game);
  ui.showMenu();
  game.start();
})();

// Keep canvas pixel-perfect on resize / device pixel ratio change
function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  game.onResize(w, h, dpr);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Pause when tab loses focus — feels right for a skill game
window.addEventListener('blur', () => game.autoPause());
