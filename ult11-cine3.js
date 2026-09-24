/* ============================================================
   ULT11-CINE3  ·  Ultimate Eleven
   Super-shot cinematic, ported from the approved standalone mockup.
   Drop 1: the CHARGE (hold phase). Drop 2: the IMPACT.
   Drop 3-5: FLIGHT (comet trail + spiral strands + streaks), CAMERA
   (strike cut + per-shot chase + goal frame) and the ARRIVAL (net hit /
   save burst). The bulging line-grid net itself lives in pitch3d buildGoals.
   Drop 1 details: the CHARGE - sprite-outline aura, energy pillar,
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
const C3={on:true, built:false, chaseMul:1.0, veil:0.6,   // chaseMul 1.0 = mockup framing; veil = night-stage darkness
  /* mockup timeline (s): run-up 0.9 · charge 2.4 · flight 1.35 · goal shot ~1.6.
     game.js asks superHoldMs() for runUp+charge; pitch3d reads the rest. */
  runUp:0.9, charge:2.4, flyDur:1.35, goalHold:1.6, saveHold:1.0};
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

const WAVE_FS=NOISE+`uniform float rad,op,w; uniform vec3 col; varying vec2 vUv;
  void main(){ vec2 p=vUv*2.0-1.0; float r=length(p);
    float band=smoothstep(w,0.0,abs(r-rad))*(0.7+0.6*fbm(vec2(atan(p.y,p.x)*4.0,r*6.0)));
    float inner=smoothstep(rad,0.0,r)*0.18;
    float I=(band+inner)*op*smoothstep(1.0,0.92,r);
    gl_FragColor=vec4(mix(col,vec3(1.0),band*0.6)*I,1.0); }`;
const FS_BODY=`
uniform sampler2D map; uniform vec2 off,rep; uniform float flash,rimAmt; uniform vec3 rim;
varying vec2 vUv;
float A(vec2 p){ return texture2D(map,off+clamp(p,0.002,0.998)*rep).a; }
void main(){
  vec4 c=texture2D(map,off+clamp(vUv,0.002,0.998)*rep);
  if(c.a<0.45) discard;
  vec3 k=c.rgb;
  float o=0.018;
  float e=1.0-min(min(A(vUv+vec2(o,0.0)),A(vUv-vec2(o,0.0))),min(A(vUv+vec2(0.0,o*.7)),A(vUv-vec2(0.0,o*.7))));
  k+=rim*e*rimAmt*1.4;
  k=mix(k,vec3(1.0),flash);
  gl_FragColor=vec4(k,1.0);
}`;
let T=null, scene=null, waves=[], imp=null, body=null, hidSil=null, veil=null;
let trail=null, strandA=null, strandB=null, shell=null, bglow=null, fl=null, arr=null;
const TRN=44;
const RIB_FS=NOISE+`uniform vec3 col; uniform float time,op,core; varying vec2 vUv;
  void main(){ float e=1.0-abs(vUv.y*2.0-1.0);
    float n=fbm(vec2(vUv.x*9.0-time*7.0,vUv.y*3.0));
    float tail=pow(1.0-vUv.x,1.25);
    float I=pow(e,1.4)*(0.45+0.9*n)*tail*op;
    vec3 c=mix(col,vec3(1.0),pow(e,3.0)*tail*core);
    gl_FragColor=vec4(c*I*1.5,1.0); }`;
