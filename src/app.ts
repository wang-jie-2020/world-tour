import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { DESTINATIONS, REGIONS, THEME_LABELS } from "./data";
import { buildRegionBoundary, latLonToVector3, randomPointInCap } from "./geo";
import type { Destination, FocusAnimation, Region, RegionId, ThemeId } from "./types";
import worldContoursGeoJson from "./assets/world-contours.json";
import vegetationAtlasUrl from "./assets/vegetation/vegetation-atlas.png";

const RADIUS = 1;
const THEME_IDS: ThemeId[] = ["flowers", "fairy", "destinations"];
const AUTO_ROTATE_SPEED = 0.0009;
const AURORA_COLORS = ["#6df1d6", "#95f3ff", "#bd9dff", "#ff8fe8"];
const LAND_BASE_COLORS = ["#1b2b1e", "#243425", "#303927", "#3c3226"];
const LAND_CANOPY_COLORS = ["#5f9b59", "#7bb06b", "#8fc874", "#4f8450", "#92c27e"];
const LAND_BLOSSOM_COLORS = ["#ff9cb8", "#ffd286", "#c8a6ff", "#9de7ff", "#ffb08f"];

type PerformanceTier = "low" | "medium" | "high";

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

interface GuidedTourStep {
  regionId: RegionId;
  themes: ThemeId[];
  destinationId?: string;
}

interface CameraShotPreset {
  id: string;
  label: string;
  lat: number;
  lon: number;
  targetLat: number;
  targetLon: number;
  distance: number;
  fov: number;
  themes: ThemeId[];
}

interface LatLonPoint {
  lat: number;
  lon: number;
}

interface ContinentProfile {
  id: string;
  baseCount: number;
  outline: LatLonPoint[];
}

interface LandRuntime {
  group: THREE.Group;
  baseMaterial: THREE.PointsMaterial;
  canopyMaterial: THREE.PointsMaterial;
  tallCanopyMaterial: THREE.PointsMaterial;
  blossomMaterial: THREE.PointsMaterial;
  coastSprayMaterial: THREE.PointsMaterial;
  coastlineMaterials: THREE.LineBasicMaterial[];
  flowerSeeds: THREE.Vector3[];
}

interface VegetationRuntime {
  group: THREE.Group;
  sprites: THREE.Sprite[];
  spriteMaterials: THREE.SpriteMaterial[];
  baseScales: number[];
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: "Feature";
  properties?: {
    name?: string;
    sampleWeight?: number;
  };
  geometry: GeoJsonGeometry;
}

type GeoJsonGeometry =
  | {
      type: "Polygon";
      coordinates: number[][][];
    }
  | {
      type: "MultiPolygon";
      coordinates: number[][][][];
    };

interface OceanRuntime {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  uniforms: {
    uTime: { value: number };
    uDeepColor: { value: THREE.Color };
    uShallowColor: { value: THREE.Color };
    uRimColor: { value: THREE.Color };
    uLandMask: { value: THREE.Texture };
  };
}

interface HeightMapRuntime {
  width: number;
  height: number;
  values: Float32Array;
}

interface LookProfile {
  id: "baseline" | "target";
  exposure: number;
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: number;
  bloomish: number;
}

const TOUR_STEPS: GuidedTourStep[] = [
  { regionId: "europe", themes: ["flowers", "destinations"], destinationId: "tuscany" },
  { regionId: "east-asia", themes: ["flowers", "fairy"], destinationId: "kyoto" },
  { regionId: "south-asia", themes: ["flowers", "destinations"], destinationId: "kerala" },
  { regionId: "southeast-asia", themes: ["fairy", "destinations"], destinationId: "luang-prabang" },
  { regionId: "north-america", themes: ["flowers", "destinations"], destinationId: "banff" },
  { regionId: "south-america", themes: ["fairy", "destinations"], destinationId: "machu-picchu" },
  { regionId: "africa", themes: ["flowers", "destinations"], destinationId: "zanzibar" },
  { regionId: "oceania", themes: ["flowers", "fairy"], destinationId: "queenstown" }
];

const CAMERA_SHOTS: CameraShotPreset[] = [
  {
    id: "kf-01",
    label: "KF01 Asia Close",
    lat: 33,
    lon: 104,
    targetLat: 26,
    targetLon: 114,
    distance: 2.38,
    fov: 39,
    themes: ["flowers", "destinations"]
  },
  {
    id: "kf-08",
    label: "KF08 Atlantic Open",
    lat: 16,
    lon: -34,
    targetLat: 7,
    targetLon: -20,
    distance: 2.64,
    fov: 43,
    themes: ["flowers", "fairy"]
  },
  {
    id: "kf-13",
    label: "KF13 Pacific Arc",
    lat: 20,
    lon: 125,
    targetLat: 10,
    targetLon: 116,
    distance: 2.44,
    fov: 40,
    themes: ["fairy", "destinations"]
  },
  {
    id: "kf-17",
    label: "KF17 South America",
    lat: -20,
    lon: -58,
    targetLat: -18,
    targetLon: -66,
    distance: 2.5,
    fov: 41,
    themes: ["flowers", "fairy", "destinations"]
  }
];

