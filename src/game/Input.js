// Keyboard + touch input with edge-detection (wasPressed) for one-shot actions.

export class Input {
  constructor(target) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered this frame
    this._queue = [];

    this.touchJump = false;
    this.touchDash = false;
    this._touchDashCooldown = 0;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      this._queue.push(k);
      // Prevent page scroll on arrows / space while playing
      if (['arrowup', 'arrowdown', ' ', 'space'].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // Touch: bottom half = jump, top half = dash. Keeps controls simple on mobile.
    const touch = (ev) => {
      ev.preventDefault();
      const t = ev.touches[0] || ev.changedTouches[0];
      if (!t) return;
      const rect = target.getBoundingClientRect();
      const y = t.clientY - rect.top;
      if (y > rect.height * 0.45) {
        this.touchJump = true;
        this._queue.push(' ');
      } else {
        this.touchDash = true;
        this._queue.push('shift');
      }
    };
    target.addEventListener('touchstart', touch, { passive: false });
    target.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchJump = false;
      this.touchDash = false;
    }, { passive: false });
  }

  // Call once per frame before reading input
  tick() {
    this.pressed = new Set(this._queue);
    this._queue = [];
  }

  // Continuous
  down(...keys) { return keys.some(k => this.keys.has(k)); }

  // Edge-triggered
  was(...keys) { return keys.some(k => this.pressed.has(k)); }

  jumpPressed() { return this.was(' ', 'space', 'arrowup', 'w'); }
  dashPressed() { return this.was('shift', 'x', 'd'); }
  pausePressed() { return this.was('p', 'escape'); }
}
