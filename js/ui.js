// tiny-cosmos v4 — UI (cards + persistent buttons)
(function () {
  'use strict';
  var GC = window.GC, GS = window.GameState, GE = window.GameEngine;

  function fmt(n,d){ if(d===undefined)d=1; if(n>=1e6)return(n/1e6).toFixed(d)+'M'; if(n>=1e4)return(n/1e3).toFixed(d)+'K'; if(n>=100)return Math.floor(n).toString(); return n.toFixed(d); }
  function fmtI(n){ return Math.floor(n).toString(); }

  // ── Research bar ──
  function updateResearch() {
    var rp = GS.getRP(), max = GS.getMaxResearchedTier(), next = max + 1;
    document.getElementById('rb-rp').textContent = fmt(rp, 1);
    // RP source hint: total from all resources (sqrt formula)
    var totalRPS = 0;
    for (var i = 0; i < GC.TIERS.length; i++) {
      var tt = GS.getTier(i);
      if (tt && tt.researched && tt.count > 0) {
        totalRPS += Math.sqrt(tt.count) * GC.RP_SQRT_COEFF[i] * GC.TICKS_PER_SEC;
      }
    }
    var hintText = totalRPS > 0
      ? '来自全部资源 (+' + fmt(totalRPS, 2) + '/s)'
      : '点击或合成获得资源';
    document.getElementById('rb-hint').textContent = hintText;
    if (next < GC.TIERS.length) {
      var cost = GS.getResearchCost(next);
      document.getElementById('rb-fill').style.width = Math.min(100, rp / cost * 100) + '%';
      document.getElementById('rb-next-label').textContent = '→ ' + GC.TIERS[next].nameZh + ' (' + cost + ' RP)';
      var btn = document.getElementById('btn-research-global');
      btn.disabled = !GS.canResearch(next);
      btn.dataset.tier = next;
      btn.textContent = '🔬 研究 ' + GC.TIERS[next].nameZh;
    } else {
      document.getElementById('rb-fill').style.width = '100%';
      document.getElementById('rb-next-label').textContent = '全部解锁';
      document.getElementById('btn-research-global').disabled = true;
    }
  }

  // ── Single tier card update ──
  function updateCard(i) {
    var t = GS.getTier(i), tpl = GC.TIERS[i];
    var card = document.getElementById('card-' + i);
    var maxRes = GS.getMaxResearchedTier();
    var unlocked = t.researched;
    var nextResearchable = (i === maxRes + 1);

    if (unlocked) {
      card.className = 'tier-card';

      // Count
      document.getElementById('count-' + i).textContent = fmt(t.count, i <= 2 ? 2 : 0);

      // Prod/demand bars
      updateBars(i);

      // Net rate
      updateNet(i);

      // Show active elements, hide locked
      document.getElementById('count-' + i).style.display = '';
      document.getElementById('bars-' + i).style.display = '';
      document.getElementById('net-' + i).style.display = '';
      var lockedEl = card.querySelector('.tc-locked');
      if (lockedEl) lockedEl.style.display = 'none';
      var rschBtn = document.getElementById('btn-research-' + i);
      if (rschBtn) rschBtn.style.display = 'none';

      // Producer button
      var pbtn = document.getElementById('btn-prod-' + i);
      if (pbtn && tpl.producerBaseCost > 0) {
        var pCost = GS.getProducerCost(i);
        pbtn.style.display = '';
        pbtn.textContent = '⚙ 生产 (' + fmtI(pCost) + ')';
        pbtn.disabled = t.count < pCost;
      } else if (pbtn) {
        pbtn.style.display = 'none';
      }

      // Synth button (tier 1-5)
      var sbtn = document.getElementById('btn-synth-' + i);
      if (sbtn && i >= 1 && i <= 5) {
        var sc = GS.getSynthCost(i), batch = GS.getSynthBatchSize();
        sbtn.style.display = '';
        sbtn.textContent = '⬆ ' + GC.TIERS[i-1].nameZh + '→' + tpl.nameZh + ' (' + fmtI(sc) + '×' + batch + ')';
        sbtn.disabled = GS.getTier(i-1).count < (sc * batch);
      } else if (sbtn) {
        sbtn.style.display = 'none';
      }

    } else if (nextResearchable) {
      card.className = 'tier-card researchable';
      // Hide active, show locked with research
      document.getElementById('count-' + i).style.display = 'none';
      document.getElementById('bars-' + i).style.display = 'none';
      document.getElementById('net-' + i).style.display = 'none';
      var lockedEl = card.querySelector('.tc-locked');
      if (lockedEl) lockedEl.textContent = '🔬 研究需要 ' + GS.getResearchCost(i) + ' RP';
      if (lockedEl) lockedEl.style.display = '';
      var pbtn = document.getElementById('btn-prod-' + i); if (pbtn) pbtn.style.display = 'none';
      var sbtn = document.getElementById('btn-synth-' + i); if (sbtn) sbtn.style.display = 'none';
      var rschBtn = document.getElementById('btn-research-' + i);
      if (rschBtn) {
        rschBtn.style.display = '';
        rschBtn.textContent = '🔬 研究 (' + fmt(GS.getRP(), 0) + '/' + GS.getResearchCost(i) + ' RP)';
        rschBtn.disabled = !GS.canResearch(i);
      }
      // Click card to research
      card.onclick = function(){ if(GS.canResearch(i)){GE.research(i);refreshAll();} };

    } else {
      card.className = 'tier-card locked';
      document.getElementById('count-' + i).style.display = 'none';
      document.getElementById('bars-' + i).style.display = 'none';
      document.getElementById('net-' + i).style.display = 'none';
      var lockedEl = card.querySelector('.tc-locked');
      if (lockedEl) { lockedEl.textContent = '🔒 尚未揭示'; lockedEl.style.display = ''; }
      var pbtn = document.getElementById('btn-prod-' + i); if (pbtn) pbtn.style.display = 'none';
      var sbtn = document.getElementById('btn-synth-' + i); if (sbtn) sbtn.style.display = 'none';
      var rschBtn = document.getElementById('btn-research-' + i); if (rschBtn) rschBtn.style.display = 'none';
      card.onclick = null;
    }
  }

  function updateBars(i) {
    var t = GS.getTier(i);
    var prod = 0, demand = 0;
    if (i === 0) {
      prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
    } else {
      prod = GS.getProducerOutput(i) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(i);
    }
    if (i < GC.TIERS.length - 1) {
      var ht = GS.getTier(i + 1);
      if (ht.researched) {
        var dm = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
        if (GS.hasMilestone(7)) dm *= 0.7;
        demand = ht.count * dm;
      }
    }
    var maxV = Math.max(prod, demand, 0.01);
    var pp = (prod/maxV)*100, dp = (demand/maxV)*100;
    var bars = document.getElementById('bars-' + i);
    bars.innerHTML =
      '<div class="tc-bar-row"><span class="tc-bar-label">产</span><div class="tc-bar-track"><div class="tc-bar-fill prod" style="width:'+pp+'%"></div></div><span class="tc-bar-val prod-text">+'+fmt(prod,1)+'/s</span></div>' +
      '<div class="tc-bar-row"><span class="tc-bar-label">耗</span><div class="tc-bar-track"><div class="tc-bar-fill demand" style="width:'+dp+'%"></div></div><span class="tc-bar-val demand-text">-'+fmt(demand,2)+'/s</span></div>';
  }

  function updateNet(i) {
    var t = GS.getTier(i);
    var prod = 0, demand = 0;
    if (i === 0) prod = GS.getProducerOutput(0) * GS.getGravityMultiplier(0);
    else prod = GS.getProducerOutput(i) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(i);
    if (i < GC.TIERS.length - 1) {
      var ht = GS.getTier(i+1);
      if (ht.researched) {
        var dm = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
        if (GS.hasMilestone(7)) dm *= 0.7;
        demand = ht.count * dm;
      }
    }
    var net = prod - demand, sign = net>=0?'+':'', cls = net>=0?'pos':'neg';
    document.getElementById('net-' + i).textContent = '净 '+sign+fmt(net,2)+'/s';
    document.getElementById('net-' + i).className = 'tc-net ' + cls;
  }

  // ── Prestige ──
  function updatePrestige() {
    var canP = GS.canPrestige(), hasP = GS.getPrestiges() > 0;
    var panel = document.getElementById('prestige-panel');
    if (canP || hasP) {
      panel.style.display = 'block';
      if (canP) {
        document.getElementById('prestige-gain-text').textContent = '获得 ' + GS.calcCPGain() + ' 恒定点';
        document.getElementById('prestige-btn').style.display = '';
      } else {
        document.getElementById('prestige-btn').style.display = 'none';
      }
      if (hasP) {
        document.getElementById('prestige-detail').style.display = 'flex';
        updateSliders();
      }
    } else { panel.style.display = 'none'; }
  }

  function updateSliders() {
    var cp = GS.getCP(), c = GS.getConstants();
    document.getElementById('cp-total').textContent = cp;
    document.getElementById('cp-used').textContent = GS.getAllocatedCP();
    document.getElementById('cp-free').textContent = GS.getUnspentCP();
    setS('constant-strong', c.strongForce, cp, 'sf-level', 'sf-effect', GC.STRONG_FORCE_COEFF, '÷');
    setS('constant-light', c.lightSpeed, cp, 'ls-level', 'ls-effect', GC.LIGHT_SPEED_COEFF, '×');
    setS('constant-gravity', c.gravity, cp, 'gv-level', 'gv-effect', GC.GRAVITY_COEFF, '×');
  }
  function setS(id, v, max, lvlId, effId, coeff, pf) {
    var el = document.getElementById(id); el.max = max; if (+el.value !== v) el.value = v;
    document.getElementById(lvlId).textContent = v;
    document.getElementById(effId).textContent = v===0?'1.00':((1+(Math.sqrt(v)-1)*coeff).toFixed(2));
  }

  // ── Milestones ──
  function updateMilestones() {
    var ms = GS.getMilestones(), bar = document.getElementById('milestones-bar');
    if (!ms.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex'; bar.innerHTML = '';
    ms.forEach(function(at){
      var m = GC.MILESTONES.find(function(x){return x.at===at;});
      if(m) bar.innerHTML += '<span class="milestone-badge" title="'+m.descZh+'">★ '+m.name+'</span>';
    });
  }

  function updateClickHint() {
    var q = GS.getTier(0);
    if (q && q.totalEver > 30) document.getElementById('click-hint').style.opacity = '0';
  }

  // ── Full refresh (synchronous — engine ticks at 20/s, fast enough) ──
  function refreshAll() {
    updateResearch();
    for (var i = 0; i < GC.TIERS.length; i++) updateCard(i);
    updatePrestige();
    updateMilestones();
    updateClickHint();
  }

  // ── Button handlers ──
  function bindButtons() {
    // Producer buttons (tier 0-5)
    for (var i = 0; i <= 5; i++) {
      (function(tid){
        var btn = document.getElementById('btn-prod-' + tid);
        if (btn) btn.addEventListener('click', function(){ if(GE.buyProducer(tid)) refreshAll(); });
      })(i);
    }
    // Synth buttons (tier 1-5)
    for (var i = 1; i <= 5; i++) {
      (function(tid){
        var btn = document.getElementById('btn-synth-' + tid);
        if (btn) btn.addEventListener('click', function(){ if(GE.synthesize(tid)) refreshAll(); });
      })(i);
    }
    // Research buttons (tier 2-6)
    for (var i = 2; i <= 6; i++) {
      (function(tid){
        var btn = document.getElementById('btn-research-' + tid);
        if (btn) btn.addEventListener('click', function(){ if(GE.research(tid)) refreshAll(); });
      })(i);
    }
    // Global research button
    document.getElementById('btn-research-global').addEventListener('click', function(){
      var tid = parseInt(this.dataset.tier);
      if (tid > 0 && GE.research(tid)) refreshAll();
    });
    // Prestige
    document.getElementById('prestige-btn').addEventListener('click', function(){
      if (GS.canPrestige()) { GE.bigCrunch(); refreshAll(); }
    });
    // Sliders
    function onS(){
      GS.allocateCP(+document.getElementById('constant-strong').value, +document.getElementById('constant-light').value, +document.getElementById('constant-gravity').value);
      updateSliders();
    }
    document.getElementById('constant-strong').addEventListener('input', onS);
    document.getElementById('constant-light').addEventListener('input', onS);
    document.getElementById('constant-gravity').addEventListener('input', onS);
    // Canvas
    document.getElementById('cosmos-canvas').addEventListener('click', function(e){ window.CanvasRenderer.onClick(e); });
  }

  function init() { bindButtons(); refreshAll(); }
  window.GameUI = { init: init, refreshAll: refreshAll };
})();
