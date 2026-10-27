/* Slider3 / Interference Microscope.
 * A controlled engineering analogy to the auxiliary potential of
 * OpenAI (2026) local smoothing, NOT its exact lifted conserved current.
 * Free periodic 2-D wave modes -> coherent direction channels ->
 * positive density -> 4D (X,W) screened disk Poisson surrogate.
 * Pure JS, deterministic, no dependencies. Node and Web Worker compatible.
 */
(function(root){
'use strict';
const N=32,M=9,SZ=N*N,WS=M*M,HW=2/(M-1),DX=2*Math.PI/N;
const WW=1/(HW*HW),XX=0.075/(DX*DX);
const ITER=100,RHO=4.0;
const DISK=[],DISKFLAG=new Uint8Array(WS),wx=new Float64Array(WS),wy=new Float64Array(WS);
for(let a=0;a<M;a++)for(let b=0;b<M;b++){
  const q=a*M+b,xx=-1+a*HW,yy=-1+b*HW;
  wx[q]=xx;wy[q]=yy;
  if(xx*xx+yy*yy<0.98*0.98){DISK.push(q);DISKFLAG[q]=1;}
}
const WAVES=[
  [4,0],[0,4],[3,3],[-3,3],[5,1],[1,5]
];
const cases=['single','locked','scrambled2','scrambled'];
function hash(seed,a,b){let x=(seed ^ Math.imul((a+1),0x9e3779b1) ^ Math.imul((b+1),0x85ebca77))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;}
function getModes(kind,seed=20261027,frame=0,jitter=1){
  if(!cases.includes(kind))throw Error('Unknown signal kind '+kind);
  const count=kind==='single'?1:(kind==='locked'||kind==='scrambled2')?2:6, amp=1/Math.sqrt(count);
  return WAVES.slice(0,count).map(([kx,ky],i)=>{
    const k=Math.hypot(kx,ky),randomPhase=(2*hash(seed,i,frame)-1)*Math.PI;
    return {kx,ky,k,vx:kx/k,vy:ky/k,amp,phase:kind.startsWith('scrambled')?jitter*randomPhase:0};
  });
}
function toneAt(modes,x,y,t){
  let val=0;
  for(const m of modes)val+=m.amp*Math.cos(m.kx*x+m.ky*y-m.k*t+m.phase);
  return val;
}
function meanSquare(modes,t=0){
  let ss=0;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const f=toneAt(modes,2*Math.PI*i/N,2*Math.PI*j/N,t);ss+=f*f;
  }
  return ss/SZ;
}
function synthesise(kind,seed=20261027,frame=0,jitter=1){
  const modes=getModes(kind,seed,frame,jitter);
  const wave=new Float32Array(SZ),mu=new Float32Array(WS*SZ),incoherent=new Float32Array(WS*SZ);
  const weights=Array.from({length:DISK.length},()=>[]);
  for(let h=0;h<DISK.length;h++){
    const q=DISK[h],w1=wx[q],w2=wy[q];
    for(const m of modes){
      const mismatch=(w1-m.vx)**2+(w2-m.vy)**2;
      const g=Math.sqrt(m.k)*Math.exp(-.5*RHO*m.k*mismatch);
      // Explicitly APPROXIMATE real polarization channels, not the paper's
      // quaternionic positive conserved tensor.
      weights[h].push([m.amp*g*(1+.5*(w1*m.vx+w2*m.vy))/Math.SQRT2,
                       m.amp*g*.5*(w1*m.vy-w2*m.vx)/Math.SQRT2]);
    }
  }
  let totalP=0,totalS=0,totalD=0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=y*N+x,xx=x*2*Math.PI/N,yy=y*2*Math.PI/N;
    const real=[],imag=[];
    for(const m of modes){const phase=m.kx*xx+m.ky*yy-m.k*.37+m.phase;real.push(Math.cos(phase));imag.push(Math.sin(phase));}
    const value=toneAt(modes,xx,yy,.37);
    wave[i]=value;totalP+=value*value;
    for(let h=0;h<DISK.length;h++){
      const q=DISK[h],off=q*SZ+i;
      let a0=0,b0=0,a1=0,b1=0,diagonal=0;
      for(let j=0;j<modes.length;j++){
        const [v0,v1]=weights[h][j],re=real[j],im=imag[j];
        a0+=v0*re;b0+=v0*im;a1+=v1*re;b1+=v1*im;
        diagonal+=v0*v0+v1*v1;
      }
      const coh=a0*a0+b0*b0+a1*a1+b1*b1;
      mu[off]=coh;incoherent[off]=diagonal;
      totalS+=coh;totalD+=diagonal;
    }
  }
  return {kind,modes,wave,mu,incoherent,power:totalP/SZ,
    meanMu:totalS/(SZ*DISK.length),meanDiagonal:totalD/(SZ*DISK.length),
    seed,frame,jitter};
}
function solvePotential(mu,iterations=ITER){
  // (-Delta_W - alpha Delta_X) v=mu, v=0 on disk boundary;
  // alpha Delta_X is isotropic approximation replacing the paper's
  // direction-dependent Fourier multiplier |k dot e(W)|^2.
  // Jacobi on periodic X and a Dirichlet disk W, no clipping to "fix" sign.
  let old=new Float64Array(WS*SZ),next=new Float64Array(WS*SZ);
  const denom=4*WW+4*XX;
  for(let it=0;it<iterations;it++){
    for(const q of DISK){
      const off=q*SZ;const wUp=(q+M)*SZ,wDn=(q-M)*SZ,wLf=(q-1)*SZ,wRt=(q+1)*SZ;
      const hasU=DISKFLAG[q+M],hasD=DISKFLAG[q-M],hasL=DISKFLAG[q-1],hasR=DISKFLAG[q+1];
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){
        const i=y*N+x,ip=y*N+(x+1)%N,im=y*N+(x+N-1)%N,
          jp=(y+1)%N*N+x,jm=(y+N-1)%N*N+x;
        let sum=0;
        if(hasU)sum+=old[wUp+i];if(hasD)sum+=old[wDn+i];
        if(hasL)sum+=old[wLf+i];if(hasR)sum+=old[wRt+i];
        next[off+i]=(mu[off+i]+WW*sum+XX*(old[off+ip]+old[off+im]+old[off+jp]+old[off+jm]))/denom;
      }
    }
    const s=old;old=next;next=s;
  }
  return old;
}
function residual(mu,potential){
  let numerator=0,denominator=0;const diag=4*WW+4*XX;
  for(const q of DISK){
    const off=q*SZ;const up=(q+M)*SZ,dn=(q-M)*SZ,lf=(q-1)*SZ,rt=(q+1)*SZ;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const i=y*N+x,ip=y*N+(x+1)%N,im=y*N+(x+N-1)%N,
      jp=(y+1)%N*N+x,jm=(y+N-1)%N*N+x;
      let neighbors=0;
      if(DISKFLAG[q+M])neighbors+=potential[up+i];
      if(DISKFLAG[q-M])neighbors+=potential[dn+i];
      if(DISKFLAG[q-1])neighbors+=potential[lf+i];
      if(DISKFLAG[q+1])neighbors+=potential[rt+i];
      neighbors=WW*neighbors+XX*(potential[off+ip]+potential[off+im]+potential[off+jp]+potential[off+jm]);
      const err=diag*potential[off+i]-neighbors-mu[off+i];
      numerator+=err*err;denominator+=mu[off+i]*mu[off+i];
    }
  }
  return Math.sqrt(numerator/Math.max(1e-20,denominator));
}
function focusMaps(item,iterations=ITER){
  const potential=solvePotential(item.mu,iterations);
  const focus=new Float32Array(SZ),diag=new Float32Array(SZ),plain=new Float32Array(SZ);
  let negative=0,peak=0,sump=0;
  for(let i=0;i<SZ;i++){
    let energy=0,energyDiag=0,coherentSum=0;
    for(const q of DISK){
      const k=q*SZ+i,v=potential[k];
      if(v<0)negative++;
      energy+=.5*v*item.mu[k]*HW*HW;
      energyDiag+=.5*v*item.incoherent[k]*HW*HW;
      coherentSum+=item.mu[k];
    }
    focus[i]=energy;diag[i]=energyDiag;plain[i]=coherentSum;
    peak=Math.max(peak,energy);sump+=energy;
  }
  return {...item,potential,focus,diag,plain,focusMean:sump/SZ,
    focusContrast:peak/(sump/SZ+1e-15),potentialNegative:negative,residual:residual(item.mu,potential)};
}
function normalisedCorrelation(a,b){
  if(a.length!==b.length)throw Error('size mismatch');
  let ma=0,mb=0;for(let i=0;i<a.length;i++){ma+=a[i];mb+=b[i];}
  ma/=a.length;mb/=a.length;
  let num=0,da=0,db=0;
  for(let i=0;i<a.length;i++){
    const x=a[i]-ma,y=b[i]-mb;
    num+=x*y;da+=x*x;db+=y*y;
  }
  return num/(Math.sqrt(da*db)+1e-20);
}
function trace(kind,seed=20261027,jitter=1,count=380){
  const xx=2*Math.PI*7/N,yy=2*Math.PI*9/N;
  const samples=new Float32Array(count);
  for(let i=0;i<count;i++){
    const block=Math.floor(i/25);
    const modes=getModes(kind,seed,block,jitter);
    samples[i]=toneAt(modes,xx,yy,i*.034);
  }
  return samples;
}
function runOne(kind,seed=20261027,frame=0,jitter=1,iterations=ITER){
  return focusMaps(synthesise(kind,seed,frame,jitter),iterations);
}
function compare(seed=20261027,frame=0,jitter=1,iterations=ITER){
  const out={};
  for(const c of cases){
    const one=runOne(c,seed,frame,jitter,iterations);
    const other=runOne(c,seed,frame+1,jitter,iterations);
    out[c]={...one,patternPersistence:normalisedCorrelation(one.focus,other.focus),
      energyCheck:Math.abs(one.power-.5),trace:trace(c,seed,jitter)};
  }
  return out;
}
const API={N,M,SZ,WS,HW,ITER,RHO,cases,DISK,DISKFLAG,WAVES,
  getModes,toneAt,meanSquare,synthesise,solvePotential,residual,
  focusMaps,normalisedCorrelation,trace,runOne,compare};
root.Slider3Core=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:self);
