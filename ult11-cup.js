/* ============================================================
   ULT11-CUP · tournaments
   - WORLD CUP : 24 nations · 6 groups of 4 · top2 + 4 best 3rds
                 → R16 → QF → SF → FINAL
   - EURO CUP  : 16 teams (15 European nations + All Stars wildcard)
                 · 4 groups of 4 · top2 → QF → SF → FINAL
   - CHAMPIONS LEAGUE : all 18 clubs · full double round-robin
                 league (34 MDs) · top of the table is champion
   User plays their own fixtures via the match engine, everything
   else is simulated. State persists in localStorage 'ue_cup_v1'.
   Load AFTER game.js + ult11-custom.js.
   ============================================================ */
(function(){
const KEY='ue_cup_v1';
const EURO_NATIONS=['germany','spain','france','ireland','scotland','belgium','austria','croatia','wales','switzerland','sweden','italy','holland','england','portugal','allstar'];
const KO_LABEL={r16:'ROUND OF 16',qf:'QUARTER-FINALS',sf:'SEMI-FINALS',f:'FINAL'};
const COMP_NAME={wc:'WORLD CUP',euro:'EUROPEAN CUP',ucl:'CHAMPIONS LEAGUE'};

window.CUP=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(CUP));}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(KEY);}catch(e){} window.CUP=null;}

// ── HELPERS ──────────────────────────────────────────────────
function tName(k){return (T[k]&&T[k].name)||(CR_CLUBS[k]&&CR_CLUBS[k].name)||k;}
function badge(k,s=26){
  const fb=(CR_CLUBS[k]&&typeof crBadgeSvg==='function')?crBadgeSvg(CR_CLUBS[k],s):((T[k]&&T[k].flag)||'🏳');
  const alt=CR_CLUBS[k]?` data-n="assets/career/clubs/club${k}.png"`:'';
  return `<span class="uee" style="width:${s}px;height:${s}px"><img src="assets/team/${k}.png"${alt} onerror="if(this.dataset.n){const n=this.dataset.n;this.removeAttribute('data-n');this.src=n;}else{this.style.display='none';this.nextElementSibling.style.display='flex';}"><span class="fb">${fb}</span></span>`;
}
function teamOvr(k){
  if(CR_CLUBS[k])return CR_CLUBS[k].ovr;
  const t=T[k];if(!t||!t.p)return 70;
  const v=t.p.map(p=>((p.spd||60)+(p.pwr||60)+(p.tec||60)+(p.def||60))/4).sort((a,b)=>b-a).slice(0,14);
  return Math.round(v.reduce((a,b)=>a+b,0)/v.length);
}
function simMatch(hk,ak){
  const d=(teamOvr(hk)+2)-teamOvr(ak);
  const hxg=Math.max(0,1.25+d/18+(Math.random()-.3)*.85);
  const axg=Math.max(0,1.25-d/18+(Math.random()-.3)*.85);
  return{hg:Math.round(hxg+Math.random()*.6),ag:Math.round(axg+Math.random()*.6)};
}
function pens(){let a=2+Math.floor(Math.random()*4),b=2+Math.floor(Math.random()*4);while(a===b){if(Math.random()<.5)a++;else b++;}return[a,b];}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newTab(keys){return Object.fromEntries(keys.map(k=>[k,{p:0,w:0,d:0,l:0,gf:0,ga:0}]));}
function applyTab(tab,h,a,hg,ag){
  const H=tab[h],A=tab[a];if(!H||!A)return;
  H.p++;A.p++;H.gf+=hg;H.ga+=ag;A.gf+=ag;A.ga+=hg;
  if(hg>ag){H.w++;A.l++;}else if(ag>hg){A.w++;H.l++;}else{H.d++;A.d++;}
}
function pts(r){return r.w*3+r.d;}
function sortKeys(keys,tab){return [...keys].sort((x,y)=>pts(tab[y])-pts(tab[x])||(tab[y].gf-tab[y].ga)-(tab[x].gf-tab[x].ga)||tab[y].gf-tab[x].gf||(x<y?-1:1));}
// 4-team group fixtures, 3 rounds
function groupFix(t){return[
  [{home:t[0],away:t[3]},{home:t[1],away:t[2]}],
  [{home:t[0],away:t[2]},{home:t[3],away:t[1]}],
  [{home:t[0],away:t[1]},{home:t[2],away:t[3]}]];}

