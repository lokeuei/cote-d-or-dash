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
  leaf: 0x527c35,
  leafLight: 0x769a45,
  leafDark: 0x335525,
  vine: 0x5b3b25,
  limestone: 0xd9c9a7,
  soil: 0x5a3827,
  road: 0x8d7358,
  sky: 0xf1bd74,
};

scene.background = new THREE.Color(palette.sky);

function makeCanvasTexture(size, paint, repeatX = 1, repeatY = 1) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  paint(context, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const roadTexture = makeCanvasTexture(256, (context, size) => {
  context.fillStyle = "#9b7b55";
  context.fillRect(0, 0, size, size);
  for (let i = 0; i < 520; i += 1) {
    const tone = 112 + Math.floor(Math.random() * 72);
    context.fillStyle = `rgba(${tone + 20}, ${tone + 8}, ${tone - 22}, ${0.18 + Math.random() * 0.32})`;
    context.beginPath();
    context.ellipse(Math.random() * size, Math.random() * size, 1 + Math.random() * 3.8, 0.7 + Math.random() * 2.6, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
}, 2.8, 9);

const soilTexture = makeCanvasTexture(256, (context, size) => {
  context.fillStyle = "#63391f";
  context.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 18) {
    context.fillStyle = "rgba(35, 20, 11, 0.23)";
    context.fillRect(0, y, size, 5 + Math.random() * 4);
  }
  for (let i = 0; i < 360; i += 1) {
    context.fillStyle = `rgba(120, 78, 38, ${0.12 + Math.random() * 0.2})`;
    context.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 7, 1 + Math.random() * 4);
  }
}, 3, 7);

const limestoneTexture = makeCanvasTexture(256, (context, size) => {
  context.fillStyle = "#d8c49b";
  context.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 38) {
    context.strokeStyle = "rgba(104, 85, 62, 0.2)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, y + Math.random() * 8);
    context.lineTo(size, y + Math.random() * 8);
    context.stroke();
  }
  for (let i = 0; i < 110; i += 1) {
    context.fillStyle = `rgba(255, 245, 210, ${0.09 + Math.random() * 0.14})`;
    context.fillRect(Math.random() * size, Math.random() * size, 16 + Math.random() * 34, 4 + Math.random() * 16);
  }
}, 1.8, 1.8);

const roofTexture = makeCanvasTexture(256, (context, size) => {
  context.fillStyle = "#a2482d";
  context.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 18) {
    context.fillStyle = y % 36 === 0 ? "#b75635" : "#8f3928";
    context.fillRect(0, y, size, 10);
  }
}, 2, 2);

const barrelTexture = makeCanvasTexture(256, (context, size) => {
  context.fillStyle = "#7b4524";
  context.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 28) {
    context.fillStyle = x % 56 === 0 ? "#8e552c" : "#62331e";
    context.fillRect(x, 0, 13, size);
  }
}, 2, 1);

const makeMaterial = (color, map = null) => new THREE.MeshLambertMaterial({ color, map });

const materials = {
  road: makeMaterial(palette.road, roadTexture),
  lane: makeMaterial(0xf2d79f),
  soil: makeMaterial(palette.soil, soilTexture),
  leaf: makeMaterial(palette.leaf),
  leafLight: makeMaterial(palette.leafLight),
  leafDark: makeMaterial(palette.leafDark),
  vine: makeMaterial(palette.vine),
  burgundy: makeMaterial(palette.burgundy),
  pinot: makeMaterial(palette.pinot),
  gold: makeMaterial(palette.gold),
  stone: makeMaterial(palette.limestone, limestoneTexture),
  darkStone: makeMaterial(0x8a7a66),
  roof: makeMaterial(0x8f3b2f, roofTexture),
  barrel: makeMaterial(0x7a4424, barrelTexture),
  hoop: makeMaterial(0x2c2321),
  copper: makeMaterial(0xb26c3c),
};

const lanes = [-2.6, 0, 2.6];
const segmentLength = 18;
const grapeGeometry = new THREE.SphereGeometry(0.17, 14, 12);
const leafGeometry = new THREE.SphereGeometry(0.34, 10, 8);
const postGeometry = new THREE.CylinderGeometry(0.045, 0.065, 1.22, 7);
const wireGeometry = new THREE.CylinderGeometry(0.012, 0.012, segmentLength + 1.8, 6);
const trunkGeometry = new THREE.CylinderGeometry(0.035, 0.055, 1.08, 7);
const world = new THREE.Group();
scene.add(world);
scene.add(makeBackdrop());

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

