# App Store 截图 v2：生成脚本

样式 C 第六轮，开场 F 定稿（2026-11-07）。每张图想说什么、写什么、放哪个界面，见
[`docs/app-store-screenshots/README.md`](../../../../docs/app-store-screenshots/README.md)。

2026-11-08 Xinyi 确认 `out/r6f-*` 为上架定稿，已复制到 `03-stores/app-store/` 的 6.9 寸和 6.3 寸文件夹
（去掉 alpha，6.3 寸由 1320×2868 缩放）。手机界面是用 HTML 还原的 App。本文件夹仍不进下载包
（`build_zips.py` 跳过它，因为里面有苹果设备边框和 3D 模型原件）。

## 出图

```sh
./build.sh                 # 默认开场 F；切图在 out/r6f-*.png
./build.sh --open E        # 其他开场方案：A–F，见内容大纲
./build.sh --3d            # 先重新渲染 3D 手机（要 GPU，大约一分钟），改了第 1 张的界面时用
```

`build.sh` 依次运行下面几步，用的是 `pyx`（Python 3.12，带 Playwright、Pillow、NumPy、SciPy）。

| 步骤 | 脚本 | 输入 | 输出 |
|---|---|---|---|
| 1 界面 | `render_screens.py` | `screens.html`（按 App 现在的样子用 HTML 还原，示例数据全是英文） | `scr-*.png` |
| 2 3D 手机（`--3d`） | `render_phone3d.py --glb` + `phone3d-glb.html` | `scr-*.png`、`models/iphone-17-pro.glb` | `ph3g-*.png`（已提交，平时不用重渲；要联网，three.js 0.170.0 从 jsDelivr 取） |
| 3 设备边框 | `bezels.py` | `scr-*.png`、`bezels/`、`dev-desktop.png`、手表设计稿 | `ph2d-*.png`、`mac-desktop.png`、`ipadm.png`、`watch*-*.png` |
| 4 拼图 | `compose_c.py` | 上面的图、品牌套件的 Logo 和字体、官网的厂商图标 | `out/panorama-*.png`、7 张 1320 × 2868 切图、带切线编号的预览 `*-marked-*.jpg` |

第 1–3 步的输出都能重新生成，不提交（见 `.gitignore`）；只提交 3D 渲染图和 `out/r6f-*`。

## 依赖本文件夹以外的东西

- `../../07-fonts-and-tokens/fonts/DepartureMono-Regular.ttf`（标题字体）、`../../01-logo/svg/`（左上角 Logo）。
- 产品仓库 `pi-remote`，和 heyatu-marketing 放在同一个父目录下（`website` 链接也指向它）：
  官网的厂商图标和 Atu 头像（`site/assets/`）、App 的字体和小狗头像、手表设计稿 `docs/product/watch-days-mockup/`。
- `dev-desktop.png` 是桌面端设计稿（`pi-remote/docs/product/desktop-mockup/`）翻译成英文后的截图，
  由 `capture_devices.py` 生成；桌面端还没公开（ADR 0025），上架前要确认。
- `dev-ipad.png` 只在开场 B、C 里用（旧的 4:3 iPad）；定稿 F 用 iPad mini。

## 素材和授权

| 文件 | 来源 | 授权 |
|---|---|---|
| `bezels/iphone-17-pro-silver.png` | Apple Product Bezels（经 mockify） | Apple Design Resources，只能用来做 Apple 平台 App 的界面示意；不外发 |
| `bezels/parth-mac.png`、`parth-watch.png` | Apple Product Bezels（经 ParthJadhav/app-store-screenshots） | 同上 |
| `bezels/ipad-mini-starlight-land.png` | Apple Design Resources `Bezel-iPad-mini-(A20-Pro).dmg` | 同上，授权全文 `bezels/Apple Design Resources License.rtf` |
| `bezels/aw11-silver-case.png`、`aw11-silver-band.png` | Apple Design Resources `Bezel-Apple-Watch-Series-11-2025.dmg`，46mm 银色铝壳 + Purple Fog 表带。从 PSD 的智能对象（2100 × 3300）取出；`case` 版按黄色表带的颜色把表带抠掉 | 同上 |
| `models/iphone-17-pro.glb` | Ranguel，[Sketchfab](https://sketchfab.com/3d-models/iphone-17-pro-4541aa8a28324b33a2baaf81d263aaec)（经 imshaikot/app-preview-craft-skill），见 `models/credits.json` | CC-BY-4.0：发布用到它的图时要署名（商店描述或官网 Credits） |

苹果的营销规范不允许 3D 渲染、倾斜或从屏幕里跑出来的元素（见内容大纲的“设备模型资源”）。第 1 张的 3D 手机和功能页的 pop-up 都有这个风险。
