# Current Balance Baseline

This baseline captures the deterministic validation run for the current balance system. It records current behavior; it is not yet a strict pass/fail target.

## Source

- Command: `node tools/balance/run-validation.js --all`
- Commit: `c7a0a0a`
- Generated: 2026-07-07T08:45:20.310Z
- Local JSON report: `reports/balance/validation-c7a0a0a-2026-07-07T08-45-20-310Z.json`

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
- Research points: 174461.51
- Total quarks ever: 1276029.20
- Can prestige: false
- Final warnings: tier-2-depleted-negative-net, tier-4-depleted-negative-net
- Reached prestige: false
- Prestige time: not reached

## post-prestige-10m

- Skipped: first-prestige did not reach Big Crunch within the maximum simulated time

## Interpretation

Use this baseline to compare direction and magnitude of future changes. Update it after intentional balance corrections, and keep exploratory generated reports local unless they become reviewed baseline evidence.