// ── CREATE ───────────────────────────────────────────────────
window.cupOpen=function(){
  const saved=load();
  if(saved&&!saved.done){window.CUP=saved;CUP.pending=null;cupRenderHub();showSc('s-cup');return;}
  window.CUP=null;cupRenderSelect();showSc('s-cup');
};
window.cupChoose=function(comp){
  // team picker
  const keys=comp==='ucl'?Object.keys(CR_CLUBS):comp==='euro'?EURO_NATIONS:Object.keys(T).filter(k=>!T[k]._career&&!T[k]._story);
  const el=document.getElementById('cup-body');
  el.innerHTML=`<div class="cup-sec-t">${COMP_NAME[comp]} — PICK YOUR TEAM</div>
    <div class="cup-grid">${keys.map(k=>`<button class="cup-item" onclick="cupStart('${comp}','${k}')">${badge(k)}<span>${tName(k)}</span><b>${teamOvr(k)}</b></button>`).join('')}</div>
    <div class="cup-btns"><button class="cz-b" onclick="cupRenderSelect()">← BACK</button></div>`;
};
window.cupStart=function(comp,my){
  let C={comp,my,done:false,champion:null,pending:null,results:[]};
  if(comp==='ucl'){
    const teams=shuffle(Object.keys(CR_CLUBS));
    C.league={teams,tab:newTab(teams),fix:crMakeFixtures(teams),round:0};
  }else{
    const pool=shuffle(comp==='euro'?[...EURO_NATIONS]:Object.keys(T).filter(k=>!T[k]._career&&!T[k]._story));
    const gN=comp==='euro'?4:6,letters='ABCDEF';
    C.groups=[];C.round=0;C.stage='groups';
    for(let g=0;g<gN;g++){const t=pool.slice(g*4,g*4+4);C.groups.push({name:letters[g],teams:t,tab:newTab(t),fix:groupFix(t)});}
  }
  window.CUP=C;save();cupRenderHub();
};

// ── PROGRESSION ──────────────────────────────────────────────
function myFixture(){
  const C=CUP;if(!C||C.done)return null;
  if(C.comp==='ucl'){
    if(C.league.round>=C.league.fix.length)return null;
    return C.league.fix[C.league.round].find(m=>m.home===C.my||m.away===C.my)||null;
  }
  if(C.stage==='groups'){
    if(C.round>=3)return null;
    for(const g of C.groups){const m=g.fix[C.round].find(m=>m.home===C.my||m.away===C.my);if(m)return m;}
    return null;
  }
  const rd=C.ko&&C.ko[C.stage];
  if(!rd)return null;
  return rd.find(m=>!m.played&&(m.home===C.my||m.away===C.my))||null;
}
function recordResult(m,hg,ag,pn){
  m.hg=hg;m.ag=ag;m.played=true;if(pn)m.pens=pn;
  CUP.results.push({stage:CUP.comp==='ucl'?('MD'+(CUP.league.round+1)):(CUP.stage==='groups'?('GROUP R'+(CUP.round+1)):KO_LABEL[CUP.stage]),home:m.home,away:m.away,hg,ag,pens:pn||null});
}
function koWinner(m){if(m.hg>m.ag)return m.home;if(m.ag>m.hg)return m.away;return m.pens[0]>m.pens[1]?m.home:m.away;}

