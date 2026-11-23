# Three.js Playable sample

This sample uses Three.js and Vite to demonstrate a lightweight 3D YouTube Playables integration. It keeps the visuals procedural so the bundle stays small: geometry, materials, particles, trails, and UI are generated in code without external art assets.

## Features

- Fullscreen WebGL scene with responsive camera sizing.
- Lightweight VFX using emissive materials, additive particles, and motion trails.
- Basic lane-switching runner interaction for mouse, touch, and keyboard.
- YouTube Playables lifecycle calls for `firstFrameReady`, `gameReady`, pause, resume, save data, score submission, and rewarded ads.

## Install

```shell
npm install
```

## Development

```shell
npm run start
```

## Build

```shell
npm run build
```

Built files are written to the `dist` directory.
