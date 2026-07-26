const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function seedCompletedFirstLoop(game) {
  game.GS.init({ firstContact: true });
  const slice = game.GS.getSlice();
  slice.missionStep = 23;
  slice.flags.civilizationComplete = true;
  slice.law = 'expansion';
  slice.complexity = 'bloom';
  slice.tendencies.advance = 9;
  slice.tendencies.sustain = 4;
  slice.enemy.status = 'resolved';
  slice.enemy.method = 'overload';
  slice.enemy.resolution = 'overload';
  slice.decisions = [
    { kind: 'law', id: 'expansion', route: 'advance', score: 2 },
    { kind: 'enemy', id: 'overload', route: 'advance', score: 2 },
    { kind: 'core', id: 'fuel', route: 'advance', score: 2 },
    { kind: 'complexity', id: 'bloom', route: 'advance', score: 2 },
  ];
}

function seedCompletedSecondLoop(game) {
  seedCompletedFirstLoop(game);
  const rebirth = game.GS.beginDirectedRebirth();
  assert(rebirth, 'Failed to enter the implemented second loop');
  game.window.GameSlice.init();

  const slice = game.GS.getSlice();
  slice.missionStep = 11;
  slice.flags.civilizationComplete = true;
  slice.tendencies.advance = 7;
  slice.tendencies.inquiry = 3;
  slice.roundTwo.inheritanceMode = 'carry';
  slice.roundTwo.fragmentChoice = 'verify';
  slice.roundTwo.counterexample = {
    id: 'closure-lattice',
    status: 'resolved',
    choice: 'revise',
  };
  slice.roundTwo.proofProgress = game.GC.SECOND_LOOP.proofSeconds;
  slice.roundTwo.witnessResponse = 'challenge';
  slice.roundTwo.truthVerdict = 'revise';
  slice.roundTwo.truthRepeated = false;
  slice.roundTwo.truthRevised = true;
  slice.decisions.push(
    { kind: 'inheritance', id: 'carry', route: 'advance', score: 1 },
    { kind: 'fragment', id: 'verify', route: 'inquiry', score: 1 },
    { kind: 'counterexample', id: 'revise', route: 'inquiry', score: 2 },
    { kind: 'witness', id: 'challenge', route: 'inquiry', score: 1 },
    { kind: 'verdict', id: 'revise', route: 'inquiry', score: 2 },
  );

  const atom = game.GS.getTier(2);
  atom.researched = true;
  atom.count = 8;
  atom.totalEver = 10;
  atom.producers = 1;
  game.GS.getState().researchPoints = 1000;
  return rebirth;
}

function economySnapshot(game) {
  return {
    counts: game.GS.getState().tiers.map((tier) => tier.count),
    totalEver: game.GS.getState().tiers.map((tier) => tier.totalEver),
    researchPoints: game.GS.getRP(),
    totalQuarksEver: game.GS.getTotalQuarksEver(),
    totalSynthesis: game.GS.getState().totalSynthesis,
    tickCount: game.GS.getState().tickCount,
    elapsedSeconds: game.GS.getSlice().elapsedSeconds,
    slice: {
      focusTier: game.GS.getSlice().focusTier,
      reserveTier: game.GS.getSlice().reserveTier,
      canvasClicks: game.GS.getSlice().stats.canvasClicks,
      talents: JSON.stringify(game.GS.getSlice().talents),
      observation: JSON.stringify(game.GS.getSlice().observation),
      logs: JSON.stringify(game.GS.getSlice().logs),
    },
  };
}

