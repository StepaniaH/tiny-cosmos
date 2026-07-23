// tiny-cosmos — First-contact vertical slice
// Guided scenario, early decisions, route tendencies and the first adversary.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;

  function isSecondLoop() {
    var current = GS.getSlice();
    return !!(current && current.loopNumber === 2);
  }

  function loopSignature() {
    var current = GS.getSlice();
    return current && current.loopSignature ? current.loopSignature : {
      dominantRoute: 'ordinary',
      secondaryRoute: null,
      completedEnding: 'ordinary',
      truths: ['constants-can-be-recovered'],
      equippedInheritance: 'constant-kernel',
      civilizationWitness: 'speed-is-not-yet-a-direction',
      reverseRelation: 'reciprocal',
    };
  }

  var ROUTES = {
    advance: { name: '推进', ending: '越过视界', goal: '在下一次大坍缩前完成边界航行工程', question: '边界究竟是牢笼，还是尚未打开的门？', color: '#ffb84d' },
    sustain: { name: '维持', ending: '无尽花园', goal: '让物质与谱系循环跨越大坍缩继续生长', question: '永续是否值得放弃一次不可逆的远行？', color: '#61e6a7' },
    inquiry: { name: '求证', ending: '最后观测者', goal: '保留一位能验证宇宙全部历史的观察者', question: '最后一束光必须被谁看见，才算存在过？', color: '#56d8ff' },
    rewrite: { name: '改写', ending: '双生大坍缩', goal: '让正反宇宙共同改写下一轮初始条件', question: '如果敌我共享一次终结，重生还属于任何一侧吗？', color: '#c594ff' },
  };

  var DECISION_LEVELS = {
    law: '局部法则',
    preparation: '接触准备',
    enemy: '接触策略',
    core: '余像处置',
    complexity: '复杂性伦理',
    reverse: '反宇宙回应',
    phenomenon: '偶发现象',
    inheritance: '继承校准',
    fragment: '历史碎片',
    counterexample: '路线反例',
    witness: '文明证词',
    verdict: '真理裁定',
  };

  var MISSIONS = [
    {
      code: 'BOOT-01', title: '建立观测响应',
      brief: '点击中央光核 5 次。每次点击立即获得 1 枚夸克。',
      hint: '最初几次观测需要手动完成。光核周围的轨道会显示已稳定的资源层。',
      world: '你接管的微型宇宙刚从一次坍缩中恢复。当前只有观测核和一层未稳定的夸克噪声。',
      action: '点击中央光核 5 次，让观测核确认这个宇宙会回应你的操作。',
      restSeconds: 6,
      restMessage: '观测核保持低功率运行。继续点击可以加快第一批夸克积累，也可以观察自动产出。',
    },
    {
      code: 'BOOT-02', title: '让重复脱离意志',
      brief: '积累夸克，购买第二个夸克生产单元。',
      hint: '生产单元会持续工作，手动点击很快会退到辅助位置。',
      world: '观测响应已经稳定。只靠持续点击会占用你的全部注意力，生产单元可以接管重复工作。',
      action: '等待夸克达到购买价格，再在左侧夸克卡片中增设第 2 个生产单元。',
      restSeconds: 7,
      restMessage: '第二个生产单元已经接管一部分工作。继续积累库存，下一阶段会连续消耗夸克。',
    },
    {
      code: 'MATTER-01', title: '合成五枚核子',
      brief: '使用夸克→核子操作五次，建立第一层高阶结构。',
      hint: '合成会消耗低层库存。后续每个高层也会持续消耗相邻低层。',
      world: '夸克开始重复出现，但它们仍无法形成长期结构。核子是资源链中的第一层组合物。',
      action: '在核子卡片中执行 5 次“夸克 → 核子”。每次合成都会扣除夸克，价格也会缓慢上升。',
      restSeconds: 7,
      restMessage: '观察夸克库存的下降和恢复。接下来需要继续补足核子，建立它自己的生产单元。',
    },
    {
      code: 'FOCUS-01', title: '建立并聚焦核子生产',
      brief: '补足核子，购买核子生产单元，再把宇宙焦点移动到核子层。',
      hint: '焦点层生产速度变为 1.8 倍。全宇宙只能保留一个焦点，迁移没有资源成本。',
      world: '观测核的计算能力有限，同一时间只能完整追踪一个物质尺度。被追踪的层级会得到更高的生产效率。',
      action: '先把核子补到生产单元所需数量并完成购买，再点击“聚焦”。流量图会显示核子产出得到 1.8 倍加速。',
      restSeconds: 8,
      restMessage: '保持核子焦点，先让两层库存恢复。下一项任务会要求你维持一段稳定流量。',
    },
    {
      code: 'FLOW-01', title: '建立双层盈余',
      brief: '让夸克、核子两行都显示绿色“有盈余”，并把夸克库存维持在 12 以上，共计 35 秒。',
      hint: '“有盈余”就是每秒产出大于每秒消耗。监视器会逐项显示哪些条件已满足、哪些仍需调整。',
      world: '一次短暂的高产不能证明结构已经稳定。观测核需要一段连续记录，确认核子生产没有拖垮夸克层。',
      action: '看“稳态判定”清单：聚焦核子、夸克不少于 12，并让夸克与核子都显示“有盈余”。四项同时为绿色时开始计时。',
      restSeconds: 7,
      restMessage: '双层流量记录已经成立。你可以继续扩充产能，研究通道将在下一阶段开放。',
    },
    {
      code: 'RESEARCH-01', title: '读取研究通道',
      brief: '打开“研究构成”，查看夸克和核子各自提供的研究增长。',
      hint: '资源越多，研究贡献越高；增长采用平方根计算，因此囤积同一资源的边际收益会下降。',
      world: '观测核会把稳定存在的资源转化为可复现的规律。研究点持续增长，不需要单独安排研究人员。',
      action: '点击研究通道右侧的“研究构成”。对照每层贡献和总增长速度。',
      restSeconds: 6,
      restMessage: '研究构成保持可查。让研究点自然增长一会，观察紫色研究速率线的位置。',
    },
    {
      code: 'RESEARCH-02', title: '揭示原子层',
      brief: '积累 45 研究点，执行“研究原子层”。',
      hint: '研究按钮会支付当前研究点。已经解锁的结构和研究增长速度会保留。',
      world: '研究通道正在接近第一个结构阈值。达到阈值后，观测核能够稳定识别原子。',
      action: '先确认研究条中的“下一目标”。返回主界面继续积累；达到 45 RP 后，引导会再次提示可用的“研究原子层”按钮。',
      restSeconds: 0,
      restMessage: '原子层已经出现。新的合成与生产操作立即开放。',
    },
    {
      code: 'MATTER-02', title: '建立原子生产',
      brief: '累计获得 18 枚原子，并建立 2 个原子生产单元。',
      hint: '原子会持续消耗核子。流量监视器中的红柱表示每秒消耗。',
      world: '原子层已经可见，但还没有形成自持循环。它会依赖核子库存完成最初扩张。',
      action: '在核子库存允许时合成原子。累计原子达到 18，并把原子生产单元增加到 2 个。',
      restSeconds: 8,
      restMessage: '原子生产已经形成规模。观察核子的消耗红柱，下一项指令会为低层库存建立底线。',
    },
    {
      code: 'RESERVE-01', title: '设置核子保护线',
      brief: '在核子卡片上选择“保护”。保护线会为代谢和敌人损失保留最低库存。',
      hint: '当前竖切只能保护一个层级；移动保护线没有资源成本。',
      world: '高层结构会持续消耗相邻低层。保护线公开了当前宇宙拒绝突破的库存底线。',
      action: '点击核子卡片中的“保护”，为核子保留最低库存。',
      restSeconds: 6,
      restMessage: '保护线已经生效。观察核子接近底线时，高层消耗如何停止。',
    },
    {
      code: 'FLOW-02', title: '完成物质稳态观测',
      brief: '同时满足 4 项公开条件：保护核子、核子≥8、原子≥12、核子每秒有盈余，并连续保持 60 秒。',
      hint: '稳态不是“数字看起来很多”，而是四个条件同时成立。监视器会显示实时判定；焦点放在核子层只是推荐方法，不是隐藏条件。',
      world: '原子层正在持续抽取核子。观测核需要证明这条资源链能够承受一分钟的连续运行。',
      action: '逐项核对稳态清单。若核子没有盈余，聚焦核子或增加核子生产；若库存不足，暂停合成原子并等待恢复。四项全绿时开始计时。',
      restSeconds: 7,
      restMessage: '一分钟稳态记录已经写入。三套现有系统都获得了足够数据，可以据此确定第一法则。',
    },
    {
      code: 'LAW-01', title: '确定第一条法则',
      brief: '比较焦点、保护线和研究通道的三种强化，选择第一条法则。',
      hint: '你已经实际使用过三个系统。法则会强化其中一个，并留下路线信号。',
      world: '原子让宇宙第一次拥有可长期保持的结构。观测核需要决定哪条已知规律获得优先权。',
      action: '阅读右侧三个选项。每项都列出当前效果、改变后的数值和路线记录。',
      restSeconds: 7,
      restMessage: '第一法则正在改变资源流。观察焦点倍率、保护线或研究增长的变化。',
    },
    {
      code: 'PREP-01', title: '部署接触准备',
      brief: '选择库存缓冲、脉冲蓄能或远距标定，并完成对应的 30 秒准备。',
      hint: '三项准备分别强化止损、压倒方案和观测方案，也会留下 1 点路线信号。',
      world: '第一法则稳定后，视界背面出现了不同步的资源影子。外部结构尚未成形，当前仍有时间准备。',
      action: '在决策队列中比较三项准备。选定后完成显示的库存、产能或研究条件。',
      restSeconds: 7,
      restMessage: '接触准备已经就绪。保持现有资源配置，下一项指令会读取视界背面的征兆。',
    },
    {
      code: 'CONTACT-01', title: '读取反宇宙征兆',
      brief: '检查真空水蛭的目标、损失上限和倒计时，准备后建立接触。',
      hint: '倒计时结束会自动建立接触，也可以提前确认。',
      world: '未被第一法则采用的可能性没有消失，它们在视界背面形成了第二组资源影子。',
      action: '查看接触面板中的目标、截取速率和损失上限。准备完成后可以提前建立接触。',
    },
    {
      code: 'CONTACT-02', title: '处理真空水蛭',
      brief: '选择压倒、断供或观测，并完成对应操作。',
      hint: '第四种“同步”会在跨周目取得反宇宙样本后开放。',
      world: '真空水蛭正在截取原子，但损失存在公开上限。处理方法会决定资源代价和本轮路线记录。',
      action: '在接触面板中并列比较三种方案。每项都会说明成本、完成时间、停止损失的方法和路线记录。',
      restSeconds: 7,
      restMessage: '真空水蛭已经退去。先检查累计损失和留下的核心余像。',
    },
    {
      code: 'CORE-01', title: '处置核心余像',
      brief: '敌人已经退去。决定余像进入边界燃料、资源回流或行为档案。',
      hint: '这次选择会与此前法则、敌人处理共同形成路线信号。',
      world: '敌人带走的资源没有直接返回，它们在视界边缘形成了一块可利用的稳定余像。',
      action: '在右侧选择余像用途。立即收益和路线记录会同时写入本轮档案。',
    },
    {
      code: 'REPORT-01', title: '第一次接触完成',
      brief: '读取第一次接触报告。8 秒后观测核会自动继续推进复杂物质，也可以立即继续。',
      hint: '报告只归纳真实选择，不评价正误；它会留在决策履历中，并成为文明提案的第一组依据。',
      world: '第一次接触已经结束。系统没有把你归入固定阵营，只保存了这一轮实际采用的方法。',
      action: '查看接触报告与路线信号。无需额外操作，倒计时结束后将开放分子层。',
    },
    {
      code: 'MOLECULE-01', title: '让结构学会组合',
      brief: '处理反相晶簇，研究分子层，累计获得 12 枚分子并建立 1 个生产单元。',
      hint: '反侧客体会读取当前主路线。沿用主路线强化终局信号，却也会提高反侧压力。',
      world: '原子能够长期存在，却仍各自孤立。分子把“相邻”变成可重复关系；反宇宙则送来一块只在未发生的化学键上结晶的客体。',
      action: '先在决策队列回应反相晶簇；随后积累 150 RP 研究分子，合成 12 枚分子并建立生产单元。',
      restSeconds: 7,
    },
    {
      code: 'CELL-01', title: '建立自持边界',
      brief: '回应静默合唱体，研究细胞层，累计获得 10 枚细胞并建立 2 个生产单元。',
      hint: '从细胞开始，结构会维护内部、积累生态记忆并承受反侧影响；生产与消耗不再只是直线升级。',
      world: '分子网络越过临界点：结构开始主动修补“里面”。静默合唱体同时包围外侧，试图让所有边界共享同一个节拍。',
      action: '先决定如何回应静默合唱体；积累 360 RP 研究细胞，合成 10 枚细胞并建立 2 个生产单元。',
      restSeconds: 7,
    },
    {
      code: 'ETHIC-01', title: '确定复杂性的照料方式',
      brief: '在决策队列中选择如何对待刚出现的自持结构。',
      hint: '这是发展阶段的中层决策：它不会覆盖第一法则，而会与此前记录一起影响文明提案。',
      world: '细胞会自行维持，也会竞争低层物质。观测核必须决定是推动扩张、维持生态、保存证据，还是让正反两侧共同试验。',
      action: '查看“复杂性伦理”四项选择。决策队列会显示它位于第一法则与文明提案之间的层级。',
      restSeconds: 7,
    },
    {
      code: 'LIFE-01', title: '让选择成为谱系',
      brief: '回应镜像胚种，研究生命层，累计获得 6 份生命并建立 2 个生产单元。',
      hint: '生命会把环境、路线和反侧压力写进谱系；此时路线仍可改变，但代价已经可以被后代继承。',
      world: '自持结构开始跨代复制差异。反侧送来一枚没有祖先却拥有记忆的胚种，逼迫观测核决定何种历史可以进入谱系。',
      action: '先回应镜像胚种；积累 900 RP 研究生命，合成 6 份生命并建立 2 个生产单元。',
      restSeconds: 7,
    },
    {
      code: 'SIGNAL-01', title: '辨认背面的第二种声音',
      brief: '保持至少 4 份生命与非负细胞流量，连续记录 75 秒。',
      hint: '这不是敌人倒计时。条件失效时记录缓慢回退，可随时返回主界面调度。',
      world: '生命出现后，背面噪声不再只是重复资源变化。某种结构正在按固定间隔回应，像是在确认这里是否也有观察者。',
      action: '保留至少 4 份生命，并让细胞净流量不为负。连续记录完成后，文明研究将开放。',
      restSeconds: 7,
    },
    {
      code: 'CIV-01', title: '译出共同问题',
      brief: '积累 1800 RP，研究文明层。',
      hint: '文明不是更大的库存，而是资源链中第一次能够理解路线记录并提出自身方案的行动者。',
      world: '正面生命与背面信号同时指向同一个问题：这个宇宙应该继续扩张、维持循环、理解观察，还是共同改写坍缩？',
      action: '继续经营各层库存并权衡反侧影响。达到 1800 RP 后研究文明层。',
      restSeconds: 7,
    },
    {
      code: 'CIV-02', title: '点燃第一座文明',
      brief: '用 12 份生命合成 1 份文明。',
      hint: '文明没有自动生产单元。它是本轮资源、研究与决策历史共同达到的第一轮大循环终点。',
      world: '观测核已经能描述文明，但描述不会替代诞生。必须由仍在运行的生命谱系支付最后一次组合成本。',
      action: '保留或继续合成生命；达到 12 份生命后执行“生命 → 文明”。',
    },
    {
      code: 'CIV-REPORT', title: '第一轮大循环完成',
      brief: '文明已经诞生，并根据本轮决策提出主提案与备选提案。',
      hint: '提案解释“为什么出现”，但当前版本不会强迫你立即进入终局工程。资源链可以继续运行。',
      world: '资源链中第一次出现了能够回看整轮历史的行动者。它们把观测核称为“那个总盯着仓库看的天体”，随后递交了两份彼此不完全相同的未来。',
      action: '在决策队列中查看文明提案及其依据；第一轮从夸克到文明的大循环至此完成。',
    },
  ];

  var SECOND_LOOP_MISSIONS = [
    {
      code: 'R2-MEM-01', title: '校验坍缩签名',
      brief: '在决策队列读取上轮真理、继承物、证词与债务，并选择本轮如何校准它。',
      hint: '第二轮不会重新教学点击与生产。你从已经能自动运行的夸克—核子链开始。',
      world: '大坍缩没有保留完整历史，却把上轮主提案压缩成一条可运行规则。它既是礼物，也是新宇宙最早的偏见。',
      action: '打开决策队列，对比“沿用偏差、设置阻尼、公开代价”三种校准方式。',
      restSeconds: 5,
      restMessage: '继承物开始接入物质链。观察它先加速了什么，又让什么更难成立。',
    },
    {
      code: 'R2-BIAS-01', title: '测量有方向的初始物质',
      brief: '保持夸克≥12、核子≥4，且两层净流量不为负，连续记录 25 秒。',
      hint: '这不是第一次轮的基础教学。目标是确认继承偏差能否在稳定资源流中持续存在。',
      world: '这一轮的最初物质不再中立。某些组合比上轮更容易发生，而被排除的代价也更早留下轮廓。',
      action: '用焦点与保护线调整现成的双层生产链；全部条件同时满足时开始连续记录。',
      restSeconds: 6,
      restMessage: '偏差已经被测量，而不是被当作理所当然。研究通道正在寻找它最早改变的结构。',
    },
    {
      code: 'R2-ATOM-01', title: '在旧方法之外建立原子',
      brief: '研究原子层，累计获得 10 枚原子，并建立 1 个原子生产单元。',
      hint: '已掌握的操作被压缩成一个阶段。新的问题不是“如何合成”，而是上轮答案怎样改变合成。',
      world: '原子再次出现，但谱线在上轮主路线的方向上产生了轻微偏折。反侧噪声比第一轮更早对这份偏折作出回应。',
      action: '积累研究点揭示原子；随后合成 10 枚原子并建立 1 个生产单元。',
      restSeconds: 5,
      restMessage: '第一组原子谱线与上轮记录重合。一个不属于当前时间的句子混入了校验结果。',
    },
    {
      code: 'R2-FRAG-01', title: '回应一段尚未发生的证词',
      brief: '在决策队列处理上轮文明证词的残片：接受、复核，或保留矛盾版本。',
      hint: '碎片不是完整回忆。你的回应会决定第二座文明看到的是遗训、证据，还是争议。',
      world: '物质尚未形成生命，研究通道却先读出一句文明用语。它来自上一轮，但末尾多出了一段没有被观测核记录过的修订。',
      action: '比较三种归档方式。选择会留下路线信号，但不会直接判定上轮文明说得对或错。',
      restSeconds: 6,
      restMessage: '证词碎片获得了版本号。视界背面的结构不再隐藏它已经认出这条旧答案。',
    },
    {
      code: 'R2-COUNTER-01', title: '面对为你定制的反例',
      brief: '读取路线专属反侧结构，并决定重复旧方法、用备选路线修正，或建立双侧试验。',
      hint: '反例不是数值更高的旧敌人。它针对的是你上轮最常用、最成功的那套方法。',
      world: '另一侧没有继承你的结论，却继承了自己曾如何失去可能性。它把那段损失压缩成一个专门测试上轮真理的结构。',
      action: '在决策队列阅读反例的行为规则，再选择一种回应框架。',
      restSeconds: 5,
      restMessage: '回应框架已经公开。接下来必须用真实资源流证明它，而不是只在档案里声明立场。',
    },
    {
      code: 'R2-PROOF-01', title: '让答案承受一次反证',
      brief: '满足路线专属条件并连续维持 40 秒，让反例有机会真正推翻你的方法。',
      hint: '四条路线使用不同条件。进度失效时缓慢回退，不会把一次短暂波动当成失败。',
      world: '上轮答案曾经成功，但“成功过”不等于“可重复”。反侧结构开始预测你的焦点、保护线与吞吐习惯。',
      action: '查看稳态判定中的路线专属条件。保持条件成立，直到反例完成一次完整测试。',
      restSeconds: 7,
      restMessage: '反例没有消失，它被转化成一份可复查结果。复杂物质将沿这份分歧继续生长。',
    },
    {
      code: 'R2-BRIDGE-01', title: '从反例中长出连接',
      brief: '研究分子层，累计获得 8 枚分子，并建立 1 个生产单元。',
      hint: '分子阶段不再重复三次反侧客体教学；本轮只保留一个与上轮答案直接相关的结构后果。',
      world: '反例测试留下的不是胜负，而是一组新连接条件。某些原子只有在承认旧答案存在盲区时才愿意成键。',
      action: '研究分子层并建立最小可持续连接。反例处理方式会改变这一阶段的生产倍率。',
      restSeconds: 6,
      restMessage: '连接开始保存分歧。第二段文明证词从分子间隙中出现，这次它明确要求后来者回答。',
    },
    {
      code: 'R2-WITNESS-01', title: '决定后来者如何读前人',
      brief: '选择第二座文明应当接受、反驳，还是暂缓采用上一轮文明证词。',
      hint: '证词不会跨轮成为命令。它可以提供方向，也必须允许后来者留下异议。',
      world: '第一座文明无法活着抵达这里，但它留下的结构化证词已经影响了哪些连接更容易出现。后来者有权知道，也有权不同意。',
      action: '在决策队列为证词设定继承方式。选择会成为第二轮结束时的 witnessResponse。',
      restSeconds: 5,
      restMessage: '证词获得了继承权限。生命阶段将同时携带上轮答案与本轮异议。',
    },
    {
      code: 'R2-LIFE-01', title: '把答案与反例编入谱系',
      brief: '研究细胞与生命层，累计获得 3 份生命。',
      hint: '第二轮把已掌握的复杂物质操作合并为一次“谱系跃迁”，节奏重点放在继承结果而非重复建厂。',
      world: '细胞不再只继承环境压力。它们同时继承一条旧真理、一份反例结果，以及是否允许反驳祖先的制度。',
      action: '先研究并合成细胞，再研究生命层；累计 3 份生命即可译出第二座文明的共同问题。',
      restSeconds: 7,
      restMessage: '谱系已经能区分“祖先做过的事”和“后来者必须做的事”。文明研究通道开放。',
    },
    {
      code: 'R2-CIV-01', title: '点燃第二座文明',
      brief: '研究文明层，并用 8 份生命合成 1 份文明。',
      hint: '第二座文明会同时回读上轮证词、本轮反例与当前路线，不会复制第一座文明的议案。',
      world: '这座文明出生在一条已经有祖先的宇宙里。它们的第一个问题不是“未来是什么”，而是“哪些过去有资格约束未来”。',
      action: '继续经营谱系，达到研究与生命条件后点燃文明。',
      restSeconds: 6,
      restMessage: '第二座文明开始比较两轮记录。最终裁定必须由你公开，但它们会留下自己的异议。',
    },
    {
      code: 'R2-VERDICT', title: '裁定第一条真理的地位',
      brief: '选择重复上轮真理、用本轮备选路线修正，或保留为尚未解决的争议。',
      hint: '这里记录 truthRepeated 与 truthRevised；没有任何选项被标记为隐藏真结局。',
      world: '一条真理若不能面对反例，只是一次幸运；若只能原样重复，又可能变成惯性。第二座文明要求你明确它在下一轮档案中的地位。',
      action: '在决策队列阅读第二座文明的意见，并完成真理裁定。',
      restSeconds: 5,
      restMessage: '两轮历史第一次同时拥有结论与异议。观测核正在生成下一份跨轮签名。',
    },
    {
      code: 'R2-REPORT', title: '第二轮：答案的反例完成',
      brief: '第二座文明已经评价上轮真理，并留下可供第三轮读取的反例记录。',
      hint: '资源链可以继续运行。第三轮将让反宇宙第一次携带自己的继承物进入开场。',
      world: '第一轮证明一种未来可以成立；第二轮证明它必须如何面对针对性的质疑。历史不再是一条直线，而是两份能够互相校验的证词。',
      action: '查看真理裁定、反例回应与文明证词。第二轮可玩叙事闭环至此完成。',
    },
  ];

  function activeMissions() {
    return isSecondLoop() ? SECOND_LOOP_MISSIONS : MISSIONS;
  }

  var LAW_OPTIONS = [
    {
      id: 'expansion', route: 'advance', title: '急剧膨胀', tag: '路线：推进 +2',
      desc: '当前焦点所在资源层的生产倍率从 1.80 提高到 2.25。',
    },
    {
      id: 'conservation', route: 'sustain', title: '局部守恒', tag: '路线：维持 +2',
      desc: '当前设置保护线的资源层额外获得 20% 生产效率；未来资源损失事件的上限也会降低。',
    },
    {
      id: 'observer', route: 'inquiry', title: '观测者效应', tag: '路线：求证 +2',
      desc: '研究通道的总增长速度提高 25%。研究构成面板会立即显示变化后的数值。',
    },
  ];

  var PREPARATION_OPTIONS = [
    {
      id: 'buffer', route: 'sustain', title: '库存缓冲', tag: '维持 +1',
      desc: '用现有资源建立一道可消耗的接触缓冲层。',
      requirement: '核子不少于 18，原子不少于 10，连续保持 30 秒',
      effect: '真空水蛭的累计损失上限降低 1',
    },
    {
      id: 'pulse', route: 'advance', title: '脉冲蓄能', tag: '推进 +1',
      desc: '把原子产能和核子库存接入一组短时脉冲电容。',
      requirement: '原子生产单元不少于 3，核子不少于 14，连续保持 30 秒',
      effect: '压倒方案每次脉冲的核子成本从 4 降到 3',
    },
    {
      id: 'sensor', route: 'inquiry', title: '远距标定', tag: '求证 +1',
      desc: '把原子层作为传感器，对视界背面的相位先行采样。',
      requirement: '焦点位于原子层，研究点不少于 12，连续保持 30 秒',
      effect: '预警时间增加 30 秒；观测方案样本预算从 4 降到 3 原子',
    },
  ];

  var ENEMY_METHODS = [
    {
      id: 'overload', route: 'advance', title: '压倒', tag: '推进 +2 · 改写 +1',
      desc: '连续注入 5 次核子脉冲。',
      cost: '总成本 20 核子（每次 4）', duration: '库存足够时可立即完成', loss: '准备和注入期间仍会截取原子',
    },
    {
      id: 'cutoff', route: 'sustain', title: '断供', tag: '维持 +2',
      desc: '保护核子、让焦点离开原子，再开启隔离。',
      cost: '原子生产和合成暂停', duration: '三个条件保持 45 秒', loss: '隔离开启后停止新增截取',
    },
    {
      id: 'observe', route: 'inquiry', title: '观测', tag: '求证 +2 · 维持 +1',
      desc: '把焦点移动到原子层，记录完整截取过程。',
      cost: '允许 4 原子进入样本预算', duration: '按 0.06/s 约需 67 秒', loss: '达到预算后自动隔离',
    },
    {
      id: 'sync', route: 'rewrite', title: '同步', tag: '改写 · 未解锁',
      desc: '让双方流量进入同一相位。',
      cost: '需要跨周目样本', duration: '需要矛盾法则', loss: '当前版本不可执行', disabled: true,
    },
  ];

  var CORE_OPTIONS = [
    {
      id: 'fuel', route: 'advance', title: '压入边界燃料', tag: '推进 +2',
      desc: '获得 24 夸克。文明会把这次接触记录为一次可利用的突破。',
    },
    {
      id: 'return', route: 'sustain', title: '接入循环回流', tag: '维持 +2',
      desc: '获得 8 核子。余像成为资源链中一条有上限的回流。',
    },
    {
      id: 'archive', route: 'inquiry', title: '封存行为样本', tag: '求证 +2',
      desc: '获得 8 研究点。下一次同类敌人会提前显示目标条件。',
    },
  ];

  var COMPLEXITY_OPTIONS = [
    {
      id: 'bloom', route: 'advance', title: '允许谱系竞速', tag: '发展决策 · 推进 +2',
      desc: '让高适应谱系优先占用新产能。生命阶段更快，但低层波动会被文明记作可接受代价。',
    },
    {
      id: 'sanctuary', route: 'sustain', title: '建立多样性保留区', tag: '发展决策 · 维持 +2',
      desc: '为弱势谱系保留物质份额。增长略慢，但文明会继承一份从未跌破保护线的生态记录。',
    },
    {
      id: 'witness', route: 'inquiry', title: '先记录再干预', tag: '发展决策 · 求证 +2',
      desc: '保存环境变化与谱系响应的对应关系。资源收益普通，但文明会获得更完整的因果档案。',
    },
    {
      id: 'braid', route: 'rewrite', title: '编织双侧样本', tag: '发展决策 · 改写 +2',
      desc: '把核心余像的相位加入细胞环境。正反两侧第一次在生命出现前共享同一组演化约束。',
    },
  ];

  var REVERSE_OBJECTS = [
    {
      id: 'lattice', triggerStep: 16, iconTier: 3, symbol: 'RL', pressure: 14,
      title: '反相晶簇', stage: '分子阶段',
      summary: '它只在尚未成立的化学键上结晶，并把一部分合成概率折向反宇宙。',
      question: '你要让已有路线被它看得更清楚，还是用一次转向打乱它的预测？',
      options: [
        { id: 'fracture', route: 'advance', title: '震碎并催化', tag: '推进 · 高产高压', desc: '让碎晶成为分子催化核。分子生产 +25%，原子生产 -10%。', benefit: '分子生产 ×1.25', cost: '原子生产 ×0.90' },
        { id: 'sheath', route: 'sustain', title: '封入惰性晶壳', tag: '维持 · 降低代谢', desc: '让晶簇承担连接界面。分子对原子的持续消耗降低 28%。', benefit: '原子代谢 ×0.72', cost: '不提高分子产出' },
        { id: 'map', route: 'inquiry', title: '绘制缺失键图谱', tag: '求证 · 研究偏置', desc: '把未成立的键当作负空间样本。研究通道 +15%，分子生产 -8%。', benefit: '研究速率 ×1.15', cost: '分子生产 ×0.92' },
        { id: 'fold', route: 'rewrite', title: '保留双侧晶面', tag: '改写 · 双向增益', desc: '让正反晶面同时参与组合。原子与分子生产各 +8%，但更容易被反侧模仿。', benefit: '原子、分子生产 ×1.08', cost: '同路线时压力额外上升' },
      ],
    },
    {
      id: 'choir', triggerStep: 17, iconTier: 4, symbol: 'SC', pressure: 17,
      title: '静默合唱体', stage: '细胞阶段',
      summary: '一群没有声源的薄膜围住细胞边界；每当内部维持稳定，它们就在外侧复制同一节拍。',
      question: '边界应当抵抗外侧，利用外侧，还是先理解为何两边都想成为“内部”？',
      options: [
        { id: 'sever', route: 'advance', title: '切断外侧节拍', tag: '推进 · 快速分化', desc: '用不对称脉冲打散合唱。细胞生产 +28%，分子生产 -14%。', benefit: '细胞生产 ×1.28', cost: '分子生产 ×0.86' },
        { id: 'harbor', route: 'sustain', title: '划出共栖外膜', tag: '维持 · 生态缓冲', desc: '允许一层薄膜留在外侧。细胞对分子的持续消耗降低 30%，细胞生产 -8%。', benefit: '分子代谢 ×0.70', cost: '细胞生产 ×0.92' },
        { id: 'listen', route: 'inquiry', title: '记录无声和声', tag: '求证 · 因果样本', desc: '把每次内外同步写入研究通道。研究 +18%，细胞生产 -10%。', benefit: '研究速率 ×1.18', cost: '细胞生产 ×0.90' },
        { id: 'duet', route: 'rewrite', title: '允许双侧对唱', tag: '改写 · 相位共生', desc: '保留两套不完全一致的边界节拍。分子与细胞生产各 +10%。', benefit: '分子、细胞生产 ×1.10', cost: '同路线时压力额外上升' },
      ],
    },
    {
      id: 'seed', triggerStep: 19, iconTier: 5, symbol: 'MS', pressure: 20,
      title: '镜像胚种', stage: '生命阶段',
      summary: '它没有祖先，却携带一段与你本轮选择高度相似的应激记忆；反宇宙正在尝试提前长出你的答案。',
      question: '你要加速自己的谱系、保护多样性、拆解这段记忆，还是承认两侧可能共享祖先？',
      options: [
        { id: 'awaken', route: 'advance', title: '唤醒竞争谱系', tag: '推进 · 生命加速', desc: '让胚种参与竞争。生命生产 +30%，细胞代谢压力 +22%。', benefit: '生命生产 ×1.30', cost: '细胞代谢 ×1.22' },
        { id: 'cocoon', route: 'sustain', title: '封入多样性茧房', tag: '维持 · 长期保留', desc: '隔离胚种但保存其差异。细胞代谢降低 30%，生命生产 -12%。', benefit: '细胞代谢 ×0.70', cost: '生命生产 ×0.88' },
        { id: 'witness', route: 'inquiry', title: '拆解祖先记忆', tag: '求证 · 高研究', desc: '逐段验证记忆来源。研究 +20%，生命生产 -12%。', benefit: '研究速率 ×1.20', cost: '生命生产 ×0.88' },
        { id: 'twin', route: 'rewrite', title: '承认双侧谱系', tag: '改写 · 共同祖先', desc: '让胚种成为正反两侧共享的谱系节点。细胞与生命生产各 +12%。', benefit: '细胞、生命生产 ×1.12', cost: '同路线时压力额外上升' },
      ],
    },
  ];

  var RESEARCH_DISCOVERIES = [
    {
      id: 'quark-echo', at: 10, code: 'SERENDIPITY / Q-17',
      title: '发现：夸克回声',
      copy: '一组已经消散的夸克响应，在观测核停止采样后仍重复了 0.7 秒。它没有增加库存，却证明“被看见”会在局部留下延迟。',
      note: '无玩法加成 · 作为世界记录写入档案',
    },
    {
      id: 'nucleon-silence', at: 28, code: 'SERENDIPITY / N-04',
      title: '发现：核子静默带',
      copy: '核子轨道上出现一段完全没有噪声的窄区。物质仍能穿过，只有关于它的误差消失了；观测核暂时把这里命名为“静默带”。',
      note: '无玩法加成 · 可能与背面宇宙的早期边界有关',
    },
    {
      id: 'missing-description', at: 48, code: 'SERENDIPITY / Ø-01',
      title: '发现：欠描述区',
      copy: '研究通道短暂返回了一个合法、却无法映射到现有物质层的解。它不像错误，更像一段尚未拥有名字的结构。',
      note: '无玩法加成 · 原子层揭示后可重新解释',
    },
    {
      id: 'balanced-orbit', steps: [4], at: 18, code: 'SERENDIPITY / F-08',
      title: '发现：闭合流线',
      copy: '两条净流量短暂画出同一个闭环：夸克的盈余恰好填补核子留下的缺口。观测核第一次记录到“稳定”也可以是一种形状。',
      note: '无玩法加成 · 双层稳态阶段记录',
    },
    {
      id: 'reserve-shadow', steps: [9], at: 24, code: 'SERENDIPITY / R-12',
      title: '发现：保护线的背影',
      copy: '核子库存接近保护线时，背面噪声也同步停止下降。那一侧似乎无法看见保护规则，却能感到当前宇宙拒绝继续失去。',
      note: '无玩法加成 · 保护行为会被另一侧间接感知',
    },
    {
      id: 'precontact-parallax', steps: [11], at: 14, code: 'SERENDIPITY / P-03',
      title: '发现：接触视差',
      copy: '同一枚原子在两组相位记录中出现了极小的位置差。水蛭尚未附着，但它已经在用另一侧的尺度估量这里。',
      note: '无玩法加成 · 接触准备阶段记录',
    },
    {
      id: 'molecular-rhyme', steps: [16], at: 26, code: 'SERENDIPITY / M-21',
      title: '发现：分子押韵',
      copy: '两组从未接触的原子链选择了相同的折叠次序。它们没有共享物质，只共享了一种更容易成立的句法。',
      note: '无玩法加成 · 分子阶段世界记录',
    },
    {
      id: 'solvent-memory', steps: [16], at: 72, code: 'SERENDIPITY / M-34',
      title: '发现：溶剂记忆',
      copy: '一段已经解散的分子网络让后来的组合更快抵达同一形状。结构消失了，抵达结构的路径却仍留在环境中。',
      note: '无玩法加成 · 复杂结构会把历史留给环境',
    },
    {
      id: 'inside-outside', steps: [17], at: 28, code: 'SERENDIPITY / C-05',
      title: '发现：边界的第一人称',
      copy: '某个细胞结构持续修补同一侧的膜。对观测核而言两侧完全对称；对它而言，其中一侧已经成为“自己”。',
      note: '无玩法加成 · 细胞阶段世界记录',
    },
    {
      id: 'borrowed-metabolism', steps: [17], at: 78, code: 'SERENDIPITY / C-19',
      title: '发现：借来的代谢',
      copy: '一条细胞循环使用了核心余像的相位差，却没有产生截流。曾经属于敌对结构的规律，第一次成为维持内部边界的工具。',
      note: '无玩法加成 · 接触结果开始参与后续演化',
    },
    {
      id: 'lineage-dream', steps: [19], at: 34, code: 'SERENDIPITY / L-02',
      title: '发现：谱系之梦',
      copy: '生命样本在没有环境变化时重复了一次旧的应激模式。它保存的并非事件本身，而是祖先曾经如何准备面对事件。',
      note: '无玩法加成 · 生命阶段世界记录',
    },
    {
      id: 'two-pulse-clock', steps: [20], at: 12, code: 'SERENDIPITY / L-17',
      title: '发现：两只指针的钟',
      copy: '背面信号以两个互不整除的周期重复。单独看都像噪声，叠在一起却不断指向同一个尚未出现的时刻。',
      note: '无玩法加成 · 文明前通信记录',
    },
    {
      id: 'answer-before-question', steps: [21], at: 38, code: 'SERENDIPITY / V-01',
      title: '发现：早于问题的答案',
      copy: '研究通道收到一句结构完整的回应，但当前生命尚未发出对应询问。观测核决定保留语序，不替未来文明猜测内容。',
      note: '无玩法加成 · 文明研究阶段记录',
    },
    {
      id: 'shared-horizon-name', steps: [21], at: 92, code: 'SERENDIPITY / V-09',
      title: '发现：视界的另一个名字',
      copy: '背面信号把视界编码成“被共同遗漏之处”。这不是翻译错误：对方似乎从一开始就不认为边界属于任何一侧。',
      note: '无玩法加成 · 镜像文明的最早语义候选',
    },
    {
      id: 'negative-bond', steps: [16], at: 36, jitter: 42, code: 'PHENOMENON / M-44',
      title: '现象：反写化学键',
      copy: '一条分子键先在背面断裂，正面对应的两枚原子才靠近。观测核无法判断这是预言、诱导，还是两侧共享同一段因果。',
      note: '选择会提供小额资源并写入 1 点路线信号',
      choices: [
        { id: 'accelerate', route: 'advance', title: '沿断裂方向加速组合', desc: '获得 24 原子', rewardTier: 2, reward: 24 },
        { id: 'stabilize', route: 'sustain', title: '保留未断裂的对照组', desc: '获得 4 分子', rewardTier: 3, reward: 4 },
        { id: 'sequence', route: 'inquiry', title: '逐帧测序因果次序', desc: '获得 90 RP', rp: 90 },
      ],
    },
    {
      id: 'garden-without-outside', steps: [16], at: 105, jitter: 55, code: 'TERMINAL FRAGMENT / G-01',
      title: '终局碎片：没有外面的花园',
      copy: '一段未来记录声称，最后的花园没有围墙，因为它已经把所有“外面”改造成循环的一部分。记录没有说明谁被允许留在里面。',
      note: '终局线索 · 无尽花园并不等于静止不变',
    },
    {
      id: 'ownerless-boundary', steps: [17], at: 44, jitter: 48, code: 'PHENOMENON / C-31',
      title: '现象：无主边界',
      copy: '一层细胞膜持续修补自己，却没有任何内部结构使用它。边界似乎先于“居民”决定了什么值得保护。',
      note: '选择会提供小额资源并写入 1 点路线信号',
      choices: [
        { id: 'occupy', route: 'advance', title: '投入高增长谱系占据边界', desc: '获得 3 细胞', rewardTier: 4, reward: 3 },
        { id: 'preserve', route: 'sustain', title: '维持一块无主保留区', desc: '获得 14 分子', rewardTier: 3, reward: 14 },
        { id: 'observe', route: 'inquiry', title: '等待边界自行选择用途', desc: '获得 130 RP', rp: 130 },
      ],
    },
    {
      id: 'last-eye', steps: [17], at: 132, jitter: 58, code: 'TERMINAL FRAGMENT / O-00',
      title: '终局碎片：最后一只眼睛',
      copy: '档案里出现一句无法验证的陈述：“最后的观察者不是幸存者，而是宇宙为自己保留的证人。”它没有解释证人是否可以拒绝。',
      note: '终局线索 · 最后观测者需要承担不可转交的证明',
    },
    {
      id: 'reverse-lineage', steps: [19], at: 52, jitter: 64, code: 'PHENOMENON / L-28',
      title: '现象：逆生谱系',
      copy: '一份生命样本先表现出后代才会拥有的适应，随后才在当前环境中找到原因。谱系的箭头在两侧可能并不朝向同一时间。',
      note: '选择会提供小额资源并写入 1 点路线信号',
      choices: [
        { id: 'breed', route: 'advance', title: '让适应结果反向筛选祖先', desc: '获得 2 生命', rewardTier: 5, reward: 2 },
        { id: 'shelter', route: 'sustain', title: '保护未表现预适应的谱系', desc: '获得 10 细胞', rewardTier: 4, reward: 10 },
        { id: 'archive', route: 'inquiry', title: '封存时间箭头差异', desc: '获得 220 RP', rp: 220 },
      ],
    },
    {
      id: 'traveler-will', steps: [19], at: 168, jitter: 72, code: 'TERMINAL FRAGMENT / H-17',
      title: '终局碎片：越界者的遗书',
      copy: '尚未建造的航行器留下了一份遗书：越过视界不是逃离宇宙，而是放弃让旧宇宙继续替你解释方向。',
      note: '终局线索 · 越过视界要求接受不可回收的远行',
    },
    {
      id: 'double-crunch-sketch', steps: [20], at: 24, jitter: 38, code: 'PHENOMENON / Ω-02',
      title: '现象：双坍缩草图',
      copy: '生命信号拼出两条互相穿过的坍缩曲线。任何一侧单独执行都会失败；两侧同时执行时，失败位置反而成为新的初始条件。',
      note: '选择不会锁定结局，但会改变文明收到的路线信号',
      choices: [
        { id: 'synchronize', route: 'rewrite', title: '保留双侧同步条件', desc: '获得 180 RP', rp: 180 },
        { id: 'verify', route: 'inquiry', title: '先验证其中一条曲线', desc: '获得 160 RP', rp: 160 },
        { id: 'buffer', route: 'sustain', title: '为失败位置保留物质', desc: '获得 8 细胞', rewardTier: 4, reward: 8 },
      ],
    },
    {
      id: 'mutually-exclusive-maps', steps: [21], at: 58, jitter: 55, code: 'TERMINAL FRAGMENT / V-12',
      title: '终局碎片：四份互斥星图',
      copy: '文明研究同时生成四份星图：一份画出门，一份画出花园，一份只保留最后一颗眼睛，第四份则让纸张本身从中间折回。',
      note: '终局线索 · 路线信号决定文明先相信哪一份地图',
    },
  ];

  var ROUND_TWO_COUNTEREXAMPLES = {
    advance: {
      id: 'closure-lattice', title: '闭界格栅', symbol: 'CL',
      premise: '你证明边界能够被穿越。另一侧因此学会在高吞吐出现之前关闭门。',
      behavior: '当原子层获得最高焦点时，格栅预测出口方向；你必须同时保住核子余量，证明远行不是把代价留给未同行者。',
    },
    sustain: {
      id: 'reverse-season', title: '逆季候', symbol: 'RS',
      premise: '你证明对立可以形成循环。另一侧开始询问：谁一直在承担冬天？',
      behavior: '正面的连续盈余会被翻译为背面的短缺季；公开保护线与多层盈余，才能证明循环没有隐藏承担者。',
    },
    inquiry: {
      id: 'blind-spot-witness', title: '盲区证人', symbol: 'BW',
      premise: '你证明观察者可以保留证据。另一侧开始只在没有被聚焦的层级行动。',
      behavior: '把焦点移出原子层，并在盲区仍保留足够样本，证明证据不是靠持续凝视才成立。',
    },
    rewrite: {
      id: 'desync-pendulum', title: '失同步摆', symbol: 'DP',
      premise: '你证明矛盾可以共同运行。另一侧则保留了一个永远慢半拍的节奏。',
      behavior: '在核子与原子间多次迁移焦点，并让两层都保有库存，证明同步允许差异，而不是消除差异。',
    },
    ordinary: {
      id: 'unnamed-noise', title: '未命名噪声', symbol: 'UN',
      premise: '没有定向答案穿过坍缩，只有更快的常数起点。另一侧暂时无法预测你的路线。',
      behavior: '保持核子盈余与原子样本，重新形成一个可被检验的方向。',
    },
  };

  var LOOP_MEMORY_LABELS = {
    'horizon-can-open': '视界可以被再次打开',
    'closed-cycle-can-endure': '闭合循环能够跨越终结',
    'witness-can-outlast-collapse': '证词能够比坍缩活得更久',
    'contradictions-can-cooperate': '矛盾规则能够共同运行',
    'constants-can-be-recovered': '恒定点能够被回收',
    'ember-aperture': '余烬孔径',
    'returning-ring': '回返环',
    'witness-lens': '证人透镜',
    'phase-braid': '相位编带',
    'constant-kernel': '恒定核',
    'carry-a-door-but-name-what-stays': '携带一扇门，也必须说出谁被留在原处',
    'a-garden-must-name-its-winter': '花园必须公开由谁承担冬天',
    'evidence-is-not-its-only-reading': '证据并不拥有唯一解释',
    'shared-endings-require-different-clocks': '共同终结必须允许不同的钟',
    'speed-is-not-yet-a-direction': '更快的起点仍然不是方向',
    'unbuilt-advance-future': '未建成的越界未来',
    'unbuilt-sustain-future': '未建成的花园未来',
    'unbuilt-inquiry-future': '未建成的证人未来',
    'unbuilt-rewrite-future': '未建成的共同坍缩',
    'unresolved-direction': '尚未形成的方向',
  };

  function loopMemoryLabel(id) {
    return LOOP_MEMORY_LABELS[id] || id || '未记录';
  }

  function getLoopMemorySummary() {
    var signature = loopSignature();
    return {
      truth: loopMemoryLabel(signature.truths && signature.truths[0]),
      inheritance: loopMemoryLabel(signature.equippedInheritance),
      witness: loopMemoryLabel(signature.civilizationWitness),
      debt: loopMemoryLabel(signature.abandoned),
      primaryRoute: routeOrFallback(signature.dominantRoute, 'ordinary'),
      secondaryRoute: routeOrFallback(signature.secondaryRoute, 'advance'),
    };
  }

  var ROUND_TWO_DISCOVERIES = [
    {
      id: 'checksum-ghost', steps: [1], at: 8, code: 'INHERITED FRAGMENT / 01',
      title: '碎片：先于物质的校验和',
      copy: '一串来自上轮第一法则的校验位，比第一枚新原子更早通过研究通道。它证明被继承的不是物体，而是抵达物体的偏好。',
      note: '跨轮碎片 · 写入档案，不中断当前稳定计时',
    },
    {
      id: 'unborn-quotation', steps: [2], at: 14, code: 'INHERITED FRAGMENT / 02',
      title: '碎片：尚未出生者的引文',
      copy: '原子谱线短暂排列成一种文明标点。句子来自上一轮证词，末尾却多出一个本轮尚无人能够写下的问号。',
      note: '跨轮碎片 · 上轮证词正在被当前初始条件改写',
    },
    {
      id: 'reverse-rehearsal', steps: [5], at: 11, code: 'REVERSE FRAGMENT / 03',
      title: '碎片：另一侧的预演',
      copy: '反例结构提前模拟了下一次焦点迁移。它猜错了具体层级，却准确猜到你会再次使用同一种解决思路。',
      note: '反侧碎片 · 对方预测的是方法，不是按钮',
    },
    {
      id: 'missing-debt', steps: [8], at: 18, code: 'LINEAGE FRAGMENT / 04',
      title: '碎片：被继承的空位',
      copy: '一份生命谱系稳定保留了一个从未使用的代谢接口。那里没有器官，只有上轮未建成未来留下的形状。',
      note: '谱系碎片 · abandoned 字段第一次成为可见缺口',
    },
  ];

  function slice() {
    return GS.getSlice ? GS.getSlice() : null;
  }

  function isEnabled() {
    var s = slice();
    return !!(s && s.enabled);
  }

  function routeOrFallback(id, fallback) {
    return ROUTES[id] ? id : fallback;
  }

  function getRoundTwoCounterexample() {
    var signature = loopSignature();
    var route = routeOrFallback(signature.dominantRoute, 'ordinary');
    return ROUND_TWO_COUNTEREXAMPLES[route];
  }

  function getRoundTwoDecision() {
    var s = slice();
    if (!s || !isSecondLoop()) return null;
    var signature = loopSignature();
    var primary = routeOrFallback(signature.dominantRoute, 'advance');
    var secondary = routeOrFallback(signature.secondaryRoute, primary === 'advance' ? 'sustain' : 'advance');
    var counterexample = getRoundTwoCounterexample();
    var memory = getLoopMemorySummary();
    if (s.missionStep === 0 && !s.roundTwo.inheritanceMode) {
      return {
        kind: 'inheritance',
        title: '继承物校准',
        context: '上轮真理：' + memory.truth + ' · 继承物：' + memory.inheritance,
        options: [
          { id: 'carry', route: primary, title: '沿用偏差', tag: ROUTES[primary].name + ' · 重复检验', desc: '保留继承物的完整加速，也接受反侧更早识别这条方法。' },
          { id: 'dampen', route: secondary, title: '设置阻尼', tag: ROUTES[secondary].name + ' · 修正检验', desc: '降低主偏差，把一部分初始优势让给上轮备选路线。' },
          { id: 'expose', route: 'inquiry', title: '公开代价', tag: '求证 · 双版本档案', desc: '保留偏差，同时把它限制了哪些未来写入公开校验记录。' },
        ],
      };
    }
    if (s.missionStep === 3 && !s.roundTwo.fragmentChoice) {
      return {
        kind: 'fragment',
        title: '未发生证词',
        context: '上轮文明证词：' + memory.witness,
        options: [
          { id: 'accept', route: primary, title: '作为祖先证词接纳', tag: ROUTES[primary].name + ' · 连续性', desc: '保留原句与修订句，并承认它们来自同一历史谱系。' },
          { id: 'verify', route: 'inquiry', title: '拆开两个版本复核', tag: '求证 · 版本分离', desc: '不先判断哪句更真，把差异作为本轮反例的输入。' },
          { id: 'coexist', route: 'rewrite', title: '允许矛盾版本并存', tag: '改写 · 双重证词', desc: '让后来者同时看到上轮原句和本轮提前出现的修订。' },
        ],
      };
    }
    if (s.missionStep === 4 && !s.roundTwo.counterexample.choice) {
      return {
        kind: 'counterexample',
        title: counterexample.title,
        context: counterexample.premise + ' ' + counterexample.behavior,
        options: [
          { id: 'repeat', route: primary, title: '让旧方法接受正面检验', tag: ROUTES[primary].name + ' · truthRepeated 候选', desc: '不回避针对性反例，用公开条件再次执行上轮方法。' },
          { id: 'revise', route: secondary, title: '用备选路线修正方法', tag: ROUTES[secondary].name + ' · truthRevised 候选', desc: '承认上轮答案存在盲区，用备选提案承担本次测试。' },
          { id: 'reciprocal', route: 'rewrite', title: '建立双侧共同试验', tag: '改写 · 互为对照', desc: '不把另一侧当作障碍，让它也能记录测试何时成立与失效。' },
        ],
      };
    }
    if (s.missionStep === 7 && !s.roundTwo.witnessResponse) {
      return {
        kind: 'witness',
        title: '证词继承权限',
        context: '第一座文明留下方向，第二座文明保留解释权。',
        options: [
          { id: 'accept', route: primary, title: '接受，但公开适用条件', tag: '接受证词', desc: '把上轮证词作为可复查先例，不升级为永恒命令。' },
          { id: 'challenge', route: secondary, title: '正式提出反驳', tag: '反驳证词', desc: '保存祖先原文，同时让后来者的异议拥有同等档案级别。' },
          { id: 'defer', route: 'inquiry', title: '暂缓采用', tag: '搁置证词', desc: '证据不足时不强迫谱系站队，把问题交给下一轮继续验证。' },
        ],
      };
    }
    if (s.missionStep === 10 && !s.roundTwo.truthVerdict) {
      return {
        kind: 'verdict',
        title: '第一条真理的地位',
        context: '反例测试：' + s.roundTwo.counterexample.choice + ' · 文明回应：' + s.roundTwo.witnessResponse,
        options: [
          { id: 'repeat', route: primary, title: '真理得到重复证明', tag: 'truthRepeated = true', desc: '上轮答案在针对性反例下仍成立，但保留本轮公开的适用条件。' },
          { id: 'revise', route: secondary, title: '真理经修正后成立', tag: 'truthRevised = true', desc: '把备选路线与反例结果写入真理定义，不再沿用原始版本。' },
          { id: 'dispute', route: 'inquiry', title: '保留为未决争议', tag: '异议进入第三轮', desc: '不把一次测试包装成结论，让两轮证词同时进入下一次坍缩。' },
        ],
      };
    }
    return null;
  }

  function chooseRoundTwoDecision(kind, id) {
    var s = slice();
    var decision = getRoundTwoDecision();
    if (!s || !decision || decision.kind !== kind) return false;
    var option = decision.options.find(function (item) { return item.id === id; });
    if (!option) return false;
    if (kind === 'inheritance') s.roundTwo.inheritanceMode = id;
    else if (kind === 'fragment') s.roundTwo.fragmentChoice = id;
    else if (kind === 'counterexample') {
      s.roundTwo.counterexample.id = getRoundTwoCounterexample().id;
      s.roundTwo.counterexample.status = 'testing';
      s.roundTwo.counterexample.choice = id;
    } else if (kind === 'witness') s.roundTwo.witnessResponse = id;
    else if (kind === 'verdict') {
      s.roundTwo.truthVerdict = id;
      s.roundTwo.truthRepeated = id === 'repeat';
      s.roundTwo.truthRevised = id === 'revise';
    }
    recordDecision(kind, id, option.route, option.title, kind === 'verdict' ? 2 : 1);
    addLog(kind === 'counterexample' ? 'REVERSE' : 'HISTORY', decision.title + '：' + option.title + '。');
    evaluateMission();
    return true;
  }

  function getReverseObjectDefinition(id) {
    return REVERSE_OBJECTS.find(function (object) { return object.id === id; }) || null;
  }

  function getReverseChoiceDefinition(objectId, choiceId) {
    var object = getReverseObjectDefinition(objectId);
    return object ? object.options.find(function (option) { return option.id === choiceId; }) || null : null;
  }

  function activateReverseObject(id) {
    var s = slice();
    var definition = getReverseObjectDefinition(id);
    var object = s && s.reverse && s.reverse.objects[id];
    if (!s || !definition || !object || object.status !== 'hidden') return false;
    var ranking = getRouteRanking();
    object.status = 'pending';
    object.mirroredRoute = ranking[0] ? ranking[0].id : null;
    s.reverse.pressure = Math.min(100, s.reverse.pressure + definition.pressure);
    addLog('REVERSE', definition.title + '进入' + definition.stage + '。它正在模仿' + (object.mirroredRoute ? ROUTES[object.mirroredRoute].name : '尚未成形') + '路线。');
    return true;
  }

  function getPendingReverseObject() {
    var s = slice();
    if (!s || !s.reverse) return null;
    for (var i = 0; i < REVERSE_OBJECTS.length; i += 1) {
      var definition = REVERSE_OBJECTS[i];
      var object = s.reverse.objects[definition.id];
      if (object && object.status === 'pending') return Object.assign({}, definition, { state: object });
    }
    return null;
  }

  function chooseReverseObject(objectId, choiceId) {
    var s = slice();
    var object = s && s.reverse && s.reverse.objects[objectId];
    var definition = getReverseObjectDefinition(objectId);
    var choice = getReverseChoiceDefinition(objectId, choiceId);
    if (!s || !object || object.status !== 'pending' || !definition || !choice) return false;
    var repeatsMirroredRoute = !!object.mirroredRoute && choice.route === object.mirroredRoute;
    object.status = 'resolved';
    object.choice = choice.id;
    s.reverse.pressure = Math.max(0, Math.min(100, s.reverse.pressure + (repeatsMirroredRoute ? 12 : -5)));
    recordDecision('reverse', objectId + ':' + choiceId, choice.route, definition.title + '：' + choice.title, repeatsMirroredRoute ? 2 : 1);
    addLog('REVERSE', definition.title + '回应已记录：' + choice.title + '。' + (repeatsMirroredRoute ? '反侧准确模仿了主路线，压力上升。' : '路线转向打乱了反侧预测，压力下降。'));
    evaluateMission();
    return true;
  }

  function getReversePressure() {
    var s = slice();
    return s && s.reverse ? s.reverse.pressure : 0;
  }

  function getReversePressureMultiplier(tierId) {
    if (tierId < 2) return 1;
    return 1 - Math.min(0.16, getReversePressure() * 0.0016);
  }

  function getReverseProductionModifier(tierId) {
    var s = slice();
    if (!s || !s.reverse) return 1;
    var mult = 1;
    var lattice = s.reverse.objects.lattice.choice;
    var choir = s.reverse.objects.choir.choice;
    var seed = s.reverse.objects.seed.choice;
    if (lattice === 'fracture' && tierId === 3) mult *= 1.25;
    if (lattice === 'fracture' && tierId === 2) mult *= 0.9;
    if (lattice === 'map' && tierId === 3) mult *= 0.92;
    if (lattice === 'fold' && (tierId === 2 || tierId === 3)) mult *= 1.08;
    if (choir === 'sever' && tierId === 4) mult *= 1.28;
    if (choir === 'sever' && tierId === 3) mult *= 0.86;
    if (choir === 'harbor' && tierId === 4) mult *= 0.92;
    if (choir === 'listen' && tierId === 4) mult *= 0.9;
    if (choir === 'duet' && (tierId === 3 || tierId === 4)) mult *= 1.1;
    if (seed === 'awaken' && tierId === 5) mult *= 1.3;
    if ((seed === 'cocoon' || seed === 'witness') && tierId === 5) mult *= 0.88;
    if (seed === 'twin' && (tierId === 4 || tierId === 5)) mult *= 1.12;
    return mult;
  }

  function getDemandMultiplier(tierId) {
    var s = slice();
    if (!s || !s.reverse) return 1;
    var mult = 1;
    if (s.reverse.objects.lattice.choice === 'sheath' && tierId === 2) mult *= 0.72;
    if (s.reverse.objects.choir.choice === 'harbor' && tierId === 3) mult *= 0.7;
    if (s.reverse.objects.seed.choice === 'cocoon' && tierId === 4) mult *= 0.7;
    if (s.reverse.objects.seed.choice === 'awaken' && tierId === 4) mult *= 1.22;
    return mult;
  }

  function getReverseInfluences(tierId) {
    var s = slice();
    if (!s || !s.reverse || tierId < 2) return [];
    if (isSecondLoop()) {
      var inheritedRoute = routeOrFallback(loopSignature().dominantRoute, 'ordinary');
      var inheritedMult = (GC.SECOND_LOOP.productionByRoute[inheritedRoute] || [])[tierId] || 1;
      var roundTwoItems = [];
      if (Math.abs(inheritedMult - 1) > 0.001) roundTwoItems.push({
        tone: inheritedMult > 1 ? 'gain' : 'cost',
        label: '继承偏差 ×' + inheritedMult.toFixed(2),
      });
      if (s.roundTwo.counterexample.status === 'testing') roundTwoItems.push({
        tone: 'pressure',
        label: getRoundTwoCounterexample().title + '正在检验',
      });
      return roundTwoItems;
    }
    var items = [];
    if (getReversePressure() > 0) items.push({ tone: 'pressure', label: '反侧压力 ×' + getReversePressureMultiplier(tierId).toFixed(2) });
    var lattice = s.reverse.objects.lattice.choice;
    var choir = s.reverse.objects.choir.choice;
    var seed = s.reverse.objects.seed.choice;
    if (lattice === 'fracture' && tierId === 2) items.push({ tone: 'cost', label: '碎晶剪切 ×0.90' });
    if (lattice === 'fracture' && tierId === 3) items.push({ tone: 'gain', label: '碎晶催化 ×1.25' });
    if (lattice === 'sheath' && tierId === 2) items.push({ tone: 'gain', label: '晶壳代谢 ×0.72' });
    if (lattice === 'map' && tierId === 3) items.push({ tone: 'cost', label: '负键采样 ×0.92' });
    if (lattice === 'fold' && (tierId === 2 || tierId === 3)) items.push({ tone: 'gain', label: '双侧晶面 ×1.08' });
    if (choir === 'sever' && tierId === 3) items.push({ tone: 'cost', label: '断拍损耗 ×0.86' });
    if (choir === 'sever' && tierId === 4) items.push({ tone: 'gain', label: '边界分化 ×1.28' });
    if (choir === 'harbor' && tierId === 3) items.push({ tone: 'gain', label: '共栖代谢 ×0.70' });
    if ((choir === 'harbor' || choir === 'listen') && tierId === 4) items.push({ tone: 'cost', label: '外膜占用 ×' + (choir === 'harbor' ? '0.92' : '0.90') });
    if (choir === 'duet' && (tierId === 3 || tierId === 4)) items.push({ tone: 'gain', label: '双侧对唱 ×1.10' });
    if (seed === 'awaken' && tierId === 4) items.push({ tone: 'cost', label: '竞争代谢 ×1.22' });
    if (seed === 'awaken' && tierId === 5) items.push({ tone: 'gain', label: '预适应谱系 ×1.30' });
    if (seed === 'cocoon' && tierId === 4) items.push({ tone: 'gain', label: '茧房代谢 ×0.70' });
    if ((seed === 'cocoon' || seed === 'witness') && tierId === 5) items.push({ tone: 'cost', label: '谱系隔离 ×0.88' });
    if (seed === 'twin' && (tierId === 4 || tierId === 5)) items.push({ tone: 'gain', label: '双侧谱系 ×1.12' });
    return items;
  }

  function getReverseAtlas() {
    var s = slice();
    return REVERSE_OBJECTS.map(function (definition) {
      var object = s && s.reverse ? s.reverse.objects[definition.id] : null;
      return Object.assign({}, definition, {
        state: object,
        selected: object && object.choice ? getReverseChoiceDefinition(definition.id, object.choice) : null,
      });
    });
  }

  function init() {
    var s = slice();
    if (!s || !s.enabled) return;
    var missions = activeMissions();
    if (s.missionStep >= missions.length) s.missionStep = missions.length - 1;
    if (s.missionStartedAt === undefined || s.missionStartedAt > s.elapsedSeconds) s.missionStartedAt = s.elapsedSeconds;
    if (isSecondLoop()) {
      s.roundTwo.counterexample.id = getRoundTwoCounterexample().id;
      evaluateMission();
      return;
    }
    REVERSE_OBJECTS.forEach(function (definition) {
      var object = s.reverse.objects[definition.id];
      if (s.missionStep === definition.triggerStep && object.status === 'hidden') activateReverseObject(definition.id);
      if (s.missionStep > definition.triggerStep && object.status === 'hidden') s.reverse.objects[definition.id] = { status: 'resolved', choice: 'legacy', mirroredRoute: null };
    });
    evaluateMission();
  }

  function addLog(channel, text) {
    var s = slice();
    if (!s) return;
    s.logs.push({ time: s.elapsedSeconds, channel: channel, text: text });
    if (s.logs.length > 36) s.logs.splice(0, s.logs.length - 36);
  }

  function recordDecision(kind, id, route, label, score) {
    var s = slice();
    if (!s) return;
    var signal = score === undefined ? 2 : score;
    s.decisions.push({ time: s.elapsedSeconds, kind: kind, level: DECISION_LEVELS[kind] || '阶段决策', id: id, route: route, label: label, score: signal });
    if (route && s.tendencies[route] !== undefined) s.tendencies[route] += signal;
  }

  function startInterlude(completedStep) {
    var s = slice();
    var missions = activeMissions();
    var mission = missions[completedStep];
    var seconds = mission.restSeconds || 0;
    if (!s || seconds <= 0) return false;
    s.guide.interlude = true;
    s.guide.remaining = seconds;
    s.guide.nextStep = Math.min(completedStep + 1, missions.length - 1);
    s.guide.message = mission.restMessage || '观测核正在整理刚才的变化。';
    addLog('FREE', s.guide.message);
    return true;
  }

  function finishInterlude() {
    var s = slice();
    if (!s || !s.guide.interlude) return;
    var next = s.guide.nextStep;
    s.guide.interlude = false;
    s.guide.remaining = 0;
    s.guide.nextStep = null;
    s.guide.message = '';
    enterMission(next);
  }

  function enterMission(step) {
    var s = slice();
    if (!s || step <= s.missionStep) return;
    var missions = activeMissions();
    s.missionStep = Math.min(step, missions.length - 1);
    s.missionStartedAt = s.elapsedSeconds;
    var mission = missions[s.missionStep];
    addLog('GUIDE', mission.code + ' / ' + mission.title);

    if (isSecondLoop()) {
      if (s.missionStep === 4) {
        s.roundTwo.counterexample.status = 'pending';
        addLog('REVERSE', getRoundTwoCounterexample().title + '已经完成针对性建模。');
      }
      if (s.missionStep === 6 && s.roundTwo.counterexample.status !== 'resolved') {
        s.roundTwo.counterexample.status = 'resolved';
      }
      if (s.missionStep === 8) {
        // The inherited path compresses familiar cell/life setup without making
        // the player rebuild the entire first-loop factory.
        GS.addRP(150);
        GS.addResource(3, 6);
        addLog('INHERIT', '反例结果被转成 6 分子与 150 RP 的谱系桥接样本。');
      }
      if (s.missionStep === 11) {
        s.flags.civilizationComplete = true;
        addLog('CIV', '第二座文明完成真理评议。结论与异议已经同时封存。');
      }
      return;
    }

    if (s.missionStep === 10) {
      s.flags.lawDecisionOpen = true;
      addLog('OBS', '原子使宇宙获得长期结构。未采用的法则开始退向视界背面。');
    }
    if (s.missionStep === 11) s.flags.preparationOpen = true;
    if (s.missionStep === 12 && s.enemy.status === 'hidden') triggerWarning();
    if (s.missionStep === 14) s.flags.coreDecisionOpen = true;
    if (s.missionStep === 15) {
      addLog('SYS', '第一次接触观测窗口完成。路线信号已写入本轮档案。');
    }
    REVERSE_OBJECTS.forEach(function (definition) {
      if (s.missionStep === definition.triggerStep) activateReverseObject(definition.id);
    });
    if (s.missionStep === 18) s.flags.complexityDecisionOpen = true;
    if (s.missionStep === 23) {
      s.flags.civilizationComplete = true;
      addLog('CIV', '第一座文明开始回读观测日志。主提案与备选提案已经形成。');
    }
  }

  function getTierNetRate(tierId) {
    var production = GS.getProducerOutput(tierId) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(tierId) * getProductionMultiplier(tierId);
    var demand = 0;
    if (tierId < GC.TIERS.length - 1) {
      var higher = GS.getTier(tierId + 1);
      if (higher && higher.researched) {
        var demandMultiplier = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
        if (GS.hasMilestone(7)) demandMultiplier *= 0.7;
        demand = higher.count * demandMultiplier * getDemandMultiplier(tierId);
      }
    }
    return production - demand;
  }

  function getStabilityConditionState(step) {
    var s = slice();
    var missionStep = step === undefined ? (s ? s.missionStep : -1) : step;
    if (!s) return [];
    if (isSecondLoop() && missionStep === 1) return [
      { id: 'r2-quark-stock', label: '夸克库存至少 12', met: GS.getTier(0).count >= 12, value: Math.floor(GS.getTier(0).count) + ' / 12', fix: '等待现有生产链恢复，或暂缓继续合成。' },
      { id: 'r2-nucleon-stock', label: '核子库存至少 4', met: GS.getTier(1).count >= 4, value: Math.floor(GS.getTier(1).count) + ' / 4', fix: '把焦点移到核子，或等待继承偏差完成校准。' },
      { id: 'r2-quark-net', label: '夸克流量不为负', met: getTierNetRate(0) >= 0, value: (getTierNetRate(0) >= 0 ? '+' : '') + getTierNetRate(0).toFixed(2) + '/s', fix: '减少低层消耗或增加夸克生产。' },
      { id: 'r2-nucleon-net', label: '核子流量不为负', met: getTierNetRate(1) >= 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '使用焦点或增加核子生产。' },
    ];
    if (isSecondLoop() && missionStep === 5) {
      var route = routeOrFallback(loopSignature().dominantRoute, 'ordinary');
      if (route === 'advance') return [
        { id: 'r2-advance-focus', label: '焦点位于原子层', met: s.focusTier === 2, value: s.focusTier === 2 ? '出口方向公开' : '尚未聚焦原子', fix: '把焦点移动到原子层，让闭界格栅能够预测你。' },
        { id: 'r2-advance-stock', label: '核子库存至少 8', met: GS.getTier(1).count >= 8, value: Math.floor(GS.getTier(1).count) + ' / 8', fix: '补足未同行者仍需依赖的低层库存。' },
        { id: 'r2-advance-net', label: '核子流量不为负', met: getTierNetRate(1) >= 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '增加核子产能，证明远行没有隐藏亏空。' },
      ];
      if (route === 'sustain') return [
        { id: 'r2-sustain-reserve', label: '核子保护线公开', met: s.reserveTier === 1, value: s.reserveTier === 1 ? '承担者已标记' : '未设置', fix: '把保护线放在核子层，公开谁承担缓冲。' },
        { id: 'r2-sustain-quark', label: '夸克流量有盈余', met: getTierNetRate(0) > 0, value: (getTierNetRate(0) >= 0 ? '+' : '') + getTierNetRate(0).toFixed(2) + '/s', fix: '让最底层也保有可见盈余。' },
        { id: 'r2-sustain-nucleon', label: '核子流量有盈余', met: getTierNetRate(1) > 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '调整焦点或产能，使循环不把冬季外包。' },
        { id: 'r2-sustain-atom', label: '原子库存至少 6', met: GS.getTier(2).count >= 6, value: Math.floor(GS.getTier(2).count) + ' / 6', fix: '保持一组高层样本参与循环。' },
      ];
      if (route === 'inquiry') return [
        { id: 'r2-inquiry-blind', label: '焦点离开原子层', met: s.focusTier !== 2, value: s.focusTier === 2 ? '仍在直视样本' : '盲区已开放', fix: '把焦点移到夸克或核子，让证据在未被直视时成立。' },
        { id: 'r2-inquiry-atom', label: '盲区保留 8 原子', met: GS.getTier(2).count >= 8, value: Math.floor(GS.getTier(2).count) + ' / 8', fix: '先积累样本，再把焦点移开。' },
        { id: 'r2-inquiry-rp', label: '研究记录至少 24 RP', met: GS.getRP() >= 24, value: Math.floor(GS.getRP()) + ' / 24', fix: '保留足够研究记录验证盲区行为。' },
      ];
      if (route === 'rewrite') return [
        { id: 'r2-rewrite-focus', label: '本轮焦点迁移至少 3 次', met: s.stats.focusChanges >= 3, value: s.stats.focusChanges + ' / 3', fix: '在核子与原子之间迁移焦点，公开不同拍点。' },
        { id: 'r2-rewrite-nucleon', label: '核子库存至少 6', met: GS.getTier(1).count >= 6, value: Math.floor(GS.getTier(1).count) + ' / 6', fix: '为较慢节拍保留核子。' },
        { id: 'r2-rewrite-atom', label: '原子库存至少 8', met: GS.getTier(2).count >= 8, value: Math.floor(GS.getTier(2).count) + ' / 8', fix: '为较快节拍保留原子。' },
      ];
      return [
        { id: 'r2-ordinary-nucleon', label: '核子流量不为负', met: getTierNetRate(1) >= 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '重新建立一个不亏空的方向。' },
        { id: 'r2-ordinary-atom', label: '原子库存至少 8', met: GS.getTier(2).count >= 8, value: Math.floor(GS.getTier(2).count) + ' / 8', fix: '保留足够原子样本。' },
      ];
    }
    if (isSecondLoop()) return [];
    if (missionStep === 4) return [
      { id: 'focus-nucleon', label: '焦点位于核子层', met: s.focusTier === 1, value: s.focusTier === 1 ? '已聚焦' : '点击核子“聚焦”', fix: '把宇宙焦点移动到核子层。' },
      { id: 'quark-stock', label: '夸克库存至少 12', met: GS.getTier(0).count >= 12, value: Math.floor(GS.getTier(0).count) + ' / 12', fix: '继续点击光核或等待夸克生产。' },
      { id: 'quark-net', label: '夸克每秒有盈余', met: getTierNetRate(0) > 0, value: (getTierNetRate(0) >= 0 ? '+' : '') + getTierNetRate(0).toFixed(2) + '/s', fix: '增加夸克生产单元，或暂缓消耗夸克。' },
      { id: 'nucleon-net', label: '核子每秒有盈余', met: getTierNetRate(1) > 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '保持核子焦点，必要时增加核子生产单元。' },
    ];
    if (missionStep === 9) return [
      { id: 'reserve-nucleon', label: '核子保护已开启', met: s.reserveTier === 1, value: s.reserveTier === 1 ? '底线 ' + getReserveFloor(1) : '未保护', fix: '点击核子卡片中的“保护”。' },
      { id: 'nucleon-stock', label: '核子库存至少 8', met: GS.getTier(1).count >= 8, value: Math.floor(GS.getTier(1).count) + ' / 8', fix: '暂停合成原子，等待核子库存恢复。' },
      { id: 'atom-stock', label: '原子库存至少 12', met: GS.getTier(2).count >= 12, value: Math.floor(GS.getTier(2).count) + ' / 12', fix: '在核子库存允许时继续合成原子。' },
      { id: 'nucleon-net', label: '核子每秒有盈余', met: getTierNetRate(1) > 0, value: (getTierNetRate(1) >= 0 ? '+' : '') + getTierNetRate(1).toFixed(2) + '/s', fix: '聚焦核子或增加核子生产单元。' },
    ];
    if (missionStep === 20) return [
      { id: 'life-stock', label: '生命库存至少 4', met: GS.getTier(5).count >= 4, value: Math.floor(GS.getTier(5).count) + ' / 4', fix: '继续合成生命，并暂缓消耗生命库存。' },
      { id: 'cell-net', label: '细胞流量不为负', met: getTierNetRate(4) >= 0, value: (getTierNetRate(4) >= 0 ? '+' : '') + getTierNetRate(4).toFixed(3) + '/s', fix: '聚焦细胞层、增加细胞生产单元，或暂缓合成生命。' },
    ];
    return [];
  }

  function updateResearchDiscoveries(dt) {
    var s = slice();
    if (!s) return;
    if (!isSecondLoop() && s.missionStep === 6 && !s.flags.atomResearched) s.discoveries.researchWaitSeconds += dt;
    if (s.discoveries.missionStep !== s.missionStep) {
      s.discoveries.missionStep = s.missionStep;
      s.discoveries.missionWaitSeconds = 0;
    }
    s.discoveries.missionWaitSeconds += dt;
    var discoveries = isSecondLoop() ? ROUND_TWO_DISCOVERIES : RESEARCH_DISCOVERIES;
    discoveries.forEach(function (discovery) {
      var steps = discovery.steps || [6];
      var triggerAt = getDiscoveryTriggerAt(discovery, s.discoveries.seed);
      if (steps.indexOf(s.missionStep) === -1 || s.discoveries.missionWaitSeconds < triggerAt || s.discoveries.triggered.indexOf(discovery.id) !== -1) return;
      s.discoveries.triggered.push(discovery.id);
      addLog('DISCOVERY', discovery.title.replace('发现：', '') + '：' + discovery.copy);
    });
  }

  function getDiscoveryTriggerAt(discovery, seed) {
    if (!discovery.jitter) return discovery.at;
    var hash = seed || 1;
    for (var i = 0; i < discovery.id.length; i += 1) hash = (hash * 33 + discovery.id.charCodeAt(i)) % 2147483647;
    return discovery.at + hash % (discovery.jitter + 1);
  }

  function getActiveDiscovery() {
    var s = slice();
    if (!s) return null;
    var discoveries = isSecondLoop() ? ROUND_TWO_DISCOVERIES : RESEARCH_DISCOVERIES;
    for (var i = 0; i < s.discoveries.triggered.length; i += 1) {
      var id = s.discoveries.triggered[i];
      if (s.discoveries.acknowledged.indexOf(id) !== -1) continue;
      return discoveries.find(function (item) { return item.id === id; }) || null;
    }
    return null;
  }

  function acknowledgeDiscovery(id) {
    var s = slice();
    if (!s || s.discoveries.triggered.indexOf(id) === -1) return false;
    if (s.discoveries.acknowledged.indexOf(id) === -1) s.discoveries.acknowledged.push(id);
    return true;
  }

  function resolveDiscoveryChoice(discoveryId, choiceId) {
    var s = slice();
    var discoveries = isSecondLoop() ? ROUND_TWO_DISCOVERIES : RESEARCH_DISCOVERIES;
    var discovery = discoveries.find(function (item) { return item.id === discoveryId; });
    var choice = discovery && discovery.choices ? discovery.choices.find(function (item) { return item.id === choiceId; }) : null;
    if (!s || !discovery || !choice || s.discoveries.triggered.indexOf(discoveryId) === -1 || s.discoveries.resolved[discoveryId]) return false;
    if (choice.rewardTier !== undefined && choice.reward) GS.addResource(choice.rewardTier, choice.reward);
    if (choice.rp) GS.addRP(choice.rp);
    s.discoveries.resolved[discoveryId] = choiceId;
    recordDecision('phenomenon', discoveryId + ':' + choiceId, choice.route, discovery.title.replace('现象：', '') + '：' + choice.title, 1);
    acknowledgeDiscovery(discoveryId);
    addLog('PHENOM', discovery.title.replace('现象：', '') + '回应：' + choice.title + '。路线信号 +' + ROUTES[choice.route].name + '。');
    return true;
  }

  function updateStability(dt) {
    var s = slice();
    if (s.missionStep === 4) {
      var earlyOk = getStabilityConditionState(4).every(function (condition) { return condition.met; });
      s.stability.early = Math.max(0, Math.min(GC.FIRST_CONTACT.earlyStabilitySeconds, s.stability.early + (earlyOk ? dt : -dt * 0.5)));
    }
    if (s.missionStep === 9) {
      var matterOk = getStabilityConditionState(9).every(function (condition) { return condition.met; });
      s.stability.matter = Math.max(0, Math.min(GC.FIRST_CONTACT.matterStabilitySeconds, s.stability.matter + (matterOk ? dt : -dt * 0.5)));
    }
  }

  function getPreparationOption(id) {
    return PREPARATION_OPTIONS.find(function (item) { return item.id === id; }) || null;
  }

  function preparationConditionsMet(id) {
    var s = slice();
    if (id === 'buffer') return GS.getTier(1).count >= 18 && GS.getTier(2).count >= 10;
    if (id === 'pulse') return GS.getTier(2).producers >= 3 && GS.getTier(1).count >= 14;
    if (id === 'sensor') return s.focusTier === 2 && GS.getRP() >= 12;
    return false;
  }

  function getPreparationConditionState() {
    var s = slice();
    if (!s || !s.preparation.id) return [];
    if (s.preparation.id === 'buffer') return [
      { label: '核子库存 18', met: GS.getTier(1).count >= 18, value: Math.floor(GS.getTier(1).count) + ' / 18' },
      { label: '原子库存 10', met: GS.getTier(2).count >= 10, value: Math.floor(GS.getTier(2).count) + ' / 10' },
    ];
    if (s.preparation.id === 'pulse') return [
      { label: '原子生产单元 3', met: GS.getTier(2).producers >= 3, value: GS.getTier(2).producers + ' / 3' },
      { label: '核子库存 14', met: GS.getTier(1).count >= 14, value: Math.floor(GS.getTier(1).count) + ' / 14' },
    ];
    return [
      { label: '焦点位于原子层', met: s.focusTier === 2, value: s.focusTier === 2 ? '已完成' : '未完成' },
      { label: '研究点 12', met: GS.getRP() >= 12, value: Math.floor(GS.getRP()) + ' / 12' },
    ];
  }

  function completePreparation() {
    var s = slice();
    if (!s || s.preparation.completed) return;
    var option = getPreparationOption(s.preparation.id);
    s.preparation.completed = true;
    s.preparation.progress = GC.FIRST_CONTACT.preparationSeconds;
    s.flags.preparationOpen = false;
    recordDecision('preparation', option.id, option.route, option.title, 1);
    addLog('PREP', option.title + '已经完成：' + option.effect + '。');
    evaluateMission();
  }

  function updatePreparation(dt) {
    var s = slice();
    if (!s || s.missionStep !== 11 || !s.preparation.id || s.preparation.completed) return;
    var met = preparationConditionsMet(s.preparation.id);
    s.preparation.progress = Math.max(0, Math.min(GC.FIRST_CONTACT.preparationSeconds, s.preparation.progress + (met ? dt : -dt * 0.5)));
    if (s.preparation.progress >= GC.FIRST_CONTACT.preparationSeconds) completePreparation();
  }

  function updateLifeSignal(dt) {
    var s = slice();
    if (!s || s.missionStep !== 20) return;
    var conditionsMet = GS.getTier(5).count >= 4 && getTierNetRate(4) >= 0;
    s.civilization.lifeSignalProgress = Math.max(0, Math.min(
      GC.FIRST_CONTACT.lifeSignalSeconds,
      s.civilization.lifeSignalProgress + (conditionsMet ? dt : -dt * 0.5)
    ));
  }

  function updateRoundTwoProgress(dt) {
    var s = slice();
    if (!s || !isSecondLoop()) return;
    if (s.missionStep === 1) {
      var biasReady = getStabilityConditionState(1).every(function (condition) { return condition.met; });
      s.roundTwo.biasProgress = Math.max(0, Math.min(
        GC.SECOND_LOOP.biasSeconds,
        s.roundTwo.biasProgress + (biasReady ? dt : -dt * 0.35)
      ));
    }
    if (s.missionStep === 5) {
      var proofReady = getStabilityConditionState(5).every(function (condition) { return condition.met; });
      s.roundTwo.proofProgress = Math.max(0, Math.min(
        GC.SECOND_LOOP.proofSeconds,
        s.roundTwo.proofProgress + (proofReady ? dt : -dt * 0.35)
      ));
    }
  }

  function evaluateSecondLoopMission() {
    var s = slice();
    if (!s || !isSecondLoop() || (s.guide && s.guide.interlude)) return;
    var guard = 0;
    while (guard < SECOND_LOOP_MISSIONS.length) {
      guard += 1;
      var step = s.missionStep;
      var complete = false;
      if (step === 0) complete = !!s.roundTwo.inheritanceMode;
      else if (step === 1) complete = s.roundTwo.biasProgress >= GC.SECOND_LOOP.biasSeconds;
      else if (step === 2) complete = GS.getTier(2).researched && GS.getTier(2).totalEver >= 10 && GS.getTier(2).producers >= 1;
      else if (step === 3) complete = !!s.roundTwo.fragmentChoice;
      else if (step === 4) complete = !!s.roundTwo.counterexample.choice;
      else if (step === 5) complete = s.roundTwo.proofProgress >= GC.SECOND_LOOP.proofSeconds;
      else if (step === 6) complete = GS.getTier(3).researched && GS.getTier(3).totalEver >= 8 && GS.getTier(3).producers >= 1;
      else if (step === 7) complete = !!s.roundTwo.witnessResponse;
      else if (step === 8) complete = GS.getTier(4).researched && GS.getTier(5).researched && GS.getTier(5).totalEver >= 3;
      else if (step === 9) complete = GS.getTier(6).researched && GS.getTier(6).count >= 1;
      else if (step === 10) complete = !!s.roundTwo.truthVerdict;
      if (!complete || step >= SECOND_LOOP_MISSIONS.length - 1) break;
      if (startInterlude(step)) break;
      enterMission(step + 1);
    }
  }

  function evaluateMission() {
    var s = slice();
    if (!s || !s.enabled) return;
    if (isSecondLoop()) {
      evaluateSecondLoopMission();
      return;
    }
    if (s.guide && s.guide.interlude) return;
    var guard = 0;
    while (guard < MISSIONS.length) {
      guard += 1;
      var step = s.missionStep;
      var complete = false;
      if (step === 0) complete = s.stats.canvasClicks >= 5;
      else if (step === 1) complete = s.stats.boughtQuarkProducer;
      else if (step === 2) complete = s.stats.nucleonSyntheses >= 5;
      else if (step === 3) complete = GS.getTier(1).producers >= 1 && s.stats.focusChanges > 0 && s.focusTier === 1;
      else if (step === 4) complete = s.stability.early >= GC.FIRST_CONTACT.earlyStabilitySeconds;
      else if (step === 5) complete = s.flags.researchExplained;
      else if (step === 6) complete = s.flags.atomResearched;
      else if (step === 7) complete = GS.getTier(2).totalEver >= 18 && GS.getTier(2).producers >= 2;
      else if (step === 8) complete = s.reserveTier === 1;
      else if (step === 9) complete = s.stability.matter >= GC.FIRST_CONTACT.matterStabilitySeconds;
      else if (step === 10) complete = !!s.law;
      else if (step === 11) complete = s.preparation.completed;
      else if (step === 12) complete = s.enemy.status === 'active';
      else if (step === 13) complete = s.enemy.status === 'resolved';
      else if (step === 14) complete = s.flags.demoComplete;
      else if (step === 15) complete = s.flags.reportAcknowledged || s.elapsedSeconds - s.missionStartedAt >= 8;
      else if (step === 16) complete = s.reverse.objects.lattice.status === 'resolved' && GS.getTier(3).researched && GS.getTier(3).totalEver >= 12 && GS.getTier(3).producers >= 1;
      else if (step === 17) complete = s.reverse.objects.choir.status === 'resolved' && GS.getTier(4).researched && GS.getTier(4).totalEver >= 10 && GS.getTier(4).producers >= 2;
      else if (step === 18) complete = !!s.complexity;
      else if (step === 19) complete = s.reverse.objects.seed.status === 'resolved' && GS.getTier(5).researched && GS.getTier(5).totalEver >= 6 && GS.getTier(5).producers >= 2;
      else if (step === 20) complete = s.civilization.lifeSignalProgress >= GC.FIRST_CONTACT.lifeSignalSeconds;
      else if (step === 21) complete = GS.getTier(6).researched;
      else if (step === 22) complete = GS.getTier(6).count >= 1;
      if (!complete || step >= MISSIONS.length - 1) break;
      if (startInterlude(step)) break;
      enterMission(step + 1);
    }
  }

  function tick(dt) {
    var s = slice();
    if (!s || !s.enabled) return;
    s.elapsedSeconds += dt;

    if (s.guide && s.guide.interlude) {
      s.guide.remaining = Math.max(0, s.guide.remaining - dt);
      if (s.guide.remaining <= 0) finishInterlude();
    }

    updateResearchDiscoveries(dt);

    if (!s.guide.interlude) {
      if (isSecondLoop()) updateRoundTwoProgress(dt);
      else {
        updateStability(dt);
        updatePreparation(dt);
        updateLifeSignal(dt);
      }
    }

    if (!isSecondLoop() && s.enemy.status === 'warning') {
      s.enemy.warningRemaining = Math.max(0, s.enemy.warningRemaining - dt);
      if (s.enemy.warningRemaining <= 0) beginContact();
    }

    if (!isSecondLoop() && s.enemy.status === 'active') {
      updateEnemyDrain(dt);
      updateEnemyMethod(dt);
    }

    evaluateMission();
  }

  function getProductionMultiplier(tierId) {
    var s = slice();
    if (!s || !s.enabled) return 1;
    if (isSecondLoop()) {
      var signature = loopSignature();
      var route = routeOrFallback(signature.dominantRoute, 'ordinary');
      var routeMultipliers = GC.SECOND_LOOP.productionByRoute[route] || GC.SECOND_LOOP.productionByRoute.ordinary;
      var inherited = routeMultipliers[tierId] || 1;
      if (s.roundTwo.inheritanceMode === 'dampen') inherited = 1 + (inherited - 1) * 0.5;
      var secondMult = s.focusTier === tierId ? GC.FIRST_CONTACT.focusMultiplier : 1;
      secondMult *= inherited;
      if (s.roundTwo.inheritanceMode === 'carry' && tierId === 2) secondMult *= 1.05;
      if (s.roundTwo.counterexample.choice === 'revise' && tierId === 3) secondMult *= 1.12;
      if (s.roundTwo.counterexample.choice === 'reciprocal' && (tierId === 3 || tierId === 4)) secondMult *= 1.08;
      return secondMult;
    }
    if (s.enemy.status === 'active' && s.enemy.method === 'cutoff' && s.enemy.isolationActive && tierId === 2) return 0;

    var mult = s.focusTier === tierId ? GC.FIRST_CONTACT.focusMultiplier : 1;
    if (s.law === 'expansion' && s.focusTier === tierId) mult += GC.FIRST_CONTACT.focusLawBonus;
    if (s.law === 'conservation' && s.reserveTier === tierId) mult *= 1.2;
    if (s.flags.demoComplete) mult *= GC.FIRST_CONTACT.evolutionProductionMultiplier[tierId] || 1;
    mult *= getReversePressureMultiplier(tierId);
    mult *= getReverseProductionModifier(tierId);
    return mult;
  }

  function getResearchMultiplier() {
    var s = slice();
    if (!s || !s.enabled) return 1;
    if (isSecondLoop()) {
      var route = routeOrFallback(loopSignature().dominantRoute, 'ordinary');
      var secondMult = GC.SECOND_LOOP.researchByRoute[route] || 1;
      if (s.roundTwo.inheritanceMode === 'expose') secondMult *= 1.12;
      if (s.roundTwo.fragmentChoice === 'verify') secondMult *= 1.08;
      return secondMult;
    }
    var mult = s.law === 'observer' ? 1.25 : 1;
    if (s.flags.demoComplete) mult *= GC.FIRST_CONTACT.evolutionResearchMultiplier;
    if (s.reverse.objects.lattice.choice === 'map') mult *= 1.15;
    if (s.reverse.objects.choir.choice === 'listen') mult *= 1.18;
    if (s.reverse.objects.seed.choice === 'witness') mult *= 1.2;
    return mult;
  }

  function getReserveFloor(tierId) {
    var s = slice();
    if (!s || !s.enabled || s.reserveTier !== tierId) return 0;
    return GC.FIRST_CONTACT.reserveFloors[tierId] || 0;
  }

  function canSynthesize(tierId) {
    var s = slice();
    if (!s || !s.enabled) return true;
    if (isSecondLoop()) {
      var secondGates = [0, 0, 2, 6, 8, 8, 9];
      return s.missionStep >= secondGates[tierId];
    }
    if (tierId === 1 && s.missionStep < 2) return false;
    if (tierId === 2 && s.missionStep < 7) return false;
    var synthesisGates = [0, 2, 7, 16, 17, 19, 22];
    if (s.missionStep < synthesisGates[tierId]) return false;
    if (tierId === 2 && s.enemy.method === 'cutoff' && s.enemy.isolationActive) return false;
    return true;
  }

  function canBuyProducer(tierId) {
    var s = slice();
    if (!s || !s.enabled) return true;
    if (isSecondLoop()) {
      var secondGates = [0, 0, 2, 6, 8, 8, 99];
      return s.missionStep >= secondGates[tierId];
    }
    if (tierId === 0) return s.missionStep >= 1;
    if (tierId === 1) return s.missionStep >= 3;
    if (tierId === 2) return s.missionStep >= 7;
    if (tierId === 3) return s.missionStep >= 16;
    if (tierId === 4) return s.missionStep >= 17;
    if (tierId === 5) return s.missionStep >= 19;
    return false;
  }

  function explainResearch() {
    var s = slice();
    if (!s || !s.enabled || (!isSecondLoop() && s.missionStep < 5)) return false;
    if (!s.flags.researchExplained) {
      s.flags.researchExplained = true;
      addLog('LAB', '研究构成已展开：资源数量通过平方根换算为研究贡献。');
      evaluateMission();
    }
    return true;
  }

  function acknowledgeGuideGoal(kind) {
    var s = slice();
    if (!s || !s.enabled) return false;
    if (kind === 'research') s.guide.researchGoalAcknowledged = true;
    else if (kind === 'stability') s.guide.stabilityGoalAcknowledged = true;
    else return false;
    return true;
  }

  function markArchiveRead(id) {
    var s = slice();
    if (!s || !id) return false;
    if (s.archive.read.indexOf(id) === -1) s.archive.read.push(id);
    return true;
  }

  function onCanvasClick() {
    var s = slice();
    if (!s || !s.enabled) return;
    s.stats.canvasClicks += 1;
    if (s.stats.canvasClicks === 1) addLog('OBS', '观测记录 001：噪声对注视作出了回应。');
    evaluateMission();
  }

  function onAction(type, data) {
    var s = slice();
    if (!s || !s.enabled) return;
    if (type === 'buyProducer' && data.tierId === 0) {
      s.stats.boughtQuarkProducer = true;
      addLog('OBS', '观测记录 003：重复开始脱离意志。');
    }
    if (type === 'synthesize' && data.tierId === 1) s.stats.nucleonSyntheses += 1;
    if (type === 'synthesize' && data.tierId === 2) s.stats.atomSyntheses += 1;
    if (type === 'research' && data.tierId === 2) {
      s.flags.atomResearched = true;
      addLog('MAT', '原子层已揭示。结构可以被长期描述。');
    }
    if (type === 'research' && data.tierId === 3) addLog('MAT', '分子层已揭示。连接次序开始参与资源历史。');
    if (type === 'research' && data.tierId === 4) addLog('LIFE', '细胞层已揭示。资源链出现了会主动维护的“内部”。');
    if (type === 'research' && data.tierId === 5) addLog('LIFE', '生命层已揭示。环境压力与选择开始跨代保留。');
    if (type === 'research' && data.tierId === 6) addLog('CIV', '文明层已译出。路线信号成为可公开辩论的工程提案。');
    evaluateMission();
  }

  function setFocus(tierId) {
    var s = slice();
    if (!s || !s.enabled || (!isSecondLoop() && s.missionStep < 3)) return false;
    if (!GS.getTier(tierId).researched || s.focusTier === tierId) return false;
    s.focusTier = tierId;
    s.stats.focusChanges += 1;
    addLog('CTRL', '宇宙焦点已转向' + GC.TIERS[tierId].nameZh + '层。');
    evaluateMission();
    return true;
  }

  function setReserve(tierId) {
    var s = slice();
    if (!s || !s.enabled || (!isSecondLoop() && s.missionStep < 8)) return false;
    if (!GS.getTier(tierId).researched) return false;
    s.reserveTier = s.reserveTier === tierId ? null : tierId;
    s.flags.reserveConfigured = s.reserveTier !== null;
    addLog('CTRL', s.reserveTier === null ? '保护线已撤销。' : GC.TIERS[tierId].nameZh + '层保护线已建立。');
    evaluateMission();
    return true;
  }

  function chooseLaw(id) {
    var s = slice();
    if (!s || !s.flags.lawDecisionOpen || s.law) return false;
    var option = LAW_OPTIONS.find(function (item) { return item.id === id; });
    if (!option) return false;
    s.law = id;
    s.flags.lawDecisionOpen = false;
    recordDecision('law', id, option.route, option.title);
    addLog('LAW', '第一法则确定：' + option.title + '。');
    evaluateMission();
    return true;
  }

  function choosePreparation(id) {
    var s = slice();
    if (!s || !s.flags.preparationOpen || s.preparation.id || s.preparation.completed) return false;
    var option = getPreparationOption(id);
    if (!option) return false;
    s.preparation.id = id;
    s.preparation.progress = 0;
    addLog('PREP', '接触准备已选定：' + option.title + '。条件满足后需要连续保持 ' + GC.FIRST_CONTACT.preparationSeconds + ' 秒。');
    return true;
  }

  function triggerWarning() {
    var s = slice();
    if (!s || s.enemy.status !== 'hidden') return;
    s.enemy.status = 'warning';
    s.enemy.warningRemaining = getWarningDuration();
    addLog('WARN', '原子新增产出出现第二组影子。真空水蛭正在形成附着。');
  }

  function getWarningDuration() {
    var s = slice();
    var duration = GC.FIRST_CONTACT.warningSeconds;
    if (s && s.preparation.id === 'sensor' && s.preparation.completed) duration += 30;
    if (s && s.law === 'expansion') duration -= 8;
    return duration;
  }

  function beginContact() {
    var s = slice();
    if (!s || (s.enemy.status !== 'warning' && s.enemy.status !== 'hidden')) return false;
    s.enemy.status = 'active';
    s.enemy.warningRemaining = 0;
    addLog('CONTACT', '真空水蛭附着原子层。累计截取达到上限后会停止增长。');
    evaluateMission();
    return true;
  }

  function chooseEnemyMethod(id) {
    var s = slice();
    if (!s || s.enemy.status !== 'active' || s.enemy.method) return false;
    var method = ENEMY_METHODS.find(function (item) { return item.id === id; });
    if (!method || method.disabled) return false;
    s.enemy.method = id;
    s.enemy.progress = 0;
    s.enemy.methodStartSiphoned = s.enemy.siphoned;
    s.enemy.observeLossLimit = id === 'observe'
      ? Math.max(getBaseEnemyLossCap(), s.enemy.siphoned + getObserveGoal())
      : null;
    addLog('TACTIC', '接触方案锁定：' + method.title + '。');
    if (id === 'observe' && s.enemy.observeLossLimit > getBaseEnemyLossCap()) {
      addLog('TACTIC', '受控观测预算已授权：累计损失上限临时调整为 ' + s.enemy.observeLossLimit.toFixed(2) + ' 原子。');
    }
    return true;
  }

  function getBaseEnemyLossCap() {
    var s = slice();
    var cap = GC.FIRST_CONTACT.enemyLossCap;
    if (s && s.law === 'conservation') cap = 4.5;
    if (s && s.preparation.id === 'buffer' && s.preparation.completed) cap -= 1;
    return cap;
  }

  function getEnemyLossCap() {
    var s = slice();
    var cap = getBaseEnemyLossCap();
    if (s && s.enemy && s.enemy.method === 'observe' && s.enemy.observeLossLimit !== null) {
      cap = Math.max(cap, s.enemy.observeLossLimit);
    }
    return cap;
  }

  function getOverloadCost() {
    var s = slice();
    return s && s.preparation.id === 'pulse' && s.preparation.completed ? 3 : GC.FIRST_CONTACT.overloadCost;
  }

  function getObserveGoal() {
    var s = slice();
    return s && s.preparation.id === 'sensor' && s.preparation.completed ? 3 : GC.FIRST_CONTACT.observeGoal;
  }

  function getEnemyMethods() {
    var overloadCost = getOverloadCost();
    var observeGoal = getObserveGoal();
    return ENEMY_METHODS.map(function (method) {
      var copy = Object.assign({}, method);
      if (copy.id === 'overload') copy.cost = '总成本 ' + (overloadCost * GC.FIRST_CONTACT.overloadPulses) + ' 核子（每次 ' + overloadCost + '）';
      if (copy.id === 'observe') {
        copy.cost = '允许 ' + observeGoal + ' 原子进入样本预算';
        copy.duration = '按 ' + GC.FIRST_CONTACT.enemyDrainPerSecond.toFixed(2) + '/s 约需 ' + Math.ceil(observeGoal / GC.FIRST_CONTACT.enemyDrainPerSecond) + ' 秒';
        copy.loss = '选择后公开扩展受控损失上限；样本完成即自动隔离';
      }
      return copy;
    });
  }

  function updateEnemyDrain(dt) {
    var s = slice();
    var enemy = s.enemy;
    if (enemy.method === 'cutoff' && enemy.isolationActive) return;
    var cap = getEnemyLossCap();
    if (enemy.siphoned >= cap) return;
    var atom = GS.getTier(2);
    var floor = getReserveFloor(2);
    var available = Math.max(0, atom.count - floor);
    if (available <= 0) return;
    var actual = Math.min(available, GC.FIRST_CONTACT.enemyDrainPerSecond * dt, cap - enemy.siphoned);
    atom.count -= actual;
    enemy.siphoned += actual;
  }

  function updateEnemyMethod(dt) {
    var s = slice();
    var enemy = s.enemy;
    if (enemy.method === 'cutoff') {
      if (enemy.isolationActive && s.reserveTier === 1 && s.focusTier !== 2) {
        enemy.progress = Math.min(100, enemy.progress + dt / GC.FIRST_CONTACT.cutoffSeconds * 100);
      }
    } else if (enemy.method === 'observe') {
      if (s.focusTier === 2) {
        var observed = enemy.siphoned - (enemy.methodStartSiphoned || 0);
        enemy.progress = Math.min(100, observed / getObserveGoal() * 100);
      }
    }
    if (enemy.progress >= 100) resolveEnemy(enemy.method);
  }

  function pulseOverload() {
    var s = slice();
    if (!s || s.enemy.status !== 'active' || s.enemy.method !== 'overload') return false;
    var pulseCost = getOverloadCost();
    if (!GS.spendResource(1, pulseCost)) return false;
    s.enemy.overloadPulses += 1;
    s.enemy.progress = Math.min(100, s.enemy.overloadPulses / GC.FIRST_CONTACT.overloadPulses * 100);
    addLog('TACTIC', '过载脉冲 ' + s.enemy.overloadPulses + '/' + GC.FIRST_CONTACT.overloadPulses + ' 已注入。');
    if (s.enemy.progress >= 100) resolveEnemy('overload');
    return true;
  }

  function toggleIsolation() {
    var s = slice();
    if (!s || s.enemy.status !== 'active' || s.enemy.method !== 'cutoff') return false;
    s.enemy.isolationActive = !s.enemy.isolationActive;
    addLog('TACTIC', s.enemy.isolationActive ? '原子供给隔离已开启。' : '原子供给隔离已解除。');
    return true;
  }

  function resolveEnemy(methodId) {
    var s = slice();
    if (!s || s.enemy.status !== 'active') return;
    var method = ENEMY_METHODS.find(function (item) { return item.id === methodId; });
    s.enemy.status = 'resolved';
    s.enemy.progress = 100;
    s.enemy.isolationActive = false;
    s.enemy.resolution = methodId;
    recordDecision('enemy', methodId, method.route, method.title);
    if (methodId === 'overload') s.tendencies.rewrite += 1;
    if (methodId === 'observe') s.tendencies.sustain += 1;
    addLog('CONTACT', '真空水蛭已退去。被截资源在视界边缘留下稳定余像。');
    evaluateMission();
  }

  function chooseCoreDisposition(id) {
    var s = slice();
    if (!s || !s.flags.coreDecisionOpen || s.flags.demoComplete) return false;
    var option = CORE_OPTIONS.find(function (item) { return item.id === id; });
    if (!option) return false;
    recordDecision('core', id, option.route, option.title);
    if (id === 'fuel') GS.addResource(0, 24);
    if (id === 'return') GS.addResource(1, 8);
    if (id === 'archive') GS.addRP(8);
    s.flags.coreDecisionOpen = false;
    s.flags.demoComplete = true;
    s.reverse.pressure = Math.max(10, s.reverse.pressure);
    addLog('ARCHIVE', '核心处置：' + option.title + '。本轮路线信号已更新。');
    evaluateMission();
    return true;
  }

  function continueEvolution() {
    var s = slice();
    if (!s || s.missionStep !== 15 || !s.flags.demoComplete) return false;
    s.flags.reportAcknowledged = true;
    addLog('GUIDE', '接触报告保留在决策履历中。观测窗口继续向复杂物质扩展。');
    evaluateMission();
    return true;
  }

  function chooseComplexity(id) {
    var s = slice();
    if (!s || !s.flags.complexityDecisionOpen || s.complexity) return false;
    var option = COMPLEXITY_OPTIONS.find(function (item) { return item.id === id; });
    if (!option) return false;
    s.complexity = id;
    s.flags.complexityDecisionOpen = false;
    recordDecision('complexity', id, option.route, option.title);
    addLog('LIFE', '复杂性伦理确定：' + option.title + '。这条记录将由未来文明重新解释。');
    evaluateMission();
    return true;
  }

  function getRouteRanking() {
    var s = slice();
    if (!s) return [];
    return Object.keys(ROUTES).map(function (id, index) {
      return { id: id, score: s.tendencies[id] || 0, order: index, meta: ROUTES[id] };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    });
  }

  function getCivilizationProposals() {
    var ranking = getRouteRanking();
    return ranking.slice(0, 2).map(function (route, index) {
      return {
        role: index === 0 ? '主提案' : '备选提案',
        route: route.id,
        title: route.meta.ending,
        score: route.score,
        goal: route.meta.goal,
        question: route.meta.question,
        reason: slice().decisions.filter(function (decision) { return decision.route === route.id; }).map(function (decision) { return decision.label; }),
      };
    });
  }

  function getMission() {
    var s = slice();
    var missions = activeMissions();
    return s ? missions[Math.min(s.missionStep, missions.length - 1)] : missions[0];
  }

  function getRoundTwoMissionProgress(s) {
    var step = s.missionStep;
    var value = 0;
    var max = 1;
    var label = '';
    if (step === 0) {
      value = s.roundTwo.inheritanceMode ? 1 : 0;
      label = value ? '继承物校准已写入' : '等待选择继承物校准';
    } else if (step === 1) {
      max = GC.SECOND_LOOP.biasSeconds;
      value = s.roundTwo.biasProgress;
      label = '初始偏差 ' + Math.floor(value) + ' / ' + max + ' 秒';
    } else if (step === 2) {
      if (!GS.getTier(2).researched) {
        max = GS.getResearchCost(2);
        value = Math.min(max, GS.getRP());
        label = '原子研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        var atoms = Math.min(10, GS.getTier(2).totalEver);
        var atomProducer = Math.min(1, GS.getTier(2).producers);
        max = 20;
        value = atoms + atomProducer * 10;
        label = '累计原子 ' + Math.floor(atoms) + ' / 10 · 生产单元 ' + atomProducer + ' / 1';
      }
    } else if (step === 3) {
      value = s.roundTwo.fragmentChoice ? 1 : 0;
      label = value ? '证词碎片已归档' : '等待处理证词碎片';
    } else if (step === 4) {
      value = s.roundTwo.counterexample.choice ? 1 : 0;
      label = value ? '反例回应框架已确定' : '等待回应' + getRoundTwoCounterexample().title;
    } else if (step === 5) {
      max = GC.SECOND_LOOP.proofSeconds;
      value = s.roundTwo.proofProgress;
      label = getRoundTwoCounterexample().title + '检验 ' + Math.floor(value) + ' / ' + max + ' 秒';
    } else if (step === 6) {
      if (!GS.getTier(3).researched) {
        max = GS.getResearchCost(3);
        value = Math.min(max, GS.getRP());
        label = '分子研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        var molecules = Math.min(8, GS.getTier(3).totalEver);
        var moleculeProducer = Math.min(1, GS.getTier(3).producers);
        max = 16;
        value = molecules + moleculeProducer * 8;
        label = '累计分子 ' + Math.floor(molecules) + ' / 8 · 生产单元 ' + moleculeProducer + ' / 1';
      }
    } else if (step === 7) {
      value = s.roundTwo.witnessResponse ? 1 : 0;
      label = value ? '文明证词权限已确定' : '等待选择证词继承方式';
    } else if (step === 8) {
      if (!GS.getTier(4).researched) {
        max = GS.getResearchCost(4);
        value = Math.min(max, GS.getRP());
        label = '细胞研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else if (!GS.getTier(5).researched) {
        max = GS.getResearchCost(5);
        value = Math.min(max, GS.getRP());
        label = '生命研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        max = 3;
        value = Math.min(max, GS.getTier(5).totalEver);
        label = '谱系样本 ' + Math.floor(value) + ' / 3';
      }
    } else if (step === 9) {
      if (!GS.getTier(6).researched) {
        max = GS.getResearchCost(6);
        value = Math.min(max, GS.getRP());
        label = '文明研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        value = Math.min(1, GS.getTier(6).count);
        label = value ? '第二座文明已经诞生' : '生命 ' + Math.floor(GS.getTier(5).count) + ' / ' + GS.getSynthCost(6) + ' · 文明 0 / 1';
      }
    } else if (step === 10) {
      value = s.roundTwo.truthVerdict ? 1 : 0;
      label = value ? '真理裁定已封存' : '等待第二轮真理裁定';
    } else {
      value = 1;
      label = '第二轮答案—反例闭环完成';
    }
    return {
      value: value,
      max: max,
      percent: Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0)),
      label: label,
    };
  }

  function getMissionProgress() {
    var s = slice();
    if (!s) return { value: 0, max: 1, percent: 0, label: '等待观测核启动' };
    if (s.guide && s.guide.interlude) {
      return {
        value: 1,
        max: 1,
        percent: 100,
        label: '自由观测 · ' + Math.ceil(s.guide.remaining) + ' 秒后接收下一项指令',
      };
    }
    if (isSecondLoop()) return getRoundTwoMissionProgress(s);
    var step = s.missionStep;
    var value = 0;
    var max = 1;
    var label = '';

    if (step === 0) {
      value = Math.min(5, s.stats.canvasClicks); max = 5;
      label = '中央光核 ' + value + ' / 5 次';
    } else if (step === 1) {
      value = Math.min(2, GS.getTier(0).producers); max = 2;
      label = '夸克生产单元 ' + value + ' / 2';
    } else if (step === 2) {
      value = Math.min(5, s.stats.nucleonSyntheses); max = 5;
      label = '核子合成 ' + value + ' / 5 次';
    } else if (step === 3) {
      var nucleonProducer = Math.min(1, GS.getTier(1).producers);
      var nucleonCost = GC.FIRST_CONTACT.producerBaseCosts[1];
      var nucleonReady = nucleonProducer ? nucleonCost : Math.min(nucleonCost, GS.getTier(1).count);
      var nucleonFocused = s.focusTier === 1 && s.stats.focusChanges > 0 ? 1 : 0;
      value = nucleonReady + nucleonProducer * nucleonCost + nucleonFocused * nucleonCost;
      max = nucleonCost * 3;
      label = '核子 ' + Math.floor(GS.getTier(1).count) + ' / ' + nucleonCost + ' · 生产单元 ' + nucleonProducer + ' / 1 · 焦点 ' + nucleonFocused + ' / 1';
    } else if (step === 4) {
      max = GC.FIRST_CONTACT.earlyStabilitySeconds;
      value = s.stability.early;
      label = '双层正流量 ' + Math.floor(value) + ' / ' + max + ' 秒';
    } else if (step === 5) {
      value = s.flags.researchExplained ? 1 : 0;
      label = value ? '研究构成已读取' : '等待打开研究构成';
    } else if (step === 6) {
      max = GS.getResearchCost(2);
      value = s.flags.atomResearched ? max : Math.min(max, GS.getRP());
      label = s.flags.atomResearched ? '原子层已揭示' : '研究点 ' + Math.floor(value) + ' / ' + max;
    } else if (step === 7) {
      var atoms = Math.min(18, GS.getTier(2).totalEver);
      var atomProducer = Math.min(2, GS.getTier(2).producers);
      value = atoms + atomProducer * 9; max = 36;
      label = '累计原子 ' + Math.floor(atoms) + ' / 18 · 生产单元 ' + atomProducer + ' / 2';
    } else if (step === 8) {
      value = s.reserveTier === 1 ? 1 : 0;
      label = value ? '核子保护线已建立' : '等待保护核子层';
    } else if (step === 9) {
      max = GC.FIRST_CONTACT.matterStabilitySeconds;
      value = s.stability.matter;
      label = '物质稳态 ' + Math.floor(value) + ' / ' + max + ' 秒';
    } else if (step === 10) {
      value = s.law ? 1 : 0;
      label = s.law ? '第一法则已确定' : '等待选择第一法则';
    } else if (step === 11) {
      max = GC.FIRST_CONTACT.preparationSeconds;
      value = s.preparation.completed ? max : s.preparation.progress;
      label = s.preparation.id ? '接触准备 ' + Math.floor(value) + ' / ' + max + ' 秒' : '等待选择接触准备';
    } else if (step === 12) {
      if (s.enemy.status === 'warning') {
        max = getWarningDuration();
        value = max - s.enemy.warningRemaining;
        label = '接触将在 ' + Math.ceil(s.enemy.warningRemaining) + ' 秒后建立，也可提前确认';
      } else {
        value = s.enemy.status === 'active' || s.enemy.status === 'resolved' ? 1 : 0;
        label = value ? '接触已经建立' : '等待反宇宙征兆';
      }
    } else if (step === 13) {
      max = 100;
      value = s.enemy.status === 'resolved' ? 100 : s.enemy.progress;
      label = s.enemy.method ? '处理进度 ' + Math.floor(value) + '%' : '等待选择处理方案';
    } else if (step === 14) {
      value = s.flags.demoComplete ? 1 : 0;
      label = value ? '核心余像已归档' : '等待选择余像用途';
    } else if (step === 15) {
      max = 8;
      value = s.flags.reportAcknowledged ? max : Math.min(max, s.elapsedSeconds - s.missionStartedAt);
      label = s.flags.reportAcknowledged ? '继续演化已确认' : Math.ceil(max - value) + ' 秒后继续复杂物质演化';
    } else if (step === 16) {
      var molecule = GS.getTier(3);
      if (s.reverse.objects.lattice.status !== 'resolved') {
        value = 0; max = 1;
        label = '反相晶簇等待回应 · 它正在模仿' + (s.reverse.objects.lattice.mirroredRoute ? ROUTES[s.reverse.objects.lattice.mirroredRoute].name : '当前') + '路线';
      } else if (!molecule.researched) {
        max = GS.getResearchCost(3); value = Math.min(max, GS.getRP());
        label = '分子研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        max = 24; value = Math.min(12, molecule.totalEver) + Math.min(1, molecule.producers) * 12;
        label = '累计分子 ' + Math.floor(Math.min(12, molecule.totalEver)) + ' / 12 · 生产单元 ' + Math.min(1, molecule.producers) + ' / 1';
      }
    } else if (step === 17) {
      var cell = GS.getTier(4);
      if (s.reverse.objects.choir.status !== 'resolved') {
        value = 0; max = 1;
        label = '静默合唱体等待回应 · 边界节拍正在被复制';
      } else if (!cell.researched) {
        max = GS.getResearchCost(4); value = Math.min(max, GS.getRP());
        label = '细胞研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        max = 30; value = Math.min(10, cell.totalEver) + Math.min(2, cell.producers) * 10;
        label = '累计细胞 ' + Math.floor(Math.min(10, cell.totalEver)) + ' / 10 · 生产单元 ' + Math.min(2, cell.producers) + ' / 2';
      }
    } else if (step === 18) {
      value = s.complexity ? 1 : 0;
      label = s.complexity ? '复杂性伦理已记录' : '等待发展阶段决策';
    } else if (step === 19) {
      var life = GS.getTier(5);
      if (s.reverse.objects.seed.status !== 'resolved') {
        value = 0; max = 1;
        label = '镜像胚种等待回应 · 它携带了本轮主路线的记忆';
      } else if (!life.researched) {
        max = GS.getResearchCost(5); value = Math.min(max, GS.getRP());
        label = '生命研究 ' + Math.floor(value) + ' / ' + max + ' RP';
      } else {
        max = 18; value = Math.min(6, life.totalEver) + Math.min(2, life.producers) * 6;
        label = '累计生命 ' + Math.floor(Math.min(6, life.totalEver)) + ' / 6 · 生产单元 ' + Math.min(2, life.producers) + ' / 2';
      }
    } else if (step === 20) {
      max = GC.FIRST_CONTACT.lifeSignalSeconds;
      value = s.civilization.lifeSignalProgress;
      label = '双侧生命信号 ' + Math.floor(value) + ' / ' + max + ' 秒';
    } else if (step === 21) {
      max = GS.getResearchCost(6);
      value = GS.getTier(6).researched ? max : Math.min(max, GS.getRP());
      label = GS.getTier(6).researched ? '文明层已译出' : '文明研究 ' + Math.floor(value) + ' / ' + max + ' RP';
    } else if (step === 22) {
      value = Math.min(1, GS.getTier(6).count);
      label = value ? '第一座文明已经诞生' : '生命 ' + Math.floor(GS.getTier(5).count) + ' / ' + GS.getSynthCost(6) + ' · 文明 0 / 1';
    } else {
      value = 1;
      label = '夸克 → 文明 · 第一轮大循环完成';
    }

    return {
      value: value,
      max: max,
      percent: Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0)),
      label: label,
    };
  }

  function formatElapsed() {
    var s = slice();
    var seconds = s ? Math.floor(s.elapsedSeconds) : 0;
    var minutes = Math.floor(seconds / 60);
    return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  window.GameSlice = {
    init: init,
    tick: tick,
    isEnabled: isEnabled,
    getMission: getMission,
    getMissionProgress: getMissionProgress,
    getGuideState: function () { var s = slice(); return s ? s.guide : null; },
    getMissions: function () { return activeMissions(); },
    isSecondLoop: isSecondLoop,
    getRoundTwoState: function () { var s = slice(); return s ? s.roundTwo : null; },
    getRoundTwoDecision: getRoundTwoDecision,
    chooseRoundTwoDecision: chooseRoundTwoDecision,
    getRoundTwoCounterexample: getRoundTwoCounterexample,
    getLoopMemorySummary: getLoopMemorySummary,
    getLawOptions: function () { return LAW_OPTIONS; },
    getPreparationOptions: function () { return PREPARATION_OPTIONS; },
    getPreparationConditionState: getPreparationConditionState,
    getStabilityConditionState: getStabilityConditionState,
    getActiveDiscovery: getActiveDiscovery,
    getResearchDiscoveries: function () { return (isSecondLoop() ? ROUND_TWO_DISCOVERIES : RESEARCH_DISCOVERIES).slice(); },
    acknowledgeDiscovery: acknowledgeDiscovery,
    resolveDiscoveryChoice: resolveDiscoveryChoice,
    getPendingReverseObject: getPendingReverseObject,
    getReverseAtlas: getReverseAtlas,
    getReversePressure: getReversePressure,
    getReverseInfluences: getReverseInfluences,
    getTierNetRate: getTierNetRate,
    getEnemyMethods: getEnemyMethods,
    getCoreOptions: function () { return CORE_OPTIONS; },
    getComplexityOptions: function () { return COMPLEXITY_OPTIONS; },
    getRouteMeta: function () { return ROUTES; },
    getRouteRanking: getRouteRanking,
    getCivilizationProposals: getCivilizationProposals,
    getProductionMultiplier: getProductionMultiplier,
    getDemandMultiplier: getDemandMultiplier,
    getResearchMultiplier: getResearchMultiplier,
    getReserveFloor: getReserveFloor,
    getBaseEnemyLossCap: getBaseEnemyLossCap,
    getEnemyLossCap: getEnemyLossCap,
    getWarningDuration: getWarningDuration,
    getOverloadCost: getOverloadCost,
    getObserveGoal: getObserveGoal,
    canSynthesize: canSynthesize,
    canBuyProducer: canBuyProducer,
    explainResearch: explainResearch,
    acknowledgeGuideGoal: acknowledgeGuideGoal,
    markArchiveRead: markArchiveRead,
    onCanvasClick: onCanvasClick,
    onAction: onAction,
    setFocus: setFocus,
    setReserve: setReserve,
    chooseLaw: chooseLaw,
    choosePreparation: choosePreparation,
    beginContact: beginContact,
    chooseEnemyMethod: chooseEnemyMethod,
    pulseOverload: pulseOverload,
    toggleIsolation: toggleIsolation,
    chooseCoreDisposition: chooseCoreDisposition,
    continueEvolution: continueEvolution,
    chooseComplexity: chooseComplexity,
    chooseReverseObject: chooseReverseObject,
    formatElapsed: formatElapsed,
  };
})();
