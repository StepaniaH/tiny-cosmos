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

function createSliceGame(missionStep = 0) {
  const game = createGameRuntime();
  game.GS.init({ firstContact: true });
  game.GS.getSlice().missionStep = missionStep;
  game.window.GameSlice.init();
  return game;
}

function tendenciesOf(game) {
  return JSON.stringify(game.GS.getSlice().tendencies);
}

function verifyEarlyPoint() {
  const game = createSliceGame();
  const Slice = game.window.GameSlice;
  const openingObjective = Slice.getObjectiveModel();
  assert(openingObjective.nowTitle === '点亮光核 5 次', 'Opening objective did not state the immediate action');
  assert(openingObjective.nextUnlock.includes('自动生产'), 'Opening objective did not preview the next unlock');

  for (let click = 0; click < 5; click += 1) {
    game.GS.addResource(0, 1);
    Slice.onCanvasClick();
  }
  assert(game.GS.getSlice().guide.interlude, 'First guided action did not open its observation interval');
  Slice.tick(game.GS.getSlice().guide.remaining + 0.1);

  const talentState = Slice.getTalentState();
  assert(game.GS.getSlice().missionStep >= 1, 'First mission did not complete');
  assert(talentState.points >= 1, 'First talent point was not awarded at mission 1');
  assert(Slice.getObjectiveModel().optionalAction.includes('分配 1 点天赋'), 'Goal rail did not surface the first talent choice');
  assert(game.GS.getSlice().elapsedSeconds <= 180, 'First talent point was not available within three minutes');
  return game.GS.getSlice().elapsedSeconds;
}

function verifyTalentEffects() {
  const game = createSliceGame(20);
  const Slice = game.window.GameSlice;
  const slice = game.GS.getSlice();
  const tendenciesBefore = tendenciesOf(game);
  slice.focusTier = 0;

  const definitions = Slice.getTalentDefinitions();
  assert(definitions.length === 4, 'Expected four talent definitions');
  definitions.forEach((definition) => {
    assert(definition.maxRank === 2 && definition.cost === 1, `${definition.id} rank or cost changed`);
  });
  assert(Slice.getTalentState().points === 5, 'Mission-20 initialization did not backfill five talent points');

  const production0 = Slice.getProductionMultiplier(0);
  assert(Slice.spendTalentPoint('focus'), 'Failed to buy focus rank 1');
  const production1 = Slice.getProductionMultiplier(0);
  assertNear(production1 / production0, 1.08, 0.000001, 'Focus rank-1 production multiplier');
  assert(Slice.spendTalentPoint('focus'), 'Failed to buy focus rank 2');
  const production2 = Slice.getProductionMultiplier(0);
  assertNear(production2 / production1, 1.08, 0.000001, 'Focus rank-2 production multiplier');
  assert(!Slice.spendTalentPoint('focus'), 'Focus exceeded its maximum rank');

  const demand0 = Slice.getDemandMultiplier(0);
  assert(Slice.spendTalentPoint('flow'), 'Failed to buy flow rank 1');
  assertNear(Slice.getDemandMultiplier(0) / demand0, 0.95, 0.000001, 'Flow demand multiplier');

  const research0 = Slice.getResearchMultiplier();
  assert(Slice.spendTalentPoint('research'), 'Failed to buy research rank 1');
  assertNear(Slice.getResearchMultiplier() / research0, 1.08, 0.000001, 'Research talent multiplier');

  const recharge0 = Slice.getObservationRechargeSeconds();
  assert(Slice.spendTalentPoint('echo'), 'Failed to buy echo rank 1');
  assert(Slice.getObservationRechargeSeconds() === recharge0 - 5, 'Echo did not reduce recharge by five seconds');
  assert(tendenciesOf(game) === tendenciesBefore, 'Spending talents changed route tendencies');

  const echoGame = createSliceGame(20);
  const EchoSlice = echoGame.window.GameSlice;
  assert(EchoSlice.spendTalentPoint('echo'), 'Failed to buy echo rank 1 in max-rank test');
  assert(EchoSlice.spendTalentPoint('echo'), 'Failed to buy echo rank 2 in max-rank test');
  assert(EchoSlice.getObservationRechargeSeconds() === 35, 'Echo rank 2 did not reduce recharge to 35 seconds');
  assert(!EchoSlice.spendTalentPoint('echo'), 'Echo exceeded its maximum rank');

  return Slice.getTalentState();
}

