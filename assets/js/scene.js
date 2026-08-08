/* Lamplit study — one WebGL scene behind the whole page.

   Intro: the storybook opens. The camera sits close on a plum-and-gold
   cover; the cover lifts, pages riffle, and a swarm of serif letters
   flutters out of the book like moths — then the camera pulls back to the
   hero framing while the name inks onto the page. After that the scene
   stays faintly alive behind the content: letters orbit the book in a slow
   vortex, a page turns every few seconds, a paper note glides its circuit,
   fireflies drift, and scroll speed stirs the whole room. */

import * as THREE from 'three';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none)').matches;

const COL = {
  night: 0x1c0f22,
  plum: 0x3a1f47,
  gold: 0xe9b44c,
  cream: 0xf6ecdd,
  coral: 0xf0876d,
  sage: 0x8fd6b7,
  lav: 0xbfa6cb,
};

const canvas = document.getElementById('webgl');
const holder = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COL.night, 0.011);

const HERO_CAM = new THREE.Vector3(0, 4.5, 24);
const HERO_LOOK = new THREE.Vector3(7, 3.2, -20);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 500);
camera.position.copy(HERO_CAM);
camera.lookAt(HERO_LOOK);

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* ------------------------------------------------ glow sprite for points */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTexture();

function lightField(positions, color, size, opacity = 0.95) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: GLOW,
    transparent: true, opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

/* ------------------------------------------------ painted textures */
/* the book's front cover — plum leather, gold rules, her monogram */
function coverTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 680;
  const g = c.getContext('2d');
  g.fillStyle = '#3a1f47';
  g.fillRect(0, 0, 512, 680);
  const grad = g.createRadialGradient(256, 300, 60, 256, 340, 520);
  grad.addColorStop(0, 'rgba(233,180,76,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 680);

  g.strokeStyle = '#e9b44c';
  g.lineWidth = 5;
  g.strokeRect(26, 26, 460, 628);
  g.lineWidth = 1.6;
  g.strokeRect(42, 42, 428, 596);

  // corner flourishes
  g.lineWidth = 2;
  for (const [x, y, sx, sy] of [[58, 58, 1, 1], [454, 58, -1, 1], [58, 622, 1, -1], [454, 622, -1, -1]]) {
    g.beginPath();
    g.moveTo(x, y + 34 * sy);
    g.quadraticCurveTo(x, y, x + 34 * sx, y);
    g.stroke();
  }

  g.fillStyle = '#e9b44c';
  g.textAlign = 'center';
  g.font = '600 150px Georgia, serif';
  g.fillText('P·J', 256, 330);
  g.font = 'italic 30px Georgia, serif';
  g.fillText('her story so far', 256, 400);
  g.font = '20px Georgia, serif';
  g.fillText('— · —', 256, 470);
  const tex = new THREE.CanvasTexture(c);
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI; // portrait — the monogram runs along the book's long axis
  return tex;
}

/* an open page — cream paper with faint ruled handwriting */
function pageTexture(lines = true) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 340;
  const g = c.getContext('2d');
  g.fillStyle = '#f3e9d4';
  g.fillRect(0, 0, 256, 340);
  g.fillStyle = 'rgba(58,36,48,0.05)';
  g.fillRect(0, 0, 12, 340);
  if (lines) {
    g.strokeStyle = 'rgba(90,60,80,0.30)';
    g.lineWidth = 1.4;
    for (let y = 40; y < 320; y += 22) {
      g.beginPath();
      let x = 26;
      g.moveTo(x, y);
      const len = 130 + Math.random() * 80;
      while (x < 26 + len) {
        const seg = 8 + Math.random() * 16;
        g.quadraticCurveTo(x + seg / 2, y - 3 - Math.random() * 3, x + seg, y);
        x += seg + 4;
      }
      g.stroke();
    }
  }
  return new THREE.CanvasTexture(c);
}

