# Tiny Cosmos 文档入口

状态：canonical
更新日期：2026-07-26

这是 `docs/` 的唯一总入口。项目中的设计、实现记录、提案和历史复盘都从这里进入；子目录 README 只负责各自领域的索引，不再声明高于本页的权威。

## 先读什么

如果只读三份文档：

1. [产品愿景](./product/vision.md)：作品最终要带给玩家什么感受，以及哪些体验不能被局部功能破坏。
2. [世界观圣经](./game-design/world-bible.md)：作者真相、玩家逐轮认知、名词与叙事禁区。
3. [五轮主叙事](./design/narrative/five-loop-arc.md)：前四轮游玩与第五轮总结的揭示、失败和碎片节奏。

继续参与玩法或实现时，再读 [玩法设计索引](./game-design/README.md)。

## 文档权威顺序

发生冲突时，按以下顺序处理：

1. **产品愿景**：主题、体验曲线和项目边界。
2. **世界观圣经与五轮主叙事**：作者真相、玩家何时知道什么、跨轮结局。
3. **canonical 玩法文档**：系统规则与设计约束。
4. **implemented 实现记录**：准确描述当前版本已经做了什么，但不自动推翻上位叙事。
5. **proposal 提案**：可供选择的未来方案。
6. **historical 历史记录**：用于追溯，不作为当前需求。

代码是当前行为的事实来源；产品愿景是下一步应向哪里改的事实来源。两者不一致时，应记录为“实现待对齐”，不能悄悄把旧实现提升为新世界观。

## 当前项目快照

- 第一轮从启动资源链到第一座文明的竖切已经可玩。
- 第二轮“答案的反例”已有可保存的 12 节点与正式重生资产；终结封存是下一实现切片。
- 第三、第四轮尚未按新的五轮悲剧结构实现。
- 第五轮是较短的交互式总结，不再完整重复七层资源建设。
- 当前运行时仍包含较早的“玩家是观测核”“背面宇宙由未选择可能性形成”等说法；新文档已将其改为前期误读或待对齐内容。
- 四种路线继续保留不同操作和局部后果，但不再承诺任何一种能永久逃离终结。

## 目录职责

### 产品

- [`product/vision.md`](./product/vision.md)：产品愿景、玩家承诺、体验指标和非目标。
- [`product/roadmap.md`](./product/roadmap.md)：当前制作顺序、可玩边界与下一实现切片。

### 玩法与叙事

- [`game-design/README.md`](./game-design/README.md)：按 canonical、implemented、proposal、historical 分类的完整索引。
- [`game-design/world-bible.md`](./game-design/world-bible.md)：世界观与名词的当前基线。
- [`design/narrative/five-loop-arc.md`](./design/narrative/five-loop-arc.md)：五轮剧情和碎片揭示表。

### 美术与音频

- [`art/README.md`](./art/README.md)：视觉资产规范、接口、提示词与生产记录。
- [`audio/checkup-1-music-production-brief.md`](./audio/checkup-1-music-production-brief.md)：当前音频制作需求。

第三、第四轮未生产的重生图片需要先与新的五轮主叙事重新对齐。已经完成且不含文字的第一、第二轮资产可以继续复用。

### 平衡、架构与部署

- [`balance/protocol.md`](./balance/protocol.md)：确定性平衡验证协议。
- [`balance/reports/baseline-current.md`](./balance/reports/baseline-current.md)：当前基线报告。
- [`architecture/platform-direction.md`](./architecture/platform-direction.md)：网页与桌面发行方向。
- [`deployment.md`](./deployment.md)：部署说明。

### 历史记录

- [`archive/2026-07/`](./archive/2026-07/)：2026 年 7 月已经完成或被新基线取代的设计、修复与实现记录。
- [`superpowers/`](./superpowers/)：早期专项设计与实施计划，保留用于追溯。

历史文档中的结论、路径和待办均以当时状态为准。需要恢复其中的想法时，应先把相关内容提炼进当前 canonical 文档，不要直接重新激活整份历史清单。

## 文档状态约定

每份设计文档开头应尽量包含：

```text
状态：canonical | implemented | proposal | historical
更新日期：YYYY-MM-DD
用途：一句话说明负责回答什么问题
上位文档：发生冲突时应服从哪些文档
```

- `canonical`：当前采用的设计规则。
- `implemented`：当前版本的事实记录。
- `proposal`：尚未确认或尚未进入排期的方案。
- `historical`：已完成、被取代或仅用于追溯。

## 新增或修改文档时

1. 先判断内容属于产品、设计、实现、测试还是历史。
2. 不在多个文件重复维护同一份“当前路线图”。
3. 新的世界观结论必须同时检查世界圣经与五轮揭示顺序。
4. 已实现不等于继续采用；待实现也不等于已经承诺。
5. 移动文件后用 `rg` 检查仓库内引用，并在原索引保留可发现入口。
6. 数值、时长和验收结果注明对应 Build 或日期，避免被误读成永久规则。
