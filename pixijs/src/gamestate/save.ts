import { produce } from "immer";

// Sample game state shape.
type GameState = {
  objects: string[];
  currency: {
    coins: number;
  };
  score: number;
};

// Sample game state object.
let gameState: GameState = {
  objects: [],
  currency: {
    coins: 0,
  },
  score: 0,
};

/**
 * Modifies the game state synchronously using the provided callback argument.
 * @param callback The modification function for modifying the game state.
 *
 * Example:
 * modifyGameState((gameState) => {
 *   gameState.currency.coins += 10;
 * });
 */
export function modifyGameState(callback: (gameState: GameState) => void) {
  // Uses immer to make changes to the gamestate. Avoids updating when nothing has changed.
  const newState = produce(gameState, callback);
  if (newState !== gameState) {
    // Sends the high score to be displayed, if it is higher than the previous high score.
    if (gameState.score < newState.score) {
      ytgame.engagement.sendScore({ value: newState.score });
    }
    gameState = newState;
    ytgame.game.saveData(JSON.stringify(gameState));
  }
}

/**
 * Loads the game state from the cloud. Usually called as part of nitialization.
 * @returns a promise that represents the successful game load.
 */
export async function loadGameState() {
  return ytgame.game.loadData().then((gameState) => {
    // If game data exists.
    if (gameState) {
      gameState = JSON.parse(gameState);
    }
  });
}

let lastPause = Date.now();

// Keep track of the time of the last pause.
ytgame.system.onPause(() => {
  lastPause = Date.now();
});

ytgame.system.onResume(() => {
  const elapsedTime = Date.now() - lastPause;
  console.log(`Game was paused for ${elapsedTime}ms`);
});
