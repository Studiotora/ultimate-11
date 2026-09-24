/* ============================================================
   ULT11-TEAMSELECT · Ultimate Eleven                    2026-09-23
   The Team Select screen, from the approved lab mockup
   (lab/lab-teamselect.html). Load AFTER game.js: it takes over
   syncTeamSelections(), so showSc('s-ts') draws this screen. The old
   FIFA-style block at the end of game.js is now dead code.

   Layout (1920x1080 design, scaled to fit #s-ts): stadium background,
   a waving flag behind each side (two open wings), captain art, team
   name (Cinzel), OVR + ATT/MID/DEF/SPD, 2 kit tiles (AWAY = NOT
   AVAILABLE for now), the team's idle sprite on the grass, category
   tabs and a flag/crest carousel.

   Rules: fonts are ONLY Cinzel / Rajdhani / Bold Pixel (tokens.css).
   No tagline text. Numbers in Bold Pixel with font-synthesis:none.

   Input: pad/keys arrive through game.js's menu nav (_navStep /
   _navConfirm / _navBack delegate here while this screen is up), plus
   L1/R1 (SWITCH / SPRINT) for the category and square (SHOOT) for
   random. Mouse / touch: tabs, carousel, arrows and footer hints.
   ============================================================ */
(function(){
'use strict';

/* ── flags (national teams). [dir, colours...] = stripes; strings = drawn.
   Anything missing falls back to stripes in the supporter palette. ── */
const FLAGS={
  italy:['v','#1f8f4c','#ffffff','#d6303b'], france:['v','#1f3f9c','#ffffff','#e0303b'],
  ireland:['v','#1f8f4c','#ffffff','#f08a2a'], belgium:['v','#1b1b1b','#f3d23a','#dd2a2a'],
  germany:['h','#1b1b1b','#dd2a2a','#f3c33a'], holland:['h','#b0242f','#ffffff','#1f3f8f'],
  netherlands:['h','#b0242f','#ffffff','#1f3f8f'], austria:['h','#c8202f','#ffffff','#c8202f'],
  croatia:['h','#d6303b','#ffffff','#1f3f9c'], uruguay:['h','#ffffff','#5b8ed8','#ffffff','#5b8ed8','#ffffff'],
  argentina:'argentina', brazil:'brazil', england:'england', spain:'spain', japan:'japan', portugal:'portugal',
  usa:'usa', scotland:'scotland', wales:'wales', switzerland:'switzerland', sweden:'sweden', china:'china',
  northkorea:'northkorea', morocco:'morocco', norway:'norway', panama:'panama'
};
function stripes(f){ const d=f[0], c=f.slice(1), n=c.length;
  return c.map((col,i)=>d==='v'?'<rect x="'+(90/n*i)+'" y="0" width="'+(90/n+.5)+'" height="60" fill="'+col+'"/>'
                               :'<rect x="0" y="'+(60/n*i)+'" width="90" height="'+(60/n+.5)+'" fill="'+col+'"/>').join(''); }
const cross=(bg,fg,x,w)=>'<rect width="90" height="60" fill="'+bg+'"/><rect x="'+x+'" width="'+w+'" height="60" fill="'+fg+'"/><rect y="'+(30-w/2)+'" width="90" height="'+w+'" fill="'+fg+'"/>';
const DRAW={
  argentina:stripes(['h','#75aadb','#ffffff','#75aadb'])+'<circle cx="45" cy="30" r="6" fill="#f3c33a"/>',
  brazil:'<rect width="90" height="60" fill="#1f9a4c"/><polygon points="45,7 83,30 45,53 7,30" fill="#f3d23a"/><circle cx="45" cy="30" r="12" fill="#1f3f9c"/>',
  england:'<rect width="90" height="60" fill="#fff"/><rect x="39" width="12" height="60" fill="#d6303b"/><rect y="24" width="90" height="12" fill="#d6303b"/>',
  spain:'<rect width="90" height="60" fill="#c8202f"/><rect y="15" width="90" height="30" fill="#f3c33a"/>',
  japan:'<rect width="90" height="60" fill="#fff"/><circle cx="45" cy="30" r="16" fill="#c8202f"/>',
  portugal:'<rect width="90" height="60" fill="#d6303b"/><rect width="36" height="60" fill="#1f6a3a"/><circle cx="36" cy="30" r="11" fill="#f3c33a"/><circle cx="36" cy="30" r="7" fill="#d6303b"/>',
  usa:stripes(['h','#b8202f','#ffffff','#b8202f','#ffffff','#b8202f','#ffffff','#b8202f'])+'<rect width="40" height="32" fill="#1b2c52"/>',
  scotland:'<rect width="90" height="60" fill="#1f5aa8"/><path d="M0 0L90 60M90 0L0 60" stroke="#fff" stroke-width="10"/>',
  wales:'<rect width="90" height="30" fill="#fff"/><rect y="30" width="90" height="30" fill="#1f9a4c"/><path d="M28 40 L40 22 L52 30 L64 20 L60 38 L44 44 Z" fill="#d6303b"/>',
  switzerland:'<rect width="90" height="60" fill="#d6303b"/><rect x="39" y="14" width="12" height="32" fill="#fff"/><rect x="29" y="24" width="32" height="12" fill="#fff"/>',
  sweden:cross('#1f5aa8','#f3c33a',28,12), norway:cross('#c8202f','#ffffff',24,16)+'<rect x="28" width="8" height="60" fill="#1f3f8f"/><rect y="26" width="90" height="8" fill="#1f3f8f"/>',
  china:'<rect width="90" height="60" fill="#d6303b"/><circle cx="18" cy="16" r="7" fill="#f3d23a"/><circle cx="32" cy="8" r="2.4" fill="#f3d23a"/><circle cx="36" cy="16" r="2.4" fill="#f3d23a"/><circle cx="34" cy="24" r="2.4" fill="#f3d23a"/>',
  northkorea:'<rect width="90" height="60" fill="#1f3f9c"/><rect y="9" width="90" height="42" fill="#fff"/><rect y="12" width="90" height="36" fill="#d6303b"/><circle cx="30" cy="30" r="10" fill="#fff"/>',
  morocco:'<rect width="90" height="60" fill="#c8202f"/><polygon points="45,18 49,30 60,30 51,37 54,48 45,41 36,48 39,37 30,30 41,30" fill="none" stroke="#1f6a3a" stroke-width="2.5"/>',
  panama:'<rect width="45" height="30" fill="#fff"/><rect x="45" width="45" height="30" fill="#d6303b"/><rect y="30" width="45" height="30" fill="#1f3f9c"/><rect x="45" y="30" width="45" height="30" fill="#fff"/>'
};

/* ── game data ── */
const CAT_ORDER=['nat','club','special'];
const CAT_SUB={nat:'National team',club:'Club',special:'Special team'};
function catKeys(cat){
  if(cat==='club'){ Object.keys(CR_CLUBS).forEach(k=>{ try{ crBuildClubTeam(k); }catch(e){} }); return Object.keys(CR_CLUBS).filter(k=>T[k]); }
  if(cat==='special') return ['allstar'].filter(k=>T[k]);
  return _natKeys.filter(k=>k!=='allstar'&&T[k]);
}
function catOf(key){ return CR_CLUBS[key]?'club':(key==='allstar'?'special':'nat'); }
function starters(t){ const r=new Set(t.reserves||[]); return t.p.filter(p=>!r.has(p.id)).slice(0,11); }
function teamStats(key){
  const t=T[key]; const s=starters(t);
  const avg=(arr,f)=>{ const a=s.filter(p=>arr.indexOf(p.pos)>-1); return a.length?Math.round(a.reduce((x,p)=>x+f(p),0)/a.length):0; };
  const ov=p=>+calcOvr(p)||0;
  const out=s.filter(p=>p.pos!=='GK');
  return { ovr:calcTeamOvr(t), att:avg(['LW','ST','RW'],ov), mid:avg(['CM1','CM2','CM3'],ov),
           def:avg(['GK','LB','CB1','CB2','RB'],ov), spd:out.length?Math.round(out.reduce((x,p)=>x+(+gs(p,'spd')||0),0)/out.length):0 };
}
function palette(key){
  if(CR_CLUBS[key]&&CR_CLUBS[key].colors){ const c=CR_CLUBS[key].colors; return [c[0],c[1]||'#ffffff']; }
  try{ if(window.U11_CLASSIC&&U11_CLASSIC.supporterPalette){ const p=U11_CLASSIC.supporterPalette(key,'#2f8cff'); return [p[0],p[1]]; } }catch(e){}
  return ['#2f8cff','#ffffff'];
}
function lum(hex){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  return (0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255; }
function flagSpec(key){ if(FLAGS[key]) return FLAGS[key]; const p=palette(key); return ['v',p[0],p[1],p[0],p[1]]; }
function flagInner(f){ return Array.isArray(f)?stripes(f):(DRAW[f]||''); }
function flagSVG(f){ return '<svg class="fl" viewBox="0 0 90 60" preserveAspectRatio="none">'+flagInner(f)+'</svg>'; }
function flagBG(f){ return 'url("data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60" preserveAspectRatio="none">'+flagInner(f)+'</svg>')+'") center/100% 100%'; }
function shirtSVG(key){ const p=palette(key), body=p[0], trim=p[1], num=lum(body)>0.6?'#1b1b1b':'#ffffff';
  return '<svg viewBox="0 0 120 120"><path d="M38 10 L22 16 L4 38 L18 52 L28 44 L28 112 L92 112 L92 44 L102 52 L116 38 L98 16 L82 10 C78 20 70 24 60 24 C50 24 42 20 38 10 Z" fill="'+body+'" stroke="rgba(0,0,0,.35)" stroke-width="2"/>'+
    '<path d="M38 10 C42 20 50 24 60 24 C70 24 78 20 82 10 L76 8 C72 16 66 18 60 18 C54 18 48 16 44 8 Z" fill="'+trim+'"/>'+
    '<path d="M4 38 L18 52 L21 49 L7 35 Z M116 38 L102 52 L99 49 L113 35 Z" fill="'+trim+'"/>'+
    '<text x="60" y="84" text-anchor="middle" font-family="Rajdhani,sans-serif" font-weight="700" font-size="40" fill="'+num+'">10</text></svg>'; }

/* ── sprites: the same sheet pitch3d uses (assets/ps1/{key}.png, else the
   home / away sheet), row 0 = idle, 12 frames. Content box measured once. ── */
const SW=12, SH=8, SHEETS={};
function sheetFor(key,side){
  const id=key+':'+side; if(SHEETS[id]) return SHEETS[id];
  const o={img:new Image(),ok:false,box:null}; SHEETS[id]=o;
  o.img.onload=function(){ try{
      const im=o.img, cw=im.width/SW, ch=im.height/SH, c=document.createElement('canvas');
      c.width=im.width; c.height=Math.ceil(ch); const x=c.getContext('2d',{willReadFrequently:true});
      x.drawImage(im,0,0,im.width,ch,0,0,im.width,ch); const d=x.getImageData(0,0,c.width,c.height).data;
      let x0=1e9,x1=-1,y0=1e9,y1=-1;
      for(let f=0;f<SW;f++) for(let y=0;y<c.height;y+=2) for(let xx=Math.floor(f*cw);xx<Math.floor((f+1)*cw);xx+=2){
        if(d[(y*c.width+xx)*4+3]>40){ const lx=xx-f*cw; if(lx<x0)x0=lx; if(lx>x1)x1=lx; if(y<y0)y0=y; if(y>y1)y1=y; } }
      if(x1<0) throw 0;
      o.box={x:Math.max(0,x0-6),y:Math.max(0,y0-6),w:(x1-x0)+12,h:(y1-y0)+12,cw:cw}; o.ok=true;
    }catch(e){ const cw=o.img.width/SW; o.box={x:0,y:0,w:cw,h:o.img.height/SH,cw:cw}; o.ok=true; } };
  let tried=false;
  o.img.onerror=function(){ if(tried) return; tried=true; o.img.src='assets/ps1/'+(side==='h'?'home':'away')+'.png'; };
  o.img.src='assets/ps1/'+key+'.png';
  return o;
}
function drawSprite(cv,key,side,frame,flip){
  const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); g.imageSmoothingEnabled=false;
  const s=sheetFor(key,side); if(!s.ok) return; const b=s.box;
  const k=Math.min(cv.width/b.w,cv.height/b.h), w=b.w*k, h=b.h*k;
  g.save(); if(flip){ g.translate(cv.width,0); g.scale(-1,1); }
  g.drawImage(s.img,frame*b.cw+b.x,b.y,b.w,b.h,(cv.width-w)/2,cv.height-h,w,h); g.restore();
}

/* ── CSS (scoped to #s-ts .ts2; injected so a cached stylesheet cannot hide it) ── */
function ensureCss(){
  if(document.getElementById('ts2-css')) return;
  const st=document.createElement('style'); st.id='ts2-css';
  st.textContent=`
#s-ts .ts2{position:absolute;inset:0;overflow:hidden;background:#030a18;color:#fbfbfc;font-family:'Rajdhani',system-ui,sans-serif;
  --home:#2f8cff;--home-glow:rgba(47,140,255,.75);--away-glow:rgba(233,238,246,.6);--panel:rgba(2,10,26,.78);--rule:rgba(38,126,226,.45);--dim:#9fb2cc;--mute:#48586a}
#s-ts .ts2-stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform-origin:center}
#s-ts .ts2 .bg{position:absolute;inset:0;background:url('assets/wallpaper/teamselect2.jpg') center -110px/1920px auto no-repeat;background-color:#030a18;filter:saturate(.95) brightness(.78)}
#s-ts .ts2 .bg::after{content:"";position:absolute;inset:0;
  background:radial-gradient(ellipse 60% 55% at 50% 42%,rgba(3,10,24,0) 0%,rgba(3,10,24,.55) 70%,rgba(3,10,24,.9) 100%),
             linear-gradient(to bottom,rgba(3,10,24,.55) 0%,rgba(3,10,24,0) 18%,rgba(3,10,24,0) 68%,rgba(3,10,24,.96) 82%)}
#s-ts .ts2 .flagwave{position:absolute;top:40px;width:900px;height:620px;opacity:.55;pointer-events:none}
#s-ts .ts2 .flagwave.l{left:-120px;transform:skewY(8deg) rotate(4deg);-webkit-mask:linear-gradient(to right,#000 25%,transparent 92%);mask:linear-gradient(to right,#000 25%,transparent 92%)}
#s-ts .ts2 .flagwave.r{right:-120px;transform:skewY(-8deg) rotate(-4deg);-webkit-mask:linear-gradient(to left,#000 25%,transparent 92%);mask:linear-gradient(to left,#000 25%,transparent 92%)}
#s-ts .ts2 .flagwave .cloth{position:absolute;inset:-4%;animation:ts2Sway 4.6s ease-in-out infinite;transform-origin:0 50%}
#s-ts .ts2 .flagwave.r .cloth{transform-origin:100% 50%;animation-name:ts2SwayR;animation-delay:-2.3s}
#s-ts .ts2 .flagwave .fold,#s-ts .ts2 .flagwave .shine{position:absolute;inset:0;background-size:260px 100%;animation:ts2Roll 2.6s linear infinite}
#s-ts .ts2 .flagwave .fold{mix-blend-mode:multiply;background-image:linear-gradient(90deg,rgba(0,0,0,0) 0,rgba(0,0,0,.42) 45%,rgba(0,0,0,0) 100%)}
#s-ts .ts2 .flagwave .shine{mix-blend-mode:screen;opacity:.5;animation-delay:-1.3s;background-image:linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,.28) 50%,rgba(255,255,255,0) 100%)}
#s-ts .ts2 .flagwave.r .fold,#s-ts .ts2 .flagwave.r .shine{animation-direction:reverse}
@keyframes ts2Roll{from{background-position:0 0}to{background-position:260px 0}}
@keyframes ts2Sway{0%,100%{transform:skewY(0deg) scaleX(1)}50%{transform:skewY(1.6deg) scaleX(1.025)}}
@keyframes ts2SwayR{0%,100%{transform:skewY(0deg) scaleX(1)}50%{transform:skewY(-1.6deg) scaleX(1.025)}}
@media (prefers-reduced-motion:reduce){#s-ts .ts2 .flagwave .cloth,#s-ts .ts2 .flagwave .fold,#s-ts .ts2 .flagwave .shine{animation:none}}
#s-ts .ts2 .cap{position:absolute;bottom:236px;height:1000px;width:760px;background-repeat:no-repeat;background-size:contain;
  -webkit-mask:linear-gradient(to bottom,#000 58%,rgba(0,0,0,.35) 74%,transparent 90%);mask:linear-gradient(to bottom,#000 58%,rgba(0,0,0,.35) 74%,transparent 90%);
  filter:drop-shadow(0 0 40px rgba(0,0,0,.6))}
#s-ts .ts2 .cap.l{left:360px;background-position:bottom right}
#s-ts .ts2 .cap.r{right:360px;background-position:bottom left}
#s-ts .ts2 .title{position:absolute;left:0;right:0;top:40px;text-align:center}
#s-ts .ts2 .title h1{margin:0;font:700 34px/1 'Cinzel',serif;letter-spacing:.32em}
#s-ts .ts2 .title p{margin:10px 0 0;font:700 15px/1 'Rajdhani';letter-spacing:.42em;color:var(--dim)}
#s-ts .ts2 .side{position:absolute;top:260px;width:560px}
#s-ts .ts2 .side.l{left:70px}
#s-ts .ts2 .side.r{right:70px;text-align:right}
#s-ts .ts2 .tname{font:900 96px/1 'Cinzel',serif;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;text-shadow:0 4px 0 rgba(0,0,0,.5),0 0 30px rgba(0,0,0,.7)}
#s-ts .ts2 .sub{margin-top:8px;font:700 15px/1 'Rajdhani';letter-spacing:.34em;color:var(--dim);text-transform:uppercase}
#s-ts .ts2 .info{margin-top:30px;display:inline-flex;gap:28px;align-items:center;padding:16px 22px 16px 16px;background:linear-gradient(90deg,rgba(2,10,26,.82),rgba(2,10,26,.55));border:1px solid rgba(255,255,255,.07)}
#s-ts .ts2 .side.r .info{flex-direction:row-reverse;padding:16px 16px 16px 22px;background:linear-gradient(270deg,rgba(2,10,26,.82),rgba(2,10,26,.55))}
#s-ts .ts2 .ovr{width:132px;height:132px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--panel)}
#s-ts .ts2 .side.l .ovr{border:2px solid var(--home);box-shadow:0 0 22px var(--home-glow),inset 0 0 20px rgba(47,140,255,.2)}
#s-ts .ts2 .side.r .ovr{border:2px solid #fff;box-shadow:0 0 22px var(--away-glow),inset 0 0 20px rgba(255,255,255,.14)}
#s-ts .ts2 .ovr b{font:400 68px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-ts .ts2 .ovr span{font:700 16px/1 'Rajdhani';letter-spacing:.32em;color:var(--dim)}
#s-ts .ts2 .stats{display:grid;grid-template-columns:62px 170px 48px;gap:10px 16px;align-items:center;font:600 22px/1 'Rajdhani';text-align:left}
#s-ts .ts2 .stats .k{color:#dfe7f3;letter-spacing:.04em}
#s-ts .ts2 .stats .bar{height:12px;background:rgba(255,255,255,.12);position:relative}
#s-ts .ts2 .stats .bar i{position:absolute;left:0;top:0;bottom:0;transition:width .35s cubic-bezier(.3,.8,.4,1)}
#s-ts .ts2 .side.l .bar i{background:linear-gradient(90deg,#1b6fe0,#57b0ff);box-shadow:0 0 10px var(--home-glow)}
#s-ts .ts2 .side.r .bar i{background:linear-gradient(90deg,#b9c3d1,#fff);box-shadow:0 0 10px var(--away-glow)}
#s-ts .ts2 .stats .v{font:400 24px/1 'Bold Pixel',monospace;font-synthesis:none;text-align:right}
#s-ts .ts2 .kits{position:absolute;top:606px;display:flex;gap:14px}
#s-ts .ts2 .kits.l{left:70px}
#s-ts .ts2 .kits.r{right:70px}
#s-ts .ts2 .kit{width:152px;height:152px;position:relative;background:var(--panel);border:1px solid rgba(255,255,255,.1)}
#s-ts .ts2 .kit svg{position:absolute;inset:10px 14px 14px}
#s-ts .ts2 .kit .cap2{position:absolute;left:0;right:0;top:166px;text-align:center;font:600 18px/1 'Rajdhani';letter-spacing:.08em;color:var(--dim)}
#s-ts .ts2 .kit.sel .cap2{color:#fff;font-weight:700}
#s-ts .ts2 .kits.l .kit.sel{border:2px solid var(--home);box-shadow:0 0 22px var(--home-glow),inset 0 0 22px rgba(47,140,255,.25)}
#s-ts .ts2 .kits.r .kit.sel{border:2px solid #fff;box-shadow:0 0 22px var(--away-glow),inset 0 0 22px rgba(255,255,255,.18)}
#s-ts .ts2 .kit.na .naw{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font:700 17px/1.25 'Rajdhani';letter-spacing:.14em;color:var(--mute);
  background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 10px,rgba(255,255,255,0) 10px 20px)}
#s-ts .ts2 .spr{position:absolute;bottom:330px;width:180px;height:234px}
#s-ts .ts2 .spr.l{left:625px}
#s-ts .ts2 .spr.r{right:625px}
#s-ts .ts2 .spr canvas{width:100%;height:100%;image-rendering:pixelated}
#s-ts .ts2 .spr.l canvas{filter:drop-shadow(0 0 18px rgba(47,140,255,.55)) drop-shadow(0 10px 6px rgba(0,0,0,.55))}
#s-ts .ts2 .spr.r canvas{filter:drop-shadow(0 0 18px rgba(255,255,255,.4)) drop-shadow(0 10px 6px rgba(0,0,0,.55))}
#s-ts .ts2 .spr .shadow{position:absolute;left:50%;bottom:-6px;width:150px;height:26px;margin-left:-75px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.55),rgba(0,0,0,0) 70%)}
#s-ts .ts2 .arr{position:absolute;bottom:420px;width:0;height:0;border-top:22px solid transparent;border-bottom:22px solid transparent;opacity:.18}
#s-ts .ts2 .arr.pl{left:585px;border-right:26px solid var(--home)}
#s-ts .ts2 .arr.nl{left:815px;border-left:26px solid var(--home)}
#s-ts .ts2 .arr.pr{right:815px;border-right:26px solid #fff}
#s-ts .ts2 .arr.nr{right:585px;border-left:26px solid #fff}
#s-ts .ts2 .cats{position:absolute;left:0;right:0;top:792px;display:flex;justify-content:center;gap:10px;align-items:center}
#s-ts .ts2 .cats .bump{font:400 15px/1 'Bold Pixel',monospace;font-synthesis:none;color:var(--dim);padding:6px 9px;border:1px solid rgba(255,255,255,.25);border-radius:4px}
#s-ts .ts2 .cats .tab{padding:12px 26px;font:700 18px/1 'Rajdhani';letter-spacing:.24em;color:var(--dim);background:rgba(2,10,26,.72);border:1px solid rgba(255,255,255,.1);cursor:pointer}
#s-ts .ts2 .cats .tab.on{color:#fff;border-color:var(--home);box-shadow:0 0 16px var(--home-glow),inset 0 0 14px rgba(47,140,255,.2)}
#s-ts .ts2 .rail{position:absolute;left:0;right:0;top:846px;height:148px;background:linear-gradient(to bottom,rgba(2,10,26,.86),rgba(2,10,26,.94));border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
#s-ts .ts2 .rail .nav{position:absolute;top:0;bottom:0;width:80px;display:flex;align-items:center;justify-content:center;cursor:pointer}
#s-ts .ts2 .rail .nav.p{left:0} #s-ts .ts2 .rail .nav.n{right:0}
#s-ts .ts2 .rail .nav b{width:0;height:0;border-top:16px solid transparent;border-bottom:16px solid transparent}
#s-ts .ts2 .rail .nav.p b{border-right:20px solid #cfe0ff} #s-ts .ts2 .rail .nav.n b{border-left:20px solid #cfe0ff}
#s-ts .ts2 .track{position:absolute;left:92px;right:92px;top:0;bottom:0;overflow:hidden}
#s-ts .ts2 .strip{position:absolute;left:0;top:14px;display:flex;gap:26px;transition:transform .3s cubic-bezier(.3,.8,.4,1)}
#s-ts .ts2 .nat{width:148px;height:118px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;border:2px solid transparent;position:relative}
#s-ts .ts2 .nat .fl{width:100px;height:64px;box-shadow:0 2px 8px rgba(0,0,0,.6)}
#s-ts .ts2 .nat .em{width:100px;height:64px;display:flex;align-items:center;justify-content:center;font-size:48px}
#s-ts .ts2 .nat .em img,#s-ts .ts2 .nat .em svg{max-height:64px;max-width:100px;height:64px;width:auto}
#s-ts .ts2 .nat span{font:600 16px/1 'Rajdhani';letter-spacing:.03em;text-transform:uppercase;color:#dfe7f3;white-space:nowrap}
#s-ts .ts2 .nat.h{border-color:var(--home);box-shadow:0 0 22px var(--home-glow),inset 0 0 18px rgba(47,140,255,.25)}
#s-ts .ts2 .nat.a{border-color:#fff;box-shadow:0 0 22px var(--away-glow),inset 0 0 18px rgba(255,255,255,.14)}
#s-ts .ts2 .nat.cur{outline:2px dashed currentColor;outline-offset:4px}
#s-ts .ts2 .nat.cur.side-h{color:var(--home)} #s-ts .ts2 .nat.cur.side-a{color:#fff}
#s-ts .ts2 .nat.h.cur,#s-ts .ts2 .nat.a.cur{outline:none}
#s-ts .ts2 .nat.cur::after{content:"";position:absolute;left:50%;bottom:-12px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top:9px solid currentColor}
#s-ts .ts2 .hints{position:absolute;left:70px;bottom:26px;display:flex;gap:46px;font:600 21px/1 'Rajdhani';letter-spacing:.08em}
#s-ts .ts2 .hints div{display:flex;align-items:center;gap:14px;cursor:pointer}
#s-ts .ts2 .hints i{font-style:normal;width:34px;height:34px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:17px}
#s-ts .ts2 .hints .x i{color:#78aaff} #s-ts .ts2 .hints .o i{color:#ff5050} #s-ts .ts2 .hints .s i{color:#ff69b4}
#s-ts .ts2 .who{position:absolute;right:70px;bottom:30px;font:700 16px/1 'Rajdhani';letter-spacing:.3em;color:var(--dim)}
#s-ts .ts2 .who b{color:#fff}
`;
  document.head.appendChild(st);
}

/* ── state ── */
const st={side:'h',cat:'nat',cur:0,built:false};
const $=sel=>document.querySelector('#s-ts .ts2 '+sel);
function other(){ return st.side==='h'?selAway:selHome; }
function setSel(key){ if(st.side==='h') selHome=key; else selAway=key; HT=T[selHome]; AT=T[selAway]; }

function build(){
  const root=document.getElementById('s-ts'); if(!root) return false;
  ensureCss();
  root.innerHTML='<div class="ts2"><div class="ts2-stage">'+
    '<div class="bg"></div>'+
    '<div class="flagwave l"><div class="cloth"></div><div class="fold"></div><div class="shine"></div></div>'+
    '<div class="flagwave r"><div class="cloth"></div><div class="fold"></div><div class="shine"></div></div>'+
    '<div class="cap l"></div><div class="cap r"></div>'+
    '<div class="title"><h1>TEAM SELECT</h1><p>CHOOSE YOUR TEAM</p></div>'+
    '<div class="side l"></div><div class="side r"></div>'+
    '<div class="kits l"></div><div class="kits r"></div>'+
    '<div class="spr l"><div class="shadow"></div><canvas width="180" height="234"></canvas></div>'+
    '<div class="spr r"><div class="shadow"></div><canvas width="180" height="234"></canvas></div>'+
    '<div class="arr pl"></div><div class="arr nl"></div><div class="arr pr"></div><div class="arr nr"></div>'+
    '<div class="cats"><span class="bump">L1</span><div class="tab" data-c="nat">NATIONALS</div><div class="tab" data-c="club">CLUBS</div><div class="tab" data-c="special">SPECIAL</div><span class="bump">R1</span></div>'+
    '<div class="rail"><div class="nav p"><b></b></div><div class="track"><div class="strip"></div></div><div class="nav n"><b></b></div></div>'+
    '<div class="hints"><div class="x"><i>✕</i>CONFIRM</div><div class="o"><i>○</i>BACK</div><div class="s"><i>□</i>RANDOM</div></div>'+
    '<div class="who"></div>'+
  '</div></div>';
  root.querySelectorAll('.ts2 .cats .tab').forEach(b=>b.addEventListener('click',()=>setCat(b.dataset.c)));
  $('.strip').addEventListener('click',e=>{ const n=e.target.closest('.nat'); if(n) pick(n.dataset.k); });
  $('.nav.p').addEventListener('click',()=>move(-1));
  $('.nav.n').addEventListener('click',()=>move(1));
  $('.hints .x').addEventListener('click',confirm);
  $('.hints .o').addEventListener('click',back);
  $('.hints .s').addEventListener('click',random);
  st.built=true; fit();
  return true;
}
function fit(){
  const root=document.getElementById('s-ts'), stage=root&&root.querySelector('.ts2-stage'); if(!stage) return;
  const w=root.clientWidth||1920, h=root.clientHeight||1080, s=Math.min(w/1920,h/1080);
  stage.style.transform='translate(-50%,-50%) scale('+s+')';
}
addEventListener('resize',fit);

function renderSide(side){
  const key=side==='h'?selHome:selAway, t=T[key], L=side==='h'; if(!t) return;
  const s=teamStats(key), name=t.name||key;
  const fs=Math.min(96,Math.floor(560/(name.length*0.78)));
  const bar=v=>Math.max(0,Math.min(100,(v-50)*2));
  $(L?'.side.l':'.side.r').innerHTML=
    '<div class="tname" style="font-size:'+fs+'px">'+name+'</div>'+
    '<div class="sub">'+(L?'Home':'Away')+' · '+CAT_SUB[catOf(key)]+'</div>'+
    '<div class="info"><div class="ovr"><b>'+s.ovr+'</b><span>OVR</span></div><div class="stats">'+
    [['ATT',s.att],['MID',s.mid],['DEF',s.def],['SPD',s.spd]].map(r=>'<div class="k">'+r[0]+'</div><div class="bar"><i style="width:'+bar(r[1])+'%"></i></div><div class="v">'+r[1]+'</div>').join('')+
    '</div></div>';
  $(L?'.kits.l':'.kits.r').innerHTML='<div class="kit sel">'+shirtSVG(key)+'<div class="cap2">HOME</div></div>'+
    '<div class="kit na"><div class="naw">NOT<br>AVAILABLE</div><div class="cap2">AWAY</div></div>';
  const cap=$(L?'.cap.l':'.cap.r'), src='assets/team/captain-'+key+'.png';
  if(cap.dataset.src!==src){ cap.dataset.src=src; cap.style.backgroundImage='none';
    const im=new Image(); im.onload=()=>{ if(cap.dataset.src===src) cap.style.backgroundImage='url("'+src+'")'; }; im.src=src; }
  $(L?'.flagwave.l .cloth':'.flagwave.r .cloth').style.background=flagBG(flagSpec(key));
  sheetFor(key,side);
}
function renderRail(){
  const keys=catKeys(st.cat);
  $('.strip').innerHTML=keys.map((k,i)=>{
    const t=T[k], vis=(catOf(k)==='nat'&&FLAGS[k])?flagSVG(FLAGS[k]):'<div class="em" data-key="'+k+'"></div>';
    return '<div class="nat'+(k===selHome?' h':'')+(k===selAway?' a':'')+(i===st.cur?' cur side-'+st.side:'')+'" data-k="'+k+'">'+vis+'<span>'+(t.name||k)+'</span></div>'; }).join('');
  document.querySelectorAll('#s-ts .ts2 .nat .em[data-key]').forEach(el=>{ const k=el.dataset.key; try{ setTeamEmblem(el,k,T[k]?T[k].flag:''); }catch(e){} });
  const W=148+26, vis=Math.floor((1920-184)/W), first=Math.max(0,Math.min(keys.length-vis,st.cur-Math.floor(vis/2)));
  $('.strip').style.transform='translateX('+(-first*W)+'px)';
  document.querySelectorAll('#s-ts .ts2 .cats .tab').forEach(b=>b.classList.toggle('on',b.dataset.c===st.cat));
  $('.who').innerHTML='CHOOSING <b>'+(st.side==='h'?'HOME':'AWAY')+'</b>';
}
function render(){
  if(!selHome) selHome='italy'; if(!selAway) selAway='germany';
  [selHome,selAway].forEach(k=>{ if(CR_CLUBS[k]){ try{ crBuildClubTeam(k); }catch(e){} } });
  HT=T[selHome]; AT=T[selAway]; if(!HT||!AT) return;
  if(!st.built||!document.querySelector('#s-ts .ts2')) build();
  const mine=st.side==='h'?selHome:selAway; st.cat=st.cat||catOf(mine);
  const keys=catKeys(st.cat), idx=keys.indexOf(mine); if(idx>-1) st.cur=idx;
  renderSide('h'); renderSide('a'); renderRail(); fit();
}

/* ── actions ── */
function pick(key){ if(!T[key]&&!CR_CLUBS[key]) return false; if(CR_CLUBS[key]){ try{ crBuildClubTeam(key); }catch(e){} }
  if(!T[key]||key===other()) return false; setSel(key); st.cur=catKeys(st.cat).indexOf(key); render(); return true; }
function move(d){ const keys=catKeys(st.cat), n=keys.length; if(!n) return; let i=st.cur;
  for(let t=0;t<n;t++){ i=(i+d+n)%n; if(keys[i]!==other()){ setSel(keys[i]); st.cur=i; break; } } render(); }
function setCat(c){ if(CAT_ORDER.indexOf(c)<0) return; st.cat=c; const keys=catKeys(c), mine=st.side==='h'?selHome:selAway;
  if(keys.indexOf(mine)<0){ const k=keys.find(x=>x!==other()); if(k) setSel(k); } render(); }
function cycleCat(d){ setCat(CAT_ORDER[(CAT_ORDER.indexOf(st.cat)+d+CAT_ORDER.length)%CAT_ORDER.length]); }
function sideTo(s){ st.side=s; st.cat=catOf(s==='h'?selHome:selAway); render(); }
function confirm(){
  if(st.side==='h'){ sideTo('a'); return; }
  if(selHome&&selAway&&selHome!==selAway&&typeof openTeamMenu==='function'){ st.side='h'; openTeamMenu(); }
}
function back(){ if(st.side==='a'){ sideTo('h'); return; } if(typeof exitToMenu==='function') exitToMenu(); else if(typeof showSc==='function') showSc('s-home'); }
function random(){ const keys=catKeys(st.cat).filter(k=>k!==other()); if(keys.length) pick(keys[Math.floor(Math.random()*keys.length)]); }

/* ── pad / keys: game.js's menu nav delegates while this screen is up ── */
function owns(){ const s=document.getElementById('s-ts'); return !!(s&&s.classList.contains('active')&&!document.querySelector('.ae-modal.show')); }
window.TS2={ owns:owns, step:d=>move(d), confirm:()=>{ confirm(); return true; }, back:back, render:render,
  /* shared with the pause menu: the same flag art, or '' for clubs / unknown */
  flagSVG:key=>(catOf(key)==='nat'&&FLAGS[key])?flagSVG(FLAGS[key]):'' };
if(window.UEInput&&UEInput.on){
  UEInput.on('SWITCH',()=>{ if(owns()) cycleCat(-1); })        // L1
         .on('SPRINT',()=>{ if(owns()) cycleCat(1); })         // R1
         .on('SHOOT', ()=>{ if(owns()) random(); });           // square
}
addEventListener('keydown',e=>{ if(!owns()) return; const k=(e.key||'').toLowerCase();
  if(k==='pageup') cycleCat(-1); else if(k==='pagedown') cycleCat(1); });

/* ── idle loop (4 fps; 12-frame breath) ── */
let f=0,last=0; const IDLE_FPS=4;
function loop(now){ requestAnimationFrame(loop);
  if(!owns()||now-last<1000/IDLE_FPS) return; last=now; f=(f+1)%12;
  const cvs=document.querySelectorAll('#s-ts .ts2 .spr canvas'); if(cvs.length<2) return;
  drawSprite(cvs[0],selHome,'h',f,false); drawSprite(cvs[1],selAway,'a',(f+5)%12,true); }
requestAnimationFrame(loop);

/* keep the old globals working (other code / inline handlers may call them) */
window.renderTeamSelect=render;
window.tsPick=k=>pick(k); window.tsRandom=random; window.tsConfirm=confirm;
window.tsSetCat=c=>setCat({nationals:'nat',clubs:'club',special:'special'}[c]||c);
window.tsSetActive=s=>sideTo(s==='away'||s==='a'?'a':'h');
try{ syncTeamSelections=function(){ try{ st.side='h'; st.cat=catOf(selHome||'italy'); render(); }catch(e){ console.warn('[TS2] render',e); } }; }
catch(e){ window.syncTeamSelections=function(){ try{ render(); }catch(_){} }; }
})();
