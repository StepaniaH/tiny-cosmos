// tiny-cosmos v3 — UI Layer
// Persistent buttons (NEVER destroyed). Evolution line with integrated counts.
// Zero innerHTML on interactive elements.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;

  // ── Cached DOM refs (never change) ─────────────────────────────
  var dom = {};

  function cacheDom() {
    dom.fQuarks = document.getElementById('f-quarks');
    dom.fQuarksRate = document.getElementById('f-quarks-rate');
    dom.fRp = document.getElementById('f-rp');
    dom.fRpTarget = document.getElementById('f-rp-target');
    dom.evoLine = document.getElementById('evolution-line');
    dom.clickHint = document.getElementById('click-hint');

    dom.btnProducer0 = document.getElementById('btn-producer-0');
    dom.btnSynth = document.getElementById('btn-synth');
    dom.btnProducer1 = document.getElementById('btn-producer-1');
    dom.btnResearch = document.getElementById('btn-research');

    dom.prestigePanel = document.getElementById('prestige-panel');
    dom.prestigeBtn = document.getElementById('prestige-btn');
    dom.prestigeGain = document.getElementById('prestige-gain-text');
    dom.prestigeDetail = document.getElementById('prestige-detail');
    dom.constantStrong = document.getElementById('constant-strong');
    dom.constantLight = document.getElementById('constant-light');
    dom.constantGravity = document.getElementById('constant-gravity');
    dom.sfLevel = document.getElementById('sf-level');
    dom.lsLevel = document.getElementById('ls-level');
    dom.gvLevel = document.getElementById('gv-level');
    dom.sfEffect = document.getElementById('sf-effect');
    dom.lsEffect = document.getElementById('ls-effect');
    dom.gvEffect = document.getElementById('gv-effect');
    dom.cpTotal = document.getElementById('cp-total');
    dom.cpUsed = document.getElementById('cp-used');
    dom.cpFree = document.getElementById('cp-free');
    dom.milestonesBar = document.getElementById('milestones-bar');
  }

  // ── Helpers ──
  function fmt(n, d) {
    if (d === undefined) d = 1;
    if (n >= 1e6) return (n / 1e6).toFixed(d) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(d) + 'K';
    if (n >= 100) return Math.floor(n).toString();
    return n.toFixed(d);
  }
  function fmtInt(n) { return Math.floor(n).toString(); }

  // ── Focus ──
  function updateFocus() {
    var s = GS.getState();
    var q = s.tiers[0];
    var prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
    dom.fQuarks.textContent = fmt(q.count, q.count < 100 ? 2 : 0);
    dom.fQuarksRate.textContent = '+' + fmt(prod, 1) + '/s';

    var rp = s.researchPoints;
    dom.fRp.textContent = fmt(rp, 1);

    var maxRes = GS.getMaxResearchedTier();
    var next = maxRes + 1;
    if (next < GC.TIERS.length) {
      dom.fRpTarget.textContent = '/' + GS.getResearchCost(next) + ' RP';
    } else {
      dom.fRpTarget.textContent = ' RP';
    }
  }

  // ── Action Buttons (persistent — update only text/disabled/display) ──

  function updateActions() {
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();

    // ── Producer 0 (quark) — always visible ──
    var qCost = GS.getProducerCost(0);
    dom.btnProducer0.textContent = '⚡ 自动观测 (' + fmtInt(qCost) + ')';
    dom.btnProducer0.disabled = s.tiers[0].count < qCost;
    dom.btnProducer0.style.display = '';

    // ── Synth — visible when tier 1+ researched ──
    if (maxRes >= 1) {
      // Find most relevant synth tier (highest unlocked that's not civilization)
      var synthTier = maxRes;
      if (synthTier === 6) synthTier = 5;
      var sc = GS.getSynthCost(synthTier);
      var batch = GS.getSynthBatchSize();
      var canSynth = s.tiers[synthTier - 1].count >= (sc * batch);
      dom.btnSynth.textContent = '⬆ ' + GC.TIERS[synthTier - 1].nameZh + '→' +
        GC.TIERS[synthTier].nameZh + ' (' + fmtInt(sc) + '×' + batch + ')';
      dom.btnSynth.disabled = !canSynth;
      dom.btnSynth.style.display = '';
      dom.btnSynth.dataset.tier = synthTier;
    } else {
      dom.btnSynth.style.display = 'none';
    }

    // ── Producer 1 (current tier) — visible when tier 1+ researched, has producers ──
    var foundProducer = false;
    for (var p = maxRes; p >= 1; p--) {
      var tp = GC.TIERS[p];
      if (tp.producerBaseCost === 0 || p === 6) continue;
      var pCost = GS.getProducerCost(p);
      dom.btnProducer1.textContent = '⚙ ' + tp.nameZh + ' 生产 (' + fmtInt(pCost) + ')';
      dom.btnProducer1.disabled = s.tiers[p].count < pCost;
      dom.btnProducer1.style.display = '';
      dom.btnProducer1.dataset.tier = p;
      foundProducer = true;
      break;
    }
    if (!foundProducer) dom.btnProducer1.style.display = 'none';

    // ── Research — visible when next tier exists ──
    var nextTier = maxRes + 1;
    if (nextTier < GC.TIERS.length) {
      var rCost = GS.getResearchCost(nextTier);
      dom.btnResearch.textContent = '🔬 研究 ' + GC.TIERS[nextTier].nameZh +
        ' (' + fmt(s.researchPoints, 0) + '/' + rCost + ' RP)';
      dom.btnResearch.disabled = !GS.canResearch(nextTier);
      dom.btnResearch.style.display = '';
      dom.btnResearch.dataset.tier = nextTier;
    } else {
      dom.btnResearch.style.display = 'none';
    }
  }

  // ── Evolution Line (innerHTML OK — no interactive elements inside) ──
  function updateEvolution() {
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var html = '';

    for (var i = 0; i < GC.TIERS.length; i++) {
      var tpl = GC.TIERS[i];
      var t = s.tiers[i];

      if (i > 0) html += '<span class="evo-arrow">→</span>';

      if (t.researched) {
        var style = 'background:' + tpl.color + ';--nc:' + tpl.glow;
        html += '<span class="evo-node active" style="' + style + '">' +
          '<span class="evo-sym">' + tpl.symbol + '</span>' +
          '<span class="evo-num">' + fmt(t.count, i <= 2 ? 1 : 0) + '</span>' +
          '</span>';
      } else if (i === maxRes + 1) {
        html += '<span class="evo-node researchable">' +
          '<span class="evo-sym">?</span>' +
          '<span class="evo-num">' + GS.getResearchCost(i) + 'RP</span>' +
          '</span>';
      } else {
        html += '<span class="evo-node locked">' +
          '<span class="evo-sym">·</span>' +
          '</span>';
      }
    }

    dom.evoLine.innerHTML = html;
  }

  // ── Prestige ──
  function updatePrestige() {
    var canP = GS.canPrestige();
    var hasP = GS.getPrestiges() > 0;

    if (canP || hasP) {
      dom.prestigePanel.style.display = 'block';
      if (canP) {
        dom.prestigeGain.textContent = '获得 ' + GS.calcCPGain() + ' 恒定点';
        dom.prestigeBtn.style.display = '';
      } else {
        dom.prestigeBtn.style.display = 'none';
      }
      if (hasP) {
        dom.prestigeDetail.style.display = 'flex';
        updateConstantSliders();
      }
    } else {
      dom.prestigePanel.style.display = 'none';
    }
  }

  function updateConstantSliders() {
    var cp = GS.getCP();
    var c = GS.getConstants();
    dom.cpTotal.textContent = cp;
    dom.cpUsed.textContent = GS.getAllocatedCP();
    dom.cpFree.textContent = GS.getUnspentCP();

    updateSlider(dom.constantStrong, c.strongForce, cp, dom.sfLevel, dom.sfEffect, GC.STRONG_FORCE_COEFF, '÷');
    updateSlider(dom.constantLight, c.lightSpeed, cp, dom.lsLevel, dom.lsEffect, GC.LIGHT_SPEED_COEFF, '×');
    updateSlider(dom.constantGravity, c.gravity, cp, dom.gvLevel, dom.gvEffect, GC.GRAVITY_COEFF, '×');
  }

  function updateSlider(input, val, max, lvlEl, effEl, coeff, prefix) {
    input.max = max;
    if (+input.value !== val) input.value = val;
    lvlEl.textContent = val;
    if (val === 0) { effEl.textContent = '1.00'; return; }
    var b = Math.sqrt(val) - 1;
    effEl.textContent = (1 + b * coeff).toFixed(2);
  }

  // ── Milestones ──
  function updateMilestones() {
    var ms = GS.getMilestones();
    if (ms.length === 0) { dom.milestonesBar.style.display = 'none'; return; }
    dom.milestonesBar.style.display = 'flex';
    var html = '';
    ms.forEach(function (at) {
      var m = GC.MILESTONES.find(function (x) { return x.at === at; });
      if (m) html += '<span class="milestone-badge" title="' + m.descZh + '">★ ' + m.name + '</span>';
    });
    dom.milestonesBar.innerHTML = html;
  }

  function updateClickHint() {
    var q = GS.getTier(0);
    if (q && q.totalEver > 30) dom.clickHint.style.opacity = '0';
  }

  // ── Full Refresh (throttled to ~10fps) ──
  var refreshScheduled = false;
  function refreshAll() {
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

  // ── Button Click Handlers (persistent, direct listeners) ──

  function onClickProducer0() {
    if (GE.buyProducer(0)) refreshAll();
  }

  function onClickSynth() {
    var tierId = parseInt(dom.btnSynth.dataset.tier);
    if (tierId > 0 && GE.synthesize(tierId)) refreshAll();
  }

  function onClickProducer1() {
    var tierId = parseInt(dom.btnProducer1.dataset.tier);
    if (tierId > 0 && GE.buyProducer(tierId)) refreshAll();
  }

  function onClickResearch() {
    var tierId = parseInt(dom.btnResearch.dataset.tier);
    if (tierId > 0 && GE.research(tierId)) refreshAll();
  }

  // ── Init ──
  function init() {
    cacheDom();

    // Direct event listeners on persistent buttons — NEVER destroyed
    dom.btnProducer0.addEventListener('click', onClickProducer0);
    dom.btnSynth.addEventListener('click', onClickSynth);
    dom.btnProducer1.addEventListener('click', onClickProducer1);
    dom.btnResearch.addEventListener('click', onClickResearch);

    // Prestige
    dom.prestigeBtn.addEventListener('click', function () {
      if (GS.canPrestige()) { GE.bigCrunch(); refreshAll(); }
    });

    // Constants
    function onSlider() {
      GS.allocateCP(
        +dom.constantStrong.value,
        +dom.constantLight.value,
        +dom.constantGravity.value
      );
      updateConstantSliders();
    }
    dom.constantStrong.addEventListener('input', onSlider);
    dom.constantLight.addEventListener('input', onSlider);
    dom.constantGravity.addEventListener('input', onSlider);

    // Canvas click
    document.getElementById('cosmos-canvas').addEventListener('click', function (e) {
      window.CanvasRenderer.onClick(e);
    });

    refreshAll();
  }

  window.GameUI = { init: init, refreshAll: refreshAll };
})();
