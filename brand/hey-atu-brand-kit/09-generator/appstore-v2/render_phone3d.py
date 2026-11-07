# Renders 3D phones (phone3d.html) to transparent PNGs: ph3d-<name>.png, canvas 1300 x 2300 CSS px at 2x.
# The phone is centred in the canvas at a fixed scale (about 870 CSS px wide when facing front).
# Usage: pyx render_phone3d.py [name ...]
import asyncio, functools, http.server, pathlib, sys, threading
from playwright.async_api import async_playwright

H = pathlib.Path(__file__).resolve().parent
# name: (screen, rx, ry, rz, finish)
SHOTS = {
    'p1-code': ('scr-code.png', 8, 22, -9, 'silver'),
    'p1-task': ('scr-task.png', -6, 18, 9, 'silver'),
    'p1-chat': ('scr-code.png', -6, 18, 9, 'silver'),           # round 6, B: page 1, a chat in a task
    'p1-drawer': ('scr-drawer3.png', -6, 18, 9, 'silver'),      # round 6, A: page 1, the drawer open
    'p2-chat-mirror': ('scr-code.png', -6, -18, -9, 'silver'),  # round 6, A: page 2, mirrored
    'p3-providers': ('scr-providers.png', 0, -10, 0, 'silver'),
    'p4-todo': ('scr-todo.png', 4, 12, 5, 'silver'),
    'p5-updates': ('scr-updates.png', 2, -8, 0, 'silver'),
}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(H))
    handler.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


PAGE, PREFIX = ('phone3d-glb.html', 'ph3g') if '--glb' in sys.argv else ('phone3d.html', 'ph3d')


async def main(names):
    srv = serve()
    port = srv.server_address[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 2300}, device_scale_factor=2)
        pg.on('console', lambda m: print('console:', m.text) if m.type in ('error', 'warning') else None)
        for n in names:
            scr, rx, ry, rz, fin = SHOTS[n]
            await pg.goto(f'http://127.0.0.1:{port}/{PAGE}?screen={scr}&rx={rx}&ry={ry}&rz={rz}&finish={fin}&dpr=2')
            await pg.wait_for_function('window.done === true', timeout=120000)
            await (await pg.query_selector('canvas')).screenshot(path=str(H / f'{PREFIX}-{n}.png'), omit_background=True)
            print('rendered', n, await pg.evaluate('JSON.stringify(window.info||{})'))
        await b.close()
    srv.shutdown()


asyncio.run(main([a for a in sys.argv[1:] if not a.startswith('--')] or list(SHOTS)))
