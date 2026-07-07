const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME_FILES = [
  'js/constants.js',
  'js/state.js',
  'js/engine.js',
];

function createGameRuntime() {
  const window = {};
  const context = vm.createContext({
    window,
    console,
    Math,
    JSON,
    setInterval() {
      throw new Error('Balance validation must call GameEngine.tick() directly.');
    },
    clearInterval() {},
  });

  for (const file of GAME_FILES) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return {
    window,
    GC: window.GC,
    GS: window.GameState,
    GE: window.GameEngine,
  };
}

function newGame() {
  const runtime = createGameRuntime();
  const state = runtime.GS.init();
  return { ...runtime, state };
}

module.exports = {
  createGameRuntime,
  newGame,
};
