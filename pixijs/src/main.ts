import { Application, Sprite } from "pixi.js";

import FontFaceObserver from "fontfaceobserver";
import { assetManager } from "./core/assets/assetManager";
import { Sound } from "@pixi/sound";
import { loadGameState } from "./gamestate/save";

async function main() {
  const app = new Application({
    view: document.querySelector("#app") as HTMLCanvasElement,
    autoDensity: true,
    resizeTo: window,
    powerPreference: "high-performance",
    backgroundColor: 0x23272a,
  });

  // Example of loading an imported asset.
  const cube = new Sprite(assetManager.load("/assets/sprites/cube.png"));
  app.stage.addChild(cube);

  // Do other setup work here, if needed. Then,
  // tell the SDK that the game is ready to be played.
  ytgame.game.gameReady();

  // Play music, for fun.
  const backgroundSound = Sound.from("/assets/sounds/moonlight.mp3");
  backgroundSound.play();
}

async function bootstrap() {
  // Wait for the the page itself to load
  await Promise.all([
    // Example font loading
    new FontFaceObserver("Pixelify Sans").load(),
    // Wait for the page itself to load.
    new Promise((resolve) => {
      window.addEventListener("DOMContentLoaded", resolve);
    }),
    loadGameState(),
  ]);
  // Tell the SDK that we can render something. Useful if you want to show a loading bar.
  ytgame.game.firstFrameReady();

  // Loads all asset files. You may choose to implement a loading bar
  await assetManager.importAssetFiles();

  main();
}

bootstrap();
