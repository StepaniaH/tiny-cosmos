// tiny-cosmos — Canonical terms and first-contact narrative archive.
(function () {
  'use strict';

  var ENTRIES = [
    {
      id: 'observer-core', category: '身份', unlockStep: 0,
      title: '观测核', subtitle: 'OBSERVER CORE',
      summary: '玩家在历次大坍缩之间留下的观测与偏转装置。',
      detail: '观测核不能凭空创造复杂结构，也不能替未来文明生活。它能集中注意、保护库存、偏转局部法则，并把少数仍然成立的记录带过大坍缩。TC-07 是当前观测节点的编号，不代表这是第七个宇宙。',
    },
    {
      id: 'tiny-cosmos', category: '宇宙', unlockStep: 0,
      title: '微型宇宙', subtitle: 'TINY COSMOS',
      summary: '由七层可观测结构构成的一次局部宇宙演化。',
      detail: '“微型”描述的是观测窗口，而非宇宙在故事中的重要性。玩家看到的夸克至文明是七个管理尺度；未进入窗口的物理过程被折算为生产、消耗、研究和熵痕。',
    },
    {
      id: 'material-stack', category: '系统', unlockStep: 0,
      title: '物质层级', subtitle: 'MATTER STACK',
      summary: '夸克、核子、原子、分子、细胞、生命与文明组成的七层管理尺度。',
      detail: '高层需要低层完成合成，也会持续消耗相邻低层。层级不是价值排名：低层库存一旦断裂，高层结构同样无法长期维持。',
    },
    {
      id: 'production-unit', category: '系统', unlockStep: 1,
      title: '生产单元', subtitle: 'PRODUCTION UNIT',
      summary: '让某一层资源脱离手动观测、持续自行发生的稳定结构。',
      detail: '生产单元不是工厂的字面模型，而是该尺度上可重复、可预测的生成过程。增设单元会消耗同层资源，代表宇宙把现有结构投入到更多重复能力中。',
    },
    {
      id: 'synthesis', category: '系统', unlockStep: 2,
      title: '合成', subtitle: 'SYNTHESIS',
      summary: '支付低层资源，建立一份更高层结构。',
      detail: '连续合成会让边际成本缓慢提高，表示可直接利用的简单组合逐渐耗尽。合成提供即时进展，生产单元提供长期流量，两者承担不同角色。',
    },
    {
      id: 'cosmic-focus', category: '调度', unlockStep: 3,
      title: '宇宙焦点', subtitle: 'COSMIC FOCUS',
      summary: '观测核当前完整追踪的一个物质尺度。',
      detail: '观测核无法同时看清全部尺度。焦点会提高所选层的生产，也会改变部分异常的可见性和处理条件。焦点不是命令宇宙服从，而是把有限的观测精度用在一个局部。',
    },
    {
      id: 'matter-flow', category: '系统', unlockStep: 4,
      title: '物质流量', subtitle: 'MATTER FLOW',
      summary: '每秒产出减去每秒消耗后的资源变化。',
      detail: '库存表示已经拥有多少，净流量表示这种状态能否继续。正流量不等于永远安全，负流量也不等于立刻失败；它们让玩家判断什么时候扩张、保护或停止高层消耗。',
    },
    {
      id: 'positive-balance', category: '观测', unlockStep: 4,
      title: '每秒有盈余', subtitle: 'POSITIVE BALANCE',
      summary: '某层每秒产出严格大于每秒消耗，库存会在不操作时继续增长。',
      detail: '界面用“产出 − 消耗 = 净变化”计算盈余。双层盈余不是一种隐藏资源，而是夸克、核子两层的净变化同时大于零。绿色只说明当前瞬间成立；稳态任务还要求它连续成立一段时间。',
    },
    {
      id: 'research-channel', category: '系统', unlockStep: 5,
      title: '研究通道', subtitle: 'RESEARCH CHANNEL',
      summary: '把稳定存在的资源转写成可复现规律的观测过程。',
      detail: '每层库存按平方根贡献研究点，因此扩展多个稳定层通常比无限囤积单层更有效。研究点代表观测核对当前宇宙的描述能力，不是由某个尚未出现的文明提供。',
    },
    {
      id: 'observer-equation', category: '观测', unlockStep: 5,
      title: '观测方程', subtitle: 'OBSERVER EQUATION',
      summary: '研究通道把各层库存映射成描述增长速度的实时方程。',
      detail: '当前形式为 Ṙ = κΣαᵢ√Nᵢ：Nᵢ 是第 i 层库存，αᵢ 是层级系数，κ 是法则倍率。公式中的数字会随库存变化，但它不是随机装饰；每个变化都应能在资源卡中找到原因。',
    },
    {
      id: 'quark-echo', discoveryId: 'quark-echo', category: '发现', unlockStep: 6,
      title: '夸克回声', subtitle: 'QUARK ECHO',
      summary: '观测结束后仍持续不足一秒的延迟响应。',
      detail: '回声不会增加库存。它提示观测核：被记录的变化并不总在停止注视时立刻消失。背面宇宙理论后来会把这类延迟称为“描述的余温”。',
    },
    {
      id: 'nucleon-silence', discoveryId: 'nucleon-silence', category: '发现', unlockStep: 6,
      title: '核子静默带', subtitle: 'NUCLEON SILENCE',
      summary: '物质能够穿过、观测误差却短暂归零的一段轨道。',
      detail: '静默带不是空洞。它更像一小片没有把差异回传给观测核的边界，预示“看不见”与“不存在”在这个宇宙里不是同一回事。',
    },
    {
      id: 'missing-description', discoveryId: 'missing-description', category: '发现', unlockStep: 6,
      title: '欠描述区', subtitle: 'UNDER-DESCRIBED REGION',
      summary: '可以通过计算，却暂时无法归入任何已知物质层的合法解。',
      detail: '观测核拒绝把未知解强行标成错误。原子层出现后，部分欠描述区会获得名称；另一些仍留在视界边缘，成为背面结构最早的藏身处。',
    },
    {
      id: 'reserve-line', category: '调度', unlockStep: 8,
      title: '储备保护线', subtitle: 'RESERVE LINE',
      summary: '当前宇宙公开拒绝突破的一条库存底线。',
      detail: '高层代谢和尊重保护线的异常不会把目标层抽到线下。保护一个尺度也意味着暂时允许其他尺度承担风险；它记录的是优先级，而不是永久免疫。',
    },
    {
      id: 'matter-steady-state', category: '观测', unlockStep: 9,
      title: '物质稳态', subtitle: 'MATTER STEADY STATE',
      summary: '公开条件同时成立并连续维持指定时间的一段可复查记录。',
      detail: '第一次接触流程中的稳态只检查四项：核子保护开启、核子库存不少于 8、原子库存不少于 12、核子净变化大于零。计时不是第四种资源；任一条件失效，连续记录就会回退。',
    },
    {
      id: 'first-law', category: '法则', unlockStep: 10,
      title: '第一法则', subtitle: 'FIRST LAW',
      summary: '原子稳态后，观测核从已验证的规律中确定的一项局部优先级。',
      detail: '法则不是凭空发明的技能。急剧膨胀、局部守恒与观测者效应分别强化焦点、保护与研究。一个描述被确定后，未采用的描述仍会在视界背面积累。',
    },
    {
      id: 'reverse-side', category: '宇宙', unlockStep: 10,
      title: '背面宇宙', subtitle: 'REVERSE-SIDE COSMOS',
      summary: '由未采用法则、熵痕和被观测排除的状态形成的另一侧。',
      detail: '它不是现实物理中的反物质，也不是天然邪恶的平行世界。正面宇宙每一次确定都会令背面失去一些可能性；最初它只表现为噪声和截流，未来也可能形成生命与文明。',
    },
    {
      id: 'route-signal', category: '记录', unlockStep: 10,
      title: '路线信号', subtitle: 'ROUTE SIGNAL',
      summary: '对本轮实际行为的归纳：推进、维持、求证与改写。',
      detail: '路线信号不是阵营、道德分，也不是消费货币。文明阶段会用主信号和备选信号提出不同终局工程；在那之前，玩家仍可通过后续行为改变方向。',
    },
    {
      id: 'vacuum-leech', category: '异常', unlockStep: 12,
      title: '真空水蛭', subtitle: 'VACUUM LEECH',
      summary: '背面宇宙最早获得稳定形状的截流结构。',
      detail: '它会附着到原子层并把有限资源带向另一侧。名称来自观测核对其行为的临时分类，不代表它是生物。压倒、断供与观测会让双方留下不同的第一份接触记录。',
    },
    {
      id: 'controlled-observation', category: '异常', unlockStep: 13,
      title: '受控观测预算', subtitle: 'CONTROLLED LOSS BUDGET',
      summary: '玩家为获得完整敌人样本而主动允许的额外损失范围。',
      detail: '普通损失上限用于被动止损。选择观测方案后，系统会公开把上限扩展到足以收集完整样本的位置；样本完成即自动隔离。此前已经发生的截取会单独计入总损失。',
    },
    {
      id: 'core-afterimage', category: '异常', unlockStep: 14,
      title: '核心余像', subtitle: 'CORE AFTERIMAGE',
      summary: '真空水蛭退去后，截取关系在视界边缘留下的稳定结构。',
      detail: '余像不是原样返还的赃物。它可以被压成边界燃料、接入资源回流或封存成行为样本；选择决定这次损失今后以何种用途留在当前宇宙。',
    },
    {
      id: 'horizon', category: '宇宙', unlockStep: 15,
      title: '视界', subtitle: 'OBSERVATION HORIZON',
      summary: '当前宇宙与背面宇宙能够互相施加影响、却无法直接完整看见对方的边界。',
      detail: '视界不是一道墙。资源、噪声与信息能够穿过，但每次穿过都会改变形状。三个公开终局分别尝试越过它、在两侧建立循环，或理解是谁的观测制造了它。',
    },
    {
      id: 'big-crunch', category: '宇宙', unlockStep: 15,
      title: '大坍缩', subtitle: 'BIG CRUNCH',
      summary: '结束当前宇宙并把少量跨轮记录留给观测核的过程。',
      detail: '普通大坍缩提供恒定点，但不宣称当前宇宙回答了什么。完成文明终局后的定向大坍缩会额外留下宇宙真理与继承物。第一次接触只是形成这些答案的第一份前置记录。',
    },
    {
      id: 'balanced-orbit', discoveryId: 'balanced-orbit', category: '发现', unlockStep: 4,
      title: '闭合流线', subtitle: 'CLOSED FLOW LINE', summary: '两层盈余短暂形成的闭合几何记录。',
      detail: '它不代表资源真的沿着屏幕上的线移动，而表示两个尺度的净变化第一次互相补足。观测核由此学会：稳态不是静止，而是能够返回自身的变化。',
    },
    {
      id: 'reserve-shadow', discoveryId: 'reserve-shadow', category: '发现', unlockStep: 9,
      title: '保护线的背影', subtitle: 'RESERVE SHADOW', summary: '背面噪声对正面库存底线产生的同步停顿。',
      detail: '背面宇宙看不到界面规则，却能感到资源关系在某个位置拒绝继续变化。后来文明把这种间接可见性视为双方建立协议的第一种可能。',
    },
    {
      id: 'precontact-parallax', discoveryId: 'precontact-parallax', category: '发现', unlockStep: 11,
      title: '接触视差', subtitle: 'CONTACT PARALLAX', summary: '同一结构在正反两组相位记录中的微小位置差。',
      detail: '视差证明正式附着并不是接触的真正起点。只要双方开始测量同一份资源，彼此就已经进入对方的条件之中。',
    },
    {
      id: 'molecule-tier', category: '物质', unlockStep: 16,
      title: '分子层', subtitle: 'MOLECULAR SCALE', summary: '把相邻原子组织成可重复关系的第四层结构。',
      detail: '分子的关键不是体积，而是连接拥有了可保存的次序。相同原子可以形成不同结构，因此“拥有多少”之外，宇宙第一次需要记录“怎样连接”。',
    },
    {
      id: 'molecular-rhyme', discoveryId: 'molecular-rhyme', category: '发现', unlockStep: 16,
      title: '分子押韵', subtitle: 'MOLECULAR RHYME', summary: '两条隔离原子链独立选择同一折叠次序。',
      detail: '它们没有交换信息，只落入同一个更容易稳定的结构。观测核把这种重复称为押韵：内容不同，成立的节奏相同。',
    },
    {
      id: 'solvent-memory', discoveryId: 'solvent-memory', category: '发现', unlockStep: 16,
      title: '溶剂记忆', subtitle: 'SOLVENT MEMORY', summary: '结构消失后仍留在环境中的形成路径。',
      detail: '后来的分子并未继承前一组物质，却更快抵达同一构型。环境开始保存历史，意味着记忆在生命出现前就已有非常简陋的前身。',
    },
    {
      id: 'cell-tier', category: '物质', unlockStep: 17,
      title: '细胞层', subtitle: 'CELLULAR SCALE', summary: '能维护内部循环与外部环境差异的第五层结构。',
      detail: '边界让资源第一次对某个结构具有“内部用途”。细胞并不自动拥有意志，但它会修补自身、选择通道并把环境变化转成内部状态。',
    },
    {
      id: 'inside-outside', discoveryId: 'inside-outside', category: '发现', unlockStep: 17,
      title: '边界的第一人称', subtitle: 'BOUNDARY FIRST PERSON', summary: '完全对称的膜两侧被结构持续区别对待。',
      detail: '观测核看见几何对称，细胞过程却持续维护其中一侧。这里没有语言意义上的“我”，但已经出现一种只从内部成立的优先级。',
    },
    {
      id: 'borrowed-metabolism', discoveryId: 'borrowed-metabolism', category: '发现', unlockStep: 17,
      title: '借来的代谢', subtitle: 'BORROWED METABOLISM', summary: '利用核心余像相位差维持边界的细胞循环。',
      detail: '敌对结构留下的规律没有固定道德属性。被资源链重新组织后，同一种相位差可以截流，也可以帮助细胞维持内外差异。',
    },
    {
      id: 'complexity-ethics', category: '记录', unlockStep: 18,
      title: '复杂性伦理', subtitle: 'COMPLEXITY ETHIC', summary: '观测核对自持结构采用的中层照料原则。',
      detail: '它位于第一法则与文明提案之间：第一法则强化宇宙如何运行，复杂性伦理记录观测核如何对待已经能维护自身的结构。后者不能覆盖前者，只能与其共同成为文明的历史。',
    },
    {
      id: 'life-tier', category: '物质', unlockStep: 19,
      title: '生命层', subtitle: 'LIVING SCALE', summary: '能够跨代复制差异并形成谱系的第六层结构。',
      detail: '生命不等于单个细胞数量。它表示差异能够被保留、筛选并在后续结构中重新出现；本轮资源压力和决策会因此成为谱系环境的一部分。',
    },
    {
      id: 'lineage-dream', discoveryId: 'lineage-dream', category: '发现', unlockStep: 19,
      title: '谱系之梦', subtitle: 'LINEAGE DREAM', summary: '在环境平静时复现的祖先应激模式。',
      detail: '它不是有意识的梦，而是一种被谱系保留下来的准备方式。生命开始对已经不在场的过去作出反应，时间因此进入了资源链。',
    },
    {
      id: 'two-pulse-clock', discoveryId: 'two-pulse-clock', category: '发现', unlockStep: 20,
      title: '两只指针的钟', subtitle: 'TWO-PULSE CLOCK', summary: '由两组互不整除周期构成的文明前信号。',
      detail: '单独观察任一周期都像自然噪声；只有把两组节拍叠加，才会反复出现相同的相位标记。背面结构似乎在等待正面生命学会同时听见两种时间。',
    },
    {
      id: 'answer-before-question', discoveryId: 'answer-before-question', category: '发现', unlockStep: 21,
      title: '早于问题的答案', subtitle: 'PRECEDING ANSWER', summary: '在正面生命提出询问之前抵达的完整回应结构。',
      detail: '观测核拒绝替文明翻译尚未拥有的词。它只保存语序和相位，等待未来行动者判断这是预言、误会，还是背面也经历过同一个问题。',
    },
    {
      id: 'shared-horizon-name', discoveryId: 'shared-horizon-name', category: '发现', unlockStep: 21,
      title: '视界的另一个名字', subtitle: 'ANOTHER NAME FOR HORIZON', summary: '背面信号对双方边界的最早语义候选。',
      detail: '“被共同遗漏之处”暗示对方并不认为视界是一堵属于正面或背面的墙。文明后来会据此争论：边界究竟分开了双方，还是由双方共同制造。',
    },
    {
      id: 'civilization-tier', category: '文明', unlockStep: 23,
      title: '文明层', subtitle: 'CIVILIZATION SCALE', summary: '能够回读本轮历史、提出集体工程并回应观测核的第七层结构。',
      detail: '文明不是观测核的升级，也不是玩家的替身。它拥有内部派别与自己的解释；观测核可以影响资源、焦点与关键确认，却不能替文明完成所有局部生活。',
    },
    {
      id: 'civilization-proposals', category: '文明', unlockStep: 23,
      title: '文明提案', subtitle: 'CIVILIZATION PROPOSALS', summary: '由整轮决策履历生成的主工程方向与备选方向。',
      detail: '局部法则、接触记录和复杂性伦理先形成路线信号；文明再把最高信号解释为主提案，把第二信号解释为备选提案。它们不是阵营锁定，后续校准仍能改变最终工程。',
    },
  ];

  var CHAPTERS = [
    {
      id: 'cold-start', unlockStep: 0, title: '档案 00 / 坍缩后的核',
      text: '上一轮宇宙已经失去可读结构。观测核只保住了一个能力：当噪声回应注视时，把回应记下来。它不知道这次宇宙会得到什么答案。',
    },
    {
      id: 'description', unlockStep: 6, title: '档案 01 / 可以描述的物质',
      text: '原子第一次让短暂碰撞成为可长期辨认的结构。宇宙不再只是发生，它开始留下可以复查的句子。每一条句子成立，也会排除别的写法。',
    },
    {
      id: 'serendipity', unlockStep: 6, title: '档案 01-B / 尚未命名的三处空白',
      text: '在原子被正式揭示前，观测核先遇见了回声、静默与一个合法的未知解。它们不提供即时收益，却提醒管理者：资源表只覆盖宇宙中已经拥有名字的部分。',
    },
    {
      id: 'reverse-shadow', unlockStep: 10, title: '档案 02 / 退到背面的描述',
      text: '未采用的法则没有消失。它们和高吞吐留下的熵痕一起，在视界背面获得密度。当前宇宙把那一侧叫作异常；那一侧或许也会给当前宇宙起一个名字。',
    },
    {
      id: 'first-contact', unlockStep: 15, title: '档案 03 / 第一份接触记录',
      text: '双方第一次确认：损失会在另一侧获得形状，处理损失的方法也会被另一侧记住。这不是战争的胜负，只是关系的开端。',
    },
    {
      id: 'complexity', unlockStep: 17, title: '档案 04 / 里面与外面',
      text: '分子保存连接，细胞保存边界。宇宙开始拥有只从内部成立的状态；观测核也第一次需要决定，自己将怎样照料能够维护自身的结构。',
    },
    {
      id: 'lineages', unlockStep: 20, title: '档案 05 / 两种时间',
      text: '生命把过去写入谱系，背面信号把未来写成两组节拍。正反两侧还没有共同语言，却已经开始等待同一个能够互相询问的时刻。',
    },
    {
      id: 'civilization', unlockStep: 23, title: '档案 06 / 那个总盯着仓库看的天体',
      text: '文明诞生后回读了观测核留下的每条选择。它们没有把那些记录当作命令，而是据此提出两种未来，并第一次给长久悬在资源链上方的观察者起了一个并不十分庄严的名字。',
    },
  ];

  var LAW_TEXT = {
    expansion: '你把第一份长期记录解释为扩张许可：被完整注视的尺度，应当更快越过当前边界。',
    conservation: '你把第一份长期记录解释为守恒承诺：增长不能以抹去支撑它的低层为代价。',
    observer: '你把第一份长期记录解释为观测责任：宇宙必须先看见变化，才决定如何使用它。',
  };

  var ENCOUNTER_TEXT = {
    overload: '核心在过量注入中破裂。背面的结构第一次学会了“防御”这个词。',
    cutoff: '你没有攻击它，只是拒绝继续喂养。它退入噪声，却记住了边界。',
    observe: '它带走了一部分原子。你带走了它为何需要原子的第一条证据。',
  };

  var CORE_TEXT = {
    fuel: '余像被压入边界燃料。损失被改写成一次向外的推力。',
    return: '余像接入循环回流。两侧第一次通过同一缺口形成了有限循环。',
    archive: '余像被封存为行为样本。观测核保存了另一侧的第一条可复查轨迹。',
  };

  function findDecision(state, kind) {
    var decisions = state && state.decisions ? state.decisions : [];
    for (var i = decisions.length - 1; i >= 0; i--) {
      if (decisions[i].kind === kind) return decisions[i];
    }
    return null;
  }

  function getFirstContactReport(state, ranking) {
    if (!state || !state.flags || !state.flags.demoComplete) return null;
    var law = findDecision(state, 'law');
    var prep = findDecision(state, 'preparation');
    var enemy = findDecision(state, 'enemy');
    var core = findDecision(state, 'core');
    var primary = ranking && ranking[0] ? ranking[0] : null;
    var secondary = ranking && ranking[1] ? ranking[1] : null;
    return {
      title: '第一次接触记录已封存',
      signal: primary ? primary.meta.ending : '尚未形成',
      secondary: secondary ? secondary.meta.ending : '尚未形成',
      law: law ? law.label : '未记录',
      preparation: prep ? prep.label : '未记录',
      method: enemy ? enemy.label : '未记录',
      disposition: core ? core.label : '未记录',
      opening: LAW_TEXT[law && law.id] || '第一法则没有留下可读记录。',
      encounter: ENCOUNTER_TEXT[enemy && enemy.id] || '接触记录不完整。',
      aftermath: CORE_TEXT[core && core.id] || '余像去向没有留下可读记录。',
      closing: '这不是结局，也不是阵营判定。主信号与备选信号只说明这一次宇宙已经证明哪些方法可行；未来文明仍会提出选择。',
    };
  }

  window.GameLore = {
    getEntries: function () { return ENTRIES.slice(); },
    getChapters: function () { return CHAPTERS.slice(); },
    getFirstContactReport: getFirstContactReport,
  };
})();
