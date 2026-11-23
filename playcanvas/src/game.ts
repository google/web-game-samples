// The game: a coil of beads, a counter and three buttons.
//
// PlayCanvas draws the 3D scene. The counter and the buttons are plain HTML on
// top of the canvas, which gives touch, mouse, keyboard focus and screen
// readers for free.

import {
  type AppBase,
  Color,
  Entity,
  FOG_LINEAR,
  math,
  SHADOW_PCF5_32F,
  StandardMaterial,
  TONEMAP_NEUTRAL,
} from 'playcanvas';
import { createCoil } from './coil';
import type { Strings } from './strings';
import { reportError, requestInterstitialAd, requestRewardedAd, save, sendScore } from './youtube';

/** The color schemes a rewarded ad unlocks, one at a time: [center, outer end]. */
const PALETTES = [
  ['#ffd23f', '#ff6600'],
  ['#8ff3ff', '#1e6bff'],
  ['#ffb3e6', '#d1006f'],
  ['#d4ff7a', '#13a85a'],
  ['#e4c8ff', '#7a3cff'],
].map(([inner, outer]) => [new Color().fromString(inner), new Color().fromString(outer)]);

/** The same ID every time for this kind of reward, with no user data in it. */
const COLOR_REWARD_ID = 'spiral-color';

/** The background, which the floor fades into in the distance. */
const BACKGROUND = new Color().fromString('#0b0d12');

/** How far the camera looks down, in degrees. */
const CAMERA_PITCH = 35;

/** What the player keeps between sessions. */
interface Progress {
  counter: number;
  color: number;
}

/**
 * Read a save from any version of the game. Anything missing or invalid falls
 * back to a new player's value, so an old or damaged save never stops the game.
 */
function parseProgress(data: string): Progress {
  const progress: Progress = { counter: 0, color: 0 };
  if (data) {
    try {
      const saved = JSON.parse(data);
      if (Number.isInteger(saved?.counter) && saved.counter >= 0) {
        progress.counter = saved.counter;
      }
      if (Number.isInteger(saved?.color) && saved.color >= 0) {
        progress.color = saved.color % PALETTES.length;
      }
    } catch (error) {
      // Start fresh, and let YouTube know.
      reportError(error);
    }
  }
  return progress;
}

export interface GameSetup {
  saveData: string;
  strings: Strings;
  language: string;
}

