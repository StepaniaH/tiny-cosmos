const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function finishInterlude(game) {
  const slice = game.GS.getSlice();
  if (slice.guide.interlude) game.window.GameSlice.tick(slice.guide.remaining + 0.1);
}

function fundResearch(game, tierId) {
  const cost = game.GS.getResearchCost(tierId);
  game.GS.addRP(Math.max(0, cost - game.GS.getRP()));
  assert(game.GE.research(tierId), `Failed to research tier ${tierId}`);
}

function synthesize(game, tierId, count) {
  for (let index = 0; index < count; index += 1) {
    const cost = game.GS.getSynthCost(tierId);
    game.GS.addResource(tierId - 1, Math.max(0, cost - game.GS.getTier(tierId - 1).count));
    assert(game.GE.synthesize(tierId), `Failed to synthesize tier ${tierId}`);
  }
}

function buyProducer(game, tierId) {
  const cost = game.GS.getProducerCost(tierId);
  game.GS.addResource(tierId, Math.max(0, cost - game.GS.getTier(tierId).count));
  assert(game.GE.buyProducer(tierId), `Failed to buy producer for tier ${tierId}`);
}

function seedCompletedFirstLoop(game, dominant = 'advance', secondary = 'sustain') {
  game.GS.init({ firstContact: true });
  const slice = game.GS.getSlice();
  slice.missionStep = 23;
  slice.flags.civilizationComplete = true;
  slice.tendencies[dominant] = 9;
  slice.tendencies[secondary] = 4;
  const routeChoices = {
    advance: ['expansion', 'overload', 'fuel', 'bloom'],
    sustain: ['conservation', 'cutoff', 'return', 'sanctuary'],
    inquiry: ['observer', 'observe', 'archive', 'witness'],
    rewrite: ['observer', 'observe', 'archive', 'braid'],
  };
  const [law, method, core, complexity] = routeChoices[dominant];
  slice.law = law;
  slice.enemy.status = 'resolved';
  slice.enemy.method = method;
  slice.enemy.resolution = method;
  slice.complexity = complexity;
  slice.decisions = [
    { kind: 'law', id: law, route: dominant, label: law, score: 2 },
    { kind: 'enemy', id: method, route: dominant, label: method, score: 2 },
    { kind: 'core', id: core, route: dominant, label: core, score: 2 },
    { kind: 'complexity', id: complexity, route: dominant, label: complexity, score: 2 },
  ];
}

function verifyCounterexampleRouting() {
  const expected = {
    advance: '闭界格栅',
    sustain: '逆季候',
    inquiry: '盲区证人',
    rewrite: '失同步摆',
  };
  Object.keys(expected).forEach((route) => {
    const game = createGameRuntime();
    seedCompletedFirstLoop(game, route, route === 'advance' ? 'sustain' : 'advance');
    const rebirth = game.GS.beginDirectedRebirth();
    assert(rebirth && rebirth.signature.dominantRoute === route, `${route} signature was not preserved`);
    game.window.GameSlice.init();
    assert(game.window.GameSlice.getRoundTwoCounterexample().title === expected[route], `${route} counterexample mismatch`);
  });
}

const game = createGameRuntime();
seedCompletedFirstLoop(game, 'advance', 'sustain');
const rebirth = game.GS.beginDirectedRebirth();
const Slice = game.window.GameSlice;
Slice.init();

assert(rebirth && rebirth.signature.loopNumber === 2, 'Directed rebirth did not produce loop two');
assert(rebirth.signature.truths[0] === 'horizon-can-open', 'Advance truth was not preserved');
assert(rebirth.signature.priorContactMethod === 'overload', 'Prior contact method was not preserved');
assert(game.GS.getSlice().missionStep === 0 && Slice.getMissions().length === 12, 'Round-two mission graph did not initialize');
assert(game.GS.getTier(0).producers === 2 && game.GS.getTier(1).producers === 1, 'Round two repeated the empty first-loop start');

assert(Slice.chooseRoundTwoDecision('inheritance', 'carry'), 'Failed inheritance calibration');
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 1, 'Bias measurement did not open');

Slice.tick(game.GC.SECOND_LOOP.biasSeconds + 0.1);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 2, 'Atom compression beat did not open');

fundResearch(game, 2);
synthesize(game, 2, 10);
buyProducer(game, 2);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 3, 'Witness fragment did not open');

assert(Slice.chooseRoundTwoDecision('fragment', 'verify'), 'Failed to archive the cross-loop fragment');
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 4, 'Route counterexample did not open');

assert(Slice.chooseRoundTwoDecision('counterexample', 'revise'), 'Failed to choose the counterexample response');
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 5, 'Counterproof test did not open');
game.GS.addResource(1, 12);
if (game.GS.getSlice().focusTier !== 2) assert(Slice.setFocus(2), 'Failed to expose the atom focus to the Closure Lattice');
assert(Slice.getStabilityConditionState(5).every((condition) => condition.met), 'Advance counterproof conditions are not public and satisfiable');
Slice.tick(game.GC.SECOND_LOOP.proofSeconds + 0.1);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 6, 'Molecular bridge did not open');

fundResearch(game, 3);
synthesize(game, 3, 8);
buyProducer(game, 3);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 7, 'Witness-rights beat did not open');

assert(Slice.chooseRoundTwoDecision('witness', 'challenge'), 'Failed to record the later civilization challenge');
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 8, 'Lineage braid did not open');

fundResearch(game, 4);
synthesize(game, 4, 6);
fundResearch(game, 5);
synthesize(game, 5, 3);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 9, 'Second-civilization beat did not open');

fundResearch(game, 6);
game.GS.addResource(5, 20);
synthesize(game, 6, 1);
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 10, 'Truth verdict did not open');

assert(Slice.chooseRoundTwoDecision('verdict', 'revise'), 'Failed to revise the inherited truth');
finishInterlude(game);
assert(game.GS.getSlice().missionStep === 11, 'Round two did not reach its report');
assert(game.GS.getSlice().flags.civilizationComplete, 'Second civilization completion was not recorded');
assert(game.GS.getSlice().roundTwo.truthRevised && !game.GS.getSlice().roundTwo.truthRepeated, 'Truth-verdict fields are inconsistent');

const reloaded = createGameRuntime();
assert(reloaded.GS.fromJSON(game.GS.toJSON()), 'Failed to reload the second-loop save');
reloaded.window.GameSlice.init();
assert(reloaded.GS.getLoop().number === 2, 'Loop number did not survive save/load');
assert(reloaded.GS.getActiveSignature().dominantRoute === 'advance', 'LoopSignature did not survive save/load');
assert(reloaded.GS.getSlice().roundTwo.witnessResponse === 'challenge', 'Witness response did not survive save/load');
assert(reloaded.GS.getSlice().roundTwo.truthVerdict === 'revise', 'Truth verdict did not survive save/load');

verifyCounterexampleRouting();

console.log(JSON.stringify({
  loop: game.GS.getLoop().number,
  signature: rebirth.signature,
  missions: Slice.getMissions().map((mission) => mission.code),
  counterexample: Slice.getRoundTwoCounterexample().title,
  witnessResponse: game.GS.getSlice().roundTwo.witnessResponse,
  truthVerdict: game.GS.getSlice().roundTwo.truthVerdict,
  decisions: game.GS.getSlice().decisions.map((decision) => `${decision.kind}:${decision.id}`),
}, null, 2));
