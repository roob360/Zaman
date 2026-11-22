(function (root) {
'use strict';
const W = 128, H = 96, N = W * H;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeRng(seed) { let a = seed | 0; const f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; f.get = () => a; f.set = v => { a = v | 0; }; return f; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function makeNoise(rng) {
  const P = new Uint8Array(512), perm = []; for (let i = 0; i < 256; i++) perm.push(i);
  for (let i = 255; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  const G = new Float32Array(256); for (let i = 0; i < 256; i++) G[i] = rng();
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = G[P[(P[xi & 255] + yi) & 255]], b = G[P[(P[(xi + 1) & 255] + yi) & 255]];
    const c = G[P[(P[xi & 255] + yi + 1) & 255]], d = G[P[(P[(xi + 1) & 255] + yi + 1) & 255]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbm(n, x, y, oct) { let s = 0, amp = 1, f = 1, tot = 0; for (let i = 0; i < oct; i++) { s += n(x * f, y * f) * amp; tot += amp; amp *= 0.5; f *= 2; } return s / tot; }

const BIOME_NAME = ['Laut dalam', 'Laut', 'Pantai', 'Gurun', 'Padang rumput', 'Sabana', 'Hutan', 'Hutan hujan', 'Taiga', 'Tundra', 'Pegunungan', 'Salju'];
const WILD = [0, 0, 0.04, 0.004, 0.05, 0.065, 0.05, 0.07, 0.025, 0.012, 0.01, 0.002].map(v => v * 6);
const SOIL = [0, 0, 0.5, 0.9, 1.0, 0.8, 0.8, 0.7, 0.4, 0.15, 0.12, 0];
const ERA_NAME = ['Zaman Batu', 'Neolitik', 'Zaman Kuno', 'Abad Pertengahan', 'Era Industri', 'Era Modern'];
const JOB_NAME = ['Pemburu-peramu', 'Petani', 'Pengrajin', 'Pedagang', 'Prajurit', 'Cendekiawan'];
const SYL = ['ka', 'ru', 'ma', 'to', 'na', 'li', 'sa', 'be', 'do', 've', 'ar', 'el', 'on', 'ti', 'mu', 'ge', 'sha', 'ri', 'ko', 'lu', 'ba', 'den', 'kar', 'tan', 'mor', 'vin'];
const PCOL = ['#ff453a', '#30d158', '#0a84ff', '#ff9f0a', '#bf5af2', '#64d2ff', '#ff375f', '#ffd60a', '#ac8e68', '#66d4cf'];

const T = [
  { id: 'agri', nama: 'Pertanian', era: 1, cost: 35, pop: 25, req: [], tag: 'agri', flag: 'agri' },
  { id: 'tembikar', nama: 'Tembikar & lumbung', era: 1, cost: 90, pop: 40, req: ['agri'], tag: 'soc', fx: { spoil: 0.5 } },
  { id: 'irigasi', nama: 'Irigasi', era: 2, cost: 200, pop: 70, req: ['agri'], tag: 'agri', fx: { farm: 1.2 }, flag: 'irrig' },
  { id: 'tulisan', nama: 'Tulisan & administrasi', era: 2, cost: 320, pop: 90, req: ['tembikar'], tag: 'sci', fx: { know: 1.2, span: 3 }, flag: 'writing' },
  { id: 'logam', nama: 'Metalurgi', era: 2, cost: 520, pop: 100, req: ['tembikar'], tag: 'mil', fx: { farm: 1.2, craft: 1.4, weapon: 1.5 } },
  { id: 'jalan', nama: 'Roda & jalan', era: 3, cost: 850, pop: 150, req: ['tulisan'], tag: 'soc', fx: { span: 3, trade: 1.5 }, flag: 'roads' },
  { id: 'sumur', nama: 'Sumur dalam & akuaduk', era: 3, cost: 1000, pop: 150, req: ['irigasi', 'logam'], tag: 'agri', flag: 'wells' },
  { id: 'bajak', nama: 'Bajak besi & rotasi tanam', era: 3, cost: 1300, pop: 180, req: ['logam'], tag: 'agri', fx: { farm: 1.3 } },
  { id: 'mesiu', nama: 'Mesiu & baja', era: 3, cost: 2100, pop: 220, req: ['logam', 'jalan'], tag: 'mil', fx: { weapon: 1.8 } },
  { id: 'cetak', nama: 'Percetakan & sains', era: 3, cost: 2600, pop: 260, req: ['tulisan', 'jalan'], tag: 'sci', fx: { know: 1.6 } },
  { id: 'industri', nama: 'Mesin uap & industri', era: 4, cost: 5200, pop: 350, req: ['cetak', 'mesiu'], tag: 'sci', fx: { farm: 1.6, craft: 2.0, weapon: 1.4 } },
  { id: 'listrik', nama: 'Listrik', era: 4, cost: 8500, pop: 450, req: ['industri'], tag: 'sci', fx: { craft: 1.5, know: 1.3, spoil: 0.5 }, flag: 'power' },
  { id: 'medis', nama: 'Kedokteran & sanitasi', era: 5, cost: 13000, pop: 500, req: ['listrik'], tag: 'soc', fx: { med: 0.35 }, flag: 'sanit' },
  { id: 'pupuk', nama: 'Pupuk sintetis & mekanisasi', era: 5, cost: 17000, pop: 600, req: ['listrik'], tag: 'agri', fx: { farm: 2.0 } },
  { id: 'komputer', nama: 'Elektronik & komputer', era: 5, cost: 26000, pop: 700, req: ['medis', 'pupuk'], tag: 'sci', fx: { know: 2.0, craft: 1.5, weapon: 1.6 } }
];
const T_BY = {}; for (const t of T) T_BY[t.id] = t;

const BASE_COVER = { 4: 0.12, 5: 0.35, 6: 1, 7: 1, 8: 1 };
function toB64(arr) { const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
function fromB64(str, Type) { const bin = atob(str), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Type(u8.buffer); }
function newWorldShell() {
  const w = { W, H, h: new Float32Array(N), temp: new Float32Array(N), rain: new Float32Array(N), river: new Uint8Array(N), soil: new Float32Array(N), tn: new Float32Array(N), cover: new Float32Array(N), lat: new Float32Array(N), land: new Uint8Array(N), coast: new Uint8Array(N), biome: new Uint8Array(N), dR: new Int8Array(N), wa: new Float32Array(N), drink: new Float32Array(N), fert: new Float32Array(N), wild: new Float32Array(N) };
  for (let y = 0; y < H; y++) { const lat = Math.abs(y - (H - 1) / 2) / ((H - 1) / 2); for (let x = 0; x < W; x++) w.lat[y * W + x] = lat; }
  w.finalize = function () { finalizeWorld(w); };
  return w;
}
function biomeOf(t, r, hh, coastFlag) {
  if (coastFlag && hh < 0.04) return 2;
  if (hh > 0.86) return 11;
  if (hh > 0.68) return 10;
  if (t < 0.14) return 9;
  if (t < 0.30) return r < 0.2 ? 9 : 8;
  if (t < 0.58) return r < 0.16 ? 3 : r < 0.36 ? 4 : 6;
  return r < 0.18 ? 3 : r < 0.45 ? 5 : r < 0.66 ? 6 : 7;
}
function finalizeWorld(w) {
  const { h, land, coast, temp, rain, river, lat, tn, biome, dR, wa, drink, fert, wild, cover, soil } = w;
  for (let i = 0; i < N; i++) {
    land[i] = h[i] > 0 ? 1 : 0;
    temp[i] = clamp(1 - Math.pow(lat[i], 1.3) * 0.95 - 0.42 * Math.pow(Math.max(h[i], 0), 1.1) + tn[i], 0, 1);
    if (!land[i]) river[i] = 0;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!land[i]) { coast[i] = 0; continue; }
    let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; if (!land[ty * W + tx]) c = 1; }
    coast[i] = c;
  }
  for (let i = 0; i < N; i++) biome[i] = land[i] ? biomeOf(temp[i], rain[i], h[i], coast[i]) : (h[i] < -0.35 ? 0 : 1);
  dR.fill(99); const rq = [];
  for (let i = 0; i < N; i++) if (river[i]) { dR[i] = 0; rq.push(i); }
  for (let qi = 0; qi < rq.length; qi++) {
    const i = rq[qi]; if (dR[i] >= 4) continue; const x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && land[j] && dR[j] === 99) { dR[j] = dR[i] + 1; rq.push(j); }
  }
  for (let i = 0; i < N; i++) {
    if (!land[i]) { wa[i] = 0; drink[i] = 0; fert[i] = 0; wild[i] = 0; continue; }
    const b = biome[i], r = rain[i], dr = dR[i];
    wa[i] = Math.min(1, r * 1.1 + (dr === 0 ? 0.6 : dr === 1 ? 0.3 : dr <= 3 ? 0.12 : 0));
    drink[i] = dr === 0 ? 1 : dr <= 2 ? 0.7 : Math.min(0.75, r * 0.8 + 0.05);
    const tsuit = clamp(1 - Math.abs(temp[i] - 0.62) / 0.5, 0, 1);
    fert[i] = tsuit * SOIL[b] * soil[i];
    const bc = BASE_COVER[b] || 0, cf = bc > 0 && (b === 5 || b === 6 || b === 7 || b === 8) ? (0.55 + 0.45 * Math.min(1, cover[i] / bc)) : 1;
    wild[i] = (WILD[b] * (0.7 + 0.6 * wa[i]) + (dr === 0 ? 0.18 : 0) + (coast[i] ? 0.3 : 0)) * cf;
  }
}
function worldFromState(ws) {
  const w = newWorldShell();
  w.h.set(fromB64(ws.h, Float32Array)); w.rain.set(fromB64(ws.rain, Float32Array)); w.river.set(fromB64(ws.river, Uint8Array));
  w.soil.set(fromB64(ws.soil, Float32Array)); w.tn.set(fromB64(ws.tn, Float32Array)); w.cover.set(fromB64(ws.cover, Float32Array));
  finalizeWorld(w); return w;
}
function genWorld(seed) {
  const rng = mulberry32((seed >>> 0) || 1);
  const n1 = makeNoise(rng), n2 = makeNoise(rng), n3 = makeNoise(rng), n4 = makeNoise(rng), n5 = makeNoise(rng);
  const w = newWorldShell(), e = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = fbm(n1, x / 40, y / 40, 5) + 0.3 * (fbm(n2, x / 16 + 40, y / 16 + 40, 3) - 0.5);
    const dx = Math.min(x, W - 1 - x) / 15, dy = Math.min(y, H - 1 - y) / 11;
    let ed = Math.min(1, dx, dy); ed = ed * ed * (3 - 2 * ed);
    e[y * W + x] = v * (0.3 + 0.7 * ed) - 0.16 * (1 - ed);
    w.tn[y * W + x] = (fbm(n4, x / 20, y / 20, 3) - 0.5) * 0.1;
    w.soil[y * W + x] = 0.75 + 0.25 * n5(x / 9, y / 9);
  }
  const sorted = Float32Array.from(e).sort();
  const sea = sorted[Math.floor(N * 0.42)], emax = sorted[N - 1], emin = sorted[0];
  const h = w.h, land = new Uint8Array(N);
  for (let i = 0; i < N; i++) { h[i] = e[i] > sea ? (e[i] - sea) / (emax - sea) : (e[i] - sea) / (sea - emin); land[i] = h[i] > 0 ? 1 : 0; }
  const dO = new Int16Array(N).fill(-1), q = [];
  for (let i = 0; i < N; i++) if (!land[i]) { dO[i] = 0; q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && dO[j] < 0) { dO[j] = dO[i] + 1; q.push(j); }
  }
  const adv = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    const lat = w.lat[y * W], dir = lat < 0.33 ? -1 : 1; let M = 0.5;
    for (let k = 0; k < W; k++) {
      const x = dir > 0 ? k : W - 1 - k, i = y * W + x;
      if (!land[i]) M = Math.min(1, M + 0.10);
      else {
        const px = x - dir, ph = (px >= 0 && px < W) ? Math.max(h[y * W + px], 0) : 0, rise = Math.max(0, h[i] - ph);
        const p = Math.min(M, M * (0.06 + 2.6 * rise)); M = M - p + 0.010; adv[i] = p;
      }
    }
  }
  const landIdx = []; for (let i = 0; i < N; i++) if (land[i]) landIdx.push(i);
  const advS = landIdx.map(i => adv[i]).sort((a, b) => a - b), p95 = advS[Math.floor(advS.length * 0.95)] || 1;
  const raw = new Float32Array(N);
  for (const i of landIdx) {
    const x = i % W, y = (i / W) | 0, lat = w.lat[i];
    const itcz = 0.22 * Math.exp(-Math.pow(lat / 0.16, 2)), sub = 0.2 * Math.exp(-Math.pow((lat - 0.36) / 0.12, 2));
    raw[i] = 0.55 * Math.min(1.5, adv[i] / p95) + 0.22 * Math.exp(-dO[i] / 16) + 0.18 * fbm(n3, x / 18, y / 18, 3) + itcz - sub;
  }
  const rk = landIdx.slice().sort((a, b) => raw[a] - raw[b]);
  for (let k = 0; k < rk.length; k++) w.rain[rk[k]] = k / (rk.length - 1);
  const river = w.river, srcs = [];
  for (const i of landIdx) if (h[i] > 0.30 && w.rain[i] > 0.5 && rng() < 0.06) srcs.push(i);
  for (let i = srcs.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = srcs[i]; srcs[i] = srcs[j]; srcs[j] = t; }
  for (const s0 of srcs.slice(0, 70)) {
    let i = s0; const seen = new Set();
    for (let step = 0; step < 400; step++) {
      river[i] = Math.min(250, river[i] + 1); seen.add(i); if (!land[i]) break;
      let best = -1, bv = e[i]; const x = i % W, y = (i / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (seen.has(j)) continue; const v = e[j] + rng() * 0.004; if (v < bv) { bv = v; best = j; }
      }
      if (best < 0) break; i = best;
    }
  }
  finalizeWorld(w);
  for (let i = 0; i < N; i++) if (w.land[i]) w.cover[i] = BASE_COVER[w.biome[i]] || 0;
  finalizeWorld(w);
  return w;
}

function pickSpot(world, kind, skip) {
  const { W, H, land, biome, dR, fert, rain, coast, wild, river } = world;
  let best = null, bv = -1e9; skip = skip || [];
  for (let y = 8; y < H - 8; y += 2) for (let x = 8; x < W - 8; x += 2) {
    const i = y * W + x; if (!land[i] || coast[i]) continue;
    let ok = true; for (const s of skip) if (Math.hypot(s.x - x, s.y - y) < 14) ok = false; if (!ok) continue;
    let sc = 0, cnt = 0, des = 0, f = 0, ri = 0;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const j = (y + dy) * W + x + dx; if (!land[j]) continue; cnt++; if (biome[j] === 3) des++; f += fert[j]; if (river[j]) ri++;
    }
    if (cnt < 60) continue;
    if (kind === 'gurun') { if (dR[i] < 2 || dR[i] > 4 || des / cnt < 0.5) continue; sc = des / cnt * 10 - f; }
    else if (kind === 'gurundalam') { if (dR[i] < 6 || des / cnt < 0.6) continue; sc = des / cnt * 10 - f; }
    else if (kind === 'sungai') { if (dR[i] > 1 || biome[i] === 3 || biome[i] >= 9) continue; sc = f + ri * 0.1 + (biome[i] === 4 || biome[i] === 6 ? 3 : 0); }
    else if (kind === 'tundra') { if (biome[i] !== 9 && biome[i] !== 8) continue; sc = -f; }
    else { sc = f + wild[i] * 20; }
    if (sc > bv) { bv = sc; best = { x, y }; }
  }
  if (!best) { for (let y = 10; y < H - 10 && !best; y++) for (let x = 10; x < W - 10; x++) if (land[y * W + x]) { best = { x, y }; break; } }
  return best;
}

