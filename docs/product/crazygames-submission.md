# CrazyGames 提交说明

状态：implemented

更新日期：2026-07-26

用途：说明当前 HTML5 版本的 CrazyGames 打包、表单选择、SDK 接入和提交前检查。

上位文档：[`docs/README.md`](../README.md)、[`product/roadmap.md`](./roadmap.md)

本文对应当前 `Tiny Cosmos` 静态 HTML5 版本。提交前以 CrazyGames 最新官方要求和 Developer Portal Preview 的结果为准。

## 第一步表单怎么填

- 发布阶段：选 `Basic`。这是普通新游戏的首次测试阶段；未被 CrazyGames 邀请时不要把 `Full` 当成“更完整的表单”。
- Game name：`Tiny Cosmos`。网页标题也已经统一为这个名称。
- Game engine：`HTML5`。
- Upload files：上传构建脚本产出的 `tiny-cosmos-crazygames.zip`，不要上传整个 Git 仓库。
- Does your game save progress?：选 `Yes, using LocalStorage (refer to Automatic Progress Save)`。

游戏主存档、离线时钟和设置已经使用 `localStorage`。CrazyGames 的 Automatic Progress Save 会备份和恢复它，不需要把现有存档改成 Data Module。当前游戏没有账号系统和内购，因此这条路径最简单且符合要求。

官方参考：

- [发布阶段与 Basic / Full 要求](https://docs.crazygames.com/requirements/intro/)
- [HTML5 技术要求与上传限制](https://docs.crazygames.com/requirements/technical/)
- [Automatic Progress Save](https://docs.crazygames.com/other/aps/)

## 生成上传 ZIP

在项目根目录运行：

```bash
node tools/build-crazygames-package.js
```

输出文件：

```text
dist/crazygames/tiny-cosmos-crazygames.zip
```

ZIP 解压后的根层直接是 `index.html`，同时包含：

- `css/game.css`
- `js/*.js`
- `assets/favicon.svg`
- 游戏运行时使用的 SVG 图标
- 三张背景纹理
- 事件音效
- 14 张序章 WebP
- 第二轮过场 WebP 和两张实际引用的参考图

构建会排除 `.git`、文档、工具、测试 fixture、候选图、评审图、未使用的 PNG 和系统文件。不要再给 ZIP 套一层父目录。

CrazyGames 当前限制包括：总包不超过 250 MB、文件数不超过 1500、初始下载不超过 50 MB；若希望进入移动首页，初始下载应不超过 20 MB。当前脚本会校验总包和文件数，并保持所有游戏资源路径为相对路径。

## 已完成的 SDK v3 接入

- SDK 初始化及不可用环境的安全降级
- `loadingStart` / `loadingStop`
- 在序章结束、游戏真正可操作后触发 `gameplayStart`
- 打开序章、设置、档案或日志时触发 `gameplayStop`，返回游戏后恢复
- 不因 iframe 失焦或浏览器 `visibilitychange` 重复上报
- 两轮任务的中间完成百分比、终结封存 100%
- 当前轮次、任务、阶段和语言的 Game Context
- 第一座文明首次形成时的一次性 `happytime`
- CrazyGames `muteAudio` 及动态设置监听；平台静音优先于游戏内开关
- 预留安全的 midgame ad wrapper，但 Basic 版本不会展示广告入口或主动请求广告

SDK 官方参考：

- [SDK v3 初始化与测试环境](https://docs.crazygames.com/sdk/intro/)
- [Gameplay、Loading、进度、Context 与平台静音](https://docs.crazygames.com/sdk/game/)
- [广告 API](https://docs.crazygames.com/sdk/video-ads/)
- [广告规则](https://docs.crazygames.com/requirements/ads/)

## 后续 Details 阶段另行准备

上传游戏 ZIP 之后，Portal 后续页面还会要求商店素材。它们不是 ZIP 内的运行文件：

- 横向封面：1920 × 1080
- 纵向封面：800 × 1200
- 方形封面：800 × 800
- 横向与纵向预览视频：各 15–20 秒、各不超过 50 MB、无声音

封面可以有游戏标题，但不要添加边框、商店 Logo、`Play Now` 等行动号召。详见 [CrazyGames Game covers](https://docs.crazygames.com/requirements/game-covers/)。

## 提交前检查

1. 在本地 `http://127.0.0.1` 打开游戏，确认 SDK 是 `local` 环境，控制台能看到事件。
2. 用新访客存档检查：中文系统默认中文，其它系统默认英文；手动切换后刷新仍保留选择。
3. 检查 907 × 510、1216 × 684、1077 × 606、821 × 462 等常见 iframe 尺寸。
4. 在 Developer Portal Preview 中完整测试开始、设置、档案、首轮完成、第二轮和最终封存。
5. Basic 阶段广告禁用是正常状态；游戏流程不能依赖广告成功。
