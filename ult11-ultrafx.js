/* ============================================================
   ULT11-ULTRAFX  ·  Ultimate Eleven                       2026-10-02
   The look + sound of the ULTRA SHOT, drawn on the cinematic's 2D overlay
   (ult11-cine3.js hands it the canvas) from the approved mockup
   (art/ultra_src/ultra-shot-mockup.html).

   VFX: 54 keyed lightning frames (alpha = brightness, blue) in ONE sheet,
   assets/vfx/ultra_frames.webp (9 x 6 cells of 480x270). They are RE-COLOURED
   to the shooter's aura (the cinematic's own colour - Raijin blue, Phoenix
   orange, Ferasao's green, Carlito's red...): each pixel keeps its brightness
   and its "how coloured vs white" and takes the aura's hue, so the white-hot
   cores stay white. Tinting is lazy (one frame, ~3 ms, the first time it is
   shown) and only the current colour is kept in memory (~28 MB).

   API  window.U11_ULTRAFX
     preload()                      start decoding the sheet (match start)
     begin(cssColor)                a new shot: set the tint
     hold(c,A,k,HMR,bp,rpx)         charge frames (cine3 drawOverlay)
     fly(c,dt,A,bp,rpx,st)          release burst + crackling shell + impact frames
     sfx(name,arg)                  ready | charge | release | fly | slow | impact | stop
   Licence note: the lightning frames are the author's supplied clip.
   ============================================================ */