const CONTINENT_PROFILES: ContinentProfile[] = [
  {
    id: "north-america",
    baseCount: 980,
    outline: [
      { lat: 72, lon: -168 },
      { lat: 74, lon: -150 },
      { lat: 70, lon: -130 },
      { lat: 62, lon: -123 },
      { lat: 55, lon: -130 },
      { lat: 50, lon: -124 },
      { lat: 47, lon: -117 },
      { lat: 45, lon: -111 },
      { lat: 41, lon: -106 },
      { lat: 29, lon: -97 },
      { lat: 20, lon: -103 },
      { lat: 15, lon: -90 },
      { lat: 23, lon: -82 },
      { lat: 31, lon: -77 },
      { lat: 41, lon: -66 },
      { lat: 52, lon: -60 },
      { lat: 60, lon: -72 },
      { lat: 68, lon: -95 },
      { lat: 73, lon: -125 }
    ]
  },
  {
    id: "south-america",
    baseCount: 720,
    outline: [
      { lat: 12, lon: -81 },
      { lat: 8, lon: -76 },
      { lat: 2, lon: -79 },
      { lat: -6, lon: -78 },
      { lat: -15, lon: -74 },
      { lat: -22, lon: -70 },
      { lat: -33, lon: -71 },
      { lat: -41, lon: -73 },
      { lat: -53, lon: -68 },
      { lat: -55, lon: -60 },
      { lat: -50, lon: -52 },
      { lat: -40, lon: -48 },
      { lat: -28, lon: -47 },
      { lat: -15, lon: -52 },
      { lat: -5, lon: -51 },
      { lat: 4, lon: -48 },
      { lat: 8, lon: -56 },
      { lat: 10, lon: -67 },
      { lat: 12, lon: -73 }
    ]
  },
  {
    id: "eurasia",
    baseCount: 1480,
    outline: [
      { lat: 72, lon: -10 },
      { lat: 68, lon: 8 },
      { lat: 63, lon: 25 },
      { lat: 58, lon: 40 },
      { lat: 56, lon: 60 },
      { lat: 58, lon: 82 },
      { lat: 62, lon: 102 },
      { lat: 67, lon: 122 },
      { lat: 62, lon: 150 },
      { lat: 55, lon: 168 },
      { lat: 48, lon: 150 },
      { lat: 42, lon: 132 },
      { lat: 32, lon: 122 },
      { lat: 22, lon: 114 },
      { lat: 15, lon: 108 },
      { lat: 10, lon: 104 },
      { lat: 8, lon: 97 },
      { lat: 12, lon: 90 },
      { lat: 20, lon: 78 },
      { lat: 24, lon: 66 },
      { lat: 30, lon: 57 },
      { lat: 33, lon: 47 },
      { lat: 38, lon: 35 },
      { lat: 42, lon: 26 },
      { lat: 45, lon: 16 },
      { lat: 48, lon: 8 },
      { lat: 52, lon: 2 },
      { lat: 58, lon: -2 },
      { lat: 66, lon: -8 }
    ]
  },
  {
    id: "africa",
    baseCount: 780,
    outline: [
      { lat: 37, lon: -17 },
      { lat: 34, lon: 4 },
      { lat: 32, lon: 18 },
      { lat: 31, lon: 32 },
      { lat: 27, lon: 36 },
      { lat: 20, lon: 44 },
      { lat: 11, lon: 51 },
      { lat: 3, lon: 49 },
      { lat: -5, lon: 42 },
      { lat: -12, lon: 43 },
      { lat: -20, lon: 45 },
      { lat: -31, lon: 35 },
      { lat: -34, lon: 20 },
      { lat: -35, lon: 10 },
      { lat: -30, lon: 2 },
      { lat: -20, lon: -5 },
      { lat: -10, lon: -7 },
      { lat: 2, lon: -10 },
      { lat: 12, lon: -16 },
      { lat: 24, lon: -16 }
    ]
  },
  {
    id: "oceania",
    baseCount: 480,
    outline: [
      { lat: -10, lon: 112 },
      { lat: -14, lon: 128 },
      { lat: -19, lon: 145 },
      { lat: -26, lon: 153 },
      { lat: -36, lon: 151 },
      { lat: -43, lon: 146 },
      { lat: -44, lon: 134 },
      { lat: -39, lon: 122 },
      { lat: -32, lon: 115 },
      { lat: -22, lon: 112 }
    ]
  },
  {
    id: "greenland",
    baseCount: 180,
    outline: [
      { lat: 83, lon: -73 },
      { lat: 81, lon: -45 },
      { lat: 76, lon: -25 },
      { lat: 70, lon: -23 },
      { lat: 62, lon: -39 },
      { lat: 60, lon: -48 },
      { lat: 63, lon: -58 },
      { lat: 68, lon: -65 },
      { lat: 75, lon: -71 }
    ]
  }
];

const GEOJSON_CONTOURS = buildContinentProfilesFromGeoJson(
  worldContoursGeoJson as GeoJsonFeatureCollection
);
const HEIGHT_MAP = createHeightMapRuntime(1024, 512, GEOJSON_CONTOURS);
const VEGETATION_VARIANT_URLS = Object.values(
  import.meta.glob("./assets/vegetation/variants/*.png", {
    eager: true,
    import: "default"
  }) as Record<string, string>
);
const LOOK_PROFILES: Record<LookProfile["id"], LookProfile> = {
  baseline: {
    id: "baseline",
    exposure: 1.03,
    contrast: 1.04,
    saturation: 0.94,
    warmth: 0.02,
    vignette: 0.08,
    bloomish: 0.08
  },
  target: {
    id: "target",
    exposure: 1.17,
    contrast: 1.16,
    saturation: 1.04,
    warmth: 0.09,
    vignette: 0.18,
    bloomish: 0.16
  }
};

