import type * as THREE from "three";

export type RegionId =
  | "europe"
  | "east-asia"
  | "south-asia"
  | "southeast-asia"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania";

export type ThemeId = string;

export interface Destination {
  id: string;
  regionId: RegionId;
  name: string;
  lat: number;
  lon: number;
  tags: ThemeId[];
  themeId?: ThemeId;
  description?: string;
  camera?: NarrativeNodeCameraConfig;
  visual?: NarrativeNodeVisualConfig;
}

export interface Region {
  id: RegionId;
  label: string;
  color: string;
  center: {
    lat: number;
    lon: number;
  };
  radiusDeg: number;
}

export interface FocusAnimation {
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  startTime: number;
  durationMs: number;
}

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  enabledByDefault: boolean;
  stackable: boolean;
  renderProfile?: Record<string, string | number | boolean>;
}

export interface NarrativeNodeCameraConfig {
  distance?: number;
  fov?: number;
  durationMs?: number;
}

export interface NarrativeNodeVisualConfig {
  markerStyle?: "dot" | "ring" | "beam";
  priority?: number;
}

export interface NarrativeNodeConfig {
  id: string;
  regionId: RegionId;
  themeId: ThemeId;
  lat: number;
  lon: number;
  title: string;
  tags?: ThemeId[];
  description?: string;
  camera?: NarrativeNodeCameraConfig;
  visual?: NarrativeNodeVisualConfig;
}

export interface StoryConfig {
  themes: ThemeConfig[];
  nodes: NarrativeNodeConfig[];
}
