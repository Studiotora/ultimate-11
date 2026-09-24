/* ============================================================
   ULT11-TEAMMANAGE · Ultimate Eleven                    2026-09-24
   The Team Management screen, from the approved lab mockup
   (lab/lab-teammanagement.html). Load AFTER game.js: it takes over
   buildFormationMenu(), so openTeamMenu() -> showSc('s-team') draws
   this screen. The old #s-team markup and its helpers (buildReserves,
   openFormationPicker, drag & drop) are no longer shown.

   The lineup lives where the engine already reads it:
     HOME_SLOT_ASSIGN  slot -> player id      (startGame / pzCloseSquadEditor)
     HOME_RESERVES     bench, index 0 = GK    (trimmed to 4: 1 GK + 3)
     activeHomeFormation
   Tactics + man-marking choices are saved on HT._tm (not yet read by
   the match AI - that is the next, engine-side step).

   KICK OFF -> startGame(), or pzCloseSquadEditor() when opened from the
   pause menu (label APPLY & RESUME). BACK -> teamEditorBack() (pause /
   career / story / cup / team select).

   Fonts: ONLY Cinzel / Rajdhani / Bold Pixel (tokens.css).
   ============================================================ */
(function(){
'use strict';

const SLOTS=['GK','LB','CB1','CB2','RB','CM1','CM2','CM3','LW','ST','RW'];
const TACTICS=['BALANCED','ATTACKING','DEFENSIVE','COUNTER','POSSESSION'];

/* role colour family: GK gold, defenders blue, midfielders green, forwards red */
function rc(role){ role=String(role||'').toUpperCase();
  if(role==='GK') return 'gk';
  if(/^(ST|ST1|ST2|CF|LW|RW|FW)$/.test(role)) return 'fwd';
  if(/^(DM|CM|LCM|RCM|LM|RM|LAM|CAM|RAM|AM|CM1|CM2|CM3)$/.test(role)) return 'mid';
  return 'def'; }
const posLabel=p=>p?(p.pos==='GK'?'GK':String(p.pos||'').replace(/\d/,'')):'';
function roster(){ return (HT&&HT.p)||[]; }
function byId(id){ return roster().find(p=>p.id===id)||null; }
function roleOf(k){ return k==='GK'?'GK':((FORMATIONS[activeHomeFormation]||FORMATIONS['4-3-3']).labels[k]||k); }
function ovr(p){ return +calcOvr(p)||0; }
function tmState(){ if(!HT) return {tac:0,marks:{}}; return HT._tm||(HT._tm={tac:0,marks:{}}); }
function save(){ try{ if(typeof CAR!=='undefined'&&CAR.active&&typeof crSave==='function') crSave(); }catch(e){} }

/* bench: exactly 4 seats - [GK, field, field, field]; anyone else is left out */
function normBench(){
  if(!Array.isArray(HOME_RESERVES)) HOME_RESERVES=[null,null,null,null,null,null];
  const inXI=new Set(Object.values(HOME_SLOT_ASSIGN||{}).filter(Boolean));
  const seen=new Set(), list=HOME_RESERVES.filter(id=>{ if(!id||inXI.has(id)||seen.has(id)||!byId(id)) return false; seen.add(id); return true; });
  const gk=list.find(id=>byId(id).pos==='GK')||null, field=list.filter(id=>byId(id).pos!=='GK').slice(0,3);
  HOME_RESERVES=[gk].concat(field); while(HOME_RESERVES.length<6) HOME_RESERVES.push(null);
}
const bench=()=>HOME_RESERVES.slice(0,4);

/* ── faces: the in-match bust crop (headBox from game.js) off the duel front art ── */
const FACE={};
function faceChain(p,side){
  const ln=(typeof playerLastName==='function'?playerLastName(p):'')||'';
  const team=side==='a'?selAway:selHome;
  return p.pos==='GK'
    ? ['assets/players/front/'+ln+'.png','assets/players/'+ln+'.png','assets/players/front/'+team+'.png']
    : ['assets/players/front/'+ln+'.png','assets/players/front/'+team+'.png','assets/players/'+team+'.png'];
}
function faceImg(p,side,cb){
  const key=side+':'+p.id;
  const o=FACE[key]||(FACE[key]={q:[],img:null,done:false});
  if(o.done){ cb(o.img); return; }
  o.q.push(cb); if(o.q.length>1) return;
  const chain=faceChain(p,side); let i=0;
  const im=new Image();
  im.onload=()=>{ o.img=im; o.done=true; o.q.forEach(f=>f(im)); o.q=[]; };
  im.onerror=()=>{ i++; if(i<chain.length) im.src=chain[i]; else { o.done=true; o.img=null; o.q.forEach(f=>f(null)); o.q=[]; } };
  im.src=chain[0];
}
function box(im){ try{ if(typeof headBox==='function'){ const b=headBox(im); if(b) return b; } }catch(e){} return {sx:0,sy:0,size:Math.min(im.naturalWidth,im.naturalHeight)}; }
function faceSq(cv,p,side){ if(!cv||!p) return; faceImg(p,side||'h',im=>{ const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); if(!im) return;
  const b=box(im); g.imageSmoothingQuality='high'; g.drawImage(im,b.sx,b.sy,b.size,b.size,0,0,cv.width,cv.height); }); }
function faceWide(cv,p){ faceImg(p,'h',im=>{ const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); if(!im) return;
  const b=box(im), ar=cv.width/cv.height, w=b.size*1.5, h=w/ar, cx=b.sx+b.size/2;
  g.imageSmoothingQuality='high'; g.drawImage(im,cx-w/2,b.sy-b.size*0.04,w,h,0,0,cv.width,cv.height); }); }

