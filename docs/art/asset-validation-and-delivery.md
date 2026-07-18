# 资产验证与回传规范

版本：1.0
更新日期：2026-07-18

## 自动验证

`scripts/validate_assets.py` 使用 Blender Python 和标准库完成检查。缺少第三方 Python 包时仍需运行基础检查。

### 所有文件

- 路径和大小写与清单一致。
- 文件非空，可正常读取。
- 没有 `.blend1`、`.tmp`、`.DS_Store` 和未列入清单的缓存。
- 生成 SHA-256 和字节大小。
- 回传包内不存在绝对路径引用。

### GLB

- 文件头为有效 glTF Binary 2.0。
- 场景只有一个顶层资产根节点，名称为清单 `id`。
- 根节点 Location `0,0,0`、Rotation `0,0,0`、Scale `1,1,1`。
- 包围盒符合规格误差。
- 三角面、对象、材质、骨骼和纹理不超过预算。
- 每顶点骨骼权重不超过 4 个，权重和归一化。
- 法线存在且方向正常；需要法线贴图的网格包含切线。
- 动画名称、时长和循环姿态符合规格。
- 动画不写入持续根位移。
- GLB 不引用外部丢失文件。
- 未使用的动作、材质、贴图和对象在导出前清理。

### SVG

- XML 可解析。
- 存在正确 `viewBox`。
- 不包含 `<script>`、外链、base64 位图、文字和字体。
- 使用 `currentColor`。
- 路径不超出安全区。
- 在 16×16 像素光栅化后仍有非空主体，线条不全部消失。

### 纹理与 VFX

- 尺寸、格式、色彩空间和通道符合清单。
- 无缝纹理的左右、上下边缘平均误差低于 2%。
- VFX 图集帧数与格数一致。
- 透明边缘没有黑边和明显颜色污染。
- 平均亮度、Alpha 覆盖率和未使用格符合规格。

### 音频

- 48 kHz。
- 峰值不超过 -1 dBFS。
- UI 音效不超过 1.2 秒，重大事件不超过 4 秒，循环环境音 45–90 秒。
- 循环点存在并落在零交叉附近。
- 文件元数据记录来源、生成工具和许可。

## 人工视觉验收

### 四视图

每个模型输出：

- `previews/stills/<id>-front.png`
- `previews/stills/<id>-side.png`
- `previews/stills/<id>-top.png`
- `previews/stills/<id>-perspective.png`

分辨率 1024×1024，背景 `#030608`，使用视觉规范中的固定灯光。画面完整包含包围盒，四周留白 8%。

检查：

- 正面方向和原点清楚。
- 一级轮廓与任务书一致。
- 结构连接合理，没有悬浮碎片。
- 发光面积不过量。
- 没有明显穿插、法线翻转和透明排序问题。
- 160 像素缩略图仍能辨识资产。

### 动画预览

每个模型输出 `previews/video/<id>-animations.mp4`：

- 1920×1080，30 fps，H.264。
- 开头显示 2 秒静态四分屏，不加入文字水印。
- 按清单顺序播放动作，每个动作前后保留 0.5 秒待机。
- 循环动作展示两个完整周期。
- 单次动作展示一次正常速度和一次 0.5 倍速度。

### 游戏尺寸合成预览

额外输出：

- `previews/stills/composite-desktop-1440x900.png`
- `previews/stills/composite-mobile-390x844.png`

使用深空黑背景，把观测核、真空水蛭、余像和关键图标按预计屏幕尺寸排版。该预览只检查可读性，不模仿游戏完整 UI。

## 状态分类

每个任务只能使用以下状态：

- `passed`：所有自动检查和人工预览要求满足。
- `degraded`：接口正确，视觉或贴图采用低复杂度版本，报告中写明差异。
- `blocked`：接口、工具或文档冲突导致无法完成。
- `skipped`：仅限 P2 或音频工具缺失，必须说明原因。
- `failed`：已经生成但验证不通过。

P0 不允许 `skipped`。P0 出现 `blocked` 或 `failed` 时，整个回传包不能标记为完整交付。

## `asset-pack-manifest.json`

顶层字段：

```json
{
  "packVersion": "1.0.0",
  "createdAt": "ISO-8601",
  "blenderVersion": "5.2.x",
  "generatorVersion": "git hash or local version",
  "files": [],
  "jobs": [],
  "summary": {}
}
```

`files` 每项包含：

- `path`
- `sha256`
- `bytes`
- `jobId`
- `role`: `runtime`、`source`、`preview`、`report`

`files` 覆盖资产、源文件、冻结规范、预览、脚本和报告。`asset-pack-manifest.json` 不列入自身的 `files`，避免自引用哈希；它的哈希由主项目接收后单独计算。

`jobs` 每项包含：

- `jobId`
- `status`
- `outputs`
- `warnings`
- `metrics`

模型 `metrics` 包含 triangles、objects、materials、bones、animations、textures、boundsMeters。SVG 包含 paths、viewBox、usesCurrentColor。VFX 包含 dimensions、frames、alphaCoverage。

## `DELIVERY.md`

按以下结构生成：

1. 环境和工具版本。
2. 已完成 P0。
3. 已完成或降级 P1。
4. P2 状态。
5. 验证摘要。
6. 需要人工判断的视觉项。
7. 未生成的音频或外部资源。
8. 导入步骤。
9. 已知问题。

## 许可报告

`reports/licenses.md` 列出每个资产的来源：

- `Generated locally from project specification`：由脚本生成。
- `Created manually in Blender from project specification`：人工建模。
- 外部来源必须列出名称、作者、URL、许可证和允许的商业用途。

P0 默认只接受前两类。没有明确许可证的外部资源不得进入回传包。

## 回传前清理

- Blender 源文件执行 Purge Orphan Data。
- 删除未引用动作、贴图、材质和对象。
- 删除 `.blend1` 自动备份。
- 删除测试输出和重复 GLB。
- 删除 `.work/`。
- 确认 `manifest.delivery.json` 仍为 `enabled: false`。
- 最后运行一次全量验证，并把终端退出码写入 `DELIVERY.md`。
