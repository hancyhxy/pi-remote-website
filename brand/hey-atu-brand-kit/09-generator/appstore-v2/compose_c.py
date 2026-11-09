# Style C, round 4 (2026-11-07): 7 slices of one panorama, dark palette of style A.
# Kept in brand/hey-atu-brand-kit/09-generator/appstore-v2 (README.md there): build.sh runs the steps.
# 1-2 opening: tilted phone that runs 10% into page 2; Mac, Watch, iPad · 3 Your AI: providers count line
# under the headline, big phone cut by the bottom · 4 To-dos + follow up · 5 Daily tasks ·
# 6 Wiki: home in front of the # Japan trip page · 7 phone from the top, headline, two watches.
# Content: heyatu-marketing/docs/app-store-screenshots/README.md
# Usage: pyx compose_c.py [--p1-flat]   (--p1-flat: page 1 with the flat bezel phone instead of the 3D one)
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

H = pathlib.Path(__file__).resolve().parent
OUT = H / 'out'
OUT.mkdir(exist_ok=True)
S = H.as_uri()
KIT = H.parents[1].as_uri()                                    # brand/hey-atu-brand-kit
SITE = (H.parents[3] / 'website' / 'assets').resolve().as_uri()  # website -> ../pi-remote/site
W, HH, N = 1320, 2868, 7
P1_3D = '--p1-flat' not in sys.argv   # page 1: the 3D phone (real-object style of pages 1-2)
OPEN = sys.argv[sys.argv.index('--open') + 1] if '--open' in sys.argv else 'F'   # opening version, round 6
TAG = 'r6' + OPEN.lower()
NAMES = ['01-opening', '02-everywhere', '03-your-ai', '04-todo', '05-daily', '06-wiki', '07-watch']
FEAT = 106    # feature headline size


def hl(lines):
    return '<br>'.join(''.join(f'<span class="acc">{p}</span>' if i % 2 else p
                               for i, p in enumerate(l.split('*'))) for l in lines)


def text(x, y, size, lines, align='left', width=None):
    st = f'left:{x}px;top:{y}px;font-size:{size}px;text-align:{align}' + (f';width:{width}px' if width else '')
    return f'<div class="disp" style="{st}">{hl(lines)}</div>'


def head(k, lines, y=210):
    return text(k * W, y, FEAT, lines, align='center', width=W)


def img(src, left, top, width, z=4, cls='pop', rot=0):
    return f'<img class="{cls}" src="{src}" style="left:{left}px;top:{top}px;width:{width}px;z-index:{z};transform:rotate({rot}deg)">'


def phone(name, cx, top, w=860, rot=0, z=3):
    # Apple iPhone 17 Pro bezel, straight-on (1350 x 2760); (cx, top) is the top centre before rotation
    h = w * 2760 / 1350
    return (f'<img class="dev" src="{S}/ph2d-{name}.png" style="left:{cx - w / 2}px;top:{top}px;width:{w}px;height:{h}px;'
            f'z-index:{z};transform:rotate({rot}deg)">')


def phone3d(name, cx, cy, k=1.0, z=3):
    w, h = 1300 * k, 2300 * k
    return f'<img class="dev" src="{S}/ph3g-{name}.png" style="left:{cx - w / 2}px;top:{cy - h / 2}px;width:{w}px;height:{h}px;z-index:{z}">'


def mac(left, top, w, z=3):
    return img(f'{S}/mac-desktop.png', left, top, w, z=z, cls='dev')


def watchb(name, cx, cy, w, z=5):
    # Apple Watch Series 11, silver aluminium with the Purple Fog sport band (1917 x 3125)
    h = w * 3125 / 1917
    return img(f'{S}/watchb-{name}.png', cx - w / 2, cy - h / 2, w, z=z, cls='wt')


def watchs(name, cx, cy, w, z=5):
    # Apple Watch Series 11, silver aluminium case without the band (1917 x 2122), front view
    h = w * 2122 / 1917
    return img(f'{S}/watchs-{name}.png', cx - w / 2, cy - h / 2, w, z=z, cls='wt')


