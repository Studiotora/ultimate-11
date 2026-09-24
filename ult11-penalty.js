/* ult11-penalty.js — PENALTY KICK (GK roadmap step 6b, 2026-09-24)
   The approved lab mockup (lab/lab-penalty.html), played in the match.
   game.js rollFoul() awards the penalty and calls penaltyStart(), which
   freezes the engine (G._cineHold) and runs U11PEN.run(); the result comes
   back through onDone({out:'goal'|'save'|'post'|'miss', hold, px}).

     shoot  the human takes it: aim a reticle (stick / arrows / drag), then a
            timing ring closes on it at the foot's contact - press as it lands.
            PERFECT = exactly there, GOOD = close, MISS = a weak scuff the
            keeper usually reads. Only a PERFECT leaves him guessing.
     save   the human keeps: pick one of six zones during the run-up, press
            as the ring lands on the kick. Going more than 0.25 s early shows
            your side and the taker puts it the other way.

   IN THE REAL STADIUM (author, 2026-09-24): with the 3D view on, this file
   only runs the QTE, the HUD and the buttons; every frame it hands the poses
   (camera push, taker, keeper, ball, in penalty metres) to P3D.pen in
   ult11-pitch3d.js, which draws them in the match's own stadium - team
   crowd, flags, boards, lights - with the real taker and keeper sprites.
   Its own small scene (the lab look) is only the fallback when 3D is off.
   The clock stops while the game is paused. Fonts: Cinzel / Rajdhani / Bold Pixel. */
(function(){
'use strict';
const TUNE={
  goalW:7.32, goalH:2.44, spotZ:11, ballR:0.11,
  aimMs:2200, aimSpeed:4.6,
  runMs:950, kickMs:360, contactFrame:2,
  ringLead:780,
  perfectMs:60, goodMs:140, earlyTellMs:250,
  scatter:{PERFECT:0.05, GOOD:0.38, MISS:1.05},
  flight:{PERFECT:0.44, GOOD:0.52, MISS:0.8},
  missPull:0.55,
  read:{PERFECT:0, GOOD:0.3, MISS:0.85},
  readReach:0.25, readReactMs:120,
  reach:{PERFECT:1.45, GOOD:1.08, MISS:0.55, NONE:0.42},
  aiReach:[0.95,1.25], aiGuess:{side:0.42, centre:0.16, high:0.4},
  topCornerBeat:0.55,
  aiTaker:{PERFECT:0.35, GOOD:0.5, MISS:0.15},
  diveMs:420, resultHoldMs:1900
};
const TK_FALLBACK={'1,0':[.543,.007],'2,0':[.543,0],'2,1':[.543,0],'2,2':[.548,0],'2,3':[.553,0],'2,4':[.564,0],'2,5':[.564,0],
  '2,6':[.486,.044],'2,7':[.445,0],'2,8':[.471,0],'2,9':[.455,0],'2,10':[.497,0],'2,11':[.476,0]};
const GK_A={'0,0':[.48,.025],'0,1':[.5,.025],'0,2':[.498,.025],'0,3':[.492,.025],
  '3,0':[.467,.036],'3,1':[.443,.025],'3,2':[.465,.029],'3,3':[.477,.025]};
const GK_ROWBASE={1:[.502,.025],2:[.5,.025]};
const GW=TUNE.goalW/2, GH=TUNE.goalH, GD=1.9, PR=0.06;

const CSS=`
#pen-ov{position:fixed;inset:0;z-index:9000;display:none;background:#030a18;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
#pen-ov.show{display:block}
#pen-ov.real{background:transparent}
#pen-ov.real .pen-gl{display:none}
#pen-ov .pen-stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center;overflow:hidden;pointer-events:none}
#pen-ov .pen-stage .pen-act{pointer-events:auto}
#pen-ov canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
body:has(#pause-overlay.show) #pen-ov{visibility:hidden!important}
#pen-ov .pen-banner{position:absolute;left:0;right:0;top:188px;text-align:center;font:900 112px/1 'Cinzel',serif;letter-spacing:.06em;color:#fff;opacity:0;transform:scale(.8);transition:opacity .18s,transform .25s cubic-bezier(.2,1.6,.4,1);pointer-events:none;text-shadow:0 0 34px rgba(47,140,255,.7),0 5px 0 rgba(0,0,0,.55)}
#pen-ov .pen-banner.show{opacity:1;transform:scale(1)}
#pen-ov .pen-banner.gold{color:#fff4cf;text-shadow:0 0 38px rgba(240,192,64,.9),0 5px 0 rgba(0,0,0,.55)}
#pen-ov .pen-banner.red{color:#ffd9dc;text-shadow:0 0 30px rgba(255,90,100,.8),0 5px 0 rgba(0,0,0,.55)}
#pen-ov .pen-banner.small{font-size:64px;top:220px;letter-spacing:.3em}
#pen-ov .pen-act{position:absolute;right:46px;bottom:40px;width:104px;height:104px;border-radius:50%;background:rgba(2,10,26,.72);border:3px solid #2f8cff;box-shadow:0 0 22px rgba(47,140,255,.7);display:flex;align-items:center;justify-content:center;cursor:pointer}
#pen-ov .pen-act svg{width:46px;height:46px}
#pen-ov .pen-act.sq{border-color:#ff6fb1;box-shadow:0 0 22px rgba(255,111,177,.6)}
#pen-ov .pen-act.hit{transform:scale(.92)}
#pen-ov .pen-hints{position:absolute;left:40px;bottom:36px;display:flex;gap:30px;font:600 19px/1 'Rajdhani',sans-serif;letter-spacing:.1em;color:#dfe8f5}
#pen-ov .pen-hints div{display:flex;align-items:center;gap:10px}
#pen-ov .pen-hints i{font-style:normal;height:30px;min-width:30px;padding:0 6px;box-sizing:border-box;border-radius:15px;border:2px solid #78aaff;display:flex;align-items:center;justify-content:center}
#pen-ov .pen-hints svg{width:15px;height:15px}
#pen-ov .pen-names{position:absolute;left:0;right:0;top:84px;display:flex;justify-content:center;gap:18px;font:700 18px/1 'Rajdhani',sans-serif;letter-spacing:.24em;color:#dfe8f5;pointer-events:none}
#pen-ov .pen-names span{padding:8px 18px;background:rgba(2,10,26,.72);border:1px solid rgba(120,170,255,.3)}
#pen-ov .pen-names b{color:#9fb2cc;font-weight:600;margin-right:10px}
body:has(#pen-ov.show) #dpad,body:has(#pen-ov.show) #bust-h,body:has(#pen-ov.show) #bust-a,body:has(#pen-ov.show) #hud-chips,body:has(#pen-ov.show) #kickoff-prompt,body:has(#pen-ov.show) #vjoy-base,body:has(#pen-ov.show) #fk-overlay,body:has(#pen-ov.show) #passhint,body:has(#pen-ov.show) #pass-banner,body:has(#pen-ov.show) #s-match .mcomm{visibility:hidden!important}
body:has(#pen-ov.show) #s-match .mviews,body:has(#pen-ov.show) #s-match .mviews *{opacity:0!important;pointer-events:none!important}
`;
const ICON={
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="#78aaff" stroke-width="3.2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  sq:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff6fb1" stroke-width="3"><rect x="4.5" y="4.5" width="15" height="15"/></svg>',
  arrows:'<svg viewBox="0 0 24 24" fill="#dfe8f5"><path d="M12 1l4 5H8zM12 23l-4-5h8zM1 12l5-4v8zM23 12l-5 4V8z"/></svg>'};

let V=null;                 // the built view (DOM + three.js), made once
const S={active:false};     // per-penalty state
let vnow=0, lastReal=0;     // virtual clock: stops while the game is paused
const keys={};

function ok(){ return typeof THREE!=='undefined'&&!!(document.getElementById('viewport')||document.body); }
// G is a top-level `let` in game.js: reachable by bare name, not as window.G
function curG(){ try{ return (typeof G!=='undefined')?G:null; }catch(e){ return null; } }
function paused(){ const g=curG(); return !!(g&&g.paused); }
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; }
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(src); i.src=src; }); }

