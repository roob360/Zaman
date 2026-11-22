// Pemakaian: node tools/test_long.js <seed> <tahun>
require('../js/sim.js');
const { createSim, genWorld, pickSpot, ERA_NAME } = globalThis.WorldSim;
const seed = +process.argv[2] || 5, years = +process.argv[3] || 3000;
const w = genWorld(seed), p = pickSpot(w, 'sungai', []);
const S = createSim({ seed, world: w, groups: [{ x: p.x, y: p.y, n: 40, iq: 0.5, ag: 0.4, leader: 'auto' }] });
const t0 = Date.now(); let bad = 0;
for (let i = 0; i < years; i++) { S.step(); if (S.agents.some(a => !isFinite(a.iq) || !isFinite(a.hunger))) { bad++; break; } if (!S.agents.length) break; }
console.log(JSON.stringify({ seed, year: S.year, pop: S.agents.length, polities: S.polities.length, settlements: S.settlements.length, era: ERA_NAME[S.maxEra], nan: bad, ms: Date.now() - t0 }));
process.exit(bad || !S.agents.length ? 1 : 0);
