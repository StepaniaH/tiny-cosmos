// tiny-cosmos — First-contact vertical slice
// Guided scenario, early decisions, route tendencies and the first adversary.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;

  var ROUTES = {
    advance: { name: '推进', ending: '越过视界', color: '#ffb84d' },
    sustain: { name: '维持', ending: '无尽花园', color: '#61e6a7' },
    inquiry: { name: '求证', ending: '最后观测者', color: '#56d8ff' },
    rewrite: { name: '改写', ending: '双生大坍缩', color: '#c594ff' },
  };

  var MISSIONS = [
    {
      code: 'BOOT-01', title: '建立观测响应',
      brief: '点击中央光核 5 次。每次点击立即获得 1 枚夸克。',
      hint: '最初几次观测需要手动完成。光核周围的轨道会显示已稳定的资源层。',
      world: '你接管的微型宇宙刚从一次坍缩中恢复。当前只有观测核和一层未稳定的夸克噪声。',
      action: '点击中央光核 5 次，让观测核确认这个宇宙会回应你的操作。',
      restSeconds: 25,
      restMessage: '观测核保持低功率运行。继续点击可以加快第一批夸克积累，也可以观察自动产出。',
    },
    {
      code: 'BOOT-02', title: '让重复脱离意志',
      brief: '积累夸克，购买第二个夸克生产单元。',
      hint: '生产单元会持续工作，手动点击很快会退到辅助位置。',
      world: '观测响应已经稳定。只靠持续点击会占用你的全部注意力，生产单元可以接管重复工作。',
      action: '等待夸克达到购买价格，再在左侧夸克卡片中增设第 2 个生产单元。',
      restSeconds: 35,
      restMessage: '第二个生产单元已经接管一部分工作。继续积累库存，下一阶段会连续消耗夸克。',
    },
    {
      code: 'MATTER-01', title: '合成五枚核子',
      brief: '使用夸克→核子操作五次，建立第一层高阶结构。',
      hint: '合成会消耗低层库存。后续每个高层也会持续消耗相邻低层。',
      world: '夸克开始重复出现，但它们仍无法形成长期结构。核子是资源链中的第一层组合物。',
      action: '在核子卡片中执行 5 次“夸克 → 核子”。每次合成都会扣除夸克，价格也会缓慢上升。',
      restSeconds: 30,
      restMessage: '观察夸克库存的下降和恢复。接下来需要继续补足核子，建立它自己的生产单元。',
    },
    {
      code: 'FOCUS-01', title: '建立并聚焦核子生产',
      brief: '补足核子，购买核子生产单元，再把宇宙焦点移动到核子层。',
      hint: '焦点层生产速度变为 1.8 倍。全宇宙只能保留一个焦点，迁移没有资源成本。',
      world: '观测核的计算能力有限，同一时间只能完整追踪一个物质尺度。被追踪的层级会得到更高的生产效率。',
      action: '先把核子补到生产单元所需数量并完成购买，再点击“聚焦”。流量图会显示核子产出得到 1.8 倍加速。',
      restSeconds: 25,
      restMessage: '保持核子焦点，先让两层库存恢复。下一项任务会要求你维持一段稳定流量。',
    },
    {
      code: 'FLOW-01', title: '建立双层盈余',
      brief: '让夸克、核子两行都显示绿色“有盈余”，并把夸克库存维持在 12 以上，共计 35 秒。',
      hint: '“有盈余”就是每秒产出大于每秒消耗。监视器会逐项显示哪些条件已满足、哪些仍需调整。',
      world: '一次短暂的高产不能证明结构已经稳定。观测核需要一段连续记录，确认核子生产没有拖垮夸克层。',
      action: '看“稳态判定”清单：聚焦核子、夸克不少于 12，并让夸克与核子都显示“有盈余”。四项同时为绿色时开始计时。',
      restSeconds: 25,
      restMessage: '双层流量记录已经成立。你可以继续扩充产能，研究通道将在下一阶段开放。',
    },
    {
      code: 'RESEARCH-01', title: '读取研究通道',
      brief: '打开“研究构成”，查看夸克和核子各自提供的研究增长。',
      hint: '资源越多，研究贡献越高；增长采用平方根计算，因此囤积同一资源的边际收益会下降。',
      world: '观测核会把稳定存在的资源转化为可复现的规律。研究点持续增长，不需要单独安排研究人员。',
      action: '点击研究通道右侧的“研究构成”。对照每层贡献和总增长速度。',
      restSeconds: 30,
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
      restSeconds: 40,
      restMessage: '原子生产已经形成规模。观察核子的消耗红柱，下一项指令会为低层库存建立底线。',
    },
    {
      code: 'RESERVE-01', title: '设置核子保护线',
      brief: '在核子卡片上选择“保护”。保护线会为代谢和敌人损失保留最低库存。',
      hint: '当前竖切只能保护一个层级；移动保护线没有资源成本。',
      world: '高层结构会持续消耗相邻低层。保护线公开了当前宇宙拒绝突破的库存底线。',
      action: '点击核子卡片中的“保护”，为核子保留最低库存。',
      restSeconds: 30,
      restMessage: '保护线已经生效。观察核子接近底线时，高层消耗如何停止。',
    },
    {
      code: 'FLOW-02', title: '完成物质稳态观测',
      brief: '同时满足 4 项公开条件：保护核子、核子≥8、原子≥12、核子每秒有盈余，并连续保持 60 秒。',
      hint: '稳态不是“数字看起来很多”，而是四个条件同时成立。监视器会显示实时判定；焦点放在核子层只是推荐方法，不是隐藏条件。',
      world: '原子层正在持续抽取核子。观测核需要证明这条资源链能够承受一分钟的连续运行。',
      action: '逐项核对稳态清单。若核子没有盈余，聚焦核子或增加核子生产；若库存不足，暂停合成原子并等待恢复。四项全绿时开始计时。',
      restSeconds: 30,
      restMessage: '一分钟稳态记录已经写入。三套现有系统都获得了足够数据，可以据此确定第一法则。',
    },
    {
      code: 'LAW-01', title: '确定第一条法则',
      brief: '比较焦点、保护线和研究通道的三种强化，选择第一条法则。',
      hint: '你已经实际使用过三个系统。法则会强化其中一个，并留下路线信号。',
      world: '原子让宇宙第一次拥有可长期保持的结构。观测核需要决定哪条已知规律获得优先权。',
      action: '阅读右侧三个选项。每项都列出当前效果、改变后的数值和路线记录。',
      restSeconds: 35,
      restMessage: '第一法则正在改变资源流。观察焦点倍率、保护线或研究增长的变化。',
    },
    {
      code: 'PREP-01', title: '部署接触准备',
      brief: '选择库存缓冲、脉冲蓄能或远距标定，并完成对应的 30 秒准备。',
      hint: '三项准备分别强化止损、压倒方案和观测方案，也会留下 1 点路线信号。',
      world: '第一法则稳定后，视界背面出现了不同步的资源影子。外部结构尚未成形，当前仍有时间准备。',
      action: '在决策队列中比较三项准备。选定后完成显示的库存、产能或研究条件。',
      restSeconds: 20,
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
      restSeconds: 20,
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
      brief: '读取第一次接触报告，再核对路线信号与观测日志。当前宇宙可以继续自由运行。',
      hint: '报告只归纳本轮真实选择，不评价正误。后续文明会用这些记录形成主提案、备选提案和结局继承物。',
      world: '第一次接触已经结束。系统没有把你归入固定阵营，只保存了这一轮实际采用的方法。',
      action: '先阅读决策队列中的接触报告，再查看右侧路线信号和观测日志。当前版本可以继续自由运行或重启体验其他选择。',
    },
  ];

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
      requirement: '核子不少于 24，原子不少于 12，连续保持 30 秒',
      effect: '真空水蛭的累计损失上限降低 1',
    },
    {
      id: 'pulse', route: 'advance', title: '脉冲蓄能', tag: '推进 +1',
      desc: '把原子产能和核子库存接入一组短时脉冲电容。',
      requirement: '原子生产单元不少于 3，核子不少于 18，连续保持 30 秒',
      effect: '压倒方案每次脉冲的核子成本从 4 降到 3',
    },
    {
      id: 'sensor', route: 'inquiry', title: '远距标定', tag: '求证 +1',
      desc: '把原子层作为传感器，对视界背面的相位先行采样。',
      requirement: '焦点位于原子层，研究点不少于 18，连续保持 30 秒',
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
  ];

  function slice() {
    return GS.getSlice ? GS.getSlice() : null;
  }

  function isEnabled() {
    var s = slice();
    return !!(s && s.enabled);
  }

  function init() {
    var s = slice();
    if (!s || !s.enabled) return;
    if (s.missionStep >= MISSIONS.length) s.missionStep = MISSIONS.length - 1;
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
    s.decisions.push({ time: s.elapsedSeconds, kind: kind, id: id, route: route, label: label, score: signal });
    if (route && s.tendencies[route] !== undefined) s.tendencies[route] += signal;
  }

  function startInterlude(completedStep) {
    var s = slice();
    var mission = MISSIONS[completedStep];
    var seconds = mission.restSeconds || 0;
    if (!s || seconds <= 0) return false;
    s.guide.interlude = true;
    s.guide.remaining = seconds;
    s.guide.nextStep = Math.min(completedStep + 1, MISSIONS.length - 1);
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
    s.missionStep = Math.min(step, MISSIONS.length - 1);
    var mission = MISSIONS[s.missionStep];
    addLog('GUIDE', mission.code + ' / ' + mission.title);

    if (s.missionStep === 10) {
      s.flags.lawDecisionOpen = true;
      addLog('OBS', '原子使宇宙获得长期结构。未采用的法则开始退向视界背面。');
    }
    if (s.missionStep === 11) s.flags.preparationOpen = true;
    if (s.missionStep === 12 && s.enemy.status === 'hidden') triggerWarning();
    if (s.missionStep === 14) s.flags.coreDecisionOpen = true;
    if (s.missionStep === 15) {
      s.flags.demoComplete = true;
      addLog('SYS', '第一次接触观测窗口完成。路线信号已写入本轮档案。');
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
        demand = higher.count * demandMultiplier;
      }
    }
    return production - demand;
  }

  function getStabilityConditionState(step) {
    var s = slice();
    var missionStep = step === undefined ? (s ? s.missionStep : -1) : step;
    if (!s) return [];
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
    return [];
  }

  function updateResearchDiscoveries(dt) {
    var s = slice();
    if (!s || s.missionStep !== 6 || s.flags.atomResearched) return;
    s.discoveries.researchWaitSeconds += dt;
    RESEARCH_DISCOVERIES.forEach(function (discovery) {
      if (s.discoveries.researchWaitSeconds < discovery.at || s.discoveries.triggered.indexOf(discovery.id) !== -1) return;
      s.discoveries.triggered.push(discovery.id);
      addLog('DISCOVERY', discovery.title.replace('发现：', '') + '：' + discovery.copy);
    });
  }

  function getActiveDiscovery() {
    var s = slice();
    if (!s) return null;
    for (var i = 0; i < s.discoveries.triggered.length; i += 1) {
      var id = s.discoveries.triggered[i];
      if (s.discoveries.acknowledged.indexOf(id) !== -1) continue;
      return RESEARCH_DISCOVERIES.find(function (item) { return item.id === id; }) || null;
    }
    return null;
  }

  function acknowledgeDiscovery(id) {
    var s = slice();
    if (!s || s.discoveries.triggered.indexOf(id) === -1) return false;
    if (s.discoveries.acknowledged.indexOf(id) === -1) s.discoveries.acknowledged.push(id);
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
    if (id === 'buffer') return GS.getTier(1).count >= 24 && GS.getTier(2).count >= 12;
    if (id === 'pulse') return GS.getTier(2).producers >= 3 && GS.getTier(1).count >= 18;
    if (id === 'sensor') return s.focusTier === 2 && GS.getRP() >= 18;
    return false;
  }

  function getPreparationConditionState() {
    var s = slice();
    if (!s || !s.preparation.id) return [];
    if (s.preparation.id === 'buffer') return [
      { label: '核子库存 24', met: GS.getTier(1).count >= 24, value: Math.floor(GS.getTier(1).count) + ' / 24' },
      { label: '原子库存 12', met: GS.getTier(2).count >= 12, value: Math.floor(GS.getTier(2).count) + ' / 12' },
    ];
    if (s.preparation.id === 'pulse') return [
      { label: '原子生产单元 3', met: GS.getTier(2).producers >= 3, value: GS.getTier(2).producers + ' / 3' },
      { label: '核子库存 18', met: GS.getTier(1).count >= 18, value: Math.floor(GS.getTier(1).count) + ' / 18' },
    ];
    return [
      { label: '焦点位于原子层', met: s.focusTier === 2, value: s.focusTier === 2 ? '已完成' : '未完成' },
      { label: '研究点 18', met: GS.getRP() >= 18, value: Math.floor(GS.getRP()) + ' / 18' },
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

  function evaluateMission() {
    var s = slice();
    if (!s || !s.enabled) return;
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
      updateStability(dt);
      updatePreparation(dt);
    }

    if (s.enemy.status === 'warning') {
      s.enemy.warningRemaining = Math.max(0, s.enemy.warningRemaining - dt);
      if (s.enemy.warningRemaining <= 0) beginContact();
    }

    if (s.enemy.status === 'active') {
      updateEnemyDrain(dt);
      updateEnemyMethod(dt);
    }

    evaluateMission();
  }

  function getProductionMultiplier(tierId) {
    var s = slice();
    if (!s || !s.enabled) return 1;
    if (s.enemy.status === 'active' && s.enemy.method === 'cutoff' && s.enemy.isolationActive && tierId === 2) return 0;

    var mult = s.focusTier === tierId ? GC.FIRST_CONTACT.focusMultiplier : 1;
    if (s.law === 'expansion' && s.focusTier === tierId) mult += GC.FIRST_CONTACT.focusLawBonus;
    if (s.law === 'conservation' && s.reserveTier === tierId) mult *= 1.2;
    return mult;
  }

  function getResearchMultiplier() {
    var s = slice();
    if (!s || !s.enabled) return 1;
    return s.law === 'observer' ? 1.25 : 1;
  }

  function getReserveFloor(tierId) {
    var s = slice();
    if (!s || !s.enabled || s.reserveTier !== tierId) return 0;
    return GC.FIRST_CONTACT.reserveFloors[tierId] || 0;
  }

  function canSynthesize(tierId) {
    var s = slice();
    if (!s || !s.enabled) return true;
    if (tierId > 2) return false;
    if (tierId === 1 && s.missionStep < 2) return false;
    if (tierId === 2 && s.missionStep < 7) return false;
    if (tierId === 2 && s.enemy.method === 'cutoff' && s.enemy.isolationActive) return false;
    return true;
  }

  function canBuyProducer(tierId) {
    var s = slice();
    if (!s || !s.enabled) return true;
    if (tierId === 0) return s.missionStep >= 1;
    if (tierId === 1) return s.missionStep >= 3;
    if (tierId === 2) return s.missionStep >= 7;
    return false;
  }

  function explainResearch() {
    var s = slice();
    if (!s || !s.enabled || s.missionStep < 5) return false;
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
    evaluateMission();
  }

  function setFocus(tierId) {
    var s = slice();
    if (!s || !s.enabled || s.missionStep < 3) return false;
    if (!GS.getTier(tierId).researched || s.focusTier === tierId) return false;
    s.focusTier = tierId;
    s.stats.focusChanges += 1;
    addLog('CTRL', '宇宙焦点已转向' + GC.TIERS[tierId].nameZh + '层。');
    evaluateMission();
    return true;
  }

  function setReserve(tierId) {
    var s = slice();
    if (!s || !s.enabled || s.missionStep < 8) return false;
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
    addLog('ARCHIVE', '核心处置：' + option.title + '。本轮路线信号已更新。');
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

  function getMission() {
    var s = slice();
    return s ? MISSIONS[Math.min(s.missionStep, MISSIONS.length - 1)] : MISSIONS[0];
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
    } else {
      value = 1;
      label = '观测窗口完成 · 可以自由运行';
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
    getMissions: function () { return MISSIONS; },
    getLawOptions: function () { return LAW_OPTIONS; },
    getPreparationOptions: function () { return PREPARATION_OPTIONS; },
    getPreparationConditionState: getPreparationConditionState,
    getStabilityConditionState: getStabilityConditionState,
    getActiveDiscovery: getActiveDiscovery,
    getResearchDiscoveries: function () { return RESEARCH_DISCOVERIES.slice(); },
    acknowledgeDiscovery: acknowledgeDiscovery,
    getEnemyMethods: getEnemyMethods,
    getCoreOptions: function () { return CORE_OPTIONS; },
    getRouteMeta: function () { return ROUTES; },
    getRouteRanking: getRouteRanking,
    getProductionMultiplier: getProductionMultiplier,
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
    formatElapsed: formatElapsed,
  };
})();