function verifyObservationProtocols() {
  const game = createSliceGame();
  const Slice = game.window.GameSlice;
  const slice = game.GS.getSlice();
  const tendenciesBefore = tendenciesOf(game);

  assert(Slice.getObservationState().charges === 1, 'Observation did not start with one charge');
  const stabilizeOption = Slice.getObservationOptions().find((option) => option.id === 'stabilize');
  assert(stabilizeOption.tierId === 0, 'Stabilize targeted a researched layer with no active production');
  const stabilizeBase = Slice.getProductionMultiplier(0);
  assert(Slice.useObservationProtocol('stabilize'), 'Failed to activate stabilize');
  assertNear(
    Slice.getProductionMultiplier(0) / stabilizeBase,
    1.45,
    0.000001,
    'Stabilize production multiplier',
  );
  assert(!Slice.useObservationProtocol('surge'), 'A second sustained protocol replaced the active protocol');
  game.GE.advanceTime(45);
  assert(Slice.getObservationState().active === null, 'Stabilize did not expire after 45 seconds');
  assert(Slice.getObservationState().charges === 1, 'Charge did not recover while stabilize was active');

  slice.focusTier = 0;
  const surgeBase = Slice.getProductionMultiplier(0);
  assert(Slice.useObservationProtocol('surge'), 'Failed to activate surge');
  assert(Slice.getObservationState().active.tierId === 0, 'Surge did not target the current focus');
  assertNear(
    Slice.getProductionMultiplier(0) / surgeBase,
    1.8,
    0.000001,
    'Surge production multiplier',
  );
  game.GE.advanceTime(45);
  assert(Slice.getObservationState().active === null, 'Surge did not expire after 20 seconds');
  assert(Slice.getObservationState().charges === 1, 'Surge recharge did not continue through background simulation');

  const decodeOption = Slice.getObservationOptions().find((option) => option.id === 'decode');
  const rpBefore = game.GS.getRP();
  assert(Slice.useObservationProtocol('decode'), 'Failed to decode observation');
  const decodeResult = Slice.getObservationState().lastResult;
  assertNear(
    game.GS.getRP() - rpBefore,
    Math.max(3, decodeOption.researchReward),
    0.000001,
    'Decode research reward',
  );
  assert(decodeResult.id === 'decode' && decodeResult.researchPoints >= 3, 'Decode result was not recorded');
  assert(tendenciesOf(game) === tendenciesBefore, 'Observation protocols changed route tendencies');

  const capped = createSliceGame();
  capped.GE.advanceTime(1000);
  assert(capped.window.GameSlice.getObservationState().charges === 3, 'Offline recharge exceeded or missed max charges');
  assert(capped.window.GameSlice.getObservationState().rechargeProgress === 0, 'Recharge progress was retained at charge cap');

  const blocked = createSliceGame(13);
  const BlockedSlice = blocked.window.GameSlice;
  const blockedState = blocked.GS.getSlice();
  for (let tierId = 0; tierId <= 2; tierId += 1) {
    const tier = blocked.GS.getTier(tierId);
    tier.researched = true;
    tier.count = 20;
    tier.producers = 1;
  }
  blockedState.focusTier = 1;
  blockedState.enemy.status = 'active';
  blockedState.enemy.method = 'cutoff';
  blockedState.enemy.isolationActive = true;
  const blockedOption = BlockedSlice.getObservationOptions().find((option) => option.id === 'stabilize');
  assert(blockedOption.tierId !== 2, 'Stabilize targeted an isolated layer with zero effective production');
  const blockedCharges = BlockedSlice.getObservationState().charges;
  assert(BlockedSlice.useObservationProtocol('stabilize'), 'Stabilize failed when another productive layer was available');
  assert(BlockedSlice.getObservationState().charges === blockedCharges - 1, 'Valid stabilize did not spend one charge');
  assert(BlockedSlice.getObservationState().active.tierId !== 2, 'Stabilize activated on the isolated atom layer');

  const activeObjective = createSliceGame(1);
  activeObjective.GS.getSlice().talents.points = 0;
  activeObjective.GS.getSlice().observation.charges = 2;
  assert(activeObjective.window.GameSlice.useObservationProtocol('stabilize'), 'Failed to seed active-protocol objective');
  const activeOptional = activeObjective.window.GameSlice.getObjectiveModel().optionalAction;
  assert(activeOptional.includes('可解码研究'), 'Goal rail did not distinguish Decode while a sustained protocol was active');
  assert(!activeOptional.includes('稳流、放大焦点'), 'Goal rail advertised disabled sustained protocols');

  const historyGame = createSliceGame(1);
  for (let use = 0; use < 100; use += 1) {
    historyGame.GS.getSlice().observation.charges = 1;
    assert(historyGame.window.GameSlice.useObservationProtocol('decode'), `Decode history seed failed at ${use}`);
  }
  assert(historyGame.window.GameSlice.getObservationState().history.length === 80, 'Observation history exceeded its bounded limit');

  return Slice.getObservationState();
}

