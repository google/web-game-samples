// Everything that talks to the YouTube Playables SDK lives in this file.
// Outside YouTube (a plain browser tab, `npm run dev`) each of these does
// nothing, and the game behaves like any other melonJS game.

import { type Application, audio, device, event, save, state } from "melonjs";

/** True when the game runs as a YouTube Playable. */
export const inPlayables =
  typeof ytgame !== "undefined" && ytgame.IN_PLAYABLES_ENV;

function reportError(error: unknown) {
  console.error(error);
  if (inPlayables) {
    ytgame.health.logError();
  }
}

/**
 * Point melonJS's `save` at YouTube's cloud save.
 *
 * YouTube wants the data loaded before anything is saved, so call this once,
 * before the game starts. After that the game just uses `save`.
 */
export async function useCloudSave() {
  let data = "";
  try {
    data = await ytgame.game.loadData();
  } catch (error) {
    // start from scratch rather than not start at all
    reportError(error);
  }
  // held in memory, saved back to YouTube one save at a time
  const cloud = save.createCloudStorage({
    data,
    write: (items) =>
      ytgame.game.saveData(JSON.stringify(items)).catch((error: unknown) => {
        reportError(error);
        // passed on, so melonJS keeps the data and saves it again later
        throw error;
      }),
  });
  save.setStorage(cloud);
  // YouTube may close the game after pausing it: save straight away
  ytgame.system.onPause(() => {
    void cloud.flush();
  });
}

/**
 * Pause and resume when YouTube says so, and only then.
 *
 * `device.setFocusEvents(false)` stops the browser window from reporting
 * focus changes; YouTube's callbacks report them instead. The application's
 * flags still decide what a pause does: `stopOnBlur` stops the loop and the
 * rendering, pauses the music, mutes the sound effects and releases held
 * keys, and the resume undoes it.
 */
export function followYouTubePause(app: Application) {
  app.stopOnBlur = true;
  app.pauseOnBlur = false;
  if (inPlayables) {
    device.setFocusEvents(false);
    ytgame.system.onPause(() => event.emit(event.BLUR));
    ytgame.system.onResume(() => event.emit(event.FOCUS));
  }
}

/** Mute the game whenever YouTube's own sound setting is off. */
export function followYouTubeAudio() {
  if (!inPlayables) {
    return;
  }
  const setSound = (enabled: boolean) => {
    if (enabled) {
      audio.unmuteAll();
    } else {
      audio.muteAll();
    }
  };
  setSound(ytgame.system.isAudioEnabled());
  ytgame.system.onAudioEnabledChange(setSound);
}

// YouTube shows a spinner until `firstFrameReady()`, which must come while a
// loading screen is on screen, then waits for `gameReady()`.
let firstFrameSent = false;

function onLoadingFrame() {
  if (state.isCurrent(state.LOADING)) {
    firstFrameReady();
  }
}

function firstFrameReady() {
  if (firstFrameSent) {
    return;
  }
  firstFrameSent = true;
  event.off(event.GAME_AFTER_DRAW, onLoadingFrame);
  if (inPlayables) {
    ytgame.game.firstFrameReady();
  }
}

/** Send `firstFrameReady()` on the first frame of melonJS's loading screen. */
export function watchLoadingScreen() {
  event.on(event.GAME_AFTER_DRAW, onLoadingFrame);
}

/** Tell YouTube the game can be played. Call it once the game is interactive. */
export function gameReady() {
  // in case loading finished before the loading screen drew a frame
  firstFrameReady();
  if (inPlayables) {
    ytgame.game.gameReady();
  }
}

export async function requestInterstitialAd() {
  if (!inPlayables) {
    return;
  }
  try {
    await ytgame.ads.requestInterstitialAd();
  } catch (error) {
    // no ad this time: carry on
    console.warn(error);
  }
}

/** Resolves to `true` only when the player earned the reward. */
export async function requestRewardedAd(rewardId: string): Promise<boolean> {
  if (!inPlayables) {
    return false;
  }
  try {
    return await ytgame.ads.requestRewardedAd(rewardId);
  } catch (error) {
    console.warn(error);
    return false;
  }
}

/** Send the player's score, a whole number. */
export function sendScore(value: number) {
  if (inPlayables) {
    ytgame.engagement.sendScore({ value }).catch(reportError);
  }
}

/** The player's YouTube language, e.g. "en-US"; the browser's outside YouTube. */
export async function getLanguage(): Promise<string> {
  if (inPlayables) {
    try {
      return await ytgame.system.getLanguage();
    } catch (error) {
      reportError(error);
    }
  }
  return device.language;
}

/** The SDK version, in development builds only. */
export function sdkVersion(): string | undefined {
  return import.meta.env.DEV && inPlayables ? ytgame.SDK_VERSION : undefined;
}
