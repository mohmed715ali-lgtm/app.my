// Player — silhouette ninja drawn procedurally from the current skin palette.
// Physics: classic runner. World scrolls via player.vx > 0, camera follows.
//
// Body is built from primitives (ellipses + quads) so skins recolor cleanly
// without needing spritesheets. Animation is phase-based, not frame-indexed —
// smoother at high speeds and cheaper than swapping images.

import { getSkin } from './Skins.js';

const GRAVITY = 2200;
const JUMP_VY = -820;
const DOUBLE_JUMP_VY = -700;
const DASH_SPEED = 1400;
const DASH_DURATION = 0.22;

export class Player {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.x = 200;
    this.y = 0;       // y is feet position; canvas.y is flipped at render time
    this.vx = 0;
    this.vy = 0;
    this.w = 40;
    this.h = 66;
    this.onGround = true;
    this.jumpsLeft = 1;
    this.dashTime = 0;
    this.invincible = 0;
    this.alive = true;
    this.phase = 0;   // animation phase 0..1
    this.facing = 1;
    this.skin = getSkin(this.game.storage.get('equippedSkin'));
    this.lastTrail = 0;
  }

  setSkin(id) { this.skin = getSkin(id); }

  tryJump() {
    if (this.onGround) {
      this.vy = JUMP_VY;
      this.onGround = false;
      this.jumpsLeft = this.game.abilities.owns('doubleJump') ? 1 : 0;
      this.game.particles.burst({
        x: this.x, y: this.y, count: 10, color: this.skin.accent,
        speed: 180, life: 0.35, size: 2.4, spread: Math.PI * 0.8, dir: -Math.PI / 2,
      });
      return true;
    } else if (this.jumpsLeft > 0) {
      this.vy = DOUBLE_JUMP_VY;
      this.jumpsLeft--;
      this.game.particles.burst({
        x: this.x, y: this.y - this.h * 0.3, count: 14, color: this.skin.accent,
        speed: 240, life: 0.4, size: 2, spread: Math.PI * 2, shape: 'dot',
      });
      return true;
    }
    return false;
  }

  tryDash() {
    if (this.dashTime > 0) return false;
    if (!this.game.abilities.trigger('dash')) return false;
    this.dashTime = DASH_DURATION;
    this.invincible = Math.max(this.invincible, DASH_DURATION + 0.05);
    this.game.particles.burst({
      x: this.x - 10, y: this.y - this.h / 2,
      count: 18, color: this.skin.trail, speed: 420,
      life: 0.45, size: 3, spread: 0.8, dir: Math.PI, shape: 'streak',
    });
    this.game.camera.addShake(4);
    return true;
  }

  hit() {
    if (this.invincible > 0 || !this.alive) return false;
    this.alive = false;
    return true;
  }

  update(dt, worldSpeed) {
    if (!this.alive) return;

    // Horizontal motion = world scroll + optional dash
    const dashBoost = this.dashTime > 0 ? DASH_SPEED : 0;
    this.vx = worldSpeed + dashBoost;
    this.x += this.vx * dt;

    // Gravity & vertical motion (y increases upward in world — but I'll keep
    // y=0 at ground and y positive means above ground for clarity)
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= 0) {
      if (!this.onGround) {
        // Landed
        this.game.particles.burst({
          x: this.x, y: 0, count: 10, color: '#b89a6a',
          speed: 140, life: 0.35, size: 2, spread: Math.PI * 0.7, dir: -Math.PI / 2,
        });
        this.game.camera.addShake(1.5);
      }
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
      this.jumpsLeft = this.game.abilities.owns('doubleJump') ? 1 : 0;
    } else {
      this.onGround = false;
    }

    // Timers
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      // Leave a trail every few ms during dash
      this.lastTrail += dt;
      if (this.lastTrail > 0.015) {
        this.lastTrail = 0;
        this.game.particles.trail({
          x: this.x - 4, y: this.y - this.h * 0.5,
          color: this.skin.trail, size: 4, life: 0.25,
        });
      }
    }
    if (this.invincible > 0) this.invincible -= dt;

    // Running phase — tied to horizontal velocity
    this.phase += (worldSpeed / 140) * dt;
  }

  // Rough AABB around the visible silhouette
  bounds() {
    const cx = this.x;
    const cy = this.y - this.h / 2;
    return {
      x: cx - this.w / 2 + 4,
      y: cy - this.h / 2 + 4,
      w: this.w - 8,
      h: this.h - 8,
    };
  }

  render(ctx) {
    const { skin } = this;
    const x = this.x;
    const y = this.y; // feet

    ctx.save();
    ctx.translate(x, y);

    // Ground-contact shadow
    const shadowSize = this.onGround ? 22 : Math.max(8, 22 - (-this.y) * 0.02);
    ctx.save();
    ctx.globalAlpha = this.onGround ? 0.55 : 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 2, shadowSize, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Running bob — legs articulate via sin of phase
    const step = Math.sin(this.phase * Math.PI * 2);
    const bob = this.onGround ? Math.abs(step) * -2 : 0;
    const airTilt = !this.onGround ? Math.max(-0.25, Math.min(0.25, this.vy * 0.0004)) : 0;

    ctx.translate(0, bob);
    ctx.rotate(airTilt);

    // Dash flicker: briefly outline the whole silhouette
    if (this.dashTime > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = skin.trail;
      this._drawBody(ctx, step, -18);
      ctx.restore();
    }
    if (this.invincible > 0 && !this.dashTime) {
      // subtle damage blink
      if (Math.floor(this.invincible * 20) % 2 === 0) { ctx.globalAlpha = 0.6; }
    }

    this._drawBody(ctx, step, 0);

    ctx.restore();
  }

  // Draws the ninja silhouette at offset ox. Body is a head + torso + limbs.
  _drawBody(ctx, step, ox) {
    const { skin } = this;
    const bodyH = this.h;
    const bodyW = this.w;

    // Legs
    const legSpread = this.onGround ? step * 14 : Math.sign(this.vy) * -6;
    ctx.fillStyle = skin.body;
    // Back leg
    ctx.beginPath();
    ctx.roundRect(ox - 4 - legSpread, -22, 10, 26, 4);
    ctx.fill();
    // Front leg
    ctx.beginPath();
    ctx.roundRect(ox - 4 + legSpread, -22, 10, 26, 4);
    ctx.fill();

    // Torso
    ctx.fillStyle = skin.body2;
    ctx.beginPath();
    ctx.roundRect(ox - bodyW / 2 + 6, -bodyH + 22, bodyW - 12, bodyH - 40, 7);
    ctx.fill();

    // Chest wrap
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.roundRect(ox - bodyW / 2 + 6, -bodyH + 32, bodyW - 12, 10, 3);
    ctx.fill();

    // Arms (one swings forward, one back — classic run)
    const armSwing = step * 16;
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.roundRect(ox - 4 - armSwing, -bodyH + 26, 8, 24, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(ox - 4 + armSwing * 0.7, -bodyH + 26, 8, 20, 4);
    ctx.fill();

    // Scarf — flowing backward. Curl amplitude grows with speed.
    const flow = Math.sin(this.phase * Math.PI * 2 + 1.2) * 3;
    ctx.save();
    ctx.translate(ox - 8, -bodyH + 32);
    ctx.fillStyle = skin.scarf;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(-14, flow, -26, 8 + flow);
    ctx.quadraticCurveTo(-18, 12, -4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Head — hood
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.arc(ox, -bodyH + 14, 14, 0, Math.PI * 2);
    ctx.fill();
    // Hood shadow ring
    ctx.fillStyle = skin.body2;
    ctx.beginPath();
    ctx.arc(ox + 2, -bodyH + 15, 12, Math.PI * 0.1, Math.PI * 1.1);
    ctx.fill();

    // Face mask slit (eye glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = skin.eyeGlow;
    ctx.fillRect(ox + 2, -bodyH + 12, 9, 2);
    ctx.shadowColor = skin.eyeGlow;
    ctx.shadowBlur = 8;
    ctx.fillRect(ox + 2, -bodyH + 12, 9, 2);
    ctx.restore();

    // Accent belt
    ctx.fillStyle = skin.accent;
    ctx.fillRect(ox - bodyW / 2 + 6, -bodyH + 44, bodyW - 12, 3);

    // Subtle glow edge — the signature "silhouette + glow" of the art direction
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = skin.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(ox - bodyW / 2 + 6, -bodyH + 22, bodyW - 12, bodyH - 40, 7);
    ctx.stroke();
    ctx.restore();
  }

  // Static preview for shop cards
  static renderPreview(ctx, skinId, cx, cy, scale = 1) {
    const skin = getSkin(skinId);
    ctx.save();
    ctx.translate(cx, cy + 28 * scale);
    ctx.scale(scale, scale);

    // shadow
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const proto = new Player({
      storage: { get: () => skinId },
      abilities: { owns: () => false, trigger: () => false },
      particles: { burst: () => {}, trail: () => {} },
      camera: { addShake: () => {} },
    });
    proto.skin = skin;
    proto._drawBody(ctx, 0.2, 0);
    ctx.restore();
  }
}

// Safari polyfill for older contexts — most browsers have roundRect now
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}
