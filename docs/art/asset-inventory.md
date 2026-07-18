# 资产总清单与优先级

版本：1.0
更新日期：2026-07-18

## 优先级定义

- `P0`：当前第一次接触版本可以直接接入，回传包必须完成。
- `P1`：下一轮界面深化使用，接口已确定，允许简化贴图。
- `P2`：四条结局和继承物预留，只要求灰盒、轮廓和概念预览。
- `HOLD`：需求尚未稳定，记录资源位，不开始制作。

## 三维模型

| ID | 优先级 | 资产 | 输出 | 当前用途 | 动画数 |
| --- | --- | --- | --- | --- | --- |
| M001 | P0 | 观测核 | `assets/models/observation-core.glb` | 中央主界面、点击、研究、警报 | 5 |
| M002 | P0 | 真空水蛭 | `assets/models/vacuum-leech.glb` | 预警、附着、三种处理、退去 | 7 |
| M003 | P0 | 核心余像 | `assets/models/contact-afterimage.glb` | 敌人处理后的小决策 | 5 |
| M004 | P1 | 通用生产单元 | `assets/models/production-unit.glb` | 资源卡升级反馈、轨道节点 | 4 |
| M005 | P1 | 焦点透镜 | `assets/models/focus-lens.glb` | 焦点迁移与聚焦状态 | 3 |
| M006 | P1 | 保护信标 | `assets/models/reserve-beacon.glb` | 保护线与低库存警报 | 3 |
| M007 | P1 | 研究探针 | `assets/models/research-probe.glb` | 研究构成、阈值和原子解锁 | 4 |
| M101 | P2 | 越过视界终局灰盒 | `assets/models/endings/across-horizon-blockout.glb` | 终局轮廓预留 | 1 |
| M102 | P2 | 无尽花园终局灰盒 | `assets/models/endings/endless-garden-blockout.glb` | 终局轮廓预留 | 1 |
| M103 | P2 | 最后观测者终局灰盒 | `assets/models/endings/last-observer-blockout.glb` | 终局轮廓预留 | 1 |
| M104 | P2 | 双生大坍缩终局灰盒 | `assets/models/endings/twin-crunch-blockout.glb` | 终局轮廓预留 | 1 |

## SVG 图标

| ID | 优先级 | 集合 | 数量 | 输出目录 |
| --- | --- | --- | --- | --- |
| I001 | P0 | 物质层级 | 7 | `assets/icons/tiers/` |
| I002 | P0 | 第一法则 | 3 | `assets/icons/laws/` |
| I003 | P0 | 四条路线 | 4 | `assets/icons/routes/` |
| I004 | P0 | 敌人处理方案 | 4 | `assets/icons/enemy-methods/` |
| I005 | P0 | 接触准备 | 3 | `assets/icons/preparations/` |
| I006 | P0 | 资源状态 | 3 | `assets/icons/resource-states/` |
| I007 | P1 | 任务类型 | 6 | `assets/icons/missions/` |
| I008 | P1 | 核心余像处置 | 3 | `assets/icons/afterimage-actions/` |
| I101 | P2 | 继承物类别 | 8 | `assets/icons/inheritances/` |

### I001 文件

- `tier-quark.svg`
- `tier-nucleon.svg`
- `tier-atom.svg`
- `tier-molecule.svg`
- `tier-cell.svg`
- `tier-life.svg`
- `tier-civilization.svg`

### I002 文件

- `law-expansion.svg`
- `law-conservation.svg`
- `law-observer.svg`

### I003 文件

- `route-advance.svg`
- `route-sustain.svg`
- `route-inquiry.svg`
- `route-rewrite.svg`

### I004 文件

- `method-overload.svg`
- `method-cutoff.svg`
- `method-observe.svg`
- `method-sync.svg`

### I005 文件

- `preparation-buffer.svg`
- `preparation-pulse.svg`
- `preparation-sensor.svg`

### I006 文件

- `state-cycle.svg`
- `state-shortage.svg`
- `state-overload.svg`

### I007 文件

- `mission-input.svg`
- `mission-production.svg`
- `mission-flow.svg`
- `mission-research.svg`
- `mission-decision.svg`
- `mission-contact.svg`

### I008 文件

- `afterimage-fuel.svg`
- `afterimage-return.svg`
- `afterimage-archive.svg`

## VFX 图集与遮罩