function Ribbon(n,core){
  this.n=n; const g2=new T.BufferGeometry(); this.pos=new Float32Array(n*6); const uv=new Float32Array(n*4), idx=[];
  for(let i=0;i<n;i++){ uv[i*4]=i/(n-1); uv[i*4+1]=0; uv[i*4+2]=i/(n-1); uv[i*4+3]=1;
    if(i<n-1){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
  g2.setAttribute('position',new T.BufferAttribute(this.pos,3)); g2.setAttribute('uv',new T.BufferAttribute(uv,2)); g2.setIndex(idx);
  this.mat=new T.ShaderMaterial(mkAdd({uniforms:{col:{value:COL.v},time:{value:0},op:{value:0},core:{value:core}},vertexShader:VS,fragmentShader:RIB_FS}));
  this.mesh=new T.Mesh(g2,this.mat); this.mesh.frustumCulled=false; this.mesh.visible=false; this.mesh.renderOrder=14; scene.add(this.mesh); this.g=g2;
  this.pts=[]; for(let i=0;i<n;i++) this.pts.push(new T.Vector3());
}
Ribbon.prototype.update=function(cam,wf){ const n=this.n,P=this.pts,tv=new T.Vector3(),vv=new T.Vector3(),sd=new T.Vector3();
  for(let i=0;i<n;i++){ const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];
    tv.subVectors(a,b); if(tv.lengthSq()<1e-10) tv.set(1,0,0); tv.normalize();
    vv.subVectors(cam.position,P[i]).normalize(); sd.crossVectors(tv,vv); if(sd.lengthSq()<1e-10) sd.set(0,1,0); sd.normalize().multiplyScalar(wf(i/(n-1)));
    const q=P[i]; this.pos.set([q.x+sd.x,q.y+sd.y,q.z+sd.z,q.x-sd.x,q.y-sd.y,q.z-sd.z],i*6); }
  this.g.attributes.position.needsUpdate=true; };
let auraB=null, auraF=null, pillar=null, seal=null, glow=null, rocks=null;
const COL={v:null};
let fxT=0, filterStr='', glc=null, fontOK=false;

/* Draw the shooter OURSELVES (mockup body shader: aura rim light + white
   flash) on a plane registered exactly on the game sprite, and hide the
   sprite for the frame (syncPlayers re-shows it every frame). col>=0 forces
   a column of the same sheet row - the strike frames before contact. */
function placeShooter(g,cam,S,amt,tight,rimAmt,flash,col){
  const sp=g&&g.sprite;
  if(!(sp&&sp.material&&sp.material.map)){ auraB.visible=auraF.visible=body.visible=false; return; }
  const map=sp.material.map, AU=C3._AU, BU=body.material.uniforms;
  AU.map.value=map; AU.off.value.copy(map.offset); AU.rep.value.copy(map.repeat);
  if(col>=0){ const rx=map.repeat.x; AU.off.value.x=rx<0?(col+1)*Math.abs(rx):col*rx; }
  AU.time.value=fxT; AU.amt.value=amt; AU.tight.value=tight;
  BU.map.value=map; BU.off.value.copy(AU.off.value); BU.rep.value.copy(AU.rep.value);
  BU.rimAmt.value=rimAmt; BU.flash.value=flash;
  const e=cam.matrixWorld.elements;
  const sx=Math.abs(sp.scale.x), sy=Math.abs(sp.scale.y), cx=sp.center.x, cy=sp.center.y;
  const ox=(0.5-cx)*sx, oy=(0.5-cy)*sy, bz=0.02*S;
  const bx=sp.position.x+e[0]*ox+e[4]*oy, by=sp.position.y+e[1]*ox+e[5]*oy, bzz=sp.position.z+e[2]*ox+e[6]*oy;
  auraB.position.set(bx-e[8]*bz,by-e[9]*bz,bzz-e[10]*bz);
  auraF.position.set(bx+e[8]*bz,by+e[9]*bz,bzz+e[10]*bz);
  body.position.set(bx,by,bzz);
  for(const m of [auraB,auraF,body]){ m.quaternion.copy(cam.quaternion); m.scale.set(sx,sy,1); m.visible=true; }
  auraB.visible=auraF.visible=amt>0.001;
  sp.visible=false;
  if(g.sil&&g.sil.visible){ g.sil.visible=false; hidSil=g.sil; }
}
function releaseShooter(){ if(body) body.visible=false; if(hidSil){ hidSil.visible=true; hidSil=null; } }
function setVeil(v){ if(!veil) return; veil.material.uniforms.op.value=v; veil.visible=v>0.001; }
function setBloom(A,str){ const b=A&&A.bloom; if(!b) return; b.strength=str; b.radius=0.5; b.threshold=0.8; }
/* the mockup ball: radius 0.2 m on a 1.8 m body -> radius 0.2*S. pitch3d's
   ball geometry is r=0.5, so its scale is the DIAMETER: 0.4*S. (The trail
   used to be sized off that diameter as if it were a radius - 2x too wide,
   which is what cut the comet's head off flat.) */
function mockBall(A,S){ if(A&&A.ballMesh) A.ballMesh.scale.setScalar(0.4*S); }
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
  body=new T.Mesh(geo,new T.ShaderMaterial({uniforms:{map:{value:null},off:{value:new T.Vector2()},rep:{value:new T.Vector2(1,1)},
    flash:{value:0},rimAmt:{value:0},rim:{value:COL.v}},vertexShader:VS,fragmentShader:FS_BODY,transparent:true,fog:false}));
  body.renderOrder=10; body.frustumCulled=false;

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

  for(let i=0;i<4;i++){ const flat=(i%2===0);
    const m=new T.Mesh(flat?new T.PlaneGeometry(1,1).rotateX(-Math.PI/2):new T.PlaneGeometry(1,1),
      new T.ShaderMaterial(mkAdd({uniforms:{rad:{value:0},op:{value:0},w:{value:.08},col:{value:COL.v}},vertexShader:VS,fragmentShader:WAVE_FS})));
    m.visible=false; m.renderOrder=-1; m.frustumCulled=false; scene.add(m); waves.push({m,t:-1,dur:.6,size:1,flat}); }
  /* NIGHT STAGE. The mockup's FX live on a dark pitch; on the game's floodlit
     turf the same additive colours clip to white (measured in-engine: the
     charge + impact frames were blown out). A full-screen veil is drawn
     FIRST in the transparent pass (renderOrder -10): the opaque world
     (pitch, stands, crowd) sits under it and darkens; every sprite and every
     cine3 effect draws after it and stays at full brightness - the mockup's
     look: bright sprites + FX on a dark stage. */
  veil=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,fog:false,
    uniforms:{op:{value:0}},
    vertexShader:`void main(){ gl_Position=vec4(position.xy,0.0,1.0); }`,
    fragmentShader:`uniform float op; void main(){ gl_FragColor=vec4(0.012,0.02,0.06,op); }`}));
  veil.renderOrder=-10; veil.frustumCulled=false; veil.visible=false; scene.add(veil);
  glow=makePool(700,true); rocks=makePool(140,false);
  trail=new Ribbon(TRN,1.0); strandA=new Ribbon(TRN,0.4); strandB=new Ribbon(TRN,0.4);
  shell=new T.Mesh(new T.SphereGeometry(1,20,14),new T.ShaderMaterial(mkAdd({side:T.FrontSide,uniforms:{col:{value:COL.v},op:{value:0}},
    vertexShader:`varying vec3 vN,vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 col; uniform float op; varying vec3 vN,vV; void main(){ float f=pow(1.0-abs(dot(vN,vV)),2.2); gl_FragColor=vec4(mix(col,vec3(1.0),0.3)*f*op*1.8,1.0); }`})));
  const rc=document.createElement('canvas'); rc.width=rc.height=128; const rx=rc.getContext('2d');
  const rg=rx.createRadialGradient(64,64,0,64,64,64); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.25,'rgba(255,255,255,.5)'); rg.addColorStop(1,'rgba(255,255,255,0)');
  rx.fillStyle=rg; rx.fillRect(0,0,128,128);
  bglow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(rc),transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,fog:false,opacity:0}));
  shell.visible=bglow.visible=false; shell.renderOrder=bglow.renderOrder=13; scene.add(shell); scene.add(bglow);
  for(const o of [auraB,auraF,body,pillar,seal,glow.pts,rocks.pts]){ o.visible=false; scene.add(o); }
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
    else if(k===2){ vy-=9*S*dt; vx*=1-1.6*dt; vy*=1-.6*dt; vz*=1-1.6*dt; if(y<y0+0.03*S&&vy<0) vy*=-.3; }
    else if(k===4){ vy+=.6*S*dt; vx*=1-2.5*dt; vz*=1-2.5*dt; }
    else if(k===5){ vy-=9.8*S*dt; if(y<y0+0.03*S&&vy<0){ vy*=-.25; vx*=.6; vz*=.6; } }
    else if(k===3){ const ty=y0+pl.hover[i]; vy+=((ty-y)*3.2-vy*2.2)*dt; vx*=1-3*dt; vz*=1-3*dt;
      vx+=(Math.random()-.5)*dt*1.2*S; vz+=(Math.random()-.5)*dt*1.2*S; }
    pl.v[i*3]=vx; pl.v[i*3+1]=vy; pl.v[i*3+2]=vz;
    pl.P[i*3]=x+vx*dt; pl.P[i*3+1]=Math.max(y0+0.02*S,y+vy*dt); pl.P[i*3+2]=z+vz*dt;
    const lf=pl.life[i]/pl.max[i];
    const fade=k===3?Math.min(1,lf*4):k===4?lf*0.35:Math.min(1,lf*2.2)*(k===0?Math.min(1,(1-lf)*4):1);
    pl.C[i*4]=pl.rgb[i*3]; pl.C[i*4+1]=pl.rgb[i*3+1]; pl.C[i*4+2]=pl.rgb[i*3+2]; pl.C[i*4+3]=fade;
    pl.S[i]=pl.sz[i]*(k===4?(1.6-lf):1);
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
  /* mockup: RUN-UP first (side-on, 0.9s), then the charge. The run-up
     only runs when game.js gave the hold room for it (superHoldMs). */
  const RUN=(HM>(C3.runUp||0)+1)?(C3.runUp||0):0, ct=c.t-RUN;
  if(ct<0) return runUpFrame(c,A,cam,S);
  const k=Math.min(1,ct/(HM-RUN));
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

  /* ---- shooter: mockup body (rim light + release flash) + aura ---- */
  placeShooter(g,cam,S,amt,tight,Math.min(1,amt),release?(k-.92)/.08*0.3:0,-1);
  /* ---- charged ball (mockup: shell 0.4, glow 0.22 x charge) ---- */
  mockBall(A,S);
  const b0=c._bw, chg=sm(.2,.9,k);
  if(b0){ shell.visible=bglow.visible=true;
    shell.position.set(b0.x,b0.y,b0.z); shell.scale.setScalar(0.2*S*(1.45+0.15*Math.sin(fxT*30)));
    shell.material.uniforms.op.value=chg*0.4;
    bglow.material.color.copy(COL.v); bglow.position.set(b0.x,b0.y,b0.z); bglow.scale.setScalar(1.0*S);
    bglow.material.opacity=chg*0.22*(breath?0.3:1); }

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
  setBloom(A,0.6);
  setVeil(C3.veil*Math.min(1,c.t/0.3));

  drawOverlay(c,A,k,breath,release,tremble,S,ct);
  return true;
};

