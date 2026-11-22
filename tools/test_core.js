require('../js/sim.js');
const {createSim,genWorld,pickSpot}=globalThis.WorldSim;
const sd=11;const w=genWorld(sd);const r=pickSpot(w,'sungai');
const S=createSim({seed:sd,groups:[{x:r.x,y:r.y,n:80,iq:0.5,ag:0.4}]});
for(let y=0;y<1500;y++)S.stepYear();
console.log('A year',S.year,'pop',S.agents.length,'sets',S.settlements.length,'pol',S.polities.length,'era',S.maxEra);
const t0=Date.now();const json=JSON.stringify(S.serialize());console.log('save size KB',(json.length/1024).toFixed(0),'ms',Date.now()-t0);
const L=createSim({state:JSON.parse(json)});
console.log('L year',L.year,'pop',L.agents.length,'sets',L.settlements.length,'pol',L.polities.length,'era',L.maxEra);
for(let y=0;y<300;y++){S.stepYear();L.stepYear();}
console.log('after+300 A pop',S.agents.length,'L pop',L.agents.length,'A era',S.maxEra,'L era',L.maxEra,'A pol',S.polities.length,'L pol',L.polities.length);
// god tools
const G=L.god;const s0=L.settlements[0];
console.log('spawn',G.spawn(s0.x+1,s0.y,10,{iq:0.9}),'pop',L.agents.length);
const pid=L.polities[0].id;console.log('tech',G.giveTech(pid,'komputer'),'era',L.polities[0].era);
G.paint('laut',s0.x,s0.y,3);console.log('after sinking settlement pop',L.agents.length,'sets',L.settlements.length,JSON.stringify(L.cause));
L.stepYear();console.log('step ok',L.agents.length,L.settlements.length);
const a=L.agents[0];console.log(JSON.stringify(L.agentInfo(a.id)));
