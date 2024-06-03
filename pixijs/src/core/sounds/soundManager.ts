import { sound } from "@pixi/sound";

class SoundManager {
  constructor() {
    this.audioEnabled = ytgame.system.isAudioEnabled();

    ytgame.system.onAudioEnabledChange((enabled) => {
      this.updateSoundState(enabled);
    });
  }

  private audioEnabled = false;

  updateSoundState(newEnablementState: boolean) {
    if (this.audioEnabled === newEnablementState) return;
    this.audioEnabled = newEnablementState;

    if (this.audioEnabled) {
      sound.unmuteAll();
    } else {
      sound.muteAll();
    }
  }
}

// Export a singleton for use in the application.
// Automatically pauses sounds when focus is lost,
// and mutes and unmutes based on SDK callbacks.
export const soundManager = new SoundManager();
