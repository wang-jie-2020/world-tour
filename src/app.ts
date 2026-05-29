import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DESTINATIONS, REGIONS, THEME_LABELS } from "./data";
import { buildRegionBoundary, latLonToVector3, randomPointInCap } from "./geo";
import type { Destination, FocusAnimation, Region, RegionId, ThemeId } from "./types";

const RADIUS = 1;
const THEME_IDS: ThemeId[] = ["flowers", "fairy", "destinations"];
const AUTO_ROTATE_SPEED = 0.0009;

type PerformanceTier = "low" | "high";

type DestinationMesh = THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> & {
  userData: {
    destination: Destination;
    pulsePhase: number;
  };
};

type FairyTrail = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> & {
  userData: {
    phase: number;
    speed: number;
  };
};

export function bootstrap(root: HTMLDivElement): void {
  root.innerHTML = `
    <div class="app-shell">
      <canvas id="globe-canvas"></canvas>
      <div class="panel panel-left">
        <div class="block">
          <h2>Region</h2>
          <div id="region-chips" class="chips"></div>
        </div>
        <div class="block">
          <h2>Themes</h2>
          <div id="theme-chips" class="chips"></div>
        </div>
        <div class="block">
          <h2>Intensity</h2>
          <input id="intensity" type="range" min="0.4" max="1.8" step="0.1" value="1.0" />
        </div>
        <p id="status-line" class="status-line"></p>
      </div>
      <div class="panel panel-right">
        <label class="toggle">
          <input id="auto-rotate" type="checkbox" checked />
          <span>Auto rotate</span>
        </label>
        <label class="toggle">
          <input id="guided-tour" type="checkbox" />
          <span>Guided tour</span>
        </label>
        <div id="info-card" class="info-card hidden">
          <h3 id="info-title"></h3>
          <p id="info-region"></p>
          <p id="info-tags"></p>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#globe-canvas");
  const regionChips = root.querySelector<HTMLDivElement>("#region-chips");
  const themeChips = root.querySelector<HTMLDivElement>("#theme-chips");
  const intensitySlider = root.querySelector<HTMLInputElement>("#intensity");
  const autoRotateInput = root.querySelector<HTMLInputElement>("#auto-rotate");
  const guidedTourInput = root.querySelector<HTMLInputElement>("#guided-tour");
  const statusLine = root.querySelector<HTMLParagraphElement>("#status-line");
  const infoCard = root.querySelector<HTMLDivElement>("#info-card");
  const infoTitle = root.querySelector<HTMLHeadingElement>("#info-title");
  const infoRegion = root.querySelector<HTMLParagraphElement>("#info-region");
  const infoTags = root.querySelector<HTMLParagraphElement>("#info-tags");

  if (
    !canvas ||
    !regionChips ||
    !themeChips ||
    !intensitySlider ||
    !autoRotateInput ||
    !guidedTourInput ||
    !statusLine ||
    !infoCard ||
    !infoTitle ||
    !infoRegion ||
    !infoTags
  ) {
    throw new Error("UI nodes missing from DOM.");
  }
  const canvasNode = canvas;
  const regionChipsNode = regionChips;
  const themeChipsNode = themeChips;
  const intensitySliderNode = intensitySlider;
  const autoRotateInputNode = autoRotateInput;
  const guidedTourInputNode = guidedTourInput;
  const statusLineNode = statusLine;
  const infoCardNode = infoCard;
  const infoTitleNode = infoTitle;
  const infoRegionNode = infoRegion;
  const infoTagsNode = infoTags;

  const perfTier = detectPerformanceTier();

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasNode,
    antialias: true,
    alpha: true,
    powerPreference: perfTier === "low" ? "low-power" : "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, perfTier === "low" ? 1.4 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#02070c", 2.6, 7.5);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0, 0.28, 3.3);

  const controls = new OrbitControls(camera, canvasNode);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.7;
  controls.maxDistance = 5.6;
  controls.maxPolarAngle = Math.PI * 0.86;

  const ambient = new THREE.AmbientLight("#94b9d9", 0.38);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight("#f4f8ff", "#1e2f3f", 0.88);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight("#ffe9bb", 1.0);
  keyLight.position.set(2.8, 1.8, 2.1);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#79bbff", 0.63);
  fillLight.position.set(-2.3, -1.1, -1.8);
  scene.add(fillLight);

  const stars = createStars(perfTier === "low" ? 520 : 980);
  scene.add(stars);

  const planetGroup = new THREE.Group();
  scene.add(planetGroup);

  const globeMaterial = new THREE.MeshStandardMaterial({
    color: "#4f8f5b",
    roughness: 0.92,
    metalness: 0.02
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 96), globeMaterial);
  planetGroup.add(globe);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.035, 64, 64),
    new THREE.MeshBasicMaterial({
      color: "#84b8ff",
      transparent: true,
      opacity: 0.14
    })
  );
  planetGroup.add(atmosphere);

  const regionFillGroup = new THREE.Group();
  const regionBorderGroup = new THREE.Group();
  const regionHaloGroup = new THREE.Group();
  planetGroup.add(regionFillGroup);
  planetGroup.add(regionBorderGroup);
  planetGroup.add(regionHaloGroup);

  const flowerGroup = new THREE.Group();
  const fairyGroup = new THREE.Group();
  const destinationGroup = new THREE.Group();
  const routeGroup = new THREE.Group();
  planetGroup.add(flowerGroup);
  planetGroup.add(fairyGroup);
  planetGroup.add(destinationGroup);
  planetGroup.add(routeGroup);

  const regionCenters = new Map<RegionId, THREE.Vector3>();
  const regionFillMeshes = new Map<RegionId, THREE.Points>();
  const regionBorderMeshes = new Map<RegionId, THREE.LineLoop>();
  const regionHaloMeshes = new Map<RegionId, THREE.LineLoop>();
  const regionStrengths = new Map<RegionId, number>();

  REGIONS.forEach((region) => {
    const center = latLonToVector3(region.center.lat, region.center.lon, RADIUS + 0.004).normalize();
    regionCenters.set(region.id, center);
    regionStrengths.set(region.id, 0);

    const fill = createRegionFill(region, center, perfTier === "low" ? 96 : 170);
    regionFillMeshes.set(region.id, fill);
    regionFillGroup.add(fill);

    const border = new THREE.LineLoop(
      buildRegionBoundary(center, region.radiusDeg, 96, RADIUS + 0.005),
      new THREE.LineBasicMaterial({
        color: region.color,
        transparent: true,
        opacity: 0.35
      })
    );
    regionBorderMeshes.set(region.id, border);
    regionBorderGroup.add(border);

    const halo = new THREE.LineLoop(
      buildRegionBoundary(center, region.radiusDeg * 1.04, 96, RADIUS + 0.015),
      new THREE.LineBasicMaterial({
        color: region.color,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending
      })
    );
    regionHaloMeshes.set(region.id, halo);
    regionHaloGroup.add(halo);
  });

  const destinationMeshes: DestinationMesh[] = [];
  const destinationMaterials: THREE.MeshStandardMaterial[] = [];
  DESTINATIONS.forEach((destination) => {
    const marker = createDestinationMarker(destination);
    destinationMeshes.push(marker);
    destinationMaterials.push(marker.material);
    destinationGroup.add(marker);
  });
  const routeMaterials = rebuildDestinationRoutes(routeGroup);

  const flowerRuntime = createFlowerLayer(regionCenters, perfTier);
  flowerGroup.add(flowerRuntime.group);

  const fairyRuntime = createFairyLayer(perfTier);
  fairyGroup.add(fairyRuntime.group);

  let selectedRegion: RegionId = "europe";
  const activeThemes = new Set<ThemeId>(THEME_IDS);
  let intensity = Number(intensitySliderNode.value);
  let autoRotate = true;
  let guidedTour = false;
  let guidedTourIndex = 0;
  let lastGuideSwitch = performance.now();
  let focusAnimation: FocusAnimation | null = null;

  let flowersWeight = 1;
  let fairyWeight = 1;
  let destinationsWeight = 1;

  renderRegionChips(regionChipsNode, selectedRegion, (regionId) => {
    selectedRegion = regionId;
    focusRegion(regionId);
    updateChipsState(regionChipsNode, selectedRegion);
    hideInfo();
    updateStatusLine();
  });

  renderThemeChips(themeChipsNode, activeThemes, (themeId) => {
    if (activeThemes.has(themeId)) {
      activeThemes.delete(themeId);
    } else {
      activeThemes.add(themeId);
    }
    updateThemeChipState(themeChipsNode, activeThemes);
    updateStatusLine();
  });
  updateThemeChipState(themeChipsNode, activeThemes);

  intensitySliderNode.addEventListener("input", () => {
    intensity = Number(intensitySliderNode.value);
  });

  autoRotateInputNode.addEventListener("change", () => {
    autoRotate = autoRotateInputNode.checked;
  });

  guidedTourInputNode.addEventListener("change", () => {
    guidedTour = guidedTourInputNode.checked;
    lastGuideSwitch = performance.now();
    hideInfo();
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPoint: { x: number; y: number } | null = null;

  canvasNode.addEventListener("pointerdown", (event) => {
    downPoint = { x: event.clientX, y: event.clientY };
  });

  canvasNode.addEventListener("pointerup", (event) => {
    if (!downPoint) {
      return;
    }
    const travel = Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y);
    downPoint = null;
    if (travel > 8) {
      return;
    }
    const rect = canvasNode.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(destinationMeshes, false);
    if (intersections.length === 0) {
      hideInfo();
      return;
    }
    const marker = intersections[0].object as DestinationMesh;
    handleDestinationSelect(marker.userData.destination);
  });

  canvasNode.addEventListener("pointerleave", () => {
    downPoint = null;
  });

  window.addEventListener("resize", resize);
  resize();
  focusRegion(selectedRegion, true);
  updateStatusLine();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const elapsed = clock.getElapsedTime();
    const now = performance.now();

    if (autoRotate && !focusAnimation) {
      planetGroup.rotation.y += AUTO_ROTATE_SPEED;
    }

    if (guidedTour && now - lastGuideSwitch > 4200) {
      guidedTourIndex = (guidedTourIndex + 1) % REGIONS.length;
      selectedRegion = REGIONS[guidedTourIndex].id;
      updateChipsState(regionChipsNode, selectedRegion);
      focusRegion(selectedRegion);
      hideInfo();
      updateStatusLine();
      lastGuideSwitch = now;
    }

    updateFocusAnimation(now);
    updateRegionVisuals(elapsed, intensity);
    updateThemeVisuals(elapsed, intensity);

    controls.update();
    renderer.render(scene, camera);
  });

  function handleDestinationSelect(destination: Destination): void {
    selectedRegion = destination.regionId;
    updateChipsState(regionChipsNode, selectedRegion);
    showDestinationInfo(destination);
    focusDestination(destination);
    updateStatusLine();
  }

  function showDestinationInfo(destination: Destination): void {
    const region = REGIONS.find((item) => item.id === destination.regionId);
    infoTitleNode.textContent = destination.name;
    infoRegionNode.textContent = `Region: ${region?.label ?? destination.regionId}`;
    infoTagsNode.textContent = `Tags: ${destination.tags.join(", ")}`;
    infoCardNode.classList.remove("hidden");
  }

  function hideInfo(): void {
    infoCardNode.classList.add("hidden");
  }

  function updateStatusLine(): void {
    const region = REGIONS.find((item) => item.id === selectedRegion);
    const activeThemeLabels = THEME_IDS.filter((theme) => activeThemes.has(theme)).map(
      (theme) => THEME_LABELS[theme]
    );
    const themeText = activeThemeLabels.length > 0 ? activeThemeLabels.join(" + ") : "None";
    statusLineNode.textContent = `${region?.label ?? selectedRegion} | Themes: ${themeText}`;
  }

  function getWorldPoint(local: THREE.Vector3): THREE.Vector3 {
    return local.clone().applyQuaternion(planetGroup.quaternion);
  }

  function startFocusAnimation(
    toPosition: THREE.Vector3,
    toTarget: THREE.Vector3,
    immediate = false
  ): void {
    focusAnimation = {
      fromPosition: camera.position.clone(),
      toPosition,
      fromTarget: controls.target.clone(),
      toTarget,
      startTime: performance.now(),
      durationMs: immediate ? 1 : 420
    };
  }

  function focusRegion(regionId: RegionId, immediate = false): void {
    const region = REGIONS.find((item) => item.id === regionId);
    const center = regionCenters.get(regionId);
    if (!region || !center) {
      return;
    }
    const worldPoint = getWorldPoint(center);
    const distance = 2.45 + region.radiusDeg * 0.01;
    const cameraPoint = worldPoint.clone().multiplyScalar(distance).add(new THREE.Vector3(0, 0.06, 0));
    const lookTarget = worldPoint.clone().multiplyScalar(0.2);
    startFocusAnimation(cameraPoint, lookTarget, immediate);
  }

  function focusDestination(destination: Destination): void {
    const localPoint = latLonToVector3(destination.lat, destination.lon, RADIUS + 0.02);
    const worldPoint = getWorldPoint(localPoint);
    const cameraPoint = worldPoint.clone().multiplyScalar(2.12).add(new THREE.Vector3(0, 0.03, 0));
    const lookTarget = worldPoint.clone().multiplyScalar(0.52);
    startFocusAnimation(cameraPoint, lookTarget);
  }

  function updateFocusAnimation(now: number): void {
    if (!focusAnimation) {
      return;
    }
    const progress = Math.min((now - focusAnimation.startTime) / focusAnimation.durationMs, 1);
    const eased = easeInOutCubic(progress);
    camera.position.lerpVectors(focusAnimation.fromPosition, focusAnimation.toPosition, eased);
    controls.target.lerpVectors(focusAnimation.fromTarget, focusAnimation.toTarget, eased);
    if (progress >= 1) {
      focusAnimation = null;
    }
  }

  function resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function updateRegionVisuals(elapsed: number, intensityValue: number): void {
    const clampedIntensity = THREE.MathUtils.clamp(intensityValue, 0.4, 1.8);
    REGIONS.forEach((region) => {
      const current = regionStrengths.get(region.id) ?? 0;
      const target = region.id === selectedRegion ? 1 : 0;
      const next = current + (target - current) * 0.1;
      regionStrengths.set(region.id, next);

      const fill = regionFillMeshes.get(region.id);
      const border = regionBorderMeshes.get(region.id);
      const halo = regionHaloMeshes.get(region.id);
      if (!fill || !border || !halo) {
        return;
      }

      const fillMaterial = fill.material as THREE.PointsMaterial;
      fillMaterial.opacity = (0.08 + 0.38 * next) * (0.65 + clampedIntensity * 0.3);
      fillMaterial.size = (0.012 + 0.019 * next) * (0.75 + clampedIntensity * 0.35);

      const borderMaterial = border.material as THREE.LineBasicMaterial;
      borderMaterial.opacity = 0.28 + 0.7 * next;

      const haloMaterial = halo.material as THREE.LineBasicMaterial;
      const pulse = 0.55 + 0.45 * Math.sin(elapsed * 3.2 + region.id.length);
      haloMaterial.opacity = (0.04 + 0.38 * next * pulse) * (0.85 + clampedIntensity * 0.2);
    });
  }

  function updateThemeVisuals(elapsed: number, intensityValue: number): void {
    const clampedIntensity = THREE.MathUtils.clamp(intensityValue, 0.4, 1.8);
    const intensityFactor = 0.55 + clampedIntensity * 0.45;

    flowersWeight = moveTowards(flowersWeight, activeThemes.has("flowers") ? 1 : 0, 0.08);
    fairyWeight = moveTowards(fairyWeight, activeThemes.has("fairy") ? 1 : 0, 0.08);
    destinationsWeight = moveTowards(
      destinationsWeight,
      activeThemes.has("destinations") ? 1 : 0,
      0.08
    );

    flowerGroup.visible = flowersWeight > 0.015;
    fairyGroup.visible = fairyWeight > 0.015;
    destinationGroup.visible = destinationsWeight > 0.015;
    routeGroup.visible = destinationsWeight > 0.015;

    flowerRuntime.layers.forEach((layer) => {
      layer.material.opacity = layer.baseOpacity * flowersWeight * intensityFactor;
      layer.material.size = layer.baseSize * (0.7 + clampedIntensity * 0.35);
    });

    const fairyPulse = 0.5 + 0.5 * Math.sin(elapsed * 1.9);
    fairyRuntime.pointMaterial.opacity = (0.08 + 0.2 * fairyPulse) * fairyWeight * intensityFactor;
    fairyRuntime.pointMaterial.size = 0.012 + 0.01 * (0.5 + 0.5 * Math.sin(elapsed * 1.2));

    fairyRuntime.trails.forEach((trail) => {
      const wave = 0.5 + 0.5 * Math.sin(elapsed * trail.userData.speed + trail.userData.phase);
      trail.material.opacity = (0.05 + 0.24 * wave) * fairyWeight * intensityFactor;
    });
    fairyGroup.rotation.y += 0.0005;

    destinationMeshes.forEach((mesh) => {
      const wave = 0.7 + 0.3 * Math.sin(elapsed * 2.8 + mesh.userData.pulsePhase);
      const scale = 0.8 + destinationsWeight * intensityFactor * wave * 0.4;
      mesh.scale.setScalar(scale);
      mesh.material.opacity = 0.1 + destinationsWeight * 0.9;
      mesh.material.emissiveIntensity = 0.16 + destinationsWeight * intensityFactor * 1.35;
    });
    destinationMaterials.forEach((material) => {
      material.roughness = 0.46 - destinationsWeight * 0.17;
    });
    routeMaterials.forEach((material) => {
      material.opacity = (0.04 + 0.45 * destinationsWeight) * intensityFactor;
    });
  }
}

function detectPerformanceTier(): PerformanceTier {
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (window.innerWidth < 820 || deviceMemory < 4 || cores <= 4) {
    return "low";
  }
  return "high";
}

function moveTowards(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function createRegionFill(
  region: Region,
  center: THREE.Vector3,
  particleCount: number
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const point = randomPointInCap(center, region.radiusDeg, RADIUS + 0.004);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: region.color,
      size: 0.016,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    })
  );
}

function createFlowerLayer(
  regionCenters: Map<RegionId, THREE.Vector3>,
  perfTier: PerformanceTier
): {
  group: THREE.Group;
  layers: Array<{ material: THREE.PointsMaterial; baseOpacity: number; baseSize: number }>;
} {
  const group = new THREE.Group();
  const pointsPerRegion = perfTier === "low" ? 70 : 130;
  const smallPalette = ["#f8d37d", "#ffd7a0", "#f4a6b9", "#f8edbf"];
  const largePalette = ["#ffc787", "#ffd2e2", "#ffebb5"];
  const layers: Array<{ material: THREE.PointsMaterial; baseOpacity: number; baseSize: number }> = [];

  const smallPositions: number[] = [];
  const smallColors: number[] = [];
  const largePositions: number[] = [];
  const largeColors: number[] = [];

  REGIONS.forEach((region) => {
    const center = regionCenters.get(region.id);
    if (!center) {
      return;
    }
    for (let i = 0; i < pointsPerRegion; i += 1) {
      const smallPoint = randomPointInCap(center, region.radiusDeg * 0.92, RADIUS + 0.009);
      smallPositions.push(smallPoint.x, smallPoint.y, smallPoint.z);
      const smallColor = new THREE.Color(smallPalette[(i + region.id.length) % smallPalette.length]);
      smallColors.push(smallColor.r, smallColor.g, smallColor.b);
    }
    for (let i = 0; i < Math.floor(pointsPerRegion * 0.42); i += 1) {
      const largePoint = randomPointInCap(center, region.radiusDeg * 0.78, RADIUS + 0.011);
      largePositions.push(largePoint.x, largePoint.y, largePoint.z);
      const largeColor = new THREE.Color(largePalette[(i + region.label.length) % largePalette.length]);
      largeColors.push(largeColor.r, largeColor.g, largeColor.b);
    }
  });

  const smallGeometry = new THREE.BufferGeometry();
  smallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(smallPositions, 3));
  smallGeometry.setAttribute("color", new THREE.Float32BufferAttribute(smallColors, 3));
  const smallMaterial = new THREE.PointsMaterial({
    size: 0.018,
    vertexColors: true,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });
  group.add(new THREE.Points(smallGeometry, smallMaterial));
  layers.push({ material: smallMaterial, baseOpacity: 0.34, baseSize: 0.018 });

  const largeGeometry = new THREE.BufferGeometry();
  largeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(largePositions, 3));
  largeGeometry.setAttribute("color", new THREE.Float32BufferAttribute(largeColors, 3));
  const largeMaterial = new THREE.PointsMaterial({
    size: 0.026,
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  group.add(new THREE.Points(largeGeometry, largeMaterial));
  layers.push({ material: largeMaterial, baseOpacity: 0.24, baseSize: 0.026 });

  return { group, layers };
}

function createFairyLayer(perfTier: PerformanceTier): {
  group: THREE.Group;
  pointMaterial: THREE.PointsMaterial;
  trails: FairyTrail[];
} {
  const group = new THREE.Group();

  const pointCount = perfTier === "low" ? 240 : 520;
  const pointPositions = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 1.22 + Math.random() * 0.35;
    pointPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    pointPositions[i * 3 + 1] = radius * Math.cos(phi);
    pointPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
  const pointMaterial = new THREE.PointsMaterial({
    color: "#9ecfff",
    size: 0.016,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });
  group.add(new THREE.Points(pointGeometry, pointMaterial));

  const trailCount = perfTier === "low" ? 8 : 14;
  const trails: FairyTrail[] = [];
  for (let i = 0; i < trailCount; i += 1) {
    const lat = THREE.MathUtils.randFloatSpread(70);
    const startLon = THREE.MathUtils.randFloat(-180, 180);
    const lengthDeg = THREE.MathUtils.randFloat(20, 58);
    const points: THREE.Vector3[] = [];
    const segments = 36;
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments;
      const lon = startLon + lengthDeg * t;
      const waveLat = lat + Math.sin(t * Math.PI) * THREE.MathUtils.randFloat(1.2, 4.2);
      points.push(latLonToVector3(waveLat, lon, RADIUS + THREE.MathUtils.randFloat(0.11, 0.2)));
    }
    const trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#b7dcff",
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
      })
    ) as FairyTrail;
    trail.userData = {
      phase: Math.random() * Math.PI * 2,
      speed: THREE.MathUtils.randFloat(1.4, 2.7)
    };
    trails.push(trail);
    group.add(trail);
  }

  return { group, pointMaterial, trails };
}

function createDestinationMarker(destination: Destination): DestinationMesh {
  const position = latLonToVector3(destination.lat, destination.lon, RADIUS + 0.022);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 14),
    new THREE.MeshStandardMaterial({
      color: "#ffe2a5",
      emissive: "#f6c573",
      emissiveIntensity: 1.05,
      metalness: 0.11,
      roughness: 0.37,
      transparent: true,
      opacity: 1
    })
  ) as DestinationMesh;
  marker.position.copy(position);
  marker.userData = {
    destination,
    pulsePhase: Math.random() * Math.PI * 2
  };

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 12, 12),
    new THREE.MeshBasicMaterial({
      color: "#ffdca6",
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  marker.add(aura);

  return marker;
}

function rebuildDestinationRoutes(group: THREE.Group): THREE.LineBasicMaterial[] {
  group.clear();
  const routeMaterials: THREE.LineBasicMaterial[] = [];
  const grouped = new Map<RegionId, Destination[]>();

  DESTINATIONS.forEach((destination) => {
    if (!grouped.has(destination.regionId)) {
      grouped.set(destination.regionId, []);
    }
    grouped.get(destination.regionId)?.push(destination);
  });

  grouped.forEach((items) => {
    if (items.length < 2) {
      return;
    }
    for (let i = 0; i < items.length - 1; i += 1) {
      const from = latLonToVector3(items[i].lat, items[i].lon, RADIUS + 0.015);
      const to = latLonToVector3(items[i + 1].lat, items[i + 1].lon, RADIUS + 0.015);
      const mid = from.clone().add(to).normalize().multiplyScalar(RADIUS + 0.2);
      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: "#9edfff",
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(42)),
        lineMaterial
      );
      group.add(line);
      routeMaterials.push(lineMaterial);
    }
  });

  return routeMaterials;
}

function createStars(count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 6 + Math.random() * 6;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  return new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3)),
    new THREE.PointsMaterial({
      color: "#d3e7ff",
      size: 0.028,
      transparent: true,
      opacity: 0.64,
      depthWrite: false
    })
  );
}

function renderRegionChips(
  container: HTMLDivElement,
  selectedRegion: RegionId,
  onSelect: (regionId: RegionId) => void
): void {
  container.innerHTML = "";
  REGIONS.forEach((region) => {
    const button = document.createElement("button");
    button.className = "chip";
    button.dataset.regionId = region.id;
    button.textContent = region.label;
    button.addEventListener("click", () => onSelect(region.id));
    container.appendChild(button);
  });
  updateChipsState(container, selectedRegion);
}

function updateChipsState(container: HTMLDivElement, selectedRegion: RegionId): void {
  container.querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.regionId === selectedRegion);
  });
}

function renderThemeChips(
  container: HTMLDivElement,
  themes: Set<ThemeId>,
  onToggle: (themeId: ThemeId) => void
): void {
  container.innerHTML = "";
  THEME_IDS.forEach((themeId) => {
    const button = document.createElement("button");
    button.className = "chip";
    button.dataset.themeId = themeId;
    button.textContent = THEME_LABELS[themeId];
    button.classList.toggle("active", themes.has(themeId));
    button.addEventListener("click", () => onToggle(themeId));
    container.appendChild(button);
  });
}

function updateThemeChipState(container: HTMLDivElement, themes: Set<ThemeId>): void {
  container.querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) => {
    const themeId = chip.dataset.themeId as ThemeId | undefined;
    if (!themeId) {
      chip.classList.remove("active");
      return;
    }
    chip.classList.toggle("active", themes.has(themeId));
  });
}

function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}
