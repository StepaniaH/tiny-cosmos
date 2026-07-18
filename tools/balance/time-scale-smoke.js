const { createGameRuntime } = require('./load-game');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = createGameRuntime();
game.GS.init({ firstContact: true });
game.window.GameSlice.init();

const startElapsed = game.GS.getSlice().elapsedSeconds;
game.GE.setTimeScale(100);
game.GE.tick();
assert(game.GE.getTimeScale() === 100, 'Test time scale did not switch to 100x');
assert(Math.abs(game.GS.getSlice().elapsedSeconds - startElapsed - 5) < 0.0001, 'One accelerated engine tick did not simulate 100 steps');
assert(game.GS.getState().tickCount === 100, 'Accelerated engine tick count is incorrect');

game.GE.setTimeScale(1);
game.GE.tick();
assert(game.GE.getTimeScale() === 1, 'Test time scale did not return to 1x');
assert(game.GS.getState().tickCount === 101, 'Normal engine tick did not resume at one step');

console.log(JSON.stringify({
  acceleratedElapsedSeconds: game.GS.getSlice().elapsedSeconds - startElapsed,
  finalTickCount: game.GS.getState().tickCount,
  finalTimeScale: game.GE.getTimeScale(),
}, null, 2));