function makeBackdrop() {
  const group = new THREE.Group();
  const sunDisk = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd789, transparent: true, opacity: 0.72, depthWrite: false })
  );
  sunDisk.position.set(-25, 22, -90);
  group.add(sunDisk);

  const hillColors = [0x9e7146, 0x84623e, 0x6f5a39];
  hillColors.forEach((color, layer) => {
    const shape = new THREE.Shape();
    shape.moveTo(-90, -8);
    for (let i = 0; i <= 12; i += 1) {
      const x = -90 + i * 15;
      const y = 1.8 + layer * 1.9 + Math.sin(i * 0.9 + layer) * 2.1;
      shape.lineTo(x, y);
    }
    shape.lineTo(90, -8);
    shape.lineTo(-90, -8);
    const hill = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.34 - layer * 0.05, depthWrite: false })
    );
    hill.position.set(0, -1.5 + layer * 1.3, -78 - layer * 11);
    group.add(hill);
  });

  return group;
}

function makeRunner() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.78, 6, 12), materials.burgundy);
  body.castShadow = true;
  body.position.y = 0.76;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), materials.gold);
  head.castShadow = true;
  head.position.y = 1.55;
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.18, 18), materials.roof);
  hat.position.y = 1.82;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.045, 18), materials.roof);
  brim.position.y = 1.7;
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.2), materials.pinot);
  scarf.castShadow = true;
  scarf.position.set(0, 1.22, 0.05);
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.42, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, materials.burgundy);
  leftArm.position.set(-0.43, 0.94, 0.03);
  leftArm.rotation.z = 0.42;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.43;
  rightArm.rotation.z = -0.42;
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.36, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, materials.vine);
  leftLeg.position.set(-0.16, 0.22, 0.03);
  leftLeg.rotation.z = -0.12;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.16;
  rightLeg.rotation.z = 0.12;
  group.add(body, head, hat, brim, scarf, leftArm, rightArm, leftLeg, rightLeg);
  return group;
}

function makeRoad(z) {
  const group = new THREE.Group();
  const road = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.16, segmentLength + 0.4), materials.road);
  road.receiveShadow = true;
  road.position.y = -0.1;
  group.add(road);

  for (const x of [-4.55, 4.55]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, segmentLength + 0.45), materials.stone);
    curb.position.set(x, 0.02, 0);
    curb.receiveShadow = true;
    group.add(curb);
  }

  for (const x of [-1.35, 1.35]) {
    for (let dashZ = -segmentLength / 2 + 1; dashZ < segmentLength / 2; dashZ += 4.2) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.024, 2.2), materials.lane);
      stripe.position.set(x, 0.005, dashZ);
      group.add(stripe);
    }
  }

  for (let i = 0; i < 16; i += 1) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045 + Math.random() * 0.055, 0), materials.darkStone);
    stone.position.set(THREE.MathUtils.randFloatSpread(7.4), 0.03, THREE.MathUtils.randFloatSpread(segmentLength));
    stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(stone);
  }

  const leftSoil = new THREE.Mesh(new THREE.BoxGeometry(18, 0.12, segmentLength + 0.5), materials.soil);
  leftSoil.position.set(-13.4, -0.15, 0);
  leftSoil.receiveShadow = true;
  const rightSoil = leftSoil.clone();
  rightSoil.position.x = 13.4;
  group.add(leftSoil, rightSoil);

  for (let i = 0; i < 4; i += 1) {
    const rowOffset = i * 1.4;
    addFurrow(group, -6.2 - i * 1.45, rowOffset);
    addFurrow(group, 6.2 + i * 1.45, rowOffset);
    addVineRow(group, -6.2 - i * 1.45, rowOffset, -1);
    addVineRow(group, 6.2 + i * 1.45, rowOffset, 1);
  }

  group.position.z = z;
  world.add(group);
  roadPieces.push(group);
}

function addFurrow(parent, x, offset) {
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, segmentLength + 0.5), materials.soil);
  ridge.position.set(x, -0.02, offset);
  ridge.rotation.z = x < 0 ? -0.015 : 0.015;
  parent.add(ridge);
}

