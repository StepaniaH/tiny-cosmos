# Balance Validation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic balance validation harness for Tiny Cosmos so future gameplay and tuning changes can be compared against stable baseline reports.

**Architecture:** Keep the browser game intact while adding a Node-based validation layer. Load the existing browser-authored game files into a small `window` shim first, then refactor only if the shim becomes painful. Scenario rules live outside UI/canvas code and output canonical JSON plus reviewed Markdown summaries.

**Tech Stack:** Plain JavaScript, Node.js, existing browser scripts, no runtime dependencies in phase one.

## Execution Status

Status: completed on `dev`.

This plan has already been executed and should not be treated as the next active work queue. The task bodies below are preserved as historical implementation detail and for future reference.

Completed task groups:

- Task 1: Node game loader.
- Task 2: Metrics and checkpoint snapshots.
- Task 3: Deterministic scenario runner.
- Task 4: Validation CLI and generated report handling.
- Task 5: Protocol documentation and committed baseline summary.
- Task 6: First correctness audit fixes.
- Task 7: Machine learning backlog note.

Post-plan bugfix also completed:

- Reduced idle rendering workload in `js/render.js` and `js/main.js`.

Remaining high-level work:

- Refresh the committed baseline after the performance fix.
- Improve failure detail in validation reports.
- Tune the core constants until `first-prestige` reaches Big Crunch under the deterministic guided strategy.
- Define acceptance ranges after first prestige is reachable.
- Add new gameplay decisions only after the first prestige loop is stable.

Current handoff document:

- `docs/balance/roadmap.md`

## Global Constraints

- Work only on the `dev` branch; do not modify `main`.
- Do not add new gameplay decisions before the core validation harness and baseline exist.
- Keep `js/constants.js` as the single source of tuning values.
- Keep DOM and canvas out of validation scripts.
- Reports must be deterministic and rerunnable without AI inventing new criteria.
- Machine-readable JSON is canonical; Markdown summaries are for review.
- Machine learning is not part of phase-one implementation. Track it as a later research item after deterministic reports are stable.

---

## File Structure

- Create `tools/balance/load-game.js`: loads `js/constants.js`, `js/state.js`, and `js/engine.js` into a Node `vm` context with a minimal `window` object.
- Create `tools/balance/metrics.js`: derives rates, checkpoint snapshots, warning flags, and formatting helpers from game state.
- Create `tools/balance/scenarios.js`: defines deterministic scenario rules such as `idle-10m`, `guided-30m`, `guided-60m`, `first-prestige`, and `post-prestige-10m`.
- Create `tools/balance/run-validation.js`: command-line runner that executes scenarios and writes reports.
- Create `tools/balance/write-baseline.js`: converts the newest generated JSON report into a committed baseline Markdown summary.
- Create `docs/balance/protocol.md`: human-facing validation protocol used before and after gameplay changes.
- Create `docs/balance/reports/baseline-current.md`: committed first baseline summary.
- Create `reports/balance/.gitkeep`: keeps a local report output directory available.
- Modify `.gitignore`: ignore generated `reports/balance/*.json` and `reports/balance/*.md` except `.gitkeep`, so exploratory reports stay local.
- Modify `js/state.js` and `js/ui.js` only for audited correctness fixes discovered by the first validation pass.

---

### Task 1: Node Game Loader

**Files:**
- Create: `tools/balance/load-game.js`

**Interfaces:**
- Produces: `createGameRuntime(): { window: object, GC: object, GS: object, GE: object }`
- Produces: `newGame(): { window: object, GC: object, GS: object, GE: object, state: object }`

- [ ] **Step 1: Write the loader**

```js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME_FILES = [
  'js/constants.js',
  'js/state.js',
  'js/engine.js',
];

function createGameRuntime() {
  const window = {};
  const context = vm.createContext({
    window,
    console,
    Math,
    JSON,
    setInterval() {
      throw new Error('Balance validation must call GameEngine.tick() directly.');
    },
    clearInterval() {},
  });

  for (const file of GAME_FILES) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return {
    window,
    GC: window.GC,
    GS: window.GameState,
    GE: window.GameEngine,
  };
}

function newGame() {
  const runtime = createGameRuntime();
  const state = runtime.GS.init();
  return { ...runtime, state };
}

module.exports = {
  createGameRuntime,
  newGame,
};
```

- [ ] **Step 2: Run a smoke check**

Run:

