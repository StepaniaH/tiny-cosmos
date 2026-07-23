# 第二至第四轮重生剧情基线

版本：1.0  
确立日期：2026-07-23  
状态：剧情与数据契约已确立；图片待按分镜生产  
上位规则：`world-bible.md`、`loop-and-inheritance.md`、`routes/shared-campaign.md`

## 目标

第一轮序章回答“我是谁、要做什么、为什么存在背面宇宙”。第二至第四轮不重复新手教学，而要回答三个逐轮升级的问题：

1. 第二轮：上一轮的答案真的改变了新宇宙吗？
2. 第三轮：如果背面宇宙也会继承，历史由谁解释？
3. 第四轮：当边界本身开始记忆，正面与背面还能由一方单独定义吗？

每轮开场都必须让玩家在 90 秒内看懂四件事：上一轮留下了什么、这轮哪里不同、背面宇宙学会了什么、这轮长期目标是什么。

## 不可违背的叙事规则

- 周目不是时间倒流，而是大坍缩后以残留真理重新建立初始条件。
- 继承物不是传统装备掉落，而是上轮行为被压缩成的一条可运行规则；它同时带来能力与约束。
- 背面宇宙不会每轮“刷新仇恨”。它会继承上一轮被排除、被截取和被解释的方式。
- 路线不是阵营。相同路线在后续轮次也必须面对新的代价，不能把重复选择写成自动正确。
- 文明的上轮承诺会留下证词，但不会跨轮直接成为命令。新文明可以继承、误读或反驳它。
- 第二至第四轮的图片不含文字。所有路线名、继承物名、字幕和动态历史都由界面叠加。
- 普通大坍缩没有宇宙真理时，使用中性“常数回收”版本；不得伪造一个玩家没有取得的路线结局。

## 跨轮叙事数据契约

每次定向大坍缩生成一份 `LoopSignature`。重生序章只读取结构化记录，不从日志文本猜测历史。

```text
LoopSignature
  loopNumber             当前即将进入的轮次，2 / 3 / 4
  completedEnding        advance / sustain / inquiry / rewrite / ordinary
  endingVariant          具体终局变体 ID
  truths[]               已获得的宇宙真理 ID
  equippedInheritance    本轮装备继承物 ID
  priorLaw               expansion / conservation / observer
  priorContactMethod     overload / cutoff / observe / synchronize
  priorAfterimageUse     fuel / return / archive
  dominantRoute          上轮主路线信号
  secondaryRoute         上轮备选路线信号
  civilizationWitness    上轮文明留下的一句结构化证词 ID
  preserved              上轮明确带走或保护的对象 ID
  abandoned              上轮明确留在原处或放弃的对象 ID
  reverseRelation        hostile / bounded / reciprocal / witnessed / synchronized
  reverseSamples         已保留的反侧样本 ID
```

序章至少要把以下五个记忆槽中的三个写进字幕或画面状态：

| 记忆槽 | 来源 | 表达方式 |
| --- | --- | --- |
| 真理 | `truths[]` | 新宇宙初始条件中已经成立的一条规律 |
| 礼物 | `equippedInheritance` | 观测核或物质链上的可见继承结构 |
| 伤痕 | 接触方式、余像用途 | 视界缺口、回流痕、采样窗或同步相位 |
| 证词 | `civilizationWitness` | 上轮文明的一句界面字幕，不写入图片 |
| 债务 | `abandoned`、被排除路线 | 本轮更早出现的限制、请求或反侧反应 |

如果数据缺失，使用明确的中性文案，例如“只有常数回收通过了坍缩”，不得自动补成“你曾越过视界”。

## 背面宇宙的四轮演化

| 轮次 | 背面能力 | 玩家最先遇见的形态 | 新增问题 |
| --- | --- | --- | --- |
| 第一轮 | 模仿流量 | 真空水蛭、晶簇、合唱体、胚种 | 另一侧是否只是损失的形状 |
| 第二轮 | 预测玩家惯用方法 | 路线对应的反制结构 | 一个成功答案能否承受针对性的反例 |
| 第三轮 | 继承自身的应对历史 | 反侧谱系与“反继承物” | 谁拥有跨轮历史的解释权 |
| 第四轮 | 参与塑造共同初始条件 | 共享边界与多源文明信号 | 观察能否从单方行为变成共同署名 |

