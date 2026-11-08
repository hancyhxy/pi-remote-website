# Puts screens into Apple's flat product bezels (round 4: every device is a flat, straight-on bezel).
#   iPhone 17 Pro silver (mockify / Apple Product Bezels)  -> ph2d-<name>.png  (1350 x 2760)
#   MacBook Air midnight (ParthJadhav/app-store-screenshots) -> mac-desktop.png (3540 x 2300)
#   Apple Watch Ultra (same source)                          -> watch-<name>.png (600 x 960)
#   Apple Watch Series 11 46mm silver, band cut off           -> watchs-<name>.png (1917 x 2122)
#     from Apple Design Resources Bezel-Apple-Watch-Series-11-2025.dmg (PSD smart object, bezels/aw11/)
# The screen goes under the bezel through the bezel's own hole (the transparent area at its centre).
# Usage: pyx bezels.py            (all)    |   pyx bezels.py watch   (re-capture the watch screens first)
import asyncio, pathlib, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

H = pathlib.Path(__file__).resolve().parent
PIR = (H.parents[3] / 'website').resolve().parent   # the pi-remote checkout (website -> ../pi-remote/site)
WATCH_HTML = str(PIR / 'docs/product/watch-days-mockup/index.html')

PHONES = {  # name: screen
    'p1-task': 'scr-task.png', 'p3-providers': 'scr-providers.png', 'p4-todo': 'scr-todo.png',
    'p5-updates': 'scr-updates.png', 'p6-wiki': 'scr-wiki.png', 'p6-jtrip': 'scr-jtrip.png', 'p7-days': 'scr-days.png', 'p2-code': 'scr-code.png',
}
WATCHES = {'rec': 1, 'talk': 8, 'reply': 9}   # index of .wv-case in the watch mockup


def hole(bezel):
    a = np.array(bezel)[:, :, 3]
    lab, _ = ndimage.label(a < 128)
    m = lab == lab[a.shape[0] // 2, a.shape[1] // 2]
    ys, xs = np.where(m)
    m = ndimage.binary_dilation(m, iterations=3)
    return Image.fromarray((m * 255).astype('uint8')), (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))


def mac_screen(win, w=2880, h=1864):
    # The window fills the width; a light menu bar takes the rest of the height, so the notch sits
    # in the menu bar as on a real Mac and the window is not cropped.
    from PIL import ImageDraw, ImageFont
    win = win.convert('RGBA')
    win = win.resize((w, round(win.height * w / win.width)), Image.LANCZOS)
    bar = h - win.height
    scr = Image.new('RGBA', (w, h), (236, 236, 239, 255))
    scr.paste(win, (0, bar))
    d = ImageDraw.Draw(scr)
    f = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', round(bar * .42))
    fb = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', round(bar * .42))
    x = 70
    for i, t in enumerate(['Hey Atu', 'File', 'Edit', 'View', 'Window', 'Help']):
        d.text((x, bar / 2), t, fill=(30, 30, 32), font=fb if i == 0 else f, anchor='lm')
        x += d.textlength(t, font=f) + 44
    d.text((w - 70, bar / 2), 'Tue 3 Nov  9:41', fill=(30, 30, 32), font=f, anchor='rm')
    return scr


def put(bezel_path, screen, out):
    bz = Image.open(bezel_path).convert('RGBA')
    mask, (l, t, r, b) = hole(bz)
    pad = 3
    scr = cover(screen.convert('RGBA'), r - l + 2 * pad, b - t + 2 * pad)
    layer = Image.new('RGBA', bz.size, (0, 0, 0, 0))
    layer.paste(scr, (l - pad, t - pad))
    canvas = Image.new('RGBA', bz.size, (0, 0, 0, 0))
    canvas.paste(layer, (0, 0), mask)
    canvas.alpha_composite(bz)
    canvas.save(H / out)
    print('wrote', out)


async def capture_watch():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 1400}, device_scale_factor=5)
        await pg.goto('file://' + WATCH_HTML); await pg.wait_for_timeout(2500)
        cases = await pg.query_selector_all('.wv-case')
        for name, i in WATCHES.items():
            scr = await cases[i].query_selector('.wv-scr')
            await scr.scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
            # square corners: the bezel hole gives the round ones
            await scr.evaluate('e => e.style.borderRadius = "0"')
            await scr.screenshot(path=str(H / f'wscr-{name}.png'))
            print('captured', name)
            if name == 'reply':
                # the iPad set: the same reply with "Open on iPad" (Xinyi 2026-11-08)
                await scr.evaluate('e => e.querySelectorAll(".wv-btn").forEach(b => b.textContent = b.textContent.replace("iPhone", "iPad"))')
                await scr.screenshot(path=str(H / 'wscr-reply-ipad.png'))
                print('captured reply-ipad')
        await b.close()


def main(args):
    if 'watch' in args or not all((H / f'wscr-{n}.png').exists() for n in [*WATCHES, 'reply-ipad']):
        asyncio.run(capture_watch())
    for n, s in PHONES.items():
        put(H / 'bezels/iphone-17-pro-silver.png', Image.open(H / s), f'ph2d-{n}.png')
    put(H / 'bezels/parth-mac.png', mac_screen(Image.open(H / 'dev-desktop.png')), 'mac-desktop.png')
    # iPad mini (A20 Pro) Starlight, landscape (Apple Design Resources Bezel-iPad-mini-(A20-Pro).dmg)
    put(H / 'bezels/ipad-mini-starlight-land.png', Image.open(H / 'scr-padm.png'), 'ipadm.png')
    # iPad Pro (M5) 13" Silver, portrait (Apple Design Resources Bezel-iPad-Pro-(M5).dmg), for the iPad set
    for n in ['chat', 'providers', 'todo', 'updates', 'wiki', 'days']:
        if (H / f'scr-ip-{n}.png').exists():
            put(H / 'bezels/ipad-pro-13-silver-port.png', Image.open(H / f'scr-ip-{n}.png'), f'ip13-{n}.png')
    for n in WATCHES:
        put(H / 'bezels/parth-watch.png', Image.open(H / f'wscr-{n}.png'), f'watch-{n}.png')
        # Apple Watch Series 11 46mm, silver aluminium case without the band (as the site-v3 hero)
        put(H / 'bezels/aw11-silver-case.png', Image.open(H / f'wscr-{n}.png'), f'watchs-{n}.png')
        put(H / 'bezels/aw11-silver-band.png', Image.open(H / f'wscr-{n}.png'), f'watchb-{n}.png')   # with the Purple Fog band
    put(H / 'bezels/aw11-silver-case.png', Image.open(H / 'wscr-reply-ipad.png'), 'watchs-reply-ipad.png')


main(sys.argv[1:])
