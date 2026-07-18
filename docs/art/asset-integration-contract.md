# 资产运行时接口

版本：1.0
更新日期：2026-07-18

## 基本原则

页面只通过 `assets/manifest.json` 发现资产。游戏状态向渲染层发出语义事件，渲染层根据清单映射动画、图标和效果。任务文案、按钮文字和资源数字不参与资产选择。

资产缺失、加载失败或设备性能不足时，现有 Canvas 与 CSS 占位继续运行。任何视觉资产失败都不能阻止资源结算和玩家操作。

## 坐标与单位

- 运行时右手坐标系。
- 上方向 `+Y`。
- 模型正面 `+Z`。
- 1 运行时单位等于 1 米。
- 模型导入缩放来自清单 `scale`，默认 `[1,1,1]`。
- 动画没有持续根位移；锚点负责场景移动。

## 固定锚点

| 锚点 | 用途 | 标准位置 | 朝向 |
| --- | --- | --- | --- |
| `stage_center` | 观测核 | 画布中心 | 正面朝相机 |
| `contact_orbit` | 真空水蛭附着口 | 原子轨道右上 35° | 附着口朝轨道中心 |
| `afterimage_slot` | 核心余像 | 画布中心右侧 0.28 倍半径 | 正面朝相机 |
| `production_orbit` | 生产单元 | 当前资源轨道切线位置 | 本地 Z 轴沿轨道切线 |
| `focus_orbit` | 焦点透镜 | 当前焦点层轨道左侧 | 透镜法线指向核心 |
| `reserve_orbit` | 保护信标 | 当前保护层轨道下方 | 信标顶部朝外 |
| `research_orbit` | 研究探针 | 观测核上方 | 探针轴指向核心 |

页面实际布局变化时，锚点由渲染器重新计算，模型源文件不改变原点。

## 清单版本 2

`assets/manifest.json` 使用以下顶层字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `schemaVersion` | 整数 | 当前为 2 |
| `packVersion` | 字符串 | 资产包语义版本 |
| `coordinateSystem` | 对象 | 坐标、正面和单位 |
| `defaults` | 对象 | 纹理色彩空间、模型格式、音频格式 |
| `assets` | 数组 | 资产条目 |

通用资产字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 稳定 ID，使用 snake_case |
| `jobId` | 是 | 对应 `asset-jobs.json` |
| `type` | 是 | `model`、`icon_set`、`texture`、`vfx_atlas`、`audio_set` |
| `priority` | 是 | `P0`、`P1`、`P2` |
| `enabled` | 是 | 主项目验收前保持 `false` |
| `source` | 是 | 相对项目根目录的文件或目录 |
| `fallback` | 是 | Canvas、CSS 或 none 降级标识 |
| `hash` | 否 | 正式接入时填写 SHA-256 |

模型额外字段：`scale`、`anchor`、`animations`、`boundsMeters`。
图标集合额外字段：`files`、`viewBox`、`colorMode`。
VFX 额外字段：`columns`、`rows`、`frames`、`fps`、`loop`、`colorSpace`。
音频额外字段：`files`、`sampleRate`、`loopPoints`。

## 模型动画播放规则

- 动作名区分大小写，统一小写 snake_case。
- `idle`、`siphon`、`cutoff`、`observe` 等循环动作由渲染器循环。
- 单次动作播放完成后，根据当前状态回到指定循环动作。
- 同一资产的动作切换默认交叉淡化 0.18 秒。
- `attach` 到 `siphon` 使用 0.08 秒淡化。
- `retreat` 播放结束后隐藏真空水蛭，不回到 `idle`。
- 页面切到后台时暂停动作；恢复时从当前逻辑状态选择循环动作，不补播离线单次动作。
- 用户启用减少动态效果时，待机循环速度降为 50%，单次动作保留首帧、峰值帧和末帧。

## 游戏事件到资产状态