(function(){
'use strict';
const FX=window.U11_ULTRAFX={};
const SHEET='assets/vfx/ultra_frames.webp', N=54, FW=480, FH=270, COLS=9;
const VW=960, VH=540, SR=0.115;                       // the source frame (mockup units): ball radius = SR*VW
const fxScale=(H,rpx)=>Math.min(H/VH*0.72,Math.max(0.12,rpx/(SR*VW)*1.25));
/* where the ball sits in each frame (fractions), interpolated between keys (mockup AK) */
const AK=[[0,.47,.48],[14,.47,.48],[17,.43,.41],[24,.42,.37],[35,.46,.38],[53,.46,.42]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const ss=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };

let sheet=null, loading=false;
FX.ready=false;
FX.preload=function(){
  if(loading||sheet) return; loading=true;
  const viaImage=()=>{ const im=new Image(); im.onload=()=>{ sheet=im; FX.ready=true; }; im.onerror=()=>{ loading=false; }; im.src=SHEET; };
  try{
    if(window.fetch&&window.createImageBitmap) fetch(SHEET).then(r=>r.blob()).then(b=>createImageBitmap(b)).then(bm=>{ sheet=bm; FX.ready=true; }).catch(viaImage);
    else viaImage();
  }catch(e){ viaImage(); }
};

/* ── tint ── */
let tintKey='', tint=[62,200,255], cache=[];
FX.begin=function(css){
  FX.preload();
  const c=String(css||'#3ec8ff').trim();
  if(c===tintKey) return;
  tintKey=c; cache=[];
  let r=62,g=200,b=255;
  const m=/^#?([0-9a-f]{6})$/i.exec(c)||(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.test(c)?[0,c.replace('#','').replace(/./g,'$&$&')]:null);
  if(m){ const h=m[1]; r=parseInt(h.slice(0,2),16); g=parseInt(h.slice(2,4),16); b=parseInt(h.slice(4,6),16); }
  const mx=Math.max(r,g,b,1); tint=[r*255/mx,g*255/mx,b*255/mx];            // full-brightness version of the aura colour
};
let _fm=null;
function featherMask(){
  if(_fm) return _fm; _fm=new Float32Array(FW*FH); const e=FW*0.07;
  for(let y=0;y<FH;y++) for(let x=0;x<FW;x++){ const d=Math.min(x,FW-1-x,(y<FH-1-y?y:FH-1-y)*(FW/FH))/e; const t=d>1?1:d<0?0:d; _fm[y*FW+x]=t*t*(3-2*t); }
  return _fm;
}
function frame(i){
  i=clamp(i|0,0,N-1);
  let cv=cache[i]; if(cv) return cv;
  if(!sheet) return null;
  cv=document.createElement('canvas'); cv.width=FW; cv.height=FH;
  const g=cv.getContext('2d',{willReadFrequently:true});
  g.drawImage(sheet,(i%COLS)*FW,Math.floor(i/COLS)*FH,FW,FH,0,0,FW,FH);
  const d=g.getImageData(0,0,FW,FH), p=d.data, tr=tint[0], tg=tint[1], tb=tint[2], fm=featherMask();
  for(let k=0,q=0;k<p.length;k+=4,q++){
    if(!p[k+3]) continue;
    p[k+3]=p[k+3]*fm[q];                           // soft edges: a bolt that runs off the frame fades instead of being cut by a hard rectangle
    const r=p[k], gg=p[k+1], b=p[k+2], mx=r>gg?(r>b?r:b):(gg>b?gg:b), mn=r<gg?(r<b?r:b):(gg<b?gg:b);
    const s=mx?(mx-mn)/mx:0, v=mx/255;
    p[k]=(255+(tr-255)*s)*v; p[k+1]=(255+(tg-255)*s)*v; p[k+2]=(255+(tb-255)*s)*v;
  }
  g.putImageData(d,0,0); cache[i]=cv; return cv;
}
FX._frame=frame;
function anchor(f){
  for(let i=1;i<AK.length;i++) if(f<=AK[i][0]){ const a=AK[i-1], b=AK[i], u=(f-a[0])/Math.max(1,b[0]-a[0]); return [lerp(a[1],b[1],u),lerp(a[2],b[2],u)]; }
  return [AK[5][1],AK[5][2]];
}
/* a frame, additive, ball-locked: scale 1 = the source's 960x540 */
function vframe(g,fi,x,y,scale,alpha){
  const im=frame(fi); if(!im) return;
  const a=anchor(fi), w=VW*scale, h=VH*scale;
  g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=alpha==null?1:alpha;
  g.drawImage(im,x-a[0]*w,y-a[1]*h,w,h); g.restore();
}
/* the crackling sphere only: the frame cut to a soft circle round the ball, sized to the ball (mockup vshell) */
let off=null, og=null;
function vshell(g,fi,x,y,rad,alpha){
  const im=frame(fi); if(!im) return;
  if(!off){ off=document.createElement('canvas'); og=off.getContext('2d'); }
  const a=anchor(fi), scale=rad/(SR*VW), cr=Math.ceil(rad*3.2), w=VW*scale, h=VH*scale;
  off.width=off.height=cr*2;
  og.globalCompositeOperation='source-over'; og.drawImage(im,cr-a[0]*w,cr-a[1]*h,w,h);
  og.globalCompositeOperation='destination-in';
  const gr=og.createRadialGradient(cr,cr,rad*1.1,cr,cr,cr); gr.addColorStop(0,'#fff'); gr.addColorStop(1,'rgba(255,255,255,0)');
  og.fillStyle=gr; og.fillRect(0,0,cr*2,cr*2);
  g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=alpha; g.drawImage(off,x-cr,y-cr); g.restore();
}
const shellFrame=t=>{ const k=Math.floor(t*24)%28; return 17+(k<14?k:27-k); };   // frames 17-31 ping-pong

/* ── CHARGE (called every hold frame by cine3's drawOverlay) ──
   the clip plays at its native 24 fps so that its 36th frame lands on the release (k = .92) */
FX.hold=function(c,A,k,HMR,bp,rpx){
  const g=A.ctx, H=A.cv.height; if(!g||!FX.ready) return;
  const full=fxScale(H,rpx), t=(k-(0.92-1.5/HMR))*HMR;  // size follows the projected ball, with a screen cap
  if(k<0.92){
    if(t>=0) vframe(g,Math.min(35,Math.floor(t*24)),bp.x,bp.y,full,0.5);
    if(t>1.3) vshell(g,shellFrame(performance.now()/1000),bp.x,bp.y,Math.max(rpx*1.2,8),0.4*ss(1.3,1.5,t));
  } else {
    if(!c._ultraRel) c._ultraRel=performance.now();
    FX.fly(c,0,A,bp,rpx,null);                                       // the release burst starts inside the hold
  }
};

/* steam: sizes and speeds are the mockup's (metres, ball radius 0.11) turned into ball-radius units */
const STEAM=[]; (function(){ let sd=7; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
  for(let i=0;i<46;i++) STEAM.push({t0:0.25+i*0.075+r()*0.08, dx:(r()-.5)*.25, sp:0.25+r()*0.2}); })();
function steam(g,T,bp,rpx){
  const u=rpx/0.11, fade=Math.exp(-(T-0.26)/7);
  g.save(); g.globalCompositeOperation='source-over';
  for(const p of STEAM){ const a=T-p.t0; if(a<=0||a>=3) continue;
    const x=bp.x+p.dx*a*u, y=bp.y-(0.05+a*p.sp)*u, rad=(0.12+a*0.28)*0.5*u;
    const o=0.55*Math.sin(Math.PI*a/3)*fade; if(o<0.004) continue;
    const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,'rgba(223,230,238,'+o.toFixed(3)+')'); gr.addColorStop(1,'rgba(223,230,238,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,rad,0,6.2832); g.fill(); }
  g.restore(); }

/* ── FLIGHT (flyFrame, after the streaks) + the impact frames ── */
FX.fly=function(c,dt,A,bp,rpx,st){
  const g=A.ctx, H=A.cv.height, W=A.cv.width; if(!g||!FX.ready) return;
  if(!c._ultraRel) c._ultraRel=performance.now();
  const full=fxScale(H,rpx), e=(performance.now()-c._ultraRel)/1000;
  // the arrival: a goal's four-frame impact (white / lightning on navy / black burst / lightning / white)
  const arr=st&&st.arr;
  if(arr&&arr.goal&&arr.t<0.26){
    const f=Math.floor(arr.t/0.055);
    if(f===1||f===3){ g.fillStyle='#050a2a'; g.fillRect(0,0,W,H); vframe(g,f===1?39:42,W/2,H/2,Math.max(W/VW,H/VH)*0.85,0.6); return; }
    if(f===2){ g.fillStyle='#000'; g.fillRect(0,0,W,H); const m=Math.min(W,H), M=Math.hypot(W,H);
      g.save(); g.strokeStyle='#fff'; for(let i=0;i<140;i++){ const an=Math.random()*6.283, r0=m*0.07*(0.8+Math.random()*.6);
        g.globalAlpha=0.4+Math.random()*0.6; g.lineWidth=H/520*5*(0.5+Math.random()); g.beginPath();
        g.moveTo(bp.x+Math.cos(an)*r0,bp.y+Math.sin(an)*r0); g.lineTo(bp.x+Math.cos(an)*M,bp.y+Math.sin(an)*M); g.stroke(); }
      g.restore(); g.fillStyle='#fff'; g.beginPath(); g.arc(bp.x,bp.y,m*0.055,0,6.283); g.fill();
      g.strokeStyle='rgb('+tint.map(Math.round).join(',')+')'; g.lineWidth=H/520*6; g.stroke(); return; }
    return;                                                         // frame 0 / 4+: the existing white flash covers it
  }
  // release burst: frames 36-53 at 24 fps, fading out over its last 0.2 s
  if(e<0.75) vframe(g,Math.min(53,36+Math.floor(e*24)),bp.x,bp.y,full,0.5*(1-ss(0.55,0.75,e)));
  // the crackling shell round the ball for the whole flight; fades after the arrival
  const fade=arr?Math.max(0,0.3*Math.exp(-arr.t/0.5)):0.4;
  if(fade>0.02) vshell(g,shellFrame(performance.now()/1000),bp.x,bp.y,Math.max(rpx*1.2,8),fade);
  // Draw smoke last, over the fading ball effect, for the whole net hold.
  if(arr&&arr.goal&&arr.t>0.26) steam(g,arr.t,bp,rpx);
};

/* ============================================================
   SOUND - synthesized in WebAudio (the mockup's cues), its own context.
   thunder crack at the release, a rising charge, a bass drop, rumble + whoosh
   in the chase, near-silence in the slow-mo, crack + boom at the net, steam hiss.
   ============================================================ */
let AC=null, master=null, noiseBuf=null, beds=null, killT=null;
function ctx(){
  if(AC) return AC;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; return null; }
  master=AC.createGain(); master.gain.value=0.8;
  const comp=AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  return AC;
}
function on(){ return !(window.SFX&&SFX.on===false); }
function vol(){ return clamp(((window.SFX&&SFX.master!=null)?SFX.master:0.7)/0.7,0,1.4)*0.8; }
function noise(){ const s=AC.createBufferSource(); s.buffer=noiseBuf; s.loop=true; return s; }
function burst(type,f,dur,v,delay){ const t=AC.currentTime+(delay||0), n=noise(), fl=AC.createBiquadFilter(), g=AC.createGain();
  fl.type=type; fl.frequency.value=f; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  n.connect(fl); fl.connect(g); g.connect(master); n.start(t); n.stop(t+dur+0.05); }
function sweep(f0,f1,dur,v,type){ const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain(); o.type=type||'sine';
  o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.001,t); g.gain.linearRampToValueAtTime(v,t+Math.min(0.02,dur*0.1)); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05); }
