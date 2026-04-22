// Obstacle types. Each implements update(dt, ctx), render(ctx), and bounds().
// World x grows to the right; ground is y=0. All sprites drawn procedurally
// so the art stays cohesive with the rest of the game.

// --- Spike: ground trap. Sits on ground, multi-tooth ---
export class Spike {
  constructor(x, width = 56, phaseIn = 0) {
    this.type = 'spike';
    this.x = x;
    this.y = 0;
    this.w = width;
    this.h = 24;
    this.teeth = Math.max(2, Math.round(width / 14));
    this.phaseIn = phaseIn; // 0..1 spawn animation
    this.dead = false;
  }
  update(dt) {
    if (this.phaseIn < 1) this.phaseIn = Math.min(1, this.phaseIn + dt * 4);
  }
  bounds() {
    return { x: this.x, y: -this.h * this.phaseIn, w: this.w, h: this.h * this.phaseIn };
  }
  render(ctx) {
    const h = this.h * this.phaseIn;
    const step = this.w / this.teeth;
    // Base plate
    ctx.fillStyle = '#14172a';
    ctx.fillRect(this.x, -2, this.w, 2);
    // Teeth
    ctx.fillStyle = '#cdd3e8';
    ctx.strokeStyle = '#7f8ab0';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.teeth; i++) {
      const tx = this.x + i * step;
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx + step / 2, -h);
      ctx.lineTo(tx + step, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Glint
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < this.teeth; i++) {
      const tx = this.x + i * step + step / 2;
      ctx.fillRect(tx - 1, -h + 4, 1, Math.max(2, h * 0.5));
    }
    ctx.restore();
  }
}

// --- Drone: patrol enemy. Hovers and bobs. Hit detection ignores ground height. ---
export class Drone {
  constructor(x, y = 120, amplitude = 22, speed = 0) {
    this.type = 'drone';
    this.x = x;
    this.y = y;            // height above ground
    this.baseY = y;
    this.amp = amplitude;
    this.patrolSpeed = speed; // optional left drift relative to world
    this.phase = Math.random() * Math.PI * 2;
    this.w = 52;
    this.h = 28;
    this.dead = false;
  }
  update(dt) {
    this.phase += dt * 3.4;
    this.y = this.baseY + Math.sin(this.phase) * this.amp;
    this.x -= this.patrolSpeed * dt;
  }
  bounds() {
    return { x: this.x - this.w / 2, y: -this.y - this.h / 2, w: this.w, h: this.h };
  }
  render(ctx) {
    const x = this.x;
    const y = -this.y;

    // Hover beam under
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createLinearGradient(x, y, x, y + 80);
    grad.addColorStop(0, 'rgba(255, 74, 157, 0.45)');
    grad.addColorStop(1, 'rgba(255, 74, 157, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 4, y + 80);
    ctx.lineTo(x - 4, y + 80);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = '#1a1f3a';
    ctx.strokeStyle = '#2a3152';
    ctx.beginPath();
    ctx.ellipse(x, y, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing eye
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ff4a9d';
    ctx.shadowColor = '#ff4a9d';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x + 8, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Propeller wobble
    const wob = Math.sin(this.phase * 4) * 3;
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - this.w / 2 - 6, y + wob);
    ctx.lineTo(x - this.w / 2 + 2, y);
    ctx.moveTo(x + this.w / 2 + 6, y - wob);
    ctx.lineTo(x + this.w / 2 - 2, y);
    ctx.stroke();
  }
}

// --- BladeWall: timed vertical blade that slides in from the ground ---
export class BladeWall {
  constructor(x, cycle = 2.0, offset = 0) {
    this.type = 'blade';
    this.x = x;
    this.w = 16;
    this.fullH = 130;
    this.cycle = cycle;      // seconds per full up/down cycle
    this.t = offset;
    this.dead = false;
  }
  update(dt) { this.t += dt; }
  _progress() {
    const p = (this.t % this.cycle) / this.cycle;
    // triangle wave, stays out for ~45% of cycle
    return p < 0.5 ? Math.min(1, p * 2.2) : Math.max(0, (1 - p) * 2.2);
  }
  bounds() {
    const h = this.fullH * this._progress();
    if (h < 6) return { x: this.x, y: 1, w: 0, h: 0 }; // effectively absent
    return { x: this.x - this.w / 2, y: -h, w: this.w, h };
  }
  render(ctx) {
    const p = this._progress();
    const h = this.fullH * p;

    // Base housing
    ctx.fillStyle = '#161b33';
    ctx.fillRect(this.x - 14, -6, 28, 6);
    ctx.fillStyle = '#2a3152';
    ctx.fillRect(this.x - 14, -6, 28, 2);

    if (h < 2) return;

    // Blade
    ctx.save();
    const grad = ctx.createLinearGradient(this.x, 0, this.x, -h);
    grad.addColorStop(0, '#7a83a6');
    grad.addColorStop(0.5, '#e6ebff');
    grad.addColorStop(1, '#7a83a6');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - this.w / 2, -h, this.w, h);

    // Cutting glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(60, 240, 213, 0.3)';
    ctx.fillRect(this.x - 2, -h, 4, h);
    ctx.shadowColor = '#3cf0d5';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x - 1, -h, 2, h);
    ctx.restore();
  }
}

// --- Wall: solid block to jump over. Low and short. ---
export class Wall {
  constructor(x, w = 40, h = 60) {
    this.type = 'wall';
    this.x = x;
    this.w = w;
    this.h = h;
    this.dead = false;
  }
  update() {}
  bounds() { return { x: this.x, y: -this.h, w: this.w, h: this.h }; }
  render(ctx) {
    ctx.fillStyle = '#12172c';
    ctx.strokeStyle = '#2a3152';
    ctx.lineWidth = 1;
    ctx.fillRect(this.x, -this.h, this.w, this.h);
    ctx.strokeRect(this.x, -this.h, this.w, this.h);
    // Lamp detail on top
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#f5c04a';
    ctx.shadowColor = '#f5c04a';
    ctx.shadowBlur = 12;
    ctx.fillRect(this.x + this.w / 2 - 3, -this.h - 4, 6, 4);
    ctx.restore();
  }
}
