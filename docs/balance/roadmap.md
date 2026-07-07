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
- `first-prestige`: reaches Big Crunch at 11496 simulated seconds (~3.2 hours), no warnings.
- `post-prestige-10m`: runs after prestige, reaches tier 2, no warnings.

## Root Cause Found: First Prestige Was a Harness Bug, Not a Balance Problem

The earlier `first-prestige` failure (civilization count never reaching 1) was caused by
`performGuidedActions` in `tools/balance/scenarios.js` capping its synthesis loop at tier 5:

```js
for (let tierId = Math.min(5, GS.getMaxResearchedTier()); tierId >= 1; tierId -= 1) {
```

The deterministic guided strategy never attempted to synthesize tier 6 (Civilization) at all,
so `canPrestige()` could never become true regardless of how much Life accumulated. Changing the
cap from `5` to `6` fixed the scenario without any changes to `js/constants.js`:

```js
for (let tierId = Math.min(6, GS.getMaxResearchedTier()); tierId >= 1; tierId -= 1) {
```

Before concluding the game balance itself needs tuning, verify the harness is actually exercising
every tier's synthesis/production path. Several rounds of constant tuning (Cell/Life/Civilization
`baseCost`, Cell `baseProd`) were tried and reverted before finding this; none were necessary once
the harness bug was fixed.

## Next Phase Goal

First prestige is now reachable. Convert the baseline into rough acceptance ranges, then resume
adding gameplay decisions one at a time.

This is still a balance-first phase. Do not add new major gameplay decisions until acceptance
ranges are recorded.

## Recommended Next Work Order

### 1. Update Acceptance Ranges

Convert the baseline from "current reality" into rough acceptance ranges.

Suggested first ranges:

- `guided-30m`: should reach at least tier 3.
- `guided-60m`: should reach at least tier 4.
- `first-prestige`: should reach Big Crunch within 24 simulated hours (currently ~3.2 hours).
- `post-prestige-10m`: should run instead of skipping and should show visible second-run acceleration.

Write ranges in:

- `docs/balance/protocol.md`
- `docs/balance/reports/baseline-current.md`

### 2. Only Then Add Gameplay Decisions

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
