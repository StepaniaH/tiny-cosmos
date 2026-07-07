# Balance Validation Protocol

Tiny Cosmos uses deterministic validation scenarios before and after gameplay or balance changes.

## Required Command

Run:

```bash
node tools/balance/run-validation.js --all
```

## Required Review

For each change, compare the newest report with the committed baseline and record:

- Which scenarios changed.
- Which tier unlock times moved.
- Whether any warnings appeared.
- Whether the change was intended.
- Whether constants were tuned after understanding the difference.

## Current Phase

Phase one optimizes for a reachable first Big Crunch while preserving useful checkpoints at 10, 30, and 60 minutes.

## Acceptance Ranges

These are the minimum pass criteria for the deterministic guided strategy. A scenario result
outside these ranges should be treated as a balance regression unless the change was intentional
and documented.

- `idle-10m`: reaches at least tier 1 with no warnings.
- `click-start-10m`: reaches at least tier 1 with no warnings.
- `guided-30m`: reaches at least tier 3 with no warnings.
- `guided-60m`: reaches at least tier 4 with no warnings.
- `first-prestige`: reaches Big Crunch within 24 simulated hours. Current actual: ~3.2 hours
  (11496s). Warnings during the run are acceptable only if no tier remains permanently depleted
  at the final snapshot.
- `post-prestige-10m`: must run (not skip) and should reach at least tier 2 with no warnings,
  showing visible second-run acceleration relative to the pre-prestige `guided` scenarios at the
  same elapsed time.

If a scenario falls outside its range, check whether the guided strategy in
`tools/balance/scenarios.js` is actually exercising every unlocked tier before assuming the
constants in `js/constants.js` need tuning.

## Machine Learning Policy

Do not use machine learning in phase one. Deterministic simulation and explicit thresholds are more useful until the project has stable historical reports.

Later, machine learning may be useful for:

- Detecting anomalous growth curves across many saved reports.
- Searching parameter ranges after human-authored acceptance targets exist.
- Clustering possible guided strategies to find dominant or degenerate play patterns.

ML output must never replace deterministic scenario reports. It can only suggest where humans or agents should inspect next.
