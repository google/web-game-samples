// The game: a spinning spiral, a counter and three buttons. Pressing the
// counter makes the spiral pop (a Tween), throw sparks (a ParticleEmitter)
// and play a note (audio.tone, generated, no sound file needed).

import {
  type Application,
  audio,
  event,
  ParticleEmitter,
  type Renderable,
  save,
  Sprite,
  Stage,
  Text,
  Tween,
  UIPanel,
  UITextButton,
} from "melonjs";
import type { Strings } from "./strings";
import {
  gameReady,
  requestInterstitialAd,
  requestRewardedAd,
  sdkVersion,
  sendScore,
} from "./youtube";

// the colours a rewarded ad unlocks, one at a time
const SPIRAL_COLORS = ["#ff6600", "#ffcc00", "#33ccff", "#ff3399", "#66dd44"];

const BACKGROUND = "#000000";
const BUTTON = "#2975d9";
const BUTTON_HOVER = "#6089bf";
const BUTTON_LABEL = "#000000";
const TEXT = "#ffffff";

// a burst of sparks from the middle of the spiral, in the spiral's colour
const SPARKS = {
  width: 16,
  height: 16,
  totalParticles: 40,
  angle: 0,
  angleVariation: Math.PI * 2,
  speed: 6,
  speedVariation: 3,
  minLife: 300,
  maxLife: 700,
  minEndScale: 0,
  maxEndScale: 0.2,
  textureSize: 8,
  blendMode: "additive",
};

// note frequencies, in Hz
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880;
const C6 = 1046.5;

// the notes Press! plays in turn: a pentatonic scale, so any run of presses
// sounds like a tune
const PRESS_NOTES = [C5, D5, E5, G5, A5];

// big enough to tap: YouTube recommends 48 x 48 with 8 between targets
const BUTTON_HEIGHT = 48;
const BUTTON_GAP = 8;
const MARGIN = 16;

/** What the screen is started with. */
export interface ScreenSetup {
  strings: Strings;
  language: string;
}

/** The spiral: half a turn a second, sized by the layout. */
class Spiral extends Sprite {
  /** its width on screen, in pixels */
  size = 1;
  /** what pop() animates: a scale and a spin speed, both 1 at rest */
  pulse = 1;
  spin = 1;
  private turn = 0;
  private pulseTween?: Tween;
  private spinTween?: Tween;

  constructor() {
    super(0, 0, { image: "spiral" });
  }

  /** A springy pop: bigger and faster for a moment, then back to normal. */
  pop() {
    this.pulseTween?.stop();
    this.spinTween?.stop();
    this.pulse = 1.25;
    this.spin = 5;
    this.pulseTween = new Tween(this)
      .to({ pulse: 1 }, { duration: 900, easing: Tween.Easing.Elastic.Out })
      .start();
    this.spinTween = new Tween(this)
      .to({ spin: 1 }, { duration: 1200, easing: Tween.Easing.Quadratic.Out })
      .start();
  }

  override update(dt: number) {
    this.turn = (this.turn + (Math.PI * this.spin * dt) / 1000) % (Math.PI * 2);
    // rebuilt each frame, as rotate() and scale() add to what is there
    this.currentTransform
      .identity()
      .rotate(this.turn)
      .scale((this.size * this.pulse) / this.width);
    super.update(dt);
    return true;
  }
}

export class PlayScreen extends Stage {
  private app!: Application;
  private spiral!: Spiral;
  private sparks!: ParticleEmitter;
  private counter!: Text;
  private info!: Text;
  private buttons!: UIPanel;
  private watchingAd = false;

