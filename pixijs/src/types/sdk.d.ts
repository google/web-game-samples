/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The top-level namespace for the YouTube Playables SDK.
 *
 * This is a globally scoped variable in the current window. You **MUST NOT**
 * override this variable.
 *
 * @see https://developers.google.com/youtube/gaming/playables
 */
declare namespace ytgame {
  /**
   * The types of errors that the YouTube Playables SDK throws.
   */
  export const enum SdkErrorType {
    /**
     * The error type is unknown.
     */
    UNKNOWN,
    /**
     * The API was temporarily unavailable.
     *
     * Ask players to retry at a later time if they are in a critical flow.
     */
    API_UNAVAILABLE,
    /**
     * The API was called with invalid parameters.
     */
    INVALID_PARAMS,
    /**
     * The API was called with parameters exceeding the size limit.
     */
    SIZE_LIMIT_EXCEEDED,
  }

  /**
   * The error object that the YouTube Playables SDK throws.
   *
   * The `SdkError` object is a child of
   * [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error)
   * and contains an additional field.
   */
  export class SdkError extends Error {
    /**
     * The type of the error.
     */
    errorType: SdkErrorType;
  }

  /**
   * The YouTube Playables SDK version.
   *
   * @example
   * ```ts
   * // Prints the SDK version to console. Do not do this in production.
   * console.log(ytgame.SDK_VERSION);
   * ```
   */
  export const SDK_VERSION: string;

  /**
   * Whether or not the game is running within the Playables environment.
   * You can use this to determine whether to enable or disable features that
   * are only available inside of Playables. Combine this check with checking
   * for `ytgame` to ensure that the SDK is actually loaded.
   *
   * @example
   * ```ts
   * const inPlayablesEnv = (typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV);
   * ```
   *
   * @example
   * ```ts
   * // An example of where you may want to fork behavior for saving data.
   * if (ytgame?.IN_PLAYABLES_ENV) {
   *   ytgame.game.saveData(dataStr);
   * } else {
   *   window.localStorage.setItem('SAVE_DATA', dataStr);
   * }
   * ```
   */
  export const IN_PLAYABLES_ENV: boolean;
}

/**
 * 🧪 PUBLIC PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
 * @experimental
 *
 * The functions and properties related to ads.
 */
declare namespace ytgame.ads {
  /**
   * Requests an interstitial ad to be shown.
   * @experimental
   *
   * 🧪 PUBLIC PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
   *
   * Makes no guarantees about whether the ad was shown.
   *
   * @example
   * ```ts
   * try {
   *   await ytgame.ads.requestInterstitialAd();
   *   // Ad request successful, do something else.
   * } catch (error) {
   *   // Handle errors, retry logic, etc.
   *   // Note that error may be undefined.
   * }
   * ```
   *
   * @returns a promise that resolves on a successful request or
   * rejects/throws on an unsuccessful request.
   * @throws `ytgame.SdkError`
   */
  export function requestInterstitialAd(): Promise<void>;

  /**
   * The possible outcomes of a successful ad break.
   * @hidden
   */
  export const enum AdResult {
    UNKNOWN,
    SHOWED,
    DISMISSED,
    REJECTED,
  }

  /**
   * Use requestInterstitialAd instead.
   * @hidden
   *
   * @throws {ytgame.SdkError} Will throw an error if the ad fails to load.
   */
  export function requestAd(): Promise<AdResult>;
}

/**
 * The functions and properties related to player engagement.
 */
declare namespace ytgame.engagement {
  /**
   * The score object the game sends to YouTube.
   */
  export interface Score {
    /**
     * The score value expressed as an integer. The score must be less
     * than or equal to the
     * [maximum safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).
     * Otherwise, the score will be rejected.
     */
    value: number;
  }

  /**
   * Sends a score to YouTube.
   *
   * The score should represent one dimension of progress within the game.
   * If there are multiple dimensions, the developer must choose one dimension
   * to be consistent. Scores will be sorted and the highest score will be
   * displayed in YouTube UI so any in-game high score UI should align with
   * what is being sent through this API.
   *
   * @example
   * ```ts
   * async function onScoreAwarded(score: number) {
   *   try {
   *     await ytgame.engagement.sendScore({value: score});
   *     // Score sent successfully, do something else.
   *   } catch (error) {
   *     // Handle errors, retry logic, etc.
   *     // Note that error may be undefined.
   *   }
   * }
   * ```
   *
   * @param score - the score to send to YouTube.
   * @returns a Promise that resolves when succeeded and rejects/throws with an
   * `ytgame.SdkError` when failed.
   * @throws `ytgame.SdkError`
   */
  export function sendScore(score: Score): Promise<void>;