export function bootstrap(root: HTMLDivElement): void {
  root.innerHTML = `
    <div id="app-shell" class="app-shell ui-collapsed">
      <canvas id="globe-canvas"></canvas>
      <button id="ui-mode" class="ui-mode-btn" type="button">UI</button>
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
        <button id="compare-mode" class="chip chip-shot" type="button">A/B: Target</button>
        <button id="cycle-shot" class="chip chip-shot" type="button">Next shot</button>
        <div id="info-card" class="info-card hidden">
          <h3 id="info-title"></h3>
          <p id="info-region"></p>
          <p id="info-tags"></p>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#globe-canvas");
  const appShell = root.querySelector<HTMLDivElement>("#app-shell");
  const uiModeButton = root.querySelector<HTMLButtonElement>("#ui-mode");
  const regionChips = root.querySelector<HTMLDivElement>("#region-chips");
  const themeChips = root.querySelector<HTMLDivElement>("#theme-chips");
  const intensitySlider = root.querySelector<HTMLInputElement>("#intensity");
  const autoRotateInput = root.querySelector<HTMLInputElement>("#auto-rotate");
  const guidedTourInput = root.querySelector<HTMLInputElement>("#guided-tour");
  const compareModeButton = root.querySelector<HTMLButtonElement>("#compare-mode");
  const cycleShotButton = root.querySelector<HTMLButtonElement>("#cycle-shot");
  const statusLine = root.querySelector<HTMLParagraphElement>("#status-line");
  const infoCard = root.querySelector<HTMLDivElement>("#info-card");
  const infoTitle = root.querySelector<HTMLHeadingElement>("#info-title");
  const infoRegion = root.querySelector<HTMLParagraphElement>("#info-region");
  const infoTags = root.querySelector<HTMLParagraphElement>("#info-tags");

  if (
    !canvas ||
    !appShell ||
    !uiModeButton ||
    !regionChips ||
    !themeChips ||
    !intensitySlider ||
    !autoRotateInput ||
    !guidedTourInput ||
    !compareModeButton ||
    !cycleShotButton ||
    !statusLine ||
    !infoCard ||
    !infoTitle ||
    !infoRegion ||
    !infoTags
  ) {
    throw new Error("UI nodes missing from DOM.");
  }
  const canvasNode = canvas;
  const appShellNode = appShell;
  const uiModeButtonNode = uiModeButton;
  const regionChipsNode = regionChips;
  const themeChipsNode = themeChips;
  const intensitySliderNode = intensitySlider;
  const autoRotateInputNode = autoRotateInput;
  const guidedTourInputNode = guidedTourInput;
  const compareModeButtonNode = compareModeButton;
  const cycleShotButtonNode = cycleShotButton;
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
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, tierValue(perfTier, 1.35, 1.7, 2))
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#050b13", 2.8, 8.4);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0.14, 0.42, 3.5);

  const controls = new OrbitControls(camera, canvasNode);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.7;
  controls.maxDistance = 5.6;
  controls.maxPolarAngle = Math.PI * 0.86;

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const colorGradePass = createColorGradePass();
  composer.addPass(renderPass);
  composer.addPass(colorGradePass);

  const ambient = new THREE.AmbientLight("#8eaed1", 0.32);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight("#f7fbff", "#1a2638", 0.8);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight("#ffe0b4", 1.08);
  keyLight.position.set(2.9, 1.9, 2.3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#6ca8ff", 0.68);
  fillLight.position.set(-2.4, -1.2, -1.9);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight("#8aa6ff", 0.34);
  rimLight.position.set(0.1, 0.3, -3.2);
  scene.add(rimLight);

  const stars = createStars(Math.floor(tierValue(perfTier, 520, 760, 980)));
  scene.add(stars);

  const planetGroup = new THREE.Group();
  scene.add(planetGroup);

  const contourProfiles = getContourProfilesByLod(perfTier);
  const oceanRuntime = createOceanRuntime(contourProfiles);
  planetGroup.add(oceanRuntime.mesh);

  const atmosphereInner = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.035, 64, 64),
    new THREE.MeshBasicMaterial({
      color: "#7caeff",
      transparent: true,
      opacity: 0.13,
      depthWrite: false
    })
  );
  planetGroup.add(atmosphereInner);

  const atmosphereOuter = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.105, 64, 64),
    new THREE.MeshBasicMaterial({
      color: "#8497ff",
      transparent: true,
      opacity: 0.17,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    })
  );
  planetGroup.add(atmosphereOuter);

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
  const auroraGroup = createAuroraBand(perfTier);
  const landRuntime = createLandCoverLayer(perfTier, contourProfiles);
  const plantTextures = createPlantSpriteTextures();
  const vegetationRuntime = createVegetationSpriteLayer(
    landRuntime.flowerSeeds,
    perfTier,
    plantTextures
  );
  planetGroup.add(landRuntime.group);
  planetGroup.add(vegetationRuntime.group);
  planetGroup.add(flowerGroup);
  planetGroup.add(fairyGroup);
  planetGroup.add(destinationGroup);
  planetGroup.add(routeGroup);
  planetGroup.add(auroraGroup);

  const regionCenters = new Map<RegionId, THREE.Vector3>();
  const regionFillMeshes = new Map<RegionId, THREE.Points>();
  const regionBorderMeshes = new Map<RegionId, THREE.LineLoop>();
  const regionHaloMeshes = new Map<RegionId, THREE.LineLoop>();
  const regionStrengths = new Map<RegionId, number>();

  REGIONS.forEach((region) => {
    const center = latLonToVector3(region.center.lat, region.center.lon, RADIUS + 0.004).normalize();
    regionCenters.set(region.id, center);
    regionStrengths.set(region.id, 0);

    const fill = createRegionFill(region, center, Math.floor(tierValue(perfTier, 96, 132, 170)));
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

  const flowerRuntime = createFlowerLayer(landRuntime.flowerSeeds, perfTier, plantTextures);
  flowerGroup.add(flowerRuntime.group);

  const fairyRuntime = createFairyLayer(perfTier);
  fairyGroup.add(fairyRuntime.group);

  let selectedRegion: RegionId = "europe";
  const activeThemes = new Set<ThemeId>(["flowers", "destinations"]);
  let intensity = Number(intensitySliderNode.value);
  let autoRotate = true;
  let guidedTour = false;
  let guidedTourIndex = 0;
  let shotIndex = -1;
  let shotLabel = "Free";
  let uiCollapsed = true;
  let compareMode: LookProfile["id"] = "target";
  let currentLook = LOOK_PROFILES.target;
  let lastGuideSwitch = performance.now();
  let focusAnimation: FocusAnimation | null = null;
  let smoothedFps = 60;
  let lastFrameTime = performance.now();
  let lastStatusRefresh = performance.now();

  let flowersWeight = 1;
  let fairyWeight = 1;
  let destinationsWeight = 1;

  renderRegionChips(regionChipsNode, selectedRegion, (regionId) => {
    if (guidedTour) {
      guidedTour = false;
      guidedTourInputNode.checked = false;
    }
    shotLabel = "Free";
    selectedRegion = regionId;
    focusRegion(regionId);
    updateChipsState(regionChipsNode, selectedRegion);
    hideInfo();
    updateStatusLine();
  });

  renderThemeChips(themeChipsNode, activeThemes, (themeId) => {
    if (guidedTour) {
      guidedTour = false;
      guidedTourInputNode.checked = false;
    }
    shotLabel = "Free";
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
    if (guidedTour) {
      guidedTourIndex = 0;
      applyGuidedStep(guidedTourIndex, true);
    } else {
      shotLabel = "Free";
      hideInfo();
    }
  });

  uiModeButtonNode.addEventListener("click", () => {
    uiCollapsed = !uiCollapsed;
    appShellNode.classList.toggle("ui-collapsed", uiCollapsed);
    uiModeButtonNode.textContent = uiCollapsed ? "UI" : "Hide";
  });

  compareModeButtonNode.addEventListener("click", () => {
    compareMode = compareMode === "target" ? "baseline" : "target";
    currentLook = LOOK_PROFILES[compareMode];
    compareModeButtonNode.textContent =
      compareMode === "target" ? "A/B: Target" : "A/B: Baseline";
  });

  cycleShotButtonNode.addEventListener("click", () => {
    if (guidedTour) {
      guidedTour = false;
      guidedTourInputNode.checked = false;
    }
    shotIndex = (shotIndex + 1) % CAMERA_SHOTS.length;
    const shot = CAMERA_SHOTS[shotIndex];
    shotLabel = shot.label;
    applyThemePreset(shot.themes);
    applyCameraShot(shot);
    hideInfo();
    updateStatusLine();
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
    const frameDelta = Math.max(now - lastFrameTime, 1);
    lastFrameTime = now;
    const rawFps = 1000 / frameDelta;
    smoothedFps = moveTowards(smoothedFps, rawFps, 0.08);
    oceanRuntime.uniforms.uTime.value = elapsed;

    if (autoRotate && !focusAnimation) {
      planetGroup.rotation.y += AUTO_ROTATE_SPEED;
    }

    if (guidedTour && now - lastGuideSwitch > 4200) {
      guidedTourIndex = (guidedTourIndex + 1) % TOUR_STEPS.length;
      applyGuidedStep(guidedTourIndex);
      lastGuideSwitch = now;
    }

    updateFocusAnimation(now);
    updateRegionVisuals(elapsed, intensity);
    updateThemeVisuals(elapsed, intensity);
    updateAuroraVisuals(elapsed, intensity);

    if (now - lastStatusRefresh > 320) {
      updateStatusLine();
      lastStatusRefresh = now;
    }

    renderer.toneMappingExposure = currentLook.exposure;
    colorGradePass.uniforms.uContrast.value = currentLook.contrast;
    colorGradePass.uniforms.uSaturation.value = currentLook.saturation;
    colorGradePass.uniforms.uWarmth.value = currentLook.warmth;
    colorGradePass.uniforms.uVignette.value = currentLook.vignette;
    colorGradePass.uniforms.uBloomish.value = currentLook.bloomish;

    controls.update();
    composer.render();
  });

  function handleDestinationSelect(destination: Destination): void {
    if (guidedTour) {
      guidedTour = false;
      guidedTourInputNode.checked = false;
    }
    shotLabel = "Free";
    selectedRegion = destination.regionId;
    updateChipsState(regionChipsNode, selectedRegion);
    showDestinationInfo(destination);
    focusDestination(destination);
    updateStatusLine();
  }

  function applyThemePreset(themes: ThemeId[]): void {
    activeThemes.clear();
    themes.forEach((theme) => activeThemes.add(theme));
    updateThemeChipState(themeChipsNode, activeThemes);
  }

  function applyGuidedStep(stepIndex: number, immediate = false): void {
    const step = TOUR_STEPS[stepIndex];
    shotLabel = `Guide ${stepIndex + 1}`;
    selectedRegion = step.regionId;
    updateChipsState(regionChipsNode, selectedRegion);
    applyThemePreset(step.themes);

    if (step.destinationId) {
      const destination = DESTINATIONS.find((item) => item.id === step.destinationId);
      if (destination) {
        showDestinationInfo(destination);
        if (immediate) {
          focusRegion(step.regionId, true);
        } else {
          focusDestination(destination);
        }
        updateStatusLine();
        return;
      }
    }
    hideInfo();
    focusRegion(step.regionId, immediate);
    updateStatusLine();
  }

  function applyCameraShot(shot: CameraShotPreset): void {
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    const localPoint = latLonToVector3(shot.lat, shot.lon, RADIUS + 0.01);
    const worldPoint = getWorldPoint(localPoint);
    const localTargetPoint = latLonToVector3(shot.targetLat, shot.targetLon, RADIUS + 0.01);
    const worldTargetPoint = getWorldPoint(localTargetPoint);
    const cameraPoint = worldPoint
      .clone()
      .multiplyScalar(shot.distance + 0.08)
      .add(new THREE.Vector3(0, 0.06, 0));
    const lookTarget = worldTargetPoint.clone().multiplyScalar(0.52);
    startFocusAnimation(cameraPoint, lookTarget);
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
    const perfText = perfTier === "low" ? "Low" : perfTier === "medium" ? "Medium" : "High";
    const abText = compareMode === "target" ? "Target" : "Baseline";
    statusLineNode.textContent = `${region?.label ?? selectedRegion} | Themes: ${themeText} | Shot ${shotLabel} | A/B ${abText} | FPS ${Math.round(smoothedFps)} | Perf ${perfText}`;
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
    camera.fov = 42;
    camera.updateProjectionMatrix();
    const worldPoint = getWorldPoint(center);
    const distance = 2.45 + region.radiusDeg * 0.01;
    const cameraPoint = worldPoint.clone().multiplyScalar(distance).add(new THREE.Vector3(0, 0.06, 0));
    const lookTarget = worldPoint.clone().multiplyScalar(0.2);
    startFocusAnimation(cameraPoint, lookTarget, immediate);
  }

  function focusDestination(destination: Destination): void {
    camera.fov = 41;
    camera.updateProjectionMatrix();
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
    composer.setSize(width, height);
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
    const lookDensity = compareMode === "target" ? 1 : 0.72;
    const intensityFactor = (0.55 + clampedIntensity * 0.45) * lookDensity;

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

    landRuntime.baseMaterial.opacity = (0.5 + 0.18 * intensityFactor) * 0.82;
    landRuntime.baseMaterial.size = 0.02 + clampedIntensity * 0.007;
    landRuntime.canopyMaterial.opacity = (0.24 + 0.42 * flowersWeight) * intensityFactor;
    landRuntime.canopyMaterial.size = 0.021 + clampedIntensity * 0.012;
    landRuntime.tallCanopyMaterial.opacity = (0.12 + 0.35 * flowersWeight) * (0.7 + intensityFactor * 0.28);
    landRuntime.tallCanopyMaterial.size = 0.028 + clampedIntensity * 0.017;
    landRuntime.blossomMaterial.opacity = (0.05 + 0.46 * flowersWeight) * intensityFactor;
    landRuntime.blossomMaterial.size = 0.025 + clampedIntensity * 0.014;
    landRuntime.coastSprayMaterial.opacity = (0.12 + 0.2 * flowersWeight) * (0.6 + intensityFactor * 0.35);
    landRuntime.coastSprayMaterial.size = 0.018 + clampedIntensity * 0.006;
    landRuntime.coastlineMaterials.forEach((material) => {
      material.opacity = 0.06 + intensityFactor * 0.1;
    });

    vegetationRuntime.group.visible = flowersWeight > 0.015;
    vegetationRuntime.sprites.forEach((sprite, index) => {
      const material = sprite.material as THREE.SpriteMaterial;
      material.opacity = (0.08 + 0.84 * flowersWeight) * (0.6 + intensityFactor * 0.4);
      const sway = 0.92 + 0.08 * Math.sin(elapsed * 1.1 + index * 0.13);
      const scale = vegetationRuntime.baseScales[index] * (0.7 + clampedIntensity * 0.35) * sway;
      sprite.scale.setScalar(scale);
    });
  }

  function updateAuroraVisuals(elapsed: number, intensityValue: number): void {
    const clampedIntensity = THREE.MathUtils.clamp(intensityValue, 0.4, 1.8);
    auroraGroup.children.forEach((child, index) => {
      const line = child as THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      const pulse = 0.52 + 0.48 * Math.sin(elapsed * (0.85 + index * 0.07) + index);
      line.material.opacity = (0.09 + pulse * 0.2) * (0.65 + clampedIntensity * 0.25);
    });
    auroraGroup.rotation.y += 0.0004;
  }
}

function detectPerformanceTier(): PerformanceTier {
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (window.innerWidth < 820 || deviceMemory < 4 || cores <= 4) {
    return "low";
  }
  if (window.innerWidth < 1320 || deviceMemory < 8 || cores <= 8) {
    return "medium";
  }
  return "high";
}

function moveTowards(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function tierValue(
  perfTier: PerformanceTier,
  low: number,
  medium: number,
  high: number
): number {
  if (perfTier === "low") {
    return low;
  }
  if (perfTier === "medium") {
    return medium;
  }
  return high;
}

function createColorGradePass(): ShaderPass {
  const shader = {
    uniforms: {
      tDiffuse: { value: null },
      uContrast: { value: 1.16 },
      uSaturation: { value: 1.04 },
      uWarmth: { value: 0.09 },
      uVignette: { value: 0.18 },
      uBloomish: { value: 0.16 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uContrast;
      uniform float uSaturation;
      uniform float uWarmth;
      uniform float uVignette;
      uniform float uBloomish;
      varying vec2 vUv;

      vec3 applySaturation(vec3 color, float sat) {
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        return mix(vec3(luma), color, sat);
      }

      void main() {
        vec4 src = texture2D(tDiffuse, vUv);
        vec3 color = src.rgb;

        color = (color - 0.5) * uContrast + 0.5;
        color = applySaturation(color, uSaturation);
        color.r += uWarmth * 0.25;
        color.b -= uWarmth * 0.18;

        vec2 centered = vUv * 2.0 - 1.0;
        float vignette = 1.0 - dot(centered, centered) * uVignette * 0.33;
        color *= clamp(vignette, 0.72, 1.0);

        float glow = smoothstep(0.55, 1.0, max(max(color.r, color.g), color.b));
        color += glow * uBloomish * 0.12;

        gl_FragColor = vec4(color, src.a);
      }
    `
  };

  return new ShaderPass(shader);
}

