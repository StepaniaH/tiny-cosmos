# 资产目录

当前页游以 Canvas、CSS 和轻量静态资源为主。已通过验收的图标、背景纹理和短事件音效统一记录在 [`manifest.json`](./manifest.json)；长音乐按需延后，三维模型和精灵图 VFX 暂不进入网页运行时。

目录约定：

- `models/`：GLB 模型。
- `textures/`：模型外置纹理，仅在 GLB 无法内嵌时使用。
- `icons/`：SVG 或透明 PNG 图标。
- `audio/sfx/`：仅在玩家操作或事件发生时加载的短 MP3 音效。
- `video/`：透明 WebM 或演出视频。

资产文档入口为 [`docs/art/README.md`](../docs/art/README.md)。交给 Cursor 时首先读取 [`AI-ASSET-HANDBOOK.md`](../docs/art/AI-ASSET-HANDBOOK.md)，最终只回传一个 `tiny-cosmos-asset-pack/` 文件夹。

清单中 `enabled` 为 `false` 的条目尚未通过主项目验收，运行时继续显示 `fallback` 指定的程序化占位。外部制作流程不能提前开启这些条目。

## 当前网页资产策略

- I001–I008、T001–T003 和短事件音效已经接入。
- 音效默认不预加载，不包含自动播放音乐，玩家可随时静音。
- M001–M104 与 V001–V009 冻结为端游/引擎重构候选。Godot 等引擎路线确定前，不继续反复返修复杂模型。
- 网页端新增资源应优先满足：单文件小、无运行时依赖、可以延迟加载、加载失败不影响玩法。
