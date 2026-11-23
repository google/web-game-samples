// Every call to the YouTube Playables SDK is in this file.
//
// Outside YouTube (a normal browser tab, `npm run dev`) the SDK does nothing,
// so each function checks `inPlayables` first and falls back to plain browser
// behavior. The game itself never touches `ytgame`.

import type { AppBase } from 'playcanvas';

/** True when the game runs as a YouTube Playable. */
export const inPlayables = typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV;

/** Where the save goes outside YouTube, so it can be tested in a normal tab. */
const LOCAL_SAVE_KEY = 'playcanvas-playable-save';

/** Log an error, and report it to YouTube. */
export function reportError(error: unknown) {
  console.error(error);
  if (inPlayables) {
    ytgame.health.logError();
  }
}

// ---------------------------------------------------------------------------
// Loading: firstFrameReady() and gameReady()
// ---------------------------------------------------------------------------

let firstFrameSent = false;

function firstFrameReady() {
  if (!firstFrameSent) {
    firstFrameSent = true;
    if (inPlayables) {
      ytgame.game.firstFrameReady();
    }
  }
}

/**
 * Call `firstFrameReady()` once the app has drawn its first frame, while the
 * loading screen is showing. YouTube shows its own spinner until then.
 */
export function sendFirstFrameReady(app: AppBase) {
  app.once('frameend', firstFrameReady);
}

/** Tell YouTube the game can be played. Call it once, when it is interactive. */
export function gameReady() {
  // In case loading finished before the first frame was drawn.
  firstFrameReady();
  if (inPlayables) {
    ytgame.game.gameReady();
  }
}

// ---------------------------------------------------------------------------
// Pause and resume
// ---------------------------------------------------------------------------

let paused = false;

/**
 * Pause the whole game when YouTube says so, and resume only when it says so.
 *
 * - `timeScale = 0` stops everything that moves: scripts get a delta of 0.
 * - `autoRender = false` stops drawing.
 * - `soundManager.suspend()` stops the audio.
 * - `inert` stops the buttons taking input.
 */
export function followYouTubePause(app: AppBase, hud: HTMLElement) {
  if (!inPlayables) {
    return;
  }

  // The engine suspends its audio when the page is hidden and resumes it when
  // the page is shown again. A Playable must only follow onPause and onResume,
  // so on YouTube the app counts as hidden exactly while YouTube has paused it.
  app.isHidden = () => paused;

  let focused: HTMLElement | null = null;

  ytgame.system.onPause(() => {
    paused = true;
    app.timeScale = 0;
    app.autoRender = false;
    app.soundManager.suspend();
    focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hud.inert = true;
    // YouTube may close the game after pausing it: save anything left unsaved.
    void writeSave();
  });

  ytgame.system.onResume(() => {
    paused = false;
    app.timeScale = 1;
    app.autoRender = true;
    app.soundManager.resume();
    hud.inert = false;
    focused?.focus({ preventScroll: true });
  });
}

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

/** Mute the game whenever YouTube's own sound setting is off. */
export function followYouTubeAudio(app: AppBase) {
  if (!inPlayables) {
    return;
  }
  const setAudioEnabled = (enabled: boolean) => {
    app.soundManager.volume = enabled ? 1 : 0;
  };
  setAudioEnabled(ytgame.system.isAudioEnabled());
  ytgame.system.onAudioEnabledChange(setAudioEnabled);
}

// ---------------------------------------------------------------------------
// Cloud save
// ---------------------------------------------------------------------------

let loaded = false;
/** The newest data the game asked to save. */
let latest: string | null = null;
/** The newest data known to be saved. */
let saved: string | null = null;
let writing = false;

/**
 * Load the save: a string, empty for a new player. YouTube rejects any save
 * made before this has finished, so call it before the game starts.
 */
export async function loadSave(): Promise<string> {
  let data = '';
  try {
    data = inPlayables ? await ytgame.game.loadData() : localStorage.getItem(LOCAL_SAVE_KEY) ?? '';
  } catch (error) {
    // Start from scratch rather than not start at all.
    reportError(error);
  }
  loaded = true;
  saved = data;
  return data;
}

/**
 * Save the game's progress. Saves go out one at a time; while one is in
 * flight, only the newest data waits to follow it.
 */
export function save(data: string) {
  if (!loaded) {
    console.warn('save() called before loadSave() finished: ignored');
    return;
  }
  latest = data;
  void writeSave();
}

async function writeSave() {
  if (writing) {
    return;
  }
  writing = true;
  while (latest !== null && latest !== saved) {
    const data = latest;
    try {
      if (inPlayables) {
        await ytgame.game.saveData(data);
      } else {
        localStorage.setItem(LOCAL_SAVE_KEY, data);
      }
      saved = data;
    } catch (error) {
      // Kept as unsaved: the next save, or the next pause, tries again.
      reportError(error);
      break;
    }
  }
  writing = false;
}

// ---------------------------------------------------------------------------
// Score, language and ads
// ---------------------------------------------------------------------------

/** Send the player's score, a whole number. */
export function sendScore(value: number) {
  if (inPlayables) {
    ytgame.engagement.sendScore({ value }).catch(reportError);
  }
}

/** The player's YouTube language, such as "en-US"; the browser's outside YouTube. */
export async function getLanguage(): Promise<string> {
  if (inPlayables) {
    try {
      return await ytgame.system.getLanguage();
    } catch (error) {
      reportError(error);
    }
  }
  return navigator.language;
}

/** Ask YouTube for an interstitial ad. Never fails: the game carries on either way. */
export async function requestInterstitialAd() {
  if (!inPlayables) {
    console.info('Ads only show on YouTube.');
    return;
  }
  try {
    await ytgame.ads.requestInterstitialAd();
  } catch (error) {
    console.warn(error);
  }
}

/**
 * Ask YouTube for a rewarded ad. Resolves to `true` only when the player has
 * earned the reward. `rewardId` names the kind of reward and must not contain
 * any user data.
 */
export async function requestRewardedAd(rewardId: string): Promise<boolean> {
  if (!inPlayables) {
    console.info('Ads only show on YouTube.');
    return false;
  }
  try {
    return await ytgame.ads.requestRewardedAd(rewardId);
  } catch (error) {
    console.warn(error);
    return false;
  }
}
