# 第二至第四轮重生图片生产日志

版本：0.2  
更新日期：2026-07-23  
状态：第二轮 10 个生产槽位已全部完成并接入七幕重生序列

## 生成方式

- 使用 Codex 内置 imagegen / GPT Image 2 路径，不使用 API Key 或 CLI 回退。
- TC-07 候选只使用 `observer-core-master.png` 作为硬件母版。
- 共享视界候选同时使用 `observer-core-master.png` 与 `matter-layers-master.png` 作为参考。
- 所有候选为 1672×941 PNG、16:9、无图片内文字。
- 候选保留在 `assets/rebirth/candidates/`；未覆盖第一轮正式资产。
- 新生成终稿保留 1672×941 PNG 母文件，并使用 Sharp 以 WebP 质量 82 生成运行时版本。

## R02-02 · 跨轮 TC-07 母版候选

联系表：`assets/rebirth/reviews/r02-02-observer-memory-contact.png`  
排列：左上 A、右上 B、左下 C、右下 D。

| 候选 | SHA-256 | 评审 |
| --- | --- | --- |
| A | `4c34460ea140300cab116ad7de7e210ee671912e1d7f63099455590000a6f043` | 三环六节点稳定，负空间合格；中心伤痕略像闪电，不建议锁定 |
| B | `87249af4513ba4327e2d3811423faa70413f8d30073563ef076b666b0bf4f4ed` | 三环六节点稳定；记忆改为环面细应力线，核心低亮，异步冷启动清楚；**当前推荐** |
| C | `c5e23c96d2dceb450953df45c463a2b40b01d69110b65fc3728302dece92cc50` | 构图与母版接近，移动裁切稳定；记忆痕迹过弱，容易被读成普通待机 |
| D | `d029abfbd208dbce7f148ae0fd58062b2cea1f8f5933e8597bc60282ddacdcaf` | 下环记忆痕清楚；右侧输入轨迹略像光束，叙事过于主动 |

已锁定 **B**。它以最小硬件变化表达“记忆能够运行”，没有把重生写成能量升级。

正式母版：`assets/rebirth/references/observer-core-rebirth-master.png`  
SHA-256：`87249af4513ba4327e2d3811423faa70413f8d30073563ef076b666b0bf4f4ed`

## R02-05 · 共享视界母版候选

联系表：`assets/rebirth/reviews/r02-05-shared-horizon-contact.png`  
排列：左上 A、右上 B、左下 C、右下 D。

| 候选 | SHA-256 | 评审 |
| --- | --- | --- |
| A | `c6ecd535d9fa4cf419a2db7acd0c9d493bea3a2186257f6a27fafac697a1b34f` | 正反关系最清楚，五段反侧谐振结构可读；视界边缘略亮，稍接近传送门 |
| B | `2ae929100b2db9ac4046ab81c5b106c6264717b9c1cf373626430bbcd1fbb5b7` | 保留 A 的因果关系，降低边缘亮度并拆成干涉丝；**当前推荐** |
| C | `84b897d1b6b7264a90be01c5053702052df145be71e79dd9bb4453485d29e05d` | 左侧负空间最好、斜向流动感强；视界分界不够明确，五环缺口不稳定 |
| D | `c62b9dbd395f9aacbc7c191789744e378ba342877488b365bd67ea613f0cf023` | 正反两侧最易读；反侧弧数量与三层物质约束失真，不建议锁定 |

已锁定 **B**。它能在不使用门户和镜像宇宙陈词的前提下，让玩家一眼区分两侧并理解“另一侧已经认出偏差”。

正式母版：`assets/rebirth/references/shared-horizon-master.png`  
SHA-256：`2ae929100b2db9ac4046ab81c5b106c6264717b9c1cf373626430bbcd1fbb5b7`

## 锁定后的动作

1. [x] 将选中的跨轮 TC-07 复制为正式母版并记录哈希。
2. [x] 将选中的共享视界复制为正式母版并记录哈希。
3. [x] 接入七幕第二轮重生序列的第 02、05 幕。
4. [x] 完成中文/English × 桌面/390px 手机首轮回归。
5. [x] 使用两张母版生产第二轮其余 8 张图片。
6. [x] 按 `dominantRoute` 接入四张互斥的路线反例画面。
7. [ ] 完成第二轮人工试玩后，再进入第三轮图片与控制器。

## 第二轮终稿资产

七幕播放规则为：01、02、03、04、05、四选一的 06、07，因此共使用 10 个生产槽位。02 与 05 直接使用锁定的 B 版母版，其余 8 张使用 Codex 内置 imagegen 生成。

| 槽位 | 运行时文件 | WebP SHA-256 | 用途 |
| --- | --- | --- | --- |
| R02-01 | `rebirth-r02-01.webp` | `fd2826658dfdb2df24ede54b247247657ce400dd0d8e073fbd1a4c6ddd48a899` | 坍缩只留下可运行方向 |
| R02-02 | `references/observer-core-rebirth-master.png` | 见上方母版哈希 | 带记忆醒来的 TC-07 |
| R02-03 | `rebirth-r02-03.webp` | `0f279d218a4f7137f43611187dae70b2e87954ced2e669eb38481bb2188a341b` | 继承物接回物质 |
| R02-04 | `rebirth-r02-04.webp` | `b51d62aeda6bbc937fb902a06eed8ac39977f05d8f05cdfc2405730e6ab1671c` | 最初物质出现可测偏置 |
| R02-05 | `references/shared-horizon-master.png` | 见上方母版哈希 | 背面认出偏差 |
| R02-06-advance | `rebirth-r02-06-advance.webp` | `aae45b5ef7b0cc40129cea22a14c759627489d39197dba7a4df1f52ac56055e6` | 闭界格栅 |
| R02-06-sustain | `rebirth-r02-06-sustain.webp` | `4de1a81d332e67f8f8380821d1e46253630f9efe42c38dfa76efdb42940ade12` | 逆季候 |
| R02-06-inquiry | `rebirth-r02-06-inquiry.webp` | `9c1c44e2b1c9c3d09746bedc18142d862cf8f4a68f31a7ec7051595fdc80a781` | 盲区证人 |
| R02-06-rewrite | `rebirth-r02-06-rewrite.webp` | `7c873f063eff62c393918ef3b1b9cbbcc827ce1189ea81966b24a256ece4a6c4` | 失同步摆 |
| R02-07 | `rebirth-r02-07.webp` | `eb441bbdb27c495dbedb36bdbdbb8ce396a4771f8666be5605e4587a07692b03` | 第二轮完整问题 |

人工视觉检查确认：

- 左侧字幕安全区均保持低明度，桌面端不会与一级主体争抢。
- 四张路线图在几何语法上可以区分，不只是替换颜色。
- TC-07、共享视界与物质层级沿用两张 B 版母版和第一轮物质母版。
- 图片内没有可读文字、Logo、水印或 HUD。
