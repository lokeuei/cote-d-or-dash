import * as THREE from "three";

const canvas = document.querySelector("#gameCanvas");
const scoreEl = document.querySelector("#score");
const distanceEl = document.querySelector("#distance");
const coinsEl = document.querySelector("#coins");
const startPanel = document.querySelector("#startPanel");
const gameOverPanel = document.querySelector("#gameOverPanel");
const finalScoreEl = document.querySelector("#finalScore");
const runSummaryEl = document.querySelector("#runSummary");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.debug.checkShaderErrors = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf1bd74, 20, 105);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 160);
camera.position.set(0, 6.1, 10.2);
camera.rotation.x = THREE.MathUtils.degToRad(-18);

const hemiLight = new THREE.HemisphereLight(0xffe4b8, 0x493324, 2.1);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffc76d, 3.4);
sun.position.set(-7, 11, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

const palette = {
  burgundy: 0x6c172f,
  pinot: 0x8f2345,
  gold: 0xf0c987,
  leaf: 0x4d7c3f,
  vine: 0x5b3b25,
  limestone: 0xd9c9a7,
  soil: 0x5a3827,
  road: 0x8d7358,
  sky: 0xf1bd74,
};

scene.background = new THREE.Color(palette.sky);

const makeMaterial = (color) => new THREE.MeshLambertMaterial({ color });

const materials = {
  road: makeMaterial(palette.road),
  lane: makeMaterial(0xf2d79f),
  soil: makeMaterial(palette.soil),
  leaf: makeMaterial(palette.leaf),
  vine: makeMaterial(palette.vine),
  burgundy: makeMaterial(palette.burgundy),
  pinot: makeMaterial(palette.pinot),
  gold: makeMaterial(palette.gold),
  stone: makeMaterial(palette.limestone),
  darkStone: makeMaterial(0x8a7a66),
  roof: makeMaterial(0x8f3b2f),
  barrel: makeMaterial(0x7a4424),
  hoop: makeMaterial(0x2c2321),
};

const lanes = [-2.6, 0, 2.6];
const segmentLength = 18;
const world = new THREE.Group();
scene.add(world);

const roadPieces = [];
const scenicPieces = [];
const obstacles = [];
const collectibles = [];

const state = {
  running: false,
  gameOver: false,
  distance: 0,
  score: 0,
  grapes: 0,
  speed: 15,
  spawnCursor: -24,
  laneIndex: 1,
  laneTarget: 0,
  verticalVelocity: 0,
  grounded: true,
  nextObstacleAt: -38,
  nextGrapeAt: -30,
  nextGateAt: -85,
};

const runner = makeRunner();
runner.position.set(0, 0.92, 5.1);
scene.add(runner);

function makeRunner() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.78, 6, 12), materials.burgundy);
  body.castShadow = true;
  body.position.y = 0.76;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), materials.gold);
  head.castShadow = true;
  head.position.y = 1.55;
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.2), materials.pinot);
  scarf.castShadow = true;
  scarf.position.set(0, 1.22, 0.05);
  group.add(body, head, scarf);
  return group;
}

function makeRoad(z) {
  const group = new THREE.Group();
  const road = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.18, segmentLength + 0.4), materials.road);
  road.receiveShadow = true;
  road.position.y = -0.1;
  group.add(road);

  for (const x of [-1.3, 1.3]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, segmentLength * 0.6), materials.lane);
    stripe.position.set(x, 0.02, 0);
    group.add(stripe);
  }

  const leftSoil = new THREE.Mesh(new THREE.BoxGeometry(18, 0.12, segmentLength + 0.5), materials.soil);
  leftSoil.position.set(-13.4, -0.15, 0);
  leftSoil.receiveShadow = true;
  const rightSoil = leftSoil.clone();
  rightSoil.position.x = 13.4;
  group.add(leftSoil, rightSoil);

  for (let i = 0; i < 5; i += 1) {
    addVineRow(group, -6.2 - i * 1.45, i * 1.4);
    addVineRow(group, 6.2 + i * 1.45, i * 1.4);
  }

  group.position.z = z;
  world.add(group);
  roadPieces.push(group);
}

function addVineRow(parent, x, offset) {
  for (let z = -segmentLength / 2; z <= segmentLength / 2; z += 3) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.82, 6), materials.vine);
    trunk.position.set(x, 0.32, z + offset);
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 0.42), materials.leaf);
    leaves.position.set(x, 0.78, z + offset);
    leaves.castShadow = true;
    parent.add(trunk, leaves);
  }
}

