# Frame Evaluation Rubric (A/B)

Use this checklist after running:

```bash
npm run dev
```

Open `http://localhost:5173/`, then:

1. Click `UI` to open controls.
2. Use `Next shot` to cycle keyframe-aligned shots (`KF01/KF08/KF13/KF17`).
3. Use `A/B` button to switch between `Target` and `Baseline`.
4. Capture screenshots for each keyframe shot under both modes.

## Scoring Dimensions (0-10 each)

- Contour fidelity (coastline/islands/peninsula shape)
- Vegetation realism (asset richness / repetition control)
- Volume depth (near-mid-far layering and occlusion)
- Ocean quality (deep water tone / coast transition / flow)
- Camera match (framing / horizon / focal compression)
- Global color style (cinematic consistency)
- UI intrusiveness (presentation cleanliness)
- Interaction continuity (no flicker / smooth transitions)

## Pass Threshold

- Per-frame score >= 64/80
- Mean score across 4 frames >= 68/80
- No blocking visual defect (major clipping, severe popping, broken interaction)

## Recording Template

| Frame | Mode | Contour | Vegetation | Volume | Ocean | Camera | Color | UI | Interaction | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF01 | Target |  |  |  |  |  |  |  |  |  |
| KF01 | Baseline |  |  |  |  |  |  |  |  |  |
| KF08 | Target |  |  |  |  |  |  |  |  |  |
| KF08 | Baseline |  |  |  |  |  |  |  |  |  |
| KF13 | Target |  |  |  |  |  |  |  |  |  |
| KF13 | Baseline |  |  |  |  |  |  |  |  |  |
| KF17 | Target |  |  |  |  |  |  |  |  |  |
| KF17 | Baseline |  |  |  |  |  |  |  |  |  |

