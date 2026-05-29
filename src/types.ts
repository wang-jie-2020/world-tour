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

export type ThemeId = "flowers" | "fairy" | "destinations";

export interface Destination {
  id: string;
  regionId: RegionId;
  name: string;
  lat: number;
  lon: number;
  tags: string[];
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

