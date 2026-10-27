/* Honest comparator: what information is present in ordinary phase-aware
 * measurements vs the manuscript's exact current and frozen-fiber disk energy?
 * Both paper operators are computed from KNOWN Fourier mode coefficients,
 * so they have strictly greater observation access than a 3-delay sensor.
 * Do not use this diagnostic to assert equal-cost predictive superiority.
 */
(function(root){
'use strict';
const C=root.Slider3PaperCurrent,P=root.Slider3PaperPlanar;
if(!C||!P)throw Error('Load paper-current.js and paper-planar.js first');
function normDifference(a,b){
  if(a.length!==b.length)throw Error('unequal measurement sizes');
  let loss=0,scale=0;
  for(let i=0;i<a.length;i++){
    const d=a[i]-b[i];loss+=d*d;scale+=a[i]*a[i]+b[i]*b[i];
  }
  return Math.sqrt(2*loss/Math.max(1e-30,scale));
}
function delay(phase,times=[0,.18,.36]){
  const modes=C.modes(phase),x=.36,s=.08;
  return times.map(t=>{
    let signal=0;
    for(const m of modes){
      const a=m.kappa*(s+m.v*x-.5*m.v*m.v*t);
      signal+=m.re*Math.cos(a)-m.im*Math.sin(a);
    }
    return signal;
  });
}
function comparisons(phase=1.2,sol=P.solve()){
  const r0=C.map(0),r1=C.map(phase);
  const p0=P.maps(0,sol),p1=P.maps(phase,sol);
  const first=delay(0),second=delay(phase);
  return {
    phase,measurements:{
      spectrum:{samples:2,distance:normDifference(r0.spectrum,r1.spectrum),kind:'Fourier magnitude squared'},
      delay:{samples:3,distance:normDifference(first,second),kind:'3 measured scalar delays'},
      coherentIntensity:{samples:r0.ordinary.length,distance:normDifference(r0.ordinary,r1.ordinary),kind:'full coherent wave field'},
      lifted:{samples:r0.lifted.length,distance:normDifference(r0.lifted,r1.lifted),kind:'full modes and auxiliary state'},
      planar:{samples:p0.energy.length,distance:normDifference(p0.energy,p1.energy),kind:'full modes and solved W disk'}
    },
    current:{baseline:r0.lifted,shifted:r1.lifted,powerSpectrum:r0.spectrum},
    ordinary:{baseline:r0.ordinary,shifted:r1.ordinary},
    planar:{baseline:p0.energy,shifted:p1.energy,coherent:p0.coherent,
      solver:p0.checks},
    delay:{baseline:first,shifted:second},
    caveat:'All five are computed without measurement noise. The lifted current and disk have FULL known-mode access; the 3-lag sensor does not. This is an information-presence comparison, not an equal-budget performance comparison.'
  };
}
let SEED=20261027;
function rand(){SEED^=SEED<<13;SEED^=SEED>>>17;SEED^=SEED<<5;return(SEED>>>0)/4294967296;}
function receipt(sol=P.solve(),seed=20261027,trials=64){
  SEED=seed>>>0;
  const mechanisms=['spectrum','delay','coherentIntensity','lifted','planar'];
  const result={trials,seed,steps:'two observations with relative phase unchanged (locked) or independently resampled (scrambled)',
    scores:{},accessCaveat:'Not equal cost; full known-mode access for both mathematical constructions'};
  const sums=Object.fromEntries(mechanisms.map(k=>[k,0]));
  const positive=Object.fromEntries(mechanisms.map(k=>[k,0]));
  for(let n=0;n<trials;n++){
    const phase=.05+(2*Math.PI-.1)*rand();
    const sample=comparisons(phase,sol).measurements;
    for(const name of mechanisms){
      sums[name]+=sample[name].distance;
      if(sample[name].distance>1e-8)positive[name]++;
    }
  }
  for(const k of mechanisms)result.scores[k]={
    detectedPhaseDifference:positive[k],total:trials,
    meanRelativeChange:sums[k]/trials};
  return result;
}
const API={normDifference,delay,comparisons,receipt};
root.Slider3PaperEvidence=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:self);