function terrainElevation(lat: number, lon: number): number {
  return sampleHeightMap(HEIGHT_MAP, lat, lon);
}

function createHeightMapRuntime(
  width: number,
  height: number,
  profiles: ContinentProfile[]
): HeightMapRuntime {
  const values = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const lat = 90 - (y / (height - 1)) * 180;
    for (let x = 0; x < width; x += 1) {
      const lon = (x / (width - 1)) * 360 - 180;
      const land = isPointInAnyProfile(lat, lon, profiles) ? 1 : 0;
      const n1 = Math.sin((lon * 0.09 + lat * 0.13) * Math.PI / 180);
      const n2 = Math.sin((lon * 0.21 - lat * 0.16) * Math.PI / 180);
      const n3 = Math.sin((lon * 0.41 + lat * 0.37) * Math.PI / 180);
      const noise = (n1 * 0.45 + n2 * 0.35 + n3 * 0.2) * 0.5 + 0.5;
      const ridge = Math.pow(noise, 1.8);
      const elevation = land > 0 ? (0.002 + ridge * 0.016) : 0;
      values[y * width + x] = elevation;
    }
  }
  return { width, height, values };
}

function sampleHeightMap(map: HeightMapRuntime, lat: number, lon: number): number {
  const u = (normalizeLongitude(lon) + 180) / 360;
  const v = (90 - lat) / 180;
  const x = THREE.MathUtils.clamp(u * (map.width - 1), 0, map.width - 1);
  const y = THREE.MathUtils.clamp(v * (map.height - 1), 0, map.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, map.width - 1);
  const y1 = Math.min(y0 + 1, map.height - 1);
  const tx = x - x0;
  const ty = y - y0;
  const v00 = map.values[y0 * map.width + x0];
  const v10 = map.values[y0 * map.width + x1];
  const v01 = map.values[y1 * map.width + x0];
  const v11 = map.values[y1 * map.width + x1];
  const top = THREE.MathUtils.lerp(v00, v10, tx);
  const bottom = THREE.MathUtils.lerp(v01, v11, tx);
  return THREE.MathUtils.lerp(top, bottom, ty);
}

