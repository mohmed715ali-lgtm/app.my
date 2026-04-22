// Game — top-level controller + main loop.
//
// World space: y=0 is ground, positive y is above ground (conceptually).
// For rendering we flip to screen space by subtracting camera y and adding
// a ground baseline. Player carries the world forward; camera follows x only.

import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { ParticleSystem } from './ParticleSystem.js';
import { CoinSystem } from './CoinSystem.js';
import { Background } from './Background.js';
import { AbilitySystem } from './AbilitySystem.js';
import { ChunkGenerator } from './Chunks.js';

const STATES = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
});

const WORLD_SPEED_BASE = 380;
const WORLD_SPEED_MAX = 920;
const SPEED_INCREASE = 0.6;   // units per second²

export class Game {
  constructor({ canvas, ctx, input, ui, assets, storage }) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.ui = ui;
    this.assets = assets;
    this.storage = storage;

    this.state = STATES.MENU;

    // Screen-space dims
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.dpr = 1;

    // Systems
    this.camera = new Camera();
    this.particles = new ParticleSystem(600);
    this.coins = new CoinSystem(this);
    this.background = new Background();
    this.abilities = new AbilitySystem(storage);
    this.chunks = new ChunkGenerator();

    this.player = new Player(this);

    // World
    this.obstacles = [];
    this.distance = 0;
    this.runCoins = 0;
    this.worldSpeed = WORLD_SPEED_BASE;
    this.elapsed = 0;
    this.damageFlash = 0;
    this.deathAnim = 0;
    this.startedAtScore = 0;

    // Timing
    this._last = 0;
    this._raf = 0;

