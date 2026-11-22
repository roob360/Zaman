/* Antarmuka Zaman: kanvas peta, kontrol, alat dewa, inspektur, simpan/muat.
   Simulasi berjalan di Worker (js/worker.js). File ini tidak menjalankan simulasi apa pun. */
(function () {
'use strict';
const W = 128, H = 96, SC = 4;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pct = v => Math.round(v * 100);
const fmt = n => Math.round(n).toLocaleString('id-ID');

/* ---------- ikon ---------- */
const IC = {
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  wand: '<svg viewBox="0 0 24 24"><path d="M5 19 16 8M14 6l4 4M6 5v3M4.5 6.5h3M18 15v3M16.5 16.5h3"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M6 21V4M6 5h11l-2 4 2 4H6"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>',
  step: '<svg viewBox="0 0 24 24"><path d="M6 5v14l9-7zM18 5v14" /></svg>',
  fit: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};
$$('i[data-ic]').forEach(i => { i.innerHTML = IC[i.dataset.ic] || ''; });

/* ---------- data statis ---------- */
const BIOME = ['Laut dalam', 'Laut', 'Pantai', 'Gurun', 'Padang rumput', 'Sabana', 'Hutan', 'Hutan hujan', 'Taiga', 'Tundra', 'Pegunungan', 'Salju'];
const BCOL = ['#14376b', '#1f5a9e', '#e0cf94', '#dcc27a', '#8fc15a', '#b9b957', '#3f8f43', '#217a3a', '#4f7d5e', '#9aa89a', '#8a8780', '#f2f6fa'].map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
const ERAS = ['Zaman Batu', 'Neolitik', 'Zaman Kuno', 'Abad Pertengahan', 'Era Industri', 'Era Modern'];
const JOBS = ['Pemburu-peramu', 'Petani', 'Pengrajin', 'Pedagang', 'Prajurit', 'Cendekiawan'];
const GCOL = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2'];
const GN = ['A', 'B', 'C', 'D'];
const SPOTS = { sungai: 'Tepi sungai subur', gurun: 'Gurun dekat sungai', gurundalam: 'Gurun tanpa air', tundra: 'Tundra', acak: 'Otomatis' };
const PRESETS = [
  { nama: 'Dua kelompok setara', g: [{ n: 40, iq: .5, ag: .4, spot: 'sungai' }, { n: 40, iq: .5, ag: .4, spot: 'sungai' }] },
  { nama: 'Orang pintar di gurun', g: [{ n: 40, iq: .85, ag: .3, spot: 'gurun' }] },
  { nama: 'Orang pintar di gurun tanpa air', g: [{ n: 40, iq: .9, ag: .3, spot: 'gurundalam' }] },
  { nama: 'Kurang cerdas di tanah subur', g: [{ n: 40, iq: .25, ag: .4, spot: 'sungai' }] },
  { nama: 'Pintar damai vs agresif', g: [{ n: 40, iq: .8, ag: .15, spot: 'sungai', leader: 'damai' }, { n: 40, iq: .4, ag: .8, spot: 'sungai', leader: 'agresif' }] },
  { nama: 'Kelompok di tundra', g: [{ n: 40, iq: .6, ag: .3, spot: 'tundra' }] },
  { nama: 'Satu kelompok biasa', g: [{ n: 40, iq: .5, ag: .4, spot: 'sungai' }] }
];
const TOOLS = [
  { h: 'Info' }, { id: 'pilih', n: 'Pilih', e: '👆', hint: 'Ketuk individu, kota, atau wilayah untuk melihat detail.' },
  { h: 'Medan' },
  { id: 'naik', n: 'Naikkan', e: '⛰️', brush: 1, hint: 'Seret untuk menaikkan tanah. Laut dangkal bisa menjadi daratan.' },
  { id: 'turun', n: 'Turunkan', e: '🕳️', brush: 1, hint: 'Seret untuk menurunkan tanah. Permukiman yang tenggelam binasa.' },
  { id: 'daratan', n: 'Daratan', e: '🟩', brush: 1, hint: 'Ubah laut menjadi daratan.' },
  { id: 'laut', n: 'Laut', e: '🌊', brush: 1, hint: 'Ubah daratan menjadi laut.' },
  { id: 'gunung', n: 'Gunung', e: '🏔️', brush: 1, hint: 'Bentuk pegunungan. Ini mengubah hujan dan suhu setempat.' },
  { id: 'sungai', n: 'Sungai', e: '💧', brush: 1, hint: 'Tambahkan aliran air di daratan.' },
  { id: 'hutan', n: 'Tanam hutan', e: '🌲', brush: 1, hint: 'Pulihkan tutupan hutan.' },
  { id: 'tebang', n: 'Tebang hutan', e: '🪓', brush: 1, hint: 'Hilangkan tutupan hutan. Dampaknya pada air dan tanah dihitung simulasi.' },
  { h: 'Penduduk' },
  { id: 'spawn', n: 'Munculkan', e: '🧑‍🤝‍🧑', hint: 'Ketuk daratan. Dekat kota akan menambah penduduk, di tempat kosong membentuk kelompok baru.' },
  { id: 'trait', n: 'Ubah sifat', e: '🧠', hint: 'Ketuk satu individu untuk mengubah IQ dan agresinya.' },
  { id: 'promote', n: 'Angkat pemimpin', e: '👑', hint: 'Ketuk individu dewasa untuk menjadikannya pemimpin bangsanya.' },
  { id: 'kill', n: 'Matikan', e: '☠️', hint: 'Ketuk individu untuk mematikannya.' },
  { h: 'Kota dan bangsa' },
  { id: 'tech', n: 'Beri teknologi', e: '💡', hint: 'Ketuk kota. Prasyarat teknologi ikut diberikan.' },
  { id: 'untech', n: 'Cabut teknologi', e: '🧯', hint: 'Ketuk kota. Teknologi turunannya ikut hilang.' },
  { id: 'feed', n: 'Beri pangan', e: '🌾', hint: 'Ketuk kota untuk menurunkan persediaan pangan.' },
  { id: 'famine', n: 'Paceklik', e: '🥀', hint: 'Ketuk kota untuk menghabiskan persediaan pangan.' },
  { id: 'plague', n: 'Wabah', e: '🦠', hint: 'Ketuk kota untuk mengirim wabah.' },
  { id: 'smite', n: 'Murka', e: '⚡', hint: 'Ketuk kota. Sebagian penduduk tewas (pemimpin selamat).' },
  { h: 'Diplomasi' },
  { id: 'war', n: 'Perang', e: '⚔️', hint: 'Ketuk dua bangsa secara berurutan.' },
  { id: 'peace', n: 'Damai', e: '🕊️', hint: 'Ketuk dua bangsa yang sedang berperang.' },
  { id: 'ally', n: 'Aliansi', e: '🤝', hint: 'Ketuk dua bangsa.' }
];
const OVERLAYS = [['normal', 'Normal'], ['biom', 'Biom'], ['suhu', 'Suhu'], ['hujan', 'Hujan'], ['hutan', 'Hutan'], ['politik', 'Politik']];
const LEGENDS = {
  normal: [['#3f8f43', 'Hutan'], ['#8fc15a', 'Padang rumput'], ['#dcc27a', 'Gurun'], ['#9a8a5a', 'Hutan gundul'], ['#1f5a9e', 'Laut']],
  biom: BCOL.map((c, i) => ['rgb(' + c + ')', BIOME[i]]),
  suhu: [['#3a6fd8', 'Dingin'], ['#37c4a0', 'Sejuk'], ['#e8d84a', 'Hangat'], ['#e0482e', 'Panas']],
  hujan: [['#d9c58a', 'Kering'], ['#6fbf9a', 'Sedang'], ['#2a6fd0', 'Basah']],
  hutan: [['#9a7a4a', 'Gundul'], ['#4f9a3c', 'Lebat']],
  politik: [['#888', 'Warna sesuai bangsa']]
};

/* ---------- state ---------- */
const st = {
  phase: 'setup', running: false, speed: 0.4, world: null, snap: null, tab: 'dunia',
  ov: 'normal', showAg: true, showBo: true, showLb: true, tool: 'pilih', mode: 'pilih', brush: 4,
  o: { n: 30, iq: .5, ag: .4, leader: 'auto', newP: false, tech: 'agri', frac: .3, yrs: 3, tIq: .8, tAg: .3 },
  sel: null, pend: null, tick: 0, season: 0, tickAt: 0, groups: [], coords: [], seed: 1, cap: 2000, techs: [], hover: null, lastSaveYear: 0, autoOn: true,
  pols: new Map(), polName: new Map()
};
const view = { x: 0, y: 0, z: 6 };
let wk, dirty = true, tRender = 0, lastPanel = 0, lastInsp = 0;

/* ---------- worker ---------- */
function startWorker() {
  wk = new Worker('js/worker.js');
  wk.onmessage = onMsg;
  wk.onerror = e => toast('Kesalahan Worker: ' + (e.message || 'tidak diketahui'), 5000);
}
function post(m) { wk.postMessage(m); }
const saveReq = new Map(); let reqSeq = 0;
function onMsg(e) {
  const m = e.data;
  switch (m.type) {
    case 'ready': st.techs = m.techs; st.coords = m.coords; fillTechOpts(); renderGroups(); break;
    case 'spots': st.coords = m.coords; renderGroups(); dirty = true; break;
    case 'world': st.world = m; buildTerrain(); dirty = true; break;
    case 'snap': onSnap(m); break;
    case 'started': st.phase = 'run'; $('#btnStart').textContent = 'Mulai ulang dengan pengaturan ini'; break;
    case 'loaded': st.phase = 'run'; st.sel = null; closeInsp(); $('#btnStart').textContent = 'Mulai ulang dengan pengaturan ini'; toast('Simpanan dimuat'); break;
    case 'saved': { const f = saveReq.get(m.reqId); saveReq.delete(m.reqId); if (f) f(m.state); break; }
    case 'godres': if (m.ok === false) toast('Aksi tidak bisa dilakukan di sini'); break;
    case 'error': console.error(m.message); toast('Kesalahan simulasi. Lihat konsol.', 5000); break;
  }
}
function requestSave() { return new Promise(res => { const id = ++reqSeq; saveReq.set(id, res); post({ t: 'save', reqId: id }); }); }

/* ---------- snapshot ---------- */
function onSnap(m) {
  if (m.tick !== st.tick) { st.tickAt = performance.now(); }
  st.tick = m.tick; st.season = m.season; st.snap = m; st.running = m.running; st.seasonDirty = true;
  st.pols = new Map(m.pols.map(p => [p.id, p]));
  updateDate();
  $('#pop').textContent = fmt(m.pop) + ' jiwa';
  $('#eraName').textContent = ERAS[m.stats.maxEra] || '-';
  setPlayIcon();
  post({ t: 'ack' });
  dirty = true;
  const now = performance.now();
  if (now - lastPanel > 600) { lastPanel = now; updatePanels(); }
  if (now - lastInsp > 350) { lastInsp = now; renderInsp(); }
  if (st.autoOn && st.phase === 'run' && m.year - st.lastSaveYear >= 100 && m.pop > 0) { st.lastSaveYear = m.year; autosave(); }
}
const SN = {
  trop: ['Awal Hujan', 'Puncak Hujan', 'Awal Kemarau', 'Puncak Kemarau'],
  temp: ['Musim Semi', 'Musim Panas', 'Musim Gugur', 'Musim Dingin'],
  pol: ['Pencairan', 'Panas Singkat', 'Gugur Cepat', 'Dingin Panjang']
};
const zoneOf = lat => lat < 0.28 ? 'trop' : lat < 0.62 ? 'temp' : 'pol';
const phaseAt = (season, y) => (season + (y > (H - 1) / 2 ? 2 : 0)) % 4;
function viewY() { const r = cv.getBoundingClientRect(); return clamp(Math.floor((r.height / 2 - view.y) / view.z), 0, H - 1); }
let lastDate = '';
function updateDate() {
  const m = st.snap; if (!m) return;
  const y = viewY(), lat = Math.abs(y - (H - 1) / 2) / ((H - 1) / 2), ph = phaseAt(m.season, y);
  const stepMs = st.running ? 1000 / Math.max(0.05, st.speed) : 1e9, fr = st.running ? clamp((performance.now() - st.tickAt) / stepMs, 0, 0.999) : 0;
  const day = 1 + Math.floor(fr * 91);
  const t = m.tick === 0 ? 'Tahun 0' : 'Tahun ' + fmt(m.year) + ' · ' + SN[zoneOf(lat)][ph] + ' · hari ' + day;
  if (t !== lastDate) { lastDate = t; $('#yr').textContent = t; }
}
function setPlayIcon() { $('#btnPlay').innerHTML = IC[st.running ? 'pause' : 'play']; }

/* ---------- terrain offscreen ---------- */
const terr = document.createElement('canvas'); terr.width = W * SC; terr.height = H * SC;
const own = document.createElement('canvas'); own.width = W * 2; own.height = H * 2;
function hash(i) { i = Math.imul(i ^ (i >>> 15), 0x2c1b3c6d); i = Math.imul(i ^ (i >>> 12), 0x297a2d39); return ((i ^ (i >>> 15)) >>> 0) / 4294967296; }
function lerp(a, b, t) { return a + (b - a) * t; }
function ramp(stops, t) {
  t = clamp(t, 0, 1) * (stops.length - 1); const i = Math.min(stops.length - 2, t | 0), f = t - i, a = stops[i], b = stops[i + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}
const RT = [[58, 111, 216], [55, 196, 160], [232, 216, 74], [224, 72, 46]];
const RR = [[217, 197, 138], [111, 191, 154], [42, 111, 208]];
const RH = [[154, 122, 74], [79, 154, 60]];
const SOIL = [154, 138, 90];
// Warna musiman kosmetik: salju di lintang tinggi saat dingin, hutan gugur menguning, savana tropis mengering.
function seasonTint(c, b, y, season) {
  const lat = Math.abs(y - (H - 1) / 2) / ((H - 1) / 2), ph = phaseAt(season, y), z = zoneOf(lat), mix = (t, k) => [lerp(c[0], t[0], k), lerp(c[1], t[1], k), lerp(c[2], t[2], k)];
  if (z !== 'trop' && ph === 3 && b !== 3 && b !== 10 && b !== 11) return mix([240, 244, 250], clamp((lat - 0.38) / 0.45, 0, 1) * 0.8);
  if (z !== 'trop' && ph === 2 && (b === 6 || b === 8 || b === 4)) return mix([205, 125, 45], 0.28);
  if (z === 'trop' && ph >= 2 && (b === 4 || b === 5 || b === 6)) return mix([205, 175, 100], ph === 3 ? 0.3 : 0.15);
  return c;
}
function buildTerrain() {
  const w = st.world; if (!w) return;
  const ctx = terr.getContext('2d'), img = ctx.createImageData(W * SC, H * SC), d = img.data, ov = st.ov;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, land = w.land[i], b = w.biome[i]; let c;
    if (!land) {
      const t = clamp((w.h[i] + 0.6) / 0.6, 0, 1); c = [lerp(BCOL[0][0], BCOL[1][0], t), lerp(BCOL[0][1], BCOL[1][1], t), lerp(BCOL[0][2], BCOL[1][2], t)];
      if (ov === 'suhu' || ov === 'hujan' || ov === 'hutan') c = c.map(v => v * 0.55);
    } else if (ov === 'suhu') c = ramp(RT, w.temp[i]);
    else if (ov === 'hujan') c = ramp(RR, w.rain[i]);
    else if (ov === 'hutan') c = ramp(RH, w.cover[i]);
    else {
      c = BCOL[b].slice();
      if (ov === 'normal' && (b === 6 || b === 7 || b === 8)) { const k = clamp(w.cover[i], 0, 1); c = [lerp(SOIL[0], c[0], k), lerp(SOIL[1], c[1], k), lerp(SOIL[2], c[2], k)]; }
      if (ov === 'politik') c = c.map(v => lerp(v, 70, 0.6));
    }
    if (land && ov === 'normal' && st.snap && st.snap.tick > 0) c = seasonTint(c, b, y, st.snap.season);
    let sh = 1;
    if (land && ov !== 'biom') {
      const hl = w.h[y * W + Math.max(0, x - 1)], hr = w.h[y * W + Math.min(W - 1, x + 1)], hu = w.h[Math.max(0, y - 1) * W + x], hd = w.h[Math.min(H - 1, y + 1) * W + x];
      sh = clamp(1 + (hl - hr + hu - hd) * 1.6, 0.72, 1.28);
    }
    const river = land && w.river[i] > 0 && ov !== 'suhu' && ov !== 'hujan';
    if (river) c = [60, 140, 215];
    for (let sy = 0; sy < SC; sy++) for (let sx = 0; sx < SC; sx++) {
      const n = 0.94 + hash((i << 4) + sy * SC + sx) * 0.12, o = ((y * SC + sy) * W * SC + x * SC + sx) * 4, k = sh * n;
      d[o] = clamp(c[0] * k, 0, 255); d[o + 1] = clamp(c[1] * k, 0, 255); d[o + 2] = clamp(c[2] * k, 0, 255); d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function buildOwner() {
  const s = st.snap; if (!s || !st.showBo) return false;
  const ctx = own.getContext('2d'), img = ctx.createImageData(W * 2, H * 2), d = img.data, o = s.owner, a = st.ov === 'politik' ? 150 : 70;
  const col = new Map(); for (const p of s.pols) { const h = p.col; col.set(p.id, [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16))); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, v = o[i]; if (!v) continue; const c = col.get(v); if (!c) continue;
    let edge = 0; if (x === 0 || o[i - 1] !== v) edge |= 1; if (x === W - 1 || o[i + 1] !== v) edge |= 2; if (y === 0 || o[i - W] !== v) edge |= 4; if (y === H - 1 || o[i + W] !== v) edge |= 8;
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
      const e = (sx === 0 && (edge & 1)) || (sx === 1 && (edge & 2)) || (sy === 0 && (edge & 4)) || (sy === 1 && (edge & 8));
      const p = ((y * 2 + sy) * W * 2 + x * 2 + sx) * 4; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = e ? 235 : a;
    }
  }
  ctx.putImageData(img, 0, 0); return true;
}

/* ---------- kanvas dan kamera ---------- */
const cv = $('#map'), cx = cv.getContext('2d');
let dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = cv.getBoundingClientRect(); cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); dirty = true;
}
function fitView() {
  const r = cv.getBoundingClientRect(); view.z = Math.min(r.width / W, r.height / H) * 0.98; view.x = (r.width - W * view.z) / 2; view.y = (r.height - H * view.z) / 2; dirty = true;
}
function zoomAt(px, py, f) {
  const r = cv.getBoundingClientRect(), fit = Math.min(r.width / W, r.height / H), nz = clamp(view.z * f, fit * 0.7, 48);
  const wx = (px - view.x) / view.z, wy = (py - view.y) / view.z; view.z = nz; view.x = px - wx * nz; view.y = py - wy * nz; dirty = true;
}
function centerOn(x, y, z) { const r = cv.getBoundingClientRect(); if (z) view.z = Math.max(view.z, z); view.x = r.width / 2 - (x + 0.5) * view.z; view.y = r.height / 2 - (y + 0.5) * view.z; dirty = true; }
const toCell = (px, py) => [(px - view.x) / view.z, (py - view.y) / view.z];

/* sprite permukiman: era 0..5, ukuran menurut populasi */
function drawSettlement(c, s, z, era, sel) {
  const u = Math.max(1, z * 0.13), n = Math.min(9, 1 + Math.floor(s.pop / 14)), bx = (s.x + 0.5) * z + view.x, by = (s.y + 0.5) * z + view.y;
  const off = [[0, 0], [-2, 1], [2, 1], [0, 2], [-3, -1], [3, -1], [-1, -2], [1, -2], [4, 2]];
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(bx + x * u), Math.round(by + y * u), Math.ceil(w * u), Math.ceil(h * u)); };
  c.save(); c.globalAlpha = 0.28; c.fillStyle = '#000'; c.fillRect(bx - 5 * u, by + 2.6 * u, 10 * u, 1.2 * u); c.restore();
  for (let k = 0; k < n; k++) {
    const ox = off[k][0] * 1.5, oy = off[k][1] * 1.4;
    if (era === 0) { R(ox - 1, oy - 1.5, 1, 1, '#c8a46e'); R(ox - 1.5, oy - 0.5, 2, 1.5, '#b98d50'); }
    else if (era === 1) { R(ox - 1.2, oy - 0.8, 2.4, 1.6, '#b58a52'); R(ox - 1.5, oy - 1.6, 3, 0.9, '#8a5a2b'); }
    else if (era === 2) { R(ox - 1.2, oy - 0.8, 2.4, 1.8, '#d9d2c0'); R(ox - 1.5, oy - 1.5, 3, 0.8, '#b5523b'); }
    else if (era === 3) { R(ox - 1.2, oy - 0.8, 2.4, 1.8, '#cfc7b4'); R(ox - 1.5, oy - 1.5, 3, 0.8, '#7a3b2e'); if (k === 0) { R(ox - 0.6, oy - 3.4, 1.8, 3, '#a9a39a'); R(ox - 0.9, oy - 3.9, 2.4, 0.7, '#6d6a66'); } }
    else if (era === 4) { R(ox - 1.4, oy - 1, 2.8, 2, '#b0583f'); R(ox - 1.6, oy - 1.6, 3.2, 0.7, '#5a4a45'); if (k % 2 === 0) { R(ox + 0.4, oy - 2.8, 0.8, 1.8, '#5a4a45'); R(ox + 0.2, oy - 3.5, 1.2, 0.8, 'rgba(210,210,210,.7)'); } }
    else { const hh = 2 + ((k * 7 + s.id) % 5); R(ox - 0.9, oy - hh, 1.8, hh + 1, '#8fa7c4'); R(ox - 0.9, oy - hh, 1.8, 0.5, '#c9d7e8'); if (u >= 1.4) { R(ox - 0.3, oy - hh + 1, 0.5, 0.5, '#ffe27a'); R(ox - 0.3, oy - hh + 2.4, 0.5, 0.5, '#ffe27a'); } }
  }
  if (sel) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(bx - 6 * u, by - 5 * u, 12 * u, 9 * u); }
}
function render() {
  const r = cv.getBoundingClientRect(); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#0a0d1a'; cx.fillRect(0, 0, r.width, r.height);
  if (!st.world) return;
  cx.imageSmoothingEnabled = false;
  cx.drawImage(terr, view.x, view.y, W * view.z, H * view.z);
  const s = st.snap;
  if (s && buildOwner()) cx.drawImage(own, view.x, view.y, W * view.z, H * view.z);
  if (s) {
    if (st.showAg && s.ag) {
      const a = s.ag, n = s.pop, z = view.z, sz = Math.max(1.5, z * 0.22), pc = polColors();
      for (let i = 0; i < n; i++) {
        const px = a.x[i] * z + view.x + z * 0.5, py = a.y[i] * z + view.y + z * 0.5;
        if (px < -4 || py < -4 || px > r.width + 4 || py > r.height + 4) continue;
        cx.fillStyle = a.job[i] === -1 ? '#fff' : (pc.get(a.pid[i]) || '#fff'); cx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      }
      if (st.sel && st.sel.type === 'agent') { const k = indexOfAgent(st.sel.id); if (k >= 0) { cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(a.x[k] * z + view.x + z * 0.5, a.y[k] * z + view.y + z * 0.5, Math.max(6, z * 0.6), 0, 6.3); cx.stroke(); } }
    }
    for (const t of s.sets) {
      const p = st.pols.get(t.pid); drawSettlement(cx, t, view.z, p ? p.era : 0, st.sel && st.sel.type === 'settlement' && st.sel.id === t.id);
      if (st.showLb && (view.z >= 7 || t.cap) && view.z >= 3.5) {
        const lx = (t.x + 0.5) * view.z + view.x, ly = (t.y + 0.5) * view.z + view.y + 4.2 * Math.max(1, view.z * 0.13) + 9;
        cx.font = (t.cap ? '600 ' : '500 ') + Math.round(clamp(view.z * 1.4, 9, 13)) + 'px -apple-system,system-ui,sans-serif'; cx.textAlign = 'center';
        cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.65)'; cx.strokeText((t.cap ? '★ ' : '') + t.name, lx, ly); cx.fillStyle = '#fff'; cx.fillText((t.cap ? '★ ' : '') + t.name, lx, ly);
      }
    }
  }
  if (st.phase === 'setup') drawGroupMarkers();
  if (st.hover && isBrushTool() && (st.mode === 'kuas' || st.hover.mouse)) {
    cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc((st.hover.cx + 0.5) * view.z + view.x, (st.hover.cy + 0.5) * view.z + view.y, (st.brush + 0.5) * view.z, 0, 6.3); cx.stroke();
  }
}
function polColors() { const m = new Map(); for (const [id, p] of st.pols) m.set(id, p.col); return m; }
function indexOfAgent(id) { const a = st.snap && st.snap.ag; if (!a) return -1; for (let i = 0; i < st.snap.pop; i++) if (a.id[i] === id) return i; return -1; }
function drawGroupMarkers() {
  st.groups.forEach((g, i) => {
    const p = groupPos(i); if (!p) return; const x = (p.x + 0.5) * view.z + view.x, y = (p.y + 0.5) * view.z + view.y, r = Math.max(8, view.z * 1.1);
    cx.fillStyle = GCOL[i] + 'cc'; cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.fill(); cx.stroke();
    cx.fillStyle = '#fff'; cx.font = '700 ' + Math.round(r) + 'px -apple-system,system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(GN[i], x, y + 1); cx.textBaseline = 'alphabetic';
  });
}
function groupPos(i) { const g = st.groups[i]; if (!g) return null; if (g.mx != null) return { x: g.mx, y: g.my }; return st.coords[i] || null; }
let lastTerr = 0;
function loop() {
  const now = performance.now();
  if (st.seasonDirty && st.world && now - lastTerr > 280) { st.seasonDirty = false; lastTerr = now; if (st.ov === 'normal') { buildTerrain(); dirty = true; } }
  if (st.running) { updateDate(); }
  if (dirty) { dirty = false; render(); } requestAnimationFrame(loop);
}