function createSim(sc) {
  sc = sc || {};
  const world = sc.state ? worldFromState(sc.state.world) : (sc.world || genWorld(sc.seed || 1));
  const rng = makeRng(((((sc.simSeed != null) ? sc.simSeed : ((sc.seed || 1) * 7 + 3)) >>> 0) * 2654435761) >>> 0);
  const gauss = () => { let u = 0; while (u === 0) u = rng(); const v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); };
  const S = {
    world, year: 0, agents: [], settlements: [], polities: [], wars: [], log: [], hist: [], histStep: 5,
    aid: 1, sid: 1, pid: 1, fid: 1, climate: 1, owner: new Int16Array(N), ownerS: new Int16Array(N), cap: sc.cap || 2000,
    catchDirty: true, truce: {}, cause: { lapar: 0, haus: 0, perang: 0, wabah: 0, usia: 0, bencana: 0 }, births: 0, deaths: 0,
    logN: 0, maxEra: 0, eraYear: [0, null, null, null, null, null], pcount: 0, wlog: 0
  };
  const pct = v => Math.round(v * 100);
  function ev(type, txt) { S.log.push({ n: ++S.logN, y: S.year, t: type, x: txt }); if (S.log.length > 500) S.log.shift(); }
  function genName() { let s = ''; const n = 2 + ((rng() * 2) | 0); for (let i = 0; i < n; i++) s += SYL[(rng() * SYL.length) | 0]; return s[0].toUpperCase() + s.slice(1); }
  const traitClamp = v => v < 0.02 ? 0.02 : v > 0.98 ? 0.98 : v;
  const softCap = s => [80, 160, 400, 800, 1600, 1e9][s.p.era];

  function applyTechs(p) {
    const m = { farm: 1, craft: 1, weapon: 1, know: 1, med: 1, spoil: 1, span: 0, trade: 1 }, f = {}; let era = 0;
    for (const id of p.techs) { const t = T_BY[id]; if (t.fx) for (const k in t.fx) { if (k === 'span') m.span += t.fx[k]; else m[k] *= t.fx[k]; } if (t.flag) f[t.flag] = true; if (t.era > era) era = t.era; }
    p.mult = m; p.flags = f; p.era = era; p.tv++;
  }
  function addPolity(parent, ov) {
    const p = { id: ov ? ov.id : S.pid++, name: ov ? ov.name : genName(), col: ov ? ov.col : PCOL[(S.pcount++) % PCOL.length], cap: null, leader: null, sets: [], techs: new Set(), tv: 0, mult: null, flags: {}, know: 0, target: null, grv: {}, allies: new Set(), tie: {}, near: {}, pop: 0, mil: 0, milEff: 0, soldiers: 0, era: 0, stab: 1, fs: 1, eff: 1, comp: 0.5, soldierFrac: 0.03, expand: 0.1, knowAdd: 0, contacts: 0, born: S.year, alive: true, adults: 0 };
    if (parent) { for (const t of parent.techs) p.techs.add(t); p.know = parent.know * 0.4; }
    applyTechs(p); S.polities.push(p); return p;
  }
  function addSettlement(x, y, P, name, ov) {
    const s = { id: ov ? ov.id : S.sid++, name: name || genName(), x, y, p: P, members: [], food: 0, tools: 0, stock: 0, cmax: 1, wildCap: 0, tiles: [], fy: [], fyVer: -1, drinkAcc: 0.1, thirst: 0, drinkCap: 99, fs: 1, fsRaw: 1, sat: 1, resent: 0, counts: [0, 0, 0, 0, 0, 0], pop: 0, mil: 0, milEff: 0, nb: [], lastColony: S.year, founded: S.year, needNow: 0, fresh: true, plague: 0, prodFood: 0 };
    S.settlements.push(s); S.catchDirty = true; return s;
  }
  function newAgent(s, age, sex, base, fam) {
    const t = (m, sd) => traitClamp(m + gauss() * sd);
    return { id: S.aid++, age, sex, iq: t(base.iq, 0.12), ag: t(base.ag, 0.14), o: t(0.5, 0.16), c: t(0.5, 0.16), e: t(0.5, 0.16), a: t(0.5, 0.16), n: t(0.5, 0.16), sk: [0.1 + rng() * 0.1, 0.05 + rng() * 0.1, 0.05 + rng() * 0.1, 0.05 + rng() * 0.1, 0.05 + rng() * 0.1, 0.03 + rng() * 0.05], job: -1, hunger: 0, thirst: 0, s, fam: fam || S.fid++, momId: 0, dadId: 0, partner: null, alive: true, jx: (rng() - 0.5) * 2, jy: (rng() - 0.5) * 2, sat: 1, mv: 0 };
  }
  function childOf(m, f) {
    const mix = k => traitClamp((m[k] + f[k]) / 2 + gauss() * 0.09);
    return { id: S.aid++, age: 0, sex: rng() < 0.5 ? 0 : 1, iq: mix('iq'), ag: mix('ag'), o: mix('o'), c: mix('c'), e: mix('e'), a: mix('a'), n: mix('n'), sk: [0.05, 0.03, 0.03, 0.03, 0.03, 0.02], job: -1, hunger: 0, thirst: 0, s: m.s, fam: m.fam, momId: m.id, dadId: f.id, partner: null, alive: true, jx: (rng() - 0.5) * 2, jy: (rng() - 0.5) * 2, sat: 1, mv: 0 };
  }
  function kin(a, b) { return (a.momId && (a.momId === b.momId || a.momId === b.id)) || (a.dadId && (a.dadId === b.dadId || a.dadId === b.id)) || (b.momId === a.id) || (b.dadId === a.id); }
  function kill(a, c) { if (!a.alive) return; a.alive = false; S.cause[c]++; S.deaths++; }
  function warBetween(p, q) { for (const w of S.wars) if ((w.a === p && w.b === q) || (w.a === q && w.b === p)) return w; return null; }
  function atWarP(p) { for (const w of S.wars) if (w.a === p || w.b === p) return true; return false; }
  function prest(a, war) { return 0.30 * a.iq + 0.20 * a.e + 0.15 * a.c + 0.15 * a.ag * (war ? 1 : 0.5) + (war ? 0.1 * a.sk[4] : 0) + 0.1 * rng(); }
  function pickLeader(p, excl) {
    const war = atWarP(p); let best = null, bv = -1;
    const search = list => { for (const a of list) { if (!a.alive || a === excl || a.age < 18 || a.age > 72) continue; const v = prest(a, war); if (v > bv) { bv = v; best = a; } } };
    if (p.cap) search(p.cap.members); if (!best) for (const s of p.sets) search(s.members);
    return best;
  }
  function derivePolicy(p) {
    const L = p.leader; if (!L) return; const war = atWarP(p);
    p.soldierFrac = clamp(0.025 + 0.09 * L.ag * (1 - 0.5 * L.a) + 0.03 * L.n + (war ? 0.08 + 0.10 * L.ag : 0), 0.02, 0.28);
    p.expand = 0.05 + 0.12 * L.o + 0.04 * L.e; p.comp = 0.5 * L.iq + 0.5 * L.c; p.eff = 0.9 + 0.2 * p.comp;
  }
  function setLeader(p, a, why) {
    if (p.leader && p.leader.alive && p.leader !== a) p.leader.job = -1;
    p.leader = a; a.job = -2; derivePolicy(p);
    if (why) ev('pemimpin', `${p.name}: pemimpin baru (${why}). Kecerdasan ${pct(a.iq)}, agresivitas ${pct(a.ag)}, keramahan ${pct(a.a)}`);
  }
  function unlock(P, t, src) {
    P.techs.add(t.id); applyTechs(P);
    for (const s of P.sets) s.fyVer = -1;
    ev('teknologi', `${P.name} menguasai ${t.nama}${src ? ' (dari ' + src + ')' : ''}`);
    if (P.era > S.maxEra) { S.maxEra = P.era; S.eraYear[P.era] = S.year; ev('era', `${P.name} memasuki ${ERA_NAME[P.era]}`); }
    else if (S.eraYear[P.era] == null) S.eraYear[P.era] = S.year;
  }

  function nearestLand(x, y) {
    for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const tx = x + dx, ty = y + dy; if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
      if (world.land[ty * W + tx]) return { x: tx, y: ty };
    }
    return { x: 64, y: 48 };
  }
  function spawnGroup(g) {
    const pos = nearestLand(g.x | 0, g.y | 0), P = addPolity(null), s = addSettlement(pos.x, pos.y, P); P.cap = s;
    const cps = [], n = clamp(g.n | 0, 8, 300), couples = Math.max(2, Math.floor(n * 0.28)), fams = [], base = { iq: g.iq, ag: g.ag };
    const list = [];
    for (let c = 0; c < couples; c++) {
      const m = newAgent(s, 18 + ((rng() * 24) | 0), 0, base), f = newAgent(s, 18 + ((rng() * 22) | 0), 1, base);
      f.fam = m.fam; m.partner = f; f.partner = m; list.push(m, f); fams.push(m.fam); cps.push([m, f]);
    }
    for (let k = 2 * couples; k < n; k++) { const ci = (rng() * fams.length) | 0, ch = newAgent(s, (rng() * 14) | 0, rng() < 0.5 ? 0 : 1, base, fams[ci]); ch.momId = cps[ci][1].id; ch.dadId = cps[ci][0].id; list.push(ch); }
    for (const a of list) { S.agents.push(a); s.members.push(a); }
    P.sets = [s]; s.food = n * 1.2;
    const L = pickLeader(P, null);
    if (g.leader === 'agresif') { L.ag = 0.92; L.a = 0.15; L.iq = Math.max(L.iq, 0.6); L.e = 0.8; }
    else if (g.leader === 'damai') { L.ag = 0.08; L.a = 0.88; L.iq = Math.max(L.iq, 0.7); L.o = 0.7; L.c = 0.7; }
    setLeader(P, L, 'pemimpin pertama');
    ev('awal', `${P.name} berdiri di ${s.name} dengan ${n} orang`);
    return P;
  }

  function refreshCatch() {
    const R = 7, best = new Float32Array(N).fill(1e9), sm = new Map();
    S.ownerS.fill(0); S.owner.fill(0);
    for (const s of S.settlements) { sm.set(s.id, s); s.tiles.length = 0; }
    for (const s of S.settlements) {
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const tx = s.x + dx, ty = s.y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        const d2 = dx * dx + dy * dy; if (d2 > R * R) continue; const i = ty * W + tx; if (!world.land[i]) continue;
        if (d2 < best[i]) { best[i] = d2; S.ownerS[i] = s.id; }
      }
    }
    for (let i = 0; i < N; i++) { const id = S.ownerS[i]; if (!id) continue; const s = sm.get(id); S.owner[i] = s.p.id; if (best[i] <= 36) s.tiles.push(i); }
    for (const s of S.settlements) {
      let wc = 0; for (const i of s.tiles) wc += world.wild[i]; s.wildCap = wc;
      let acc = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = s.x + dx, ty = s.y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; const i = ty * W + tx; if (world.land[i]) acc = Math.max(acc, world.drink[i]); }
      s.drinkAcc = acc; s.cmax = Math.max(0.5, wc * 10);
      if (s.fresh) { s.stock = s.cmax * 0.7; s.fresh = false; }
      s.stock = Math.min(s.stock, s.cmax); s.fyVer = -1;
    }
    S.catchDirty = false;
  }
  function refreshFarm(s) {
    const P = s.p, f = P.flags, arr = [];
    for (const i of s.tiles) {
      if (world.fert[i] < 0.08) continue; const dr = world.dR[i]; let we = world.wa[i];
      if (f.irrig && dr <= 3) we = Math.max(we, 0.85); if (f.wells) we = Math.max(we, 0.45); if (f.power) we = Math.max(we, 0.7);
      let wf = Math.min(1, we / 0.45); if (world.rain[i] > 0.88) wf *= 0.9;
      const q = world.fert[i] * wf; if (q > 0.04) arr.push(q);
    }
    arr.sort((a, b) => b - a); s.fy = arr; s.fyVer = P.tv;
  }
  function drinkCapOf(s) {
    const f = s.p.flags; let acc = s.drinkAcc; if (f.wells) acc = Math.max(acc, 0.45); if (f.power) acc = Math.max(acc, 0.7);
    let c = 140 * acc; if (f.wells) c *= 2; if (f.roads) c *= 1.5; if (f.power) c *= 2; if (f.sanit) c *= 2; return c;
  }

  const BASEF = 2.4;
  function assignJobs() {
    for (const s of S.settlements) {
      const P = s.p, m = P.mult, ms = s.members, counts = s.counts; counts.fill(0);
      const adults = []; for (const a of ms) { if (a.age >= 15 && a !== P.leader) { adults.push(a); if (a.job >= 0) counts[a.job]++; else if (a.job === -2) a.job = -1; } }
      if (s.fyVer !== P.tv) refreshFarm(s);
      const D = (0.8 * s.pop + 4) * Math.sqrt(m.craft), toolF = 1 + 0.4 * Math.tanh(s.tools / D), fv = clamp(2.0 - s.fs, 0.3, 1.6);
      const war = atWarP(P), target = P.soldierFrac * adults.length;
      let nbN = 0, nbFs = 0; for (const o of s.nb) { if (o.d > 8 + (P.flags.roads ? 10 : 0)) break; nbN++; nbFs += o.s.fs; }
      const imb = nbN ? clamp(Math.abs(s.fs - nbFs / nbN), 0, 1) : 0;
      const sCap = Math.max(1, Math.floor(0.12 * adults.length));
      const start = adults.length ? (rng() * adults.length) | 0 : 0;
      for (let k = 0; k < adults.length; k++) {
        const a = adults[(k + start) % adults.length];
        const need = a.job < 0 || rng() < (a.hunger > 0.3 ? 0.5 : 0.18) || (war && counts[4] < target && rng() < 0.5);
        if (!need) continue;
        if (a.job >= 0) counts[a.job]--;
        const noise = (1.2 - a.c) * 0.5; let bj = 0, bu = -99;
        for (let j = 0; j < 6; j++) {
          let u = -99;
          if (j === 0) u = fv * Math.min(2.3 * (0.3 + 0.7 * s.stock / s.cmax), 0.2 * s.stock / (counts[0] + 1)) * Math.sqrt(toolF) * (0.75 + 0.5 * a.sk[0]);
          else if (j === 1) { if (P.flags.agri) { const kk = counts[1], y = kk < s.fy.length ? s.fy[kk] : (s.fy.length ? 0.15 * s.fy[s.fy.length - 1] : 0); u = fv * y * BASEF * m.farm * toolF * P.eff * (0.75 + 0.5 * a.sk[1]) * (0.9 + 0.2 * a.c); } }
          else if (j === 2) { if (counts[2] < Math.max(1, 0.12 * adults.length * (m.craft > 1.5 ? 2 : 1))) u = clamp(2.0 - 2.2 * s.tools / D, 0.1, 2) * (s.fs >= 0.95 ? 1 : s.fs * s.fs) * 0.9 * (0.6 + 0.8 * a.sk[2]); }
          else if (j === 3) { if (P.flags.roads && nbN) u = (0.25 + 1.1 * imb) / (1 + counts[3] / (2 + 0.1 * adults.length)) * (0.6 + 0.8 * a.sk[3]) * (0.8 + 0.4 * a.e); }
          else if (j === 4) { const sf = target - counts[4]; u = sf <= 0 ? -2 : 0.6 + 1.4 * a.ag * (1 + (war ? 0.3 : 0)) + (war ? 1.2 : 0) - 0.9 * a.n - 0.3 * a.a; }
          else if (j === 5) { if (P.flags.writing && counts[5] < sCap) u = 1.8 * (0.4 + 0.8 * a.iq) * (0.5 + a.sk[5]) * clamp((s.fs - 0.9) * 2.5, 0, 1) / (1 + counts[5] / 4); }
          if (u > -90) u += (rng() - 0.5) * noise;
          if (u > bu) { bu = u; bj = j; }
        }
        a.job = bj; counts[bj]++;
      }
    }
  }

  function produce() {
    for (const s of S.settlements) {
      const P = s.p, m = P.mult; let nF = 0, craftOut = 0, milPow = 0, knowAdd = 0; const farmers = [];
      for (const a of s.members) {
        if (a.age < 15 || a.job < 0 || a === P.leader) continue;
        const prod = a.age > 60 ? 0.6 : a.age < 18 ? 0.75 : 1;
        switch (a.job) {
          case 0: nF += prod * (0.75 + 0.5 * a.sk[0]); break;
          case 1: farmers.push(prod * (0.75 + 0.5 * a.sk[1])); break;
          case 2: craftOut += prod * (0.9 + 0.9 * a.sk[2]) * 1.5; break;
          case 4: milPow += prod * (0.5 + 0.7 * a.sk[4] + 0.2 * a.ag) * (1 - 0.25 * a.n); break;
          case 5: if (a.hunger < 0.4) knowAdd += 0.22 * a.iq * (0.5 + a.sk[5]) * prod; break;
        }
        if (a.hunger < 0.4) knowAdd += 0.012 * a.iq * prod;
        const j = a.job; a.sk[j] = Math.min(1, a.sk[j] + 0.035 * (0.4 + 0.6 * a.iq) * (0.6 + 0.4 * a.c) * (1 - a.sk[j]));
      }
      const D = (0.8 * s.pop + 4) * Math.sqrt(m.craft);
      s.tools = s.tools * 0.94 + craftOut * m.craft * P.eff;
      const toolF = 1 + 0.4 * Math.tanh(s.tools / D);
      const Fh = Math.min(0.2 * s.stock, nF * 2.3 * (0.3 + 0.7 * s.stock / s.cmax) * Math.sqrt(toolF));
      s.stock -= Fh; s.stock += 0.4 * s.stock * (1 - s.stock / s.cmax) + 0.01 * s.cmax; s.stock = clamp(s.stock, 0, s.cmax);
      const rainfed = !(P.flags.irrig || P.flags.wells);
      const wth = rainfed ? clamp(1 + (S.climate - 1) * 1.6 + 0.12 * gauss(), 0.35, 1.5) : clamp(1 + (S.climate - 1) * 0.8 + 0.06 * gauss(), 0.6, 1.3);
      farmers.sort((x, y) => y - x); let farm = 0;
      for (let k = 0; k < farmers.length; k++) { const y = k < s.fy.length ? s.fy[k] : (s.fy.length ? 0.15 * s.fy[s.fy.length - 1] : 0); farm += farmers[k] * y * BASEF * m.farm * toolF * P.eff * wth; }
      s.food += Fh + farm; s.prodFood = Fh + farm;
      s.mil = milPow; s.milEff = milPow * m.weapon * (0.75 + 0.25 * Math.tanh(s.tools / (s.counts[4] * 2 + 4)));
      P.knowAdd += knowAdd;
    }
    for (const P of S.polities) { P.know += 0.45 * P.knowAdd * P.mult.know * (1 + 0.04 * Math.min(10, P.contacts)); }
  }

  function trade() {
    for (const p of S.polities) p.tie = {};
    for (const s of S.settlements) {
      const need = s.members.length * 0.95, def = need - s.food; if (def <= 0.5) continue; let remain = def;
      for (const o of s.nb) {
        if (remain <= 0.2) break; const t = o.s, d = o.d, P = s.p, Q = t.p, same = P === Q;
        if (!same && warBetween(P, Q)) continue;
        const range = 8 + (P.flags.roads ? 10 : 0) + (Q.flags.roads ? 6 : 0) + (P.flags.power ? 20 : 0); if (d > range) continue;
        const sur = t.food - t.members.length * 1.25; if (sur <= 0.5) continue;
        const tr = s.counts[3] + t.counts[3];
        const cap = 3 * tr * Math.max(P.mult.trade, Q.mult.trade) + (same && P.flags.writing ? 0.15 * def : 0) + (same ? 0.5 : 0); if (cap <= 0) continue;
        const amt = Math.min(remain, sur, cap); t.food -= amt; s.food += amt * 0.95; remain -= amt;
        if (!same) { P.tie[Q.id] = (P.tie[Q.id] || 0) + amt; Q.tie[P.id] = (Q.tie[P.id] || 0) + amt; }
      }
    }
  }

  function lifecycle() {
    const births = [];
    for (const s of S.settlements) {
      const P = s.p, ms = s.members; let need = 0;
      for (const a of ms) need += a.age < 15 ? 0.5 : (a.job === 4 ? 1.1 : (a.age > 60 ? 0.9 : 1));
      s.needNow = need; const have = s.food, r = need > 0 ? Math.min(1, have / need) : 1;
      s.fsRaw = need > 0 ? have / need : 1; s.fs = 0.6 * s.fs + 0.4 * Math.min(3, s.fsRaw);
      s.food = r >= 1 ? have - need : 0; s.food *= (1 - Math.min(0.5, 0.22 * P.mult.spoil));
      s.drinkCap = drinkCapOf(s); const n = ms.length; s.thirst = n > s.drinkCap ? 1 - s.drinkCap / n : 0;
      s.plague = s.forcePlague || 0; s.forcePlague = 0;
      if (!s.plague && n >= 80 && rng() < 0.002 * (n / 80) * (P.flags.sanit ? 0.1 : 1) * (1 + 0.15 * Object.keys(P.tie).length)) {
        s.plague = 0.06 + 0.14 * rng(); if (n > 80) ev('wabah', `Wabah melanda ${s.name} (${P.name})`);
      }
      const soft = softCap(s), capF = Math.sqrt(clamp(1 - (S.agents.length + births.length) / S.cap, 0, 1));
      let satSum = 0;
      for (const a of ms) {
        if (!a.alive) continue;
        const wt = a.age < 15 ? 1.3 : a.age > 60 ? 1.2 : a.job === 4 ? 0.7 : a.job === -2 ? 0.2 : 1;
        if (r >= 1) a.hunger = Math.max(0, a.hunger - 0.35); else a.hunger = Math.min(1, a.hunger + (1 - r) * 0.6 * wt);
        a.thirst = s.thirst; a.sat = clamp(1 - 1.2 * a.hunger - 0.8 * s.thirst + 0.1 * (a.a - 0.5), 0, 1); satSum += a.sat;
        const qb = (0.0004 * Math.exp(0.088 * a.age) + (a.age < 5 ? 0.05 : 0)) * P.mult.med;
        const qh = a.hunger > 0.5 ? (a.hunger - 0.5) * 0.9 * (a.age < 15 || a.age > 60 ? 1.5 : 1) : 0, qt = s.thirst * 0.25;
        const qw = s.plague * (a.age < 5 || a.age > 55 ? 1.5 : 1) * P.mult.med, q = qb + qh + qt + qw;
        if (rng() < q) { const mx = Math.max(qb, qh, qt, qw); kill(a, mx === qh ? 'lapar' : mx === qt ? 'haus' : mx === qw ? 'wabah' : 'usia'); continue; }
        a.age++;
        if (a.partner && !a.partner.alive) a.partner = null;
        if (a.sex === 1 && a.partner && a.partner.s === s && a.age >= 16 && a.age <= 42) {
          const fert = [1, 1.12, 1.1, 1.05, 0.8, 0.45][P.era];
          const pb = 0.42 * fert * clamp((s.fs - 0.8) / 0.4, 0, 1) * (1 - a.hunger) * (1 - s.thirst) * (a.age > 36 ? 0.6 : 1) * capF * (n > soft ? 0.4 : 1);
          if (rng() < pb) births.push(childOf(a, a.partner));
        }
      }
      s.sat = ms.length ? satSum / ms.length : 1; s.sat = clamp(s.sat - s.resent, 0, 1); s.resent *= 0.9;
    }
    for (const b of births) { S.agents.push(b); S.births++; }
    for (const s of S.settlements) {
      const sm = [], sf = [];
      for (const a of s.members) if (a.alive && !a.partner && a.age >= 16 && a.age <= 50) (a.sex === 0 ? sm : sf).push(a);
      for (const a of sm) {
        if (!sf.length) break; if (rng() > 0.55 + 0.4 * a.e) continue;
        const k = (rng() * sf.length) | 0, b = sf[k]; if (kin(a, b) || Math.abs(a.age - b.age) > 12) continue;
        sf.splice(k, 1); a.partner = b; b.partner = a; const nf = S.fid++; a.fam = nf; b.fam = nf;
      }
    }
    S.agents = S.agents.filter(a => a.alive);
  }

  function moveFamily(a, t) {
    const from = a.s;
    for (const m of from.members) if (m.alive && m.fam === a.fam && m !== from.p.leader && m.mv !== S.year) { m.s = t; m.mv = S.year; }
  }
  function migrate() {
    for (const s of S.settlements) {
      const P = s.p, crowd = s.pop / softCap(s), stressed = s.fs < 0.85 || s.thirst > 0.1 || crowd > 1;
      const cur = Math.min(2, s.fs) + (s.thirst === 0 ? 0.4 : 0) - (crowd > 1 ? 0.3 : 0);
      for (const a of s.members.slice()) {
        if (!a.alive || a.age < 16 || a === P.leader || a.mv === S.year || a.s !== s) continue;
        const pm = stressed ? 0.18 * (1 - 0.5 * a.n) + 0.1 * a.o : 0.003 * (1 + 3 * a.o) * (1 - 0.5 * a.n);
        if (rng() > pm) continue;
        let best = null, bs = -9;
        for (const o of s.nb) {
          if (o.d > 14) break; const t = o.s; if (t.p !== P && warBetween(P, t.p)) continue;
          const sc2 = Math.min(2, t.fs) + (t.thirst === 0 ? 0.4 : 0) - 0.03 * o.d - (t.p !== P ? 0.25 : 0) - (t.pop / softCap(t) > 1 ? 0.3 : 0);
          if (sc2 > bs) { bs = sc2; best = t; }
        }
        if (best && bs > cur + 0.25) moveFamily(a, best);
      }
    }
  }
  function siteScore(P, i) {
    const x = i % W, y = (i / W) | 0; let wild = 0, fert = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; const j = ty * W + tx; if (!world.land[j]) continue; wild += world.wild[j]; fert += world.fert[j] * world.wa[j]; }
    let drink = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; const j = ty * W + tx; if (world.land[j]) drink = Math.max(drink, world.drink[j]); }
    if (P.flags.wells) drink = Math.max(drink, 0.45); if (drink < 0.2) return -1;
    return 0.5 * wild / 6 + (P.flags.agri ? 0.06 * fert : 0) + 0.5 * drink + (world.river[i] ? 0.3 : 0) + (world.coast[i] ? 0.15 : 0);
  }
  function colonize(s) {
    const P = s.p; let best = -1, bv = 0.6;
    for (let k = 0; k < 40; k++) {
      const ang = rng() * 6.2832, d = 7 + rng() * 17, x = Math.round(s.x + Math.cos(ang) * d), y = Math.round(s.y + Math.sin(ang) * d);
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue; const i = y * W + x; if (!world.land[i]) continue;
      let ok = true; for (const o of S.settlements) if (Math.hypot(o.x - x, o.y - y) < 6) { ok = false; break; } if (!ok) continue;
      const v = siteScore(P, i); if (v > bv) { bv = v; best = i; }
    }
    if (best < 0) { return false; }
    const ad = s.members.filter(a => a.alive && a.age >= 16 && a !== P.leader && a.mv !== S.year).sort((a, b) => (b.o + 0.3 * b.e - 0.5 * b.n + 0.2 * rng()) - (a.o + 0.3 * a.e - 0.5 * a.n + 0.2 * rng()));
    const want = clamp(Math.round(0.15 * s.pop), 6, 30), maxMove = Math.floor(0.45 * s.pop), group = [], fams = new Set();
    for (const a of ad) { if (group.length >= want) break; if (fams.has(a.fam)) continue; fams.add(a.fam); const fm = s.members.filter(m => m.alive && m.fam === a.fam && m !== P.leader && m.mv !== S.year); if (group.length + fm.length > Math.max(want * 1.3, 8) || group.length + fm.length > maxMove) continue; for (const m of fm) group.push(m); }
    if (group.length < 5) { return false; }
    const ns = addSettlement(best % W, (best / W) | 0, P);
    const share = group.length / s.pop, fd = s.food * share * 0.9; s.food -= fd; ns.food = fd + group.length * 1.5;
    for (const m of group) { m.s = ns; m.mv = S.year; }
    s.lastColony = S.year; ev('koloni', `${P.name}: ${group.length} orang dari ${s.name} mendirikan ${ns.name}`);
    return true;
  }
  function expandPhase() {
    for (const s of S.settlements.slice()) {
      const P = s.p; if (!P.leader) continue; const soft = softCap(s);
      const pressure = Math.max(1 - Math.min(1, s.fs), s.thirst * 1.5, s.pop / soft - 0.7, s.pop / Math.max(10, s.drinkCap) - 0.6);
      if (pressure > 0.15 && s.pop >= 20 && S.year - s.lastColony > 15 && rng() < P.expand * (0.4 + pressure)) colonize(s);
    }
  }

  function removeEmpty() {
    S.settlements = S.settlements.filter(s => { if (s.members.length === 0) { S.catchDirty = true; return false; } return true; });
  }

  function declareWar(A, B) {
    const w = { a: A, b: B, start: S.year, exh: [0, 0], ha: [], hb: [] };
    S.wars.push(w); B.grv[A.id] = (B.grv[A.id] || 0) + 0.2;
    const pm = new Map(S.polities.map(p => [p.id, p]));
    for (const id of B.allies) { const q = pm.get(id); if (q && q !== A && !warBetween(A, q) && rng() < 0.6) w.hb.push(q); }
    for (const id of A.allies) { const q = pm.get(id); if (q && q !== B && !warBetween(B, q) && rng() < 0.6) w.ha.push(q); }
    const L = A.leader; ev('perang', `Perang: ${A.name} menyerang ${B.name} (pemimpin agresivitas ${pct(L.ag)}, keramahan ${pct(L.a)}, pangan/orang ${A.fs.toFixed(2)})`);
  }
  function endWar(w, why) {
    S.wars = S.wars.filter(x => x !== w);
    S.truce[w.a.id + '-' + w.b.id] = S.truce[w.b.id + '-' + w.a.id] = S.year + 10 + ((rng() * 15) | 0);
    const loser = w.exh[0] > w.exh[1] ? w.a : w.b; loser.grv[(loser === w.a ? w.b : w.a).id] = (loser.grv[(loser === w.a ? w.b : w.a).id] || 0) + 0.2;
    w.a.allies.delete(w.b.id); w.b.allies.delete(w.a.id);
    ev('damai', `Perang ${w.a.name} dan ${w.b.name} berakhir setelah ${S.year - w.start} tahun (${why})`);
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function wdist(d) { return d <= 10 ? 1 : d <= 24 ? 1 - (d - 10) / 20 : 0; }
  function capture(att, def, t, ia) {
    const wasCap = def.cap === t; t.p = att; t.resent = 0.45; t.tools *= 0.5; t.fyVer = -1; S.catchDirty = true;
    def.sets = def.sets.filter(x => x !== t); att.sets.push(t);
    const L = att.leader, ck = 0.03 + 0.12 * (L ? L.ag * (1 - 0.6 * L.a) : 0.3); let killed = 0;
    for (const a of t.members) if (a.alive && a.job !== 4 && a !== def.leader && rng() < ck) { kill(a, 'perang'); killed++; }
    att.sets.forEach(() => { }); const loot = t.food * 0.6; t.food -= loot;
    if (rng() < 0.5) { const miss = [...def.techs].filter(id => !att.techs.has(id) && T_BY[id].req.every(r => att.techs.has(r))); if (miss.length) unlock(att, T_BY[miss[0]], 'rampasan perang'); }
    ev('perang', `${att.name} merebut ${t.name} dari ${def.name}${killed ? ` (${killed} warga tewas)` : ''}`);
    def.grv[att.id] = (def.grv[att.id] || 0) + 0.25;
    if (wasCap) {
      if (def.sets.length) {
        def.cap = def.sets.slice().sort((x, y) => y.members.length - x.members.length)[0];
        if (def.leader) { if (rng() < 0.5) { kill(def.leader, 'perang'); } else { def.leader.s = def.cap; } }
      }
    }
  }
  function battle(w, att, def, ia) {
    let target = null, bd = 1e9;
    for (const x of def.sets) for (const y of att.sets) { const d = dist(x, y); if (d < bd) { bd = d; target = x; } }
    if (!target) return;
    const exA = w.exh[ia], exD = w.exh[1 - ia], helpA = ia === 0 ? w.ha : w.hb, helpD = ia === 0 ? w.hb : w.ha;
    let PA = 0; for (const s of att.sets) PA += s.milEff * wdist(dist(s, target));
    for (const q of helpA) for (const s of q.sets) PA += 0.5 * s.milEff * wdist(dist(s, target));
    PA *= (0.85 + 0.3 * (att.leader ? att.leader.iq : 0.5)) * (1 - 0.4 * exA);
    let PD = target.pop * 0.03;
    for (const s of def.sets) PD += s.milEff * wdist(dist(s, target));
    for (const q of helpD) for (const s of q.sets) PD += 0.5 * s.milEff * wdist(dist(s, target));
    PD *= 1.3 * (def.era >= 2 ? 1.2 : 1) * (0.85 + 0.3 * (def.leader ? def.leader.iq : 0.5)) * (1 - 0.4 * exD);
    if (PA <= 0.1) return;
    const rv = clamp(PA / (PA + PD + 1e-6) + gauss() * 0.06, 0.02, 0.98);
    const lethal = 0.8 + 0.35 * (att.mult.weapon + def.mult.weapon) / 2;
    const lossA = clamp(0.22 * (1 - rv) * lethal, 0, 0.6), lossD = clamp(0.22 * rv * lethal, 0, 0.6);
    let initD = 0, remD = 0, kA = 0, kD = 0;
    for (const s of att.sets) { const wgt = wdist(dist(s, target)); if (wgt <= 0.05) continue; for (const a of s.members) if (a.alive && a.job === 4 && rng() < lossA * (0.4 + 0.6 * wgt) * (1 - 0.4 * a.sk[4])) { kill(a, 'perang'); kA++; } }
    for (const s of def.sets) { const wgt = wdist(dist(s, target)); if (wgt <= 0.05) continue; for (const a of s.members) if (a.alive && a.job === 4) { if (s === target) initD++; if (rng() < lossD * (0.4 + 0.6 * wgt) * (1 - 0.4 * a.sk[4])) { kill(a, 'perang'); kD++; } else if (s === target) remD++; } }
    w.exh[ia] = clamp(w.exh[ia] + 1.2 * lossA + 0.02, 0, 1); w.exh[1 - ia] = clamp(w.exh[1 - ia] + 1.2 * lossD + 0.02, 0, 1);
    if (rv > 0.58 && (remD <= 0.4 * initD || remD <= 2)) capture(att, def, target, ia);
    else if (kA + kD >= 15 && S.wlog < S.year - 3) { S.wlog = S.year; ev('perang', `Pertempuran di ${target.name}: ${att.name} (${kA} gugur) melawan ${def.name} (${kD} gugur)`); }
  }
  function warStep() {
    for (const w of S.wars.slice()) {
      if (!w.a.sets.length || !w.b.sets.length) { endWar(w, 'salah satu pihak runtuh'); continue; }
      for (const [att, def, ia] of [[w.a, w.b, 0], [w.b, w.a, 1]]) {
        if (!att.leader || !att.sets.length || !def.sets.length) continue;
        const pAtt = clamp(0.25 + 0.6 * att.leader.ag + (att.milEff > def.milEff ? 0.15 : -0.05), 0.1, 0.9);
        if (rng() < pAtt && att.milEff > 0.5) battle(w, att, def, ia);
        if (!w.a.sets.length || !w.b.sets.length) break;
      }
      if (!w.a.sets.length || !w.b.sets.length) { endWar(w, 'salah satu pihak runtuh'); continue; }
      const dur = S.year - w.start, wish = i => { const P = i === 0 ? w.a : w.b, Q = i === 0 ? w.b : w.a, L = P.leader; return clamp(0.8 * w.exh[i] + (P.milEff < 0.6 * Q.milEff ? 0.25 : 0) + (L ? 0.35 * L.a - 0.5 * L.ag : 0), 0, 1); };
      if (dur > 2 && (rng() < 0.03 + 0.6 * Math.min(wish(0), wish(1)) || w.exh[0] > 0.95 || w.exh[1] > 0.95 || dur > 40)) endWar(w, w.exh[0] > 0.9 || w.exh[1] > 0.9 ? 'kelelahan perang' : 'perundingan');
    }
  }

  function diplomacy() {
    const pm = new Map(S.polities.map(p => [p.id, p]));
    for (const p of S.polities) for (const k in p.grv) { p.grv[k] *= 0.97; if (p.grv[k] < 0.01) delete p.grv[k]; }
    for (const A of S.polities) {
      const L = A.leader; if (!L) continue;
      for (const qid in A.near) {
        const B = pm.get(+qid); if (!B || !B.leader || warBetween(A, B)) continue;
        if (A.fs < 0.9) A.grv[B.id] = (A.grv[B.id] || 0) + 0.03 * (1 - A.fs);
        const tk = S.truce[A.id + '-' + B.id]; if (tk && tk > S.year) continue;
        if (A.allies.has(B.id)) { if ((A.grv[B.id] || 0) > 0.4) { A.allies.delete(B.id); B.allies.delete(A.id); ev('diplomasi', `Aliansi ${A.name} dan ${B.name} bubar`); } continue; }
        if (A.soldiers >= 4 && A.pop >= 25) {
          const lr = Math.log((A.milEff + 1) / (B.milEff + 1)), stress = clamp(1.05 - A.fs, 0, 1), gr = A.grv[B.id] || 0, ties = Math.min(2, (A.tie[B.id] || 0) / 10);
          const z = -4.2 + 3.0 * L.ag + 1.2 * (1 - L.a) + 0.9 * clamp(lr, -1.5, 1.5) + 1.5 * stress + 1.4 * gr + 0.6 * L.n * clamp(-lr, 0, 1.5) - 0.5 * ties;
          if (rng() < 0.22 / (1 + Math.exp(-z))) { declareWar(A, B); continue; }
        }
        if (A.id < B.id && B.leader && (A.grv[B.id] || 0) < 0.15 && (B.grv[A.id] || 0) < 0.15) {
          const k = (L.a + B.leader.a + L.o + B.leader.o) / 4;
          if (rng() < 0.012 * k * k * 2) { A.allies.add(B.id); B.allies.add(A.id); ev('diplomasi', `Aliansi terbentuk: ${A.name} dan ${B.name}`); }
        }
        for (const t of T) {
          if (!B.techs.has(t.id) || A.techs.has(t.id) || !t.req.every(r => A.techs.has(r))) continue;
          const ties = Math.min(2, (A.tie[B.id] || 0) / 10);
          if (A.pop >= 0.5 * t.pop && A.know >= 0.25 * t.cost && rng() < 0.03 * (1 + ties)) { unlock(A, t, B.name); A.know -= 0.25 * t.cost; }
        }
      }
    }
  }
  function secede(s) {
    const old = s.p, np = addPolity(old); s.p = np; np.cap = s; np.sets = [s]; np.pop = s.pop;
    old.sets = old.sets.filter(x => x !== s); S.catchDirty = true;
    const L = pickLeader(np, null); if (L) setLeader(np, L, 'pemisahan diri');
    ev('politik', `${s.name} memisahkan diri dari ${old.name} dan membentuk ${np.name}`);
    old.grv[np.id] = (old.grv[np.id] || 0) + 0.3;
  }
  function politics() {
    for (const P of S.polities.slice()) {
      derivePolicy(P);
      if (!P.leader || !P.leader.alive) { const prev = P.leader, nl = pickLeader(P, prev); if (nl) setLeader(P, nl, prev ? 'pemimpin sebelumnya wafat' : 'terbentuk'); }
      else if (P.leader.s.p !== P) { const old = P.leader; old.job = -1; const nl = pickLeader(P, old); if (nl) setLeader(P, nl, 'ibu kota jatuh'); }
      const L = P.leader; let sw = 0, sp = 0; for (const s of P.sets) { sw += s.sat * s.pop; sp += s.pop; }
      const span = 3 + Math.round(3 * (L ? L.iq : 0.5)) + P.mult.span, extra = Math.max(0, P.sets.length - span);
      P.stab = sp ? clamp((sw / sp) * (0.85 + 0.3 * P.comp) - 0.04 * extra, 0, 1) : 1;
      if (L && P.stab < 0.35 && rng() < (0.35 - P.stab) * 0.5) {
        const old = L, nl = pickLeader(P, old); if (nl) { old.job = -1; setLeader(P, nl, 'kudeta'); if (rng() < 0.4) kill(old, 'perang'); }
      }
      for (const s of P.sets.slice()) {
        if (s === P.cap || P.sets.length < 2) continue;
        const d = dist(s, P.cap), sat = s.sat - 0.04 * extra;
        if (sat < 0.4 && rng() < (0.4 - sat) * 0.08 * (1 + d / 15)) secede(s);
      }
      if (!P.target) {
        const av = T.filter(t => !P.techs.has(t.id) && t.req.every(r => P.techs.has(r)) && P.pop >= t.pop);
        if (av.length) {
          let bw = -1, bt = null;
          for (const t of av) { let w = 1 + 0.3 * rng(); if (L) { if (t.tag === 'mil') w += 1.5 * L.ag; else if (t.tag === 'sci') w += 1.5 * L.o; else if (t.tag === 'agri') w += 1.2 * L.c; else if (t.tag === 'soc') w += 1.5 * L.a; } w -= 0.00002 * t.cost; if (w > bw) { bw = w; bt = t; } }
          P.target = bt;
        }
      }
      if (P.target && P.know >= P.target.cost && P.pop >= P.target.pop) { const t = P.target; P.know -= t.cost; P.target = null; unlock(P, t); }
    }
  }

  function record() {
    if (S.year % S.histStep !== 0) return;
    const pops = {}; let tot = 0, fs = 0, me = 0;
    for (const p of S.polities) { pops[p.id] = p.pop; tot += p.pop; fs += p.fs * p.pop; if (p.era > me) me = p.era; }
    S.hist.push({ y: S.year, tot, pops, fs: tot ? fs / tot : 0, era: me, wars: S.wars.length });
    if (S.hist.length > 700) { S.hist = S.hist.filter((h, i) => i % 2 === 0); S.histStep *= 2; }
  }

  function step() {
    S.year++; S.births = 0; S.deaths = 0; S.climate = 1 + 0.12 * gauss();
    for (const s of S.settlements) s.members.length = 0;
    for (const a of S.agents) a.s.members.push(a);
    removeEmpty();
    if (S.catchDirty || S.year % 10 === 0) refreshCatch();
    for (const p of S.polities) { p.sets = []; p.pop = 0; p.knowAdd = 0; p.soldiers = 0; p.mil = 0; p.milEff = 0; p.near = {}; }
    for (const s of S.settlements) { s.p.sets.push(s); s.pop = s.members.length; s.p.pop += s.pop; }
    for (const p of S.polities.slice()) {
      if (!p.sets.length) {
        p.alive = false; S.polities = S.polities.filter(x => x !== p);
        for (const w of S.wars.slice()) if (w.a === p || w.b === p) endWar(w, 'sebuah bangsa musnah');
        for (const q of S.polities) q.allies.delete(p.id);
        ev('politik', `${p.name} runtuh dan hilang dari peta`); continue;
      }
      if (!p.cap || p.sets.indexOf(p.cap) < 0) p.cap = p.sets.slice().sort((x, y) => y.pop - x.pop)[0];
    }
    for (const s of S.settlements) {
      s.nb = []; for (const o of S.settlements) if (o !== s) { const d = dist(s, o); if (d <= 26) s.nb.push({ s: o, d }); } s.nb.sort((x, y) => x.d - y.d);
    }
    for (const s of S.settlements) for (const o of s.nb) if (o.s.p !== s.p && o.d <= 16) { const p = s.p; if (!(p.near[o.s.p.id] <= o.d)) p.near[o.s.p.id] = o.d; }
    for (const p of S.polities) p.contacts = Object.keys(p.near).length;
    assignJobs();
    for (const p of S.polities) { let fsw = 0, sp = 0, sol = 0, ad = 0; for (const s of p.sets) { fsw += s.fs * s.pop; sp += s.pop; sol += s.counts[4]; } p.fs = sp ? fsw / sp : 1; p.soldiers = sol; }
    produce();
    for (const p of S.polities) { let m = 0; for (const s of p.sets) m += s.milEff; p.milEff = m; }
    trade();
    lifecycle();
    migrate();
    expandPhase();
    diplomacy();
    warStep();
    politics();
    record();
  }

  // ===== Alat dewa, inspeksi, simpan/muat =====
  function findAgent(id) { for (const a of S.agents) if (a.id === id) return a; return null; }
  function findS(id) { for (const s of S.settlements) if (s.id === id) return s; return null; }
  function findP(id) { for (const p of S.polities) if (p.id === id) return p; return null; }
  function purgeDead() { S.agents = S.agents.filter(a => a.alive); }
  function addAgentsTo(s, n, base) { for (let k = 0; k < n; k++) { const a = newAgent(s, 15 + ((rng() * 25) | 0), rng() < 0.5 ? 0 : 1, base); S.agents.push(a); s.members.push(a); } }
  const god = {
    paint(op, cx, cy, r) {
      r = Math.max(0, r | 0); const region = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
        const d = Math.hypot(dx, dy); if (d > r + 0.3) continue; const i = y * W + x, f = 1 - d / (r + 1); region.push(i);
        switch (op) {
          case 'naik': world.h[i] = Math.min(1, world.h[i] + 0.22 * f + 0.02); break;
          case 'turun': world.h[i] = Math.max(-1, world.h[i] - 0.22 * f - 0.02); break;
          case 'daratan': if (world.h[i] <= 0) world.h[i] = 0.05; break;
          case 'laut': world.h[i] = -0.25; world.river[i] = 0; break;
          case 'gunung': world.h[i] = Math.max(world.h[i], 0.72 + 0.2 * f); break;
          case 'sungai': if (world.land[i]) world.river[i] = Math.max(world.river[i], 1); break;
          case 'hutan': if (world.land[i]) world.cover[i] = 1; break;
          case 'tebang': if (world.land[i]) world.cover[i] = 0.02; break;
        }
      }
      for (const i of region) if (!world.land[i] && world.h[i] > 0) {
        const x = i % W, y = (i / W) | 0; let sum = 0, c = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; const j = ty * W + tx; if (world.land[j]) { sum += world.rain[j]; c++; } }
        world.rain[i] = c ? sum / c : 0.5; world.cover[i] = 0;
      }
      world.finalize(); S.catchDirty = true;
      for (const s of S.settlements) if (!world.land[s.y * W + s.x]) for (const a of S.agents) if (a.s === s) kill(a, 'bencana');
      purgeDead();
    },
    spawn(x, y, n, o) {
      o = o || {}; const base = { iq: o.iq != null ? o.iq : 0.5, ag: o.ag != null ? o.ag : 0.4 };
      let near = null, nd = 4; for (const s of S.settlements) { const d = Math.hypot(s.x - x, s.y - y); if (d < nd) { nd = d; near = s; } }
      if (near && !o.newPolity) { addAgentsTo(near, n, base); ev('dewa', `Dewa menambahkan ${n} orang ke ${near.name}`); return near.p.id; }
      if (!world.land[y * W + x]) return 0;
      const P = spawnGroup({ x, y, n: Math.max(n, 8), iq: base.iq, ag: base.ag, leader: o.leader || 'auto' }); S.catchDirty = true; refreshCatch(); return P.id;
    },
    giveTech(pid, tid) { const P = findP(pid), t = T_BY[tid]; if (!P || !t) return false; const give = x => { for (const r of x.req) give(T_BY[r]); if (!P.techs.has(x.id)) unlock(P, x, 'anugerah dewa'); }; give(t); P.target = null; return true; },
    removeTech(pid, tid) {
      const P = findP(pid); if (!P || !T_BY[tid]) return false; const rm = new Set([tid]); let ch = true;
      while (ch) { ch = false; for (const t of T) if (!rm.has(t.id) && t.req.some(r => rm.has(r))) { rm.add(t.id); ch = true; } }
      for (const id of rm) P.techs.delete(id); applyTechs(P); for (const s of P.sets) s.fyVer = -1; P.target = null; ev('dewa', `Dewa mencabut pengetahuan ${T_BY[tid].nama} dari ${P.name}`); return true;
    },
    feed(sid, amt) { const s = findS(sid); if (!s) return false; s.food += amt; ev('dewa', `Dewa menurunkan pangan di ${s.name}`); return true; },
    famine(sid) { const s = findS(sid); if (!s) return false; s.food = 0; s.stock *= 0.15; ev('bencana', `Paceklik melanda ${s.name}`); return true; },
    plague(sid) { const s = findS(sid); if (!s) return false; s.forcePlague = 0.2; ev('wabah', `Wabah dikirim ke ${s.name}`); return true; },
    smite(sid, frac) { const s = findS(sid); if (!s) return false; let k = 0; for (const a of S.agents) if (a.s === s && a !== s.p.leader && rng() < frac) { kill(a, 'bencana'); k++; } purgeDead(); ev('bencana', `${k} penduduk ${s.name} tewas oleh murka dewa`); return true; },
    setTrait(aid, props) { const a = findAgent(aid); if (!a) return false; for (const k of ['iq', 'ag', 'o', 'c', 'e', 'a', 'n']) if (props[k] != null) a[k] = clamp(props[k], 0.02, 0.98); return true; },
    promote(aid) { const a = findAgent(aid); if (!a || a.age < 15) return false; setLeader(a.s.p, a, 'dipilih dewa'); return true; },
    killAgent(aid) { const a = findAgent(aid); if (!a) return false; kill(a, 'bencana'); purgeDead(); return true; },
    war(aid, bid) { const A = findP(aid), B = findP(bid); if (!A || !B || A === B || warBetween(A, B) || !A.leader) return false; declareWar(A, B); return true; },
    peace(aid, bid) { const A = findP(aid), B = findP(bid), w = A && B && warBetween(A, B); if (!w) return false; endWar(w, 'campur tangan dewa'); return true; },
    ally(aid, bid) { const A = findP(aid), B = findP(bid); if (!A || !B || A === B || warBetween(A, B)) return false; A.allies.add(B.id); B.allies.add(A.id); ev('diplomasi', `Dewa mempersatukan ${A.name} dan ${B.name} dalam aliansi`); return true; }
  };
  S.god = god; S.findAgent = findAgent; S.findS = findS; S.findP = findP;
  S.agentInfo = function (id) {
    const a = findAgent(id); if (!a) return null;
    return { id: a.id, umur: a.age, sex: a.sex, iq: a.iq, ag: a.ag, o: a.o, c: a.c, e: a.e, a: a.a, n: a.n, job: a.job, lapar: a.hunger, haus: a.thirst, puas: a.sat, sk: a.sk.slice(), kota: a.s.name, kotaId: a.s.id, bangsa: a.s.p.name, bangsaId: a.s.p.id, pemimpin: a.s.p.leader === a, pasangan: a.partner && a.partner.alive ? a.partner.id : 0 };
  };
  const SAVE_VERSION = 1;
  const r4 = v => Math.round(v * 10000) / 10000;
  S.serialize = function () {
    return {
      v: SAVE_VERSION, year: S.year, seed: sc.seed || 1, ids: { aid: S.aid, sid: S.sid, pid: S.pid, fid: S.fid }, rng: rng.get(), climate: S.climate, cap: S.cap, maxEra: S.maxEra, eraYear: S.eraYear, truce: S.truce, cause: S.cause, hist: S.hist, histStep: S.histStep, log: S.log, pcount: S.pcount, wlog: S.wlog,
      world: { h: toB64(world.h), rain: toB64(world.rain), river: toB64(world.river), soil: toB64(world.soil), tn: toB64(world.tn), cover: toB64(world.cover) },
      polities: S.polities.map(p => ({ id: p.id, name: p.name, col: p.col, cap: p.cap ? p.cap.id : 0, leader: p.leader ? p.leader.id : 0, techs: [...p.techs], know: p.know, target: p.target ? p.target.id : null, grv: p.grv, allies: [...p.allies], born: p.born, stab: p.stab })),
      settlements: S.settlements.map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y, pid: s.p.id, food: s.food, tools: s.tools, stock: s.stock, fs: s.fs, sat: s.sat, resent: s.resent, lastColony: s.lastColony, founded: s.founded })),
      agents: S.agents.map(a => [a.id, a.age, a.sex, r4(a.iq), r4(a.ag), r4(a.o), r4(a.c), r4(a.e), r4(a.a), r4(a.n), a.job, r4(a.hunger), r4(a.thirst), a.fam, a.momId, a.dadId, r4(a.sat), a.s.id, a.partner && a.partner.alive ? a.partner.id : 0, r4(a.jx), r4(a.jy), r4(a.sk[0]), r4(a.sk[1]), r4(a.sk[2]), r4(a.sk[3]), r4(a.sk[4]), r4(a.sk[5])]),
      wars: S.wars.map(w => ({ a: w.a.id, b: w.b.id, start: w.start, exh: w.exh, ha: w.ha.map(p => p.id), hb: w.hb.map(p => p.id) }))
    };
  };
  function loadState(st) {
    if (st.v !== SAVE_VERSION) throw new Error('Versi simpanan ' + st.v + ' tidak didukung (perlu ' + SAVE_VERSION + ')');
    S.year = st.year; S.aid = st.ids.aid; S.sid = st.ids.sid; S.pid = st.ids.pid; S.fid = st.ids.fid; rng.set(st.rng); S.climate = st.climate; S.cap = st.cap; S.maxEra = st.maxEra; S.eraYear = st.eraYear; S.truce = st.truce || {};
    S.cause = Object.assign({ lapar: 0, haus: 0, perang: 0, wabah: 0, usia: 0, bencana: 0 }, st.cause); S.hist = st.hist; S.histStep = st.histStep; S.log = st.log; S.logN = st.log.reduce((m, l) => Math.max(m, l.n || 0), 0); S.pcount = st.pcount; S.wlog = st.wlog || 0;
    const pm = new Map(), sm = new Map(), am = new Map();
    for (const o of st.polities) { const p = addPolity(null, { id: o.id, name: o.name, col: o.col }); p.techs = new Set(o.techs); applyTechs(p); p.know = o.know; p.born = o.born; p.stab = o.stab; p.grv = o.grv || {}; p.allies = new Set(o.allies); p._cap = o.cap; p._leader = o.leader; p._target = o.target; pm.set(o.id, p); }
    for (const o of st.settlements) { const s = addSettlement(o.x, o.y, pm.get(o.pid), o.name, { id: o.id }); s.food = o.food; s.tools = o.tools; s.stock = o.stock; s.fs = o.fs; s.sat = o.sat; s.resent = o.resent; s.lastColony = o.lastColony; s.founded = o.founded; s.fresh = false; sm.set(o.id, s); }
    const pend = [];
    for (const r of st.agents) {
      const a = { id: r[0], age: r[1], sex: r[2], iq: r[3], ag: r[4], o: r[5], c: r[6], e: r[7], a: r[8], n: r[9], job: r[10], hunger: r[11], thirst: r[12], fam: r[13], momId: r[14], dadId: r[15], sat: r[16], s: sm.get(r[17]), partner: null, jx: r[19], jy: r[20], sk: [r[21], r[22], r[23], r[24], r[25], r[26]], alive: true, mv: 0 };
      am.set(a.id, a); pend.push([a, r[18]]); S.agents.push(a); a.s.members.push(a);
    }
    for (const [a, pid] of pend) if (pid) a.partner = am.get(pid) || null;
    for (const p of S.polities) { p.cap = sm.get(p._cap) || null; p.leader = am.get(p._leader) || null; p.target = p._target ? T_BY[p._target] : null; p.sets = S.settlements.filter(s => s.p === p); derivePolicy(p); }
    for (const w of st.wars) S.wars.push({ a: pm.get(w.a), b: pm.get(w.b), start: w.start, exh: w.exh, ha: w.ha.map(i => pm.get(i)).filter(Boolean), hb: w.hb.map(i => pm.get(i)).filter(Boolean) });
    S.catchDirty = true; refreshCatch();
  }

  S.step = step;
  if (sc.state) loadState(sc.state); else { for (const g of (sc.groups || [])) spawnGroup(g); refreshCatch(); record(); }
  S.inspect = function (s) {
    const P = s.p, L = P.leader, n = s.members.length; let iq = 0, hu = 0; for (const a of s.members) { iq += a.iq; hu += a.hunger; }
    return { nama: s.name, bangsa: P.name, era: ERA_NAME[P.era], pop: n, iq: n ? iq / n : 0, lapar: n ? hu / n : 0, pangan: s.fs, kapAir: s.drinkCap, haus: s.thirst, alat: s.tools, kerja: s.counts.slice(), pemimpin: L ? { iq: L.iq, ag: L.ag, a: L.a, o: L.o, c: L.c, e: L.e, n: L.n, umur: L.age } : null, stab: P.stab, kepuasan: s.sat, lahir: s.founded };
  };
  S.softCap = softCap;
  return S;
}

root.WorldSim = { createSim, genWorld, pickSpot, toB64, fromB64, BIOME_NAME, ERA_NAME, JOB_NAME, TECHS: T, PCOL, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
