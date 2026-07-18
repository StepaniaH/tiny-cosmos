const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createSliceGame() {
  const game = createGameRuntime();
  game.GS.init({ firstContact: true });
  game.window.GameSlice.init();
  return game;
}

function tickUntil(game, condition, maxSeconds, label) {
  const maxTicks = maxSeconds * game.GC.TICKS_PER_SEC;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (condition()) return tick / game.GC.TICKS_PER_SEC;
    game.GE.tick();
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function clickCanvas(game, times) {
  for (let i = 0; i < times; i += 1) {
    game.GS.addResource(0, 1);
    game.window.GameSlice.onCanvasClick();
  }
}

function finishInterlude(game) {
  tickUntil(
    game,
    () => !game.GS.getSlice().guide.interlude,
    60,
    'guided free-observation interval',
  );
}

function synthWhenReady(game, tierId, times) {
  for (let i = 0; i < times; i += 1) {
    tickUntil(
      game,
      () => game.GS.getTier(tierId - 1).count >= game.GS.getSynthCost(tierId),
      180,
      `tier-${tierId} synthesis material`,
    );
    assert(game.GE.synthesize(tierId), `Failed to synthesize tier ${tierId}`);
  }
}

function buildNucleonsTo(game, target) {
  while (game.GS.getTier(1).count < target) {
    if (game.GS.getTier(0).count >= game.GS.getSynthCost(1)) game.GE.synthesize(1);
    else game.GE.tick();
  }
}

function buildAtomsTo(game, target) {
  while (game.GS.getTier(2).count < target) {
    if (game.GS.getTier(1).count >= game.GS.getSynthCost(2)) game.GE.synthesize(2);
    else if (game.GS.getTier(0).count >= game.GS.getSynthCost(1)) game.GE.synthesize(1);
    else game.GE.tick();
  }
}

function completePreparation(game, preparation) {
  const Slice = game.window.GameSlice;
  assert(Slice.choosePreparation(preparation), `Failed to choose ${preparation} preparation`);

  if (preparation === 'pulse') {
    buildAtomsTo(game, game.GS.getProducerCost(2));
    assert(game.GE.buyProducer(2), 'Failed to buy the third atom producer');
    buildNucleonsTo(game, 14);
  }
  if (preparation === 'buffer') {
    buildAtomsTo(game, 10);
    buildNucleonsTo(game, 18);
  }
  if (preparation === 'sensor') {
    assert(Slice.setFocus(2), 'Failed to focus atoms for sensor preparation');
    tickUntil(game, () => game.GS.getRP() >= 12, 240, 'sensor preparation research');
  }

  tickUntil(game, () => game.GS.getSlice().preparation.completed, 90, `${preparation} preparation`);
  finishInterlude(game);
}

function prepareFirstContact(game, law, preparation) {
  const Slice = game.window.GameSlice;

  clickCanvas(game, 5);
  finishInterlude(game);
  tickUntil(game, () => game.GS.getTier(0).count >= game.GS.getProducerCost(0), 60, 'quark producer');
  assert(game.GE.buyProducer(0), 'Failed to buy the guided quark producer');
  finishInterlude(game);

  synthWhenReady(game, 1, 5);
  finishInterlude(game);
  synthWhenReady(game, 1, 3);
  assert(game.GE.buyProducer(1), 'Failed to buy the guided nucleon producer');
  assert(Slice.setFocus(1), 'Failed to focus the nucleon tier');
  finishInterlude(game);

  tickUntil(game, () => game.GS.getSlice().stability.early >= game.GC.FIRST_CONTACT.earlyStabilitySeconds, 120, 'early flow stability');
  assert(Slice.getStabilityConditionState(4).every((condition) => condition.met), 'Early stability completed with an unmet public condition');
  finishInterlude(game);

  assert(Slice.explainResearch(), 'Failed to open the research breakdown');
  finishInterlude(game);

  tickUntil(game, () => game.GS.canResearch(2), 480, 'atom research');
  assert(
    ['quark-echo', 'nucleon-silence', 'missing-description'].every((id) => game.GS.getSlice().discoveries.triggered.includes(id)),
    'The research wait did not trigger all three narrative discoveries',
  );
  assert(game.GE.research(2), 'Failed to research atoms');
  finishInterlude(game);

  while (game.GS.getTier(2).totalEver < 18 || game.GS.getTier(2).producers < 2) {
    const atom = game.GS.getTier(2);
    if (atom.producers < 2 && atom.count >= game.GS.getProducerCost(2)) {
      assert(game.GE.buyProducer(2), 'Failed to buy the atom producer');
      continue;
    }
    if (game.GS.getTier(1).count >= game.GS.getSynthCost(2)) {
      assert(game.GE.synthesize(2), 'Failed to synthesize an atom');
      continue;
    }
    if (game.GS.getTier(0).count >= game.GS.getSynthCost(1)) {
      assert(game.GE.synthesize(1), 'Failed to synthesize a nucleon');
      continue;
    }
    game.GE.tick();
  }
  finishInterlude(game);

  assert(Slice.setReserve(1), 'Failed to protect the nucleon tier');
  finishInterlude(game);

  buildAtomsTo(game, 12);
  buildNucleonsTo(game, 8);
  if (game.GS.getSlice().focusTier !== 1) assert(Slice.setFocus(1), 'Failed to restore nucleon focus');
  tickUntil(game, () => game.GS.getSlice().stability.matter >= game.GC.FIRST_CONTACT.matterStabilitySeconds, 180, 'matter stability');
  assert(Slice.getStabilityConditionState(9).every((condition) => condition.met), 'Matter stability completed with an unmet public condition');
  finishInterlude(game);

  assert(Slice.chooseLaw(law), `Failed to choose the ${law} law`);
  finishInterlude(game);
  completePreparation(game, preparation);
  assert(game.GS.getSlice().enemy.status === 'warning', 'Enemy warning did not start');
  assert(Slice.beginContact(), 'Failed to begin contact');
}

function resolveMethod(game, method, coreDisposition) {
  const Slice = game.window.GameSlice;
  if (method === 'observe') {
    // Let some loss occur before committing. This verifies that the controlled
    // observation budget remains reachable even with conservation + buffer.
    for (let tick = 0; tick < game.GC.TICKS_PER_SEC * 10; tick += 1) game.GE.tick();
  }
  assert(Slice.chooseEnemyMethod(method), `Failed to choose ${method}`);

  if (method === 'overload') {
    while (game.GS.getSlice().enemy.status !== 'resolved') {
      if (game.GS.getTier(1).count >= Slice.getOverloadCost()) {
        assert(Slice.pulseOverload(), 'Failed to inject overload pulse');
      } else if (game.GS.getTier(0).count >= game.GS.getSynthCost(1)) {
        game.GE.synthesize(1);
      } else {
        game.GE.tick();
      }
    }
  }

  if (method === 'cutoff') {
    if (game.GS.getSlice().focusTier === 2) assert(Slice.setFocus(1), 'Failed to move focus away from atoms for cutoff');
    if (game.GS.getSlice().reserveTier !== 1) assert(Slice.setReserve(1), 'Failed to protect nucleons for cutoff');
    assert(Slice.toggleIsolation(), 'Failed to enable atom isolation');
    tickUntil(game, () => game.GS.getSlice().enemy.status === 'resolved', 90, 'cutoff resolution');
  }

  if (method === 'observe') {
    if (game.GS.getSlice().focusTier !== 2) assert(Slice.setFocus(2), 'Failed to focus atoms for observation');
    tickUntil(game, () => game.GS.getSlice().enemy.status === 'resolved', 120, 'observation resolution');
  }

  finishInterlude(game);
  assert(Slice.chooseCoreDisposition(coreDisposition), `Failed to choose ${coreDisposition} for the core afterimage`);
  assert(game.GS.getSlice().flags.demoComplete, 'The first-contact slice did not complete');
}

function run({ law, preparation, method, coreDisposition }) {
  const game = createSliceGame();
  prepareFirstContact(game, law, preparation);
  resolveMethod(game, method, coreDisposition);
  const slice = game.GS.getSlice();
  const report = game.window.GameLore.getFirstContactReport(slice, game.window.GameSlice.getRouteRanking());
  assert(report && report.method !== '未记录' && report.law !== '未记录' && report.preparation !== '未记录' && report.disposition !== '未记录', 'The completion report is incomplete');
  const reloaded = createGameRuntime();
  assert(reloaded.GS.fromJSON(game.GS.toJSON()), 'Failed to reload a completed first-contact save');
  reloaded.window.GameSlice.init();
  const reloadedSlice = reloaded.GS.getSlice();
  const reloadedReport = reloaded.window.GameLore.getFirstContactReport(reloadedSlice, reloaded.window.GameSlice.getRouteRanking());
  assert(reloadedSlice.flags.demoComplete && reloadedReport.method === report.method, 'Completed report did not survive save/load');
  return {
    law,
    preparation,
    method,
    coreDisposition,
    elapsedSeconds: Number(slice.elapsedSeconds.toFixed(2)),
    missionStep: slice.missionStep,
    tendencies: slice.tendencies,
    enemyLoss: Number(slice.enemy.siphoned.toFixed(2)),
    decisions: slice.decisions.map((decision) => decision.id),
  };
}

function verifyLegacySaveMigration() {
  const source = createSliceGame();
  const legacy = JSON.parse(source.GS.toJSON());
  legacy.slice.version = 1;
  delete legacy.slice.enemy.observeLossLimit;
  delete legacy.slice.enemy.methodStartSiphoned;
  delete legacy.slice.flags.demoComplete;
  delete legacy.slice.stats.atomSyntheses;
  delete legacy.slice.guide.message;
  delete legacy.slice.discoveries;
  delete legacy.slice.archive;
  const target = createGameRuntime();
  assert(target.GS.fromJSON(JSON.stringify(legacy)), 'Failed to migrate a legacy first-contact save');
  const migrated = target.GS.getSlice();
  assert(migrated.version === 5, 'Legacy save version was not upgraded');
  assert(migrated.enemy.observeLossLimit === null, 'Legacy enemy defaults were not restored');
  assert(migrated.flags.demoComplete === false, 'Legacy flag defaults were not restored');
  assert(migrated.stats.atomSyntheses === 0, 'Legacy stat defaults were not restored');
  assert(migrated.guide.message === '', 'Legacy guide defaults were not restored');
  assert(Array.isArray(migrated.discoveries.triggered), 'Discovery migration defaults were not restored');
  assert(Array.isArray(migrated.archive.read), 'Archive read migration defaults were not restored');
  return true;
}

const laws = ['expansion', 'conservation', 'observer'];
const preparations = ['buffer', 'pulse', 'sensor'];
const methods = ['overload', 'cutoff', 'observe'];
const cores = ['fuel', 'return', 'archive'];
const scenarios = [];
let scenarioIndex = 0;

for (const law of laws) {
  for (const preparation of preparations) {
    for (const method of methods) {
      scenarios.push({
        law,
        preparation,
        method,
        coreDisposition: cores[scenarioIndex % cores.length],
      });
      scenarioIndex += 1;
    }
  }
}

const results = scenarios.map(run);
const elapsed = results.map((result) => result.elapsedSeconds);
const summary = {
  combinations: results.length,
  legacySaveMigration: verifyLegacySaveMigration(),
  lawsCovered: [...new Set(results.map((result) => result.law))],
  preparationsCovered: [...new Set(results.map((result) => result.preparation))],
  methodsCovered: [...new Set(results.map((result) => result.method))],
  coreDispositionsCovered: [...new Set(results.map((result) => result.coreDisposition))],
  elapsedSeconds: {
    min: Math.min(...elapsed),
    max: Math.max(...elapsed),
  },
  maximumObservedLoss: Math.max(...results.map((result) => result.enemyLoss)),
};

console.log(JSON.stringify(summary, null, 2));
