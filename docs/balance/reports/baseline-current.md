# Current Balance Baseline

This baseline captures the deterministic validation run for the current balance system. It records current behavior; it is not yet a strict pass/fail target.

## Source

- Command: `node tools/balance/run-validation.js --all`
- Commit: `cca1354`
- Generated: 2026-07-07T10:32:10.318Z
- Local JSON report: `reports/balance/validation-cca1354-2026-07-07T10-32-10-318Z.json`

## Scenario Summary

## idle-10m

- Max researched tier: 1
- Research points: 16.10
- Total quarks ever: 180.00
- Can prestige: false
- Final warnings: none

## click-start-10m

- Max researched tier: 1
- Research points: 19.96
- Total quarks ever: 813.42
- Can prestige: false
- Final warnings: none

## guided-30m

- Max researched tier: 3
- Research points: 34.96
- Total quarks ever: 7204.54
- Can prestige: false
- Final warnings: none

## guided-60m

- Max researched tier: 4
- Research points: 181.71
- Total quarks ever: 22444.37
- Can prestige: false
- Final warnings: none

## first-prestige

- Max researched tier: 6
- Research points: 0.62
- Total quarks ever: 113224.53
- Can prestige: true
- Final warnings: none
- Reached prestige: true
- Prestige time: 11496s

## post-prestige-10m

- Max researched tier: 2
- Research points: 6.96
- Total quarks ever: 119643.83
- Can prestige: false
- Final warnings: none
- Constants: strongForce=3, lightSpeed=3, gravity=4

## Interpretation

Use this baseline to compare direction and magnitude of future changes. Update it after intentional balance corrections, and keep exploratory generated reports local unless they become reviewed baseline evidence.
