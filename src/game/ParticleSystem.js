// Lightweight particle pool. One flat array, updated + drawn in one pass.
// Shapes: 'dot' (circle), 'streak' (short line), 'shard' (triangle).

export class ParticleSystem {
  constructor(max = 400) {
    this.max = max;
    this.pool = [];
    for (let i = 0; i < max; i++) {
      this.pool.push({ alive: false });
    }
  }

  _spawn(cfg) {
    for (let i = 0; i < this.max; i++) {
      const p = this.pool[i];
      if (!p.alive) {
        Object.assign(p, cfg, { alive: true, age: 0 });
        return p;
      }
    }
    return null; // pool full, silently drop
  }

  burst({ x, y, count = 10, color = '#ffffff', speed = 200, life = 0.5, shape = 'dot', size = 3, spread = Math.PI * 2, dir = 0, gravity = 0 }) {
    for (let i = 0; i < count; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      this._spawn({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.7 + Math.random() * 0.6),
        maxLife: life,
        color,
        shape,
        size: size * (0.7 + Math.random() * 0.7),
        gravity,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  trail({ x, y, color = '#3cf0d5', size = 2, life = 0.28 }) {
    this._spawn({
      x, y, vx: 0, vy: 0,
      life, maxLife: life,
      color, shape: 'dot', size,
      gravity: 0, rot: 0, rotSpeed: 0,
    });
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) { p.alive = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.vx *= Math.pow(0.92, dt * 60);
      p.vy *= Math.pow(0.92, dt * 60);
      if (p.rotSpeed) p.rot += p.rotSpeed * dt;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.max; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;
      const t = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, t);

      if (p.shape === 'streak') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else if (p.shape === 'shard') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.9, p.size * 0.6);
        ctx.lineTo(-p.size * 0.9, p.size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
