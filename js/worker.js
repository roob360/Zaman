/* Worker: menjalankan simulasi di thread terpisah agar tampilan tetap lancar. */
importScripts('sim.js');
const { createSim, genWorld, pickSpot, TECHS, ERA_NAME } = self.WorldSim;
let S = null, running = false, yps = 25, acc = 0, last = 0, waiting = false, timer = null;
let sel = null, lastHist = -1, lastLogN = 0, seed = 1, cap = 2000;

function worldMsg() {
  const w = S.world;
  const m = { type: 'world', h: w.h.slice(), biome: w.biome.slice(), river: w.river.slice(), cover: w.cover.slice(), temp: w.temp.slice(), rain: w.rain.slice(), fert: w.fert.slice(), land: w.land.slice() };
  postMessage(m, [m.h.buffer, m.biome.buffer, m.river.buffer, m.cover.buffer, m.temp.buffer, m.rain.buffer, m.fert.buffer, m.land.buffer]);
}
function polInfo(p) {
  const L = p.leader, enemies = [];
  for (const w of S.wars) { if (w.a === p) enemies.push(w.b.id); else if (w.b === p) enemies.push(w.a.id); }
  return {
    id: p.id, name: p.name, col: p.col, pop: p.pop, era: p.era, sets: p.sets.length, fs: +p.fs.toFixed(2), stab: +p.stab.toFixed(2), soldiers: p.soldiers, know: Math.round(p.know),
    target: p.target ? p.target.nama : '', techs: [...p.techs], enemies, allies: [...p.allies],
    leader: L ? { id: L.id, iq: L.iq, ag: L.ag, a: L.a, o: L.o, c: L.c, e: L.e, n: L.n, age: L.age } : null
  };
}
function snap() {
  const n = S.agents.length, x = new Float32Array(n), y = new Float32Array(n), id = new Int32Array(n), pid = new Int16Array(n), job = new Int8Array(n), iq = new Uint8Array(n), ag = new Uint8Array(n), hu = new Uint8Array(n), age = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const a = S.agents[i]; x[i] = a.s.x + a.jx * 1.5; y[i] = a.s.y + a.jy * 1.5; id[i] = a.id; pid[i] = a.s.p.id;
    job[i] = a.age < 15 ? -1 : a.job; iq[i] = a.iq * 255; ag[i] = a.ag * 255; hu[i] = a.hunger * 255; age[i] = Math.min(255, a.age);
  }
  const m = {
    type: 'snap', year: S.year, season: S.season, tick: S.tick, pop: n, running,
    ag: { x, y, id, pid, job, iq, ag, hu, age },
    sets: S.settlements.map(s => ({ id: s.id, x: s.x, y: s.y, pid: s.p.id, pop: s.members.length || s.pop, name: s.name, cap: s.p.cap === s, fs: +s.fs.toFixed(2), sat: +s.sat.toFixed(2) })),
    pols: S.polities.map(polInfo),
    wars: S.wars.map(w => ({ a: w.a.id, b: w.b.id, start: w.start })),
    owner: S.owner.slice(),
    stats: { births: S.births, deaths: S.deaths, cause: S.cause, maxEra: S.maxEra, eraYear: S.eraYear, climate: S.climate }
  };
  if (S.hist.length !== lastHist) { m.hist = S.hist; lastHist = S.hist.length; }
  const nl = S.log.filter(l => l.n > lastLogN); if (nl.length) { m.log = nl; lastLogN = nl[nl.length - 1].n; }
  if (sel) {
    if (sel.type === 'agent') m.selInfo = S.agentInfo(sel.id);
    else if (sel.type === 'settlement') { const s = S.findS(sel.id); if (s) m.selInfo = S.inspect(s); }
  }
  const tr = [x.buffer, y.buffer, id.buffer, pid.buffer, job.buffer, iq.buffer, ag.buffer, hu.buffer, age.buffer, m.owner.buffer];
  postMessage(m, tr); waiting = true;
}
function schedule() { if (timer == null) timer = setTimeout(loop, 16); }
function loop() {
  timer = null; if (!running || !S) return;
  if (waiting) { schedule(); return; }
  const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now; acc += dt * yps;
  let n = Math.floor(acc); acc -= n; const t0 = performance.now();
  while (n-- > 0) { S.step(); if (performance.now() - t0 > 40) break; }
  snap(); schedule();
}
function fresh(world, groups) {
  lastHist = -1; lastLogN = 0; sel = null;
  S = createSim({ seed, world, groups: groups || [], cap });
}
self.onmessage = function (e) {
  const m = e.data;
  try {
    switch (m.t) {
      case 'preview': {
        seed = m.seed >>> 0 || 1; running = false; cap = m.cap || cap;
        const w = genWorld(seed), coords = [];
        for (const k of (m.spots || [])) coords.push(pickSpot(w, k, coords.slice()));
        fresh(w, []);
        postMessage({ type: 'ready', techs: TECHS, eraNames: ERA_NAME, coords });
        worldMsg(); snap(); break;
      }
      case 'spots': { const coords = []; for (const k of (m.spots || [])) coords.push(pickSpot(S.world, k, coords.slice())); postMessage({ type: 'spots', coords }); break; }
      case 'start': {
        cap = m.cap || cap; running = false; acc = 0; fresh(S.world, m.groups);
        postMessage({ type: 'started' }); worldMsg(); waiting = false; snap(); break;
      }
      case 'run': running = !!m.on; if (m.yps) yps = m.yps; last = performance.now(); if (running) schedule(); if (!running) { waiting = false; snap(); } break;
      case 'step': { const n = Math.min(500, m.n || 1); for (let i = 0; i < n; i++) S.step(); waiting = false; snap(); break; }
      case 'ack': waiting = false; break;
      case 'select': sel = m.sel; waiting = false; snap(); break;
      case 'god': {
        const fn = S.god[m.fn]; const ok = fn ? fn.apply(S.god, m.args || []) : false;
        if (m.fn === 'paint') worldMsg();
        waiting = false; snap(); postMessage({ type: 'godres', fn: m.fn, ok }); break;
      }
      case 'setcap': cap = m.n; S.cap = m.n; break;
      case 'save': postMessage({ type: 'saved', reqId: m.reqId, state: S.serialize() }); break;
      case 'load': {
        running = false; S = createSim({ state: m.state }); lastHist = -1; lastLogN = 0; sel = null; cap = S.cap; seed = m.state.seed || seed;
        postMessage({ type: 'loaded' }); worldMsg(); waiting = false; snap(); break;
      }
    }
  } catch (err) { postMessage({ type: 'error', message: String(err && err.stack || err) }); }
};