def watch(name, cx, cy, w, z=5):
    # Apple Watch Ultra with its band (600 x 960); the screen is at the centre of the image
    h = w * 960 / 600
    return img(f'{S}/watch-{name}.png', cx - w / 2, cy - h / 2, w, z=z, cls='wt')


def grid(k, names, y0, size=140, gap=40, cols=6):
    # provider tiles in neat rows under the headline, the last cell "more"
    x0 = k * W + (W - cols * size - (cols - 1) * gap) / 2
    cells = names + ['…']
    out = []
    for i, n in enumerate(cells):
        x, y = x0 + (i % cols) * (size + gap), y0 + (i // cols) * (size + gap)
        st = f'left:{x}px;top:{y}px;width:{size}px;height:{size}px;border-radius:{size * .26}px'
        if n == '…':
            out.append(f'<div class="tile more" style="{st}"><i></i><i></i><i></i></div>')
        else:
            out.append(f'<div class="tile" style="{st}"><img src="{SITE}/providers/{n}.png"></div>')
    return ''.join(out)


def logo(left, top, width, rot):
    return img(f'{SITE}/brand/atu-outline.svg', left, top, width, z=6, cls='logo', rot=rot)


# ---- pages 1-2: opening (round 6: two versions) ------------------------------------------
LOGO = f'<img src="{KIT}/01-logo/svg/atu-lockup-horizontal-on-dark.svg" style="position:absolute;left:100px;top:150px;height:96px;z-index:5">'
HEAD1 = text(92, 300, 184, ['Keep your', 'AI working', 'from your', '*phone*.'])
HEAD2 = text(W + 110, 2390, 128, ['One Atu,', 'every *screen*.'], align='right', width=W - 220)
if OPEN == 'A':
    # A: phone and desktop only. Two 3D phones as in the Otter opening, facing each other:
    # page 1 the chats drawer open with many tasks, page 2 (mirrored) the chat of one task.
    # The desktop sits behind on page 2.
    P1 = LOGO + HEAD1 + phone3d('p1-drawer', 760, 2330, 1.0, z=5)
    P2 = ''.join([
        mac(W + 190, 250, 1080, z=2),
        phone3d('p2-chat-mirror', W + 440, 1420, 0.98, z=4),
        HEAD2,
    ])
elif OPEN in ('C', 'D', 'E', 'F'):
    # Page 1 the chats drawer open (Xinyi 2026-11-07: the navigation goes on page 1).
    P1 = LOGO + HEAD1 + phone3d('p1-drawer', 935, 2300, 1.02)
    if OPEN == 'C':
        # C: page 2 of B. The Mac and the iPad show the navigation and the chat together.
        P2 = ''.join([
            mac(W + 70, 430, 1200, z=2),
            img(f'{S}/dev-ipad.png', W + 440, 1030, 850, z=3, cls='dev'),
            watchb('talk', W + 380, 1620, 360, z=4),
            HEAD2,
        ])
    elif OPEN == 'F':
        # F: E without the phone (Xinyi 2026-11-07). Real sizes as in E: the Mac at the back,
        # the iPad mini over its lower right, the watch in front, below the Mac, against the iPad.
        # Mac and watch at the sizes of B (Xinyi 2026-11-07); the iPad mini at its real size against
        # the Mac: Mac screen 976 px = 29.0 cm, iPad mini screen 17.8 cm -> 666 px image width.
        P2 = ''.join([
            mac(W + 70, 430, 1200, z=2),
            img(f'{S}/ipadm.png', W + 610, 1040, 666, z=3, cls='dev'),
            watchb('talk', W + 460, 1620, 360, z=5),
            HEAD2,
        ])
    elif OPEN == 'E':
        # E: D with the iPad. The Mac at the back; the iPad over its lower left; the phone with
        # the chat over the right of both; the watch in front at the lower left.
        # Sizes follow the real devices, with the Mac as a 13-inch MacBook Air (screen 29.0 cm):
        # Mac 1180 px wide (screen 960 px, 33 px/cm); iPad mini landscape, screen 17.8 cm -> 655 px;
        # the iPhone 1.2x and the watch about 1.9x their real size, so they still read.
        P2 = ''.join([
            mac(W + 60, 520, 1180, z=2),
            img(f'{S}/ipadm.png', W + 130, 1120, 655, z=3, cls='dev'),
            phone('p2-code', W + 900, 1000, 296, z=4),
            watchb('talk', W + 250, 1790, 260, z=5),
            HEAD2,
        ])
    else:
        # D: page 2 as the site-v3 hero: the Mac at the back, a phone with the chat over its
        # lower right, the watch in front at the lower left. No iPad.
        P2 = ''.join([
            mac(W + 60, 430, 1200, z=2),
            phone('p2-code', W + 1010, 860, 470, z=3),
            watchb('talk', W + 330, 1560, 360, z=4),
            HEAD2,
        ])
else:
    # B: every screen. Page 1 the chat of one task; page 2 the devices overlap as in the
    # site-v3 hero: the desktop at the back, the iPad over its lower right, the watch in front.
    P1 = LOGO + HEAD1 + phone3d('p1-chat', 935, 2300, 1.02)
    P2 = ''.join([
        mac(W + 70, 430, 1200, z=2),
        img(f'{S}/dev-ipad.png', W + 440, 1030, 850, z=3, cls='dev'),
        watchb('talk', W + 380, 1620, 360, z=4),
        HEAD2,
    ])

# ---- page 3: your AI ---------------------------------------------------------------------
k = 2 * W
# No third-party logos (trademark risk, Xinyi 2026-11-08); one line says how many providers.
# 25+: Pi lists 29 vendors once regional and plan entries are merged (pi-ai models.generated).
P3 = ''.join([
    head(2, ['Bring your own', '*AI* plan.']),
    text(k, 500, 60, ['Works with *25+* AI providers.'], align='center', width=W),
    phone('p3-providers', k + 660, 720, 1000),                        # cut by the bottom edge
    img(f'{S}/scr-picker.png', k + 610, 1690, 660, z=5, cls='card'),
])

# ---- page 4: AI writes the to-dos, you follow up -------------------------------------------
k = 3 * W
P4 = ''.join([
    head(3, ['AI writes to-dos.', 'You *follow up*.']),
    phone('p4-todo', k + 660, 1700 - 879),
    img(f'{S}/scr-addcard.png', k + 520, 1090, 760, z=5),           # the AI part: a chat line became a to-do
    img(f'{S}/scr-followup.png', k + 150, 1880, 1020, z=6),          # follow up, the biggest popout
])

# ---- page 5: daily tasks ------------------------------------------------------------------
k = 4 * W
P5 = ''.join([
    head(4, ['Run your own', '*daily* tasks.']),
    phone('p5-updates', k + 700, 1720 - 879),
    img(f'{S}/scr-scenes.png', k + 50, 2010, 640, z=5, cls='card'),
])

# ---- page 6: wiki: the home in front, the # Japan trip page behind it ---------------------
k = 5 * W
P6 = ''.join([
    head(5, ['A *wiki* that', 'writes itself.']),
    phone('p6-jtrip', k + 910, 540, 740, z=2),
    phone('p6-wiki', k + 470, 1150, 820, z=3),
])

# ---- page 7: phone from the top, headline in the middle, two watches below ------------------
k = 6 * W
P7 = ''.join([
    phone('p7-days', k + 660, -289, 900),                             # cut above the date row
    head(6, ['Record your day', 'on your *wrist*.'], y=1625),
    watchs('rec', k + 355, 2400, 540),
    watchs('reply', k + 965, 2320, 540),
])

# ---- stickers across cuts: none ----------------------------------------------------------
STICK = ''   # no Atu heads across the cuts (Xinyi 2026-11-08); was logo() at 4W-180 and 5W-160

CSS = f'''
@font-face{{font-family:"Departure Mono";src:url("{KIT}/07-fonts-and-tokens/fonts/DepartureMono-Regular.ttf")}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{-webkit-font-smoothing:antialiased}}
.pano{{position:relative;width:{W * N}px;height:{HH}px;overflow:hidden;background:#0E0E10}}
.dots{{position:absolute;inset:0;z-index:0;background-image:radial-gradient(rgba(255,255,255,.13) 1.8px,transparent 2.1px);background-size:34px 34px;-webkit-mask-image:linear-gradient(#000 0%,transparent 72%)}}
.glow{{position:absolute;border-radius:50%;z-index:0;background:radial-gradient(rgba(217,128,58,.24),transparent 65%)}}
.disp{{position:absolute;z-index:7;font-family:"Departure Mono",monospace;letter-spacing:-.01em;line-height:1.05;color:#F7F7F8}}
.disp .acc{{color:#D9803A}}
.dev{{position:absolute;filter:drop-shadow(0 60px 70px rgba(0,0,0,.55)) drop-shadow(0 0 1.5px rgba(255,255,255,.25))}}
.wt{{position:absolute;filter:drop-shadow(0 40px 50px rgba(0,0,0,.6)) drop-shadow(0 0 1.5px rgba(255,255,255,.3))}}
.pop{{position:absolute;filter:drop-shadow(0 40px 60px rgba(0,0,0,.55))}}
.card{{position:absolute;border-radius:48px;filter:drop-shadow(0 40px 60px rgba(0,0,0,.55))}}
.tile{{position:absolute;z-index:4;background:#fff;display:grid;place-items:center;box-shadow:0 24px 50px rgba(0,0,0,.45)}}
.tile img{{width:62%;height:62%;object-fit:contain}}
.tile.more{{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 2px rgba(255,255,255,.16);display:flex;gap:12px;justify-content:center;align-items:center}}
.tile.more i{{width:14px;height:14px;border-radius:50%;background:#F7F7F8}}
.logo{{position:absolute;filter:url(#rim) drop-shadow(0 24px 30px rgba(0,0,0,.5))}}
'''

FILTER = ('<svg width="0" height="0" style="position:absolute"><filter id="rim" x="-25%" y="-25%" width="150%" height="150%">'
          '<feMorphology in="SourceAlpha" operator="dilate" radius="16" result="d"/>'
          '<feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/>'
          '<feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>')


def mark(pano, out, a, b, width):
    # preview of pages a..b-1 with numbered, dashed cut lines
    im = pano.crop((a * W, 0, b * W, HH)).copy()
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 96)
    for kk in range(1, b - a):
        x = kk * W
        for y in range(0, HH, 90):
            d.rectangle([x - 5, y, x + 5, y + 50], fill=(0, 140, 255))
    for kk in range(b - a):
        cx = kk * W + W // 2
        d.rounded_rectangle([cx - 80, 30, cx + 80, 170], 40, fill=(0, 140, 255))
        d.text((cx, 100), str(a + kk + 1), fill='white', font=f, anchor='mm')
    s = width / im.width
    im.resize((round(im.width * s), round(HH * s)), Image.LANCZOS).save(out, quality=86)


