/* Paper-grounded live visualization; all coefficients come from worker. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const worker=new Worker('./paper-worker.js');
let working=false,queued=false,last=null;
const entries=[
  ['spectrum','Fourier power spectrum'],
  ['delay','Three-delay sensor'],
  ['coherentIntensity','Ordinary coherent intensity'],
  ['lifted','Conserved lifted current'],
  ['planar','Appendix D disk potential']
];
function chart(id,a,b){
  const canvas=$(id),ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#091827';ctx.fillRect(0,0,W,H);
  let min=Infinity,max=-Infinity;
  for(const v of [...a,...b]){min=Math.min(min,v);max=Math.max(max,v);}
  if(!Number.isFinite(min)){return;}
  const span=Math.max(1e-15,max-min),pad=span*.14;
  min-=pad;max+=pad;
  const l=56,r=W-12,t=15,bottom=H-33;
  for(let n=0;n<=4;n++){
    const y=t+(bottom-t)*n/4;
    ctx.strokeStyle='#30465a';ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();
  }
  const draw=(arr,color)=>{
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<arr.length;i++){
      const x=l+(r-l)*(arr.length===1?0:i/(arr.length-1));
      const y=bottom-(arr[i]-min)/(max-min)*(bottom-t);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }ctx.stroke();
    if(arr.length<10){
      ctx.fillStyle=color;
      for(let i=0;i<arr.length;i++){
        const x=l+(r-l)*(arr.length===1?0:i/(arr.length-1));
        const y=bottom-(arr[i]-min)/(max-min)*(bottom-t);
        ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
      }
    }
  };
  draw(a,'#7cdbc9');draw(b,'#f3bd85');
  ctx.fillStyle='#a8c4d1';ctx.font='12px system-ui';ctx.fillText(max.toExponential(2),5,23);
  ctx.fillText(min.toExponential(2),5,H-35);
  ctx.fillText('Sample / spatial position (fixed auxiliary slice)',l+8,H-10);
}
function show(message){
 last=message;
 const {result:r,benchmark:bench}=message;
 chart('currentPlot',r.current.baseline,r.current.shifted);
 chart('planarPlot',r.planar.baseline,r.planar.shifted);
 chart('ordinaryPlot',r.ordinary.baseline,r.ordinary.shifted);
 chart('delayPlot',r.delay.baseline,r.delay.shifted);
 const rows=$('results');rows.replaceChildren();
 for(const [name,label] of entries){
   const m=r.measurements[name],q=bench.scores[name];
   const tr=document.createElement('tr');
   const cells=[label,m.distance.toExponential(3),q.detectedPhaseDifference+' / '+q.total,
     m.kind+(name==='delay'?' (3 samples)':'')];
   for(const value of cells){
     const td=document.createElement('td');td.textContent=value;tr.append(td);
   }rows.append(tr);
 }
 $('finding').textContent='In the 64-trial noiseless control, identical Fourier magnitudes detect 0 / 64 relative-phase changes; '+
   'the conserved wave-current, Appendix D potential, ordinary coherent intensity and a three-delay sample can also respond. '+
   'The source modes are directly known to the paper operators, so this does not demonstrate superior sensor efficiency or novel information.';
 const c=r.planar.solver;
 $('status').textContent='Complete. Fixed-fiber disk residuals: zero Fourier mode '+c.residualZero.toExponential(2)+
  ', directional Fourier mode '+c.residualCross.toExponential(2)+'. Relative phase '+r.phase.toFixed(2)+
  ' rad. Current PSD and divergence identities verified separately in Node CI.';
}
function run(){
 if(working){queued=true;return;}
 working=true;$('run').disabled=true;
 $('status').textContent='Solving directional auxiliary disk and comparing phase-aware measurements…';
 worker.postMessage({type:'compare',phase:Number($('phase').value)});
}
worker.onmessage=e=>{
 const m=e.data;
 if(m.type==='status'){$('status').textContent=m.message;return;}
 if(m.type==='ready'){
   working=false;$('run').disabled=false;show(m);
   if(queued){queued=false;run();}
 }else if(m.type==='error'){
   working=false;$('run').disabled=false;$('status').textContent='Error: '+m.message;
 }
};
worker.onerror=e=>{working=false;$('run').disabled=false;$('status').textContent='Worker error: '+e.message;};
$('phase').addEventListener('input',()=>{
 $('phaseVal').textContent=Number($('phase').value).toFixed(2);
});
$('phase').addEventListener('change',run);
$('run').addEventListener('click',run);
run();
})();