/* the distant chalkboard — tonight's lesson */
function boardTexture() {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 360;
  const g = c.getContext('2d');
  g.fillStyle = '#22322b';
  g.fillRect(0, 0, 640, 360);
  // chalk dust
  g.fillStyle = 'rgba(238,244,236,0.05)';
  for (let i = 0; i < 60; i++) {
    g.fillRect(Math.random() * 640, Math.random() * 360, 2 + Math.random() * 30, 1.5);
  }
  g.fillStyle = 'rgba(238,244,236,0.92)';
  g.font = '600 44px Georgia, serif';
  g.fillText('Today:', 36, 66);
  g.font = 'italic 38px Georgia, serif';
  g.fillText('the present perfect', 90, 128);
  g.font = '30px Georgia, serif';
  g.fillStyle = 'rgba(238,244,236,0.75)';
  g.fillText('I have been → he estado', 90, 182);
  g.fillText('vocab: journey · balcony · story', 90, 232);
  g.fillStyle = 'rgba(143,214,183,0.9)';
  g.font = '28px Georgia, serif';
  g.fillText('mock exam Friday — ¡ánimo!', 90, 296);
  // underline flourish
  g.strokeStyle = 'rgba(233,180,76,0.8)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(88, 140);
  g.quadraticCurveTo(280, 152, 428, 138);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

/* the warm pool of lamplight under the book */
function poolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(233,180,76,0.55)');
  rg.addColorStop(0.5, 'rgba(233,180,76,0.18)');
  rg.addColorStop(1, 'rgba(233,180,76,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* one glowing serif letter, for the moth-swarm */
function letterTexture(ch, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.fillStyle = color;
  g.font = (Math.random() < 0.4 ? 'italic ' : '') + '600 84px Georgia, serif';
  g.fillText(ch, 64, 70);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------ floor + lamplight pool */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshBasicMaterial({ color: 0x160a1c })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
scene.add(floor);

const BOOK_POS = new THREE.Vector3(10, 2.4, -14);

const pool = new THREE.Mesh(
  new THREE.CircleGeometry(16, 48),
  new THREE.MeshBasicMaterial({
    map: poolTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(BOOK_POS.x, 0.02, BOOK_POS.z);
scene.add(pool);

/* ------------------------------------------------ stars / drifting dust */
{
  const p = [];
  for (let i = 0; i < 380; i++) {
    p.push(
      (Math.random() - 0.5) * 500,
      14 + Math.random() * 160,
      -30 - Math.random() * 300
    );
  }
  scene.add(lightField(p, 0x9d86b8, 1.2, 0.5));
}

/* fireflies — two warm clouds that slowly counter-rotate */
const fireflies = [];
for (const [count, radius, color, size] of [[46, 26, COL.gold, 1.7], [30, 40, COL.coral, 1.4]]) {
  const p = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.35 + Math.random() * 0.65);
    p.push(Math.cos(a) * r, 0.6 + Math.random() * 9, Math.sin(a) * r);
  }
  const f = lightField(p, color, size, 0.75);
  f.position.set(BOOK_POS.x, 0, BOOK_POS.z);
  scene.add(f);
  fireflies.push(f);
}

/* ------------------------------------------------ the chalkboard, far wall */
{
  const board = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 9),
    new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.9 })
  );
  board.add(face);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x4b3021, roughness: 0.8 });
  const mk = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), frameMat);
    m.position.set(x, y, 0);
    board.add(m);
  };
  mk(17, 0.6, 0, 4.8); mk(17, 0.6, 0, -4.8);
  mk(0.6, 10.2, -8.3, 0); mk(0.6, 10.2, 8.3, 0);
  // chalk tray with a stub of chalk
  const tray = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.9), frameMat);
  tray.position.set(0, -5.2, 0.5);
  board.add(tray);
  const chalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8),
    new THREE.MeshBasicMaterial({ color: 0xeef4ec })
  );
  chalk.rotation.z = Math.PI / 2;
  chalk.position.set(1.2, -5.02, 0.5);
  board.add(chalk);

  board.position.set(-26, 6, -46);
  board.rotation.y = 0.42;
  scene.add(board);

  const boardGlow = new THREE.PointLight(0x8fd6b7, 30, 40, 2);
  boardGlow.position.set(-24, 7, -40);
  scene.add(boardGlow);
}

/* ------------------------------------------------ the storybook
   Lying open toward the camera. The spine runs along z at the group's
   x = -2.3 edge; the front cover and the riffling pages all hinge there.
   Everything is built closed, and the intro opens it. */
const book = new THREE.Group();
const coverMat = new THREE.MeshStandardMaterial({ color: COL.plum, roughness: 0.55, metalness: 0.15 });
const pageEdgeMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc2, roughness: 0.9 });
const pageFaceMat = new THREE.MeshStandardMaterial({ map: pageTexture(), roughness: 0.95 });

