/* Slider3 numerical controls: node tests.cjs */
'use strict';
const assert=require('node:assert/strict'),S=require('./core.js');
function close(a,b,t=1e-8){assert.ok(Math.abs(a-b)<t,String(a)+' != '+String(b));}
assert.deepEqual(S.cases,['single','locked','scrambled2','scrambled']);
assert.ok(S.DISK.length>=35&&S.DISK.length<70);
for(const c of S.cases){
  const modes=S.getModes(c,20261027,0);
  assert.equal(modes.length,c==='single'?1:(c==='locked'||c==='scrambled2')?2:6);
  close(modes.reduce((a,m)=>a+m.amp*m.amp,0),1);
  close(S.meanSquare(modes,.37),.5,1e-9);
  for(const m of modes)assert.ok(m.k>0&&Number.isFinite(m.phase));
}
const first=S.synthesise('single',34,0,1);
close(first.power,.5,1e-7);
let diagError=0;
for(let i=0;i<first.mu.length;i++)diagError=Math.max(diagError,Math.abs(first.mu[i]-first.incoherent[i]));
close(diagError,0,1e-5);
const locked=S.synthesise('locked',34,0,1);
let phaseEvidence=0;
for(let i=0;i<locked.mu.length;i++)phaseEvidence=Math.max(phaseEvidence,Math.abs(locked.mu[i]-locked.incoherent[i]));
assert.ok(phaseEvidence>.1,'coherent multipath cross terms were erased');
const matched=S.synthesise('scrambled2',34,0,1);
close(matched.power,.5,1e-7);
assert.deepEqual(matched.modes.map(x=>[x.kx,x.ky,x.amp]),locked.modes.map(x=>[x.kx,x.ky,x.amp]));
assert.notDeepEqual(matched.mu,locked.mu);
const scrambled=S.synthesise('scrambled',34,0,1);
const scrambledAgain=S.synthesise('scrambled',34,0,1);
assert.deepEqual(scrambled.mu,scrambledAgain.mu,'same seed must be deterministic');
const scrambledNext=S.synthesise('scrambled',34,1,1);
assert.notDeepEqual(scrambled.mu,scrambledNext.mu,'phase scrambling must change the source');
console.log('Energy-matched orthogonal plane waves, phase cross terms and deterministic randomness PASS');
for(const c of S.cases){
  const r=S.runOne(c,34,0,1,100);
  assert.ok(r.focusMean>0,'nonzero potential-coupled energy');
  assert.ok(Number.isFinite(r.focusContrast));
  assert.ok(r.focus.every(v=>v>=0&&Number.isFinite(v)));
  assert.equal(r.potentialNegative,0,'positive disk Green response required');
  assert.ok(r.residual<.035,'unacceptably large discrete Poisson residual '+c+': '+r.residual);
  for(let q=0;q<S.WS;q++)if(!S.DISKFLAG[q]){
    for(let i=0;i<S.SZ;i++)close(r.potential[q*S.SZ+i],0,1e-14);
  }
  console.log('DISK',c,'focus contrast='+r.focusContrast.toFixed(3),
    'PDE residual='+r.residual.toExponential(2),'physical power='+r.power.toFixed(9));
}
const paired0=S.runOne('scrambled2',34,0,1,100),paired1=S.runOne('scrambled2',34,1,1,100);
const locked0=S.runOne('locked',34,0,1,100),locked1=S.runOne('locked',34,1,1,100);
const random0=S.runOne('scrambled',34,0,1,100),random1=S.runOne('scrambled',34,1,1,100);
const persistent=S.normalisedCorrelation(locked0.focus,locked1.focus);
const moving=S.normalisedCorrelation(random0.focus,random1.focus);
assert.ok(persistent>.9999,'phase-locked interference pattern must persist');
const pairedPersistence=S.normalisedCorrelation(paired0.focus,paired1.focus);
assert.ok(pairedPersistence<persistent-.01,'matched-direction scrambled pair should shift its pattern '+pairedPersistence);
assert.equal(S.normalisedCorrelation(new Float32Array(16).fill(1),new Float32Array(16).fill(1)),1,'identical uniform field has stable repeat map');
close(locked0.focusContrast,paired0.focusContrast,5e-4);
assert.ok(moving<persistent-.01,'random phases must perturb pattern '+moving);
console.log('Frame repeat: locked='+persistent.toFixed(6)+', matched-scrambled='+pairedPersistence.toFixed(6)+
  ', scrambled persistence='+moving.toFixed(6)+' PASS');
const t=S.trace('locked',34,1,400);
assert.equal(t.length,400);
assert.ok(t.every(Number.isFinite));
console.log('All Slider3 numerical guardrails PASS');
