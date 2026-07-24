// tiny-cosmos v2 — Main Entry
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var GE = window.GameEngine;
  var UI = window.GameUI;
  var Renderer = window.CanvasRenderer;
  var I18n = window.GameI18n;

  var autosaveTimer = null;
  var lastUiRefresh = 0;
  var UI_REFRESH_MS = 250;
  var WALL_CLOCK_KEY = GC.SAVE_KEY + '-wall-clock-v1';

  // ── Save / Load ──
  function writeWallClock(value) {
    try { localStorage.setItem(WALL_CLOCK_KEY, String(value || Date.now())); } catch (e) {}
  }
  function readWallClock() {
    try {
      var value = Number(localStorage.getItem(WALL_CLOCK_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch (e) {
      return null;
    }
  }
  function saveGame(options) {
    try { localStorage.setItem(GC.SAVE_KEY, GS.toJSON()); } catch (e) {}
    if (!options || options.updateClock !== false) writeWallClock(Date.now());
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
  function stopAutosave() {
    if (!autosaveTimer) return;
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
  function applyBackgroundProgress() {
    var lastWallClock = readWallClock();
    var now = Date.now();
    writeWallClock(now);
    if (!lastWallClock || lastWallClock > now) {
      return { requestedSeconds: 0, simulatedSeconds: 0, capped: false };
    }
    var result = GE.advanceTime((now - lastWallClock) / 1000);
    saveGame();
    return result;
  }

  window.TinyCosmos = window.TinyCosmos || {};
  window.TinyCosmos.saveGame = saveGame;

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

    // Canvas renderer
    Renderer.init('cosmos-canvas');
    Renderer.start();

    // UI (event bindings + initial render)
    UI.init();

    var prologueOpen = document.body.classList.contains('prologue-open');
    if (prologueOpen) {
      // Reading illustrated records is an intentional pause, not idle progress.
      writeWallClock(Date.now());
    } else {
      var initialBackground = applyBackgroundProgress();
      GE.start();
      if (UI.notifyBackgroundProgress) UI.notifyBackgroundProgress(initialBackground);
    }

    startAutosave();

    // Save button
    document.getElementById('save-btn').addEventListener('click', function () {
      saveGame();
      var b = document.getElementById('save-btn');
      b.textContent = '已保存'; setTimeout(function () { b.textContent = '保存'; }, 1200);
      if (I18n) I18n.apply(document.body);
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function () {
      var resetCopy = I18n
        ? I18n.text('重启当前第一次接触宇宙？本轮存档会被清除。', 'Restart the current First Contact cosmos? This loop save will be erased.')
        : '重启当前第一次接触宇宙？本轮存档会被清除。';
      if (confirm(resetCopy)) {
        GE.stop();
        GS.init({ firstContact: true });
        if (window.GameSlice) window.GameSlice.init();
        try { localStorage.removeItem(GC.SAVE_KEY); } catch (e) {}
        try { localStorage.removeItem(WALL_CLOCK_KEY); } catch (e) {}
        writeWallClock(Date.now());
        UI.refreshAll();
        if (!document.body.classList.contains('prologue-open')) GE.start();
      }
    });

    document.addEventListener('tinycosmos:prologueopen', function () {
      Renderer.flushClicks();
      saveGame();
      GE.stop();
    });
    document.addEventListener('tinycosmos:prologueclose', function () {
      // Do not turn time spent reading the prologue or rebirth record into
      // production; background progress starts from this moment.
      writeWallClock(Date.now());
      lastUiRefresh = 0;
      if (UI.revealGuide) UI.revealGuide();
      UI.refreshAll();
      if (!document.hidden) GE.start();
    });

    window.addEventListener('beforeunload', function () {
      saveGame({ updateClock: !document.hidden });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        Renderer.flushClicks();
        stopAutosave();
        saveGame();
        GE.stop();
      } else {
        if (!document.body.classList.contains('prologue-open')) {
          var background = applyBackgroundProgress();
          GE.start();
          if (UI.notifyBackgroundProgress) UI.notifyBackgroundProgress(background);
        } else {
          writeWallClock(Date.now());
        }
        UI.refreshAll();
        startAutosave();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
