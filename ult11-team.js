// ULT11 TEAM SCREEN — glassmorphism team management, wired to game.js
// Replaces the old DREAM TEAM EDIT for friendly flow. Edits write straight
// into HOME_SLOT_ASSIGN / HOME_RESERVES / activeHomeFormation, so
// startGame() picks them up natively. Career squad management keeps the
// original editor (it has reserve editing + career save hooks).
(function(){
const st=document.createElement('style');st.textContent=`
#uts *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}

#uts{position:absolute;inset:0;z-index:300;color:#fff;display:none;
 background:rgba(4,8,18,.42);backdrop-filter:blur(9px) saturate(1.1);
 -webkit-backdrop-filter:blur(9px) saturate(1.1);font-family:'Orbitron',sans-serif}
#top{position:absolute;top:0;left:0;right:0;height:56px;display:flex;align-items:center;
 padding:0 24px;gap:26px;background:linear-gradient(180deg,rgba(2,5,12,.9),transparent);z-index:5}
#logo{font-family:'Bebas Neue';font-size:26px;letter-spacing:.06em}
#logo b{color:#3c8aff}
.h1{font-family:'Bebas Neue';font-size:34px;letter-spacing:.05em;position:absolute;left:24px;top:54px}
.h1 small{display:block;font-size:9px;letter-spacing:.5em;color:#3c8aff;font-family:'Orbitron'}
#frm{position:absolute;right:330px;top:64px;font-family:'Bebas Neue';font-size:24px;color:#3c8aff;letter-spacing:.1em}
#frm span{color:rgba(255,255,255,.6);font-size:14px;margin-right:8px}
#fsel{background:rgba(10,22,46,.9);color:#3c8aff;border:1px solid rgba(80,140,255,.5);
 font-family:'Bebas Neue';font-size:22px;letter-spacing:.1em;padding:2px 10px;border-radius:4px;cursor:pointer}
/* sidebar */
#side{position:absolute;left:18px;top:118px;width:220px;display:flex;flex-direction:column;gap:8px;z-index:4}
.sbtn{padding:12px 14px;background:rgba(10,20,40,.65);border:1px solid rgba(80,140,255,.25);
 clip-path:polygon(0 0,100% 0,94% 100%,0 100%);cursor:pointer;transition:.15s}
.sbtn b{font-family:'Bebas Neue';font-size:18px;letter-spacing:.12em;display:block}
.sbtn span{font-size:8px;color:rgba(255,255,255,.55);letter-spacing:.08em}
.sbtn.on{background:linear-gradient(90deg,#1d54c8,#0e2c66);border-color:#5c9aff}
/* bottom-left team info */
#tmInfo{position:absolute;left:18px;bottom:14px;width:220px;z-index:4;display:flex;align-items:center;gap:10px;
 background:linear-gradient(180deg,rgba(10,20,44,.85),rgba(5,9,20,.85));
 border:1px solid rgba(80,140,255,.3);border-radius:8px;padding:10px 12px}
#tm-emb{width:44px;height:44px;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid rgba(120,180,255,.35);
 display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;flex-shrink:0}
#tm-emb img,#tm-emb svg{width:100%;height:100%;object-fit:contain}
#tm-nm{font-family:'Bebas Neue';font-size:17px;letter-spacing:.06em;line-height:1.05}
#tm-nm small{display:block;font-size:8px;letter-spacing:.25em;color:#7db8ff;font-family:'Orbitron';margin-top:2px}
#tm-ovr{margin-left:auto;text-align:right}
#tm-ovr b{font-family:'Bebas Neue';font-size:30px;color:#4ec3ff;text-shadow:0 0 14px rgba(60,160,255,.6);font-weight:400}
#tm-ovr span{display:block;font-size:7px;letter-spacing:.3em;color:rgba(255,255,255,.55)}
/* pitch */
#pitch{position:absolute;left:258px;top:96px;width:560px;height:470px;}
#pitchbg{position:absolute;inset:0;border-radius:6px;overflow:hidden;opacity:.88;
 clip-path:polygon(13% 0,87% 0,100% 100%,0 100%);
 background:repeating-linear-gradient(180deg,#175226 0 44px,#124420 44px 88px);
 border-bottom:2px solid rgba(255,255,255,.3);
 box-shadow:inset 0 30px 60px rgba(0,0,0,.45);}
#pitchbg::before{content:'';position:absolute;left:15%;right:15%;top:3%;bottom:3%;
 border:1.5px solid rgba(255,255,255,.4);
 transform:perspective(700px) rotateX(38deg);transform-origin:50% 100%;}
#pitchbg::after{content:'';position:absolute;left:50%;top:54%;width:120px;height:42px;
 border:1.5px solid rgba(255,255,255,.35);border-radius:50%;transform:translate(-50%,-50%);}
.slot{position:absolute;width:88px;height:104px;transform:translate(-50%,-50%);cursor:grab;z-index:2}
.card{width:100%;height:100%;border-radius:6px;overflow:hidden;position:relative;
 background:linear-gradient(165deg,#13284e 0%,#070d1d 100%);
 border:1.5px solid rgba(90,150,255,.55);box-shadow:0 6px 16px rgba(0,0,0,.5);transition:transform .12s}
.card.gk{border-color:rgba(255,200,60,.6)}
.card .av{position:absolute;inset:0 0 26px 0;background-size:cover;background-position:center 12%;opacity:.9}
.card .num{position:absolute;top:3px;left:6px;font-family:'Bebas Neue';font-size:18px;text-shadow:0 2px 4px #000}
.card .ovr{position:absolute;top:3px;right:6px;font-family:'Bebas Neue';font-size:15px;color:#4ec3ff}
.card .nm{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-family:'Bebas Neue';
 font-size:11px;letter-spacing:.05em;background:rgba(2,5,12,.8);padding:1px 0}
.card .ps{position:absolute;left:0;right:0;bottom:1px;text-align:center;font-size:7px;letter-spacing:.2em;color:#7db8ff}
.slot.drag{z-index:9;opacity:.85;cursor:grabbing}
.slot.over .card{transform:scale(1.08);border-color:#ffd24a;box-shadow:0 0 18px rgba(255,210,74,.5)}
.slot.sel .card{border-color:#34e07a;box-shadow:0 0 16px rgba(52,224,122,.8)}
/* bench */
#bench{position:absolute;left:258px;bottom:14px;width:560px;height:118px;
 background:rgba(6,12,26,.7);border:1px solid rgba(80,140,255,.25);border-radius:6px;padding:22px 10px 6px;
 display:flex;gap:8px;overflow-x:auto}
#bench::before{content:'SUBSTITUTES ▾';position:absolute;top:5px;left:12px;font-family:'Bebas Neue';
 font-size:11px;letter-spacing:.25em;color:#7db8ff}
#bench .slot{position:relative;transform:none;flex:0 0 76px;width:76px;height:84px;left:auto;top:auto}
#bench .card .nm{font-size:9px}
/* detail */
#uts #det{position:absolute;right:14px;top:96px;width:300px;bottom:14px;
 background:linear-gradient(180deg,rgba(10,20,44,.85),rgba(5,9,20,.85));
 border:1px solid rgba(80,140,255,.3);border-radius:8px;padding:14px;z-index:4}
#d-head{display:flex;gap:10px;align-items:center}
#d-av{width:74px;height:74px;border-radius:6px;background:#0a1428 center 10%/cover no-repeat;border:1px solid rgba(120,180,255,.4)}
#d-nm{font-family:'Bebas Neue';font-size:24px;letter-spacing:.04em;line-height:1}
#d-ps{font-size:9px;letter-spacing:.25em;color:#7db8ff;margin-top:3px}
#d-ovr{font-family:'Bebas Neue';font-size:42px;color:#4ec3ff;margin-left:auto;text-shadow:0 0 16px rgba(60,160,255,.6)}
.stat{display:flex;align-items:center;gap:8px;margin-top:9px}
.stat b{font-family:'Bebas Neue';font-size:12px;width:36px;letter-spacing:.1em;font-weight:400}
.bar{flex:1;height:7px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#1d54c8,#4ec3ff);border-radius:3px}
.stat span{font-family:'Bebas Neue';font-size:13px;width:24px;text-align:right}
#d-role{margin-top:16px;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(80,140,255,.2);border-radius:6px}
#d-role b{font-family:'Bebas Neue';font-size:13px;letter-spacing:.2em;color:#7db8ff;display:block;margin-bottom:5px}
#d-role p{font-size:9.5px;line-height:1.6;color:rgba(255,255,255,.7)}
#hint{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);font-size:9px;letter-spacing:.1em;
 color:rgba(255,255,255,.55);z-index:2}

#acts{position:absolute;right:14px;bottom:14px;left:auto;width:300px;display:none}
#uts #det{bottom:118px !important}
#actbar{position:absolute;right:14px;bottom:14px;width:300px;display:flex;flex-wrap:wrap;gap:6px;z-index:6}
.ab{flex:1 1 45%;padding:9px 4px;font-family:'Bebas Neue';font-size:15px;letter-spacing:.14em;
 color:#fff;background:rgba(10,22,46,.85);border:1px solid rgba(80,140,255,.45);border-radius:5px;cursor:pointer;text-align:center}
.ab:active{transform:scale(.96)}
.ab.gold{flex:1 1 100%;background:linear-gradient(165deg,#f6d469,#8a5e0a);color:#1a1206;border-color:#ffe9a8;font-size:18px}
.ab.cap.on{border-color:#ffd24a;color:#ffd24a}
#toast{position:absolute;left:50%;top:84px;transform:translateX(-50%);background:rgba(2,5,12,.9);
 border:1px solid #ffd24a;color:#ffd24a;font-family:'Bebas Neue';font-size:14px;letter-spacing:.15em;
 padding:6px 18px;border-radius:4px;opacity:0;transition:.25s;z-index:20;pointer-events:none}
.capb{position:absolute;top:3px;left:26px;background:#ffd24a;color:#1a1206;font-family:'Bebas Neue';
 font-size:11px;padding:0 5px;border-radius:2px}

#swapc{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:30;display:none;
 background:rgba(4,9,20,.96);border:1.5px solid #34e07a;border-radius:8px;padding:16px 22px;text-align:center}
#swapc b{font-family:'Bebas Neue';font-size:18px;letter-spacing:.1em;display:block;margin-bottom:12px}
#swapc .ab{display:inline-block;width:90px;margin:0 5px;flex:none}
#sw-y{border-color:#34e07a;color:#34e07a}
`;document.head.appendChild(st);
function init(){
 const vp=document.getElementById('viewport')||document.body;
 const host=document.createElement('div');host.innerHTML=`<div id="uts">
 <div id="top"><div id="logo">ULTIMATE <b>ELEVEN</b></div></div>
 <div class="h1">TEAM FORMATION<small>チーム編成</small></div>
 <div id="frm"><span>FORMATION</span><select id="fsel"></select></div>
 <div id="side">
  <div class="sbtn on"><b>FORMATION</b><span>Change your formation</span></div>
  <div class="sbtn"><b>TACTICS</b><span>Customise your team tactics</span></div>
  <div class="sbtn"><b>LINEUP</b><span>Edit your starting lineup</span></div>
 </div>
 <div id="pitch"><div id="pitchbg"></div></div>
 <div id="bench"></div>
 <div id="det">
  <div id="d-head"><div id="d-av"></div><div><div id="d-nm">—</div><div id="d-ps">—</div></div><div id="d-ovr">—</div></div>
  <div id="d-stats"></div>
  <div id="d-role"><b>PLAYER ROLE</b><p id="d-rtxt">Select a player.</p></div>
 </div>
<div id="actbar">
 <div class="ab" id="b-back">◀ BACK</div><div class="ab" id="b-auto">AUTO PICK</div>
 <div class="ab cap" id="b-cap">SELECT CAPTAIN</div><div class="ab" id="b-save">SAVE FORMATION</div>
 <div class="ab gold" id="b-start">START MATCH ▶</div>
</div>
<div id="tmInfo"><div id="tm-emb">⚽</div><div id="tm-nm">TEAM<small>HOME · YOU</small></div>
 <div id="tm-ovr"><b id="tm-ovr-v">—</b><span>OVERALL</span></div></div>
<div id="toast"></div>
<div id="swapc"><b id="sw-t">SWAP?</b><div class="ab" id="sw-y">YES</div><div class="ab" id="sw-n">NO</div></div>
</div>`;
 vp.appendChild(host.firstElementChild);

const $=id=>document.getElementById(id);
const pitch=$('pitch'),bench=$('bench');

// ── GAME BRIDGE ─────────────────────────────────────────────────
// game.js exposes (global lexical scope): FORMATIONS, activeHomeFormation,
// HOME_SLOT_ASSIGN, HOME_RESERVES, HT, selHome, getHomeRosterOrdered,
// initHomeSlots, autoPickHomeTeam, calcOvr, gs, playerLastName, playerImg,
// setTeamEmblem, startGame, showSc.
function GAME(){try{return typeof FORMATIONS!=='undefined'&&typeof HOME_SLOT_ASSIGN!=='undefined'
 &&typeof HT!=='undefined'&&!!HT&&typeof getHomeRosterOrdered==='function';}catch(e){return false;}}

// Visual layouts (this screen's pseudo-3D pitch), keyed by game.js slot names.
// Same 11 slot keys for every formation — only coords/labels change.
const VIS={
 '4-3-3':[['ST',.50,.13],['LW',.18,.22],['RW',.82,.22],['CM2',.50,.40],['CM1',.25,.46],['CM3',.75,.46],
  ['LB',.13,.68],['CB1',.38,.70],['CB2',.62,.70],['RB',.87,.68],['GK',.50,.90]],
 '4-4-2':[['ST',.38,.13],['RW',.62,.13],['CM1',.14,.38],['CM2',.38,.44],['CM3',.62,.44],['LW',.86,.38],
  ['LB',.13,.68],['CB1',.38,.70],['CB2',.62,.70],['RB',.87,.68],['GK',.50,.90]],
 '4-1-3-2':[['ST',.38,.13],['RW',.62,.13],['CM2',.16,.32],['CM3',.50,.34],['LW',.84,.32],['CM1',.50,.52],
  ['LB',.13,.68],['CB1',.38,.70],['CB2',.62,.70],['RB',.87,.68],['GK',.50,.90]],
 '3-5-2':[['ST',.38,.13],['RW',.62,.13],['RB',.10,.40],['CM1',.32,.42],['CM2',.50,.34],['CM3',.68,.42],['LW',.90,.40],
  ['LB',.28,.70],['CB1',.50,.72],['CB2',.72,.70],['GK',.50,.90]]};
const perX=(x,y)=>.5+(x-.5)*(.66+.34*y); // pitch narrows toward the top

// ── DEMO FALLBACK (standalone preview without game.js) ──────────
const DEMO=[
{id:'d0',name:'Tsubasa.OZORA',num:10,pos:'ST',sho:93,dri:94,pas:88,spd:92,def:45,role:'ADVANCED FORWARD',d:'Finds space behind defenses, finishes with deadly accuracy.'},
{id:'d1',name:'Shingo.AOI',num:20,pos:'LW',sho:84,dri:84,pas:80,spd:78,def:60,role:'WINGER',d:'Explosive runs down the flank.'},
{id:'d2',name:'Shun.NITTA',num:7,pos:'RW',sho:88,dri:80,pas:74,spd:85,def:50,role:'POACHER',d:'Lives on the last shoulder.'},
{id:'d3',name:'Taro.MISAKI',num:11,pos:'CM',sho:82,dri:90,pas:95,spd:84,def:55,role:'PLAYMAKER',d:'Threads passes nobody else sees.'},
{id:'d4',name:'Mamoru.IZAWA',num:8,pos:'CM',sho:76,dri:80,pas:84,spd:78,def:68,role:'BOX-TO-BOX',d:'Engine of the midfield.'},
{id:'d5',name:'Hajime.TAKI',num:6,pos:'CM',sho:72,dri:78,pas:82,spd:80,def:70,role:'CARRILERO',d:'Tireless shuttler.'},
{id:'d6',name:'Makoto.SODA',num:3,pos:'LB',sho:55,dri:66,pas:70,spd:82,def:84,role:'FULLBACK',d:'Bites into every tackle.'},
{id:'d7',name:'Ryo.ISHIZAKI',num:4,pos:'CB',sho:50,dri:60,pas:68,spd:74,def:88,role:'STOPPER',d:'Face-block specialist.'},
{id:'d8',name:'Hiroshi.JITO',num:5,pos:'CB',sho:52,dri:55,pas:66,spd:70,def:91,role:'COLOSSUS',d:'Immovable at the back.'},
{id:'d9',name:'Hanji.URABE',num:2,pos:'RB',sho:48,dri:62,pas:72,spd:79,def:82,role:'FULLBACK',d:'Overlapping outlet.'},
{id:'d10',name:'Genzo.WAKABAYASHI',num:1,pos:'GK',sho:30,dri:40,pas:70,spd:75,def:95,role:'SWEEPER KEEPER',d:'Nothing outside the box gets in.'},
{id:'d11',name:'Kojiro.HYUGA',num:9,pos:'ST',sho:96,dri:85,pas:70,spd:88,def:58,role:'TARGET MAN',d:'Raw power finishing.'},
{id:'d12',name:'Hikaru.MATSUYAMA',num:14,pos:'CM',sho:78,dri:79,pas:86,spd:81,def:72,role:'CAPTAIN',d:'Heart of the north.'},
{id:'d13',name:'Takeshi.SAWADA',num:15,pos:'AM',sho:70,dri:76,pas:78,spd:77,def:60,role:'PRODIGY',d:'Young spark off the bench.'},
{id:'d14',name:'Yuzo.MORISAKI',num:16,pos:'GK',sho:25,dri:35,pas:60,spd:68,def:80,role:'KEEPER',d:'Reliable second GK.'},
{id:'d15',name:'Kazuo.KISUGI',num:17,pos:'FW',sho:80,dri:74,pas:70,spd:80,def:48,role:'FINISHER',d:'Instinct in the box.'},
{id:'d16',name:'Koji.TANIGUCHI',num:18,pos:'CM',sho:66,dri:70,pas:72,spd:74,def:64,role:'UTILITY',d:'Covers three roles.'}];
let demoForm='4-3-3';
const demoAssign={};VIS['4-3-3'].forEach((s,i)=>demoAssign[s[0]]=DEMO[i].id);

// ── MODEL ACCESSORS ─────────────────────────────────────────────
const roster=()=>GAME()?getHomeRosterOrdered():DEMO;
const assign=()=>GAME()?HOME_SLOT_ASSIGN:demoAssign;
const formName=()=>GAME()?activeHomeFormation:demoForm;
const byId=pid=>(pid===null||pid===undefined||pid==='')?null:roster().find(p=>String(p.id)===String(pid))||null;
const surname=pl=>{if(!pl||!pl.name)return'—';
 // pl.name carries the (possibly custom) display name; playerLastName() is asset-path only
 return(pl.name.split('.').pop()||pl.name).toUpperCase();};
const ovr=pl=>{if(!pl)return 0;
 try{if(GAME()&&typeof calcOvr==='function')return Math.max(50,calcOvr(pl));}catch(e){}
 return pl.ovr||Math.round(((pl.sho||60)+(pl.dri||60)+(pl.pas||60)+(pl.spd||60)+(pl.def||60))/5);};
const stat=(pl,k)=>{try{if(GAME()&&typeof gs==='function')return gs(pl,k);}catch(e){}return pl[k]||50;};
const slotLabel=slot=>{try{if(GAME())return(FORMATIONS[formName()].labels||{})[slot]||slot;}catch(e){}return slot;};
const isGK=pl=>!!pl&&pl.pos==='GK';

// portrait chain matching game.js conventions
function avChain(pl){
 if(!pl)return[];
 const ln=((pl.origName||pl.name)||'').split('.').pop().toLowerCase().trim();
 if(pl.clubKey)return[`assets/career/clubs/${ln}${pl.clubKey}.png`,`assets/career/clubs/${pl.clubKey}.png`];
 const chain=[`assets/players/profile/${ln}.png`,`assets/players/${ln}.png`];
 try{const tk=(typeof nationalTeamKeyFor==='function')?nationalTeamKeyFor(ln):null;if(tk)chain.push(`assets/players/${tk}.png`);}catch(e){}
 return chain;
}
function loadAv(el,pl){
 const chain=avChain(pl);
 (function nx(i){if(i>=chain.length){el.style.background='linear-gradient(180deg,rgba(60,138,255,.3),rgba(8,14,30,.8))';return}
  const t=new Image();t.onload=()=>el.style.backgroundImage=`url('${chain[i]}')`;t.onerror=()=>nx(i+1);t.src=chain[i]})(0);
}

// ── CARDS / RENDER ──────────────────────────────────────────────
let capPid=null;
function mkCard(pl,slot,benchNum){
 const el=document.createElement('div');el.className='slot';
 el.dataset.pid=pl?pl.id:'';el.dataset.slot=slot||'';
 const lbl=slot?slotLabel(slot):'SUB';
 el.innerHTML=`<div class="card${slot==='GK'?' gk':''}"><div class="av"></div>
  <div class="num">${pl?(pl.num||benchNum||''):''}</div><div class="ovr">${pl?ovr(pl):''}</div>
  <div class="nm">${pl?surname(pl):'—'}</div><div class="ps">${lbl}</div></div>`;
 if(pl)loadAv(el.querySelector('.av'),pl);
 return el;
}
function rebuild(){
 [...pitch.querySelectorAll('.slot')].forEach(e=>e.remove());
 bench.innerHTML='';
 const vis=VIS[formName()]||VIS['4-3-3'];
 const A=assign(),usedIds=new Set();
 vis.forEach(s=>{
  const pl=byId(A[s[0]]);if(pl)usedIds.add(pl.id);
  const el=mkCard(pl,s[0]);
  const sc=.8+.45*s[2];
  el.style.left=(perX(s[1],s[2])*100)+'%';el.style.top=(s[2]*100)+'%';
  el.style.width=(88*sc)+'px';el.style.height=(104*sc)+'px';
  pitch.appendChild(el);});
 let n=30;
 roster().filter(p=>!usedIds.has(p.id)).forEach(p=>bench.appendChild(mkCard(p,'',n++)));
 markCap();updateTeamPanel();
}
// detail panel
function showDet(pl){if(!pl)return;
 $('d-nm').textContent=surname(pl);$('d-ovr').textContent=ovr(pl);
 $('d-ps').textContent=(pl.role||pl.pos||'').toUpperCase();
 $('d-rtxt').textContent=pl.d||pl.pos||'';
 $('d-av').style.backgroundImage='';loadAv($('d-av'),pl);
 $('d-stats').innerHTML=['SHO','DRI','PAS','SPD','DEF'].map(k=>{const v=stat(pl,k.toLowerCase());
  return `<div class="stat"><b>${k}</b><div class="bar"><i style="width:${v}%"></i></div><span>${v}</span></div>`}).join('');
}
const toast=m=>{const t=$('toast');t.textContent=m;t.style.opacity=1;
 clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity=0,1600)};

// ── bottom-left team panel ──────────────────────────────────────
function updateTeamPanel(){
 const A=assign(),vis=VIS[formName()]||VIS['4-3-3'];
 const xi=vis.map(s=>byId(A[s[0]])).filter(Boolean).map(ovr);
 $('tm-ovr-v').textContent=xi.length?Math.round(xi.reduce((a,b)=>a+b,0)/xi.length):'—';
 if(GAME()){
  $('tm-nm').innerHTML=(HT.name||'TEAM').toUpperCase()+'<small>HOME · YOU</small>';
  try{if(typeof setTeamEmblem==='function')setTeamEmblem($('tm-emb'),typeof selHome!=='undefined'?selHome:null,HT.flag||'');
   else $('tm-emb').textContent=HT.flag||'⚽';}catch(e){$('tm-emb').textContent=HT.flag||'⚽';}
 }else{$('tm-nm').innerHTML='NIPPON<small>HOME · YOU</small>';$('tm-emb').textContent='🇯🇵';}
}

// ── TAP-TO-SWAP — writes into HOME_SLOT_ASSIGN / HOME_RESERVES ──
let selSlot=null,pendA=null,pendB=null;
function clearSel(){[selSlot,pendA,pendB].forEach(x=>x&&x.classList.remove('sel'));selSlot=pendA=pendB=null;
 $('swapc').style.display='none';}
function swapAllowed(a,b){
 const sa=a.dataset.slot,sb=b.dataset.slot,pa=byId(a.dataset.pid),pb=byId(b.dataset.pid);
 if(!pa||!pb)return'EMPTY SLOT';
 if(sa==='GK'||sb==='GK'){if(!(isGK(pa)&&isGK(pb)))return'A KEEPER CAN ONLY SWAP WITH A KEEPER';return null;}
 if(isGK(pa)||isGK(pb))return'A KEEPER CAN ONLY SWAP WITH A KEEPER';
 return null;
}
function doSwap(a,b){
 const sa=a.dataset.slot,sb=b.dataset.slot;
 const pa=byId(a.dataset.pid),pb=byId(b.dataset.pid);
 if(!pa||!pb)return;
 const A=assign();
 if(sa&&sb){const t=A[sa];A[sa]=A[sb];A[sb]=t;}
 else if(sa&&!sb){A[sa]=pb.id;syncReserve(pb.id,pa.id);}
 else if(!sa&&sb){A[sb]=pa.id;syncReserve(pa.id,pb.id);}
 else if(GAME()){const i=HOME_RESERVES.findIndex(x=>String(x)===String(pa.id)),
  j=HOME_RESERVES.findIndex(x=>String(x)===String(pb.id));
  if(i!==-1&&j!==-1){HOME_RESERVES[i]=pb.id;HOME_RESERVES[j]=pa.id;}}
 rebuild();toast('SWAPPED');
}
function syncReserve(inPid,outPid){ // bench player entered XI → outgoing player takes his reserve seat
 if(!GAME())return;
 const i=HOME_RESERVES.findIndex(x=>String(x)===String(inPid));if(i!==-1)HOME_RESERVES[i]=outPid;
}
document.addEventListener('pointerdown',e=>{
 if($('uts').style.display!=='block')return;
 if(capMode)return;
 const s=e.target.closest('#uts .slot');if(!s)return;
 const pl=byId(s.dataset.pid);if(pl)showDet(pl);
 if(!selSlot){if(!pl)return;selSlot=s;s.classList.add('sel');return;}
 if(s===selSlot){clearSel();return;}
 const err=swapAllowed(selSlot,s);
 if(err){toast(err);clearSel();return;}
 pendA=selSlot;pendB=s;s.classList.add('sel');
 $('sw-t').textContent='SWAP '+surname(byId(pendA.dataset.pid))+' ↔ '+surname(byId(pendB.dataset.pid))+'?';
 $('swapc').style.display='block';
});
$('sw-n').onclick=()=>clearSel();
$('sw-y').onclick=()=>{const a=pendA,b=pendB;clearSel();doSwap(a,b);};

// ── CAPTAIN (cosmetic) ──────────────────────────────────────────
let capMode=false;
function markCap(){document.querySelectorAll('#uts .capb').forEach(x=>x.remove());
 if(!capPid)return;
 const s=[...document.querySelectorAll('#uts .slot')].find(e=>e.dataset.pid===capPid);
 if(s){const b=document.createElement('div');b.className='capb';b.textContent='C';s.querySelector('.card').appendChild(b)}}
$('b-cap').onclick=e=>{capMode=!capMode;
 e.target.classList.toggle('on',capMode);toast(capMode?'TAP A PLAYER TO MAKE CAPTAIN':'CAPTAIN MODE OFF')};
document.addEventListener('pointerdown',e=>{if(!capMode)return;
 const s=e.target.closest('#uts .slot');if(!s||!s.dataset.pid)return;
 e.stopPropagation();capPid=s.dataset.pid;capMode=false;$('b-cap').classList.remove('on');
 markCap();toast(surname(byId(capPid))+' IS CAPTAIN')},true);

// ── FORMATION SELECT — drives activeHomeFormation ───────────────
function syncFsel(){
 const names=GAME()?Object.keys(FORMATIONS):Object.keys(VIS);
 $('fsel').innerHTML=names.map(n=>`<option value="${n}">${n}</option>`).join('');
 $('fsel').value=formName();
}
$('fsel').addEventListener('change',e=>{
 const name=e.target.value;
 if(GAME()){activeHomeFormation=name;try{initHomeSlots(true);}catch(err){}}
 else demoForm=name;
 clearSel();rebuild();
});

// ── ACTIONS ─────────────────────────────────────────────────────
$('b-auto').onclick=()=>{
 if(GAME()&&typeof autoPickHomeTeam==='function'){try{autoPickHomeTeam();}catch(e){}}
 else{ // demo: best XI by ovr, best GK in goal
  const gk=DEMO.filter(isGK).sort((a,b)=>ovr(b)-ovr(a))[0];
  const out=DEMO.filter(p=>!isGK(p)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,10);
  const vis=VIS[demoForm];let k=0;
  vis.forEach(s=>{demoAssign[s[0]]=(s[0]==='GK')?gk.id:out[k++].id;});
 }
 clearSel();rebuild();toast('BEST XI SELECTED');
};
$('b-save').onclick=()=>toast('FORMATION SAVED');
$('b-back').onclick=()=>{
 clearSel();$('uts').style.display='none';
 try{if(typeof showSc==='function')showSc('s-ts');}catch(e){}
};
$('b-start').onclick=()=>{
 clearSel();$('uts').style.display='none';
 if(window._utsStart){const cb=window._utsStart;window._utsStart=null;cb();return;}
 try{if(typeof startGame==='function'){startGame();return;}}catch(e){console.error('[UTS] startGame',e);toast('Match failed to start — see console');return;}
 toast('KICK OFF! (no game engine)');
};

// ── OPEN ────────────────────────────────────────────────────────
window.openTeamScreen=function(onStart){
 window._utsStart=onStart||null;
 if(GAME()){
  try{
   // mirror the old openTeamMenu() setup so game state is identical
   if(HT.formation&&FORMATIONS[HT.formation])activeHomeFormation=HT.formation;
   HOME_RESERVES=[null,null,null,null,null,null];
   if(HT.reserves&&HT.reserves.length){
    const r=HT.p;
    const gkR=HT.reserves.filter(pid=>{const pl=r.find(x=>x.id===pid);return pl&&pl.pos==='GK';});
    const fR=HT.reserves.filter(pid=>{const pl=r.find(x=>x.id===pid);return !pl||pl.pos!=='GK';});
    if(gkR.length)HOME_RESERVES[0]=gkR[0];
    fR.forEach((pid,i)=>{if(i<5)HOME_RESERVES[i+1]=pid;});
   }
   initHomeSlots(true);
   if(typeof playerImg==='function')HT.p.forEach(pl=>playerImg(pl));
  }catch(e){console.error('[UTS] setup',e);}
 }
 $('uts').style.display='block';           // show FIRST — a render error must never leave the user stranded
 try{capPid=null;clearSel();syncFsel();rebuild();}catch(e){console.error('[UTS] rebuild',e);toast('Team menu error — see console');}
 try{const A=assign(),first=byId(A['ST'])||byId(A[Object.keys(A)[0]]);if(first)showDet(first);}catch(e){console.error('[UTS] detail',e);}
};

}

// ── ACTIVATION: replace the friendly team menu for real ─────────
// TEAM MENU → glass screen. Lineup edits write into HOME_SLOT_ASSIGN
// live; START MATCH calls startGame() which reads that state natively.
// Career squad management (G_teamEditorOrigin==='career') keeps the
// original editor — it has reserve editing + career save hooks.
setTimeout(()=>{
 if(typeof window.openTeamMenu==='function'&&!window.__utsHooked){
  window.__utsHooked=true;
  window.__utsOldMenu=window.openTeamMenu;
  window.openTeamMenu=function(...a){
   try{
    if(typeof G_teamEditorOrigin!=='undefined'&&G_teamEditorOrigin==='career')
     return window.__utsOldMenu.apply(window,a);
    if(typeof selHome!=='undefined'&&(!selHome||!selAway||selHome===selAway))return; // same guard as old menu
    openTeamScreen();
   }catch(e){window.__utsOldMenu.apply(window,a);}
  };
 }
},800);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
