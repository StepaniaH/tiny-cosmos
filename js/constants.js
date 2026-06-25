// tiny-cosmos — Game Constants
// Tier definitions, cost curves, and balance parameters
(function () {
  'use strict';

  var TIERS = [
    { id: 0, name: 'Quark', nameZh: '夸克', color: '#ff6b6b', glow: 'rgba(255,107,107,0.6)', symbol: 'q', synthesisCost: 0,  baseProd: 0.3,  researchCost: 0,      producerCost: 10,   descZh: '宇宙最基本的粒子' },
    { id: 1, name: 'Nucleon', nameZh: '核子', color: '#ffa94d', glow: 'rgba(255,169,77,0.6)', symbol: 'N', synthesisCost: 3,  baseProd: 0.08, researchCost: 15,     producerCost: 25,   descZh: '质子与中子，原子核的基石' },
    { id: 2, name: 'Atom', nameZh: '原子', color: '#ffd43b', glow: 'rgba(255,212,59,0.6)', symbol: 'A', synthesisCost: 2,  baseProd: 0.03, researchCost: 50,     producerCost: 60,   descZh: '元素就此诞生' },
    { id: 3, name: 'Molecule', nameZh: '分子', color: '#69db7c', glow: 'rgba(105,219,124,0.6)', symbol: 'M', synthesisCost: 4,  baseProd: 0.012, researchCost: 150,    producerCost: 150,  descZh: '原子间的化学键合' },
    { id: 4, name: 'Cell', nameZh: '细胞', color: '#4dabf7', glow: 'rgba(77,171,247,0.6)', symbol: 'C', synthesisCost: 3,  baseProd: 0.005, researchCost: 500,    producerCost: 400,  descZh: '生命的结构单元' },
    { id: 5, name: 'Life', nameZh: '生命', color: '#cc5de8', glow: 'rgba(204,93,232,0.6)', symbol: 'L', synthesisCost: 5,  baseProd: 0.002, researchCost: 2000,   producerCost: 1000, descZh: '意识的微光' },
    { id: 6, name: 'Civilization', nameZh: '文明', color: '#f783ac', glow: 'rgba(247,131,172,0.6)', symbol: 'Civ', synthesisCost: 8, baseProd: 0,     researchCost: 8000,   producerCost: 3000, descZh: '智慧的火种' },
  ];

  // Demand: each unit of tier N consumes this many tier N-1 per tick (20 ticks/sec)
  var DEMAND_PER_UNIT = 0.00025; // ~0.005/s per unit → 100 units = 0.5/s consumption

  // Manual synthesis batch size
  var SYNTH_BATCH = 1;

  // Ticks per second
  var TICKS_PER_SEC = 20;

  // Prestige: constant point gain formula → floor(log10(totalQuarksEver) * PRESTIGE_MULT)
  var PRESTIGE_MULT = 1.0;

  // Research point generation: highest unlocked tier produces RP
  var RP_PER_TICK = { 0: 0, 1: 0.001, 2: 0.003, 3: 0.008, 4: 0.02, 5: 0.05, 6: 0.15 };

  // Producer cost multiplier (each new producer costs more)
  var PRODUCER_COST_SCALE = 1.15;

  // Save interval (ms)
  var AUTOSAVE_MS = 30000;

  window.GC = {
    TIERS: TIERS,
    DEMAND_PER_UNIT: DEMAND_PER_UNIT,
    SYNTH_BATCH: SYNTH_BATCH,
    TICKS_PER_SEC: TICKS_PER_SEC,
    PRESTIGE_MULT: PRESTIGE_MULT,
    RP_PER_TICK: RP_PER_TICK,
    PRODUCER_COST_SCALE: PRODUCER_COST_SCALE,
    AUTOSAVE_MS: AUTOSAVE_MS,
  };
})();