/* ── CSS ── */
function ensureCss(){
  if(document.getElementById('tm2-css')) return;
  const st=document.createElement('style'); st.id='tm2-css';
  st.textContent=`
#s-team .tm2{position:absolute;inset:0;overflow:hidden;background:#030a18;color:#fbfbfc;font-family:'Rajdhani',system-ui,sans-serif;
  --home:#2f8cff;--glow:rgba(47,140,255,.7);--panel:rgba(2,10,26,.8);--rule:rgba(38,126,226,.45);--gold:#f0c040;--dim:#9fb2cc;--mute:#48586a}
#s-team .tm2-stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform-origin:center}
#s-team .tm2 .num{font-family:'Bold Pixel',monospace;font-weight:400;font-synthesis:none}
#s-team .tm2 .bg{position:absolute;inset:0;background:url('assets/wallpaper/teamselect2.jpg') center -110px/1920px auto no-repeat;filter:brightness(.42) saturate(.9) blur(1.5px);transform:scale(1.02)}
#s-team .tm2 .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,10,24,.92) 0%,rgba(3,10,24,.35) 30%,rgba(3,10,24,.35) 70%,rgba(3,10,24,.85) 100%),linear-gradient(to bottom,rgba(3,10,24,.5),rgba(3,10,24,0) 20%,rgba(3,10,24,0) 80%,rgba(3,10,24,.9))}
#s-team .tm2 .title{position:absolute;left:0;right:0;top:34px;text-align:center}
#s-team .tm2 .title h1{margin:0;font:700 34px/1 'Cinzel',serif;letter-spacing:.32em}
#s-team .tm2 .title p{margin:10px 0 0;font:700 15px/1 'Rajdhani';letter-spacing:.42em;color:var(--dim)}
#s-team .tm2 .fixture{position:absolute;right:60px;top:44px;font:700 17px/1 'Rajdhani';letter-spacing:.24em;color:var(--dim);text-transform:uppercase}
#s-team .tm2 .fixture b{color:var(--home)} #s-team .tm2 .fixture i{font-style:normal;color:#fff}
#s-team .tm2 .hero{position:absolute;left:-40px;top:-10px;width:520px;height:640px;background:bottom center/contain no-repeat;
  -webkit-mask:linear-gradient(to bottom,#000 55%,transparent 96%);mask:linear-gradient(to bottom,#000 55%,transparent 96%);opacity:.95}
#s-team .tm2 .tname{position:absolute;left:50px;top:418px;font:900 88px/1 'Cinzel',serif;text-transform:uppercase;white-space:nowrap;text-shadow:0 4px 0 rgba(0,0,0,.5),0 0 30px rgba(0,0,0,.8)}
#s-team .tm2 .tsub{position:absolute;left:54px;top:514px;font:700 15px/1 'Rajdhani';letter-spacing:.34em;color:var(--dim)}
#s-team .tm2 .menu{position:absolute;left:0;top:566px;width:430px;border-top:1px solid rgba(255,255,255,.14)}
#s-team .tm2 .mi{display:flex;align-items:center;gap:18px;height:66px;padding:0 26px 0 44px;cursor:pointer;position:relative}
#s-team .tm2 .mi::after{content:"";position:absolute;left:44px;right:0;bottom:0;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.04))}
#s-team .tm2 .mi .ic{width:30px;height:30px;flex:none;opacity:.85}
#s-team .tm2 .mi .lab{font:700 22px/1 'Rajdhani';letter-spacing:.14em}
#s-team .tm2 .mi .val{margin-left:auto;display:flex;align-items:center;gap:10px;font:700 19px/1 'Rajdhani';letter-spacing:.06em;color:var(--dim)}
#s-team .tm2 .mi .val .num{font-size:22px;color:#fff}
#s-team .tm2 .mi .val em{font-style:normal;color:var(--home);font-size:16px;opacity:0}
#s-team .tm2 .mi.on{background:linear-gradient(90deg,#1b63d8 0%,#2f8cff 55%,rgba(47,140,255,.35) 100%);clip-path:polygon(0 0,100% 0,95% 100%,0 100%);box-shadow:0 0 24px var(--glow)}
#s-team .tm2 .mi.on::after{display:none} #s-team .tm2 .mi.on .val{color:#fff} #s-team .tm2 .mi.on .val em{color:#fff;opacity:1}
#s-team .tm2 .boardbox{position:absolute;left:430px;top:84px;width:1080px;height:920px;background:rgba(1,6,18,.9);
  -webkit-mask:radial-gradient(ellipse 60% 58% at 50% 50%,#000 66%,transparent 100%);mask:radial-gradient(ellipse 60% 58% at 50% 50%,#000 66%,transparent 100%)}
#s-team .tm2 .board{position:absolute;left:470px;top:110px;width:1000px;height:680px}
#s-team .tm2 .bhead{position:absolute;left:0;right:0;top:0;height:50px;display:flex;align-items:center;gap:14px;padding:0 16px;background:rgba(2,10,26,.72);border-bottom:1px solid var(--rule)}
#s-team .tm2 .bump{font:400 14px/1 'Bold Pixel',monospace;font-synthesis:none;color:var(--dim);padding:5px 8px;border:1px solid rgba(255,255,255,.25);border-radius:4px;cursor:pointer}
#s-team .tm2 .bhead .t{font:700 18px/1 'Rajdhani';letter-spacing:.22em;padding:14px 22px;background:linear-gradient(180deg,rgba(47,140,255,.5),rgba(47,140,255,.15));box-shadow:inset 0 -2px 0 var(--home)}
#s-team .tm2 .bhead .f{margin-left:auto;font-size:26px}
#s-team .tm2 .pitch{position:absolute;left:0;top:56px;width:1000px;height:600px}
#s-team .tm2 .cards{position:absolute;inset:0}
#s-team .tm2 .card{position:absolute;width:112px;transform-origin:50% 100%;cursor:pointer}
#s-team .tm2 .hf{display:block;border:2px solid #2f8cff;background:radial-gradient(circle at 50% 70%,rgba(47,140,255,.45),rgba(2,10,26,.9))}
#s-team .tm2 .card .hf{width:80px;height:80px;margin:0 auto -2px;box-shadow:0 6px 10px rgba(0,0,0,.55)}
#s-team .tm2 .gk .hf{border-color:#e0a020;background:radial-gradient(circle at 50% 70%,rgba(224,160,32,.45),rgba(2,10,26,.9))}
#s-team .tm2 .mid .hf{border-color:#1faa55;background:radial-gradient(circle at 50% 70%,rgba(31,170,85,.45),rgba(2,10,26,.9))}
#s-team .tm2 .fwd .hf{border-color:#dc2f3a;background:radial-gradient(circle at 50% 70%,rgba(220,47,58,.45),rgba(2,10,26,.9))}
#s-team .tm2 .plate{position:relative;height:44px;background:linear-gradient(180deg,rgba(6,16,38,.95),rgba(2,8,22,.95));border:1px solid rgba(120,170,255,.45);
  display:grid;grid-template-columns:auto 1fr;grid-template-rows:20px 22px;align-items:center;padding:0 7px;column-gap:6px}
#s-team .tm2 .role{font:700 13px/1 'Rajdhani';padding:2px 5px;letter-spacing:.04em;background:#2f8cff;color:#fff}
#s-team .tm2 .role.gk{background:#e0a020;color:#1b1400} #s-team .tm2 .role.mid{background:#1faa55} #s-team .tm2 .role.fwd{background:#dc2f3a}
#s-team .tm2 .plate .ovr{text-align:right;font:400 20px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-team .tm2 .plate .nm{grid-column:1/3;font:700 15px/1 'Rajdhani';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#s-team .tm2 .card.sel .hf,#s-team .tm2 .slot.sel .hf{border-color:var(--gold);box-shadow:0 0 18px rgba(240,192,64,.85)}
#s-team .tm2 .card.sel .plate,#s-team .tm2 .slot.sel{border-color:var(--gold);box-shadow:0 0 18px rgba(240,192,64,.7)}
#s-team .tm2 .card.cur .plate,#s-team .tm2 .slot.cur{outline:2px dashed #fff;outline-offset:3px}
#s-team .tm2 .bench{position:absolute;left:470px;top:778px;width:1000px}
#s-team .tm2 .bench h3{margin:0 0 10px;font:700 18px/1 'Rajdhani';letter-spacing:.28em}
#s-team .tm2 .bench h3 span{color:var(--dim);font-size:14px;letter-spacing:.2em;margin-left:14px}
#s-team .tm2 .slots{display:flex;gap:14px}
#s-team .tm2 .slot{width:150px;height:150px;position:relative;background:var(--panel);border:1px solid rgba(120,170,255,.3);cursor:pointer;overflow:hidden}
#s-team .tm2 .slot .hf{position:absolute;left:50%;top:6px;width:96px;height:96px;margin-left:-48px}
#s-team .tm2 .slot .plate{position:absolute;left:0;right:0;bottom:0;border-width:1px 0 0}
#s-team .tm2 .slot.empty{display:flex;align-items:center;justify-content:center;font:700 40px/1 'Rajdhani';color:var(--mute);cursor:default}
#s-team .tm2 .slot.gkslot::before{content:"GK";position:absolute;left:6px;top:6px;z-index:1;font:700 12px/1 'Rajdhani';letter-spacing:.14em;color:#e0a020}
#s-team .tm2 .pbox{position:absolute;right:10px;top:80px;width:460px;height:740px;background:rgba(1,6,18,.75);
  -webkit-mask:radial-gradient(ellipse 56% 56% at 50% 50%,#000 62%,transparent 100%);mask:radial-gradient(ellipse 56% 56% at 50% 50%,#000 62%,transparent 100%)}
#s-team .tm2 .ppanel{position:absolute;right:50px;top:110px;width:380px;height:680px;background:linear-gradient(160deg,rgba(10,26,58,.92),rgba(2,10,26,.9) 55%);overflow:hidden;
  clip-path:polygon(0 0,calc(100% - 44px) 0,100% 44px,100% 100%,44px 100%,0 calc(100% - 44px))}
#s-team .tm2 .pframe{position:absolute;right:50px;top:110px;width:380px;height:680px;pointer-events:none}
#s-team .tm2 .pframe svg{width:100%;height:100%;overflow:visible}
#s-team .tm2 .diag{position:absolute;left:-40px;right:-40px;top:268px;height:40px;background:linear-gradient(90deg,rgba(47,140,255,0),rgba(47,140,255,.35),rgba(47,140,255,0));transform:skewY(-6deg)}
#s-team .tm2 .stripes{position:absolute;right:0;bottom:0;width:180px;height:120px;opacity:.25;background:repeating-linear-gradient(135deg,rgba(120,170,255,.5) 0 2px,transparent 2px 12px);-webkit-mask:linear-gradient(315deg,#000,transparent 70%);mask:linear-gradient(315deg,#000,transparent 70%)}
#s-team .tm2 .face{position:absolute;left:0;right:0;top:0;height:292px;overflow:hidden;background:radial-gradient(ellipse at 50% 80%,rgba(47,140,255,.4),rgba(2,10,26,0) 72%);clip-path:polygon(0 0,100% 0,100% 84%,0 100%)}
#s-team .tm2 .face canvas{position:absolute;inset:0;width:380px;height:280px}
#s-team .tm2 .pid{position:absolute;left:24px;right:24px;top:296px;display:flex;align-items:center;gap:16px}
#s-team .tm2 .pid .jn{font:400 64px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-team .tm2 .pid .pn{font:700 30px/1.05 'Cinzel',serif;text-transform:uppercase}
#s-team .tm2 .pid .role{display:inline-block;margin-top:6px;font-size:15px;padding:3px 8px}
#s-team .tm2 .pstat{position:absolute;left:24px;right:24px;top:392px;display:flex;align-items:center;gap:10px}
#s-team .tm2 .povr{width:110px;text-align:center}
#s-team .tm2 .povr span{display:block;font:700 16px/1 'Rajdhani';letter-spacing:.3em;color:var(--dim)}
#s-team .tm2 .povr b{display:block;margin-top:6px;font:400 64px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-team .tm2 .radar{width:250px;height:218px}
#s-team .tm2 .pinfo{position:absolute;left:24px;right:24px;top:612px;font:600 17px/1 'Rajdhani'}
#s-team .tm2 .pinfo div{display:flex;justify-content:space-between;padding:0 0 8px;color:var(--dim)}
#s-team .tm2 .pinfo div b{color:#fff;font-weight:700;letter-spacing:.04em}
#s-team .tm2 .kick{position:absolute;right:50px;top:856px;width:380px;height:92px;display:flex;align-items:center;gap:20px;padding:0 26px;cursor:pointer;
  background:linear-gradient(90deg,#1a5fd8,#3b98ff);clip-path:polygon(4% 0,100% 0,96% 100%,0 100%);filter:drop-shadow(0 0 18px rgba(47,140,255,.95)) drop-shadow(0 0 40px rgba(47,140,255,.6));animation:tm2kg 1.8s ease-in-out infinite}
@keyframes tm2kg{50%{filter:drop-shadow(0 0 26px rgba(90,170,255,1)) drop-shadow(0 0 60px rgba(47,140,255,.85))}}
#s-team .tm2 .kick .tri{width:0;height:0;border-top:16px solid transparent;border-bottom:16px solid transparent;border-left:24px solid #fff;filter:drop-shadow(0 0 8px #fff) drop-shadow(0 0 14px #9cd0ff)}
#s-team .tm2 .kick b{font:700 32px/1 'Rajdhani';letter-spacing:.12em;text-shadow:0 0 12px rgba(255,255,255,.75);white-space:nowrap}
#s-team .tm2 .kick i{margin-left:auto;font-style:normal;font:700 14px/1 'Rajdhani';letter-spacing:.16em;padding:6px 10px;border:1px solid #fff;border-radius:4px;box-shadow:0 0 10px rgba(255,255,255,.8),inset 0 0 8px rgba(255,255,255,.4);text-shadow:0 0 8px #fff}
#s-team .tm2 .kick.cur{outline:3px solid #fff;outline-offset:4px}
#s-team .tm2 .hints{position:absolute;left:50px;bottom:26px;display:flex;gap:40px;font:600 21px/1 'Rajdhani';letter-spacing:.08em}
#s-team .tm2 .hints div{display:flex;align-items:center;gap:14px;cursor:pointer}
#s-team .tm2 .hints i{font-style:normal;width:34px;height:34px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:17px}
#s-team .tm2 .hints .x i{color:#78aaff} #s-team .tm2 .hints .o i{color:#ff5050} #s-team .tm2 .hints .s i{color:#ff69b4} #s-team .tm2 .hints .t i{color:#3cdc78}
#s-team .tm2 .ovl{position:absolute;display:none;z-index:20}
#s-team .tm2 .ovl.on{display:flex}
#s-team .tm2 .confirm{left:470px;top:380px;width:1000px;justify-content:center}
#s-team .tm2 .confirm .box{padding:26px 38px;background:rgba(2,10,26,.96);border:1px solid var(--home);box-shadow:0 0 30px var(--glow);text-align:center}
#s-team .tm2 .confirm .q{font:700 16px/1 'Rajdhani';letter-spacing:.3em;color:var(--dim)}
#s-team .tm2 .confirm .who{margin:14px 0 20px;font:700 30px/1 'Cinzel',serif}
#s-team .tm2 .confirm .who span{color:var(--home);margin:0 18px;font-family:'Rajdhani'}
#s-team .tm2 .btns{display:flex;gap:18px;justify-content:center}
#s-team .tm2 .btns div{display:flex;align-items:center;gap:10px;padding:10px 22px;font:700 19px/1 'Rajdhani';letter-spacing:.12em;border:1px solid rgba(255,255,255,.25);cursor:pointer;background:rgba(255,255,255,.04)}
#s-team .tm2 .btns .ok{border-color:var(--home);background:rgba(47,140,255,.28)}
#s-team .tm2 .btns i{font-style:normal;width:28px;height:28px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:14px}
#s-team .tm2 .btns .ok i{color:#78aaff} #s-team .tm2 .btns .no i{color:#ff5050}
#s-team .tm2 .markov{left:450px;top:96px;width:1040px;height:880px;flex-direction:column;background:rgba(1,6,18,.96);border:1px solid var(--rule);box-shadow:0 0 40px rgba(0,0,0,.7)}
#s-team .tm2 .markov h2{margin:22px 30px 4px;font:700 26px/1 'Cinzel',serif;letter-spacing:.2em}
#s-team .tm2 .markov .hint{margin:0 30px 18px;font:700 15px/1 'Rajdhani';letter-spacing:.22em;color:var(--dim)}
#s-team .tm2 .markov .cols{position:absolute;left:30px;right:30px;top:96px;bottom:86px;display:grid;grid-template-columns:1fr 1fr;gap:30px}
#s-team .tm2 .markov h4{margin:0 0 10px;font:700 15px/1 'Rajdhani';letter-spacing:.3em;color:var(--dim)}
#s-team .tm2 .mk{display:grid;grid-template-columns:52px auto 1fr auto;align-items:center;gap:12px;height:64px;padding:0 12px;margin-bottom:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer}
#s-team .tm2 .mk canvas,#s-team .tm2 .op canvas{width:52px;height:52px;border-radius:4px;background:rgba(47,140,255,.18)}
#s-team .tm2 .mk .nm{font:700 19px/1 'Rajdhani';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#s-team .tm2 .mk .tgt{font:700 15px/1 'Rajdhani';letter-spacing:.08em;color:var(--mute)}
#s-team .tm2 .mk .tgt.set{color:#fff;display:flex;align-items:center;gap:8px}
#s-team .tm2 .mk .tgt.set b{color:#ff7a80}
#s-team .tm2 .mk .tgt.set i{font-style:normal;width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:12px}
#s-team .tm2 .mk.pick{border-color:var(--gold);box-shadow:0 0 16px rgba(240,192,64,.6)}
#s-team .tm2 .mk.cur,#s-team .tm2 .op.cur{outline:2px dashed #fff;outline-offset:2px}
#s-team .tm2 .opps{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#s-team .tm2 .op{display:grid;grid-template-columns:52px 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center;height:64px;padding:0 10px;background:rgba(220,47,58,.07);border:1px solid rgba(220,47,58,.25);cursor:pointer}
#s-team .tm2 .op canvas{grid-row:1/3;background:rgba(220,47,58,.18)}
#s-team .tm2 .op .nm{font:700 17px/1 'Rajdhani';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#s-team .tm2 .op .nm .role{font-size:12px;margin-right:6px}
#s-team .tm2 .op .ovr{grid-row:1/3;grid-column:3;font:400 22px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-team .tm2 .op .by{font:600 13px/1 'Rajdhani';letter-spacing:.08em;color:var(--dim)}
#s-team .tm2 .op.taken{border-color:rgba(255,255,255,.35)}
#s-team .tm2 .markov:not(.picking) .op{opacity:.55}
#s-team .tm2 .markov .foot{position:absolute;left:30px;right:30px;bottom:24px;display:flex;gap:16px;justify-content:flex-end}
#s-team .tm2 .markov .foot div{padding:12px 26px;font:700 18px/1 'Rajdhani';letter-spacing:.14em;border:1px solid rgba(255,255,255,.25);cursor:pointer}
#s-team .tm2 .markov .foot .done{border-color:var(--home);background:rgba(47,140,255,.3);box-shadow:0 0 16px var(--glow)}
`;
  document.head.appendChild(st);
}

