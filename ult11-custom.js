/* ============================================================
   ULT11-CUSTOM · rename clubs, nations and players (CT:RoNC style)
   - Display names are overridden; asset paths keep resolving from
     pl.origName, so portraits/cards never break after a rename.
   - Stored in localStorage 'ue_custom_v1'.
   Load AFTER game.js (needs T, CR_CLUBS, CR_NAMES, showSc).
   ============================================================ */
(function(){
const KEY='ue_custom_v1';
function czLoad(){try{const d=JSON.parse(localStorage.getItem(KEY));return d&&d.teams?d:{teams:{},players:{}};}catch(e){return{teams:{},players:{}};}}
let CZ=czLoad();
function czSave(){try{localStorage.setItem(KEY,JSON.stringify(CZ));}catch(e){}}

// ── STABLE PLAYER KEYS ───────────────────────────────────────
// Renames are keyed by ORIGINAL name (not array index) so roster
// reorders/rebuilds (transfers, story inject, crBuildClubTeam) can
// never attach a name to the wrong player. Duplicate original names
// get an occurrence suffix: "Rossi", "Rossi#2", ...
function stableKeys(names){
  const seen={};
  return names.map(n=>{const c=(seen[n]=(seen[n]||0)+1);return c>1?n+'#'+c:n;});
}
function origNamesOf(key){
  try{
    if(typeof T!=='undefined'&&T[key]&&T[key].p&&T[key].p.length)
      return T[key].p.map(pl=>pl.origName||pl.name||'');
    if(typeof CR_NAMES!=='undefined'&&CR_NAMES[key])
      return CR_NAMES[key].slice();
  }catch(e){}
  return null;
}
// one-time migration: index-keyed maps -> origName-keyed maps
function czMigrate(){
  if(CZ._v===2)return;
  const out={};
  Object.keys(CZ.players||{}).forEach(k=>{
    const m=CZ.players[k]||{},nm={};
    const names=origNamesOf(k),sk=names?stableKeys(names):null;
    Object.keys(m).forEach(key=>{
      if(/^\d+$/.test(key)){const i=+key;if(sk&&sk[i])nm[sk[i]]=m[key];}
      else nm[key]=m[key];
    });
    if(Object.keys(nm).length)out[k]=nm;
  });
  CZ.players=out;CZ._v=2;czSave();
}
czMigrate();

// Position labels for club rosters (matches crBuildClubTeam LINEUP order)
const CLUB_POS=['GK','LB','CB','CB','RB','CM','CM','CM','LW','ST','RW','GK·R','CB·R','LB·R','CM·R','CM·R','LW·R','ST·R'];

// ── APPLY ────────────────────────────────────────────────────
window.applyCustomNamesToTeam=function(key,team){
  if(!team||!team.p)return;
  if(!team._origName)team._origName=team.name;
  team.name=CZ.teams[key]||team._origName;
  const map=CZ.players[key]||{};
  team.p.forEach(pl=>{if(!pl.origName)pl.origName=pl.name;});
  const sk=stableKeys(team.p.map(pl=>pl.origName||pl.name||''));
  team.p.forEach((pl,i)=>{pl.name=map[sk[i]]||pl.origName;});
};
function applyAll(){
  try{
    Object.keys(T).forEach(k=>applyCustomNamesToTeam(k,T[k]));
    Object.keys(CR_CLUBS).forEach(k=>{
      const c=CR_CLUBS[k];
      if(!c._origName)c._origName=c.name;
      c.name=CZ.teams[k]||c._origName;
      if(T[k]&&T[k]._career)applyCustomNamesToTeam(k,T[k]);
    });
  }catch(e){console.warn('[CZ] apply failed',e);}
}

// ── ROSTER SOURCE (for the editor list) ──────────────────────
function rosterOf(key){
  // National team (or already-built career club): live player objects
  const map=CZ.players[key]||{};
  if(T[key]&&T[key].p&&(!CR_CLUBS[key]||T[key]._career)){
    const sk=stableKeys(T[key].p.map(pl=>pl.origName||pl.name||''));
    return T[key].p.map((pl,i)=>({k:sk[i],pos:pl.pos||CLUB_POS[i]||'',orig:pl.origName||pl.name,cur:pl.name}));
  }
  // Club not built yet: read the raw CR_NAMES roster
  const names=CR_NAMES[key]||[];
  const sk=stableKeys(names);
  return names.map((n,i)=>({k:sk[i],pos:CLUB_POS[i]||'',orig:n,cur:map[sk[i]]||n}));
}
function teamLabel(key){
  if(CR_CLUBS[key])return CZ.teams[key]||CR_CLUBS[key]._origName||CR_CLUBS[key].name;
  return CZ.teams[key]||(T[key]&&(T[key]._origName||T[key].name))||key;
}
function origTeamLabel(key){
  if(CR_CLUBS[key])return CR_CLUBS[key]._origName||CR_CLUBS[key].name;
  return (T[key]&&(T[key]._origName||T[key].name))||key;
}
function badgeHtml(k,s=26){
  const fb=(CR_CLUBS[k]&&typeof crBadgeSvg==='function')?crBadgeSvg(CR_CLUBS[k],s):((T[k]&&T[k].flag)||'🏳');
  const alt=CR_CLUBS[k]?` data-n="assets/career/clubs/fake/club${k}.png"`:'';
  return `<span class="uee" style="width:${s}px;height:${s}px"><img src="assets/team/fake/${k}.png"${alt} onerror="if(this.dataset.n){const n=this.dataset.n;this.removeAttribute('data-n');this.src=n;}else{this.style.display='none';this.nextElementSibling.style.display='flex';}"><span class="fb">${fb}</span></span>`;
}

// ── UI ───────────────────────────────────────────────────────
let czTab='nations', czSel=null;
window.czOpen=function(){czTab='nations';czSel=null;czRender();showSc('s-custom');};
window.czSetTab=function(t){czTab=t;czSel=null;czRender();};
window.czPick=function(k){czSel=k;czRender();};

function czRender(){
  const list=document.getElementById('cz-list'),ed=document.getElementById('cz-edit');
  if(!list||!ed)return;
  document.querySelectorAll('.cz-tab').forEach(b=>b.classList.toggle('on',b.dataset.t===czTab));
  const keys=czTab==='nations'
    ?Object.keys(T).filter(k=>!T[k]._career)
    :Object.keys(CR_CLUBS);
  list.innerHTML=keys.map(k=>{
    const edited=CZ.teams[k]||(CZ.players[k]&&Object.keys(CZ.players[k]).length);
    return `<button class="cz-item${czSel===k?' on':''}" onclick="czPick('${k}')">${badgeHtml(k)}<span>${teamLabel(k)}</span>${edited?'<i class="cz-dot"></i>':''}</button>`;
  }).join('');
  if(!czSel){ed.innerHTML='<div class="cz-hint">SELECT A TEAM TO EDIT NAMES<br><span>Original names stay linked to portraits & cards — renaming is always safe and reversible.</span></div>';return;}
  const k=czSel,ros=rosterOf(k);
  ed.innerHTML=`
    <div class="cz-ed-head">${badgeHtml(k)}
      <input id="cz-tn" class="cz-in cz-in-team" maxlength="24" value="${(CZ.teams[k]||'').replace(/"/g,'&quot;')}" placeholder="${origTeamLabel(k)}">
    </div>
    <div class="cz-rows">${ros.map(r=>`
      <div class="cz-row"><span class="cz-pos">${r.pos}</span>
        <input class="cz-in" data-k="${String(r.k).replace(/"/g,'&quot;')}" maxlength="20" value="${(CZ.players[k]&&CZ.players[k][r.k]||'').replace(/"/g,'&quot;')}" placeholder="${r.orig}">
      </div>`).join('')}
    </div>
    <div class="cz-btns">
      <button class="cz-b cz-save" onclick="czSaveTeam()">💾 SAVE</button>
      <button class="cz-b" onclick="czResetTeam()">RESET TEAM</button>
      <button class="cz-b cz-danger" onclick="czResetAll()">RESET ALL</button>
    </div>`;
}
window.czSaveTeam=function(){
  const k=czSel;if(!k)return;
  const tn=(document.getElementById('cz-tn').value||'').trim();
  if(tn)CZ.teams[k]=tn;else delete CZ.teams[k];
  const map={};
  document.querySelectorAll('#cz-edit .cz-in[data-k]').forEach(inp=>{
    const v=(inp.value||'').trim();if(v)map[inp.dataset.k]=v;
  });
  if(Object.keys(map).length)CZ.players[k]=map;else delete CZ.players[k];
  czSave();applyAll();czRender();
  if(typeof aeToast==='function')aeToast('Names saved');
};
window.czResetTeam=function(){
  const k=czSel;if(!k)return;
  delete CZ.teams[k];delete CZ.players[k];
  czSave();applyAll();czRender();
  if(typeof aeToast==='function')aeToast('Team reset to original names');
};
window.czResetAll=function(){
  if(!confirm('Reset ALL custom names back to the originals?'))return;
  CZ={teams:{},players:{}};czSave();applyAll();czRender();
  if(typeof aeToast==='function')aeToast('All names reset');
};

applyAll();
console.log('[CZ] customize module active');
})();