function isPointInAnyProfile(
  lat: number,
  lon: number,
  profiles: ContinentProfile[]
): boolean {
  const point: LatLonPoint = { lat, lon };
  for (let i = 0; i < profiles.length; i += 1) {
    if (isPointInPolygon(point, profiles[i].outline)) {
      return true;
    }
  }
  return false;
}

function createOceanRuntime(profiles: ContinentProfile[]): OceanRuntime {
  const landMaskTexture = createLandMaskTexture(profiles, 1024, 512);
  const uniforms = {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color("#030f1d") },
    uShallowColor: { value: new THREE.Color("#0a2d41") },
    uRimColor: { value: new THREE.Color("#6ea5ff") },
    uLandMask: { value: landMaskTexture }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: false,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vNormalW = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uRimColor;
      uniform sampler2D uLandMask;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(normalize(vNormalW), viewDir), 0.0), 2.6);
        float latBand = smoothstep(0.05, 0.82, abs(vUv.y - 0.5) * 2.0);
        float landMask = texture2D(uLandMask, vec2(vUv.x, vUv.y)).r;
        float coast = smoothstep(0.28, 0.66, landMask);
        float wave =
          sin((vUv.x + uTime * 0.012) * 46.0) * 0.5 +
          sin((vUv.y - uTime * 0.01) * 62.0) * 0.5 +
          sin((vUv.x * 2.4 - vUv.y * 1.8 + uTime * 0.015) * 33.0) * 0.35;
        float waveMask = 0.03 * wave;
        vec3 base = mix(uShallowColor, uDeepColor, latBand);
        base += waveMask;
        base = mix(base, uShallowColor + vec3(0.05, 0.06, 0.08), coast * 0.52);
        vec3 color = mix(base, uRimColor, fresnel * (0.38 + coast * 0.18));
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 96), material);
  return { mesh, uniforms };
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
  flowerSeeds: THREE.Vector3[],
  perfTier: PerformanceTier,
  plantTextures: THREE.Texture[]
): {
  group: THREE.Group;
  layers: Array<{ material: THREE.PointsMaterial; baseOpacity: number; baseSize: number }>;
} {
  const group = new THREE.Group();
  const layers: Array<{ material: THREE.PointsMaterial; baseOpacity: number; baseSize: number }> = [];
  const seedStep = Math.floor(tierValue(perfTier, 7, 5, 4));
  const sampleSeeds = flowerSeeds.length > 0 ? flowerSeeds : [new THREE.Vector3(0, 1, 0)];
  const smallPalette = ["#ffd88b", "#ff9fc2", "#f7f4bd", "#9fe6ff", "#ffb37c"];
  const largePalette = ["#ffc985", "#ffb8d1", "#cdb4ff", "#89d8a5"];
  const leafTexture = plantTextures[0] ?? createLeafSpriteTexture();
  const flowerTexture = plantTextures[1] ?? createFlowerSpriteTexture();

  const smallPositions: number[] = [];
  const smallColors: number[] = [];
  const largePositions: number[] = [];
  const largeColors: number[] = [];

  for (let i = 0; i < sampleSeeds.length; i += seedStep) {
    const seed = sampleSeeds[i].clone().normalize();
    const clusterCount = Math.round(tierValue(perfTier, 2, 3, 3));
    for (let c = 0; c < clusterCount; c += 1) {
      const smallPoint = randomPointInCap(seed, 1.3 + Math.random() * 0.9, RADIUS + 0.015);
      smallPositions.push(smallPoint.x, smallPoint.y, smallPoint.z);
      const smallColor = new THREE.Color(smallPalette[(i + c) % smallPalette.length]);
      smallColors.push(smallColor.r, smallColor.g, smallColor.b);

      if (Math.random() < 0.74) {
        const largePoint = randomPointInCap(seed, 2 + Math.random() * 1.3, RADIUS + 0.018);
        largePositions.push(largePoint.x, largePoint.y, largePoint.z);
        const largeColor = new THREE.Color(largePalette[(i + c) % largePalette.length]);
        largeColors.push(largeColor.r, largeColor.g, largeColor.b);
      }
    }
  }

  const smallGeometry = new THREE.BufferGeometry();
  smallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(smallPositions, 3));
  smallGeometry.setAttribute("color", new THREE.Float32BufferAttribute(smallColors, 3));
  const smallMaterial = new THREE.PointsMaterial({
    size: 0.024,
    vertexColors: true,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    map: leafTexture,
    alphaMap: leafTexture,
    alphaTest: 0.24
  });
  group.add(new THREE.Points(smallGeometry, smallMaterial));
  layers.push({ material: smallMaterial, baseOpacity: 0.36, baseSize: 0.024 });

  const largeGeometry = new THREE.BufferGeometry();
  largeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(largePositions, 3));
  largeGeometry.setAttribute("color", new THREE.Float32BufferAttribute(largeColors, 3));
  const largeMaterial = new THREE.PointsMaterial({
    size: 0.034,
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    map: flowerTexture,
    alphaMap: flowerTexture,
    alphaTest: 0.21
  });
  group.add(new THREE.Points(largeGeometry, largeMaterial));
  layers.push({ material: largeMaterial, baseOpacity: 0.25, baseSize: 0.034 });

  return { group, layers };
}

