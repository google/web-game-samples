import { Script } from 'playcanvas';

/** Turns per second at rest: the same speed as the plain HTML/JS/CSS sample. */
const TURNS_PER_SECOND = 0.5;

/** How long a pop lasts, in seconds. */
const POP_SECONDS = 3;

/**
 * Spins the spiral and makes it pop when the player presses the button.
 *
 * It only moves by the frame's `dt`, so pausing the app (`timeScale = 0`)
 * freezes it.
 */
export class Spiral extends Script {
  static scriptName = 'spiral';

  /** Its width on screen, set by the layout. */
  size = 1;

  private angle = 0;
  /** Seconds since the last pop, up to POP_SECONDS (at rest). */
  private sincePop = POP_SECONDS;

  /** A springy pop: bigger and faster for a moment, then back to normal. */
  pop() {
    this.sincePop = 0;
  }

  update(dt: number) {
    this.sincePop = Math.min(this.sincePop + dt, POP_SECONDS);
    const t = this.sincePop;

    // A decaying wobble for the size, and a decaying boost for the speed.
    const pulse = 1 + 0.25 * Math.exp(-5 * t) * Math.cos(18 * t);
    const spin = 1 + 5 * Math.exp(-3 * t);

    this.angle = (this.angle + 360 * TURNS_PER_SECOND * spin * dt) % 360;
    // The camera looks down -Z, so a negative angle turns clockwise on screen.
    this.entity.setLocalEulerAngles(0, 0, -this.angle);
    const scale = this.size * pulse;
    this.entity.setLocalScale(scale, scale, 1);
  }
}