/* ---------- masukan peta ---------- */
const ptrs = new Map(); let drag = null, pinch = null, lastBrush = 0;
const isBrushTool = () => { const t = TOOLS.find(x => x.id === st.tool); return !!(t && t.brush); };
function rel(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); const [px, py] = rel(e); ptrs.set(e.pointerId, { x: px, y: py });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; drag = null; return; }
  const panBtn = e.button === 1 || e.button === 2 || e.shiftKey;
  const brushing = !panBtn && isBrushTool() && (st.mode === 'kuas' || e.pointerType === 'mouse');
  drag = { x: px, y: py, sx: px, sy: py, moved: false, pan: !brushing, brush: brushing, t0: performance.now() };
  if (brushing) applyBrush(px, py, true);
});
cv.addEventListener('pointermove', e => {
  const [px, py] = rel(e), p = ptrs.get(e.pointerId); if (p) { p.x = px; p.y = py; }
  const [fx, fy] = toCell(px, py); st.hover = { cx: Math.floor(fx), cy: Math.floor(fy), mouse: e.pointerType === 'mouse' };
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    zoomAt(mx, my, d / pinch.d); view.x += mx - pinch.mx; view.y += my - pinch.my; pinch = { d, mx, my }; return;
  }
  if (drag) {
    if (Math.hypot(px - drag.sx, py - drag.sy) > 5) drag.moved = true;
    if (drag.pan) { view.x += px - drag.x; view.y += py - drag.y; dirty = true; }
    else if (drag.brush) applyBrush(px, py, false);
    drag.x = px; drag.y = py;
  } else if (e.pointerType === 'mouse') updateTip(px, py);
  dirty = true;
});
function endPtr(e) {
  const had = ptrs.delete(e.pointerId); if (!had) return; if (ptrs.size < 2) pinch = null;
  if (drag && !drag.moved && !drag.brushed && performance.now() - drag.t0 < 600 && ptrs.size === 0) { const [px, py] = rel(e); onTap(px, py); }
  if (ptrs.size === 0) drag = null;
}
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; });
cv.addEventListener('pointerleave', () => { st.hover = null; $('#tip').hidden = true; dirty = true; });
cv.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = rel(e); zoomAt(px, py, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
$('#zIn').onclick = () => { const r = cv.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.4); };
$('#zOut').onclick = () => { const r = cv.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.4); };
$('#zFit').onclick = fitView;