/* ════ BUILD (once) ════ */
function build(){
  const st=document.createElement('style'); st.id='pen-css'; st.textContent=CSS; document.head.appendChild(st);
  const ov=document.createElement('div'); ov.id='pen-ov';
  ov.innerHTML='<canvas class="pen-gl"></canvas><canvas class="pen-hud"></canvas><div class="pen-stage">'+
    '<div class="pen-names"></div><div class="pen-banner"></div><div class="pen-act"></div><div class="pen-hints"></div></div>';
  document.body.appendChild(ov);            // the whole window, not just the 16:9 game area
  const stage=ov.querySelector('.pen-stage');
  V={ov,stage,real:false,tk:{pose:{}},gk:{pose:{}},bp:{x:0,y:0,z:0,vis:true},camK:0,
     hud:ov.querySelector('.pen-hud').getContext('2d'), banner:ov.querySelector('.pen-banner'),
     act:ov.querySelector('.pen-act'), hints:ov.querySelector('.pen-hints'), names:ov.querySelector('.pen-names')};
  bindInput();
}
/* the fallback scene (3D view off): the lab's own little stadium */
function buildScene(){
  const ov=V.ov;
  const renderer=new THREE.WebGLRenderer({canvas:ov.querySelector('.pen-gl'),antialias:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x030a18); scene.fog=new THREE.Fog(0x061226,38,95);
  const camera=new THREE.PerspectiveCamera(30,1280/720,0.1,300);
  // pitch: 70 x 44 m around the goal, stripes + the real markings
  const PX=30, PW=70, PD=44;
  const pitchTex=canvasTex(PW*PX,PD*PX,(g,w,h)=>{
    for(let i=0;i<PD;i+=2.75){ g.fillStyle=(Math.round(i/2.75)%2)?'#2c7a34':'#337f3a'; g.fillRect(0,i*PX,w,2.75*PX); }
    const X=x=>(x+PW/2)*PX, Z=z=>(z+6)*PX; g.strokeStyle='rgba(255,255,255,.92)'; g.lineWidth=0.12*PX;
    g.beginPath(); g.moveTo(0,Z(0)); g.lineTo(w,Z(0)); g.stroke();
    g.strokeRect(X(-9.16),Z(0),18.32*PX,5.5*PX);
    g.strokeRect(X(-20.16),Z(0),40.32*PX,16.5*PX);
    g.beginPath(); g.arc(X(0),Z(11),9.15*PX,Math.acos(5.5/9.15),Math.PI-Math.acos(5.5/9.15)); g.stroke();
    g.fillStyle='#fff'; g.beginPath(); g.arc(X(0),Z(11),0.14*PX,0,7); g.fill();
    const n=g.getImageData(0,0,w,h), d=n.data; for(let i=0;i<d.length;i+=4){ const k=(Math.random()-.5)*10; d[i]+=k; d[i+1]+=k; d[i+2]+=k; } g.putImageData(n,0,0);
  });
  const pitch=new THREE.Mesh(new THREE.PlaneGeometry(PW,PD),new THREE.MeshBasicMaterial({map:pitchTex}));
  pitch.rotation.x=-Math.PI/2; pitch.position.set(0,0,-6+PD/2); scene.add(pitch);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshBasicMaterial({color:0x1f5a27}));
  outer.rotation.x=-Math.PI/2; outer.position.y=-0.01; scene.add(outer);
  const standTex=canvasTex(2048,640,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#02060f'); gr.addColorStop(.35,'#0a1630'); gr.addColorStop(1,'#101c34'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    for(let r=0;r<26;r++){ const y=h*0.22+r*(h*0.7/26); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,y,w,2);
      for(let x=0;x<w;x+=7+Math.random()*4){ const c=Math.random(); g.fillStyle=c<.45?'#2f6fe0':c<.75?'#e8eef7':c<.85?'#1a3f86':'#c9a15a';
        g.globalAlpha=.35+Math.random()*.45; g.fillRect(x,y-8+Math.random()*3,4,6); } }
    g.globalAlpha=1; });
  const stand=new THREE.Mesh(new THREE.PlaneGeometry(150,40),new THREE.MeshBasicMaterial({map:standTex,fog:false}));
  stand.position.set(0,17,-34); scene.add(stand);
  const boards=new THREE.Mesh(new THREE.PlaneGeometry(64,0.95),new THREE.MeshBasicMaterial({map:canvasTex(2048,32,(g,w,h)=>{
    const cols=['#1b63d8','#0d1b33','#e8eef7','#c0292f','#1b63d8','#f0c040','#0d1b33','#2f8cff'];
    for(let i=0;i<32;i++){ g.fillStyle=cols[i%cols.length]; g.fillRect(i*w/32,0,w/32-3,h); } })}));
  boards.position.set(0,0.4,-5.2); boards.scale.y=0.85; scene.add(boards);
  const flareTex=canvasTex(128,128,(g,w,h)=>{ const r=g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(255,255,245,1)'); r.addColorStop(.18,'rgba(210,225,255,.75)'); r.addColorStop(1,'rgba(120,160,255,0)'); g.fillStyle=r; g.fillRect(0,0,w,h); });
  [-30,-12,12,30].forEach(x=>{ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:flareTex,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
    s.position.set(x,31,-33); s.scale.set(9,9,1); scene.add(s); });
  // goal frame + net
  const white=new THREE.MeshBasicMaterial({color:0xf4f7fb});
  function bar(x0,y0,z0,x1,y1,z1,r){ const a=new THREE.Vector3(x0,y0,z0), b=new THREE.Vector3(x1,y1,z1), L=a.distanceTo(b);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,10),r>0.05?white:new THREE.MeshBasicMaterial({color:0xb7c1cf}));
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()); scene.add(m); }
  bar(-GW,0,0,-GW,GH,0,PR); bar(GW,0,0,GW,GH,0,PR); bar(-GW-PR,GH,0,GW+PR,GH,0,PR);
  bar(-GW,GH,0,-GW,GH*0.8,-GD,0.025); bar(GW,GH,0,GW,GH*0.8,-GD,0.025); bar(-GW,GH*0.8,-GD,-GW,0,-GD,0.025); bar(GW,GH*0.8,-GD,GW,0,-GD,0.025);
  bar(-GW,GH*0.8,-GD,GW,GH*0.8,-GD,0.025);
  const NET={nx:30,ny:12,base:null,geo:null,bulge:null};
  (function(){
    const segs=[], add=(a,b)=>segs.push(a,b);
    const back=(i,j)=>[-GW+i*(2*GW/NET.nx), j*(GH*0.8/NET.ny), -GD];
    for(let j=0;j<=NET.ny;j++) for(let i=0;i<NET.nx;i++) add(back(i,j),back(i+1,j));
    for(let i=0;i<=NET.nx;i++) for(let j=0;j<NET.ny;j++) add(back(i,j),back(i,j+1));
    const roof=(i,k)=>[-GW+i*(2*GW/NET.nx), GH-(GH*0.2)*k, -GD*k];
    for(let k=0;k<=6;k++) for(let i=0;i<NET.nx;i++) add(roof(i,k/6),roof(i+1,k/6));
    for(let i=0;i<=NET.nx;i++) add(roof(i,0),roof(i,1));
    [-GW,GW].forEach(x=>{ for(let k=0;k<=6;k++){ const z=-GD*k/6; add([x,0,z],[x,GH-(GH*0.2)*k/6,z]); }
      for(let j=1;j<=8;j++){ const y=j*GH/8; add([x,Math.min(y,GH),0],[x,Math.min(y,GH*0.8),-GD]); } });
    NET.base=new Float32Array(segs.length*3); segs.forEach((p,i)=>{ NET.base[i*3]=p[0]; NET.base[i*3+1]=p[1]; NET.base[i*3+2]=p[2]; });
    NET.geo=new THREE.BufferGeometry(); NET.geo.setAttribute('position',new THREE.BufferAttribute(NET.base.slice(),3));
    scene.add(new THREE.LineSegments(NET.geo,new THREE.LineBasicMaterial({color:0xdfe6ef,transparent:true,opacity:.55})));
  })();
  // ball
  const ballTex=canvasTex(256,128,(g,w,h)=>{ g.fillStyle='#f3f6fa'; g.fillRect(0,0,w,h);
    for(let i=0;i<14;i++){ const x=(i*73)%w, y=(i*41)%h; g.fillStyle=i%3?'#1c3d8a':'#28a060'; g.beginPath();
      for(let k=0;k<5;k++){ const a=k*1.2566+i; g.lineTo(x+Math.cos(a)*13,y+Math.sin(a)*13); } g.fill(); } });
  const ball=new THREE.Mesh(new THREE.SphereGeometry(TUNE.ballR,20,14),new THREE.MeshBasicMaterial({map:ballTex}));
  scene.add(ball);
  const ballSh=new THREE.Mesh(new THREE.CircleGeometry(TUNE.ballR*1.3,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));
  ballSh.rotation.x=-Math.PI/2; scene.add(ballSh);
  function mkSprite(){
    const tex=new THREE.Texture(); tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:0.5})); scene.add(sp);
    const sh=new THREE.Mesh(new THREE.CircleGeometry(0.42,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));
    sh.rotation.x=-Math.PI/2; sh.scale.set(1.3,0.8,1); scene.add(sh);
    return {sp,tex,sh,sheet:null,pose:{}};
  }
  Object.assign(V,{renderer,scene,camera,NET,ball,ballSh,tk:mkSprite(),gk:mkSprite(),
     camL:new THREE.Vector3(), v:new THREE.Vector3(), ray:new THREE.Raycaster(), plane:new THREE.Plane(new THREE.Vector3(0,0,1),0), hit:new THREE.Vector3()});
}
const CAM0={p:[1.75,2.6,20.4], l:[0.4,0.95,0], fov:30}, CAM1={p:[1.45,2.35,18.9], l:[0.25,1.05,0], fov:25};
function setCam(k){ V.camK=k; if(V.real) return; const c=V.camera, L=(a,b)=>a+(b-a)*k;
  c.position.set(L(CAM0.p[0],CAM1.p[0]),L(CAM0.p[1],CAM1.p[1]),L(CAM0.p[2],CAM1.p[2]));
  V.camL.set(L(CAM0.l[0],CAM1.l[0]),L(CAM0.l[1],CAM1.l[1]),L(CAM0.l[2],CAM1.l[2]));
  c.fov=L(CAM0.fov,CAM1.fov); c.updateProjectionMatrix(); c.lookAt(V.camL); }
