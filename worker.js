/* Keep all PDE computations off the browser main thread. */
importScripts('./core.js');
const S=self.Slider3Core;
self.onmessage=e=>{
  const m=e.data;
  if(m.kind!=='run')return;
  try{
    self.postMessage({kind:'progress',message:'Constructing coherent lift; solving six 4D disk potential fields…'});
    const seed=(Number(m.seed)||20261027)>>>0,
      frame=Math.max(0,Math.round(Number(m.frame)||0)),
      jitter=Math.max(0,Math.min(1,Number(m.jitter)));
    const result=S.compare(seed,frame,jitter);
    const payload={kind:'ready',seed,frame,jitter,results:{}};
    for(const name of S.cases){
      const x=result[name];
      let cross=0,base=0,energy=0,plainPeak=0,plainMean=0,hotspot=0;
      for(let i=0;i<x.mu.length;i++){cross+=Math.abs(x.mu[i]-x.incoherent[i]);base+=x.incoherent[i];}
      for(let i=0;i<S.SZ;i++){
        plainPeak=Math.max(plainPeak,x.plain[i]);plainMean+=x.plain[i];
        energy+=x.wave[i]*x.wave[i];if(x.focus[i]>x.focus[hotspot])hotspot=i;
      }
      payload.results[name]={
        modeCount:x.modes.length,power:x.power,meanMu:x.meanMu,
        meanDiagonal:x.meanDiagonal,focusMean:x.focusMean,
        focusContrast:x.focusContrast,patternPersistence:x.patternPersistence,
        crossTermFraction:cross/Math.max(1e-15,base),
        residual:x.residual,peakRawContrast:plainPeak/Math.max(1e-15,plainMean/S.SZ),
        hotspot:[hotspot%S.N,Math.floor(hotspot/S.N)],
        wave:Array.from(x.wave),focus:Array.from(x.focus),plain:Array.from(x.plain),
        trace:Array.from(x.trace)
      };
    }
    self.postMessage(payload);
  }catch(err){self.postMessage({kind:'error',message:String(err.stack||err)});}
};