const SPINE_X = -2.3;
let frontCover, flipPages = [], leftStack, leftTopPage;
{
  // back cover — always flat
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 6.2), coverMat);
  back.position.y = 0.07;
  book.add(back);

  // the page block (right side once open)
  const block = new THREE.Mesh(new THREE.BoxGeometry(4.36, 0.52, 5.92), pageEdgeMat);
  block.position.y = 0.14 + 0.26;
  book.add(block);

  // top page of the block — faint handwriting
  const topR = new THREE.Mesh(new THREE.PlaneGeometry(4.36, 5.92), pageFaceMat);
  topR.rotation.x = -Math.PI / 2;
  topR.position.y = 0.675;
  book.add(topR);

  // the landing stack on the left — grows as the book opens
  leftStack = new THREE.Group();
  const ls = new THREE.Mesh(new THREE.BoxGeometry(4.36, 0.2, 5.92), pageEdgeMat);
  ls.position.set(SPINE_X - 2.18, 0.24, 0);
  const topL = new THREE.Mesh(new THREE.PlaneGeometry(4.36, 5.92), new THREE.MeshStandardMaterial({
    map: pageTexture(), roughness: 0.95, transparent: true,
  }));
  topL.rotation.x = -Math.PI / 2;
  topL.position.set(SPINE_X - 2.18, 0.345, 0);
  leftTopPage = topL;
  leftStack.add(ls, topL);
  leftStack.visible = false;
  book.add(leftStack);

  // front cover — hinged at the spine, monogram facing up while closed
  frontCover = new THREE.Group();
  frontCover.position.set(SPINE_X, 0.72, 0);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.14, 6.2),
    [coverMat, coverMat, // sides
      new THREE.MeshStandardMaterial({ map: coverTexture(), roughness: 0.5 }), // top (+y)
      coverMat, coverMat, coverMat]
  );
  lid.position.set(2.3, 0, 0);
  frontCover.add(lid);
  book.add(frontCover);

  // a handful of riffling pages, hinged like the cover
  for (let i = 0; i < 5; i++) {
    const hinge = new THREE.Group();
    hinge.position.set(SPINE_X, 0.68 - i * 0.02, 0);
    const geo = new THREE.PlaneGeometry(4.36, 5.92, 22, 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(2.18, 0, 0);
    const page = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: pageTexture(), roughness: 0.95, side: THREE.DoubleSide,
    }));
    hinge.add(page);
    hinge.visible = false;
    hinge.userData.base = geo.attributes.position.array.slice();
    flipPages.push(hinge);
    book.add(hinge);
  }

  book.position.copy(BOOK_POS);
  book.rotation.y = -0.5;
  scene.add(book);
}

/* bend a hinged page: bulge follows how far through the turn it is */
const _bendTmp = new THREE.Vector3();
function bendPage(hinge, turn) {
  const page = hinge.children[0];
  const pos = page.geometry.attributes.position;
  const base = hinge.userData.base;
  const bulge = Math.sin(turn * Math.PI) * 0.85;
  for (let i = 0; i < pos.count; i++) {
    const bx = base[i * 3];
    pos.setY(i, base[i * 3 + 1] + Math.sin((bx / 4.36) * Math.PI) * bulge);
  }
  pos.needsUpdate = true;
  page.geometry.computeVertexNormals();
  hinge.rotation.z = turn * Math.PI * 0.98;
}

/* ------------------------------------------------ the letter moths */
const VORTEX = new THREE.Vector3(BOOK_POS.x, 7.2, BOOK_POS.z);
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  .concat(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'ñ', '¿', '¡', '&', '?', 'ß', 'ç', 'ü', 'th', 'ing']);
const LETTER_COLS = ['#f6ecdd', '#f6ecdd', '#e9b44c', '#e9b44c', '#f0876d', '#8fd6b7'];
const letters = [];
{
  for (let i = 0; i < 42; i++) {
    const ch = GLYPHS[i % GLYPHS.length];
    const color = LETTER_COLS[Math.floor(Math.random() * LETTER_COLS.length)];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: letterTexture(ch, color), transparent: true, opacity: 0,
      depthWrite: false,
    }));
    const scale = 0.9 + Math.random() * 1.1;
    s.scale.setScalar(scale);
    scene.add(s);
    const a0 = Math.random() * Math.PI * 2;
    letters.push({
      s,
      r: 4 + Math.random() * 10,          // orbit radius
      h: -2.5 + Math.random() * 8,        // height offset from vortex centre
      a0,                                 // start angle (phase for shimmer/bob)
      angle: a0,                          // accumulated orbit angle
      speed: (0.06 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
      bobF: 0.5 + Math.random() * 0.8,
      bobA: 0.3 + Math.random() * 0.6,
      delay: Math.random() * 0.9,         // burst stagger
      burst: 0,                           // 0 = in the book, 1 = free
      baseScale: scale,
    });
  }
}