| ID | 优先级 | 资产 | 输出 | 规格 |
| --- | --- | --- | --- | --- |
| V001 | P0 | 观测核响应图集 | `assets/vfx/core-response.webp` | 8×8，64 帧，1024×1024 |
| V002 | P0 | 资源层解锁图集 | `assets/vfx/tier-unlock.webp` | 8×8，64 帧，1024×1024 |
| V003 | P0 | 反宇宙畸变遮罩 | `assets/vfx/anomaly-distortion.webp` | 512×512，无缝灰度 |
| V004 | P0 | 截流粒子图集 | `assets/vfx/siphon-stream.webp` | 8×4，32 帧，1024×512 |
| V005 | P0 | 过载冲击图集 | `assets/vfx/overload-impact.webp` | 8×4，32 帧，1024×512 |
| V006 | P0 | 隔离屏障图集 | `assets/vfx/cutoff-barrier.webp` | 8×4，32 帧，1024×512 |
| V007 | P0 | 观测扫描图集 | `assets/vfx/observe-scan.webp` | 8×4，32 帧，1024×512 |
| V008 | P0 | 余像凝结图集 | `assets/vfx/afterimage-condense.webp` | 8×8，64 帧，1024×1024 |
| V009 | P1 | 路线信号写入 | `assets/vfx/route-signal.webp` | 8×4，32 帧，1024×512 |

图集帧序从左到右、从上到下。每帧保留 2 像素透明扩展。文件同时交付无损 PNG 源图集，WebP 为页面候选文件。

## 环境纹理

| ID | 优先级 | 资产 | 输出 | 说明 |
| --- | --- | --- | --- | --- |
| T001 | P0 | 微弱星尘 | `assets/textures/background/star-dust.webp` | 1024×1024，无缝，低对比 |
| T002 | P0 | 屏幕噪声 | `assets/textures/background/screen-noise.webp` | 256×256，无缝，灰度 |
| T003 | P0 | 反宇宙噪声 | `assets/textures/background/reverse-noise.webp` | 512×512，无缝，灰度 |
| T004 | P1 | 金属微表面 | `assets/textures/materials/device-micro-normal.webp` | 1024×1024，线性法线 |
| T005 | P1 | 壳体微表面 | `assets/textures/materials/leech-shell-normal.webp` | 1024×1024，线性法线 |

背景纹理平均亮度不得超过 8%。星尘纹理不得包含可识别星座、星云照片或大面积亮斑。

## 音频资源位

音频不属于 Blender 强制交付。AI 环境具备可追踪的音频生成工具时可以制作；缺少工具时只生成元数据和待办，不提交静音文件冒充成品。

| ID | 优先级 | 集合 | 文件 |
| --- | --- | --- | --- |
| S001 | P1 | 环境底噪 | `amb-observer-node.ogg`、`amb-reverse-contact.ogg` |
| S002 | P1 | UI | `ui-hover.ogg`、`ui-confirm.ogg`、`ui-denied.ogg`、`ui-guide-open.ogg`、`ui-guide-close.ogg` |
| S003 | P1 | 资源 | `resource-pulse.ogg`、`resource-synthesize.ogg`、`resource-producer.ogg`、`resource-research.ogg` |
| S004 | P1 | 接触 | `contact-warning.ogg`、`contact-attach.ogg`、`contact-siphon-loop.ogg`、`contact-overload.ogg`、`contact-cutoff.ogg`、`contact-observe.ogg`、`contact-retreat.ogg` |
| S005 | P2 | 终局 | 每条路线一段 45–75 秒可循环底层音乐 |

音效目标格式为 OGG Vorbis 48 kHz、24 bit 源 WAV。循环文件需要记录精确 loop start 和 loop end 样本位置。

## 字体与文字符号

当前页面使用系统字体，不打包字体文件。模型和纹理中不加入英文标签、虚构编号或 UI 文字。需要刻度时使用无字符短线、点阵和几何分区。

## 视频资源位

当前版本不要求预渲染演出视频。`assets/video/` 只存透明 WebM 备选效果或未来终局演出。P0 模型预览视频放在回传包 `previews/video/`，不放入运行时 `assets/video/`。

## 暂缓资源

- 分子、细胞、生命和文明的完整三维生态。
- 四条终局的高精度模型和动画。
- 镜像文明角色、头像和语音。
- Steam 宣传图、商店胶囊和成就图标。
- 手柄按键图和主机平台认证图标。

这些资源需要对应玩法完成纸面和竖切验证后再冻结。
