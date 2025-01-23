# PixiJS Playables Starter Template

This sample uses Vite + TypeScript + PixiJS to create a demo PixiJS powered Playable.

## Utilities Provided

### Asset Manager

The [asset manager](src/core/assets/assetManager.ts) automatically loads all
assets inside the /public folder for use in the PixiJS application.

A singleton `assetManager` is provided to load assets at runtime:

```typescript
// Loads /public/assets/sounds/demo.png
assetManager.load("assets/sounds/demo.png");
```

Note that each asset is of type [Assets](https://pixijs.com/7.x/guides/components/assets),
and does not contain the "/public" path prefix.

### Font Loader

If you would like to ensure that all fonts load before displaying or
rendering the PixiJS application, it is highly recommended to use the
included FontFaceObserver to wait for the font to be loaded.

Simply added the font link to the [index.html](index.html):

```html
<link
  href="https://fonts.googleapis.com/css2?family=Pixelify+Sans&display=swap"
  rel="stylesheet"
/>
```

Then, inside [main.ts](main.ts) wait for FontFaceObserver's .load() to complete
before utilizing the font.

### Sound Manager

The [sound manager](src/core/sounds/soundManager.ts) handles sound muting/unmuting
from the SDK, as well as pausing/resuming audio on app backgrounding/foregrounding.

A singleton `soundManager` is provided but usually does not
need to be used by anything other than the `main.ts` file.

### Game State/Save Management

A sample save implementation is provided inside [save.ts](src/gamestate/save.ts).
It uses Immer to surgically modify state and avoid unnecessary updates.

Inside [main.ts](src/main.ts), if a previous save exists, it is loaded via the
Playables SDK and overwrites any initial game state.

Additionally, any time the game state is modified, the save is uploaded to the
cloud via the Playables SDK.

Since JavaScript execution is suspended when the app is backgrounded,
it may be desirable to detect this and handle the elapsed time (i.e.,
providing rewards based on time passed).

There are onPause and onResume hooks inside [save.ts](src/gamestate/save.ts)
provided for convenience in case the game state should be
modified in response to a pause in game execution.

### Playables Lifecycle Management

`firstFrameReady` and `gameReady` are called inside `main.ts`. `onPause` and
`onResume` can be found inside [save.ts](src/gamestate/save.ts). More information can be found on the [developer website](https://developers.google.com/youtube/gaming/playables/).

## Install

```shell
npm install
```

## Development

To run, use the "start" script.

```shell
npm run start
```

## Building a production bundle

Building a production bundle can be done using the "build" script. Built assets will appear in a "dist" folder at the root of the project.

```shell
npm run build
```

## Assets

The demo block asset was created in MS Paint. The music is public domain via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27,_op._27_no._2_-_i._adagio_sostenuto.ogg).