```bash
node -e "const { newGame } = require('./tools/balance/load-game'); const game = newGame(); game.GE.tick(); console.log(JSON.stringify({ tiers: game.GC.TIERS.length, q: game.GS.getTier(0).count > 0 }))"
```

Expected:

```text
{"tiers":7,"q":true}
```

- [ ] **Step 3: Commit**

```bash
git add tools/balance/load-game.js
git commit -m "test: add balance game loader"
```

---

### Task 2: Metrics and Checkpoints

**Files:**
- Create: `tools/balance/metrics.js`

**Interfaces:**
- Consumes: `{ GC, GS }` runtime object from `newGame()`
- Produces: `snapshot(game, elapsedSeconds): object`
- Produces: `tierRates(game, tierId): { productionPerSecond: number, demandPerSecond: number, netPerSecond: number }`
- Produces: `warningsForSnapshot(snap): string[]`

- [ ] **Step 1: Write metrics helpers**

```js
function tierRates(game, tierId) {
  const { GC, GS } = game;
  const tier = GS.getTier(tierId);
  if (!tier || !tier.researched) {
    return { productionPerSecond: 0, demandPerSecond: 0, netPerSecond: 0 };
  }

  const productionPerSecond =
    GS.getProducerOutput(tierId) *
    GS.getSpeedMultiplier() *
    GS.getGravityMultiplier(tierId);

  let demandPerSecond = 0;
  if (tierId < GC.TIERS.length - 1) {
    const higher = GS.getTier(tierId + 1);
    if (higher && higher.researched) {
      let demand = GC.DEMAND_PER_UNIT * GC.TICKS_PER_SEC;
      if (GS.hasMilestone(7)) demand *= 0.7;
      demandPerSecond = higher.count * demand;
    }
  }

  return {
    productionPerSecond,
    demandPerSecond,
    netPerSecond: productionPerSecond - demandPerSecond,
  };
}

function snapshot(game, elapsedSeconds) {
  const { GC, GS } = game;
  const tiers = GC.TIERS.map((tpl, tierId) => {
    const tier = GS.getTier(tierId);
    const rates = tierRates(game, tierId);
    return {
      id: tierId,
      name: tpl.name,
      researched: tier.researched,
      count: tier.count,
      producers: tier.producers,
      synthCount: tier.synthCount,
      totalEver: tier.totalEver,
      rates,
    };
  });

  return {
    elapsedSeconds,
    researchPoints: GS.getRP(),
    maxResearchedTier: GS.getMaxResearchedTier(),
    totalQuarksEver: GS.getTotalQuarksEver(),
    totalSynthesis: GS.getState().totalSynthesis,
    prestiges: GS.getPrestiges(),
    constantPoints: GS.getCP(),
    canPrestige: GS.canPrestige(),
    cpGain: GS.calcCPGain(),
    tiers,
  };
}

function warningsForSnapshot(snap) {
  const warnings = [];
  for (const tier of snap.tiers) {
    if (!tier.researched) continue;
    if (tier.count === 0 && tier.rates.netPerSecond < 0) {
      warnings.push(`tier-${tier.id}-depleted-negative-net`);
    }
    if (tier.count > 1e12) {
      warnings.push(`tier-${tier.id}-runaway-count`);
    }
  }
  if (snap.elapsedSeconds >= 3600 && snap.maxResearchedTier < 3) {
    warnings.push('midgame-stall-before-molecule');
  }
  return warnings;
}

module.exports = {
  snapshot,
  tierRates,
  warningsForSnapshot,
};
```

- [ ] **Step 2: Run metrics smoke check**

Run:

```bash
node -e "const { newGame } = require('./tools/balance/load-game'); const { snapshot } = require('./tools/balance/metrics'); const game = newGame(); for (let i = 0; i < 20; i++) game.GE.tick(); console.log(snapshot(game, 1).tiers[0].rates.productionPerSecond.toFixed(2))"
```

Expected:

```text
0.30
```

- [ ] **Step 3: Commit**

```bash
git add tools/balance/metrics.js
git commit -m "test: add balance metrics snapshots"
```

---

### Task 3: Deterministic Scenario Runner

**Files:**
- Create: `tools/balance/scenarios.js`

**Interfaces:**
- Consumes: `newGame()` from `tools/balance/load-game.js`
- Consumes: `snapshot(game, elapsedSeconds)` from `tools/balance/metrics.js`
- Produces: `SCENARIOS: Record<string, Scenario>`
- Produces: `runScenario(name, options = {}): object`

