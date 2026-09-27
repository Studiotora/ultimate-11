/* ============================================================
   ULT11-SKY  ·  Ultimate Eleven   (author 2026-09-26)
   "Both maps miss a real sky, which makes the light in daytime kind of
   like an IKEA room." Shared by the match renderer (every stadium,
   Santa Fede included) and Marassi Square.

   U11Sky.create(THREE,{radius, encode, mode})  ->  sky
     sky.mesh            BackSide dome; keep it centred on the camera
     sky.update(t,camPos)
     sky.setMode('day'|'golden'|'night')  loads that preset
     sky.set({...})      any param below (colours as '#rrggbb' sRGB)
     sky.setSun(vec3)    direction TOWARD the sun (world)
     sky.horizon()       THREE.Color of the horizon (sRGB) for fog/haze
     sky.params          live values (the tuning panel edits these)
   U11Sky.panel({title, sky, extras, storageKey})   ?skylab=1 tuning panel
     extras: [{key,label,min,max,step,get(),set(v)}]  map-owned sliders

   The dome is painted like HD-2D background art rather than a physical
   sky: a zenith-to-horizon gradient, a bright hazy band on the horizon,
   the sun disc + glow where the key light really is, a layer of drifting
   pixel clouds shaded from the sun side, and a posterize + ordered-dither
   finish so the gradients break into bands like painted pixels.
   `encode`: true for renderers with sRGB output (Marassi), false for the
   match renderer's legacy LinearEncoding pipeline (colours are display
   values there). Tone mapping is skipped either way: the colours on the
   panel are the colours on screen.
   ============================================================ */
