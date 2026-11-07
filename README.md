# Hey Atu 运营与品牌

Hey Atu 的运营物料都从这里找：品牌、图标、小狗、商店截图、社媒图、官网。
负责人 Xinyi。App 本体（iOS、relay、agent）在 `../pi-remote`，归产品团队（Jaysean）。

## 目录

| 路径 | 放什么 |
|---|---|
| `brand/hey-atu-brand-kit/` | 品牌套件：Logo、App 图标、App Store 和 Google Play 物料、社媒和网页图、字体配色、品牌手册 PDF。入口 `index.html` |
| `brand/mascot/` | 小狗：App 现用版本的镜像（`app-current/`）、探索稿（`explorations/`）、交付件（`handoff/`）、场景定稿（`anchors/`） |
| `brand/concepts/`、`brand/logo-proposals/` | 早期品牌概念和 Logo 提案 |
| `website/` | 线上官网 heyatu.com 的源码，链接到 `../pi-remote/site` |
| `docs/` | 品牌笔记、小狗盘点、App Store 截图内容大纲 |
| `archive/site-v1-pi-remote/` | 旧的 Pi Remote 官网预览（2026-10 初），已不再上线 |

## 常用位置

| 要做的事 | 去哪 |
|---|---|
| App Store 截图 | `brand/hey-atu-brand-kit/03-stores/app-store/`，规格和清单见同目录 `listing.md` |
| App Store 截图 v2 的内容（每张的意思、文案、界面，换样式时用） | `docs/app-store-screenshots/README.md` |
| 截图和营销图模板 | `brand/hey-atu-brand-kit/09-generator/`（`build_appstore.py`、`as-*.html`） |
| App 图标 | `brand/hey-atu-brand-kit/02-app-icon/` |
| 社媒图、OG 分享图、邮件头图 | `brand/hey-atu-brand-kit/04-marketing/` |
| 改官网 | `website/`，规则见 `website/README.md` |

## 放在产品仓库里的运营文件

下面这些文件接在产品的构建、部署或上架流程上，所以留在 `../pi-remote`：

| 内容 | 位置 |
|---|---|
| App Store 上架文案（已上传 App Store Connect） | `../pi-remote/scripts/release/appstore/metadata/` |
| 上架材料：审核说明、隐私标签、订阅 | `../pi-remote/docs/product/app-store-submission.md` |
| 发布计划 | `../pi-remote/docs/product/launch-plan.md` |
| 官网 App 界面图的源文件 | `../pi-remote/mockup/site-app-screens/` |
| 宣传视频 | `../pi-remote/promo/intro-video/` |
| App 里实际打包的小狗和引导插画 | `../pi-remote/ios/native/Resources/` |

## 改官网

`website/` 指向产品仓库，改动要提交到 `pi-remote`，并且随 relay 一起部署
（`../pi-remote/README.md` -> **Deploy the relay**）。只在明确要求时部署。

## 交给产品团队

App 不读这个文件夹。要换 App 里的小狗或图标，就把成品交给产品团队，由他们放进
`ios/native/Resources/`。他们发版后，再用发出去的文件更新 `brand/mascot/app-current/`。

## 注意

- `brand/hey-atu-brand-kit/downloads/` 里的压缩包不进 Git。重新打包：
  `ATU_KIT=brand/hey-atu-brand-kit pyx brand/hey-atu-brand-kit/09-generator/build_zips.py`。
  不设 `ATU_KIT` 的话，脚本会去打包临时目录里的那份套件。
- 品牌套件生成器的工作目录在 `~/.pi/tmp/2026-10-12/brand-spec`（`09-generator/common.py` 里的
  `ROOT`），截图原图在那里的 `build/screens/`。这是临时目录。

## 远端

GitHub 私有仓库 `hancyhxy/pi-remote-website`。文件夹在 2026-11-07 改名为 `heyatu-marketing`，
远端名字没变。push 只是备份。旧官网的公开预览页 https://hancyhxy.github.io/pi-remote-website/
只在手动运行 `.github/workflows/pages.yml` 时才会重新发布。
分支 `wip/site-v1-hero-videos` 存着旧官网首屏小狗视频的未完成改动。
