#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'dist', 'crazygames');
const STAGING_ROOT = path.join(OUTPUT_ROOT, 'package');
const ZIP_PATH = path.join(OUTPUT_ROOT, 'tiny-cosmos-crazygames.zip');
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
const MAX_FILE_COUNT = 1500;

const exactFiles = [
  'index.html',
  'css/game.css',
  'assets/favicon.svg',
  'assets/rebirth/references/observer-core-rebirth-master.png',
  'assets/rebirth/references/shared-horizon-master.png',
];

const groups = [
  { directory: 'js', accept: (name) => name.endsWith('.js') },
  { directory: 'assets/icons', accept: (name) => name.endsWith('.svg') },
  { directory: 'assets/textures/background', accept: (name) => name.endsWith('.webp') },
  { directory: 'assets/audio/sfx', accept: (name) => name.endsWith('.mp3') },
  { directory: 'assets/prologue', recursive: false, accept: (name) => /^prologue-\d+\.webp$/.test(name) },
  { directory: 'assets/rebirth', recursive: false, accept: (name) => /^rebirth-.*\.webp$/.test(name) },
];

function fail(message) {
  console.error(`CrazyGames package error: ${message}`);
  process.exit(1);
}

function copyFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(STAGING_ROOT, relativePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail(`missing runtime file: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function listGroup(group) {
  const root = path.join(ROOT, group.directory);
  if (!fs.existsSync(root)) fail(`missing runtime directory: ${group.directory}`);
  const files = [];

  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (group.recursive !== false) visit(absolute);
        return;
      }
      if (entry.isFile() && group.accept(entry.name)) files.push(path.relative(ROOT, absolute));
    });
  }

  visit(root);
  if (!files.length) fail(`runtime group is empty: ${group.directory}`);
  return files;
}

function listPackageFiles(directory) {
  const files = [];
  function visit(current) {
    fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    });
  }
  visit(directory);
  return files;
}

function validatePackage(files) {
  if (!fs.existsSync(path.join(STAGING_ROOT, 'index.html'))) fail('index.html is not at the package root');
  if (files.some((file) => path.basename(file) === '.DS_Store')) fail('package contains .DS_Store');
  if (files.length > MAX_FILE_COUNT) fail(`package has ${files.length} files; limit is ${MAX_FILE_COUNT}`);

  const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    fail(`package is ${(totalBytes / 1024 / 1024).toFixed(2)} MB; total limit is 250 MB`);
  }

  const runtimeText = files
    .filter((file) => /\.(?:html|css|js)$/.test(file))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  if (/(?:src|href)\s*=\s*["'](?:file:|\/Users\/|[A-Za-z]:\\)/i.test(runtimeText)) {
    fail('package contains an absolute local src/href path');
  }
  return totalBytes;
}

fs.rmSync(STAGING_ROOT, { recursive: true, force: true });
fs.mkdirSync(STAGING_ROOT, { recursive: true });
fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

const runtimeFiles = exactFiles.concat(groups.flatMap(listGroup));
[...new Set(runtimeFiles)].sort().forEach(copyFile);

const packageFiles = listPackageFiles(STAGING_ROOT);
const totalBytes = validatePackage(packageFiles);

fs.rmSync(ZIP_PATH, { force: true });
const zipped = spawnSync('zip', ['-q', '-r', '-9', ZIP_PATH, '.'], {
  cwd: STAGING_ROOT,
  encoding: 'utf8',
});
if (zipped.status !== 0) fail(zipped.stderr || 'zip command failed');

const zipBytes = fs.statSync(ZIP_PATH).size;
console.log([
  'CrazyGames package ready.',
  `Files: ${packageFiles.length}`,
  `Uncompressed: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
  `ZIP: ${(zipBytes / 1024 / 1024).toFixed(2)} MB`,
  `Upload: ${ZIP_PATH}`,
].join('\n'));
