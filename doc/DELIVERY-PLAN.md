# World Tour Globe Delivery Plan (PRD v1.2 Aligned)

Updated: 2026-06-01  
Plan Status: active

## 1. Goal Alignment
This plan follows `doc/PRD-全球地区特色地球可视化.md` with capability-first delivery:

1. Theme system is configuration-driven.
2. Narrative nodes are configuration-driven (`0..N`).
3. UI must provide control capabilities without fixed widget style constraints.
4. Release requires three evidence classes: build + runtime + visual scoring.

## 2. Scope
### 2.1 Core Scope (must complete)
- Regional readability (fill, border, selected halo).
- Theme registration/toggle/stack driven by config.
- Narrative node loading by `region x theme` config.
- Node card and camera focus linkage.
- Desktop/mobile core interactions.
- Keyframe scoring threshold.

### 2.2 Non-core Scope (not completion criteria)
- Weather simulation and related storytelling.
- Unscoped visual experiments unrelated to PRD goals.

## 3. Milestones and Exit Criteria

### M0 Baseline Review
Deliverables:
- Complete A/B matrix for `KF01/KF08/KF13/KF17`.
- Gap list mapped to concrete code parameters.

Exit criteria:
- 8 A/B rows prepared.
- Each gap has code-level mapping.

Status: in_progress

### M1 Regional Readability Convergence
Deliverables:
- Stable fill/border/halo readability across target regions.
- Region remains recognizable within 3 seconds after switch.

Exit criteria:
- Desktop/mobile readability checks pass.
- No blocking runtime errors.

Status: in_progress

### M2 Theme System Decoupling and Readability
Deliverables:
- Theme list sourced from config (not hardcoded UI list).
- Theme render tuning supports config-driven parameters.
- Theme switching remains visually distinguishable and stable.

Exit criteria:
- New/replaced theme can be added via config path.
- Theme switching verification logged.

Status: in_progress

### M3 Narrative Node Loop (Config-driven)
Deliverables:
- Node visual style supports config fields (`markerStyle`, `priority`).
- Node camera behavior supports config fields (`distance`, `fov`, `durationMs`).
- Node count supports `dense/sparse/empty` variants.

Exit criteria:
- At least two node scale configs validated (`sparse`, `dense`).
- `0` node config validated (`empty`).
- Desktop/mobile click + focus chain verified.

Status: in_progress

### M4 Visual + Performance Convergence
Deliverables:
- Four keyframe shots converged on composition/density/color/UI intrusiveness.
- Low-tier degradation behavior validated.
- Pre-release scoring record archived.

Exit criteria:
- Per-frame >= 64/80; mean >= 68/80.
- No blocking visual defect.
- `npm run build` pass and runtime console no blocking errors.

Status: pending

## 4. Evidence Requirements (Release Gate)
All three are mandatory:

1. Build evidence: `npm run build`.
2. Runtime evidence: desktop/mobile interaction checks + console check.
3. Visual evidence: keyframe scoring record from rubric.

## 5. Progress Update (This Round, 2026-06-01)
Completed in code:

1. Theme config and node config schema landed in `src/types.ts`.
2. `STORY_CONFIG` now supports variants: `dense`, `sparse`, `empty`.
3. Theme chips now render from config (`THEME_CONFIGS`) instead of hardcoded IDs.
4. Theme render parameters now read from `ThemeConfig.renderProfile`.
5. Node marker style and route priority now read from node visual config.
6. Node camera focus now reads per-node camera config.
7. UI default intrusiveness reduced; mobile panel readability improved.

Verification:

- Build: pass (`npm run build`).
- Variant URLs prepared:
  - `?story=dense`
  - `?story=sparse`
  - `?story=empty`
- M4 rubric sheet updated with latest round log; frame scores pending manual run.

## 6. Next Execution Order
1. Finish M0 manual A/B scoring for four keyframes.
2. Execute runtime walkthrough on desktop + mobile using all three story variants.
3. Close remaining M2/M3 evidence gaps and update statuses.
4. Run M4 convergence scoring and finalize release gate.