/* RUN-UP (mockup 0-0.9s): he runs in from ~6.8m behind the ball on the run
   row, camera side-on and tracking him. pitch3d plays the run frames; here
   the sprite is pulled back along the shot line (syncPlayers re-places it
   every frame, so the offset needs no cleanup) and the camera follows. */
function runUpFrame(c,A,cam,S){
  let dx=A.gwx-A.swx, dz=A.gwz-A.swz; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  const side=c._camSide||(c._camSide=(Math.random()<0.5?1:-1));
  const px=-dz*side, pz=dx*side;
  const r=Math.max(0,Math.min(1,c.t/C3.runUp)), back=6.8*S*Math.pow(1-r,1.6);   // x=lerp(-8,PX,1-(1-r)^1.6)
  const g=A.g, ox=-dx*back, oz=-dz*back;
  if(g&&g.sprite){ g.sprite.position.x+=ox; g.sprite.position.z+=oz;
    for(const o of [g.shadow,g.sil]) if(o){ o.position.x+=ox; o.position.z+=oz; } }
  const hx=A.swx+ox, hz=A.swz+oz;
  cam.position.set(hx+dx*1.2*S+px*7.2*S, 1.35*S, hz+dz*1.2*S+pz*7.2*S);
  cam.lookAt(hx+dx*2.6*S, 1.1*S, hz+dz*2.6*S);
  cam.updateMatrixWorld();
  mockBall(A,S);
  setFilter(''); setBloom(A,0.6); setVeil(C3.veil*Math.min(1,c.t/0.3));
  if(A.cv&&A.ctx) A.ctx.clearRect(0,0,A.cv.width,A.cv.height);
  return true;
}

