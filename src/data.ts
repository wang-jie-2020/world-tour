import type {
  Destination,
  NarrativeNodeConfig,
  Region,
  StoryConfig,
  ThemeConfig,
  ThemeId
} from "./types";

export const REGIONS: Region[] = [
  {
    id: "europe",
    label: "Europe",
    color: "#8ad18f",
    center: { lat: 52, lon: 13 },
    radiusDeg: 20
  },
  {
    id: "east-asia",
    label: "East Asia",
    color: "#7cc8ff",
    center: { lat: 35, lon: 115 },
    radiusDeg: 18
  },
  {
    id: "south-asia",
    label: "South Asia",
    color: "#f2c879",
    center: { lat: 20, lon: 78 },
    radiusDeg: 18
  },
  {
    id: "southeast-asia",
    label: "Southeast Asia",
    color: "#f4a7b2",
    center: { lat: 8, lon: 104 },
    radiusDeg: 16
  },
  {
    id: "north-america",
    label: "North America",
    color: "#7fdcbe",
    center: { lat: 44, lon: -102 },
    radiusDeg: 24
  },
  {
    id: "south-america",
    label: "South America",
    color: "#f0b972",
    center: { lat: -15, lon: -62 },
    radiusDeg: 22
  },
  {
    id: "africa",
    label: "Africa",
    color: "#d8c27a",
    center: { lat: 3, lon: 20 },
    radiusDeg: 22
  },
  {
    id: "oceania",
    label: "Oceania",
    color: "#94b7ff",
    center: { lat: -24, lon: 134 },
    radiusDeg: 20
  }
];

const BASE_THEMES: ThemeConfig[] = [
  {
    id: "flowers",
    label: "Flowers",
    enabledByDefault: true,
    stackable: true,
    renderProfile: {
      opacityScale: 1,
      sizeScale: 1
    }
  },
  {
    id: "fairy",
    label: "Fairy",
    enabledByDefault: false,
    stackable: true,
    renderProfile: {
      opacityScale: 1,
      trailOpacityScale: 1,
      rotationSpeedScale: 1
    }
  },
  {
    id: "destinations",
    label: "Destinations",
    enabledByDefault: true,
    stackable: true,
    renderProfile: {
      opacityScale: 1,
      routeOpacityScale: 1,
      emissiveScale: 1
    }
  }
];

