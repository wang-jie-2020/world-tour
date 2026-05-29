# World Tour Globe Delivery Plan

Updated: 2026-05-29  
Status: completed (current round)

## 1. Goal

Implement a production-usable globe demo from the PRD with:

- clear regional differentiation,
- switchable storytelling themes,
- destination-level narrative interaction,
- stable desktop/mobile interaction quality.

## 2. Milestones and Status

### M1 Regional readability

- [x] Unified all globe layers under `planetGroup` for consistent transform logic.
- [x] Strengthened region fill + border hierarchy.
- [x] Added active pulse halo for fast region recognition.

### M2 Theme quality

- [x] Improved `flowers` into multi-layer clustered particles.
- [x] Improved `fairy` into firefly particles + soft trails.
- [x] Improved `destinations` markers/routes with smooth visibility blending.

### M3 Destination storytelling

- [x] Click destination => info card + camera focus.
- [x] Guided mode now synchronizes region/theme/destination.
- [x] Mobile panel readability improved.

### M4 Performance and visual convergence

- [x] Smooth per-theme fade in/out to avoid flicker.
- [x] Low-tier adaptive particle budgets.
- [x] Build gate validated with `npm run build`.

## 3. Post-M4 Enhancements Completed

- [x] Keyframe-oriented visual alignment:
  - darker ocean base,
  - stronger atmosphere rim,
  - aurora-like polar band,
  - tuned lighting and camera baseline.
- [x] Destination coverage expanded to 5 per region (40 total).
- [x] Scripted guided-tour sequence with theme presets.
- [x] Live status line with FPS and performance tier.

## 4. Frame-Gap Round (1-6) Completed

- [x] 1. Replaced hand-drawn land approximation with GeoJSON-driven world contours.
- [x] 2. Replaced procedural-only vegetation with PNG atlas-based sprite usage.
- [x] 3. Added layered vertical depth (ground/canopy/tall canopy/blossom) and elevation jitter.
- [x] 4. Added shader ocean with animated wave bands and coastline spray transition.
- [x] 5. Calibrated cinematic camera presets to keyframes `001/008/013/017`.
- [x] 6. Reduced tool-like UI presence with default-collapsed control panels.

## 5. Definition of Done Mapping

1. Region recognizability in <= 3 seconds: addressed by fill/border/halo layers.
2. Clear theme difference: addressed by isolated layers and smooth blend control.
3. Clickable destinations in every region: guaranteed by 5 destinations per region.
4. No blocking errors: validated by build success.
5. Core interactions on desktop/mobile: rotate, zoom, switch, click all supported.

## 6. Verification

```bash
npm run build
```

Result: pass (with expected Three.js bundle-size warning only).
