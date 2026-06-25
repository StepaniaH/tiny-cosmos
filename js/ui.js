// tiny-cosmos v2 — UI Layer
// Body-level event delegation. Context-sensitive actions. Tier overview.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;

  // ── Helpers ──
  function fmt(n, d) {
    if (d === undefined) d = 1;
    if (n >= 1e6) return (n / 1e6).toFixed(d) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(d) + 'K';
    if (n >= 100) return Math.floor(n).toString();
    return n.toFixed(d);
  }
  function fmtInt(n) { return Math.floor(n).toString(); }

  // ── Focus Stats ──
  function updateFocus() {
    var s = GS.getState();
    var q = s.tiers[0];
    var prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
    document.getElementById('focus-q-count').textContent = fmt(q.count, q.count < 100 ? 2 : 0);
    document.getElementById('focus-q-rate').textContent = '+' + fmt(prod, 1) + '/s';

    var rp = s.researchPoints;
    document.getElementById('focus-rp-count').textContent = fmt(rp, 1);

    var maxRes = GS.getMaxResearchedTier();
    var next = maxRes + 1;
    if (next < GC.TIERS.length) {
      var cost = GS.getResearchCost(next);
      document.getElementById('focus-rp-target').textContent = '/' + cost;
    } else {
      document.getElementById('focus-rp-target').textContent = '';
    }
  }

  // ── Tier Overview (compact stats for all unlocked tiers) ──
  function updateTierOverview() {
    var container = document.getElementById('tier-overview');
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var html = '';

    for (var i = 0; i <= maxRes; i++) {
      var t = s.tiers[i];
      var tpl = GC.TIERS[i];

      // Calculate net production
      var prod = 0, demand = 0;
      if (i === 0) {
        prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
      } else if (tpl.baseProd > 0) {
        prod = GS.getProducerOutput(i) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(i);
      }
      if (i < GC.TIERS.length - 1) {
        var higher = s.tiers[i + 1];
        if (higher.researched) {
          var dm = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
          if (GS.hasMilestone(7)) dm *= 0.7;
          demand = higher.count * dm;
        }
      }
      var net = prod - demand;
      var netSign = net >= 0 ? '+' : '';
      var netClass = net >= 0 ? 'net-pos' : 'net-neg';

      var producers = t.producers > 0 ? ' <span class="ov-prod">×' + t.producers + '</span>' : '';

      html += '<div class="ov-tier">' +
        '<span class="ov-dot" style="background:' + tpl.color + '"></span>' +
        '<span class="ov-name">' + tpl.nameZh + '</span>' +
        '<span class="ov-count">' + fmt(t.count, i <= 2 ? 2 : 0) + '</span>' +
        producers +
        '<span class="ov-net ' + netClass + '">' + netSign + fmt(net, 2) + '/s</span>' +
        '</div>';
    }

    // Next researchable tier hint
    var next = maxRes + 1;
    if (next < GC.TIERS.length) {
      var nt = GC.TIERS[next];
      html += '<div class="ov-tier ov-next">' +
        '<span class="ov-dot" style="background:' + nt.color + ';opacity:0.3"></span>' +
        '<span class="ov-name" style="color:var(--text-dim)">' + nt.nameZh + '</span>' +
        '<span class="ov-count" style="color:var(--blue)">🔬 ' + GS.getResearchCost(next) + ' RP</span>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  // ── Action Buttons ──
  function updateActions() {
    var container = document.getElementById('action-bar');
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var html = '';

    // 1. Quark producer
    var qCost = GS.getProducerCost(0);
    var canBuyQ = s.tiers[0].count >= qCost;
    html += '<button class="btn btn-primary" data-action="buy-producer" data-tier="0"' +
      (canBuyQ ? '' : ' disabled') + '>' +
      '⚡ 自动观测 (' + fmtInt(qCost) + ')' +
      '</button>';

    // 2. Synthesis for most relevant unlocked tier (skip quark and civ)
    var synthTier = 0;
    for (var t = maxRes; t >= 1; t--) {
      if (t === 6) continue;
      if (s.tiers[t - 1].count > 0 || s.tiers[t].count > 0) {
        synthTier = t;
        break;
      }
    }
    if (synthTier === 0 && maxRes >= 1) synthTier = 1;

    if (synthTier > 0) {
      var cost = GS.getSynthCost(synthTier);
      var batch = GS.getSynthBatchSize();
      var canSynth = s.tiers[synthTier - 1].count >= (cost * batch);
      html += '<button class="btn" data-action="synthesize" data-tier="' + synthTier + '"' +
        (canSynth ? '' : ' disabled') + '>' +
        '⬆ ' + GC.TIERS[synthTier - 1].nameZh + '→' + GC.TIERS[synthTier].nameZh + ' (' + fmtInt(cost) + '×' + batch + ')' +
        '</button>';
    }

    // 3. Producer for current highest tier (skip quark and civ)
    for (var p = maxRes; p >= 1; p--) {
      var tp = GC.TIERS[p];
      if (tp.producerBaseCost === 0 || p === 6) continue;
      var pCost = GS.getProducerCost(p);
      var canBuyP = s.tiers[p].count >= pCost;
      html += '<button class="btn" data-action="buy-producer" data-tier="' + p + '"' +
        (canBuyP ? '' : ' disabled') + '>' +
        '⚙ ' + tp.nameZh + ' (' + fmtInt(pCost) + ')' +
        '</button>';
      break;
    }

    // 4. Research
    var nextTier = maxRes + 1;
    if (nextTier < GC.TIERS.length) {
      var rCost = GS.getResearchCost(nextTier);
      var rName = GC.TIERS[nextTier].nameZh;
      var canR = GS.canResearch(nextTier);
      html += '<button class="btn btn-blue" data-action="research" data-tier="' + nextTier + '"' +
        (canR ? '' : ' disabled') + '>' +
        '🔬 研究 ' + rName + ' (' + fmt(s.researchPoints, 0) + '/' + rCost + ')' +
        '</button>';
    }

    container.innerHTML = html;
  }

  // ── Evolution Line ──
  function updateEvolution() {
    var container = document.getElementById('evolution-line');
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var html = '';

    for (var i = 0; i < GC.TIERS.length; i++) {
      var tpl = GC.TIERS[i];
      var t = s.tiers[i];

      if (i > 0) html += '<span class="evo-arrow">→</span>';

      if (t.researched) {
        html += '<span class="evo-node active" style="background:' + tpl.color + ';--node-color:' + tpl.glow + '" title="' + tpl.nameZh + ': ' + fmt(t.count, 0) + '">' +
          tpl.symbol + '</span>';
      } else if (i === maxRes + 1) {
        html += '<span class="evo-node researchable" title="研究需要 ' + GS.getResearchCost(i) + ' RP">?</span>';
      } else {
        html += '<span class="evo-node locked">·</span>';
      }
    }

    container.innerHTML = html;
  }

  // ── Prestige ──
  function updatePrestige() {
    var panel = document.getElementById('prestige-panel');
    var canP = GS.canPrestige();
    var hasP = GS.getPrestiges() > 0;

    if (canP || hasP) {
      panel.style.display = 'block';
      if (canP) {
        var gain = GS.calcCPGain();
        document.getElementById('prestige-gain-text').textContent = '获得 ' + gain + ' 恒定点';
        document.getElementById('prestige-btn').style.display = '';
      } else {
        document.getElementById('prestige-btn').style.display = 'none';
      }
      if (hasP) {
        document.getElementById('prestige-detail').style.display = 'flex';
        updateConstantSliders();
      }
    } else {
      panel.style.display = 'none';
    }
  }

  function updateConstantSliders() {
    var cp = GS.getCP();
    var c = GS.getConstants();
    document.getElementById('cp-total').textContent = cp;
    document.getElementById('cp-used').textContent = GS.getAllocatedCP();
    document.getElementById('cp-free').textContent = GS.getUnspentCP();

    var sliders = [
      { id: 'constant-strong', val: c.strongForce, lvl: 'sf-level', eff: 'sf-effect', coeff: GC.STRONG_FORCE_COEFF, pfx: '÷' },
      { id: 'constant-light', val: c.lightSpeed, lvl: 'ls-level', eff: 'ls-effect', coeff: GC.LIGHT_SPEED_COEFF, pfx: '×' },
      { id: 'constant-gravity', val: c.gravity, lvl: 'gv-level', eff: 'gv-effect', coeff: GC.GRAVITY_COEFF, pfx: '×' },
    ];
    sliders.forEach(function (s) {
      var el = document.getElementById(s.id);
      el.max = cp;
      if (+el.value !== s.val) el.value = s.val;
      document.getElementById(s.lvl).textContent = s.val;
      if (s.val === 0) { document.getElementById(s.eff).textContent = '1.00'; return; }
      var b = Math.sqrt(s.val) - 1;
      document.getElementById(s.eff).textContent = (1 + b * s.coeff).toFixed(2);
    });
  }

  // ── Milestones ──
  function updateMilestones() {
    var ms = GS.getMilestones();
    var bar = document.getElementById('milestones-bar');
    if (ms.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = '';
    ms.forEach(function (at) {
      var m = GC.MILESTONES.find(function (x) { return x.at === at; });
      if (m) {
        var b = document.createElement('span');
        b.className = 'milestone-badge';
        b.textContent = '★ ' + m.name;
        b.title = m.descZh;
        bar.appendChild(b);
      }
    });
  }

  // ── Click hint ──
  function updateClickHint() {
    var hint = document.getElementById('click-hint');
    var q = GS.getTier(0);
    if (q && q.totalEver > 30) hint.style.opacity = '0';
  }

  // ── Full Refresh ──
  var refreshScheduled = false;
  function refreshAll() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(function () {
      updateFocus();
      updateTierOverview();
      updateActions();
      updateEvolution();
      updatePrestige();
      updateMilestones();
      updateClickHint();
      refreshScheduled = false;
    });
  }

  // ── Event Delegation (on body) ──
  function handleAction(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;

    // Disabled buttons don't fire click events in browsers, so this should never be true.
    // But just in case the click came from a programmatic dispatch:
    if (btn.disabled) return;

    var action = btn.dataset.action;
    var tierId = parseInt(btn.dataset.tier);

    var ok = false;
    if (action === 'buy-producer') ok = GE.buyProducer(tierId);
    else if (action === 'synthesize') ok = GE.synthesize(tierId);
    else if (action === 'research') ok = GE.research(tierId);

    if (!ok) flashFeedback('资源不足');
  }

  var feedbackTimer = null;
  function flashFeedback(msg) {
    var el = document.getElementById('feedback-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'feedback-toast';
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:8px 20px;background:rgba(255,92,92,0.9);color:#fff;border-radius:999px;font-size:13px;z-index:999;pointer-events:none;transition:opacity 0.3s;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(function () { el.style.opacity = '0'; }, 800);
  }

  // ── Init ──
  function init() {
    // Body-level event delegation
    document.body.addEventListener('click', handleAction);

    // Prestige button
    document.getElementById('prestige-btn').addEventListener('click', function (e) {
      e.stopPropagation(); // don't let body handler catch this
      if (GS.canPrestige()) { GE.bigCrunch(); refreshAll(); }
    });

    // Constant sliders
    function onSlider() {
      GS.allocateCP(
        +document.getElementById('constant-strong').value,
        +document.getElementById('constant-light').value,
        +document.getElementById('constant-gravity').value
      );
      updateConstantSliders();
    }
    document.getElementById('constant-strong').addEventListener('input', onSlider);
    document.getElementById('constant-light').addEventListener('input', onSlider);
    document.getElementById('constant-gravity').addEventListener('input', onSlider);

    // Canvas click
    var canvas = document.getElementById('cosmos-canvas');
    canvas.addEventListener('click', function (e) {
      e.stopPropagation();
      window.CanvasRenderer.onClick(e);
    });

    refreshAll();
  }

  window.GameUI = { init: init, refreshAll: refreshAll };
})();
