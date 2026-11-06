# Act 2: 225 asset review

This review does not change the onboarding carousel or Act 3.
The source sheet uses Codex image generation and the approved Act 1 references.

## Assets

- `person.png`: static person looking ahead, with the phone at hip height.
- `dog.png`: static dog and reduced-motion alternative.
- `dog-loop.gif`: only the tail moves; a 2.4 s loop.
- `session.png`: static session card and reduced-motion alternative.
- `session-loop.gif`: a 3 s indeterminate task loop; no completion mark.
- Animated WebP copies keep smooth alpha edges for the composition preview.

Open `index.html` through the mockup server. The page shows the composition
and separate asset links. Pause stops both loops. Reduced motion starts paused.
The composition is provisional and needs user approval before integration.

## Build

Run `python3 mockup/onboarding/assets/design-review/act-2/style-225/build.py`.
This needs Pillow, NumPy and OpenCV. Source files remain unchanged.
The build removes alpha fragments, smooths outlines, and makes both loops
from the same still assets. No video model is used.

## States

| State | Class | Carrier | Trigger |
| --- | --- | --- | --- |
| loading | waiting | Inline status; disabled control | Image decode -> ready or error |
| ready | success | Composition and asset cards | Pause -> paused |
| paused | success | Static frames and button label | Play -> loading |
| error | error | Inline alert and Retry button | Retry -> loading |

A generation counter rejects late image loads. No relay, API or session calls occur.
GIF has one-bit transparency. The preview uses animated WebP to retain soft edges;
GIF downloads are also provided for review.

## Verify and review

Run `node mockup/tests/onboarding-act-two-check.mjs` from the repository root.
Set `REVIEW_OUTPUT` to an approved temporary folder to save screenshots.

| Check | Result |
| --- | --- |
| States and retry | Pass: loading, ready, paused, failed decode and retry browser checks |
| Light and dark | Pass: screenshots checked on both backgrounds; no backdrop grid |
| Viewports | Pass: 390×844, 844×390 and 820×1180; asset bounds and page width checked |
| Keyboard and semantics | Native buttons and links; status and error roles; visible focus uses shared styles |
| Safe area and touch | Bottom safe-area padding; controls are at least 44 px high; physical device review open |
| Reduced motion | Pass: still frames on entry; Pause replaces all animated sources |
| Reduced transparency | Not applicable: no glass or backdrop blur |
| Copy and colour | English labels; progress has a status description; shared light/dark review tokens |
| Mockup boundary | Asset review only; no production surface or relay changes |
| Late results | Generation guard rejects obsolete loads; physical rapid-toggle review open |
| Loop files | Pass: 24 dog frames and 30 card frames; both repeat indefinitely |
| Motion bounds | Pass: dog changes only in the tail area; card changes only in the progress track |

The movement is built locally from one still per object. It is not generated
full-body video. Final composition, Safari playback and user approval remain open.