/* The 3D view and the HUD fill the window (a wide screen just sees more
   stadium: the vertical framing is fixed). The DOM bits live on a 1280x720
   stage scaled to fit; HUD sizes scale with the window height (V.u). */
function fit(){ const w=V.ov.clientWidth||1280, h=V.ov.clientHeight||720, s=Math.min(w/1280,h/720);
  V.stage.style.transform='translate(-50%,-50%) scale('+s+')';
  if(V.W!==w||V.H!==h||V._fitReal!==V.real){ V.W=w; V.H=h; V.u=h/720; V._fitReal=V.real; const hc=V.hud.canvas; hc.width=w; hc.height=h;
    if(V.renderer&&!V.real){ V.renderer.setSize(w,h,false); V.camera.aspect=w/h; V.camera.updateProjectionMatrix(); } } }

/* sheets: the taker's 12x8 team sheet, the 6x6 keeper sheet */
function measure(img,cols,rows,cells){
  try{
    const c=document.createElement('canvas'), sc=Math.min(1,1600/img.width);
    c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc);
    const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0,c.width,c.height);
    const cw=c.width/cols, ch=c.height/rows, out={};
    cells.forEach(([r,q])=>{
      const x0=Math.floor(q*cw), y0=Math.floor(r*ch), w=Math.floor(cw), h=Math.floor(ch);
      const d=x.getImageData(x0,y0,w,h).data; let minX=1e9,maxX=-1,maxY=-1;
      for(let yy=0;yy<h;yy++) for(let xx=0;xx<w;xx++) if(d[(yy*w+xx)*4+3]>40){ if(xx<minX)minX=xx; if(xx>maxX)maxX=xx; if(yy>maxY)maxY=yy; }
      if(maxX>=0) out[r+','+q]=[((minX+maxX)/2)/w,(h-1-maxY)/h];
    });
    return out;
  }catch(e){ return null; }
}
function bindSheet(o,img,cols,rows,bodyM,hRef,A,rowBase){
  if(o.tex.image!==img){ o.tex.image=img; o.tex.needsUpdate=true; }
  o.sheet={img,cols,rows,A,rowBase};
  const H=bodyM/hRef, W=H*(img.width/cols)/(img.height/rows); o.sp.scale.set(W,H,1);
}
function cell(o,r,c,flip){
  o.pose.r=r; o.pose.c=c; o.pose.flip=!!flip; if(V.real) return;
  const S2=o.sheet, cw=1/S2.cols, ch=1/S2.rows;
  if(flip){ o.tex.repeat.set(-cw,ch); o.tex.offset.set((c+1)*cw,1-(r+1)*ch); } else { o.tex.repeat.set(cw,ch); o.tex.offset.set(c*cw,1-(r+1)*ch); }
  const a=(S2.rowBase&&S2.rowBase[r])||S2.A[r+','+c]||[.5,0];
  o.sp.center.set(flip?1-a[0]:a[0],a[1]);
}
function place(o,x,z){ o.pose.x=x; o.pose.z=z; if(V.real) return; o.sp.position.set(x,0,z); o.sh.position.set(x,0.01,z); }
function setBall(x,y,z){ V.bp.x=x; V.bp.y=y; V.bp.z=z; if(V.real) return; V.ball.position.set(x,y,z); V.ballSh.position.set(x,0.012,z); V.ballSh.material.opacity=0.4/(1+y*1.2); }
function ballVis(v){ V.bp.vis=v; if(V.real) return; V.ball.visible=v; V.ballSh.visible=v; }
function scr(x,y,z){
  if(V.real){ const p=P3D.pen.project(x,y,z)||{x:0,y:0}; const r=V.ov.getBoundingClientRect(); return {x:p.x-r.left, y:p.y-r.top}; }
  V.v.set(x,y,z).project(V.camera); return {x:(V.v.x+1)*V.W/2, y:(1-V.v.y)*V.H/2}; }