function applyBrush(px, py, first) {
  const [fx, fy] = toCell(px, py), x = Math.floor(fx), y = Math.floor(fy); if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (drag) drag.brushed = true; const now = performance.now(); if (!first && now - lastBrush < 60) return; lastBrush = now;
  if (st.phase === 'setup' && !st.snap) return; post({ t: 'god', fn: 'paint', args: [st.tool, x, y, st.brush] });
}
function updateTip(px, py) {
  const w = st.world, tip = $('#tip'); if (!w) return; const [fx, fy] = toCell(px, py), x = Math.floor(fx), y = Math.floor(fy);
  if (x < 0 || y < 0 || x >= W || y >= H) { tip.hidden = true; return; }
  const i = y * W + x, t = w.temp[i]; let txt = BIOME[w.biome[i]];
  if (w.land[i]) txt += ` · ${t < .25 ? 'dingin' : t < .5 ? 'sejuk' : t < .75 ? 'hangat' : 'panas'} · hujan ${pct(w.rain[i])}% · hutan ${pct(w.cover[i])}%`;
  const s = st.snap; if (s && s.owner[i]) { const p = st.pols.get(s.owner[i]); if (p) txt += ' · ' + p.name; }
  tip.textContent = txt; tip.hidden = false; tip.style.left = Math.min(px + 14, cv.clientWidth - 250) + 'px'; tip.style.top = (py + 16) + 'px';
}

