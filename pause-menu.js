/* ════════════════════════════════════════════════════════════════
   PAUSE MENU — append to game.js (after togglePause is fine).
   Reads the SAME live state the match engine uses:
     HT/AT          → team names, flags, formation
     hSq / aSq      → the 11 players actually on the pitch right now
     HOME_RESERVES / AT.reserves → bench
     G.*            → score, clock, live match stats
   Nothing here is mock data.
   ════════════════════════════════════════════════════════════════ */

/* ---- 1) replace the existing togglePause() with this version ---- */
function togglePause(){
  if(!G.mt)return;
  G.paused=!G.paused;
  const btn=document.getElementById('pauseBtn');
  const overlay=document.getElementById('pause-overlay');
  if(G.paused){
    btn.textContent='▶';btn.classList.add('paused');
    if(overlay){overlay.classList.add('show');pzBuildAll();}
  } else {
    btn.textContent='⏸';btn.classList.remove('paused');
    if(overlay)overlay.classList.remove('show');
  }
}

/* ---- 2) master builder, called every time the overlay opens ---- */
function pzBuildAll(){
  pzBuildHeader();
  pzBuildSide('h');
  pzBuildSide('a');
  pzShowPause(); // default to the menu, not match data
}

function pzBuildHeader(){
  document.getElementById('pz-hname').textContent=HT?.name||'HOME';
  document.getElementById('pz-aname').textContent=AT?.name||'AWAY';
  document.getElementById('pz-htn').textContent=(HT?.name||'HOME').toUpperCase();
  document.getElementById('pz-atn').textContent=(AT?.name||'AWAY').toUpperCase();
  document.getElementById('pz-hsc').textContent=G.hG;
  document.getElementById('pz-asc').textContent=G.aG;
  document.getElementById('pz-time').textContent=document.getElementById('htime').textContent;
  setTeamEmblem(document.getElementById('pz-hcrest'),selHome,HT?.flag||'🏳');
  setTeamEmblem(document.getElementById('pz-acrest'),selAway,AT?.flag||'🏳');
  document.getElementById('pz-hfm').textContent=activeHomeFormation||'4-3-3';
}

/* ---- 3) one team's square pitch + bench, built from hSq/aSq ---- */
function pzBuildSide(side){
  const sqd = side==='h' ? hSq : aSq;
  const team = side==='h' ? HT : AT;
  const teamKey = side==='h' ? selHome : selAway;
  const mirrored = side==='a';
  const coords = (side==='h' && FORMATIONS[activeHomeFormation]) ? FORMATIONS[activeHomeFormation].coords : FORMATIONS['4-3-3'].coords;
  const cardsEl = document.getElementById(side==='h'?'pz-home-cards':'pz-away-cards');
  cardsEl.innerHTML='';
  Object.keys(coords).forEach(slot=>{
    const pl=sqd[slot]; if(!pl) return;
    const c=coords[slot];
    const dn=(c.x-.05)/(.56-.05);                 // 0 (GK) → 1 (forward line)
    const top = mirrored ? 8+dn*82 : 92-dn*82;
    const left = 10+c.y*80;
    const card=document.createElement('div');
    card.className='pz-card'+(slot==='GK'?' gk':'');
    card.style.top=top+'%'; card.style.left=left+'%';
    card.innerHTML=`<span class="jr">${pl.jersey||'?'}</span><span class="ovr">${calcOvr(pl)}</span><span class="nm">${playerSurname(pl.name)}</span>`;
    cardsEl.appendChild(card);
    pzLoadCardImg(card,pl,teamKey);
  });

  // bench
  const subsEl = document.getElementById(side==='h'?'pz-home-subs':'pz-away-subs');
  subsEl.innerHTML='';
  const roster = team?.p||[];
  const benchIds = side==='h' ? (HOME_RESERVES||[]).filter(Boolean) : (team?.reserves||[]);
  benchIds.forEach(pid=>{
    const pl=roster.find(p=>p.id===pid); if(!pl) return;
    const sc=document.createElement('div'); sc.className='pz-sc';
    sc.innerHTML=`<div class="av"></div><div class="nm">${playerSurname(pl.name)}</div>`;
    subsEl.appendChild(sc);
    pzLoadCardImg(sc.querySelector('.av'),pl,teamKey,true);
  });
}

