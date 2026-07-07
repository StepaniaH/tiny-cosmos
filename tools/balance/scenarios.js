const { newGame } = require('./load-game');
const { failureDetails, snapshot, warningsForSnapshot } = require('./metrics');

const CHECKPOINTS = [600, 1800, 3600];

function clickQuarks(game, amount) {
  game.GS.addResource(0, amount * game.GS.getSpeedMultiplier());
}

function performGuidedActions(game) {
  const { GC, GS, GE } = game;

  let acted = true;
  let guard = 0;
  while (acted && guard < 200) {
    acted = false;
    guard += 1;

    const nextTier = GS.getMaxResearchedTier() + 1;
    if (nextTier < GC.TIERS.length && GE.research(nextTier)) {
      acted = true;
      continue;
    }

    for (let tierId = Math.min(5, GS.getMaxResearchedTier()); tierId >= 0; tierId -= 1) {
      if (GE.buyProducer(tierId)) {
        acted = true;
        break;
      }
    }
    if (acted) continue;

    for (let tierId = Math.min(6, GS.getMaxResearchedTier()); tierId >= 1; tierId -= 1) {
      if (GE.synthesize(tierId)) {
        acted = true;
        break;
      }
    }
  }
}

function runForSeconds(game, seconds, behavior, checkpoints) {
  const checkpointSet = new Set(checkpoints);
  const snapshots = [];
  const totalTicks = seconds * game.GC.TICKS_PER_SEC;

  for (let tick = 1; tick <= totalTicks; tick += 1) {
    const elapsedSeconds = tick / game.GC.TICKS_PER_SEC;
    behavior(game, elapsedSeconds, tick);
    game.GE.tick();
    if (Number.isInteger(elapsedSeconds) && checkpointSet.has(elapsedSeconds)) {
      const snap = snapshot(game, elapsedSeconds);
      snap.warnings = warningsForSnapshot(snap);
      snapshots.push(snap);
    }
  }

  return snapshots;
}

function buildResult(name, game, snapshots, extra = {}) {
  const elapsedSeconds = snapshots.length ? snapshots[snapshots.length - 1].elapsedSeconds : 0;
  const finalSnapshot = snapshot(game, elapsedSeconds);
  finalSnapshot.warnings = warningsForSnapshot(finalSnapshot);
  return {
    scenario: name,
    rulesVersion: 1,
    ticksPerSecond: game.GC.TICKS_PER_SEC,
    checkpoints: snapshots,
    final: finalSnapshot,
    ...extra,
  };
}

function runIdle10m() {
  const game = newGame();
  const snapshots = runForSeconds(game, 600, () => {}, [600]);
  return buildResult('idle-10m', game, snapshots);
}

function runClickStart10m() {
  const game = newGame();
  const snapshots = runForSeconds(game, 600, (g, elapsedSeconds) => {
    if (elapsedSeconds <= 60 && Number.isInteger(elapsedSeconds)) clickQuarks(g, 2);
    if (Number.isInteger(elapsedSeconds)) performGuidedActions(g);
  }, [600]);
  return buildResult('click-start-10m', game, snapshots);
}

function runGuided(seconds, name) {
  const game = newGame();
  const checkpoints = CHECKPOINTS.filter((s) => s <= seconds);
  const snapshots = runForSeconds(game, seconds, (g, elapsedSeconds) => {
    if (elapsedSeconds <= 60 && Number.isInteger(elapsedSeconds)) clickQuarks(g, 2);
    if (Number.isInteger(elapsedSeconds)) performGuidedActions(g);
  }, checkpoints);
  return buildResult(name, game, snapshots);
}

function runFirstPrestige() {
  const game = newGame();
  const maxSeconds = 24 * 60 * 60;
  const tierUnlocks = {};
  const snapshots = [];

  for (let tick = 1; tick <= maxSeconds * game.GC.TICKS_PER_SEC; tick += 1) {
    const elapsedSeconds = tick / game.GC.TICKS_PER_SEC;
    if (elapsedSeconds <= 60 && Number.isInteger(elapsedSeconds)) clickQuarks(game, 2);
    if (Number.isInteger(elapsedSeconds)) performGuidedActions(game);
    game.GE.tick();

    for (let tierId = 0; tierId < game.GC.TIERS.length; tierId += 1) {
      if (game.GS.getTier(tierId).researched && tierUnlocks[tierId] === undefined) {
        tierUnlocks[tierId] = elapsedSeconds;
      }
    }

    if (Number.isInteger(elapsedSeconds) && CHECKPOINTS.includes(elapsedSeconds)) {
      const snap = snapshot(game, elapsedSeconds);
      snap.warnings = warningsForSnapshot(snap);
      snapshots.push(snap);
    }

    if (game.GS.canPrestige()) {
      const snap = snapshot(game, elapsedSeconds);
      snap.warnings = warningsForSnapshot(snap);
      snapshots.push(snap);
      return buildResult('first-prestige', game, snapshots, {
        reachedPrestige: true,
        prestigeTimeSeconds: elapsedSeconds,
        tierUnlocks,
        saveJson: game.GS.toJSON(),
      });
    }
  }

  return buildResult('first-prestige', game, snapshots, {
    reachedPrestige: false,
    prestigeTimeSeconds: null,
    tierUnlocks,
    failureDetails: failureDetails(game, 'first-prestige'),
    maxSeconds,
  });
}

function runPostPrestige10m() {
  const first = runFirstPrestige();
  if (!first.reachedPrestige) {
    return {
      scenario: 'post-prestige-10m',
      rulesVersion: 1,
      skipped: true,
      reason: 'first-prestige did not reach Big Crunch within the maximum simulated time',
      firstPrestigeReached: false,
    };
  }

  const game = newGame();
  game.GS.fromJSON(first.saveJson);
  const cpGain = game.GE.bigCrunch();
  const cp = game.GS.getCP();
  const strongForce = Math.floor(cp / 3);
  const lightSpeed = Math.floor(cp / 3);
  const gravity = cp - strongForce - lightSpeed;
  game.GS.allocateCP(strongForce, lightSpeed, gravity);

  const snapshots = runForSeconds(game, 600, (g, elapsedSeconds) => {
    if (elapsedSeconds <= 60 && Number.isInteger(elapsedSeconds)) clickQuarks(g, 2);
    if (Number.isInteger(elapsedSeconds)) performGuidedActions(g);
  }, [600]);

  return buildResult('post-prestige-10m', game, snapshots, {
    firstPrestigeTimeSeconds: first.prestigeTimeSeconds,
    cpGain,
    constants: game.GS.getConstants(),
  });
}

const SCENARIOS = {
  'idle-10m': runIdle10m,
  'click-start-10m': runClickStart10m,
  'guided-30m': () => runGuided(1800, 'guided-30m'),
  'guided-60m': () => runGuided(3600, 'guided-60m'),
  'first-prestige': runFirstPrestige,
  'post-prestige-10m': runPostPrestige10m,
};

function runScenario(name) {
  if (!SCENARIOS[name]) {
    throw new Error(`Unknown scenario: ${name}`);
  }
  return SCENARIOS[name]();
}

module.exports = {
  SCENARIOS,
  runScenario,
  performGuidedActions,
};