function drawOverlay(c,A,k,breath,release,tremble,S,ct){
  const cv=A.cv, g=A.ctx; if(!cv||!g) return;
  const W=cv.width,H=cv.height,C=COL.v, lw=H/520;
  g.clearRect(0,0,W,H);
  const hp=A.proj(A.swx,1.2*S,A.swz,W,H);
  // letterbox
  const lb=sm(0,0.25,ct);                       // mockup: slides in over 0.25s from the charge start
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
  const nk=ct/0.55;
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
/* hide = end of the HOLD only. Impact debris (sparks, falling pebbles,
   shockwaves) was spawned by impact() a frame earlier and must survive this. */
C3.hide=function(){
  fxT=0; if(!imp) setFilter('');
  if(!C3.built) return;
  if(!imp){ for(const o of [auraB,auraF,pillar,seal]) o.visible=false; releaseShooter(); }
  else pillar.visible=false;
  for(const pl of [glow,rocks]) for(let i=0;i<pl.N;i++){ const k=pl.kind[i]; if(k===0||k===1||(k===3&&!imp)) pl.life[i]=0; }
  if(!imp){ glow.pts.visible=rocks.pts.visible=false; }
};
/* end = the whole cinematic is over (cineEnd / abort) */
C3.end=function(){
  imp=null; C3.hide(); setFilter(''); releaseShooter(); setVeil(0);
  if(!C3.built) return;
  glow.life.fill(0); rocks.life.fill(0); glow.pts.visible=rocks.pts.visible=false;
  for(const w of waves){ w.t=-1; w.m.visible=false; }
  for(const r of [trail,strandA,strandB]) r.mesh.visible=false;
  shell.visible=bglow.visible=false; fl=null; arr=null; C3._dirty=false;
};

function fireWave(w,x,y,z,size,dur,width){ w.m.position.set(x,y,z); w.t=0; w.size=size; w.dur=dur; w.m.material.uniforms.w.value=width||.08; w.m.visible=true; }

/* ═══ IMPACT ═══ called once from superCine2.fly(), the frame the boot meets
   the ball. A = {T,scene,camera,hh,bx,by,bz,swx,swz,gwx,gwz,col} */
C3.impact=function(c,A){
  if(!C3.on) return false;
  build(A);
  const S=A.hh/1.8, C=COL.v.set(A.col||'#3ec8ff');
  let dx=A.gwx-A.swx, dz=A.gwz-A.swz; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  const bx=A.bx, by=A.by, bz=A.bz;
  /* mockup STRIKE: 0.2s side-on wind-through (cols 7,8) with the ball still
     at the boot, THEN contact on col 9 + 0.17s freeze. Held by hit-stop so
     game.js timing is untouched (the flight just starts 0.37s later). */
  imp={t:-0.2,S,bx,by,bz,A,dx,dz,fired:false};
  c._hitStop=Math.max(c._hitStop||0,0.2+0.17);
  window.U11DBG&&U11DBG('[C3] strike');
  return true;
};
function fireImpact(c,imp){
  const S=imp.S, C=COL.v, A=imp.A, dx=imp.dx, dz=imp.dz, bx=imp.bx, by=imp.by, bz=imp.bz;
  imp.fired=true;
  try{ A.shake&&A.shake(0.32*S,450); }catch(e){}
  fireWave(waves[0],A.swx,0.05*S,A.swz,9*S,0.7,0.07);
  fireWave(waves[1],bx,by,bz,3.2*S,0.4,0.07);
  for(let i=0;i<150;i++){
    const a=Math.random()*Math.PI*2, e=(Math.random()-.2)*1.2, sp=(4+Math.random()*12)*S, w=Math.random()<.35;
    const f=Math.abs(Math.cos(a))*Math.cos(e)*sp+3*S, l=Math.sin(a)*Math.cos(e)*sp;
    spawn(glow,2,bx,by,bz, dx*f-dz*l, Math.sin(e)*sp*.6+2*S, dz*f+dx*l,
      0.4+Math.random()*0.5,(0.04+Math.random()*0.05)*S,w?1:C.r,w?1:C.g,w?1:C.b);
  }
  for(let i=0;i<40;i++){ const a=Math.random()*Math.PI*2, sp=(2+Math.random()*5)*S;
    spawn(rocks,5,A.swx+(Math.random()-.5)*S,0.05*S,A.swz+(Math.random()-.5)*1.2*S,Math.cos(a)*sp,(3+Math.random()*4)*S,Math.sin(a)*sp,
      1.4,(0.04+Math.random()*0.04)*S,.22,.3,.14); }
  for(let i=0;i<rocks.N;i++){ if(rocks.kind[i]===3&&rocks.life[i]>0){
    const ex=rocks.P[i*3]-A.swx, ez=rocks.P[i*3+2]-A.swz, d=Math.max(.2*S,Math.hypot(ex,ez));
    rocks.kind[i]=5; rocks.v[i*3]=ex/d*7*S; rocks.v[i*3+1]=(2+Math.random()*3)*S; rocks.v[i*3+2]=ez/d*7*S;
    rocks.life[i]=1.2; rocks.max[i]=1.2; } }
  glow.pts.visible=rocks.pts.visible=true;
  window.U11DBG&&U11DBG('[C3] impact');
}
C3.needsCanvas=function(c){ return !!((imp&&imp.t<0.4)||(c&&c.mode==='fly')||(arr&&arr.t<0.7)||C3._dirty); };

/* ═══ FLY FRAME ═══ every frame after the kick (fly / wait / out), after the
   camera is placed. Runs the impact aftermath: debris, shockwaves, the
   black-and-white impact frame and the manga burst on the 2D layer.
   A = {camera,renderer,gl,cv,ctx,proj} (cv/ctx only while needsCanvas()) */
C3.flyFrame=function(c,rdt,A){
  if(!C3.on||!C3.built) return;
  const dt=Math.min(0.05,rdt||0), cam=A.camera;
  glc=A.gl||glc;
  setVeil(C3.veil);
  if(A.cv&&A.ctx){ A.ctx.clearRect(0,0,A.cv.width,A.cv.height); C3._dirty=false; }
  comet(c,dt,A);
  arrival(c,dt,A);
  if(!imp){ setBloom(A,arr&&arr.goal&&arr.t<0.4?0.9:0.6); mockBall(A,fl?fl.S:A.hh/1.8); return; }
  const S=imp.S; imp.t+=dt;
  const e=imp.t;
  if(e>=0&&!imp.fired) fireImpact(c,imp);
  mockBall(A,S);
  setBloom(A,e>=0&&e<0.3?1.0:0.6);
  /* shooter through the strike: cols 7,8 before contact, then the game's
     own contact/follow-through frames; rim + aura bleed off (mockup) */
  const sa=Math.max(0,0.9-(e+0.2)*3.2);
  if(e<0.6&&A.g){ placeShooter(A.g,cam,S,sa,0,sa*0.6,0,e<-0.1?7:e<0?8:-1);
    seal.material.uniforms.amt.value=Math.max(0,0.8-(e+0.2)*4); seal.material.uniforms.crack.value=Math.max(0,.8-(e+0.2)*2); seal.material.uniforms.time.value+=dt; }
  else { releaseShooter(); auraB.visible=auraF.visible=seal.visible=false; }
  if(e<0){
    if(A.cv&&A.ctx){ C3._dirty=true; const g=A.ctx,W=A.cv.width,H=A.cv.height,bh=H*0.085; g.fillStyle='#000'; g.fillRect(0,0,W,bh); g.fillRect(0,H-bh,W,bh); }
    return; }
  setFilter(e<0?'':e<0.06?'invert(1) grayscale(1) contrast(5)':e<0.11?'grayscale(1) contrast(4) brightness(1.3)':e<0.17?'saturate(1.6) brightness(1.2)':'');
  const wdt=dt*(e<0.17?0.25:1);
  for(const w of waves){ if(w.t<0) continue; w.t+=wdt; const k=w.t/w.dur;
    if(k>=1){ w.t=-1; w.m.visible=false; continue; }
    const ee=1-Math.pow(1-k,3);
    w.m.scale.setScalar(w.size); w.m.material.uniforms.rad.value=0.12+0.82*ee; w.m.material.uniforms.op.value=(1-k)*(1-k)*0.9;
    if(!w.flat) w.m.quaternion.copy(cam.quaternion); }
  const kS=(A.renderer?A.renderer.getDrawingBufferSize(new T.Vector2()).y:720)/(2*Math.tan(cam.fov*Math.PI/360));
  glow.mat.uniforms.kS.value=rocks.mat.uniforms.kS.value=kS;
  const pdt=(c._hitStop>0)?dt*0.15:dt;
  updatePool(glow,pdt,S,0,0,0,0); updatePool(rocks,pdt,S,0,0,0,0);
  if(A.cv&&A.ctx&&e<0.34){ C3._dirty=true;
    const W=A.cv.width,H=A.cv.height,g=A.ctx,Rr=Math.hypot(W,H),C=COL.v,u=e/0.34;
    const bp=A.proj(imp.bx,imp.by,imp.bz,W,H);
    g.save();
    if(e<0.06){ g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(0,0,W,H); }
    g.globalCompositeOperation='lighter';
    for(let i=0;i<40;i++){ const a=i/40*Math.PI*2+(i%2)*0.05, w=(0.012+((i*37)%5)*0.006)*(1-u);
      const r0=Rr*(0.05+0.25*u), r1=Rr*(0.8+0.3*((i*13)%7)/7);
      g.fillStyle=i%3===0?rgba(C,0.55*(1-u)):'rgba(255,255,255,'+(0.5*(1-u)).toFixed(3)+')';
      g.beginPath(); g.moveTo(bp.x+Math.cos(a)*r0,bp.y+Math.sin(a)*r0);
      g.lineTo(bp.x+Math.cos(a-w)*r1,bp.y+Math.sin(a-w)*r1); g.lineTo(bp.x+Math.cos(a+w)*r1,bp.y+Math.sin(a+w)*r1); g.closePath(); g.fill(); }
    g.restore();
  }
  if(e>2.2){ imp=null; setFilter(''); if(!fl){ glow.pts.visible=rocks.pts.visible=false; } }
};

/* ── ball path history → the comet is sampled from where the ball WAS over
   the last `span` seconds, so it follows whatever path game.js drives
   (banana, drive dip, the hover in front of the keeper, the goal / save) ── */
function histAt(H,t,out){
  if(!H.length) return out;
  if(t<=H[0].t) return out.set(H[0].x,H[0].y,H[0].z);
  for(let i=H.length-1;i>0;i--){ const a=H[i-1],b=H[i];
    if(t>=a.t){ const k=b.t>a.t?(t-a.t)/(b.t-a.t):1; return out.set(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k,a.z+(b.z-a.z)*k); } }
  return out.set(H[0].x,H[0].y,H[0].z);
}
function comet(c,dt,A){
  const b=c._bw; if(!b) return;
  if(!fl){ fl={H:[],now:0,S:A.hh/1.8,prevY:b.y,rising:false,apexDone:false,op:1}; }
  const S=fl.S, C=COL.v;
  if(c._hitStop>0){ /* freeze: the tail holds its shape */ }
  else fl.now+=dt;
  const H=fl.H, last=H[H.length-1];
  if(!last||last.x!==b.x||last.y!==b.y||last.z!==b.z||fl.now-last.t>0.05) H.push({x:b.x,y:b.y,z:b.z,t:fl.now});
  while(H.length>2&&H[1].t<fl.now-0.6) H.shift();
  const moving=(c.mode==='fly')||(c.mode==='wait'&&fl.reel>0)||(c.mode==='out'&&arr===null);
  fl.op=Math.max(0,Math.min(1,fl.op+(moving?dt*6:-dt*1.6)));
  /* TAIL = the mockup's: sampled along the real flight path over the last
     31% of the flight (grows in over the first 15%). In 'wait' it reels in
     to the ball over 0.5s; only the short goal/save leg uses frame history. */
  if(A.pathAt&&(c.mode==='fly'||c.mode==='wait')){
    const f=c.mode==='fly'?Math.min(1,c.ft||0):1;
    if(c.mode==='wait') fl.reel=Math.max(0,(fl.reel==null?1:fl.reel)-dt/0.5); else fl.reel=1;
    const span=0.31*Math.min(1,f/0.15)*fl.reel;
    for(let i=0;i<TRN;i++){ const q=A.pathAt(f-(i/(TRN-1))*span); trail.pts[i].set(q.x,q.y,q.z); }
    if(c.mode==='wait') trail.pts[0].set(b.x,b.y,b.z);
  } else {
    const span=0.3, tm=fl.now;
    for(let i=0;i<TRN;i++) histAt(H,tm-(i/(TRN-1))*span,trail.pts[i]);
  }
  const BR=0.2*S;
  const vis=fl.op>0.01;
  for(const r of [trail,strandA,strandB]){ r.mesh.visible=vis; r.mat.uniforms.time.value=performance.now()/1000; }
  if(vis){
    /* ROUND HEAD (author, 2026-09-24): the ribbon was widest right at the ball
       and stopped there, so from most angles the comet ended in a flat cut.
       It now narrows into a rounded cap inside the ball's glow (circle
       profile over the first 12% of the tail), and the glow is a touch
       bigger, so the head reads as a round light round the ball at any angle. */
    trail.update(A.camera,s=>{ const x=Math.min(1,s/0.12), cap=Math.max(0.18,Math.sqrt(Math.max(0,1-(1-x)*(1-x))));
      return BR*(1.9*(1-s)+0.25)*(1+0.12*Math.sin(performance.now()/25+s*12))*cap; });
    trail.mat.uniforms.op.value=fl.op;
    const curve=(c.style&&c.style.kind==='curve')||c.arc==='drive', tt=performance.now()/1000;
    const tv=new T.Vector3(), up=new T.Vector3(), q=new T.Vector3();
    for(let i=0;i<TRN;i++){
      const a=trail.pts[Math.max(0,i-1)], bb=trail.pts[Math.min(TRN-1,i+1)];
      tv.subVectors(a,bb); if(tv.lengthSq()<1e-10) tv.set(1,0,0); tv.normalize();
      up.set(0,1,0).cross(tv); if(up.lengthSq()<1e-10) up.set(0,0,1); up.normalize(); q.crossVectors(tv,up);
      const s=i/(TRN-1), ang=s*(curve?16:9)-tt*(curve?34:18), rr=BR*(curve?(0.9+1.2*s):(1.1+2.4*s));
      strandA.pts[i].copy(trail.pts[i]).addScaledVector(up,Math.cos(ang)*rr).addScaledVector(q,Math.sin(ang)*rr);
      strandB.pts[i].copy(trail.pts[i]).addScaledVector(up,-Math.cos(ang)*rr).addScaledVector(q,-Math.sin(ang)*rr);
    }
    strandA.update(A.camera,s=>BR*0.35*(1-s)); strandB.update(A.camera,s=>BR*0.35*(1-s));
    strandA.mat.uniforms.op.value=strandB.mat.uniforms.op.value=fl.op*0.9;
  }
  const bd=BR;
  shell.visible=bglow.visible=vis;
  shell.position.set(b.x,b.y,b.z); shell.scale.setScalar(bd*(1.45+0.15*Math.sin(performance.now()/33)));
  shell.material.uniforms.op.value=0.9*fl.op;
  if(c.mode==='fly'&&imp&&imp.t<0){ shell.material.uniforms.op.value=0.4; bglow.material.opacity=0.22; bglow.scale.setScalar(1.0*S); }
  bglow.material.color.copy(C); bglow.position.set(b.x,b.y,b.z); bglow.scale.setScalar(2.9*S); bglow.material.opacity=0.8*fl.op;
  // sparks off the comet + dust where it skims the turf
  if(c.mode==='fly'&&!(c._hitStop>0)&&dt>0){
    for(let i=0;i<5;i++){ const w=Math.random()<.4;
      spawn(glow,1,b.x+(Math.random()-.5)*.3*S,b.y+(Math.random()-.5)*.3*S,b.z+(Math.random()-.5)*.3*S,
        (Math.random()-.5)*2*S,(Math.random()-.5)*2*S,(Math.random()-.5)*2*S,0.35+Math.random()*0.3,(0.03+Math.random()*0.03)*S,w?1:C.r,w?1:C.g,w?1:C.b); }
    if(b.y<1.1*S) for(let i=0;i<2;i++) spawn(glow,4,b.x,0.08*S,b.z,(Math.random()-.5)*2*S,(0.4+Math.random())*S,(Math.random()-.5)*2*S,0.8,0.28*S,.35,.4,.35);
    glow.pts.visible=true;
  }
  if(!imp){ // keep the particle pools ticking after the impact block retires
    const kS=(A.renderer?A.renderer.getDrawingBufferSize(new T.Vector2()).y:720)/(2*Math.tan(A.camera.fov*Math.PI/360));
    glow.mat.uniforms.kS.value=rocks.mat.uniforms.kS.value=kS;
    updatePool(glow,(c._hitStop>0)?dt*0.15:dt,S,0,0,0,0); updatePool(rocks,dt,S,0,0,0,0);
  }
  // DRIVE apex beat: the frame it turns over, hang + a ring
  if(c.arc==='drive'&&c.mode==='fly'&&!fl.apexDone){
    if(b.y>fl.prevY+1e-4) fl.rising=true;
    else if(fl.rising&&b.y<fl.prevY-1e-4&&b.y>2*S){ fl.apexDone=true; c._hitStop=Math.max(c._hitStop||0,0.09);
      fireWave(waves[1],b.x,b.y,b.z,3.4*S,0.45,0.08); }
  }
  fl.prevY=b.y;
  // flight overlay: letterbox retracting + streaks against the ball's screen travel
  if(A.cv&&A.ctx&&c.mode==='fly'){
    const W=A.cv.width,Hh=A.cv.height,g=A.ctx; C3._dirty=true;
    const it=imp?imp.t:1, lb=it<0.2?1:Math.max(0,1-(it-0.2)*3);
    if(lb>0){ g.fillStyle='#000'; const bh=Hh*0.085*lb; g.fillRect(0,0,W,bh); g.fillRect(0,Hh-bh,W,bh); }
    const p0=A.proj(trail.pts[4].x,trail.pts[4].y,trail.pts[4].z,W,Hh), bp=A.proj(b.x,b.y,b.z,W,Hh);
    let dx=bp.x-p0.x, dy=bp.y-p0.y; const L=Math.hypot(dx,dy);
    if(L>1){ dx/=L; dy/=L; const px=-dy,py=dx, D=Math.hypot(W,Hh), ft=performance.now()/1000;
      g.save(); g.globalCompositeOperation='lighter';
      for(let i=0;i<26;i++){ const off=(((i*97)%100)/100-0.5)*D*1.1;
        if(Math.abs(off)<Hh*0.08) continue;
        const ph=((ft*3.2+i*0.61)%1), len=W*(0.18+0.25*((i*53)%10)/10);
        const cx=bp.x+px*off-dx*(ph*W*1.4-W*0.3), cy=bp.y+py*off-dy*(ph*W*1.4-W*0.3);
        const lg=g.createLinearGradient(cx,cy,cx-dx*len,cy-dy*len);
        lg.addColorStop(0,'rgba(255,255,255,0.22)'); lg.addColorStop(1,'rgba(255,255,255,0)');
        g.strokeStyle=lg; g.lineWidth=(1+(i%4===0?1.5:0))*Hh/520; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx-dx*len,cy-dy*len); g.stroke(); }
      g.restore(); }
  }
}

