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
      zh: ['上一个宇宙已经结束', '恒星、轨道和最后一段通信一起坠入黑暗。没有胜利者，也没有答案。'],
      en: ['The last cosmos has ended', 'Stars, orbits, and the final transmission fell into darkness together. It left no victor and no answer.'],
    },
    {
      scene: 'silence', image: 'prologue-02.webp',
      zh: ['黑暗里还有一段信号', '它很微弱，却一直重复。像有什么东西不肯忘记刚才发生过什么。'],
      en: ['A signal remains in the dark', 'It is faint, but it keeps repeating—as if something refuses to forget what just happened.'],
    },
    {
      scene: 'core', image: 'prologue-03.webp',
      zh: ['你在信号里醒来', '你不知道自己是什么，只知道你能观察、保护，并让极小的变化偏向一个方向。'],
      en: ['You wake inside the signal', 'You do not know what you are. You only know that you can observe, protect, and nudge small changes in one direction.'],
    },
    {
      scene: 'observer', image: 'prologue-04.webp',
      zh: ['系统把你标记为 TC-07', '这也许是设备编号，也许不是。没有记录能回答：究竟是谁在这里观察。'],
      en: ['The system labels you TC-07', 'It may be a device number—or it may not. No surviving record can say who is observing here.'],
    },
    {
      scene: 'quark', image: 'prologue-05.webp',
      zh: ['物质会回应你的操作', '先点亮一枚夸克。重复几次，再让生产单元接过这份工作。'],
      en: ['Matter responds to your actions', 'Light one quark first. Repeat it a few times, then let production units take over.'],
    },
    {
      scene: 'layers', image: 'prologue-06.webp',
      zh: ['先让变化持续下去', '夸克形成核子，核子形成原子。再往后，才可能出现分子、细胞、生命和文明。'],
      en: ['First, make change last', 'Quarks form nucleons, and nucleons form atoms. Only then can molecules, cells, life, and civilization appear.'],
    },
    {
      scene: 'balance', image: 'prologue-07.webp',
      zh: ['高处永远依赖低处', '新结构会继续消耗旧结构。只看最大的数字，很快就会让整条物质链停下来。'],
      en: ['Every higher layer depends on the one below', 'New structures keep consuming older ones. Watching only the largest number will soon stall the whole chain.'],
    },
    {
      scene: 'law', image: 'prologue-08.webp',
      zh: ['你的选择会留下偏向', '你可以冲得更快、守住底线，或先弄清发生了什么。用过的方法会慢慢变成这里的规则。'],
      en: ['Your choices leave a bias', 'You can push faster, protect the floor, or first learn what is happening. Repeated methods slowly become rules here.'],
    },
    {
      scene: 'reverse', image: 'prologue-09.webp',
      zh: ['视界外也有回应', '起初它像噪声。很快你会发现，那道信号会跟着你的资源和选择改变。'],
      en: ['Something answers beyond the horizon', 'At first it sounds like noise. Soon, you will see the signal change with your resources and choices.'],
    },
    {
      scene: 'contact', image: 'prologue-10.webp',
      zh: ['那道回应需要你的资源', '它会截取、试探，也会后退。你可以反击、隔离，或冒一点风险观察它。'],
      en: ['The signal needs your resources', 'It siphons, probes, and retreats. You can strike back, isolate it, or risk a little to observe it.'],
    },
    {
      scene: 'choice', image: 'prologue-11.webp',
      zh: ['它也在计算怎样活下去', '你还不知道它是什么。但它会学习你的办法，像你一样为下一次终结做准备。'],
      en: ['It is also calculating how to survive', 'You still do not know what it is. But it learns your methods and prepares for the next ending, just as you do.'],
    },
    {
      scene: 'life', image: 'prologue-12.webp',
      zh: ['生命会记住代价', '被保护的差异、经历过的短缺和你采用的方法，都会进入后来者的谱系。'],
      en: ['Life will remember the cost', 'Protected differences, endured shortages, and the methods you chose will all enter later lineages.'],
    },
    {
      scene: 'civilization', image: 'prologue-13.webp',
      zh: ['文明会质问你的选择', '它们不会只看你留下多少资源。它们还会问：谁被保护，谁承担了代价。'],
      en: ['Civilization will question your choices', 'It will not only count the resources you left. It will ask who was protected—and who paid the cost.'],
    },
    {
      scene: 'mission', image: 'prologue-14.webp',
      zh: ['本轮目标：让第一座文明出现', '从一枚夸克开始。维持物质链，处理第一次接触，先让这一次宇宙活得足够久。'],
      en: ['This loop: bring the first civilization into being', 'Begin with one quark. Sustain the matter chain, survive First Contact, and keep this cosmos alive long enough.'],
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
        zh: ['终结再次发生', '上一轮仍然消失了。但有一个答案没有完全散掉，它变成了新宇宙最早的偏向。'],
        en: ['The ending happened again', 'The last loop still vanished. But one answer did not fully disperse; it became the earliest bias of a new cosmos.'],
      },
      {
        scene: 'rebirth-observer', image: 'references/observer-core-rebirth-master.png',
        zh: ['TC-07 的界面再次亮起', '你仍然不知道谁在使用它。你只带回了一条曾经成立的规律：' + truth[0] + '。'],
        en: ['The TC-07 interface lights again', 'You still do not know who is using it. You carried back only one rule that once held: ' + truth[1] + '.'],
      },
      {
        scene: 'rebirth-inheritance', image: 'rebirth-r02-03.webp',
        zh: ['继承物把记忆接回物质', '“' + inheritance[0] + '”让旧方法更早生效，也把上一次没有付完的代价带了回来。'],
        en: ['Inheritance reconnects memory to matter', 'The ' + inheritance[1] + ' makes the old method work earlier—and carries back a cost the last loop never finished paying.'],
      },
      {
        scene: 'rebirth-bias', image: 'rebirth-r02-04.webp',
        zh: ['最初的物质不再完全中立', '你不必重新学习生产与合成；这一轮首先要测量的，是旧答案如何让某些未来变得更容易。'],
        en: ['Initial matter is no longer entirely neutral', 'You will not relearn production and synthesis. First, measure how the old answer makes some futures easier to reach.'],
      },
      {
        scene: 'rebirth-horizon', image: 'references/shared-horizon-master.png',
        zh: ['另一侧也认出了这道偏差', '它没有记住你的胜利，只记住自己因此失去了什么。它会比上一次更早出手。'],
        en: ['The other side recognizes the bias too', 'It remembers none of your victory—only what it lost because of it. This time, it will act earlier.'],
      },
      {
        scene: 'rebirth-route', image: routeImage,
        zh: routeFrame.zh,
        en: routeFrame.en,
      },
      {
        scene: 'rebirth-mission', image: 'rebirth-r02-07.webp',
        zh: ['本轮目标：检验上一次的答案', '建立第二座文明，面对专门克制旧方法的对手，再决定这条结论该保留、修改，还是交给后来者反驳。'],
        en: ['This loop: test the last answer', 'Build a second civilization, face an opponent tailored against the old method, and decide whether that conclusion should stay, change, or be challenged.'],
      },
    ];
  }

  function buildLoopEndingFrames(summary) {
    if (summary && Array.isArray(summary.frames) && summary.frames.length) {
      return summary.frames.map(function (frame) {
        return {
          scene: frame.scene || 'rebirth-collapse',
          image: frame.image || 'rebirth-r02-01.webp',
          zh: frame.zh,
          en: frame.en,
        };
      });
    }
    return [
      {
        scene: 'rebirth-collapse', image: 'rebirth-r02-01.webp',
        zh: ['终结记录已经封存', '局部答案成立，终结仍然发生。没有更多可用操作，只有仍可重读的历史。'],
        en: ['The terminal record is sealed', 'The local answer held, and the ending still happened. No actions remain—only history that can still be read.'],
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
  var returnFocus = null;
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
    document.getElementById('prologue-skip').textContent = activeMode === 'rebirth'
      ? copy('跳过重生记录', 'Skip Rebirth Record')
      : activeMode === 'ending'
        ? copy('关闭终结记录', 'Close Terminal Record')
        : copy('跳过序章', 'Skip Prologue');
    document.getElementById('prologue-prev').textContent = copy('上一幕', 'Previous');
    document.getElementById('prologue-prev').disabled = current === 0;
    document.getElementById('prologue-next').textContent = current === activeFrames.length - 1
      ? (activeMode === 'rebirth'
        ? copy('进入第二轮', 'Enter Loop Two')
        : activeMode === 'ending'
          ? copy('返回封存档案', 'Return to Sealed Archive')
          : copy('开始观测', 'Begin Observation'))
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
    var fallback = activeMode === 'ending'
      ? document.getElementById('replay-loop-ending')
      : document.getElementById('guide-dock');
    var target = returnFocus
      && document.documentElement.contains(returnFocus)
      && !returnFocus.hidden
      && !returnFocus.disabled
      && returnFocus.offsetParent !== null
      ? returnFocus
      : fallback && !fallback.hidden && !fallback.disabled && fallback.offsetParent !== null
        ? fallback
        : document.getElementById('archive-btn');
    if (target && target.focus) target.focus({ preventScroll: true });
    returnFocus = null;
  }

  function openActive(force) {
    if (!force) {
      try { if (localStorage.getItem(activeSeenKey) === '1') return false; } catch (error) {}
      if (new URLSearchParams(window.location.search).get('skipIntro') === '1') return false;
      if (new URLSearchParams(window.location.search).has('fixture')) return false;
    }
    current = 0;
    renderedIndex = -1;
    returnFocus = document.activeElement;
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

  function openEnding(summary) {
    activeFrames = buildLoopEndingFrames(summary || {});
    activeImageRoot = 'assets/rebirth/';
    activeSeenKey = 'tiny-cosmos-ending-loop-2-seen-v1';
    activeMode = 'ending';
    activeKicker = ['第二轮 · 终结封存', 'Loop Two · Terminal Seal'];
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
    if (event.key === 'Tab') {
      var focusable = Array.prototype.filter.call(
        root.querySelectorAll('button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])'),
        function (node) { return node.offsetParent !== null; }
      );
      if (focusable.length) {
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (!root.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); current === activeFrames.length - 1 ? close() : go(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
    if (event.key === 'Escape') close();
  });
  document.addEventListener('tinycosmos:localechange', function () { if (!root.hidden) go(current); });

  window.GamePrologue = {
    open: function () { open(true); },
    openRebirth: openRebirth,
    openEnding: openEnding,
    close: close,
    frames: frames.slice(),
    buildRoundTwoFrames: buildRoundTwoFrames,
    buildLoopEndingFrames: buildLoopEndingFrames,
  };
  open(false);
})();
