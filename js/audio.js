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
  var userMuted = true;
  var platformMuted = false;
  var adMuted = false;

  try {
    var storedPreference = window.localStorage.getItem(STORAGE_KEY);
    userMuted = storedPreference === null ? true : storedPreference !== '0';
  } catch (error) {
    userMuted = true;
  }

  function isMuted() {
    return userMuted || platformMuted || adMuted;
  }

  function announceState() {
    document.dispatchEvent(new CustomEvent('tinycosmos:audiostatechange', {
      detail: {
        muted: isMuted(),
        userMuted: userMuted,
        platformMuted: platformMuted,
        adMuted: adMuted,
      },
    }));
  }

  function stopPlayersIfMuted() {
    if (!isMuted()) return;
    Object.keys(players).forEach(function (id) { players[id].pause(); });
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
    if (isMuted()) return false;
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
    userMuted = !!value;
    stopPlayersIfMuted();
    try {
      window.localStorage.setItem(STORAGE_KEY, userMuted ? '1' : '0');
    } catch (error) {
      // Audio preferences remain in memory if storage is unavailable.
    }
    announceState();
    return isMuted();
  }

  function setPlatformMuted(value) {
    platformMuted = !!value;
    stopPlayersIfMuted();
    announceState();
    return isMuted();
  }

  function setAdMuted(value) {
    adMuted = !!value;
    stopPlayersIfMuted();
    announceState();
    return isMuted();
  }

  window.GameAudio = {
    play: play,
    isMuted: isMuted,
    isUserMuted: function () { return userMuted; },
    isPlatformMuted: function () { return platformMuted; },
    isAdMuted: function () { return adMuted; },
    setMuted: setMuted,
    setPlatformMuted: setPlatformMuted,
    setAdMuted: setAdMuted,
    toggleMuted: function () { return setMuted(!userMuted); },
    getFiles: function () { return Object.assign({}, FILES); },
  };

  document.dispatchEvent(new CustomEvent('tinycosmos:audioready'));
})();
