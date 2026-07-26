// Tiny Cosmos — CrazyGames SDK v3 adapter.
// All platform calls are optional and fail closed so the standalone build keeps
// working when the SDK is unavailable or disabled on a non-CrazyGames host.
(function () {
  'use strict';

  var sdk = null;
  var environment = 'unavailable';
  var initialized = false;
  var enabled = false;
  var loaded = false;
  var playable = false;
  var playing = false;
  var loadingStarted = false;
  var loadingStopped = false;
  var adInFlight = false;
  var pauseReasons = Object.create(null);
  var lastProgress = null;
  var lastContext = '';
  var firstCivilizationKnown = null;
  var settingsListener = null;
  var blockerObserver = null;
  var readyResolve = null;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });
  var BLOCKING_LAYERS = ['prologue', 'settings-layer', 'lore-layer', 'log-layer'];

  function safely(callback) {
    try {
      return callback();
    } catch (error) {
      if (window.console && console.warn) console.warn('[Tiny Cosmos] CrazyGames SDK call skipped:', error);
      return undefined;
    }
  }

  function finishInitialization(result) {
    if (initialized) return;
    initialized = true;
    if (result && result.sdk) {
      sdk = result.sdk;
      environment = sdk.environment || 'disabled';
      enabled = environment === 'local' || environment === 'crazygames';
    } else {
      environment = result && result.environment ? result.environment : 'unavailable';
      enabled = false;
    }

    if (enabled) {
      safely(function () {
        sdk.game.loadingStart();
        loadingStarted = true;
      });
      installSettingsListener();
      applyPlatformLocale();
      applyAudioSettings();
      if (loaded) stopLoading();
    }

    readyResolve({ enabled: enabled, environment: environment });
    syncProgress({ initial: true });
    updateGameplayState();
  }

  function initialize() {
    var candidate = window.CrazyGames && window.CrazyGames.SDK;
    if (!candidate || typeof candidate.init !== 'function') {
      finishInitialization({ environment: 'unavailable' });
      return;
    }

    var settled = false;
    var timeout = window.setTimeout(function () {
      if (settled) return;
      settled = true;
      finishInitialization({ environment: 'timeout' });
    }, 5000);

    Promise.resolve().then(function () {
      return candidate.init();
    }).then(function () {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      finishInitialization({ sdk: candidate });
    }).catch(function () {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      finishInitialization({ environment: 'init-error' });
    });
  }

  function stopLoading() {
    if (!enabled || !loadingStarted || loadingStopped) return;
    safely(function () { sdk.game.loadingStop(); });
    loadingStopped = true;
  }

  function applyPlatformLocale() {
    if (!enabled || !window.GameI18n || !window.GameI18n.setAutomaticLocale) return;
    var info = safely(function () { return sdk.user.systemInfo; });
    window.GameI18n.setAutomaticLocale(info && info.locale ? info.locale : 'en');
  }

  function applyAudioSettings(settings) {
    if (!window.GameAudio || !window.GameAudio.setPlatformMuted) return;
    var current = settings;
    if (!current && enabled) current = safely(function () { return sdk.game.settings; });
    window.GameAudio.setPlatformMuted(!!(current && current.muteAudio));
  }

  function installSettingsListener() {
    if (!enabled || !sdk.game || typeof sdk.game.addSettingsChangeListener !== 'function') return;
    settingsListener = function (newSettings) { applyAudioSettings(newSettings); };
    safely(function () { sdk.game.addSettingsChangeListener(settingsListener); });
  }

  function hasBlockingLayer() {
    return BLOCKING_LAYERS.some(function (id) {
      var layer = document.getElementById(id);
      return !!(layer && !layer.hidden);
    });
  }

  function isSealed() {
    return !!(window.GameState && window.GameState.isLoopSealed && window.GameState.isLoopSealed());
  }

  function hasPauseReason() {
    return Object.keys(pauseReasons).some(function (reason) { return pauseReasons[reason]; });
  }

  function shouldPlay() {
    return playable && !isSealed() && !hasBlockingLayer() && !hasPauseReason();
  }

  function updateGameplayState() {
    if (!enabled || !initialized) return;
    var nextPlaying = shouldPlay();
    if (nextPlaying === playing) return;
    safely(function () {
      if (nextPlaying) sdk.game.gameplayStart();
      else sdk.game.gameplayStop();
    });
    playing = nextPlaying;
  }

  function observeBlockingLayers() {
    if (blockerObserver || typeof MutationObserver !== 'function') return;
    var layers = BLOCKING_LAYERS.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!layers.length) return;
    blockerObserver = new MutationObserver(updateGameplayState);
    layers.forEach(function (layer) {
      blockerObserver.observe(layer, { attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
    });
  }

  function getProgressModel() {
    if (!window.GameState || !window.GameState.getSlice) return null;
    var slice = window.GameState.getSlice();
    if (!slice) return null;
    var loop = Number(slice.loopNumber) === 2 ? 2 : 1;
    var step = Math.max(0, Number(slice.missionStep) || 0);
    var sealed = isSealed();
    var progress = sealed
      ? 100
      : loop === 2
        ? 50 + Math.round(Math.min(step, 11) / 11 * 45)
        : Math.round(Math.min(step, 23) / 23 * 50);
    var mission = window.GameSlice && window.GameSlice.getMission ? window.GameSlice.getMission() : null;
    var campaign = window.GameState.getCampaignStatus ? window.GameState.getCampaignStatus() : null;
    return {
      progress: progress,
      loop: loop,
      step: step,
      code: mission && mission.code ? mission.code : 'unknown',
      phase: campaign && campaign.phase ? campaign.phase : (sealed ? 'sealed' : 'active'),
      civilizationComplete: !!(slice.flags && slice.flags.civilizationComplete),
    };
  }

  function syncProgress(options) {
    var model = getProgressModel();
    if (!model) return;

    if (firstCivilizationKnown === null || (options && options.initial)) {
      firstCivilizationKnown = model.loop === 1 && model.civilizationComplete;
    } else if (!firstCivilizationKnown && model.loop === 1 && model.civilizationComplete) {
      firstCivilizationKnown = true;
      if (enabled) safely(function () { sdk.game.happytime(); });
    } else if (model.loop === 1 && !model.civilizationComplete) {
      firstCivilizationKnown = false;
    }

    if (!enabled) return;
    if (lastProgress !== model.progress) {
      safely(function () { sdk.game.reportGameCompletedPercentage(model.progress); });
      lastProgress = model.progress;
    }

    var locale = window.GameI18n ? window.GameI18n.getLocale() : 'en';
    var context = {
      loop: String(model.loop),
      missionStep: String(model.step),
      missionCode: String(model.code),
      phase: String(model.phase),
      locale: String(locale),
    };
    var signature = JSON.stringify(context);
    if (signature !== lastContext) {
      safely(function () { sdk.game.setGameContext(context); });
      lastContext = signature;
    }
    updateGameplayState();
  }

  function markLoaded() {
    loaded = true;
    if (!initialized) return;
    applyPlatformLocale();
    applyAudioSettings();
    stopLoading();
  }

  function markPlayable() {
    playable = true;
    observeBlockingLayers();
    syncProgress({ initial: true });
    updateGameplayState();
  }

  function pause(reason) {
    pauseReasons[reason || 'game'] = true;
    updateGameplayState();
  }

  function resume(reason) {
    delete pauseReasons[reason || 'game'];
    updateGameplayState();
  }

  // Kept as a safe Full-launch hook. Basic Launch does not expose or request ads.
  function requestMidgameAd() {
    if (!enabled || adInFlight || !sdk.ad || typeof sdk.ad.requestAd !== 'function') {
      return Promise.resolve({ shown: false, reason: enabled ? 'unavailable' : 'disabled' });
    }
    adInFlight = true;
    var engineWasRunning = !!(window.GameEngine && window.GameEngine.isRunning && window.GameEngine.isRunning());
    pause('midgame-ad');
    return new Promise(function (resolve) {
      var completed = false;
      var complete = function (result) {
        if (completed) return;
        completed = true;
        if (window.GameAudio && window.GameAudio.setAdMuted) window.GameAudio.setAdMuted(false);
        adInFlight = false;
        resume('midgame-ad');
        if (engineWasRunning && window.GameEngine && window.GameEngine.start && !document.hidden && !isSealed()) {
          window.GameEngine.start();
        }
        resolve(result);
      };
      try {
        sdk.ad.requestAd('midgame', {
          adStarted: function () {
            if (window.GameAudio && window.GameAudio.setAdMuted) window.GameAudio.setAdMuted(true);
            if (window.GameEngine && window.GameEngine.stop) window.GameEngine.stop();
          },
          adFinished: function () { complete({ shown: true }); },
          adError: function (error) { complete({ shown: false, reason: error || 'ad-error' }); },
        });
      } catch (error) {
        complete({ shown: false, reason: error || 'ad-error' });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', observeBlockingLayers);
  document.addEventListener('tinycosmos:localechange', function () { syncProgress(); });
  document.addEventListener('tinycosmos:audioready', function () { applyAudioSettings(); });

  window.TinyCosmosPlatform = {
    ready: ready,
    markLoaded: markLoaded,
    markPlayable: markPlayable,
    syncProgress: syncProgress,
    pause: pause,
    resume: resume,
    refreshAudioSettings: applyAudioSettings,
    requestMidgameAd: requestMidgameAd,
    getDebugState: function () {
      return {
        initialized: initialized,
        enabled: enabled,
        environment: environment,
        loaded: loaded,
        playable: playable,
        playing: playing,
        progress: lastProgress,
        blockedByLayer: hasBlockingLayer(),
        pauseReasons: Object.keys(pauseReasons),
      };
    },
  };

  initialize();
})();
