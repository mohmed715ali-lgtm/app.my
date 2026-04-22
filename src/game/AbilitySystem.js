// Central registry of abilities + cooldown tracking.
// Player queries this instead of hard-coding which moves exist.

export const ABILITY_DEFS = {
  dash: {
    id: 'dash',
    name: 'اندفاع',
    desc: 'اندفاع سريع للأمام يخترق بعض العوائق',
    price: 150,
    cooldown: 1.2,
    duration: 0.22,
  },
  doubleJump: {
    id: 'doubleJump',
    name: 'قفزة مزدوجة',
    desc: 'قفزة ثانية في الهواء',
    price: 300,
    cooldown: 0,
    duration: 0,
  },
};

export class AbilitySystem {
  constructor(storage) {
    this.storage = storage;
    this.cooldowns = {};
    for (const id of Object.keys(ABILITY_DEFS)) this.cooldowns[id] = 0;
  }

  owns(id) {
    return this.storage.get('ownedAbilities').includes(id);
  }

  ready(id) {
    return this.owns(id) && (this.cooldowns[id] || 0) <= 0;
  }

  trigger(id) {
    if (!this.ready(id)) return false;
    this.cooldowns[id] = ABILITY_DEFS[id].cooldown;
    return true;
  }

  cooldownRatio(id) {
    const def = ABILITY_DEFS[id];
    if (!def || !def.cooldown) return 0;
    return Math.max(0, Math.min(1, (this.cooldowns[id] || 0) / def.cooldown));
  }

  update(dt) {
    for (const id of Object.keys(this.cooldowns)) {
      if (this.cooldowns[id] > 0) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    }
  }

  reset() {
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = 0;
  }
}