这里的“能力升级”不是单纯提高敌人数值。每轮至少增加一种可理解的新行为、一种新的沟通证据和一种新的互惠可能。

## 第二轮：答案的反例

工作章名：**回声有了方向 / The Echo Chose a Direction**  
核心情绪：熟悉、偏差、被认出  
长期目标：让第二座文明判断，上轮真理是一条可重复规律，还是一次幸运结果。

### 世界状态

第一次定向大坍缩没有把完整宇宙带过来，只让一个答案穿过。它在新宇宙中表现为轻微但可测量的初始偏差：有些结构更容易形成，有些代价更早出现。

背面宇宙也保留了上轮关系的轮廓。它还不能保存完整文明，却会更早识别观测核惯用的方法，并以相反问题回应。

### 七幕开场

| 幕 | 中文标题 | 中文正文 | English title | English body | 动态读取 |
| --- | --- | --- | --- | --- | --- |
| 01 | 这一次，坍缩没有抹平全部方向 | 上一轮只留下一个可陈述的答案。其余结构归于噪声，但这个答案穿过了终点。 | This collapse did not erase every direction | The last cosmos left one answer that could still be stated. Its structures became noise, but that answer crossed the ending. | `completedEnding`、`endingVariant` |
| 02 | TC-07 带着一道可运行的记忆醒来 | 观测核记住的不是完整历史，而是一条已经证明能够成立的规律。 | TC-07 wakes with a memory that can still run | The Core retained no complete history—only one rule already proven capable of holding. | `truths[0]` |
| 03 | 继承物把记忆接回物质 | 它会让某些选择更早出现，也会把上一轮没有支付完的代价带进来。 | Inheritance reconnects memory to matter | It makes some choices appear earlier—and carries forward a cost the previous loop did not finish paying. | `equippedInheritance` |
| 04 | 最初的物质不再完全中立 | 夸克仍需回应，物质链仍需建立；但新的宇宙已经偏向一种更容易发生的未来。 | Initial matter is no longer entirely neutral | Quarks must still answer and the matter chain must still be built, but this cosmos already leans toward one more likely future. | 继承物机械影响 |
| 05 | 视界背面也认出了这个偏差 | 另一侧没有保留你的结论，却保留了它曾如何失去可能性。它会更早试探你。 | The reverse side recognizes the bias too | It did not retain your conclusion. It retained how possibility was taken from it—and it will test you sooner. | `reverseRelation`、`priorContactMethod` |
| 06 | 路线分支画面 | 见下表。 | Route-specific counterexample | See route table below. | `dominantRoute` |
| 07 | 本轮目标：让答案经受反例 | 建立第二座文明，面对针对上轮方法而来的反侧结构，并决定这条真理应被重复、修正，还是交给后来者反驳。 | This loop: make the answer survive a counterexample | Build a second civilization, face a reverse-side structure shaped against your prior method, and decide whether that truth should be repeated, revised, or challenged. | 本轮目标 |

### 第二轮路线分支

| 上轮主路线 | 新宇宙继承 | 背面反例 | 第 06 幕字幕 | 本轮专属剧情钩子 |
| --- | --- | --- | --- | --- |
| 推进 / 越过视界 | 视界留有可再次点火的微小缺口 | **闭界格栅**在高吞吐时封住方向，逼玩家决定谁拥有远行权 | 你证明边界能够被穿越。另一侧学会了提前关闭门。 | 上轮被留下的对象发送延迟证词；载荷与原宇宙的价值第一次直接冲突 |
| 维持 / 无尽花园 | 低层更容易形成回流环 | **逆季候**把正面盈余解释为反侧短缺，要求公开缓冲负担 | 你证明对立可以形成循环。另一侧开始询问：谁一直在承担冬天？ | 花园的稳定条件成为早期优势，也使高库存更早吸引交换型接触 |
| 求证 / 最后观测者 | 第一份旧样本可被重新读取 | **盲区证人**只在未被聚焦时行动，逼玩家承认证据的观察成本 | 你证明观察者可以退出。另一侧开始利用你看不见的时刻。 | 上轮证据出现一个自相矛盾的新版本；完整档案不再等于完整解释 |
| 改写 / 双生大坍缩 | 两条轻量规则交替出现 | **失同步摆**主动制造相位误差，测试双方是否真能共同触发 | 你证明矛盾可以继续运行。另一侧保留了不同的拍点。 | 同步不再是一次按钮选择，而是需要在公开周期中反复维持 |
| 普通大坍缩 | 只有恒定点提速 | 背面关系回到未命名噪声，但会保留已取得样本 | 这次没有答案穿过坍缩。更快的起点，仍需重新形成方向。 | 不显示路线专属敌人；提供一次重新确定第一法则的中性开局 |

