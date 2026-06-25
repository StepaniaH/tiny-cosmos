// tiny-cosmos — Canvas Renderer
// Concentric particle rings visualization.
// Particle flow on each ring, color-coded by tier.
(function () {
  'use strict';

  var GC = window.GC;
  var GS = window.GameState;

  var canvas = null;
  var ctx = null;
  var animId = null;
  var cssW = 0, cssH = 0;
  var dpr = 1;

  // Particle state for each tier
  var particles = []; // particles[tierId] = [{angle, speed}]

  var PARTICLE_COUNT = [8, 12, 16, 20, 24, 28, 32]; // per tier
  var PARTICLE_RADIUS = 2.5;

  // ── Init ────────────────────────────────────────────────────────

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Init particles
    for (var i = 0; i < GC.TIERS.length; i++) {
      var ring = [];
      var count = PARTICLE_COUNT[i] || 10;
      for (var j = 0; j < count; j++) {
        ring.push({
          angle: (j / count) * Math.PI * 2 + Math.random() * 0.5,
          speed: 0.3 + i * 0.25 + Math.random() * 0.2, // radians/s, higher tiers faster
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

  // ── Render Loop ─────────────────────────────────────────────────

  function start() {
    if (animId) return;
    function loop(ts) {
      render(ts);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // ── Draw ────────────────────────────────────────────────────────

  function render(timestamp) {
    if (!ctx || !canvas) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, cssW, cssH);

    var cx = cssW / 2;
    var cy = cssH / 2;
    var maxR = Math.min(cx, cy) * 0.85;
    var minR = maxR * 0.15;
    var ringGap = (maxR - minR) / (GC.TIERS.length - 1);

    var s = GS.getState();
    var maxResearched = GS.getMaxResearchedTier();
    var dt = 0.05; // approximate delta — real dt would need timestamp tracking

    // Draw rings (outer to inner, so center renders on top)
    for (var i = GC.TIERS.length - 1; i >= 0; i--) {
      drawRing(i, cx, cy, minR + i * ringGap, maxResearched, dt, s);
    }

    // Center stats
    drawCenter(cx, cy, s);
  }

  function drawRing(tierId, cx, cy, r, maxResearched, dt, s) {
    var tpl = GC.TIERS[tierId];
    var t = s.tiers[tierId];

    var isUnlocked = t.researched;
    var alpha = isUnlocked ? 1 : 0.15;
    var color = tpl.color;
    var glow = tpl.glow;

    // Ring circle
    ctx.save();
    ctx.globalAlpha = alpha;

    if (isUnlocked) {
      // Solid ring with glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Dashed ring for locked tiers — more visible
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tiny lock indicator dot
      ctx.beginPath();
      ctx.arc(cx + r, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();
    }

    ctx.restore();

    // Particles on unlocked rings
    if (isUnlocked && particles[tierId]) {
      var ring = particles[tierId];

      // Visible particle count proportional to tier count (max 200 visible)
      var visibleCount = Math.min(ring.length, Math.ceil(t.count / 10) + 3);
      visibleCount = Math.max(3, Math.min(visibleCount, ring.length));

      for (var p = 0; p < visibleCount; p++) {
        var particle = ring[p];

        // Update angle
        var speed = particle.speed;
        var speedMult = 1;
        if (tierId === 6) speedMult = 0.5; // civilization slower
        if (tierId <= 2) speedMult *= GS.getGravityMultiplier(tierId) * 0.7;
        particle.angle += speed * speedMult * dt;

        if (particle.angle > Math.PI * 2) particle.angle -= Math.PI * 2;

        var px = cx + Math.cos(particle.angle) * r;
        var py = cy + Math.sin(particle.angle) * r;

        // Particle size: larger when count is high
        var size = PARTICLE_RADIUS * (0.6 + Math.min(1, t.count / 1000) * 0.4);

        ctx.save();
        ctx.globalAlpha = alpha * 0.8;

        // Glow
        ctx.beginPath();
        ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.restore();
      }

      // Move any invisible particles slowly to keep the ring looking alive
      for (var q = visibleCount; q < ring.length; q++) {
        ring[q].angle += ring[q].speed * 0.3 * dt;
        if (ring[q].angle > Math.PI * 2) ring[q].angle -= Math.PI * 2;
      }
    }
  }

  function drawCenter(cx, cy, s) {
    var totalQuarks = GS.getTotalQuarksEver();
    var rp = GS.getRP();
    var prestiges = GS.getPrestiges();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtle background circle
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill();

    // Total quarks (main number)
    ctx.font = 'bold 16px ' + getFontStack();
    ctx.fillStyle = '#ffd43b';
    var qText = formatShort(totalQuarks);
    ctx.fillText(qText, cx, cy - 8);

    // Label
    ctx.font = '10px ' + getFontStack();
    ctx.fillStyle = '#7a7a96';
    ctx.fillText('夸克总量', cx, cy + 10);

    // RP below
    if (rp > 0) {
      ctx.font = '9px ' + getFontStack();
      ctx.fillStyle = '#4dabf7';
      ctx.fillText('🔬 ' + rp.toFixed(1), cx, cy + 26);
    }

    // Prestige count
    if (prestiges > 0) {
      ctx.font = '9px ' + getFontStack();
      ctx.fillStyle = '#cc5de8';
      ctx.fillText('🌌 ×' + prestiges, cx, cy + 40);
    }

    ctx.restore();
  }

  function getFontStack() {
    return "'SF Mono','Cascadia Code','Fira Code',monospace";
  }

  function formatShort(n) {
    if (n >= 1e15) return (n / 1e15).toFixed(1) + 'P';
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'G';
    if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  }

  // ── Export ──────────────────────────────────────────────────────
  window.CanvasRenderer = {
    init: init,
    start: start,
    stop: stop,
    render: render,
  };
})();
