import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Clock,
  DirectionalLight,
  FogExp2,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  AdditiveBlending,
} from "three";

type PlayablesSdk = {
  IN_PLAYABLES_ENV?: boolean;
  game?: {
    firstFrameReady?: () => void;
    gameReady?: () => void;
    loadData?: () => Promise<string>;
    saveData?: (data: string) => Promise<void>;
  };
  system?: {
    onPause?: (callback: () => void) => void;
    onResume?: (callback: () => void) => void;
  };
  engagement?: {
    sendScore?: (score: { value: number }) => void;
  };
  ads?: {
    requestRewardedAd?: (rewardId: string) => Promise<boolean>;
  };
};

declare global {
  interface Window {
    ytgame?: PlayablesSdk;
  }
}

const lanes = [-2.2, 0, 2.2];
const rewardId = "neon-orbit-shield";
const clock = new Clock();
const scoreElement = document.querySelector<HTMLSpanElement>("#score");
const shieldElement = document.querySelector<HTMLSpanElement>("#shield");
const rewardButton = document.querySelector<HTMLButtonElement>("#reward");
const sdk = window.ytgame;
const inPlayablesEnv = Boolean(sdk?.IN_PLAYABLES_ENV);

let score = 0;
let shield = 0;
let targetLane = 1;
let isRunning = true;
let spawnTimer = 0;
let hasSentFirstFrame = false;
let hasSentGameReady = false;

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
document.body.prepend(renderer.domElement);

const scene = new Scene();
scene.fog = new FogExp2(0x050915, 0.028);

const camera = new PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 4.6, 9.5);
camera.lookAt(0, 0.4, -8);

const ambient = new AmbientLight(0x9fc8ff, 0.45);
scene.add(ambient);

const keyLight = new DirectionalLight(0x8be9ff, 2.1);
keyLight.position.set(3, 6, 4);
scene.add(keyLight);

const rimLight = new PointLight(0xff4fd8, 3, 22);
rimLight.position.set(-4, 2, 2);
scene.add(rimLight);

const cyanMaterial = new MeshStandardMaterial({
  color: 0x58f4ff,
  emissive: 0x1ac8ff,
  emissiveIntensity: 1.15,
  metalness: 0.35,
  roughness: 0.24,
});

const magentaMaterial = new MeshStandardMaterial({
  color: 0xff4fd8,
  emissive: 0x961bff,
  emissiveIntensity: 0.9,
  metalness: 0.25,
  roughness: 0.3,
});

const obstacleMaterial = new MeshStandardMaterial({
  color: 0x151924,
  emissive: 0xff355d,
  emissiveIntensity: 0.55,
  metalness: 0.15,
  roughness: 0.42,
});

const player = new Group();
const core = new Mesh(new IcosahedronGeometry(0.45, 2), cyanMaterial);
const halo = new Mesh(
  new TorusGeometry(0.72, 0.028, 12, 72),
  new MeshBasicMaterial({
    color: 0x72ffca,
    transparent: true,
    opacity: 0.72,
    blending: AdditiveBlending,
  })
);
halo.rotation.x = Math.PI / 2;
player.add(core, halo);
player.position.set(lanes[targetLane], 0.55, 3.1);
scene.add(player);

const railMaterial = new MeshBasicMaterial({
  color: 0x1aa9ff,
  transparent: true,
  opacity: 0.36,
  blending: AdditiveBlending,
});

lanes.forEach((lane) => {
  const rail = new Mesh(new BoxGeometry(0.045, 0.045, 62), railMaterial);
  rail.position.set(lane, -0.05, -20);
  scene.add(rail);
});

const tunnel = new Group();
const ringMaterial = new MeshBasicMaterial({
  color: 0x2ad7ff,
  transparent: true,
  opacity: 0.16,
  blending: AdditiveBlending,
});
for (let i = 0; i < 18; i += 1) {
  const ring = new Mesh(new TorusGeometry(4.1, 0.018, 8, 96), ringMaterial);
  ring.position.z = -i * 3.4;
  ring.rotation.x = Math.PI / 2;
  tunnel.add(ring);
}
scene.add(tunnel);

