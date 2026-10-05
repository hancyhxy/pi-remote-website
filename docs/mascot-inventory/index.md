# Mascot inventory

Where the dog appears, as of 2026-10-05. App source: `../pi-remote` `main`
(`ios/native/App/`). Contact sheet of the current app files:
[`app-current-sheet.png`](app-current-sheet.png).

Scope: the Agent mascot ATU in the app and the website, both 3D plush.
Onboarding is out of scope; the app team owns it.

## App: Agent mascot ATU (3D plush, 216 px GIF, 36 frames, 12 fps)

One state per GIF, chosen in code (`NativeMascot.swift`).

| State | File | When the app shows it |
|---|---|---|
| Idle | `mascot-idle.gif` | Ready, nothing running |
| Working | `mascot-working.gif` | A run, a send or a pending delivery |
| Offline | `mascot-offline.gif` | Mac offline, no network, not ready (sleeping) |
| Done | `mascot-done-{laugh,wave,wink,confetti}.gif` | One loop after a run ends, random variant, then Idle |

| Place | Size | Moves? | States | Code |
|---|---|---|---|---|
| Agent tab header avatar (circle + ATU pill) | 64 pt | yes | all | `NativeAppView.swift` `agentTopRow` |
| Drawer, Agent row above Recent/Projects | 38 pt | only Working | Idle/Working/Offline | `NativeSessionDrawer.swift` |
| Drawer, small ATU tag | 14 pt | no | Idle | `NativeSessionDrawer.swift:298` |
| Agent profile sheet (tap mascot: Soul + Memory) | 60 pt | no | Idle/Offline | `NativeAgentTranscript.swift:831` |
| Empty page when Mac offline / no network | 64 pt | no | Offline | `NativeConnectionStatus.swift` |
| To-do dock "Ask ATU to plan your day" | 30 pt | no | Idle | `NativeTodoView.swift:416` |
| To-do ATU chat header | 32 pt | while sending | Idle/Working | `NativeTodoView.swift:1516` |

## Website (`site/`, 3D plush)

| Place | File |
|---|---|
| Nav logo / favicon | `assets/logo.svg` (pixel dog, proposal) |
| Hero, swaps with the headline word | `dog-latte` (phone), `dog-switch` (sofa), `dog-noodles` (iPad), `scene-commute`, `scene-garden` + `word-*.webp` |
| Demo stage beside the Mac | `dog-backpack.webp` |
| Early-access card | `dog-clog.webp` |
| Prepared, not used yet | `obj-*.webp` (16), `sec-*.webp` (6) |

## Gaps to decide

1. States the app has but the mascot lacks: **waiting for you** (a dialog
   waits for an answer, `docs/agent-mode` 5.3) and **error stop**
   (`ATU stopped: <reason>`). Both fall back to Working/Idle today.
2. **First start**: ATU has no hello/intro state.
3. Small sizes (14–38 pt) show a static first frame. Check that the first
   frame reads at 14 pt.
4. Website: decide whether `obj-*` / `sec-*` replace the line icons.

## Delivery spec for the app

Square GIF, 216 × 216 px, transparent, 36 frames at 12 fps (3 s loop),
bust framing that a circle can crop, first frame usable as a still.
Name: `mascot-<state>.gif`. The app team adds new states in code.
