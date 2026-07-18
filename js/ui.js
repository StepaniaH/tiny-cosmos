// tiny-cosmos — Command interface for the first-contact slice
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;
  var Slice = window.GameSlice;
  var Lore = window.GameLore;
  var Sound = window.GameAudio;
  var lastLogSignature = '';
  var lastMissionStep = null;
  var lastGuideStep = null;
  var guideCollapsed = false;
  var flowUserToggled = false;
  var flowAutoExpanded = false;
  var toastTimer = null;
  var loreLastFocus = null;
  var loreCategory = '全部';
  var researchHistory = [];
  var lastResearchSample = -1;
  var lastResearchReady = false;
  var lastDiscoveryId = null;
  var lastEnemyStatus = null;

  function el(id) { return document.getElementById(id); }
  function playSound(id) { if (Sound) Sound.play(id); }
  function updateSoundToggle() {
    var button = el('sound-toggle');
    if (!button || !Sound) return;
    var muted = Sound.isMuted();
    button.textContent = muted ? '声音 · 关' : '声音 · 开';
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', muted ? '开启事件音效' : '关闭事件音效');
  }
  function fmt(n, digits) {
    if (digits === undefined) digits = 1;
    if (n >= 1e9) return (n / 1e9).toFixed(digits) + 'G';
    if (n >= 1e6) return (n / 1e6).toFixed(digits) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(digits) + 'K';
    if (n >= 100) return Math.floor(n).toString();
    return Math.max(0, n).toFixed(digits);
  }
  function fmtInt(n) { return Math.floor(n).toString(); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function missionIcon(step) {
    if (step === 0) return 'input';
    if (step === 1 || step === 2 || step === 7) return 'production';
    if (step === 3 || step === 4 || step === 8 || step === 9) return 'flow';
    if (step === 5 || step === 6) return 'research';
    if (step === 10 || step === 11 || step === 14) return 'decision';
    return 'contact';
  }

  function recordResearchRate(rate) {
    var elapsed = GS.getSlice().elapsedSeconds || 0;
    var second = Math.floor(elapsed);
    if (second === lastResearchSample) return;
    lastResearchSample = second;
    researchHistory.push({ time: elapsed, rate: rate });
    if (researchHistory.length > 60) researchHistory.shift();
  }

  function sparkline(history, width, height) {
    if (!history.length) return '';
    var rates = history.map(function (sample) { return sample.rate; });
    var min = Math.min.apply(Math, rates);
    var max = Math.max.apply(Math, rates);
    var span = Math.max(0.001, max - min);
    var points = history.map(function (sample, index) {
      var x = history.length === 1 ? width : index / (history.length - 1) * width;
      var y = height - 3 - (sample.rate - min) / span * (height - 6);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + points + '"></polyline><circle cx="' + points.split(' ').pop().split(',')[0] + '" cy="' + points.split(' ').pop().split(',')[1] + '" r="1.8"></circle></svg>';
  }

  function getRates(tierId) {
    var production = GS.getProducerOutput(tierId) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(tierId);
    if (Slice && Slice.isEnabled()) production *= Slice.getProductionMultiplier(tierId);
    var demand = 0;
    if (tierId < GC.TIERS.length - 1) {
      var higher = GS.getTier(tierId + 1);
      if (higher && higher.researched) {
        var demandMult = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
        if (GS.hasMilestone(7)) demandMult *= 0.7;
        demand = higher.count * demandMult;
      }
    }
    return { production: production, demand: demand, net: production - demand };
  }

  function getResearchBreakdown() {
    var sliceMultiplier = GS.getSlice().enabled ? GC.FIRST_CONTACT.researchMultiplier : 1;
    var lawMultiplier = Slice && Slice.isEnabled() ? Slice.getResearchMultiplier() : 1;
    var multiplier = sliceMultiplier * lawMultiplier;
    var rows = [];
    var total = 0;
    for (var i = 0; i < GC.TIERS.length; i++) {
      var tier = GS.getTier(i);
      if (!tier || !tier.researched || tier.count <= 0) continue;
      var rate = Math.sqrt(tier.count) * GC.RP_SQRT_COEFF[i] * GC.TICKS_PER_SEC * multiplier;
      total += rate;
      rows.push({ tierId: i, count: tier.count, rate: rate, meta: GC.TIERS[i] });
    }
    return { rows: rows, total: total, multiplier: multiplier };
  }

  function updateMission() {
    var s = GS.getSlice();
    var guide = Slice.getGuideState();
    var mission = Slice.getMission();
    var progress = Slice.getMissionProgress();
    var total = Slice.getMissions().length;
    var current = s.missionStep + 1;
    el('mission-clock').textContent = Slice.formatElapsed();
    el('mission-index').textContent = String(current).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    el('mission-icon').src = 'assets/icons/missions/mission-' + missionIcon(s.missionStep) + '.svg';
    el('mission-progress').style.width = (current / total * 100) + '%';
    el('mission-code').textContent = mission.code;
    el('mission-title').textContent = mission.title;
    el('mission-action-fill').style.width = progress.percent + '%';
    el('mission-action-label').textContent = progress.label;
    el('directive-copy').textContent = guide && guide.interlude ? guide.message : mission.brief;
    el('directive-hint').textContent = guide && guide.interlude
      ? '这段时间没有新系统或强制目标。继续操作、观察流量，下一项指令会自动出现。'
      : mission.hint;
    el('directive-progress-fill').style.width = progress.percent + '%';
    el('directive-progress-label').textContent = progress.label;
    el('canvas-focus-label').textContent = s.focusTier === null
      ? '焦点未建立'
      : '焦点 ×' + Slice.getProductionMultiplier(s.focusTier).toFixed(2) + ' · ' + GC.TIERS[s.focusTier].nameZh;

    var dock = el('guide-dock');
    var dockLabel = el('guide-dock-label');
    dock.classList.toggle('resting', !!(guide && guide.interlude));
    dock.classList.toggle('attention', guideCollapsed && !(guide && guide.interlude));
    if (guide && guide.interlude) {
      dockLabel.textContent = '自由观测 ' + Math.ceil(guide.remaining) + 's';
      dock.setAttribute('aria-label', '自由观测中，下一项引导将在' + Math.ceil(guide.remaining) + '秒后出现');
    } else if (guideCollapsed) {
      dockLabel.textContent = '打开引导';
      dock.setAttribute('aria-label', '打开场景引导');
    } else {
      dockLabel.textContent = '已展开';
      dock.setAttribute('aria-label', '收起场景引导');
    }

    if (lastMissionStep !== null && lastMissionStep !== s.missionStep) {
      guideCollapsed = false;
      lastGuideStep = null;
      var strip = document.querySelector('.mission-strip');
      strip.classList.remove('mission-enter');
      void strip.offsetWidth;
      strip.classList.add('mission-enter');
      showToast('新指令已写入：' + mission.title, false);
    }
    var researchReady = s.missionStep === 6 && GS.canResearch(2);
    if (researchReady && !lastResearchReady && s.guide.researchGoalAcknowledged) {
      guideCollapsed = false;
      lastGuideStep = null;
      playSound('ui-research-threshold');
      showToast('研究阈值已满足：现在可以揭示原子层', true);
    }
    lastResearchReady = researchReady;
    if (s.missionStep >= 3 && !flowUserToggled && !flowAutoExpanded) {
      var monitor = el('flow-monitor');
      monitor.classList.remove('collapsed');
      el('flow-monitor-toggle').textContent = '—';
      el('flow-monitor-toggle').setAttribute('aria-expanded', 'true');
      el('flow-monitor-toggle').setAttribute('aria-label', '最小化物质流量监视器');
      flowAutoExpanded = true;
    }
    lastMissionStep = s.missionStep;

    var entropy = el('entropy-label');
    if (s.enemy.status === 'warning') {
      entropy.textContent = 'RISING';
      entropy.style.color = 'var(--amber)';
    } else if (s.enemy.status === 'active') {
      entropy.textContent = 'CONTACT';
      entropy.style.color = 'var(--red)';
    } else if (s.enemy.status === 'resolved') {
      entropy.textContent = 'RESIDUAL';
      entropy.style.color = 'var(--violet)';
    } else {
      entropy.textContent = 'NOMINAL';
      entropy.style.color = '';
    }
  }

  function updateResearch() {
    var rp = GS.getRP();
    var sliceState = GS.getSlice();
    var max = GS.getMaxResearchedTier();
    var next = max + 1;
    el('rb-rp').textContent = fmt(rp, 1);

    var breakdown = getResearchBreakdown();
    var totalRps = breakdown.total;
    recordResearchRate(totalRps);
    el('rb-hint').textContent = totalRps > 0 ? '+' + fmt(totalRps, 2) + ' / SEC' : '等待资源响应';

    var details = el('research-breakdown');
    var detailsButton = el('research-details-toggle');
    detailsButton.disabled = sliceState.enabled && sliceState.missionStep < 5;
    if (detailsButton.disabled && !details.hidden) {
      details.hidden = true;
      detailsButton.setAttribute('aria-expanded', 'false');
      detailsButton.textContent = '研究构成';
    }
    var rows = breakdown.rows.map(function (row) {
      return '<div class="research-breakdown-row"><span style="color:' + row.meta.color + '">' + row.meta.nameZh + '</span><code>α' + row.tierId + '·√' + fmt(row.count, 1) + '</code><b>+' + fmt(row.rate, 3) + ' RP/s</b></div>';
    }).join('');
    var substitution = breakdown.rows.length
      ? breakdown.rows.map(function (row) { return 'α' + row.tierId + '√' + fmt(row.count, 1); }).join(' + ')
      : '等待可观测库存';
    var phaseSeed = Math.floor((GS.getState().tickCount || 0) / 5);
    var phaseBits = Array.from({ length: 24 }, function (_, index) { return ((phaseSeed + index * 7) % 11 < 5 ? '1' : '0'); }).join('');
    details.innerHTML = '<section class="research-console"><div class="research-equation"><span>OBSERVER EQUATION / LIVE</span><strong>Ṙ = κ · Σ αᵢ√Nᵢ</strong><code>κ(' + fmt(breakdown.multiplier, 2) + ') · [' + substitution + '] = ' + fmt(totalRps, 4) + ' RP·s⁻¹</code></div>' +
      '<div class="research-signal"><span>Ψ(t) / ' + phaseBits + '</span>' + sparkline(researchHistory, 180, 34) + '<b>ΔRP = ∫Ṙ dt</b></div></section>' +
      '<div class="research-breakdown-head"><span>各层贡献</span><b>总速率 +' + fmt(totalRps, 3) + ' RP/s</b></div>' +
      (rows || '<p class="research-breakdown-empty">稳定资源出现后，研究通道会开始增长。</p>') +
      '<p class="research-formula">读法：Nᵢ 是每层当前库存，αᵢ 是层级系数，κ 是法则倍率。平方根让囤积仍有收益，但边际贡献逐渐下降；上方曲线是最近 60 秒的真实研究速率，不是装饰动画。</p>';

    var button = el('btn-research-global');
    if (next < GC.TIERS.length && next <= 2) {
      var cost = GS.getResearchCost(next);
      el('rb-fill').style.width = clamp(rp / cost * 100, 0, 100) + '%';
      el('rb-next-label').textContent = '下一目标：' + GC.TIERS[next].nameZh + ' / ' + fmt(rp, 0) + ' / ' + cost + ' RP';
      button.dataset.tier = next;
      button.textContent = '研究' + GC.TIERS[next].nameZh + '层';
      button.disabled = !GS.canResearch(next);
    } else {
      el('rb-fill').style.width = '100%';
      el('rb-next-label').textContent = '原子层已稳定 / 分子层留待下一竖切';
      button.textContent = '已达观测边界';
      button.disabled = true;
    }
  }

  function updateCard(tierId) {
    var s = GS.getSlice();
    var tier = GS.getTier(tierId);
    var tpl = GC.TIERS[tierId];
    var card = el('card-' + tierId);
    var unlocked = tier.researched;
    var nextResearchable = tierId === GS.getMaxResearchedTier() + 1 && tierId <= 2;

    if (tierId > 2 && s.enabled) {
      card.className = 'tier-card locked horizon-card';
      return;
    }

    card.className = 'tier-card';
    if (!unlocked) card.classList.add(nextResearchable ? 'researchable' : 'locked');
    if (unlocked && s.focusTier === tierId) card.classList.add('focused');
    if (unlocked && s.reserveTier === tierId) card.classList.add('reserved');

    var count = el('count-' + tierId);
    var bars = el('bars-' + tierId);
    var net = el('net-' + tierId);
    var modifiers = el('modifiers-' + tierId);
    var stateLabel = el('state-' + tierId);
    var locked = card.querySelector('.tc-locked');
    var producerButton = el('btn-prod-' + tierId);
    var synthButton = el('btn-synth-' + tierId);
    var researchButton = el('btn-research-' + tierId);
    var focusButton = el('btn-focus-' + tierId);
    var reserveButton = el('btn-reserve-' + tierId);

    if (!unlocked) {
      if (count) count.style.display = 'none';
      if (stateLabel) stateLabel.style.display = 'none';
      if (bars) bars.style.display = 'none';
      if (net) net.style.display = 'none';
      if (modifiers) modifiers.style.display = 'none';
      if (producerButton) producerButton.style.display = 'none';
      if (synthButton) synthButton.style.display = 'none';
      if (focusButton) focusButton.style.display = 'none';
      if (reserveButton) reserveButton.style.display = 'none';
      if (locked) {
        locked.style.display = '';
        locked.textContent = nextResearchable ? '研究需求 / ' + GS.getResearchCost(tierId) + ' RP' : '未揭示 / NO SIGNAL';
      }
      if (researchButton) {
        researchButton.style.display = nextResearchable ? '' : 'none';
        researchButton.textContent = '研究' + tpl.nameZh + ' / ' + fmt(GS.getRP(), 0) + ' / ' + GS.getResearchCost(tierId);
        researchButton.disabled = !GS.canResearch(tierId);
      }
      return;
    }

    if (locked) locked.style.display = 'none';
    if (count) { count.style.display = ''; count.textContent = fmt(tier.count, tierId <= 2 ? 2 : 0); }
    if (stateLabel) stateLabel.style.display = '';
    if (bars) bars.style.display = '';
    if (net) net.style.display = '';
    if (modifiers) modifiers.style.display = '';
    if (researchButton) researchButton.style.display = 'none';

    var rates = getRates(tierId);
    updateBars(tierId, rates);
    updateNet(tierId, rates);
    updateResourceState(tierId, rates);
    updateModifiers(tierId);

    if (producerButton && tpl.producerBaseCost > 0) {
      var producerCost = GS.getProducerCost(tierId);
      producerButton.style.display = '';
      producerButton.textContent = '增设生产单元 / ' + fmtInt(producerCost) + ' ' + tpl.nameZh;
      producerButton.disabled = tier.count < producerCost || !Slice.canBuyProducer(tierId);
    } else if (producerButton) producerButton.style.display = 'none';

    if (synthButton && tierId >= 1 && tierId <= 2) {
      var synthCost = GS.getSynthCost(tierId);
      var batch = GS.getSynthBatchSize();
      synthButton.style.display = '';
      synthButton.textContent = GC.TIERS[tierId - 1].nameZh + ' → ' + tpl.nameZh + ' / ' + fmtInt(synthCost * batch);
      synthButton.disabled = GS.getTier(tierId - 1).count < synthCost * batch || !Slice.canSynthesize(tierId);
    } else if (synthButton) synthButton.style.display = 'none';

    if (focusButton) {
      focusButton.style.display = s.missionStep >= 3 ? '' : 'none';
      focusButton.textContent = s.focusTier === tierId ? '焦点已锁定' : '聚焦';
      focusButton.disabled = s.missionStep < 3 || s.focusTier === tierId;
      focusButton.classList.toggle('active', s.focusTier === tierId);
      var predictedFocus = 1.8;
      if (s.law === 'expansion') predictedFocus += GC.FIRST_CONTACT.focusLawBonus;
      if (s.law === 'conservation' && s.reserveTier === tierId) predictedFocus *= 1.2;
      focusButton.dataset.tooltipTitle = '宇宙焦点';
      focusButton.dataset.tooltip = '全宇宙同时只能聚焦一个层级。移动到' + tpl.nameZh + '后，该层当前生产倍率变为 ×' + predictedFocus.toFixed(2) + '；焦点位置也会影响部分敌人处理条件。迁移不消耗资源。';
    }
    if (reserveButton) {
      reserveButton.style.display = s.missionStep >= 8 ? '' : 'none';
      reserveButton.textContent = s.reserveTier === tierId ? '保护已建立' : '保护';
      reserveButton.disabled = s.missionStep < 8;
      reserveButton.classList.toggle('active', s.reserveTier === tierId);
      reserveButton.dataset.tooltipTitle = '储备保护线';
      reserveButton.dataset.tooltip = '为' + tpl.nameZh + '保留最低库存。高层代谢和部分敌人损失不会突破这条线；当前只能保护一个层级。';
    }
  }

  function updateModifiers(tierId) {
    var node = el('modifiers-' + tierId);
    if (!node) return;
    var s = GS.getSlice();
    var parts = [];
    if (s.focusTier === tierId) {
      parts.push('<span class="tc-modifier focus">焦点生产 ×' + Slice.getProductionMultiplier(tierId).toFixed(2) + '</span>');
    }
    if (s.reserveTier === tierId) {
      parts.push('<span class="tc-modifier reserve">保护底线 ' + fmt(Slice.getReserveFloor(tierId), 0) + '</span>');
    }
    node.innerHTML = parts.join('');
  }

  function updateBars(tierId, rates) {
    var max = Math.max(rates.production, rates.demand, 0.01);
    el('bars-' + tierId).innerHTML =
      '<div class="tc-bar-row"><span class="tc-bar-label">产</span><div class="tc-bar-track"><div class="tc-bar-fill prod" style="width:' + rates.production / max * 100 + '%"></div></div><span class="tc-bar-val prod-text">+' + fmt(rates.production, 2) + '/s</span></div>' +
      '<div class="tc-bar-row"><span class="tc-bar-label">耗</span><div class="tc-bar-track"><div class="tc-bar-fill demand" style="width:' + rates.demand / max * 100 + '%"></div></div><span class="tc-bar-val demand-text">-' + fmt(rates.demand, 2) + '/s</span></div>';
  }

  function updateNet(tierId, rates) {
    var sign = rates.net >= 0 ? '+' : '';
    var node = el('net-' + tierId);
    node.textContent = 'NET ' + sign + (rates.net < 0 ? '-' : '') + fmt(Math.abs(rates.net), 2) + ' / SEC';
    node.className = 'tc-net ' + (rates.net >= 0 ? 'pos' : 'neg');
  }

  function updateResourceState(tierId, rates) {
    var tier = GS.getTier(tierId);
    var node = el('state-' + tierId);
    if (!node) return;
    var floor = Slice.getReserveFloor(tierId);
    var producerCost = tier.producerBaseCost > 0 ? GS.getProducerCost(tierId) : 10;
    var label = '循环';
    var cls = '';
    if (rates.net < -0.001 || (floor > 0 && tier.count <= floor * 1.15)) { label = '短缺'; cls = 'shortage'; }
    else if (tier.count > Math.max(20, producerCost * 5)) { label = '过载'; cls = 'overload'; }
    node.textContent = label;
    node.className = cls;
  }

  function updateEventPanel() {
    var s = GS.getSlice();
    var content = el('event-content');
    var status = el('event-status');
    var options = null;
    var kind = '';

    if (s.flags.lawDecisionOpen && !s.law) {
      options = Slice.getLawOptions(); kind = 'law';
      status.textContent = '需要决策'; status.className = 'status-chip';
    } else if (s.flags.preparationOpen && !s.preparation.completed) {
      status.textContent = '接触准备'; status.className = 'status-chip';
      if (s.preparation.id) {
        var selectedPreparation = Slice.getPreparationOptions().find(function (option) { return option.id === s.preparation.id; });
        var conditionRows = Slice.getPreparationConditionState().map(function (condition) {
          return '<li class="' + (condition.met ? 'ok' : '') + '"><span>' + condition.label + '</span><b>' + condition.value + '</b></li>';
        }).join('');
        var prepPercent = clamp(s.preparation.progress / GC.FIRST_CONTACT.preparationSeconds * 100, 0, 100);
        content.innerHTML = '<div class="preparation-active route-' + selectedPreparation.route + '"><span class="choice-top"><strong>' + selectedPreparation.title + '</strong><span>' + selectedPreparation.tag + '</span></span><p>' + selectedPreparation.desc + '</p><div class="progress-block"><span><b>连续稳定</b><em>' + Math.floor(s.preparation.progress) + ' / ' + GC.FIRST_CONTACT.preparationSeconds + ' 秒</em></span><div class="bar"><i style="width:' + prepPercent + '%"></i></div></div><ul class="preparation-conditions">' + conditionRows + '</ul><div class="preparation-effect"><span>完成效果</span><b>' + selectedPreparation.effect + '</b></div></div>';
        return;
      }
      options = Slice.getPreparationOptions(); kind = 'preparation';
    } else if (s.enemy.status === 'active' && !s.enemy.method) {
      status.textContent = '转至接触面板'; status.className = 'status-chip danger';
      content.innerHTML = '<div class="empty-state small"><p>真空水蛭的三种可用处理方案已经在中部并列显示。</p><small>在那里比较成本、持续时间、止损方式与路线记录。</small></div>';
      return;
    } else if (s.flags.coreDecisionOpen && !s.flags.demoComplete) {
      options = Slice.getCoreOptions(); kind = 'core';
      status.textContent = '余像处置'; status.className = 'status-chip';
    }

    if (!options) {
      status.textContent = s.flags.demoComplete ? '已归档' : '空闲';
      status.className = 'status-chip ' + (s.flags.demoComplete ? 'safe' : 'muted');
      if (s.flags.demoComplete) {
        var report = Lore.getFirstContactReport(s, Slice.getRouteRanking());
        content.innerHTML = '<article class="completion-report">' +
          '<div class="completion-kicker"><span>FIRST CONTACT / SEALED</span><b>' + Slice.formatElapsed() + '</b></div>' +
          '<h3>' + report.title + '</h3>' +
          '<div class="completion-signal"><span>主信号</span><strong>' + report.signal + '</strong><small>备选 · ' + report.secondary + '</small></div>' +
          '<div class="completion-records"><span>第一法则<b>' + report.law + '</b></span><span>接触准备<b>' + report.preparation + '</b></span><span>处理方案<b>' + report.method + '</b></span><span>余像用途<b>' + report.disposition + '</b></span><span>累计损失<b>' + fmt(s.enemy.siphoned, 2) + ' 原子</b></span></div>' +
          '<div class="completion-story"><p>' + report.opening + '</p><p>' + report.encounter + '</p><p>' + report.aftermath + '</p></div>' +
          '<p class="completion-closing">' + report.closing + '</p>' +
          '<button id="open-completion-archive" class="btn btn-primary" type="button">查看完整观测档案</button>' +
          '</article>';
        el('open-completion-archive').addEventListener('click', openLoreArchive);
      } else {
        content.innerHTML = '<div class="empty-state small"><p>没有待处理的重要决策。</p><small>事件会保留，不会在离线时过期。</small></div>';
      }
      return;
    }

    var context = kind === 'law'
      ? '<div class="choice-context"><b>已有经验</b><p>你已经使用过焦点、保护线和研究通道。第一法则会强化其中一项，并记录本轮倾向。</p></div>'
      : kind === 'preparation'
        ? '<div class="choice-context"><b>接触前窗口</b><p>准备方案会锁定一项经营目标。条件需要连续保持 30 秒，失效时进度缓慢回退。</p></div>'
        : '';
    content.innerHTML = context + '<div class="choice-list">' + options.map(function (option) {
      var iconSource = kind === 'law'
        ? 'assets/icons/laws/law-' + option.id + '.svg'
        : kind === 'preparation'
          ? 'assets/icons/preparations/preparation-' + option.id + '.svg'
          : 'assets/icons/afterimage-actions/afterimage-' + option.id + '.svg';
      return '<button class="choice-card route-' + option.route + '" data-kind="' + kind + '" data-id="' + option.id + '" ' + (option.disabled ? 'disabled' : '') + '>' +
        '<span class="choice-heading"><img src="' + iconSource + '" alt=""><span class="choice-top"><strong>' + option.title + '</strong><span>' + option.tag + '</span></span></span>' +
        '<p>' + option.desc + '</p>' + (option.requirement ? '<div class="choice-metrics"><span>条件</span><b>' + option.requirement + '</b><span>效果</span><b>' + option.effect + '</b></div>' : '') + '</button>';
    }).join('') + '</div>';

    content.querySelectorAll('.choice-card').forEach(function (button) {
      button.addEventListener('click', function () {
        var actionKind = button.dataset.kind;
        var id = button.dataset.id;
        var changed = false;
        if (actionKind === 'law') changed = Slice.chooseLaw(id);
        if (actionKind === 'preparation') changed = Slice.choosePreparation(id);
        if (actionKind === 'core') changed = Slice.chooseCoreDisposition(id);
        if (changed) {
          if (actionKind === 'core') playSound('afterimage-' + id);
          showActionFeedback(button, button.querySelector('strong').textContent + ' · 已记录', 'green', true);
        }
        refreshAll();
      });
    });
  }

  function updateContact() {
    var s = GS.getSlice();
    var enemy = s.enemy;
    var status = el('contact-status');
    var content = el('contact-content');
    var overlay = el('anomaly-overlay');
    var overlayState = el('anomaly-overlay-state');
    var contactVisible = enemy.status === 'warning' || enemy.status === 'active';

    el('cosmos-stage').classList.toggle('reverse-contact', contactVisible);
    if (lastEnemyStatus !== null && lastEnemyStatus !== enemy.status) {
      if (enemy.status === 'warning') playSound('contact-warning');
      if (enemy.status === 'active') playSound('contact-attach');
    }
    lastEnemyStatus = enemy.status;

    overlay.hidden = enemy.status === 'hidden';

    if (enemy.status === 'hidden') {
      status.textContent = '未发现'; status.className = 'status-chip muted';
      content.innerHTML = '<div class="empty-state"><span class="reticle-icon"></span><p>当前视界内没有稳定敌对结构。</p><small>第一次法则确定后，未被选择的可能性会开始积累。</small></div>';
      return;
    }

    if (enemy.status === 'warning') {
      status.textContent = '征兆 / ' + Math.ceil(enemy.warningRemaining) + 's'; status.className = 'status-chip danger';
      overlayState.textContent = '附着倒计时 ' + Math.ceil(enemy.warningRemaining) + ' 秒';
      var warningDuration = Slice.getWarningDuration();
      content.innerHTML = '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>原子层 / 新增产出与可用库存</small></div></div><div class="threat-stats"><div class="threat-stat"><span>目标</span><b>原子 T2</b></div><div class="threat-stat"><span>截取速率</span><b>' + GC.FIRST_CONTACT.enemyDrainPerSecond.toFixed(2) + '/s</b></div><div class="threat-stat"><span>损失上限</span><b>' + fmt(Slice.getEnemyLossCap(), 1) + '</b></div></div></div><div class="progress-block"><span><b>形成进度</b><em>' + Math.round((1 - enemy.warningRemaining / warningDuration) * 100) + '%</em></span><div class="bar"><i style="width:' + clamp((1 - enemy.warningRemaining / warningDuration) * 100, 0, 100) + '%"></i></div><button id="begin-contact-btn" class="btn btn-primary">提前建立接触</button></div></div>';
      el('begin-contact-btn').addEventListener('click', function () {
        if (Slice.beginContact()) showActionFeedback(this, '接触已经建立', 'amber', true);
        refreshAll();
      });
      return;
    }

    if (enemy.status === 'active') {
      status.textContent = '接触中'; status.className = 'status-chip danger';
      overlayState.textContent = enemy.method ? '方案：' + methodName(enemy.method) : '等待处理方案';
      if (!enemy.method) {
        content.innerHTML = '<div class="enemy-overview"><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>已附着原子层 · 当前以 ' + GC.FIRST_CONTACT.enemyDrainPerSecond.toFixed(2) + ' 原子/秒截取</small></div></div><div class="threat-stats"><div class="threat-stat"><span>已截取</span><b>' + fmt(enemy.siphoned, 2) + '</b></div><div class="threat-stat"><span>损失上限</span><b>' + fmt(Slice.getEnemyLossCap(), 1) + '</b></div><div class="threat-stat"><span>可用方案</span><b>3 / 4</b></div></div></div>' + buildEnemyMethodChooser();
        bindEnemyMethodChooser();
        return;
      }
      var action = buildEnemyAction(enemy, s);
      content.innerHTML = '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>已附着 / 原子层</small></div></div><div class="threat-stats"><div class="threat-stat"><span>已截取</span><b>' + fmt(enemy.siphoned, 2) + '</b></div><div class="threat-stat"><span>损失上限</span><b>' + fmt(Slice.getEnemyLossCap(), 1) + '</b></div><div class="threat-stat"><span>处理方案</span><b>' + (enemy.method ? methodName(enemy.method) : '未选择') + '</b></div></div></div>' + action + '</div>';
      bindEnemyAction(enemy);
      return;
    }

    status.textContent = s.flags.demoComplete ? '已归档' : '余像稳定';
    status.className = 'status-chip safe';
    overlayState.textContent = '核心余像 / 稳定';
    content.innerHTML = '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">R</span><div><strong>核心余像</strong><small>处理结果：' + methodName(enemy.resolution) + '</small></div></div><div class="threat-stats"><div class="threat-stat"><span>累计截取</span><b>' + fmt(enemy.siphoned, 2) + '</b></div><div class="threat-stat"><span>核心状态</span><b>稳定</b></div><div class="threat-stat"><span>记录</span><b>' + routeNameForMethod(enemy.resolution) + '</b></div></div></div><div class="empty-state small"><p>' + (s.flags.demoComplete ? '余像处置完成，路线信号已更新。' : '请在决策队列中选择余像用途。') + '</p><small>敌人带走的资源已经转化成可追踪结构。</small></div></div>';
  }

  function buildEnemyMethodChooser() {
    return '<div class="enemy-method-intro"><b>选择处理方案</b><span>选择后锁定，资源代价与路线记录会立即生效。</span></div><div class="enemy-method-grid">' + Slice.getEnemyMethods().map(function (method) {
      return '<button class="enemy-method-card route-' + method.route + '" type="button" data-method="' + method.id + '" ' + (method.disabled ? 'disabled' : '') + '>' +
        '<span class="choice-heading"><img src="assets/icons/enemy-methods/method-' + method.id + '.svg" alt=""><span class="choice-top"><strong>' + method.title + '</strong><span>' + method.tag + '</span></span></span>' +
        '<p>' + method.desc + '</p>' +
        '<div class="method-metrics"><span><i>成本</i>' + method.cost + '</span><span><i>完成</i>' + method.duration + '</span><span><i>止损</i>' + method.loss + '</span></div>' +
        '</button>';
    }).join('') + '</div>';
  }

  function bindEnemyMethodChooser() {
    el('contact-content').querySelectorAll('.enemy-method-card').forEach(function (button) {
      button.addEventListener('click', function () {
        if (Slice.chooseEnemyMethod(button.dataset.method)) {
          playSound('contact-' + button.dataset.method);
          showActionFeedback(button, button.querySelector('strong').textContent + '方案已锁定', 'amber', true);
        }
        refreshAll();
      });
    });
  }

  function buildEnemyAction(enemy, s) {
    if (!enemy.method) return '<div class="empty-state small"><p>请选择接触方案。</p><small>四种方向使用同一资源链，第四种将在后续周目开放。</small></div>';
    var progress = Math.round(enemy.progress);
    if (enemy.method === 'overload') {
      var overloadCost = Slice.getOverloadCost();
      return '<div class="progress-block"><span><b>核心过载</b><em>' + progress + '%</em></span><div class="bar"><i style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (GS.getTier(1).count >= overloadCost ? 'ok' : '') + '">每次脉冲消耗 ' + overloadCost + ' 核子</li><li>已注入 ' + enemy.overloadPulses + ' / ' + GC.FIRST_CONTACT.overloadPulses + ' 次</li></ul><button id="enemy-action-btn" class="btn btn-primary" ' + (GS.getTier(1).count < overloadCost ? 'disabled' : '') + '>注入过载脉冲</button></div>';
    }
    if (enemy.method === 'cutoff') {
      var reserveOk = s.reserveTier === 1;
      var focusOk = s.focusTier !== 2;
      return '<div class="progress-block"><span><b>断供稳定</b><em>' + progress + '%</em></span><div class="bar"><i style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (reserveOk ? 'ok' : '') + '">' + (reserveOk ? '已完成' : '需要') + '：保护核子层</li><li class="' + (focusOk ? 'ok' : '') + '">' + (focusOk ? '已完成' : '需要') + '：焦点离开原子层</li><li class="' + (enemy.isolationActive ? 'ok' : '') + '">' + (enemy.isolationActive ? '隔离正在运行' : '隔离尚未开启') + '</li></ul><button id="enemy-action-btn" class="btn btn-primary">' + (enemy.isolationActive ? '解除原子隔离' : '开启原子隔离') + '</button></div>';
    }
    return '<div class="progress-block"><span><b>完整样本</b><em>' + progress + '%</em></span><div class="bar"><i style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (s.focusTier === 2 ? 'ok' : '') + '">' + (s.focusTier === 2 ? '原子层处于焦点中' : '请把焦点移动到原子层') + '</li><li>样本预算 ' + fmt(Math.max(0, enemy.siphoned - (enemy.methodStartSiphoned || 0)), 2) + ' / ' + Slice.getObserveGoal() + ' 原子</li><li>达到预算后自动隔离，不会继续扩大损失</li></ul></div>';
  }

  function bindEnemyAction(enemy) {
    var button = el('enemy-action-btn');
    if (!button) return;
    button.addEventListener('click', function () {
      var changed = false;
      if (enemy.method === 'overload') changed = Slice.pulseOverload();
      if (enemy.method === 'cutoff') changed = Slice.toggleIsolation();
      if (changed) {
        playSound(enemy.method === 'overload' ? 'contact-overload' : 'contact-cutoff');
        showActionFeedback(button, enemy.method === 'overload' ? '过载脉冲已注入' : '原子隔离状态已切换', 'amber', false);
      }
      refreshAll();
    });
  }

  function methodName(id) {
    var method = Slice.getEnemyMethods().find(function (item) { return item.id === id; });
    return method ? method.title : '未选择';
  }
  function routeNameForMethod(id) {
    var method = Slice.getEnemyMethods().find(function (item) { return item.id === id; });
    return method ? Slice.getRouteMeta()[method.route].name : '无';
  }

  function updateRoutes() {
    var s = GS.getSlice();
    var meta = Slice.getRouteMeta();
    var ranking = Slice.getRouteRanking();
    var max = Math.max(4, ranking[0] ? ranking[0].score : 0);
    el('route-signals').innerHTML = Object.keys(meta).map(function (id) {
      var score = s.tendencies[id] || 0;
      return '<div class="route-row"><span class="route-name" style="color:' + meta[id].color + '"><img src="assets/icons/routes/route-' + id + '.svg" alt="">' + meta[id].name + '</span><div class="route-meter"><i style="width:' + score / max * 100 + '%;background:' + meta[id].color + '"></i></div><b>' + (score === 0 ? '—' : score) + '</b></div>';
    }).join('');

    var oldSummary = document.querySelector('.route-summary');
    if (oldSummary) oldSummary.remove();
    if (s.flags.demoComplete && ranking.length >= 2) {
      var summary = document.createElement('div');
      summary.className = 'route-summary';
      summary.innerHTML = '<span>当前主信号 / 备选信号</span><strong>' + ranking[0].meta.ending + ' · ' + ranking[1].meta.ending + '</strong>';
      el('route-signals').after(summary);
    }
  }

  function updateLog() {
    var logs = GS.getSlice().logs;
    var signature = logs.length + ':' + (logs.length ? logs[logs.length - 1].text : '');
    if (signature === lastLogSignature) return;
    lastLogSignature = signature;
    var node = el('observation-log');
    node.innerHTML = logs.slice().reverse().map(function (entry) {
      var seconds = Math.floor(entry.time);
      var stamp = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
      var warnClass = entry.channel === 'WARN' || entry.channel === 'CONTACT' ? 'warn' : '';
      return '<div class="log-entry"><time>' + stamp + '</time><b class="' + warnClass + '">' + entry.channel + '</b><p>' + entry.text + '</p></div>';
    }).join('');
    node.scrollTop = 0;
  }

  function updateFlowMonitor() {
    var rows = [];
    for (var i = 0; i <= 2; i++) {
      var tier = GS.getTier(i);
      if (!tier || !tier.researched) continue;
      var rates = getRates(i);
      rows.push({ tierId: i, tier: tier, rates: rates, meta: GC.TIERS[i] });
    }

    var flowRows = rows.map(function (row) {
      var netSign = row.rates.net >= 0 ? '+' : '-';
      var positive = row.rates.net > 0.001;
      var negative = row.rates.net < -0.001;
      var flowState = positive ? 'positive' : (negative ? 'negative' : 'balanced');
      var scale = Math.max(0.01, row.rates.production, row.rates.demand);
      return '<div class="flow-row ' + flowState + '" data-tier="' + row.tierId + '">' +
        '<div class="flow-identity"><img src="assets/icons/tiers/tier-' + row.meta.name.toLowerCase() + '.svg" alt=""><span><b style="color:' + row.meta.color + '">' + row.meta.nameZh + '</b><small>库存 ' + fmt(row.tier.count, 1) + '</small></span></div>' +
        '<div class="flow-equation"><span><i class="prod"></i>产出 <b>+' + fmt(row.rates.production, 2) + '</b></span><span><i class="demand"></i>消耗 <b>−' + fmt(row.rates.demand, 2) + '</b></span><div><i class="prod" style="width:' + row.rates.production / scale * 100 + '%"></i><i class="demand" style="width:' + row.rates.demand / scale * 100 + '%"></i></div></div>' +
        '<div class="flow-result"><span>' + (positive ? '有盈余' : (negative ? '正在亏空' : '暂时持平')) + '</span><b>' + netSign + fmt(Math.abs(row.rates.net), 2) + '/s</b><small>' + fmt(row.rates.production, 2) + ' − ' + fmt(row.rates.demand, 2) + '</small></div></div>';
    }).join('');
    var research = getResearchBreakdown();
    recordResearchRate(research.total);
    var prior = researchHistory.length > 10 ? researchHistory[researchHistory.length - 11].rate : (researchHistory[0] ? researchHistory[0].rate : research.total);
    var change = research.total - prior;
    el('flow-chart').innerHTML = flowRows;
    el('research-trend').innerHTML = '<div class="research-trend-copy"><span>研究速率 / 最近 60 秒</span><strong>+' + fmt(research.total, 3) + ' RP/s</strong><small class="' + (change >= 0 ? 'up' : 'down') + '">近 10 秒 ' + (change >= 0 ? '▲ +' : '▼ ') + fmt(Math.abs(change), 3) + '</small></div>' + sparkline(researchHistory, 240, 46);

    var s = GS.getSlice();
    var checklist = el('stability-checklist');
    var conditions = Slice.getStabilityConditionState(s.missionStep);
    if (!conditions.length) {
      checklist.hidden = true;
      checklist.innerHTML = '';
    } else {
      var met = conditions.filter(function (condition) { return condition.met; }).length;
      var progress = Slice.getMissionProgress();
      checklist.hidden = false;
      checklist.innerHTML = '<header><span>STEADY-STATE GATE</span><strong>稳态判定 ' + met + ' / ' + conditions.length + '</strong><small>' + (met === conditions.length ? '全部成立 · 连续计时中' : '全部同时成立后才开始计时') + '</small></header><div class="stability-rows">' + conditions.map(function (condition) {
        return '<div class="stability-row ' + (condition.met ? 'ok' : '') + '"><i>' + (condition.met ? '✓' : '!') + '</i><span><b>' + condition.label + '</b><small>' + (condition.met ? '条件成立' : condition.fix) + '</small></span><em>' + condition.value + '</em></div>';
      }).join('') + '</div><div class="stability-timer"><span>连续记录</span><b>' + progress.label + '</b><div><i style="width:' + progress.percent + '%"></i></div></div>';
    }
  }

  function getGuideTarget(s) {
    var step = s.missionStep;
    if (step === 0) return { selector: '#cosmos-stage', center: true };
    if (step === 1) return { selector: '#btn-prod-0' };
    if (step === 2) return { selector: '#btn-synth-1' };
    if (step === 3) {
      if (GS.getTier(1).producers < 1 && GS.getTier(1).count < GS.getProducerCost(1)) return { selector: '#btn-synth-1' };
      if (GS.getTier(1).producers < 1) return { selector: '#btn-prod-1' };
      return { selector: '#btn-focus-1' };
    }
    if (step === 4 || step === 9) return { selector: '#stability-checklist' };
    if (step === 5) return { selector: '#research-details-toggle' };
    if (step === 6) return { selector: GS.canResearch(2) ? '#btn-research-global' : '.research-bar' };
    if (step === 7) return { selector: GS.getTier(2).totalEver < 18 ? '#btn-synth-2' : '#btn-prod-2' };
    if (step === 8) return { selector: '#btn-reserve-1' };
    if (step === 10 || step === 11 || step === 14) return { selector: '#event-panel' };
    if (step === 12 || step === 13) return { selector: '#contact-panel' };
    if (step === 15) return { selector: '#event-panel' };
    return { selector: '#route-panel' };
  }

  function updateGuide() {
    var layer = el('guide-layer');
    var guide = Slice.getGuideState();
    if (guide && guide.interlude) {
      layer.hidden = true;
      lastGuideStep = null;
      return;
    }
    if (guideCollapsed) {
      layer.hidden = true;
      return;
    }
    layer.hidden = false;

    var s = GS.getSlice();
    var mission = Slice.getMission();
    var progress = Slice.getMissionProgress();
    var total = Slice.getMissions().length;
    el('guide-step-label').textContent = '引导 ' + String(s.missionStep + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    el('guide-title').textContent = mission.title;
    el('guide-world').textContent = mission.world || mission.hint;
    el('guide-action-copy').textContent = mission.action || mission.brief;
    el('guide-progress-fill').style.width = progress.percent + '%';
    el('guide-progress-label').textContent = progress.label;
    var returnButton = el('guide-return');
    var needsWorkspace = (s.missionStep === 4 || s.missionStep === 9) && progress.percent < 100;
    var needsResearchWait = s.missionStep === 6 && !GS.canResearch(2);
    returnButton.hidden = !(needsWorkspace || needsResearchWait);
    returnButton.textContent = needsResearchWait ? '明白，返回主界面积累' : '返回主界面调整资源';

    var descriptor = getGuideTarget(s);
    var target = document.querySelector(descriptor.selector);
    if (!target) return;

    var stepChanged = lastGuideStep !== s.missionStep;
    lastGuideStep = s.missionStep;
    var rect = target.getBoundingClientRect();
    if (stepChanged && (rect.bottom < 8 || rect.top > window.innerHeight - 8)) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(positionGuide, 360);
    }
    positionGuide();
  }

  function animateGuideToDock() {
    var callout = el('guide-callout');
    var dock = el('guide-dock');
    if (!callout || !dock || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var from = callout.getBoundingClientRect();
    var to = dock.getBoundingClientRect();
    var ghost = document.createElement('div');
    ghost.className = 'guide-transfer';
    ghost.textContent = '场景引导';
    ghost.style.left = from.left + 'px';
    ghost.style.top = from.top + 'px';
    ghost.style.width = from.width + 'px';
    ghost.style.height = from.height + 'px';
    document.body.appendChild(ghost);
    var dx = to.left + to.width / 2 - (from.left + from.width / 2);
    var dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.12)', opacity: 0.15 },
    ], { duration: 520, easing: 'cubic-bezier(.2,.72,.16,1)', fill: 'forwards' });
    setTimeout(function () {
      ghost.remove();
      dock.classList.add('dock-arrival');
      setTimeout(function () { dock.classList.remove('dock-arrival'); }, 700);
    }, 530);
  }

  function getGuideRect(target, centerOnly) {
    var rect = target.getBoundingClientRect();
    if (!centerOnly) return rect;
    var size = Math.min(174, rect.width - 30, rect.height - 30);
    return {
      left: rect.left + (rect.width - size) / 2,
      right: rect.left + (rect.width + size) / 2,
      top: rect.top + (rect.height - size) / 2,
      bottom: rect.top + (rect.height + size) / 2,
      width: size,
      height: size,
    };
  }

  function setGuideBox(node, left, top, width, height) {
    node.style.left = Math.max(0, left) + 'px';
    node.style.top = Math.max(0, top) + 'px';
    node.style.width = Math.max(0, width) + 'px';
    node.style.height = Math.max(0, height) + 'px';
  }

  function positionGuide() {
    if (guideCollapsed || el('guide-layer').hidden) return;
    var descriptor = getGuideTarget(GS.getSlice());
    var target = document.querySelector(descriptor.selector);
    if (!target) return;
    var rect = getGuideRect(target, descriptor.center);
    var gap = 7;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    setGuideBox(document.querySelector('.guide-dim-top'), 0, 0, vw, rect.top - gap);
    setGuideBox(document.querySelector('.guide-dim-bottom'), 0, rect.bottom + gap, vw, vh - rect.bottom - gap);
    setGuideBox(document.querySelector('.guide-dim-left'), 0, rect.top - gap, rect.left - gap, rect.height + gap * 2);
    setGuideBox(document.querySelector('.guide-dim-right'), rect.right + gap, rect.top - gap, vw - rect.right - gap, rect.height + gap * 2);

    var ring = el('guide-target-ring');
    setGuideBox(ring, rect.left - gap, rect.top - gap, rect.width + gap * 2, rect.height + gap * 2);

    var callout = el('guide-callout');
    var cw = Math.min(316, vw - 20);
    var ch = callout.offsetHeight || 220;
    var offset = 13;
    var left;
    var top;
    if (vw - rect.right >= cw + offset + 8) {
      left = rect.right + offset;
      top = clamp(rect.top, 8, vh - ch - 8);
    } else if (rect.left >= cw + offset + 8) {
      left = rect.left - cw - offset;
      top = clamp(rect.top, 8, vh - ch - 8);
    } else if (vh - rect.bottom >= ch + offset + 8) {
      left = clamp(rect.left + rect.width / 2 - cw / 2, 8, vw - cw - 8);
      top = rect.bottom + offset;
    } else {
      left = clamp(rect.left + rect.width / 2 - cw / 2, 8, vw - cw - 8);
      top = Math.max(8, rect.top - ch - offset);
    }
    callout.style.left = left + 'px';
    callout.style.top = top + 'px';
  }

  function showTooltip(target) {
    if (!target || !target.dataset.tooltip) return;
    var tooltip = el('ui-tooltip');
    el('ui-tooltip-title').textContent = target.dataset.tooltipTitle || '操作说明';
    el('ui-tooltip-copy').textContent = target.dataset.tooltip;
    tooltip.hidden = false;
    var rect = target.getBoundingClientRect();
    var width = Math.min(260, window.innerWidth - 18);
    var left = clamp(rect.left + rect.width / 2 - width / 2, 9, window.innerWidth - width - 9);
    var height = tooltip.offsetHeight;
    var top = rect.top - height - 8;
    if (top < 8) top = rect.bottom + 8;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hideTooltip() {
    el('ui-tooltip').hidden = true;
  }

  function showToast(text, major) {
    var toast = el('system-toast');
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = text;
    toast.className = 'system-toast' + (major ? ' major' : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1900);
  }

  function showActionFeedback(target, text, tone, major) {
    if (!target) return;
    var rect = target.getBoundingClientRect();
    var flyout = document.createElement('div');
    flyout.className = 'action-flyout ' + (tone || '');
    flyout.textContent = text;
    flyout.style.left = rect.left + rect.width / 2 + 'px';
    flyout.style.top = Math.max(8, rect.top) + 'px';
    document.body.appendChild(flyout);
    setTimeout(function () { flyout.remove(); }, 1000);

    var host = target.closest('.tier-card, .panel, .research-bar, .cosmos-stage') || target;
    host.classList.remove('upgrade-pulse');
    void host.offsetWidth;
    host.classList.add('upgrade-pulse');
    setTimeout(function () { host.classList.remove('upgrade-pulse'); }, 700);
    if (major) showToast(text, true);
  }

  function updateClickHint() {
    var hint = el('click-hint');
    var clicks = GS.getSlice().stats.canvasClicks;
    hint.innerHTML = clicks < 5
      ? '<span>操作</span> 点击中央光核 · 获得 1 夸克（' + Math.min(clicks, 5) + '/5）'
      : '<span>手动输入</span> 点击中央光核 · 获得 1 夸克';
    hint.style.opacity = clicks >= 3 ? '0.42' : '';
  }

  function updateDiscovery() {
    var card = el('discovery-card');
    var discovery = Slice.getActiveDiscovery();
    if (!discovery) {
      card.hidden = true;
      card.dataset.discoveryId = '';
      return;
    }
    card.hidden = false;
    card.dataset.discoveryId = discovery.id;
    el('discovery-code').textContent = discovery.code;
    el('discovery-title').textContent = discovery.title;
    el('discovery-copy').textContent = discovery.copy;
    el('discovery-note').textContent = discovery.note;
    if (lastDiscoveryId !== discovery.id) {
      lastDiscoveryId = discovery.id;
      playSound('discovery-' + discovery.id);
      card.classList.remove('discovery-enter');
      void card.offsetWidth;
      card.classList.add('discovery-enter');
      showToast(discovery.title + ' · 不会中断当前操作', false);
    }
  }

  function getUnlockedLoreEntries() {
    var state = GS.getSlice();
    var triggered = state.discoveries ? state.discoveries.triggered : [];
    return Lore.getEntries().filter(function (entry) {
      return entry.unlockStep <= state.missionStep && (!entry.discoveryId || triggered.indexOf(entry.discoveryId) !== -1);
    });
  }

  function renderLoreCategories(unlockedEntries) {
    var read = GS.getSlice().archive.read;
    var categories = ['全部'];
    unlockedEntries.forEach(function (entry) { if (categories.indexOf(entry.category) === -1) categories.push(entry.category); });
    el('lore-categories').innerHTML = categories.map(function (category) {
      var matches = category === '全部' ? unlockedEntries : unlockedEntries.filter(function (entry) { return entry.category === category; });
      var unread = matches.filter(function (entry) { return read.indexOf(entry.id) === -1; }).length;
      return '<button type="button" data-category="' + category + '" class="' + (category === loreCategory ? 'active' : '') + '"><span>' + category + '</span><b>' + matches.length + '</b>' + (unread ? '<i aria-label="' + unread + ' 条未读">' + unread + '</i>' : '') + '</button>';
    }).join('');
  }

  function renderLoreArchive(query) {
    if (!Lore) return;
    var state = GS.getSlice();
    var step = state.missionStep;
    var entries = Lore.getEntries();
    var chapters = Lore.getChapters();
    var unlockedEntries = getUnlockedLoreEntries();
    var unlockedChapters = chapters.filter(function (chapter) { return chapter.unlockStep <= step; });
    var needle = (query || '').trim().toLowerCase();
    var visibleEntries = unlockedEntries.filter(function (entry) {
      if (loreCategory !== '全部' && entry.category !== loreCategory) return false;
      if (!needle) return true;
      return [entry.title, entry.subtitle, entry.category, entry.summary, entry.detail].join(' ').toLowerCase().indexOf(needle) !== -1;
    });

    renderLoreCategories(unlockedEntries);
    updateArchiveBadge();
    el('lore-chapter-count').textContent = unlockedChapters.length + ' / ' + chapters.length + ' 已解锁';
    el('lore-term-count').textContent = unlockedEntries.length + ' / ' + entries.length + ' 已解锁';
    el('lore-chapters').innerHTML = unlockedChapters.map(function (chapter) {
      return '<article class="lore-chapter"><span>' + chapter.title + '</span><p>' + chapter.text + '</p></article>';
    }).join('');
    el('lore-entries').innerHTML = visibleEntries.length ? visibleEntries.map(function (entry) {
      var unread = state.archive.read.indexOf(entry.id) === -1;
      return '<details class="lore-entry ' + (unread ? 'unread' : '') + '" data-entry-id="' + entry.id + '"><summary><span>' + entry.category + '</span><strong>' + entry.title + '</strong><small>' + entry.subtitle + '</small><i aria-hidden="true">+</i></summary><div><p>' + entry.summary + '</p><p>' + entry.detail + '</p></div></details>';
    }).join('') : '<div class="lore-empty">没有与“' + escapeHTML(query || '') + '”匹配的已解锁档案。</div>';
    el('lore-entries').querySelectorAll('.lore-entry').forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (!details.open) return;
        Slice.markArchiveRead(details.dataset.entryId);
        details.classList.remove('unread');
        updateArchiveBadge();
        renderLoreCategories(unlockedEntries);
      });
    });
  }

  function updateArchiveBadge() {
    if (!Lore || !el('archive-count')) return;
    var state = GS.getSlice();
    var count = getUnlockedLoreEntries().filter(function (entry) { return state.archive.read.indexOf(entry.id) === -1; }).length;
    el('archive-count').textContent = count;
    el('archive-btn').classList.toggle('has-unread', count > 0);
  }

  function openLoreArchive() {
    var layer = el('lore-layer');
    loreLastFocus = document.activeElement;
    loreCategory = '全部';
    el('lore-search').value = '';
    renderLoreArchive('');
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lore-open');
    el('lore-close').focus();
  }

  function closeLoreArchive() {
    var layer = el('lore-layer');
    if (layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lore-open');
    if (loreLastFocus && loreLastFocus.focus) loreLastFocus.focus();
  }

  function refreshAll() {
    if (!GS.getState()) return;
    updateMission();
    updateResearch();
    for (var i = 0; i < GC.TIERS.length; i++) updateCard(i);
    updateEventPanel();
    updateContact();
    updateRoutes();
    updateLog();
    updateFlowMonitor();
    updateClickHint();
    updateDiscovery();
    updateArchiveBadge();
    updateGuide();
  }

  function bindButtons() {
    for (var i = 0; i <= 5; i++) {
      (function (tierId) {
        var producer = el('btn-prod-' + tierId);
        if (producer) producer.addEventListener('click', function () {
          if (GE.buyProducer(tierId)) {
            playSound('ui-producer-built');
            showActionFeedback(producer, GC.TIERS[tierId].nameZh + '生产单元 +1', 'green', false);
          }
          refreshAll();
        });
        var synth = el('btn-synth-' + tierId);
        if (synth) synth.addEventListener('click', function () {
          if (GE.synthesize(tierId)) showActionFeedback(synth, GC.TIERS[tierId].nameZh + ' +' + GS.getSynthBatchSize(), 'amber', false);
          refreshAll();
        });
        var focus = el('btn-focus-' + tierId);
        if (focus) focus.addEventListener('click', function () {
          if (Slice.setFocus(tierId)) {
            playSound('ui-focus-lock');
            showActionFeedback(focus, '焦点迁移至' + GC.TIERS[tierId].nameZh + ' · 生产加速', 'green', true);
          }
          refreshAll();
        });
        var reserve = el('btn-reserve-' + tierId);
        if (reserve) reserve.addEventListener('click', function () {
          if (Slice.setReserve(tierId)) {
            playSound(GS.getSlice().reserveTier === tierId ? 'ui-reserve-on' : 'ui-focus-release');
            showActionFeedback(reserve, GC.TIERS[tierId].nameZh + '保护线已更新', 'green', false);
          }
          refreshAll();
        });
      })(i);
    }

    for (var tierId = 2; tierId <= 6; tierId++) {
      (function (id) {
        var research = el('btn-research-' + id);
        if (research) research.addEventListener('click', function () {
          if (GE.research(id)) {
            playSound('ui-tier-unlock');
            showActionFeedback(research, GC.TIERS[id].nameZh + '层已揭示', 'amber', true);
          }
          refreshAll();
        });
      })(tierId);
    }

    el('btn-research-global').addEventListener('click', function () {
      var tierId = parseInt(this.dataset.tier, 10);
      if (tierId >= 0 && GE.research(tierId)) {
        playSound('ui-tier-unlock');
        showActionFeedback(this, GC.TIERS[tierId].nameZh + '层已揭示', 'amber', true);
      }
      refreshAll();
    });
    el('research-details-toggle').addEventListener('click', function () {
      var details = el('research-breakdown');
      var opening = details.hidden;
      details.hidden = !opening;
      this.setAttribute('aria-expanded', String(opening));
      this.textContent = opening ? '收起构成' : '研究构成';
      if (opening) {
        Slice.explainResearch();
        showActionFeedback(this, '研究通道构成已展开', 'green', false);
      }
      refreshAll();
    });
    el('cosmos-canvas').addEventListener('click', function (event) {
      window.CanvasRenderer.onClick(event);
      playSound('ui-manual-pulse');
      if (GS.getSlice().stats.canvasClicks <= 5) showActionFeedback(el('cosmos-stage'), '夸克 +1 · 观测响应', 'amber', false);
      refreshAll();
    });

    el('flow-monitor-toggle').addEventListener('click', function (event) {
      event.stopPropagation();
      flowUserToggled = true;
      var monitor = el('flow-monitor');
      var collapsed = monitor.classList.toggle('collapsed');
      this.textContent = collapsed ? '+' : '—';
      this.setAttribute('aria-expanded', String(!collapsed));
      this.setAttribute('aria-label', collapsed ? '展开物质流量监视器' : '最小化物质流量监视器');
    });

    el('guide-collapse').addEventListener('click', function () {
      animateGuideToDock();
      guideCollapsed = true;
      setTimeout(updateGuide, 90);
    });
    el('guide-return').addEventListener('click', function () {
      var step = GS.getSlice().missionStep;
      Slice.acknowledgeGuideGoal(step === 6 ? 'research' : 'stability');
      animateGuideToDock();
      guideCollapsed = true;
      showToast(step === 6 ? '继续积累研究点；达到阈值时会主动提示' : '操作区已恢复；稳态清单会持续显示实时判定', false);
      setTimeout(updateGuide, 90);
      updateMission();
    });
    el('guide-dock').addEventListener('click', function () {
      var guide = Slice.getGuideState();
      if (guide && guide.interlude) {
        showToast('自由观测中，' + Math.ceil(guide.remaining) + ' 秒后接收下一项指令', false);
        return;
      }
      if (!guideCollapsed) animateGuideToDock();
      guideCollapsed = !guideCollapsed;
      lastGuideStep = null;
      setTimeout(updateGuide, guideCollapsed ? 90 : 0);
      updateMission();
    });

    el('archive-btn').addEventListener('click', openLoreArchive);
    el('sound-toggle').addEventListener('click', function () {
      if (!Sound) return;
      Sound.toggleMuted();
      updateSoundToggle();
      if (!Sound.isMuted()) playSound('ui-focus-lock');
    });
    el('lore-close').addEventListener('click', closeLoreArchive);
    el('lore-backdrop').addEventListener('click', closeLoreArchive);
    el('lore-search').addEventListener('input', function () { renderLoreArchive(this.value); });
    el('lore-categories').addEventListener('click', function (event) {
      var button = event.target.closest('[data-category]');
      if (!button) return;
      loreCategory = button.dataset.category;
      renderLoreArchive(el('lore-search').value);
    });
    el('discovery-ack').addEventListener('click', function () {
      var card = el('discovery-card');
      if (Slice.acknowledgeDiscovery(card.dataset.discoveryId)) {
        showToast('偶发发现已写入档案；当前目标不受影响', false);
        updateDiscovery();
        updateArchiveBadge();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !el('lore-layer').hidden) closeLoreArchive();
    });

    document.addEventListener('pointerover', function (event) {
      var target = event.target.closest ? event.target.closest('[data-tooltip]') : null;
      if (target) showTooltip(target);
    });
    document.addEventListener('pointerout', function (event) {
      var target = event.target.closest ? event.target.closest('[data-tooltip]') : null;
      if (target && (!event.relatedTarget || !target.contains(event.relatedTarget))) hideTooltip();
    });
    document.addEventListener('focusin', function (event) {
      var target = event.target.closest ? event.target.closest('[data-tooltip]') : null;
      if (target) showTooltip(target);
    });
    document.addEventListener('focusout', hideTooltip);
    window.addEventListener('resize', positionGuide);
    window.addEventListener('scroll', positionGuide, true);
  }

  function init() {
    bindButtons();
    updateSoundToggle();
    refreshAll();
  }

  window.GameUI = { init: init, refreshAll: refreshAll };
})();
