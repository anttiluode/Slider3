/* Paper-exact finite-mode Friedrichs lifted CURRENT in NULL coordinates.
 * OpenAI math Oct 25 2026, current.tex equations (current-modes),
 * (current-real-flux), Lemma current-flow, eq current-source-tensor.
 * This reproduces the exact current for finite positive-kappa mode sums;
 * it is NOT the full local-smoothing inequality nor a neural model.
 * Coordinate order: (t, x, s0, w10, w11, w20, w21); d=n-1=1.
 */
(function(root){
'use strict';
const SQRT2=Math.SQRT2,DIM=7;
const SOURCE='https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/build/sections/current.tex';
function modes(phase=0){
  // κ=4 for both; transverse Fourier wave numbers κv are 0 and 2.
  // The two experiments vary ONLY relative phase; |Fourier c|² is fixed.
  return [
    {kappa:4,v:0,re:1/Math.SQRT2,im:0},
    {kappa:4,v:.5,re:Math.cos(phase)/Math.SQRT2,im:Math.sin(phase)/Math.SQRT2}
  ];
}
function sourceG(point,source){
  const [t,x,s,w10,w11,w20,w21]=point;
  let r0=0,i0=0,r1=0,i1=0;
  for(const m of source){
    const k=m.kappa,v=m.v;
    if(!(k>0)||!Number.isFinite(v))throw Error('positive κ and finite v required');
    const d0=w11-v*w10,d1=w21-v*w20;
    const gaussian=Math.exp(-.5*k*(d0*d0+d1*d1))*Math.sqrt(k);
    const theta=k*(s+v*x-.5*v*v*t);
    // G = conjugate(f_sys(X - i q)). Fourier coefficients c are conjugated.
    const a=gaussian*(m.re*Math.cos(theta)+m.im*Math.sin(theta));
    const b=gaussian*(m.re*Math.sin(theta)-m.im*Math.cos(theta));
    r0+=a;i0+=b;r1+=v*a;i1+=v*b;
  }
  return [[r0,i0],[r1,i1]];
}
function liftedVectors(point,source){
  const G=sourceG(point,source),[g0,g1]=G;
  const out=[];
  for(let ell=0;ell<2;ell++){
    const w0=point[3+ell*2],w1=point[4+ell*2];
    const r=new Float64Array(DIM),i=new Float64Array(DIM);
    // i·(complex G) = [-Im(G), Re(G)]
    r[0]=-2*w0*g0[1];i[0]=2*w0*g0[0];
    r[1]=-(w1*g0[1]+w0*g1[1]);i[1]=w1*g0[0]+w0*g1[0];
    r[2]=w1*g1[1];i[2]=-w1*g1[0];
    r[3+ell*2]=g0[0];i[3+ell*2]=g0[1];
    r[4+ell*2]=g1[0];i[4+ell*2]=g1[1];
    out.push({r,i});
  }
  return out;
}
function tensor(point,source){
  const z=liftedVectors(point,source),B=new Float64Array(DIM*DIM);
  for(const a of z)for(let i=0;i<DIM;i++)for(let j=0;j<DIM;j++)
    B[i*DIM+j]+=a.r[i]*a.r[j]+a.i[i]*a.i[j];
  return B;
}
function quadratic(B,v){
  let sum=0;for(let i=0;i<DIM;i++)for(let j=0;j<DIM;j++)
    sum+=v[i]*B[i*DIM+j]*v[j];return sum;
}
function divergence(point,source,h=2e-4){
  // ∂_I B^{IJ}: coordinate-indexed 7D central finite difference.
  const out=new Float64Array(DIM);
  for(let coord=0;coord<DIM;coord++){
    const a=point.slice(),b=point.slice();
    a[coord]+=h;b[coord]-=h;
    const plus=tensor(a,source),minus=tensor(b,source);
    for(let column=0;column<DIM;column++)
      out[column]+=(plus[coord*DIM+column]-minus[coord*DIM+column])/(2*h);
  }
  return out;
}
function physicalTT(B){
  // T=(t-s0)/√2; contravariant current in T is (Z^t-Z^s0)/√2.
  return .5*(B[0*DIM+0]-2*B[0*DIM+2]+B[2*DIM+2]);
}
function planeSource(point,source){
  const G=sourceG(point,source);
  return {scalarReal:G[0][0],scalarImag:-G[0][1],phaseAwarePower:G[0][0]**2+G[0][1]**2};
}
function map(phase=0,point=[.3,0,0,.25,.07,-.1,-.12],grid=64){
  const src=modes(phase),lifted=new Float64Array(grid),ordinary=new Float64Array(grid);
  const values=point.slice();
  for(let j=0;j<grid;j++){
    values[1]=2*Math.PI*j/grid;
    lifted[j]=physicalTT(tensor(values,src));
    ordinary[j]=planeSource(values,src).phaseAwarePower;
  }
  return {lifted:Array.from(lifted),ordinary:Array.from(ordinary),
    spectrum:src.map(m=>m.re*m.re+m.im*m.im)};
}
function correlation(a,b){
  let meanA=0,meanB=0;
  for(let i=0;i<a.length;i++){meanA+=a[i];meanB+=b[i];}
  meanA/=a.length;meanB/=b.length;
  let numerator=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){
    const x=a[i]-meanA,y=b[i]-meanB;
    numerator+=x*y;aa+=x*x;bb+=y*y;
  }
  if(aa<1e-22&&bb<1e-22)return 1;
  if(aa<1e-22||bb<1e-22)return 0;
  return numerator/Math.sqrt(aa*bb);
}
const API={SQRT2,DIM,SOURCE,modes,sourceG,liftedVectors,tensor,quadratic,
  divergence,physicalTT,planeSource,map,correlation};
root.Slider3PaperCurrent=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:self);
