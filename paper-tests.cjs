/* Reproducible paper-grounded tests. node paper-tests.cjs
   Checks the actual conserved Friedrichs tensor, not just a PSD proxy.
 */
'use strict';
const assert=require('node:assert/strict');
const C=require('./paper-current.js'),P=require('./paper-planar.js');
const approx=(a,b,eps,msg='')=>assert.ok(Math.abs(a-b)<=eps,msg+': '+a+' vs '+b);
const point=[.27,.64,-.18,.21,.11,-.08,.16];
const phases=[0,.4,1.9];
let maxDiv=0,maxNorm=0;
for(const phase of phases){
  const src=C.modes(phase),tensor=C.tensor(point,src);
  assert.equal(tensor.length,49);
  for(let a=0;a<7;a++)for(let b=0;b<7;b++)
    approx(tensor[a*7+b],tensor[b*7+a],1e-12,'symmetry');
  for(let trial=0;trial<20;trial++){
    const v=Array.from({length:7},(_,i)=>Math.sin(trial*1.7+i*.87));
    const q=C.quadratic(tensor,v);
    assert.ok(q>=-1e-11,'PSD violated '+q);
    maxNorm=Math.max(maxNorm,Math.abs(q));
  }
  const d1=C.divergence(point,src,2e-3),d2=C.divergence(point,src,1e-3);
  for(let j=0;j<7;j++){
    maxDiv=Math.max(maxDiv,Math.abs(d2[j]));
    assert.ok(Math.abs(d2[j])<2e-4,'conservation residual too large on column '+j+' '+d2[j]);
    assert.ok(Math.abs(d2[j])<Math.max(2e-7,Math.abs(d1[j])*.37),
      'nonconvergent finite-difference conservation check '+j+' '+d1[j]+' → '+d2[j]);
  }
}
console.log('EXACT lifted 7D Friedrichs source tensor: symmetric / PSD / ∑∂I B^{IJ}=0 PASS; max FD divergence='+maxDiv.toExponential(3));
const p0=C.map(0),p1=C.map(.7);
assert.deepEqual(p0.spectrum,p1.spectrum,'source mode powers must match');
let currentDifference=0,rawDifference=0;
for(let i=0;i<p0.lifted.length;i++){
  currentDifference=Math.max(currentDifference,Math.abs(p0.lifted[i]-p1.lifted[i]));
  rawDifference=Math.max(rawDifference,Math.abs(p0.ordinary[i]-p1.ordinary[i]));
}
assert.ok(currentDifference>.05,'lifted density lost phase interference');
assert.ok(rawDifference>.05,'ordinary coherent intensity should also retain phase interference');
console.log('Equal Fourier power does NOT imply equal lifted-current or ordinary coherent-intensity maps PASS');

const setup=P.setup();
assert.equal(P.IX.length>100,true);
for(const q of P.IX){
  assert.ok(setup.potential[q]>=0&&setup.j2[q]>0);
  approx(setup.rhs0[q],setup.m0[q]/(4*setup.j2[q]),1e-12);
  approx(setup.rhsc[q],setup.mc[q]/(4*setup.j2[q]),1e-12);
}
const solution=P.solve(2200);
assert.ok(solution.boundMax===0,'Dirichlet boundary must be exactly zero');
assert.ok(solution.lowest>=0,'maximum principle for positive source violated '+solution.lowest);
assert.ok(solution.res0<.01,'constant mode residual '+solution.res0);
assert.ok(solution.resc<.01,'directional mode residual '+solution.resc);
const shape0=P.maps(0,solution),shape1=P.maps(.9,solution);
assert.deepEqual(shape0.spectrum,shape1.spectrum);
let distorted=0,plainDistorted=0;
for(let i=0;i<P.NR;i++){
  assert.ok(shape0.energy[i]>=0 && Number.isFinite(shape0.energy[i]));
  distorted=Math.max(distorted,Math.abs(shape0.energy[i]-shape1.energy[i]));
  plainDistorted=Math.max(plainDistorted,Math.abs(shape0.rawPower[i]-shape1.rawPower[i]));
}
assert.ok(distorted>1e-10,'true directional planar potential should preserve phase dependence');
assert.ok(plainDistorted>1e-6,'ordinary intensity also measures interference');
assert.ok(P.reaction(P.geometry(.05,.02),-40,1)>0);
assert.notEqual(P.reaction(P.geometry(.05,.02),-40,1),
  P.reaction(P.geometry(-.05,.02),-40,1),'direction-dependent coefficient must be W-dependent');
console.log('APPENDIX D frozen-fiber Fourier source, e(W), J(W), directional |k·e|², zero Dirichlet, residual checks PASS; max residual='+Math.max(solution.res0,solution.resc).toExponential(3));
console.log('Important null result: ordinary phase-aware intensity is ALSO sensitive to changed relative phase.');
console.log('ALL PAPER-GROUNDED TESTS PASS');