  /**
   * The content object the game sends to YouTube.
   */
  export interface Content {
    /**
     * The ID of the video we want to open.
     */
    id: string;
  }

  /**
   * Requests YouTube to open content corresponding to the provided video ID.
   *
   * Generally, this will open the video in a new tab on web and in the
   * miniplayer on mobile.
   *
   * @example
   * ```ts
   * async function showVideo(videoID: string) {
   *   try {
   *     await ytgame.engagement.openYTContent({id: videoID});
   *     // Request successful, do something else.
   *   } catch (error) {
   *     // Handle errors, retry logic, etc.
   *     // Note that error may be undefined.
   *   }
   * }
   * ```
   *
   * @param content - the content to open on YouTube.
   * @returns a Promise that resolves when succeeded and rejects/throws with an
   * `ytgame.SdkError` when failed.
   * @throws `ytgame.SdkError`
   * Throws `INVALID_PARAMS` if the video ID is invalid.
   */
  export function openYTContent(content: Content): Promise<void>;
}

/**
 * The functions and properties related to generic game behaviors.
 */
declare namespace ytgame.game {
  /**
   * Notifies YouTube that the game has begun showing frames.
   *
   * The game **MUST** call this API. Otherwise, the game is not shown to
   * users. `firstFrameReady()` **MUST** be called before `gameReady()`.
   *
   * @example
   * ```ts
   * function onGameInitialized() {
   *   ytgame.game.firstFrameReady();
   * }
   * ```
   */
  export function firstFrameReady(): void;

  /**
   * Notifies YouTube that the game is ready for players to interact with.
   *
   * The game **MUST** call this API when it is interactable.
   * The game **MUST NOT** call this API when a loading screen is still shown.
   * Otherwise, the game fails the YouTube certification process.
   *
   * @example
   * ```ts
   * function onGameInteractable() {
   *   ytgame.game.gameReady();
   * }
   * ```
   */
  export function gameReady(): void;

  /**
   * Loads game data from YouTube in the form of a serialized string.
   *
   * The game **must** handle any parsing between the string and an
   * internal format.
   *
   * @example
   * ```ts
   * async function gameSetup() {
   *   try {
   *     const data = await ytgame.game.loadData();
   *     // Load succeeded, do something with data.
   *   } catch (error) {
   *     // Handle errors, retry logic, etc.
   *     // Note that error may be undefined.
   *   }
   * }
   * ```
   *
   * @returns a Promise that completes when loading succeeded and rejects with an
   * `ytgame.SdkError` when failed.
   */
  export function loadData(): Promise<string>;

  /**
   * Saves game data to the YouTube in the form of a serialized string.
   *
   * The string **must** be a valid, well-formed UTF-16 string and a maximum of
   * 3 MiB. The game **must** handle any parsing between the string and an
   * internal format. If necessary, use `String.isWellFormed()` to check if the
   * string is well-formed.
   *
   * @example
   * ```ts
   * async function saveGame() {
   *   try {
   *     ytgame.game.saveData(JSON.stringify(gameSave));
   *     // Save succeeded.
   *   } catch (error) {
   *     // Handle errors, retry logic, etc.
   *     // Note that error may be undefined.
   *   }
   * }
   * ```
   *
   * @returns a Promise that resolves when saving succeeded and rejects with an
   * `ytgame.SdkError` when failed.
   */
  export function saveData(data: string): Promise<void>;

  /**
   * @hidden
   * Triggers YouTube to prompt the user to share an invite code. If the user
   * chooses to share, the invite code will be included in the shared URL.
   *
   * 🧪 PRIVATE PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
   *
   * Invite codes must be valid UTF-8 and must be a maximum of 8 bytes.
   *
   * See https://developer.mozilla.org/en-US/docs/Glossary/UTF-8 for
   * details on number of bytes for UTF-8 characters.
   *
   * @returns a Promise that resolves when succeeded and rejects/throws with an
   * `ytgame.SdkError` when failed.
   * @throws `ytgame.SdkError`
   */
  export function shareInviteCode(inviteCode: string): Promise<void>;

