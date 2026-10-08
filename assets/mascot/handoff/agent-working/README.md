# Agent Mode mascot: Working (video)

Replaces `ios/native/Resources/mascot-working.gif`, which flickers because each
frame was redrawn separately. These clips come from one continuous Seedance 2.5
video (first frame = last frame = `working-keyframe.png`), so they do not flicker.

| File | Use | Length | Play |
|---|---|---|---|
| `working-typing-loop.mp4` | While a run is in progress | 1.125 s, 27 frames | Loop forever |
| `working-nod.mp4` | One-shot nod; starts and ends at the keyframe pose | 1.54 s, 37 frames | Play once, then return |
| `working-keyframe.png` | Static frame / Reduce Motion / placeholder | 1254 px | — |
| `working-source-4s.mp4` | Uncut source, reference only | 4.04 s | — |

All clips: 640×640, 24 fps, H.264, no audio, opaque flat background `#F7F5F2`.
The background is not transparent; match the avatar circle's fill or mask it.

Notes:
- The typing loop has a 0.17 s cross-fade at the seam.
- The nod's first and last frames match the keyframe, so it can follow any
  state that rests on the keyframe pose.
- Source of truth for the app stays `ios/native/Resources/`; the app team
  decides format (MP4/HEVC, or re-encode) and scale.
