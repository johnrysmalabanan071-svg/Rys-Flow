/* Vanilla canvas: static circuits are cached; only packets and a small cursor
   glow repaint. No layout measurements inside the animation loop. */
const layer = document.querySelector('.automation-background');
const canvas = layer?.querySelector('canvas');
const ctx = canvas?.getContext('2d');
if (ctx) {
  const SETTINGS = {
    fps: 30, maxDpr: 1.5, spacing: 145,
    idleSpeed: .035, burstSpeed: .22, glowRadius: 170,
    burstDuration: 1100, // Match each workflow step in app.js.
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const control = document.querySelector('#background-toggle');
  const cache = document.createElement('canvas');
  const cached = cache.getContext('2d');
  let width = 0, height = 0, dpr = 1, paths = [], points = [];
  let accent, success, frame = 0, last = 0, elapsed = 0, burstUntil = 0;
  let paused = false, pageVisible = !document.hidden, stage = -1;
  const pointer = { x: -1000, y: -1000, active: false };
  let glow;

  function rebuild() {
    const bounds = layer.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    dpr = Math.min(devicePixelRatio || 1, SETTINGS.maxDpr);
    for (const surface of [canvas, cache]) {
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cached.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    accent = css.getPropertyValue('--network-rgb').trim() || '105, 231, 223';
    success = css.getPropertyValue('--network-success-rgb').trim() || '198, 233, 146';
    // Bound the graph size even on ultrawide screens.
    const cols = Math.min(13, Math.max(3, Math.ceil(width / SETTINGS.spacing)));
    const rows = Math.min(9, Math.max(3, Math.ceil(height / SETTINGS.spacing)));
    points = []; paths = [];
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        points.push({ x: (x + .15 + Math.sin(y * 3 + x) * .13) * width / cols,
          y: (y + .15 + Math.cos(x * 2 + y) * .13) * height / rows });
      }
    }
    function connect(a, b, id) {
      const mid = (a.x + b.x) / 2;
      const vertices = [a, { x: mid, y: a.y }, { x: mid, y: b.y }, b];
      const lengths = vertices.slice(1).map((p, i) => Math.hypot(p.x - vertices[i].x, p.y - vertices[i].y));
      paths.push({ vertices, lengths, total: lengths.reduce((s, n) => s + n, 0), phase: (id * .618) % 1, lane: id % 4 });
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const id = y * (cols + 1) + x;
        connect(points[id], points[id + 1], id);
        if ((x + y) % 3 === 0) connect(points[id], points[id + cols + 1], id + 1);
      }
    }
    cached.clearRect(0, 0, width, height);
    cached.lineWidth = .7; cached.strokeStyle = `rgba(${accent},.12)`;
    cached.beginPath();
    for (const path of paths) {
      cached.moveTo(path.vertices[0].x, path.vertices[0].y);
      path.vertices.slice(1).forEach(p => cached.lineTo(p.x, p.y));
    }
    cached.stroke();
    cached.fillStyle = `rgba(${accent},.35)`;
    points.forEach(p => { cached.beginPath(); cached.arc(p.x, p.y, 1.8, 0, Math.PI * 2); cached.fill(); });
    // Cached radial gradient: move the drawing context, not its color stops.
    glow = ctx.createRadialGradient(0, 0, 0, 0, 0, SETTINGS.glowRadius);
    glow.addColorStop(0, `rgba(${accent},.09)`); glow.addColorStop(1, `rgba(${accent},0)`);
    draw(false);
  }

  function pointOn(path, progress) {
    let distance = progress * path.total;
    for (let i = 0; i < path.lengths.length; i++) {
      const length = path.lengths[i];
      if (distance <= length && length > 0) {
        const a = path.vertices[i], b = path.vertices[i + 1], t = distance / length;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      distance -= length;
    }
    return path.vertices.at(-1);
  }

  function draw(animated) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(cache, 0, 0, width, height);
    if (!animated) return;
    const burst = elapsed < burstUntil;
    if (pointer.active) {
      ctx.save(); ctx.translate(pointer.x, pointer.y); ctx.fillStyle = glow;
      ctx.fillRect(-SETTINGS.glowRadius, -SETTINGS.glowRadius, SETTINGS.glowRadius * 2, SETTINGS.glowRadius * 2); ctx.restore();
    }
    paths.forEach((path, i) => {
      const active = burst && path.lane === stage;
      if (!active && i % 7 !== 0) return;
      const color = stage === 3 && active ? success : accent;
      if (active) {
        ctx.strokeStyle = `rgba(${color},.24)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(path.vertices[0].x, path.vertices[0].y);
        path.vertices.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      }
      const speed = active ? SETTINGS.burstSpeed : SETTINGS.idleSpeed;
      const p = pointOn(path, (elapsed / 1000 * speed + path.phase) % 1);
      ctx.fillStyle = `rgba(${color},${active ? .9 : .45})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, active ? 2.8 : 1.5, 0, Math.PI * 2); ctx.fill();
      if (active) {
        ctx.fillStyle = `rgba(${color},.1)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
      }
    });
    if (burst) {
      const progress = 1 - (burstUntil - elapsed) / SETTINGS.burstDuration;
      ctx.strokeStyle = `rgba(${stage === 3 ? success : accent},${.2 * (1 - progress)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(width * .74, height * .4, Math.max(0, progress * width * .65), 0, Math.PI * 2); ctx.stroke();
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - last < 1000 / SETTINGS.fps) return;
    elapsed += Math.min(now - last, 80); last = now;
    draw(true);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    const stopped = paused || reduced.matches;
    document.body.classList.toggle('background-paused', stopped);
    if (control) {
      control.hidden = false; control.disabled = reduced.matches;
      control.setAttribute('aria-pressed', String(stopped));
      control.textContent = reduced.matches ? 'Background motion reduced' : paused ? 'Play background' : 'Pause background';
    }
    draw(false);
    if (!stopped && pageVisible) frame = requestAnimationFrame(tick);
  }
  control?.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; sync(); });
  window.addEventListener('pagehide', () => { pageVisible = false; sync(); });
  window.addEventListener('pageshow', () => { pageVisible = !document.hidden; sync(); });
  window.addEventListener('pointermove', e => {
    if (!finePointer.matches || reduced.matches || paused) return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('portfolio:workflow-step', e => {
    if (paused || reduced.matches) return;
    stage = e.detail.step; burstUntil = elapsed + SETTINGS.burstDuration;
  });
  document.addEventListener('portfolio:workflow-end', () => { burstUntil = 0; });
  rebuild(); sync();
  new ResizeObserver(rebuild).observe(layer);
}