function placeLetter(L, t, dt, swirl) {
  const b = easeOutCubic(L.burst);
  L.angle += L.speed * swirl * dt;
  const angle = L.angle + (1 - b) * 3.5;
  const r = L.r * (0.12 + 0.88 * b);
  const y = THREE.MathUtils.lerp(BOOK_POS.y + 0.8, VORTEX.y + L.h, b)
    + Math.sin(t * L.bobF + L.a0) * L.bobA * b;
  L.s.position.set(
    VORTEX.x + Math.cos(angle) * r,
    y,
    VORTEX.z + Math.sin(angle) * r * 0.72
  );
  L.s.material.opacity = b * (0.55 + 0.35 * Math.sin(t * 1.4 + L.a0 * 3));
  L.s.material.rotation = Math.sin(t * 0.6 + L.a0) * 0.25;
  L.s.scale.setScalar(L.baseScale * (0.4 + 0.6 * b));
}

/* ------------------------------------------------ book stacks on the floor */
{
  const stackCols = [COL.plum, 0x6d3a56, COL.gold, 0x2e5f52, 0x8a4a3a, 0x51356b];
  const stacks = [[4, 2.5, -8], [17.5, -1, -9], [14, 6, -22], [-2, 12, -20]];
  for (const [sx, sz, ry] of stacks.map(([x, z]) => [x, z, Math.random() * 6])) {
    let y = 0;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const w = 2.6 + Math.random() * 1.2;
      const h = 0.38 + Math.random() * 0.22;
      const d = 1.8 + Math.random() * 0.8;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: stackCols[Math.floor(Math.random() * stackCols.length)],
          roughness: 0.65,
        })
      );
      b.position.set(sx + (Math.random() - 0.5) * 0.5, y + h / 2, sz + (Math.random() - 0.5) * 0.4);
      b.rotation.y = ry + (Math.random() - 0.5) * 0.5;
      scene.add(b);
      y += h;
    }
  }
}

/* ------------------------------------------------ the paper note
   A folded paper dart gliding a lazy circuit — the note passed in class,
   and the one-way ticket, both. */
const note = new THREE.Group();
let notePath;
{
  const geo = new THREE.BufferGeometry();
  // two triangles folded into a dart, nose at +z
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 1.4, -0.9, 0.32, -0.7, 0, 0.05, -0.5,   // left wing
    0, 0, 1.4, 0, 0.05, -0.5, 0.9, 0.32, -0.7,    // right wing
    0, 0, 1.4, 0, -0.42, -0.55, 0, 0.05, -0.5,    // keel
  ], 3));
  geo.computeVertexNormals();
  const dart = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: COL.cream, roughness: 0.8, side: THREE.DoubleSide,
  }));
  note.add(dart);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW, color: COL.gold, transparent: true, opacity: 0.35,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glow.scale.setScalar(2.2);
  note.add(glow);
  scene.add(note);

  notePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-24, 9, -30),
    new THREE.Vector3(-4, 13, -44),
    new THREE.Vector3(22, 10, -30),
    new THREE.Vector3(28, 6, -6),
    new THREE.Vector3(6, 8, 2),
    new THREE.Vector3(-20, 6, -8),
  ], true, 'catmullrom', 0.6);
}

/* dotted ink trail behind the note */
const trail = [];
const _tail = new THREE.Vector3();
for (let i = 0; i < 30; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW, color: COL.lav, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(s);
  trail.push({ s, life: 0 });
}
let trailIdx = 0;
let trailClock = 0;

