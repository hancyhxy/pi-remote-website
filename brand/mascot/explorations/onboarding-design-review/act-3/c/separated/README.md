# Separate seated characters and sofa

The user requested real independent assets, not one composite moving as a group.
Three targeted Codex edits use the selected C image as their reference. They
isolate each seated person and reconstruct the empty sofa behind them. The
phone stays with the sofa; the tablet back labelled `pad` stays with the woman.
The hidden end of the man's arm is reconstructed behind the woman. The lamp
and animated dog are not regenerated.

Run `python3 mockup/onboarding/assets/design-review/act-3/c/separated/build.py`.
It removes magenta, keeps the largest connected component and cleans only the
ivory alpha edge. Both cropped and full-canvas PNGs are retained. Runtime uses
full-canvas PNGs on the original 1536×1024 coordinate system, so all three layers
register without a second layout calculation. These are complete isolated
layers, not rectangular windows onto the original combined picture.

The builder writes `sofa-only.png`, `person-left.png` and `person-right.png` to
`assets/story/act-3/`. The old combined `sofa.png` remains for history but is no
longer loaded by the carousel. The generated reconstruction can differ slightly
from the original visible paper details; character and pose review remains open.

The sofa enters from below, each person from their own side, then the dog enters
from the right. All entrance durations are 1000 ms. Read the owning onboarding
README for timing, states and browser verification.
