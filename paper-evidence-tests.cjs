'use strict';
const assert=require('node:assert/strict');
require('./paper-current.js');require('./paper-planar.js');
const E=require('./paper-evidence.js');
const P=require('./paper-planar.js');
const s=P.solve(2200),a=E.comparisons(.75,s);
assert.ok(a.measurements.spectrum.distance<1e-14,'spectrum is phase-blind up to floating-point roundoff');
for(const name of ['delay','coherentIntensity','lifted','planar']){
 assert.ok(a.measurements[name].distance>1e-4,name+' failed phase response');
}
const equal=E.comparisons(0,s);
for(const [name,obj] of Object.entries(equal.measurements))assert.ok(obj.distance<1e-12,'same phase must equal '+name);
const output=E.receipt(s,20261027,64);
assert.equal(output.scores.spectrum.detectedPhaseDifference,0);
for(const name of ['delay','coherentIntensity','lifted','planar'])
 assert.equal(output.scores[name].detectedPhaseDifference,64,name+' unexpected false negative');
console.log('PAPER-EXACT vs BASELINES: '+JSON.stringify(output));
console.log('CONTROLLED FINDING: power spectrum misses pure phase; ordinary 3-delay sensor and coherent intensity detect it too. NO UNIQUE PAPER-OPERATOR ADVANTAGE demonstrated.');
