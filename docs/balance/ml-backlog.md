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