/* ---------- ketuk dan alat ---------- */
function nearestSettlement(x, y, maxd) {
  const s = st.snap; if (!s) return null; let best = null, bd = maxd;
  for (const t of s.sets) { const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; best = t; } } return best;
}
function nearestAgent(x, y, maxd) {
  const s = st.snap; if (!s || !s.ag) return -1; const a = s.ag; let best = -1, bd = maxd;
  for (let i = 0; i < s.pop; i++) { const d = Math.hypot(a.x[i] + 0.5 - x, a.y[i] + 0.5 - y); if (d < bd) { bd = d; best = i; } } return best;
}
function onTap(px, py) {
  const [fx, fy] = toCell(px, py), x = Math.floor(fx), y = Math.floor(fy); if (x < 0 || y < 0 || x >= W || y >= H) return;
  const s = st.snap, tol = Math.max(0.7, 14 / view.z);
  if (st.pend && st.pend.type === 'place') { if (!st.world.land[y * W + x]) { toast('Pilih daratan'); return; } const g = st.groups[st.pend.g]; g.mx = x; g.my = y; st.pend = null; setBanner(''); renderGroups(); dirty = true; return; }
  const T = st.tool;
  if (T === 'pilih') { selectAt(fx, fy, x, y, tol); return; }
  if (isBrushTool()) return;
  if (st.phase === 'setup' && !s) { toast('Mulai simulasi dulu'); return; }
  const o = st.o;
  if (T === 'spawn') { post({ t: 'god', fn: 'spawn', args: [x, y, o.n, { iq: o.iq, ag: o.ag, leader: o.leader, newPolity: o.newP }] }); return; }
  if (['trait', 'promote', 'kill'].includes(T)) {
    const k = nearestAgent(fx, fy, tol); if (k < 0) { toast('Ketuk tepat pada seorang individu'); return; } const id = s.ag.id[k];
    if (T === 'trait') post({ t: 'god', fn: 'setTrait', args: [id, { iq: o.tIq, ag: o.tAg }] });
    if (T === 'promote') post({ t: 'god', fn: 'promote', args: [id] });
    if (T === 'kill') { post({ t: 'god', fn: 'killAgent', args: [id] }); }
    return;
  }
  if (['war', 'peace', 'ally'].includes(T)) {
    const t = nearestSettlement(fx, fy, 5), pid = t ? t.pid : s && s.owner[y * W + x]; if (!pid) { toast('Ketuk wilayah suatu bangsa'); return; }
    if (!st.pend) { st.pend = { type: 'dip', a: pid }; setBanner('Bangsa pertama: ' + polName(pid) + '. Ketuk bangsa kedua.'); return; }
    if (st.pend.a === pid) { toast('Pilih bangsa yang berbeda'); return; }
    post({ t: 'god', fn: T, args: [st.pend.a, pid] }); st.pend = null; setBanner(''); return;
  }
  const t = nearestSettlement(fx, fy, 4); if (!t) { toast('Ketuk dekat sebuah kota'); return; }
  if (T === 'tech') post({ t: 'god', fn: 'giveTech', args: [t.pid, o.tech] });
  if (T === 'untech') post({ t: 'god', fn: 'removeTech', args: [t.pid, o.tech] });
  if (T === 'feed') post({ t: 'god', fn: 'feed', args: [t.id, Math.round(t.pop * 0.95 * o.yrs)] });
  if (T === 'famine') post({ t: 'god', fn: 'famine', args: [t.id] });
  if (T === 'plague') post({ t: 'god', fn: 'plague', args: [t.id] });
  if (T === 'smite') post({ t: 'god', fn: 'smite', args: [t.id, o.frac] });
}
function polName(id) { const p = st.pols.get(id); return p ? p.name : '#' + id; }
function selectAt(fx, fy, x, y, tol) {
  const s = st.snap; if (!s) return;
  const k = st.showAg ? nearestAgent(fx, fy, tol * 0.6) : -1;
  if (k >= 0) return select({ type: 'agent', id: s.ag.id[k] });
  const t = nearestSettlement(fx, fy, Math.max(1.6, tol));
  if (t) return select({ type: 'settlement', id: t.id });
  const pid = s.owner[y * W + x]; if (pid) return select({ type: 'polity', id: pid });
  closeInsp();
}
function select(sel) { st.sel = sel; post({ t: 'select', sel }); $('#insp').hidden = false; renderInsp(true); dirty = true; if (matchMedia('(max-width:860px)').matches) setSheet(false); }
function closeInsp() { st.sel = null; $('#insp').hidden = true; post({ t: 'select', sel: null }); dirty = true; }
$('#inspClose').onclick = closeInsp;