### 第二轮结束必须新增的记录

- `truthRepeated`：是否再次证明同一真理。
- `truthRevised`：是否以备选路线修正它。
- `reverseCounterexample`：玩家如何处理路线反例。
- `witnessResponse`：新文明接受、反驳或搁置上轮证词。

## 第三轮：两侧都有祖先

工作章名：**两个宇宙都开始继承 / Both Sides Inherit**  
核心情绪：历史重叠、身份不稳、第一次对等  
长期目标：让第三座文明决定，跨轮记忆应当属于观测核、文明、背面宇宙，还是共同边界。

### 世界状态

第三轮开始时，至少一条真理已经被重复或修正。观测核同时携带“最初的答案”和“对答案的反例”，记忆第一次发生内部张力。

背面宇宙则从第二轮接触中形成了自己的继承方式。它不再只模仿当前资源，而会把上轮学到的应对压缩成一枚**反继承物**。反继承物不是玩家装备的负面复制，而是一条有自身历史来源的规则。

### 七幕开场

| 幕 | 中文标题 | 中文正文 | English title | English body | 动态读取 |
| --- | --- | --- | --- | --- | --- |
| 01 | 两次终结留下了互不相同的证词 | 第一条真理说明什么能够成立；第二轮记录说明它在反例面前付出了什么。 | Two endings left different testimony | The first truth says what can hold. The second loop records what that truth cost when challenged. | 前两轮签名 |
| 02 | TC-07 无法再把记忆当作一条直线 | 真理、修正与未支付的债务同时存在。继承开始成为选择，而不只是奖励。 | TC-07 can no longer treat memory as a straight line | Truth, revision, and unpaid debt now coexist. Inheritance becomes a choice, not merely a reward. | `truths[]`、刻印 |
| 03 | 新物质继承了抵达结构的路径 | 某些组合尚未形成，环境却已经记得怎样更快到达它们。宇宙出现了祖先以前的习惯。 | New matter inherits paths toward structure | Some structures do not yet exist, yet the environment remembers how to reach them. This cosmos has habits older than its ancestors. | 混合继承物 |
| 04 | 背面宇宙也带来了一件继承物 | 那不是你的物品倒影，而是另一侧根据两轮损失学会的一条生存规则。 | The reverse cosmos brings an inheritance of its own | It is not a mirrored copy of your artifact, but a survival rule learned from two loops of loss. | `reverseCounterexample` |
| 05 | 路线分支画面 | 见下表。 | Route-specific ancestral conflict | See route table below. | 当前主继承路线 |
| 06 | 第一条跨轮回应来自另一侧的后来者 | “你们把保留称作历史。我们把无法被你们保留的部分称作祖先。” | The first cross-loop reply comes from descendants beyond the horizon | “You call what survives history. We call what you could not preserve our ancestors.” | `reverseRelation` |
| 07 | 本轮目标：决定谁能继承谁 | 建立第三座文明，处理双方继承物的冲突，并为历史的保存、公开与改写确定权限。 | This loop: decide who may inherit whom | Build a third civilization, resolve the conflict between both inheritances, and determine who may preserve, publish, or revise history. | 本轮目标 |

### 第三轮路线分支