function createVegetationSpriteLayer(
  flowerSeeds: THREE.Vector3[],
  perfTier: PerformanceTier,
  plantTextures: THREE.Texture[]
): VegetationRuntime {
  const group = new THREE.Group();
  const spriteTextures = plantTextures.length > 0 ? plantTextures : createPlantSpriteTextures();
  const budget = Math.floor(tierValue(perfTier, 210, 320, 430));
  const seedStep = Math.max(1, Math.floor(flowerSeeds.length / budget));
  const seeds = flowerSeeds.length > 0 ? flowerSeeds : [new THREE.Vector3(0, 1, 0)];
  const sprites: THREE.Sprite[] = [];
  const spriteMaterials: THREE.SpriteMaterial[] = [];
  const baseScales: number[] = [];

  for (let i = 0, created = 0; i < seeds.length && created < budget; i += seedStep) {
    const seed = seeds[i].clone().normalize();
    const texture = spriteTextures[(created + i) % spriteTextures.length];
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      color: new THREE.Color().setHSL(
        0.26 + Math.random() * 0.12,
        0.32 + Math.random() * 0.22,
        0.64 + Math.random() * 0.16
      )
    });
    const sprite = new THREE.Sprite(material);
    const spread = tierValue(perfTier, 1.3, 1.5, 1.7);
    const pos = randomPointInCap(seed, spread, RADIUS + THREE.MathUtils.randFloat(0.018, 0.042));
    sprite.position.copy(pos);
    const baseScale = THREE.MathUtils.randFloat(0.03, 0.07);
    sprite.scale.setScalar(baseScale);
    group.add(sprite);
    sprites.push(sprite);
    spriteMaterials.push(material);
    baseScales.push(baseScale);
    created += 1;
  }

  return {
    group,
    sprites,
    spriteMaterials,
    baseScales
  };
}

