#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const calls = [];
const observers = [];
const listeners = Object.create(null);
const layers = {
  prologue: { hidden: false },
  'settings-layer': { hidden: true },
  'lore-layer': { hidden: true },
  'log-layer': { hidden: true },
};
let settingsListener = null;
let sealed = false;
const slice = {
  loopNumber: 1,
  missionStep: 0,
  flags: { civilizationComplete: false },
};

const sdk = {
  environment: 'local',
  init: () => {
    calls.push('init');
    return Promise.resolve();
  },
  user: { systemInfo: { locale: 'en-US' } },
  game: {
    settings: { muteAudio: true },
    loadingStart: () => calls.push('loadingStart'),
    loadingStop: () => calls.push('loadingStop'),
    gameplayStart: () => calls.push('gameplayStart'),
    gameplayStop: () => calls.push('gameplayStop'),
    happytime: () => calls.push('happytime'),
    reportGameCompletedPercentage: (value) => calls.push(`progress:${value}`),
    setGameContext: (value) => calls.push(`context:${value.loop}:${value.missionStep}:${value.phase}`),
    addSettingsChangeListener: (listener) => { settingsListener = listener; },
  },
};

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    observers.push(this);
  }
  observe() {}
}

const document = {
  addEventListener: (name, callback) => { listeners[name] = callback; },
  dispatchEvent: () => {},
  getElementById: (id) => layers[id] || null,
};
const audioStates = [];
const localeStates = [];
const windowObject = {
  CrazyGames: { SDK: sdk },
  GameState: {
    getSlice: () => slice,
    isLoopSealed: () => sealed,
    getCampaignStatus: () => ({ phase: sealed ? 'sealed' : 'active' }),
  },
  GameSlice: {
    getMission: () => ({ code: `L${slice.loopNumber}-${slice.missionStep}` }),
  },
  GameI18n: {
    getLocale: () => 'en',
    setAutomaticLocale: (locale) => { localeStates.push(locale); },
  },
  GameAudio: {
    setPlatformMuted: (muted) => { audioStates.push(muted); },
    setAdMuted: () => {},
  },
  console,
  setTimeout,
  clearTimeout,
};
windowObject.window = windowObject;

const context = vm.createContext({
  window: windowObject,
  document,
  MutationObserver: FakeMutationObserver,
  Promise,
  Object,
  JSON,
  Number,
  Math,
  String,
  console,
});
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'crazygames.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/crazygames.js' });

(async () => {
  const platform = windowObject.TinyCosmosPlatform;
  const ready = await platform.ready;
  assert.strictEqual(ready.enabled, true);
  assert.strictEqual(ready.environment, 'local');

  platform.markLoaded();
  platform.markPlayable();
  assert.strictEqual(platform.getDebugState().playing, false, 'visible prologue must delay gameplayStart');

  layers.prologue.hidden = true;
  observers.forEach((observer) => observer.callback());
  assert.strictEqual(platform.getDebugState().playing, true, 'closing prologue must start gameplay');

  layers['settings-layer'].hidden = false;
  observers.forEach((observer) => observer.callback());
  layers['settings-layer'].hidden = true;
  observers.forEach((observer) => observer.callback());

  slice.missionStep = 23;
  slice.flags.civilizationComplete = true;
  platform.syncProgress();
  slice.loopNumber = 2;
  slice.missionStep = 11;
  platform.syncProgress();
  sealed = true;
  platform.syncProgress();

  assert.strictEqual(typeof settingsListener, 'function', 'platform settings listener must be installed');
  settingsListener({ muteAudio: false });

  assert.deepStrictEqual(
    calls.filter((entry) => entry === 'loadingStart' || entry === 'loadingStop'),
    ['loadingStart', 'loadingStop']
  );
  assert.deepStrictEqual(
    calls.filter((entry) => entry === 'gameplayStart' || entry === 'gameplayStop'),
    ['gameplayStart', 'gameplayStop', 'gameplayStart', 'gameplayStop']
  );
  assert.ok(calls.includes('progress:0'));
  assert.ok(calls.includes('progress:50'));
  assert.ok(calls.includes('progress:95'));
  assert.ok(calls.includes('progress:100'));
  assert.strictEqual(calls.filter((entry) => entry === 'happytime').length, 1);
  assert.deepStrictEqual(audioStates, [true, true, false]);
  assert.ok(localeStates.every((locale) => locale === 'en-US'));
  assert.strictEqual(platform.getDebugState().playing, false, 'sealed ending must remain stopped');

  console.log('CrazyGames SDK lifecycle, progress, context, and mute smoke passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