/* ---------- toast dan banner ---------- */
let toastT = 0;
function toast(t, ms) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { e.hidden = true; }, ms || 2600); }
function setBanner(t) { const e = $('#banner'); e.textContent = t; e.hidden = !t; }

/* ---------- navigasi panel ---------- */
function setTab(t) {
  st.tab = t; $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('#panel section').forEach(s => s.classList.toggle('on', s.dataset.tab === t)); updatePanels(true);
}
function setSheet(open) { document.body.classList.toggle('sheet', open); setTimeout(() => { resize(); }, 10); }
$$('#nav button').forEach(b => b.addEventListener('click', () => {
  const mobile = matchMedia('(max-width:860px)').matches;
  if (mobile && document.body.classList.contains('sheet') && st.tab === b.dataset.tab) { setSheet(false); return; }
  setTab(b.dataset.tab); if (mobile) setSheet(true);
}));
$('#grab').addEventListener('click', () => setSheet(false));
{ let y0 = null; const g = $('#grab'); g.addEventListener('pointerdown', e => { y0 = e.clientY; g.setPointerCapture(e.pointerId); }); g.addEventListener('pointermove', e => { if (y0 != null && e.clientY - y0 > 50) { y0 = null; setSheet(false); } }); g.addEventListener('pointerup', () => { y0 = null; }); }

/* ---------- toolbar ---------- */
$('#btnPlay').onclick = () => {
  if (st.phase === 'setup') { startSim(); return; }
  post({ t: 'run', on: !st.running, yps: st.speed });
};
$('#btnStep').onclick = () => { if (st.phase === 'setup') startSim(false); post({ t: 'step', n: 1 }); };
$$('#speed button').forEach(b => b.onclick = () => { st.speed = +b.dataset.yps; $$('#speed button').forEach(x => x.classList.toggle('on', x === b)); if (wk) post({ t: 'run', on: st.running, yps: st.speed }); });
$$('#mode button').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; $$('#mode button').forEach(x => x.classList.toggle('on', x === b)); cv.classList.toggle('brush', st.mode === 'kuas'); });
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); $('#btnPlay').click(); }
  else if (e.key === 'Escape') { st.pend = null; setBanner(''); closeInsp(); }
  else if (e.key === '+' || e.key === '=') $('#zIn').click(); else if (e.key === '-') $('#zOut').click();
  else if (e.key === 'ArrowRight') $('#btnStep').click();
});