function createLandCoverLayer(
  perfTier: PerformanceTier,
  contourProfiles: ContinentProfile[]
): LandRuntime {
  const group = new THREE.Group();
  const budgetMultiplier = tierValue(perfTier, 0.56, 0.78, 1);
  const profiles = contourProfiles.length > 0 ? contourProfiles : CONTINENT_PROFILES;
  const basePositions: number[] = [];
  const baseColors: number[] = [];
  const canopyPositions: number[] = [];
  const canopyColors: number[] = [];
  const tallCanopyPositions: number[] = [];
  const tallCanopyColors: number[] = [];
  const blossomPositions: number[] = [];
  const blossomColors: number[] = [];
  const coastSprayPositions: number[] = [];
  const coastSprayColors: number[] = [];
  const coastlineMaterials: THREE.LineBasicMaterial[] = [];
  const flowerSeeds: THREE.Vector3[] = [];

  profiles.forEach((profile) => {
    const sampleCount = Math.floor(profile.baseCount * budgetMultiplier);
    const sampled = samplePointsInPolygon(profile.outline, sampleCount);
    sampled.forEach((point, index) => {
      const landElevation = terrainElevation(point.lat, point.lon);
      const landPoint = latLonToVector3(
        point.lat,
        point.lon,
        RADIUS + THREE.MathUtils.randFloat(0.002, 0.005) + landElevation
      );
      pushPointWithColor(basePositions, baseColors, landPoint, LAND_BASE_COLORS[index % LAND_BASE_COLORS.length]);

      const canopyCluster = Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < canopyCluster; i += 1) {
        const canopyLatLon = jitterLatLon(point, 0.85);
        const canopyElevation = terrainElevation(canopyLatLon.lat, canopyLatLon.lon);
        const canopyPoint = latLonToVector3(
          canopyLatLon.lat,
          canopyLatLon.lon,
          RADIUS + THREE.MathUtils.randFloat(0.006, 0.014) + canopyElevation
        );
        pushPointWithColor(
          canopyPositions,
          canopyColors,
          canopyPoint,
          LAND_CANOPY_COLORS[(index + i) % LAND_CANOPY_COLORS.length]
        );

        if (Math.random() < 0.34) {
          const tallLatLon = jitterLatLon(point, 0.7);
          const tallElevation = terrainElevation(tallLatLon.lat, tallLatLon.lon);
          const tallPoint = latLonToVector3(
            tallLatLon.lat,
            tallLatLon.lon,
            RADIUS + THREE.MathUtils.randFloat(0.016, 0.03) + tallElevation
          );
          pushPointWithColor(
            tallCanopyPositions,
            tallCanopyColors,
            tallPoint,
            LAND_CANOPY_COLORS[(index + i + 1) % LAND_CANOPY_COLORS.length]
          );
        }

        if (Math.random() < 0.52) {
          const blossomLatLon = jitterLatLon(point, 0.75);
          const blossomElevation = terrainElevation(blossomLatLon.lat, blossomLatLon.lon);
          const blossomPoint = latLonToVector3(
            blossomLatLon.lat,
            blossomLatLon.lon,
            RADIUS + THREE.MathUtils.randFloat(0.011, 0.02) + blossomElevation
          );
          pushPointWithColor(
            blossomPositions,
            blossomColors,
            blossomPoint,
            LAND_BLOSSOM_COLORS[(index + i) % LAND_BLOSSOM_COLORS.length]
          );
        }
      }

      if (Math.random() < 0.2) {
        flowerSeeds.push(latLonToVector3(point.lat, point.lon, RADIUS + 0.01).normalize());
      }
    });

    const coastlinePoints = profile.outline.map((point) =>
      latLonToVector3(point.lat, point.lon, RADIUS + 0.008)
    );
    coastlinePoints.push(coastlinePoints[0].clone());
    const coastlineMaterial = new THREE.LineBasicMaterial({
      color: "#5ca6bc",
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    coastlineMaterials.push(coastlineMaterial);
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(coastlinePoints),
        coastlineMaterial
      )
    );

    const sprayPerEdge = Math.floor(tierValue(perfTier, 7, 9, 11));
    for (let i = 0; i < profile.outline.length; i += 1) {
      const current = profile.outline[i];
      const next = profile.outline[(i + 1) % profile.outline.length];
      for (let s = 0; s < sprayPerEdge; s += 1) {
        const t = s / sprayPerEdge;
        const lat = THREE.MathUtils.lerp(current.lat, next.lat, t);
        const lon = THREE.MathUtils.lerp(current.lon, next.lon, t);
        const sprayPoint = jitterLatLon({ lat, lon }, 0.75 + Math.random() * 0.85);
        const sprayVector = latLonToVector3(
          sprayPoint.lat,
          sprayPoint.lon,
          RADIUS + THREE.MathUtils.randFloat(0.006, 0.018)
        );
        pushPointWithColor(
          coastSprayPositions,
          coastSprayColors,
          sprayVector,
          Math.random() < 0.55 ? "#143545" : "#0e2633"
        );
      }
    }
  });

  const baseGeometry = new THREE.BufferGeometry();
  baseGeometry.setAttribute("position", new THREE.Float32BufferAttribute(basePositions, 3));
  baseGeometry.setAttribute("color", new THREE.Float32BufferAttribute(baseColors, 3));
  const baseMaterial = new THREE.PointsMaterial({
    size: 0.025,
    vertexColors: true,
    transparent: true,
    opacity: 0.56,
    depthWrite: false
  });
  group.add(new THREE.Points(baseGeometry, baseMaterial));

  const canopyGeometry = new THREE.BufferGeometry();
  canopyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(canopyPositions, 3));
  canopyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(canopyColors, 3));
  const canopyMaterial = new THREE.PointsMaterial({
    size: 0.026,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  group.add(new THREE.Points(canopyGeometry, canopyMaterial));

  const tallCanopyGeometry = new THREE.BufferGeometry();
  tallCanopyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(tallCanopyPositions, 3));
  tallCanopyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(tallCanopyColors, 3));
  const tallCanopyMaterial = new THREE.PointsMaterial({
    size: 0.034,
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  group.add(new THREE.Points(tallCanopyGeometry, tallCanopyMaterial));

  const blossomGeometry = new THREE.BufferGeometry();
  blossomGeometry.setAttribute("position", new THREE.Float32BufferAttribute(blossomPositions, 3));
  blossomGeometry.setAttribute("color", new THREE.Float32BufferAttribute(blossomColors, 3));
  const blossomMaterial = new THREE.PointsMaterial({
    size: 0.031,
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });
  group.add(new THREE.Points(blossomGeometry, blossomMaterial));

  const coastSprayGeometry = new THREE.BufferGeometry();
  coastSprayGeometry.setAttribute("position", new THREE.Float32BufferAttribute(coastSprayPositions, 3));
  coastSprayGeometry.setAttribute("color", new THREE.Float32BufferAttribute(coastSprayColors, 3));
  const coastSprayMaterial = new THREE.PointsMaterial({
    size: 0.02,
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });
  group.add(new THREE.Points(coastSprayGeometry, coastSprayMaterial));

  return {
    group,
    baseMaterial,
    canopyMaterial,
    tallCanopyMaterial,
    blossomMaterial,
    coastSprayMaterial,
    coastlineMaterials,
    flowerSeeds
  };
}

function buildContinentProfilesFromGeoJson(
  collection: GeoJsonFeatureCollection
): ContinentProfile[] {
  const profiles: ContinentProfile[] = [];

  collection.features.forEach((feature, featureIndex) => {
    const name = feature.properties?.name ?? `feature-${featureIndex}`;
    const weight = feature.properties?.sampleWeight ?? 1;
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    polygons.forEach((polygon, polygonIndex) => {
      const outerRing = polygon[0];
      if (!outerRing || outerRing.length < 4) {
        return;
      }
      const outline: LatLonPoint[] = outerRing.map((pair) => ({
        lon: normalizeLongitude(pair[0]),
        lat: THREE.MathUtils.clamp(pair[1], -85, 85)
      }));

      const area = Math.abs(planarRingArea(outerRing));
      const baseCount = Math.max(90, Math.floor(area * weight * 0.58));

      profiles.push({
        id: `${name}-${polygonIndex}`,
        baseCount,
        outline
      });
    });
  });

  return profiles;
}

function getContourProfilesByLod(perfTier: PerformanceTier): ContinentProfile[] {
  const source = GEOJSON_CONTOURS.length > 0 ? GEOJSON_CONTOURS : CONTINENT_PROFILES;
  const step = Math.floor(tierValue(perfTier, 4, 2, 1));
  const countScale = tierValue(perfTier, 0.55, 0.78, 1);
  return source.map((profile) => ({
    id: profile.id,
    baseCount: Math.max(60, Math.floor(profile.baseCount * countScale)),
    outline: simplifyOutline(profile.outline, step)
  }));
}

function simplifyOutline(outline: LatLonPoint[], step: number): LatLonPoint[] {
  if (step <= 1 || outline.length < 8) {
    return outline;
  }
  const simplified: LatLonPoint[] = [];
  for (let i = 0; i < outline.length; i += step) {
    simplified.push(outline[i]);
  }
  if (simplified.length > 0 && (simplified[0].lat !== simplified[simplified.length - 1].lat ||
      simplified[0].lon !== simplified[simplified.length - 1].lon)) {
    simplified.push(simplified[0]);
  }
  return simplified.length >= 4 ? simplified : outline;
}

function createLandMaskTexture(
  profiles: ContinentProfile[],
  width: number,
  height: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create land mask context.");
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  profiles.forEach((profile) => {
    if (profile.outline.length < 4) {
      return;
    }
    ctx.beginPath();
    profile.outline.forEach((point, index) => {
      const x = ((normalizeLongitude(point.lon) + 180) / 360) * width;
      const y = ((90 - point.lat) / 180) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function planarRingArea(ring: number[][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum * 0.5;
}

function samplePointsInPolygon(polygon: LatLonPoint[], count: number): LatLonPoint[] {
  const result: LatLonPoint[] = [];
  const bounds = getPolygonBounds(polygon);
  let attempts = 0;
  const maxAttempts = Math.max(count * 90, 800);

  while (result.length < count && attempts < maxAttempts) {
    attempts += 1;
    const candidate: LatLonPoint = {
      lat: THREE.MathUtils.randFloat(bounds.minLat, bounds.maxLat),
      lon: THREE.MathUtils.randFloat(bounds.minLon, bounds.maxLon)
    };
    if (isPointInPolygon(candidate, polygon)) {
      result.push(candidate);
    }
  }

  if (result.length < count) {
    for (let i = result.length; i < count; i += 1) {
      const fallback = polygon[i % polygon.length];
      result.push(jitterLatLon(fallback, 0.9));
    }
  }

  return result;
}

function getPolygonBounds(polygon: LatLonPoint[]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  polygon.forEach((point) => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  });
  return { minLat, maxLat, minLon, maxLon };
}

function isPointInPolygon(point: LatLonPoint, polygon: LatLonPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].lon;
    const yi = polygon[i].lat;
    const xj = polygon[j].lon;
    const yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function jitterLatLon(point: LatLonPoint, spreadDeg: number): LatLonPoint {
  const lat = THREE.MathUtils.clamp(
    point.lat + THREE.MathUtils.randFloatSpread(spreadDeg * 2),
    -85,
    85
  );
  const lon = point.lon + THREE.MathUtils.randFloatSpread(spreadDeg * 2);
  return { lat, lon: normalizeLongitude(lon) };
}

function normalizeLongitude(lon: number): number {
  let normalized = lon;
  while (normalized > 180) {
    normalized -= 360;
  }
  while (normalized < -180) {
    normalized += 360;
  }
  return normalized;
}

function pushPointWithColor(
  positions: number[],
  colors: number[],
  point: THREE.Vector3,
  colorHex: string
): void {
  positions.push(point.x, point.y, point.z);
  const color = new THREE.Color(colorHex);
  colors.push(color.r, color.g, color.b);
}

function createPlantSpriteTextures(): THREE.Texture[] {
  const loader = new THREE.TextureLoader();
  const variantTextures = VEGETATION_VARIANT_URLS.map((url) => {
    const texture = loader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  });
  try {
    const atlas = loader.load(vegetationAtlasUrl);
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.wrapS = THREE.ClampToEdgeWrapping;
    atlas.wrapT = THREE.ClampToEdgeWrapping;
    atlas.flipY = false;
    const atlasTiles = [
      createAtlasTileTexture(atlas, 0, 0, 4, 4),
      createAtlasTileTexture(atlas, 1, 0, 4, 4),
      createAtlasTileTexture(atlas, 2, 0, 4, 4),
      createAtlasTileTexture(atlas, 3, 0, 4, 4),
      createAtlasTileTexture(atlas, 0, 1, 4, 4),
      createAtlasTileTexture(atlas, 1, 1, 4, 4)
    ];
    return [...atlasTiles, ...variantTextures];
  } catch {
    return [
      createLeafSpriteTexture(),
      createFlowerSpriteTexture(),
      createBushSpriteTexture(),
      createTreeSpriteTexture(),
      createWildFlowerSpriteTexture(),
      ...variantTextures
    ];
  }
}

function createAtlasTileTexture(
  atlas: THREE.Texture,
  tileX: number,
  tileY: number,
  columns: number,
  rows: number
): THREE.Texture {
  const texture = atlas.clone();
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(1 / columns, 1 / rows);
  texture.offset.set(tileX / columns, 1 - (tileY + 1) / rows);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createLeafSpriteTexture(): THREE.CanvasTexture {
  return createSpriteTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.ellipse(size * 0.5, size * 0.48, size * 0.25, size * 0.35, Math.PI * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(size * 0.47, size * 0.45, size * 0.12, size * 0.2, Math.PI * 0.08, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createBushSpriteTexture(): THREE.CanvasTexture {
  return createSpriteTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    const circles = [
      [0.34, 0.57, 0.2],
      [0.5, 0.48, 0.26],
      [0.68, 0.56, 0.2],
      [0.5, 0.68, 0.22]
    ];
    circles.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(size * x, size * y, size * r, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function createTreeSpriteTexture(): THREE.CanvasTexture {
  return createSpriteTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.fillRect(size * 0.45, size * 0.62, size * 0.1, size * 0.28);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.16);
    ctx.lineTo(size * 0.24, size * 0.62);
    ctx.lineTo(size * 0.76, size * 0.62);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.29);
    ctx.lineTo(size * 0.3, size * 0.67);
    ctx.lineTo(size * 0.7, size * 0.67);
    ctx.closePath();
    ctx.fill();
  });
}

function createWildFlowerSpriteTexture(): THREE.CanvasTexture {
  return createSpriteTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      const x = size * 0.5 + Math.cos(angle) * size * 0.2;
      const y = size * 0.5 + Math.sin(angle) * size * 0.2;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.14, size * 0.1, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createFlowerSpriteTexture(): THREE.CanvasTexture {
  return createSpriteTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const centerX = size * 0.5;
    const centerY = size * 0.5;
    const petalRadius = size * 0.17;
    const ringRadius = size * 0.2;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;
      ctx.beginPath();
      ctx.arc(x, y, petalRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createSpriteTexture(
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void
): THREE.CanvasTexture {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create sprite texture context.");
  }
  drawFn(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFairyLayer(perfTier: PerformanceTier): {
  group: THREE.Group;
  pointMaterial: THREE.PointsMaterial;
  trails: FairyTrail[];
} {
  const group = new THREE.Group();

  const pointCount = Math.floor(tierValue(perfTier, 210, 320, 460));
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

  const trailCount = Math.floor(tierValue(perfTier, 7, 9, 12));
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
      emissiveIntensity: 0.9,
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
    new THREE.SphereGeometry(0.027, 12, 12),
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

function createAuroraBand(perfTier: PerformanceTier): THREE.Group {
  const group = new THREE.Group();
  const layers = Math.floor(tierValue(perfTier, 3, 4, 5));
  for (let layer = 0; layer < layers; layer += 1) {
    const points: THREE.Vector3[] = [];
    const lat = 67 + layer * 2.3;
    const segments = 170;
    const radiusOffset = 0.1 + layer * 0.01;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const lon = -180 + t * 360;
      const waveLat = lat + Math.sin(t * Math.PI * (2.2 + layer * 0.2)) * (2.5 + layer * 0.45);
      points.push(latLonToVector3(waveLat, lon, RADIUS + radiusOffset));
    }
    const color = AURORA_COLORS[layer % AURORA_COLORS.length];
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    group.add(line);
  }
  return group;
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
