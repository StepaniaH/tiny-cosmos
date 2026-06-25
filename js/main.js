// tiny-cosmos v2 — Main Entry
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;
  var UI = window.GameUI;
  var Renderer = window.CanvasRenderer;

  var autosaveTimer = null;

  // ── Save / Load ──
  function saveGame() {
    try { localStorage.setItem(GC.SAVE_KEY, GS.toJSON()); } catch (e) {}
  }
  function loadGame() {
    try {
      var json = localStorage.getItem(GC.SAVE_KEY);
      if (json) return GS.fromJSON(json);
    } catch (e) {}
    return false;
  }
  function startAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(saveGame, GC.AUTOSAVE_MS);
  }

  // ── Init ──
  function init() {
    // Load or new game
    if (!loadGame()) GS.init();

    // Engine tick: flush canvas clicks, then refresh UI
    GE.onTick(function () {
      Renderer.flushClicks();  // apply accumulated clicks as quark production
      UI.refreshAll();          // throttle to ~10fps internally
    });

    GE.start();

    // Canvas renderer
    Renderer.init('cosmos-canvas');
    Renderer.start();

    // UI (event bindings + initial render)
    UI.init();

    startAutosave();

    // Save button
    document.getElementById('save-btn').addEventListener('click', function () {
      saveGame();
      var b = document.getElementById('save-btn');
      b.textContent = '✅'; setTimeout(function () { b.textContent = '💾'; }, 1200);
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function () {
      if (confirm('重置所有进度？此操作不可撤销。')) {
        GE.stop();
        GS.init();
        try { localStorage.removeItem(GC.SAVE_KEY); } catch (e) {}
        UI.refreshAll();
        GE.start();
      }
    });

    window.addEventListener('beforeunload', saveGame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
