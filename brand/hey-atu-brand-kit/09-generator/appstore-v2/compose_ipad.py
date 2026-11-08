# iPad set of the App Store screenshots v2 (2026-11-08), after Otter: the iPhone set's 7 pages,
# headlines and pop-outs, with a straight-on iPad Pro 13" portrait in place of the phone.
# 7 separate pages of 2064 x 2752 (App Store iPad 13" portrait), no panorama across the cuts.
# Page 1 has no 3D device; page 2 reuses the Mac, iPad mini and watch of the iPhone opening F.
# Run after render_screens.py and bezels.py (build.sh --ipad). Content: docs/app-store-screenshots/README.md
import asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image

H = pathlib.Path(__file__).resolve().parent
OUT = H / 'out'
OUT.mkdir(exist_ok=True)
S = H.as_uri()
KIT = H.parents[1].as_uri()                                    # brand/hey-atu-brand-kit
SITE = (H.parents[3] / 'website' / 'assets').resolve().as_uri()  # website -> ../pi-remote/site
W, HH, N = 2064, 2752, 7
TAG = 'ipad-r1'
NAMES = ['01-opening', '02-everywhere', '03-your-ai', '04-todo', '05-daily', '06-wiki', '07-watch']
FEAT = 150    # feature headline size


def hl(lines):
    return '<br>'.join(''.join(f'<span class="acc">{p}</span>' if i % 2 else p
                               for i, p in enumerate(l.split('*'))) for l in lines)


def text(x, y, size, lines, align='left', width=None):
    st = f'left:{x}px;top:{y}px;font-size:{size}px;text-align:{align}' + (f';width:{width}px' if width else '')
    return f'<div class="disp" style="{st}">{hl(lines)}</div>'


def head(k, lines, y=200):
    return text(k * W, y, FEAT, lines, align='center', width=W)


def img(src, left, top, width, z=4, cls='pop'):
    return f'<img class="{cls}" src="{src}" style="left:{left}px;top:{top}px;width:{width}px;z-index:{z}">'


def ipad(k, name, top, w=1640, z=3):
    # Apple iPad Pro 13" silver, portrait (2300 x 3000), centred on page k
    return img(f'{S}/ip13-{name}.png', k * W + (W - w) / 2, top, w, z=z, cls='dev')


def watchb(name, cx, cy, w, z=5):
    h = w * 3125 / 1917
    return img(f'{S}/watchb-{name}.png', cx - w / 2, cy - h / 2, w, z=z, cls='wt')


def watchs(name, cx, cy, w, z=5):
    h = w * 2122 / 1917
    return img(f'{S}/watchs-{name}.png', cx - w / 2, cy - h / 2, w, z=z, cls='wt')


