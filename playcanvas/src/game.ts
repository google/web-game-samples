// The game: a spinning spiral, a counter and three buttons.
//
// PlayCanvas draws the spiral. The counter and the buttons are plain HTML on
// top of the canvas, which gives touch, mouse, keyboard focus and screen
// readers for free.

import {
  type AppBase,
  BLEND_NORMAL,
  Color,
  Entity,
  PROJECTION_ORTHOGRAPHIC,
  StandardMaterial,
  type Texture,
} from 'playcanvas';
import { Spiral } from './spiral';
import type { Strings } from './strings';
import { reportError, requestInterstitialAd, requestRewardedAd, save, sendScore } from './youtube';

/** The colors a rewarded ad unlocks, one at a time. */
const SPIRAL_COLORS = ['#ff6600', '#ffd400', '#2ec4ff', '#ff4fa3', '#7ae04a'];

/** The same ID every time for this kind of reward, with no user data in it. */
const COLOR_REWARD_ID = 'spiral-color';

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
        progress.color = saved.color % SPIRAL_COLORS.length;
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
  spiralTexture: Texture;
}

export function createGame(app: AppBase, setup: GameSetup) {
  const { strings, language } = setup;
  const progress = parseProgress(setup.saveData);

  // --- The scene ---------------------------------------------------------

  // An orthographic camera where one world unit is one CSS pixel, so the
  // layout below can place the spiral using the HTML elements' positions.
  const camera = new Entity('camera');
  camera.addComponent('camera', {
    projection: PROJECTION_ORTHOGRAPHIC,
    clearColor: new Color(0, 0, 0),
    nearClip: 0.1,
    farClip: 10,
  });
  camera.setPosition(0, 0, 5);
  app.root.addChild(camera);

  // The texture is white, so the material's emissive color tints it.
  const material = new StandardMaterial();
  material.useLighting = false;
  material.useSkybox = false;
  material.diffuse = new Color(0, 0, 0);
  material.emissiveMap = setup.spiralTexture;
  material.opacityMap = setup.spiralTexture;
  material.opacityMapChannel = 'a';
  material.blendType = BLEND_NORMAL;
  material.depthWrite = false;

  const setColor = (index: number) => {
    material.emissive = new Color().fromString(SPIRAL_COLORS[index]);
    material.update();
  };
  setColor(progress.color);

  // The spiral's root spins and scales; its child turns the plane primitive,
  // which lies flat on XZ, to face the camera.
  const spiral = new Entity('spiral');
  const plane = new Entity('plane');
  plane.addComponent('render', { type: 'plane', material });
  plane.setLocalEulerAngles(90, 0, 0);
  spiral.addChild(plane);
  spiral.addComponent('script');
  const spin = spiral.script!.create(Spiral)!;
  app.root.addChild(spiral);

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
    spin.pop();
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
      progress.color = (progress.color + 1) % SPIRAL_COLORS.length;
      setColor(progress.color);
      spin.pop();
      save(JSON.stringify(progress));
    }
  });

  // Keyboard play: the arrow keys move between the buttons, and Enter or
  // Space presses the focused one, as for any HTML button.
  const buttons = [pressButton, interstitialButton, rewardedButton];
  controls.addEventListener('keydown', (event) => {
    const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[event.key];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (step !== undefined && index !== -1) {
      event.preventDefault();
      buttons[(index + step + buttons.length) % buttons.length].focus();
    }
  });

  // --- Layout ------------------------------------------------------------

  // Fit the spiral between the language line and the controls, for any
  // shape of screen YouTube gives the game.
  const layout = () => {
    const width = Math.max(1, app.graphicsDevice.canvas.clientWidth);
    const height = Math.max(1, app.graphicsDevice.canvas.clientHeight);
    camera.camera!.orthoHeight = height / 2;

    const top = languageLabel.getBoundingClientRect().bottom + 8;
    const bottom = controls.getBoundingClientRect().top - 8;
    const room = Math.max(0, bottom - top);
    spin.size = Math.min(width, room) * 0.9;
    spiral.setLocalPosition(0, height / 2 - (top + bottom) / 2, 0);
  };

  hud.hidden = false;
  layout();
  window.addEventListener('resize', layout);
  pressButton.focus({ preventScroll: true });
}