function advanceRound(){
  const C=CUP;
  if(C.comp==='ucl'){
    const rd=C.league.fix[C.league.round];
    rd.forEach(m=>{if(m.played)return;const r=simMatch(m.home,m.away);m.hg=r.hg;m.ag=r.ag;m.played=true;});
    rd.forEach(m=>applyTab(C.league.tab,m.home,m.away,m.hg,m.ag));
    C.league.round++;
    if(C.league.round>=C.league.fix.length){C.done=true;C.champion=sortKeys(C.league.teams,C.league.tab)[0];}
    return;
  }
  if(C.stage==='groups'){
    C.groups.forEach(g=>g.fix[C.round].forEach(m=>{
      if(!m.played){const r=simMatch(m.home,m.away);m.hg=r.hg;m.ag=r.ag;m.played=true;}
      applyTab(g.tab,m.home,m.away,m.hg,m.ag);
    }));
    C.round++;
    if(C.round>=3)buildKO();
    return;
  }
  // knockout: sim remaining ties of this stage
  const rd=C.ko[C.stage];
  rd.forEach(m=>{
    if(m.played)return;
    const r=simMatch(m.home,m.away);m.hg=r.hg;m.ag=r.ag;m.played=true;
    if(m.hg===m.ag)m.pens=pens();
  });
  const winners=rd.map(koWinner);
  if(C.stage==='f'){C.done=true;C.champion=winners[0];return;}
  const next=C.stage==='r16'?'qf':C.stage==='qf'?'sf':'f';
  C.ko[next]=[];for(let i=0;i<winners.length;i+=2)C.ko[next].push({home:winners[i],away:winners[i+1],played:false});
  C.stage=next;
}
function buildKO(){
  const C=CUP;C.ko={};
  if(C.comp==='euro'){
    const top=C.groups.map(g=>sortKeys(g.teams,g.tab));
    const[A,B,Cc,D]=top;
    C.ko.qf=[{home:A[0],away:B[1]},{home:Cc[0],away:D[1]},{home:B[0],away:A[1]},{home:D[0],away:Cc[1]}].map(m=>({...m,played:false}));
    C.stage='qf';return;
  }
  // World Cup: winners + runners-up + 4 best thirds → seeded R16
  const ranked=C.groups.map(g=>({g,order:sortKeys(g.teams,g.tab)}));
  const firsts=ranked.map(r=>r.order[0]),seconds=ranked.map(r=>r.order[1]);
  const thirds=ranked.map(r=>r.order[2]);
  const allTab=Object.assign({},...C.groups.map(g=>g.tab));
  const best3=sortKeys(thirds,allTab).slice(0,4);
  const seeds=[...sortKeys(firsts,allTab),...sortKeys(seconds,allTab),...best3]; // 16 seeded strongest→weakest
  C.ko.r16=[];for(let i=0;i<8;i++)C.ko.r16.push({home:seeds[i],away:seeds[15-i],played:false});
  C.stage='r16';
}

// ── PLAY / SIM ───────────────────────────────────────────────
window.cupPlayNext=function(){
  const m=myFixture();if(!m)return;
  const my=CUP.my,opp=m.home===my?m.away:m.home;
  if(CR_CLUBS[my])crBuildClubTeam(my);
  if(CR_CLUBS[opp])crBuildClubTeam(opp);
  selHome=my;selAway=opp;HT=T[my];AT=T[opp];
  CUP.pending={home:m.home,away:m.away,isHome:m.home===my};save();
  G_teamEditorOrigin='cup';
  openTeamMenu();
};
window.cupSimNext=function(){
  const m=myFixture();
  if(m){
    const r=simMatch(m.home,m.away);let pn=null;
    if(CUP.comp!=='ucl'&&CUP.stage!=='groups'&&r.hg===r.ag)pn=pens();
    recordResult(m,r.hg,r.ag,pn);
  }
  advanceRound();save();cupRenderHub();
};
// Called by goFull() in game.js when a tournament match ends
window.cupOnFullTime=function(engHg,engAg){
  const p=CUP.pending;if(!p)return;
  const hg=p.isHome?engHg:engAg,ag=p.isHome?engAg:engHg;
  let m=myFixture();CUP.pending=null;
  if(m){
    let pn=null;
    if(CUP.comp!=='ucl'&&CUP.stage!=='groups'&&hg===ag)pn=pens();
    recordResult(m,hg,ag,pn);
    CUP._last={home:m.home,away:m.away,hg,ag,pens:m.pens||null};
  }
  advanceRound();save();
  cupRenderHub();showSc('s-cup');
};
window.cupQuit=function(){
  if(!confirm('Abandon this tournament? Progress will be deleted.'))return;
  clearSave();cupRenderSelect();
};
window.cupNew=function(){clearSave();cupRenderSelect();};

