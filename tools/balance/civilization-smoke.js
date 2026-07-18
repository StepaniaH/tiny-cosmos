const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function tickUntil(game, condition, maxSeconds, label) {
  const maxTicks = maxSeconds * game.GC.TICKS_PER_SEC;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (condition()) return;
    game.GE.tick();
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function finishInterlude(game) {
  tickUntil(game, () => !game.GS.getSlice().guide.interlude, 10, 'short mission interlude');
}

function research(game, tierId) {
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
  assert(game.GE.buyProducer(tierId), `Failed to buy tier ${tierId} producer`);
}

const game = createGameRuntime();
game.GS.init({ firstContact: true });
const slice = game.GS.getSlice();
slice.elapsedSeconds = 620;
slice.missionStep = 15;
slice.missionStartedAt = 620;
slice.flags.demoComplete = true;
slice.law = 'observer';
slice.enemy.status = 'resolved';
slice.enemy.resolution = 'observe';
slice.preparation = { id: 'buffer', progress: 30, completed: true, bonusApplied: false };
slice.tendencies = { advance: 2, sustain: 1, inquiry: 4, rewrite: 2 };
slice.decisions = [
  { time: 500, kind: 'law', level: '局部法则', id: 'observer', route: 'inquiry', label: '观测者效应', score: 2 },
  { time: 540, kind: 'preparation', level: '接触准备', id: 'buffer', route: 'sustain', label: '库存缓冲', score: 1 },
  { time: 590, kind: 'enemy', level: '接触策略', id: 'observe', route: 'inquiry', label: '观测', score: 2 },
  { time: 615, kind: 'core', level: '余像处置', id: 'fuel', route: 'advance', label: '压入边界燃料', score: 2 },
];
game.GS.getTier(0).count = 40;
game.GS.getTier(1).count = 30;
game.GS.getTier(2).count = 80;
game.GS.getTier(2).researched = true;
game.GS.getTier(2).producers = 3;
game.window.GameSlice.init();

assert(game.window.GameSlice.continueEvolution(), 'Failed to continue after the first-contact report');
assert(slice.missionStep === 16, 'Molecule mission did not open');

research(game, 3);
synthesize(game, 3, 8);
buyProducer(game, 3);
finishInterlude(game);
assert(slice.missionStep === 17, 'Cell mission did not open');

research(game, 4);
synthesize(game, 4, 5);
buyProducer(game, 4);
finishInterlude(game);
assert(slice.missionStep === 18, 'Complexity decision did not open');

assert(game.window.GameSlice.chooseComplexity('braid'), 'Failed to record the complexity decision');
finishInterlude(game);
assert(slice.missionStep === 19, 'Life mission did not open');

research(game, 5);
synthesize(game, 5, 3);
buyProducer(game, 5);
finishInterlude(game);
assert(slice.missionStep === 20, 'Life signal mission did not open');

game.GS.addResource(5, 2);
buyProducer(game, 4);
tickUntil(game, () => slice.civilization.lifeSignalProgress >= game.GC.FIRST_CONTACT.lifeSignalSeconds, 45, 'life signal stability');
finishInterlude(game);
assert(slice.missionStep === 21, 'Civilization research mission did not open');

research(game, 6);
finishInterlude(game);
assert(slice.missionStep === 22, 'Civilization synthesis mission did not open');

game.GS.addResource(5, 12);
synthesize(game, 6, 1);
assert(slice.missionStep === 23 && slice.flags.civilizationComplete, 'The first civilization did not complete the loop');

const proposals = game.window.GameSlice.getCivilizationProposals();
assert(proposals.length === 2, 'Civilization did not generate two proposals');
assert(proposals[0].route === 'inquiry' && proposals[0].reason.length >= 2, 'Primary proposal does not reflect decision history');
assert(proposals.some((proposal) => proposal.route === 'rewrite'), 'Complexity decision did not reach the proposal ranking');

const reloaded = createGameRuntime();
assert(reloaded.GS.fromJSON(game.GS.toJSON()), 'Failed to reload the civilization save');
reloaded.window.GameSlice.init();
assert(reloaded.GS.getSlice().flags.civilizationComplete, 'Civilization completion did not survive save/load');

console.log(JSON.stringify({
  missionStep: slice.missionStep,
  civilization: game.GS.getTier(6).count,
  proposals: proposals.map((proposal) => ({ role: proposal.role, route: proposal.route, title: proposal.title })),
  decisions: slice.decisions.map((decision) => ({ level: decision.level, id: decision.id, route: decision.route })),
}, null, 2));
