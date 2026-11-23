import { Application, audio, loader, state, video } from "melonjs";
import { PlayScreen, type ScreenSetup } from "./play-screen";
import { stringsFor } from "./strings";
import {
  followYouTubeAudio,
  followYouTubePause,
  getLanguage,
  inPlayables,
  useCloudSave,
  watchLoadingScreen,
} from "./youtube";

async function main() {
  // YouTube can load the game in a frame with no height yet, so start from a
  // fixed size; "flex" then fills the frame once it has its real size
  const app = new Application(360, 640, {
    parent: "screen",
    scaleMethod: "flex",
    renderer: video.AUTO,
  });
  followYouTubePause(app);
  await app.init();

  audio.init("mp3");
  followYouTubeAudio();

  // the save has to be loaded before the game reads it
  if (inPlayables) {
    await useCloudSave();
  }
  const language = await getLanguage();

  watchLoadingScreen();
  await loader.preload([
    { name: "spiral", type: "image", src: "spiral.svg" },
    // for audio, `src` is the folder: melonJS adds the name and the format
    // given to audio.init(), so this loads "./moonlight.mp3"
    { name: "moonlight", type: "audio", src: "./" },
  ]);

  // `true` switches to the game screen now, rather than on the next frame
  const setup: ScreenSetup = { strings: stringsFor(language), language };
  state.set(state.PLAY, new PlayScreen());
  state.change(state.PLAY, true, setup);
}

void main();