function bed(type,f,q){ const n=noise(), fl=AC.createBiquadFilter(), g=AC.createGain(); fl.type=type; fl.frequency.value=f; fl.Q.value=q; g.gain.value=0;
  n.connect(fl); fl.connect(g); g.connect(master); n.start(); return {n,g,fl}; }
function stopBeds(){ if(!beds) return; const t=AC.currentTime;
  Object.values(beds).forEach(b=>{ try{ b.g.gain.setTargetAtTime(0,t,0.08); b.n.stop(t+0.6); }catch(e){} }); beds=null; clearTimeout(killT); }
FX.sfx=function(name,arg){
  if(!on()) return;
  if(name==='stop'){ if(AC) stopBeds(); return; }
  if(!ctx()) return;
  try{ if(AC.state!=='running') AC.resume(); }catch(e){}
  master.gain.value=vol();
  const t=AC.currentTime;
  switch(name){
    case 'ready':                                                    // the meter is full: a short rising two-note chime
      sweep(660,990,0.22,0.22,'triangle'); setTimeout(()=>{ try{ sweep(990,1480,0.3,0.2,'triangle'); }catch(e){} },160); break;
    case 'charge':                                                   // thunder crack, then a rising tone over the whole charge
      burst('highpass',3000,0.22,1.0); burst('lowpass',380,0.9,0.7);
      sweep(70,520,Math.max(0.8,arg||2.4),0.25,'sawtooth'); burst('lowpass',300,Math.max(0.8,arg||2.4),0.22); break;
    case 'release':                                                  // bass drop + crack
      burst('highpass',3500,0.12,0.9); sweep(150,32,0.7,1.0); burst('lowpass',1600,0.3,0.9); break;
    case 'fly':                                                      // chase: rumble + whoosh with crackle
      stopBeds(); beds={rumble:bed('lowpass',160,0.7),whoosh:bed('bandpass',1400,0.9)};
      beds.rumble.g.gain.setTargetAtTime(0.9,t,0.05); beds.whoosh.g.gain.setTargetAtTime(0.45,t,0.05);
      killT=setTimeout(()=>{ try{ stopBeds(); }catch(e){} },9000); break;
    case 'slow':                                                     // slow-mo: near silence, one faint high tone
      if(beds){ beds.rumble.g.gain.setTargetAtTime(0.08,t,0.1); beds.whoosh.g.gain.setTargetAtTime(0,t,0.1); }
      { const o=AC.createOscillator(), g=AC.createGain(); o.frequency.value=5200; g.gain.value=0.012; o.connect(g); g.connect(master); o.start(t); o.stop(t+1.6); } break;
    case 'impact':                                                   // crack + low boom, then the net swish and a steam hiss
      stopBeds(); burst('highpass',2500,0.14,1.2); burst('lowpass',900,0.5,0.9); sweep(90,28,1.6,1.0); burst('bandpass',1800,0.45,0.5,0.08);
      { const n=noise(), fl=AC.createBiquadFilter(), g=AC.createGain(); fl.type='bandpass'; fl.frequency.value=650; fl.Q.value=0.4;
        g.gain.setValueAtTime(0.001,t+0.3); g.gain.linearRampToValueAtTime(0.45,t+0.9); g.gain.linearRampToValueAtTime(0.001,t+5.8);
        n.connect(fl); fl.connect(g); g.connect(master); n.start(t+0.3); n.stop(t+5.9); }
      { const n=noise(), fl=AC.createBiquadFilter(), g=AC.createGain(); fl.type='highpass'; fl.frequency.value=4200;
        g.gain.setValueAtTime(0.001,t+0.5); g.gain.linearRampToValueAtTime(0.1,t+1.0); g.gain.exponentialRampToValueAtTime(0.001,t+5.5);
        n.connect(fl); fl.connect(g); g.connect(master); n.start(t+0.5); n.stop(t+5.6); } break;
  }
};
})();
