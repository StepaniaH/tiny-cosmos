// Tiny Cosmos — settings dialog and persisted readability preferences.
(function () {
  'use strict';

  var SCALE_KEY = 'tiny-cosmos-text-scale-v1';
  var layer = document.getElementById('settings-layer');
  if (!layer) return;
  var lastFocus = null;
  var scale = 'comfortable';
  try {
    var saved = localStorage.getItem(SCALE_KEY);
    if (saved === 'large') scale = saved;
  } catch (error) {}

  function applyScale(next) {
    scale = next === 'large' ? 'large' : 'comfortable';
    document.documentElement.dataset.textScale = scale;
    try { localStorage.setItem(SCALE_KEY, scale); } catch (error) {}
    updateControls();
  }

  function updateControls() {
    var locale = window.GameI18n ? window.GameI18n.getLocale() : 'en';
    layer.querySelectorAll('[data-locale]').forEach(function (button) {
      var selected = button.dataset.locale === locale;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    layer.querySelectorAll('[data-text-scale]').forEach(function (button) {
      var selected = button.dataset.textScale === scale;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function open() {
    lastFocus = document.activeElement;
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    updateControls();
    if (window.GameI18n) window.GameI18n.apply(layer);
    document.getElementById('settings-close').focus();
  }

  function close() {
    if (layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.getElementById('settings-btn').addEventListener('click', open);
  document.getElementById('settings-close').addEventListener('click', close);
  document.getElementById('settings-backdrop').addEventListener('click', close);
  document.getElementById('language-control').addEventListener('click', function (event) {
    var button = event.target.closest('[data-locale]');
    if (!button || !window.GameI18n) return;
    window.GameI18n.setLocale(button.dataset.locale);
    if (window.GameUI) window.GameUI.refreshAll();
    window.GameI18n.apply(document.body);
    updateControls();
  });
  document.getElementById('text-scale-control').addEventListener('click', function (event) {
    var button = event.target.closest('[data-text-scale]');
    if (button) applyScale(button.dataset.textScale);
  });
  document.getElementById('replay-prologue').addEventListener('click', function () {
    close();
    if (window.GamePrologue) window.GamePrologue.open();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !layer.hidden) close();
  });
  document.addEventListener('tinycosmos:localechange', updateControls);

  applyScale(scale);
  updateControls();
  window.GameSettings = { open: open, close: close };
})();
