// tiny-cosmos — Main Entry
// Initialize game state, start loop, handle save/load.
(function () {
  'use strict';

  var GS = window.GameState;
  var GE = window.GameEngine;
  var UI = window.GameUI;
  var Renderer = window.CanvasRenderer;

  var autosaveTimer = null;

  // ── Save / Load ─────────────────────────────────────────────────

  function saveGame() {
    try {
      localStorage.setItem(window.GC.SAVE_KEY, GS.toJSON());
    } catch (e) {
      // localStorage full or unavailable — silently ignore
    }
  }

  function loadGame() {
    try {
      var json = localStorage.getItem(window.GC.SAVE_KEY);
      if (json) {
        return GS.fromJSON(json);
      }
    } catch (e) {
      // corrupted save — ignore
    }
    return false;
  }

  function startAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(saveGame, window.GC.AUTOSAVE_MS);
  }

  // ── Init ────────────────────────────────────────────────────────

  function init() {
    // Try to load saved game
    var loaded = loadGame();
    if (!loaded) {
      GS.init();
    }

    // Start engine
    GE.start();

    // Wire UI refresh to engine tick
    GE.onTick(function () {
      UI.refreshAll();
    });

    // Init UI (initial render + event bindings)
    UI.init();

    // Init and start Canvas renderer
    Renderer.init('cosmos-canvas');
    Renderer.start();

    // Start autosave
    startAutosave();

    // Save button
    document.getElementById('save-btn').addEventListener('click', function () {
      saveGame();
      // Brief visual feedback
      var btn = document.getElementById('save-btn');
      var orig = btn.textContent;
      btn.textContent = '✅ 已保存';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function () {
      if (confirm('确定要重置所有进度吗？此操作不可撤销。\n\nReset all progress? This cannot be undone.')) {
        GE.stop();
        GS.init();
        try { localStorage.removeItem(window.GC.SAVE_KEY); } catch (e) {}
        UI.refreshAll();
        GE.start();
      }
    });

    // Save on page unload
    window.addEventListener('beforeunload', saveGame);
  }

  // ── Boot ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