function mid(){ return {x:V.W/2, y:170*V.u}; }

async function sheetsFor(o){
  let tk=null, gk=null;
  try{ const d=window.P3D&&P3D._dbg&&P3D._dbg();
    const s=d&&d.SHEETS&&d.SHEETS[o.side]; if(s&&s!=='none'&&s.img&&s.img.complete&&s.L&&s.L.cols===12&&s.L.rows===8) tk=s.img;
    if(d&&d.GK_SHEET&&d.GK_SHEET.L&&d.GK_SHEET.L.gk6&&d.GK_SHEET.img.complete) gk=d.GK_SHEET.img; }catch(e){}
  if(!tk) tk=await loadImg('assets/ps1/'+(o.side==='a'?'away':'home')+'.png').catch(()=>loadImg('assets/ps1/italy.png'));
  if(!gk) gk=await loadImg('assets/ps1/gk_sheet6.png');
  const cells=[[1,0]]; for(let c=0;c<12;c++) cells.push([2,c]);
  const A=Object.assign({},TK_FALLBACK,(tk.__penA||(tk.__penA=measure(tk,12,8,cells)))||{});
  bindSheet(V.tk,tk,12,8,1.78,0.48,A,null);
  bindSheet(V.gk,gk,6,6,1.9,0.675,GK_A,GK_ROWBASE);
}

