// tiny-cosmos — Game Engine
// Tick-based game loop: production, demand, auto-synthesis, RP generation.
// Pure logic — no DOM, no canvas.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;

  var intervalId = null;
  var onTickCallback = null; // called after every tick for UI refresh
  var timeScale = 1;

  // ── Tick ────────────────────────────────────────────────────────

  function tick() {
    var st = GS.getState();
    if (!st) return;

    for (var simulationStep = 0; simulationStep < timeScale; simulationStep += 1) simulateStep(st);

    // Notify UI once per real tick, even when the test clock is accelerated.
    if (onTickCallback) onTickCallback();
  }

  function simulateStep(st) {

    st.tickCount += 1;

    // 1. Production (tier 0-5 producers generate their own tier)
    applyProduction();

    // 2. Metabolic demand (higher tiers consume lower tiers)
    applyDemand();

    // 3. Research point generation
    applyResearch();

    // 4. First-contact scenario systems (browser slice only)
    if (window.GameSlice && window.GameSlice.isEnabled()) {
      window.GameSlice.tick(1 / GC.TICKS_PER_SEC);
    }

  }

  // ── Production ──────────────────────────────────────────────────

  function applyProduction() {
    var st = GS.getState();
    var speedMult = GS.getSpeedMultiplier();
    var tickMult = speedMult / GC.TICKS_PER_SEC;

    // Tier 0 (Quarks): producers auto-generate
    var t0 = st.tiers[0];
    if (t0.researched) {
      var qOutput = GS.getProducerOutput(0) * tickMult * GS.getGravityMultiplier(0);
      if (window.GameSlice && window.GameSlice.isEnabled()) qOutput *= window.GameSlice.getProductionMultiplier(0);
      GS.addResource(0, qOutput);
    }

    // Tier 1-5: producers directly generate their own resource
    for (var i = 1; i <= 5; i++) {
      var t = st.tiers[i];
      if (!t.researched || t.producers === 0) continue;
      var output = GS.getProducerOutput(i) * tickMult * GS.getGravityMultiplier(i);
      if (window.GameSlice && window.GameSlice.isEnabled()) output *= window.GameSlice.getProductionMultiplier(i);
      GS.addResource(i, output);
    }
  }

  // ── Demand ──────────────────────────────────────────────────────

  function applyDemand() {
    var st = GS.getState();
    var demandMult = GC.DEMAND_PER_UNIT;

    // Symbiotic network milestone: -30% demand
    if (GS.hasMilestone(7)) {
      demandMult *= 0.7;
    }

    for (var i = 0; i < GC.TIERS.length - 1; i++) {
      var higherTier = st.tiers[i + 1];
      if (!higherTier.researched || higherTier.count === 0) continue;

      var reverseDemandMult = window.GameSlice && window.GameSlice.isEnabled() && window.GameSlice.getDemandMultiplier
        ? window.GameSlice.getDemandMultiplier(i)
        : 1;
      var demand = higherTier.count * demandMult * reverseDemandMult;
      // Don't go negative — floor at 0
      var lowerTier = st.tiers[i];
      var reserveFloor = 0;
      if (window.GameSlice && window.GameSlice.isEnabled()) reserveFloor = window.GameSlice.getReserveFloor(i);
      var actual = Math.min(Math.max(0, lowerTier.count - reserveFloor), demand);
      lowerTier.count = Math.max(0, lowerTier.count - actual);
    }
  }

  // ── Research ────────────────────────────────────────────────────

  function applyResearch() {
    var st = GS.getState();
    // RP = Σ sqrt(resource count) × tier coefficient
    // sqrt gives diminishing returns → natural late-game slowdown
    var rpThisTick = 0;
    for (var i = 0; i < GC.TIERS.length; i++) {
      var t = st.tiers[i];
      if (!t.researched || t.count <= 0) continue;
      rpThisTick += Math.sqrt(t.count) * GC.RP_SQRT_COEFF[i];
    }
    if (st.slice && st.slice.enabled) rpThisTick *= GC.FIRST_CONTACT.researchMultiplier;
    if (window.GameSlice && window.GameSlice.isEnabled()) rpThisTick *= window.GameSlice.getResearchMultiplier();
    if (rpThisTick > 0) GS.addRP(rpThisTick);
  }

  // ── Manual actions ──────────────────────────────────────────────

  function synthesize(tierId) {
    var st = GS.getState();
    if (!st) return false;

    var t = st.tiers[tierId];
    if (!t.researched || tierId === 0) return false;
    if (window.GameSlice && window.GameSlice.isEnabled() && !window.GameSlice.canSynthesize(tierId)) return false;

    var batch = GS.getSynthBatchSize();
    var costEach = GS.getSynthCost(tierId);
    var totalCost = costEach * batch;

    if (st.tiers[tierId - 1].count < totalCost) return false;

    GS.spendResource(tierId - 1, totalCost);
    GS.addResource(tierId, batch);
    GS.recordSynth(tierId);
    if (window.GameSlice && window.GameSlice.isEnabled()) window.GameSlice.onAction('synthesize', { tierId: tierId });
    return true;
  }

  function buyProducer(tierId) {
    var st = GS.getState();
    if (!st) return false;
    if (window.GameSlice && window.GameSlice.isEnabled() && !window.GameSlice.canBuyProducer(tierId)) return false;

    var t = st.tiers[tierId];
    if (!t.researched) return false;
    if (t.producerBaseCost === 0) return false; // Civilization has no producers

    var cost = GS.getProducerCost(tierId);
    if (t.count < cost) return false;

    GS.spendResource(tierId, cost);
    GS.addProducer(tierId);
    if (window.GameSlice && window.GameSlice.isEnabled()) window.GameSlice.onAction('buyProducer', { tierId: tierId });
    return true;
  }

  function research(tierId) {
    if (!GS.canResearch(tierId)) return false;
    var ok = GS.doResearch(tierId);
    if (ok && window.GameSlice && window.GameSlice.isEnabled()) window.GameSlice.onAction('research', { tierId: tierId });
    return ok;
  }

  function bigCrunch() {
    if (!GS.canPrestige()) return false;
    var cpGain = GS.bigCrunchReset();
    return cpGain;
  }

  // ── Loop control ────────────────────────────────────────────────

  function start() {
    if (intervalId) return;
    var tickMs = Math.floor(1000 / GC.TICKS_PER_SEC); // 50ms
    intervalId = setInterval(tick, tickMs);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function isRunning() {
    return intervalId !== null;
  }

  function onTick(fn) {
    onTickCallback = fn;
  }

  function setTimeScale(value) {
    timeScale = value === 100 ? 100 : 1;
    return timeScale;
  }

  function getTimeScale() {
    return timeScale;
  }

  // ── Export ──────────────────────────────────────────────────────
  window.GameEngine = {
    start: start,
    stop: stop,
    isRunning: isRunning,
    tick: tick,
    onTick: onTick,
    setTimeScale: setTimeScale,
    getTimeScale: getTimeScale,

    synthesize: synthesize,
    buyProducer: buyProducer,
    research: research,
    bigCrunch: bigCrunch,
  };
})();
