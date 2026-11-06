# Public site

The public product page. Status: design preview. Pi Remote is a working name. The page uses
sample content only and does not connect to the agent or the relay.

## Open

The page is static. It has no build step and no dependency on `web/` or `mockup/`.

```sh
python3 -m http.server 8093 --directory site
```

Open <http://localhost:8093/>. Stop the server after review.

## Boundary

- Deploy this folder on its own origin, apart from the relay. The relay serves
  `web/` at `/`. Scripts on this page must not share an origin with pairing credentials.
- Deploy only with an explicit user request. No deployment is set up yet.

## Design source

The visual language follows <https://vibeisland.app/> as the user requested.
The page copies its structure and style, not its assets, copy or code.

| Reference element | This page |
| --- | --- |
| Near-black page `#111`, corner glows, film grain | Same values |
| Pixel display headline, one scrambled accent word | Departure Mono, orange accent from the pixel dog logo |
| Digit matrix and light beams behind the hero | Canvas matrix and conic-gradient beams |
| MacBook screen with notch status and a product window | Mac screen with terminal Pi, a notch toast and the phone in front |
| Scene tabs: Monitor, Approve, Ask, Jump | Check, Reply, Answer, Preview |
| Logo strip | "Built for the Pi you already run" strip; no customer logos are claimed |
| 3 x 3 feature cards with pixel icons | Same layout; icons are 9 x 9 bitmaps in `app.js` |
| Testimonial wall | How it works (3 steps) and a relay security diagram; no testimonials are invented |
| FAQ rows with `+` | Same |
| Price card with badge and matrix corner | Early-access card; no price is stated |
| Serif italic footer wordmark | Instrument Serif italic |

Fonts are local under `fonts/` with their SIL OFL licences, including a copy of
JetBrains Mono. The logo is `assets/logo.svg` from the `pixel-logo` branch; it is a
proposal, not an approved logo.

## Behaviour

- Scenes play in order while the stage is on screen. A tab click stops autoplay.
  Arrow keys move between tabs. Hidden tabs do not advance the scenes.
- Reduced motion: no autoplay, no scramble, no matrix flicker; each tab shows its final state.
- The hero waitlist form validates the address and states that nothing was sent or saved. The lower early-access card's Join link returns to and focuses the hero email field.

## Open items

Final name, final logo, pricing, real waitlist endpoint, real links for Docs,
Privacy and Terms, and a review on a physical iPhone.