function assertSnapshotEqual(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} changed sealed economy state`);
}

function downgradeSignature(signature) {
  if (!signature) return;
  signature.schemaVersion = 2;
  delete signature.completedLoopNumber;
  delete signature.nextLoopNumber;
  delete signature.terminal;
  delete signature.roundOutcome;
}

const game = createGameRuntime();
const rebirth = seedCompletedSecondLoop(game);

assert(rebirth.signature.schemaVersion === 3, 'First-loop transition did not emit signature schema 3');
assert(rebirth.signature.completedLoopNumber === 1, 'First-loop signature lost its completion source');
assert(rebirth.signature.nextLoopNumber === 2 && rebirth.signature.loopNumber === 2, 'First-loop signature target is inconsistent');
assert(game.GS.getLoop().phase === 'active', 'Second loop did not start active');
assert(game.GS.canFinalizeCurrentLoop(), 'Completed second loop was not eligible for sealing');

const firstFinalize = game.GS.finalizeCurrentLoop();
assert(firstFinalize && firstFinalize.sealed && !firstFinalize.alreadySealed, 'Second loop did not seal');
assert(game.GS.getLoop().number === 2, 'Sealing entered an unavailable third loop');
assert(game.GS.getLoop().phase === 'sealed', 'Loop phase did not become sealed');
assert(game.GS.getLoop().sealedLoopNumber === 2, 'Sealed loop number was not recorded');
assert(game.GS.getLoop().signatures.length === 2, 'Second-loop terminal signature was not appended exactly once');
assert(game.GS.getLoop().pendingSignature === firstFinalize.signature, 'Pending signature does not reference the sealed result');

const terminal = firstFinalize.signature;
assert(terminal.schemaVersion === 3, 'Terminal signature did not use schema 3');
assert(terminal.completedLoopNumber === 2 && terminal.nextLoopNumber === 3, 'Terminal signature source/target semantics are incorrect');
assert(terminal.loopNumber === 3, 'Compatibility loopNumber alias was not retained');
assert(terminal.terminal.cause === 'inevitable-collapse', 'Terminal cause was not preserved');
assert(terminal.terminal.hookId === 'paired-terminal-checksum', 'Second-loop narrative hook was not preserved');
assert(terminal.terminal.checksumAlgorithm === 'tc-terminal-fnv1a-v1', 'Terminal checksum algorithm was not versioned');
assert(terminal.terminal.checksum === 'TC-D092-5CF0', 'Terminal checksum does not match the stable paired-report fields');
assert(terminal.roundOutcome.inheritedTruth === 'horizon-can-open', 'Inherited truth was omitted');
assert(terminal.roundOutcome.inheritanceMode === 'carry', 'Inheritance calibration was omitted');
assert(terminal.roundOutcome.counterexampleId === 'closure-lattice', 'Counterexample id was omitted');
assert(terminal.roundOutcome.counterexampleChoice === 'revise', 'Counterexample response was omitted');
assert(terminal.roundOutcome.witnessResponse === 'challenge', 'Witness response was omitted');
assert(terminal.roundOutcome.truthVerdict === 'revise', 'Truth verdict was omitted');

const secondFinalize = game.GS.finalizeCurrentLoop();
assert(secondFinalize && secondFinalize.alreadySealed, 'Repeated finalization was not idempotent');
assert(secondFinalize.signature === terminal, 'Repeated finalization returned a different signature');
assert(game.GS.getLoop().signatures.length === 2, 'Repeated finalization duplicated history');
assert(game.GS.beginDirectedRebirth() === false, 'Sealed state entered a third loop');
assert(!game.GS.canFinalizeCurrentLoop(), 'Sealed state remained finalizable');
assert(game.GS.getCampaignStatus().playableThrough === 2, 'Campaign status exposed unavailable content');
assert(!game.GS.getCampaignStatus().canEnterNextLoop, 'Campaign status advertised a third loop');
assert(game.window.GameSlice.isEnabled(), 'Sealing hid the read-only campaign interface');

const frozen = economySnapshot(game);
assert(game.GS.addResource(0, 100) === false, 'Direct resource mutation bypassed sealing');
assert(game.GS.spendResource(0, 1) === false, 'Direct resource spend bypassed sealing');
assert(game.GS.addProducer(2) === false, 'Direct producer mutation bypassed sealing');
assert(game.GS.recordSynth(2) === false, 'Direct synthesis record bypassed sealing');
assert(game.GS.addRP(100) === false, 'Direct research mutation bypassed sealing');
assert(game.GS.doResearch(3) === false, 'Direct research unlock bypassed sealing');
assert(game.GS.allocateCP(0, 0, 0) === false, 'Constant allocation bypassed sealing');
assert(game.GE.synthesize(2) === false, 'Synthesis remained available after sealing');
assert(game.GE.buyProducer(2) === false, 'Producer purchase remained available after sealing');
assert(game.GE.research(3) === false, 'Research remained available after sealing');
assert(game.GE.bigCrunch() === false, 'Prestige remained available after sealing');
assert(game.window.GameSlice.spendTalentPoint('focus') === false, 'Talent spending remained available after sealing');
assert(game.window.GameSlice.useObservationProtocol('decode') === false, 'Observation remained available after sealing');
assert(game.window.GameSlice.setFocus(0) === false, 'Focus mutation remained available after sealing');
assert(game.window.GameSlice.setReserve(0) === false, 'Reserve mutation remained available after sealing');
game.window.GameSlice.onCanvasClick();
assert(game.GE.start() === false, 'Realtime engine restarted after sealing');
game.GE.tick();
assertSnapshotEqual(economySnapshot(game), frozen, 'Realtime tick');
const background = game.GE.advanceTime(60);
assert(background.simulatedSeconds === 0 && background.blocked === 'loop-sealed', 'Offline progress was not blocked');
assertSnapshotEqual(economySnapshot(game), frozen, 'Offline progress');

const reloaded = createGameRuntime();
assert(reloaded.GS.fromJSON(game.GS.toJSON()), 'Failed to reload sealed state');
assert(reloaded.GS.getLoop().number === 2 && reloaded.GS.getLoop().phase === 'sealed', 'Reload escaped the sealed second loop');
assert(reloaded.GS.getLoop().pendingSignature.completedLoopNumber === 2, 'Reload lost the pending terminal signature');
assert(reloaded.GS.getLoop().signatures.length === 2, 'Reload changed signature history');
assert(reloaded.GS.getLoop().pendingSignature === reloaded.GS.getLoop().signatures[1], 'Reload did not canonicalize terminal history');
assert(reloaded.GS.getLoop().pendingSignature.terminal.checksum === terminal.terminal.checksum, 'Reload changed terminal checksum');
const reloadFinalize = reloaded.GS.finalizeCurrentLoop();
assert(reloadFinalize && reloadFinalize.alreadySealed, 'Reloaded finalization was not idempotent');
assert(reloaded.GS.getLoop().signatures.length === 2, 'Reloaded finalization duplicated history');
assert(reloaded.GE.advanceTime(60).simulatedSeconds === 0, 'Reloaded sealed state gained offline progress');

const legacyRuntime = createGameRuntime();
seedCompletedSecondLoop(legacyRuntime);
const legacy = JSON.parse(legacyRuntime.GS.toJSON());
legacy.loop.version = 1;
delete legacy.loop.phase;
delete legacy.loop.sealedLoopNumber;
delete legacy.loop.pendingSignature;
legacy.loop.signatures.forEach(downgradeSignature);
downgradeSignature(legacy.loop.activeSignature);
downgradeSignature(legacy.slice.loopSignature);

const migrated = createGameRuntime();
assert(migrated.GS.fromJSON(JSON.stringify(legacy)), 'Failed to migrate schema 2 loop state');
assert(migrated.GS.getLoop().version === 2 && migrated.GS.getLoop().phase === 'active', 'Legacy loop metadata did not migrate');
assert(migrated.GS.getActiveSignature().schemaVersion === 3, 'Legacy active signature did not migrate to schema 3');
assert(migrated.GS.getActiveSignature().completedLoopNumber === 1, 'Legacy completion source was inferred incorrectly');
assert(migrated.GS.getActiveSignature().nextLoopNumber === 2, 'Legacy transition target was inferred incorrectly');
assert(/^TC-[0-9A-F]{4}-[0-9A-F]{4}$/.test(migrated.GS.getActiveSignature().terminal.checksum), 'Legacy signature did not receive a stable checksum');
assert(migrated.GS.finalizeCurrentLoop(), 'Migrated completed second loop could not be sealed');

const paired = createGameRuntime();
seedCompletedSecondLoop(paired);
const pairedFinalize = paired.GS.finalizeCurrentLoop();
assert(pairedFinalize.signature.terminal.checksum === terminal.terminal.checksum, 'Equivalent terminal histories produced different checksums');

const interruptedData = JSON.parse(legacyRuntime.GS.toJSON());
interruptedData.loop.phase = 'sealed';
interruptedData.loop.sealedLoopNumber = 2;
interruptedData.loop.pendingSignature = null;
const interrupted = createGameRuntime();
assert(interrupted.GS.fromJSON(JSON.stringify(interruptedData)), 'Failed to load an interrupted seal');
assert(interrupted.GS.getLoop().phase === 'active', 'Interrupted seal did not return to its completed report');
assert(interrupted.GS.canFinalizeCurrentLoop(), 'Interrupted seal could not rebuild its terminal record');
assert(interrupted.GS.finalizeCurrentLoop(), 'Interrupted seal recovery failed');

const unavailable = JSON.parse(legacyRuntime.GS.toJSON());
unavailable.loop.number = 3;
unavailable.slice.loopNumber = 3;
delete unavailable.loop.phase;
const clamped = createGameRuntime();
assert(clamped.GS.fromJSON(JSON.stringify(unavailable)), 'Failed to load an unavailable-loop save safely');
assert(clamped.GS.getLoop().number === 2, 'Unavailable loop number was not clamped');
assert(clamped.GS.getSlice().loopNumber === 2, 'Unavailable slice loop number was not clamped');
assert(clamped.GS.getLoop().phase === 'sealed', 'Unavailable-loop save was not quarantined');
assert(!clamped.GS.getSlice().loopSignature || clamped.GS.getSlice().loopSignature.nextLoopNumber === 2, 'Unavailable signature remained active');
assert(clamped.GE.advanceTime(60).simulatedSeconds === 0, 'Quarantined save continued simulating');

console.log(JSON.stringify({
  phase: game.GS.getLoop().phase,
  currentLoop: game.GS.getLoop().number,
  checksum: terminal.terminal.checksum,
  signatures: game.GS.getLoop().signatures.map((signature) => ({
    schemaVersion: signature.schemaVersion,
    completedLoopNumber: signature.completedLoopNumber,
    nextLoopNumber: signature.nextLoopNumber,
    kind: signature.roundOutcome.kind,
  })),
  background,
  migration: {
    loopVersion: migrated.GS.getLoop().version,
    signatureSchema: migrated.GS.getActiveSignature().schemaVersion,
  },
}, null, 2));