const LEGACY_DESTINATIONS: Destination[] = [
  { id: "paris", regionId: "europe", name: "Paris", lat: 48.8566, lon: 2.3522, tags: ["flowers", "destinations"] },
  { id: "amsterdam", regionId: "europe", name: "Amsterdam", lat: 52.3676, lon: 4.9041, tags: ["flowers", "fairy"] },
  { id: "prague", regionId: "europe", name: "Prague", lat: 50.0755, lon: 14.4378, tags: ["fairy", "destinations"] },
  { id: "tuscany", regionId: "europe", name: "Tuscany", lat: 43.7711, lon: 11.2486, tags: ["flowers", "destinations"] },
  { id: "hallstatt", regionId: "europe", name: "Hallstatt", lat: 47.5622, lon: 13.6493, tags: ["fairy", "destinations"] },
  { id: "tokyo", regionId: "east-asia", name: "Tokyo", lat: 35.6762, lon: 139.6503, tags: ["flowers", "destinations"] },
  { id: "kyoto", regionId: "east-asia", name: "Kyoto", lat: 35.0116, lon: 135.7681, tags: ["fairy", "destinations"] },
  { id: "seoul", regionId: "east-asia", name: "Seoul", lat: 37.5665, lon: 126.978, tags: ["flowers", "fairy"] },
  { id: "jeju", regionId: "east-asia", name: "Jeju", lat: 33.4996, lon: 126.5312, tags: ["flowers", "destinations"] },
  { id: "hangzhou", regionId: "east-asia", name: "Hangzhou", lat: 30.2741, lon: 120.1551, tags: ["fairy", "destinations"] },
  { id: "jaipur", regionId: "south-asia", name: "Jaipur", lat: 26.9124, lon: 75.7873, tags: ["flowers", "destinations"] },
  { id: "goa", regionId: "south-asia", name: "Goa", lat: 15.2993, lon: 74.124, tags: ["destinations", "fairy"] },
  { id: "kandy", regionId: "south-asia", name: "Kandy", lat: 7.2906, lon: 80.6337, tags: ["flowers", "fairy"] },
  { id: "kerala", regionId: "south-asia", name: "Kerala", lat: 10.8505, lon: 76.2711, tags: ["flowers", "destinations"] },
  { id: "pokhara", regionId: "south-asia", name: "Pokhara", lat: 28.2096, lon: 83.9856, tags: ["fairy", "destinations"] },
  { id: "bali", regionId: "southeast-asia", name: "Bali", lat: -8.3405, lon: 115.092, tags: ["destinations", "flowers"] },
  { id: "bangkok", regionId: "southeast-asia", name: "Bangkok", lat: 13.7563, lon: 100.5018, tags: ["destinations", "fairy"] },
  { id: "ha-long", regionId: "southeast-asia", name: "Ha Long", lat: 20.9101, lon: 107.1839, tags: ["fairy", "flowers"] },
  { id: "luang-prabang", regionId: "southeast-asia", name: "Luang Prabang", lat: 19.8856, lon: 102.1347, tags: ["fairy", "destinations"] },
  { id: "phu-quoc", regionId: "southeast-asia", name: "Phu Quoc", lat: 10.228, lon: 103.969, tags: ["flowers", "destinations"] },
  { id: "banff", regionId: "north-america", name: "Banff", lat: 51.1784, lon: -115.5708, tags: ["destinations", "flowers"] },
  { id: "new-york", regionId: "north-america", name: "New York", lat: 40.7128, lon: -74.006, tags: ["destinations", "fairy"] },
  { id: "vancouver", regionId: "north-america", name: "Vancouver", lat: 49.2827, lon: -123.1207, tags: ["flowers", "fairy"] },
  { id: "yosemite", regionId: "north-america", name: "Yosemite", lat: 37.8651, lon: -119.5383, tags: ["flowers", "destinations"] },
  { id: "yellowstone", regionId: "north-america", name: "Yellowstone", lat: 44.428, lon: -110.5885, tags: ["fairy", "destinations"] },
  { id: "machu-picchu", regionId: "south-america", name: "Machu Picchu", lat: -13.1631, lon: -72.545, tags: ["destinations", "fairy"] },
  { id: "rio", regionId: "south-america", name: "Rio", lat: -22.9068, lon: -43.1729, tags: ["destinations", "flowers"] },
  { id: "patagonia", regionId: "south-america", name: "Patagonia", lat: -45.4, lon: -72.7, tags: ["fairy", "flowers"] },
  { id: "cartagena", regionId: "south-america", name: "Cartagena", lat: 10.391, lon: -75.4794, tags: ["flowers", "destinations"] },
  { id: "uyuni", regionId: "south-america", name: "Uyuni", lat: -20.1338, lon: -67.4891, tags: ["fairy", "destinations"] },
  { id: "cape-town", regionId: "africa", name: "Cape Town", lat: -33.9249, lon: 18.4241, tags: ["destinations", "flowers"] },
  { id: "marrakesh", regionId: "africa", name: "Marrakesh", lat: 31.6295, lon: -7.9811, tags: ["destinations", "fairy"] },
  { id: "serengeti", regionId: "africa", name: "Serengeti", lat: -2.3333, lon: 34.8333, tags: ["flowers", "fairy"] },
  { id: "zanzibar", regionId: "africa", name: "Zanzibar", lat: -6.1659, lon: 39.2026, tags: ["flowers", "destinations"] },
  { id: "namib", regionId: "africa", name: "Namib Desert", lat: -24.741, lon: 15.341, tags: ["fairy", "destinations"] },
  { id: "sydney", regionId: "oceania", name: "Sydney", lat: -33.8688, lon: 151.2093, tags: ["destinations", "fairy"] },
  { id: "queenstown", regionId: "oceania", name: "Queenstown", lat: -45.0312, lon: 168.6626, tags: ["destinations", "flowers"] },
  { id: "uluru", regionId: "oceania", name: "Uluru", lat: -25.3444, lon: 131.0369, tags: ["flowers", "fairy"] },
  { id: "hobart", regionId: "oceania", name: "Hobart", lat: -42.8821, lon: 147.3272, tags: ["flowers", "destinations"] },
  { id: "rotorua", regionId: "oceania", name: "Rotorua", lat: -38.1368, lon: 176.2497, tags: ["fairy", "destinations"] }
];

type StoryVariant = "dense" | "sparse" | "empty";

function dedupeThemeTags(tags: ThemeId[], primary: ThemeId): ThemeId[] {
  const all = [primary, ...tags];
  return all.filter((tag, index) => all.indexOf(tag) === index);
}