/* ════ FLOW ════ */
function banner(txt,cls){ const b=V.banner; b.textContent=txt; b.className='pen-banner'+(cls?' '+cls:''); void b.offsetWidth; b.classList.add('show'); }
function bannerOff(){ V.banner.classList.remove('show'); }
function now(){ return vnow; }
function reset(){
  bannerOff();
  Object.assign(S,{phase:'ready',t:0,aim:{x:0,y:1.1},zone:{x:0,y:0},press:null,grade:null,shot:null,keep:null,feedback:null,
    runT0:0,contact:0,resT:0,tell:false,read:false,aiShot:null,ballV:null,ballHidden:false,ringAt:null,doneAt:0});
  if(!V.real){ V.NET.bulge=null; V.NET.geo.attributes.position.array.set(V.NET.base); V.NET.geo.attributes.position.needsUpdate=true; }
  setBall(0,TUNE.ballR,TUNE.spotZ); ballVis(true);
  cell(V.tk,1,0,false); place(V.tk,-1.75,13.1); cell(V.gk,0,0,false); place(V.gk,0,0.35);
  setCam(0);
  const m=S.mode==='shoot';
  V.act.className='pen-act'+(m?'':' sq'); V.act.innerHTML=m?ICON.x:ICON.sq;
  V.hints.innerHTML=m?'<div><i>'+ICON.arrows+'</i>AIM</div><div><i>'+ICON.x+'</i>SHOOT</div>'
                     :'<div><i>'+ICON.arrows+'</i>PICK SIDE</div><div><i>'+ICON.sq+'</i>DIVE</div>';
  const esc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  V.names.innerHTML=(S.o.takerName?'<span><b>TAKER</b>'+esc(S.o.takerName)+'</span>':'')+(S.o.keeperName?'<span><b>KEEPER</b>'+esc(S.o.keeperName)+'</span>':'');
  banner('PENALTY','small');
}
function press(){
  if(!S.active||paused()) return;
  vnow+=performance.now()-lastReal; lastReal=performance.now();   // the tap's own time
  const t=now();
  if(S.press!=null||S.phase==='result') return;
  if(S.mode==='shoot'){
    if(S.phase==='aim'){ beginRun(); return; }
    if(S.phase==='run'){ S.press=t; gradeFrom(t-S.contact); }
  } else if(S.phase==='run'){
    S.press=t; const d=t-S.contact; gradeFrom(d);
    if(d<-TUNE.earlyTellMs) S.tell=true;
    S.keep=keeperPlan(S.zone.x,S.zone.y>0,t);
  }
}
function gradeFrom(d){
  const a=Math.abs(d); S.grade=a<=TUNE.perfectMs?'PERFECT':a<=TUNE.goodMs?'GOOD':'MISS';
  S.feedback={txt:S.grade+(S.grade==='MISS'?(d<0?' · EARLY':' · LATE'):''),t:now(),at:S.ringAt||mid()};
}
function beginRun(){ S.phase='run'; S.runT0=now(); S.contact=now()+TUNE.runMs+TUNE.kickMs*(TUNE.contactFrame/6);
  if(S.mode==='save') S.aiShot=aiShot(); }
function aiShot(){
  const sk=S.o.takerSkill!=null?S.o.takerSkill:0.5;
  const pP=TUNE.aiTaker.PERFECT*(0.6+0.8*sk), pM=TUNE.aiTaker.MISS*(1.4-0.8*sk);
  const r=Math.random(), x=r<.44?-1:r<.88?1:0, hi=Math.random()<(x?0.4:0.5);
  const g=Math.random(), gr=g<pP?'PERFECT':g<1-pM?'GOOD':'MISS';
  return {x:x*(2.55+Math.random()*0.6), y:hi?1.7+Math.random()*0.45:0.25+Math.random()*0.4, grade:gr};
}
function keeperPlan(zx,high,t){ return {x:zx, high, t0:t}; }
function resolveShot(){
  let tx,ty,grade;
  if(S.mode==='shoot'){ tx=S.aim.x; ty=S.aim.y; grade=S.grade||'MISS';
    if(!S.grade){ S.grade='MISS'; S.feedback={txt:'MISS · LATE',t:now(),at:S.ringAt||mid()}; } }
  else { const a=S.aiShot; grade=a.grade; tx=a.x; ty=a.y;
    if(S.tell&&S.keep&&S.keep.x!==0&&Math.sign(tx)===S.keep.x) tx=-tx; }
  if(grade==='MISS'){ tx*=TUNE.missPull; ty=TUNE.ballR+(ty-TUNE.ballR)*TUNE.missPull; }
  const sc=TUNE.scatter[grade], ang=Math.random()*Math.PI*2, rr=sc*Math.sqrt(Math.random());
  const P={x:tx+Math.cos(ang)*rr, y:Math.max(TUNE.ballR,ty+Math.sin(ang)*rr*0.7)};
  const inX=Math.abs(P.x)<GW-TUNE.ballR, inY=P.y<GH-TUNE.ballR;
  const frame=!(inX&&inY)&&Math.abs(P.x)<GW+TUNE.ballR+PR&&P.y<GH+TUNE.ballR+PR&&(Math.abs(Math.abs(P.x)-GW)<TUNE.ballR+PR+0.02||Math.abs(P.y-GH)<TUNE.ballR+PR+0.02);
  let K=S.keep, R;
  if(S.mode==='shoot'){
    const ks=S.o.keeperSkill!=null?S.o.keeperSkill:0.5;
    const r=Math.random(), G2=TUNE.aiGuess, lx=r<G2.side?-1:r<G2.side*2?1:0;
    K=S.keep=keeperPlan(lx,Math.random()<G2.high,S.contact-60);
    R=(TUNE.aiReach[0]+Math.random()*(TUNE.aiReach[1]-TUNE.aiReach[0]))*(0.88+0.24*ks);
    // timing decides: a badly timed kick is slow enough to read
    if(Math.random()<Math.min(0.95,TUNE.read[grade]*(0.8+0.4*ks))){
      K=S.keep=keeperPlan(Math.abs(P.x)<1.0?0:Math.sign(P.x),P.y>1.2,S.contact+TUNE.readReactMs);
      R+=TUNE.readReach; S.read=true;
    }
  } else R=S.keep?TUNE.reach[S.grade||'MISS']:TUNE.reach.NONE;
  if(!K) K=S.keep=keeperPlan(0,false,S.contact+1e9);
  const lane={x:K.x*2.3, y:K.high?1.75:0.45};
  if(grade==='PERFECT'&&Math.abs(P.x)>2.8&&P.y>1.6) R*=TUNE.topCornerBeat;
  let saved=inX&&inY&&Math.hypot(P.x-lane.x,(P.y-lane.y)*1.15)<R;
  if(inX&&inY&&K.x===0&&Math.abs(P.x)<0.75&&P.y<1.9) saved=true;
  const out=!(inX&&inY)?(frame?'post':'miss'):saved?'save':'goal';
  S.shot={P,T:TUNE.flight[grade],t0:now(),out,grade,curve:(Math.random()-.5)*0.7*Math.min(1,Math.abs(P.x)/2),
          hold:out==='save'&&(P.y<1.05||K.x===0)&&Math.random()<0.6};
  S.phase='flight';
}

