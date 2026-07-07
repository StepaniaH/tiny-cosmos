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

## Machine Learning Policy

Do not use machine learning in phase one. Deterministic simulation and explicit thresholds are more useful until the project has stable historical reports.

Later, machine learning may be useful for:

- Detecting anomalous growth curves across many saved reports.
- Searching parameter ranges after human-authored acceptance targets exist.
- Clustering possible guided strategies to find dominant or degenerate play patterns.

ML output must never replace deterministic scenario reports. It can only suggest where humans or agents should inspect next.
