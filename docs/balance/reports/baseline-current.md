# Current Balance Baseline

This baseline captures the deterministic validation run for the current balance system. It records current behavior; it is not yet a strict pass/fail target.

## Source

- Command: `node tools/balance/run-validation.js --all`
- Commit: `c55fa89`
- Generated: 2026-07-07T09:15:45.307Z
- Local JSON report: `reports/balance/validation-c55fa89-2026-07-07T09-15-45-307Z.json`

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
- Failure reason: civilization-count-below-1
- Failure tier details:
  - 0 Quark: count=4798.1711, net=7.3924/s, synthCost=0, producerCost=18953, everReachedOne=true
  - 1 Nucleon: count=1761.5249, net=4.3200/s, synthCost=19552, producerCost=9476, everReachedOne=true
  - 2 Atom: count=0.0000, net=-4.4333/s, synthCost=8822, producerCost=803, everReachedOne=true
  - 3 Molecule: count=1126.6502, net=0.5640/s, synthCost=816, producerCost=1425, everReachedOne=true
  - 4 Cell: count=0.0000, net=-1.3592/s, synthCost=1335, producerCost=50, everReachedOne=true
  - 5 Life: count=299.8349, net=0.0980/s, synthCost=38, producerCost=942, everReachedOne=true
  - 6 Civilization: count=0.0000, net=0.0000/s, synthCost=8, producerCost=n/a, everReachedOne=false

## post-prestige-10m

- Skipped: first-prestige did not reach Big Crunch within the maximum simulated time

## Interpretation

Use this baseline to compare direction and magnitude of future changes. Update it after intentional balance corrections, and keep exploratory generated reports local unless they become reviewed baseline evidence.