/* ── state ── */
const st={menu:0, zone:'menu', pcur:0, sel:{kind:'xi',k:'CM2'}, armed:false, pend:null, mk:{open:false,pick:null,col:'mine',cur:0}};
let root=null;
const $=s=>root&&root.querySelector(s);

const ICON={
  form:'<svg class="ic" viewBox="0 0 24 24" fill="#cfe0ff"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  tac:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2"><path d="M4 18 C8 10 12 14 18 6"/><path d="M14 6h4v4"/><circle cx="5" cy="6" r="2"/></svg>',
  mark:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
  auto:'<svg class="ic" viewBox="0 0 24 24" fill="#cfe0ff"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/></svg>'
};

function build(){
  root=document.getElementById('s-team'); if(!root) return false;
  ensureCss();
  root.innerHTML='<div class="tm2"><div class="tm2-stage">'+
    '<div class="bg"></div><div class="title"><h1>TEAM MANAGEMENT</h1><p>PREPARE FOR THE MATCH</p></div><div class="fixture"></div>'+
    '<div class="hero"></div><div class="tname"></div><div class="tsub">YOUR STARTING ELEVEN</div><div class="menu"></div>'+
    '<div class="boardbox"></div><div class="board"><div class="bhead"><span class="bump" data-f="-1">L1</span><span class="t">STARTING XI</span><span class="f num"></span><span class="bump" data-f="1">R1</span></div>'+
      '<svg class="pitch" viewBox="0 0 1000 600"></svg><div class="cards"></div></div>'+
    '<div class="bench"><h3>SUBSTITUTES<span>SELECT A STARTER, THEN A SUBSTITUTE TO SWAP</span></h3><div class="slots"></div></div>'+
    '<div class="pbox"></div><div class="ppanel"><div class="diag"></div><div class="stripes"></div><div class="face"><canvas width="760" height="560"></canvas></div>'+
      '<div class="pid"><div class="jn"></div><div><div class="pn"></div><div class="role pr"></div></div></div>'+
      '<div class="pstat"><div class="povr"><span>OVR</span><b></b></div><canvas class="radar" width="460" height="400"></canvas></div><div class="pinfo"></div></div>'+
    '<div class="pframe"><svg viewBox="0 0 380 680" preserveAspectRatio="none"><polygon points="0.5,0.5 335.5,0.5 379.5,44.5 379.5,679.5 44.5,679.5 0.5,635.5" fill="none" stroke="rgba(120,170,255,.55)" stroke-width="1.2"/><path d="M322 0.5 L379.5 58" stroke="#2f8cff" stroke-width="3"/><path d="M0.5 622 L58 679.5" stroke="#2f8cff" stroke-width="3"/></svg></div>'+
    '<div class="kick"><span class="tri"></span><b>KICK OFF</b><i>START</i></div>'+
    '<div class="hints"><div class="x"><i>✕</i>SELECT / SWAP</div><div class="o"><i>○</i>BACK</div><div class="t"><i>△</i>MENU / PLAYERS</div><div class="s"><i>□</i>AUTO-CHOOSE</div></div>'+
    '<div class="ovl confirm"><div class="box"><div class="q"></div><div class="who"></div><div class="btns"><div class="ok"><i>✕</i>CONFIRM</div><div class="no"><i>○</i>CANCEL</div></div></div></div>'+
    '<div class="ovl markov"><h2>MARKING</h2><div class="hint">CHOOSE ONE OF YOUR PLAYERS, THEN THE OPPONENT HE MARKS</div>'+
      '<div class="cols"><div><h4>YOUR PLAYERS</h4><div class="mine"></div></div><div><h4 class="oname"></h4><div class="opps"></div></div></div>'+
      '<div class="foot"><div class="clr">CLEAR ALL</div><div class="done">DONE</div></div></div>'+
    /* old ids the engine still writes to (openTeamMenu / pzPatchTeamMenuButtons) - harmless, hidden */
    '<button id="tmKickBtn" style="display:none"></button><button id="tmBackBtn" style="display:none"></button>'+
  '</div></div>';
  $('.menu').addEventListener('click',e=>{ const m=e.target.closest('.mi'); if(!m) return; st.zone='menu'; st.menu=+m.dataset.i; menuAct(1); });
  root.querySelectorAll('.bhead .bump').forEach(b=>b.addEventListener('click',()=>cycleForm(+b.dataset.f)));
  $('.cards').addEventListener('click',e=>{ const c=e.target.closest('.card'); if(c) pickSeat({kind:'xi',k:c.dataset.k}); });
  $('.slots').addEventListener('click',e=>{ const s=e.target.closest('.slot'); if(s&&!s.classList.contains('empty')) pickSeat({kind:'bench',k:+s.dataset.i}); });
  $('.kick').addEventListener('click',kickOff);
  $('.hints .o').addEventListener('click',back);
  $('.hints .s').addEventListener('click',autoChoose);
  $('.hints .t').addEventListener('click',()=>{ st.zone=st.zone==='menu'?'team':'menu'; renderFocus(); });
  $('.confirm .ok').addEventListener('click',()=>doSwap(true));
  $('.confirm .no').addEventListener('click',()=>doSwap(false));
  $('.markov .mine').addEventListener('click',e=>{ const clr=e.target.closest('[data-clr]'); if(clr){ delete tmState().marks[clr.dataset.clr]; renderMark(); return; }
    const r=e.target.closest('.mk'); if(r){ st.mk.pick=(st.mk.pick===r.dataset.k)?null:r.dataset.k; renderMark(); } });
  $('.markov .opps').addEventListener('click',e=>{ const r=e.target.closest('.op'); if(r) assignMark(+r.dataset.o); });
  $('.markov .clr').addEventListener('click',()=>{ tmState().marks={}; st.mk.pick=null; renderMark(); });
  $('.markov .done').addEventListener('click',closeMark);
  fit();
  return true;
}
function fit(){
  const r=document.getElementById('s-team'), stage=r&&r.querySelector('.tm2-stage'); if(!stage) return;
  const w=r.clientWidth||1920, h=r.clientHeight||1080, s=Math.min(w/1920,h/1080);
  stage.style.transform='translate(-50%,-50%) scale('+s+')';
}
addEventListener('resize',fit);

