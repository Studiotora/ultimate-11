/* ============================================================
   ULT11-CINE3  ·  Ultimate Eleven
   Super-shot cinematic, ported from the approved standalone mockup.
   Drop 1: the CHARGE (hold phase) - sprite-outline aura, energy pillar,
   ground seal, gathering motes / embers / levitating pebbles, charge
   overlay (letterbox, vignette, speed lines, bolts, name slash) and the
   orbiting charge camera.

   Hooked from ult11-pitch3d.js (cineStep2 / cineCamera2 / hideHoldFx).
   Kill switch: U11_CINE3.on=false  -> the old drawHoldFx path runs.
   All sizes are authored in mockup metres (body = 1.8) and scaled by
   S = bodyHeight/1.8, so they follow P3D.spriteFrac.
   ============================================================ */
(function(){
'use strict';
const C3={on:true, built:false};
window.U11_CINE3=C3;

const NOISE=`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }`;
const VS=`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

/* aura: dilated + upward-licking silhouette of the shooter's CURRENT sheet
   cell. off/rep are copied from the live sprite texture every frame, so a
   mirrored sprite (negative repeat.x) mirrors the aura for free. */
const FS_AURA=NOISE+`
uniform sampler2D map; uniform vec2 off,rep; uniform float time,amt,tight,front; uniform vec3 col;
varying vec2 vUv;
float A(vec2 p){ p=clamp(p,0.002,0.998); return texture2D(map,off+p*rep).a; }
void main(){
  vec2 p=vUv;
  float n =fbm(vec2(p.x*7.0,p.y*3.2-time*2.8));
  float n2=fbm(vec2(p.x*13.0+3.1,p.y*6.0-time*4.6));
  float r=mix(0.018+0.02*amt,0.008,tight);
  float d=0.0;
  for(int i=0;i<8;i++){ float a=float(i)*0.7853982; d=max(d,A(p+vec2(cos(a),sin(a)*0.71)*r)); }
  float up=0.0;
  for(int j=1;j<=7;j++){ float fj=float(j);
    vec2 q=p-vec2((n-0.5)*0.06*fj,0.026*fj*(0.55+0.7*amt));
    up=max(up,A(q)*(1.0-fj/8.0)); }
  up*=(1.0-tight)*smoothstep(0.25,0.7,n2+0.15);
  float core=A(p);
  float edge=max(d,up)*(1.0-core*mix(0.9,0.55,front));
  float flick=0.78+0.22*sin(time*27.0+p.y*38.0+n*6.0);
  float I=edge*amt*flick*(0.45+1.0*n)*mix(1.0,0.35,front);
  vec3 c=mix(col,vec3(1.0),smoothstep(0.5,1.1,I));
  gl_FragColor=vec4(c*I*0.95,1.0);
}`;

let T=null, scene=null;
let auraB=null, auraF=null, pillar=null, seal=null, glow=null, rocks=null;
const COL={v:null};
let fxT=0, filterStr='', glc=null, fontOK=false;

function mkAdd(o){ return Object.assign({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false},o); }

function build(A){
  if(C3.built) return;
  T=A.T; scene=A.scene; COL.v=new T.Color('#3ec8ff');
  const AU={map:{value:null},off:{value:new T.Vector2()},rep:{value:new T.Vector2(1,1)},
            time:{value:0},amt:{value:0},tight:{value:0},col:{value:COL.v}};
  const geo=new T.PlaneGeometry(1,1);
  auraB=new T.Mesh(geo,new T.ShaderMaterial(mkAdd({uniforms:Object.assign({},AU,{front:{value:0}}),vertexShader:VS,fragmentShader:FS_AURA})));
  auraF=new T.Mesh(geo,new T.ShaderMaterial(mkAdd({uniforms:Object.assign({},AU,{front:{value:1}}),vertexShader:VS,fragmentShader:FS_AURA})));
  /* everything that must NOT be clipped by the sprite's transparent quad
     (it writes depth) draws BEFORE the sprites: negative renderOrder */
  auraB.renderOrder=-3; auraF.renderOrder=12; auraB.frustumCulled=auraF.frustumCulled=false;
  C3._AU=AU;

  pillar=new T.Mesh(new T.CylinderGeometry(1.25,0.75,7,40,1,true).translate(0,3.5,0),
    new T.ShaderMaterial(mkAdd({uniforms:{time:{value:0},amt:{value:0},col:{value:COL.v}},vertexShader:VS,
    fragmentShader:NOISE+`uniform float time,amt; uniform vec3 col; varying vec2 vUv;
    void main(){ float a=vUv.x*6.2831853;
      float n=fbm(vec2(cos(a)*2.5+sin(a)*1.7, vUv.y*2.2-time*3.4)+vec2(sin(a)*3.0,0.0));
      float s=smoothstep(0.48,0.92,n);
      float f=smoothstep(0.0,0.12,vUv.y)*(1.0-smoothstep(0.3,1.0,vUv.y));
      float I=s*f*amt;
      gl_FragColor=vec4(mix(col,vec3(1.0),s*0.25)*I*0.6,1.0); }`})));
  pillar.renderOrder=-4;

  seal=new T.Mesh(new T.PlaneGeometry(7,7).rotateX(-Math.PI/2),new T.ShaderMaterial(mkAdd({
    uniforms:{time:{value:0},amt:{value:0},crack:{value:0},col:{value:COL.v}},vertexShader:VS,
    fragmentShader:NOISE+`uniform float time,amt,crack; uniform vec3 col; varying vec2 vUv;
    void main(){ vec2 p=vUv*2.0-1.0; float r=length(p), a=atan(p.y,p.x);
      float ring=smoothstep(0.022,0.0,abs(r-0.74));
      float ring2=smoothstep(0.014,0.0,abs(r-0.56))*step(0.45,fract((a+time*1.6)/6.2831853*18.0));
      float ticks=smoothstep(0.07,0.0,abs(r-0.65))*step(0.78,fract((a-time*0.9)/6.2831853*54.0));
      float glow=exp(-r*r*5.0)*0.45;
      float cn=fbm(vec2(a*2.6,r*3.0-time*0.2)+7.0);
      float c=pow(max(0.0,1.0-abs(cn*2.0-1.0)),18.0)*smoothstep(1.0,0.25,r)*crack*2.5;
      float I=((ring+ring2*0.8+ticks*0.7+glow)*amt+c)*smoothstep(1.0,0.9,r);
      gl_FragColor=vec4(mix(col,vec3(1.0),min(1.0,ring*0.5+c*0.4))*I,1.0); }`})));
  seal.renderOrder=-5;

  glow=makePool(700,true); rocks=makePool(140,false);
  for(const o of [auraB,auraF,pillar,seal,glow.pts,rocks.pts]){ o.visible=false; scene.add(o); }
  if(document.fonts&&document.fonts.load) document.fonts.load('80px Anton').then(()=>fontOK=true,()=>{});
  C3.built=true;
}

/* ── particles: sizes are WORLD diameters (kS converts to pixels) ── */
function makePool(N,additive){
  const geo=new T.BufferGeometry(), P=new Float32Array(N*3), C=new Float32Array(N*4), Sz=new Float32Array(N);
  geo.setAttribute('position',new T.BufferAttribute(P,3)); geo.setAttribute('pc',new T.BufferAttribute(C,4)); geo.setAttribute('ps',new T.BufferAttribute(Sz,1));
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
    blending:additive?T.AdditiveBlending:T.NormalBlending,
    uniforms:{kS:{value:600},hard:{value:additive?0:1}},
    vertexShader:`attribute vec4 pc; attribute float ps; uniform float kS; varying vec4 vC;
      void main(){ vC=pc; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=max(1.0,ps*kS/max(0.1,-mv.z)); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform float hard; varying vec4 vC; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float r=dot(q,q); if(r>1.0) discard;
      float a=hard>0.5?1.0:pow(1.0-r,1.6); gl_FragColor=hard>0.5?vec4(vC.rgb,vC.a):vec4(vC.rgb*a*vC.a,1.0); }`});
  const pts=new T.Points(geo,mat); pts.frustumCulled=false; pts.renderOrder=-2;
  return {N,P,C,S:Sz,geo,pts,mat,v:new Float32Array(N*3),life:new Float32Array(N),max:new Float32Array(N),
    sz:new Float32Array(N),kind:new Uint8Array(N),rgb:new Float32Array(N*3),hover:new Float32Array(N),next:0};
}
function spawn(pl,kind,x,y,z,vx,vy,vz,life,size,r,g,b,hover){
  const i=pl.next; pl.next=(pl.next+1)%pl.N;
  pl.P[i*3]=x; pl.P[i*3+1]=y; pl.P[i*3+2]=z; pl.v[i*3]=vx; pl.v[i*3+1]=vy; pl.v[i*3+2]=vz;
  pl.life[i]=life; pl.max[i]=life; pl.sz[i]=size; pl.kind[i]=kind;
  pl.rgb[i*3]=r; pl.rgb[i*3+1]=g; pl.rgb[i*3+2]=b; pl.hover[i]=hover||0;
}
function updatePool(pl,dt,S,cx,cy,cz,y0){
  for(let i=0;i<pl.N;i++){
    if(pl.life[i]<=0){ pl.C[i*4+3]=0; pl.S[i]=0; continue; }
    pl.life[i]-=dt; const k=pl.kind[i];
    let vx=pl.v[i*3],vy=pl.v[i*3+1],vz=pl.v[i*3+2];
    const x=pl.P[i*3],y=pl.P[i*3+1],z=pl.P[i*3+2];
    if(k===0){ const dx=cx-x,dy=cy-y,dz=cz-z,d=Math.max(.25*S,Math.hypot(dx,dy,dz));
      vx+=(dx/d*14-dz/d*6)*S*dt; vy+=dy/d*10*S*dt; vz+=(dz/d*14+dx/d*6)*S*dt;
      const dr=1-2.2*dt; vx*=dr; vy*=dr; vz*=dr;
      if(d<0.35*S) pl.life[i]=Math.min(pl.life[i],0.05); }
    else if(k===1){ vy+=1.5*S*dt; vx*=1-1.2*dt; vz*=1-1.2*dt; }
    else if(k===3){ const ty=y0+pl.hover[i]; vy+=((ty-y)*3.2-vy*2.2)*dt; vx*=1-3*dt; vz*=1-3*dt;
      vx+=(Math.random()-.5)*dt*1.2*S; vz+=(Math.random()-.5)*dt*1.2*S; }
    pl.v[i*3]=vx; pl.v[i*3+1]=vy; pl.v[i*3+2]=vz;
    pl.P[i*3]=x+vx*dt; pl.P[i*3+1]=Math.max(y0+0.02*S,y+vy*dt); pl.P[i*3+2]=z+vz*dt;
    const lf=pl.life[i]/pl.max[i];
    const fade=k===3?Math.min(1,lf*4):Math.min(1,lf*2.2)*(k===0?Math.min(1,(1-lf)*4):1);
    pl.C[i*4]=pl.rgb[i*3]; pl.C[i*4+1]=pl.rgb[i*3+1]; pl.C[i*4+2]=pl.rgb[i*3+2]; pl.C[i*4+3]=fade;
    pl.S[i]=pl.sz[i];
  }
  pl.geo.attributes.position.needsUpdate=true; pl.geo.attributes.pc.needsUpdate=true; pl.geo.attributes.ps.needsUpdate=true;
}

const sm=(a,b,x)=>{ x=Math.max(0,Math.min(1,(x-a)/(b-a))); return x*x*(3-2*x); };
const lerp=(a,b,k)=>a+(b-a)*k;
function rgba(c,a){ return 'rgba('+(c.r*255|0)+','+(c.g*255|0)+','+(c.b*255|0)+','+Math.max(0,Math.min(1,a)).toFixed(3)+')'; }
function setFilter(f){ if(glc&&f!==filterStr){ glc.style.filter=f; filterStr=f; } }

/* ═══ HOLD FRAME ═══ called from cineCamera2 while c.mode==='hold'.
   Runs AFTER syncPlayers + cineStep2, so the sprite is placed and on its
   frame; this owns the camera, the aura billboards and the overlay.
   A = {T,scene,camera,renderer,gl,g,hh,swx,swz,gwx,gwz,col,cv,ctx,bloom,fxBase}
   Returns true when it handled the frame. */
C3.holdFrame=function(c,rdt,A){
  if(!C3.on) return false;
  build(A);
  const cam=A.camera, S=A.hh/1.8, dt=Math.min(0.05,rdt||0);
  glc=A.gl||glc;
  fxT+=dt;
  COL.v.set(A.col||'#3ec8ff');
  const HM=Math.max(0.24,((c.o&&c.o.holdMs)||2250)/1000);
  const k=Math.min(1,c.t/HM);
  const breath=k>=.82&&k<.92, release=k>=.92, tremble=k>=.45&&k<.82;
  const amt=k<.45?0.12+0.33*(k/.45):k<.82?0.45+0.4*((k-.45)/.37):k<.92?0.28:1.15;
  const tight=breath?1:0;
  if(!c._c3){ c._c3=true; window.U11DBG&&U11DBG('[C3] charge on · S='+S.toFixed(2)); }

  /* ---- camera: orbit from beside him round to a low 3/4 front ---- */
  let dx=A.gwx-A.swx, dz=A.gwz-A.swz; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  const side=c._camSide||(c._camSide=(Math.random()<0.5?1:-1));
  const px=-dz*side, pz=dx*side;
  const ks=sm(0,1,k);
  const a=lerp(1.3,0.7,ks);
  const r=(lerp(7.2,5.0,ks)-(breath?0.4*(k-.82)/.1:0)-(release?0.4:0))*S;
  const shk=((tremble?0.015+0.03*((k-.45)/.37):0)+(release?0.05:0))*S;
  cam.position.set(A.swx+(dx*Math.cos(a)+px*Math.sin(a))*r+(Math.random()-.5)*shk,
                   lerp(0.8,1.25,k)*S+(Math.random()-.5)*shk,
                   A.swz+(dz*Math.cos(a)+pz*Math.sin(a))*r+(Math.random()-.5)*shk);
  cam.lookAt(A.swx+dx*0.4*S, lerp(1.35,1.5,k)*S, A.swz+dz*0.4*S);
  cam.updateMatrixWorld();

  /* ---- shooter tremble (goes still in the held breath) ---- */
  const g=A.g, sp=g&&g.sprite;
  if(sp&&(tremble||release)){
    const j=(tremble?0.012+0.03*((k-.45)/.37):0.05)*S;
    sp.position.x+=(Math.random()-.5)*j; sp.position.y+=(Math.random()-.5)*j*0.5;
    if(g.sil){ g.sil.position.x=sp.position.x; g.sil.position.y=sp.position.y; }
  }

  /* ---- aura billboards registered on the sprite ---- */
  if(sp&&sp.visible&&sp.material&&sp.material.map){
    const map=sp.material.map, AU=C3._AU;
    AU.map.value=map; AU.off.value.copy(map.offset); AU.rep.value.copy(map.repeat);
    AU.time.value=fxT; AU.amt.value=amt; AU.tight.value=tight;
    const e=cam.matrixWorld.elements;
    const sx=Math.abs(sp.scale.x), sy=Math.abs(sp.scale.y), cx=sp.center.x, cy=sp.center.y;
    const ox=(0.5-cx)*sx, oy=(0.5-cy)*sy, bz=0.02*S;
    const bx=sp.position.x+e[0]*ox+e[4]*oy, by=sp.position.y+e[1]*ox+e[5]*oy, bzz=sp.position.z+e[2]*ox+e[6]*oy;
    auraB.position.set(bx-e[8]*bz,by-e[9]*bz,bzz-e[10]*bz);
    auraF.position.set(bx+e[8]*bz,by+e[9]*bz,bzz+e[10]*bz);
    for(const m of [auraB,auraF]){ m.quaternion.copy(cam.quaternion); m.scale.set(sx,sy,1); m.visible=true; }
  } else { auraB.visible=auraF.visible=false; }

  /* ---- pillar + ground seal ---- */
  const y0=0;
  pillar.visible=true; pillar.position.set(A.swx,y0,A.swz); pillar.scale.setScalar(S);
  pillar.material.uniforms.time.value=fxT;
  pillar.material.uniforms.amt.value=k<.45?0:k<.82?sm(.45,.6,k)*0.7:k<.92?0.1:1.0;
  seal.visible=true; seal.position.set(A.swx+dx*0.3*S,y0+0.05*S,A.swz+dz*0.3*S);
  seal.scale.setScalar(S*(release?1+(k-.92)/.08*0.4:0.7+0.3*sm(0,.4,k)));
  const su=seal.material.uniforms; su.time.value=fxT;
  su.amt.value=k<.92?sm(0,.3,k)*(breath?0.35:1):1.0;
  su.crack.value=sm(.45,.8,k)*(breath?0.3:1);

  /* ---- particles ---- */
  const cX=A.swx, cY=1.1*S, cZ=A.swz, C=COL.v;
  if(!breath&&dt>0){
    if(k<.82){ const n=Math.random()<.9?3:1;
      for(let i=0;i<n;i++){ const an=Math.random()*Math.PI*2, rr=(3+Math.random()*3.5)*S;
        spawn(glow,0,cX+Math.cos(an)*rr,(0.3+Math.random()*3.2)*S,cZ+Math.sin(an)*rr,-Math.sin(an)*3*S,0,Math.cos(an)*3*S,1.6,0.036*S,
          lerp(C.r,1,.5),lerp(C.g,1,.5),lerp(C.b,1,.5)); } }
    if(k>=.45){
      for(let i=0;i<4;i++){ const an=Math.random()*Math.PI*2, rr=(0.3+Math.random()*0.9)*S, w=Math.random()<.3;
        spawn(glow,1,cX+Math.cos(an)*rr,(0.05+Math.random()*0.4)*S,cZ+Math.sin(an)*rr,(Math.random()-.5)*.6*S,(2.2+Math.random()*3.5)*S,(Math.random()-.5)*.6*S,
          0.6+Math.random()*0.6,(0.024+Math.random()*0.04)*S,w?1:C.r,w?1:C.g,w?1:C.b); }
      if(Math.random()<.5){ const an=Math.random()*Math.PI*2, rr=(0.5+Math.random()*1.9)*S;
        spawn(rocks,3,cX+Math.cos(an)*rr,0.03*S,cZ+Math.sin(an)*rr,0,0.5*S,0,9,(0.03+Math.random()*0.04)*S,
          .2+Math.random()*.1,.26,.12,(0.3+Math.random()*1.5)*S); }
    }
  }
  const kS=(A.renderer?A.renderer.getDrawingBufferSize(new T.Vector2()).y:720)/(2*Math.tan(cam.fov*Math.PI/360));
  glow.mat.uniforms.kS.value=rocks.mat.uniforms.kS.value=kS;
  const pdt=breath?dt*0.06:dt;
  updatePool(glow,pdt,S,cX,cY,cZ,y0); updatePool(rocks,pdt,S,cX,cY,cZ,y0);
  glow.pts.visible=rocks.pts.visible=true;

  /* ---- held breath: the whole frame drains of colour ---- */
  setFilter(breath?'saturate(0.2) brightness(0.78) contrast(1.15)':'');
  if(A.bloom&&A.fxBase){ A.bloom.strength=(A.fxBase.bloom||1)*0.55; A.bloom.threshold=Math.max(A.fxBase.bloomThresh||0,0.82); }

  drawOverlay(c,A,k,breath,release,tremble,S);
  return true;
};

function drawOverlay(c,A,k,breath,release,tremble,S){
  const cv=A.cv, g=A.ctx; if(!cv||!g) return;
  const W=cv.width,H=cv.height,C=COL.v, lw=H/520;
  g.clearRect(0,0,W,H);
  const hp=A.proj(A.swx,1.2*S,A.swz,W,H);
  // letterbox
  const lb=sm(0,0.1,k);
  g.fillStyle='#000'; const bh=H*0.085*lb; g.fillRect(0,0,W,bh); g.fillRect(0,H-bh,W,bh);
  // focus vignette
  const vgA=breath?0.75:0.25+0.4*k;
  const vg=g.createRadialGradient(hp.x,hp.y,H*0.12,hp.x,hp.y,Math.hypot(W,H)*0.6);
  vg.addColorStop(0,'rgba(0,0,10,0)'); vg.addColorStop(1,'rgba(0,0,10,'+vgA.toFixed(2)+')');
  g.fillStyle=vg; g.fillRect(0,0,W,H);
  g.save(); g.globalCompositeOperation='lighter';
  if(!breath&&k>.3){
    const N=24+Math.round(24*k), Rr=Math.hypot(W,H)*0.7, lp=release?1.6:1;
    for(let i=0;i<N;i++){ const a=(i/N)*Math.PI*2+((i*7919)%13)*0.03;
      const ph=((fxT*2.6+i*0.37)%1), r1=Rr*(1-ph*0.55), r0=r1-Rr*(0.12+0.18*((i*31)%7)/7);
      if(r0<H*0.14) continue;
      const x1=hp.x+Math.cos(a)*r1,y1=hp.y+Math.sin(a)*r1,x0=hp.x+Math.cos(a)*r0,y0=hp.y+Math.sin(a)*r0;
      const lg=g.createLinearGradient(x1,y1,x0,y0);
      lg.addColorStop(0,rgba(C,0)); lg.addColorStop(1,'rgba(255,255,255,'+Math.min(1,(0.08+0.22*k)*lp).toFixed(3)+')');
      g.strokeStyle=lg; g.lineWidth=(1.2+(i%3===0?2:0))*lw; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x0,y0); g.stroke(); }
  }
  if((tremble||release)&&Math.random()<0.55){
    const bodyR=Math.max(24,Math.abs(A.proj(A.swx,1.9*S,A.swz,W,H).y-A.proj(A.swx,0,A.swz,W,H).y));
    const nb=1+(Math.random()*3|0);
    for(let b=0;b<nb;b++){ const a=Math.random()*Math.PI*2, ox=hp.x+Math.cos(a)*bodyR*0.2, oy=hp.y+(Math.random()-.5)*bodyR*0.8;
      const len=bodyR*(0.4+Math.random()*0.9), pts=[[ox,oy]];
      for(let q=1;q<=6;q++){ const u=q/6; pts.push([ox+Math.cos(a)*len*u+(Math.random()-.5)*bodyR*0.3,oy+Math.sin(a)*len*u+(Math.random()-.5)*bodyR*0.3]); }
      const dr=(w,s)=>{ g.strokeStyle=s; g.lineWidth=w*lw; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let q=1;q<pts.length;q++) g.lineTo(pts[q][0],pts[q][1]); g.stroke(); };
      g.shadowColor=rgba(C,1); g.shadowBlur=12*lw; dr(3,rgba(C,0.85)); g.shadowBlur=0; dr(1.2,'rgba(255,255,255,0.95)'); }
  }
  g.restore();
  // name slash
  const HM=Math.max(0.24,((c.o&&c.o.holdMs)||2250)/1000), nk=(k*HM)/0.55;
  if(nk>0&&nk<1.6){
    const inE=sm(0,.25,nk), outE=sm(1.2,1.6,nk);
    g.save(); g.translate(W*(-0.6+inE*0.6+outE*0.7),H*0.3); g.transform(1,-0.12,0,1,0,0);
    g.fillStyle=rgba(C,0.9); g.fillRect(0,-H*0.055,W,H*0.11);
    g.fillStyle='rgba(255,255,255,0.95)'; g.fillRect(0,-H*0.055,W,H*0.008); g.fillRect(0,H*0.047,W,H*0.008);
    g.fillStyle='#07101e'; const fs=Math.round(H*0.085);
    g.font=(fontOK?'':'bold ')+fs+'px '+(fontOK?'Anton':'Impact, sans-serif'); g.textBaseline='middle';
    g.transform(1,0,-0.2,1,0,0);
    g.fillText(c.arc==='drive'?'DRIVE SHOT':(c.style&&c.style.kind==='curve')?'CURVE SHOT':'SUPER SHOT',W*0.12,0);
    g.restore();
  }
}

/* teardown - called from pitch3d hideHoldFx() (end of hold, cineEnd, abort) */
C3.hide=function(){
  fxT=0; setFilter('');
  if(!C3.built) return;
  for(const o of [auraB,auraF,pillar,seal,glow.pts,rocks.pts]) o.visible=false;
  glow.life.fill(0); rocks.life.fill(0);
};
})();
