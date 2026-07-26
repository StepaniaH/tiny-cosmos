// tiny-cosmos — Command interface for the first-contact slice
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;
  var Slice = window.GameSlice;
  var Lore = window.GameLore;
  var Sound = window.GameAudio;
  var I18n = window.GameI18n;
  var lastLogSignature = '';
  var lastMissionStep = null;
  var lastGuideStep = null;
  var lastGuidePhase = null;
  // Normal play begins with contextual guidance visible. Test fixtures keep it
  // collapsed so their deterministic controls are not covered by the callout.
  var guideCollapsed = new URLSearchParams(window.location.search).has('fixture');
  var flowUserToggled = false;
  var flowAutoExpanded = false;
  var toastTimer = null;
  var loreLastFocus = null;
  var logLastFocus = null;
  var lastViewedLogCount = 0;
  var loreCategory = '全部';
  var researchHistory = [];
  var lastResearchSample = -1;
  var lastResearchReady = false;
  var lastDiscoveryId = null;
  var lastEnemyStatus = null;
  var eventRenderKey = '';
  var contactRenderKey = '';
  var observationRenderKey = '';
  var talentRenderKey = '';
  var operationResourceRenderKey = '';
  var currentWorkspace = 'evolution';
  var TERMINAL_WHISPERS = {
    3: '终局疑问 · 边界是门，还是容器？',
    4: '终局疑问 · 永续是否值得放弃远行？',
    5: '终局疑问 · 最后一束光必须由谁看见？',
    6: '终局疑问 · 两侧能否共享一次终结？',
  };

  function el(id) { return document.getElementById(id); }
  function localized(zh, en) { return I18n ? I18n.text(zh, en) : zh; }
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
    if (step === 5 || step === 6 || step === 16 || step === 17 || step === 19 || step === 21) return 'research';
    if (step === 10 || step === 11 || step === 14 || step === 15 || step === 18 || step === 23) return 'decision';
    if (step === 20) return 'flow';
    if (step === 22) return 'production';
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
        demand = higher.count * demandMult * (Slice.getDemandMultiplier ? Slice.getDemandMultiplier(tierId) : 1);
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

  function formatShortDuration(seconds) {
    var rounded = Math.max(0, Math.ceil(seconds || 0));
    if (rounded < 60) return localized(rounded + ' 秒', rounded + 's');
    return localized(
      Math.floor(rounded / 60) + ' 分 ' + String(rounded % 60).padStart(2, '0') + ' 秒',
      Math.floor(rounded / 60) + 'm ' + String(rounded % 60).padStart(2, '0') + 's'
    );
  }

  function setWorkspace(name, announce) {
    if (name !== 'evolution' && name !== 'intervention') return false;
    var changed = currentWorkspace !== name;
    currentWorkspace = name;
    if (changed) {
      lastGuideStep = null;
      lastGuidePhase = null;
    }
    document.body.dataset.workspace = name;
    ['evolution', 'intervention'].forEach(function (workspaceName) {
      var button = el('workspace-' + workspaceName);
      if (!button) return;
      var selected = workspaceName === name;
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if (announce) {
      showToast(name === 'evolution'
        ? localized('已切到观测：资源、流量与研究', 'Observation workspace: resources, flow, and research')
        : localized('已切到干预：决策、天赋与接触', 'Intervention workspace: decisions, talents, and contact'), false);
    }
    setTimeout(positionGuide, 0);
    return true;
  }

  function updateGoalRail() {
    if (!Slice.getObjectiveModel) return;
    var objective = Slice.getObjectiveModel();
    el('campaign-chapter').textContent = objective.chapterTitle;
    el('campaign-chapter-progress').textContent = objective.chapterProgress;
    el('campaign-goal-title').textContent = objective.campaignTitle;
    el('campaign-goal-copy').textContent = objective.campaignCopy;
    el('goal-now-title').textContent = objective.nowTitle;
    el('goal-now-progress').textContent = objective.nowProgress;
    el('goal-next-unlock').textContent = objective.nextUnlock;
    el('goal-optional-action').textContent = objective.optionalAction;
    Array.prototype.forEach.call(el('campaign-phases').children, function (item, index) {
      item.querySelector('span').textContent = objective.phaseLabels[index] || '';
      item.classList.toggle('complete', index < objective.phase);
      item.classList.toggle('current', index === objective.phase);
    });
  }

  function updateOperationResourceStrip() {
    var list = el('operation-resource-list');
    if (!list) return;
    var rows = [];
    for (var tierId = 0; tierId < GC.TIERS.length; tierId += 1) {
      var tier = GS.getTier(tierId);
      if (!tier || !tier.researched) continue;
      var rates = getRates(tierId);
      rows.push({
        tierId: tierId,
        name: GC.TIERS[tierId].nameZh,
        color: GC.TIERS[tierId].color,
        count: tier.count,
        net: rates.net,
      });
    }
    var renderKey = rows.map(function (row) { return row.tierId; }).join('|');
    if (renderKey !== operationResourceRenderKey) {
      operationResourceRenderKey = renderKey;
      list.innerHTML = rows.map(function (row) {
        return '<button class="operation-resource-chip" type="button" data-tier-jump="' + row.tierId + '">' +
          '<span><i style="background:' + row.color + '"></i>T' + row.tierId + ' · ' + row.name + '</span>' +
          '<strong data-operation-count></strong>' +
          '<small data-operation-net></small>' +
          '</button>';
      }).join('');
    }
    rows.forEach(function (row) {
      var button = list.querySelector('[data-tier-jump="' + row.tierId + '"]');
      if (!button) return;
      var sign = row.net >= 0 ? '+' : '−';
      button.querySelector('[data-operation-count]').textContent = fmt(row.count, 1);
      var net = button.querySelector('[data-operation-net]');
      net.textContent = localized(
        '净变化 ' + sign + fmt(Math.abs(row.net), 2) + '/秒',
        'Net ' + sign + fmt(Math.abs(row.net), 2) + '/s'
      );
      net.className = row.net >= 0 ? 'positive' : 'negative';
    });
  }

  function updateObservationPanel() {
    var panel = el('observation-panel');
    if (!panel || !Slice.getObservationState) return;
    var sliceState = GS.getSlice();
    var unlocked = sliceState.loopNumber === 2 || sliceState.missionStep >= 1;
    panel.hidden = !unlocked;
    if (!unlocked) return;

    var state = Slice.getObservationState();
    var options = Slice.getObservationOptions();
    var active = state.active;
    var status = el('observation-status');
    el('observation-charges').textContent = state.charges + ' / ' + state.maxCharges;
    if (state.charges >= state.maxCharges) {
      el('observation-recharge').textContent = '已充满';
    } else {
      el('observation-recharge').textContent = formatShortDuration(state.rechargeSeconds - state.rechargeProgress);
    }

    if (active) {
      var activeDefinition = options.find(function (option) { return option.id === active.id; });
      var activeTier = GC.TIERS[active.tierId];
      status.textContent = '运行中';
      status.className = 'status-chip';
      var activeName = activeDefinition ? activeDefinition.nameZh : '主动协议';
      var activeTierName = activeTier ? activeTier.nameZh : '当前';
      el('observation-active').textContent = localized(
        activeName + '正在作用于' + activeTierName + '层，剩余 ' + formatShortDuration(active.remaining) + '。',
        (activeDefinition && I18n ? I18n.translate(activeDefinition.nameZh) : 'Active protocol') + ' is affecting ' +
          (activeTier ? activeTier.name : 'the current layer') + '; ' + formatShortDuration(active.remaining) + ' remaining.'
      );
    } else {
      status.textContent = state.charges > 0 ? '可执行' : '充能中';
      status.className = 'status-chip ' + (state.charges > 0 ? 'safe' : 'muted');
      el('observation-active').textContent = state.charges > 0
        ? '消耗 1 次观测：稳定亏空层、放大焦点层，或立即获得研究点。'
        : '观测次数已用尽；在线与离线期间都会继续充能。';
    }

    var optionKey = options.map(function (option) {
      return [option.id, option.available, option.tierId].join(':');
    }).join('|');
    if (optionKey !== observationRenderKey) {
      observationRenderKey = optionKey;
      el('observation-options').innerHTML = options.map(function (option) {
        return '<button type="button" data-observation-id="' + option.id + '" ' + (option.available ? '' : 'disabled') + '>' +
          '<span><b>' + option.nameZh + '</b><em data-observation-effect></em></span>' +
          '<small>' + option.descZh + '</small>' +
          '</button>';
      }).join('');
    }
    options.forEach(function (option) {
      var button = el('observation-options').querySelector('[data-observation-id="' + option.id + '"]');
      if (!button) return;
      var hasTarget = option.tierId !== null && option.tierId !== undefined;
      var target = hasTarget ? GC.TIERS[option.tierId].nameZh + '层' : '当前无可用生产层';
      button.querySelector('[data-observation-effect]').textContent = option.id === 'decode'
        ? localized('立即获得约 ' + fmt(option.researchReward, 1) + ' RP', 'Gain about ' + fmt(option.researchReward, 1) + ' RP now')
        : localized(
          target + ' · 持续 ' + option.durationSeconds + ' 秒',
          (hasTarget ? GC.TIERS[option.tierId].name + ' layer' : 'No productive layer available') +
            ' · ' + option.durationSeconds + 's'
        );
    });

    var result = state.lastResult;
    if (!result) {
      el('observation-result').textContent = '';
    } else {
      var resultDefinition = options.find(function (option) { return option.id === result.id; });
      if (result.researchPoints !== undefined) {
        el('observation-result').textContent = localized(
          '最近结果：' + (resultDefinition ? resultDefinition.nameZh : '解码') + '获得 ' + fmt(result.researchPoints, 2) + ' RP。',
          'Latest result: Decode gained ' + fmt(result.researchPoints, 2) + ' RP.'
        );
      } else {
        var resultTier = GC.TIERS[result.tierId];
        el('observation-result').textContent = localized(
          '最近启动：' + (resultDefinition ? resultDefinition.nameZh : '主动协议') + ' → ' + (resultTier ? resultTier.nameZh : '当前层') + '。',
          'Latest activation: ' + (resultDefinition && I18n ? I18n.translate(resultDefinition.nameZh) : 'Active protocol') +
            ' → ' + (resultTier ? resultTier.name : 'current layer') + '.'
        );
      }
    }
  }

  function updateTalentPanel() {
    var panel = el('talent-panel');
    if (!panel || !Slice.getTalentState) return;
    var state = Slice.getTalentState();
    var definitions = Slice.getTalentDefinitions();
    var unlocked = state && (state.totalEarned > 0 || GS.getSlice().loopNumber === 2);
    panel.hidden = !unlocked;
    if (!unlocked) return;
    el('talent-points').textContent = state.points;

    var renderKey = state.points + ':' + definitions.map(function (definition) {
      return definition.id + ':' + (state.nodes[definition.id] || 0);
    }).join('|');
    if (renderKey === talentRenderKey) return;
    talentRenderKey = renderKey;
    el('talent-grid').innerHTML = definitions.map(function (definition) {
      var rank = state.nodes[definition.id] || 0;
      var maxed = rank >= definition.maxRank;
      var available = !maxed && state.points >= definition.cost;
      var action = maxed ? '已满级' : available ? '花费 1 点升级' : '需要 1 点天赋';
      return '<button class="talent-card" type="button" data-talent-id="' + definition.id + '" ' + (available ? '' : 'disabled') + '>' +
        '<span><strong>' + definition.nameZh + '</strong><b>' + rank + ' / ' + definition.maxRank + '</b></span>' +
        '<p>' + definition.descZh + '</p><small>' + action + '</small>' +
        '</button>';
    }).join('');
  }

  function updateInterventionBadge() {
    var badge = el('intervention-badge');
    if (!badge) return;
    var objective = Slice.getObjectiveModel ? Slice.getObjectiveModel() : null;
    var talent = Slice.getTalentState ? Slice.getTalentState() : null;
    var count = (objective && objective.pendingDecision ? 1 : 0) + (talent ? talent.points : 0);
    badge.textContent = count;
    badge.hidden = count < 1;
    el('workspace-intervention').setAttribute(
      'aria-label',
      count > 0
        ? localized('干预工作区，有 ' + count + ' 项待处理内容', 'Intervention workspace, ' + count + ' item' + (count === 1 ? '' : 's') + ' waiting')
        : localized('干预工作区', 'Intervention workspace')
    );
  }

  function getElementWorkspace(target) {
    if (!target || !target.closest) return null;
    if (target.closest('.resource-panel, #cosmos-stage, #directive-panel')) return 'evolution';
    if (target.closest('#event-panel, #talent-panel, #route-panel')) return 'intervention';
    return null;
  }

  function resolveVisibleGuideTarget(descriptor) {
    var target = document.querySelector(descriptor.selector);
    var workspace = getElementWorkspace(target);
    if (workspace && workspace !== currentWorkspace) {
      return {
        descriptor: { selector: '#workspace-' + workspace },
        target: el('workspace-' + workspace),
      };
    }
    return { descriptor: descriptor, target: target };
  }

  function updatePrimaryAction() {
    document.querySelectorAll('.is-primary-action').forEach(function (node) {
      node.classList.remove('is-primary-action');
    });
    var descriptor = getGuideTarget(GS.getSlice());
    var target = document.querySelector(descriptor.selector);
    if (!target) return;
    var workspace = getElementWorkspace(target);
    if (workspace && workspace !== currentWorkspace) {
      el('workspace-' + workspace).classList.add('is-primary-action');
      return;
    }
    target.classList.add('is-primary-action');
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
      ? '下一项指令将在 ' + Math.ceil(guide.remaining) + ' 秒后出现。现在可调整焦点与保护线，或消耗观测次数获取短期增益。'
      : mission.hint;
    el('directive-progress-fill').style.width = progress.percent + '%';
    el('directive-progress-label').textContent = progress.label;
    if (el('loop-window-label')) {
      var loopLabels = ['第一轮', '第二轮', '第三轮', '第四轮', '第五轮'];
      el('loop-window-label').textContent = loopLabels[Math.max(0, Math.min(loopLabels.length - 1, (s.loopNumber || 1) - 1))];
    }
    el('canvas-focus-label').textContent = s.focusTier === null
      ? '焦点未建立'
      : '焦点 ×' + Slice.getProductionMultiplier(s.focusTier).toFixed(2) + ' · ' + GC.TIERS[s.focusTier].nameZh;

    var missionStrip = document.querySelector('.mission-strip');
    var timedStep = s.loopNumber === 2
      ? [1, 5].indexOf(s.missionStep) !== -1
      : [4, 9, 11, 12, 13, 15, 20].indexOf(s.missionStep) !== -1;
    var nearing = timedStep && progress.percent >= 72 && progress.percent < 100;
    var urgent = timedStep && progress.percent >= 90 && progress.percent < 100;
    if (s.loopNumber !== 2 && s.missionStep === 12 && s.enemy.status === 'warning' && s.enemy.warningRemaining <= 10) urgent = true;
    missionStrip.classList.toggle('near-complete', nearing);
    missionStrip.classList.toggle('urgent', urgent);

    var guidePhase = getGuidePhase(s, guide);
    var guidePhaseChanged = lastGuidePhase !== null && guidePhase !== lastGuidePhase;
    if (guidePhaseChanged && !(guide && guide.interlude)) {
      // "稍后再看" applies to one actionable phase, not the whole mission.
      guideCollapsed = false;
      lastGuideStep = null;
      if (lastMissionStep === s.missionStep) showToast('新的操作阶段已就绪，场景引导已更新', false);
    }
    lastGuidePhase = guidePhase;

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
      // A player's "view later" choice only applies to the current directive.
      // Every newly issued directive gets one automatic, contextual appearance.
      guideCollapsed = false;
      lastGuideStep = null;
      dock.classList.remove('attention');
      dockLabel.textContent = '已展开';
      dock.setAttribute('aria-label', '收起场景引导');
      missionStrip.classList.remove('mission-enter');
      void missionStrip.offsetWidth;
      missionStrip.classList.add('mission-enter');
      showToast('新指令已写入：' + mission.title, false);
    }
    var nextResearchTier = GS.getMaxResearchedTier() + 1;
    var researchReady = nextResearchTier < GC.TIERS.length && GS.canResearch(nextResearchTier);
    if (researchReady && !lastResearchReady && s.guide.researchGoalAcknowledged) {
      guideCollapsed = false;
      lastGuideStep = null;
      playSound('ui-research-threshold');
      showToast('研究阈值已满足：现在可以揭示' + GC.TIERS[nextResearchTier].nameZh + '层', true);
    }
    lastResearchReady = researchReady;
    if (s.missionStep >= (s.loopNumber === 2 ? 1 : 3) && !flowUserToggled && !flowAutoExpanded) {
      var monitor = el('flow-monitor');
      monitor.classList.remove('collapsed');
      el('flow-monitor-toggle').textContent = '—';
      el('flow-monitor-toggle').setAttribute('aria-expanded', 'true');
      el('flow-monitor-toggle').setAttribute('aria-label', '最小化物质流量监视器');
      flowAutoExpanded = true;
    }
    lastMissionStep = s.missionStep;

    var entropy = el('entropy-label');
    if (s.loopNumber === 2 && s.roundTwo.counterexample.status === 'testing') {
      entropy.textContent = 'PREDICTED';
      entropy.style.color = 'var(--violet)';
    } else if (s.loopNumber === 2 && s.roundTwo.counterexample.status === 'resolved') {
      entropy.textContent = 'COUNTERPROOF';
      entropy.style.color = 'var(--green)';
    } else if (s.enemy.status === 'warning') {
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

  function updateEraIndicator() {
    var indicator = el('era-indicator');
    var sliceState = GS.getSlice();
    var cellularStage = sliceState.loopNumber === 2 ? sliceState.missionStep >= 8 : sliceState.missionStep >= 17;
    var cellular = GS.getTier(4).researched;
    var dismissed = !!(sliceState.guide && sliceState.guide.eraIndicatorDismissed);
    indicator.hidden = !cellularStage || dismissed;
    document.body.classList.toggle('cellular-era', cellular);
    if (!cellularStage || dismissed) return;
    var cell = GS.getTier(4);
    var ranking = Slice.getRouteRanking();
    var dominant = ranking[0];
    el('era-boundary-state').textContent = cellular ? '内部边界 ' + fmt(cell.count, 1) + ' / 单元 ' + cell.producers : '内部边界正在形成';
    if (sliceState.loopNumber === 2) {
      el('era-reverse-state').textContent = '反例记录 ' + (sliceState.roundTwo.counterexample.status === 'resolved' ? '已完成' : '仍在检验');
      el('era-route-state').textContent = sliceState.roundTwo.witnessResponse ? '证词回应 ' + sliceState.roundTwo.witnessResponse : '证词等待后来者';
    } else {
      el('era-reverse-state').textContent = '反侧压力 ' + Math.round(Slice.getReversePressure()) + '%';
      el('era-route-state').textContent = dominant ? '文明疑问 ' + dominant.meta.ending : '路线未收束';
    }
  }

  function updateProgressiveDisclosure() {
    var s = GS.getSlice();
    var step = s.missionStep;
    document.body.dataset.missionStep = String(step);
    document.body.dataset.loopNumber = String(s.loopNumber || 1);
    document.body.classList.toggle('expanded-matter-stack', s.loopNumber === 2 ? step >= 6 : step >= 16);

    if (s.loopNumber === 2) {
      var roundTwoMax = Math.min(GC.TIERS.length - 1, Math.max(2, GS.getMaxResearchedTier() + 1));
      for (var roundTier = 0; roundTier < GC.TIERS.length; roundTier++) {
        el('card-' + roundTier).hidden = roundTier > roundTwoMax;
      }
      var roundVisible = roundTwoMax + 1;
      var roundRemaining = GC.TIERS.length - roundVisible;
      el('tier-visibility-label').textContent = '当前可见 ' + roundVisible + ' / ' + GC.TIERS.length;
      el('tier-horizon').hidden = roundRemaining <= 0;
      el('tier-horizon-copy').textContent = roundRemaining > 0 ? '还有 ' + roundRemaining + ' 个结构层等待揭示' : '七层结构已经全部可见';
      document.querySelector('.research-bar').hidden = false;
      el('contact-panel').hidden = step < 4;
      el('event-panel').hidden = false;
      el('route-panel').hidden = false;

      var roundPhase = step < 3 ? 0 : step < 6 ? 1 : step < 8 ? 2 : step < 10 ? 3 : 4;
      var roundChapters = ['第一章 · 继承偏差', '第二章 · 路线反例', '第三章 · 碎片证词', '第四章 · 第二文明', '第五章 · 真理裁定'];
      var roundPhaseLabels = ['校验继承', '承受反例', '保存分歧', '孕育后来者', '裁定真理'];
      el('campaign-chapter').textContent = roundChapters[roundPhase];
      el('campaign-chapter-progress').textContent = (roundPhase + 1) + ' / 5';
      el('campaign-goal-title').textContent = '让上一轮答案承受一次真正的反例';
      el('campaign-goal-copy').textContent = '带着第一轮真理重建物质，面对会预测旧方法的反侧结构，并让第二座文明决定这条真理应被重复、修正还是反驳。';
      Array.prototype.forEach.call(el('campaign-phases').children, function (item, index) {
        item.querySelector('span').textContent = roundPhaseLabels[index];
        item.classList.toggle('complete', index < roundPhase);
        item.classList.toggle('current', index === roundPhase);
      });
      return;
    }

    // Show only layers the player can act on, plus the next meaningful horizon.
    // Atom is deliberately withheld until the Research Channel is introduced;
    // complex matter is withheld until the First Contact report is complete.
    var maxResearched = GS.getMaxResearchedTier();
    var maxVisible = maxResearched + 1;
    if (step < 5) maxVisible = 1;
    else if (step < 16) maxVisible = Math.min(maxVisible, 2);
    maxVisible = Math.min(GC.TIERS.length - 1, maxVisible);
    for (var tierId = 0; tierId < GC.TIERS.length; tierId++) {
      el('card-' + tierId).hidden = tierId > maxVisible;
    }
    var visibleCount = maxVisible + 1;
    var remaining = GC.TIERS.length - visibleCount;
    el('tier-visibility-label').textContent = '当前可见 ' + visibleCount + ' / ' + GC.TIERS.length;
    el('tier-horizon').hidden = remaining <= 0;
    el('tier-horizon-copy').textContent = remaining > 0 ? '还有 ' + remaining + ' 个结构层等待揭示' : '七层结构已经全部可见';

    var research = document.querySelector('.research-bar');
    var contact = el('contact-panel');
    var eventPanel = el('event-panel');
    var routePanel = el('route-panel');
    research.hidden = step < 5;
    contact.hidden = step < 12;
    eventPanel.hidden = step < 10 && !(Slice.getPendingReverseObject && Slice.getPendingReverseObject());
    routePanel.hidden = step < 10;

    var phase = step < 10 ? 0 : step < 12 ? 1 : step < 16 ? 2 : step < 23 ? 3 : 4;
    var chapterNames = ['第一章 · 唤醒', '第二章 · 法则', '第三章 · 接触', '第四章 · 生命', '第五章 · 文明'];
    var firstPhaseLabels = ['唤醒物质', '建立法则', '第一次接触', '孕育生命', '点燃文明'];
    el('campaign-chapter').textContent = chapterNames[phase];
    el('campaign-chapter-progress').textContent = (phase + 1) + ' / 5';
    el('campaign-goal-title').textContent = '让宇宙演化出能回应你的文明';
    el('campaign-goal-copy').textContent = '从夸克开始建立稳定物质，面对视界背面的另一侧，并让文明根据你的真实选择提出未来。';
    Array.prototype.forEach.call(el('campaign-phases').children, function (item, index) {
      item.querySelector('span').textContent = firstPhaseLabels[index];
      item.classList.toggle('complete', index < phase);
      item.classList.toggle('current', index === phase);
    });
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
    detailsButton.disabled = sliceState.enabled && sliceState.loopNumber !== 2 && sliceState.missionStep < 5;
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
    var researchBar = document.querySelector('.research-bar');
    if (next < GC.TIERS.length) {
      var cost = GS.getResearchCost(next);
      var researchPercent = clamp(rp / cost * 100, 0, 100);
      el('rb-fill').style.width = researchPercent + '%';
      button.dataset.tier = next;
      var gateTable = sliceState.loopNumber === 2 ? [0, 0, 2, 6, 8, 8, 9] : [0, 0, 6, 16, 17, 19, 21];
      var gateStep = gateTable[next] || 0;
      var gateClosed = sliceState.enabled && sliceState.missionStep < gateStep;
      if (gateClosed) {
        el('rb-next-label').textContent = GC.TIERS[next].nameZh + '信号尚未稳定 / 完成当前阶段后开放';
        button.textContent = '等待' + GC.TIERS[next].nameZh + '信号';
        button.disabled = true;
        researchBar.classList.remove('near-ready', 'research-ready');
      } else {
        el('rb-next-label').textContent = '下一目标：' + GC.TIERS[next].nameZh + ' / ' + fmt(rp, 0) + ' / ' + cost + ' RP';
        button.textContent = '研究' + GC.TIERS[next].nameZh + '层';
        button.disabled = !GS.canResearch(next);
        researchBar.classList.toggle('near-ready', researchPercent >= 78 && researchPercent < 100);
        researchBar.classList.toggle('research-ready', researchPercent >= 100 && !button.disabled);
      }
    } else {
      el('rb-fill').style.width = '100%';
      el('rb-next-label').textContent = '七层结构已完整描述 / 文明正在回读本轮记录';
      button.textContent = '研究通道已完成';
      button.disabled = true;
      researchBar.classList.remove('near-ready');
      researchBar.classList.add('research-ready');
    }
  }

  function updateCard(tierId) {
    var s = GS.getSlice();
    var tier = GS.getTier(tierId);
    var tpl = GC.TIERS[tierId];
    var card = el('card-' + tierId);
    var unlocked = tier.researched;
    var researchGateTable = s.loopNumber === 2 ? [0, 0, 2, 6, 8, 8, 9] : [0, 0, 6, 16, 17, 19, 21];
    var researchGateStep = researchGateTable[tierId] || 0;
    var nextResearchable = tierId === GS.getMaxResearchedTier() + 1 && (!s.enabled || s.missionStep >= researchGateStep);

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
    if (count) { count.style.display = ''; count.textContent = fmt(tier.count, tierId <= 2 ? 2 : 1); }
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

    if (synthButton && tierId >= 1 && tierId <= 6) {
      var synthCost = GS.getSynthCost(tierId);
      var batch = GS.getSynthBatchSize();
      synthButton.style.display = '';
      synthButton.textContent = GC.TIERS[tierId - 1].nameZh + ' → ' + tpl.nameZh + ' / ' + fmtInt(synthCost * batch);
      synthButton.disabled = GS.getTier(tierId - 1).count < synthCost * batch || !Slice.canSynthesize(tierId);
    } else if (synthButton) synthButton.style.display = 'none';

    if (focusButton) {
      var focusAvailable = s.loopNumber === 2 || s.missionStep >= 3;
      focusButton.style.display = focusAvailable ? '' : 'none';
      focusButton.textContent = s.focusTier === tierId ? '焦点已锁定' : '聚焦';
      focusButton.disabled = !focusAvailable || s.focusTier === tierId;
      focusButton.classList.toggle('active', s.focusTier === tierId);
      var predictedFocus = GC.FIRST_CONTACT.focusMultiplier;
      if (s.law === 'expansion') predictedFocus += GC.FIRST_CONTACT.focusLawBonus;
      if (s.law === 'conservation' && s.reserveTier === tierId) predictedFocus *= 1.2;
      if (s.flags.demoComplete) predictedFocus *= GC.FIRST_CONTACT.evolutionProductionMultiplier[tierId] || 1;
      focusButton.dataset.tooltipTitle = '宇宙焦点';
      focusButton.dataset.tooltip = '全宇宙同时只能聚焦一个层级。移动到' + tpl.nameZh + '后，该层当前生产倍率变为 ×' + predictedFocus.toFixed(2) + '；焦点位置也会影响部分敌人处理条件。迁移不消耗资源。';
    }
    if (reserveButton) {
      var reserveAvailable = s.loopNumber === 2 || s.missionStep >= 8;
      reserveButton.style.display = reserveAvailable ? '' : 'none';
      reserveButton.textContent = s.reserveTier === tierId ? '保护已建立' : '保护';
      reserveButton.disabled = !reserveAvailable;
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
    if (Slice.getReverseInfluences) {
      Slice.getReverseInfluences(tierId).forEach(function (influence) {
        if (influence.tone === 'pressure') {
          parts.push('<button type="button" class="tc-modifier reverse-pressure" data-lore-target="reverse-pressure" data-tooltip-title="反侧压力" data-tooltip="不是生命值。它表示另一侧对重复方法的预测程度，并轻微压低原子及以上生产。点击查看完整档案。">' + influence.label + ' <i aria-hidden="true">?</i></button>');
        } else {
          parts.push('<span class="tc-modifier reverse-' + influence.tone + '">' + influence.label + '</span>');
        }
      });
    }
    if (TERMINAL_WHISPERS[tierId]) parts.push('<span class="tc-modifier terminal-whisper">' + TERMINAL_WHISPERS[tierId] + '</span>');
    node.innerHTML = parts.join('');
  }

  function updateBars(tierId, rates) {
    var max = Math.max(rates.production, rates.demand, 0.01);
    el('bars-' + tierId).innerHTML =
      '<div class="tc-bar-row"><span class="tc-bar-label">产出</span><div class="tc-bar-track"><div class="tc-bar-fill prod" style="width:' + rates.production / max * 100 + '%"></div></div><span class="tc-bar-val prod-text">+' + fmt(rates.production, 2) + '/s</span></div>' +
      '<div class="tc-bar-row"><span class="tc-bar-label">消耗</span><div class="tc-bar-track"><div class="tc-bar-fill demand" style="width:' + rates.demand / max * 100 + '%"></div></div><span class="tc-bar-val demand-text">-' + fmt(rates.demand, 2) + '/s</span></div>';
  }

  function updateNet(tierId, rates) {
    var sign = rates.net >= 0 ? '+' : '';
    var node = el('net-' + tierId);
    node.textContent = 'NET ' + sign + fmt(Math.abs(rates.net), 2) + ' / SEC';
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

  function decisionByKind(s, kind) {
    for (var i = s.decisions.length - 1; i >= 0; i--) if (s.decisions[i].kind === kind) return s.decisions[i];
    return null;
  }

  function updateDecisionHierarchy() {
    var s = GS.getSlice();
    if (s.loopNumber === 2) {
      var secondStages = [
        { at: 0, done: !!s.roundTwo.inheritanceMode, title: 'I · 继承校准', value: s.roundTwo.inheritanceMode || '等待读取坍缩签名' },
        { at: 3, done: !!s.roundTwo.fragmentChoice, title: 'II · 证词碎片', value: s.roundTwo.fragmentChoice || '等待原子谱线' },
        { at: 4, done: !!s.roundTwo.counterexample.choice, title: 'III · 路线反例', value: s.roundTwo.counterexample.choice || Slice.getRoundTwoCounterexample().title },
        { at: 7, done: !!s.roundTwo.witnessResponse, title: 'IV · 后来者异议', value: s.roundTwo.witnessResponse || '等待第二文明前身' },
        { at: 10, done: !!s.roundTwo.truthVerdict, title: 'V · 真理裁定', value: s.roundTwo.truthVerdict || '等待第二座文明' },
      ];
      el('decision-hierarchy').innerHTML = '<header><span>SECOND-LOOP DEPENDENCY</span><b>继承 → 碎片 → 反例 → 异议 → 裁定</b></header><ol>' + secondStages.map(function (stage) {
        var secondClass = stage.done ? 'complete' : (s.missionStep >= stage.at ? 'current' : 'locked');
        return '<li class="' + secondClass + '"><i></i><span><b>' + stage.title + '</b><small>' + escapeHTML(stage.value) + '</small></span></li>';
      }).join('') + '</ol>';
      return;
    }
    var law = decisionByKind(s, 'law');
    var contactCount = s.decisions.filter(function (decision) { return ['preparation', 'enemy', 'core'].indexOf(decision.kind) !== -1; }).length;
    var reverseCount = s.decisions.filter(function (decision) { return decision.kind === 'reverse'; }).length;
    var complexity = decisionByKind(s, 'complexity');
    var proposals = s.flags.civilizationComplete ? Slice.getCivilizationProposals() : [];
    var stages = [
      { at: 10, done: !!law, title: 'I · 局部法则', value: law ? law.label : '等待原子稳态' },
      { at: 11, done: contactCount === 3, title: 'II · 接触记录', value: contactCount ? contactCount + ' / 3 项已封存' : '继承第一法则' },
      { at: 16, done: reverseCount === 3, title: 'III · 反侧回应', value: reverseCount ? reverseCount + ' / 3 个客体已回应' : '等待背面结构回应主路线' },
      { at: 18, done: !!complexity, title: 'IV · 发展伦理', value: complexity ? complexity.label : '等待细胞阶段' },
      { at: 23, done: s.flags.civilizationComplete, title: 'V · 文明提案', value: proposals.length ? proposals.map(function (proposal) { return proposal.title; }).join(' / ') : '汇总全部记录' },
    ];
    el('decision-hierarchy').innerHTML = '<header><span>DECISION DEPENDENCY</span><b>法则 → 接触 → 反侧回应 → 发展伦理 → 文明提案</b></header><ol>' + stages.map(function (stage) {
      var stateClass = stage.done ? 'complete' : (s.missionStep >= stage.at ? 'current' : 'locked');
      return '<li class="' + stateClass + '"><i></i><span><b>' + stage.title + '</b><small>' + escapeHTML(stage.value) + '</small></span></li>';
    }).join('') + '</ol>';
  }

  function updateRoundTwoEventPanel(s, content, status) {
    var decision = Slice.getRoundTwoDecision();
    var signature = s.loopSignature || {};
    var memory = Slice.getLoopMemorySummary();
    var primaryRoute = Slice.getRouteMeta()[signature.dominantRoute] || { name: '未定向', ending: '普通大坍缩' };
    if (decision) {
      status.textContent = '第二轮决策'; status.className = 'status-chip';
      var decisionKey = 'round-two:' + decision.kind;
      if (eventRenderKey === decisionKey) return;
      eventRenderKey = decisionKey;
      content.innerHTML = '<div class="choice-context reverse-context"><b>' + decision.title + '</b><p>' + decision.context + '</p></div><div class="choice-list">' + decision.options.map(function (option) {
        return '<button class="choice-card route-' + option.route + '" data-round-two-kind="' + decision.kind + '" data-round-two-id="' + option.id + '"><span class="choice-heading"><img src="assets/icons/routes/route-' + option.route + '.svg" alt=""><span class="choice-top"><strong>' + option.title + '</strong><span>' + option.tag + '</span></span></span><p>' + option.desc + '</p></button>';
      }).join('') + '</div>';
      content.querySelectorAll('[data-round-two-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (Slice.chooseRoundTwoDecision(button.dataset.roundTwoKind, button.dataset.roundTwoId)) {
            showActionFeedback(button, button.querySelector('strong').textContent + ' · 已写入第二轮', 'green', true);
          }
          refreshAll();
        });
      });
      return;
    }

    if (s.flags.civilizationComplete) {
      status.textContent = '第二轮已完成'; status.className = 'status-chip safe';
      if (eventRenderKey === 'round-two-complete') return;
      eventRenderKey = 'round-two-complete';
      var verdictLabels = {
        repeat: '重复证明',
        revise: '修正后成立',
        dispute: '保留未决争议',
      };
      var witnessLabels = {
        accept: '有条件接受祖先证词',
        challenge: '正式反驳祖先证词',
        defer: '暂缓采用祖先证词',
      };
      content.innerHTML = '<article class="civilization-report round-two-report"><span>CIVILIZATION ASSEMBLY / SECOND LOOP</span><h3>第二座文明完成了真理评议</h3><p>它们没有复刻第一座文明的议案，而是把旧真理、针对性反例与后来者异议放进同一份可复查记录。</p><div class="completion-records"><span>上轮答案<b>' + primaryRoute.ending + '</b></span><span>路线反例<b>' + Slice.getRoundTwoCounterexample().title + '</b></span><span>反例回应<b>' + s.roundTwo.counterexample.choice + '</b></span><span>文明证词<b>' + witnessLabels[s.roundTwo.witnessResponse] + '</b></span><span>真理裁定<b>' + verdictLabels[s.roundTwo.truthVerdict] + '</b></span></div><p class="completion-closing">第二轮的结论与异议已经同时封存。第三轮将不再只有观测核拥有继承物：反侧也会带着自己的历史醒来。</p><button id="open-completion-archive" class="btn btn-primary" type="button">查看两轮完整档案</button></article>';
      el('open-completion-archive').addEventListener('click', openLoreArchive);
      return;
    }

    status.textContent = s.missionStep === 5 ? '反例检验中' : '跨轮记录'; status.className = 'status-chip ' + (s.missionStep === 5 ? 'danger' : 'safe');
    var idleKey = 'round-two-idle:' + s.missionStep;
    if (eventRenderKey === idleKey) return;
    eventRenderKey = idleKey;
    content.innerHTML = '<article class="loop-difference-card route-' + (signature.dominantRoute || 'advance') + '"><span>THIS LOOP IS DIFFERENT</span><h3>' + primaryRoute.ending + '正在接受反例</h3><div class="completion-records"><span>本轮真理<b>' + memory.truth + '</b></span><span>已装备继承物<b>' + memory.inheritance + '</b></span><span>背面记忆<b>' + Slice.getRoundTwoCounterexample().title + '</b></span><span>上轮债务<b>' + memory.debt + '</b></span></div><p>当前没有必须立即处理的决策。继续完成观测指令；新的碎片与反例会在它们真正影响物质时出现。</p></article>';
  }

  function updateEventPanel() {
    var s = GS.getSlice();
    var content = el('event-content');
    var status = el('event-status');
    var options = null;
    var kind = '';
    var pendingReverse = Slice.getPendingReverseObject ? Slice.getPendingReverseObject() : null;
    updateDecisionHierarchy();
    if (s.loopNumber === 2) {
      updateRoundTwoEventPanel(s, content, status);
      return;
    }

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
        eventRenderKey = 'preparation-active:' + Math.floor(s.preparation.progress * 4);
        content.innerHTML = '<div class="preparation-active route-' + selectedPreparation.route + '"><span class="choice-top"><strong>' + selectedPreparation.title + '</strong><span>' + selectedPreparation.tag + '</span></span><p>' + selectedPreparation.desc + '</p><div class="progress-block"><span><b>连续稳定</b><em>' + Math.floor(s.preparation.progress) + ' / ' + GC.FIRST_CONTACT.preparationSeconds + ' 秒</em></span><div class="bar"><i style="width:' + prepPercent + '%"></i></div></div><ul class="preparation-conditions">' + conditionRows + '</ul><div class="preparation-effect"><span>完成效果</span><b>' + selectedPreparation.effect + '</b></div></div>';
        return;
      }
      options = Slice.getPreparationOptions(); kind = 'preparation';
    } else if (s.enemy.status === 'active' && !s.enemy.method) {
      status.textContent = '转至接触面板'; status.className = 'status-chip danger';
      if (eventRenderKey !== 'contact-redirect') {
        eventRenderKey = 'contact-redirect';
        content.innerHTML = '<div class="empty-state small"><p>真空水蛭的三种可用处理方案已经在中部并列显示。</p><small>在那里比较成本、持续时间、止损方式与路线记录。</small></div>';
      }
      return;
    } else if (s.flags.coreDecisionOpen && !s.flags.demoComplete) {
      options = Slice.getCoreOptions(); kind = 'core';
      status.textContent = '余像处置'; status.className = 'status-chip';
    } else if (s.flags.complexityDecisionOpen && !s.complexity) {
      options = Slice.getComplexityOptions(); kind = 'complexity';
      status.textContent = '发展决策'; status.className = 'status-chip';
    } else if (pendingReverse) {
      options = pendingReverse.options; kind = 'reverse';
      status.textContent = '反侧客体'; status.className = 'status-chip danger';
    }

    if (!options) {
      if (s.missionStep === 15) {
        status.textContent = '接触已封存'; status.className = 'status-chip safe';
        if (eventRenderKey === 'first-contact-report') return;
        eventRenderKey = 'first-contact-report';
        var report = Lore.getFirstContactReport(s, Slice.getRouteRanking());
        content.innerHTML = '<article class="completion-report"><div class="completion-kicker"><span>FIRST CONTACT / SEALED</span><b>记录完成</b></div><h3>' + report.title + '</h3><div class="completion-signal"><span>主信号</span><strong>' + report.signal + '</strong><small>备选 · ' + report.secondary + '</small></div><div class="completion-records"><span>第一法则<b>' + report.law + '</b></span><span>接触准备<b>' + report.preparation + '</b></span><span>处理方案<b>' + report.method + '</b></span><span>余像用途<b>' + report.disposition + '</b></span><span>累计损失<b>' + fmt(s.enemy.siphoned, 2) + ' 原子</b></span></div><div class="completion-story"><p>' + report.opening + '</p><p>' + report.encounter + '</p><p>' + report.aftermath + '</p></div><p class="completion-closing">' + report.closing + '</p><div class="report-actions"><button id="continue-evolution" class="btn btn-primary" type="button">立即继续演化</button><button id="open-completion-archive" class="btn btn-quiet" type="button">查看完整档案</button></div></article>';
        el('open-completion-archive').addEventListener('click', openLoreArchive);
        el('continue-evolution').addEventListener('click', function () { if (Slice.continueEvolution()) refreshAll(); });
        return;
      }
      if (s.flags.civilizationComplete) {
        status.textContent = '文明已形成'; status.className = 'status-chip safe';
        if (eventRenderKey === 'civilization-report') return;
        eventRenderKey = 'civilization-report';
        var civilizationProposals = Slice.getCivilizationProposals();
        content.innerHTML = '<article class="civilization-report"><span>CIVILIZATION ASSEMBLY / FIRST LOOP</span><h3>文明议案已经形成</h3><p>文明没有把此前选择当作阵营标签，而是把第一次接触、反侧回应与发展伦理整理成两条已经被本轮证明可行的工程方向。</p><div class="proposal-list">' + civilizationProposals.map(function (proposal) { return '<section class="proposal-card route-' + proposal.route + '"><span>' + proposal.role + ' · 信号 ' + proposal.score + '</span><strong>' + proposal.title + '</strong><p>' + proposal.goal + '</p><small>尚未回答：' + proposal.question + '<br>依据：' + (proposal.reason.length ? proposal.reason.join('、') : '当前路线信号') + '</small></section>'; }).join('') + '</div><p class="completion-closing">第一轮夸克 → 文明大循环完成。主提案会决定穿过大坍缩的答案；备选提案将作为第二轮最早的修正方向。</p><div class="report-actions"><button id="begin-directed-rebirth" class="btn btn-primary" type="button">让主提案穿过大坍缩</button><button id="open-completion-archive" class="btn btn-quiet" type="button">查看本轮完整档案</button></div></article>';
        el('open-completion-archive').addEventListener('click', openLoreArchive);
        el('begin-directed-rebirth').addEventListener('click', function () {
          var result = GS.beginDirectedRebirth();
          if (!result) return;
          eventRenderKey = '';
          Slice.init();
          refreshAll();
          if (window.TinyCosmos && window.TinyCosmos.saveGame) window.TinyCosmos.saveGame();
          if (window.GamePrologue && window.GamePrologue.openRebirth) window.GamePrologue.openRebirth(result.signature);
        });
        return;
      }
      status.textContent = s.flags.demoComplete ? '履历已保留' : '空闲';
      status.className = 'status-chip ' + (s.flags.demoComplete ? 'safe' : 'muted');
      var idleKey = 'idle:' + s.missionStep;
      if (eventRenderKey !== idleKey) {
        eventRenderKey = idleKey;
        content.innerHTML = '<div class="empty-state small"><p>当前没有必须处理的决策。</p><small>' + (s.flags.demoComplete ? '已完成的选择保留在上方层级中；它们不会被后续决策覆盖。' : '事件会保留，不会在离线时过期。') + '</small></div>';
      }
      return;
    }

    var choiceKey = 'choices:' + kind + (kind === 'reverse' ? ':' + pendingReverse.id : '');
    if (eventRenderKey === choiceKey) return;
    eventRenderKey = choiceKey;
    var context = kind === 'law'
      ? '<div class="choice-context"><b>I · 局部法则</b><p>强化已经使用过的一项系统，并写入路线信号。</p></div>'
      : kind === 'preparation'
        ? '<div class="choice-context"><b>II-A · 接触准备</b><p>条件连续保持 30 秒；失效时进度缓慢回退。</p></div>'
        : kind === 'complexity'
          ? '<div class="choice-context"><b>IV · 发展伦理</b><p>它继承此前记录但不覆盖它们，并将参与文明提案排序。</p></div>'
          : kind === 'reverse'
            ? '<div class="choice-context reverse-context"><b>III · ' + pendingReverse.title + ' / 正在模仿' + Slice.getRouteMeta()[pendingReverse.state.mirroredRoute].name + '路线</b><p>' + pendingReverse.question + ' 沿用被模仿路线会获得 2 点信号、反侧压力 +12；转向只获得 1 点信号，但压力 -5。</p></div>'
            : '<div class="choice-context"><b>II-C · 余像处置</b><p>把本次接触结果转成资源用途与路线记录。</p></div>';
    content.innerHTML = context + '<div class="choice-list">' + options.map(function (option) {
      var iconSource = kind === 'law' ? 'assets/icons/laws/law-' + option.id + '.svg' : kind === 'preparation' ? 'assets/icons/preparations/preparation-' + option.id + '.svg' : kind === 'core' ? 'assets/icons/afterimage-actions/afterimage-' + option.id + '.svg' : kind === 'reverse' ? 'assets/icons/tiers/tier-' + GC.TIERS[pendingReverse.iconTier].name.toLowerCase() + '.svg' : 'assets/icons/tiers/tier-cell.svg';
      var metrics = option.requirement
        ? '<div class="choice-metrics"><span>条件</span><b>' + option.requirement + '</b><span>效果</span><b>' + option.effect + '</b></div>'
        : kind === 'reverse'
          ? '<div class="choice-metrics"><span>收益</span><b>' + option.benefit + '</b><span>代价</span><b>' + option.cost + '</b></div>'
          : '';
      return '<button class="choice-card route-' + option.route + '" data-kind="' + kind + '" data-id="' + option.id + '" ' + (option.disabled ? 'disabled' : '') + '><span class="choice-heading"><img src="' + iconSource + '" alt=""><span class="choice-top"><strong>' + option.title + '</strong><span>' + option.tag + '</span></span></span><p>' + option.desc + '</p>' + metrics + '</button>';
    }).join('') + '</div>';

    content.querySelectorAll('.choice-card').forEach(function (button) {
      button.addEventListener('click', function () {
        var actionKind = button.dataset.kind;
        var id = button.dataset.id;
        var changed = actionKind === 'law'
          ? Slice.chooseLaw(id)
          : actionKind === 'preparation'
            ? Slice.choosePreparation(id)
            : actionKind === 'core'
              ? Slice.chooseCoreDisposition(id)
              : actionKind === 'reverse'
                ? Slice.chooseReverseObject(pendingReverse.id, id)
                : Slice.chooseComplexity(id);
        if (changed) {
          if (actionKind === 'core') playSound('afterimage-' + id);
          showActionFeedback(button, button.querySelector('strong').textContent + ' · 已记录', 'green', true);
        }
        refreshAll();
      });
    });
  }

  function setContactContent(key, html) {
    if (contactRenderKey === key) return false;
    contactRenderKey = key;
    el('contact-content').innerHTML = html;
    return true;
  }

  function renderReverseAtlas(s, pendingReverse) {
    var atlas = Slice.getReverseAtlas();
    var pressure = Slice.getReversePressure();
    var ranking = Slice.getRouteRanking();
    var dominant = ranking[0];
    var pressurePenalty = Math.min(16, pressure * 0.16);
    var cards = '<section class="reverse-object-card resolved"><span class="reverse-object-symbol">VL</span><div><b>真空水蛭</b><small>第一次接触 · ' + methodName(s.enemy.resolution) + '</small><p>已封存为接触记录；它证明反侧客体会直接读取资源流。</p></div></section>' + atlas.map(function (object) {
      var state = object.state || { status: 'hidden' };
      var stateClass = state.status === 'pending' ? 'pending' : (state.status === 'resolved' ? 'resolved' : 'hidden');
      var statusCopy = state.status === 'pending'
        ? '等待回应 · 正在模仿' + Slice.getRouteMeta()[state.mirroredRoute].name + '路线'
        : state.status === 'resolved'
          ? (object.selected ? object.selected.title : '历史版本未记录具体回应')
          : object.stage + '尚未出现';
      var detail = state.status === 'pending' ? object.question : object.selected ? object.selected.benefit + ' / ' + object.selected.cost : object.summary;
      return '<section class="reverse-object-card ' + stateClass + '"><span class="reverse-object-symbol">' + object.symbol + '</span><div><b>' + object.title + '</b><small>' + statusCopy + '</small><p>' + detail + '</p></div></section>';
    }).join('');
    var key = 'reverse-atlas:' + Math.floor(pressure) + ':' + atlas.map(function (object) { return object.state.status + ':' + (object.state.choice || ''); }).join('|') + ':' + (dominant ? dominant.id : 'none');
    setContactContent(key, '<article class="reverse-atlas"><header><div><span>REVERSE OBJECT ATLAS / LIVE</span><strong>背面结构档案</strong></div><b>' + (pendingReverse ? '需要回应' : '持续观测') + '</b></header><div class="reverse-pressure"><span><b>反侧压力 ' + Math.round(pressure) + '%</b><em>高阶物质生产 −' + pressurePenalty.toFixed(1) + '%</em></span><div><i style="width:' + pressure + '%"></i></div><small>这不是生命值，也不会直接导致失败。重复当前主路线会让反侧更容易预测你；主动转向会降低压力，但也会稀释终局信号。</small><button type="button" class="inline-lore-link" data-lore-target="reverse-pressure">档案：反侧压力是什么？</button></div><div class="reverse-object-list">' + cards + '</div><footer><span>当前被预测路线</span><strong>' + (dominant ? dominant.meta.name + ' / ' + dominant.meta.ending : '尚未形成') + '</strong><small>' + (dominant ? dominant.meta.goal : '后续决策会形成路线信号') + '</small></footer></article>');
  }

  function updateContact() {
    var s = GS.getSlice();
    var enemy = s.enemy;
    var status = el('contact-status');
    var content = el('contact-content');
    var overlay = el('anomaly-overlay');
    var overlayState = el('anomaly-overlay-state');
    if (s.loopNumber === 2) {
      var counterexample = Slice.getRoundTwoCounterexample();
      var counterState = s.roundTwo.counterexample.status;
      var activeCounter = s.missionStep >= 4 && s.missionStep <= 5;
      el('cosmos-stage').classList.toggle('reverse-contact', activeCounter);
      overlay.hidden = !activeCounter;
      overlay.querySelector('strong').textContent = counterexample.title;
      overlayState.textContent = counterState === 'testing'
        ? '正在预测你的惯用方法'
        : '等待选择检验框架';
      status.textContent = counterState === 'resolved' ? '反例已封存' : counterState === 'testing' ? '检验中' : '已识别';
      status.className = 'status-chip ' + (counterState === 'resolved' ? 'safe' : 'danger');
      var counterKey = 'round-two-counter:' + counterState + ':' + (s.roundTwo.counterexample.choice || 'none') + ':' + Math.floor(s.roundTwo.proofProgress);
      setContactContent(counterKey, '<article class="reverse-atlas round-two-counterexample"><header><div><span>ROUTE-SPECIFIC COUNTEREXAMPLE / LOOP 02</span><strong>' + counterexample.title + '</strong></div><b>' + status.textContent + '</b></header><section class="reverse-object-card ' + (counterState === 'resolved' ? 'resolved' : 'pending') + '"><span class="reverse-object-symbol">' + counterexample.symbol + '</span><div><b>它针对的是方法，不是资源</b><small>' + counterexample.premise + '</small><p>' + counterexample.behavior + '</p></div></section><div class="reverse-pressure"><span><b>完整检验 ' + Math.floor(s.roundTwo.proofProgress) + ' / ' + GC.SECOND_LOOP.proofSeconds + ' 秒</b><em>' + (s.roundTwo.counterexample.choice ? '回应：' + s.roundTwo.counterexample.choice : '尚未选择回应') + '</em></span><div><i style="width:' + clamp(s.roundTwo.proofProgress / GC.SECOND_LOOP.proofSeconds * 100, 0, 100) + '%"></i></div><small>检验条件全部公开在物质流量面板；短暂失效只会让进度缓慢回退。</small></div></article>');
      lastEnemyStatus = 'round-two-' + counterState;
      return;
    }
    var pendingReverse = Slice.getPendingReverseObject ? Slice.getPendingReverseObject() : null;
    var atlasVisible = enemy.status === 'resolved' && s.missionStep >= 16;
    var contactVisible = enemy.status === 'warning' || enemy.status === 'active' || !!pendingReverse;

    el('cosmos-stage').classList.toggle('reverse-contact', contactVisible);
    if (lastEnemyStatus !== null && lastEnemyStatus !== enemy.status) {
      if (enemy.status === 'warning') playSound('contact-warning');
      if (enemy.status === 'active') playSound('contact-attach');
    }
    lastEnemyStatus = enemy.status;

    overlay.hidden = !(enemy.status === 'warning' || enemy.status === 'active' || pendingReverse || (enemy.status === 'resolved' && s.missionStep < 16));
    if (pendingReverse) {
      overlay.querySelector('strong').textContent = pendingReverse.title;
      overlayState.textContent = '反侧压力 ' + Math.round(Slice.getReversePressure()) + '% / 等待回应';
    } else {
      overlay.querySelector('strong').textContent = enemy.status === 'resolved' ? '核心余像' : '真空水蛭';
    }

    if (enemy.status === 'hidden') {
      status.textContent = '未发现'; status.className = 'status-chip muted';
      setContactContent('hidden', '<div class="empty-state"><span class="reticle-icon"></span><p>当前视界内没有稳定敌对结构。</p><small>第一法则确定后，视界外信号会开始形成可测结构。</small></div>');
      return;
    }

    if (enemy.status === 'warning') {
      status.textContent = '征兆 / ' + Math.ceil(enemy.warningRemaining) + 's'; status.className = 'status-chip danger';
      overlayState.textContent = '附着倒计时 ' + Math.ceil(enemy.warningRemaining) + ' 秒';
      var warningDuration = Slice.getWarningDuration();
      var warningPercent = clamp((1 - enemy.warningRemaining / warningDuration) * 100, 0, 100);
      if (setContactContent('warning', '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>原子层 / 新增产出与可用库存</small></div></div><div class="threat-stats"><div class="threat-stat"><span>目标</span><b>原子 T2</b></div><div class="threat-stat"><span>截取速率</span><b>' + GC.FIRST_CONTACT.enemyDrainPerSecond.toFixed(2) + '/s</b></div><div class="threat-stat"><span>损失上限</span><b>' + fmt(Slice.getEnemyLossCap(), 1) + '</b></div></div></div><div class="progress-block"><span><b>形成进度</b><em id="contact-warning-label"></em></span><div class="bar"><i id="contact-warning-fill"></i></div><button id="begin-contact-btn" class="btn btn-primary">提前建立接触</button></div></div>')) {
        el('begin-contact-btn').addEventListener('click', function () {
          if (Slice.beginContact()) showActionFeedback(this, '接触已经建立', 'amber', true);
          refreshAll();
        });
      }
      el('contact-warning-label').textContent = Math.round(warningPercent) + '%';
      el('contact-warning-fill').style.width = warningPercent + '%';
      return;
    }

    if (enemy.status === 'active') {
      status.textContent = '接触中'; status.className = 'status-chip danger';
      overlayState.textContent = enemy.method ? '方案：' + methodName(enemy.method) : '等待处理方案';
      if (!enemy.method) {
        if (setContactContent('active-chooser', '<div class="enemy-overview"><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>已附着原子层 · 当前以 ' + GC.FIRST_CONTACT.enemyDrainPerSecond.toFixed(2) + ' 原子/秒截取</small></div></div><div class="threat-stats"><div class="threat-stat"><span>已截取</span><b id="contact-siphoned"></b></div><div class="threat-stat"><span>损失上限</span><b id="contact-loss-cap"></b></div><div class="threat-stat"><span>可用方案</span><b>3 / 4</b></div></div></div>' + buildEnemyMethodChooser())) bindEnemyMethodChooser();
        el('contact-siphoned').textContent = fmt(enemy.siphoned, 2);
        el('contact-loss-cap').textContent = fmt(Slice.getEnemyLossCap(), 1);
        return;
      }
      var action = buildEnemyAction(enemy, s);
      var actionKey = ['active', enemy.method, enemy.isolationActive, s.reserveTier, s.focusTier, enemy.overloadPulses].join(':');
      if (setContactContent(actionKey, '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">VL</span><div><strong>真空水蛭</strong><small>已附着 / 原子层</small></div></div><div class="threat-stats"><div class="threat-stat"><span>已截取</span><b id="contact-siphoned"></b></div><div class="threat-stat"><span>损失上限</span><b id="contact-loss-cap"></b></div><div class="threat-stat"><span>处理方案</span><b>' + methodName(enemy.method) + '</b></div></div></div>' + action + '</div>')) bindEnemyAction(enemy);
      el('contact-siphoned').textContent = fmt(enemy.siphoned, 2);
      el('contact-loss-cap').textContent = fmt(Slice.getEnemyLossCap(), 1);
      if (el('enemy-progress-label')) el('enemy-progress-label').textContent = Math.round(enemy.progress) + '%';
      if (el('enemy-progress-fill')) el('enemy-progress-fill').style.width = enemy.progress + '%';
      if (el('enemy-observe-budget')) el('enemy-observe-budget').textContent = fmt(Math.max(0, enemy.siphoned - (enemy.methodStartSiphoned || 0)), 2) + ' / ' + Slice.getObserveGoal() + ' 原子';
      if (enemy.method === 'overload' && el('enemy-action-btn')) el('enemy-action-btn').disabled = GS.getTier(1).count < Slice.getOverloadCost();
      return;
    }

    if (atlasVisible) {
      status.textContent = '反侧压力 ' + Math.round(Slice.getReversePressure()) + '%';
      status.className = 'status-chip ' + (Slice.getReversePressure() >= 60 ? 'danger' : '');
      renderReverseAtlas(s, pendingReverse);
      return;
    }

    status.textContent = s.flags.demoComplete ? '已归档' : '余像稳定';
    status.className = 'status-chip safe';
    overlayState.textContent = '核心余像 / 稳定';
    setContactContent('resolved:' + s.flags.demoComplete, '<div class="threat-grid"><div><div class="threat-name"><span class="threat-symbol">R</span><div><strong>核心余像</strong><small>处理结果：' + methodName(enemy.resolution) + '</small></div></div><div class="threat-stats"><div class="threat-stat"><span>累计截取</span><b>' + fmt(enemy.siphoned, 2) + '</b></div><div class="threat-stat"><span>核心状态</span><b>稳定</b></div><div class="threat-stat"><span>记录</span><b>' + routeNameForMethod(enemy.resolution) + '</b></div></div></div><div class="empty-state small"><p>' + (s.flags.demoComplete ? '余像处置完成，路线信号已更新。' : '请在决策队列中选择余像用途。') + '</p><small>敌人带走的资源已经转化成可追踪结构。</small></div></div>');
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
      return '<div class="progress-block"><span><b>核心过载</b><em id="enemy-progress-label">' + progress + '%</em></span><div class="bar"><i id="enemy-progress-fill" style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (GS.getTier(1).count >= overloadCost ? 'ok' : '') + '">每次脉冲消耗 ' + overloadCost + ' 核子</li><li>已注入 ' + enemy.overloadPulses + ' / ' + GC.FIRST_CONTACT.overloadPulses + ' 次</li></ul><button id="enemy-action-btn" class="btn btn-primary" ' + (GS.getTier(1).count < overloadCost ? 'disabled' : '') + '>注入过载脉冲</button></div>';
    }
    if (enemy.method === 'cutoff') {
      var reserveOk = s.reserveTier === 1;
      var focusOk = s.focusTier !== 2;
      return '<div class="progress-block"><span><b>断供稳定</b><em id="enemy-progress-label">' + progress + '%</em></span><div class="bar"><i id="enemy-progress-fill" style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (reserveOk ? 'ok' : '') + '">' + (reserveOk ? '已完成' : '需要') + '：保护核子层</li><li class="' + (focusOk ? 'ok' : '') + '">' + (focusOk ? '已完成' : '需要') + '：焦点离开原子层</li><li class="' + (enemy.isolationActive ? 'ok' : '') + '">' + (enemy.isolationActive ? '隔离正在运行' : '隔离尚未开启') + '</li></ul><button id="enemy-action-btn" class="btn btn-primary">' + (enemy.isolationActive ? '解除原子隔离' : '开启原子隔离') + '</button></div>';
    }
    return '<div class="progress-block"><span><b>完整样本</b><em id="enemy-progress-label">' + progress + '%</em></span><div class="bar"><i id="enemy-progress-fill" style="width:' + progress + '%"></i></div><ul class="condition-list"><li class="' + (s.focusTier === 2 ? 'ok' : '') + '">' + (s.focusTier === 2 ? '原子层处于焦点中' : '请把焦点移动到原子层') + '</li><li>样本预算 <span id="enemy-observe-budget">' + fmt(Math.max(0, enemy.siphoned - (enemy.methodStartSiphoned || 0)), 2) + ' / ' + Slice.getObserveGoal() + ' 原子</span></li><li>达到预算后自动隔离，不会继续扩大损失</li></ul></div>';
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
    var dominant = ranking[0];
    var pendingReverse = Slice.getPendingReverseObject ? Slice.getPendingReverseObject() : null;
    var inheritedRoute = s.loopNumber === 2 && s.loopSignature ? meta[s.loopSignature.dominantRoute] : null;
    var lead = inheritedRoute
      ? '<section class="route-lead route-' + s.loopSignature.dominantRoute + '"><span>继承路线 / ' + inheritedRoute.ending + '</span><strong>本轮信号不会自动服从上轮答案</strong><small>' + Slice.getRoundTwoCounterexample().title + '正在检验这条路线；下面的信号只记录第二轮真实选择。</small></section>'
      : dominant ? '<section class="route-lead route-' + dominant.id + '"><span>当前主路线 / ' + dominant.meta.ending + '</span><strong>' + dominant.meta.goal + '</strong><small>' + (pendingReverse ? pendingReverse.title + '正在模仿这条路线；重复选择会提高反侧压力。' : dominant.meta.question) + '</small></section>' : '';
    el('route-signals').innerHTML = lead + Object.keys(meta).map(function (id) {
      var score = s.tendencies[id] || 0;
      var sources = s.decisions.filter(function (decision) { return decision.route === id; }).length;
      var intensity = score === 0 ? '潜伏' : score <= 2 ? '出现迹象' : score < max ? '正在收束' : '主导当前文明';
      return '<div class="route-row ' + (dominant && dominant.id === id ? 'dominant' : '') + '"><span class="route-name" style="color:' + meta[id].color + '"><img src="assets/icons/routes/route-' + id + '.svg" alt=""><span><b>' + meta[id].name + '</b><small>' + meta[id].ending + '</small></span></span><div class="route-meter"><i style="width:' + score / max * 100 + '%;background:' + meta[id].color + '"></i></div><b>' + (score === 0 ? '—' : score) + '</b><p>' + intensity + ' · ' + sources + ' 条行为记录<br>' + meta[id].goal + '</p></div>';
    }).join('');

    var oldSummary = document.querySelector('.route-summary');
    if (oldSummary) oldSummary.remove();
    if ((s.flags.demoComplete || (s.loopNumber === 2 && s.flags.civilizationComplete)) && ranking.length >= 2) {
      var summary = document.createElement('div');
      summary.className = 'route-summary';
      summary.innerHTML = s.loopNumber === 2
        ? '<span>第二座文明已经比较</span><strong>' + ranking[0].meta.ending + ' / 异议 ' + ranking[1].meta.ending + '</strong><small>这里是本轮选择形成的信号，不会覆盖继承路线。</small>'
        : '<span>文明将优先讨论</span><strong>' + ranking[0].meta.ending + ' / 备选 ' + ranking[1].meta.ending + '</strong><small>反宇宙回应与偶发现象也已进入提案依据。</small>';
      el('route-signals').after(summary);
    }
  }

  function updateLog() {
    var logs = GS.getSlice().logs;
    var logLayer = el('log-layer');
    if (el('log-count')) el('log-count').textContent = logs.length;
    if (logLayer && !logLayer.hidden) lastViewedLogCount = logs.length;
    if (el('log-btn')) el('log-btn').classList.toggle('has-unread', logs.length > lastViewedLogCount);
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
    for (var i = 0; i < GC.TIERS.length; i++) {
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
      var reverseInfluences = Slice.getReverseInfluences ? Slice.getReverseInfluences(row.tierId) : [];
      return '<div class="flow-row ' + flowState + (reverseInfluences.length ? ' reverse-affected' : '') + '" data-tier="' + row.tierId + '">' +
        '<div class="flow-identity"><img src="assets/icons/tiers/tier-' + row.meta.name.toLowerCase() + '.svg" alt=""><span><b style="color:' + row.meta.color + '">' + row.meta.nameZh + '</b><small>库存 ' + fmt(row.tier.count, 1) + '</small>' + (reverseInfluences.length ? '<small class="reverse-flow-impact">↔ ' + reverseInfluences.map(function (item) { return item.label; }).join(' · ') + '</small>' : '') + '</span></div>' +
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
    if (s.loopNumber === 2) {
      if ([0, 3, 4, 7, 10, 11].indexOf(step) !== -1) return { selector: '#event-panel' };
      if (step === 1 || step === 5) return { selector: '#stability-checklist', reveal: '#flow-monitor' };
      if (step === 2) return { selector: GS.getTier(2).researched ? (GS.getTier(2).totalEver < 10 ? '#btn-synth-2' : '#btn-prod-2') : (GS.canResearch(2) ? '#btn-research-global' : '.research-bar') };
      if (step === 6) return { selector: GS.getTier(3).researched ? (GS.getTier(3).totalEver < 8 ? '#btn-synth-3' : '#btn-prod-3') : (GS.canResearch(3) ? '#btn-research-global' : '.research-bar') };
      if (step === 8) {
        if (!GS.getTier(4).researched) return { selector: GS.canResearch(4) ? '#btn-research-global' : '.research-bar' };
        if (!GS.getTier(5).researched) return { selector: GS.canResearch(5) ? '#btn-research-global' : '.research-bar' };
        return { selector: '#btn-synth-5' };
      }
      if (step === 9) return { selector: GS.getTier(6).researched ? '#btn-synth-6' : (GS.canResearch(6) ? '#btn-research-global' : '.research-bar') };
      return { selector: '#route-panel' };
    }
    if (Slice.getPendingReverseObject && Slice.getPendingReverseObject()) return { selector: '#event-panel' };
    if (step === 0) return { selector: '#cosmos-stage', center: true };
    if (step === 1) return { selector: '#btn-prod-0' };
    if (step === 2) return { selector: '#btn-synth-1' };
    if (step === 3) {
      if (GS.getTier(1).producers < 1 && GS.getTier(1).count < GS.getProducerCost(1)) return { selector: '#btn-synth-1' };
      if (GS.getTier(1).producers < 1) return { selector: '#btn-prod-1' };
      return { selector: '#btn-focus-1' };
    }
    if (step === 4 || step === 9 || step === 20) return { selector: '#stability-checklist', reveal: '#flow-monitor' };
    if (step === 5) return { selector: '#research-details-toggle' };
    if (step === 6) return { selector: GS.canResearch(2) ? '#btn-research-global' : '.research-bar' };
    if (step === 7) return { selector: GS.getTier(2).totalEver < 18 ? '#btn-synth-2' : '#btn-prod-2' };
    if (step === 8) return { selector: '#btn-reserve-1' };
    if (step === 10 || step === 14) return { selector: '#event-panel' };
    if (step === 11) {
      if (!s.preparation.id) return { selector: '#event-panel' };
      if (s.preparation.id === 'buffer') return { selector: '#card-1' };
      if (s.preparation.id === 'pulse') return { selector: '#card-2' };
      return { selector: '.research-bar' };
    }
    if (step === 12 || step === 13) return { selector: '#contact-panel' };
    if (step === 15) return { selector: '#event-panel' };
    if (step === 16) return { selector: GS.getTier(3).researched ? (GS.getTier(3).totalEver < 12 ? '#btn-synth-3' : '#btn-prod-3') : (GS.canResearch(3) ? '#btn-research-global' : '.research-bar') };
    if (step === 17) return { selector: GS.getTier(4).researched ? (GS.getTier(4).totalEver < 10 ? '#btn-synth-4' : '#btn-prod-4') : (GS.canResearch(4) ? '#btn-research-global' : '.research-bar') };
    if (step === 18) return { selector: '#event-panel' };
    if (step === 19) return { selector: GS.getTier(5).researched ? (GS.getTier(5).totalEver < 6 ? '#btn-synth-5' : '#btn-prod-5') : (GS.canResearch(5) ? '#btn-research-global' : '.research-bar') };
    if (step === 21) return { selector: GS.canResearch(6) ? '#btn-research-global' : '.research-bar' };
    if (step === 22) return { selector: '#btn-synth-6' };
    if (step === 23) return { selector: '#event-panel' };
    return { selector: '#route-panel' };
  }

  function getGuidePhase(s, guide) {
    if (!s) return 'no-state';
    if (guide && guide.interlude) return 'interlude:' + String(guide.nextStep);
    var descriptor = getGuideTarget(s);
    var parts = [
      'loop:' + String(s.loopNumber || 1),
      'step:' + String(s.missionStep),
      'target:' + descriptor.selector,
    ];
    if (s.missionStep === 11) parts.push('preparation:' + (s.preparation.id || 'unselected'));
    if (s.missionStep === 13) parts.push('method:' + (s.enemy.method || 'unselected'));
    if (s.loopNumber === 2 && s.missionStep === 8) {
      parts.push('cell:' + String(GS.getTier(4).researched), 'life:' + String(GS.getTier(5).researched));
    }
    var pending = Slice.getPendingReverseObject ? Slice.getPendingReverseObject() : null;
    if (pending) parts.push('reverse:' + pending.id + ':' + pending.state.status);
    return parts.join('|');
  }

  function getGuideLoreTarget(s) {
    if (!s) return null;
    var pending = Slice.getPendingReverseObject ? Slice.getPendingReverseObject() : null;
    if (pending) {
      return {
        lattice: { id: 'reverse-lattice', label: '查看“反相晶簇”档案' },
        choir: { id: 'silent-choir', label: '查看“静默合唱体”档案' },
        seed: { id: 'mirror-seed', label: '查看“镜像胚种”档案' },
      }[pending.id] || null;
    }
    if (s.loopNumber === 2) {
      if (s.missionStep === 0) return { id: 'route-signal', label: '查看“路线信号”档案' };
      if (s.missionStep === 4 || s.missionStep === 5) return { id: 'reverse-pressure', label: '查看“反侧压力”档案' };
      if (s.missionStep === 8) return { id: 'life-tier', label: '查看“生命层”档案' };
      if (s.missionStep >= 9) return { id: 'civilization-tier', label: '查看“文明层”档案' };
      return null;
    }
    var targets = {
      5: { id: 'research-channel', label: '查看“研究通道”档案' },
      10: { id: 'first-law', label: '查看“第一法则”档案' },
      12: { id: 'reverse-side', label: '查看“背面宇宙”档案' },
      13: { id: 'vacuum-leech', label: '查看“真空水蛭”档案' },
      15: { id: 'horizon', label: '查看“视界”档案' },
      16: { id: 'reverse-pressure', label: '查看“反侧压力”档案' },
      17: { id: 'cell-tier', label: '查看“细胞层”档案' },
      19: { id: 'life-tier', label: '查看“生命层”档案' },
      23: { id: 'civilization-tier', label: '查看“文明层”档案' },
    };
    return targets[s.missionStep] || null;
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
    var loreTarget = getGuideLoreTarget(s);
    var loreButton = el('guide-lore-link');
    loreButton.hidden = !loreTarget;
    if (loreTarget) {
      loreButton.dataset.loreTarget = loreTarget.id;
      loreButton.textContent = loreTarget.label;
    } else {
      loreButton.removeAttribute('data-lore-target');
    }
    var returnButton = el('guide-return');
    var workspaceSteps = s.loopNumber === 2 ? [1, 2, 5, 6, 8, 9] : [4, 9, 11, 16, 17, 19, 20, 21, 22];
    var needsWorkspace = workspaceSteps.indexOf(s.missionStep) !== -1 && progress.percent < 100;
    var researchTierByStep = s.loopNumber === 2 ? { 2: 2, 6: 3, 9: 6 } : { 6: 2, 16: 3, 17: 4, 19: 5, 21: 6 };
    var waitingTier = s.loopNumber === 2 && s.missionStep === 8
      ? (!GS.getTier(4).researched ? 4 : (!GS.getTier(5).researched ? 5 : undefined))
      : researchTierByStep[s.missionStep];
    var needsResearchWait = waitingTier !== undefined && !GS.getTier(waitingTier).researched && !GS.canResearch(waitingTier);
    returnButton.hidden = !(needsWorkspace || needsResearchWait);
    returnButton.textContent = needsResearchWait ? '明白，返回主界面积累' : (s.loopNumber !== 2 && s.missionStep === 11 ? '返回主界面完成接触准备' : '返回主界面调整资源');

    var descriptor = getGuideTarget(s);
    if (descriptor.reveal) {
      var reveal = document.querySelector(descriptor.reveal);
      if (reveal && reveal.classList.contains('collapsed')) {
        reveal.classList.remove('collapsed');
        el('flow-monitor-toggle').textContent = '—';
        el('flow-monitor-toggle').setAttribute('aria-expanded', 'true');
        el('flow-monitor-toggle').setAttribute('aria-label', '最小化物质流量监视器');
        flowAutoExpanded = true;
        layer.style.visibility = 'hidden';
        setTimeout(function () {
          layer.style.visibility = '';
          positionGuide();
        }, 210);
        return;
      }
    }
    var resolvedTarget = resolveVisibleGuideTarget(descriptor);
    descriptor = resolvedTarget.descriptor;
    var target = resolvedTarget.target;
    if (!target) return;

    var stepChanged = lastGuideStep !== s.missionStep;
    lastGuideStep = s.missionStep;
    var rect = target.getBoundingClientRect();
    if (stepChanged && (rect.bottom < 8 || rect.top > window.innerHeight - 8)) {
      layer.style.visibility = 'hidden';
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(function () {
        layer.style.visibility = '';
        positionGuide();
      }, 360);
      return;
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
    var resolvedTarget = resolveVisibleGuideTarget(getGuideTarget(GS.getSlice()));
    var descriptor = resolvedTarget.descriptor;
    var target = resolvedTarget.target;
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
      lastDiscoveryId = null;
      return;
    }
    card.hidden = false;
    // Keep the live choice buttons mounted between HUD refreshes. Replacing
    // them four times per second breaks hover/focus and makes clicks depend on
    // landing between refresh frames.
    if (lastDiscoveryId === discovery.id) return;
    card.dataset.discoveryId = discovery.id;
    el('discovery-code').textContent = discovery.code;
    el('discovery-title').textContent = discovery.title;
    el('discovery-copy').textContent = discovery.copy;
    el('discovery-note').textContent = discovery.note;
    var choices = el('discovery-choices');
    choices.innerHTML = discovery.choices ? discovery.choices.map(function (choice) {
      return '<button type="button" class="route-' + choice.route + '" data-discovery-choice="' + choice.id + '"><b>' + choice.title + '</b><small>' + choice.desc + ' · ' + Slice.getRouteMeta()[choice.route].name + ' +1</small></button>';
    }).join('') : '';
    el('discovery-ack').hidden = !!(discovery.choices && discovery.choices.length);
    lastDiscoveryId = discovery.id;
    playSound('discovery-' + discovery.id);
    card.classList.remove('discovery-enter');
    void card.offsetWidth;
    card.classList.add('discovery-enter');
    showToast(discovery.title + ' · 不会中断当前操作', false);
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
    if (I18n) I18n.apply(el('lore-layer'));
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

  function openLoreEntry(entryId) {
    if (!entryId) {
      openLoreArchive();
      return;
    }
    openLoreArchive();
    var details = el('lore-entries').querySelector('[data-entry-id="' + entryId + '"]');
    if (!details) return;
    details.open = true;
    Slice.markArchiveRead(entryId);
    details.classList.remove('unread');
    updateArchiveBadge();
    setTimeout(function () {
      details.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var summary = details.querySelector('summary');
      if (summary) summary.focus({ preventScroll: true });
    }, 0);
  }

  function closeLoreArchive() {
    var layer = el('lore-layer');
    if (layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lore-open');
    if (loreLastFocus && loreLastFocus.focus) loreLastFocus.focus();
  }

  function openObservationLog() {
    var layer = el('log-layer');
    logLastFocus = document.activeElement;
    lastViewedLogCount = GS.getSlice().logs.length;
    el('log-btn').classList.remove('has-unread');
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('log-open');
    el('log-close').focus();
  }

  function closeObservationLog() {
    var layer = el('log-layer');
    if (layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('log-open');
    if (logLastFocus && logLastFocus.focus) logLastFocus.focus();
  }

  function refreshAll() {
    if (!GS.getState()) return;
    updateMission();
    updateResearch();
    for (var i = 0; i < GC.TIERS.length; i++) updateCard(i);
    updateEraIndicator();
    updateEventPanel();
    updateContact();
    updateRoutes();
    updateLog();
    updateFlowMonitor();
    updateClickHint();
    updateDiscovery();
    updateArchiveBadge();
    updateProgressiveDisclosure();
    updateGoalRail();
    updateOperationResourceStrip();
    updateObservationPanel();
    updateTalentPanel();
    updateInterventionBadge();
    updatePrimaryAction();
    updateGuide();
    if (I18n) I18n.apply(document.body);
  }

  function bindButtons() {
    el('workspace-tabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-workspace]');
      if (!button) return;
      if (setWorkspace(button.dataset.workspace, true)) refreshAll();
    });
    el('workspace-tabs').addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      var name = event.key === 'ArrowLeft' ? 'evolution' : 'intervention';
      if (setWorkspace(name, false)) {
        refreshAll();
        el('workspace-' + name).focus();
      }
    });
    el('operation-resource-list').addEventListener('click', function (event) {
      var button = event.target.closest('[data-tier-jump]');
      if (!button) return;
      var tierId = parseInt(button.dataset.tierJump, 10);
      setWorkspace('evolution', true);
      refreshAll();
      setTimeout(function () {
        var card = el('card-' + tierId);
        if (!card) {
          el('workspace-evolution').focus();
          return;
        }
        var focusTarget = card.querySelector('.is-primary-action:not([disabled]), button:not([disabled])');
        if (focusTarget) focusTarget.focus({ preventScroll: true });
        else el('workspace-evolution').focus({ preventScroll: true });
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    });
    el('observation-options').addEventListener('click', function (event) {
      var button = event.target.closest('[data-observation-id]');
      if (!button || button.disabled) return;
      if (Slice.useObservationProtocol(button.dataset.observationId)) {
        playSound('ui-focus-lock');
        showActionFeedback(button, button.querySelector('b').textContent + ' · 已启动', 'green', true);
        observationRenderKey = '';
      }
      refreshAll();
    });
    el('talent-grid').addEventListener('click', function (event) {
      var button = event.target.closest('[data-talent-id]');
      if (!button || button.disabled) return;
      if (Slice.spendTalentPoint(button.dataset.talentId)) {
        playSound('ui-tier-unlock');
        showActionFeedback(button, button.querySelector('strong').textContent + ' · 已强化', 'green', true);
        talentRenderKey = '';
      }
      refreshAll();
    });

    for (var i = 0; i <= 6; i++) {
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
      var researchSteps = [6, 16, 17, 19, 21];
      if (researchSteps.indexOf(step) !== -1) Slice.acknowledgeGuideGoal('research');
      if ([4, 9, 20].indexOf(step) !== -1) Slice.acknowledgeGuideGoal('stability');
      animateGuideToDock();
      guideCollapsed = true;
      var toastCopy = researchSteps.indexOf(step) !== -1
        ? '继续积累研究点；达到阈值时会主动提示'
        : step === 11
          ? '主界面已恢复；接触准备会持续显示条件与计时'
          : '操作区已恢复；任务进度会持续显示实时判定';
      showToast(toastCopy, false);
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

    el('debug-speed-up').addEventListener('click', function () {
      GE.setTimeScale(100);
      showToast('测试时标已切换为 ×100；点击标题字母 Y 的中部恢复', true);
    });
    el('debug-speed-normal').addEventListener('click', function () {
      GE.setTimeScale(1);
      showToast('测试时标已恢复 ×1', false);
    });

    el('log-btn').addEventListener('click', openObservationLog);
    el('archive-btn').addEventListener('click', openLoreArchive);
    el('sound-toggle').addEventListener('click', function () {
      if (!Sound) return;
      Sound.toggleMuted();
      updateSoundToggle();
      if (!Sound.isMuted()) playSound('ui-focus-lock');
    });
    el('lore-close').addEventListener('click', closeLoreArchive);
    el('lore-backdrop').addEventListener('click', closeLoreArchive);
    el('log-close').addEventListener('click', closeObservationLog);
    el('log-backdrop').addEventListener('click', closeObservationLog);
    el('lore-search').addEventListener('input', function () { renderLoreArchive(this.value); });
    el('lore-categories').addEventListener('click', function (event) {
      var button = event.target.closest('[data-category]');
      if (!button) return;
      loreCategory = button.dataset.category;
      renderLoreArchive(el('lore-search').value);
    });
    document.addEventListener('click', function (event) {
      var target = event.target.closest ? event.target.closest('[data-lore-target]') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      hideTooltip();
      openLoreEntry(target.dataset.loreTarget);
    });
    el('discovery-ack').addEventListener('click', function () {
      var card = el('discovery-card');
      if (Slice.acknowledgeDiscovery(card.dataset.discoveryId)) {
        showToast('偶发发现已写入档案；当前目标不受影响', false);
        updateDiscovery();
        updateArchiveBadge();
      }
    });
    el('discovery-choices').addEventListener('click', function (event) {
      var button = event.target.closest('[data-discovery-choice]');
      var card = el('discovery-card');
      if (!button || !card.dataset.discoveryId) return;
      if (Slice.resolveDiscoveryChoice(card.dataset.discoveryId, button.dataset.discoveryChoice)) {
        showActionFeedback(button, button.querySelector('b').textContent + ' · 已写入路线', 'green', true);
        updateRoutes();
        updateDiscovery();
        updateArchiveBadge();
      }
    });
    el('era-indicator-dismiss').addEventListener('click', function () {
      if (!Slice.dismissEraIndicator()) return;
      if (window.TinyCosmos && window.TinyCosmos.saveGame) window.TinyCosmos.saveGame();
      updateEraIndicator();
      showToast('细胞阶段提示已收起；反侧压力仍会显示在资源卡与接触面板', false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !el('lore-layer').hidden) closeLoreArchive();
      if (event.key === 'Escape' && !el('log-layer').hidden) closeObservationLog();
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
    setWorkspace(document.body.dataset.workspace || 'evolution', false);
    bindButtons();
    updateSoundToggle();
    refreshAll();
    document.addEventListener('tinycosmos:localechange', function () {
      eventRenderKey = '';
      contactRenderKey = '';
      observationRenderKey = '';
      talentRenderKey = '';
      operationResourceRenderKey = '';
      lastLogSignature = '';
      refreshAll();
    });
  }

  function revealGuide() {
    guideCollapsed = false;
    lastGuideStep = null;
    lastGuidePhase = null;
  }

  function formatBackgroundDuration(seconds) {
    var rounded = Math.max(0, Math.floor(seconds || 0));
    var isEnglish = I18n && I18n.getLocale() === 'en';
    if (rounded < 60) return rounded + (isEnglish ? ' sec' : ' 秒');
    if (rounded < 3600) return Math.floor(rounded / 60) + (isEnglish ? ' min ' : ' 分 ') + String(rounded % 60).padStart(2, '0') + (isEnglish ? ' sec' : ' 秒');
    return Math.floor(rounded / 3600) + (isEnglish ? ' hr ' : ' 小时 ') + Math.floor(rounded % 3600 / 60) + (isEnglish ? ' min' : ' 分');
  }

  function notifyBackgroundProgress(result) {
    if (!result || result.simulatedSeconds < 1) return;
    var text = (I18n ? I18n.text('后台演化已补算 ', 'Background evolution simulated ') : '后台演化已补算 ')
      + formatBackgroundDuration(result.simulatedSeconds)
      + (I18n ? I18n.text('；生产、代谢、研究与计时均已同步', '; production, demand, research, and timers are synchronized') : '；生产、代谢、研究与计时均已同步');
    if (result.capped) text += I18n ? I18n.text('（单次上限 12 小时）', ' (12-hour limit per session)') : '（单次上限 12 小时）';
    showToast(text, false);
  }

  window.GameUI = {
    init: init,
    refreshAll: refreshAll,
    revealGuide: revealGuide,
    notifyBackgroundProgress: notifyBackgroundProgress,
    openLoreEntry: openLoreEntry,
  };
})();