/* ═══ ARRIVAL ═══ called once from pitch3d when the outcome lands (goal in
   the net / ball in the gloves). A = {hh,bx,by,bz,isGoal,netHit} */
C3.arrive=function(c,A){
  if(!C3.on) return false;
  build(A);
  const S=A.hh/1.8, C=COL.v;
  arr={t:0,goal:!!A.isGoal};
  c._hitStop=Math.max(c._hitStop||0,A.isGoal?0.1:0.08);
  if(A.isGoal){
    try{ A.netHit&&A.netHit(); }catch(e){}
    fireWave(waves[3],A.bx,A.by,A.bz,7*S,0.55,0.1);
    fireWave(waves[2],A.gwx!=null?A.gwx:A.bx,0.05*S,A.gwz!=null?A.gwz:A.bz,12*S,0.8,0.06);
  } else fireWave(waves[3],A.bx,A.by,A.bz,4*S,0.4,0.1);
  const n=A.isGoal?200:90, dx=A.dx||0, dz=A.dz||0;
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,e=Math.random()*Math.PI-Math.PI/2,sp=(3+Math.random()*10)*S,w=Math.random()<.4;
    const back=-Math.abs(Math.cos(a))*sp*0.8, lat=Math.sin(a)*sp;
    spawn(glow,2,A.bx,A.by,A.bz,dx*back-dz*lat,Math.sin(e)*sp*0.7+S,dz*back+dx*lat,0.5+Math.random()*0.7,(0.04+Math.random()*0.05)*S,w?1:C.r,w?1:C.g,w?1:C.b); }
  glow.pts.visible=true;
  window.U11DBG&&U11DBG('[C3] arrive '+(A.isGoal?'goal':'save'));
  return true;
};
function arrival(c,dt,A){
  if(!arr) return;
  arr.t+=dt;
  if(A.cv&&A.ctx&&arr.goal&&arr.t<0.6){ C3._dirty=true; const e=arr.t/0.6, g=A.ctx,W=A.cv.width,H=A.cv.height;
    g.fillStyle='rgba(255,255,255,'+(0.55*(1-e)*(1-e)).toFixed(3)+')'; g.fillRect(0,0,W,H);
    g.fillStyle=rgba(COL.v,0.18*(1-e)); g.fillRect(0,0,W,H); }
  if(!imp){ for(const w of waves){ if(w.t<0) continue; w.t+=dt; const k=w.t/w.dur;
    if(k>=1){ w.t=-1; w.m.visible=false; continue; }
    const ee=1-Math.pow(1-k,3); w.m.scale.setScalar(w.size); w.m.material.uniforms.rad.value=0.12+0.82*ee; w.m.material.uniforms.op.value=(1-k)*(1-k)*0.9;
    if(!w.flat) w.m.quaternion.copy(A.camera.quaternion); } }
}

