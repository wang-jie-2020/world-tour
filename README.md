# World Tour Globe

Production-style demo for the PRD: global regional-feature globe visualization.

## Stack

- Vite + TypeScript
- Three.js (WebGL + postprocessing)
- Native HTML/CSS control panels

## Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:5173/`
- `http://localhost:5173/garden-earth-rebuild.html`

Do not open with `file://` (browser CORS will block module loading).

Story configuration variants for M2/M3 validation:

- `http://localhost:5173/?story=dense` (default, many narrative nodes)
- `http://localhost:5173/?story=sparse` (reduced narrative nodes)
- `http://localhost:5173/?story=empty` (0 narrative nodes, verifies `0..N`)

## Implemented (1-8 Round)

- GeoJSON-driven world contours with LOD selection (`low/medium/high`).
- Vegetation asset pipeline:
  - atlas: `src/assets/vegetation/vegetation-atlas.png`
  - variants: `src/assets/vegetation/variants/*.png` (48 files)
- Volume layering with heightmap-driven elevation sampling:
  - ground / canopy / tall-canopy / blossom.
- Ocean shader upgrade:
  - animated wave bands,
  - coast-aware shallow tint via land-mask texture,
  - rim fresnel.
- Keyframe-calibrated camera presets:
  - `KF01 / KF08 / KF13 / KF17`
  - shot-specific `fov` + target lat/lon.
- Unified look pipeline:
  - postprocess color-grade pass (`contrast/saturation/warmth/vignette/bloomish`).
- UI convergence:
  - controls collapsed by default,
  - `UI` button toggles edit-mode visibility.
- A/B evaluation mode:
  - `A/B` button toggles `Target` vs `Baseline`,
  - frame evaluation rubric in `doc/FRAME-EVAL-RUBRIC.md`.

## Project Structure

- `src/app.ts`: scene, animation state, rendering pipeline, interactions.
- `src/data.ts`: region and destination source data.
- `src/geo.ts`: latitude/longitude and boundary helpers.
- `src/types.ts`: shared types.
- `src/style.css`: HUD and responsive styles.
- `src/assets/world-contours.json`: simplified world/shoreline polygons.
- `src/assets/vegetation/vegetation-atlas.png`: main vegetation atlas.
- `src/assets/vegetation/variants/`: extra vegetation sprites.
- `doc/DELIVERY-PLAN.md`: execution and completion notes.
- `doc/FRAME-EVAL-RUBRIC.md`: A/B frame scoring template.
- `doc/PRD-全球地区特色地球可视化.md`: product requirements.

## Verify

```bash
npm run build
```

Build passes. Vite still warns about bundle size due to Three.js + postprocessing + sprite assets.