/* ════ ANIMATION ════ */
function animTaker(){
  const o=V.tk, t=now();
  if(S.phase!=='run'&&S.phase!=='flight'&&S.phase!=='result'){ cell(o,1,0,false); return; }
  const el=t-S.runT0, A={x:-1.75,z:13.1}, B={x:-0.42,z:11.32};
  if(el<TUNE.runMs){ const k=el/TUNE.runMs, e=k*(2-k); cell(o,2,Math.floor(el/95)%6,false); place(o,A.x+(B.x-A.x)*e,A.z+(B.z-A.z)*e); return; }
  let f=(el-TUNE.runMs)/TUNE.kickMs*6;
  if(S.mode==='shoot'&&S.phase==='run'&&f>=TUNE.contactFrame) f=TUNE.contactFrame;
  cell(o,2,6+Math.min(5,Math.floor(f)),false); place(o,B.x,B.z);
}
function animKeeper(){
  const o=V.gk, K=S.keep, t=now();
  if(!K||t<K.t0){ cell(o,0,S.phase==='run'?0:Math.floor(t/260)%4,false); place(o,0,0.35); return; }
  const flip=K.x<0, p=Math.min(1,(t-K.t0)/TUNE.diveMs), sh=S.shot, arrived=sh&&(t-sh.t0)/1000>=sh.T;
  let r,c,lat=0;
  if(K.x===0){
    if(!K.high){ r=0; c=0; if(arrived&&sh.out==='save'){ r=3; c=Math.min(3,Math.floor((t-sh.t0-sh.T*1000)/110)); } }
    else { r=2; c=[0,1,4][Math.min(2,Math.floor(p*3))]; if(arrived&&sh.out!=='save'&&t-sh.t0-sh.T*1000>350) c=5; }
  } else {
    r=K.high?2:1; c=Math.min(3,Math.floor(p*4)); lat=p*p*(3-2*p);
    if(arrived){ const after=t-sh.t0-sh.T*1000;
      if(sh.out==='save') c=(sh.hold&&!K.high)?4:(after>240?5:3); else if(after>260) c=5; }
  }
  cell(o,r,c,flip); place(o,K.x*1.55*lat,0.35);
}
function animBall(dt){
  const sh=S.shot; if(!sh||S.phase==='run') return;
  const t=now(), k=(t-sh.t0)/1000/sh.T;
  if(k<1){ const e=k*(0.55+0.45*k), sz=TUNE.spotZ;
    setBall((sh.P.x)*e+Math.sin(Math.PI*k)*sh.curve, TUNE.ballR+(sh.P.y-TUNE.ballR)*e+Math.sin(Math.PI*k)*0.28, sz+(0-sz)*e);
    if(!V.real) V.ball.rotation.x-=dt*28; return; }
  if(!sh.after){
    sh.after=true; const P=sh.P;
    if(sh.out==='goal'){ S.ballV={x:P.x*0.12,y:-0.4,z:-7};
      if(V.real) P3D.pen.net(P.x,Math.min(P.y,GH*0.78)); else V.NET.bulge={x:P.x,y:Math.min(P.y,GH*0.78),t:0}; }
    else if(sh.out==='save'){ if(sh.hold){ S.ballHidden=true; S.ballV=null; } else S.ballV={x:Math.sign(P.x||1)*(3+Math.random()*2),y:2.6,z:3.5}; }
    else if(sh.out==='post'){ S.ballV={x:-Math.sign(P.x)*1.5,y:1.2,z:6}; }
    else S.ballV={x:P.x*0.35,y:Math.max(0,(P.y-GH))*1.5+0.3,z:-18};
    S.phase='result'; S.resT=0;
    const G2=sh.out==='goal', txt=G2?'GOAL!':sh.out==='save'?'SAVED!':sh.out==='post'?'POST!':'MISSED!';
    const good=(S.mode==='shoot')===G2;
    setTimeout(()=>{ if(S.active) banner(txt,good?'gold':'red'); },140);
    try{ if(window.SFX){ if(G2&&SFX.goal)SFX.goal(); else if(sh.out==='save'&&SFX.save)SFX.save(); } }catch(e){}
  }
  if(S.ballHidden){ ballVis(false); return; }
  const v=S.ballV; if(!v) return;
  const p=V.bp; let x=p.x+v.x*dt, y=p.y+v.y*dt, z=p.z+v.z*dt; v.y-=9.8*dt;
  if(sh.out==='goal'&&z<-GD+0.15){ z=-GD+0.15; v.z=0; v.x*=0.5; }
  if(y<TUNE.ballR){ y=TUNE.ballR; v.y=Math.abs(v.y)>1?-v.y*0.45:0; v.x*=0.8; v.z*=0.8; }
  setBall(x,y,z); if(!V.real) V.ball.rotation.x-=dt*v.z*3;
}
function netBulge(dt){
  if(V.real) return;                                 // the real goal's net bulges in pitch3d
  const N=V.NET, b=N.bulge; if(!b) return;
  const pos=N.geo.attributes.position.array, base=N.base;
  b.t+=dt; const amp=Math.max(0,Math.sin(Math.min(1,b.t/0.18)*Math.PI/2))*Math.exp(-Math.max(0,b.t-0.18)*2.2)*0.75;
  for(let i=0;i<pos.length;i+=3){ const dx=base[i]-b.x, dy=base[i+1]-b.y, near=base[i+2]<-0.2?1:0.35;
    pos[i+2]=base[i+2]-amp*near*Math.exp(-(dx*dx+dy*dy)/0.9); }
  N.geo.attributes.position.needsUpdate=true; if(b.t>3) N.bulge=null;
}

