/**
 * Copyright 2023 Google LLC
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

// ==================================================
// Begin YouTube Playables integration section
// ==================================================

/**
 * Check if the game is in an <iframe>.
 * @returns {boolean} True if running in an <iframe>.
 */
function checkIsFramed() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Check if the game is running as a Playable.
 * @returns {boolean} True if in an <iframe> with YouTube Playables SDK loaded.
 */
function checkIfPlayable() {
  const isFramed = checkIsFramed();

  // Check if the YouTube Playables SDK is loaded.
  const isPlayablesSDKLoaded = typeof ytgame !== 'undefined';

  // Framed + SDK = running as a YouTube Playable.
  return isFramed && isPlayablesSDKLoaded;
}
/**
 * If the game is running as a YouTube Playable.
 * @type {boolean}
 */
const isPlayable = checkIfPlayable();

/**
 * Holds the save data.
 * @type {Object}
 */
let playableSave;

/**
 * Holds the current counter.
 * 
 * @type {number}
 */
let counter = -1;

function onPause() {
  stopAnimation();
}

function onResume() {
  startAnimation();
}

/**
 * Initialize the parts of the game relevant to YouTube Playables.
 * 
 * Separating this functionality enables testing both as a plain web game and
 * as a YouTube Playable.
 */
async function initAsPlayable() {
  // Hold the YouTube Playable pause/resume callbacks.
  let unsetOnPause;
  let unsetOnResume;

  unsetOnPause = ytgame.system.onPause(() => {
    onPause();
  });

  unsetOnResume = ytgame.system.onResume(() => {
    onResume();
  });

  // Generally, it is best to wait for this data to avoid race conditions or
  // the need to merge with conflicting data.
  const data = await ytgame.game.loadData();

  if (data && data !== '') {
    // Process data to resume game state.
    try {
      playableSave = JSON.parse(data);
      console.debug('Loaded Playable save:');
      console.debug(playableSave);
      counter = playableSave.counter;
    } catch (e) {
      // On error, the game starts from scratch.
      playableSave = {};
      counter = 0;
      // This isn't ideal, so log an error.
      console.error(e);
      // Send an error to YouTube when this happens.
      ytgame.health.logError();
    }
  } else {
    playableSave = {};
    counter = 0;
  }

  // Handle the audio changing state from YouTube.
  ytgame.system.onAudioEnabledChange((isAudioEnabled) => {
    console.debug(`onAudioEnabledChange() - isAudioEnabled: [${isAudioEnabled}]`);
    if (isAudioEnabled) {
      // Allow audio.
      audioEnabled = true;
      startAudio();
    } else if (!isAudioEnabled) {
      // Disable audio.
      stopAudio();
      audioEnabled = false;
    }
  });
}

/**
 * Save the current user data to YouTube.
 */
function saveData() {
  if (isPlayable) {
    ytgame.game.saveData(JSON.stringify(playableSave)).then(() => {
      // Handle data save success.
    }, (e) => {
      // Handle data save failure.
      console.error(e);
      // Send an error to YouTube when this happens.
      ytgame.health.logError();
    });
  }
}

/**
 * Handle a new score.
 * 
 * This could display it, but in this case, it is just sent to YouTube.
 * @param {number} newScore 
 */
function sendScore(newScore) {
  if (isPlayable) {
    ytgame.engagement.sendScore({ value: newScore });
  }
}

// ==================================================
// End YouTube Playables integration section
// ==================================================

// ==================================================
// Begin audio section
// ==================================================

let audioSource;
let audioCtx;
/**
 * Whether audio is currently allowed to play.
 * 
 * @type {boolean}
 */
let audioEnabled = true;
/**
 * Whether audio is currently playing.
 * 
 * @type {boolean}
 */
let audioPlaying = false;

async function initAudio() {
  // Don't initialize more than once.
  if (audioSource) {
    return;
  }

  audioCtx = new AudioContext();
  audioSource = audioCtx.createBufferSource();
  const audioBuffer = await fetch('moonlight.mp3')
    .then(res => res.arrayBuffer())
    .then(ArrayBuffer => audioCtx.decodeAudioData(ArrayBuffer));

  audioSource.buffer = audioBuffer;
  audioSource.connect(audioCtx.destination);
  audioSource.loop = true;
  audioSource.start();

  // Media requires user interaction to start, but YouTube Playables may be
  // given focus automatically. The game has to handle that case.
  if (audioCtx.state !== 'suspended') {
    if (audioEnabled) {
      // Audio is enabled, so we let it continue playing.
      audioPlaying = true;
    } else {
      // Audio is not enabled, so we suspend it.
      audioCtx.suspend();
      audioPlaying = false;
    }
  }
}

/**
 * Start audio playback if it is set up, allowed, and not already playing.
 */
function startAudio() {
  // The game has to check several conditions before starting audio.
  console.debug('startAudio()');
  if (audioCtx && audioEnabled && !audioPlaying) {
    console.debug('Resuming audio...');
    audioCtx.resume()
    audioPlaying = true;
  }
}

/**
 * Stop audio playback if it is set up and not already stopped.
 */
function stopAudio() {
  console.debug('stopAudio()');
  if (audioCtx && audioPlaying) {
    console.debug('Suspending audio...');
    audioCtx.suspend();
    audioPlaying = false;
  }
}

// ==================================================
// End audio section
// ==================================================

// ==================================================
// Begin animation section
// ==================================================


const spiral = new Image();
spiral.src = 'spiral.svg';

/**
 * Holds the requestAnimationFrame return value.
 * 
 * @type {number}
 */
let rafID = 0;