/* ------------------------------------------------ lights */
scene.add(new THREE.AmbientLight(0x4a3060, 1.7));
const key = new THREE.DirectionalLight(0xbfa6cb, 1.1);
key.position.set(-20, 50, 30);
scene.add(key);
const lamp = new THREE.PointLight(COL.gold, 90, 70, 1.9);
lamp.position.set(BOOK_POS.x, 9, BOOK_POS.z + 4);
scene.add(lamp);
const ember = new THREE.PointLight(COL.coral, 40, 60, 2);
ember.position.set(-18, 4, -10);
scene.add(ember);

/* ================================================ intro: the book opens
   Close on the cover → the lid lifts → pages riffle while letters burst
   out and spiral into their vortex → the camera pulls back to the hero
   framing while the name inks on. */
const T_OPEN0 = 1.0;   // lid starts lifting
const T_OPEN1 = 2.1;   // lid flat on the left
const T_FLIP0 = 1.9;   // pages start riffling
const T_FLIP1 = 3.8;
const T_BURST = 2.25;  // letters leave the book
const T_PULL = 3.5;    // camera starts easing back
const T_PRINT0 = 3.9;  // hero text starts inking
const T_PRINT1 = 5.7;
const T_END = 6.4;

const HUD_LINES = [
  [0.0, 'CHAPTER I · A GIRL WHO LOVED WORDS'],
  [2.15, 'SHE PACKED HER BOOKS AND FLEW WEST'],
  [4.15, 'SEVEN YEARS · FIVE TOWNS · A THOUSAND LESSONS'],
];

let introOn = !REDUCED;
let introT = 0;
const introEl = document.getElementById('intro');
const introLine = document.getElementById('introLine');
const introPage = document.getElementById('introPage');
const heroInner = document.querySelector('.hero__inner');

function setPrintMask(pct) {
  if (!heroInner) return;
  if (pct >= 115) {
    heroInner.style.maskImage = heroInner.style.webkitMaskImage = '';
    return;
  }
  const m = `linear-gradient(100deg, #000 ${pct - 9}%, transparent ${pct}%)`;
  heroInner.style.webkitMaskImage = m;
  heroInner.style.maskImage = m;
}

function endIntro() {
  if (!introOn) return;
  introOn = false;
  document.body.classList.add('ready');
  document.body.classList.remove('intro-lock');
  if (introEl) introEl.classList.add('intro--done');
  setPrintMask(120);
  // settle the book fully open
  frontCover.rotation.z = Math.PI * 0.98;
  leftStack.visible = true;
  leftTopPage.material.opacity = 1;
  for (const L of letters) L.burst = 1;
  for (const h of flipPages) h.visible = false;
  camera.fov = 52;
  camera.updateProjectionMatrix();
}

if (introOn) {
  document.body.classList.add('intro-lock');
  setPrintMask(-10); // hero hidden until the book writes it
  const skip = () => endIntro();
  document.getElementById('introSkip')?.addEventListener('click', skip);
  addEventListener('wheel', skip, { once: true, passive: true });
  addEventListener('touchmove', skip, { once: true, passive: true });
  addEventListener('keydown', skip, { once: true });
} else {
  document.body.classList.add('ready');
  if (introEl) introEl.classList.add('intro--done');
  endIntro();
}

/* intro camera: a slow orbit close over the cover */
const _iCam = new THREE.Vector3();
const _iLook = new THREE.Vector3();