// ── RENDER ───────────────────────────────────────────────────
window.cupRenderSelect=function(){
  const el=document.getElementById('cup-body');if(!el)return;
  el.innerHTML=`<div class="cup-sec-t">SELECT COMPETITION</div>
  <div class="cup-comps">
    <button class="cup-comp" style="--cc:#ffd24a" onclick="cupChoose('wc')"><b>🏆</b><span>WORLD CUP</span><i>24 nations · groups → knockout</i></button>
    <button class="cup-comp" style="--cc:#4ea0ff" onclick="cupChoose('euro')"><b>🏆</b><span>EUROPEAN CUP</span><i>16 teams · groups → knockout</i></button>
    <button class="cup-comp" style="--cc:#b06cff" onclick="cupChoose('ucl')"><b>⭐</b><span>CHAMPIONS LEAGUE</span><i>18 clubs · full league season</i></button>
  </div>`;
};
function rowHtml(k,r,hl){return `<tr class="${hl?'me':''}"><td class="tt">${badge(k,18)}<span>${tName(k)}</span></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pt">${pts(r)}</td></tr>`;}
function tableHtml(title,keys,tab,my){
  return `<div class="cup-tblw"><div class="cup-tbl-t">${title}</div><table class="cup-tbl"><thead><tr><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${sortKeys(keys,tab).map(k=>rowHtml(k,tab[k],k===my)).join('')}</tbody></table></div>`;
}
function matchLine(m){
  const sc=m.played?`${m.hg}–${m.ag}${m.pens?` <i>(${m.pens[0]}–${m.pens[1]} p)</i>`:''}`:'vs';
  return `<div class="cup-mline${m.played?'':' up'}"><span class="l">${badge(m.home,16)} ${tName(m.home)}</span><b>${sc}</b><span class="r">${tName(m.away)} ${badge(m.away,16)}</span></div>`;
}
window.cupRenderHub=function(){
  const C=CUP,el=document.getElementById('cup-body');if(!el)return;
  if(!C){cupRenderSelect();return;}
  let head=`<div class="cup-head"><div class="cup-comp-t" >${COMP_NAME[C.comp]}</div><div class="cup-stage">${C.done?'FINISHED':C.comp==='ucl'?('MATCHDAY '+(C.league.round+1)+' / '+C.league.fix.length):C.stage==='groups'?('GROUP STAGE · ROUND '+(C.round+1)+' / 3'):KO_LABEL[C.stage]}</div></div>`;

  // last result banner
  let last='';
  if(C._last){const L=C._last;last=`<div class="cup-last">FT &nbsp;${badge(L.home,18)} ${tName(L.home)} <b>${L.hg}–${L.ag}</b> ${tName(L.away)} ${badge(L.away,18)}${L.pens?` <i>(${L.pens[0]}–${L.pens[1]} pens)</i>`:''}</div>`;}

  let body='';
  if(C.done){
    body+=`<div class="cup-champ">🏆<div><b>${tName(C.champion)}</b><span>${COMP_NAME[C.comp]} CHAMPIONS</span></div>${badge(C.champion,34)}</div>`;
  }else{
    const m=myFixture();
    if(m){
      const opp=m.home===C.my?m.away:m.home;
      body+=`<div class="cup-next"><div class="cup-next-t">MY NEXT MATCH ${m.home===C.my?'· HOME':'· AWAY'}</div>
        <div class="cup-next-vs">${badge(m.home,30)}<span>${tName(m.home)}</span><b>VS</b><span>${tName(m.away)}</span>${badge(m.away,30)}</div>
        <div class="cup-btns"><button class="cz-b cz-save" onclick="cupPlayNext()">▶ PLAY MATCH</button>
        <button class="cz-b" onclick="cupSimNext()">⏩ SIM ROUND</button></div></div>`;
    }else{
      body+=`<div class="cup-next"><div class="cup-next-t">${C.comp!=='ucl'&&C.stage!=='groups'?'YOU ARE ELIMINATED':'NO FIXTURE'} — SIM TO CONTINUE</div>
        <div class="cup-btns"><button class="cz-b cz-save" onclick="cupSimNext()">⏩ SIM ROUND</button></div></div>`;
    }
  }

  if(C.comp==='ucl'){
    body+=tableHtml('LEAGUE TABLE',C.league.teams,C.league.tab,C.my);
  }else{
    if(C.stage!=='groups'&&C.ko){
      ['r16','qf','sf','f'].forEach(st=>{
        if(!C.ko[st])return;
        body+=`<div class="cup-tblw"><div class="cup-tbl-t">${KO_LABEL[st]}</div>${C.ko[st].map(matchLine).join('')}</div>`;
      });
    }
    const myG=C.groups.find(g=>g.teams.includes(C.my));
    const rest=C.groups.filter(g=>g!==myG);
    if(myG)body+=tableHtml('GROUP '+myG.name+' (MY GROUP)',myG.teams,myG.tab,C.my);
    rest.forEach(g=>body+=tableHtml('GROUP '+g.name,g.teams,g.tab,C.my));
  }

  body+=`<div class="cup-btns cup-foot">${C.done?'<button class="cz-b cz-save" onclick="cupNew()">🏆 NEW TOURNAMENT</button>':''}<button class="cz-b cz-danger" onclick="cupQuit()">QUIT TOURNAMENT</button></div>`;
  el.innerHTML=head+last+body;
}
console.log('[CUP] tournament module active');
})();