/* ---- 4) identical fallback chain to the in-game formation editor:
   assets/players/{lastname}.png → assets/players/{teamkey}.png →
   (career clubs use assets/career/clubs/... — handled the same way
   playerImg() already does it) → generic silhouette                */
const PZ_GENERIC_SVG = 'data:image/svg+xml;utf8,'+encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a6a"/><stop offset="1" stop-color="#1a2438"/></linearGradient></defs>
    <circle cx="100" cy="80" r="32" fill="url(#g)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <path d="M 40 280 L 50 180 Q 60 140 100 140 Q 140 140 150 180 L 160 280 Z" fill="url(#g)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  </svg>`);
function pzLoadCardImg(el,pl,teamKey,small){
  const last=playerLastName(pl);
  const specific = pl.clubKey ? `assets/career/clubs/${last}${pl.clubKey}.png` : `assets/players/${last}.png`;
  const placeholder = pl.clubKey ? `assets/career/clubs/${pl.clubKey}.png` : `assets/players/${teamKey}.png`;
  const apply=url=>{ el.style.backgroundImage=`url(${url})`; };
  const t1=new Image();
  t1.onload=()=>apply(specific);
  t1.onerror=()=>{
    const t2=new Image();
    t2.onload=()=>apply(placeholder);
    t2.onerror=()=>apply(PZ_GENERIC_SVG);
    t2.src=placeholder;
  };
  t1.src=specific;
}

/* ---- 5) MATCH DATA — live numbers from G, no mock values ---- */
function pzBuildMdata(){
  document.getElementById('pz-md-hname').textContent=(HT?.name||'HOME').toUpperCase();
  document.getElementById('pz-md-aname').textContent=(AT?.name||'AWAY').toUpperCase();
  const hPoss = G.tP>0 ? Math.round(G.hP/G.tP*100) : 50;
  const aPoss = 100-hPoss;
  const STATS=[
    {lbl:'POSSESSION', h:hPoss, a:aPoss, unit:'%'},
    {lbl:'SHOTS',       h:G.hShots||0, a:G.aShots||0},
    {lbl:'PASSES',      h:G.hP||0,     a:Math.max(0,(G.tP||0)-(G.hP||0))},
    {lbl:'DUELS WON',   h:G.hDuels||0, a:G.aDuels||0},
    {lbl:'FOULS',       h:G.hFouls||0, a:G.aFouls||0},
    {lbl:'OFFSIDES',    h:G.hOff||0,   a:G.aOff||0},
  ];
  document.getElementById('pz-mdata-rows').innerHTML=STATS.map(s=>{
    const tot=s.h+s.a||1, hp=Math.round(s.h/tot*100), ap=100-hp;
    return `<div class="pz-mrow">
      <div class="vals"><span class="h">${s.h}${s.unit||''}</span><span class="lbl">${s.lbl}</span><span class="a">${s.a}${s.unit||''}</span></div>
      <div class="pz-mbar"><span class="h" style="width:${hp}%"></span><span class="a" style="width:${ap}%"></span></div>
    </div>`;
  }).join('');
}

/* ---- 6) screen toggles inside the overlay ---- */
function pzShowPause(){ document.getElementById('pz-mdata-panel').classList.remove('show'); document.getElementById('pz-pause-panel').classList.remove('hide'); }
function pzBackPause(){ pzShowPause(); }
function pzShowMdata(){ pzBuildMdata(); document.getElementById('pz-pause-panel').classList.add('hide'); document.getElementById('pz-mdata-panel').classList.add('show'); }

/* ---- 7) SQUAD — opens the SAME formation/sub editor used pre-match.
   Mid-match we can't just "kick off" again, so the editor's back/kick-off
   buttons are swapped for the duration (see tmBackHandler below) and the
   chosen lineup is written back into hSq when the user returns.        */
function pzShowSquad(){
  G_teamEditorOrigin='pause';
  document.getElementById('pause-overlay').classList.remove('show');
  openTeamMenu();
  setTimeout(pzPatchTeamMenuButtons,650);
}
function pzPatchTeamMenuButtons(){
  if(G_teamEditorOrigin!=='pause')return;
  const back=document.getElementById('tmBackBtn');
  const kick=document.getElementById('tmKickBtn');
  if(back) back.textContent='← BACK';
  if(kick){ kick.textContent='✓ APPLY & RESUME'; kick.onclick=pzCloseSquadEditor; }
}
function tmBackHandler(){
  if(G_teamEditorOrigin==='pause'){ pzCloseSquadEditor(); return; }
  showSc('s-ts');
}
function pzCloseSquadEditor(){
  // re-map hSq to the (possibly edited) HOME_SLOT_ASSIGN, keeping spirit/
  // cooldown for any player who's still in the same slot
  if(HT&&HT.p){
    const roster=HT.p.slice();
    const used=new Set();
    const fresh={};
    Object.keys(FORMATIONS[activeHomeFormation].coords).forEach(slot=>{
      const pid=HOME_SLOT_ASSIGN[slot];
      let pl=roster.find(r=>r.id===pid && !used.has(r.id));
      if(!pl) pl=roster.find(r=>!used.has(r.id));
      if(pl){
        used.add(pl.id);
        const prev=hSq[slot];
        const keep = prev && prev.id===pl.id;
        fresh[slot]={...pl, slot, spirit:keep?prev.spirit:(pl.pos==='GK'?2000:1500), cooldownUntil:keep?prev.cooldownUntil:0};
      }
    });
    hSq=fresh;
  }
  G_teamEditorOrigin=null;
  showSc('s-match'); // pause-overlay keeps its 'show' class — still paused
  pzBuildAll();
}

/* ---- 8) restart / forfeit ---- */
function pzRestart(){
  if(!confirm('Restart this match from 0-0? Current progress will be lost.'))return;
  document.getElementById('pause-overlay').classList.remove('show');
  G.paused=false;
  startGame();
}
function pzForfeit(){
  if(!confirm('Forfeit this match and return to the menu?'))return;
  exitToMenu();
}

/* ════════════════════════════════════════════════════════════════
   PATCHES — small one-line additions to existing functions so the
   MATCH DATA screen has real per-team numbers to show. Find each
   spot below in game.js and add the marked line.
   ════════════════════════════════════════════════════════════════

   A) G default state (two places: the `let G={...}` init and the
      reset inside whatever function rebuilds it, ~line 5821) — add
      these fields alongside the existing ones:
         hShots:0,aShots:0,hDuels:0,aDuels:0,hFouls:0,aFouls:0,hOff:0,aOff:0

   B) resDuel(), right after:  G.duels++;
      ADD:
         if(as==='h')G.hDuels++; else G.aDuels++;
      and change the existing shot-counter line right under it from:
         if(['shoot','special'].includes(ak))G.shots++;
      to:
         if(['shoot','special'].includes(ak)){G.shots++; if(as==='h')G.hShots++; else G.aShots++;}

   C) rollFoul(defSide,defSlot,attSide,prob), right after:
         const isPK=inBox&&Math.random()<0.4;
      ADD:
         if(defSide==='h')G.hFouls++; else G.aFouls++;

   D) the offside callback (inside animateBallTo(...) in the offside
      handler), right after:
         showEventBanner('\u{1F6A9} OFFSIDE','foul',2400);
      ADD:
         if(s==='h')G.hOff++; else G.aOff++;
   ════════════════════════════════════════════════════════════════ */