| 当前继承方向 | 正面世界 | 反继承物 | 第 05 幕字幕 | 路线问题 |
| --- | --- | --- | --- | --- |
| 推进 | 物质链出现可封装的迁徙通道 | **归航锚**让被远征留下的结构拥有方向权 | 你的后来者学会携带未来；它们的后来者学会要求未来返回。 | 远行是否必须接受返航义务；载荷中的历史是否属于未同行者 |
| 维持 | 多层资源形成季候与生态记忆 | **无主冬季**拒绝由任何一侧永久承担缓冲 | 你的循环拥有祖先；另一侧的短缺也开始世代相传。 | 稳态能否继承负担而不固化不平等 |
| 求证 | 样本可以跨敌人建立模式索引 | **会避开档案的行为**在被命名后主动变异 | 你的证据学会归类；另一侧学会了不再成为同一种证据。 | 记录对象是否有拒绝被固定解释的权利 |
| 改写 | 两条法则可产生混合刻印 | **异步祖谱**让后代适应先于双方共同原因出现 | 你的矛盾成为规则；另一侧把不同的因果顺序传给了后代。 | 共同历史是否必须共享同一时间箭头 |

### 第三轮结束必须新增的记录

- `reverseInheritance`：反侧继承物的规则与来源。
- `historyCustodian`：观测核、正面文明、镜像文明或共同边界。
- `publicationPolicy`：私有、对等公开、延迟公开、允许异议版本并存。
- `inheritanceConflictResolution`：压倒、隔离、交换、观测、同步或混合方法。

## 第四轮：边界开始署名

工作章名：**边界不再属于任何一侧 / The Horizon Belongs to Neither Side**  
核心情绪：宏大、克制、共同责任  
长期目标：让第四座文明与反侧后来者共同决定，下一次宇宙的初始条件能否被双方署名。

### 世界状态

前三轮已经证明：真理能穿过坍缩，反例也能穿过，双方的继承方式同样会改变未来。第四轮不再从完全属于“正面”的空间开始。视界本身带着两侧共同写入的结构醒来。

这不是预设和平。共享边界可能是谈判桌、争夺对象、证据仓或共同触发器。双方仍可选择突破、保护、观察或改写，但不能再声称另一侧没有历史。

### 八幕开场

| 幕 | 中文标题 | 中文正文 | English title | English body | 动态读取 |
| --- | --- | --- | --- | --- | --- |
| 01 | 第三次终结没有形成单一中心 | 坍缩从两侧同时收束。失败的位置没有消失，而是在新初始条件中彼此咬合。 | The third ending formed no single center | Collapse converged from both sides. Its failure points did not vanish; they interlocked inside the new initial condition. | 第三轮关系 |
| 02 | TC-07 在边界内部醒来 | 观测核第一次无法把自己完整归类为正面对象。它仍能聚焦、保护与记录，却不再独占坐标原点。 | TC-07 wakes inside the horizon | For the first time, the Core cannot classify itself entirely as a front-side object. It can still focus, protect, and record—but no longer owns the origin. | `historyCustodian` |
| 03 | 三轮真理已经成为物质条件 | 它们不是陈列在档案里的奖章。每一条真理都在加速一件事、限制一件事，并让另一种未来更难发生。 | Three loops of truth have become material conditions | They are not medals in an archive. Each truth accelerates one possibility, constrains another, and makes a different future harder to realize. | `truths[]` |
| 04 | 双方继承物在同一条物质链上运行 | 礼物与反继承物不再隔着视界生效。它们会合作、竞争，也可能把同一层资源写成两种意义。 | Both inheritances run on one matter chain | Gift and counter-inheritance no longer act across a distant horizon. They may cooperate, compete, or assign two meanings to the same resource layer. | 双方继承物 |
| 05 | 反侧信号不再只有一个声音 | 有的后来者要求归还可能性，有的要求共享证据，有的只要求你停止替它们命名。 | The reverse signal no longer has a single voice | Some descendants demand returned possibility, some ask for shared evidence, and some ask only that you stop naming them. | 多源信号，保持派别未定 |
| 06 | 路线分支画面 | 见下表。 | Route-specific shared-boundary crisis | See route table below. | 本轮主提案 |
| 07 | 四份未来图第一次出现在同一条边界上 | 门、花园、最后的测量站与折回自身的坍缩曲线都能成立；没有一份可以不修改另一份。 | Four futures appear on the same horizon | A door, a garden, a final measuring station, and a collapse curve folded through itself can all hold. None can remain unchanged by the others. | 已公开路线 |
| 08 | 本轮目标：决定观察能否共同署名 | 建立第四座文明，让两侧公开各自要保留与放弃的能力，并决定下一次初始条件由谁写入。 | This loop: decide whether observation can be co-authored | Build a fourth civilization, make both sides state what they will preserve and surrender, and decide who may write the next initial condition. | 本轮目标 |