  override onResetEvent(app: Application, setup: ScreenSetup) {
    this.app = app;
    const { strings, language } = setup;
    app.world.backgroundColor.parseCSS(BACKGROUND);

    // from the cloud save on YouTube, from localStorage elsewhere
    const progress = save.add({ counter: 0, color: 0 });

    const color = SPIRAL_COLORS[progress.color % SPIRAL_COLORS.length];
    this.spiral = new Spiral();
    this.spiral.setTint(color);
    app.world.addChild(this.spiral, 1);
    this.sparks = new ParticleEmitter(0, 0, { ...SPARKS, tint: color });
    app.world.addChild(this.sparks, 2);

    this.counter = this.addText(20, strings.counter(progress.counter));
    const version = sdkVersion();
    this.info = this.addText(
      14,
      version
        ? `${strings.language(language)} · SDK ${version}`
        : strings.language(language),
    );

    // the buttons, one under the other: a panel that only lays them out
    this.buttons = new UIPanel(0, 0, {
      width: 0,
      height: 0,
      layout: "column",
      gap: BUTTON_GAP,
      align: "center",
      autoSize: true,
      fillColor: null,
      borderColor: null,
      blocking: false,
    });
    app.world.addChild(this.buttons, 3);

    const pressButton = this.addButton(160, strings.press, () => {
      progress.counter += 1;
      this.counter.setText(strings.counter(progress.counter));
      this.spiral.pop();
      this.sparks.burstParticles();
      audio.tone({
        freq: PRESS_NOTES[progress.counter % PRESS_NOTES.length],
        duration: 0.2,
        wave: "triangle",
        gain: 0.2,
      });
      // the counter only goes up, so the score sent is always the saved best
      sendScore(progress.counter);
    });

    this.addButton(260, strings.interstitialAd, () => {
      void requestInterstitialAd();
    });

    this.addButton(260, strings.rewardedAd, () => {
      if (this.watchingAd) {
        return;
      }
      this.watchingAd = true;
      // the same id every time for this kind of reward, with no user data in it
      void requestRewardedAd("spiral-color").then((earned) => {
        this.watchingAd = false;
        if (earned) {
          progress.color = (progress.color + 1) % SPIRAL_COLORS.length;
          const next = SPIRAL_COLORS[progress.color];
          this.spiral.setTint(next);
          this.sparks.reset({ ...SPARKS, tint: next });
          // a little chime: two notes, then two together, timed with `delay`
          audio.tone({ freq: C5, duration: 0.12, gain: 0.2 });
          audio.tone({ freq: E5, duration: 0.12, gain: 0.2, delay: 0.1 });
          audio.tone({ freq: [G5, C6], duration: 0.5, gain: 0.2, delay: 0.2 });
        }
      });
    });

    // keyboard play: arrows move between the buttons, Enter or Space presses
    pressButton.focus();

    this.layout(app.viewport.width, app.viewport.height);
    event.on(event.VIEWPORT_ONRESIZE, this.layout, this);

    // starts with the player's first tap or key, which unlocks the audio
    audio.playTrack("moonlight", 0.6);

    gameReady();
  }

  override onDestroyEvent() {
    event.off(event.VIEWPORT_ONRESIZE, this.layout, this);
    audio.stopTrack();
  }

  private addText(size: number, text: string) {
    const label = new Text(0, 0, {
      font: "Georgia",
      size,
      fillStyle: TEXT,
      textAlign: "center",
      textBaseline: "middle",
      text,
    });
    this.app.world.addChild(label, 4);
    return label;
  }

  private addButton(width: number, label: string, onClick: () => void) {
    const button = new UITextButton(0, 0, {
      font: "Georgia",
      size: 20,
      text: label,
      labelFillStyle: BUTTON_LABEL,
      width,
      height: BUTTON_HEIGHT,
      hoverOffColor: BUTTON,
      hoverOnColor: BUTTON_HOVER,
      borderColor: BUTTON,
      onClick,
    });
    this.buttons.addChild(button);
    return button;
  }

  /** Lay the screen out for its current size: any shape YouTube gives it. */
  layout(width: number, height: number) {
    // set x and y only: pos.z is the depth each one was added at
    const place = (renderable: Renderable, x: number, y: number) => {
      renderable.pos.x = x;
      renderable.pos.y = y;
    };
    const centerX = width / 2;

    // the buttons at the bottom, the counter just above them
    place(
      this.buttons,
      centerX - this.buttons.width / 2,
      height - MARGIN - this.buttons.height,
    );
    const counterY = this.buttons.pos.y - 24;
    place(this.counter, centerX, counterY);
    place(this.info, centerX, 20);

    // the spiral fills what is left between the info line and the counter
    const top = 40;
    const room = counterY - 24 - top;
    const spiralY = top + room / 2;
    place(this.spiral, centerX, spiralY);
    this.spiral.size = Math.max(0, Math.min(width, room) * 0.9);
    this.sparks.centerOn(centerX, spiralY);

    this.app.repaint();
  }
}