const particleCount = 220;
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i += 1) {
  particlePositions[i * 3] = MathUtils.randFloatSpread(9);
  particlePositions[i * 3 + 1] = MathUtils.randFloat(0.2, 5.8);
  particlePositions[i * 3 + 2] = MathUtils.randFloat(-58, 8);
}
const particleGeometry = new BufferGeometry();
particleGeometry.setAttribute("position", new BufferAttribute(particlePositions, 3));
const particles = new Points(
  particleGeometry,
  new PointsMaterial({
    color: 0xa7f8ff,
    size: 0.04,
    transparent: true,
    opacity: 0.62,
    blending: AdditiveBlending,
    depthWrite: false,
  })
);
scene.add(particles);

type Pickup = {
  mesh: Mesh;
  lane: number;
  kind: "energy" | "block";
  speed: number;
};

const pickups: Pickup[] = [];
const trailMeshes: Mesh[] = [];

function updateHud() {
  if (scoreElement) {
    scoreElement.textContent = String(score);
  }
  if (shieldElement) {
    shieldElement.textContent = String(shield);
  }
}

async function loadState() {
  if (!inPlayablesEnv || !sdk?.game?.loadData) {
    return;
  }

  try {
    const data = await sdk.game.loadData();
    if (!data) {
      return;
    }
    const parsed = JSON.parse(data) as { bestScore?: number };
    score = Math.max(score, parsed.bestScore ?? 0);
  } catch (error) {
    console.warn("Failed to load saved data:", error);
  }
}

function saveState() {
  if (!inPlayablesEnv || !sdk?.game?.saveData) {
    return;
  }

  sdk.game.saveData(JSON.stringify({ bestScore: score })).catch((error) => {
    console.warn("Failed to save data:", error);
  });
}

function submitScore() {
  if (inPlayablesEnv) {
    sdk?.engagement?.sendScore?.({ value: score });
  }
}

function moveLane(direction: number) {
  targetLane = MathUtils.clamp(targetLane + direction, 0, lanes.length - 1);
}

function spawnPickup() {
  const lane = Math.floor(Math.random() * lanes.length);
  const kind = Math.random() > 0.34 ? "energy" : "block";
  const mesh =
    kind === "energy"
      ? new Mesh(new TorusGeometry(0.38, 0.08, 12, 36), magentaMaterial)
      : new Mesh(new BoxGeometry(0.82, 0.82, 0.82), obstacleMaterial);

  mesh.position.set(lanes[lane], 0.58, -36);
  mesh.rotation.set(Math.random(), Math.random(), Math.random());
  scene.add(mesh);
  pickups.push({ mesh, lane, kind, speed: kind === "energy" ? 13.5 : 11.8 });
}

function burstAt(position: Vector3, color: number) {
  for (let i = 0; i < 9; i += 1) {
    const trail = new Mesh(
      new SphereGeometry(0.06 + Math.random() * 0.05, 8, 8),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: AdditiveBlending,
      })
    );
    trail.position.copy(position);
    trail.userData.velocity = new Vector3(
      MathUtils.randFloatSpread(2.2),
      MathUtils.randFloat(0.2, 1.4),
      MathUtils.randFloat(-1.4, 1.2)
    );
    trailMeshes.push(trail);
    scene.add(trail);
  }
}

function handleCollision(pickup: Pickup) {
  if (pickup.kind === "energy") {
    score += 10;
    burstAt(pickup.mesh.position, 0x72ffca);
    saveState();
    submitScore();
  } else if (shield > 0) {
    shield -= 1;
    burstAt(pickup.mesh.position, 0x48d2ff);
  } else {
    score = Math.max(0, score - 25);
    burstAt(pickup.mesh.position, 0xff426d);
    saveState();
    submitScore();
  }
  updateHud();
}