    // Ground line on screen
    this.groundScreenY = 0;
    this._updateGroundLine();
  }

  // -------- lifecycle ---------
  start() {
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  beginRun() {
    this.obstacles.length = 0;
    this.coins.reset();
    this.player.reset();
    this.particles = new ParticleSystem(600);
    this.abilities.reset();
    this.chunks.reset(this.player.x + 400);
    this.distance = 0;
    this.runCoins = 0;
    this.worldSpeed = WORLD_SPEED_BASE;
    this.elapsed = 0;
    this.damageFlash = 0;
    this.deathAnim = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.setTimeScale(1, true);
    this.state = STATES.PLAYING;
    this.ui.onGameStart();
  }

  autoPause() {
    if (this.state === STATES.PLAYING) {
      this.state = STATES.PAUSED;
      this.ui.showPause();
    }
  }

  togglePause() {
    if (this.state === STATES.PLAYING) {
      this.state = STATES.PAUSED;
      this.ui.showPause();
    } else if (this.state === STATES.PAUSED) {
      this.state = STATES.PLAYING;
      this.ui.hideOverlays();
      this._last = performance.now(); // avoid dt spike
    }
  }

  exitToMenu() {
    this.state = STATES.MENU;
    this.ui.showMenu();
  }

  onResize(w, h, dpr) {
    this.vw = w;
    this.vh = h;
    this.dpr = dpr;
    this._updateGroundLine();
  }

  _updateGroundLine() {
    // Match Background._renderGround — ground is at 84% of screen height
    this.groundScreenY = Math.floor(this.vh * 0.84);
  }

  // -------- main loop ---------
  _tick = (now) => {
    this._raf = requestAnimationFrame(this._tick);
    let dt = (now - this._last) / 1000;
    this._last = now;
    if (dt > 0.05) dt = 0.05; // cap — avoid tunneling after tab switch
    this.input.tick();

    // Handle pause shortcut regardless of state
    if (this.input.pausePressed()) {
      if (this.state === STATES.PLAYING || this.state === STATES.PAUSED) this.togglePause();
    }

    // Update
    if (this.state === STATES.PLAYING) {
      this._updatePlaying(dt);
    } else if (this.state === STATES.GAMEOVER) {
      this.deathAnim += dt;
      this.camera.update(dt);
      this.particles.update(dt);
    }

    // Always render
    this._render();
  };

  _updatePlaying(dt) {
    // Difficulty scaling
    this.elapsed += dt;
    this.worldSpeed = Math.min(
      WORLD_SPEED_MAX,
      WORLD_SPEED_BASE + SPEED_INCREASE * this.elapsed * 30,
    );
    const difficulty = Math.min(5, Math.floor(this.elapsed / 14));

    // Input -> player
    if (this.input.jumpPressed()) this.player.tryJump();
    if (this.input.dashPressed()) this.player.tryDash();

    const effDt = dt * this.camera.timeScale;

    // Player
    this.player.update(effDt, this.worldSpeed);
    this.abilities.update(effDt);

    // Camera follows a point ahead of the player
    const camLookAhead = 300 + (this.player.dashTime > 0 ? 120 : 0);
    const targetCamX = this.player.x - camLookAhead;
    this.camera.follow(targetCamX, 0);
    this.camera.update(dt);

    // Spawn chunks ahead
    const spawnAhead = this.player.x + 1400;
    const gen = this.chunks.generateUntil(spawnAhead, difficulty);
    for (const o of gen.obstacles) this.obstacles.push(o);
    for (const [cx, cy] of gen.coins) this.coins.spawn(cx, cy);

    // Update obstacles
    for (const o of this.obstacles) o.update(effDt);

    // Collisions
    const pb = this.player.bounds();
    // Coins
    this.coins.update(effDt, pb, this.player.x);
    // Obstacles
    for (const o of this.obstacles) {
      if (o.dead) continue;
      if (_overlap(o.bounds(), pb)) {
        // Dash + spike -> blow through
        if (this.player.dashTime > 0 && (o.type === 'wall' || o.type === 'drone')) {
          o.dead = true;
          this.particles.burst({
            x: this.player.x, y: -this.player.h / 2,
            count: 24, color: '#ffffff', speed: 380, life: 0.45, size: 3,
            spread: Math.PI * 2, shape: 'shard',
          });
          this.camera.addShake(6);
          continue;
        }
        this._handleDamage();
        break;
      }
    }

    // Cull obstacles far behind
    const cutoff = this.player.x - 600;
    this.obstacles = this.obstacles.filter(o => !o.dead && o.x + (o.w || 40) > cutoff);

    // Distance
    this.distance += this.worldSpeed * effDt;

    // Background
    this.background.update(dt, performance.now() / 1000);

    // Particles
    this.particles.update(dt);

    // Damage flash decay
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 2.5);
  }

  _handleDamage() {
    if (!this.player.hit()) return;
    this.damageFlash = 1;
    this.camera.addShake(14);
    this.camera.setTimeScale(0.25);
    this.particles.burst({
      x: this.player.x, y: -this.player.h / 2,
      count: 30, color: '#ff6a6a', speed: 420,
      life: 0.7, size: 3, spread: Math.PI * 2, shape: 'shard', gravity: 800,
    });
    setTimeout(() => {
      if (this.state === STATES.PLAYING) {
        this._endRun();
      }
    }, 500);
  }

  _endRun() {
    this.state = STATES.GAMEOVER;
    this.camera.setTimeScale(1);
    const score = Math.floor(this.distance / 10);
    this.startedAtScore = score;
    this.storage.recordRun(score, this.coins.runCount);
    this.ui.showGameOver({
      score,
      runCoins: this.coins.runCount,
      best: this.storage.get('best'),
    });
  }

  onCoinPickup(coin) {
    this.camera.addShake(1.2);
    this.particles.burst({
      x: coin.x, y: -coin.y, count: 10, color: '#f5c04a',
      speed: 220, life: 0.45, size: 2.5, spread: Math.PI * 2,
    });
    this.ui.pingCoin();
  }

  // -------- render ---------
  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Work in CSS pixels
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const vw = this.vw;
    const vh = this.vh;

    ctx.clearRect(0, 0, vw, vh);

    // Background — parallax, uses camera.x
    this.background.render(ctx, this.camera.x, vw, vh);

    // World space: translate so world origin (0,0) is at (-camX, groundScreenY).
    ctx.save();
    ctx.translate(-this.camera.x + this.camera.offsetX, this.groundScreenY + this.camera.offsetY);

    // Coins behind obstacles
    this.coins.render(ctx);

    // Obstacles
    for (const o of this.obstacles) {
      if (o.x - this.camera.x > vw + 200) continue;
      if (o.x + (o.w || 60) < this.camera.x - 100) continue;
      o.render(ctx);
    }

    // Player
    if (this.state !== STATES.MENU) this.player.render(ctx);

    // Particles
    this.particles.render(ctx);

    ctx.restore();

    // HUD (only during play + gameover)
    if (this.state === STATES.PLAYING || this.state === STATES.PAUSED) {
      this._renderHUD(ctx, vw, vh);
    }

    // Damage flash
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 60, 60, ${this.damageFlash * 0.4})`;
      ctx.fillRect(0, 0, vw, vh);
    }

    // Vignette
    const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.4, vw / 2, vh / 2, Math.max(vw, vh) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);
  }

  _renderHUD(ctx, vw, vh) {
    ctx.save();
    // Score (top right for LTR numbers, which is conventional even in RTL pages)
    const score = Math.floor(this.distance / 10);
    ctx.font = '700 34px "Reem Kufi", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(233, 238, 251, 0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(score.toLocaleString('ar-EG'), vw - 24, 22);
    ctx.font = '500 13px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(154, 164, 198, 0.9)';
    ctx.fillText('النتيجة', vw - 24, 58);

    // Coin counter (top right, below score)
    ctx.textAlign = 'right';
    ctx.font = '700 22px "Reem Kufi", sans-serif';
    ctx.fillStyle = '#f5c04a';
    ctx.shadowColor = 'rgba(245, 192, 74, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(this.coins.runCount.toLocaleString('ar-EG'), vw - 48, 90);
    // Coin icon
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = '#f5c04a';
    ctx.arc(vw - 30, 102, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ability indicators (bottom left area is safe — pause button is top left)
    this._drawAbilityPip(ctx, 24, vh - 72, 'dash', 'اندفاع', 'shift');
    this._drawAbilityPip(ctx, 24, vh - 132, 'doubleJump', 'قفزة مزدوجة', '');

    // Speed bar (tiny, top center)
    const sp = (this.worldSpeed - WORLD_SPEED_BASE) / (WORLD_SPEED_MAX - WORLD_SPEED_BASE);
    const barW = 160;
    const barX = vw / 2 - barW / 2;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(barX, 32, barW, 4);
    const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    g.addColorStop(0, '#3cf0d5');
    g.addColorStop(1, '#ff4a9d');
    ctx.fillStyle = g;
    ctx.fillRect(barX, 32, barW * sp, 4);
    ctx.fillStyle = 'rgba(154, 164, 198, 0.8)';
    ctx.font = '500 11px "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('السرعة', vw / 2, 14);

    ctx.restore();
  }

  _drawAbilityPip(ctx, x, y, id, label, hotkey) {
    const owned = this.abilities.owns(id);
    const ratio = this.abilities.cooldownRatio(id);
    const size = 44;

    ctx.save();
    // Frame
    ctx.fillStyle = owned ? 'rgba(10, 14, 32, 0.7)' : 'rgba(10, 14, 32, 0.35)';
    ctx.strokeStyle = owned ? 'rgba(60, 240, 213, 0.45)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 10);
    ctx.fill();
    ctx.stroke();

    // Cooldown fill
    if (owned && ratio > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(x, y + (1 - ratio) * size, size, ratio * size);
    }

    // Icon
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.strokeStyle = owned ? '#eafffb' : '#4a5580';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (id === 'dash') {
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(8, 0);
      ctx.moveTo(2, -6); ctx.lineTo(10, 0); ctx.lineTo(2, 6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-8, 6); ctx.lineTo(0, -2); ctx.lineTo(8, 6);
      ctx.moveTo(-8, -2); ctx.lineTo(0, -10); ctx.lineTo(8, -2);
      ctx.stroke();
    }
    ctx.restore();

    // Label (RTL)
    ctx.textAlign = 'left';
    ctx.fillStyle = owned ? 'rgba(233, 238, 251, 0.9)' : 'rgba(154, 164, 198, 0.6)';
    ctx.font = '600 13px "Tajawal", sans-serif';
    ctx.fillText(label, x + size + 10, y + 18);
    if (owned && hotkey) {
      ctx.fillStyle = 'rgba(154, 164, 198, 0.6)';
      ctx.font = '500 11px "Tajawal", sans-serif';
      ctx.fillText(hotkey, x + size + 10, y + 34);
    } else if (!owned) {
      ctx.fillStyle = 'rgba(154, 164, 198, 0.55)';
      ctx.font = '500 11px "Tajawal", sans-serif';
      ctx.fillText('مقفل', x + size + 10, y + 34);
    }
    ctx.restore();
  }
}

function _overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
