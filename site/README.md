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
proposal, not an approved logo. `InstrumentSerif-Italic.woff2` is a WOFF2 copy of the TTF.

## Page structure (v2, 2026-10-10)

The content brief is the "官网内容方案草案 v2" mail of 2026-10-10.

```text
S1 Hero        your own AI, on your own computer; Mac, Linux, Windows soon
S2 Demo        three scenes on one stage: Scan and pair, Updates, To-do follow-up
S3 Models      30+ providers on a turning 3D logo sphere
S4 Cost        Composio Bench, Kimi K3 run: one race card (Speed, Cost,
               Tokens) against Codex, OpenCode and Claude Code, with their
               logos; completion rate is not shown
S5 Security    data stays on the computer; a sealed message crosses the relay
S5b MCP band   short pitch for Claude and ChatGPT; links to mcp.html
S6 Pricing     7 days free, refund within 3 days of the first payment (draft terms)
S7 Details     thinking orb, Max thinking, running halo, reading font, send
S8 Call to action, footer; FAQ on faq.html
```

`v2.css` holds the v2 sections and loads after `style.css`. `style.css` still holds
rules of the earlier bands that the page no longer uses.

## MCP page (`mcp.html`)

The MCP gateway is also a product on its own: an AI app (Claude, ChatGPT,
Claude Code, Cursor, Codex) gets Pi's eight tools on the user's computer. It
needs no iPhone app. Thus it has its own page and a nav item, and the home page
keeps one short band that links to it. The nav label is "Claude & ChatGPT",
the same as the app's Settings entry; "MCP" is the page's eyebrow.

Source: `../pi-remote/docs/mcp-gateway/index.md`, `app-entry.md`, ADR 0013 and
0014. The page states that this channel is not end-to-end encrypted (ADR 0013).
The address `pi-remote.example` and the price are placeholders.
`mcp.js` runs its demo; `waitlist.js` drives the sheet on both pages.

## Demo stage

- Phone screens follow the shipped iOS app (Simulator reference, 2026-10-10):
  Updates feed, update detail with the ask bar and its discussion sheet, Todo with
  Select -> Follow up together, the ATU chat with reply options and the to-do change
  card, the Pair Mac scanner. Onboarding screens are not a source; they are drafts.
- The Mac window (pairing code, scheduled tasks, ATU work log) is a concept surface.
  The shipped product pairs from the terminal (`pi-remote pair`). The page does not
  show a terminal, on purpose.
- The stage is drawn at 1080 x 660 (compact: 440 x 820 below 700 px) and scaled.
  The phone is drawn at 390 x 844 pt.
- Scenes play in order while the stage is on screen. A tab click or any click in
  the phone stops autoplay. In manual use, the tab bar, cards, Back, the ask bar,
  Select, the to-do rows, Follow up and the reply options work.
- Reduced motion: no autoplay; a scene shows its final state at once.
- Scan: the code is centred in the camera, then the reticle locks onto the
  code's measured box (`lockOn`), so the two always line up.
- The empty chat draws the production thinking orb, state `composing`.
  `thinking-orb.js` is a copy of `../pi-remote/web/thinking-orb.js` (MIT);
  refresh it from there.
- To-do scene: after the chosen time, ATU books it, the to-do is done and
  fireworks burst from the done card. This is a concept; the app does not
  have it yet.
- Details: the running halo ports `.cblock.beaming` from `../pi-remote/web/app.css`
  (stroke and glow a little stronger for the page). The Max aura ports
  `NativeMaxEffortAura`. The reading face is Newsreader, a Latin subset in
  `fonts/` (OFL).
- The phone viewer accepts at most 64 supported files in the folder. Keep
  unused assets out of `site/`.
- The film grain is `assets/img/grain.png`. The phone viewer accepts no SVG data URL.
- Scripts take reused images from the hidden `.asset-bank` (`currentSrc`), so a
  preview sandbox can rewrite their paths.

## Behaviour

- Waitlist: see the next section.

## Waitlist sheet

Every Join button (hero, nav Early access, pricing card, closing card) opens one
sheet: a centred card on wide screens, a bottom sheet below 640 px.

```text
choose ── Continue with Google ──► done   "You're on the list" + Joined with Google
   │
   └──── any email + Join ───────► check  "Check your inbox" (confirm link)
                                     └─ Use another email ──► choose
same address again ──────────────► done   "You're already on the list"
```

- Google comes first. A typed Gmail address shows a tip that Google skips the
  confirmation email.
- After a join, the hero button reads "You're on the list" and the hint names the address.
- The consent line sits under the form (Spam Act: clear consent, unsubscribe).
- The email field is not a `<form>` and nothing uses `autofocus`: the phone preview
  sandbox blocks form submission and autofocus. Join and Enter call the same handler.
- Preview only: no network call. Google returns the sample `alex.chen@gmail.com`
  after 0.9 s. State stays in memory for the page view.
- Production plan: `google.accounts.id.renderButton` (outline, large, pill,
  `continue_with`) replaces the mock button. The Worker checks the Google ID token
  (signature, `aud`, `iss`, `exp`, `email_verified`) or a typed address with
  Turnstile, and stores it in D1. Not built yet.

## Open items

- Hero headline: option A is live; B and C are in the brief.
- Price, refund condition and the billing channel (App Store refunds are Apple's).
- Final name and logo, real Privacy and Terms pages.
- Waitlist backend (Worker, D1, Turnstile, Google client ID) and the confirmation
  email for typed addresses; the confirm step is a proposal, not a decision.
- ATU follow-up starts from the user. The page does not claim that ATU starts it.
- Review on a physical iPhone.
