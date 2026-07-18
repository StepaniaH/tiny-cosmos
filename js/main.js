// tiny-cosmos v2 — Main Entry
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;
  var UI = window.GameUI;
  var Renderer = window.CanvasRenderer;

  var autosaveTimer = null;
  var lastUiRefresh = 0;
  var UI_REFRESH_MS = 250;

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
    if (!loadGame()) GS.init({ firstContact: true });
    if (window.GameSlice) window.GameSlice.init();

    // Engine tick: keep simulation at 20/s, but redraw DOM HUD at 4/s.
    GE.onTick(function () {
      Renderer.flushClicks();  // apply accumulated clicks as quark production
      var now = Date.now();
      if (now - lastUiRefresh >= UI_REFRESH_MS) {
        UI.refreshAll();
        lastUiRefresh = now;
      }
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
      b.textContent = '已保存'; setTimeout(function () { b.textContent = '保存'; }, 1200);
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function () {
      if (confirm('重启当前第一次接触宇宙？本竖切存档会被清除。')) {
        GE.stop();
        GS.init({ firstContact: true });
        if (window.GameSlice) window.GameSlice.init();
        try { localStorage.removeItem(GC.SAVE_KEY); } catch (e) {}
        UI.refreshAll();
        GE.start();
      }
    });

    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        Renderer.flushClicks();
        saveGame();
        GE.stop();
      } else {
        GE.start();
        UI.refreshAll();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
