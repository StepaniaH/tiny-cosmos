# Tiny Cosmos Balance Validation System

## Purpose

Tiny Cosmos should evolve through stable, repeatable balance checks rather than fresh ad hoc judgment on every change. The first development phase will focus on tuning and verifying the core numeric loop before adding new gameplay decisions.

The validation system is a project asset. It should let future work answer the same questions with the same method:

- Did the player reach each tier at a reasonable pace?
- Did production, demand, research, and prestige stay internally consistent?
- Did a new mechanic improve decision-making without breaking the existing pacing curve?
- Did the change create a stall, runaway economy, or misleading UI readout?

## Current Context

The project is a small browser idle game using plain HTML, CSS, and JavaScript.

- `js/constants.js` owns tier definitions, costs, production rates, research costs, prestige math, and milestone data.
- `js/state.js` owns saveable simulation state and mutation helpers.
- `js/engine.js` owns tick-based production, demand, research gain, synthesis, research, and prestige actions.
- `js/ui.js` and `js/render.js` present the DOM HUD and canvas visualization.

This structure is suitable for a balance validation layer because most gameplay numbers already flow through a small set of files.

## Phase One Goal

The phase-one north star is: a complete first Big Crunch should be reachable through a repeatable play pattern.

Early feel still matters, so the validation suite will also include checkpoints at 10, 30, and 60 minutes. The goal is not only "can the game finish once" and not only "does the opening feel good"; it is to verify that the whole first-run arc holds together.

Expected first-run checkpoints:

- 0-10 minutes: the player can understand clicking, producers, synthesis, and research.
- 10-30 minutes: automation starts to matter and the player reaches or approaches atom/molecule progression.
- 30-60 minutes: the game has a visible midgame rhythm instead of pure waiting.
- First prestige: civilization and Big Crunch are reachable by a defined guided strategy.
- Post-prestige opening: constant points noticeably affect the second run without trivializing it.

Exact target times should be established from the first baseline run, then tightened after observing real output.

## Validation Scenarios

The validation suite should use named scenarios. Each scenario must be deterministic and documented enough that future agents and humans can rerun it without inventing a new method.

### `idle-10m`

Simulates ten minutes with no manual action except initial game start. This verifies passive production, research gain, and whether the game communicates the need for manual interaction.

### `click-start-10m`

Simulates a light active opening. The player clicks during the initial period, then buys obvious available producers and performs available research or synthesis according to fixed rules.

### `guided-30m`

Simulates thirty minutes using a deterministic strategy:

- Buy the cheapest affordable producer when it improves the current researched tier.
- Synthesize the highest affordable researched tier when it unlocks useful research progress.
- Research the next tier as soon as it is affordable.
- Avoid prestige because this scenario measures first-run middle pacing.

### `guided-60m`

Extends the same deterministic strategy to one hour. This catches slow stalls and runaway production that may not appear in the first 30 minutes.

### `first-prestige`

Runs the guided strategy until civilization and Big Crunch are available, or until a defined maximum simulated time is reached. The scenario records the time of every tier unlock and the constant point gain at prestige.

### `post-prestige-10m`

Starts from the first-prestige result, performs Big Crunch, applies a fixed constant allocation, and simulates the next ten minutes. This verifies whether prestige gives a clear but controlled improvement.

## Metrics

Each scenario report should include:

- Scenario name and simulated duration.
- Version metadata: git commit, timestamp, and scenario rules version.
- First unlock time for each tier.
- Resource count per tier at each checkpoint.
- Producer count per tier at each checkpoint.
- Research points and research gain rate.
- Production, demand, and net rate per tier.
- Synthesis counts and total synthesis count.
- Prestige availability, constant point gain, and post-prestige constants.
- Warnings for stalls, negative net rates, unreachable goals, or runaway growth.

The output should be machine-readable first and human-readable second. A JSON report is the canonical artifact; a Markdown summary can be generated from it for reviews.

## Acceptance Rules

The first baseline does not need to pass strict numeric targets. Its job is to establish the current reality.

After the baseline is accepted, future changes should follow these rules:

- A gameplay or balance change must include a fresh validation report.
- If a target checkpoint shifts substantially, the change must explain why.
- If a scenario stalls, the implementation is not ready unless the stall is intentional and documented.
- If UI-displayed rates disagree with simulation rates, fix the discrepancy before tuning around those numbers.
- If a new mechanic changes a core multiplier, it must appear in both the simulator output and the player-facing explanation.

## Known First Audit Items

Before adding new gameplay decisions, the first implementation pass should audit and fix these likely issues:

- Some UI rate calculations appear to omit or inconsistently apply speed multipliers compared with engine production.
- The `Fusion Catalysis` milestone describes a nucleon-to-atom cost reduction, but the current synthesis cost logic does not appear to apply that specific milestone.
- The code comments mention auto-synthesis in places where producers now directly generate their own tier, so developer-facing wording should be updated.
- Save migration is minimal. If state shape changes for validation or future mechanics, older saves should fail gracefully or migrate explicitly.

## Architecture Direction

The validation layer should preserve the existing simulation/rendering boundary.

Preferred approach:

1. Extract or wrap the pure numeric simulation so it can run in Node without DOM or canvas.
2. Keep constants as the single tuning source.
3. Keep browser UI and canvas out of validation scripts.
4. Make scenario rules explicit data or small named functions.
5. Write generated reports into a predictable ignored or reviewed location, depending on whether they are temporary or baseline artifacts.

The first baseline report should be committed as documentation if it becomes the comparison point for future changes. Temporary exploratory reports should not be committed by default.

## Development Protocol

Every future gameplay decision should follow this sequence:

1. Describe the mechanic and which numbers it can affect.
2. Run the current baseline validation suite before changing behavior, unless a fresh report already exists for the current commit.
3. Implement the smallest version of the mechanic.
4. Run the validation suite again.
5. Compare reports and record meaningful differences.
6. Tune constants only after the difference is understood.
7. Commit the mechanic, validation updates, and documentation together when they form one reviewable step.

This protocol is meant to reduce repeated token use and avoid inconsistent AI-generated balance criteria.

## Non-Goals

This phase will not add new major gameplay systems, new visual themes, or a new engine. It will not rewrite the project into a framework. Those choices can come later, after the numeric loop has a stable verification harness.

## Open Implementation Questions

These should be resolved during the implementation plan:

- Whether to run browser-authored scripts inside Node with a small `window` shim or to refactor core logic into shared modules.
- Whether baseline reports should live under `docs/balance/reports/` or a separate `reports/` directory.
- What maximum simulated time should define failure for `first-prestige`.
- What fixed post-prestige constant allocation should be used for the first baseline.
