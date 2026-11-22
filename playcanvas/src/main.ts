// Start-up: create the PlayCanvas app, show the loading screen, load the save
// and the assets, then start the game.

import './style.css';
import {
  AppBase,
  AppOptions,
  Asset,
  AssetListLoader,
  AudioHandler,
  CameraComponentSystem,
  Entity,
  FILLMODE_FILL_WINDOW,
  RenderComponentSystem,
  RESOLUTION_AUTO,
  ScriptComponentSystem,
  SoundComponentSystem,
  SoundManager,
  type Texture,
  TextureHandler,
  WebglGraphicsDevice,
} from 'playcanvas';
import { createGame } from './game';
import { stringsFor } from './strings';
import {
  followYouTubeAudio,
  followYouTubePause,
  gameReady,
  getLanguage,
  loadSave,
  reportError,
  sendFirstFrameReady,
} from './youtube';

/** Load assets into the app's registry. */
function loadAssets(app: AppBase, assets: Asset[]) {
  return new Promise<void>((resolve, reject) => {
    new AssetListLoader(assets, app.assets).load((error: string | null) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  const canvas = document.getElementById('application') as HTMLCanvasElement;
  const loadingBar = document.getElementById('loading-bar')!;
  const loading = document.getElementById('loading')!;
  const hud = document.getElementById('hud')!;

  // WebGL 2 runs everywhere YouTube does. createGraphicsDevice() can pick
  // WebGPU instead, but bundles both back ends (about 100 kB more).
  const device = new WebglGraphicsDevice(canvas);
  device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

  // AppBase with only the parts this game uses keeps the bundle small; use
  // `Application` instead to get every component system and resource handler.
  const options = new AppOptions();
  options.graphicsDevice = device;
  options.soundManager = new SoundManager();
  options.componentSystems = [
    CameraComponentSystem,
    RenderComponentSystem,
    ScriptComponentSystem,
    SoundComponentSystem,
  ];
  options.resourceHandlers = [TextureHandler, AudioHandler];

  const app = new AppBase(canvas);
  app.init(options);
  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  window.addEventListener('resize', () => app.resizeCanvas());

  // Hand pausing and sound to YouTube before anything starts.
  followYouTubePause(app, hud);
  followYouTubeAudio(app);

  // The loading screen is showing: start the app, and tell YouTube once its
  // first frame is drawn.
  app.start();
  sendFirstFrameReady(app);

  // Load the save, the language and the spiral together, filling the bar as
  // each one finishes.
  const steps = 3;
  let done = 0;
  const track = <T>(task: Promise<T>) =>
    task.then((result) => {
      done += 1;
      const percent = Math.round((done / steps) * 100);
      loadingBar.style.width = `${percent}%`;
      loading.setAttribute('aria-valuenow', String(percent));
      return result;
    });
  const spiralTexture = new Asset('spiral', 'texture', { url: 'spiral.png' }, { srgb: true });
  const [saveData, language] = await Promise.all([
    track(loadSave()),
    track(getLanguage()),
    track(loadAssets(app, [spiralTexture])),
  ]);

  createGame(app, {
    saveData,
    strings: stringsFor(language),
    language,
    spiralTexture: spiralTexture.resource as Texture,
  });
  loading.remove();
  gameReady();

  // The music isn't needed to play, so it loads after gameReady(): a smaller
  // initial download, and a faster start. Browsers keep audio locked until the
  // player's first tap or key press; PlayCanvas starts it then.
  const music = new Asset('music', 'audio', { url: 'moonlight.mp3' });
  await loadAssets(app, [music]);
  const player = new Entity('music');
  player.addComponent('sound', { positional: false });
  player.sound!.addSlot('music', { asset: music.id, loop: true, volume: 0.6 });
  app.root.addChild(player);
  player.sound!.play('music');
}

main().catch(reportError);