- [ ] **Step 1: Write scenario logic**

```js
const { newGame } = require('./load-game');
const { snapshot, warningsForSnapshot } = require('./metrics');

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

    for (let tierId = Math.min(5, GS.getMaxResearchedTier()); tierId >= 1; tierId -= 1) {
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
  const finalSnapshot = snapshot(game, snapshots.length ? snapshots[snapshots.length - 1].elapsedSeconds : 0);
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
```

- [ ] **Step 2: Run scenario smoke check**

Run:

```bash
node -e "const { runScenario } = require('./tools/balance/scenarios'); const r = runScenario('guided-30m'); console.log(JSON.stringify({ scenario: r.scenario, checkpoints: r.checkpoints.length, maxTier: r.final.maxResearchedTier }))"
```

Expected shape:

```text
{"scenario":"guided-30m","checkpoints":1,"maxTier":2}
```

The exact `maxTier` may differ from `2` with current balance; it must be a number, not `null` or `undefined`.

- [ ] **Step 3: Commit**

```bash
git add tools/balance/scenarios.js
git commit -m "test: add deterministic balance scenarios"
```

---

### Task 4: Validation CLI and Generated Reports

**Files:**
- Create: `tools/balance/run-validation.js`
- Create: `reports/balance/.gitkeep`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `SCENARIOS` and `runScenario(name)`
- Produces CLI: `node tools/balance/run-validation.js --all`
- Produces CLI: `node tools/balance/run-validation.js guided-30m`

- [ ] **Step 1: Update `.gitignore` report rules**

```gitignore
# Generated balance reports
reports/balance/*.json
reports/balance/*.md
!reports/balance/.gitkeep
```

- [ ] **Step 2: Write the CLI**

```js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { SCENARIOS, runScenario } = require('./scenarios');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'reports', 'balance');

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function markdownSummary(report) {
  const lines = [
    `# Balance Validation Report`,
    ``,
    `- Commit: \`${report.commit}\``,
    `- Generated: ${report.generatedAt}`,
    `- Scenarios: ${report.results.length}`,
    ``,
  ];

  for (const result of report.results) {
    lines.push(`## ${result.scenario}`);
    if (result.skipped) {
      lines.push(`- Skipped: ${result.reason}`);
      lines.push(``);
      continue;
    }
    lines.push(`- Max researched tier: ${result.final.maxResearchedTier}`);
    lines.push(`- Research points: ${result.final.researchPoints.toFixed(2)}`);
    lines.push(`- Can prestige: ${result.final.canPrestige}`);
    if (result.reachedPrestige !== undefined) {
      lines.push(`- Reached prestige: ${result.reachedPrestige}`);
      lines.push(`- Prestige time seconds: ${result.prestigeTimeSeconds}`);
    }
    const warnings = result.final.warnings || [];
    lines.push(`- Final warnings: ${warnings.length ? warnings.join(', ') : 'none'}`);
    lines.push(``);
  }

  return `${lines.join('\n')}\n`;
}

function parseScenarioNames(argv) {
  if (argv.includes('--all') || argv.length === 0) {
    return Object.keys(SCENARIOS);
  }
  return argv.filter((arg) => !arg.startsWith('--'));
}

