const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNear(actual, expected, tolerance, label) {
  const difference = Math.abs(actual - expected);
  if (difference > tolerance) {
    throw new Error(`${label} differed by ${difference}; expected ${expected}, received ${actual}`);
  }
}

function createProductionGame() {
  const game = createGameRuntime();
  game.GS.init({ firstContact: true });
  const state = game.GS.getState();
  state.tiers[0].count = 120;
  state.tiers[0].totalEver = 120;
  state.tiers[0].producers = 3;
  state.tiers[1].researched = true;
  state.tiers[1].count = 28;
  state.tiers[1].totalEver = 28;
  state.tiers[1].producers = 2;
  state.slice.focusTier = 1;
  game.window.GameSlice.init();
  return game;
}

const realtime = createProductionGame();
const background = createProductionGame();
const startElapsed = background.GS.getSlice().elapsedSeconds;

for (let tick = 0; tick < realtime.GC.TICKS_PER_SEC * 5; tick += 1) realtime.GE.tick();
const result = background.GE.advanceTime(5);

assert(result.simulatedSeconds === 5, 'Background simulation did not cover the requested five seconds');
assert(result.capped === false, 'A five-second background interval was incorrectly capped');
assertNear(background.GS.getState().tickCount, realtime.GS.getState().tickCount, 0.000001, 'Tick count');
assertNear(background.GS.getSlice().elapsedSeconds, startElapsed + 5, 0.000001, 'Scenario elapsed time');
assertNear(background.GS.getTier(0).count, realtime.GS.getTier(0).count, 0.01, 'Quark stock');
assertNear(background.GS.getTier(1).count, realtime.GS.getTier(1).count, 0.01, 'Nucleon stock');
assertNear(background.GS.getRP(), realtime.GS.getRP(), 0.05, 'Research points');

const gated = createProductionGame();
const gatedSlice = gated.GS.getSlice();
gatedSlice.missionStep = 10;
gatedSlice.missionStartedAt = gatedSlice.elapsedSeconds;
gatedSlice.law = null;
const gateResult = gated.GE.advanceTime(60);

assert(gateResult.simulatedSeconds === 60, 'Decision-gate simulation did not cover the requested interval');
assert(gated.GS.getSlice().missionStep === 10, 'Background progress crossed a decision-gated mission');
assert(gated.GS.getSlice().law === null, 'Background progress selected a law for the player');

console.log(JSON.stringify({
  simulatedSeconds: result.simulatedSeconds,
  elapsedSeconds: background.GS.getSlice().elapsedSeconds,
  tickCount: background.GS.getState().tickCount,
  quarks: background.GS.getTier(0).count,
  nucleons: background.GS.getTier(1).count,
  researchPoints: background.GS.getRP(),
  decisionGateHeld: gated.GS.getSlice().missionStep === 10 && gated.GS.getSlice().law === null,
}, null, 2));
