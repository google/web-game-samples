import { Assets } from "pixi.js";

class AssetManager {
  assetPaths: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assets: Record<string, any> = {};
  constructor() {
    this.assetPaths = import.meta.publicFiles;
  }

  finished = false;

  // Imports all files inside /public folder.
  // Intentionally does not bundle any files into the JS bundle.
  async importAssetFiles() {
    const url = window.location.href.endsWith("/")
      ? window.location.href.slice(0, -1)
      : window.location.href;

    for (const asset of this.assetPaths) {
      Assets.add(asset, url + asset);
      this.assets[asset] = await Assets.load(asset);
    }
    this.finished = true;
  }

  // Loads a single previously imported asset by filepath.
  // Note that the filepath should be rooted in /public, and should not
  // contain the /public prefix.
  // Example: /public/assets/sprites/demo.png -> load("/assets/sprites/demo.png")
  load(path: string) {
    if (!this.finished) {
      throw new Error("Requested " + path + " before assets were loaded");
    }
    if (!this.assets[path]) {
      throw new Error("Asset at " + path + " does not exist!");
    }
    return this.assets[path];
  }
}

// Export a singleton for use in the application.
export const assetManager = new AssetManager();
