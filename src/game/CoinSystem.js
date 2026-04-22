// Coin entity + pickup behaviour. Coins placed in arcs, chains, or risky spots
// by the chunk generator.

export class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;  // height above ground
    this.r = 10;
    this.phase = Math.random() * Math.PI * 2;
    this.dead = false;
    this.collected = false;
    this.popTime = 0;
  }
  update(dt) {
    this.phase += dt * 4;
    if (this.collected) {
      this.popTime += dt;
      if (this.popTime > 0.35) this.dead = true;
    }
  }
  bounds() {
    const s = this.r * 2;
    return { x: this.x - this.r, y: -this.y - this.r, w: s, h: s };
  }
  render(ctx) {
    if (this.collected) {
      const t = this.popTime / 0.35;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#f5c04a';
      ctx.shadowColor = '#f5c04a';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, -this.y, this.r + t * 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const squish = Math.abs(Math.cos(this.phase));
    const rw = this.r * (0.25 + 0.75 * squish);
    ctx.save();
    ctx.translate(this.x, -this.y);
    // Outer glow
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    g.addColorStop(0, 'rgba(255, 223, 140, 0.85)');
    g.addColorStop(0.5, 'rgba(245, 192, 74, 0.35)');
    g.addColorStop(1, 'rgba(245, 192, 74, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // Coin face
    const face = ctx.createLinearGradient(-rw, -this.r, rw, this.r);
    face.addColorStop(0, '#b07817');
    face.addColorStop(0.5, '#ffdf8c');
    face.addColorStop(1, '#8a5a10');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, this.r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rim
    ctx.strokeStyle = '#5c3c05';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Arabic "ز" stamp when coin is full-on
    if (squish > 0.55) {
      ctx.fillStyle = '#5c3c05';
      ctx.font = 'bold 12px "Reem Kufi", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ز', 0, 1);
    }
    ctx.restore();
  }
}

export class CoinSystem {
  constructor(game) {
    this.game = game;
    this.coins = [];
    this.runCount = 0;
  }
  reset() {
    this.coins.length = 0;
    this.runCount = 0;
  }
  spawn(x, y) { this.coins.push(new Coin(x, y)); }
  update(dt, playerBounds, playerX) {
    for (const c of this.coins) {
      c.update(dt);
      if (!c.collected && _overlap(c.bounds(), playerBounds)) {
        c.collected = true;
        this.runCount += 1;
        this.game.onCoinPickup(c);
      }
    }
    // Cull coins behind camera
    const cutoff = playerX - 800;
    this.coins = this.coins.filter(c => !c.dead && c.x > cutoff - 100);
  }
  render(ctx) { for (const c of this.coins) c.render(ctx); }
}

function _overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
