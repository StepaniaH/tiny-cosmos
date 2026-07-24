// Tiny Cosmos — illustrated prologue controller.
(function () {
  'use strict';

  var SEEN_KEY = 'tiny-cosmos-prologue-seen-v2';
  var PROLOGUE_IMAGE_ROOT = 'assets/prologue/';
  // Flip to true after the 14 production WebP files described in
  // docs/art/prologue-storyboard-prompts.md have been added.
  var PRODUCTION_ART_READY = true;
  var frames = [
    {
      scene: 'collapse', image: 'prologue-01.webp',
      zh: ['上一轮，宇宙失去了形状', '恒星、轨道与最后的信号一同坠入大坍缩。没有胜利者，也没有留下答案。'],
      en: ['The last cosmos lost its shape', 'Stars, orbits, and the final signals fell together into the Big Crunch. It left no victor and no answer.'],
    },
    {
      scene: 'silence', image: 'prologue-02.webp',
      zh: ['坍缩之后，只剩不可读的噪声', '时间仍在经过，但没有结构能证明自己曾经存在。'],
      en: ['Only unreadable noise remained', 'Time still passed, but no structure could prove that it had ever existed.'],
    },
    {
      scene: 'core', image: 'prologue-03.webp',
      zh: ['一枚观测核从黑暗中重新启动', '它无法凭空创造宇宙，只保住了观察、保护，以及记录选择的能力。'],
      en: ['An Observer Core restarted in the dark', 'It cannot create a cosmos from nothing. It retained only the power to observe, protect, and record choices.'],
    },
    {
      scene: 'observer', image: 'prologue-04.webp',
      zh: ['现在，你接管了它', '编号 TC-07。职责不是统治，而是让微弱的可能性有机会成为可持续的现实。'],
      en: ['Now, it is in your care', 'Designation TC-07. Your task is not to rule, but to give fragile possibilities a chance to become sustainable reality.'],
    },
    {
      scene: 'quark', image: 'prologue-05.webp',
      zh: ['最初，只有夸克噪声会回应注视', '一次回应是一枚粒子。重复的回应可以变成生产，生产可以变成稳定。'],
      en: ['At first, only quark noise answers', 'One response becomes one particle. Repeated responses can become production, and production can become stability.'],
    },
    {
      scene: 'layers', image: 'prologue-06.webp',
      zh: ['稳定会把宇宙一层层推向复杂', '夸克形成核子，核子形成原子；随后是分子、细胞、生命，最终也许会出现文明。'],
      en: ['Stability drives the cosmos toward complexity', 'Quarks form nucleons, nucleons form atoms—then molecules, cells, life, and perhaps, at last, civilization.'],
    },
    {
      scene: 'balance', image: 'prologue-07.webp',
      zh: ['但每一次上升，都要由下层承担', '高层会持续消耗低层。真正的进步不是数字暴涨，而是让整条物质链继续运转。'],
      en: ['Every ascent is carried by the layer below', 'Higher layers continuously consume lower ones. Progress is not a spike in numbers, but a matter chain that keeps running.'],
    },
    {
      scene: 'law', image: 'prologue-08.webp',
      zh: ['当结构稳定，你必须决定什么最重要', '推进、维持、求证——你的方法会成为这座宇宙的第一条法则。'],
      en: ['When structure stabilizes, you must set a priority', 'Advance, sustain, or inquire—your method will become this cosmos’s First Law.'],
    },
    {
      scene: 'reverse', image: 'prologue-09.webp',
      zh: ['被排除的可能性并不会消失', '每一个被确定的答案，都会把其他答案推到观测视界的背面。'],
      en: ['Excluded possibilities do not disappear', 'Every answer made real pushes other answers to the reverse side of the observation horizon.'],
    },
    {
      scene: 'contact', image: 'prologue-10.webp',
      zh: ['另一侧也会开始观察你', '它先学习你的资源流，再学习你的选择。第一次接触不是最终战争，而是双方关系的第一份记录。'],
      en: ['The other side will begin observing you', 'It learns your resource flow first, then your choices. First Contact is not the final war, but the first record of a relationship.'],
    },
    {
      scene: 'choice', image: 'prologue-11.webp',
      zh: ['没有一条路线是预设的善恶答案', '集中突破、保护循环、保存证据或改写双方规则，都会留下真实代价，也都会证明一种未来可行。'],
      en: ['No route is a preset moral answer', 'Break through, protect the cycle, preserve evidence, or rewrite both sides. Each has a real cost, and each can prove a future possible.'],
    },
    {
      scene: 'life', image: 'prologue-12.webp',
      zh: ['如果物质链坚持得足够久，选择会进入生命', '环境、压力和被保护的差异会成为谱系记忆，传给尚未出现的后来者。'],
      en: ['If the matter chain endures, choice enters life', 'Environment, pressure, and protected differences become lineage memory for beings not yet born.'],
    },
    {
      scene: 'civilization', image: 'prologue-13.webp',
      zh: ['文明将回读你留下的全部记录', '它不会把你的决定当作命令，而会据此提出自己愿意建造的未来。'],
      en: ['Civilization will read every record you leave', 'It will not treat your decisions as commands. It will use them to propose the future it is willing to build.'],
    },
    {
      scene: 'mission', image: 'prologue-14.webp',
      zh: ['本轮目标：从一枚夸克走到第一座文明', '建立稳定物质，面对视界另一侧，并让文明回答：这个宇宙接下来应该成为什么？'],
      en: ['This loop: from one quark to the first civilization', 'Build stable matter, face the other side of the horizon, and let civilization answer: what should this cosmos become next?'],
    },
  ];

  var activeFrames = frames;
  var activeImageRoot = PROLOGUE_IMAGE_ROOT;
  var activeSeenKey = SEEN_KEY;
  var activeMode = 'prologue';
  var activeKicker = ['序章 · 坍缩后的核', 'Prologue · The Core After Collapse'];

  function routeCopy(signature) {
    var route = signature && signature.dominantRoute;
    var copies = {
      advance: {
        zh: ['你曾证明边界能够被穿越', '另一侧没有继承你的结论。它继承了门曾如何被打开，并学会在高吞吐出现之前关闭它。'],
        en: ['You proved that the horizon could be crossed', 'The other side did not inherit your conclusion. It inherited how the door was opened—and learned to close it before high throughput arrives.'],
      },
      sustain: {
        zh: ['你曾证明对立能够形成循环', '另一侧保留了循环曾如何分配短缺，并开始询问：是谁一直在承担冬天？'],
        en: ['You proved that opposition could form a cycle', 'The other side retained how the cycle distributed scarcity, and began asking: who has always carried winter?'],
      },
      inquiry: {
        zh: ['你曾证明证人能够穿过终结', '另一侧记住了被观察的成本，并学会只在你的焦点离开时行动。'],
        en: ['You proved that a witness could outlast an ending', 'The other side remembered the cost of being observed, and learned to act only when your focus moves away.'],
      },
      rewrite: {
        zh: ['你曾证明矛盾能够共同运行', '另一侧保留了不同的拍点。它将用持续失同步检验共同终结是否真的允许差异。'],
        en: ['You proved that contradictions could run together', 'The other side retained a different beat. It will use persistent desynchronization to test whether a shared ending truly permits difference.'],
      },
      ordinary: {
        zh: ['这次没有答案穿过坍缩', '只有更快的常数起点被回收。方向仍需重新形成，另一侧暂时无法预测你的方法。'],
        en: ['No answer crossed this collapse', 'Only a faster set of constants was recovered. Direction must form again, and the other side cannot yet predict your method.'],
      },
    };
    return copies[route] || copies.ordinary;
  }

  function buildRoundTwoFrames(signature) {
    var routeFrame = routeCopy(signature);
    var routeImages = {
      advance: 'rebirth-r02-06-advance.webp',
      sustain: 'rebirth-r02-06-sustain.webp',
      inquiry: 'rebirth-r02-06-inquiry.webp',
      rewrite: 'rebirth-r02-06-rewrite.webp',
      ordinary: 'references/shared-horizon-master.png',
    };
    var routeImage = routeImages[signature && signature.dominantRoute] || routeImages.ordinary;
    var truthId = signature && signature.truths && signature.truths[0] ? signature.truths[0] : 'constants-can-be-recovered';
    var inheritanceId = signature && signature.equippedInheritance ? signature.equippedInheritance : 'constant-kernel';
    var truthLabels = {
      'horizon-can-open': ['视界可以被再次打开', 'the horizon can be opened again'],
      'closed-cycle-can-endure': ['闭合循环能够跨越终结', 'a closed cycle can endure an ending'],
      'witness-can-outlast-collapse': ['证词能够比坍缩活得更久', 'testimony can outlast collapse'],
      'contradictions-can-cooperate': ['矛盾规则能够共同运行', 'contradictory rules can operate together'],
      'constants-can-be-recovered': ['恒定点能够被回收', 'stable constants can be recovered'],
    };
    var inheritanceLabels = {
      'ember-aperture': ['余烬孔径', 'Ember Aperture'],
      'returning-ring': ['回返环', 'Returning Ring'],
      'witness-lens': ['证人透镜', 'Witness Lens'],
      'phase-braid': ['相位编带', 'Phase Braid'],
      'constant-kernel': ['恒定核', 'Constant Kernel'],
    };
    var truth = truthLabels[truthId] || [truthId, truthId];
    var inheritance = inheritanceLabels[inheritanceId] || [inheritanceId, inheritanceId];
    return [
      {
        scene: 'rebirth-collapse', image: 'rebirth-r02-01.webp',
        zh: ['这一次，坍缩没有抹平全部方向', '完整宇宙仍然归于噪声，但上一轮有一个答案保持了可陈述的形状。'],
        en: ['This collapse did not erase every direction', 'The complete cosmos still became noise, but one answer from the last loop retained a form that could be stated.'],
      },
      {
        scene: 'rebirth-observer', image: 'references/observer-core-rebirth-master.png',
        zh: ['TC-07 带着一道可运行的记忆醒来', '观测核没有保存完整历史，只保住一条已经证明能够成立的规律：' + truth[0] + '。'],
        en: ['TC-07 wakes with a memory that can still run', 'The Core retained no complete history—only one rule already proven capable of holding: ' + truth[1] + '.'],
      },
      {
        scene: 'rebirth-inheritance', image: 'rebirth-r02-03.webp',
        zh: ['继承物把记忆重新接回物质', '“' + inheritance[0] + '”会让某些选择更早出现，也会把上一轮未支付完的代价带进来。'],
        en: ['Inheritance reconnects memory to matter', 'The ' + inheritance[1] + ' makes some choices appear earlier—and carries forward a cost the previous loop did not finish paying.'],
      },
      {
        scene: 'rebirth-bias', image: 'rebirth-r02-04.webp',
        zh: ['最初的物质不再完全中立', '你不必重新学习生产与合成；这一轮首先要测量的，是旧答案如何让某些未来变得更容易。'],
        en: ['Initial matter is no longer entirely neutral', 'You will not relearn production and synthesis. First, measure how the old answer makes some futures easier to reach.'],
      },
      {
        scene: 'rebirth-horizon', image: 'references/shared-horizon-master.png',
        zh: ['视界背面也认出了这个偏差', '另一侧没有保留你的胜利。它保留了可能性曾如何被排除，因此会比第一轮更早试探你。'],
        en: ['The reverse side recognizes the bias too', 'It retained none of your victory. It retained how possibility was excluded, and will test you earlier than before.'],
      },
      {
        scene: 'rebirth-route', image: routeImage,
        zh: routeFrame.zh,
        en: routeFrame.en,
      },
      {
        scene: 'rebirth-mission', image: 'rebirth-r02-07.webp',
        zh: ['本轮目标：让答案经受反例', '建立第二座文明，面对为上轮方法定制的反侧结构，并决定这条真理应被重复、修正，还是交给后来者反驳。'],
        en: ['This loop: make the answer survive a counterexample', 'Build a second civilization, face a reverse structure shaped against your prior method, and decide whether that truth should be repeated, revised, or challenged.'],
      },
    ];
  }

  var root = document.getElementById('prologue');
  if (!root) return;
  var art = document.getElementById('prologue-art');
  var image = document.getElementById('prologue-image');
  var transition = document.getElementById('prologue-transition');
  var languageControl = document.getElementById('prologue-language');
  var current = 0;
  var renderedIndex = -1;
  var timer = null;
  var transitionSwapTimer = null;
  var transitionEndTimer = null;
  var transitioning = false;
  var queuedIndex = null;
  var TRANSITION_SWAP_MS = 210;
  var TRANSITION_TOTAL_MS = 520;

  function isEnglish() { return window.GameI18n && window.GameI18n.getLocale() === 'en'; }
  function copy(zh, en) { return isEnglish() ? en : zh; }

  function stopTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    stopTimer();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || current === activeFrames.length - 1) return;
    timer = setTimeout(function () { go(current + 1); }, 9000);
  }

  function renderDots() {
    var dots = document.getElementById('prologue-dots');
    dots.innerHTML = activeFrames.map(function (_, index) {
      return '<button type="button" data-prologue-index="' + index + '" aria-label="' + copy('前往第 ' + (index + 1) + ' 幕', 'Go to scene ' + (index + 1)) + '"' + (index === current ? ' aria-current="step"' : '') + (transitioning ? ' disabled' : '') + '></button>';
    }).join('');
  }

  function renderLanguageControl() {
    if (!languageControl) return;
    var locale = isEnglish() ? 'en' : 'zh-CN';
    languageControl.querySelectorAll('[data-prologue-locale]').forEach(function (button) {
      var selected = button.dataset.prologueLocale === locale;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function clearTransition() {
    if (transitionSwapTimer) clearTimeout(transitionSwapTimer);
    if (transitionEndTimer) clearTimeout(transitionEndTimer);
    transitionSwapTimer = null;
    transitionEndTimer = null;
    transitioning = false;
    queuedIndex = null;
    root.classList.remove('is-transitioning');
    if (transition) transition.classList.remove('is-active');
  }

  function setTransitionControls(disabled) {
    var previous = document.getElementById('prologue-prev');
    var next = document.getElementById('prologue-next');
    previous.disabled = disabled || current === 0;
    next.disabled = !!disabled;
    document.querySelectorAll('#prologue-dots button').forEach(function (button) {
      button.disabled = !!disabled;
    });
  }

  function preloadActiveFrames() {
    if (!(activeMode === 'rebirth' || PRODUCTION_ART_READY)) return;
    activeFrames.forEach(function (frame) {
      if (!frame.image) return;
      var preload = new Image();
      preload.src = activeImageRoot + frame.image;
    });
  }

  function playTransition(direction, nextIndex) {
    if (!transition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderFrame(nextIndex, true);
      return;
    }
    stopTimer();
    transitioning = true;
    queuedIndex = null;
    root.classList.add('is-transitioning');
    transition.dataset.direction = direction < 0 ? 'prev' : 'next';
    transition.classList.remove('is-active');
    void transition.offsetWidth;
    transition.classList.add('is-active');

    setTransitionControls(true);
    transitionSwapTimer = setTimeout(function () {
      transitionSwapTimer = null;
      renderFrame(nextIndex, false);
      setTransitionControls(true);
    }, TRANSITION_SWAP_MS);

    transitionEndTimer = setTimeout(function () {
      transitionEndTimer = null;
      transition.classList.remove('is-active');
      root.classList.remove('is-transitioning');
      transitioning = false;
      setTransitionControls(false);
      schedule();
      if (queuedIndex !== null && queuedIndex !== current) {
        var queued = queuedIndex;
        queuedIndex = null;
        go(queued);
      } else {
        queuedIndex = null;
      }
    }, TRANSITION_TOTAL_MS);
  }

  function renderFrame(index, shouldSchedule) {
    current = Math.max(0, Math.min(activeFrames.length - 1, index));
    var frame = activeFrames[current];
    art.classList.remove('prologue-art-enter');
    void art.offsetWidth;
    art.classList.add('prologue-art-enter');
    art.dataset.scene = frame.scene;
    art.classList.remove('image-loaded');
    image.onload = function () { art.classList.add('image-loaded'); art.dataset.imageState = 'ready'; };
    image.onerror = function () { art.classList.remove('image-loaded'); art.dataset.imageState = 'placeholder'; };
    if (frame.image && (activeMode === 'rebirth' || PRODUCTION_ART_READY)) {
      art.dataset.imageState = 'loading';
      image.src = activeImageRoot + frame.image;
    } else {
      art.dataset.imageState = 'placeholder';
      image.removeAttribute('src');
    }
    document.getElementById('prologue-index').textContent = String(current + 1).padStart(2, '0') + ' / ' + activeFrames.length;
    document.getElementById('prologue-title').textContent = isEnglish() ? frame.en[0] : frame.zh[0];
    document.getElementById('prologue-body').textContent = isEnglish() ? frame.en[1] : frame.zh[1];
    document.getElementById('prologue-kicker').textContent = copy(activeKicker[0], activeKicker[1]);
    document.getElementById('prologue-skip').textContent = activeMode === 'rebirth' ? copy('跳过重生记录', 'Skip Rebirth Record') : copy('跳过序章', 'Skip Prologue');
    document.getElementById('prologue-prev').textContent = copy('上一幕', 'Previous');
    document.getElementById('prologue-prev').disabled = current === 0;
    document.getElementById('prologue-next').textContent = current === activeFrames.length - 1
      ? (activeMode === 'rebirth' ? copy('进入第二轮', 'Enter Loop Two') : copy('开始观测', 'Begin Observation'))
      : copy('下一幕', 'Next');
    renderLanguageControl();
    renderDots();
    renderedIndex = current;
    if (transitioning) setTransitionControls(true);
    if (shouldSchedule !== false) schedule();
  }

  function go(index) {
    var nextIndex = Math.max(0, Math.min(activeFrames.length - 1, index));
    if (nextIndex === renderedIndex) {
      renderFrame(nextIndex, !transitioning);
      return;
    }
    if (transitioning) {
      queuedIndex = nextIndex;
      return;
    }
    if (renderedIndex === -1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderFrame(nextIndex, true);
      return;
    }
    playTransition(nextIndex - renderedIndex, nextIndex);
  }

  function markSeen() {
    try { localStorage.setItem(activeSeenKey, '1'); } catch (error) {}
  }

  function close() {
    if (root.hidden) return;
    stopTimer();
    clearTransition();
    markSeen();
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('prologue-open');
    document.dispatchEvent(new CustomEvent('tinycosmos:prologueclose'));
    var canvas = document.getElementById('cosmos-canvas');
    if (canvas) canvas.focus({ preventScroll: true });
  }

  function openActive(force) {
    if (!force) {
      try { if (localStorage.getItem(activeSeenKey) === '1') return false; } catch (error) {}
      if (new URLSearchParams(window.location.search).get('skipIntro') === '1') return false;
      if (new URLSearchParams(window.location.search).has('fixture')) return false;
    }
    current = 0;
    renderedIndex = -1;
    clearTransition();
    preloadActiveFrames();
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('prologue-open');
    document.dispatchEvent(new CustomEvent('tinycosmos:prologueopen'));
    go(0);
    setTimeout(function () { document.getElementById('prologue-next').focus(); }, 30);
    return true;
  }

  function open(force) {
    activeFrames = frames;
    activeImageRoot = PROLOGUE_IMAGE_ROOT;
    activeSeenKey = SEEN_KEY;
    activeMode = 'prologue';
    activeKicker = ['序章 · 坍缩后的核', 'Prologue · The Core After Collapse'];
    return openActive(force);
  }

  function openRebirth(signature) {
    activeFrames = buildRoundTwoFrames(signature || {});
    activeImageRoot = 'assets/rebirth/';
    activeSeenKey = 'tiny-cosmos-rebirth-loop-2-seen-v1';
    activeMode = 'rebirth';
    activeKicker = ['第二轮 · 回声有了方向', 'Loop Two · The Echo Chose a Direction'];
    return openActive(true);
  }

  document.getElementById('prologue-prev').addEventListener('click', function () { go(current - 1); });
  document.getElementById('prologue-next').addEventListener('click', function () {
    if (current === activeFrames.length - 1) close(); else go(current + 1);
  });
  document.getElementById('prologue-skip').addEventListener('click', close);
  languageControl.addEventListener('click', function (event) {
    var target = event.target.closest('[data-prologue-locale]');
    if (!target || !window.GameI18n) return;
    window.GameI18n.setLocale(target.dataset.prologueLocale);
  });
  document.getElementById('prologue-dots').addEventListener('click', function (event) {
    var target = event.target.closest('[data-prologue-index]');
    if (target) go(parseInt(target.dataset.prologueIndex, 10));
  });
  root.addEventListener('pointermove', schedule);
  document.addEventListener('keydown', function (event) {
    if (root.hidden) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); current === activeFrames.length - 1 ? close() : go(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
    if (event.key === 'Escape') close();
  });
  document.addEventListener('tinycosmos:localechange', function () { if (!root.hidden) go(current); });

  window.GamePrologue = {
    open: function () { open(true); },
    openRebirth: openRebirth,
    close: close,
    frames: frames.slice(),
    buildRoundTwoFrames: buildRoundTwoFrames,
  };
  open(false);
})();