function addVineRow(parent, x, offset, side) {
  for (const y of [0.64, 0.96]) {
    const wire = new THREE.Mesh(wireGeometry, materials.hoop);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(x, y, offset);
    parent.add(wire);
  }

  for (let z = -segmentLength / 2; z <= segmentLength / 2; z += 4) {
    const rowZ = z + offset;
    const post = new THREE.Mesh(postGeometry, materials.vine);
    post.position.set(x, 0.52, rowZ);
    post.castShadow = true;

    const trunk = new THREE.Mesh(trunkGeometry, materials.vine);
    trunk.position.set(x + side * 0.08, 0.48, rowZ + 0.08);
    trunk.rotation.z = side * 0.16;
    trunk.castShadow = true;

    const cordon = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.45, 7), materials.vine);
    cordon.rotation.x = Math.PI / 2;
    cordon.position.set(x, 0.75, rowZ + 0.45);
    cordon.castShadow = true;
    parent.add(post, trunk, cordon);

    for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
      const leaf = new THREE.Mesh(leafGeometry, leafIndex % 2 ? materials.leafLight : materials.leafDark);
      leaf.scale.set(1.15 + Math.random() * 0.35, 0.48 + Math.random() * 0.18, 0.55 + Math.random() * 0.22);
      leaf.position.set(x + side * (0.18 + leafIndex * 0.08), 0.76 + Math.random() * 0.34, rowZ - 0.52 + leafIndex * 0.35);
      leaf.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, side * 0.22);
      leaf.castShadow = true;
      parent.add(leaf);
    }

    if ((Math.round(z) + Math.round(Math.abs(x) * 10)) % 2 === 0) {
      const grapeCluster = makeTinyGrapeCluster();
      grapeCluster.position.set(x + side * 0.28, 0.58, rowZ + 0.2);
      grapeCluster.scale.setScalar(0.72);
      parent.add(grapeCluster);
    }
  }
}

function makeTinyGrapeCluster() {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const berry = new THREE.Mesh(grapeGeometry, i % 2 ? materials.burgundy : materials.pinot);
    berry.position.set((i % 2) * 0.13, -Math.floor(i / 2) * 0.15, (i % 3 - 1) * 0.08);
    group.add(berry);
  }
  return group;
}

function makeBarrel(lane, z) {
  const group = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.68, 1.18, 28), materials.barrel);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = 0.62;
  barrel.castShadow = true;
  const capA = new THREE.Mesh(new THREE.CircleGeometry(0.55, 28), materials.copper);
  capA.rotation.y = Math.PI / 2;
  capA.position.set(-0.6, 0.62, 0);
  const capB = capA.clone();
  capB.position.x = 0.6;
  const hoopA = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.032, 8, 28), materials.hoop);
  hoopA.position.set(-0.38, 0.62, 0);
  hoopA.rotation.y = Math.PI / 2;
  const hoopB = hoopA.clone();
  hoopB.position.x = 0.38;
  const hoopC = hoopA.clone();
  hoopC.position.x = 0;
  group.add(barrel, capA, capB, hoopA, hoopB, hoopC);
  group.position.set(lanes[lane], 0, z);
  group.userData = { radius: 0.85, passed: false };
  world.add(group);
  obstacles.push(group);
}

function makeStoneGate(z) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.5, 1), materials.stone);
  const right = left.clone();
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.72, 1), materials.stone);
  left.position.set(-4.25, 1.65, 0);
  right.position.set(4.25, 1.65, 0);
  top.position.set(0, 3.15, 0);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.16, 8, 32, Math.PI), materials.darkStone);
  arch.position.set(0, 1.92, -0.53);
  arch.rotation.z = Math.PI;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.65, 1.1, 4), materials.roof);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 3.95, 0);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.34, 0.08), materials.burgundy);
  sign.position.set(0, 2.92, -0.57);
  group.add(left, right, top, arch, roof, sign);
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
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.06), materials.vine);
    door.position.set(house.position.x, 0.25, house.position.z - 1.08);
    const windowA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.06), materials.gold);
    windowA.position.set(house.position.x - 0.55, house.position.y + 0.1, house.position.z - 1.08);
    const windowB = windowA.clone();
    windowB.position.x = house.position.x + 0.55;
    group.add(house, roof, door, windowA, windowB);
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
  for (let i = 0; i < 10; i += 1) {
    const berry = new THREE.Mesh(grapeGeometry, i % 2 ? materials.burgundy : materials.pinot);
    berry.scale.setScalar(1 + Math.random() * 0.2);
    berry.position.set((i % 3 - 1) * 0.16, Math.floor(i / 3) * -0.16, (i % 2) * 0.12);
    berry.castShadow = true;
    group.add(berry);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 6), materials.vine);
  stem.position.y = 0.28;
  stem.rotation.z = 0.45;
  const leaf = new THREE.Mesh(leafGeometry, materials.leafLight);
  leaf.scale.set(0.75, 0.26, 0.42);
  leaf.position.set(0.22, 0.18, 0.02);
  leaf.rotation.set(0.25, 0.4, -0.45);
  group.add(stem, leaf);
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

function resetRoadPieces() {
  roadPieces.forEach((piece, index) => {
    piece.position.z = 14 - index * segmentLength;
  });
}

function resetGame() {
  for (const item of [...obstacles, ...collectibles, ...scenicPieces]) world.remove(item);
  obstacles.length = 0;
  collectibles.length = 0;
  scenicPieces.length = 0;
  world.position.set(0, 0, 0);
  resetRoadPieces();
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
  runner.rotation.set(0, 0, 0);
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
