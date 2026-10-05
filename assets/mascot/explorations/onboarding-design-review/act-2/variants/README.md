# Act 2: front-facing variants

This page keeps the asset comparisons. The user provisionally selected C3 for
the integrated second carousel scene. Runtime copies live in
`assets/story/act-2/`; Act 1 stays unchanged.

## Current B comparison

The user selected B. Both compositions use the same `b/person.png`, unchanged
and verified by SHA-256:
`7ca015765fb08c9edce8c120dbef5d1eee3773b3ddd48ecbcf0f602d3cb84d91`.

- B1: `b/paper-run-front.*`, a frontal Jack Russell run.
- B2: `b/run-candidates/c3/run.*`, provisionally selected by the user from three independent generated
  sheets with the same prompt and references. No rig is used. The
  [synchronised comparison](b/run-candidates/index.html) keeps all three candidates
  on one frame clock and provides half speed, pause and frame selection.
  [Candidate notes](b/run-candidates/README.md) explain the selection and build.
  C1 was the earlier agent recommendation; C3 is the user's current choice.
  Natural gait and the complete page still need visual approval.
  The user rejected the procedural joint rig; it is no longer served or rebuilt
  by `build-selected.py`. Old rig and generated revision files remain for history.
- Each run has exactly 24 frames at 80 ms each (1.92 s), in GIF and WebP.
  Extracted transparent PNGs stay in `b/paper-run-frames/<angle>/`.
- `b/session-stack-top.*`: the working content replaces the original green
  print on the top card, not a fourth card. Its alpha silhouette and angle
  stay unchanged. The lower red and blue cards keep their original visible pixels.
- `b/stack-blank-top.png`: the stack with the top print removed. Local texture
  restores paper fibres in the cleared areas. Only the new orb moves.

### Image references

The rejected first run used the earlier B dog and the Act 1 person. The new
master in `b/jack-russell-paper/master/` uses the approved Act 1
`assets/story/stickers/225-clean/03-dog-lead.png` and `01-person-chair.png`
as direct image inputs. The prompt requires rough flat layered paper, fibrous
creases and cut-paper oval eyes, and excludes smooth glossy cartoon rendering.
The master has an unwanted backdrop glow; it is a source reference only.

The new frontal sheet uses that master plus the original Act 1 dog. The
three-quarter sheet adds the earlier A dog as an angle reference only. Both
sheets require a flat magenta backdrop with no glow. The build removes that
backdrop, cleans the ivory border, and retains paper texture inside the figure.
Original generated sheets stay in `b/jack-russell-paper/<angle>/`.

Run `python3 mockup/onboarding/assets/design-review/act-2/variants/b/build-selected.py`
after the base build below. It does not write the person file. Earlier files
such as `jack-russell-run.*`, `session-slim.*` and `session-stack.*` remain for
history, but the page no longer loads them.

Checks pass for three viewports, light/dark backgrounds, pause, reduced motion,
failed image loading and retry. File checks confirm 24 frames, 1.92 s duration,
infinite repeat and no opaque magenta pixels in either run. Stack alpha and
visible lower-card pixels match the original; motion stays within the top orb.
The current generated runs were checked in frame sheets and the synchronised
browser review. Run `node mockup/tests/onboarding-run-candidates-check.mjs` for
shared frame timing, pause, stepping, reduced motion, failed decode/retry and
three viewports. The older `verify_gait.py` applies only to the rejected rig and
is not evidence for the current animation. No person, frontal GIF or card asset
was changed in this selection. Browser checks do not prove a natural gait;
user motion approval and physical Safari review remain open.

## Earlier A / B assets

- A: frontal standing person, gaze down-right; happy dog faces right-front.
- B: frontal person taking a small forward step, gaze down-right; happy dog faces the camera.
- Both use the same session title card and paper version of the product connecting orb.
- Only the dog's tail and the card orb move. People and card text stay static.

The two source sheets use Codex image generation with the approved Act 1 references.
A had a baked checkerboard; the build removes the connected neutral backdrop.
B had alpha with small fragments; the build removes them. Raw sources remain intact.

## Build

From the repository root:

```sh
node mockup/onboarding/assets/design-review/act-2/variants/orb-frames.mjs
python3 mockup/onboarding/assets/design-review/act-2/variants/build.py
```

The Python build needs Pillow, NumPy and OpenCV. It uses the local Menlo font.
The Node script samples `web/thinking-orb.js` without changing production code.
The paper render samples the 64 px connecting preset, scales its node and link
positions, uses cut-paper dots and fibres,
and weights the links for small-size legibility. Sample time moves forward and back
to close the loop without a frame jump. This is a style adaptation, not a new app state.
`Working…` describes the task; connecting supplies the visual style only.

Open `index.html` through the mockup server. PNG, GIF and animated WebP files are
provided. The page uses WebP for soft alpha edges. Reduced motion starts paused.
GIF has one-bit transparency. Asset approval and physical Safari review remain open.

## Review results

Run `node mockup/tests/onboarding-act-two-check.mjs` to check both review versions.

| Check | Result |
| --- | --- |
| State table | Loading -> ready or error; ready -> paused; paused -> loading; error -> retry. Same inline status, alert and recovery button as the earlier review |
| Light and dark | Pass: generated edges and card checked on both backgrounds |
| Viewports | Pass: 390×844, 844×390 and 820×1180; asset bounds and page width checked |
| Keyboard and semantics | Native buttons and links, shared focus ring, status and error roles |
| Safe area and touch | Bottom inset and 44 px controls; physical touch review open |
| Reduced motion | Pass: static sources on entry and on Pause |
| Reduced transparency | Not applicable: no glass or backdrop blur |
| Copy and styling | Static English title and working label; shared review tokens; source colours stay inside raster assets |
| Mockup boundary | Asset review and local Act 2 carousel only; no production or API changes |
| Late results | Generation guard rejects obsolete loads; reduced-motion changes can cancel a pending render |
| Loops | Pass: both current runs have 24 frames and last 1.92 s; orb loop is 6 s |
| Motion isolation | Pass: card differences stay within the top orb; card text and the two lower cards stay fixed |

The composition uses exactly two animated objects per option. The orb is also
shown enlarged below the two options for separate asset inspection.
