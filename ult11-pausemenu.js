/* ============================================================
   ULT11-PAUSEMENU · Ultimate Eleven                     2026-09-24
   The in-match pause menu, from the approved lab mockup
   (lab/lab-pausemenu.html). Load AFTER game.js and ult11-teamselect.js.
   It takes over pzBuildAll(), so togglePause() / pzCloseSquadEditor()
   draw this screen inside #pause-overlay.

   Both teams on the Team Management pitch (head-crop cards in role
   colours, 4-man bench); the CPU side shows ITS formation and its faces
   are mirrored. Captains fade behind the pitches; team names sit on
   their board's bar; scoreboard with the stopped clock.

   Every existing action is kept: SUBSTITUTIONS -> pzShowSquad() (the new
   Team Management editor), MATCH FACTS -> pzShowMdata() (panel ids kept:
   pz-pause-panel / pz-mdata-panel / pz-mdata-rows / pz-md-*), HOW TO PLAY
   -> openHelp(), SETTINGS -> openSettings(), RESTART -> pzRestart(),
   FORFEIT -> pzForfeit(), RESUME -> togglePause().

   Pad: the old overlay had no pad navigation (menu nav is off on
   s-match). game.js's nav hooks now delegate here while it is open:
   stick moves, X selects, O resumes (or leaves Match Facts).
   Fonts: ONLY Cinzel / Rajdhani / Bold Pixel.
   ============================================================ */
