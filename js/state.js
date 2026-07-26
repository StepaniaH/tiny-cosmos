// tiny-cosmos — Game State
// Single source of truth for all game data.
// Read-only access via getters; mutations via explicit methods.
(function () {
  'use strict';

  var GC = window.GC;
  var MAX_PLAYABLE_LOOP = 2;

  // ── Internal State ──────────────────────────────────────────────
  var state = null;

  // ── Tier Factory ────────────────────────────────────────────────
  function createTier(tpl) {
    return {
      id: tpl.id,
      name: tpl.name,
      nameZh: tpl.nameZh,
      color: tpl.color,
      glow: tpl.glow,
      symbol: tpl.symbol,
      baseCost: tpl.baseCost,
      baseProd: tpl.baseProd,
      researchCost: tpl.researchCost,
      producerBaseCost: tpl.producerBaseCost,
      descZh: tpl.descZh,

      // Dynamic state
      count: 0,
      producers: tpl.id === 0 ? 1 : 0,  // tier 0 gets 1 free producer (kickstart)
      synthCount: 0,       // times synthesized (for cost growth)
      totalEver: 0,        // total ever produced
      researched: tpl.id <= 1,  // tier 0 and tier 1 start researched
    };
  }

  function createSliceState(enabled, options) {
    options = options || {};
    var loopNumber = options.loopNumber || 1;
    var signature = options.signature || null;
    var isSecondLoop = loopNumber === 2;
    return {
      enabled: !!enabled,
      version: 9,
      loopNumber: loopNumber,
      loopSignature: signature,
      elapsedSeconds: 0,
      missionStep: 0,
      missionStartedAt: 0,
      guide: {
        interlude: false,
        remaining: 0,
        nextStep: null,
        message: '',
        researchGoalAcknowledged: false,
        stabilityGoalAcknowledged: false,
        eraIndicatorDismissed: false,
      },
      focusTier: null,
      reserveTier: null,
      law: null,
      stability: {
        early: 0,
        matter: 0,
      },
      preparation: {
        id: null,
        progress: 0,
        completed: false,
        bonusApplied: false,
      },
      tendencies: {
        advance: 0,
        sustain: 0,
        inquiry: 0,
        rewrite: 0,
      },
      stats: {
        canvasClicks: 0,
        boughtQuarkProducer: false,
        nucleonSyntheses: 0,
        atomSyntheses: 0,
        focusChanges: 0,
      },
      flags: {
        atomResearched: false,
        researchExplained: false,
        lawDecisionOpen: false,
        reserveConfigured: false,
        coreDecisionOpen: false,
        preparationOpen: false,
        demoComplete: false,
        reportAcknowledged: false,
        complexityDecisionOpen: false,
        civilizationComplete: false,
      },
      complexity: null,
      civilization: {
        lifeSignalProgress: 0,
        proposalRead: false,
      },
      reverse: {
        pressure: 0,
        objects: {
          lattice: { status: 'hidden', choice: null, mirroredRoute: null },
          choir: { status: 'hidden', choice: null, mirroredRoute: null },
          seed: { status: 'hidden', choice: null, mirroredRoute: null },
        },
      },
      enemy: {
        status: 'hidden',
        warningRemaining: 0,
        method: null,
        methodStartSiphoned: 0,
        observeLossLimit: null,
        progress: 0,
        siphoned: 0,
        isolationActive: false,
        overloadPulses: 0,
        resolution: null,
      },
      discoveries: {
        researchWaitSeconds: 0,
        missionStep: 0,
        missionWaitSeconds: 0,
        seed: Math.floor(Math.random() * 2147483646) + 1,
        triggered: [],
        acknowledged: [],
        resolved: {},
      },
      talents: {
        points: 0,
        totalEarned: 0,
        awarded: [],
        nodes: {
          focus: 0,
          flow: 0,
          research: 0,
          echo: 0,
        },
        history: [],
      },
      observation: {
        charges: GC.OBSERVATION.initialCharges,
        rechargeProgress: 0,
        active: null,
        lastResult: null,
        history: [],
      },
      archive: {
        read: [],
      },
      roundTwo: {
        inheritanceMode: null,
        biasProgress: 0,
        fragmentChoice: null,
        counterexample: {
          id: null,
          status: 'hidden',
          choice: null,
        },
        proofProgress: 0,
        witnessResponse: null,
        truthVerdict: null,
        truthRepeated: false,
        truthRevised: false,
      },
      decisions: [],
      logs: isSecondLoop ? [
        { time: 0, channel: 'REBIRTH', text: '坍缩签名已载入。第二轮初始物质带有可测量偏差。' },
        { time: 0, channel: 'GUIDE', text: '先校验继承物。本轮不会重复基础操作教学。' },
      ] : [
          { time: 0, channel: 'SYS', text: '观测核冷启动。七层结构尚未稳定。' },
          { time: 0, channel: 'GUIDE', text: '点击中央光核五次，每次响应都会记录一枚夸克。' },
        ],
    };
  }

  function createLoopMeta() {
    return {
      version: 2,
      number: 1,
      phase: 'active',
      sealedLoopNumber: null,
      activeSignature: null,
      pendingSignature: null,
      signatures: [],
    };
  }

  function normalizedLoopNumber(value, fallback) {
    var number = Math.floor(Number(value));
    if (!Number.isFinite(number) || number < 1) return fallback || 1;
    return number;
  }

  function buildTerminalChecksum(signature, completedLoopNumber) {
    var outcome = signature.roundOutcome || {};
    var parts = completedLoopNumber === 2 ? [
      outcome.inheritanceMode,
      outcome.fragmentChoice,
      outcome.counterexampleId,
      outcome.counterexampleChoice,
      outcome.witnessResponse,
      outcome.truthVerdict,
    ] : [
      signature.completedEnding,
      outcome.law || signature.priorLaw,
      outcome.contactMethod || signature.priorContactMethod,
      outcome.afterimageUse || signature.priorAfterimageUse,
      outcome.complexity,
      signature.civilizationWitness,
    ];
    parts = parts.map(function (value) { return value || 'none'; });
    var input = parts.join('|');
    var hash = 2166136261;
    for (var i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    var hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return 'TC-' + hex.slice(0, 4) + '-' + hex.slice(4);
  }

  function migrateLoopSignature(signature) {
    if (!signature || typeof signature !== 'object') return null;

    var legacyTarget = normalizedLoopNumber(
      signature.nextLoopNumber !== undefined ? signature.nextLoopNumber : signature.loopNumber,
      2
    );
    var completedLoopNumber = normalizedLoopNumber(
      signature.completedLoopNumber,
      Math.max(1, legacyTarget - 1)
    );
    var nextLoopNumber = normalizedLoopNumber(signature.nextLoopNumber, legacyTarget);
    if (nextLoopNumber <= completedLoopNumber) nextLoopNumber = completedLoopNumber + 1;

    signature.schemaVersion = 3;
    signature.completedLoopNumber = completedLoopNumber;
    signature.nextLoopNumber = nextLoopNumber;
    // Kept as a compatibility alias for the existing second-loop consumers.
    signature.loopNumber = nextLoopNumber;
    signature.roundOutcome = Object.assign({
      kind: completedLoopNumber === 2 ? 'round-two-counterexample' : 'first-loop-proposal',
    }, signature.roundOutcome || {});
    signature.terminal = Object.assign({
      cause: 'inevitable-collapse',
      hookId: completedLoopNumber === 2 ? 'paired-terminal-checksum' : 'prior-report-checksum',
      checksumAlgorithm: 'tc-terminal-fnv1a-v1',
    }, signature.terminal || {});
    if (!signature.terminal.checksum) {
      signature.terminal.checksum = buildTerminalChecksum(signature, completedLoopNumber);
    }
    return signature;
  }

  function routeRankingFromSlice(sliceState) {
    var tendencies = sliceState && sliceState.tendencies ? sliceState.tendencies : {};
    var order = ['advance', 'sustain', 'inquiry', 'rewrite'];
    return order.map(function (id, index) {
      return { id: id, score: Number(tendencies[id] || 0), order: index };
    }).sort(function (a, b) {
      return b.score - a.score || a.order - b.order;
    });
  }

  function decisionId(sliceState, kind) {
    if (!sliceState || !Array.isArray(sliceState.decisions)) return null;
    for (var i = sliceState.decisions.length - 1; i >= 0; i -= 1) {
      if (sliceState.decisions[i].kind === kind) return sliceState.decisions[i].id;
    }
    return null;
  }

  function buildLoopSignature(kind) {
    if (!state) return null;
    var sliceState = state.slice || createSliceState(false);
    var completedLoopNumber = normalizedLoopNumber(
      state.loop && state.loop.number,
      normalizedLoopNumber(sliceState.loopNumber, 1)
    );
    var nextLoopNumber = completedLoopNumber + 1;
    var ranking = routeRankingFromSlice(sliceState);
    var dominant = kind === 'ordinary' ? 'ordinary' : ranking[0].id;
    var secondary = kind === 'ordinary' ? null : ranking[1].id;
    var truthByRoute = {
      advance: 'horizon-can-open',
      sustain: 'closed-cycle-can-endure',
      inquiry: 'witness-can-outlast-collapse',
      rewrite: 'contradictions-can-cooperate',
      ordinary: 'constants-can-be-recovered',
    };
    var inheritanceByRoute = {
      advance: 'ember-aperture',
      sustain: 'returning-ring',
      inquiry: 'witness-lens',
      rewrite: 'phase-braid',
      ordinary: 'constant-kernel',
    };
    var witnessByRoute = {
      advance: 'carry-a-door-but-name-what-stays',
      sustain: 'a-garden-must-name-its-winter',
      inquiry: 'evidence-is-not-its-only-reading',
      rewrite: 'shared-endings-require-different-clocks',
      ordinary: 'speed-is-not-yet-a-direction',
    };
    var relationByMethod = {
      overload: 'hostile',
      cutoff: 'bounded',
      observe: 'witnessed',
      sync: 'synchronized',
    };
    var priorMethod = decisionId(sliceState, 'enemy');
    var complexity = decisionId(sliceState, 'complexity');
    var talentHistory = sliceState.talents && Array.isArray(sliceState.talents.history)
      ? sliceState.talents.history.map(function (entry) { return Object.assign({}, entry); })
      : [];
    var observationHistory = sliceState.observation && Array.isArray(sliceState.observation.history)
      ? sliceState.observation.history.map(function (entry) { return Object.assign({}, entry); })
      : [];
    var preservedByComplexity = {
      bloom: 'fastest-lineage',
      sanctuary: 'uncompetitive-lineages',
      witness: 'causal-record',
      braid: 'dual-side-sample',
    };
    var activeSignature = sliceState.loopSignature || (state.loop && state.loop.activeSignature) || {};
    var roundTwo = sliceState.roundTwo || {};
    var roundOutcome = completedLoopNumber === 2 ? {
      kind: 'round-two-counterexample',
      inheritedTruth: activeSignature.truths && activeSignature.truths[0] || null,
      inheritanceMode: roundTwo.inheritanceMode || null,
      fragmentChoice: roundTwo.fragmentChoice || null,
      counterexampleId: roundTwo.counterexample && roundTwo.counterexample.id || null,
      counterexampleChoice: roundTwo.counterexample && roundTwo.counterexample.choice || null,
      counterexampleStatus: roundTwo.counterexample && roundTwo.counterexample.status || null,
      witnessResponse: roundTwo.witnessResponse || null,
      truthVerdict: roundTwo.truthVerdict || null,
      truthRepeated: !!roundTwo.truthRepeated,
      truthRevised: !!roundTwo.truthRevised,
    } : {
      kind: 'first-loop-proposal',
      law: sliceState.law || null,
      contactMethod: priorMethod,
      afterimageUse: decisionId(sliceState, 'core'),
      complexity: complexity,
    };
    return migrateLoopSignature({
      schemaVersion: 3,
      completedLoopNumber: completedLoopNumber,
      nextLoopNumber: nextLoopNumber,
      loopNumber: nextLoopNumber,
      completedEnding: dominant,
      endingVariant: dominant + '-proposal-v1',
      truths: [truthByRoute[dominant]],
      equippedInheritance: inheritanceByRoute[dominant],
      priorLaw: sliceState.law || null,
      priorContactMethod: priorMethod,
      priorAfterimageUse: decisionId(sliceState, 'core'),
      dominantRoute: dominant,
      secondaryRoute: secondary,
      civilizationWitness: witnessByRoute[dominant],
      preserved: preservedByComplexity[complexity] || 'observable-constants',
      abandoned: secondary ? 'unbuilt-' + secondary + '-future' : 'unresolved-direction',
      reverseRelation: relationByMethod[priorMethod] || 'reciprocal',
      reverseSamples: Object.keys(sliceState.reverse && sliceState.reverse.objects ? sliceState.reverse.objects : {}).filter(function (id) {
        var object = sliceState.reverse.objects[id];
        return object && object.choice && object.choice !== 'legacy';
      }),
      terminal: {
        cause: 'inevitable-collapse',
        hookId: completedLoopNumber === 2 ? 'paired-terminal-checksum' : 'prior-report-checksum',
      },
      roundOutcome: roundOutcome,
      talentHistory: talentHistory,
      observationHistory: observationHistory,
      createdAtSeconds: sliceState.elapsedSeconds || 0,
    });
  }

  function applySecondLoopStart() {
    state.researchPoints = 12;
    state.tiers[0].count = 18;
    state.tiers[0].totalEver = 18;
    state.tiers[0].producers = 2;
    state.tiers[1].count = 6;
    state.tiers[1].totalEver = 6;
    state.tiers[1].producers = 1;
    state.tiers[1].researched = true;
  }

  // ── Init / Reset ────────────────────────────────────────────────

  /** Full reset — brand new universe */
  function init(options) {
    var tiers = GC.TIERS.map(createTier);
    var sliceEnabled = !!(options && options.firstContact);
    state = {
      tiers: tiers,
      researchPoints: 0,
      constantPoints: 0,
      constants: {
        strongForce: 0,
        lightSpeed: 0,
        gravity: 0,
      },
      totalQuarksEver: 0,   // NEVER resets on prestige — cumulative across universes
      totalSynthesis: 0,
      prestiges: 0,
      tickCount: 0,
      milestones: [],       // array of milestone.at values unlocked
      loop: createLoopMeta(),
      slice: createSliceState(sliceEnabled, { loopNumber: 1 }),
    };
    return state;
  }

  /** Big Crunch: reset tiers but keep global progress */
  function bigCrunchReset() {
    if (isLoopSealed()) return false;
    // Calculate CP gain before resetting
    var cpGain = calcCPGain();

    // Reset tiers
    state.tiers = GC.TIERS.map(createTier);
    state.researchPoints = 0;
    state.totalSynthesis = 0;
    state.tickCount = 0;

    // Accumulate
    state.constantPoints += cpGain;
    state.prestiges += 1;

    // Check milestones
    checkMilestones();

    return cpGain;
  }

  function getLoopPhase() {
    return state && state.loop && state.loop.phase === 'sealed' ? 'sealed' : 'active';
  }

  function isLoopSealed() {
    return getLoopPhase() === 'sealed';
  }

  function findSignatureForCompletedLoop(loopNumber) {
    if (!state || !state.loop || !Array.isArray(state.loop.signatures)) return null;
    for (var i = state.loop.signatures.length - 1; i >= 0; i -= 1) {
      var signature = state.loop.signatures[i];
      if (signature && signature.completedLoopNumber === loopNumber) return signature;
    }
    return null;
  }

  function canFinalizeCurrentLoop() {
    if (!state || !state.loop || !state.slice || isLoopSealed()) return false;
    if (state.loop.number !== MAX_PLAYABLE_LOOP || state.slice.loopNumber !== MAX_PLAYABLE_LOOP) return false;
    if (!state.slice.flags || !state.slice.flags.civilizationComplete) return false;
    return !!(state.slice.roundTwo && state.slice.roundTwo.truthVerdict);
  }

  /**
   * Seal the completed second loop without starting unavailable content.
   * The operation is idempotent so UI retries and save callbacks cannot
   * duplicate the terminal signature.
   */
  function finalizeCurrentLoop() {
    if (!state || !state.loop) return false;

    if (isLoopSealed()) {
      var sealedSignature = state.loop.pendingSignature
        || findSignatureForCompletedLoop(state.loop.sealedLoopNumber);
      if (!sealedSignature || state.loop.sealedLoopNumber !== MAX_PLAYABLE_LOOP) return false;
      state.loop.pendingSignature = sealedSignature;
      return { sealed: true, alreadySealed: true, signature: sealedSignature };
    }

    if (!canFinalizeCurrentLoop()) return false;

    var existing = findSignatureForCompletedLoop(MAX_PLAYABLE_LOOP);
    var signature = existing || buildLoopSignature('sealed');
    if (!existing) state.loop.signatures.push(signature);
    state.loop.phase = 'sealed';
    state.loop.sealedLoopNumber = MAX_PLAYABLE_LOOP;
    state.loop.pendingSignature = signature;

    return { sealed: true, alreadySealed: !!existing, signature: signature };
  }

  function getCampaignStatus() {
    var loop = state && state.loop ? state.loop : createLoopMeta();
    return {
      phase: loop.phase === 'sealed' ? 'sealed' : 'active',
      currentLoop: Math.min(MAX_PLAYABLE_LOOP, normalizedLoopNumber(loop.number, 1)),
      playableThrough: MAX_PLAYABLE_LOOP,
      sealedLoopNumber: loop.sealedLoopNumber || null,
      canFinalize: canFinalizeCurrentLoop(),
      canEnterNextLoop: loop.phase !== 'sealed'
        && loop.number < MAX_PLAYABLE_LOOP
        && !!(state && state.slice && state.slice.flags && state.slice.flags.civilizationComplete),
      pendingSignature: loop.pendingSignature || null,
    };
  }

  /** Directed rebirth: preserve a structured ending and begin the next campaign. */
  function beginDirectedRebirth() {
    if (!state || !state.slice || !state.slice.flags.civilizationComplete) return false;
    if (!state.loop) state.loop = createLoopMeta();
    if (isLoopSealed() || state.loop.number !== 1 || state.slice.loopNumber !== 1) return false;
    var signature = buildLoopSignature('directed');
    if (!signature || signature.nextLoopNumber > MAX_PLAYABLE_LOOP) return false;
    var cpGain = calcCPGain();

    state.loop.signatures.push(signature);
    state.loop.number = signature.nextLoopNumber;
    state.loop.phase = 'active';
    state.loop.sealedLoopNumber = null;
    state.loop.activeSignature = signature;
    state.loop.pendingSignature = null;

    state.tiers = GC.TIERS.map(createTier);
    state.researchPoints = 0;
    state.totalSynthesis = 0;
    state.tickCount = 0;
    state.constantPoints += cpGain;
    state.prestiges += 1;
    checkMilestones();
    state.slice = createSliceState(true, { loopNumber: signature.nextLoopNumber, signature: signature });
    applySecondLoopStart();

    return { cpGain: cpGain, signature: signature };
  }

  // ── Getters ─────────────────────────────────────────────────────

  function getState() { return state; }
  function getTier(id) { return state ? state.tiers[id] : null; }
  function getRP() { return state ? state.researchPoints : 0; }
  function getCP() { return state ? state.constantPoints : 0; }
  function getPrestiges() { return state ? state.prestiges : 0; }
  function getTotalQuarksEver() { return state ? state.totalQuarksEver : 0; }
  function getMilestones() { return state ? state.milestones : []; }
  function getConstants() { return state ? state.constants : { strongForce: 0, lightSpeed: 0, gravity: 0 }; }
  function getSlice() { return state ? state.slice : null; }
  function getLoop() { return state ? state.loop : null; }
  function getActiveSignature() { return state && state.loop ? state.loop.activeSignature : null; }
  function getAllocatedCP() { var c = getConstants(); return c.strongForce + c.lightSpeed + c.gravity; }
  function getUnspentCP() { return getCP() - getAllocatedCP(); }

  function getMaxResearchedTier() {
    if (!state) return 0;
    for (var i = GC.TIERS.length - 1; i >= 0; i--) {
      if (state.tiers[i].researched) return i;
    }
    return 0;
  }

  // ── Resource ops ────────────────────────────────────────────────

  function addResource(tierId, amount) {
    if (!state || isLoopSealed()) return false;
    var t = state.tiers[tierId];
    t.count += amount;
    t.totalEver += amount;
    // Track total quarks for prestige
    if (tierId === 0) {
      state.totalQuarksEver += amount;
    }
    return true;
  }

  function spendResource(tierId, amount) {
    if (!state || isLoopSealed()) return false;
    var t = state.tiers[tierId];
    if (t.count < amount) return false;
    t.count -= amount;
    return true;
  }

  // ── Producer ops ────────────────────────────────────────────────

  function getProducerCost(tierId) {
    var t = state.tiers[tierId];
    var baseCost = t.producerBaseCost;
    if (state && state.slice && state.slice.enabled && GC.FIRST_CONTACT.producerBaseCosts[tierId] !== undefined) {
      baseCost = GC.FIRST_CONTACT.producerBaseCosts[tierId];
    }
    return Math.floor(baseCost * Math.pow(GC.PROD_COST_SCALE, t.producers));
  }

  function addProducer(tierId) {
    if (!state || isLoopSealed()) return false;
    var t = state.tiers[tierId];
    t.producers += 1;
    return true;
  }

  // ── Synthesis cost (semi-exponential) ───────────────────────────

  function getSynthCost(tierId) {
    var t = state.tiers[tierId];
    var baseCost = t.baseCost;
    if (state && state.slice && state.slice.enabled && GC.FIRST_CONTACT.synthBaseCosts[tierId] !== undefined) {
      baseCost = GC.FIRST_CONTACT.synthBaseCosts[tierId];
    }
    if (baseCost === 0) return 0;

    var rawCost = baseCost * Math.pow(GC.COST_GROWTH, t.synthCount);

    // Apply strong force constant
    var sf = state.constants.strongForce;
    if (sf > 0) {
      var bonus = Math.sqrt(sf) - 1;
      rawCost = rawCost / (1 + bonus * GC.STRONG_FORCE_COEFF);
    }

    // Fusion catalysis: nucleon -> atom cost x0.7
    if (tierId === 2 && state.milestones.indexOf(3) !== -1) {
      rawCost = rawCost * 0.7;
    }

    // Apply entropy tamed milestone
    if (state.milestones.indexOf(20) !== -1) {
      rawCost = rawCost * 0.5;
    }

    return Math.max(1, Math.floor(rawCost));
  }

  function getSynthBatchSize() {
    var batch = GC.SYNTH_BATCH_BASE;
    if (state && state.milestones.indexOf(15) !== -1) {
      batch = 10;
    }
    return batch;
  }

  function recordSynth(tierId) {
    if (!state || isLoopSealed()) return false;
    state.tiers[tierId].synthCount += 1;
    state.totalSynthesis += 1;
    return true;
  }

  // ── Research ────────────────────────────────────────────────────

  function getResearchCost(tierId) {
    if (state && state.slice && state.slice.enabled && state.slice.loopNumber === 2 && GC.SECOND_LOOP.researchCosts[tierId] !== undefined) {
      return GC.SECOND_LOOP.researchCosts[tierId];
    }
    if (state && state.slice && state.slice.enabled && GC.FIRST_CONTACT.researchCosts[tierId] !== undefined) {
      return GC.FIRST_CONTACT.researchCosts[tierId];
    }
    return GC.TIERS[tierId].researchCost;
  }

  function canResearch(tierId) {
    if (!state || isLoopSealed()) return false;
    var t = state.tiers[tierId];
    if (t.researched) return false;
    // Must be adjacent to max researched tier
    if (tierId !== getMaxResearchedTier() + 1) return false;
    if (state.slice && state.slice.enabled) {
      var missionGates = state.slice.loopNumber === 2
        ? [0, 0, 2, 6, 8, 8, 9]
        : [0, 0, 6, 16, 17, 19, 21];
      if (state.slice.missionStep < missionGates[tierId]) return false;
    }
    return state.researchPoints >= getResearchCost(tierId);
  }

  function doResearch(tierId) {
    if (!state || isLoopSealed()) return false;
    var cost = getResearchCost(tierId);
    if (state.researchPoints < cost) return false;
    state.researchPoints -= cost;
    state.tiers[tierId].researched = true;
    return true;
  }

  function addRP(amount) {
    if (!state || isLoopSealed()) return false;
    state.researchPoints += amount;
    return true;
  }

  // ── Prestige ────────────────────────────────────────────────────

  function calcCPGain() {
    var tq = state.totalQuarksEver;
    var base = Math.floor(Math.pow(tq, GC.CP_EXP) / GC.CP_DIV);
    var bonus = state.prestiges * GC.CP_PRESTIGE_MULT;
    return Math.max(1, base + bonus);
  }

  function canPrestige() {
    if (!state || isLoopSealed()) return false;
    return state.tiers[6].count >= 1;
  }

  function allocateCP(strongForce, lightSpeed, gravity) {
    if (!state || isLoopSealed()) return false;
    var total = strongForce + lightSpeed + gravity;
    if (total > state.constantPoints) return false;
    state.constants.strongForce = strongForce;
    state.constants.lightSpeed = lightSpeed;
    state.constants.gravity = gravity;
    return true;
  }

  // ── Constant effects (for engine) ───────────────────────────────

  function getSpeedMultiplier() {
    var ls = state.constants.lightSpeed;
    if (ls === 0) return 1;
    var bonus = Math.sqrt(ls) - 1;
    return 1 + bonus * GC.LIGHT_SPEED_COEFF;
  }

  function getGravityMultiplier(tierId) {
    if (tierId > 2) return 1;
    var g = state.constants.gravity;
    if (g === 0) return 1;
    var bonus = Math.sqrt(g) - 1;
    return 1 + bonus * GC.GRAVITY_COEFF;
  }

  // ── Milestones ─────────────────────────────────────────────────

  function checkMilestones() {
    GC.MILESTONES.forEach(function (ms) {
      if (state.prestiges >= ms.at && state.milestones.indexOf(ms.at) === -1) {
        state.milestones.push(ms.at);
      }
    });
  }

  function hasMilestone(at) {
    return state.milestones.indexOf(at) !== -1;
  }

  // ── Producer output (with milestone bonuses) ────────────────────

  function getProducerOutput(tierId) {
    var t = state.tiers[tierId];
    var output = t.baseProd * t.producers;

    // Quark condensation
    if (tierId === 0 && hasMilestone(1)) {
      output *= 1.5;
    }

    // Interstellar engineering: tier 0-3 ×2
    if (tierId <= 3 && hasMilestone(10)) {
      output *= 2;
    }

    // Self-replicating molecules: passive 0.002/s even without producers
    if (tierId === 3 && hasMilestone(5)) {
      output += 0.002;
    }

    if (state.slice && state.slice.enabled) {
      output *= GC.FIRST_CONTACT.productionMultiplier[tierId] || 1;
    }

    return output;
  }

  // ── Save / Load ─────────────────────────────────────────────────

  function toJSON() {
    return JSON.stringify(state);
  }

  function fromJSON(json) {
    try {
      var parsed = JSON.parse(json);
      if (!parsed || !parsed.tiers || parsed.tiers.length !== GC.TIERS.length) {
        return false;
      }
      // Restore static fields from GC.TIERS (in case they changed between versions)
      parsed.tiers.forEach(function (t, i) {
        var tpl = GC.TIERS[i];
        t.name = tpl.name;
        t.nameZh = tpl.nameZh;
        t.color = tpl.color;
        t.glow = tpl.glow;
        t.symbol = tpl.symbol;
        t.baseCost = tpl.baseCost;
        t.baseProd = tpl.baseProd;
        t.researchCost = tpl.researchCost;
        t.producerBaseCost = tpl.producerBaseCost;
        t.descZh = tpl.descZh;
      });
      var loopDefaults = createLoopMeta();
      var savedLoopData = parsed.loop || {};
      var rawLoopNumber = normalizedLoopNumber(
        savedLoopData.number || (parsed.slice && parsed.slice.loopNumber),
        1
      );
      var attemptedUnavailableLoop = rawLoopNumber > MAX_PLAYABLE_LOOP;
      var savedLoopNumber = Math.min(MAX_PLAYABLE_LOOP, rawLoopNumber);
      var hadSavedPhase = savedLoopData.phase === 'active' || savedLoopData.phase === 'sealed';
      parsed.loop = Object.assign({}, loopDefaults, savedLoopData);
      parsed.loop.version = loopDefaults.version;
      parsed.loop.number = savedLoopNumber;
      parsed.loop.phase = savedLoopData.phase === 'sealed' ? 'sealed' : 'active';
      if (attemptedUnavailableLoop || (!hadSavedPhase && savedLoopData.pendingSignature)) {
        parsed.loop.phase = 'sealed';
      }

      if (!Array.isArray(parsed.loop.signatures)) parsed.loop.signatures = [];
      parsed.loop.signatures = parsed.loop.signatures.map(migrateLoopSignature).filter(Boolean);
      if (!parsed.loop.activeSignature && parsed.slice && parsed.slice.loopSignature) {
        parsed.loop.activeSignature = parsed.slice.loopSignature;
      }
      parsed.loop.activeSignature = migrateLoopSignature(parsed.loop.activeSignature);
      parsed.loop.pendingSignature = migrateLoopSignature(parsed.loop.pendingSignature);

      if (savedLoopNumber === 2
        && (!parsed.loop.activeSignature || parsed.loop.activeSignature.nextLoopNumber !== 2)) {
        parsed.loop.activeSignature = parsed.loop.signatures.find(function (signature) {
          return signature.nextLoopNumber === 2;
        }) || null;
      }

      if (parsed.loop.phase === 'sealed') {
        parsed.loop.sealedLoopNumber = Math.min(
          MAX_PLAYABLE_LOOP,
          normalizedLoopNumber(parsed.loop.sealedLoopNumber, savedLoopNumber)
        );
        if (!parsed.loop.pendingSignature) {
          for (var signatureIndex = parsed.loop.signatures.length - 1; signatureIndex >= 0; signatureIndex -= 1) {
            if (parsed.loop.signatures[signatureIndex].completedLoopNumber === parsed.loop.sealedLoopNumber) {
              parsed.loop.pendingSignature = parsed.loop.signatures[signatureIndex];
              break;
            }
          }
        }
        if (parsed.loop.pendingSignature) {
          var pendingHistoryIndex = parsed.loop.signatures.findIndex(function (signature) {
            return signature.completedLoopNumber === parsed.loop.sealedLoopNumber;
          });
          if (pendingHistoryIndex === -1) parsed.loop.signatures.push(parsed.loop.pendingSignature);
          else parsed.loop.signatures[pendingHistoryIndex] = parsed.loop.pendingSignature;
        }
      } else {
        parsed.loop.sealedLoopNumber = null;
        parsed.loop.pendingSignature = null;
      }

      var sliceDefaults = createSliceState(parsed.slice && parsed.slice.enabled, {
        loopNumber: savedLoopNumber,
        signature: parsed.loop.activeSignature || (parsed.slice && parsed.slice.loopSignature) || null,
      });
      if (!parsed.slice) parsed.slice = sliceDefaults;
      else {
        var savedSliceVersion = parsed.slice.version || 0;
        if (parsed.slice.missionStartedAt === undefined) parsed.slice.missionStartedAt = parsed.slice.elapsedSeconds || 0;
        parsed.slice.guide = Object.assign({}, sliceDefaults.guide, parsed.slice.guide || {});
        parsed.slice.stability = Object.assign({}, sliceDefaults.stability, parsed.slice.stability || {});
        parsed.slice.preparation = Object.assign({}, sliceDefaults.preparation, parsed.slice.preparation || {});
        parsed.slice.tendencies = Object.assign({}, sliceDefaults.tendencies, parsed.slice.tendencies || {});
        parsed.slice.stats = Object.assign({}, sliceDefaults.stats, parsed.slice.stats || {});
        parsed.slice.flags = Object.assign({}, sliceDefaults.flags, parsed.slice.flags || {});
        parsed.slice.civilization = Object.assign({}, sliceDefaults.civilization, parsed.slice.civilization || {});
        parsed.slice.reverse = Object.assign({}, sliceDefaults.reverse, parsed.slice.reverse || {});
        var savedReverseObjects = parsed.slice.reverse.objects || {};
        parsed.slice.reverse.objects = {};
        Object.keys(sliceDefaults.reverse.objects).forEach(function (id) {
          parsed.slice.reverse.objects[id] = Object.assign({}, sliceDefaults.reverse.objects[id], savedReverseObjects[id] || {});
        });
        parsed.slice.enemy = Object.assign({}, sliceDefaults.enemy, parsed.slice.enemy || {});
        parsed.slice.discoveries = Object.assign({}, sliceDefaults.discoveries, parsed.slice.discoveries || {});
        if (!parsed.slice.discoveries.resolved || typeof parsed.slice.discoveries.resolved !== 'object') parsed.slice.discoveries.resolved = {};
        var savedTalentNodes = parsed.slice.talents && parsed.slice.talents.nodes ? parsed.slice.talents.nodes : {};
        parsed.slice.talents = Object.assign({}, sliceDefaults.talents, parsed.slice.talents || {});
        parsed.slice.talents.nodes = Object.assign({}, sliceDefaults.talents.nodes, savedTalentNodes);
        if (!Array.isArray(parsed.slice.talents.awarded)) parsed.slice.talents.awarded = [];
        if (!Array.isArray(parsed.slice.talents.history)) parsed.slice.talents.history = [];
        parsed.slice.talents.points = Math.max(0, Number(parsed.slice.talents.points) || 0);
        parsed.slice.talents.totalEarned = Math.max(
          parsed.slice.talents.points + parsed.slice.talents.history.length,
          Number(parsed.slice.talents.totalEarned) || 0
        );
        Object.keys(sliceDefaults.talents.nodes).forEach(function (id) {
          parsed.slice.talents.nodes[id] = Math.max(0, Math.min(2, Number(parsed.slice.talents.nodes[id]) || 0));
        });
        if (savedSliceVersion < 9 && savedLoopNumber === 1) {
          // v8 awarded first-loop talent points at missions 1/5/10/15/20.
          // Preserve points the player already spent, but remap award markers
          // onto the slower 6/10/15/20/23 plan so loading cannot grant them a
          // second time. Completely untouched early points are safely delayed.
          var firstLoopAwardPrefix = 'loop-1-mission-';
          var migratedAwardSteps = [6, 10, 15, 20, 23];
          var legacyAwardCount = parsed.slice.talents.awarded.filter(function (id) {
            return String(id).indexOf(firstLoopAwardPrefix) === 0;
          }).length;
          var spentRanks = Object.keys(parsed.slice.talents.nodes).reduce(function (total, id) {
            return total + parsed.slice.talents.nodes[id];
          }, 0);
          var spentCount = Math.max(spentRanks, parsed.slice.talents.history.length);
          var preservedEarned = Math.min(
            migratedAwardSteps.length,
            Math.max(
              legacyAwardCount,
              spentCount + parsed.slice.talents.points,
              parsed.slice.talents.totalEarned
            )
          );
          var nonFirstLoopAwards = parsed.slice.talents.awarded.filter(function (id) {
            return String(id).indexOf(firstLoopAwardPrefix) !== 0;
          });
          var untouchedEarlyPoint = parsed.slice.missionStep < migratedAwardSteps[0] && spentCount === 0;
          if (untouchedEarlyPoint) {
            parsed.slice.talents.points = 0;
            parsed.slice.talents.totalEarned = 0;
            parsed.slice.talents.awarded = nonFirstLoopAwards;
          } else {
            parsed.slice.talents.totalEarned = Math.max(spentCount, preservedEarned);
            parsed.slice.talents.points = Math.min(
              parsed.slice.talents.points,
              Math.max(0, parsed.slice.talents.totalEarned - spentCount)
            );
            parsed.slice.talents.awarded = nonFirstLoopAwards.concat(
              migratedAwardSteps.slice(0, preservedEarned).map(function (missionStep) {
                return firstLoopAwardPrefix + missionStep;
              })
            );
          }
        }
        parsed.slice.observation = Object.assign({}, sliceDefaults.observation, parsed.slice.observation || {});
        parsed.slice.observation.charges = Math.max(0, Math.min(
          GC.OBSERVATION.maxCharges,
          Number(parsed.slice.observation.charges) || 0
        ));
        parsed.slice.observation.rechargeProgress = Math.max(0, Number(parsed.slice.observation.rechargeProgress) || 0);
        if (!parsed.slice.observation.active || typeof parsed.slice.observation.active !== 'object') parsed.slice.observation.active = null;
        if (!parsed.slice.observation.lastResult || typeof parsed.slice.observation.lastResult !== 'object') parsed.slice.observation.lastResult = null;
        if (!Array.isArray(parsed.slice.observation.history)) parsed.slice.observation.history = [];
        if (parsed.slice.observation.history.length > GC.OBSERVATION.historyLimit) {
          parsed.slice.observation.history = parsed.slice.observation.history.slice(-GC.OBSERVATION.historyLimit);
        }
        if (savedSliceVersion < 6) {
          if (parsed.slice.missionStep > 16) parsed.slice.reverse.objects.lattice = { status: 'resolved', choice: 'legacy', mirroredRoute: null };
          if (parsed.slice.missionStep > 17) parsed.slice.reverse.objects.choir = { status: 'resolved', choice: 'legacy', mirroredRoute: null };
          if (parsed.slice.missionStep > 19) parsed.slice.reverse.objects.seed = { status: 'resolved', choice: 'legacy', mirroredRoute: null };
        }
        parsed.slice.archive = Object.assign({}, sliceDefaults.archive, parsed.slice.archive || {});
        parsed.slice.roundTwo = Object.assign({}, sliceDefaults.roundTwo, parsed.slice.roundTwo || {});
        parsed.slice.roundTwo.counterexample = Object.assign(
          {},
          sliceDefaults.roundTwo.counterexample,
          parsed.slice.roundTwo.counterexample || {}
        );
        if (!Array.isArray(parsed.slice.discoveries.triggered)) parsed.slice.discoveries.triggered = [];
        if (!Array.isArray(parsed.slice.discoveries.acknowledged)) parsed.slice.discoveries.acknowledged = [];
        if (!Array.isArray(parsed.slice.archive.read)) parsed.slice.archive.read = [];
        if (!Array.isArray(parsed.slice.decisions)) parsed.slice.decisions = [];
        if (!Array.isArray(parsed.slice.logs)) parsed.slice.logs = [];
        parsed.slice.version = sliceDefaults.version;
        parsed.slice.loopNumber = savedLoopNumber;
        parsed.slice.loopSignature = parsed.loop.activeSignature || null;
      }
      if (parsed.loop.phase === 'sealed'
        && !parsed.loop.pendingSignature
        && !attemptedUnavailableLoop
        && savedLoopNumber === MAX_PLAYABLE_LOOP
        && parsed.slice.flags
        && parsed.slice.flags.civilizationComplete
        && parsed.slice.roundTwo
        && parsed.slice.roundTwo.truthVerdict) {
        // Recover an interrupted/partial seal by returning to the completed
        // report. A subsequent finalize call will rebuild the missing record.
        parsed.loop.phase = 'active';
        parsed.loop.sealedLoopNumber = null;
      }
      state = parsed;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Export ──────────────────────────────────────────────────────
  window.GameState = {
    init: init,
    bigCrunchReset: bigCrunchReset,
    beginDirectedRebirth: beginDirectedRebirth,
    buildLoopSignature: buildLoopSignature,
    canFinalizeCurrentLoop: canFinalizeCurrentLoop,
    finalizeCurrentLoop: finalizeCurrentLoop,

    // Getters
    getState: getState,
    getTier: getTier,
    getRP: getRP,
    getCP: getCP,
    getPrestiges: getPrestiges,
    getTotalQuarksEver: getTotalQuarksEver,
    getMilestones: getMilestones,
    getConstants: getConstants,
    getSlice: getSlice,
    getLoop: getLoop,
    getLoopPhase: getLoopPhase,
    isLoopSealed: isLoopSealed,
    getActiveSignature: getActiveSignature,
    getCampaignStatus: getCampaignStatus,
    getAllocatedCP: getAllocatedCP,
    getUnspentCP: getUnspentCP,
    getMaxResearchedTier: getMaxResearchedTier,

    // Resource ops
    addResource: addResource,
    spendResource: spendResource,

    // Producer ops
    getProducerCost: getProducerCost,
    addProducer: addProducer,

    // Synthesis
    getSynthCost: getSynthCost,
    getSynthBatchSize: getSynthBatchSize,
    recordSynth: recordSynth,

    // Research
    getResearchCost: getResearchCost,
    canResearch: canResearch,
    doResearch: doResearch,
    addRP: addRP,

    // Prestige
    calcCPGain: calcCPGain,
    canPrestige: canPrestige,
    allocateCP: allocateCP,

    // Constant effects
    getSpeedMultiplier: getSpeedMultiplier,
    getGravityMultiplier: getGravityMultiplier,
    getProducerOutput: getProducerOutput,

    // Milestones
    checkMilestones: checkMilestones,
    hasMilestone: hasMilestone,

    // Save/Load
    toJSON: toJSON,
    fromJSON: fromJSON,
  };
})();
