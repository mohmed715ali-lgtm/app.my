// Chunk-based obstacle patterns. Each chunk is a hand-designed arrangement
// of obstacles + coins over a fixed-width span. Difficulty controls which
// chunks are eligible. This gives the "smart pattern" feel — every run is
// different but every pattern is beatable.
//
// Chunk format:
//   { name, width, minDifficulty, build(x, out) }
// `build` pushes objects to `out.obstacles` / `out.coins` in world coords
// starting at x.

import { Spike, Drone, BladeWall, Wall } from './Obstacle.js';

const C = []; // catalog

function def(name, width, minDifficulty, build) {
  C.push({ name, width, minDifficulty, build });
}

// --- easy: breathers ---
def('empty_long', 420, 0, (x, out) => {
  out.coins.push([x + 80, 60]);
  out.coins.push([x + 160, 80]);
  out.coins.push([x + 240, 60]);
});

def('single_spike', 400, 0, (x, out) => {
  out.obstacles.push(new Spike(x + 160, 54));
  out.coins.push([x + 90, 70]);
  out.coins.push([x + 160, 150]);
  out.coins.push([x + 230, 70]);
});

def('low_wall', 360, 0, (x, out) => {
  out.obstacles.push(new Wall(x + 140, 36, 50));
  out.coins.push([x + 158, 120]);
});

// --- mid: mixed ---
def('double_spike', 480, 1, (x, out) => {
  out.obstacles.push(new Spike(x + 120, 50));
  out.obstacles.push(new Spike(x + 280, 70));
  out.coins.push([x + 195, 160]);
  out.coins.push([x + 320, 70]);
});

def('drone_low', 440, 1, (x, out) => {
  out.obstacles.push(new Drone(x + 220, 82, 16));
  out.coins.push([x + 140, 140]);
  out.coins.push([x + 220, 200]);
  out.coins.push([x + 300, 140]);
});

def('spike_over_wall', 440, 2, (x, out) => {
  out.obstacles.push(new Wall(x + 140, 40, 46));
  out.obstacles.push(new Spike(x + 260, 60));
  out.coins.push([x + 160, 130]);
  out.coins.push([x + 260, 150]);
});

def('blade_gate', 420, 2, (x, out) => {
  out.obstacles.push(new BladeWall(x + 180, 2.4, 0));
  out.coins.push([x + 90, 70]);
  out.coins.push([x + 260, 70]);
  out.coins.push([x + 180, 170]);
});

// --- hard ---
def('drone_wall_combo', 540, 3, (x, out) => {
  out.obstacles.push(new Wall(x + 120, 30, 56));
  out.obstacles.push(new Drone(x + 330, 110, 28));
  out.obstacles.push(new Spike(x + 460, 44));
  out.coins.push([x + 140, 150]);
  out.coins.push([x + 240, 180]);
  out.coins.push([x + 400, 80]);
});

def('double_blade', 520, 3, (x, out) => {
  out.obstacles.push(new BladeWall(x + 160, 1.6, 0));
  out.obstacles.push(new BladeWall(x + 360, 1.6, 0.8));
  out.coins.push([x + 260, 50]);
  out.coins.push([x + 260, 110]);
});

def('spike_field', 520, 3, (x, out) => {
  for (let i = 0; i < 3; i++) {
    out.obstacles.push(new Spike(x + 80 + i * 150, 50));
  }
  out.coins.push([x + 155, 140]);
  out.coins.push([x + 305, 180]);
  out.coins.push([x + 455, 140]);
});

// --- very hard ---
def('gauntlet', 620, 4, (x, out) => {
  out.obstacles.push(new Spike(x + 80, 56));
  out.obstacles.push(new Drone(x + 260, 90, 10));
  out.obstacles.push(new Wall(x + 400, 36, 54));
  out.obstacles.push(new BladeWall(x + 530, 1.4, 0.3));
  out.coins.push([x + 80, 180]);
  out.coins.push([x + 420, 150]);
  out.coins.push([x + 530, 60]);
});

def('drone_flock', 560, 4, (x, out) => {
  out.obstacles.push(new Drone(x + 180, 70, 16));
  out.obstacles.push(new Drone(x + 340, 130, 22));
  out.obstacles.push(new Drone(x + 480, 80, 16));
  out.coins.push([x + 260, 200]);
  out.coins.push([x + 410, 60]);
});

def('spike_blade_trap', 600, 5, (x, out) => {
  out.obstacles.push(new Spike(x + 100, 70));
  out.obstacles.push(new BladeWall(x + 280, 1.3, 0));
  out.obstacles.push(new Spike(x + 420, 70));
  out.obstacles.push(new BladeWall(x + 540, 1.3, 0.65));
  out.coins.push([x + 100, 180]);
  out.coins.push([x + 380, 170]);
  out.coins.push([x + 520, 170]);
});

// --- reward chunks: chains of coins ---
def('coin_arc', 400, 0, (x, out) => {
  // High arc that rewards a well-timed jump
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const cx = x + 40 + t * 340;
    const cy = 60 + Math.sin(t * Math.PI) * 140;
    out.coins.push([cx, cy]);
  }
});

def('coin_risk', 360, 2, (x, out) => {
  // Coins sitting on spikes — collect only while airborne
  out.obstacles.push(new Spike(x + 100, 160));
  for (let i = 0; i < 6; i++) out.coins.push([x + 100 + i * 25, 50]);
});

export class ChunkGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
    this.cursor = 0;          // world x where next chunk should start
    this.startRun = 0;
    this._recent = [];        // avoid immediate repeats
  }

  reset(startX) {
    this.cursor = startX;
    this._recent.length = 0;
  }

  _rand() {
    // xorshift — deterministic so runs are reproducible if seed fixed
    let x = this.seed;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0;
    return (this.seed & 0xffffff) / 0xffffff;
  }

  _pickChunk(difficulty) {
    const eligible = C.filter(c => c.minDifficulty <= difficulty && !this._recent.includes(c.name));
    const pool = eligible.length ? eligible : C.filter(c => c.minDifficulty <= difficulty);
    // Bias slightly toward harder chunks as difficulty grows
    const weighted = [];
    for (const c of pool) {
      const w = 1 + c.minDifficulty * (difficulty > 2 ? 0.6 : 0.15);
      for (let i = 0; i < Math.ceil(w * 2); i++) weighted.push(c);
    }
    return weighted[Math.floor(this._rand() * weighted.length)];
  }

  // Generate chunks up to targetX. Returns a list of {obstacles, coins}.
  generateUntil(targetX, difficulty) {
    const result = { obstacles: [], coins: [] };
    while (this.cursor < targetX) {
      const chunk = this._pickChunk(difficulty);
      chunk.build(this.cursor, result);
      this._recent.push(chunk.name);
      if (this._recent.length > 3) this._recent.shift();
      this.cursor += chunk.width;
    }
    return result;
  }
}