/* ---------- skenario ---------- */
function randSeed() { return (Math.random() * 99999 | 0) + 1; }
function loadPreset(i) {
  const p = PRESETS[i]; st.groups = p.g.map(g => Object.assign({ leader: 'auto', mx: null, my: null }, g)); requestSpots(); renderGroups();
}
function requestSpots() { if (wk && st.hasPreview) post({ t: 'spots', spots: st.groups.map(g => g.spot) }); }
function newPreview() { st.hasPreview = true; post({ t: 'preview', seed: st.seed, cap: st.cap, spots: st.groups.map(g => g.spot) }); st.phase = 'setup'; st.snap = null; st.sel = null; closeInsp(); $('#yr').textContent = 'Tahun 0'; $('#pop').textContent = '0 jiwa'; $('#eraName').textContent = '-'; setPlayIcon(); }
function renderGroups() {
  const el = $('#groups'); el.innerHTML = st.groups.map((g, i) => `
    <div class="gc" data-g="${i}">
      <header><span class="chip" style="background:${GCOL[i]}"></span><b class="grow t-body-emphasized">Kelompok ${GN[i]}</b>${st.groups.length > 1 ? '<button class="b" data-a="del" type="button">Hapus</button>' : ''}</header>
      <div class="row"><span>Jumlah</span><input type="range" min="8" max="120" value="${g.n}" data-k="n"><output>${g.n}</output></div>
      <div class="row"><span>IQ</span><input type="range" min="10" max="95" value="${pct(g.iq)}" data-k="iq"><output>${pct(g.iq)}</output></div>
      <div class="row"><span>Agresi</span><input type="range" min="5" max="95" value="${pct(g.ag)}" data-k="ag"><output>${pct(g.ag)}</output></div>
      <div class="row"><span>Lokasi</span><select data-k="spot">${Object.entries(SPOTS).map(([k, v]) => `<option value="${k}" ${g.spot === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="row"><span>Pemimpin</span><select data-k="leader">${[['auto', 'Otomatis'], ['agresif', 'Agresif'], ['damai', 'Damai']].map(([k, v]) => `<option value="${k}" ${g.leader === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="row gap"><button class="b" data-a="place" type="button">Pilih di peta</button>${g.mx != null ? '<button class="b" data-a="auto" type="button">Lokasi otomatis</button>' : ''}</div>
    </div>`).join('') + (st.groups.length < 4 ? '<button class="b" id="addG" type="button">Tambah kelompok</button>' : '');
  $('#placeHint').textContent = 'Tanda berwarna di peta menunjukkan titik awal tiap kelompok.';
}
$('#groups').addEventListener('input', e => {
  const k = e.target.dataset.k, gi = e.target.closest('.gc'); if (!k || !gi) return; const g = st.groups[+gi.dataset.g];
  if (k === 'n') { g.n = +e.target.value; e.target.nextElementSibling.textContent = g.n; }
  else if (k === 'iq' || k === 'ag') { g[k] = e.target.value / 100; e.target.nextElementSibling.textContent = e.target.value; }
  else { g[k] = e.target.value; if (k === 'spot') { g.mx = null; requestSpots(); } }
});
$('#groups').addEventListener('click', e => {
  if (e.target.id === 'addG') { st.groups.push({ n: 40, iq: .5, ag: .4, spot: 'sungai', leader: 'auto', mx: null, my: null }); requestSpots(); renderGroups(); return; }
  const a = e.target.dataset.a, gi = e.target.closest('.gc'); if (!a || !gi) return; const i = +gi.dataset.g;
  if (a === 'del') { st.groups.splice(i, 1); requestSpots(); renderGroups(); }
  if (a === 'auto') { st.groups[i].mx = null; renderGroups(); dirty = true; }
  if (a === 'place') { st.pend = { type: 'place', g: i }; setBanner('Ketuk daratan untuk menempatkan Kelompok ' + GN[i]); if (matchMedia('(max-width:860px)').matches) setSheet(false); }
});
$('#preset').innerHTML = PRESETS.map((p, i) => `<option value="${i}">${esc(p.nama)}</option>`).join('');
$('#preset').onchange = e => loadPreset(+e.target.value);
$('#seed').onchange = e => { st.seed = Math.max(1, +e.target.value | 0 || 1); newPreview(); };
$('#btnRand').onclick = () => { st.seed = randSeed(); $('#seed').value = st.seed; newPreview(); };
$('#cap').onchange = e => { st.cap = +e.target.value; if (st.phase === 'run') post({ t: 'setcap', n: st.cap }); };
$('#btnStart').onclick = () => startSim();
function startSim(run = true) {
  if (!st.groups.length) { toast('Tambahkan minimal satu kelompok'); return; }
  const groups = st.groups.map((g, i) => { const p = groupPos(i); return p && { x: p.x, y: p.y, n: g.n, iq: g.iq, ag: g.ag, leader: g.leader }; });
  if (groups.some(g => !g)) { toast('Lokasi belum tersedia, coba seed lain'); return; }
  post({ t: 'start', groups, cap: st.cap }); st.phase = 'run'; st.lastSaveYear = 0; st.sel = null; $('#insp').hidden = true;
  if (run) post({ t: 'run', on: true, yps: st.speed });
  if (matchMedia('(max-width:860px)').matches) setSheet(false);
}
$$('.jump').forEach(b => b.onclick = () => {
  if (st.phase === 'setup') startSim(false);
  let n = +b.dataset.n * 4; toast('Melompat ' + b.dataset.n + ' tahun...'); while (n > 0) { const k = Math.min(500, n); post({ t: 'step', n: k }); n -= k; }
});

/* ---------- alat dewa ---------- */
function renderTools() {
  $('#tools').innerHTML = TOOLS.map(t => t.h ? `<h4>${t.h}</h4>` : `<button type="button" data-t="${t.id}" class="${st.tool === t.id ? 'on' : ''}"><span class="em">${t.e}</span>${t.n}</button>`).join('');
}
$('#tools').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; st.tool = b.dataset.t; st.pend = null; setBanner(''); renderTools(); renderToolOpts();
  const t = TOOLS.find(x => x.id === st.tool); if (t && t.brush && matchMedia('(pointer:coarse)').matches) { st.mode = 'kuas'; $$('#mode button').forEach(x => x.classList.toggle('on', x.dataset.mode === 'kuas')); cv.classList.add('brush'); }
  if (st.tool === 'pilih') { st.mode = 'pilih'; $$('#mode button').forEach(x => x.classList.toggle('on', x.dataset.mode === 'pilih')); cv.classList.remove('brush'); }
  if (matchMedia('(max-width:860px)').matches) setSheet(false);
});
function fillTechOpts() { renderToolOpts(); }
function sl(label, key, min, max, step, o) { return `<label class="row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step || 1}" value="${st.o[key] * (o || 1)}" data-o="${key}" data-m="${o || 1}"><output>${Math.round(st.o[key] * (o || 1))}</output></label>`; }
function renderToolOpts() {
  const t = TOOLS.find(x => x.id === st.tool), el = $('#toolOpts'); let h = '';
  $('#brushRow').style.display = t && t.brush ? '' : 'none';
  $('#toolHint').textContent = t && t.hint || '';
  const techSel = `<label class="row"><span>Teknologi</span><select data-o="tech">${st.techs.map(x => `<option value="${x.id}" ${st.o.tech === x.id ? 'selected' : ''}>${esc(x.nama)}</option>`).join('')}</select></label>`;
  if (st.tool === 'spawn') h = sl('Jumlah', 'n', 8, 100, 1) + sl('IQ', 'iq', 10, 95, 1, 100) + sl('Agresi', 'ag', 5, 95, 1, 100) + `<label class="row"><span>Pemimpin</span><select data-o="leader"><option value="auto">Otomatis</option><option value="agresif">Agresif</option><option value="damai">Damai</option></select></label><label class="row sw"><span>Selalu bentuk bangsa baru</span><input type="checkbox" data-o="newP" ${st.o.newP ? 'checked' : ''}></label>`;
  if (st.tool === 'tech' || st.tool === 'untech') h = techSel;
  if (st.tool === 'feed') h = sl('Setara (tahun)', 'yrs', 1, 10, 1);
  if (st.tool === 'smite') h = sl('Korban (%)', 'frac', 5, 90, 5, 100);
  if (st.tool === 'trait') h = sl('IQ baru', 'tIq', 5, 98, 1, 100) + sl('Agresi baru', 'tAg', 5, 98, 1, 100);
  el.innerHTML = h;
}
$('#toolOpts').addEventListener('input', e => {
  const k = e.target.dataset.o; if (!k) return;
  if (e.target.type === 'checkbox') st.o[k] = e.target.checked; else if (e.target.type === 'range') { const m = +e.target.dataset.m || 1; st.o[k] = e.target.value / m; e.target.nextElementSibling.textContent = e.target.value; } else st.o[k] = e.target.value;
});
$('#brushR').oninput = e => { st.brush = +e.target.value; $('#brushVal').textContent = st.brush; dirty = true; };

/* ---------- lapisan ---------- */
function renderOverlays() {
  $('#overlays').innerHTML = OVERLAYS.map(([k, n]) => `<button type="button" data-ov="${k}" class="${st.ov === k ? 'on' : ''}">${n}</button>`).join('');
  $('#legend').innerHTML = LEGENDS[st.ov].map(([c, n]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
}
$('#overlays').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.ov = b.dataset.ov; renderOverlays(); buildTerrain(); dirty = true; });
$('#swAgents').onchange = e => { st.showAg = e.target.checked; dirty = true; };
$('#swBorders').onchange = e => { st.showBo = e.target.checked; dirty = true; };
$('#swLabels').onchange = e => { st.showLb = e.target.checked; dirty = true; };

/* ---------- panel dinamis ---------- */
function updatePanels(force) {
  const s = st.snap; if (!s) return;
  if (st.tab === 'bangsa') renderNations(s); if (st.tab === 'log') renderLog(s);
  if (force && st.tab === 'log') renderLog(s, true);
}
const logAll = [];
function pushLog(s) { if (s.log) for (const l of s.log) logAll.push(l); if (logAll.length > 400) logAll.splice(0, logAll.length - 400); }
const _on = onSnap; onSnap = function (m) { pushLog(m); if (m.hist) st.hist = m.hist; _on(m); };
function renderLog() {
  const cls = { perang: 'war', teknologi: 'tech', bencana: 'bad', wabah: 'bad', era: 'tech' };
  $('#log').innerHTML = logAll.slice(-120).reverse().map(l => `<div class="lg ${cls[l.t] || ''}"><b>${fmt(l.y)}</b>${esc(l.x)}</div>`).join('') || '<div class="note">Belum ada peristiwa.</div>';
}
function renderNations(s) {
  const pols = s.pols.slice().sort((a, b) => b.pop - a.pop), tot = pols.reduce((x, p) => x + p.pop, 0) || 1;
  $('#nations').innerHTML = pols.map(p => `<div class="li click" data-p="${p.id}"><span class="chip" style="background:${p.col}"></span><span class="grow">${esc(p.name)}</span><span class="bar"><i style="width:${pct(p.pop / tot)}%;background:${p.col}"></i></span><span class="v">${fmt(p.pop)}</span></div>`).join('') || '<div class="note">Belum ada bangsa.</div>';
  $('#eraTl').innerHTML = ERAS.map((n, i) => { const y = s.stats.eraYear[i]; return `<div class="li ${y != null ? 'done' : 'todo'}"><span class="dotc"></span><span class="grow">${n}</span><span class="v">${y != null ? 'tahun ' + fmt(y) : 'belum'}</span></div>`; }).join('');
  const c = s.stats.cause, names = { lapar: 'Kelaparan', haus: 'Kehausan', perang: 'Perang', wabah: 'Wabah', usia: 'Usia tua dan penyakit', bencana: 'Bencana dan murka dewa' }, tc = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  $('#causes').innerHTML = Object.keys(names).map(k => `<div class="li"><span class="grow">${names[k]}</span><span class="bar"><i style="width:${pct(c[k] / tc)}%"></i></span><span class="v">${fmt(c[k])}</span></div>`).join('');
  drawChart(s);
}
$('#nations').addEventListener('click', e => { const r = e.target.closest('[data-p]'); if (!r) return; const id = +r.dataset.p, p = st.pols.get(id); const cap = st.snap.sets.find(t => t.pid === id && t.cap) || st.snap.sets.find(t => t.pid === id); if (cap) centerOn(cap.x, cap.y, 6); select({ type: 'polity', id }); });
function drawChart(s) {
  const c = $('#chart'), g = c.getContext('2d'), h = st.hist || []; g.clearRect(0, 0, c.width, c.height);
  const cs = getComputedStyle(document.body), lab = cs.getPropertyValue('--label-secondary') || '#888';
  if (h.length < 2) { g.fillStyle = lab; g.font = '12px sans-serif'; g.fillText('Data muncul setelah beberapa tahun.', 12, 24); return; }
  const ids = new Set(); h.forEach(r => Object.keys(r.pops).forEach(k => ids.add(+k))); const mx = Math.max(10, ...h.map(r => r.tot)), L = 34, B = 18, T = 8, Wd = c.width - L - 6, Hd = c.height - B - T;
  g.strokeStyle = 'rgba(128,128,128,.25)'; g.fillStyle = lab; g.font = '10px sans-serif';
  for (let i = 0; i <= 4; i++) { const y = T + Hd * i / 4; g.beginPath(); g.moveTo(L, y); g.lineTo(L + Wd, y); g.stroke(); g.fillText(fmt(mx * (1 - i / 4)), 2, y + 3); }
  const y0 = h[0].y, y1 = h[h.length - 1].y, X = y => L + (y - y0) / Math.max(1, y1 - y0) * Wd, Y = v => T + Hd * (1 - v / mx);
  const cols = new Map(s.pols.map(p => [p.id, p.col]));
  for (const id of ids) {
    g.beginPath(); let on = false; h.forEach(r => { const v = r.pops[id]; if (v == null) { on = false; return; } if (!on) { g.moveTo(X(r.y), Y(v)); on = true; } else g.lineTo(X(r.y), Y(v)); });
    g.strokeStyle = cols.get(id) || 'rgba(128,128,128,.5)'; g.lineWidth = cols.has(id) ? 2 : 1; g.stroke();
  }
  g.beginPath(); h.forEach((r, i) => i ? g.lineTo(X(r.y), Y(r.tot)) : g.moveTo(X(r.y), Y(r.tot))); g.strokeStyle = 'rgba(128,128,128,.8)'; g.setLineDash([4, 3]); g.lineWidth = 1.2; g.stroke(); g.setLineDash([]);
  g.fillStyle = lab; g.fillText(fmt(y0), L, c.height - 4); g.textAlign = 'right'; g.fillText(fmt(y1), L + Wd, c.height - 4); g.textAlign = 'left';
}

/* ---------- inspektur ---------- */
const kv = (a) => '<dl class="kv">' + a.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + '</dl>';
const meter = (n, v, col) => `<div class="meter"><span>${n}</span><span class="bar"><i style="width:${pct(clamp(v, 0, 1))}%;${col ? 'background:' + col : ''}"></i></span><output>${pct(v)}</output></div>`;
const iqLbl = v => v < .25 ? 'rendah' : v < .45 ? 'di bawah rata-rata' : v < .65 ? 'rata-rata' : v < .85 ? 'tinggi' : 'sangat tinggi';
function renderInsp() {
  const sel = st.sel, s = st.snap, body = $('#inspBody'); if (!sel || !s) return; const top = body.scrollTop; let h = '', title = 'Detail';
  if (sel.type === 'agent') {
    const a = s.selInfo; if (!a || a.id !== sel.id) { body.innerHTML = '<div class="note">Individu ini sudah tiada.</div>'; $('#inspTitle').textContent = 'Individu'; return; }
    title = (a.pemimpin ? 'Pemimpin' : 'Individu') + ' #' + a.id;
    h += kv([['Umur', a.umur + ' tahun'], ['Jenis kelamin', a.sex ? 'Perempuan' : 'Laki-laki'], ['Pekerjaan', a.umur < 15 ? 'Anak-anak' : JOBS[a.job] || '-'], ['Kota', esc(a.kota)], ['Bangsa', esc(a.bangsa)], ['Pasangan', a.pasangan ? '#' + a.pasangan : 'tidak ada']]);
    h += '<div class="sub-h">Sifat</div>' + meter('IQ (' + iqLbl(a.iq) + ')', a.iq) + meter('Agresi', a.ag, 'var(--accent-red)') + meter('Keterbukaan', a.o) + meter('Ketelitian', a.c) + meter('Ekstraversi', a.e) + meter('Keramahan', a.a) + meter('Neurotisisme', a.n);
    h += '<div class="sub-h">Kondisi</div>' + meter('Lapar', a.lapar, 'var(--accent-orange)') + meter('Haus', a.haus, 'var(--accent-cyan)') + meter('Kepuasan', a.puas, 'var(--accent-green)');
    h += '<div class="acts"><button class="b" data-ia="gotoS" type="button">Ke kotanya</button><button class="b" data-ia="promote" type="button">Angkat pemimpin</button><button class="b dng" data-ia="kill" type="button">Matikan</button></div>';
  } else if (sel.type === 'settlement') {
    const i = s.selInfo, t = s.sets.find(x => x.id === sel.id); if (!i || !t) { body.innerHTML = '<div class="note">Kota ini sudah tiada.</div>'; return; }
    title = i.nama;
    h += kv([['Bangsa', esc(i.bangsa)], ['Era', i.era], ['Penduduk', fmt(i.pop)], ['IQ rata-rata', pct(i.iq) + ' (' + iqLbl(i.iq) + ')'], ['Ketahanan pangan', i.pangan.toFixed(2)], ['Dibangun tahun', fmt(i.lahir)]]);
    h += meter('Lapar rata-rata', i.lapar, 'var(--accent-orange)') + meter('Kepuasan', i.kepuasan, 'var(--accent-green)') + meter('Stabilitas bangsa', i.stab);
    const tot = i.kerja.reduce((a, b) => a + b, 0) || 1; h += '<div class="sub-h">Pekerjaan</div>' + i.kerja.map((n, k) => `<div class="meter"><span>${JOBS[k]}</span><span class="bar"><i style="width:${pct(n / tot)}%"></i></span><output>${n}</output></div>`).join('');
    if (i.pemimpin) h += '<div class="sub-h">Pemimpin bangsa</div>' + meter('IQ', i.pemimpin.iq) + meter('Agresi', i.pemimpin.ag, 'var(--accent-red)') + kv([['Umur', i.pemimpin.umur]]);
    h += `<div class="acts"><button class="b" data-ia="gotoP" type="button">Lihat bangsa</button></div>`;
  } else {
    const p = s.pols.find(x => x.id === sel.id); if (!p) { body.innerHTML = '<div class="note">Bangsa ini sudah tiada.</div>'; return; }
    title = p.name;
    const tn = st.techs.filter(x => p.techs.includes(x.id)).map(x => esc(x.nama));
    h += kv([['Era', ERAS[p.era]], ['Penduduk', fmt(p.pop)], ['Kota', p.sets], ['Prajurit', fmt(p.soldiers)], ['Ketahanan pangan', p.fs.toFixed(2)], ['Stabilitas', pct(p.stab) + '%'], ['Sedang meneliti', esc(p.target || '-')]]);
    h += '<div class="sub-h">Diplomasi</div>' + kv([['Perang dengan', p.enemies.length ? p.enemies.map(polName).map(esc).join(', ') : '-'], ['Sekutu', p.allies.length ? p.allies.map(polName).map(esc).join(', ') : '-']]);
    if (p.leader) h += '<div class="sub-h">Pemimpin</div>' + meter('IQ', p.leader.iq) + meter('Agresi', p.leader.ag, 'var(--accent-red)') + meter('Keramahan', p.leader.a) + meter('Keterbukaan', p.leader.o) + kv([['Umur', p.leader.age]]) + '<div class="acts"><button class="b" data-ia="gotoL" type="button">Lihat pemimpin</button></div>';
    h += `<div class="sub-h">Teknologi (${tn.length}/${st.techs.length})</div><div class="note">${tn.join(', ') || 'Belum ada.'}</div>`;
    h += '<div class="acts"><button class="b" data-ia="gotoC" type="button">Ke ibu kota</button></div>';
  }
  $('#inspTitle').textContent = title; body.innerHTML = h; body.scrollTop = top;
}
$('#inspBody').addEventListener('click', e => {
  const a = e.target.dataset.ia; if (!a) return; const sel = st.sel, s = st.snap;
  if (sel.type === 'agent') {
    if (a === 'promote') post({ t: 'god', fn: 'promote', args: [sel.id] });
    if (a === 'kill') { post({ t: 'god', fn: 'killAgent', args: [sel.id] }); }
    if (a === 'gotoS' && s.selInfo) { const t = s.sets.find(x => x.id === s.selInfo.kotaId); if (t) { centerOn(t.x, t.y, 8); select({ type: 'settlement', id: t.id }); } }
  } else if (sel.type === 'settlement') {
    const t = s.sets.find(x => x.id === sel.id); if (a === 'gotoP' && t) select({ type: 'polity', id: t.pid });
  } else {
    const p = s.pols.find(x => x.id === sel.id);
    if (a === 'gotoC') { const t = s.sets.find(x => x.pid === sel.id && x.cap) || s.sets.find(x => x.pid === sel.id); if (t) centerOn(t.x, t.y, 6); }
    if (a === 'gotoL' && p && p.leader) select({ type: 'agent', id: p.leader.id });
  }
});

/* ---------- simpan dan muat ---------- */
const DB = { db: null, open() { return new Promise((res, rej) => { if (this.db) return res(this.db); const r = indexedDB.open('zaman', 1); r.onupgradeneeded = () => r.result.createObjectStore('save'); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
  async put(k, v) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction('save', 'readwrite'); t.objectStore('save').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k) { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction('save').objectStore('save').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } };
async function doSave(slot) {
  if (st.phase !== 'run') { toast('Belum ada simulasi untuk disimpan'); return false; }
  try { const state = await requestSave(); await DB.put(slot, { at: Date.now(), year: state.year, state }); return state.year; } catch (err) { toast('Gagal menyimpan: ' + err.message, 4000); return false; }
}
async function autosave() { const y = await doSave('auto'); if (y !== false) $('#saveInfo').textContent = 'Simpan otomatis terakhir: tahun ' + fmt(y); }
$('#btnSave').onclick = async () => { const y = await doSave('quick'); if (y !== false) { toast('Tersimpan pada tahun ' + fmt(y)); infoSaves(); } };
$('#btnLoad').onclick = async () => {
  try { const q = await DB.get('quick'), a = await DB.get('auto'), pick = q && a ? (q.at >= a.at ? q : a) : (q || a); if (!pick) { toast('Belum ada simpanan'); return; } post({ t: 'load', state: pick.state }); } catch (err) { toast('Gagal memuat: ' + err.message, 4000); }
};
$('#btnExport').onclick = async () => {
  if (st.phase !== 'run') { toast('Belum ada simulasi untuk diekspor'); return; }
  const state = await requestSave(), blob = new Blob([JSON.stringify(state)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `zaman-tahun${state.year}-seed${state.seed}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
$('#btnImport').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const state = JSON.parse(await f.text()); if (!state || state.v == null || !state.agents) throw new Error('bukan berkas simpanan Zaman'); post({ t: 'load', state }); } catch (err) { toast('Berkas tidak valid: ' + err.message, 4500); }
};
$('#swAuto').onchange = e => { st.autoOn = e.target.checked; try { localStorage.setItem('zaman.auto', st.autoOn ? '1' : '0'); } catch (_) {} };
async function infoSaves() {
  try { const q = await DB.get('quick'), a = await DB.get('auto'); const f = (n, x) => x ? `${n}: tahun ${fmt(x.year)} (${new Date(x.at).toLocaleString('id-ID')})` : ''; $('#saveInfo').textContent = [f('Simpan cepat', q), f('Otomatis', a)].filter(Boolean).join('. ') || 'Belum ada simpanan.'; } catch (_) { $('#saveInfo').textContent = 'Penyimpanan peramban tidak tersedia. Gunakan ekspor file.'; }
}
$('#theme').onchange = e => { const v = e.target.value; if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v); try { localStorage.setItem('zaman.theme', v); } catch (_) {} };

/* ---------- mulai ---------- */
function init() {
  try { const th = localStorage.getItem('zaman.theme'); if (th) { $('#theme').value = th; if (th !== 'auto') document.documentElement.setAttribute('data-theme', th); } st.autoOn = localStorage.getItem('zaman.auto') !== '0'; $('#swAuto').checked = st.autoOn; } catch (_) {}
  st.seed = randSeed(); $('#seed').value = st.seed;
  renderTools(); renderToolOpts(); renderOverlays(); startWorker(); loadPreset(0); newPreview(); infoSaves();
  resize(); fitView(); new ResizeObserver(() => { const had = dpr; resize(); if (!st.snap && !st.world) fitView(); }).observe($('#viewport'));
  addEventListener('resize', () => { resize(); });
  requestAnimationFrame(loop);
  setTimeout(fitView, 120);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__zaman = { st, view, post, fitView };
init();
})();