export function createGame(app: AppBase, setup: GameSetup) {
  const { strings, language } = setup;
  const progress = parseProgress(setup.saveData);

  // --- The scene ---------------------------------------------------------

  // A cool, dim fill, so the sides facing away from the light aren't black.
  app.scene.ambientLight = new Color(0.16, 0.18, 0.24);
  // The floor fades into the background in the distance.
  app.scene.fog.type = FOG_LINEAR;
  app.scene.fog.color = BACKGROUND;

  const camera = new Entity('camera');
  camera.addComponent('camera', {
    clearColor: BACKGROUND,
    toneMapping: TONEMAP_NEUTRAL,
    nearClip: 0.5,
    farClip: 500,
  });
  camera.setEulerAngles(-CAMERA_PITCH, 0, 0);
  app.root.addChild(camera);

  // One warm key light, high and to the side, with soft shadows.
  const light = new Entity('light');
  light.addComponent('light', {
    type: 'directional',
    color: new Color(1, 0.94, 0.85),
    intensity: 1.4,
    castShadows: true,
    shadowType: SHADOW_PCF5_32F,
    // Lighter than full strength, so the shadows read as soft rather than black.
    shadowIntensity: 0.7,
    shadowResolution: 2048,
    shadowBias: 0.2,
    normalOffsetBias: 0.05,
  });
  light.setEulerAngles(50, 35, 0);
  app.root.addChild(light);

  // A floor for the coil to stand on and cast its shadow onto.
  const floorMaterial = new StandardMaterial();
  floorMaterial.diffuse = new Color().fromString('#454c5c');
  floorMaterial.useMetalness = true;
  floorMaterial.metalness = 0;
  floorMaterial.gloss = 0.3;
  floorMaterial.update();
  const floor = new Entity('floor');
  floor.addComponent('render', { type: 'plane', material: floorMaterial, castShadows: false });
  floor.setLocalScale(400, 1, 400);
  app.root.addChild(floor);

  const coil = createCoil(app);
  const setPalette = (index: number) => coil.setColors(PALETTES[index][0], PALETTES[index][1]);
  setPalette(progress.color);

  // --- The interface -----------------------------------------------------

  const hud = document.getElementById('hud')!;
  const languageLabel = document.getElementById('language')!;
  const counterLabel = document.getElementById('counter')!;
  const controls = document.getElementById('controls')!;
  const pressButton = document.getElementById('press') as HTMLButtonElement;
  const interstitialButton = document.getElementById('interstitial') as HTMLButtonElement;
  const rewardedButton = document.getElementById('rewarded') as HTMLButtonElement;

  document.documentElement.lang = language;
  languageLabel.textContent = strings.language(language);
  counterLabel.textContent = strings.counter(progress.counter);
  pressButton.textContent = strings.press;
  interstitialButton.textContent = strings.interstitialAd;
  rewardedButton.textContent = strings.rewardedAd;

  pressButton.addEventListener('click', () => {
    progress.counter += 1;
    counterLabel.textContent = strings.counter(progress.counter);
    coil.pop();
    save(JSON.stringify(progress));
    // The counter only goes up, so the best score sent always matches the save.
    sendScore(progress.counter);
  });

  interstitialButton.addEventListener('click', () => {
    void requestInterstitialAd();
  });

  rewardedButton.addEventListener('click', async () => {
    rewardedButton.disabled = true;
    const earned = await requestRewardedAd(COLOR_REWARD_ID);
    rewardedButton.disabled = false;
    if (earned) {
      progress.color = (progress.color + 1) % PALETTES.length;
      setPalette(progress.color);
      coil.pop();
      save(JSON.stringify(progress));
    }
  });

  // Keyboard play: the arrow keys move between the buttons, and Enter or
  // Space presses the focused one, as for any HTML button.
  const buttons = [pressButton, interstitialButton, rewardedButton];
  const steps: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
  controls.addEventListener('keydown', (event) => {
    const step = steps[event.key];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (step !== undefined && index !== -1) {
      event.preventDefault();
      buttons[(index + step + buttons.length) % buttons.length].focus();
    }
  });

  // --- Layout ------------------------------------------------------------

  // Frame the coil in the space between the language line and the controls,
  // for any shape of screen YouTube gives the game. The camera only moves,
  // never turns, so its axes are fixed.
  const right = camera.right.clone();
  const up = camera.up.clone();
  const forward = camera.forward.clone();
  const outline = coil.outline();
  const reach = Math.max(...outline.map((point) => Math.hypot(point.x, point.z)));

  const layout = () => {
    const width = Math.max(1, app.graphicsDevice.canvas.clientWidth);
    const height = Math.max(1, app.graphicsDevice.canvas.clientHeight);
    const top = languageLabel.getBoundingClientRect().bottom + 8;
    const bottom = controls.getBoundingClientRect().top - 8;

    // The space's top and bottom on screen, from -1 (bottom) to 1 (top).
    const high = 1 - (2 * top) / height;
    const low = 1 - (2 * Math.max(bottom, top + 1)) / height;
    const tan = Math.tan((camera.camera!.fov * math.DEG_TO_RAD) / 2);
    const aspect = width / height;

    // The camera sits `distance` back from the coil's center and `shift` down
    // along its own up axis. A point at (x, y, z) in the camera's axes then
    // lands on screen at x / (tan * aspect * (z + distance)) across and
    // (y + shift) / (tan * (z + distance)) up. Keeping every point of the
    // outline inside the space gives the smallest distance that works, and
    // the range of shifts that work at that distance:
    //   low * tan * distance + bottomSlack <= shift <= high * tan * distance + topSlack
    let fitWidth = 0;
    let topSlack = Infinity;
    let bottomSlack = -Infinity;
    for (const point of outline) {
      const x = Math.abs(point.dot(right));
      const y = point.dot(up);
      const z = point.dot(forward);
      fitWidth = Math.max(fitWidth, x / (tan * aspect) - z);
      topSlack = Math.min(topSlack, high * tan * z - y);
      bottomSlack = Math.max(bottomSlack, low * tan * z - y);
    }
    const fitHeight = (bottomSlack - topSlack) / ((high - low) * tan);
    const distance = 1.05 * Math.max(fitWidth, fitHeight);
    // The middle of that range centers the coil in the space.
    const shift = (tan * distance * (high + low) + topSlack + bottomSlack) / 2;

    camera.setPosition(
      forward.x * -distance + up.x * -shift,
      forward.y * -distance + up.y * -shift,
      forward.z * -distance + up.z * -shift,
    );

    // Shadows only need to reach just past the coil.
    light.light!.shadowDistance = distance + reach * 2;
    // The floor behind the coil fades out, toward the top of the screen.
    app.scene.fog.start = distance;
    app.scene.fog.end = distance * 2.5;
  };

  hud.hidden = false;
  layout();
  window.addEventListener('resize', layout);
  pressButton.focus({ preventScroll: true });
}
