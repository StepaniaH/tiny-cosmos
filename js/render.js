// tiny-cosmos v2 — Canvas Renderer
// Clickable particle rings + burst animation on click.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;
  var Slice = window.GameSlice;

  var canvas, ctx, animId, cssW, cssH, dpr, bgGrad;
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
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
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

    // Draw rings outer→inner
    for (var i = GC.TIERS.length - 1; i >= 0; i--) {
      drawRing(i, cx, cy, minR + i * gap, maxRes, dt, s);
    }

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
    ctx.fillText('OBSERVED q', cx, cy + 12);

    if (prestiges > 0) {
      ctx.font = '9px ' + getMono();
      ctx.fillStyle = '#cc5de8';
      ctx.fillText('CYCLE ×' + prestiges, cx, cy + 26);
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
