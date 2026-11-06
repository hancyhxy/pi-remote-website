# Generated run comparison

Three independent Codex image calls used the same prompt and the same references:

1. `b/paper-run-three-quarter.png`: character and right-front camera angle.
2. `assets/story/stickers/225-clean/03-dog-lead.png`: approved paper material.

Each requested a 6×4 sprite sheet with 24 frames, an energetic young dog,
active hind-leg push and recovery, consistent scale, and a magenta backdrop.
No skeletal renderer or generated rig frames were used as input.

## Build and review

Run `python3 mockup/onboarding/assets/design-review/act-2/variants/b/run-candidates/build.py`.
This needs Pillow, NumPy and OpenCV. Source sheets remain in `c1/`, `c2/` and
`c3/`. Each has `run.gif`, `run.webp`, `still.png` and 24 extracted PNG frames.
All use the same extraction, dimensions and 80 ms frame duration (1.92 s total).
The page loads those PNGs and advances all three with one shared frame clock.
Pause, frame selection and half speed support gait inspection.

The file metrics are diagnostics, not a biomechanical quality score. Check
visible hind-leg recovery, limb overlap, energy, head/scale stability and the
last-to-first transition. Natural gait remains a visual judgement.

The user provisionally selected C3 for the second carousel scene. C1 was the
earlier agent recommendation after frame review: more visible hind-leg
recovery and less extreme gathering than C3. C2 has stronger straight forward
reaches and less varied hind-leg shapes. C3 has lively motion, but several
strongly gathered poses have crowded paws. All retain some generated frame
variation; the selection is not a claim of perfect gait or user approval.

The previous rig is rejected and is no longer loaded by B2. Its files stay
for history. The person, frontal dog and session stack are unchanged. The
selected C3 files are copied into `assets/story/act-2/` for carousel use.

## Verification

Run `node mockup/tests/onboarding-run-candidates-check.mjs`.
The browser check passes at 390×844, 844×390 and 820×1180. It verifies equal
frame indices, pause, last-to-first stepping, speed selection, no horizontal
overflow, reduced motion and failed image loading followed by retry.
Light and dark screenshots were reviewed. Buttons and links have 44 px targets,
shared focus styling and English labels. Bottom padding includes the safe area.
No glass surface, modal, production API or relay is involved. Physical touch,
Safari playback and final user approval remain open.

| State | Class | Carrier | Trigger |
| --- | --- | --- | --- |
| loading | waiting | Inline status; disabled playback controls | Decode -> ready or paused; failure -> error |
| ready | success | Three canvases and frame label | Pause, Step or Frame -> paused |
| paused | success | Static canvases and frame label | Play -> ready |
| error | error | Inline alert and Retry frames | Retry -> loading |

A generation guard rejects obsolete loads. Reduced motion can stop playback or
make a pending load enter paused state. The frame slider is a review control,
not part of onboarding. `metrics.json` records silhouette change fractions:
C1 seam 0.064, C2 seam 0.181, C3 seam 0.162. These describe image changes only,
not anatomical correctness. All candidates still have generated pose variation.
