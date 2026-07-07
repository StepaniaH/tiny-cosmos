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
      '',
      `- Skipped: ${result.reason}`,
      '',
    ];
  }

  const warnings = result.final.warnings || [];
  const lines = [
    `## ${result.scenario}`,
    '',
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

  lines.push('');
  return lines;
}

function main() {
  const reportPath = newestJsonReport();
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const lines = [
    '# Current Balance Baseline',
    '',
    'This baseline captures the deterministic validation run for the current balance system. It records current behavior; it is not yet a strict pass/fail target.',
    '',
    '## Source',
    '',
    '- Command: `node tools/balance/run-validation.js --all`',
    `- Commit: \`${report.commit}\``,
    `- Generated: ${report.generatedAt}`,
    `- Local JSON report: \`${path.relative(ROOT, reportPath)}\``,
    '',
    '## Scenario Summary',
    '',
  ];

  for (const result of report.results) {
    lines.push(...scenarioLines(result));
  }

  lines.push('## Interpretation');
  lines.push('');
  lines.push('Use this baseline to compare direction and magnitude of future changes. Update it after intentional balance corrections, and keep exploratory generated reports local unless they become reviewed baseline evidence.');
  lines.push('');

  fs.writeFileSync(OUT_PATH, lines.join('\n'));
  console.log(OUT_PATH);
}

if (require.main === module) {
  main();
}
