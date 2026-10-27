/* Paper Appendix D PLANAR DISK OPERATOR on a fixed Q=0, τ>0 fiber.
 * Implements planar.tex eq (planar-disk-operator) Fourier form:
 * 4|J|² Δ_W u_hat - 4|k·e(W)|² u_hat = μ_hat.
 * e=(∂Z Φ,-∂P Φ), J=(1+W²/2)/(sqrt(2)Y);
 * energy.tex fiber-inverse: Y=(sqrt(2)τ+aQ)/(1+W²/2), Q=0.
 * For a 2-mode example we analytically Fourier-decompose the EXACT
 * A^0_TT=|S0u|²+|S1u|² source into k=0 and ±(ξ0-ξ1).
 * Missing from full theorem: J_h spatial smoothing, g(Q) cutoff,
 * Q-integration, quaternionic mixed Hessian and the critical inequality.
 */
(function(root){
'use strict';
const SIDE=21,GRID=SIDE*SIDE,NR=64,PI=Math.PI;
const W0=.1,TAU=.012,H=2*W0/(SIDE-1),H2=1/(H*H),KAPPA=400*Math.SQRT2;
const V0=0,V1=1/(10*Math.SQRT2),CAMP=.004;
const IX=[],ACTIVE=new Uint8Array(GRID),WR=new Float64Array(GRID),WI=new Float64Array(GRID);
for(let j=0;j<SIDE;j++)for(let i=0;i<SIDE;i++){
  const id=j*SIDE+i,x=-W0+i*H,y=-W0+j*H;
  WR[id]=x;WI[id]=y;
  if(x*x+y*y < W0*W0*(1-1e-8)){
    ACTIVE[id]=1;IX.push(id);
  }
}
function cmul(ar,ai,br,bi){return [ar*br-ai*bi,ar*bi+ai*br];}
function abs2(re,im){return re*re+im*im;}
function geometry(wr,wi){
  // Complex W² and d=1+W²/2.
  const w2r=wr*wr-wi*wi,w2i=2*wr*wi;
  const dr=1+.5*w2r,di=.5*w2i,den=abs2(dr,di);
  const y=2**.5*TAU/Math.sqrt(den);
  // J = d²/(2τ) on the Q=0 slice; e=(c2,-c1).
  const Jr=(dr*dr-di*di)/(2*TAU),Ji=(2*dr*di)/(2*TAU);
  const e1r=(1-.5*w2r)/Math.SQRT2,e1i=-.5*w2i/Math.SQRT2;
  const e2r=-wr,e2i=-wi;
  return {y,j2:abs2(Jr,Ji),e1r,e1i,e2r,e2i};
}
function densityCoefficients(wr,wi){
  const g=geometry(wr,wi);
  function channel(v){
    const dist2=(wr-v)**2+wi*wi,
      m=Math.sqrt(KAPPA/g.y)*Math.exp(-.5*KAPPA*g.y*dist2)*CAMP;
    const b0=(1+.5*wr*v)/Math.SQRT2,b1=wi*v/(2*Math.SQRT2);
    return [m*b0,m*b1];
  }
  const a=channel(V0),b=channel(V1);
  const mu0=abs2(a[0],a[1])+abs2(b[0],b[1]);
  const cross=a[0]*b[0]+a[1]*b[1];
  return {mu0,cross,g};
}
const DKX=-40,DKB=1; // ξ0=(0,400); ξ1=(40,399), integers on the spatial torus.
function reaction(g,kx,kb){
  const r=kx*g.e1r+kb*g.e2r,im=kx*g.e1i+kb*g.e2i;
  return abs2(r,im)/g.j2;
}
function setup(){
  const m0=new Float64Array(GRID),mc=new Float64Array(GRID),
    rhs0=new Float64Array(GRID),rhsc=new Float64Array(GRID),
    potential=new Float64Array(GRID),j2=new Float64Array(GRID);
  for(const q of IX){
    const d=densityCoefficients(WR[q],WI[q]);
    m0[q]=d.mu0;mc[q]=d.cross;j2[q]=d.g.j2;
    rhs0[q]=d.mu0/(4*d.g.j2);rhsc[q]=d.cross/(4*d.g.j2);
    potential[q]=reaction(d.g,DKX,DKB);
  }
  return {m0,mc,rhs0,rhsc,potential,j2};
}
function poisson(rhs,potential,steps=2200){
  let a=new Float64Array(GRID),b=new Float64Array(GRID);
  for(let step=0;step<steps;step++){
    for(const q of IX){
      b[q]=(rhs[q]+H2*(a[q-1]+a[q+1]+a[q-SIDE]+a[q+SIDE]))/
        (4*H2+potential[q]);
    }
    const t=a;a=b;b=t;
  }
  return a;
}
function residual(field,rhs,potential){
  let num=0,den=0;
  for(const q of IX){
    const v=(4*H2+potential[q])*field[q]-
      H2*(field[q-1]+field[q+1]+field[q-SIDE]+field[q+SIDE])-rhs[q];
    num+=v*v;den+=rhs[q]*rhs[q];
  }
  return Math.sqrt(num/Math.max(1e-26,den));
}
function solve(steps=2200){
  const cfg=setup();
  const v0=poisson(cfg.rhs0,new Float64Array(GRID),steps),
    vc=poisson(cfg.rhsc,cfg.potential,steps);
  const res0=residual(v0,cfg.rhs0,new Float64Array(GRID)),
    resc=residual(vc,cfg.rhsc,cfg.potential);
  let boundMax=0,lowest=Infinity;
  for(let q=0;q<GRID;q++){
    if(!ACTIVE[q])boundMax=Math.max(boundMax,Math.abs(v0[q]),Math.abs(vc[q]));
    else lowest=Math.min(lowest,v0[q],vc[q]);
  }
  return {...cfg,v0,vc,res0,resc,boundMax,lowest};
}
function maps(phase=0,sol=solve()){
  const energy=new Float64Array(NR),coherent=new Float64Array(NR),power=new Float64Array(NR);
  const spectrum=[CAMP*CAMP,CAMP*CAMP];
  // Physical plane-wave phases differ by Δξ_x=-40 at b=0, T=0.
  // The two modes have different temporal |ξ|; T is held fixed.
  for(let x=0;x<NR;x++){
    const theta=DKX*2*PI*x/NR+phase;
    const C=Math.cos(theta),raw=2*CAMP*CAMP*(1+C);
    power[x]=raw;
    let pot=0,rawMu=0;
    for(const q of IX){
      const mu=sol.m0[q]+2*sol.mc[q]*C;
      const v=sol.v0[q]+2*sol.vc[q]*C;
      pot+=.5*mu*v*H*H;
      rawMu+=mu*H*H;
    }
    energy[x]=pot;coherent[x]=rawMu;
  }
  return {energy:Array.from(energy),coherent:Array.from(coherent),
    rawPower:Array.from(power),spectrum,phase,
    checks:{residualZero:sol.res0,residualCross:sol.resc,
      minPotential:sol.lowest,boundary:sol.boundMax}};
}
const API={SIDE,GRID,NR,W0,TAU,KAPPA,CAMP,DKX,DKB,IX,ACTIVE,
  geometry,densityCoefficients,reaction,setup,poisson,residual,solve,maps};
root.Slider3PaperPlanar=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:self);