/* ════ INPUT ════ */
const PRESS_KEYS={' ':1,'Enter':1,'x':1,'X':1,'e':1,'E':1,'j':1,'J':1,'k':1,'K':1};
const AIM_KEYS={ArrowLeft:1,ArrowRight:1,ArrowUp:1,ArrowDown:1,a:1,d:1,w:1,s:1,A:1,D:1,W:1,S:1};
function bindInput(){
  // capture phase: while a penalty runs, these keys belong to it, not to the match controls
  window.addEventListener('keydown',e=>{
    if(!S.active||paused()) return;
    const k=e.key;
    if(!PRESS_KEYS[k]&&!AIM_KEYS[k]) return;
    e.preventDefault(); e.stopImmediatePropagation();
    keys[k.length===1?k.toLowerCase():k]=true;
    if(PRESS_KEYS[k]&&!e.repeat) press();
    if(S.mode==='save'&&S.phase!=='result'&&S.press==null){
      const kk=k.length===1?k.toLowerCase():k;
      if(kk==='ArrowLeft'||kk==='a') S.zone.x=Math.max(-1,S.zone.x-1);
      if(kk==='ArrowRight'||kk==='d') S.zone.x=Math.min(1,S.zone.x+1);
      if(kk==='ArrowUp'||kk==='w') S.zone.y=1;
      if(kk==='ArrowDown'||kk==='s') S.zone.y=0;
    }
  },true);
  window.addEventListener('keyup',e=>{ const k=e.key; keys[k.length===1?k.toLowerCase():k]=false; },true);
  let dragging=false;
  const pointerGoal=e=>{ if(V.real) return P3D.pen.unproject(e.clientX,e.clientY);
    const r=V.ov.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
    V.ray.setFromCamera({x:x*2-1,y:1-y*2},V.camera); return V.ray.ray.intersectPlane(V.plane,V.hit)?V.hit:null; };
  const pointerAim=e=>{ if(!S.active||paused()) return; const p=pointerGoal(e); if(!p) return;
    if(S.mode==='shoot'&&S.phase==='aim'){ S.aim.x=Math.max(-GW-1.1,Math.min(GW+1.1,p.x)); S.aim.y=Math.max(0.15,Math.min(GH+0.8,p.y)); }
    if(S.mode==='save'&&S.phase!=='result'&&S.press==null){ S.zone.x=p.x<-1.2?-1:p.x>1.2?1:0; S.zone.y=p.y>1.2?1:0; } };
  V.ov.addEventListener('pointerdown',e=>{ if(e.target.closest('.pen-act')) return; dragging=true; pointerAim(e); });
  window.addEventListener('pointermove',e=>{ if(dragging) pointerAim(e); });
  window.addEventListener('pointerup',()=>{ dragging=false; });
  V.act.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); V.act.classList.add('hit'); setTimeout(()=>V.act.classList.remove('hit'),120); press(); });
}
let padPrev=[];
function pollPad(){
  let gp=null; try{ gp=(navigator.getGamepads&&[...navigator.getGamepads()].find(g=>g))||null; }catch(e){}
  if(!gp){ padPrev=[]; return {x:0,y:0}; }
  const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed), edge=i=>b(i)&&!padPrev[i];
  if(!paused()){
    if(edge(0)||edge(2)) press();                                  // X or SQUARE
    if(S.mode==='save'&&S.phase!=='result'&&S.press==null){
      if(edge(14)) S.zone.x=Math.max(-1,S.zone.x-1); if(edge(15)) S.zone.x=Math.min(1,S.zone.x+1);
      if(edge(12)) S.zone.y=1; if(edge(13)) S.zone.y=0;
      const ax=gp.axes[0]||0, ay=gp.axes[1]||0; if(Math.abs(ax)>.6) S.zone.x=Math.sign(ax); if(ay<-.6) S.zone.y=1; if(ay>.6) S.zone.y=0;
    }
  }
  padPrev=gp.buttons.map(x=>x.pressed);
  let x=gp.axes[0]||0, y=gp.axes[1]||0; if(b(14))x=-1; if(b(15))x=1; if(b(12))y=-1; if(b(13))y=1;
  return {x:Math.abs(x)>.15?x:0, y:Math.abs(y)>.15?y:0};
}

/* ════ HUD ════ */
function drawHUD(){
  const hud=V.hud, t=now(), u=V.u; hud.clearRect(0,0,V.W,V.H);
  if(S.mode==='save'&&S.phase!=='result'){
    for(let zx=-1;zx<=1;zx++) for(let zy=0;zy<=1;zy++){
      const x0=[-GW,-1.2,1.2][zx+1], x1=[-1.2,1.2,GW][zx+1], y0=zy?1.22:0, y1=zy?GH:1.22;
      const a=scr(x0,y0,0), b=scr(x1,y1,0), on=S.zone.x===zx&&S.zone.y===zy;
      hud.fillStyle=on?'rgba(255,111,177,.22)':'rgba(255,255,255,.04)'; hud.fillRect(a.x,b.y,b.x-a.x,a.y-b.y);
      hud.strokeStyle=on?'rgba(255,111,177,.95)':'rgba(255,255,255,.18)'; hud.lineWidth=(on?3:1)*u; hud.strokeRect(a.x+2,b.y+2,b.x-a.x-4,a.y-b.y-4);
    }
  }
  let ringAt=null;
  if(S.mode==='shoot'&&(S.phase==='aim'||S.phase==='run')){
    const c=scr(S.aim.x,S.aim.y,0); ringAt=c;
    hud.strokeStyle='#fff'; hud.lineWidth=3*u; hud.beginPath(); hud.arc(c.x,c.y,14*u,0,7); hud.stroke();
    hud.beginPath(); [[-26,-18],[18,26]].forEach(([a,b])=>{ a*=u; b*=u; hud.moveTo(c.x+a,c.y); hud.lineTo(c.x+b,c.y); hud.moveTo(c.x,c.y+a); hud.lineTo(c.x,c.y+b); }); hud.stroke();
    if(S.phase==='aim'){ const k=Math.min(1,S.t/TUNE.aimMs);
      hud.strokeStyle='rgba(47,140,255,.9)'; hud.lineWidth=5*u; hud.beginPath(); hud.arc(c.x,c.y,34*u,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-k)); hud.stroke(); }
  }
  if(S.mode==='save'&&S.phase==='run'){ const x0=[-GW,-1.2,1.2][S.zone.x+1], x1=[-1.2,1.2,GW][S.zone.x+1];
    ringAt=scr((x0+x1)/2,S.zone.y?1.83:0.61,0); }
  S.ringAt=ringAt||S.ringAt;
  if(S.phase==='run'&&ringAt&&S.press==null){
    const k=1-(S.contact-t)/TUNE.ringLead;
    if(k>0){ const rT=24*u, r=rT+Math.max(0,(1-k))*120*u;
      hud.fillStyle='rgba(2,10,26,.45)'; hud.beginPath(); hud.arc(ringAt.x,ringAt.y,rT+10*u,0,7); hud.fill();
      hud.strokeStyle='#f0c040'; hud.lineWidth=4*u; hud.shadowColor='rgba(240,192,64,.8)'; hud.shadowBlur=14; hud.beginPath(); hud.arc(ringAt.x,ringAt.y,rT,0,7); hud.stroke();
      hud.strokeStyle=S.mode==='shoot'?'#9cc4ff':'#ff8cc4'; hud.lineWidth=6*u; hud.shadowColor=S.mode==='shoot'?'rgba(47,140,255,.9)':'rgba(255,111,177,.9)';
      hud.beginPath(); hud.arc(ringAt.x,ringAt.y,Math.max(rT-14*u,r),0,7); hud.stroke(); hud.shadowBlur=0; }
  }
  if(S.feedback&&t-S.feedback.t<1400){ const f=S.feedback, a=1-Math.max(0,(t-f.t-900)/500);
    const g=f.txt.split(' ')[0], col=g==='PERFECT'?'#f0c040':g==='GOOD'?'#78aaff':'#ff5a64';
    const at=f.at||mid(), px=at.x, py=at.y-(54+(t-f.t)*0.02)*u;
    hud.globalAlpha=a; hud.font="700 "+Math.round(40*u)+"px 'Rajdhani',sans-serif"; hud.textAlign='center'; hud.lineJoin='round';
    hud.lineWidth=7*u; hud.strokeStyle='rgba(2,10,26,.9)'; hud.strokeText(f.txt,px,py);
    hud.fillStyle=col; hud.shadowColor=col; hud.shadowBlur=18; hud.fillText(f.txt,px,py); hud.shadowBlur=0; hud.globalAlpha=1; }
}

