/* ============================================================
   ULT11-FULLTIME · Ultimate Eleven                      2026-09-24
   The full-time screen, from the approved lab mockup
   (lab/lab-fulltime.html). Load AFTER game.js and ult11-teamselect.js.
   goFull() still fills the old #s-end ids and calls showSc('s-end');
   this module wraps showSc and draws the new screen on top of that.
   The old ids are kept as hidden stand-ins so goFull() never throws.

   Winner captain in full colour + WINNER (Cinzel), loser dimmed; a draw
   dims nobody. FULL TIME board: flags, score (Bold Pixel), scorers +
   minutes (G.goals, logged in afGoal), 9 stats: possession, shots,
   passes, pass accuracy, tackles, duels won, corners, fouls, offsides
   (G.st counters added in game.js 2026-09-24). Tiles: REMATCH
   (startGame), CHANGE TEAMS (showSc s-ts), MAIN MENU (showSc s-home).
   Fonts: ONLY Cinzel / Rajdhani / Bold Pixel. No tagline text.
   ============================================================ */
(function(){
'use strict';

function ensureCss(){
  if(document.getElementById('ft2-css')) return;
  const st=document.createElement('style'); st.id='ft2-css';
  st.textContent=`
#s-end .ft2{position:absolute;inset:0;overflow:hidden;background:#030a18;color:#fbfbfc;font-family:'Rajdhani',system-ui,sans-serif;z-index:5;
  --home:#2f8cff;--glow:rgba(47,140,255,.7);--panel:rgba(2,10,26,.82);--rule:rgba(38,126,226,.45);--dim:#9fb2cc}
#s-end .ft2-stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;transform-origin:center}
#s-end .ft2 .bg{position:absolute;inset:0;background:url('assets/wallpaper/teamselect2.jpg') center -110px/1920px auto no-repeat;filter:brightness(.55) saturate(.95)}
#s-end .ft2 .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,10,24,.55),rgba(3,10,24,.1) 30%,rgba(3,10,24,.1) 70%,rgba(3,10,24,.55)),linear-gradient(to bottom,rgba(3,10,24,.2),rgba(3,10,24,0) 40%,rgba(3,10,24,.85) 78%,rgba(3,10,24,.97))}
#s-end .ft2 .cap{position:absolute;top:10px;width:760px;height:760px;background-repeat:no-repeat;background-size:contain;
  -webkit-mask:linear-gradient(to bottom,#000 60%,transparent 96%);mask:linear-gradient(to bottom,#000 60%,transparent 96%)}
#s-end .ft2 .cap.l{left:-60px;background-position:bottom left} #s-end .ft2 .cap.r{right:-60px;background-position:bottom right}
#s-end .ft2 .cap.lose{filter:grayscale(.75) brightness(.55)}
#s-end .ft2 .win{position:absolute;top:520px;width:560px;text-align:center;display:none}
#s-end .ft2 .win.on{display:block}
#s-end .ft2 .win.l{left:60px} #s-end .ft2 .win.r{right:60px}
#s-end .ft2 .win b{display:block;font:900 96px/1 'Cinzel',serif;letter-spacing:.06em;color:#fff;text-shadow:0 0 28px var(--glow),0 4px 0 rgba(0,0,0,.5)}
#s-end .ft2 .win span{display:block;margin-top:10px;font:700 26px/1 'Rajdhani';letter-spacing:.5em;color:var(--dim);text-transform:uppercase}
#s-end .ft2 .board{position:absolute;left:50%;top:40px;width:760px;margin-left:-380px;padding:30px 40px 34px;background:var(--panel);border:1px solid var(--rule);
  clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,40px 100%,0 calc(100% - 40px))}
#s-end .ft2 .board h1{margin:0;text-align:center;font:700 26px/1 'Cinzel',serif;letter-spacing:.5em}
#s-end .ft2 .sc{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-top:22px}
#s-end .ft2 .team{display:flex;flex-direction:column;align-items:center;gap:12px}
#s-end .ft2 .team .fl,#s-end .ft2 .team .em{width:120px;height:80px;display:flex;align-items:center;justify-content:center;font-size:56px}
#s-end .ft2 .team .fl{box-shadow:0 3px 12px rgba(0,0,0,.6)}
#s-end .ft2 .team .em img,#s-end .ft2 .team .em svg{max-width:120px;max-height:80px}
#s-end .ft2 .team b{font:700 24px/1 'Rajdhani';letter-spacing:.2em;text-transform:uppercase;text-align:center}
#s-end .ft2 .nums{display:flex;align-items:center;gap:40px}
#s-end .ft2 .nums span{font:400 150px/1 'Bold Pixel',monospace;font-synthesis:none;color:#cfd8e6}
#s-end .ft2 .nums span.w{color:#fff;text-shadow:0 0 24px var(--glow)}
#s-end .ft2 .nums i{width:2px;height:120px;background:linear-gradient(transparent,rgba(255,255,255,.35),transparent)}
#s-end .ft2 .scorers{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:22px;font:600 20px/1.6 'Rajdhani';min-height:32px}
#s-end .ft2 .scorers div{display:flex;flex-direction:column}
#s-end .ft2 .scorers .h{align-items:flex-end} #s-end .ft2 .scorers .a{align-items:flex-start;border-left:1px solid rgba(255,255,255,.15);padding-left:40px}
#s-end .ft2 .scorers p{margin:0;display:flex;gap:14px}
#s-end .ft2 .scorers p em{font-style:normal;font-family:'Bold Pixel',monospace;font-synthesis:none;font-size:18px;color:var(--dim)}
#s-end .ft2 .stats{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.12)}
#s-end .ft2 .row{display:grid;grid-template-columns:70px 1fr 200px 1fr 70px;align-items:center;gap:14px;height:33px}
#s-end .ft2 .row .v{font:400 22px/1 'Bold Pixel',monospace;font-synthesis:none}
#s-end .ft2 .row .v.a{text-align:right}
#s-end .ft2 .row .lbl{text-align:center;font:700 16px/1 'Rajdhani';letter-spacing:.24em;color:var(--dim)}
#s-end .ft2 .bar{height:10px;background:rgba(255,255,255,.08);position:relative}
#s-end .ft2 .bar i{position:absolute;top:0;bottom:0}
#s-end .ft2 .bar.h i{right:0;background:linear-gradient(90deg,#1b6fe0,#57b0ff);box-shadow:0 0 10px var(--glow)}
#s-end .ft2 .bar.a i{left:0;background:linear-gradient(90deg,#fff,#b9c3d1)}
#s-end .ft2 .tiles{position:absolute;left:50%;bottom:90px;transform:translateX(-50%);display:flex;gap:22px}
#s-end .ft2 .tile{width:380px;height:190px;position:relative;overflow:hidden;cursor:pointer;background:var(--panel);border:1px solid rgba(120,170,255,.3)}
#s-end .ft2 .tile .pic{position:absolute;inset:0 0 70px;background-size:cover;background-position:center;filter:brightness(.8)}
#s-end .ft2 .tile .pic::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(2,10,26,.95))}
#s-end .ft2 .tile .tx{position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;align-items:center;gap:16px;padding:0 22px;background:rgba(2,10,26,.95)}
#s-end .ft2 .tile .tx svg{width:30px;height:30px;flex:none}
#s-end .ft2 .tile .tx b{font:700 24px/1 'Rajdhani';letter-spacing:.12em}
#s-end .ft2 .tile.on{border:2px solid var(--home);box-shadow:0 0 26px var(--glow),inset 0 0 20px rgba(47,140,255,.25)}
#s-end .ft2 .tile.on .tx{background:linear-gradient(90deg,#1b63d8,#2f8cff)}
#s-end .ft2 .hints{position:absolute;left:60px;bottom:34px;display:flex;gap:40px;font:600 20px/1 'Rajdhani';letter-spacing:.08em}
#s-end .ft2 .hints div{display:flex;align-items:center;gap:12px}
#s-end .ft2 .hints i{font-style:normal;width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:16px;color:#78aaff}
#s-end .ft2-legacy{display:none!important}
/* match HUD (touch pad, face busts, chips, kick-off) never shows on the end screen */
body:has(#s-end.active) #dpad,body:has(#s-end.active) #bust-h,body:has(#s-end.active) #bust-a,body:has(#s-end.active) #hud-chips,body:has(#s-end.active) #kickoff-prompt{visibility:hidden!important}
`;
  document.head.appendChild(st);
}

const IC={
  re:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
  ch:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  ho:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg>'};
const TILES=[
  ['re','REMATCH','assets/wallpaper/duel.png','center',()=>{ if(typeof startGame==='function') startGame(); }],
  ['ch','CHANGE TEAMS','assets/wallpaper/teamselect2.jpg','center',()=>{ if(typeof showSc==='function') showSc('s-ts'); }],
  ['ho','MAIN MENU','assets/home/menu-hero2.png','center 12%',()=>{ if(typeof showSc==='function') showSc('s-home'); }]];
let cur=0, root=null;
const $=s=>root&&root.querySelector(s);

function build(){
  root=document.getElementById('s-end'); if(!root) return false;
  ensureCss();
  root.innerHTML='<div class="ft2"><div class="ft2-stage">'+
    '<div class="bg"></div><div class="cap l"></div><div class="cap r"></div>'+
    '<div class="win l"><b>WINNER</b><span></span></div><div class="win r"><b>WINNER</b><span></span></div>'+
    '<div class="board"><h1>FULL TIME</h1><div class="sc"><div class="team th"><span class="flag"></span><b></b></div>'+
      '<div class="nums"><span class="nh"></span><i></i><span class="na"></span></div><div class="team ta"><span class="flag"></span><b></b></div></div>'+
      '<div class="scorers"><div class="h"></div><div class="a"></div></div><div class="stats"></div></div>'+
    '<div class="tiles"></div><div class="hints"><div><i>✕</i>CONFIRM</div></div>'+
  '</div></div>'+
  /* the ids goFull() still writes (hidden) */
  '<div class="ft2-legacy ue-end-body"><img id="ueEndHomeArt"><img id="ueEndAwayArt"><div id="wtag"></div><div id="hft-flag"></div><div id="hft"></div>'+
    '<div id="fth"></div><div id="fta"></div><div id="aft-flag"></div><div id="aft"></div><div id="ueEndStats"></div><span id="ftd"></span><span id="fts"></span></div>';
  $('.tiles').addEventListener('click',e=>{ const t=e.target.closest('.tile'); if(!t) return; cur=+t.dataset.i; renderTiles(); TILES[cur][4](); });
  return true;
}
function fit(){ const r=document.getElementById('s-end'), stage=r&&r.querySelector('.ft2-stage'); if(!stage) return;
  const s=Math.min((r.clientWidth||1920)/1920,(r.clientHeight||1080)/1080); stage.style.transform='translate(-50%,-50%) scale('+s+')'; }
addEventListener('resize',fit);

function flagInto(el,key,team){
  const fl=(window.TS2&&TS2.flagSVG)?TS2.flagSVG(key):'';
  if(fl){ el.innerHTML=fl; return; }
  el.innerHTML='<span class="em"></span>'; try{ setTeamEmblem(el.querySelector('.em'),key,(team&&team.flag)||''); }catch(e){}
}
function renderTiles(){ $('.tiles').innerHTML=TILES.map((t,i)=>'<div class="tile'+(i===cur?' on':'')+'" data-i="'+i+'"><div class="pic" style="background-image:url(\''+t[2]+'\');background-position:'+t[3]+'"></div><div class="tx">'+IC[t[0]]+'<b>'+t[1]+'</b></div></div>').join(''); }
function render(){
  if(typeof G==='undefined'||!G) return;
  build();
  cur=0;
  const hg=G.hG||0, ag=G.aG||0, hn=(HT&&HT.name)||'HOME', an=(AT&&AT.name)||'AWAY';
  const capL=$('.cap.l'), capR=$('.cap.r');
  capL.style.backgroundImage='url("assets/team/captain-'+selHome+'.png")';
  capR.style.backgroundImage='url("assets/team/captain-'+selAway+'.png")';
  capL.classList.toggle('lose',hg<ag); capR.classList.toggle('lose',ag<hg);
  $('.win.l').classList.toggle('on',hg>ag); $('.win.r').classList.toggle('on',ag>hg);
  $('.win.l span').textContent=hn; $('.win.r span').textContent=an;
  flagInto($('.th .flag'),selHome,HT); flagInto($('.ta .flag'),selAway,AT);
  $('.th b').textContent=hn; $('.ta b').textContent=an;
  const nh=$('.nh'), na=$('.na'); nh.textContent=hg; na.textContent=ag;
  nh.className='nh'+(hg>ag?' w':''); na.className='na'+(ag>hg?' w':'');
  const goals=(G.goals||[]).slice().sort((a,b)=>a.min-b.min);
  const list=s=>goals.filter(g=>g.s===s).map(g=>'<p>'+g.name+' <em>'+(g.min?g.min+"'":'')+'</em></p>').join('');
  $('.scorers .h').innerHTML=list('h'); $('.scorers .a').innerHTML=list('a');
  const st=G.st||{h:{},a:{}}, H=st.h||{}, A=st.a||{};
  const hp=G.tP?Math.round(G.hP/G.tP*100):50;
  const acc=x=>x.passA?Math.round((x.passC||0)/x.passA*100):0;
  const rows=[['POSSESSION',hp+'%',(100-hp)+'%',hp,100-hp],['SHOTS',G.hShots||0,G.aShots||0],['PASSES',H.passC||0,A.passC||0],
    ['PASS ACCURACY',acc(H)+'%',acc(A)+'%',acc(H),acc(A)],['TACKLES',H.tkl||0,A.tkl||0],['DUELS WON',G.hDuels||0,G.aDuels||0],
    ['CORNERS',H.crn||0,A.crn||0],['FOULS',G.hFouls||0,G.aFouls||0],['OFFSIDES',G.hOff||0,G.aOff||0]];
  $('.stats').innerHTML=rows.map(r=>{ const a=r[3]!=null?r[3]:r[1], b=r[4]!=null?r[4]:r[2], t=Math.max(1,a+b);
    return '<div class="row"><span class="v">'+r[1]+'</span><div class="bar h"><i style="width:'+Math.round(a/t*100)+'%"></i></div><span class="lbl">'+r[0]+'</span><div class="bar a"><i style="width:'+Math.round(b/t*100)+'%"></i></div><span class="v a">'+r[2]+'</span></div>'; }).join('');
  renderTiles(); fit();
}

/* pad: game.js menu nav delegates here while #s-end is up */
function owns(){ const s=document.getElementById('s-end'); return !!(s&&s.classList.contains('active')&&s.querySelector('.ft2')&&!document.querySelector('.ae-modal.show')); }
window.FT2={ owns:owns, step:d=>{ cur=(cur+d+TILES.length)%TILES.length; renderTiles(); }, confirm:()=>{ TILES[cur][4](); return true; }, back:()=>{}, render:render };

/* goFull() ends with showSc('s-end') - draw the new screen right after it */
if(typeof showSc==='function'){
  const _show=showSc;
  const wrap=function(id){ const r=_show.apply(this,arguments); if(id==='s-end'){ try{ render(); }catch(e){ console.warn('[FT2] render',e); } } return r; };
  try{ showSc=wrap; }catch(e){ window.showSc=wrap; }
}
})();
