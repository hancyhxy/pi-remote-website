import asyncio, pathlib
from playwright.async_api import async_playwright
H=pathlib.Path(__file__).resolve().parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1700,'height':1000}, device_scale_factor=3)
        pad = await b.new_page(viewport={'width':1500,'height':1100}, device_scale_factor=2)
        await pad.goto((H/'screens.html').as_uri()); await pad.wait_for_timeout(800)
        await (await pad.query_selector('#pad')).screenshot(path=str(H/'scr-pad.png'))
        await (await pad.query_selector('#padm')).screenshot(path=str(H/'scr-padm.png'))
        # iPad Pro 13" portrait screens for the iPad set (1032 x 1376 pt -> 2064 x 2752 px)
        for n in ['ip-chat', 'ip-todo', 'ip-updates', 'ip-wiki', 'ip-space']:
            await (await pad.query_selector('#'+n)).screenshot(path=str(H/f'scr-{n}.png'))
        # ip-providers has scr-ip-chat.png under it: load the page again with the new file
        await pad.reload(); await pad.wait_for_timeout(800)
        await (await pad.query_selector('#ip-providers')).screenshot(path=str(H/'scr-ip-providers.png'))
        await pg.goto((H/'screens.html').as_uri()); await pg.wait_for_timeout(800)
        for n in ['code','code2','drawer','todo','updates','task','wiki','days','providers','picker','scenes','addcard','followup','gtag','gn1','gn2','gn3','gn4','gn5','jtrip','drawer2','drawer3','space','spadd','spmenu']:
            await (await pg.query_selector('#'+n)).screenshot(path=str(H/f'scr-{n}.png'), omit_background=n in ('picker','scenes','addcard','followup','gtag','gn1','gn2','gn3','gn4','gn5','spadd','spmenu'))
        # drawer3 has scr-code.png under it: load the page again with the new file
        await pg.reload(); await pg.wait_for_timeout(800)
        await (await pg.query_selector('#drawer3')).screenshot(path=str(H/'scr-drawer3.png'))
        await b.close()
asyncio.run(main())
