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
 * The top level namespace for the YouTube Playables SDK.
 */
declare namespace ytgame {
  /**
   * The types of errors that the YouTube Playables SDK throws. The list of
   * error types are as follows:
   */
  export const enum SdkErrorType {
    /**
     * The error is unknown.
     */
    UNKNOWN,
    /**
     * The API is temporarily unavailable. Ask players to retry at a later time
     * if they’re in a critical flow.
     */
    API_UNAVAILABLE,
    /**
     * The API is called with invalid parameters.
     */
    INVALID_PARAMS,
    /**
     * The API is called with parameters exceeding the size limit
     */
    SIZE_LIMIT_EXCEEDED,
  }

  /**
   * The error object that the YouTube Playables SDK throws. The SdkError object
   * is a child of Error and contains an additional field.
   */
  export class SdkError extends Error {
    /**
     * The type of the error.
     */
    errorType: SdkErrorType;
  }

  /**
   * The YouTube Playables SDK version.
   */
  export const SDK_VERSION: string;
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
     * The score value expressed as an integer.
     */
    value: number;
  }

  /**
   * Sends a score to YouTube. Scores may be shown in some YouTube UI in the
   * future such as a leaderboard.
   *
   * @return a Promise that completes when succeeded and rejects with a SdkError
   *     when failed.
   */
  export function sendScore(score: Score): Promise<void>;
}

/**
 * The functions and properties related to the generic game behaviors.
 */
declare namespace ytgame.game {
  /**
   * Notifies YouTube that the game’s first frame is ready to be
   * shown.
   *
   * Note: The game MUST call this API. Otherwise, the game isn’t shown on
   * YouTube.
   */
  export function firstFrameReady(): void;

  /**
   * Notifies YouTube that the game is ready for players to interact with.
   */
  export function gameReady(): void;

  /**
   * Saves game data to the YouTube cloud in the form of a serialized string.
   *
   * @return a Promise that completes when saving succeeded and rejects with an
   *     SdkError when failed.
   */
  export function saveData(data: string): Promise<void>;

  /**
   * Loads game data from the YouTube cloud in the form of a serialized string.
   *
   * @return a Promise that completes when loading succeeded and rejects with an
   *     SdkError when failed.
   */
  export function loadData(): Promise<string>;
}

/**
 * The functions and properties related to the game health.
 */
declare namespace ytgame.health {
  /**
   * Logs an error to YouTube. Aggregate information will be accessible on the
   * YouTube Playables health page.
   *
   * Note: This API is best-effort and rate-limited which can result in data
   * loss.
   */
  export function logError(): void;
  /**
   * Logs a warning to YouTube. Aggregate information will be accessible on the
   * YouTube Playables health webpage.
   *
   * Note: This API is best-effort and rate-limited which can result in data
   * loss.
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
   * Note: The game SHOULD use this API to initialize the game audio state.
   */
  export function isAudioEnabled(): boolean;

  /**
   * Sets a callback to be triggered when the audio settings change event is
   * fired from YouTube.
   *
   * Note: The game MUST use this API to update the game audio state.
   *
   * @param callback a callback function that runs when audio state is changed
   * and that accepts isAudioEnabled as a parameter.
   * @return function to unset the callback.
   *
   */
  export function onAudioEnabledChange(
    callback: (isAudioEnabled: boolean) => void,
  ): () => void;

  /**
   * Sets a callback to be triggered when a pause game event is fired from
   * YouTube.
   *
   * Note: You have a short window to save any state before your game gets
   * evicted.
   *
   * @return a function to unset the callback.
   */
  export function onPause(callback: () => void): () => void;

  /**
   * Sets a callback to be triggered when a resume game event is fired from
   * YouTube.
   *
   * @return a function to unset the callback.
   */
  export function onResume(callback: () => void): () => void;

  /**
   * Returns the language that is set in the user's YouTube settings in the
   * form of a BCP-47 language tag.
   */
  export function getLanguage(): Promise<string>;
}