(function(){
'use strict';
const PRESETS={
  day:   {zen:'#2d6cc0',mid:'#5f9ad6',hor:'#cfe2ef',gnd:'#8c949a',sunCol:'#fff3dc',sunSize:0.030,sunGlow:0.55,
          haze:0.55,curve:0.55,cloud:0.44,cloudScale:1.25,cloudSpeed:0.010,cloudCol:'#ffffff',cloudShade:'#9eb2c9',
          cloudLo:0.0,pix:170,bands:44,bright:1.0,overcast:0,stars:0,moon:0,soft:0},
  golden:{zen:'#2f4f8c',mid:'#7a86b4',hor:'#f6bd86',gnd:'#6a5d58',sunCol:'#ffc47a',sunSize:0.036,sunGlow:0.95,
          haze:0.75,curve:0.62,cloud:0.40,cloudScale:1.25,cloudSpeed:0.008,cloudCol:'#ffe1bd',cloudShade:'#8d7f98',
          cloudLo:0.0,pix:170,bands:44,bright:1.0,overcast:0,stars:0,moon:0},
  night: {zen:'#03061a',mid:'#0b1634',hor:'#1f3056',gnd:'#070a12',sunCol:'#c9d8ff',sunSize:0.018,sunGlow:0.10,
          haze:0.35,curve:0.5,cloud:0.26,cloudScale:1.25,cloudSpeed:0.006,cloudCol:'#28385a',cloudShade:'#0c1428',
          cloudLo:0.05,pix:170,bands:40,bright:1.0,overcast:0,stars:1,moon:1}
};
const COLS=['zen','mid','hor','gnd','sunCol','cloudCol','cloudShade'];

const VS=`varying vec3 vDir; void main(){ vDir=position; vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }`;
const FS=`
uniform vec3 zen,mid,hor,gnd,sunCol,cloudCol,cloudShade,sunDir;
uniform float sunSize,sunGlow,haze,curve,cloud,cloudScale,time,cloudSpeed,cloudLo,pix,bands,bright,overcast,stars,moon,enc,soft;
varying vec3 vDir;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
float bayer(vec2 p){ vec2 q=mod(floor(p),4.0); float i=q.x+q.y*4.0;
  return fract(sin(i*12.9898)*43758.5453)*0.0+ ( i==0.?0.:i==1.?8.:i==2.?2.:i==3.?10.:i==4.?12.:i==5.?4.:i==6.?14.:i==7.?6.:i==8.?3.:i==9.?11.:i==10.?1.:i==11.?9.:i==12.?15.:i==13.?7.:i==14.?13.:5.)/16.0; }
void main(){
  vec3 d=normalize(vDir);
  // PIXEL: quantize the view direction on an angular grid -> blocky clouds / stars
  float az=atan(d.z,d.x), el=asin(clamp(d.y,-1.0,1.0));
  if(pix>0.0){ az=(floor(az*pix)+0.5)/pix; el=(floor(el*pix)+0.5)/pix; }
  vec3 q=vec3(cos(el)*cos(az),sin(el),cos(el)*sin(az));
  float h=q.y;
  // gradient: horizon -> mid -> zenith, ground below the horizon
  float t=pow(clamp(h,0.0,1.0),curve);
  vec3 col=t<0.5?mix(hor,mid,t*2.0):mix(mid,zen,(t-0.5)*2.0);
  col=mix(col,gnd,smoothstep(0.0,-0.18,h));
  // hazy bright band right on the horizon
  col=mix(col,mix(hor,vec3(1.0),0.35),haze*exp(-abs(h)*18.0)*0.6);
  // sun
  vec3 sd=normalize(sunDir); float cs=dot(q,sd);
  float glow=pow(max(cs,0.0),6.0)*0.35+pow(max(cs,0.0),48.0)*0.9;
  col+=sunCol*glow*sunGlow*(1.0-overcast*0.7);
  float disc=smoothstep(cos(sunSize),cos(sunSize*0.55),cs);
  // clouds: a flat layer above us, projected, drifting; shaded from the sun side
  float cm=0.0;
  if(h>0.0&&cloud>0.001){
    vec3 qc=soft>0.5?d:q;                                    // soft clouds skip the pixel grid
    vec2 p=qc.xz/(max(qc.y,0.0)+0.18)*cloudScale+vec2(time*cloudSpeed,time*cloudSpeed*0.35);
    float c1=fbm(p), c2=fbm(p+sd.xz*0.09);
    float cov=clamp(cloud+overcast*0.55,0.0,1.0);
    cm=smoothstep(1.0-cov,1.0-cov+mix(0.14,0.42,soft),c1)*smoothstep(cloudLo,cloudLo+0.09,h);
    float lit=clamp(0.55+(c1-c2)*5.0,0.0,1.0);
    lit=mix(floor(lit*3.0+0.5)/3.0,lit,soft);                // three painted tones (soft: smooth)
    vec3 cc=mix(cloudShade,cloudCol,lit)+sunCol*glow*0.35;
    col=mix(col,cc,cm*0.96);
  }
  col=mix(col,sunCol*1.15,disc*(1.0-cm*0.85)*(1.0-overcast));
  // stars + moon (night)
  if(stars>0.0&&h>0.02){
    vec2 sg=floor(vec2(az,el)*pix*0.5); float s=h21(sg);
    float tw=0.6+0.4*sin(time*2.0+s*50.0);
    col+=vec3(0.85,0.9,1.0)*step(0.992,s)*stars*tw*smoothstep(0.02,0.25,h)*(1.0-cm);
  }
  if(moon>0.0){ vec3 md=normalize(vec3(-sd.x,max(0.35,abs(sd.y)),-sd.z));
    float mc=dot(q,md); col+=vec3(0.85,0.9,1.0)*moon*(smoothstep(cos(0.03),cos(0.022),mc)+pow(max(mc,0.0),80.0)*0.25)*(1.0-cm*0.8); }
  // overcast: grey it down, flatten
  float L=dot(col,vec3(0.299,0.587,0.114));
  col=mix(col,vec3(L)*vec3(0.92,0.95,1.0)*0.92,overcast*0.85);
  col*=bright;
  // HD-2D finish: posterize with an ordered dither so gradients band like pixels
  if(bands>0.0){ float b=bayer(gl_FragCoord.xy/2.0)-0.5; col=floor(col*bands+0.5+b*0.9)/bands; }
  col=clamp(col,0.0,1.0);
  if(enc>0.5) col=pow(col,vec3(2.2));
  gl_FragColor=linearToOutputTexel(vec4(col,1.0));
}`;

function create(T,o){
  o=o||{};
  const U={time:{value:0},sunDir:{value:new T.Vector3(0.4,0.5,-0.7)},enc:{value:o.encode?1:0}};
  const params={};
  const mat=new T.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,side:T.BackSide,depthWrite:false,depthTest:true,fog:false,toneMapped:false});
  const mesh=new T.Mesh(new T.SphereGeometry(o.radius||800,48,24),mat);
  mesh.name='U11Sky'; mesh.renderOrder=-20; mesh.frustumCulled=false;
  const sky={mesh,params,mode:null};
  sky.set=function(p){ for(const k in p){ const v=p[k]; params[k]=v;
      if(!U[k]) U[k]={value:COLS.includes(k)?new T.Color():0};
      if(COLS.includes(k)) U[k].value.set(v); else U[k].value=+v; }
    return sky; };
  sky.setMode=function(m){ m=PRESETS[m]?m:'day'; sky.mode=m;
    const saved=sky._saved&&sky._saved[m]; sky.set(Object.assign({},PRESETS[m],saved||{})); return sky; };
  sky.setSun=function(v){ if(v&&v.lengthSq()>0) U.sunDir.value.copy(v).normalize(); return sky; };
  sky.update=function(t,camPos){ U.time.value=t; if(camPos) mesh.position.copy(camPos); };
  sky.horizon=function(){ return new T.Color(params.hor||'#cfe2ef'); };
  sky.preset=m=>Object.assign({},PRESETS[m]);
  // per-mode tuned values saved by the panel (per viewer, this browser only)
  sky._saved={}; if(o.storageKey) try{ sky._saved=JSON.parse(localStorage.getItem(o.storageKey)||'{}')||{}; }catch(e){}
  sky._storageKey=o.storageKey||null;
  sky.setMode(o.mode||'day');
  return sky;
}

