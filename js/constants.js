// tiny-cosmos — Game Constants
// Tier definitions, balance parameters, milestones
// All game tuning lives here — change numbers, not logic.
(function () {
  'use strict';

  // ── Tier Definitions ────────────────────────────────────────────
  var TIERS = [
    {
      id: 0, name: 'Quark', nameZh: '夸克',
      color: '#ff6b6b', glow: 'rgba(255,107,107,0.5)',
      symbol: 'q',
      baseCost: 0,          // no lower tier to consume
      baseProd: 0.3,        // per producer, per second
      researchCost: 0,      // already researched
      producerBaseCost: 10, // first producer price (in own resource)
      descZh: '宇宙最基本的粒子，一切的开端',
    },
    {
      id: 1, name: 'Nucleon', nameZh: '核子',
      color: '#ffa94d', glow: 'rgba(255,169,77,0.5)',
      symbol: 'N',
      baseCost: 3,          // 3 quarks → 1 nucleon
      baseProd: 0.08,
      researchCost: 15,
      producerBaseCost: 5,  // price in nucleons (produces nucleons automatically)
      descZh: '质子与中子，原子核的基石',
    },
    {
      id: 2, name: 'Atom', nameZh: '原子',
      color: '#ffd43b', glow: 'rgba(255,212,59,0.5)',
      symbol: 'A',
      baseCost: 2,          // 2 nucleons → 1 atom
      baseProd: 0.03,
      researchCost: 25,
      producerBaseCost: 3,
      descZh: '元素就此诞生，宇宙开始有了结构',
    },
    {
      id: 3, name: 'Molecule', nameZh: '分子',
      color: '#69db7c', glow: 'rgba(105,219,124,0.5)',
      symbol: 'M',
      baseCost: 4,          // 4 atoms → 1 molecule
      baseProd: 0.012,
      researchCost: 80,
      producerBaseCost: 2,
      descZh: '原子间的化学键合，复杂性开始涌现',
    },
    {
      id: 4, name: 'Cell', nameZh: '细胞',
      color: '#4dabf7', glow: 'rgba(77,171,247,0.5)',
      symbol: 'C',
      baseCost: 3,          // 3 molecules → 1 cell
      baseProd: 0.005,
      researchCost: 300,
      producerBaseCost: 1,
      descZh: '生命的结构单元，自组织的奇迹',
    },
    {
      id: 5, name: 'Life', nameZh: '生命',
      color: '#cc5de8', glow: 'rgba(204,93,232,0.5)',
      symbol: 'L',
      baseCost: 5,          // 5 cells → 1 life
      baseProd: 0.002,
      researchCost: 1200,
      producerBaseCost: 1,
      descZh: '意识的微光，宇宙开始注视自己',
    },
    {
      id: 6, name: 'Civilization', nameZh: '文明',
      color: '#f783ac', glow: 'rgba(247,131,172,0.5)',
      symbol: 'Civ',
      baseCost: 8,          // long-form baseline; first loop overrides this below
      baseProd: 0,          // no auto-production — achievement tier
      researchCost: 5000,
      producerBaseCost: 0,  // no producers
      descZh: '智慧的火种，足以重塑宇宙',
    },
  ];

  // ── Balance Parameters ──────────────────────────────────────────

  // Semi-exponential cost growth: cost = baseCost × COST_GROWTH^synthCount
  var COST_GROWTH = 1.05;   // +5% per synthesis

  // Producer cost scaling: cost = producerBaseCost × PROD_COST_SCALE^producers
  var PROD_COST_SCALE = 1.15; // +15% per producer

  // Demand: each unit of tier N+1 consumes this much tier N per tick
  var DEMAND_PER_UNIT = 0.00025; // 0.005/s per unit

  // Manual synthesis batch size (increased by milestone)
  var SYNTH_BATCH_BASE = 1;

  // Game loop: ticks per second
  var TICKS_PER_SEC = 20;

  // Research point generation per tick: sqrt(count) × coefficient
  // sqrt dampens the effect of resource accumulation — more resources
  // give more RP, but with diminishing returns. This naturally creates
  // an accelerating difficulty curve: early game fast, late game slow.
  // Per-tick; multiply by TICKS_PER_SEC for display.
  var RP_SQRT_COEFF = [0.00015, 0.0003, 0.0006, 0.0012, 0.0025, 0.005, 0.01];

  // Prestige: CP = floor(totalQuarksEver^EXP / DIV) + prestiges × PRESTIGE_MULT
  var CP_EXP = 0.3;
  var CP_DIV = 3;
  var CP_PRESTIGE_MULT = 2;

  // Constant effect coefficients (all use sqrt(constant) - 1 as base bonus)
  var STRONG_FORCE_COEFF = 0.5;  // cost divisor
  var LIGHT_SPEED_COEFF = 0.3;   // speed multiplier
  var GRAVITY_COEFF = 0.4;       // tier 0-2 production multiplier

  // ── Milestones (permanent unlocks) ─────────────────────────────
  var MILESTONES = [
    { at: 1,  name: '夸克凝聚', nameEn: 'Quark Condensation', descZh: '夸克生产者产量 +50%', descEn: 'Quark producers +50%' },
    { at: 3,  name: '核聚变催化', nameEn: 'Fusion Catalysis', descZh: '核子→原子成本 ×0.7', descEn: 'Nucleon→Atom cost ×0.7' },
    { at: 5,  name: '自复制分子', nameEn: 'Self-Replicating Molecules', descZh: '分子自动产 0.002/s', descEn: 'Molecules auto-produce 0.002/s' },
    { at: 7,  name: '共生网络', nameEn: 'Symbiotic Network', descZh: '所有代谢消耗 -30%', descEn: 'All metabolic demand -30%' },
    { at: 10, name: '星际工程', nameEn: 'Interstellar Engineering', descZh: 'tier 0-3 生产者产量 ×2', descEn: 'Tier 0-3 producer output ×2' },
    { at: 15, name: '维度折叠', nameEn: 'Dimensional Folding', descZh: '合成批量 ×10', descEn: 'Synthesis batch size ×10' },
    { at: 20, name: '熵的驯服', nameEn: 'Entropy Tamed', descZh: '所有合成成本 ×0.5', descEn: 'All synthesis costs ×0.5' },
  ];

  // ── Storage key ─────────────────────────────────────────────────
  // The first-contact vertical slice uses its own save slot so existing
  // long-form saves remain untouched while the prototype is evaluated.
  var SAVE_KEY = 'tiny-cosmos-first-contact-v6';

  // Auto-save interval (ms)
  var AUTOSAVE_MS = 30000;

  // ── First-loop vertical slice ──────────────────────────────────
  // These values only apply when state.slice.enabled is true. The deterministic
  // balance harness calls GameState.init() without slice mode and keeps using
  // the long-form baseline above.
  var FIRST_CONTACT = {
    targetMinutes: 45,
    productionMultiplier: [1, 1, 1, 1, 1, 1, 1],
    evolutionProductionMultiplier: [1.15, 1.2, 1.3, 1.55, 1.75, 2, 1],
    producerBaseCosts: [14, 8, 5, 3, 2, 2, 0],
    synthBaseCosts: [0, 3, 2, 4, 3, 5, 12],
    researchMultiplier: 2.6,
    researchCosts: [0, 0, 45, 150, 360, 900, 1800],
    evolutionResearchMultiplier: 1.6,
    focusMultiplier: 1.8,
    focusLawBonus: 0.45,
    reserveFloors: [8, 4, 2, 1, 1, 1, 0],
    warningSeconds: 60,
    enemyLossCap: 6,
    enemyDrainPerSecond: 0.06,
    observeGoal: 4,
    cutoffSeconds: 45,
    overloadCost: 4,
    overloadPulses: 5,
    earlyStabilitySeconds: 35,
    matterStabilitySeconds: 60,
    preparationSeconds: 30,
    lifeSignalSeconds: 75,
  };

  // ── Second-loop pacing ─────────────────────────────────────────
  // Round two starts with remembered operations and a biased material seed.
  // It therefore uses fewer research waits and spends its time on the inherited
  // truth, the route-specific counterexample, and the second civilization.
  var SECOND_LOOP = {
    targetMinutes: 28,
    researchCosts: [0, 0, 32, 95, 210, 480, 900],
    biasSeconds: 25,
    proofSeconds: 40,
    productionByRoute: {
      advance: [1, 1, 1.22, 1.08, 1, 1, 1],
      sustain: [1.16, 1.16, 0.94, 1.06, 1, 1, 1],
      inquiry: [1, 1, 0.94, 1, 1, 1, 1],
      rewrite: [1.08, 1.08, 1.08, 1.08, 1, 1, 1],
      ordinary: [1.08, 1.08, 1, 1, 1, 1, 1],
    },
    researchByRoute: {
      advance: 1,
      sustain: 1.05,
      inquiry: 1.28,
      rewrite: 1.12,
      ordinary: 1.08,
    },
  };

  // ── Slice talents and active observation ────────────────────────
  // Talents are per-loop choices. They never add route tendency; their only
  // effects are applied by GameSlice's existing production, demand and
  // research hooks.
  var TALENT_DEFINITIONS = [
    {
      id: 'focus',
      nameZh: '深度聚焦',
      descZh: '焦点所在层每级额外获得 1.08 倍生产。',
      maxRank: 2,
      cost: 1,
      multiplierPerRank: 1.08,
    },
    {
      id: 'flow',
      nameZh: '流量整序',
      descZh: '全局代谢需求每级乘以 0.95。',
      maxRank: 2,
      cost: 1,
      multiplierPerRank: 0.95,
    },
    {
      id: 'research',
      nameZh: '并行推演',
      descZh: '研究增长每级额外获得 1.08 倍。',
      maxRank: 2,
      cost: 1,
      multiplierPerRank: 1.08,
    },
    {
      id: 'echo',
      nameZh: '回声蓄能',
      descZh: '观测充能间隔每级缩短 5 秒。',
      maxRank: 2,
      cost: 1,
      secondsPerRank: 5,
    },
  ];

  var TALENT_AWARD_STEPS = {
    1: [1, 5, 10, 15, 20],
    2: [0, 2, 4, 7, 9],
  };

  var OBSERVATION = {
    initialCharges: 1,
    maxCharges: 3,
    rechargeSeconds: 45,
    echoReductionSeconds: 5,
    historyLimit: 80,
    protocols: [
      {
        id: 'stabilize',
        nameZh: '稳态校准',
        descZh: '定位净流量最低的已研究层，并临时提高该层生产。',
        durationSeconds: 45,
        productionMultiplier: 1.45,
      },
      {
        id: 'surge',
        nameZh: '聚焦脉冲',
        descZh: '短时放大当前焦点；没有焦点时作用于最高已研究层。',
        durationSeconds: 20,
        productionMultiplier: 1.8,
      },
      {
        id: 'decode',
        nameZh: '解码回声',
        descZh: '立即把约二十秒的当前研究增长压缩成研究点。',
        researchSeconds: 20,
        minimumResearch: 3,
      },
    ],
  };

  // ── Export ──────────────────────────────────────────────────────
  window.GC = {
    TIERS: TIERS,
    COST_GROWTH: COST_GROWTH,
    PROD_COST_SCALE: PROD_COST_SCALE,
    DEMAND_PER_UNIT: DEMAND_PER_UNIT,
    SYNTH_BATCH_BASE: SYNTH_BATCH_BASE,
    TICKS_PER_SEC: TICKS_PER_SEC,
    RP_SQRT_COEFF: RP_SQRT_COEFF,
    CP_EXP: CP_EXP,
    CP_DIV: CP_DIV,
    CP_PRESTIGE_MULT: CP_PRESTIGE_MULT,
    STRONG_FORCE_COEFF: STRONG_FORCE_COEFF,
    LIGHT_SPEED_COEFF: LIGHT_SPEED_COEFF,
    GRAVITY_COEFF: GRAVITY_COEFF,
    MILESTONES: MILESTONES,
    SAVE_KEY: SAVE_KEY,
    AUTOSAVE_MS: AUTOSAVE_MS,
    FIRST_CONTACT: FIRST_CONTACT,
    SECOND_LOOP: SECOND_LOOP,
    TALENT_DEFINITIONS: TALENT_DEFINITIONS,
    TALENT_AWARD_STEPS: TALENT_AWARD_STEPS,
    OBSERVATION: OBSERVATION,
  };
})();
