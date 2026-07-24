// tiny-cosmos v2 — Canvas Renderer
// Clickable particle rings + burst animation on click.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var I18n = window.GameI18n;
  var Slice = window.GameSlice;

  var canvas, ctx, animId, cssW, cssH, dpr, bgGrad, inspector;
  var particles = [];       // orbiting particles per tier
  var bursts = [];          // click burst particles: [{x,y,vx,vy,life,color}]
  var clickCount = 0;       // accumulated clicks for batch processing

  var PARTICLE_COUNTS = [8, 12, 16, 20, 22, 24, 26];
  var PARTICLE_SIZE = 2.2;
  var BURST_COUNT = 8;
  var TARGET_FPS = 30;
  var FRAME_MS = 1000 / TARGET_FPS;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    inspector = document.getElementById('canvas-inspector');

    for (var i = 0; i < GC.TIERS.length; i++) {
      var ring = [];
      var n = PARTICLE_COUNTS[i] || 10;
      for (var j = 0; j < n; j++) {
        ring.push({
          a: (j / n) * Math.PI * 2 + Math.random() * 0.4,
          speed: 0.25 + i * 0.22 + Math.random() * 0.15,
        });
      }
      particles.push(ring);
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', inspectPointer);
    canvas.addEventListener('pointerleave', function (event) {
      if (!inspector || event.relatedTarget === inspector || inspector.contains(event.relatedTarget)) return;
      hideInspector();
    });
    if (inspector) {
      inspector.addEventListener('pointerleave', function (event) {
        if (event.relatedTarget === canvas) return;
        hideInspector();
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        hideInspector();
        stop();
      }
      else start();
    });
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    bgGrad = ctx.createRadialGradient(cssW/2, cssH/2, 0, cssW/2, cssH/2, Math.max(cssW,cssH)*0.6);
    bgGrad.addColorStop(0, '#09191e');
    bgGrad.addColorStop(0.45, '#041014');
    bgGrad.addColorStop(1, '#010507');
    hideInspector();
  }

  function localized(zh, en) {
    return I18n && I18n.getLocale() !== 'zh-CN' ? en : zh;
  }

  function inspectPointer(event) {
    if (!inspector || !canvas || (window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var cx = cssW / 2;
    var cy = cssH / 2;
    var maxR = Math.min(cx, cy) * 0.82;
    var minR = maxR * 0.13;
    var gap = (maxR - minR) / (GC.TIERS.length - 1);
    var distance = Math.hypot(x - cx, y - cy);
    var state = GS.getState();
    var maxRes = GS.getMaxResearchedTier();
    var info = null;
    var pressure = state && state.slice && state.slice.reverse
      ? (Slice && Slice.getReversePressure ? Slice.getReversePressure() : state.slice.reverse.pressure)
      : 0;

    if (pressure > 25 && Math.abs(distance - (minR + 5.55 * gap)) <= 10) {
      info = {
        title: localized('反侧压力轨迹', 'REVERSE PRESSURE TRACE'),
        copy: localized(
          '红色断续弧不是生命值，而是反宇宙对重复干预模式的学习压力；越高，当前生产越容易受抑制。',
          'The broken red arc is not health. It is the reverse cosmos learning repeated interventions; higher pressure can suppress current production.'
        ),
        entry: 'reverse-pressure',
      };
    }

    if (!info) {
      var nearestTier = -1;
      var nearestDelta = Infinity;
      for (var tierId = 0; tierId < GC.TIERS.length; tierId += 1) {
        var ringDelta = Math.abs(distance - (minR + tierId * gap));
        if (ringDelta < nearestDelta) {
          nearestTier = tierId;
          nearestDelta = ringDelta;
        }
      }
      if (nearestTier >= 0 && nearestDelta <= 10) {
        var tpl = GC.TIERS[nearestTier];
        var unlocked = nearestTier <= maxRes;
        var focused = !!(state && state.slice && state.slice.enabled && state.slice.focusTier === nearestTier);
        var reserved = !!(state && state.slice && state.slice.enabled && state.slice.reserveTier === nearestTier);
        var tierName = localized(tpl.nameZh, tpl.name);
        var entryByTier = ['material-stack', 'material-stack', 'material-stack', 'molecule-tier', 'cell-tier', 'life-tier', 'civilization-tier'];
        if (!unlocked) {
          info = {
            title: localized('未揭示结构轨道 · T' + nearestTier, 'UNREVEALED ORBIT · T' + nearestTier),
            copy: localized(
              '灰色虚线是尚未完成研究的尺度占位，不代表正在流动或生产的资源。',
              'The gray dashed ring marks an unrevealed scale. It is not an active resource flow or production line.'
            ),
            entry: 'material-stack',
          };
        } else if (focused) {
          info = {
            title: localized('宇宙焦点 · ' + tierName, 'COSMIC FOCUS · ' + tierName),
            copy: localized(
              '加粗青色轨道表示当前宇宙焦点；该层获得焦点倍率，但过度集中也会改变整体稳定性。',
              'The bold cyan orbit marks the current cosmic focus. This layer receives the focus multiplier, while over-concentration can change overall stability.'
            ),
            entry: 'cosmic-focus',
          };
        } else if (reserved) {
          info = {
            title: localized('保留线 · ' + tierName, 'RESERVE LINE · ' + tierName),
            copy: localized(
              '外侧绿色短弧表示该层被设为保留层：系统会优先留下安全库存，再允许它被上层消耗。',
              'The short green outer arc marks a reserve layer. The system keeps a safety stock here before upper layers may consume it.'
            ),
            entry: 'reserve-line',
          };
        } else {
          info = {
            title: 'T' + nearestTier + ' · ' + tierName,
            copy: localized(
              '这条环线代表一个已观测的物质尺度；沿线光点是可见样本，不是从内向外输送的管道。',
              'This orbit represents an observed matter scale. Its particles are visible samples, not a pipe carrying matter outward.'
            ),
            entry: entryByTier[nearestTier] || 'material-stack',
          };
        }
      }
    }

    if (!info && distance <= maxR + 40 && (Math.abs(x - cx) <= 5 || Math.abs(y - cy) <= 5)) {
      info = {
        title: localized('观测坐标线', 'OBSERVATION AXIS'),
        copy: localized(
          '穿过中心的青色虚线只是观测读数的坐标辅助，不参与生产、消耗或稳定性计算。',
          'The cyan dashed crosshair is a reading aid only. It does not affect production, demand, or stability.'
        ),
        entry: 'observer-equation',
      };
    }

    if (!info) {
      hideInspector();
      return;
    }
    showInspector(info, x, y);
  }

  function showInspector(info, x, y) {
    var title = document.getElementById('canvas-inspector-title');
    var copy = document.getElementById('canvas-inspector-copy');
    var archive = document.getElementById('canvas-inspector-archive');
    if (title) title.textContent = info.title;
    if (copy) copy.textContent = info.copy;
    if (archive) {
      archive.dataset.loreTarget = info.entry;
      archive.textContent = localized('查看相关档案', 'OPEN RELATED ARCHIVE');
    }
    inspector.hidden = false;
    var left = Math.max(12, Math.min(cssW - inspector.offsetWidth - 12, x + 16));
    var top = Math.max(12, Math.min(cssH - inspector.offsetHeight - 12, y + 16));
    inspector.style.left = left + 'px';
    inspector.style.top = top + 'px';
  }

  function hideInspector() {
    if (inspector) inspector.hidden = true;
  }

  // ── Click → Quark ──
  function onClick(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    // +1 click (engine will process in batch via tick)
    clickCount += 1;
    if (Slice && Slice.isEnabled()) Slice.onCanvasClick();
    spawnBurst(mx, my, '#ff6b6b');
  }

  function spawnBurst(x, y, color) {
    for (var i = 0; i < BURST_COUNT; i++) {
      var angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      var speed = 40 + Math.random() * 80;
      bursts.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        color: color,
      });
    }
  }

  function flushClicks() {
    if (clickCount > 0) {
      var st = GS.getState();
      if (st) {
        // Each click = 1 quark × speed multiplier
        var sm = GS.getSpeedMultiplier();
        GS.addResource(0, clickCount * sm);
      }
      clickCount = 0;
    }
  }

  // ── Render Loop ──
  function start() {
    if (animId || document.hidden) return;
    var lastT = 0;
    function loop(ts) {
      if (!lastT || ts - lastT >= FRAME_MS) {
        var dt = lastT ? Math.min((ts - lastT) / 1000, 0.1) : 0.016;
        lastT = ts;
        render(dt);
      }
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  function render(dt) {
    if (!ctx || !canvas) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cssW, cssH);

    var cx = cssW / 2;
    var cy = cssH / 2;
    var maxR = Math.min(cx, cy) * 0.82;
    var minR = maxR * 0.13;
    var gap = (maxR - minR) / (GC.TIERS.length - 1);
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();

    drawTacticalGrid(cx, cy, maxR);
    if (maxRes >= 4) drawCellularInterior(cx, cy, minR + 4 * gap, s);

    // Draw rings outer→inner
    for (var i = GC.TIERS.length - 1; i >= 0; i--) {
      drawRing(i, cx, cy, minR + i * gap, maxRes, dt, s);
    }

    drawReverseSignatures(cx, cy, minR, gap, s);
    drawAnomalyContact(cx, cy, minR + 2 * gap, s, dt);

    // Draw center
    drawCenter(cx, cy, s);

    // Draw burst particles
    drawBursts(dt);
  }

  function drawRing(tierId, cx, cy, r, maxRes, dt, s) {
    var tpl = GC.TIERS[tierId];
    var t = s.tiers[tierId];
    var unlocked = t.researched;
    var alpha = unlocked ? 1 : 0.055;
    var focused = !!(s.slice && s.slice.enabled && s.slice.focusTier === tierId);
    var reserved = !!(s.slice && s.slice.enabled && s.slice.reserveTier === tierId);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (unlocked) {
      // Glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = focused ? 'rgba(114,229,245,0.72)' : tpl.glow;
      ctx.lineWidth = focused ? 3 : 1.5;
      ctx.shadowColor = tpl.glow;
      ctx.shadowBlur = focused ? 16 : 7;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = focused ? '#72e5f5' : tpl.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (reserved) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, -Math.PI * 0.12, Math.PI * 0.42);
        ctx.strokeStyle = '#61e6a7';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label at rightmost point of ring
      var lx = cx + r + 8;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10px ' + getMono();
      ctx.fillStyle = tpl.color;
      ctx.fillText(tpl.symbol, lx, cy - 4);
      ctx.font = '9px ' + getMono();
      ctx.fillStyle = '#759096';
      ctx.fillText(fmt(t.count), lx, cy + 6);
    } else {
      // Dashed ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 14]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Particles
    if (unlocked && particles[tierId]) {
      var ring = particles[tierId];
      var visCount = Math.min(ring.length, Math.ceil((t.count || 0) / 8) + 2);
      visCount = Math.max(2, Math.min(visCount, ring.length));

      for (var p = 0; p < visCount; p++) {
        var pt = ring[p];
        pt.a += pt.speed * dt;
        if (pt.a > Math.PI*2) pt.a -= Math.PI*2;

        var px = cx + Math.cos(pt.a) * r;
        var py = cy + Math.sin(pt.a) * r;
        var sz = PARTICLE_SIZE * (0.5 + Math.min(1, (t.count||0) / 500) * 0.5);

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(px, py, sz*1.6, 0, Math.PI*2);
        ctx.fillStyle = tpl.glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI*2);
        ctx.fillStyle = tpl.color;
        ctx.fill();
        ctx.restore();
      }

      // Move invisible particles slowly
      for (var q = visCount; q < ring.length; q++) {
        ring[q].a += ring[q].speed * 0.2 * dt;
        if (ring[q].a > Math.PI*2) ring[q].a -= Math.PI*2;
      }
    }
  }

  function drawCenter(cx, cy, s) {
    var tq = GS.getTotalQuarksEver() || 0;
    var prestiges = GS.getPrestiges();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Total quarks ever
    ctx.font = 'bold 13px ' + getMono();
    ctx.fillStyle = '#dffbff';
    ctx.fillText(formatShort(tq), cx, cy - 4);

    ctx.font = '9px ' + getMono();
    ctx.fillStyle = '#55747a';
    ctx.fillText(I18n && I18n.getLocale() === 'zh-CN' ? '已观测 q' : 'OBSERVED q', cx, cy + 12);

    if (prestiges > 0) {
      ctx.font = '9px ' + getMono();
      ctx.fillStyle = '#cc5de8';
      ctx.fillText((I18n && I18n.getLocale() === 'zh-CN' ? '轮回 ×' : 'CYCLE ×') + prestiges, cx, cy + 26);
    }
    ctx.restore();
  }

  function drawBursts(dt) {
    for (var i = bursts.length - 1; i >= 0; i--) {
      var b = bursts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0) {
        bursts.splice(i, 1);
        continue;
      }

      var alpha = b.life / b.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5 * alpha, 0, Math.PI*2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTacticalGrid(cx, cy, maxR) {
    ctx.save();
    ctx.strokeStyle = 'rgba(96,190,205,0.055)';
    ctx.lineWidth = 1;
    var step = 32;
    for (var x = cx % step; x < cssW; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke();
    }
    for (var y = cy % step; y < cssH; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(114,229,245,0.15)';
    ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(cx - maxR - 36, cy); ctx.lineTo(cx + maxR + 36, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - maxR - 28); ctx.lineTo(cx, cy + maxR + 28); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '8px ' + getMono();
    ctx.fillStyle = 'rgba(114,229,245,0.28)';
    ctx.textAlign = 'left';
    ctx.fillText('R+' + Math.round(maxR), cx + maxR + 7, cy - 5);
    ctx.fillText('φ 0.000', cx + 7, cy - maxR - 8);
    ctx.restore();
  }

  function drawCellularInterior(cx, cy, r, s) {
    var time = s.slice && s.slice.elapsedSeconds ? s.slice.elapsedSeconds : 0;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < 3; i += 1) {
      var wobble = Math.sin(time * (0.16 + i * 0.03) + i * 2.1) * (4 + i * 2);
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(time * 0.08 + i) * 5, cy + Math.sin(time * 0.07 + i) * 4, r * (0.34 + i * 0.12) + wobble, r * (0.25 + i * 0.09) - wobble * 0.35, time * 0.025 + i * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = i === 2 ? 'rgba(77,171,247,0.16)' : 'rgba(105,219,124,0.11)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2 + i * 2, 8 + i * 3]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (var j = 0; j < 7; j += 1) {
      var angle = time * 0.035 + j / 7 * Math.PI * 2;
      var inner = r * 0.38;
      var outer = r * 0.76;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner * 0.72);
      ctx.quadraticCurveTo(cx + Math.cos(angle + 0.35) * r * 0.62, cy + Math.sin(angle - 0.22) * r * 0.54, cx + Math.cos(angle + 0.12) * outer, cy + Math.sin(angle + 0.12) * outer * 0.82);
      ctx.strokeStyle = 'rgba(77,171,247,0.08)';
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawReverseSignatures(cx, cy, minR, gap, s) {
    if (!s.slice || !s.slice.reverse) return;
    var objects = s.slice.reverse.objects;
    var time = s.slice.elapsedSeconds || 0;
    var pressure = Slice && Slice.getReversePressure ? Slice.getReversePressure() : s.slice.reverse.pressure;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    if (objects.lattice.status !== 'hidden') {
      var lr = minR + 3 * gap;
      var lx = cx - lr * 0.68;
      var ly = cy - lr * 0.48;
      ctx.beginPath();
      for (var i = 0; i < 6; i += 1) {
        var la = time * 0.03 + i / 6 * Math.PI * 2;
        var rr = i % 2 ? 7 : 13;
        var px = lx + Math.cos(la) * rr;
        var py = ly + Math.sin(la) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = objects.lattice.status === 'pending' ? '#ff6577' : 'rgba(197,148,255,0.62)';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = objects.lattice.status === 'pending' ? 14 : 6;
      ctx.stroke();
    }

    if (objects.choir.status !== 'hidden') {
      var cr = minR + 4 * gap;
      ctx.shadowBlur = 0;
      for (var j = 0; j < 5; j += 1) {
        var start = time * (0.035 + j * 0.004) + j * 1.18;
        ctx.beginPath();
        ctx.arc(cx, cy, cr + 9 + j * 2, start, start + 0.38);
        ctx.strokeStyle = objects.choir.status === 'pending' ? 'rgba(255,101,119,0.85)' : 'rgba(77,171,247,0.48)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    if (objects.seed.status !== 'hidden') {
      var sr = minR + 5 * gap;
      var sa = time * 0.045;
      var sx = cx + Math.cos(sa) * sr;
      var sy = cy + Math.sin(sa) * sr;
      ctx.beginPath();
      ctx.ellipse(sx - 4, sy, 5, 9, sa, 0, Math.PI * 2);
      ctx.ellipse(sx + 4, sy, 5, 9, -sa, 0, Math.PI * 2);
      ctx.strokeStyle = objects.seed.status === 'pending' ? '#ff6577' : 'rgba(204,93,232,0.62)';
      ctx.stroke();
    }

    if (pressure > 25) {
      ctx.globalAlpha = Math.min(0.38, pressure / 220);
      ctx.strokeStyle = '#ff6577';
      ctx.setLineDash([1, 12]);
      ctx.beginPath();
      ctx.arc(cx, cy, minR + 5.55 * gap + Math.sin(time * 0.2) * 3, time * 0.08, time * 0.08 + Math.PI * 1.45);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawAnomalyContact(cx, cy, r, s, dt) {
    if (!s.slice || !s.slice.enabled) return;
    var enemy = s.slice.enemy;
    if (enemy.status === 'hidden' || enemy.status === 'resolved') return;
    var warningDuration = Slice && Slice.getWarningDuration ? Slice.getWarningDuration() : GC.FIRST_CONTACT.warningSeconds;
    var intensity = enemy.status === 'warning'
      ? Math.max(0, Math.min(1, 1 - enemy.warningRemaining / warningDuration))
      : 1;
    var time = s.slice.elapsedSeconds || 0;
    var start = time * 0.18;
    ctx.save();
    ctx.globalAlpha = 0.24 + intensity * 0.56;
    ctx.strokeStyle = '#ff6577';
    ctx.shadowColor = '#ff6577';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5 + intensity * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10 + Math.sin(time * 2) * 2, start, start + 0.62 + intensity * 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (var i = 0; i < 5; i++) {
      var angle = start + i * 0.16;
      var px = cx + Math.cos(angle) * (r + 10);
      var py = cy + Math.sin(angle) * (r + 10);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx + Math.cos(angle + 0.23) * (r - 9 - i * 2), cy + Math.sin(angle + 0.23) * (r - 9 - i * 2));
      ctx.stroke();
    }
    ctx.restore();
  }

  function getMono() { return "'SF Mono','Cascadia Code','Fira Code',monospace"; }

  function formatShort(n) {
    if (n >= 1e15) return (n/1e15).toFixed(1)+'P';
    if (n >= 1e12) return (n/1e12).toFixed(1)+'T';
    if (n >= 1e9)  return (n/1e9).toFixed(1)+'G';
    if (n >= 1e6)  return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3)  return (n/1e3).toFixed(1)+'K';
    if (n >= 100)  return Math.floor(n).toString();
    return n.toFixed(1);
  }

  function fmt(n) {
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e4) return (n/1e3).toFixed(1)+'K';
    if (n >= 100) return Math.floor(n).toString();
    return n.toFixed(1);
  }

  window.CanvasRenderer = {
    init: init, start: start, stop: stop,
    onClick: onClick, flushClicks: flushClicks,
  };
})();