(function(){
'use strict';

const SLOTS=['GK','LB','CB1','CB2','RB','CM1','CM2','CM3','LW','ST','RW'];
const TACTICS=['BALANCED','ATTACKING','DEFENSIVE','COUNTER','POSSESSION'];
function rc(r){ r=String(r||'').toUpperCase(); if(r==='GK') return 'gk';
  if(/^(ST|ST1|ST2|CF|LW|RW|FW)$/.test(r)) return 'fwd';
  if(/^(DM|CM|LCM|RCM|LM|RM|LAM|CAM|RAM|AM|CM1|CM2|CM3)$/.test(r)) return 'mid'; return 'def'; }
const posLabel=p=>p.pos==='GK'?'GK':String(p.pos||'').replace(/\d/,'');
const ovr=p=>+calcOvr(p)||0;

/* ── faces: in-match bust crop (headBox, game.js) off the duel front art ── */
const FACE={};
function faceImg(p,side,cb){
  const key=side+':'+p.id+':'+p.name, o=FACE[key]||(FACE[key]={q:[],img:null,done:false});
  if(o.done){ cb(o.img); return; } o.q.push(cb); if(o.q.length>1) return;
  const ln=(typeof playerLastName==='function'?playerLastName(p):'')||'', team=side==='a'?selAway:selHome;
  const chain=p.pos==='GK'?['assets/players/front/'+ln+'.png','assets/players/'+ln+'.png','assets/players/front/'+team+'.png']
                          :['assets/players/front/'+ln+'.png','assets/players/front/'+team+'.png','assets/players/'+team+'.png'];
  let i=0; const im=new Image();
  im.onload=()=>{ o.img=im; o.done=true; o.q.forEach(f=>f(im)); o.q=[]; };
  im.onerror=()=>{ if(++i<chain.length) im.src=chain[i]; else { o.done=true; o.q.forEach(f=>f(null)); o.q=[]; } };
  im.src=chain[0];
}
function faceSq(cv,p,side){ faceImg(p,side,im=>{ const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); if(!im) return;
  let b=null; try{ b=headBox(im); }catch(e){} b=b||{sx:0,sy:0,size:Math.min(im.naturalWidth,im.naturalHeight)};
  g.imageSmoothingQuality='high'; g.drawImage(im,b.sx,b.sy,b.size,b.size,0,0,cv.width,cv.height); }); }

/* ── CSS ── */
function ensureCss(){
  if(document.getElementById('pm2-css')) return;
  const st=document.createElement('style'); st.id='pm2-css';
  st.textContent=`
/* match HUD layers that sit above the overlay (kick-off prompt z 8200, bust chips) hide while paused */
body:has(#pause-overlay.show) #kickoff-prompt,body:has(#pause-overlay.show) #hud-chips,body:has(#pause-overlay.show) #bust-h,body:has(#pause-overlay.show) #bust-a,body:has(#pause-overlay.show) #dpad,body:has(#pause-overlay.show) #vjoy-base,body:has(#pause-overlay.show) #s-match .mcomm{visibility:hidden!important}
#pause-overlay .pm2{position:absolute;inset:0;overflow:hidden;background:#030a18;color:#fbfbfc;font-family:'Rajdhani',system-ui,sans-serif;z-index:5;
  --home:#2f8cff;--glow:rgba(47,140,255,.7);--panel:rgba(2,10,26,.8);--rule:rgba(38,126,226,.45);--dim:#9fb2cc;--mute:#48586a}
#pause-overlay .pm2-stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform-origin:center}
#pause-overlay .pm2 .bg{position:absolute;inset:0;background:url('assets/wallpaper/teamselect2.jpg') center -110px/1920px auto no-repeat;filter:brightness(.5) saturate(.9)}
#pause-overlay .pm2 .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(3,10,24,.35),rgba(3,10,24,.2) 30%,rgba(3,10,24,.75) 70%,rgba(3,10,24,.95))}
#pause-overlay .pm2 .cap{position:absolute;top:-30px;width:640px;height:560px;background-repeat:no-repeat;background-size:contain;opacity:.9;
  -webkit-mask:linear-gradient(to bottom,#000 40%,transparent 92%);mask:linear-gradient(to bottom,#000 40%,transparent 92%)}
#pause-overlay .pm2 .cap.l{left:-40px;background-position:bottom left} #pause-overlay .pm2 .cap.r{right:-40px;background-position:bottom right}
#pause-overlay .pm2 .tn{position:absolute;top:212px;width:640px;text-align:center;font:900 76px/1 'Cinzel',serif;text-transform:uppercase;white-space:nowrap;text-shadow:0 4px 0 rgba(0,0,0,.5),0 0 30px rgba(0,0,0,.8)}
#pause-overlay .pm2 .tn.l{left:40px} #pause-overlay .pm2 .tn.r{right:40px}
#pause-overlay .pm2 .score{position:absolute;left:50%;top:40px;width:470px;margin-left:-235px;height:100px;display:flex;align-items:center;justify-content:center;gap:26px;
  background:rgba(2,10,26,.88);border:1px solid var(--rule);clip-path:polygon(0 0,100% 0,100% 70%,78% 100%,22% 100%,0 70%)}
#pause-overlay .pm2 .score .fl,#pause-overlay .pm2 .score .em{width:78px;height:52px;display:flex;align-items:center;justify-content:center;font-size:40px}
#pause-overlay .pm2 .score .fl{box-shadow:0 2px 8px rgba(0,0,0,.6)}
#pause-overlay .pm2 .score .em img,#pause-overlay .pm2 .score .em svg{max-height:52px;max-width:78px}
#pause-overlay .pm2 .score .sc{font:400 58px/1 'Bold Pixel',monospace;font-synthesis:none;letter-spacing:.06em}
#pause-overlay .pm2 .clock{position:absolute;left:50%;top:140px;width:220px;margin-left:-110px;text-align:center;padding:8px 0 10px;background:rgba(2,10,26,.92);border:1px solid var(--rule);border-top:0}
#pause-overlay .pm2 .clock b{display:block;font:400 30px/1 'Bold Pixel',monospace;font-synthesis:none}
#pause-overlay .pm2 .clock span{display:block;margin-top:6px;font:700 13px/1 'Rajdhani';letter-spacing:.3em;color:var(--dim)}
#pause-overlay .pm2 .clock i{font-style:normal;color:#ffb020}
#pause-overlay .pm2 .tb{position:absolute;top:300px;width:640px;height:740px}
#pause-overlay .pm2 .tb.l{left:40px} #pause-overlay .pm2 .tb.r{right:40px}
#pause-overlay .pm2 .tb .box{position:absolute;left:-30px;right:-30px;top:-20px;bottom:-20px;background:rgba(1,6,18,.86);
  -webkit-mask:radial-gradient(ellipse 60% 58% at 50% 50%,#000 70%,transparent 100%);mask:radial-gradient(ellipse 60% 58% at 50% 50%,#000 70%,transparent 100%)}
#pause-overlay .pm2 .tb .hd{position:absolute;left:0;right:0;top:0;height:46px;display:flex;align-items:center;gap:14px;padding:0 14px;background:rgba(2,10,26,.72);border-bottom:1px solid var(--rule)}
#pause-overlay .pm2 .tb .hd .t{font:700 17px/1 'Rajdhani';letter-spacing:.22em;padding:13px 18px;background:linear-gradient(180deg,rgba(47,140,255,.5),rgba(47,140,255,.15));box-shadow:inset 0 -2px 0 var(--home)}
#pause-overlay .pm2 .tb.r .hd .t{background:linear-gradient(180deg,rgba(233,238,246,.3),rgba(233,238,246,.08));box-shadow:inset 0 -2px 0 #fff}
#pause-overlay .pm2 .tb .hd .f{margin-left:auto;font:400 24px/1 'Bold Pixel',monospace;font-synthesis:none}
#pause-overlay .pm2 .tb .hd .tac{font:700 14px/1 'Rajdhani';letter-spacing:.24em;color:var(--dim)}
#pause-overlay .pm2 .tb svg.pitch{position:absolute;left:0;top:52px;width:640px;height:440px}
#pause-overlay .pm2 .tb .cards{position:absolute;left:0;top:52px;width:640px;height:440px}
#pause-overlay .pm2 .card{position:absolute;width:112px;transform-origin:50% 100%}
#pause-overlay .pm2 .hf{display:block;border:2px solid #2f8cff;background:radial-gradient(circle at 50% 70%,rgba(47,140,255,.45),rgba(2,10,26,.9))}
#pause-overlay .pm2 .card .hf{width:80px;height:80px;margin:0 auto -2px;box-shadow:0 6px 10px rgba(0,0,0,.55)}
#pause-overlay .pm2 .gk .hf{border-color:#e0a020;background:radial-gradient(circle at 50% 70%,rgba(224,160,32,.45),rgba(2,10,26,.9))}
#pause-overlay .pm2 .mid .hf{border-color:#1faa55;background:radial-gradient(circle at 50% 70%,rgba(31,170,85,.45),rgba(2,10,26,.9))}
#pause-overlay .pm2 .fwd .hf{border-color:#dc2f3a;background:radial-gradient(circle at 50% 70%,rgba(220,47,58,.45),rgba(2,10,26,.9))}
#pause-overlay .pm2 .mirror .hf{transform:scaleX(-1)}
#pause-overlay .pm2 .plate{position:relative;height:44px;background:linear-gradient(180deg,rgba(6,16,38,.95),rgba(2,8,22,.95));border:1px solid rgba(120,170,255,.45);
  display:grid;grid-template-columns:auto 1fr;grid-template-rows:20px 22px;align-items:center;padding:0 7px;column-gap:6px}
#pause-overlay .pm2 .role{font:700 13px/1 'Rajdhani';padding:2px 5px;letter-spacing:.04em;background:#2f8cff;color:#fff}
#pause-overlay .pm2 .role.gk{background:#e0a020;color:#1b1400} #pause-overlay .pm2 .role.mid{background:#1faa55} #pause-overlay .pm2 .role.fwd{background:#dc2f3a}
#pause-overlay .pm2 .plate .ovr{text-align:right;font:400 20px/1 'Bold Pixel',monospace;font-synthesis:none}
#pause-overlay .pm2 .plate .nm{grid-column:1/3;font:700 15px/1 'Rajdhani';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pause-overlay .pm2 .tb .subs{position:absolute;left:0;right:0;top:526px}
#pause-overlay .pm2 .tb .subs h3{margin:0 0 8px;font:700 16px/1 'Rajdhani';letter-spacing:.28em}
#pause-overlay .pm2 .slots{display:flex;gap:10px}
#pause-overlay .pm2 .slot{width:150px;height:150px;position:relative;background:var(--panel);border:1px solid rgba(120,170,255,.3);overflow:hidden}
#pause-overlay .pm2 .slot .hf{position:absolute;left:50%;top:6px;width:96px;height:96px;margin-left:-48px}
#pause-overlay .pm2 .slot .plate{position:absolute;left:0;right:0;bottom:0;border-width:1px 0 0}
#pause-overlay .pm2 .slot.empty{display:flex;align-items:center;justify-content:center;font:700 36px/1 'Rajdhani';color:var(--mute)}
#pause-overlay .pm2 .slot.gkslot::before{content:"GK";position:absolute;left:6px;top:6px;z-index:1;font:700 12px/1 'Rajdhani';letter-spacing:.14em;color:#e0a020}
#pause-overlay .pm2 .menu{position:absolute;left:50%;top:320px;width:420px;margin-left:-210px}
#pause-overlay .pm2 .menu.hide{display:none}
#pause-overlay .pm2 .menu .hd{text-align:center;margin-bottom:18px}
#pause-overlay .pm2 .menu .hd p,#pause-overlay .pm2 .mdata .hd p{margin:0;font:700 14px/1 'Rajdhani';letter-spacing:.4em;color:var(--dim)}
#pause-overlay .pm2 .menu .hd h1,#pause-overlay .pm2 .mdata .hd h1{margin:8px 0 0;font:700 30px/1 'Cinzel',serif;letter-spacing:.24em}
#pause-overlay .pm2 .list{border-top:1px solid rgba(255,255,255,.14)}
#pause-overlay .pm2 .mi{display:flex;align-items:center;gap:18px;height:60px;padding:0 24px;cursor:pointer;position:relative}
#pause-overlay .pm2 .mi::after{content:"";position:absolute;left:24px;right:0;bottom:0;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.04))}
#pause-overlay .pm2 .mi svg{width:28px;height:28px;flex:none;opacity:.85}
#pause-overlay .pm2 .mi b{font:700 21px/1 'Rajdhani';letter-spacing:.14em}
#pause-overlay .pm2 .mi.on{background:linear-gradient(90deg,#1b63d8 0%,#2f8cff 55%,rgba(47,140,255,.35) 100%);clip-path:polygon(0 0,100% 0,95% 100%,0 100%);box-shadow:0 0 24px var(--glow)}
#pause-overlay .pm2 .mi.on::after{display:none}
#pause-overlay .pm2 .mi.danger b{color:#ff6a70}
#pause-overlay .pm2 .mi.resume{margin-top:10px}
#pause-overlay .pm2 .mdata{position:absolute;left:50%;top:300px;width:440px;margin-left:-220px;display:none}
#pause-overlay .pm2 .mdata.show{display:block}
#pause-overlay .pm2 .mdata .hd{text-align:center;margin-bottom:16px;position:relative}
#pause-overlay .pm2 .mdata .back{position:absolute;left:0;top:0;font:700 16px/1 'Rajdhani';letter-spacing:.16em;color:var(--dim);cursor:pointer}
#pause-overlay .pm2 .mdata .teams{display:flex;justify-content:space-between;font:700 17px/1 'Rajdhani';letter-spacing:.2em;margin-bottom:12px}
#pause-overlay .pm2 .mdata .teams .h{color:var(--home)}
#pause-overlay .pm2 .pz-mrow{margin-bottom:14px}
#pause-overlay .pm2 .pz-mrow .vals{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
#pause-overlay .pm2 .pz-mrow .vals .h,#pause-overlay .pm2 .pz-mrow .vals .a{font:400 22px/1 'Bold Pixel',monospace;font-synthesis:none}
#pause-overlay .pm2 .pz-mrow .vals .lbl{font:700 14px/1 'Rajdhani';letter-spacing:.24em;color:var(--dim)}
#pause-overlay .pm2 .pz-mbar{display:flex;height:8px;background:rgba(255,255,255,.08)}
#pause-overlay .pm2 .pz-mbar .h{background:linear-gradient(90deg,#1b6fe0,#57b0ff)} #pause-overlay .pm2 .pz-mbar .a{background:linear-gradient(90deg,#b9c3d1,#fff)}
#pause-overlay .pm2 .hints{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:flex;gap:40px;font:600 20px/1 'Rajdhani';letter-spacing:.08em;white-space:nowrap}
#pause-overlay .pm2 .hints div{display:flex;align-items:center;gap:12px;cursor:pointer}
#pause-overlay .pm2 .hints i{font-style:normal;width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:16px}
#pause-overlay .pm2 .hints .x i{color:#78aaff} #pause-overlay .pm2 .hints .o i{color:#ff5050}
`;
  document.head.appendChild(st);
}

/* ── menu: every action the old overlay had ── */
const IC={
  sub:'<svg viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2.2"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
  facts:'<svg viewBox="0 0 24 24" fill="#cfe0ff"><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="3" width="4" height="17"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7"/><circle cx="12" cy="17.2" r=".6" fill="#cfe0ff"/></svg>',
  set:'<svg viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2.2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  rst:'<svg viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2.2"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
  quit:'<svg viewBox="0 0 24 24" fill="#ff6a70"><rect x="6" y="6" width="12" height="12"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="#cfe0ff"><path d="M7 4l13 8-13 8z"/></svg>'};
const ITEMS=[
  ['sub','SUBSTITUTIONS','',()=>{ if(typeof pzShowSquad==='function') pzShowSquad(); }],
  ['facts','MATCH FACTS','',()=>{ if(typeof pzShowMdata==='function') pzShowMdata(); }],
  ['help','HOW TO PLAY','',()=>{ if(typeof openHelp==='function') openHelp(); }],
  ['set','SETTINGS','',()=>{ if(typeof openSettings==='function') openSettings(); }],
  ['rst','RESTART MATCH','',()=>{ if(typeof pzRestart==='function') pzRestart(); }],
  ['quit','FORFEIT MATCH','danger',()=>{ if(typeof pzForfeit==='function') pzForfeit(); }],
  ['play','RESUME MATCH','resume',()=>{ if(typeof togglePause==='function') togglePause(); }]];
const halfItem=['play','SECOND HALF KICKOFF','resume',()=>{ if(typeof secondHalf==='function') secondHalf(); }];
const menuItems=()=>typeof G!=='undefined'&&G._halftime?ITEMS.slice(0,-1).concat([halfItem]):ITEMS;
let cur=0, root=null;
const $=s=>root&&root.querySelector(s);

function build(){
  const ov=document.getElementById('pause-overlay'); if(!ov) return false;
  ensureCss();
  ov.innerHTML='<div class="pm2"><div class="pm2-stage">'+
    '<div class="bg"></div><div class="cap l"></div><div class="cap r"></div><div class="tn l"></div><div class="tn r"></div>'+
    '<div class="score"><span class="flh"></span><span class="sc"></span><span class="fla"></span></div><div class="clock"><b></b><span></span></div>'+
    '<div class="tb l"><div class="box"></div><div class="hd"><span class="t">SQUAD</span><span class="tac"></span><span class="f"></span></div><svg class="pitch" viewBox="0 0 640 440"></svg><div class="cards"></div><div class="subs"><h3>SUBSTITUTES</h3><div class="slots"></div></div></div>'+
    '<div class="tb r"><div class="box"></div><div class="hd"><span class="t">SQUAD</span><span class="tac">CPU</span><span class="f"></span></div><svg class="pitch" viewBox="0 0 640 440"></svg><div class="cards mirror"></div><div class="subs"><h3>SUBSTITUTES</h3><div class="slots mirror"></div></div></div>'+
    '<div class="menu" id="pz-pause-panel"><div class="hd"><p>MATCH PAUSED</p><h1>MATCH MENU</h1></div><div class="list"></div></div>'+
    '<div class="mdata" id="pz-mdata-panel"><div class="hd"><span class="back">‹ BACK</span><p>MATCH PAUSED</p><h1>MATCH FACTS</h1></div>'+
      '<div class="teams"><span class="h" id="pz-md-hname"></span><span class="a" id="pz-md-aname"></span></div><div id="pz-mdata-rows"></div></div>'+
    '<div class="hints"><div class="x"><i>✕</i>SELECT</div><div class="o"><i>○</i>RESUME</div></div>'+
  '</div></div>';
  root=ov;
  $('.list').addEventListener('click',e=>{ const m=e.target.closest('.mi'); if(!m) return; cur=+m.dataset.i; renderMenu(); menuItems()[cur][3](); });
  $('.mdata .back').addEventListener('click',()=>{ if(typeof pzBackPause==='function') pzBackPause(); });
  $('.hints .x').addEventListener('click',()=>menuItems()[cur][3]());
  $('.hints .o').addEventListener('click',back);
  return true;
}
function fit(){ const ov=document.getElementById('pause-overlay'), stage=ov&&ov.querySelector('.pm2-stage'); if(!stage) return;
  const w=ov.clientWidth||1920, h=ov.clientHeight||1080, s=Math.min(w/1920,h/1080); stage.style.transform='translate(-50%,-50%) scale('+s+')'; }
addEventListener('resize',fit);

/* ── pitch (the Team Management board at 640 wide) ── */
const B={yb:405,yt:40,wb:620,wt:470,cx:320}, K=0.78, gg=v=>v*1.1/(1+0.1*v);
function P(u,v){ const k=gg(v),w=B.wb+(B.wt-B.wb)*k; return {x:B.cx+(u-0.5)*w,y:B.yb-(B.yb-B.yt)*k,s:(1-0.2*k)*K}; }
function pitch(svg){ let s=''; const quad=(u0,v0,u1,v1,f)=>'<polygon points="'+[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)].map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ')+'" fill="'+f+'"/>';
  for(let i=0;i<10;i++) s+=quad(0,i/10,1,(i+1)/10,i%2?'#2c7a33':'#338a3a');
  const line=pts=>'<polyline points="'+pts.map(q=>{const p=P(q[0],q[1]);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ')+'" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2.4"/>';
  s+=line([[0,0],[1,0],[1,1],[0,1],[0,0]])+line([[.2,0],[.2,.24],[.8,.24],[.8,0]])+line([[.36,0],[.36,.09],[.64,.09],[.64,0]]);
  const cc=[];for(let i=0;i<=40;i++){const a=Math.PI*2*(i/40);cc.push([.5+Math.cos(a)*.14,.82+Math.sin(a)*.13]);} s+=line([[0,.82],[1,.82]])+line(cc); svg.innerHTML=s; }
const plate=(p,role)=>'<div class="plate"><span class="role '+rc(role)+'">'+role+'</span><span class="ovr">'+ovr(p)+'</span><span class="nm">'+p.name+'</span></div>';
function board(el,side){
  const sqd=side==='h'?hSq:aSq, team=side==='h'?HT:AT, fm=(side==='h'?activeHomeFormation:activeAwayFormation)||'4-3-3', F=FORMATIONS[fm]||FORMATIONS['4-3-3'];
  pitch(el.querySelector('svg.pitch')); el.querySelector('.hd .f').textContent=fm;
  if(side==='h'){ const t=(HT&&HT._tm&&HT._tm.tac)||0; el.querySelector('.hd .tac').textContent=TACTICS[t]||'BALANCED'; }
  const C=F.coords, L=SLOTS.filter(k=>sqd&&sqd[k]).sort((a,b)=>C[b].x-C[a].x).map(k=>{ const q=P(C[k].y,(C[k].x-0.02)/0.61); return {k,x:q.x,y:q.y,s:q.s}; });
  const bx=o=>({l:o.x-56*o.s,r:o.x+56*o.s,t:o.y-128*o.s,b:o.y});
  for(let p=0;p<4;p++) for(let i=0;i<L.length;i++) for(let j=0;j<L.length;j++){ if(i===j) continue; const f=L[i],n=L[j]; if(n.y<f.y) continue; const A=bx(f),Bb=bx(n);
    const w=Math.min(A.r,Bb.r)-Math.max(A.l,Bb.l),h=Math.min(A.b,Bb.b)-Math.max(A.t,Bb.t); if(w>0&&h>0) n.y+=h+6; }
  const who={};
  el.querySelector('.cards').innerHTML=L.map((o,i)=>{ const p=sqd[o.k], role=o.k==='GK'?'GK':(F.labels[o.k]||posLabel(p)); who['c'+i]=p;
    return '<div class="card '+rc(role)+'" style="left:'+(o.x-56)+'px;top:'+(o.y-122)+'px;transform:scale('+o.s.toFixed(3)+')"><canvas class="hf" width="168" height="168" data-w="c'+i+'"></canvas>'+plate(p,role)+'</div>'; }).join('');
  /* bench: yours = the edited 4 seats; the CPU's = its listed reserves */
  const roster=(team&&team.p)||[], ids=side==='h'?(HOME_RESERVES||[]).slice(0,4):(team&&team.reserves||[]);
  const list=ids.map(id=>id&&roster.find(p=>p.id===id)).filter(Boolean);
  const gk=list.find(p=>p.pos==='GK')||null, field=list.filter(p=>p.pos!=='GK').slice(0,3), seats=[gk].concat(field); while(seats.length<4) seats.push(null);
  el.querySelector('.slots').innerHTML=seats.map((p,i)=>{ if(!p) return '<div class="slot empty'+(i===0?' gkslot':'')+'">+</div>'; const role=posLabel(p); who['b'+i]=p;
    return '<div class="slot '+rc(role)+(i===0?' gkslot':'')+'"><canvas class="hf" width="200" height="200" data-w="b'+i+'"></canvas>'+plate(p,role)+'</div>'; }).join('');
  el.querySelectorAll('canvas.hf').forEach(c=>faceSq(c,who[c.dataset.w],side));
}
function renderMenu(){ $('.list').innerHTML=menuItems().map((it,i)=>'<div class="mi'+(i===cur?' on':'')+(it[2]?' '+it[2]:'')+'" data-i="'+i+'">'+IC[it[0]]+'<b>'+it[1]+'</b></div>').join(''); }
function scoreSide(key,side){
  const fl=(window.TS2&&TS2.flagSVG)?TS2.flagSVG(key):'';
  const el=$(side==='h'?'.flh':'.fla');
  if(fl){ el.className=side==='h'?'flh':'fla'; el.innerHTML=fl; }
  else { el.innerHTML='<span class="em"></span>'; try{ setTeamEmblem(el.querySelector('.em'),key,(side==='h'?HT:AT)&&(side==='h'?HT:AT).flag||''); }catch(e){} }
}
function render(){
  if(!document.querySelector('#pause-overlay .pm2')) build();
  cur=0;
  const hn=(HT&&HT.name)||'HOME', an=(AT&&AT.name)||'AWAY';
  $('.cap.l').style.backgroundImage='url("assets/team/captain-'+selHome+'.png")';
  $('.cap.r').style.backgroundImage='url("assets/team/captain-'+selAway+'.png")';
  $('.tn.l').textContent=hn; $('.tn.r').textContent=an;
  [['.tn.l',hn],['.tn.r',an]].forEach(a=>{ $(a[0]).style.fontSize=Math.min(76,Math.floor(620/(a[1].length*0.8)))+'px'; });
  scoreSide(selHome,'h'); scoreSide(selAway,'a');
  $('.score .sc').textContent=(G.hG||0)+'-'+(G.aG||0);
  const ht=document.getElementById('htime');
  $('.clock b').textContent=G._halftime?'45:00':ht?ht.textContent:'';
  $('.clock span').innerHTML=G._halftime?'<i>HALF TIME</i>':(G.half===2?'2ND HALF':'1ST HALF')+' · <i>PAUSED</i>';
  $('.menu .hd p').textContent=G._halftime?'HALF TIME':'MATCH PAUSED';
  $('.mdata .hd p').textContent=G._halftime?'HALF TIME':'MATCH PAUSED';
  $('.hints .o').lastChild.textContent=G._halftime?'SECOND HALF':'RESUME';
  board($('.tb.l'),'h'); board($('.tb.r'),'a');
  renderMenu(); pzShowPause2(); fit();
}
function pzShowPause2(){ const m=$('#pz-mdata-panel'), p=$('#pz-pause-panel'); if(m) m.classList.remove('show'); if(p) p.classList.remove('hide'); }

/* ── pad / keys: game.js menu nav delegates here while the overlay is up ── */
function owns(){ const ov=document.getElementById('pause-overlay');
  return !!(ov&&ov.classList.contains('show')&&ov.querySelector('.pm2')&&typeof G!=='undefined'&&G.paused&&!document.querySelector('.ae-modal.show')); }
const inFacts=()=>{ const m=$('#pz-mdata-panel'); return !!(m&&m.classList.contains('show')); };
function step(d){ if(inFacts()) return; const items=menuItems();cur=(cur+d+items.length)%items.length; renderMenu(); }
function confirm(){ if(inFacts()) return true; menuItems()[cur][3](); return true; }
function back(){ if(inFacts()){ if(typeof pzBackPause==='function') pzBackPause(); return; }
  if(typeof G!=='undefined'&&G._halftime){secondHalf();return;}
  if(typeof togglePause==='function') togglePause(); }
window.PM2={ owns:owns, step:step, confirm:confirm, back:back, render:render };
/* The kick-off prompt lives on #viewport, outside #s-match, so it stayed up on
   the loading screen and in Team Management (pause -> Substitutions before the
   kick-off). It may only show on the live, unpaused match screen. Injected at
   load, not with the pause CSS, so it applies before the first pause. */
(function(){ if(document.getElementById('pm2-kickoff-css')) return; const st=document.createElement('style'); st.id='pm2-kickoff-css';
  st.textContent='body:not(:has(#s-match.active)) #kickoff-prompt,body:has(#pause-overlay.show) #kickoff-prompt{visibility:hidden!important}';
  document.head.appendChild(st); })();

/* the engine calls pzBuildAll() whenever the overlay opens (togglePause, pzCloseSquadEditor) */
try{ pzBuildAll=function(){ try{ render(); }catch(e){ console.warn('[PM2] render',e); } }; }
catch(e){ window.pzBuildAll=function(){ try{ render(); }catch(_){} }; }
})();