/* ── ?skylab=1 tuning panel (the Camera Lab way: sliders -> copy values) ── */
function panel(o){
  const sky=o.sky; if(!sky) return null;
  const q=new URLSearchParams(location.search); if(q.get('skylab')!=='1'&&!o.force) return null;
  const box=document.createElement('div');
  box.style.cssText='position:fixed;right:10px;top:60px;z-index:2147483600;width:290px;max-height:84vh;overflow:auto;padding:10px 12px;'+
    'background:rgba(8,12,22,.9);border:1px solid rgba(240,192,64,.45);border-radius:6px;color:#dfe6ef;'+
    "font:600 11px 'Rajdhani',system-ui,sans-serif;letter-spacing:.04em";
  const head=document.createElement('div'); head.textContent=(o.title||'SKY LAB')+' · '+(sky.mode||'').toUpperCase();
  head.style.cssText="font:700 13px 'Cinzel',serif;color:#f0c040;margin-bottom:6px;cursor:pointer";
  box.appendChild(head);
  const body=document.createElement('div'); box.appendChild(body);
  head.onclick=()=>{ body.style.display=body.style.display==='none'?'block':'none'; };
  const save=()=>{ if(!sky._storageKey) return; try{ sky._saved[sky.mode]=Object.assign({},sky.params); localStorage.setItem(sky._storageKey,JSON.stringify(sky._saved)); }catch(e){} };
  const row=(label,input)=>{ const r=document.createElement('label'); r.style.cssText='display:flex;align-items:center;gap:6px;margin:3px 0';
    const s=document.createElement('span'); s.textContent=label; s.style.cssText='width:88px;flex:none'; r.appendChild(s); r.appendChild(input); body.appendChild(r); return r; };
  const sec=t=>{ const h=document.createElement('div'); h.textContent=t; h.style.cssText='margin:8px 0 2px;color:#f0c040;font-weight:700'; body.appendChild(h); };
  const slider=(label,min,max,step,get,set)=>{ const i=document.createElement('input'); i.type='range'; i.min=min; i.max=max; i.step=step; i.value=get(); i.style.cssText='flex:1;min-width:0';
    const v=document.createElement('span'); v.style.cssText='width:36px;text-align:right'; v.textContent=(+get()).toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
    i.oninput=()=>{ set(+i.value); v.textContent=(+i.value).toFixed(3).replace(/0+$/,'').replace(/\.$/,''); save(); };
    const r=row(label,i); r.appendChild(v); return i; };
  const color=(label,key)=>{ const i=document.createElement('input'); i.type='color'; i.value=sky.params[key]; i.style.cssText='flex:1;height:18px;border:0;background:none';
    i.oninput=()=>{ sky.set({[key]:i.value}); save(); }; row(label,i); return i; };
  const ctl=[];
  const build=()=>{ body.innerHTML=''; head.textContent=(o.title||'SKY LAB')+' · '+(sky.mode||'').toUpperCase();
    sec('SKY COLOURS'); [['Zenith','zen'],['Mid sky','mid'],['Horizon','hor'],['Below horizon','gnd'],['Sun','sunCol'],['Cloud lit','cloudCol'],['Cloud shade','cloudShade']].forEach(([l,k])=>color(l,k));
    sec('SKY SHAPE');
    [['Gradient curve','curve',0.2,1.5,0.01],['Horizon haze','haze',0,1.5,0.01],['Sun size','sunSize',0.005,0.1,0.001],['Sun glow','sunGlow',0,2,0.01],
     ['Clouds','cloud',0,1,0.01],['Cloud scale','cloudScale',0.3,4,0.01],['Cloud speed','cloudSpeed',0,0.05,0.001],['Cloud base','cloudLo',0,0.4,0.01],
     ['Soft clouds','soft',0,1,0.01],['Pixel grid','pix',0,400,1],['Colour bands','bands',0,96,1],['Brightness','bright',0.4,1.6,0.01],['Overcast','overcast',0,1,0.01],['Stars','stars',0,1.5,0.01],['Moon','moon',0,1.5,0.01]]
      .forEach(([l,k,a,b,s])=>slider(l,a,b,s,()=>sky.params[k],v=>sky.set({[k]:v})));
    if(o.extras&&o.extras.length){ sec(o.extrasTitle||'LIGHT'); o.extras.forEach(e=>slider(e.label,e.min,e.max,e.step,e.get,v=>{ e.set(v); save(); })); }
    const b=document.createElement('button'); b.textContent='COPY FINAL VALUES';
    b.style.cssText="margin-top:10px;width:100%;padding:6px;background:#f0c040;color:#111;border:0;border-radius:4px;font:700 11px 'Rajdhani',sans-serif;cursor:pointer";
    b.onclick=()=>{ const out={mode:sky.mode,sky:sky.params}; if(o.extras) out.light=Object.fromEntries(o.extras.map(e=>[e.key,+(+e.get()).toFixed(3)]));
      const txt=JSON.stringify(out); try{ navigator.clipboard.writeText(txt); b.textContent='COPIED'; setTimeout(()=>b.textContent='COPY FINAL VALUES',1200); }catch(e){ prompt('Values',txt); } };
    body.appendChild(b);
    const r=document.createElement('button'); r.textContent='RESET THIS MODE';
    r.style.cssText="margin-top:4px;width:100%;padding:5px;background:transparent;color:#cfd8e3;border:1px solid rgba(240,192,64,.4);border-radius:4px;font:600 11px 'Rajdhani',sans-serif;cursor:pointer";
    r.onclick=()=>{ try{ delete sky._saved[sky.mode]; if(sky._storageKey) localStorage.setItem(sky._storageKey,JSON.stringify(sky._saved)); }catch(e){} sky.setMode(sky.mode); build(); };
    body.appendChild(r);
  };
  build(); document.body.appendChild(box);
  sky._panelRebuild=build;              // the map calls this after a day/night switch
  return box;
}
window.U11Sky={create,panel,presets:PRESETS};
})();
