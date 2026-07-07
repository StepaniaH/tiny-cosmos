const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { SCENARIOS, runScenario } = require('./scenarios');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'reports', 'balance');

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function markdownSummary(report) {
  const lines = [
    '# Balance Validation Report',
    '',
    `- Commit: \`${report.commit}\``,
    `- Generated: ${report.generatedAt}`,
    `- Scenarios: ${report.results.length}`,
    '',
  ];

  for (const result of report.results) {
    lines.push(`## ${result.scenario}`);
    if (result.skipped) {
      lines.push(`- Skipped: ${result.reason}`);
      lines.push('');
      continue;
    }
    lines.push(`- Max researched tier: ${result.final.maxResearchedTier}`);
    lines.push(`- Research points: ${result.final.researchPoints.toFixed(2)}`);
    lines.push(`- Can prestige: ${result.final.canPrestige}`);
    if (result.reachedPrestige !== undefined) {
      lines.push(`- Reached prestige: ${result.reachedPrestige}`);
      lines.push(`- Prestige time seconds: ${result.prestigeTimeSeconds}`);
    }
    const warnings = result.final.warnings || [];
    lines.push(`- Final warnings: ${warnings.length ? warnings.join(', ') : 'none'}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function parseScenarioNames(argv) {
  if (argv.includes('--all') || argv.length === 0) {
    return Object.keys(SCENARIOS);
  }
  return argv.filter((arg) => !arg.startsWith('--'));
}

function main() {
  const scenarioNames = parseScenarioNames(process.argv.slice(2));
  ensureOutDir();

  const report = {
    commit: gitCommit(),
    generatedAt: new Date().toISOString(),
    results: scenarioNames.map((name) => runScenario(name)),
  };

  const stamp = report.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = path.join(OUT_DIR, `validation-${report.commit}-${stamp}.json`);
  const mdPath = path.join(OUT_DIR, `validation-${report.commit}-${stamp}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdownSummary(report));

  console.log(jsonPath);
  console.log(mdPath);
}

if (require.main === module) {
  main();
}
