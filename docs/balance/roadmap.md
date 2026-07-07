# Tiny Cosmos Development Roadmap

This document is the handoff map for humans and AI agents working on Tiny Cosmos after the balance validation phase.

## Current Branch State

- Active development branch: `dev`
- Stable branch: `main`
- Rule: do not work directly on `main`; merge through GitHub PRs from `dev`.
- Latest pushed development work includes the deterministic balance validation system and the idle rendering workload fix.

## Completed Work

### Repository Hygiene

- Added privacy-focused `.gitignore`.
- Ignored local agent state, environment files, dependency folders, logs, browser test artifacts, and generated balance reports.

### Balance Validation Foundation

- Added Node-based game loader: `tools/balance/load-game.js`
- Added metric snapshots and warning generation: `tools/balance/metrics.js`
- Added deterministic scenarios: `tools/balance/scenarios.js`
- Added validation CLI: `tools/balance/run-validation.js`
- Added baseline writer: `tools/balance/write-baseline.js`
- Added validation protocol: `docs/balance/protocol.md`
- Added current baseline summary: `docs/balance/reports/baseline-current.md`
- Added ML backlog policy: `docs/balance/ml-backlog.md`

### First Correctness Fixes

- Aligned UI production-rate display with engine speed multiplier behavior.
- Implemented the `Fusion Catalysis` milestone effect for atom synthesis cost.
- Updated stale production comments.

### Performance Fix

- Reduced canvas rendering from uncapped `requestAnimationFrame` usage to a 30fps target.
- Cached the canvas background gradient at resize time instead of recreating it every frame.
- Paused canvas rendering while the page is hidden.
- Reduced DOM HUD refresh from 20 updates per second to 4 updates per second while keeping simulation ticks at 20 per second.

### Baseline Refresh

- Refreshed `docs/balance/reports/baseline-current.md` after the performance fix.
- Scenario numbers did not change because the performance fix affects rendering and DOM update cadence, not simulation logic.

## Current Validation Baseline

Run:

```bash
node tools/balance/run-validation.js --all
```

Current baseline summary:

- `idle-10m`: reaches tier 1, no warnings.
- `click-start-10m`: reaches tier 1, no warnings.
- `guided-30m`: reaches tier 3, no warnings.
- `guided-60m`: reaches tier 4, no warnings.
- `first-prestige`: reaches researched tier 6 but does not produce civilization within the 24-hour simulated cap.
- `post-prestige-10m`: skipped because first prestige is not yet reachable.

Primary current balance problem:

- The first Big Crunch is not reachable under the deterministic guided strategy within the current `first-prestige` cap.
- At the end of `first-prestige`, warnings include depleted negative net for tier 2 and tier 4.

## Next Phase Goal

Make first Big Crunch reachable through the deterministic guided strategy without destroying early and midgame pacing.

This is still a balance-first phase. Do not add new major gameplay decisions until first prestige is reachable and the baseline has been updated.

## Recommended Next Work Order

### 1. Add Better Failure Detail to Reports

Before tuning constants, improve report visibility for the failed `first-prestige` scenario.

Recommended additions:

- Last nonzero count per tier.
- Minimum net rate per tier.
- Time when each tier first reaches a count of at least `1`.
- Final synthesis cost for each tier.
- Final producer cost for each tier.
- A clear `failureReason` field for scenarios that fail their goal.

Expected files:

- `tools/balance/metrics.js`
- `tools/balance/scenarios.js`
- `tools/balance/run-validation.js`
- `docs/balance/reports/baseline-current.md`

Validation:

```bash
node --check tools/balance/metrics.js
node --check tools/balance/scenarios.js
node --check tools/balance/run-validation.js
node tools/balance/run-validation.js --all
```

### 2. Tune First Prestige Reachability

Use the improved report to tune only the smallest necessary set of constants.

Candidate knobs, in likely order:

- Late-tier synthesis costs: `baseCost` for Cell, Life, and Civilization.
- Late-tier production: `baseProd` for Cell and Life.
- Demand pressure: `DEMAND_PER_UNIT`.
- Producer cost scaling: `PROD_COST_SCALE`.
- Research pacing only if tier unlock timing is the true blocker.

Do not tune all knobs at once. Change one small group, run validation, compare, and document the effect.

Target for the first successful pass:

- `first-prestige` reaches Big Crunch within 24 simulated hours.
- `guided-30m` and `guided-60m` do not regress into a slower opening.
- No runaway-count warnings.
- Negative net warnings are acceptable only if the affected tier can recover and progression still reaches prestige.

### 3. Update Acceptance Ranges

Once first prestige is reachable, convert the baseline from "current reality" into rough acceptance ranges.

Suggested first ranges:

- `guided-30m`: should reach at least tier 3.
- `guided-60m`: should reach at least tier 4.
- `first-prestige`: should reach Big Crunch within 24 simulated hours.
- `post-prestige-10m`: should run instead of skipping and should show visible second-run acceleration.

Write ranges in:

- `docs/balance/protocol.md`
- `docs/balance/reports/baseline-current.md`

### 4. Only Then Add Gameplay Decisions

After the first prestige loop is stable:

- Add one new gameplay decision at a time.
- Describe which numbers the mechanic can affect.
- Run validation before and after the mechanic.
- Commit mechanic, validation report summary, and docs together.

Good first mechanic candidates:

- Manual batch controls for synthesis.
- Producer priority toggles.
- Research branch choice with one conservative branch and one aggressive branch.
- Constant allocation presets after prestige.

Avoid first:

- Offline progression.
- Random events.
- Machine-learning-assisted tuning.
- Large UI rewrites.

## Machine Learning Position

Machine learning is potentially useful later but should not drive the next phase.

Use ML only after:

- At least 20 useful historical validation reports exist.
- Scenario rules are stable.
- Human-readable acceptance ranges exist.
- Deterministic validation remains the required gate.

Candidate ML uses later:

- Anomaly detection across many reports.
- Parameter search within human-authored ranges.
- Strategy clustering when multiple deterministic strategies exist.

## Agent Handoff Checklist

Before starting work:

- Confirm branch: `git status --short --branch`
- Confirm `dev` is active.
- Do not modify `main`.
- Read this file, `docs/balance/protocol.md`, and `docs/balance/reports/baseline-current.md`.
- Run `node tools/balance/run-validation.js --all` before changing behavior.

Before committing:

- Run relevant `node --check` commands.
- Run `node tools/balance/run-validation.js --all`.
- If balance behavior intentionally changed, run `node tools/balance/write-baseline.js`.
- Commit generated baseline summary only if it is an accepted comparison point.
- Do not commit generated files under `reports/balance/`.

Before pushing:

- Confirm `git status --short --branch` is clean.
- Push only `dev`: `git push -u origin dev`
- PR should be created manually on GitHub from `dev` into `main`.