async def main():
    bg = ('<div class="dots"></div>'
          + ''.join(f'<div class="glow" style="left:{kk * W - 320}px;top:-360px;width:1100px;height:1100px"></div>' for kk in range(N))
          + f'<div class="glow" style="left:{W - 500}px;top:1500px;width:1300px;height:1300px;opacity:.6"></div>')
    html = H / 'pano-c.html'
    html.write_text(f'<!doctype html><meta charset="utf-8"><style>{CSS}</style><body>{FILTER}<div class="pano">'
                    f'{bg}{P1}{P2}{P3}{P4}{P5}{P6}{P7}{STICK}</div></body>')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': W * N, 'height': HH})
        await pg.goto(html.as_uri()); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1000)
        png = OUT / f'panorama-{TAG}.png'
        await pg.screenshot(path=str(png))
        await b.close()
    pano = Image.open(png).convert('RGB')
    for i, n in enumerate(NAMES):
        pano.crop((i * W, 0, (i + 1) * W, HH)).save(OUT / f'{TAG}-hey-atu-iphone-{n}.png')
    mark(pano, OUT / f'{TAG}-marked-all.jpg', 0, N, 3200)
    mark(pano, OUT / f'{TAG}-marked-p12.jpg', 0, 2, 1600)
    mark(pano, OUT / f'{TAG}-marked-p345.jpg', 2, 5, 2100)
    mark(pano, OUT / f'{TAG}-marked-p67.jpg', 5, 7, 1600)
    print('done', OUT)


asyncio.run(main())
