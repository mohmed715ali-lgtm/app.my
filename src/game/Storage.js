// Thin localStorage wrapper with a schema default.
// Keeps save data in one place so the shape is easy to reason about.

const DEFAULT = {
  coins: 0,
  best: 0,
  totalRuns: 0,
  ownedSkins: ['shadow'],
  equippedSkin: 'shadow',
  ownedAbilities: [],
};

export class Storage {
  constructor(key) {
    this.key = key;
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT, ...parsed };
    } catch {
      return { ...DEFAULT };
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      /* quota or private mode — not fatal */
    }
  }

  get(k) { return this.data[k]; }
  set(k, v) { this.data[k] = v; this.save(); }

  addCoins(n) { this.data.coins += n; this.save(); return this.data.coins; }
  spendCoins(n) {
    if (this.data.coins < n) return false;
    this.data.coins -= n; this.save(); return true;
  }

  ownSkin(id) {
    if (!this.data.ownedSkins.includes(id)) this.data.ownedSkins.push(id);
    this.save();
  }
  ownAbility(id) {
    if (!this.data.ownedAbilities.includes(id)) this.data.ownedAbilities.push(id);
    this.save();
  }

  recordRun(score, runCoins) {
    this.data.totalRuns += 1;
    if (score > this.data.best) this.data.best = score;
    this.addCoins(runCoins);
  }
}