function introFrame(dt, t) {
  introT += dt;
  if (introT >= T_END) { endIntro(); return; }

  // the lid opens
  const open = easeInOutCubic(clamp01((introT - T_OPEN0) / (T_OPEN1 - T_OPEN0)));
  frontCover.rotation.z = open * Math.PI * 0.98;
  if (open > 0.9 && !leftStack.visible) {
    leftStack.visible = true;
    leftTopPage.material.opacity = 0;
  }
  if (leftStack.visible && leftTopPage.material.opacity < 1) {
    leftTopPage.material.opacity = Math.min(1, leftTopPage.material.opacity + dt * 2);
  }

  // pages riffle — each hinge takes a staggered turn
  const flipSpan = (T_FLIP1 - T_FLIP0) / flipPages.length;
  flipPages.forEach((h, i) => {
    const f0 = T_FLIP0 + i * flipSpan;
    const turn = clamp01((introT - f0) / (flipSpan * 1.7));
    if (turn > 0 && turn < 1) {
      h.visible = true;
      bendPage(h, turn);
    } else {
      h.visible = false;
    }
  });

  // letters burst out of the spine
  if (introT > T_BURST) {
    for (const L of letters) {
      L.burst = clamp01((introT - T_BURST - L.delay) / 1.7);
    }
  }
  // fast and lively while they pour out of the book
  for (const L of letters) placeLetter(L, t, dt, 1.6);

  // camera: close orbit over the cover, then the pull-back
  const orbit = introT * 0.14;
  _iCam.set(
    BOOK_POS.x + Math.sin(orbit + 0.6) * 7.5,
    BOOK_POS.y + 4.6 + introT * 0.28,
    BOOK_POS.z + Math.cos(orbit + 0.6) * 7.5 + 2
  );
  _iLook.copy(BOOK_POS);

  if (introT > T_PULL) {
    const b = easeInOutCubic(clamp01((introT - T_PULL) / (T_END - T_PULL)));
    _iCam.lerp(HERO_CAM, b);
    _iLook.lerp(HERO_LOOK, b);
  }
  camera.position.copy(_iCam);
  camera.lookAt(_iLook);
  camera.fov = 40 + 12 * clamp01((introT - T_PULL) / (T_END - T_PULL));
  camera.updateProjectionMatrix();

  // hero text inks on during the pull-back
  if (introT > T_PRINT0) {
    if (!document.body.classList.contains('ready')) document.body.classList.add('ready');
    setPrintMask(-10 + 130 * clamp01((introT - T_PRINT0) / (T_PRINT1 - T_PRINT0)));
  }

  // page counter — the riffle sold as page numbers
  if (introPage) {
    const pg = 1 + Math.round(213 * clamp01((introT - T_FLIP0) / (T_PRINT1 - T_FLIP0)));
    introPage.textContent = String(pg).padStart(3, '0');
  }

  // HUD lines
  if (introLine) {
    for (let i = HUD_LINES.length - 1; i >= 0; i--) {
      if (introT >= HUD_LINES[i][0]) {
        if (introLine.textContent !== HUD_LINES[i][1]) introLine.textContent = HUD_LINES[i][1];
        break;
      }
    }
  }
}

/* ------------------------------------------------ interaction state */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
if (!TOUCH) {
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
}

/* scroll state: the camera drifts to a new vantage for every chapter */
const STAGE_DEFS = [
  ['home',       [0, 4.5, 24],    [7, 3.2, -20],   1.0],  // the study at large
  ['about',      [-8, 5.5, 16],   [10, 2.5, -14],  0.5],  // the book, from the armchair
  ['curriculum', [7, 11, -3],     [10, 1.5, -15],  0.45], // leaning over the pages
  ['experience', [-3, 7, 12],     [-12, 6, -38],   0.5],  // following the paper note
  ['skills',     [-9, 5.5, -16],  [-26, 6, -46],   0.5],  // up at the chalkboard
  ['education',  [7, 3.4, 1],     [17, 1, -18],    0.5],  // down among the stacks
  ['languages',  [3, 8.5, 6],     [10, 7.5, -14],  0.5],  // inside the letter vortex
  ['contact',    [2, 26, 10],     [10, 0, -14],    0.9],  // high above the lamplight
];
const stages = STAGE_DEFS.map(([id, cam, look, fade]) => ({
  el: document.getElementById(id),
  cam: new THREE.Vector3(...cam),
  look: new THREE.Vector3(...look),
  fade,
  y: 0,
})).filter((s) => s.el);

function layoutStages() {
  for (const s of stages) s.y = Math.max(0, s.el.offsetTop - innerHeight * 0.45);
}
layoutStages();
addEventListener('load', layoutStages);

let lastScrollY = scrollY;
let scrollVel = 0;

const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();
function stageCamera() {
  let i = 0;
  while (i < stages.length - 1 && scrollY >= stages[i + 1].y) i++;
  const a = stages[i];
  const b = stages[Math.min(i + 1, stages.length - 1)];
  const span = Math.max(1, b.y - a.y);
  const f = a === b ? 0 : easeInOutSine(clamp01((scrollY - a.y) / span));
  _camPos.lerpVectors(a.cam, b.cam, f);
  _camLook.lerpVectors(a.look, b.look, f);
  holder.style.opacity = (a.fade + (b.fade - a.fade) * f).toFixed(3);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  layoutStages();
});