function makeBarrel(lane, z) {
  const group = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 20), materials.barrel);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = 0.62;
  barrel.castShadow = true;
  const hoopA = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 24), materials.hoop);
  hoopA.position.set(-0.38, 0.62, 0);
  hoopA.rotation.y = Math.PI / 2;
  const hoopB = hoopA.clone();
  hoopB.position.x = 0.38;
  group.add(barrel, hoopA, hoopB);
  group.position.set(lanes[lane], 0, z);
  group.userData = { radius: 0.85, passed: false };
  world.add(group);
  obstacles.push(group);
}

function makeStoneGate(z) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.5, 1), materials.stone);
  const right = left.clone();
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.8, 1), materials.stone);
  left.position.set(-4.25, 1.65, 0);
  right.position.set(4.25, 1.65, 0);
  top.position.set(0, 3.15, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.65, 1.1, 4), materials.roof);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 3.95, 0);
  group.add(left, right, top, roof);
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.position.z = z;
  world.add(group);
  scenicPieces.push(group);
}

function makeVillage(z, side) {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7 + i * 0.25, 2.1), materials.stone);
    house.position.set(side * (8.5 + i * 2.7), 0.75 + i * 0.12, i * -2.2);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.8, 4), materials.roof);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(house.position.x, house.position.y + 1.08, house.position.z);
    group.add(house, roof);
  }
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.position.z = z;
  world.add(group);
  scenicPieces.push(group);
}

function makeGrape(lane, z, y = 1.15) {
  const group = new THREE.Group();
  const berryGeo = new THREE.SphereGeometry(0.18, 12, 10);
  for (let i = 0; i < 7; i += 1) {
    const berry = new THREE.Mesh(berryGeo, i % 2 ? materials.burgundy : materials.pinot);
    berry.position.set((i % 3 - 1) * 0.17, Math.floor(i / 3) * -0.18, 0);
    berry.castShadow = true;
    group.add(berry);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 6), materials.vine);
  stem.position.y = 0.28;
  stem.rotation.z = 0.45;
  group.add(stem);
  group.position.set(lanes[lane], y, z);
  group.userData = { radius: 0.58, collected: false };
  world.add(group);
  collectibles.push(group);
}

function seedWorld() {
  for (let z = 14; z > -170; z -= segmentLength) makeRoad(z);
  for (let z = -42; z > -170; z -= 42) makeVillage(z, z % 84 === 0 ? -1 : 1);
  makeStoneGate(-88);
}

function resetGame() {
  for (const item of [...obstacles, ...collectibles, ...scenicPieces]) world.remove(item);
  obstacles.length = 0;
  collectibles.length = 0;
  scenicPieces.length = 0;
  state.running = true;
  state.gameOver = false;
  state.distance = 0;
  state.score = 0;
  state.grapes = 0;
  state.speed = 15;
  state.laneIndex = 1;
  state.laneTarget = 0;
  state.verticalVelocity = 0;
  state.grounded = true;
  state.nextObstacleAt = -38;
  state.nextGrapeAt = -28;
  state.nextGateAt = -86;
  runner.position.set(0, 0.92, 5.1);
  updateHud();
  startPanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  for (let z = -42; z > -170; z -= 42) makeVillage(z, z % 84 === 0 ? -1 : 1);
  makeStoneGate(-88);
}

function moveLane(direction) {
  if (!state.running) return;
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + direction, 0, lanes.length - 1);
  state.laneTarget = lanes[state.laneIndex];
}

function jump() {
  if (!state.running || !state.grounded) return;
  state.verticalVelocity = 8.6;
  state.grounded = false;
}

function spawnAhead() {
  while (state.nextObstacleAt > -160) state.nextObstacleAt -= 22;

  if (state.distance + 90 > Math.abs(state.nextObstacleAt)) {
    const blockedLane = Math.floor(Math.random() * lanes.length);
    makeBarrel(blockedLane, state.nextObstacleAt);
    if (Math.random() > 0.58) makeBarrel((blockedLane + 1 + Math.floor(Math.random() * 2)) % 3, state.nextObstacleAt - 3.2);
    state.nextObstacleAt -= THREE.MathUtils.randFloat(16, 25);
  }

  if (state.distance + 90 > Math.abs(state.nextGrapeAt)) {
    const lane = Math.floor(Math.random() * lanes.length);
    for (let i = 0; i < 5; i += 1) makeGrape(lane, state.nextGrapeAt - i * 2.2, i === 2 ? 2.15 : 1.15);
    state.nextGrapeAt -= THREE.MathUtils.randFloat(18, 28);
  }

  if (state.distance + 120 > Math.abs(state.nextGateAt)) {
    makeStoneGate(state.nextGateAt);
    makeVillage(state.nextGateAt - 18, Math.random() > 0.5 ? 1 : -1);
    state.nextGateAt -= THREE.MathUtils.randFloat(70, 95);
  }
}

