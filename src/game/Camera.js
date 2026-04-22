// Smooth-follow camera with screen shake and optional slow-mo timescale.
// World coords -> screen coords by subtracting camera x/y.

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shake = 0;       // current amplitude
    this.shakeDecay = 8;  // per second
    this.offsetX = 0;
    this.offsetY = 0;
    this.timeScale = 1;   // 0..1, for slow-mo hits
    this.timeScaleTarget = 1;
  }

  follow(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  addShake(mag) {
    this.shake = Math.min(this.shake + mag, 24);
  }

  setTimeScale(v, instant = false) {
    this.timeScaleTarget = v;
    if (instant) this.timeScale = v;
  }

  update(dt) {
    // Follow with easing — ninja-feel needs snap, not sluggish
    const k = 1 - Math.exp(-dt * 6);
    this.x += (this.targetX - this.x) * k;
    this.y += (this.targetY - this.y) * k;

    // Shake decays and jitters
    if (this.shake > 0.01) {
      this.shake = Math.max(0, this.shake - this.shakeDecay * dt);
      this.offsetX = (Math.random() - 0.5) * this.shake;
      this.offsetY = (Math.random() - 0.5) * this.shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }

    // Timescale lerp
    this.timeScale += (this.timeScaleTarget - this.timeScale) * (1 - Math.exp(-dt * 12));
  }

  apply(ctx) {
    ctx.translate(-this.x + this.offsetX, -this.y + this.offsetY);
  }
}