/* ------------------------------------------------ loop */
const clock = new THREE.Clock();
const _next = new THREE.Vector3();
let noteT = Math.random();
let ambientFlip = 0;     // 0..1 progress of the idle page turn
let flipWait = 4;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  // smoothed scroll velocity stirs the room
  const v = Math.abs(scrollY - lastScrollY);
  lastScrollY = scrollY;
  scrollVel += (Math.min(v, 60) - scrollVel) * 0.06;

  // the book breathes
  book.position.y = BOOK_POS.y + Math.sin(t * 0.5) * 0.18;
  book.rotation.y = -0.5 + Math.sin(t * 0.18) * 0.04;

  if (introOn) {
    introFrame(dt, t);
  } else {
    // camera: the current chapter's vantage + mouse parallax + slow drift
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    stageCamera();
    camera.position.set(
      _camPos.x + mouse.x * 2.6 + Math.sin(t * 0.1) * 0.6,
      _camPos.y - mouse.y * 1.2,
      _camPos.z
    );
    camera.lookAt(_camLook.x + mouse.x * 4.5, _camLook.y - mouse.y * 2, _camLook.z);

    // letters drift the vortex lazily once the page has landed —
    // scrolling stirs them, but only so much
    const swirl = 0.42 + Math.min(scrollVel * 0.06, 1.0);
    for (const L of letters) placeLetter(L, t, dt, swirl);

    // an idle page turns every few seconds (sooner when scrolling fast)
    if (ambientFlip <= 0) {
      flipWait -= dt * (1 + scrollVel * 0.25);
      if (flipWait <= 0) { ambientFlip = 0.0001; flipWait = 5 + Math.random() * 4; }
    } else {
      ambientFlip += dt * 0.55;
      const h = flipPages[0];
      if (ambientFlip >= 1) {
        ambientFlip = 0;
        h.visible = false;
      } else {
        h.visible = true;
        bendPage(h, easeInOutSine(ambientFlip));
      }
    }
  }

  // the paper note glides its circuit
  const speed = 0.016 * (1 + scrollVel * 0.1);
  noteT = (noteT + speed * dt) % 1;
  const pos = notePath.getPointAt(noteT);
  const tan = notePath.getTangentAt(noteT);
  note.position.copy(pos);
  _next.copy(pos).add(tan);
  note.lookAt(_next);
  const ahead = notePath.getTangentAt((noteT + 0.015) % 1);
  const bank = tan.x * ahead.z - tan.z * ahead.x;
  note.rotation.z = THREE.MathUtils.clamp(bank * 40, -0.6, 0.6);

  // ink trail
  trailClock += dt;
  if (trailClock > 0.09) {
    trailClock = 0;
    const seg = trail[trailIdx = (trailIdx + 1) % trail.length];
    _tail.set(0, 0.1, -0.8);
    note.localToWorld(_tail);
    seg.s.position.copy(_tail);
    seg.life = 1;
  }
  for (const seg of trail) {
    if (seg.life <= 0) continue;
    seg.life = Math.max(0, seg.life - dt * 0.4);
    seg.s.material.opacity = seg.life * 0.28;
    seg.s.scale.setScalar(0.5 + (1 - seg.life) * 1.8);
  }

  // fireflies drift and breathe
  fireflies[0].rotation.y = t * 0.03;
  fireflies[1].rotation.y = -t * 0.02;
  fireflies[0].material.opacity = 0.6 + Math.sin(t * 0.8) * 0.2;
  fireflies[1].material.opacity = 0.5 + Math.sin(t * 0.6 + 2) * 0.2;

  // lamplight flickers, barely
  lamp.intensity = 90 + Math.sin(t * 7.3) * 4 + Math.sin(t * 1.7) * 5;
  pool.material.opacity = 0.85 + Math.sin(t * 1.7) * 0.1;

  renderer.render(scene, camera);
}

/* pause only when the tab is hidden — the scene lives behind the whole page */
let running = false;
let raf = 0;
function loop() {
  tick();
  raf = requestAnimationFrame(loop);
}
function setRunning(on) {
  if (on === running) return;
  running = on;
  if (on) { clock.getDelta(); loop(); }
  else { cancelAnimationFrame(raf); }
}

if (REDUCED) {
  tick(); // single static frame — book open, letters settled
} else {
  setRunning(true);
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
}