function verifyPersistenceAndMigration() {
  const source = createSliceGame(20);
  const SourceSlice = source.window.GameSlice;
  source.GS.getSlice().focusTier = 0;
  assert(SourceSlice.spendTalentPoint('focus'), 'Failed to seed persistent talent history');
  assert(SourceSlice.useObservationProtocol('surge'), 'Failed to seed persistent observation history');

  const signature = source.GS.buildLoopSignature('agency-smoke');
  assert(signature.talentHistory.length === 1, 'Loop signature omitted talent history');
  assert(signature.observationHistory.length === 1, 'Loop signature omitted observation history');

  const reloaded = createGameRuntime();
  assert(reloaded.GS.fromJSON(source.GS.toJSON()), 'Failed to reload v8 agency state');
  reloaded.window.GameSlice.init();
  const reloadedSlice = reloaded.GS.getSlice();
  assert(reloadedSlice.version === 8, 'Reloaded agency state did not retain version 8');
  assert(reloaded.window.GameSlice.getTalentState().nodes.focus === 1, 'Talent rank did not persist');
  assert(reloaded.window.GameSlice.getObservationState().active.id === 'surge', 'Active observation did not persist');
  assert(reloaded.window.GameSlice.getObservationState().history.length === 1, 'Observation history did not persist');

  const legacySource = createSliceGame();
  const legacy = JSON.parse(legacySource.GS.toJSON());
  legacy.slice.version = 7;
  legacy.slice.missionStep = 5;
  delete legacy.slice.talents;
  delete legacy.slice.observation;

  const migrated = createGameRuntime();
  assert(migrated.GS.fromJSON(JSON.stringify(legacy)), 'Failed to migrate a v7 save');
  migrated.window.GameSlice.init();
  assert(migrated.GS.getSlice().version === 8, 'v7 save was not upgraded to v8');
  assert(migrated.window.GameSlice.getTalentState().points === 2, 'v7 migration did not backfill passed talent awards');
  assert(migrated.window.GameSlice.getTalentState().nodes.focus === 0, 'v7 migration invented a talent rank');
  assert(migrated.window.GameSlice.getObservationState().charges === 1, 'v7 migration did not receive the initial observation charge');

  const secondLoop = createSliceGame();
  secondLoop.GS.getSlice().loopNumber = 2;
  secondLoop.GS.getLoop().number = 2;
  secondLoop.window.GameSlice.init();
  assert(secondLoop.window.GameSlice.getTalentState().points === 1, 'Second loop did not award its mission-0 talent point');

  return {
    signatureTalentHistory: signature.talentHistory.length,
    signatureObservationHistory: signature.observationHistory.length,
    migratedPoints: migrated.window.GameSlice.getTalentState().points,
  };
}

const firstPointSeconds = verifyEarlyPoint();
const talents = verifyTalentEffects();
const observation = verifyObservationProtocols();
const persistence = verifyPersistenceAndMigration();

console.log(JSON.stringify({
  firstPointSeconds,
  talentRanks: talents.nodes,
  observationHistory: observation.history.length,
  persistence,
}, null, 2));
