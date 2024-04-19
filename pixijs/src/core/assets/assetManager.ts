import { Assets } from "pixi.js";
import "@pixi/sound";

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
    const basePath = window.location.href
      .replace("/index.html", "/")
      .split(/[?#]/)[0];
    const url = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    const allImportPromises = [] as Promise<void>[];

    for (const asset of this.assetPaths) {
      Assets.add({ alias: asset, src: url + asset });
      allImportPromises.push(
        Assets.load(asset).then((val: unknown) => {
          this.assets[asset] = val;
        })
      );
    }
    await Promise.all(allImportPromises);
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
