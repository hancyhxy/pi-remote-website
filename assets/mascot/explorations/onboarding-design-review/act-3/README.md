# Act 3 asset and breathing review

Open `http://localhost:8081/onboarding/assets/design-review/act-3/`.
This page keeps the asset and motion comparisons. The selected C assets are now
copied into `assets/story/act-3/` for the third carousel scene. Acts 1 and 2 stay unchanged.

## Brief and sources

The user approved three static candidates with these objects:

- Two relaxed adults on a sofa, looking at each other.
- The existing B person in a yellow hoodie and grey trousers.
- A companion in a muted blue top, with a landscape iPad on their lap.
- One phone face down on the sofa beside the main person.
- A floor lamp on the left, with no glow animation.
- The C3 terrier curled asleep on a small mat at the lower right.
- No side table, plants, wall art or full room background.

Three independent Codex image calls used the same prompt and references:
`assets/story/act-2/person.png`, `assets/story/act-2/dog.png`, and
`assets/story/stickers/225-clean/01-person-chair.png`. They requested coarse
fibrous matte paper, layered scraps, ivory sticker borders and three separate
sticker groups against magenta. Original sheets remain in each candidate's
`source/` directory. These are new seated/sleeping drawings, not pixel-identical
copies of the standing person or running dog.

## Assets

Each of `a/`, `b/` and `c/` contains:

- `scene.png`: full composition with real alpha.
- `lamp.png`: separate lamp.
- `sofa.png`: sofa, both people, phone and tablet as one group.
- `dog-mat.png`: sleeping dog and mat as one group.
- `parts.json`: crop coordinates on the source canvas.

Run `python3 mockup/onboarding/assets/design-review/act-3/build.py` to rebuild
all extracted PNGs. This needs Pillow, NumPy and OpenCV. It removes the magenta
backdrop, keeps the three largest connected groups, softens only the alpha edge,
and clears colour spill along the ivory outline. Interior paper fibres remain.
The selected dog's upper back now has a local breathing displacement. Its mat
stays fixed; no full-dog scale or limb rig is used. The tablet UI in A and B is illustrative, not a product capture. The selected
C no longer shows a UI: the viewer sees a matte back panel labelled `pad`.
Its targeted Codex edit is in `c/pad-back/`. The builder composites only the
visible panel through `panel-mask.png`, retaining the original surrounding art.
`composite-source.png` records that local composite; the full regenerated image
is not used as the new scene. Cache-versioned C links load the updated PNGs.

## Visual notes

A has a relaxed crossed-leg pose and a slightly tilted tablet. B has a clearer
upright device presentation and a crossed-leg main person. C has the main
person's feet together and a visible red dog collar. The collar is largely hidden
in A and B, so those need a collar edit if selected. C is worth checking first for
character continuity. The user selected C and requested the tablet back instead
of the screen. The revised tablet stays unchanged in the breathing loop. Carousel integration
now uses five independent layers: lamp, empty sofa, left person, right person
and `dog-rest-v2.webp`, with a PNG dog for reduced motion. The new
[separation notes](c/separated/README.md) explain the reconstructed sofa and
individual seated characters. The carousel does not load the old combined sofa
image. This comparison page keeps the earlier combined reference; the separate
PNG links show the current layers. Review files remain the source, not the runtime path.

## Breathing

Run `python3 mockup/onboarding/assets/design-review/act-3/breathe.py` after the
static builder. It uses the approved C pixels without a new generated drawing.
The upper back rises by at most 4 source pixels, then falls. Forty-eight frames
at 80 ms give a 3.84 s loop: 1.44 s inhale, 2.4 s exhale. The breathing displacement fades
to zero before the face, paws, tail and mat. A separate small tail motion is
described below.
The first frame exactly reconstructs the approved scene. The final frame returns
close to that rest pose without a hold or a hard reset.

C now uses `scene-rest-v2.webp` and an enlarged `dog-rest-v2.webp`, with
`dog-rest-v2.gif` for download. Earlier `*-breathe.*` files remain for comparison.
WebP keeps soft alpha. Pause motion shows the approved stills.

The original tail pixels form a separate masked layer. The root stays anchored;
the tip travels at most 3.5 source pixels left and right over the same 3.84 s.
Premultiplied colour keeps the paper edge clean. A fixed OpenCV inpainted underlay
fills the narrow strip revealed by the moving tail; no new model drawing is used.
The visible mat is not scaled or displaced. Pixels outside the back and tail
regions are checked against the original in every frame. Tail extrema were
reviewed at enlarged scale. This remains a subtle asset experiment, not physical
animation approval.
Reduced motion starts paused and can stop an active or pending loop. All people,
devices and furniture stay still. No light pulse is added.

## States

Each candidate has an independent state on its article. One image failure does
not block the other candidates. Retry repeats the same asset request.

| State | Class | Carrier | Trigger |
| --- | --- | --- | --- |
| loading | waiting | Inline status and disabled Retry | Decode -> ready; failure -> error |
| ready | success | Composition, breathing control and links | C Play/Pause -> loading |
| error | error | Inline alert and Retry image | Retry -> loading |

A request token rejects an obsolete decode. Both C images commit together, and
a failed load keeps any previously confirmed images. Retry repeats the pending
choice. Theme changes do not reload assets. There are no modal decisions, API
calls or empty results.

## Verification

Run `node mockup/tests/onboarding-act-three-check.mjs`.
Review alpha edges, device visibility and character continuity on light and dark
backgrounds. Browser checks cannot confirm physical Safari quality or user
approval. The shared review skin supplies colours and focus styling. Controls
have at least 44 px targets and safe-area padding. No blur is used; reduced
transparency does not need a separate state. Reduced motion uses static PNGs. Physical touch and Safari review remain open.

Checks passed at 390×844, 844×390, 820×1180 and 1400×1000. They cover all three
loaded compositions, linked assets, no horizontal overflow, keyboard expansion,
light/dark backgrounds, isolated image failure/retry, reduced motion and a late
decode after the candidate leaves the page. Phone dark and desktop light
screenshots were visually reviewed. File checks confirm 12 single-frame alpha
PNGs, no opaque magenta, three separate groups per scene, and exact reconstruction
from the cropped assets. User selection, fine-edge approval and physical devices
remain open. The breathing update passes play/pause, reduced-motion initial state
and the same viewport checks. File checks confirm 48 frames, 3.84 s and infinite
repeat for both WebPs and the GIF. The builder asserts fixed pixels outside the
upper-back and tail regions. Rest and peak-inhale images were visually checked; natural
motion and physical Safari approval remain open. Screenshots are disposable under the workspace
`tmp/2026-09-10/onboarding-act-three/screenshots/`.