/* ════ LOOP ════ */
function frame(){
  if(!S.active) return;
  const g=curG(); if(!g||!g.mt||g!==S.g){ abort(); return; }   // match quit / restarted underneath us
  requestAnimationFrame(frame);                      // first: one bad frame must never stop it
  const real=performance.now(), rdt=Math.min(100,real-(lastReal||real));   // a slow device must not play it in slow motion lastReal=real;
  if(paused()) return;                               // the pause menu is up: the kick waits
  vnow+=rdt; const dt=rdt/1000, t=now();
  try{
    fit();
    S.t+=rdt; if(S.phase==='result') S.resT+=dt;
    const pad=pollPad();
    if(S.phase==='ready'&&S.t>1000){ bannerOff(); if(S.mode==='shoot'){ S.phase='aim'; S.t=0; } else beginRun(); }
    if(S.phase==='aim'){
      let ix=pad.x, iy=pad.y; if(keys.ArrowLeft||keys.a)ix=-1; if(keys.ArrowRight||keys.d)ix=1; if(keys.ArrowUp||keys.w)iy=-1; if(keys.ArrowDown||keys.s)iy=1;
      S.aim.x=Math.max(-GW-1.1,Math.min(GW+1.1,S.aim.x+ix*TUNE.aimSpeed*dt)); S.aim.y=Math.max(0.15,Math.min(GH+0.8,S.aim.y-iy*TUNE.aimSpeed*0.7*dt));
      if(S.t>=TUNE.aimMs) beginRun();
    }
    if(S.phase==='run'){
      const late=S.mode==='shoot'&&S.press==null&&t>S.contact+TUNE.goodMs;
      const ready=S.mode==='shoot'?(S.press!=null&&t>=Math.max(S.contact,S.press)):t>=S.contact;
      if(late||ready) resolveShot();
      setCam(Math.min(1,Math.max(0,(t-S.runT0)/(TUNE.runMs+TUNE.kickMs))));
    }
    animTaker(); animKeeper(); animBall(dt); netBulge(dt);
    if(V.real) P3D.pen.set({cam:V.camK||0, tk:V.tk.pose, gk:V.gk.pose, ball:V.bp});
    else V.renderer.render(V.scene,V.camera);
    drawHUD();
    if(S.phase==='result'&&S.resT*1000>=TUNE.resultHoldMs) finish();
  }catch(e){ console.error('[penalty]',e); if(S.phase!=='result'){ S.shot=S.shot||{out:'miss',P:{x:0,y:0}}; } finish(); }
}
function finish(){
  if(!S.active) return;
  S.active=false; V.ov.classList.remove('show'); bannerOff(); penEnd();
  const sh=S.shot||{out:'miss',P:{x:0,y:0}}, cb=S.o&&S.o.onDone;
  const res={out:sh.out, hold:!!sh.hold, px:sh.P?sh.P.x:0, grade:S.grade||null, read:!!S.read};
  try{ window.U11DBG&&U11DBG('[PEN] '+JSON.stringify(res)); }catch(e){}
  if(cb) try{ cb(res); }catch(e){ console.error('[penalty] onDone',e); }
}

/* opts: {mode:'shoot'|'save', side (taking side), takerName, keeperName,
          takerSkill 0..1, keeperSkill 0..1, onDone(result)} */
function run(opts){
  if(!ok()) return false;
  if(S.active) return false;
  try{ if(!V) build(); }catch(e){ console.error('[penalty] build',e); return false; }
  S.o=opts||{}; S.mode=S.o.mode==='save'?'save':'shoot';
  let real=false;
  try{ real=!!(window.P3D&&P3D.on&&P3D.pen&&S.o.gx!=null&&S.o.spotX!=null&&P3D.pen.begin(S.o)); }catch(e){ real=false; }
  if(!real&&!V.renderer){ try{ buildScene(); }catch(e){ console.error('[penalty] scene',e); return false; } }
  V.real=real; V.ov.classList.toggle('real',real);
  S.active=true; S.g=curG(); V.ov.classList.add('show'); fit();
  (real?Promise.resolve():sheetsFor(S.o)).then(()=>{
    if(!S.active) return;
    reset(); lastReal=performance.now(); requestAnimationFrame(frame);
  }).catch(e=>{ console.error('[penalty] sheets',e); S.active=false; V.ov.classList.remove('show'); penEnd();
    if(S.o.onDone) S.o.onDone({out:'miss',hold:false,px:0,grade:null,read:false,failed:true}); });
  return true;
}
function penEnd(){ try{ if(V&&V.real&&window.P3D&&P3D.pen) P3D.pen.end(); }catch(e){} }
function abort(){ if(!S.active) return; S.active=false; if(V){ V.ov.classList.remove('show'); bannerOff(); penEnd(); } }

window.U11PEN={run,abort,ok,active:()=>!!S.active,TUNE,_S:S,_press:press,_now:()=>vnow};
})();
