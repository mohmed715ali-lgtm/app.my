// Parallax background. Four layers drawn procedurally:
//   1. Sky + stars + crescent moon
//   2. Far city silhouette (domes, minarets, small windows)
//   3. Mid city (taller buildings, neon accents)
//   4. Foreground dunes + ground detail
//
// Each layer scrolls at a different fraction of camera.x for depth. The
// silhouettes themselves are tiled chunks generated once per layer with a
// seeded RNG so the skyline repeats gracefully as the player runs.

const TILE = 1024;

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Background {
  constructor() {
    this.layers = [
      this._buildFarCity(),
      this._buildMidCity(),
    ];
    this._stars = this._buildStars();
  }

  _buildStars() {
    const rng = mulberry32(7);
    const n = 140;
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: rng() * 2000,
        y: rng() * 400,
        s: rng() * 1.4 + 0.3,
        tw: rng() * Math.PI * 2,
      });
    }
    return stars;
  }

  _buildFarCity() {
    // Render once to an offscreen canvas and tile it.
    const c = document.createElement('canvas');
    c.width = TILE; c.height = 360;
    const ctx = c.getContext('2d');
    const rng = mulberry32(42);

    // Silhouette wave
    ctx.fillStyle = '#0a1028';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    let x = 0;
    while (x < TILE) {
      const type = rng();
      if (type < 0.35) {
        // Dome
        const w = 50 + rng() * 40;
        const h = 40 + rng() * 30;
        ctx.lineTo(x, 360 - h * 0.5);
        ctx.quadraticCurveTo(x + w / 2, 360 - h * 1.4, x + w, 360 - h * 0.5);
        x += w;
      } else if (type < 0.6) {
        // Minaret
        const w = 14 + rng() * 10;
        const h = 80 + rng() * 60;
        ctx.lineTo(x, 360 - 20);
        ctx.lineTo(x, 360 - h);
        ctx.lineTo(x + w / 2, 360 - h - 12);
        ctx.lineTo(x + w, 360 - h);
        ctx.lineTo(x + w, 360 - 20);
        x += w;
      } else {
        // Flat building
        const w = 60 + rng() * 90;
        const h = 30 + rng() * 60;
        ctx.lineTo(x, 360 - h);
        ctx.lineTo(x + w, 360 - h);
        x += w;
      }
    }
    ctx.lineTo(TILE, 360);
    ctx.closePath();
    ctx.fill();

    // Window dots (warm)
    ctx.fillStyle = 'rgba(245, 192, 74, 0.5)';
    for (let i = 0; i < 120; i++) {
      const px = rng() * TILE;
      const py = 250 + rng() * 100;
      ctx.fillRect(px, py, 1.5, 1.5);
    }
    return { canvas: c, speed: 0.15, y: 0.35 };
  }

  _buildMidCity() {
    const c = document.createElement('canvas');
    c.width = TILE; c.height = 420;
    const ctx = c.getContext('2d');
    const rng = mulberry32(99);

    // Taller, more varied silhouette
    ctx.fillStyle = '#060a1c';
    ctx.beginPath();
    ctx.moveTo(0, 420);
    let x = 0;
    const tops = [];
    while (x < TILE) {
      const type = rng();
      let w, h;
      if (type < 0.25) { // dome building
        w = 70 + rng() * 40;
        h = 90 + rng() * 40;
        ctx.lineTo(x, 420 - h);
        ctx.lineTo(x + w * 0.4, 420 - h);
        ctx.quadraticCurveTo(x + w / 2, 420 - h - 32, x + w * 0.6, 420 - h);
        ctx.lineTo(x + w, 420 - h);
      } else if (type < 0.55) { // minaret
        w = 24 + rng() * 14;
        h = 160 + rng() * 80;
        ctx.lineTo(x, 420 - h * 0.65);
        ctx.lineTo(x, 420 - h);
        ctx.lineTo(x + w / 2, 420 - h - 20);
        ctx.lineTo(x + w, 420 - h);
        ctx.lineTo(x + w, 420 - h * 0.65);
      } else { // tall building
        w = 80 + rng() * 60;
        h = 100 + rng() * 100;
        ctx.lineTo(x, 420 - h);
        ctx.lineTo(x + w, 420 - h);
      }
      tops.push({ x, w, h });
      x += w;
    }
    ctx.lineTo(TILE, 420);
    ctx.closePath();
    ctx.fill();

    // Neon accents — alternating teal / magenta window strips
    for (const t of tops) {
      if (rng() < 0.4) {
        const color = rng() < 0.5 ? 'rgba(60, 240, 213, 0.55)' : 'rgba(255, 74, 157, 0.5)';
        ctx.fillStyle = color;
        const ny = 420 - t.h + 10 + Math.floor(rng() * (t.h - 30));
        ctx.fillRect(t.x + 4, ny, t.w - 8, 1.5);
      }
      // Warm windows
      ctx.fillStyle = 'rgba(255, 210, 140, 0.55)';
      const winCount = Math.floor(t.w / 10);
      for (let i = 0; i < winCount; i++) {
        for (let j = 0; j < Math.floor(t.h / 14); j++) {
          if (rng() < 0.25) {
            ctx.fillRect(t.x + 4 + i * 9, 420 - t.h + 8 + j * 14, 2, 2);
          }
        }
      }
    }
    return { canvas: c, speed: 0.35, y: 0.48 };
  }

  update(dt, time) {
    this._time = time;
  }

  render(ctx, camX, w, h) {
    // --- Sky gradient ---
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#030514');
    sky.addColorStop(0.55, '#0a0f2a');
    sky.addColorStop(1, '#12182e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Warm horizon glow
    const glow = ctx.createRadialGradient(w * 0.75, h * 0.55, 0, w * 0.75, h * 0.55, w * 0.6);
    glow.addColorStop(0, 'rgba(245, 170, 90, 0.18)');
    glow.addColorStop(0.5, 'rgba(245, 170, 90, 0.05)');
    glow.addColorStop(1, 'rgba(245, 170, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // --- Moon ---
    const moonX = w * 0.82;
    const moonY = h * 0.22;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 90);
    mg.addColorStop(0, 'rgba(255, 240, 200, 0.4)');
    mg.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
    ctx.restore();
    // Crescent via masked circles
    ctx.save();
    ctx.fillStyle = '#fce6b3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
    ctx.fill();
    // Cut out the bite
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(moonX + 14, moonY - 4, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Stars with parallax ---
    const t = this._time || 0;
    ctx.save();
    for (const s of this._stars) {
      const sx = ((s.x - camX * 0.05) % 2000 + 2000) % 2000;
      const sy = s.y * (h / 400);
      if (sy > h * 0.55) continue;
      const tw = 0.55 + 0.45 * Math.sin(t * 2 + s.tw);
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#cfe3ff';
      ctx.fillRect(sx, sy, s.s, s.s);
    }
    ctx.restore();

    // --- Tiled silhouette layers ---
    for (const L of this.layers) {
      const lw = L.canvas.width;
      const lh = L.canvas.height;
      const drawH = Math.min(lh, h * 0.7);
      const dy = h - drawH - h * (0.02);
      const offset = -((camX * L.speed) % lw);
      let x = offset;
      while (x < w) {
        ctx.drawImage(L.canvas, 0, 0, lw, lh, x, dy, lw, drawH);
        x += lw;
      }
    }

    // --- Ground ---
    this._renderGround(ctx, camX, w, h);
  }

  _renderGround(ctx, camX, w, h) {
    const groundY = h * 0.84; // where world y=0 sits on screen
    // Far dune silhouettes
    const rng = mulberry32(3);
    ctx.fillStyle = '#0d1220';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 6);
    const step = 60;
    for (let x = -step; x < w + step * 2; x += step) {
      const wx = x + ((-camX * 0.6) % step);
      const dY = Math.sin((x + camX * 0.6) * 0.01) * 10;
      ctx.lineTo(wx, groundY - 6 + dY);
    }
    ctx.lineTo(w, groundY + 40);
    ctx.lineTo(0, groundY + 40);
    ctx.closePath();
    ctx.fill();

    // Near ground band
    const gradTop = ctx.createLinearGradient(0, groundY, 0, h);
    gradTop.addColorStop(0, '#1a1526');
    gradTop.addColorStop(0.4, '#120c1c');
    gradTop.addColorStop(1, '#060408');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Edge line
    ctx.strokeStyle = 'rgba(60, 240, 213, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(w, groundY + 0.5);
    ctx.stroke();

    // Scrolling stone texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 24; i++) {
      const rx = ((rng() * 2000 - camX * 0.9) % w + w) % w;
      const ry = groundY + 10 + rng() * (h - groundY - 14);
      ctx.fillRect(rx, ry, rng() * 30 + 4, 1);
    }
    rng(); // consume for determinism
  }
}
