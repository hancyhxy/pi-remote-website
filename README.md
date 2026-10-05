# pi-remote-website

Marketing and design for Pi Remote: the public website and the pixel-dog
visual assets. Local only, no remote. The app (iOS, relay, agent) lives in
`../pi-remote` and is owned by the app design team.

## Layout

| Path | Holds |
|---|---|
| `site/` | Public product page. Static, no build. See `site/README.md` |
| `assets/mascot/app-current/` | Snapshot of the mascot files the iOS app ships (read-only reference) |
| `assets/mascot/explorations/` | Dog style, motion and onboarding explorations |
| `assets/logo/` | Logo proposals |
| `docs/<topic>/index.md` | Notes, e.g. `docs/mascot-inventory/` |

## Preview

```sh
python3 -m http.server 8093 --directory site
```

Open <http://localhost:8093/>, or `http://<tailscale-host>:8093/` from another device.

## Origin

Imported on 2026-10-05 from `../pi-remote`:

- `site/` from worktree `pi-remote-site` (branch `site-redesign` at `e8caa6b`, including uncommitted redesign changes and `site/assets/img/`).
- `assets/mascot/app-current/` from `ios/native/Resources/` on `main` at `024694d`.
- `assets/mascot/explorations/onboarding-design-review/` from `mockup/onboarding/assets/design-review/` on `main`.

The originals in `../pi-remote` are untouched.

## Handoff to the app team

The app does not read this folder. To change a mascot in the app, deliver the
final file to the app team; they replace it in `ios/native/Resources/`.
Refresh `app-current/` after they ship.
