// tiny-cosmos — Lightweight, gesture-driven event audio
(function () {
  'use strict';

  var STORAGE_KEY = 'tiny-cosmos-audio-muted';
  var BASE = 'assets/audio/sfx/';
  var FILES = {
    'ui-manual-pulse': 'ui-manual-pulse.mp3',
    'ui-producer-built': 'ui-producer-built.mp3',
    'ui-focus-lock': 'ui-focus-lock.mp3',
    'ui-focus-release': 'ui-focus-release.mp3',
    'ui-reserve-on': 'ui-reserve-on.mp3',
    'ui-reserve-warning': 'ui-reserve-warning.mp3',
    'ui-research-threshold': 'ui-research-threshold.mp3',
    'ui-tier-unlock': 'ui-tier-unlock.mp3',
    'discovery-quark-echo': 'discovery-quark-echo.mp3',
    'discovery-nucleon-silence': 'discovery-nucleon-silence.mp3',
    'discovery-missing-description': 'discovery-missing-description.mp3',
    'contact-warning': 'contact-warning.mp3',
    'contact-attach': 'contact-attach.mp3',
    'contact-siphon': 'contact-siphon.mp3',
    'contact-overload': 'contact-overload.mp3',
    'contact-cutoff': 'contact-cutoff.mp3',
    'contact-observe': 'contact-observe.mp3',
    'afterimage-fuel': 'afterimage-fuel.mp3',
    'afterimage-return': 'afterimage-return.mp3',
    'afterimage-archive': 'afterimage-archive.mp3',
  };
  var CATEGORY_VOLUME = {
    ui: 0.2,
    discovery: 0.24,
    contact: 0.27,
    afterimage: 0.25,
  };
  var players = {};
  var muted = true;

  try {
    var storedPreference = window.localStorage.getItem(STORAGE_KEY);
    muted = storedPreference === null ? true : storedPreference !== '0';
  } catch (error) {
    muted = true;
  }

  function category(id) {
    return id.split('-')[0];
  }

  function getPlayer(id) {
    if (!FILES[id] || typeof window.Audio !== 'function') return null;
    if (!players[id]) {
      var player = new window.Audio(BASE + FILES[id]);
      player.preload = 'none';
      player.volume = CATEGORY_VOLUME[category(id)] || 0.2;
      players[id] = player;
    }
    return players[id];
  }

  function play(id) {
    if (muted) return false;
    var player = getPlayer(id);
    if (!player) return false;
    try {
      player.pause();
      player.currentTime = 0;
      var promise = player.play();
      if (promise && typeof promise.catch === 'function') promise.catch(function () {});
      return true;
    } catch (error) {
      return false;
    }
  }

  function setMuted(value) {
    muted = !!value;
    Object.keys(players).forEach(function (id) {
      if (muted) players[id].pause();
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch (error) {
      // Audio preferences remain in memory if storage is unavailable.
    }
    return muted;
  }

  window.GameAudio = {
    play: play,
    isMuted: function () { return muted; },
    setMuted: setMuted,
    toggleMuted: function () { return setMuted(!muted); },
    getFiles: function () { return Object.assign({}, FILES); },
  };
})();