function updateGame(delta) {
  if (!state.running) return;

  const dz = state.speed * delta;
  world.position.z += dz;
  state.distance += dz;
  state.speed += delta * 0.28;
  state.score = Math.floor(state.distance * 1.7 + state.grapes * 45);

  runner.position.x = THREE.MathUtils.damp(runner.position.x, state.laneTarget, 14, delta);
  runner.rotation.z = THREE.MathUtils.damp(runner.rotation.z, (state.laneTarget - runner.position.x) * -0.08, 9, delta);

  if (!state.grounded) {
    runner.position.y += state.verticalVelocity * delta;
    state.verticalVelocity -= 23 * delta;
    if (runner.position.y <= 0.92) {
      runner.position.y = 0.92;
      state.grounded = true;
      state.verticalVelocity = 0;
    }
  }

  runner.rotation.y = Math.sin(performance.now() * 0.009) * 0.08;
  runner.position.z = 5.1 + Math.sin(performance.now() * 0.011) * 0.05;

  recycleRoad();
  spawnAhead();
  testCollections();
  testCrashes();
  cleanupObjects(obstacles);
  cleanupObjects(collectibles);
  cleanupObjects(scenicPieces);
  updateHud();
}

function recycleRoad() {
  let farthest = Math.min(...roadPieces.map((piece) => piece.position.z + world.position.z));
  for (const piece of roadPieces) {
    if (piece.position.z + world.position.z > 28) {
      piece.position.z = farthest - segmentLength;
      farthest = piece.position.z + world.position.z;
    }
  }
}

function testCollections() {
  for (const grape of collectibles) {
    if (grape.userData.collected) continue;
    grape.rotation.y += 0.08;
    const worldZ = grape.position.z + world.position.z;
    const dx = Math.abs(grape.position.x - runner.position.x);
    const dy = Math.abs(grape.position.y - runner.position.y);
    if (worldZ > 4.3 && worldZ < 6.2 && dx < 0.85 && dy < 1.1) {
      grape.userData.collected = true;
      grape.visible = false;
      state.grapes += 1;
      state.score += 45;
    }
  }
}

function testCrashes() {
  for (const barrel of obstacles) {
    if (barrel.userData.passed) continue;
    const worldZ = barrel.position.z + world.position.z;
    if (worldZ > 4.0 && worldZ < 6.1 && Math.abs(barrel.position.x - runner.position.x) < 0.88 && runner.position.y < 1.65) {
      endGame();
      return;
    }
    if (worldZ > 6.5) barrel.userData.passed = true;
  }
}

function cleanupObjects(list) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const item = list[i];
    if (item.position.z + world.position.z > 32 || item.userData.collected) {
      world.remove(item);
      list.splice(i, 1);
    }
  }
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  finalScoreEl.textContent = state.score.toLocaleString();
  runSummaryEl.textContent = `${Math.floor(state.distance)} meters through the Cote d'Or with ${state.grapes} grape clusters.`;
  gameOverPanel.classList.remove("hidden");
}

function updateHud() {
  scoreEl.textContent = state.score.toLocaleString();
  distanceEl.textContent = `${Math.floor(state.distance)}m`;
  coinsEl.textContent = state.grapes.toLocaleString();
}

function resize() {
  const { innerWidth, innerHeight } = window;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = innerWidth < 720 ? 10.8 : 9.7;
  camera.position.y = innerWidth < 720 ? 6.5 : 5.9;
  camera.updateProjectionMatrix();
}

function bindControls() {
  document.querySelector("#startButton").addEventListener("click", resetGame);
  document.querySelector("#restartButton").addEventListener("click", resetGame);
  document.querySelector("#leftButton").addEventListener("click", () => moveLane(-1));
  document.querySelector("#rightButton").addEventListener("click", () => moveLane(1));
  document.querySelector("#jumpButton").addEventListener("click", jump);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLane(-1);
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveLane(1);
    if (event.key === "ArrowUp" || event.key === " ") jump();
    if (event.key === "Enter" && !state.running) resetGame();
  });

  let startX = 0;
  let startY = 0;
  window.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  window.addEventListener("pointerup", (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
    if (dy < -24) jump();
  });
}

let lastTime = performance.now();
function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;
  updateGame(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

seedWorld();
bindControls();
resize();
updateHud();
window.addEventListener("resize", resize);
requestAnimationFrame(animate);

if (new URLSearchParams(window.location.search).get("autostart") === "1") {
  resetGame();
}