def grid(k, names, y0, size=200, gap=52, cols=6):
    x0 = k * W + (W - cols * size - (cols - 1) * gap) / 2
    out = []
    for i, n in enumerate(names + ['…']):
        x, y = x0 + (i % cols) * (size + gap), y0 + (i // cols) * (size + gap)
        st = f'left:{x}px;top:{y}px;width:{size}px;height:{size}px;border-radius:{size * .26}px'
        if n == '…':
            out.append(f'<div class="tile more" style="{st}"><i></i><i></i><i></i></div>')
        else:
            out.append(f'<div class="tile" style="{st}"><img src="{SITE}/providers/{n}.png"></div>')
    return ''.join(out)


# 1 opening: logo, the headline on two lines, the iPad with the chats sidebar beside the chat
P1 = ''.join([
    f'<img src="{KIT}/01-logo/svg/atu-lockup-horizontal-on-dark.svg" style="position:absolute;left:140px;top:150px;height:120px;z-index:5">',
    text(140, 370, 136, ['Keep your AI working', 'from your *iPad*.']),
    ipad(0, 'chat', 800, 1760),
])

# 2 every screen: the Mac, the iPad mini and the watch of opening F, larger, the headline on top
k = W
P2 = ''.join([
    head(1, ['One Atu,', 'every *screen*.']),
    img(f'{S}/mac-desktop.png', k + 160, 640, 1750, z=2, cls='dev'),
    img(f'{S}/ipadm.png', k + 947, 1530, 970, z=3, cls='dev'),
    watchb('talk', k + 729, 2350, 525, z=5),
])

# 3 your AI: provider tiles under the headline, the providers sheet, the model card pops out
k = 2 * W
PROVIDERS = ['openai', 'claude', 'google', 'deepseek', 'qwen', 'kimi',
             'githubcopilot', 'xai', 'zhipu', 'minimax', 'openrouter']
P3 = ''.join([
    head(2, ['Bring your own', '*AI* plan.']),
    grid(2, PROVIDERS, 590),
    ipad(2, 'providers', 1160, 1600),
    img(f'{S}/scr-picker.png', k + 1130, 1800, 820, z=5, cls='card'),
])

# 4 to-dos: the chat line that became a to-do, and the follow-up sheet
k = 3 * W
P4 = ''.join([
    head(3, ['AI writes to-dos.', 'You *follow up*.']),
    ipad(3, 'todo', 760),
    img(f'{S}/scr-addcard.png', k + 1020, 1330, 960, z=5),
    img(f'{S}/scr-followup.png', k + 110, 1830, 1300, z=6),
])

# 5 daily tasks: the scenes card pops out
k = 4 * W
P5 = ''.join([
    head(4, ['Run your own', '*daily* tasks.']),
    ipad(4, 'updates', 760),
    img(f'{S}/scr-scenes.png', k + 80, 1900, 900, z=5, cls='card'),
])

# 6 wiki: the # Japan trip tag pops out of its card
k = 5 * W
P6 = ''.join([
    head(5, ['A *wiki* that', 'writes itself.']),
    ipad(5, 'wiki', 760),
    img(f'{S}/scr-gtag.png', k + 560, 1520, 640, z=5, cls='card'),
    img(f'{S}/scr-gn1.png', k + 1330, 2000, 520, z=5, cls='card'),
])

# 7 watch: the iPad from the top (cut above the date row), headline, two watches
k = 6 * W
P7 = ''.join([
    ipad(6, 'days', -245, 1300),               # cut above the date row
    head(6, ['Record your day', 'on your *wrist*.'], y=1600),
    watchs('rec', k + 700, 2360, 520),
    watchs('reply-ipad', k + 1364, 2300, 520),
])

CSS = f'''
@font-face{{font-family:"Departure Mono";src:url("{KIT}/07-fonts-and-tokens/fonts/DepartureMono-Regular.ttf")}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{-webkit-font-smoothing:antialiased}}
.pano{{position:relative;width:{W * N}px;height:{HH}px;overflow:hidden;background:#0E0E10}}
.page{{position:absolute;top:0;height:{HH}px;width:{W}px;overflow:hidden}}
.dots{{position:absolute;inset:0;z-index:0;background-image:radial-gradient(rgba(255,255,255,.13) 2.4px,transparent 2.8px);background-size:46px 46px;-webkit-mask-image:linear-gradient(#000 0%,transparent 72%)}}
.glow{{position:absolute;border-radius:50%;z-index:0;background:radial-gradient(rgba(217,128,58,.24),transparent 65%)}}
.disp{{position:absolute;z-index:7;font-family:"Departure Mono",monospace;letter-spacing:-.01em;line-height:1.05;color:#F7F7F8}}
.disp .acc{{color:#D9803A}}
.dev{{position:absolute;filter:drop-shadow(0 80px 90px rgba(0,0,0,.55)) drop-shadow(0 0 2px rgba(255,255,255,.25))}}
.wt{{position:absolute;filter:drop-shadow(0 50px 60px rgba(0,0,0,.6)) drop-shadow(0 0 2px rgba(255,255,255,.3))}}
.pop{{position:absolute;filter:drop-shadow(0 50px 70px rgba(0,0,0,.55))}}
.card{{position:absolute;border-radius:60px;filter:drop-shadow(0 50px 70px rgba(0,0,0,.55))}}
.tile{{position:absolute;z-index:4;background:#fff;display:grid;place-items:center;box-shadow:0 30px 60px rgba(0,0,0,.45)}}
.tile img{{width:62%;height:62%;object-fit:contain}}
.tile.more{{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 3px rgba(255,255,255,.16);display:flex;gap:16px;justify-content:center;align-items:center}}
.tile.more i{{width:18px;height:18px;border-radius:50%;background:#F7F7F8}}
'''


async def main():
    # Each page is clipped to itself, so nothing runs across a cut.
    pages = ''
    for i, body in enumerate([P1, P2, P3, P4, P5, P6, P7]):
        bg = ('<div class="dots"></div>'
              f'<div class="glow" style="left:-500px;top:-560px;width:1700px;height:1700px"></div>'
              f'<div class="glow" style="left:900px;top:1500px;width:1700px;height:1700px;opacity:.5"></div>')
        # the elements carry page offsets (k * W); move them back inside the clipped page
        pages += f'<div class="page" style="left:{i * W}px">{bg}<div style="position:absolute;left:{-i * W}px;top:0;width:{W * N}px;height:{HH}px">{body}</div></div>'
    html = H / 'pano-ipad.html'
    html.write_text(f'<!doctype html><meta charset="utf-8"><style>{CSS}</style><body><div class="pano">{pages}</div></body>')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': W * N, 'height': HH})
        await pg.goto(html.as_uri()); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1500)
        png = OUT / f'panorama-{TAG}.png'
        await pg.screenshot(path=str(png))
        await b.close()
    pano = Image.open(png).convert('RGB')
    for i, n in enumerate(NAMES):
        pano.crop((i * W, 0, (i + 1) * W, HH)).save(OUT / f'{TAG}-hey-atu-ipad-{n}.png')
    # overview: the 7 pages side by side with gaps
    s = 0.2
    tw, th = round(W * s), round(HH * s)
    sheet = Image.new('RGB', (N * tw + (N - 1) * 24, th), (255, 255, 255))
    for i in range(N):
        sheet.paste(pano.crop((i * W, 0, (i + 1) * W, HH)).resize((tw, th), Image.LANCZOS), (i * (tw + 24), 0))
    sheet.save(OUT / f'{TAG}-all.jpg', quality=88)
    print('done', OUT)


asyncio.run(main())
