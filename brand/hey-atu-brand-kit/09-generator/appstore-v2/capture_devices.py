import asyncio, json, pathlib
from playwright.async_api import async_playwright
H=pathlib.Path(__file__).resolve().parent
PIR=(H.parents[3]/'website').resolve().parent  # the pi-remote checkout
P=str(PIR/'docs/product')+'/'
TR={"修复搜索分页测试":"Fix search paging test","检查搜索测试":"Check search tests","Relay 部署脚本加重试":"Add retries to deploy script",
"桌面版原型":"Landing page copy","整理十月发票":"Sort October invoices","周报生成":"Weekly report",
"为什么搜索有两个测试失败？":"Why do two search tests fail?","分页测试读到了旧的一页。":"The paging test reads a stale page.",
"新查询之后，缓存还留着第 1 页。":" After a new query, the cache still holds page 1.","新查询时清空缓存。":"Clear the cache on a new query.",
"「加载更多」时保留缓存。":"Keep it for “Load more”.","报告在":"Report in","修好它，再跑一遍测试":"Fix it and run the tests again","Message Pi":"Message Atu"}
JS='''(tr) => { const tw=document.createTreeWalker(document.getElementById('win'), NodeFilter.SHOW_TEXT); let n, miss=[];
 while(n=tw.nextNode()){ let t=n.textContent; const k=t.trim(); if(tr[k]!==undefined) n.textContent=t.replace(k,tr[k]);
   else { t=t.replace(/~\\/on_board\\/pi-remote/g,'~/code/web-app').replace(/\\bpi-remote\\b/g,'web-app').replace(/\\bon_board\\b/g,'personal').replace(/\\bloadshift\\b/g,'side-project'); n.textContent=t; if(/[\\u4e00-\\u9fff]/.test(t)) miss.push(t.trim()); } } return miss; }'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1440,'height':1200}, device_scale_factor=2)
        await pg.goto('file://'+P+'desktop-mockup/index.html'); await pg.wait_for_timeout(1500)
        miss = await pg.evaluate(JS, TR); print('untranslated', json.dumps(miss, ensure_ascii=False))
        await (await pg.query_selector('#win')).screenshot(path=str(H/'dev-desktop.png'))
        pw = await b.new_page(viewport={'width':1300,'height':1400}, device_scale_factor=4)
        await pw.goto('file://'+P+'watch-days-mockup/index.html'); await pw.wait_for_timeout(2500)
        cases = await pw.query_selector_all('.wv-case')
        for i,name in [(1,'rec'),(8,'talk'),(9,'reply'),(3,'marked')]:
            el = cases[i]; await el.scroll_into_view_if_needed(); await pw.wait_for_timeout(300)
            bb = await el.bounding_box()
            await el.evaluate('e => { let a=e.parentElement; while(a){ a.style.setProperty("background","transparent","important"); a=a.parentElement; } }')
            await pw.screenshot(path=str(H/f'dev-watch-{name}.png'), clip={'x':bb['x']-2,'y':bb['y']-2,'width':bb['width']+16,'height':bb['height']+4}, omit_background=True)
        await b.close()
asyncio.run(main())