### 第四轮路线分支

| 主提案 | 共享边界危机 | 第 06 幕字幕 | 需要继承前轮的内容 | 不得简化成 |
| --- | --- | --- | --- | --- |
| 越过视界 | 边界能被打开，但两侧都拥有方向权；载荷容量必须容纳对方证词或明确拒绝 | 门终于再次出现。这一次，门的两边都有人决定什么算作远方。 | `preserved`、`abandoned`、归航锚处理 | 单纯逃生或击败守门人 |
| 无尽花园 | 双方能建立共同循环，但必须公开缓冲账本与退出权 | 花园终于覆盖边界。这一次，任何稳定都必须写明谁承受波动。 | 季候、缓冲承担者、交换控制权 | 永恒静止或无代价和平 |
| 最后观测者 | 完整证据需要多方署名；任何一方都可标记异议与不可观测区 | 测量站终于看见两侧。这一次，被观察者也能在档案上留下保留意见。 | 证据归属、公开政策、退出方式 | 全知上帝视角 |
| 双生大坍缩 | 双方各自封存一项优势，共同确定触发窗口与失败泄压层 | 坍缩曲线终于重合。这一次，没有任何一侧能单独按下终点。 | 两条真理、双方继承物、同步历史 | 隐藏真结局或自动和解 |

### 第四轮结束必须新增的记录

- `sharedBoundaryCharter`：边界控制、退出、证据和资源交换权限。
- `mutualSurrender`：双方各自封存的一项能力。
- `coauthoredInitialCondition`：下一轮初始条件由单方、双方或开放规则写入。
- `dissentRecord`：未被最终方案吸收的文明意见。

第四轮是第一段跨轮主叙事的汇合点，不是唯一正确结局。第四轮之后可以重复路线、混合刻印或进入更高轮次内容；任何结局都继续保留代价与异议。

## 进入游戏后的继承呈现

重生漫画结束后，主界面在前 90 秒只保留一张“本轮差异卡”，避免玩家重新面对整套解释：

- 本轮真理：一句话。
- 已装备继承物：能力一句、约束一句。
- 背面记忆：本轮会更早出现的行为。
- 本轮长期目标：一句话。

这张卡可收起，并永久写入档案。已完成第一轮的玩家不再播放“点击五次是什么”类聚光教学；只有本轮新增规则在首次可操作时弹出一次。

## 内容验收

- [x] 第二、三、四轮各有独立主题、目标与反宇宙能力升级。
- [x] 四条路线在每轮都有具体世界变化、反例和剧情问题。
- [x] 普通大坍缩有中性回退，不伪造路线历史。
- [x] 上一轮真理、继承物、接触结果、文明证词与债务有结构化读取位置。
- [x] 第四轮汇合但不宣称隐藏路线是唯一真结局。
- [x] 将 `LoopSignature` 落入状态与存档迁移（slice v7）。
- [x] 实现第二轮按路线选择的七幕重生序列控制器；第三、四轮仍待接入。
- [x] 实现第二轮 12 节点可玩节奏、路线反例、碎片与真理裁定，详见 `second-loop-playable-slice.md`。
- [x] 生产并验收第二轮 10 个终稿槽位，包含四张路线反例图。
- [ ] 生产并验收第三、第四轮剩余 21 张终稿资产。
- [ ] 为每轮至少四种历史组合建立自动化截图夹具。
- [ ] 对完成第一轮的玩家做重生开场可理解性试玩。