/* ── pitch projection (trapezoid) ── */
const B={yb:590,yt:56,wb:980,wt:740,cx:500};
function g(v){ return v*1.1/(1+0.1*v); }
function P(u,v){ const k=g(v), w=B.wb+(B.wt-B.wb)*k; return {x:B.cx+(u-0.5)*w, y:B.yb-(B.yb-B.yt)*k, s:1-0.2*k}; }
function drawPitch(){
  let s='';
  const quad=(u0,v0,u1,v1,fill)=>'<polygon points="'+[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)].map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ')+'" fill="'+fill+'"/>';
  for(let i=0;i<10;i++) s+=quad(0,i/10,1,(i+1)/10,i%2?'#2c7a33':'#338a3a');
  const line=pts=>'<polyline points="'+pts.map(q=>{const p=P(q[0],q[1]);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ')+'" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3"/>';
  s+=line([[0,0],[1,0],[1,1],[0,1],[0,0]]); s+=line([[.2,0],[.2,.24],[.8,.24],[.8,0]]); s+=line([[.36,0],[.36,.09],[.64,.09],[.64,0]]);
  const arc=[];for(let i=0;i<=24;i++){const a=Math.PI*(i/24);arc.push([.5+Math.cos(a)*.12,.24+Math.sin(a)*.06]);} s+=line(arc);
  s+=line([[0,.82],[1,.82]]); const cc=[];for(let i=0;i<=40;i++){const a=Math.PI*2*(i/40);cc.push([.5+Math.cos(a)*.14,.82+Math.sin(a)*.13]);} s+=line(cc);
  $('.pitch').innerHTML=s;
}

const plate=(p,role)=>'<div class="plate"><span class="role '+rc(role)+'">'+role+'</span><span class="ovr">'+ovr(p)+'</span><span class="nm">'+p.name+'</span></div>';
const isSel=(kind,k)=>st.sel&&st.sel.kind===kind&&st.sel.k===k;
/* pad cursor order over players: the XI in slot order, then the bench */
function seats(){ return SLOTS.map(k=>({kind:'xi',k})).concat([0,1,2,3].filter(i=>bench()[i]).map(i=>({kind:'bench',k:i}))); }
const isCur=(kind,k)=>{ if(st.zone!=='team') return false; const s=seats()[st.pcur]; return !!s&&s.kind===kind&&s.k===k; };

function renderCards(){
  const C=(FORMATIONS[activeHomeFormation]||FORMATIONS['4-3-3']).coords;
  const order=SLOTS.slice().sort((a,b)=>C[b].x-C[a].x);
  const L=order.map(k=>{ const q=P(C[k].y,(C[k].x-0.02)/0.61); return {k,x:q.x,y:q.y,s:q.s}; });
  /* no two cards may touch: the NEARER one steps down just enough */
  const bx=o=>({l:o.x-56*o.s,r:o.x+56*o.s,t:o.y-128*o.s,b:o.y});
  for(let pass=0;pass<4;pass++) for(let i=0;i<L.length;i++) for(let j=0;j<L.length;j++){ if(i===j) continue;
    const far=L[i], near=L[j]; if(near.y<far.y) continue; const A=bx(far), Bb=bx(near);
    const w=Math.min(A.r,Bb.r)-Math.max(A.l,Bb.l), h=Math.min(A.b,Bb.b)-Math.max(A.t,Bb.t); if(w>0&&h>0) near.y+=h+6; }
  $('.cards').innerHTML=L.map(o=>{ const p=byId(HOME_SLOT_ASSIGN[o.k]); if(!p) return ''; const role=roleOf(o.k);
    return '<div class="card '+rc(role)+(isSel('xi',o.k)?' sel':'')+(isCur('xi',o.k)?' cur':'')+'" data-k="'+o.k+'" style="left:'+(o.x-56)+'px;top:'+(56+o.y-122)+'px;transform:scale('+o.s.toFixed(3)+')">'+
      '<canvas class="hf" width="168" height="168" data-id="'+p.id+'"></canvas>'+plate(p,role)+'</div>'; }).join('');
  root.querySelectorAll('.cards canvas.hf').forEach(c=>faceSq(c,byId(+c.dataset.id)));
  $('.bhead .f').textContent=activeHomeFormation;
}
function renderBench(){
  $('.slots').innerHTML=bench().map((id,i)=>{ const p=id&&byId(id);
    if(!p) return '<div class="slot empty'+(i===0?' gkslot':'')+'" data-i="'+i+'">+</div>';
    const role=posLabel(p);
    return '<div class="slot '+rc(role)+(i===0?' gkslot':'')+(isSel('bench',i)?' sel':'')+(isCur('bench',i)?' cur':'')+'" data-i="'+i+'"><canvas class="hf" width="200" height="200" data-id="'+p.id+'"></canvas>'+plate(p,role)+'</div>'; }).join('');
  root.querySelectorAll('.slots canvas.hf').forEach(c=>faceSq(c,byId(+c.dataset.id)));
}
function drawRadar(p){
  const cv=$('.radar'), g2=cv.getContext('2d'), W=cv.width, H=cv.height, cx=W/2, cy=H/2+6, R=138;
  const v=k=>+gs(p,k)||0;
  const keys=p.pos==='GK'?[['SAV',p.sav||v('def')],['REF',p.ref||v('spd')],['DEF',v('def')],['PAS',v('pas')],['POW',v('pow')],['SPD',v('spd')]]
                         :[['SPD',v('spd')],['SHO',v('sho')],['PAS',v('pas')],['DRI',v('dri')],['DEF',v('def')],['POW',v('pow')]];
  g2.clearRect(0,0,W,H);
  const pt=(i,r)=>{ const a=-Math.PI/2+i*Math.PI/3; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; };
  g2.lineWidth=2;
  for(let ring=1;ring<=4;ring++){ g2.beginPath(); for(let i=0;i<6;i++){ const q=pt(i,R*ring/4); i?g2.lineTo(q[0],q[1]):g2.moveTo(q[0],q[1]); } g2.closePath(); g2.strokeStyle='rgba(160,190,240,'+(ring===4?.45:.16)+')'; g2.stroke(); }
  for(let i=0;i<6;i++){ const q=pt(i,R); g2.beginPath(); g2.moveTo(cx,cy); g2.lineTo(q[0],q[1]); g2.strokeStyle='rgba(160,190,240,.16)'; g2.stroke(); }
  g2.beginPath(); keys.forEach((kv,i)=>{ const q=pt(i,R*Math.max(0,Math.min(1,(kv[1]-40)/60))); i?g2.lineTo(q[0],q[1]):g2.moveTo(q[0],q[1]); }); g2.closePath();
  g2.fillStyle='rgba(47,140,255,.45)'; g2.fill(); g2.strokeStyle='#57b0ff'; g2.lineWidth=3; g2.stroke();
  keys.forEach((kv,i)=>{ const q=pt(i,R+34); g2.textAlign='center'; g2.textBaseline='middle';
    g2.fillStyle='#9fb2cc'; g2.font='700 22px Rajdhani, sans-serif'; g2.fillText(kv[0],q[0],q[1]-11);
    g2.fillStyle='#fff'; g2.font='24px "Bold Pixel", monospace'; g2.fillText(String(kv[1]),q[0],q[1]+13); });
}
function renderPanel(){
  const s=st.sel, id=s.kind==='xi'?HOME_SLOT_ASSIGN[s.k]:bench()[s.k], p=byId(id); if(!p) return;
  const role=s.kind==='xi'?roleOf(s.k):posLabel(p);
  $('.pid .jn').textContent=p.jersey!=null?p.jersey:''; $('.pid .pn').textContent=p.name; const pr=$('.pid .pr'); pr.textContent=role; pr.className='role pr '+rc(role);
  $('.povr b').textContent=ovr(p);
  let sp='—'; try{ const x=getSpecial(p); if(x&&x.l) sp=x.l; }catch(e){}
  $('.pinfo').innerHTML='<div>Status<b>'+(s.kind==='xi'?'STARTER':'SUBSTITUTE')+'</b></div><div>Special skill<b>'+sp+'</b></div>';
  faceWide($('.face canvas'),p); drawRadar(p);
}
function markCount(){ const m=tmState().marks; return Object.keys(m).filter(k=>m[k]).length; }
function renderMenu(){
  const rows=[['form','FORMATION','<span class="num">'+activeHomeFormation+'</span>'],['tac','TACTICS',TACTICS[tmState().tac||0]],
              ['mark','MARKING',markCount()?'<span class="num">'+markCount()+'</span> SET':'ZONAL'],['auto','AUTO-CHOOSE','']];
  $('.menu').innerHTML=rows.map((r,i)=>'<div class="mi'+(st.zone==='menu'&&i===st.menu?' on':'')+'" data-i="'+i+'">'+ICON[r[0]]+'<span class="lab">'+r[1]+'</span>'+
    (r[2]?'<span class="val"><em>◀</em>'+r[2]+'<em>▶</em></span>':'')+'</div>').join('');
  $('.kick').classList.toggle('cur',st.zone==='menu'&&st.menu===4);
}
function renderFocus(){ renderMenu(); renderCards(); renderBench(); }
function render(){
  if(!HT) return;
  if(!root||!document.querySelector('#s-team .tm2')) build();
  normBench();
  if(!byId(st.sel.kind==='xi'?HOME_SLOT_ASSIGN[st.sel.k]:bench()[st.sel.k])) st.sel={kind:'xi',k:HOME_SLOT_ASSIGN.CM2?'CM2':'ST'};
  const cap=$('.hero'), src='assets/team/captain-'+selHome+'.png';
  if(cap.dataset.src!==src){ cap.dataset.src=src; cap.style.backgroundImage='none'; const im=new Image(); im.onload=()=>{ if(cap.dataset.src===src) cap.style.backgroundImage='url("'+src+'")'; }; im.src=src; }
  const nm=HT.name||'';
  $('.tname').textContent=nm; $('.tname').style.fontSize=Math.min(88,Math.floor(360/(nm.length*0.72)))+'px';
  $('.fixture').innerHTML='<b>'+nm+'</b> &nbsp;VS&nbsp; <i>'+((AT&&AT.name)||'')+'</i>';
  $('.kick b').textContent=(typeof G_teamEditorOrigin!=='undefined'&&G_teamEditorOrigin==='pause')?'APPLY & RESUME':'KICK OFF';
  drawPitch(); renderFocus(); renderPanel(); fit();
}

/* ── actions ── */
function cycleForm(d){ const F=Object.keys(FORMATIONS), i=F.indexOf(activeHomeFormation);
  activeHomeFormation=F[(i+d+F.length)%F.length];
  try{ if(typeof CAR!=='undefined'&&CAR.active){ CAR.formation=activeHomeFormation; if(T[CAR.myClub]) T[CAR.myClub].formation=activeHomeFormation; } }catch(e){}
  save(); renderFocus(); renderPanel(); }
function menuAct(d){
  if(st.menu===0) cycleForm(d);
  else if(st.menu===1){ const t=tmState(); t.tac=((t.tac||0)+d+TACTICS.length)%TACTICS.length; save(); renderMenu(); }
  else if(st.menu===2) openMark();
  else if(st.menu===3) autoChoose();
  else if(st.menu===4) kickOff();
}
/* best XI (engine's own picker), then the best spare keeper + 3 best outfield on the bench */
function autoChoose(){
  if(typeof initHomeSlots==='function') initHomeSlots(false);
  const inXI=new Set(Object.values(HOME_SLOT_ASSIGN).filter(Boolean));
  const rest=roster().filter(p=>!inXI.has(p.id)).sort((a,b)=>ovr(b)-ovr(a));
  const gk=rest.find(p=>p.pos==='GK'), field=rest.filter(p=>p.pos!=='GK').slice(0,3).map(p=>p.id);
  HOME_RESERVES=[gk?gk.id:null].concat(field); while(HOME_RESERVES.length<6) HOME_RESERVES.push(null);
  st.sel={kind:'xi',k:'CM2'}; st.armed=false; save(); renderFocus(); renderPanel();
}
const idOf=o=>o.kind==='xi'?HOME_SLOT_ASSIGN[o.k]:bench()[o.k];
const gkSeat=o=>(o.kind==='xi'&&o.k==='GK')||(o.kind==='bench'&&o.k===0);
function canSwap(a,b){ if(!byId(idOf(a))||!byId(idOf(b))) return false; if(a.kind==='bench'&&b.kind==='bench') return false; return gkSeat(a)===gkSeat(b); }
function pickSeat(t){
  if(st.pend) return;
  const s=st.sel;
  if(st.armed&&s&&!(s.kind===t.kind&&s.k===t.k)&&canSwap(s,t)){
    st.pend={a:s,b:t};
    $('.confirm .q').textContent=(s.kind==='bench'||t.kind==='bench')?'CONFIRM SUBSTITUTION':'CONFIRM SWAP';
    $('.confirm .who').innerHTML=byId(idOf(s)).name+'<span>⇄</span>'+byId(idOf(t)).name;
    $('.confirm').classList.add('on'); return;
  }
  st.sel=t; st.armed=true; renderCards(); renderBench(); renderPanel();
}
function doSwap(ok){
  const P2=st.pend; $('.confirm').classList.remove('on'); st.pend=null; if(!P2) return;
  if(ok){ const ia=idOf(P2.a), ib=idOf(P2.b);
    const put=(o,id)=>{ if(o.kind==='xi') HOME_SLOT_ASSIGN[o.k]=id; else HOME_RESERVES[o.k]=id; };
    put(P2.a,ib); put(P2.b,ia); st.sel=P2.a.kind==='xi'?P2.a:P2.b; save(); }
  st.armed=false; renderCards(); renderBench(); renderPanel();
}
function kickOff(){
  if(typeof G_teamEditorOrigin!=='undefined'&&G_teamEditorOrigin==='pause'&&typeof pzCloseSquadEditor==='function'){ pzCloseSquadEditor(); return; }
  if(typeof startGame==='function') startGame();
}
function back(){ if(typeof teamEditorBack==='function') teamEditorBack(); else if(typeof tmBackHandler==='function') tmBackHandler(); }

/* ── marking ── */
function opps(){
  if(!AT||!AT.p) return [];
  const res=new Set(AT.reserves||[]);
  let fm='4-3-3'; try{ fm=awayFormationFor(selAway,AT)||fm; }catch(e){}
  const labels=(FORMATIONS[fm]||FORMATIONS['4-3-3']).labels;
  return AT.p.filter(p=>!res.has(p.id)&&p.pos!=='GK').slice(0,10).map(p=>({p,role:labels[p.pos]||posLabel(p)}));
}
function openMark(){ st.mk={open:true,pick:null,col:'mine',cur:0}; renderMark(); $('.markov').classList.add('on'); }
function closeMark(){ st.mk.open=false; $('.markov').classList.remove('on'); save(); renderMenu(); }
function assignMark(oid){ if(!st.mk.pick) return; const m=tmState().marks;
  Object.keys(m).forEach(k=>{ if(m[k]===oid) delete m[k]; }); m[st.mk.pick]=oid; st.mk.pick=null; st.mk.col='mine'; renderMark(); }
function renderMark(){
  const m=tmState().marks, O=opps(), oBy=id=>{ const o=O.find(x=>x.p.id===id); return o&&o.p; };
  const mine=SLOTS.filter(k=>k!=='GK');
  $('.markov .mine').innerHTML=mine.map((k,i)=>{ const p=byId(HOME_SLOT_ASSIGN[k]); if(!p) return ''; const role=roleOf(k), t=m[k]&&oBy(m[k]);
    return '<div class="mk'+(st.mk.pick===k?' pick':'')+(st.mk.col==='mine'&&st.mk.cur===i?' cur':'')+'" data-k="'+k+'"><canvas width="104" height="104" data-id="'+p.id+'"></canvas><span class="role '+rc(role)+'">'+role+'</span><span class="nm">'+p.name+'</span>'+
      (t?'<span class="tgt set">MARKS <b>'+t.name+'</b><i data-clr="'+k+'">✕</i></span>':'<span class="tgt">ZONAL</span>')+'</div>'; }).join('');
  const markedBy={}; Object.keys(m).forEach(k=>{ if(m[k]) markedBy[m[k]]=byId(HOME_SLOT_ASSIGN[k]); });
  $('.markov .oname').textContent=((AT&&AT.name)||'OPPONENT').toUpperCase();
  $('.markov .opps').innerHTML=O.map((o,i)=>'<div class="op'+(markedBy[o.p.id]?' taken':'')+(st.mk.col==='opp'&&st.mk.cur===i?' cur':'')+'" data-o="'+o.p.id+'"><canvas width="104" height="104" data-o="'+o.p.id+'"></canvas>'+
    '<span class="nm"><span class="role '+rc(o.role)+'">'+o.role+'</span>'+o.p.name+'</span><span class="ovr">'+ovr(o.p)+'</span>'+
    '<span class="by">'+(markedBy[o.p.id]?'MARKED BY '+markedBy[o.p.id].name:'FREE')+'</span></div>').join('');
  $('.markov').classList.toggle('picking',!!st.mk.pick);
  root.querySelectorAll('.markov .mine canvas').forEach(c=>faceSq(c,byId(+c.dataset.id),'h'));
  root.querySelectorAll('.markov .opps canvas').forEach(c=>{ const o=O.find(x=>x.p.id===+c.dataset.o); if(o) faceSq(c,o.p,'a'); });
}

/* ── pad / keys: game.js menu nav delegates here while #s-team is up ── */
function owns(){ const s=document.getElementById('s-team'); return !!(s&&s.classList.contains('active')&&document.querySelector('#s-team .tm2')&&!document.querySelector('.ae-modal.show')); }
function step(d){
  if(st.pend) return;
  if(st.mk.open){ const n=st.mk.col==='mine'?root.querySelectorAll('.markov .mk').length:root.querySelectorAll('.markov .op').length;
    if(n) st.mk.cur=(st.mk.cur+d+n)%n; renderMark(); return; }
  if(st.zone==='menu'){ st.menu=(st.menu+d+5)%5; renderMenu(); return; }
  const n=seats().length; st.pcur=(st.pcur+d+n)%n; renderCards(); renderBench();
}
function confirm(){
  if(st.pend){ doSwap(true); return true; }
  if(st.mk.open){
    if(st.mk.col==='mine'){ const r=root.querySelectorAll('.markov .mk')[st.mk.cur]; if(r){ st.mk.pick=r.dataset.k; st.mk.col='opp'; st.mk.cur=0; renderMark(); } }
    else { const r=root.querySelectorAll('.markov .op')[st.mk.cur]; if(r) assignMark(+r.dataset.o); }
    return true; }
  if(st.zone==='menu'){ menuAct(1); return true; }
  const s=seats()[st.pcur]; if(s) pickSeat(s); return true;
}
function cancel(){
  if(st.pend){ doSwap(false); return; }
  if(st.mk.open){ if(st.mk.pick){ st.mk.pick=null; st.mk.col='mine'; renderMark(); } else closeMark(); return; }
  if(st.armed){ st.armed=false; renderCards(); renderBench(); return; }
  back();
}
window.TM2={ owns:owns, step:step, confirm:confirm, back:cancel, render:render };
if(window.UEInput&&UEInput.on){
  UEInput.on('SWITCH',()=>{ if(owns()&&!st.mk.open&&!st.pend) cycleForm(-1); })     // L1
         .on('SPRINT',()=>{ if(owns()&&!st.mk.open&&!st.pend) cycleForm(1); })      // R1
         .on('SHOOT', ()=>{ if(owns()&&!st.pend){ if(st.mk.open){ const r=root.querySelectorAll('.markov .mk')[st.mk.cur]; if(r&&st.mk.col==='mine'){ delete tmState().marks[r.dataset.k]; renderMark(); } } else autoChoose(); } })  // square
         .on('PASS',  ()=>{ if(owns()&&!st.pend&&!st.mk.open){ st.zone=st.zone==='menu'?'team':'menu'; renderFocus(); } })   // triangle
         .on('PAUSE', ()=>{ if(owns()&&!st.pend&&!st.mk.open&&UEInput.padDown&&UEInput.padDown('start')) kickOff(); });       // Start
}
addEventListener('keydown',e=>{ if(!owns()) return; const k=(e.key||'').toLowerCase();
  if(k==='pageup') cycleForm(-1); else if(k==='pagedown') cycleForm(1); });

/* the engine calls buildFormationMenu() from openTeamMenu / initHomeSlots / assignPlayerToSlot */
try{ buildFormationMenu=function(){ try{ render(); }catch(e){ console.warn('[TM2] render',e); } }; }
catch(e){ window.buildFormationMenu=function(){ try{ render(); }catch(_){} }; }
})();
