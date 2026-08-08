/* Section widgets — three lazy 2D canvases, each alive only while its
   section is on screen.

   map    — the journey, sketched: Spain with a pin per posting and the
            dashed flight in from Delhi
   chalk  — a hand writing warm-up phrases on the board, then dusting off
   stamp  — the postcard's postage stamp: a little globe with the
            Delhi → Spain route sparking across it */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const GOLD = '#e9b44c';
const CREAM = '#f6ecdd';
const CORAL = '#f0876d';
const SAGE = '#8fd6b7';
const MUTED = 'rgba(191,166,203,0.9)';

/* one lazy widget = canvas + draw(t), running only on screen */
function widget(canvas, draw) {
  if (!canvas) return;
  const g = canvas.getContext('2d');
  let raf = 0;
  let live = false;
  let t0 = performance.now();

  function size() {
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    draw(g, (now - t0) / 1000, canvas.clientWidth, canvas.clientHeight);
    if (live && !REDUCED) raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting && !live) {
        live = true;
        size();
        raf = requestAnimationFrame(frame);
      } else if (!en.isIntersecting && live) {
        live = false;
        cancelAnimationFrame(raf);
      }
    }
  }, { rootMargin: '80px' }).observe(canvas);

  addEventListener('resize', () => { if (live) size(); });
}