/* ═══ FLIGHT CAMERA ═══ fly / wait / out. Strike: a low side-on cut on the
   boot for the hit-stop, then the chase swings off it. Chase framing depends
   on the shot (mockup-approved): super = behind+beside, curve = behind+high
   (so the bend reads left-right), drive = side-on (so the arch reads).
   Outcome: angled frame on the goal from the shooter's side.
   A = {camera,hh,swx,swz,gwx,gwz} */
C3.flyCam=function(c,rdt,A){
  if(!C3.on) return false;
  /* lag uses the SAME dt that moves the ball (pitch3d's, uncapped): with the
     mockup's 0.05 cap a slow phone frame let the ball outrun the chase */
  const cam=A.camera, S=A.hh/1.8, dt=Math.min(0.25,rdt||0);
  let dx=A.gwx-A.swx, dz=A.gwz-A.swz; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  const side=c._camSide||(c._camSide=1), px=-dz*side, pz=dx*side;
  const b=c._bw||{x:A.swx,y:0.3*S,z:A.swz};
  const along=(b.x-A.swx)*dx+(b.z-A.swz)*dz, lat=(b.x-A.swx)*px+(b.z-A.swz)*pz;
  let P,Lk,lag;
  const strike=imp&&imp.t<0.35&&c.mode==='fly';
  if(strike){
    P=[b.x-dx*0.3*S+px*3.7*S, 0.55*S, b.z-dz*0.3*S+pz*3.7*S];
    Lk=[b.x+dx*0.5*S, 0.85*S, b.z+dz*0.5*S]; lag=1;
  } else if(c.mode==='out'){
    /* mockup goal frame: 7.5m out from where the ball hits the net (1.45m
       behind the line), 5.4m to the side, drifting in; looking at the hit
       depth, halfway between the goal's centre line and the ball. The old
       4.4/3.2 frame put the keeper between lens and net (measured 2026-09-23). */
    const ot=c.ot||0, sz=(c.style&&c.style.kind==='curve')?-1:1;
    const hx=A.gwx+dx*1.45*S, hz=A.gwz+dz*1.45*S;
    const lat=(A.kwx!=null)?(hx-A.kwx)*px+(hz-A.kwz)*pz:0;          // hit's offset from the goal's centre line
    P=[hx-dx*(7.5-ot*0.6)*S+px*sz*(5.4-ot*0.4)*S, (1.6+ot*0.25)*S, hz-dz*(7.5-ot*0.6)*S+pz*sz*(5.4-ot*0.4)*S];
    Lk=[hx-px*lat*0.5, 1.2*S, hz-pz*lat*0.5]; lag=1-Math.exp(-dt*4);
  } else {
    if(c.arc==='drive'){
      P=[b.x-dx*6.5*S+px*8.5*S, b.y*0.55+1.0*S, b.z-dz*6.5*S+pz*8.5*S];
      Lk=[b.x+dx*2.2*S, b.y*0.8+0.3*S, b.z+dz*2.2*S];
    } else if(c.style&&c.style.kind==='curve'){
      const cl=lat*0.55+0.9*S, bs=A.swx+dx*along, bz2=A.swz+dz*along;
      P=[bs-dx*6.4*S+px*cl, b.y+2.5*S, bz2-dz*6.4*S+pz*cl];
      Lk=[bs+dx*3.2*S+px*lat*0.8, b.y-0.4*S, bz2+dz*3.2*S+pz*lat*0.8];
    } else {
      P=[b.x-dx*5.8*S+px*3.8*S, b.y+1.4*S, b.z-dz*5.8*S+pz*3.8*S];
      Lk=[b.x+dx*1.4*S, b.y-0.1*S, b.z+dz*1.4*S];
    }
    lag=1-Math.exp(-dt*9);
  }
  /* the game ball is ~2x the mockup's relative to the body, so the chase and
     goal frames sit a bit further out to keep the mockup's ball/trail size */
  if(!strike){ const M=C3.chaseMul, o=c.mode==='out'?Lk:[b.x,b.y,b.z];
    for(let i=0;i<3;i++) P[i]=o[i]+(P[i]-o[i])*M; }
  if(!c._c3cam||strike){ c._c3cam={p:P.slice(),l:Lk.slice()}; }
  else { const q=c._c3cam; for(let i=0;i<3;i++){ q.p[i]+=(P[i]-q.p[i])*lag; q.l[i]+=(Lk[i]-q.l[i])*lag; } }
  const q=c._c3cam;
  cam.position.set(q.p[0],Math.max(0.25*S,q.p[1]),q.p[2]); cam.lookAt(q.l[0],q.l[1],q.l[2]); cam.updateMatrixWorld();
  return true;
};
})();
