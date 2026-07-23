# Tiny Cosmos 玩法设计文档索引

更新日期：2026-07-23
说明：本目录记录玩法讨论与后续方向。除非单独标明，这些内容均为设计方案，不代表已经实现或通过平衡验证。

## 从这里开始

1. `docs/game-design/gameplay-direction.md`：为什么当前玩法无聊、推荐的整体核心循环和开发顺序。
2. `docs/game-design/loop-and-inheritance.md`：小决策如何形成四个结局，以及结局继承物如何改变下一轮。
3. `docs/game-design/decision-pool.md`：伪随机选项、隐藏系数、反向补偿和保底规则。
4. `docs/game-design/adversarial-system.md`：反宇宙敌人如何侵入资源链，以及预警、反制和失败保护。
5. `docs/game-design/victory-routes.md`：多胜利路线的形成条件、终局操作和结局差异。
6. `docs/game-design/side-branches.md`：短项目、自动化、现象队列、谱系和档案等细枝玩法。
7. `docs/game-design/paper-playtest.md`：无需写代码即可执行的单轮与三轮纸面试玩。
8. `docs/game-design/first-contact-vertical-slice.md`：当前已实现的第一轮竖切，从观测核启动延伸到文明火种与路线提案。
9. `docs/game-design/onboarding-ux.md`：第一轮的聚光引导、稳定任务、阶段发现、任务进度、聚焦说明、流量图和动效反馈。
10. `docs/game-design/routes/shared-campaign.md`：共同世界观、玩家身份、分幕发展剧本和共享对白。
11. `docs/game-design/world-bible.md`：已冻结的世界规则、第一次接触剧情链与主要名词规范。
12. `docs/art/README.md`：完整资产文档入口，以及交给 Cursor + Blender 的制作、验证和回传流程。
13. `docs/game-design/early-game-pacing.md`：Build 0.5 的时间目标、稳定任务、接触准备和试玩数据。
14. `docs/game-design/onboarding-readability-localization.md`：当前序章、可读性、渐进显示与中英文本地化实现基线。
15. `docs/game-design/rebirth-rounds-2-4-narrative.md`：第二至第四轮重生剧情、路线分支、反宇宙演化与跨轮数据契约。
16. `docs/game-design/second-loop-playable-slice.md`：已接入代码的第二轮 12 节点节奏、四条路线反例、碎片叙事与真理裁定。

## 路线详案

- `docs/game-design/routes/across-horizon.md`：越过视界——准备、爆发与边界远征。
- `docs/game-design/routes/endless-garden.md`：无尽花园——稳态、扰动与双生共生。
- `docs/game-design/routes/last-observer.md`：最后观测者——证据、预测与可控牺牲。
- `docs/game-design/routes/twin-crunch.md`：双生大坍缩——隐藏的混合构筑与同步轮回。
- `docs/game-design/routes/README.md`：路线状态、阅读顺序和共同约束。

## 技术与平台

- `docs/architecture/platform-direction.md`：网页版本、桌面封装和 Steam 发行的判断节点。
- `docs/architecture/blazor-webassembly-evaluation.md`：Blazor WebAssembly 的工作方式及本项目是否需要迁移。

## 当前设计决策

- 局内核心方向：宇宙控制室，围绕焦点、储备、资源链和实验进行低频调度。
- 局外核心方向：法则构筑、大坍缩、宇宙真理和新初始条件。
- 敌人方向：反宇宙直接截流或扰动现有经济，不另造传统战斗系统。
- 路线结构：整局小决策积累四类倾向，文明阶段生成主提案和备选提案，终局确认后进入专属工程。
- 公开结局：越过视界、无尽花园、最后观测者。
- 第四结局：双生大坍缩，需要跨周目真理和本轮同步条件，待公开路线稳定后实现。
- 周目回报：定向大坍缩提供两件继承物候选，下一轮装备一件主继承物。
- 第二轮原型：第一轮文明结算可生成 `LoopSignature` 并进入可玩的“答案的反例”闭环；开场不重播基础教学。
- 选项生成：使用固定种子和隐藏权重；连续偏向会提高其他方向的出现概率，专精路线仍有保底来源。
- 技术方向：验证玩法期间保留现有 JavaScript 技术栈，先做桌面浏览器版本。

## 当前建议工作顺序

1. 用纸面资源卡演练共同剧本和真空水蛭第一次接触。
2. 验证宇宙焦点、储备保护和四种敌人处理方法。
3. 分别演练越过视界与无尽花园的终局时间轴。
4. 删除没有改变玩家行为的法则、实验和路线步骤。
5. 用两到三轮纸面流程验证结局继承物确实改变下一轮选项和操作。
6. 形成首个可实现竖切规格，再进入代码阶段。
7. 最后观测者依赖证据系统，放在两个首批路线原型之后。
8. 双生大坍缩只作为远期内容，不进入首批排期。
9. `LoopSignature` 与第二轮可玩框架已经落地；下一步用真实试玩校准四种反例节奏，并生产第二轮其余图片，再推进第三轮反继承物。

## 与平衡文档的关系

现有 `docs/balance/` 负责证明资源循环能够稳定运行；本目录负责回答玩家为何要做不同选择。

未来每个实现中的玩法机制都应同时具备：

- 一份人类可读的体验假设。
- 至少两个有意义的玩家策略。
- 对现有确定性平衡基线的前后比较。
- 明确的失败恢复与离线安全规则。