function main() {
  const scenarioNames = parseScenarioNames(process.argv.slice(2));
  ensureOutDir();

  const report = {
    commit: gitCommit(),
    generatedAt: new Date().toISOString(),
    results: scenarioNames.map((name) => runScenario(name)),
  };

  const stamp = report.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = path.join(OUT_DIR, `validation-${report.commit}-${stamp}.json`);
  const mdPath = path.join(OUT_DIR, `validation-${report.commit}-${stamp}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdownSummary(report));

  console.log(jsonPath);
  console.log(mdPath);
}

if (require.main === module) {
  main();
}
```

- [ ] **Step 3: Create `.gitkeep`**

```text

```

- [ ] **Step 4: Run all scenarios**

Run:

```bash
node tools/balance/run-validation.js --all
```

Expected:

```text
/Users/stepaniah/Developer/tiny-cosmos/reports/balance/validation-<commit>-<timestamp>.json
/Users/stepaniah/Developer/tiny-cosmos/reports/balance/validation-<commit>-<timestamp>.md
```

- [ ] **Step 5: Confirm generated reports are ignored**

Run:

```bash
git status --short
```

Expected includes:

```text
 M .gitignore
?? reports/
?? tools/
```

Expected does not include generated `reports/balance/validation-*.json` or `reports/balance/validation-*.md`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore reports/balance/.gitkeep tools/balance/run-validation.js
git commit -m "test: add balance validation runner"
```

---

### Task 5: Protocol Documentation and Baseline Report

**Files:**
- Create: `docs/balance/protocol.md`
- Create: `docs/balance/reports/baseline-current.md`
- Create: `tools/balance/write-baseline.js`

**Interfaces:**
- Consumes: CLI from Task 4
- Produces: reviewed baseline summary for future comparison

- [ ] **Step 1: Write the protocol**

```md
# Balance Validation Protocol

Tiny Cosmos uses deterministic validation scenarios before and after gameplay or balance changes.

## Required Command

Run:

\`\`\`bash
node tools/balance/run-validation.js --all
\`\`\`

## Required Review

For each change, compare the newest report with the committed baseline and record:

- Which scenarios changed.
- Which tier unlock times moved.
- Whether any warnings appeared.
- Whether the change was intended.
- Whether constants were tuned after understanding the difference.

## Current Phase

Phase one optimizes for a reachable first Big Crunch while preserving useful checkpoints at 10, 30, and 60 minutes.

## Machine Learning Policy

Do not use machine learning in phase one. Deterministic simulation and explicit thresholds are more useful until the project has stable historical reports.

Later, machine learning may be useful for:

- Detecting anomalous growth curves across many saved reports.
- Searching parameter ranges after human-authored acceptance targets exist.
- Clustering possible guided strategies to find dominant or degenerate play patterns.

ML output must never replace deterministic scenario reports. It can only suggest where humans or agents should inspect next.
\`\`\`

- [ ] **Step 2: Generate a report**

Run:

```bash
node tools/balance/run-validation.js --all
```

Expected: two generated file paths under `reports/balance/`.

- [ ] **Step 3: Write baseline generator**

```js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'balance');
const OUT_PATH = path.join(ROOT, 'docs', 'balance', 'reports', 'baseline-current.md');

function newestJsonReport() {
  const files = fs.readdirSync(REPORT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(REPORT_DIR, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (!files.length) {
    throw new Error('No generated JSON reports found. Run node tools/balance/run-validation.js --all first.');
  }

  return files[0];
}

function seconds(value) {
  if (value === null || value === undefined) return 'not reached';
  return `${value.toFixed(0)}s`;
}

function scenarioLines(result) {
  if (result.skipped) {
    return [
      `## ${result.scenario}`,
      ``,
      `- Skipped: ${result.reason}`,
      ``,
    ];
  }

  const warnings = result.final.warnings || [];
  const lines = [
    `## ${result.scenario}`,
    ``,
    `- Max researched tier: ${result.final.maxResearchedTier}`,
    `- Research points: ${result.final.researchPoints.toFixed(2)}`,
    `- Total quarks ever: ${result.final.totalQuarksEver.toFixed(2)}`,
    `- Can prestige: ${result.final.canPrestige}`,
    `- Final warnings: ${warnings.length ? warnings.join(', ') : 'none'}`,
  ];

  if (result.reachedPrestige !== undefined) {
    lines.push(`- Reached prestige: ${result.reachedPrestige}`);
    lines.push(`- Prestige time: ${seconds(result.prestigeTimeSeconds)}`);
  }

  if (result.constants) {
    lines.push(`- Constants: strongForce=${result.constants.strongForce}, lightSpeed=${result.constants.lightSpeed}, gravity=${result.constants.gravity}`);
  }

  lines.push(``);
  return lines;
}

function main() {
  const reportPath = newestJsonReport();
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const lines = [
    `# Current Balance Baseline`,
    ``,
    `This baseline captures the deterministic validation run for the current balance system. It records current behavior; it is not yet a strict pass/fail target.`,
    ``,
    `## Source`,
    ``,
    `- Command: \`node tools/balance/run-validation.js --all\``,
    `- Commit: \`${report.commit}\``,
    `- Generated: ${report.generatedAt}`,
    `- Local JSON report: \`${path.relative(ROOT, reportPath)}\``,
    ``,
    `## Scenario Summary`,
    ``,
  ];

  for (const result of report.results) {
    lines.push(...scenarioLines(result));
  }

  lines.push(`## Interpretation`);
  lines.push(``);
  lines.push(`Use this baseline to compare direction and magnitude of future changes. Update it after intentional balance corrections, and keep exploratory generated reports local unless they become reviewed baseline evidence.`);
  lines.push(``);

  fs.writeFileSync(OUT_PATH, lines.join('\n'));
  console.log(OUT_PATH);
}

if (require.main === module) {
  main();
}
```

- [ ] **Step 4: Generate committed baseline summary**

Run:

```bash
node tools/balance/write-baseline.js
```

Expected:

```text
/Users/stepaniah/Developer/tiny-cosmos/docs/balance/reports/baseline-current.md
```

- [ ] **Step 5: Commit**

```bash
git add docs/balance/protocol.md docs/balance/reports/baseline-current.md tools/balance/write-baseline.js
git commit -m "docs: add balance validation protocol"
```

---

### Task 6: First Correctness Audit Fixes

**Files:**
- Modify: `js/ui.js`
- Modify: `js/state.js`
- Modify: `docs/balance/reports/baseline-current.md`

**Interfaces:**
- Consumes: `node tools/balance/run-validation.js --all`
- Produces: corrected UI rate formulas and milestone behavior

- [ ] **Step 1: Fix UI production rate consistency**

In `js/ui.js`, update `updateBars(i)` and `updateNet(i)` so tier 0 production also applies `GS.getSpeedMultiplier()` just like engine production does.

Expected code pattern:

```js
prod = GS.getProducerOutput(i) * GS.getSpeedMultiplier() * GS.getGravityMultiplier(i);
```

- [ ] **Step 2: Fix Fusion Catalysis milestone**

In `js/state.js`, update `getSynthCost(tierId)` so milestone `3` reduces atom synthesis cost.

Expected code pattern:

```js
if (tierId === 2 && state.milestones.indexOf(3) !== -1) {
  rawCost = rawCost * 0.7;
}
```

- [ ] **Step 3: Update stale comments**

In `js/engine.js`, change the production comment so it describes direct producer generation rather than auto-synthesis.

Expected wording:

```js
// 1. Production (tier 0-5 producers generate their own tier)
```

- [ ] **Step 4: Run validation before and after**

Run:

```bash
node tools/balance/run-validation.js --all
```

Expected: generated reports complete without thrown errors.

- [ ] **Step 5: Update baseline summary**

Edit `docs/balance/reports/baseline-current.md` with the new report's scenario summary and note that UI rate consistency plus Fusion Catalysis behavior were corrected.

- [ ] **Step 6: Commit**

```bash
git add js/ui.js js/state.js js/engine.js docs/balance/reports/baseline-current.md
git commit -m "fix: align balance logic and validation baseline"
```

---

### Task 7: Machine Learning Backlog Note

**Files:**
- Create: `docs/balance/ml-backlog.md`

**Interfaces:**
- Consumes: deterministic reports from earlier tasks
- Produces: clear later-stage ML criteria

- [ ] **Step 1: Write the ML backlog**

```md
# Machine Learning Backlog

Machine learning is useful later, but not necessary for phase-one balance validation.

## Why Not Now

The project currently needs deterministic scenarios, explicit metrics, and stable baselines. ML would add complexity before there is enough historical data to learn from.

## Later Candidate Uses

1. Anomaly detection across historical validation reports.
2. Parameter search after human-authored target ranges exist.
3. Strategy clustering after several deterministic or scripted play styles exist.
4. Regression risk scoring for large balance changes.

## Entry Criteria

Consider ML only after:

- At least 20 committed or archived validation reports exist.
- Scenario rules have stayed stable for several gameplay changes.
- Human-readable acceptance ranges exist for tier unlocks, first prestige, and second-run acceleration.
- Deterministic validation remains the required gate.

## Non-Negotiable Rule

ML can suggest suspicious curves or candidate parameters. It must not replace deterministic validation reports or human design judgment.
```

- [ ] **Step 2: Commit**

```bash
git add docs/balance/ml-backlog.md
git commit -m "docs: add balance ml backlog"
```

---

## Self-Review Notes

- Spec coverage: The plan covers deterministic scenarios, JSON/Markdown reports, a committed baseline, UI/logic audit fixes, the development protocol, and ML as a later research item.
- Deferred-marker scan: The plan avoids hand-filled future values. Task 5 generates baseline values from real output during execution.
- Type consistency: `newGame`, `snapshot`, `tierRates`, `warningsForSnapshot`, `SCENARIOS`, and `runScenario` are introduced before use.
- Scope: The plan does not add new gameplay decisions. It builds the validation harness and fixes first-audit correctness issues only.
