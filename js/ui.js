// tiny-cosmos v2 — UI Layer
// Event delegation. Context-sensitive action buttons. Evolution line.
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
    document.getElementById('focus-rp-count').textContent = fmt(s.researchPoints, 1);
  }

  // ── Action Buttons ──

  function updateActions() {
    var container = document.getElementById('action-bar');
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var nextTier = maxRes + 1;
    var html = '';

    // 1. Quark producer (always available)
    var qCost = GS.getProducerCost(0);
    var canBuyQ = s.tiers[0].count >= qCost;
    html += '<button class="btn btn-primary" data-action="buy-producer" data-tier="0"' +
      (canBuyQ ? '' : ' disabled') + '>' +
      '⚡ 自动观测 (' + fmtInt(qCost) + ' 夸克)' +
      '</button>';

    // 2. Synthesis for highest accessible tier
    for (var t = maxRes; t >= 1; t--) {
      if (t === 6) continue; // civilization has no manual synth
      var cost = GS.getSynthCost(t);
      var batch = GS.getSynthBatchSize();
      var canSynth = s.tiers[t - 1].count >= (cost * batch);
      var tierName = GC.TIERS[t].nameZh;
      var srcName = GC.TIERS[t - 1].nameZh;
      html += '<button class="btn" data-action="synthesize" data-tier="' + t + '"' +
        (canSynth ? '' : ' disabled') + '>' +
        '⬆ ' + srcName + '→' + tierName + ' (' + fmtInt(cost) + '×' + batch + ')' +
        '</button>';
      break; // only show one synth button at a time
    }

    // 3. Buy producer for current tier (if available and not quark)
    for (var p = maxRes; p >= 1; p--) {
      var tp = GC.TIERS[p];
      if (tp.producerBaseCost === 0) continue;
      var pCost = GS.getProducerCost(p);
      var canBuyP = s.tiers[p].count >= pCost;
      html += '<button class="btn" data-action="buy-producer" data-tier="' + p + '"' +
        (canBuyP ? '' : ' disabled') + '>' +
        '⚙ ' + tp.nameZh + ' 生产 (' + fmtInt(pCost) + ')' +
        '</button>';
      break;
    }

    // 4. Research (if next tier exists)
    if (nextTier < GC.TIERS.length) {
      var rCost = GS.getResearchCost(nextTier);
      var rName = GC.TIERS[nextTier].nameZh;
      var canResearch = GS.canResearch(nextTier);
      html += '<button class="btn btn-blue" data-action="research" data-tier="' + nextTier + '"' +
        (canResearch ? '' : ' disabled') + '>' +
        '🔬 研究 ' + rName + ' (' + fmt(s.researchPoints, 0) + '/' + rCost + ' RP)' +
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

      if (i > 0) {
        html += '<span class="evo-arrow">→</span>';
      }

      if (t.researched) {
        // Active node
        var cnt = t.count > 0 ? ' <span class="evo-count">' + fmt(t.count, 0) + '</span>' : '';
        html += '<span class="evo-step">' +
          '<span class="evo-node active" style="background:' + tpl.color + ';--node-color:' + tpl.glow + '">' +
            tpl.symbol +
          '</span>' +
          cnt +
          '</span>';
      } else if (i === maxRes + 1) {
        // Next researchable
        html += '<span class="evo-step">' +
          '<span class="evo-node researchable" title="' + GS.getResearchCost(i) + ' RP">?</span>' +
          '</span>';
      } else {
        // Locked
        html += '<span class="evo-step">' +
          '<span class="evo-node locked">·</span>' +
          '</span>';
      }
    }

    container.innerHTML = html;
  }

  // ── Prestige ──

  function updatePrestige() {
    var panel = document.getElementById('prestige-panel');
    var canP = GS.canPrestige();
    var hasPrestiged = GS.getPrestiges() > 0;

    if (canP || hasPrestiged) {
      panel.style.display = 'block';
      if (canP) {
        var gain = GS.calcCPGain();
        document.getElementById('prestige-gain-text').textContent = '获得 ' + gain + ' 恒定点';
        document.getElementById('prestige-btn').style.display = '';
      } else {
        document.getElementById('prestige-btn').style.display = 'none';
      }

      // Constants detail (only show if has prestiged)
      if (hasPrestiged) {
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
    var used = GS.getAllocatedCP();
    var free = GS.getUnspentCP();

    document.getElementById('cp-total').textContent = cp;
    document.getElementById('cp-used').textContent = used;
    document.getElementById('cp-free').textContent = free;

    var sfS = document.getElementById('constant-strong');
    var lsS = document.getElementById('constant-light');
    var gvS = document.getElementById('constant-gravity');

    [sfS, lsS, gvS].forEach(function (s) { s.max = cp; });
    if (+sfS.value !== c.strongForce) sfS.value = c.strongForce;
    if (+lsS.value !== c.lightSpeed) lsS.value = c.lightSpeed;
    if (+gvS.value !== c.gravity) gvS.value = c.gravity;

    setEffect(c.strongForce, 'sf-level', 'sf-effect', GC.STRONG_FORCE_COEFF, '÷');
    setEffect(c.lightSpeed, 'ls-level', 'ls-effect', GC.LIGHT_SPEED_COEFF, '×');
    setEffect(c.gravity, 'gv-level', 'gv-effect', GC.GRAVITY_COEFF, '×');
  }

  function setEffect(lvl, idLvl, idEff, coeff, prefix) {
    document.getElementById(idLvl).textContent = lvl;
    if (lvl === 0) { document.getElementById(idEff).textContent = '1.00'; return; }
    var b = Math.sqrt(lvl) - 1;
    document.getElementById(idEff).textContent = (1 + b * coeff).toFixed(2);
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

  // ── Click Hint ──

  function updateClickHint() {
    var hint = document.getElementById('click-hint');
    var q = GS.getTier(0);
    // Hide hint after player has produced some quarks
    if (q && q.totalEver > 20) {
      hint.style.opacity = '0';
    }
  }

  // ── Full Refresh ──

  var refreshScheduled = false;

  function refreshAll() {
    // Throttle DOM updates to ~10 fps
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(function () {
      updateFocus();
      updateActions();
      updateEvolution();
      updatePrestige();
      updateMilestones();
      updateClickHint();
      refreshScheduled = false;
    });
  }

  // ── Event Delegation ──

  function init() {
    // Action bar — delegated clicks
    document.getElementById('action-bar').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;

      var action = btn.dataset.action;
      var tierId = parseInt(btn.dataset.tier);

      if (action === 'buy-producer') GE.buyProducer(tierId);
      else if (action === 'synthesize') GE.synthesize(tierId);
      else if (action === 'research') GE.research(tierId);

      refreshAll();
    });

    // Prestige button
    document.getElementById('prestige-btn').addEventListener('click', function () {
      if (GS.canPrestige()) {
        GE.bigCrunch();
        refreshAll();
      }
    });

    // Constant sliders
    function onSlider() {
      var sf = +document.getElementById('constant-strong').value;
      var ls = +document.getElementById('constant-light').value;
      var gv = +document.getElementById('constant-gravity').value;
      GS.allocateCP(sf, ls, gv);
      updateConstantSliders();
      // Immediate stat refresh
      updateFocus();
      updateActions();
    }
    document.getElementById('constant-strong').addEventListener('input', onSlider);
    document.getElementById('constant-light').addEventListener('input', onSlider);
    document.getElementById('constant-gravity').addEventListener('input', onSlider);

    // Canvas click → quark production
    var stage = document.getElementById('cosmos-stage');
    stage.addEventListener('click', function () {
      window.CanvasRenderer.onClick(event);
      // Don't refresh DOM on every click — engine tick will handle it
    });
    // Also listen on canvas directly for event coordinates
    document.getElementById('cosmos-canvas').addEventListener('click', function (e) {
      window.CanvasRenderer.onClick(e);
    });

    // Initial render
    refreshAll();
  }

  window.GameUI = { init: init, refreshAll: refreshAll };
})();
