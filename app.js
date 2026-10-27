/* Slider3 browser lab. Runs all heavy computations in worker.js. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const worker=new Worker('./worker.js');
let data=null,working=false,updateQueued=false,serial=0;
const names=['single','locked','scrambled2','scrambled'],labels={single:'Single tone',locked:'Locked crossing',scrambled2:'Scrambled pair',scrambled:'Six-wave mixture'};
function clearCanvas(canvas,text){
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0b1527';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#8ba7c1';ctx.font='14px system-ui';
  ctx.fillText(text||'Calculating…',18,canvas.height/2);
}
function status(text){$('status').textContent=text;}
function redrawOrbit(name,r){
  const canvas=$('orbit-'+name),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.fillStyle='#0b1527';ctx.fillRect(0,0,w,h);
  const T=r.trace,delays=[0,7,14],vec=[];
  let max=.05;
  for(const z of T)max=Math.max(max,Math.abs(z));
  function project(x,y,z){
    return [w*.51+86*(x-y)*.75,h*.52+70*z-31*(x+y)];
  }
  const ax=[[[0,0,0],[1.3,0,0],'X'],[[0,0,0],[0,1.3,0],'Y'],[[0,0,0],[0,0,1.3],'Z']];
  for(const [a,b,label] of ax){
    const p=project(...a),q=project(...b);
    ctx.beginPath();ctx.strokeStyle='#385574';ctx.lineWidth=1.5;ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();
    ctx.fillStyle='#9bb1c9';ctx.font='12px system-ui';ctx.fillText(label,q[0]+5,q[1]-6);
  }
  for(let i=14;i<T.length;i++){
    const x=T[i-14]/max,y=T[i-7]/max,z=T[i]/max;
    vec.push(project(x,y,z));
  }
  ctx.strokeStyle=name==='locked'?'#7cdbc9':name.startsWith('scrambled')?'#bba9fa':'#f2b77b';
  ctx.lineWidth=1.5;ctx.globalAlpha=.75;ctx.beginPath();
  for(let i=0;i<vec.length;i++){
    if(i===0)ctx.moveTo(vec[i][0],vec[i][1]);
    else if(i%25===0&&name.startsWith('scrambled'))ctx.moveTo(vec[i][0],vec[i][1]);
    else ctx.lineTo(vec[i][0],vec[i][1]);
  }
  ctx.stroke();ctx.globalAlpha=1;
  for(let i=0;i<vec.length;i+=10){
    const [x,y]=vec[i];ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);
    ctx.fillStyle=name==='locked'?'#c2fff1':name.startsWith('scrambled')?'#d6c8ff':'#ffd0a0';ctx.fill();
  }
  ctx.font='12px system-ui';ctx.fillStyle='#9db6c8';
  ctx.fillText('x(t−14), x(t−7), x(t) — one virtual sensor',14,h-15);
}
function ramp(p){
  // Slow, high-contrast dark -> deep blue -> turquoise -> gold.
  const stops=[[13,25,45],[25,49,80],[55,139,158],[228,173,102],[255,229,184]];
  const v=Math.max(0,Math.min(.9999,p))*(stops.length-1),i=Math.floor(v),s=v-i;
  const a=stops[i],b=stops[i+1];
  return a.map((x,j)=>Math.round(x+(b[j]-x)*s));
}
function redrawHeat(name,r){
  const canvas=$('heat-'+name),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const image=document.createElement('canvas');image.width=32;image.height=32;
  const c=image.getContext('2d'),pixels=c.createImageData(32,32);
  const max=Math.max(.0000001,...r.focus);
  for(let i=0;i<1024;i++){
    const scaled=Math.sqrt(Math.max(0,r.focus[i])/max);
    const rgb=ramp(scaled);
    pixels.data[i*4]=rgb[0];pixels.data[i*4+1]=rgb[1];pixels.data[i*4+2]=rgb[2];pixels.data[i*4+3]=255;
  }
  c.putImageData(pixels,0,0);
  ctx.fillStyle='#0b1527';ctx.fillRect(0,0,w,h);
  const size=Math.min(w-28,h-48),x=(w-size)/2,y=(h-size)/2-8;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,x,y,size,size);
  ctx.strokeStyle='#617d99';ctx.lineWidth=1;ctx.strokeRect(x,y,size,size);
  ctx.fillStyle='#a2bacd';ctx.font='12px system-ui';
  ctx.fillText('Periodic spatial field · each map uses its own color max',14,h-12);
}
function show(data){
  const tbody=$('table');tbody.replaceChildren();
  for(const name of names){
    const r=data.results[name];
    $('focus-'+name).textContent=r.focusContrast.toFixed(2)+'×';
    $('persist-'+name).textContent=r.patternPersistence.toFixed(3);
    redrawOrbit(name,r);redrawHeat(name,r);
    const row=document.createElement('tr');
    const entries=[labels[name],r.power.toFixed(6),r.peakRawContrast.toFixed(2)+'×',
      r.focusContrast.toFixed(2)+'×',r.crossTermFraction.toFixed(3),
      r.patternPersistence.toFixed(3)];
    for(const item of entries){const td=document.createElement('td');td.textContent=item;row.appendChild(td);}
    tbody.appendChild(row);
  }
  const x=data.results;
  const maxResidual=Math.max(...names.map(k=>x[k].residual));
  status('Computed: all three fields have spatial mean-square power 0.5. Largest solver relative residual '+
    maxResidual.toExponential(2)+'. Seed '+data.seed+' · phase sample '+data.frame+'. '+
    'A spatial-map difference is not proof of improved learning or decoding.');
}
function run(){
  if(working){updateQueued=true;return;}
  working=true;serial++;
  $('run').disabled=true;$('next').disabled=true;$('export').disabled=true;
  status('Computing independent source fields and disk potential in the background…');
  worker.postMessage({kind:'run',frame:Number($('frame').value),
    jitter:Number($('jitter').value),seed:Number($('seed').value),serial});
}
worker.onmessage=e=>{
  const m=e.data;
  if(m.kind==='progress'){status(m.message);return;}
  if(m.kind==='error'){
    working=false;status('Numerical experiment failed: '+m.message);$('run').disabled=false;$('next').disabled=false;return;
  }
  if(m.kind==='ready'){
    working=false;data=m;show(data);$('run').disabled=false;$('next').disabled=false;$('export').disabled=false;
    if(updateQueued){updateQueued=false;run();}
  }
};
worker.onerror=e=>{working=false;status('Worker error: '+e.message);$('run').disabled=false;$('next').disabled=false;};
function exportResult(){
  if(!data)return;
  const metrics={date:'2026-10-27',experiment:'Slider3 coherent auxiliary disk potential surrogate',
    paperRelationship:'ENGINEERING ANALOGY ONLY; not exact lifted current or paper theorem',
    settings:{seed:data.seed,frame:data.frame,phaseScrambling:data.jitter,grid:32,polarizationDisk:9,
      physicalPowerTarget:.5},results:{}};
  for(const n of names){
    const r=data.results[n];
    metrics.results[n]={modeCount:r.modeCount,power:r.power,focusMean:r.focusMean,
      focusContrast:r.focusContrast,rawLiftContrast:r.peakRawContrast,
      crossTermFraction:r.crossTermFraction,patternPersistence:r.patternPersistence,
      poissonResidual:r.residual};
  }
  const blob=new Blob([JSON.stringify(metrics,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='slider3-receipt-seed-'+data.seed+'-phase-'+data.frame+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('run').addEventListener('click',run);
$('next').addEventListener('click',()=>{
  $('frame').value=String((Number($('frame').value)+1)%31);
  $('frameOut').textContent=$('frame').value;run();
});
$('export').addEventListener('click',exportResult);
$('frame').addEventListener('input',()=>{$('frameOut').textContent=$('frame').value;});
$('jitter').addEventListener('input',()=>{$('jitterOut').textContent=Math.round(Number($('jitter').value)*100)+'%';});
for(const n of names){
  clearCanvas($('orbit-'+n),'3D delay trajectory will appear here');
  clearCanvas($('heat-'+n),'Potential map will appear here');
}
$('run').disabled=false;$('next').disabled=false;run();
})();
