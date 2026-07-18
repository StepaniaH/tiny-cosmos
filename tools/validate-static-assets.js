const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifestPath = path.join(ROOT, 'assets', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const missing = [];

function requireFile(relativePath, label) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile() || fs.statSync(absolutePath).size === 0) {
    missing.push(`${label}: ${relativePath}`);
  }
}

for (const asset of manifest.assets.filter((entry) => entry.enabled)) {
  if (asset.files) {
    for (const file of Object.values(asset.files)) {
      requireFile(path.posix.join(asset.source, file), asset.id);
    }
  } else {
    requireFile(asset.source, asset.id);
  }
}

if (missing.length) {
  console.error(`Missing enabled assets:\n${missing.join('\n')}`);
  process.exit(1);
}

const eventAudio = manifest.assets.find((asset) => asset.id === 'event_audio');
if (!eventAudio || !eventAudio.enabled || Object.keys(eventAudio.files || {}).length !== 20) {
  throw new Error('The on-demand event audio manifest must expose exactly 20 enabled sounds.');
}

console.log(`Validated ${manifest.assets.filter((entry) => entry.enabled).length} enabled asset groups.`);