function updatePickups(delta: number) {
  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnPickup();
    spawnTimer = MathUtils.randFloat(0.42, 0.78);
  }

  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i];
    pickup.mesh.position.z += pickup.speed * delta;
    pickup.mesh.rotation.x += delta * 2.2;
    pickup.mesh.rotation.y += delta * 2.8;

    if (
      pickup.lane === targetLane &&
      Math.abs(pickup.mesh.position.z - player.position.z) < 0.72
    ) {
      handleCollision(pickup);
      scene.remove(pickup.mesh);
      pickup.mesh.geometry.dispose();
      pickups.splice(i, 1);
    } else if (pickup.mesh.position.z > 8) {
      scene.remove(pickup.mesh);
      pickup.mesh.geometry.dispose();
      pickups.splice(i, 1);
    }
  }
}

function updateVfx(delta: number, elapsed: number) {
  tunnel.children.forEach((ring, index) => {
    ring.position.z += delta * 8;
    ring.rotation.z += delta * (0.08 + index * 0.004);
    if (ring.position.z > 6) {
      ring.position.z -= 61.2;
    }
  });

  const positions = particleGeometry.attributes.position as BufferAttribute;
  for (let i = 0; i < particleCount; i += 1) {
    const z = positions.getZ(i) + delta * 13.5;
    positions.setZ(i, z > 8 ? -58 : z);
  }
  positions.needsUpdate = true;

  halo.rotation.z -= delta * 2.6;
  halo.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.04);
  core.rotation.x += delta * 1.7;
  core.rotation.y += delta * 2.1;
  rimLight.intensity = 2.7 + Math.sin(elapsed * 3) * 0.6;

  for (let i = trailMeshes.length - 1; i >= 0; i -= 1) {
    const trail = trailMeshes[i];
    trail.position.addScaledVector(trail.userData.velocity as Vector3, delta);
    trail.scale.multiplyScalar(0.94);
    const material = trail.material as MeshBasicMaterial;
    material.opacity *= 0.92;
    if (material.opacity < 0.05) {
      scene.remove(trail);
      trail.geometry.dispose();
      material.dispose();
      trailMeshes.splice(i, 1);
    }
  }
}

function render() {
  requestAnimationFrame(render);

  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;
  if (!isRunning) {
    renderer.render(scene, camera);
    return;
  }

  player.position.x = MathUtils.damp(player.position.x, lanes[targetLane], 12, delta);
  player.position.y = 0.55 + Math.sin(elapsed * 5.2) * 0.06;

  updatePickups(delta);
  updateVfx(delta, elapsed);
  renderer.render(scene, camera);

  if (!hasSentFirstFrame) {
    sdk?.game?.firstFrameReady?.();
    hasSentFirstFrame = true;
  }
  if (!hasSentGameReady) {
    sdk?.game?.gameReady?.();
    hasSentGameReady = true;
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointer(event: PointerEvent) {
  moveLane(event.clientX < window.innerWidth / 2 ? -1 : 1);
}

function onKey(event: KeyboardEvent) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    moveLane(-1);
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    moveLane(1);
  }
}

async function requestRewardedBoost() {
  if (!rewardButton) {
    return;
  }

  rewardButton.disabled = true;
  try {
    const earned = inPlayablesEnv
      ? await sdk?.ads?.requestRewardedAd?.(rewardId)
      : true;
    if (earned) {
      shield = Math.min(shield + 1, 3);
      burstAt(player.position, 0x48d2ff);
      updateHud();
    }
  } catch (error) {
    console.warn("Failed to request rewarded boost:", error);
  } finally {
    rewardButton.disabled = false;
  }
}

async function bootstrap() {
  await loadState();
  updateHud();

  sdk?.system?.onPause?.(() => {
    isRunning = false;
  });
  sdk?.system?.onResume?.(() => {
    clock.getDelta();
    isRunning = true;
  });

  window.addEventListener("resize", onResize);
  window.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  rewardButton?.addEventListener("click", requestRewardedBoost);
  render();
}

bootstrap();