  /**
   * @hidden
   * An object used to pass game-related data from YouTube to the game.
   *
   * 🧪 PRIVATE PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
   */
  export interface GameData {
    /**
     * @hidden
     * Get the invite code that was shared with the user.
     *
     * 🧪 PRIVATE PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
     *
     * @returns the invite code that was shared with the user.
     */
    getInviteCode: () => string;
    /**
     * @hidden
     * Check if an invite code was shared with the user.
     *
     * 🧪 PRIVATE PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
     *
     * @returns true if the invite code was shared with the user.
     */
    hasInviteCode: () => boolean;
  }

  /**
   * @hidden
   * Sets a callback to be triggered when game data becomes available from
   * YouTube. This callback can be triggered at any time.
   *
   * 🧪 PRIVATE PREVIEW API: SUBJECT TO CHANGE WITHOUT NOTICE.
   *
   * @param callback - the callback function to be triggered.
   * @returns a function to unset the callback that is usually unused.
   */
  export function onGameDataAvailable(
    callback: (gameData: GameData) => void,
  ): VoidFunction;
}

/**
 * The functions and properties related to the game health.
 */
declare namespace ytgame.health {
  /**
   * Logs an error to YouTube.
   *
   * **Note:** This API is best-effort and rate-limited which can result in data
   * loss.
   *
   * @example
   * ```ts
   * function onError() {
   *   ytgame.health.logError();
   * }
   * ```
   */
  export function logError(): void;
  /**
   * Logs a warning to YouTube.
   *
   * **Note:** This API is best-effort and rate-limited which can result in data
   * loss.
   *
   * @example
   * ```ts
   * function onWarning() {
   *   ytgame.health.logWarning();
   * }
   * ```
   */
  export function logWarning(): void;
}

/**
 * The functions and properties related to the YouTube system.
 */
declare namespace ytgame.system {
  /**
   * Returns whether the game audio is enabled in the YouTube settings.
   *
   * The game **SHOULD** use this to initialize the game audio state.
   *
   * @example
   * ```ts
   * function initGameSound() {
   *   if (ytgame.system.isAudioEnabled()) {
   *     // Enable game audio.
   *   } else {
   *     // Disable game audio.
   *   }
   * }
   * ```
   *
   * @returns a boolean indicating whether the audio is enabled.
   */
  export function isAudioEnabled(): boolean;

  /**
   * Sets a callback to be triggered when the audio settings change event is
   * fired from YouTube.
   *
   * The game **MUST** use this API to update the game audio state.
   *
   * @example
   * ```ts
   * ytgame.system.onAudioEnabledChange((isAudioEnabled) => {
   *   if (isAudioEnabled) {
   *     // Enable game audio.
   *   } else {
   *     // Disable game audio.
   *   }
   * });
   * ```
   *
   * @param callback - the callback function to be triggered.
   * @returns a function to unset the callback that is usually unused.
   *
   */
  export function onAudioEnabledChange(
    callback: (isAudioEnabled: boolean) => void,
  ): () => void;

  /**
   * Sets a callback to be triggered when a pause game event is fired from
   * YouTube. The game has a short window to save any state before it is
   * evicted.
   *
   * onPause is called for all types of pauses, including when the user exits
   * the game. There is no guarantee that the game will resume.
   *
   * @example
   * ```ts
   * ytgame.system.onPause(() => {
   *   pauseGame();
   * });
   *
   * function pauseGame() {
   *   // Logic to pause game state.
   * }
   * ```
   *
   * @param callback - the callback function to be triggered.
   * @returns a function to unset the callback that is usually unused.
   */
  export function onPause(callback: () => void): () => void;

  /**
   * Sets a callback to be triggered when a resume game event is fired from
   * YouTube.
   *
   * After being paused, the game is not guaranteed to resume.
   *
   * @example
   * ```ts
   * ytgame.system.onResume(() => {
   *   resumeGame();
   * });
   *
   * function resumeGame() {
   *   // Logic to resume game state.
   * }
   * ```
   *
   * @param callback - the callback function to be triggered.
   * @returns a function to unset the callback that is usually unused.
   */
  export function onResume(callback: () => void): () => void;

  /**
   * Returns the language that is set in the user's YouTube settings in the
   * form of a
   * [BCP-47 language tag](https://www.rfc-editor.org/info/bcp47).
   *
   * @example
   * ```ts
   * const localeTag = await ytgame.system.getLanguage();
   * // `localeTag` is now set to something like "en-US" or "es-419".
   * ```
   *
   * @returns a Promise that completes when getting the language succeeded and
   * rejects with an `ytgame.SdkError` when failed.
   * @throws `ytgame.SdkError`
   */
  export function getLanguage(): Promise<string>;
}