/* ================================================ the journey map */
{
  // Iberian peninsula, roughly, as (lon, lat) — sketched, not surveyed
  const OUTLINE = [
    [-8.87, 42.6], [-9.30, 43.05], [-8.35, 43.4], [-7.7, 43.75], [-7.0, 43.6],
    [-5.85, 43.66], [-4.5, 43.45], [-3.0, 43.42], [-1.79, 43.4], [-1.4, 43.28],
    [-0.3, 42.85], [0.7, 42.85], [1.8, 42.5], [3.17, 42.43], [2.1, 41.3],
    [0.9, 41.05], [0.2, 40.55], [-0.32, 39.47], [-0.5, 38.4], [-0.65, 37.98],
    [-1.65, 37.42], [-2.1, 36.75], [-3.4, 36.72], [-4.42, 36.72], [-5.35, 36.13],
    [-6.05, 36.3], [-6.35, 36.8], [-6.9, 37.2], [-7.4, 37.18], [-8.0, 37.05],
    [-8.85, 37.05], [-8.8, 37.5], [-9.2, 38.4], [-9.45, 38.75], [-9.0, 39.4],
    [-8.9, 40.15], [-8.65, 41.15], [-8.85, 41.85], [-8.87, 42.25],
  ];
  const PINS = [
    { lon: -3.79, lat: 37.77, name: 'JAÉN', yr: '2020', dy: -14 },
    { lon: -3.60, lat: 37.18, name: 'GRANADA', yr: '2021', dy: 20, dx: 12 },
    { lon: -7.55, lat: 43.01, name: 'LUGO', yr: '2022–24', dy: -14 },
    { lon: -3.95, lat: 37.70, name: 'TORREDONJIMENO · MARTOS', yr: '2024 →', dy: 26, dx: -172 },
  ];
  const STUDY = { lon: -8.54, lat: 42.88, name: 'SANTIAGO · USC', dy: 20 };
  // the route, in order lived
  const ROUTE = [[-3.79, 37.77], [-3.60, 37.18], [-7.55, 43.01], [-3.95, 37.70]];

  const LON = [-9.9, 3.6], LAT = [35.6, 44.2];

  widget(document.getElementById('mapCanvas'), (g, t, w, h) => {
    g.clearRect(0, 0, w, h);
    const pad = 26;
    const kx = (w - pad * 2) / (LON[1] - LON[0]);
    const ky = (h - pad * 2) / (LAT[1] - LAT[0]);
    const k = Math.min(kx / 0.78, ky) ; // rough equirect: squash lat vs lon·cos(40°)
    const cx = w / 2 - ((LON[0] + LON[1]) / 2) * k * 0.78;
    const cy = h / 2 + ((LAT[0] + LAT[1]) / 2) * k;
    const X = (lon) => cx + lon * k * 0.78;
    const Y = (lat) => cy - lat * k;

    // the peninsula, hand-drawn (stable per-vertex wobble, breathing slowly)
    g.strokeStyle = 'rgba(246,236,221,0.4)';
    g.lineWidth = 1.8;
    g.setLineDash([]);
    g.beginPath();
    OUTLINE.forEach(([lon, lat], i) => {
      const jx = Math.sin(i * 12.9 + t * 0.3) * 1.2;
      const jy = Math.cos(i * 7.7 + t * 0.3) * 1.2;
      const x = X(lon) + jx, y = Y(lat) + jy;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    });
    g.closePath();
    g.stroke();
    g.fillStyle = 'rgba(246,236,221,0.03)';
    g.fill();

    g.font = 'italic 600 15px Georgia, serif';
    g.fillStyle = 'rgba(246,236,221,0.28)';
    g.fillText('E S P A Ñ A', X(-5.6), Y(40.1));

    // the flight in from Delhi — a dashed arc from off the map's east edge
    const jx0 = X(PINS[0].lon), jy0 = Y(PINS[0].lat);
    g.strokeStyle = 'rgba(240,135,109,0.65)';
    g.lineWidth = 1.6;
    g.setLineDash([5, 6]);
    g.lineDashOffset = -t * 14;
    g.beginPath();
    g.moveTo(w - 6, 22);
    g.quadraticCurveTo(w * 0.72, h * 0.05, jx0, jy0);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = CORAL;
    g.font = '600 11px "IBM Plex Mono", monospace';
    g.textAlign = 'right';
    g.fillText('✈ DELHI · 2019', w - 10, 40);
    g.textAlign = 'left';

    // the route between postings
    g.strokeStyle = 'rgba(233,180,76,0.55)';
    g.lineWidth = 1.6;
    g.setLineDash([2, 7]);
    g.lineDashOffset = -t * 10;
    g.beginPath();
    ROUTE.forEach(([lon, lat], i) => {
      i === 0 ? g.moveTo(X(lon), Y(lat)) : g.lineTo(X(lon), Y(lat));
    });
    g.stroke();
    g.setLineDash([]);

    // a spark travelling the whole journey
    const legs = [[[w - 6, 22], [jx0, jy0]]].concat(
      ROUTE.slice(1).map((p, i) => [[X(ROUTE[i][0]), Y(ROUTE[i][1])], [X(p[0]), Y(p[1])]])
    );
    const cycle = (t * 0.12) % 1;
    const li = Math.min(legs.length - 1, Math.floor(cycle * legs.length));
    const lt = cycle * legs.length - li;
    const [a, b] = legs[li];
    const sx = a[0] + (b[0] - a[0]) * lt;
    const sy = a[1] + (b[1] - a[1]) * lt - (li === 0 ? Math.sin(lt * Math.PI) * h * 0.12 : 0);
    const spark = g.createRadialGradient(sx, sy, 0, sx, sy, 9);
    spark.addColorStop(0, 'rgba(233,180,76,0.95)');
    spark.addColorStop(1, 'rgba(233,180,76,0)');
    g.fillStyle = spark;
    g.beginPath();
    g.arc(sx, sy, 9, 0, Math.PI * 2);
    g.fill();

    // where she studied — a quiet ring
    g.strokeStyle = 'rgba(143,214,183,0.8)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(X(STUDY.lon), Y(STUDY.lat), 5, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = 'rgba(143,214,183,0.8)';
    g.font = '600 10px "IBM Plex Mono", monospace';
    g.fillText(STUDY.name, X(STUDY.lon) - 34, Y(STUDY.lat) + STUDY.dy);

    // pins — gold, pulsing
    g.font = '600 11px "IBM Plex Mono", monospace';
    PINS.forEach((p, i) => {
      const x = X(p.lon), y = Y(p.lat);
      const pulse = 3.2 + Math.sin(t * 2 + i * 1.7) * 0.8;
      g.fillStyle = GOLD;
      g.beginPath();
      g.arc(x, y, pulse, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(233,180,76,0.35)';
      g.beginPath();
      g.arc(x, y, pulse + 5 + Math.sin(t * 2 + i * 1.7) * 2, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = CREAM;
      g.fillText(p.name, x + (p.dx || 10), y + p.dy);
      g.fillStyle = MUTED;
      g.fillText(p.yr, x + (p.dx || 10), y + p.dy + 13);
    });

    // compass rose, because every good map has one
    const rx = 40, ry = h - 44;
    g.strokeStyle = 'rgba(246,236,221,0.35)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(rx, ry, 15, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(rx, ry + 11); g.lineTo(rx, ry - 11);
    g.moveTo(rx - 11, ry); g.lineTo(rx + 11, ry);
    g.stroke();
    g.fillStyle = GOLD;
    g.beginPath();
    g.moveTo(rx, ry - 15); g.lineTo(rx - 3.5, ry - 5); g.lineTo(rx + 3.5, ry - 5);
    g.closePath();
    g.fill();
    g.fillStyle = MUTED;
    g.font = '600 9px "IBM Plex Mono", monospace';
    g.fillText('N', rx - 3, ry - 20);
  });
}

/* ================================================ the chalkboard hand */
{
  const PHRASES = [
    'Welcome, class!',
    'present perfect  ✓',
    'querer  →  to want',
    'a · e · i · o · u',
    '“practice makes progress”',
    '¡Muy bien! Keep going…',
  ];
  const WRITE_CPS = 14;      // characters per second
  const HOLD = 2.2;          // seconds a finished line stays up
  const FADE = 0.8;

  const dust = [];

  widget(document.getElementById('chalkCanvas'), (g, t, w, h) => {
    g.clearRect(0, 0, w, h);

    const durations = PHRASES.map((p) => p.length / WRITE_CPS + HOLD + FADE);
    const total = durations.reduce((a, b) => a + b, 0);
    let tt = t % total;
    let idx = 0;
    while (tt > durations[idx]) { tt -= durations[idx]; idx++; }
    const phrase = PHRASES[idx];
    const writeT = phrase.length / WRITE_CPS;
    const chars = Math.min(phrase.length, Math.floor(tt * WRITE_CPS));
    const alpha = tt > writeT + HOLD ? Math.max(0, 1 - (tt - writeT - HOLD) / FADE) : 1;

    const fs = Math.min(64, h * 0.46);
    g.font = `600 ${fs}px Caveat, cursive`;
    g.textBaseline = 'middle';

    // the written-so-far text, with a chalky double-strike
    const text = phrase.slice(0, chars);
    const tw = g.measureText(phrase).width;
    const x0 = Math.max(20, (w - tw) / 2);
    const y0 = h / 2 + Math.sin(idx * 3.1) * 4;
    g.globalAlpha = alpha * 0.92;
    g.fillStyle = '#eef4ec';
    g.fillText(text, x0, y0);
    g.globalAlpha = alpha * 0.25;
    g.fillText(text, x0 + 1.2, y0 + 1);
    g.globalAlpha = 1;

    // the chalk stub at the write point, plus falling dust
    if (chars < phrase.length && alpha === 1) {
      const cx = x0 + g.measureText(text).width + 4;
      const cy = y0 + fs * 0.18;
      g.fillStyle = '#eef4ec';
      g.save();
      g.translate(cx, cy);
      g.rotate(-0.7);
      g.fillRect(-2.5, -11, 5, 22);
      g.restore();
      if (Math.random() < 0.5) {
        dust.push({ x: cx, y: cy + 10, vy: 12 + Math.random() * 20, life: 1 });
      }
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i];
      d.y += d.vy * 0.016;
      d.life -= 0.02;
      if (d.life <= 0) { dust.splice(i, 1); continue; }
      g.globalAlpha = d.life * 0.5;
      g.fillStyle = '#eef4ec';
      g.fillRect(d.x + Math.sin(d.y * 0.3) * 2, d.y, 1.6, 1.6);
    }
    g.globalAlpha = 1;
  });
}

/* ================================================ the postage stamp */
{
  widget(document.getElementById('stampCanvas'), (g, t, w, h) => {
    g.fillStyle = '#251331';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2 - 5, R = Math.min(w, h) * 0.32;

    // globe
    g.strokeStyle = 'rgba(233,180,76,0.9)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.stroke();
    // meridians, rolling
    g.strokeStyle = 'rgba(233,180,76,0.45)';
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.12 + i / 3) % 1);
      const rx = Math.abs(Math.cos(p * Math.PI)) * R;
      if (rx > 1) {
        g.beginPath();
        g.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // equator + a tropic
    g.beginPath();
    g.ellipse(cx, cy, R, R * 0.32, 0, 0, Math.PI * 2);
    g.stroke();

    // Delhi → Spain arc with a travelling spark
    const ax = cx + R * 0.75, ay = cy + R * 0.25;
    const bx = cx - R * 0.8, by = cy - R * 0.3;
    g.strokeStyle = 'rgba(240,135,109,0.9)';
    g.setLineDash([2, 3]);
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(cx, cy - R * 1.4, bx, by);
    g.stroke();
    g.setLineDash([]);
    const p = (t * 0.35) % 1;
    const q = 1 - p;
    const sx = q * q * ax + 2 * q * p * cx + p * p * bx;
    const sy = q * q * ay + 2 * q * p * (cy - R * 1.4) + p * p * by;
    g.fillStyle = CREAM;
    g.beginPath();
    g.arc(sx, sy, 1.8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = GOLD;
    g.beginPath(); g.arc(ax, ay, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(bx, by, 2, 0, Math.PI * 2); g.fill();

    g.fillStyle = CREAM;
    g.font = '600 9px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('ESPAÑA', cx, h - 12);
    g.font = '600 8px "IBM Plex Mono", monospace';
    g.fillStyle = MUTED;
    g.fillText('DEL → LUG', cx, h - 3);
    g.textAlign = 'left';
  });
}