function toNarrativeNode(destination: Destination, index: number): NarrativeNodeConfig {
  const primaryTheme = destination.tags[0] ?? "destinations";
  const markerStyle =
    primaryTheme === "destinations" ? "beam" : primaryTheme === "fairy" ? "ring" : "dot";
  const priority = primaryTheme === "destinations" ? 3 : primaryTheme === "fairy" ? 2 : 1;
  const camera =
    primaryTheme === "destinations"
      ? { distance: 2.08, fov: 40, durationMs: 460 }
      : primaryTheme === "fairy"
        ? { distance: 2.16, fov: 41, durationMs: 420 }
        : { distance: 2.22, fov: 42, durationMs: 380 };
  return {
    id: destination.id,
    regionId: destination.regionId,
    themeId: primaryTheme,
    lat: destination.lat,
    lon: destination.lon,
    title: destination.name,
    tags: dedupeThemeTags(destination.tags, primaryTheme),
    description: `${destination.name} narrative node (${primaryTheme})`,
    camera,
    visual: {
      markerStyle,
      priority: priority + (index % 2)
    }
  };
}

function buildSparseNodes(nodes: NarrativeNodeConfig[]): NarrativeNodeConfig[] {
  const selected: NarrativeNodeConfig[] = [];
  REGIONS.forEach((region) => {
    const inRegion = nodes.filter((node) => node.regionId === region.id);
    if (inRegion.length === 0) {
      return;
    }
    selected.push(inRegion[0]);
    const secondary = inRegion.find((node) => node.themeId !== inRegion[0].themeId);
    if (secondary) {
      selected.push(secondary);
    }
  });
  return selected;
}

function resolveStoryVariant(): StoryVariant {
  if (typeof window === "undefined") {
    return "dense";
  }
  const variant = new URLSearchParams(window.location.search).get("story");
  if (variant === "sparse" || variant === "empty" || variant === "dense") {
    return variant;
  }
  return "dense";
}

function validateStoryConfig(config: StoryConfig): void {
  const issues: string[] = [];
  config.nodes.forEach((node) => {
    if (node.lat < -90 || node.lat > 90) {
      issues.push(`Node ${node.id} has invalid lat ${node.lat}`);
    }
    if (node.lon < -180 || node.lon > 180) {
      issues.push(`Node ${node.id} has invalid lon ${node.lon}`);
    }
    if (!config.themes.some((theme) => theme.id === node.themeId)) {
      issues.push(`Node ${node.id} uses unknown theme ${node.themeId}`);
    }
  });
  if (issues.length > 0) {
    console.warn("[story-config] validation issues", issues);
  }
}

const DENSE_NODES = LEGACY_DESTINATIONS.map((destination, index) => toNarrativeNode(destination, index));
const SPARSE_NODES = buildSparseNodes(DENSE_NODES);

export const STORY_VARIANTS: StoryVariant[] = ["dense", "sparse", "empty"];
export const DENSE_STORY_CONFIG: StoryConfig = {
  themes: BASE_THEMES,
  nodes: DENSE_NODES
};
export const SPARSE_STORY_CONFIG: StoryConfig = {
  themes: BASE_THEMES,
  nodes: SPARSE_NODES
};
export const EMPTY_STORY_CONFIG: StoryConfig = {
  themes: BASE_THEMES,
  nodes: []
};

const STORY_CONFIGS_BY_VARIANT: Record<StoryVariant, StoryConfig> = {
  dense: DENSE_STORY_CONFIG,
  sparse: SPARSE_STORY_CONFIG,
  empty: EMPTY_STORY_CONFIG
};

export const STORY_VARIANT: StoryVariant = resolveStoryVariant();
export const STORY_CONFIG: StoryConfig = STORY_CONFIGS_BY_VARIANT[STORY_VARIANT];
validateStoryConfig(STORY_CONFIG);

export const THEME_CONFIGS: ThemeConfig[] = STORY_CONFIG.themes;
export const NARRATIVE_NODES: NarrativeNodeConfig[] = STORY_CONFIG.nodes;
export const NARRATIVE_NODE_COUNT = NARRATIVE_NODES.length;

export const DESTINATIONS: Destination[] = STORY_CONFIG.nodes.map((node) => ({
  id: node.id,
  regionId: node.regionId,
  name: node.title,
  lat: node.lat,
  lon: node.lon,
  tags: dedupeThemeTags(node.tags ?? [], node.themeId),
  themeId: node.themeId,
  description: node.description,
  camera: node.camera,
  visual: node.visual
}));

export const THEME_LABELS: Record<ThemeId, string> = STORY_CONFIG.themes.reduce(
  (acc, theme) => {
    acc[theme.id] = theme.label;
    return acc;
  },
  {} as Record<ThemeId, string>
);
