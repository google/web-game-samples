// The spiral, in 3D: a coil of glossy beads that winds down and out from a
// raised center, like a seashell. A Script spins it, makes it ripple, and
// makes the beads hop in turn when the player presses the button.

import { type AppBase, Color, Entity, Script, StandardMaterial, Vec3 } from 'playcanvas';

/** How many times the coil winds around its center. */
const TURNS = 2.5;
/** The distance of the innermost and outermost beads from the center. */
const INNER_RADIUS = 0.35;
const OUTER_RADIUS = 2.2;
/** The diameter of the innermost and outermost beads. */
const INNER_SIZE = 0.16;
const OUTER_SIZE = 0.42;
/** How much higher the center is than the outer end. */
const HEIGHT = 1.5;

/** Turns per second, at rest. */
const TURNS_PER_SECOND = 0.08;
/** How far the beads rise and fall in the wave that runs along the coil. */
const WAVE_HEIGHT = 0.04;
/** How high a bead hops after a press. */
const HOP_HEIGHT = 0.6;
/** How long the hop takes to travel from the center to the outer end. */
const RIPPLE_SECONDS = 0.6;
/** How long a pop lasts, in seconds. */
const POP_SECONDS = 3;

interface Bead {
  entity: Entity;
  material: StandardMaterial;
  /** Where along the coil it sits: 0 at the center, 1 at the outer end. */
  t: number;
  /** Its resting position. */
  rest: Vec3;
  /** Its diameter. */
  size: number;
}

export class Coil extends Script {
  static scriptName = 'coil';

  /** The beads, from the center out. Filled in by createCoil(). */
  beads: Bead[] = [];

  private angle = 0;
  private time = 0;
  /** Seconds since the last pop, up to POP_SECONDS (at rest). */
  private sincePop = POP_SECONDS;

  /** Spin faster for a moment, and make the beads hop from the center out. */
  pop() {
    this.sincePop = 0;
  }

  /**
   * Points around everywhere the beads can be, whichever way the coil has
   * turned and however high they hop. Each bead sweeps a circle as the coil
   * turns; this samples those circles, at the top and bottom of the bead.
   */
  outline(): Vec3[] {
    const points: Vec3[] = [];
    for (const { rest, size } of this.beads) {
      const radius = Math.hypot(rest.x, rest.z) + size / 2;
      const top = rest.y + size / 2 + HOP_HEIGHT + WAVE_HEIGHT;
      const bottom = rest.y - size / 2 - WAVE_HEIGHT;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        points.push(new Vec3(x, top, z), new Vec3(x, bottom, z));
      }
    }
    return points;
  }

  /** Color the beads from `inner` at the center to `outer` at the outer end. */
  setColors(inner: Color, outer: Color) {
    for (const bead of this.beads) {
      bead.material.diffuse.lerp(inner, outer, bead.t);
      bead.material.update();
    }
  }

  update(dt: number) {
    // Everything moves by `dt`, so pausing the app (timeScale = 0) freezes it.
    this.time += dt;
    this.sincePop = Math.min(this.sincePop + dt, POP_SECONDS);

    const spin = 1 + 5 * Math.exp(-3 * this.sincePop);
    this.angle = (this.angle + 360 * TURNS_PER_SECOND * spin * dt) % 360;
    // Negative turns clockwise, seen from above.
    this.entity.setLocalEulerAngles(0, -this.angle, 0);

    for (const bead of this.beads) {
      // A gentle wave that runs along the coil all the time.
      let lift = WAVE_HEIGHT * Math.sin(this.time * 2 - bead.t * 14);
      // After a press, each bead hops and bounces, starting at the center.
      const since = this.sincePop - bead.t * RIPPLE_SECONDS;
      if (since > 0) {
        lift += HOP_HEIGHT * Math.exp(-3.5 * since) * Math.abs(Math.sin(9 * since));
      }
      bead.entity.setLocalPosition(bead.rest.x, bead.rest.y + lift, bead.rest.z);
    }
  }
}

/**
 * Build the coil and add it to the scene. Beads are spaced a little more than
 * their own size apart along the curve, so the coil reads as one line.
 */
export function createCoil(app: AppBase): Coil {
  const root = new Entity('coil');
  root.addComponent('script');
  const coil = root.script!.create(Coil)!;

  const maxAngle = TURNS * Math.PI * 2;
  for (let angle = 0; angle <= maxAngle; ) {
    const t = angle / maxAngle;
    const radius = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t;
    const size = INNER_SIZE + (OUTER_SIZE - INNER_SIZE) * t;
    const rest = new Vec3(
      radius * Math.cos(angle),
      size / 2 + HEIGHT * (1 - t),
      radius * Math.sin(angle),
    );

    // Each bead has its own material, for the color gradient.
    const material = new StandardMaterial();
    material.useMetalness = true;
    material.metalness = 0;
    material.gloss = 0.8;

    const entity = new Entity('bead');
    entity.addComponent('render', { type: 'sphere', material });
    entity.setLocalScale(size, size, size);
    entity.setLocalPosition(rest);
    root.addChild(entity);
    coil.beads.push({ entity, material, t, rest, size });

    angle += (size * 1.15) / radius;
  }

  app.root.addChild(root);
  return coil;
}
