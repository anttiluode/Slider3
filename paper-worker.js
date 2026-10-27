/* Browser worker; heavy frozen-fiber disk solves stay off the UI. */
importScripts('./paper-current.js','./paper-planar.js','./paper-evidence.js');
const E=self.Slider3PaperEvidence,P=self.Slider3PaperPlanar;
let sol=null,benchmark=null;
self.onmessage=m=>{
 const d=m.data;
 try{
  if(!sol){
    self.postMessage({type:'status',message:'Solving Appendix D directional Fourier disk equations…'});
    sol=P.solve(2200);
    self.postMessage({type:'status',message:'Verifying the 64-trial phase-control comparison…'});
    benchmark=E.receipt(sol,20261027,64);
  }
  if(d.type==='compare'){
    const phase=Number(d.phase);
    if(!Number.isFinite(phase))throw Error('invalid relative phase');
    const result=E.comparisons(phase,sol);
    self.postMessage({type:'ready',result,benchmark,
      source:'OpenAI 2026 current.tex + planar.tex, finite-mode and Q=0 slice only'});
  }
 }catch(error){self.postMessage({type:'error',message:String(error.stack||error)});}
};
