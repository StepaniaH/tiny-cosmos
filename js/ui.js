// tiny-cosmos — UI Layer
// DOM manipulation: tier cards, research bar, prestige panel, milestones.
// Pure rendering — no game logic.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;

  // ── Research Bar ────────────────────────────────────────────────

  function updateResearchBar() {
    var rp = GS.getRP();
    var maxTier = GS.getMaxResearchedTier();
    var nextTier = maxTier + 1;

    document.getElementById('rp-display').textContent = formatNumber(rp, 1);

    // Progress bar: show RP progress toward next research
    if (nextTier < GC.TIERS.length) {
      var cost = GS.getResearchCost(nextTier);
      var pct = Math.min(100, (rp / cost) * 100);
      document.getElementById('rp-bar').style.width = pct + '%';

      var nextName = GC.TIERS[nextTier].nameZh;
      document.getElementById('research-next').textContent = '→ ' + nextName + ' (' + formatNumber(cost, 0) + ' RP)';

      var btn = document.getElementById('research-btn');
      btn.disabled = !GS.canResearch(nextTier);
    } else {
      document.getElementById('rp-bar').style.width = '100%';
      document.getElementById('research-next').textContent = '全部已解锁';
      document.getElementById('research-btn').disabled = true;
    }
  }

  // ── Tier Cards ──────────────────────────────────────────────────

  function formatNumber(n, decimals) {
    if (decimals === undefined) decimals = 2;
    if (n >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(decimals) + 'K';
    if (n >= 100) return Math.floor(n).toString();
    return n.toFixed(decimals);
  }

  function calcNetProduction(tierId) {
    var t = GS.getTier(tierId);
    if (!t || !t.researched) return { prod: 0, demand: 0, net: 0 };

    var prod = 0;
    if (tierId === 0) {
      prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
    } else {
      // Producers auto-synthesize — approximate rate
      var speedMult = GS.getSpeedMultiplier();
      prod = GS.getProducerOutput(tierId) * speedMult * GS.getGravityMultiplier(tierId);
    }

    var demand = 0;
    if (tierId < GC.TIERS.length - 1) {
      var higherTier = GS.getTier(tierId + 1);
      if (higherTier && higherTier.researched) {
        var demandMult = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
        if (GS.hasMilestone(7)) demandMult *= 0.7;
        demand = higherTier.count * demandMult;
      }
    }

    return { prod: prod, demand: demand, net: prod - demand };
  }

  function renderTierCard(tierId) {
    var t = GS.getTier(tierId);
    var tpl = GC.TIERS[tierId];
    var maxResearched = GS.getMaxResearchedTier();
    var nextResearchable = maxResearched + 1;

    var card = document.createElement('div');
    card.className = 'tier-card';

    // Locked / Researchable state
    if (!t.researched) {
      if (tierId === nextResearchable) {
        card.className += ' researchable';
        card.addEventListener('click', function () {
          if (GS.canResearch(tierId)) {
            GE.research(tierId);
            refreshAll();
          }
        });
        card.innerHTML =
          '<div class="tier-card-header">' +
            '<span class="tier-dot" style="background: ' + tpl.color + '"></span>' +
            '<span class="tier-name">' + tpl.nameZh + '</span>' +
            '<span class="tier-name-en">' + tpl.name + '</span>' +
          '</div>' +
          '<div class="tier-locked-content">' +
            '<div class="tier-locked-icon">🔬</div>' +
            '<div>研究需要 ' + GS.getResearchCost(tierId) + ' RP</div>' +
          '</div>';
      } else {
        card.className += ' locked';
        card.innerHTML =
          '<div class="tier-card-header">' +
            '<span class="tier-dot" style="background: ' + tpl.color + '; opacity: 0.3"></span>' +
            '<span class="tier-name" style="color: var(--text-muted)">' + tpl.nameZh + '</span>' +
          '</div>' +
          '<div class="tier-locked-content">' +
            '<div class="tier-locked-icon">🔒</div>' +
            '<div>尚未揭示</div>' +
          '</div>';
      }
      return card;
    }

    // Active tier card
    var net = calcNetProduction(tierId);
    var cost = GS.getSynthCost(tierId);
    var batch = GS.getSynthBatchSize();
    var showBars = tierId < GC.TIERS.length - 1 || tierId === 0;

    // Production bar
    var maxBar = Math.max(net.prod, net.demand, 1);
    var prodPct = (net.prod / maxBar) * 100;
    var demandPct = (net.demand / maxBar) * 100;

    var producerCost = tpl.producerBaseCost > 0 ? GS.getProducerCost(tierId) : Infinity;

    var barsHTML = '';
    if (showBars) {
      barsHTML =
        '<div class="tier-bars">' +
          '<div class="tier-bar-row">' +
            '<span class="tier-bar-label">产</span>' +
            '<div class="tier-bar-track"><div class="tier-bar-fill prod" style="width:' + prodPct + '%"></div></div>' +
            '<span class="tier-bar-value prod-text">+' + formatNumber(net.prod, 1) + '/s</span>' +
          '</div>' +
          '<div class="tier-bar-row">' +
            '<span class="tier-bar-label">耗</span>' +
            '<div class="tier-bar-track"><div class="tier-bar-fill demand" style="width:' + demandPct + '%"></div></div>' +
            '<span class="tier-bar-value demand-text">-' + formatNumber(net.demand, 2) + '/s</span>' +
          '</div>' +
        '</div>';
    }

    var netClass = net.net >= 0 ? 'positive' : 'negative';
    var netSign = net.net >= 0 ? '+' : '';

    var actionsHTML = '';
    if (tpl.producerBaseCost > 0) {
      var canAfford = t.count >= producerCost;
      actionsHTML +=
        '<button class="btn btn-tier btn-producer" data-action="buy-producer" data-tier="' + tierId + '"' +
        (canAfford ? '' : ' disabled') + '>' +
          '⚙ 生产 (' + formatNumber(producerCost, 0) + ')' +
        '</button>';
    }
    if (tierId > 0) {
      var lowerName = GC.TIERS[tierId - 1].nameZh;
      var canSynth = GS.getTier(tierId - 1).count >= (cost * batch);
      actionsHTML +=
        '<button class="btn btn-tier btn-synth" data-action="synthesize" data-tier="' + tierId + '"' +
        (canSynth ? '' : ' disabled') + '>' +
          '⬆ ' + lowerName + ' → (' + formatNumber(cost, 0) + '×' + batch + ')' +
        '</button>';
    }

    card.innerHTML =
      '<div class="tier-card-header">' +
        '<span class="tier-dot" style="background: ' + tpl.color + '"></span>' +
        '<span class="tier-name">' + tpl.nameZh + '</span>' +
        '<span class="tier-name-en">' + tpl.name + '</span>' +
      '</div>' +
      '<div class="tier-count">' + formatNumber(t.count, tierId <= 2 ? 2 : 0) + '</div>' +
      barsHTML +
      '<div class="tier-net ' + netClass + '">净 ' + netSign + formatNumber(net.net, 2) + '/s</div>' +
      '<div class="tier-actions">' + actionsHTML + '</div>';

    return card;
  }

  function refreshTierCards() {
    var container = document.getElementById('tier-cards');
    container.innerHTML = '';
    for (var i = 0; i < GC.TIERS.length; i++) {
      container.appendChild(renderTierCard(i));
    }

    // Bind button events
    container.querySelectorAll('[data-action="buy-producer"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var tierId = parseInt(btn.dataset.tier);
        GE.buyProducer(tierId);
        refreshAll();
      });
    });
    container.querySelectorAll('[data-action="synthesize"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var tierId = parseInt(btn.dataset.tier);
        GE.synthesize(tierId);
        refreshAll();
      });
    });
  }

  // ── Progress ────────────────────────────────────────────────────

  function updateProgress() {
    var maxResearched = GS.getMaxResearchedTier();
    var count = maxResearched + 1; // tiers 0..maxResearched
    var total = GC.TIERS.length;
    document.getElementById('progress-text').textContent = count + '/' + total;
    document.getElementById('progress-fill').style.width = (count / total * 100) + '%';
  }

  // ── Prestige Panel ──────────────────────────────────────────────

  function updatePrestigePanel() {
    var can = GS.canPrestige();
    var panel = document.getElementById('prestige-panel');

    if (can) {
      panel.style.display = 'block';
      var cpGain = GS.calcCPGain();
      document.getElementById('prestige-cp-gain').textContent = cpGain;
    } else if (GS.getPrestiges() > 0) {
      // Show panel if already prestiged, to adjust constants
      panel.style.display = 'block';
    }

    if (panel.style.display !== 'none') {
      updateConstantSliders();
    }
  }

  function updateConstantSliders() {
    var cp = GS.getCP();
    var c = GS.getConstants();
    var allocated = GS.getAllocatedCP();
    var unspent = GS.getUnspentCP();

    document.getElementById('cp-display').textContent = cp;
    document.getElementById('cp-allocated').textContent = allocated;
    document.getElementById('cp-unspent').textContent = unspent;

    // Update sliders (max = total CP)
    var sfSlider = document.getElementById('constant-strong');
    var lsSlider = document.getElementById('constant-light');
    var gvSlider = document.getElementById('constant-gravity');

    [sfSlider, lsSlider, gvSlider].forEach(function (s) { s.max = cp; });

    if (parseInt(sfSlider.value) !== c.strongForce) sfSlider.value = c.strongForce;
    if (parseInt(lsSlider.value) !== c.lightSpeed) lsSlider.value = c.lightSpeed;
    if (parseInt(gvSlider.value) !== c.gravity) gvSlider.value = c.gravity;

    // Update effect displays
    updateConstantEffectDisplay(c.strongForce, 'sf-level', 'sf-effect', GC.STRONG_FORCE_COEFF, '÷');
    updateConstantEffectDisplay(c.lightSpeed, 'ls-level', 'ls-effect', GC.LIGHT_SPEED_COEFF, '×');
    updateConstantEffectDisplay(c.gravity, 'gv-level', 'gv-effect', GC.GRAVITY_COEFF, '×');
  }

  function updateConstantEffectDisplay(level, levelElId, effectElId, coeff, prefix) {
    document.getElementById(levelElId).textContent = level;
    if (level === 0) {
      document.getElementById(effectElId).textContent = '1.00';
      return;
    }
    var bonus = Math.sqrt(level) - 1;
    var value;
    if (prefix === '÷') {
      value = 1 + bonus * coeff;
    } else {
      value = 1 + bonus * coeff;
    }
    document.getElementById(effectElId).textContent = value.toFixed(2);
  }

  function bindConstantSliders() {
    function onSliderChange() {
      var sf = parseInt(document.getElementById('constant-strong').value);
      var ls = parseInt(document.getElementById('constant-light').value);
      var gv = parseInt(document.getElementById('constant-gravity').value);
      GS.allocateCP(sf, ls, gv);
      updateConstantSliders();
      refreshAll();
    }

    document.getElementById('constant-strong').addEventListener('input', onSliderChange);
    document.getElementById('constant-light').addEventListener('input', onSliderChange);
    document.getElementById('constant-gravity').addEventListener('input', onSliderChange);
  }

  // ── Milestones ──────────────────────────────────────────────────

  function updateMilestones() {
    var ms = GS.getMilestones();
    if (ms.length === 0) return;

    var section = document.getElementById('milestones-section');
    section.style.display = 'block';

    var list = document.getElementById('milestones-list');
    list.innerHTML = '';

    ms.forEach(function (at) {
      var m = GC.MILESTONES.find(function (x) { return x.at === at; });
      if (m) {
        var badge = document.createElement('span');
        badge.className = 'milestone-badge';
        badge.textContent = '★ ' + m.name;
        badge.title = m.descZh;
        list.appendChild(badge);
      }
    });
  }

  // ── Full Refresh ────────────────────────────────────────────────

  function refreshAll() {
    updateResearchBar();
    refreshTierCards();
    updateProgress();
    updatePrestigePanel();
    updateMilestones();
  }

  // ── Init ────────────────────────────────────────────────────────

  function init() {
    // Research button
    document.getElementById('research-btn').addEventListener('click', function () {
      var next = GS.getMaxResearchedTier() + 1;
      if (next < GC.TIERS.length && GS.canResearch(next)) {
        GE.research(next);
        refreshAll();
      }
    });

    // Prestige button
    document.getElementById('prestige-btn').addEventListener('click', function () {
      if (GS.canPrestige()) {
        GE.bigCrunch();
        refreshAll();
      }
    });

    bindConstantSliders();

    // Initial render
    refreshAll();
  }

  // ── Export ──────────────────────────────────────────────────────
  window.GameUI = {
    init: init,
    refreshAll: refreshAll,
  };
})();