/**
 * If animation is stopped.
 * 
 * @type {boolean}
 */
let stopped = true;
const radiansPerTurn = Math.PI / 60;
let currentTurn = 0;
/**
 * Holds a reference to the <canvas>.
 */
let can;

/**
 * Holds a reference to the CanvasRenderingContext2D.
 */
let ctx;

function firstStartAnimation() {
  if (isPlayable) {
    // Send first frame ready now that we've started to draw.
    ytgame.game.firstFrameReady();

    // Send game ready since there isn't any other processing.
    ytgame.game.gameReady();
  }

  startAnimation();

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

function startAnimation() {
  if (stopped) {
    stopped = false;
    rafID = window.requestAnimationFrame(runAnimation);
    console.debug(`Starting animation: ${rafID}`);
  }
}

function stopAnimation() {
  if (!stopped) {
    // rafID must be the most recent rAF call.
    cancelAnimationFrame(rafID);
    console.debug(`Stopping animation: ${rafID}`);
    stopped = true;
    rafID = 0;
  }
}

function runAnimation() {
  if (stopped) {
    // Don't continue to run if we are stopped.
    return;
  }

  // Size the canvas to the page. This also clears the canvas.
  // Games may want to listen for a window resize instead to avoid
  // clearing the canvas every loop.
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  // Set a background color.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, can.width, can.height);
  // Save the un-rotated canvas state.
  ctx.save();
  // Move context to center.
  ctx.translate(can.width / 2, can.height / 2);
  // Rotate context.
  currentTurn += radiansPerTurn;
  if (currentTurn >= (2 * Math.PI)) {
    currentTurn = 0;
  }
  ctx.rotate(currentTurn);

  const drawSize = Math.min(can.width / 2, can.height / 2);
  // Draw upper left of image half the width and height back.
  ctx.drawImage(spiral, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  // Restore un-rotated context.
  ctx.restore();

  drawButtons();
  drawCounter();

  // Animate and callback.
  rafID = window.requestAnimationFrame(runAnimation);
}

/**
 * Holds references to buttons being used.
 * 
 * @type {Object}
 */
const buttons = {};

/**
 * Create any buttons.
 * 
 * The game only has one button, yet it is a useful abstraction.
 */
function createButtons() {
  buttons.primaryButton = { isPressed: false, shape: null, text: 'Loading...' };
}

/**
 * Draw any buttons.
 * 
 * The game only has one button, yet it is a useful abstraction.
 */
function drawButtons() {
  if (buttons.primaryButton.isPressed) {
    ctx.fillStyle = '#6089bf';
  } else {
    ctx.fillStyle = '#2975d9';
  }
  buttons.primaryButton.shape = new Path2D();
  buttons.primaryButton.shape.rect(can.width / 2 - 50, can.height - 100, 100, 40);
  ctx.fill(buttons.primaryButton.shape);

  ctx.font = '20px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(buttons.primaryButton.text, can.width / 2, can.height - 80);
}

/**
 * Draw the counter.
 * 
 * Similar to a high score. Only draws if the counter has been loaded.
 */
function drawCounter() {
  if (counter !== -1) {
    ctx.font = '20px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Counter: ${counter}`, can.width / 2, can.height - 120);
  }
}

// ==================================================
// End animation section
// ==================================================

// ==================================================
// Begin interaction handling section
// ==================================================

/**
 * Handles the first click/tap event on the canvas.
 * 
 * Media (audio, video) will not autoplay, so listening for first click.
 * This handler removes itself after it is called.
 */
function firstClickHandler() {
  can.removeEventListener('click', firstClickHandler, false);
  if (audioCtx.state === 'suspended') {
    startAudio();
  }
}

/**
 * Add interaction handling to interactive elements.
 * 
 * The game only has one button, yet it is a useful abstraction.
 */
function addInteractionHandling() {
  can.addEventListener('pointerdown', () => {
    buttons.primaryButton.wasPressed = buttons.primaryButton.isPressed = ctx.isPointInPath(buttons.primaryButton.shape, event.offsetX, event.offsetY);
  }, false);

  can.addEventListener('pointermove', () => {
    if (buttons.primaryButton.wasPressed) {
      buttons.primaryButton.isPressed = ctx.isPointInPath(buttons.primaryButton.shape, event.offsetX, event.offsetY);
    }
  }, false);

  can.addEventListener('pointerup', () => {
    buttons.primaryButton.isPressed = ctx.isPointInPath(buttons.primaryButton.shape, event.offsetX, event.offsetY);
    if (buttons.primaryButton.wasPressed && buttons.primaryButton.isPressed) {
      counter++;
      playableSave.counter = counter;
      saveData();
      sendScore(counter);
    }

    buttons.primaryButton.wasPressed = buttons.primaryButton.isPressed = false;

  }, false);
}

// ==================================================
// End interaction handling section
// ==================================================

// ==================================================
// Begin initialization section
// ==================================================

/**
 * Initialize the game.
 * 
 * Sets up animation, interaction, audio, and Playable integrations.
 * Must be run after the DOM is loaded.
 */
async function init() {
  console.debug(`init()`);

  can = document.getElementById('canvas');
  ctx = can.getContext('2d');

  createButtons();
  firstStartAnimation();

  if (isPlayable) {
    await initAsPlayable();
  } else {
    playableSave = {};
    counter = 0;
  }
  await initAudio();
  
  // This call will only have an effect if audio is enabled.
  can.addEventListener('click', firstClickHandler, false);
  buttons.primaryButton.text = 'Press!';
  addInteractionHandling();
}

// Wait until the DOM is loaded to begin running.
addEventListener('DOMContentLoaded', (event) => {
  init();
});