| 语义事件 | 主资产 | 动作或效果 | 回落状态 |
| --- | --- | --- | --- |
| `cosmos.boot` | 观测核 | `idle` | `idle` |
| `resource.manual_pulse` | 观测核、V001 | `pulse` | `idle` |
| `producer.built` | 通用生产单元 | `build` | `idle` |
| `producer.upgraded` | 通用生产单元 | `upgrade` | `idle` |
| `focus.locked` | 焦点透镜 | `lock` | `idle` |
| `focus.released` | 焦点透镜 | `release` | 隐藏 |
| `reserve.enabled` | 保护信标 | `protect` | `idle` |
| `reserve.warning` | 保护信标 | `warning` | `idle` |
| `research.opened` | 观测核、研究探针 | `research`、`sample` | `idle` |
| `research.threshold` | 研究探针 | `threshold` | `idle` |
| `tier.unlocked` | 观测核、V002 | `unlock` | `idle` |
| `contact.warning` | 观测核、真空水蛭、V003 | `alert`、`form` | 警报循环 |
| `contact.attached` | 真空水蛭 | `attach` | `siphon` |
| `contact.siphon` | 真空水蛭、V004 | `siphon` | `siphon` |
| `contact.overload` | 真空水蛭、V005 | `overload` | `siphon` |
| `contact.cutoff` | 真空水蛭、V006 | `cutoff` | `cutoff` |
| `contact.observe` | 真空水蛭、V007 | `observe` | `observe` |
| `contact.resolved` | 真空水蛭、核心余像、V008 | `retreat`、`condense` | 真空水蛭隐藏、余像 `idle` |
| `afterimage.fuel` | 核心余像 | `fuel` | 隐藏 |
| `afterimage.return` | 核心余像 | `return` | 隐藏 |
| `afterimage.archive` | 核心余像 | `archive` | 隐藏 |

## 状态数据

渲染器可读取以下数值用于速度、颜色和强度：

- `resourceTier`: 0–6。
- `resourceRatio`: 当前库存相对显示区间，0–1。
- `flowRate`: 有符号净流量。
- `researchRate`: RP/s。
- `missionProgress`: 0–1。
- `enemySiphonedRatio`: 已截取量相对上限，0–1。
- `enemyMethodProgress`: 0–1。
- `routeSignals`: 四路线的非负整数。

资产不能读取或改变资源数值。发光强度使用夹紧后的显示参数，禁止直接把大数值写入材质。

## 图标接入

- SVG 根元素包含 `viewBox`，不设置固定 `width`、`height`、`fill` 和 `stroke` 颜色。
- 图形使用 `stroke="currentColor"` 或 `fill="currentColor"`。
- 页面优先以 `<svg><use>` 或 CSS Mask 加载。
- SVG 不包含脚本、外链、嵌入位图和字体。
- 资源层图标在 16、24、32、64 像素四个尺寸验收。

## 纹理色彩空间

- Base Color、Emission、UI、VFX：sRGB。
- Normal、Roughness、Metallic、Occlusion、灰度遮罩：Linear。
- ORM 通道：R=Occlusion、G=Roughness、B=Metallic。
- 法线方向使用 OpenGL 约定，绿色通道不翻转。

## VFX 图集

- 帧序从左到右、从上到下。
- 运行时按 `columns`、`rows` 和 `frames` 读取，未使用格保持透明。
- 单次效果到末帧后隐藏。
- 循环效果在最后一帧回到第一帧，亮度和形状需要连续。
- VFX 图集不附带强烈背景泛光，页面根据主题颜色添加混合。

## 性能分级

| 级别 | 模型 | VFX | 目标 |
| --- | --- | --- | --- |
| High | 全部 P0/P1、完整动画 | 完整图集 | 桌面 60 fps |
| Medium | 观测核、真空水蛭、余像 | VFX 减半粒子 | 桌面与集显 45–60 fps |
| Low | Canvas 占位 | CSS 简化效果 | 移动端 30 fps |

渲染器连续 5 秒低于目标帧率时可以降级一级。降级不重新加载页面，不改变玩法状态。

## 导入回传包

主项目接收 `tiny-cosmos-asset-pack/` 后执行：

1. 对比 `asset-pack-manifest.json` 与 `assets/manifest.delivery.json`。
2. 运行回传包的 `scripts/validate_assets.py --all`。
3. 将回传包内 `assets/` 复制到项目临时导入目录。
4. 逐项视觉验收，确认动画、尺寸和性能。
5. 安装渲染依赖并完成加载器后，再把通过的条目改为 `enabled: true`。
6. 任一条目失败时保留原占位，不影响其他条目接入。
