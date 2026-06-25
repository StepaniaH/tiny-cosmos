// tiny-cosmos v2 — Canvas Renderer
// Clickable particle rings + burst animation on click.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;

  var canvas, ctx, animId, cssW, cssH, dpr;
  var particles = [];       // orbiting particles per tier
  var bursts = [];          // click burst particles: [{x,y,vx,vy,life,color}]
  var clickCount = 0;       // accumulated clicks for batch processing

  var PARTICLE_COUNTS = [8, 12, 16, 20, 22, 24, 26];
  var PARTICLE_SIZE = 2.2;
  var BURST_COUNT = 8;

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
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  // ── Click → Quark ──
  function onClick(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    // +1 click (engine will process in batch via tick)
    clickCount += 1;
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
    if (animId) return;
    var lastT = 0;
    function loop(ts) {
      var dt = lastT ? Math.min((ts - lastT) / 1000, 0.1) : 0.016;
      lastT = ts;
      render(dt);
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
    var grad = ctx.createRadialGradient(cssW/2, cssH/2, 0, cssW/2, cssH/2, Math.max(cssW,cssH)*0.6);
    grad.addColorStop(0, '#10101c');
    grad.addColorStop(1, '#080812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);

    var cx = cssW / 2;
    var cy = cssH / 2;
    var maxR = Math.min(cx, cy) * 0.82;
    var minR = maxR * 0.13;
    var gap = (maxR - minR) / (GC.TIERS.length - 1);
    var s = GS.getState();
    var maxRes = GS.getMaxResearchedTier();

    // Draw rings outer→inner
    for (var i = GC.TIERS.length - 1; i >= 0; i--) {
      drawRing(i, cx, cy, minR + i * gap, maxRes, dt, s);
    }

    // Draw center
    drawCenter(cx, cy, s);

    // Draw burst particles
    drawBursts(dt);
  }

  function drawRing(tierId, cx, cy, r, maxRes, dt, s) {
    var tpl = GC.TIERS[tierId];
    var t = s.tiers[tierId];
    var unlocked = t.researched;
    var alpha = unlocked ? 1 : 0.08;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (unlocked) {
      // Glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = tpl.glow;
      ctx.lineWidth = 2;
      ctx.shadowColor = tpl.glow;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = tpl.color;
      ctx.lineWidth = 1;
      ctx.stroke();
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

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtle glow
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,212,59,0.03)';
    ctx.fill();

    // Count
    ctx.font = 'bold 18px ' + getMono();
    ctx.fillStyle = '#ffd43b';
    ctx.fillText(formatShort(tq), cx, cy - 6);

    ctx.font = '10px ' + getMono();
    ctx.fillStyle = '#6a6a82';
    ctx.fillText('夸克总量', cx, cy + 12);

    var prestiges = GS.getPrestiges();
    if (prestiges > 0) {
      ctx.font = '9px ' + getMono();
      ctx.fillStyle = '#cc5de8';
      ctx.fillText('🌌 ×' + prestiges, cx, cy + 26);
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

  function getMono() { return "'SF Mono','Cascadia Code','Fira Code',monospace"; }

  function formatShort(n) {
    if (n >= 1e15) return (n/1e15).toFixed(1)+'P';
    if (n >= 1e12) return (n/1e12).toFixed(1)+'T';
    if (n >= 1e9)  return (n/1e9).toFixed(1)+'G';
    if (n >= 1e6)  return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3)  return (n/1e3).toFixed(1)+'K';
    return Math.floor(n).toString();
  }

  window.CanvasRenderer = {
    init: init, start: start, stop: stop,
    onClick: onClick, flushClicks: flushClicks,
  };
})();
