/* ============================================================
   ULT11-STORY · "LA NUOVA STELLA" — New Hero story mode
   Pick FW or CA (both Italian), name hero + rival, then:
     CH.1  Last year of high school — national schools cup (8 schools)
     CH.2  Scouted: FW → Genoa CFC · CA → Sampdoria (Serie B, 20 clubs)
     CH.3  Promotion → Serie A (20 clubs, fake names except existing ones)
     CH.4  Top-4 finish → AZZURRI call-up → World Cup KO (16 nations)
   Leveling: hero gains XP from his own matches; rival is ALWAYS
   hero level +1 and follows the parallel path at the other club.
   All new club/player names are fictional; everything is also
   renameable later through the Customize page.
   State: localStorage 'ue_story_v1'. Load AFTER game.js/custom/cup.
   ============================================================ */
(function(){
const KEY='ue_story_v1';
window.STORY=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(STORY));}catch(e){}}
function load(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY))||null;
    if(d&&d.hero&&!d.hero.alloc){ // migrate pre-points saves: convert old auto-growth to allocated stats
      const g=d.hero.level-1,r=d.hero.role;
      const rates=r==='FW'?{spd:0.8,pwr:1.0,tec:0.9,def:0.25}:{spd:0.7,pwr:0.6,tec:1.0,def:0.5};
      d.hero.alloc={spd:Math.round(g*rates.spd),pwr:Math.round(g*rates.pwr),tec:Math.round(g*rates.tec),def:Math.round(g*rates.def)};
      d.hero.points=0;
    }
    return d;
  }catch(e){return null;}
}
function wipe(){try{localStorage.removeItem(KEY);}catch(e){} window.STORY=null;}

/* ── SEEDED RNG (stable rosters per club) ─────────────────── */
function hash(s){let h=1779033703;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
function sr(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ── FICTIONAL ITALIAN LEAGUE ─────────────────────────────── */
// Existing CR clubs keep their names (user rule). Everything new is invented.
const SA_EXISTING=['juventus','inter','napoli'];
const ST_CLUBS={
  // Serie A (17 new + 3 existing = 20)
  milrossa:   {name:'Milano Rossa',      colors:['#fb090b','#000000'],abbr:'MRO',ovr:88},
  romalupa:   {name:'Roma Lupa',         colors:['#8e1f2f','#f0bc42'],abbr:'LUP',ovr:84},
  lazaquile:  {name:'Lazio Aquile',      colors:['#87d8f7','#ffffff'],abbr:'AQU',ovr:82},
  fioviola:   {name:'Viola Firenze',     colors:['#5a2d82','#ffffff'],abbr:'VIO',ovr:80},
  torgranata: {name:'Torino Granata',    colors:['#8a1e03','#ffffff'],abbr:'GRA',ovr:78},
  berorobica: {name:'Bergamo Orobica',   colors:['#1e71b8','#000000'],abbr:'ORO',ovr:83},
  bolfelsina: {name:'Bologna Felsina',   colors:['#a21c26','#1a2f48'],abbr:'FEL',ovr:79},
  udifriuli:  {name:'Udine Friuli',      colors:['#000000','#ffffff'],abbr:'FRI',ovr:76},
  sasverde:   {name:'Sassuolo Verdenero',colors:['#00a752','#000000'],abbr:'SVN',ovr:75},
  empazzurri: {name:'Empoli Azzurri',    colors:['#0d5cab','#ffffff'],abbr:'EMP',ovr:74},
  verscala:   {name:'Verona Scaligera',  colors:['#003f8f','#ffd200'],abbr:'SCA',ovr:75},
  lecsalento: {name:'Lecce Salento',     colors:['#e3b505','#c8102e'],abbr:'SAL',ovr:74},
  cagisolani: {name:'Cagliari Isolani',  colors:['#8a1e03','#003f8f'],abbr:'ISO',ovr:75},
  monbrianza: {name:'Monza Brianza',     colors:['#ee1c25','#ffffff'],abbr:'BRI',ovr:73},
  salippo:    {name:'Salerno Ippocampi', colors:['#7a1f2b','#e8c34f'],abbr:'IPP',ovr:72},
  comlariana: {name:'Como Lariana',      colors:['#16335f','#ffffff'],abbr:'LAR',ovr:76},
  parducale:  {name:'Parma Ducale',      colors:['#fff200','#003a70'],abbr:'DUC',ovr:77},
  // Serie B (18 new + genoa existing + sampdoria = 20)
  sampdoria:  {name:'Sampdoria',         colors:['#1e2f97','#d40000'],abbr:'SAM',ovr:73},
  barigall:   {name:'Bari Galletti',     colors:['#ffffff','#d40000'],abbr:'GAL',ovr:70},
  palaquile:  {name:'Palermo Rosa',      colors:['#f8a8c2','#000000'],abbr:'PAL',ovr:71},
  venlaguna:  {name:'Venezia Laguna',    colors:['#0c1a24','#ff7d00'],abbr:'LAG',ovr:69},
  cregrigia:  {name:'Cremona Grigia',    colors:['#9aa0a6','#d40000'],abbr:'CRE',ovr:67},
  spegolfo:   {name:'Spezia Golfo',      colors:['#ffffff','#000000'],abbr:'GOL',ovr:66},
  breleonessa:{name:'Brescia Leonessa',  colors:['#1e71b8','#ffffff'],abbr:'LEO',ovr:68},
  pistorre:   {name:'Pisa Torre',        colors:['#1a2f48','#000000'],abbr:'TOR',ovr:67},
  modgialloblu:{name:'Modena Gialloblu', colors:['#ffd200','#003f8f'],abbr:'MOD',ovr:66},
  cattrecolli:{name:'Catanzaro Colli',   colors:['#ffd200','#d40000'],abbr:'CAT',ovr:65},
  coslupi:    {name:'Cosenza Silani',    colors:['#d40000','#1e2f97'],abbr:'SIL',ovr:64},
  citmura:    {name:'Cittadella Mura',   colors:['#7a1f2b','#ffffff'],abbr:'MUR',ovr:65},
  regtricolore:{name:'Reggio Tricolore', colors:['#8a1e03','#ffffff'],abbr:'TRI',ovr:66},
  terrosse:   {name:'Terni Rosse',       colors:['#d40000','#00a752'],abbr:'TER',ovr:64},
  ascpicchi:  {name:'Ascoli Picchi',     colors:['#000000','#ffffff'],abbr:'PIC',ovr:65},
  frociociaria:{name:'Frosinone Ciociaria',colors:['#ffd200','#1e71b8'],abbr:'CIO',ovr:67},
  pergrifoni: {name:'Perugia Grifoni',   colors:['#d40000','#ffffff'],abbr:'GRI',ovr:66},
  trialabarda:{name:'Trieste Alabarda',  colors:['#d40000','#ffffff'],abbr:'ALA',ovr:65},
  // High schools (chapter 1)
  hs_garibaldi:{name:'Liceo Garibaldi',  colors:['#1e5f3c','#ffffff'],abbr:'GAR',ovr:56,school:true},
  hs_sangiorgio:{name:'Ist. San Giorgio',colors:['#16335f','#e8c34f'],abbr:'SGI',ovr:58,school:true},
  hs_vesuvio: {name:'Liceo Vesuvio',     colors:['#d40000','#000000'],abbr:'VES',ovr:55,school:true},
  hs_sabaudo: {name:'Convitto Sabaudo',  colors:['#8a1e03','#ffffff'],abbr:'SAB',ovr:54,school:true},
  hs_dante:   {name:'Liceo Dante',       colors:['#5a2d82','#ffffff'],abbr:'DAN',ovr:55,school:true},
  hs_meneghino:{name:'Ist. Meneghino',   colors:['#1e71b8','#000000'],abbr:'MEN',ovr:57,school:true},
  hs_capitolino:{name:'Liceo Capitolino',colors:['#8e1f2f','#f0bc42'],abbr:'CAP',ovr:56,school:true},
  hs_adriatica:{name:'Scuola Adriatica', colors:['#ffffff','#d40000'],abbr:'ADR',ovr:53,school:true},
};
window.ST_CLUBS=ST_CLUBS;
const SERIE_A=[...SA_EXISTING,...Object.keys(ST_CLUBS).filter(k=>!ST_CLUBS[k].school&&ST_CLUBS[k].ovr>=72&&k!=='sampdoria'&&!['barigall','palaquile'].includes(k))].slice(0,20);
const SERIE_B=['genoa','sampdoria','barigall','palaquile','venlaguna','cregrigia','spegolfo','breleonessa','pistorre','modgialloblu','cattrecolli','coslupi','citmura','regtricolore','terrosse','ascpicchi','frociociaria','pergrifoni','trialabarda','monbrianza'];
const SCHOOLS=['hs_garibaldi','hs_meneghino','hs_dante','hs_adriatica','hs_capitolino','hs_sabaudo','hs_vesuvio','hs_sangiorgio'];

const SURNAMES=['Rossi','Russo','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','Costa','Giordano','Rizzo','Lombardi','Moretti','Barbieri','Fontana','Santoro','Mariani','Rinaldi','Caruso','Ferrara','Galli','Martini','Leone','Longo','Gentile','Vitale','Serra','Coppola','Marchetti','Parisi','Villa','Ferraro','Ferri','Fabbri','Bianco','Marini','Grasso','Valentini','Messina','Sala','Gatti','Palumbo','Sanna','Farina','Rizzi','Monti','Cattaneo','Morelli','Amato','Silvestri','Mazza','Testa','Grassi','Carbone','Giuliani','Benedetti','Barone','Rossetti','Caputo','Montanari','Guerra','Palmieri','Bernardi','Fiore','Ferretti','Bellini','Basile','Riva','Donati','Piras','Vitali','Battaglia','Sartori','Neri','Costantini','Milani','Pagano','Ruggiero','Sorrentino','Orlando','Damiano','Pucci','Bassi','Tedesco','Mauro','Brunetti','Lanza'];
const HERO_SLOT={FW:'ST',CA:'CM3'};
const LINEUP=[
  {slot:'GK',pos:'GK',j:1},{slot:'LB',pos:'LB',j:3},{slot:'CB1',pos:'CB1',j:5},{slot:'CB2',pos:'CB2',j:4},{slot:'RB',pos:'RB',j:2},
  {slot:'CM1',pos:'CM1',j:6},{slot:'CM2',pos:'CM2',j:8},{slot:'CM3',pos:'CM3',j:10},{slot:'LW',pos:'LW',j:11},{slot:'ST',pos:'ST',j:9},{slot:'RW',pos:'RW',j:7},
  {pos:'GK',j:12,r:1},{pos:'CB1',j:13,r:1},{pos:'LB',j:14,r:1},{pos:'CM2',j:15,r:1},{pos:'CM1',j:16,r:1},{pos:'LW',j:17,r:1},{pos:'ST',j:18,r:1}];

/* ── TEAM BUILDING ────────────────────────────────────────── */
function stBuildTeam(key){
  const def=ST_CLUBS[key];
  if(!def){ if(typeof crBuildClubTeam==='function'&&CR_CLUBS[key])return crBuildClubTeam(key); return T[key]; }
  if(T[key]&&T[key]._story)return T[key];
  const r=sr(hash(key)),base=def.ovr-6,range=12;
  const used=new Set(),pick=()=>{let n;do{n=SURNAMES[Math.floor(r()*SURNAMES.length)];}while(used.has(n));used.add(n);return n;};
  const players=[],reserves=[];
  LINEUP.forEach((row,i)=>{
    const ln=pick(),fi=String.fromCharCode(65+Math.floor(r()*26));
    const sb=base+Math.floor(r()*range),isGK=row.pos==='GK';
    const pl={id:hash(key)%80000+1000+i,name:fi+'.'+ln,origName:fi+'.'+ln,pos:row.pos,
      spd:Math.max(40,sb-Math.floor(r()*8)),pwr:Math.max(40,sb-Math.floor(r()*8)),
      tec:Math.max(40,sb-Math.floor(r()*8)),
      def:isGK?sb:(['LW','ST','RW'].includes(row.pos)?Math.max(35,sb-12-Math.floor(r()*8)):sb-Math.floor(r()*8)),
      rar:sb>=80?2:1,jersey:row.j,clubKey:key};
    if(isGK){pl.sav=Math.min(95,sb+4+Math.floor(r()*6));pl.ref=Math.min(95,sb+Math.floor(r()*5));}
    players.push(pl);if(row.r)reserves.push(pl.id);
  });
  T[key]={name:def.name,flag:def.abbr,p:players,reserves,formation:'4-3-3',_story:true};
  if(typeof window.applyCustomNamesToTeam==='function')window.applyCustomNamesToTeam(key,T[key]);
  return T[key];
}
const HERO_BASE={FW:{spd:62,pwr:60,tec:58,def:38},CA:{spd:58,pwr:52,tec:64,def:46}};
const PTS_PER_LVL=3,STAT_CAP=96;
function heroStats(H){ // H = STORY.hero (uses allocated points)
  const b=HERO_BASE[H.role],a=H.alloc||{spd:0,pwr:0,tec:0,def:0};
  return{spd:Math.min(STAT_CAP,b.spd+(a.spd||0)),pwr:Math.min(STAT_CAP,b.pwr+(a.pwr||0)),
         tec:Math.min(STAT_CAP,b.tec+(a.tec||0)),def:Math.min(STAT_CAP,b.def+(a.def||0))};
}
function rivalStats(role,lvl){ // rival auto-distributes role-weighted, always lvl = hero+1
  const b={...HERO_BASE[role]},pts=(lvl-1)*PTS_PER_LVL;
  const w=role==='FW'?['pwr','spd','tec','def']:['tec','spd','def','pwr'];
  const share=[0.36,0.28,0.24,0.12];
  w.forEach((k,i)=>b[k]=Math.min(STAT_CAP,Math.round(b[k]+pts*share[i])));
  return b;
}
function injectHero(teamKey,who){ // who: 'hero' | 'rival'
  const t=stBuildTeam(teamKey);if(!t)return;
  const S=STORY.hero,role=who==='hero'?S.role:(S.role==='FW'?'CA':'FW');
  const lvl=who==='hero'?S.level:S.level+1;
  const slotPos=HERO_SLOT[role],st=who==='hero'?heroStats(S):rivalStats(role,lvl);
  const nm=who==='hero'?S.name:S.rival;
  const idx=t.p.findIndex(p=>p.pos===slotPos&&!p._hero&&!p._rival);
  const old=idx>=0?t.p[idx]:t.p[9];
  const pl={...old,id:who==='hero'?99901:99902,name:nm,origName:nm,
    spd:st.spd,pwr:st.pwr,tec:st.tec,def:st.def,rar:2,
    jersey:role==='FW'?9:10,clubKey:ST_CLUBS[teamKey]||CR_CLUBS[teamKey]?teamKey:undefined};
  pl[who==='hero'?'_hero':'_rival']=true;
  // remove any previous copy of this character anywhere in the team, then place
  t.p=t.p.map(p=>(p._hero&&who==='hero')||(p._rival&&who==='rival')?old:p);
  t.p[idx>=0?idx:9]=pl;
}
function lvlBoost(k){
  if(!STORY||!STORY.hero)return 0;
  if(k===STORY.hero.club)return Math.min(15,STORY.hero.level*0.5);
  if(k===STORY.hero.rivalClub)return Math.min(15,(STORY.hero.level+1)*0.5);
  return 0;
}
function teamOvr(k){
  if(ST_CLUBS[k])return ST_CLUBS[k].ovr+lvlBoost(k);
  if(CR_CLUBS[k])return CR_CLUBS[k].ovr+lvlBoost(k);
  const t=T[k];if(!t||!t.p)return 70;
  const v=t.p.map(p=>((p.spd||60)+(p.pwr||60)+(p.tec||60)+(p.def||60))/4).sort((a,b)=>b-a).slice(0,14);
  return Math.round(v.reduce((a,b)=>a+b,0)/v.length);
}
function simMatch(hk,ak){
  const d=(teamOvr(hk)+2)-teamOvr(ak);
  const hx=Math.max(0,1.25+d/16+(Math.random()-.3)*.85),ax=Math.max(0,1.25-d/16+(Math.random()-.3)*.85);
  return{hg:Math.round(hx+Math.random()*.6),ag:Math.round(ax+Math.random()*.6)};
}
function pens(){let a=2+Math.floor(Math.random()*4),b=2+Math.floor(Math.random()*4);while(a===b){if(Math.random()<.5)a++;else b++;}return[a,b];}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newTab(keys){return Object.fromEntries(keys.map(k=>[k,{p:0,w:0,d:0,l:0,gf:0,ga:0}]));}
function applyTab(tab,h,a,hg,ag){const H=tab[h],A=tab[a];if(!H||!A)return;H.p++;A.p++;H.gf+=hg;H.ga+=ag;A.gf+=ag;A.ga+=hg;if(hg>ag){H.w++;A.l++;}else if(ag>hg){A.w++;H.l++;}else{H.d++;A.d++;}}
function pts(r){return r.w*3+r.d;}
function sortKeys(keys,tab){return[...keys].sort((x,y)=>pts(tab[y])-pts(tab[x])||(tab[y].gf-tab[y].ga)-(tab[x].gf-tab[x].ga)||tab[y].gf-tab[x].gf||(x<y?-1:1));}
function singleRR(teams){return crMakeFixtures(teams).slice(0,teams.length-1);}
function tName(k){return (T[k]&&T[k].name)||(ST_CLUBS[k]&&ST_CLUBS[k].name)||(CR_CLUBS[k]&&CR_CLUBS[k].name)||k;}
// Fixed art slots so portraits work regardless of the chosen name:
//   assets/players/hero-{fw|ca}-school.png  · high-school chapter
//   assets/players/hero-fw-genoa.png / hero-ca-doria.png · club chapters
//   assets/players/hero-{fw|ca}-ita.png     · world cup & epilogue
// Falls back to assets/players/{chosenlastname}.png, then the silhouette.
function charCtx(role,phase){
  if(phase==='hs')return 'school';
  if(phase==='wc'||phase==='done')return 'ita';
  return role==='FW'?'genoa':'doria';
}
function charFace(who,cls){
  const H=STORY&&STORY.hero;
  const gen=(typeof _GENERIC_PLAYER_SVG_URL!=='undefined')?_GENERIC_PLAYER_SVG_URL:'';
  if(!H)return `<span class="st-face ${cls||''}"><img src="${gen}"></span>`;
  const role=who==='rival'?(H.role==='FW'?'CA':'FW'):H.role;
  // rival never makes the national team — his art stays at his club in WC chapters
  const phase=(who==='rival'&&(STORY.phase==='wc'||STORY.phase==='done'))?'sb':STORY.phase;
  const nm=who==='rival'?H.rival:H.name;
  const ln=String(nm||'').split('.').pop().toLowerCase().trim().replace(/[^a-z0-9]/g,'');
  const chain=[`assets/players/hero-${role.toLowerCase()}-${charCtx(role,phase)}.png`,`assets/players/${ln}.png`,gen].join('|');
  return `<span class="st-face ${cls||''}"><img src="${chain.split('|')[0]}" data-c="${chain.split('|').slice(1).join('|')}" onerror="const d=(this.dataset.c||'').split('|').filter(Boolean);if(d.length){this.src=d.shift();this.dataset.c=d.join('|');}else{this.onerror=null;}"></span>`;
}
function heroFace(name,cls){ // legacy signature → route by name match
  if(STORY&&STORY.hero&&name===STORY.hero.rival)return charFace('rival',cls);
  return charFace('hero',cls);
}
function badge(k,s=24){
  const def=ST_CLUBS[k]||CR_CLUBS[k];
  const fb=def&&typeof crBadgeSvg==='function'?crBadgeSvg(def,s):((T[k]&&T[k].flag)||'🏳');
  return `<span class="uee" style="width:${s}px;height:${s}px"><img src="assets/team/${k}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="fb">${fb}</span></span>`;
}


/* ── STAT POINT ALLOCATION ─────────────────────────────────── */
window.stOpenAlloc=function(){
  const ov=document.getElementById('st-alloc');if(!ov)return;
  ov.style.display='flex';stRenderAlloc();
};
window.stCloseAlloc=function(){const ov=document.getElementById('st-alloc');if(ov)ov.style.display='none';save();stRender();};
window.stRenderAlloc=function(){
  const H=STORY.hero,st=heroStats(H),box=document.getElementById('st-alloc-body');if(!box)return;
  const row=(k,l,c)=>{
    const capped=st[k]>=STAT_CAP;
    return `<div class="st-al-row">
      <span class="st-al-l">${l}</span>
      <div class="st-sb big"><i style="width:${st[k]}%;background:${c}"></i></div>
      <b class="st-al-v">${st[k]}</b>
      <button class="st-al-plus" ${(!H.points||capped)?'disabled':''} onclick="stSpend('${k}')">＋</button>
    </div>`;};
  box.innerHTML=`
    <div class="st-al-pts">POINTS LEFT <b>${H.points||0}</b></div>
    ${row('spd','SPD','linear-gradient(90deg,#3c8aff,#7adcff)')}
    ${row('pwr','PWR','linear-gradient(90deg,#f0552c,#ffb13c)')}
    ${row('tec','TEC','linear-gradient(90deg,#9a4cff,#d9a6ff)')}
    ${row('def','DEF','linear-gradient(90deg,#2fae6c,#8ce8a8)')}
    <div class="st-al-note">Training is permanent — spent points cannot be refunded.</div>`;
};
window.stSpend=function(k){
  const H=STORY.hero;if(!H.points)return;
  if(heroStats(H)[k]>=STAT_CAP)return;
  H.alloc[k]=(H.alloc[k]||0)+1;H.points--;save();stRenderAlloc();
};
function captainOf(teamKey){
  const S=STORY;
  if(S&&teamKey===S.hero.rivalClub)return{name:S.hero.rival,rival:true};
  if(S&&S.phase==='hs'&&teamKey===S.rivalSchool)return{name:S.hero.rival,rival:true};
  const t=T[teamKey];if(!t||!t.p)return{name:'The Captain',rival:false};
  const best=[...t.p].filter(p=>p.pos!=='GK'&&!p._hero&&!p._rival).sort((a,b)=>((b.spd+b.pwr+b.tec)-(a.spd+a.pwr+a.tec)))[0];
  return{name:best?best.name:'The Captain',rival:false};
}
function pick(arr,seed){return arr[seed%arr.length];}
function preMatchLines(opp,cap){
  const H=STORY.hero,me=H.name,on=tName(opp);
  const seed=hash(opp+'_'+(STORY.league?STORY.league.md:STORY.phase)+'_'+H.level);
  if(cap.rival){
    return pick([
      [cap.name+': "Of course it\'s you. The script writes itself."',me+': "Then you already know the ending."',cap.name+': "I\'m one level above you, '+me.split('.').pop()+'. I always will be."',me+': "Levels are numbers. Watch what I do with mine."'],
      [cap.name+': "I watched your last match. Sloppy first half."',me+': "And I watched yours. You disappear when it matters."',cap.name+': "Then stay until the final whistle. I\'ll show you who disappears."'],
      [cap.name+': "Genova wasn\'t big enough for both of us. Neither is this league."',me+': "Agreed. Pack your bags."',cap.name+': "Heh. See you out there, rival."']
    ],seed);
  }
  return pick([
    ['CAPTAIN '+cap.name+' ('+on+'): "So you\'re the kid everyone talks about."',me+': "Talk is cheap. Ninety minutes isn\'t."',cap.name+': "Good answer. Let\'s see if your feet agree."'],
    [cap.name+' ('+on+'): "We studied your runs all week. There\'s nothing you can surprise us with."',me+': "You studied last week\'s me. I\'m better today."'],
    [cap.name+' ('+on+'): "This is our house. Keep your head down and it won\'t hurt."',me+': "I came to take three points, not advice."',cap.name+': "Then you\'ll leave with neither."'],
    [cap.name+' ('+on+'): "One star doesn\'t beat eleven men."',me+': "Right. That\'s why I brought ten friends."'],
    [cap.name+' ('+on+'): "Heard you train until the lights go out."',me+': "The lights go out. I don\'t."',cap.name+': "...I almost like you, kid. Almost."'],
    [cap.name+' ('+on+'): "Nervous?"',me+': "Excited. There\'s a difference. You\'ll feel it soon."']
  ],seed);
}

/* ── RIVAL PHONE: calls & messages ─────────────────────────── */
function showPhone(kind,lines,after){ // lines: [{who:'me'|'rv',t}]
  const ov=document.getElementById('st-phone');if(!ov){if(after)after();return;}
  const H=STORY.hero;
  ov.style.display='flex';ov.className='st-phone '+kind;
  ov.querySelector('.st-ph-name').textContent=H.rival;
  ov.querySelector('.st-ph-sub').textContent=kind==='call'?'INCOMING CALL · RIVAL':'NEW MESSAGES · RIVAL';
  const ava=ov.querySelector('.st-ph-ava');ava.innerHTML=heroFace(H.rival);
  const feed=ov.querySelector('.st-ph-feed');feed.innerHTML='';
  let i=0;
  const next=()=>{
    if(i>=lines.length){
      ov.querySelector('.st-ph-hint').textContent=kind==='call'?'TAP TO HANG UP':'TAP TO CLOSE';
      ov.onclick=()=>{ov.style.display='none';ov.onclick=null;if(after)after();stRender();};
      return;
    }
    const L=lines[i++];
    const b=document.createElement('div');
    b.className='st-bub '+(L.who==='me'?'me':'rv');
    b.textContent=L.t;feed.appendChild(b);feed.scrollTop=feed.scrollHeight;
  };
  ov.querySelector('.st-ph-hint').textContent='TAP ▸';
  ov.onclick=next;next();
}
function fireBeat(id,kind,lines){
  STORY.beats=STORY.beats||{};
  if(STORY.beats[id])return false;
  STORY.beats[id]=1;save();
  showPhone(kind,lines,null);
  return true;
}
window.maybeStoryBeat=function maybeStoryBeat(){
  const S=STORY,H=S.hero,R=H.rival.split('.').pop(),M=H.name.split('.').pop();
  if(!S||S.pending)return;
  const L=S.league;
  if(S.phase==='sb'&&L&&L.md===4)return fireBeat('sb4','msg',[
    {who:'rv',t:'So the pros let anyone in these days 😏'},
    {who:'me',t:'Checked the table lately?'},
    {who:'rv',t:'I only check one row. Mine. One level above yours, as always.'},
    {who:'me',t:'Enjoy the view. It changes soon.'}]);
  if(S.phase==='sb'&&L&&L.md===12)return fireBeat('sb12','call',[
    {who:'rv',t:R+': "Don\'t hang up. I saw your goal on TV today."'},
    {who:'me',t:M+': "...You called to say that?"'},
    {who:'rv',t:R+': "I called to say keep going. If you stop now, beating you means nothing."'},
    {who:'rv',t:R+': "Serie A, '+M+'. Both of us. Then we settle it."'}]);
  if(S.phase==='sb'&&L&&L.md===L.fix.length-1)return fireBeat('sbEve','msg',[
    {who:'rv',t:'Last matchday. Scared?'},
    {who:'me',t:'Counting points. You?'},
    {who:'rv',t:'Counting the days until I prove I was always better. Don\'t choke.'}]);
  if(S.phase==='sa'&&L&&L.md===5)return fireBeat('sa5','msg',[
    {who:'rv',t:'Serie A defenders hit different, huh 🩹'},
    {who:'me',t:'I like it. They fall harder too.'},
    {who:'rv',t:'Ha! There he is. See you at the derby.'}]);
  if(S.phase==='sa'&&L&&L.md===14)return fireBeat('sa14','call',[
    {who:'rv',t:R+': "The azzurri scouts were in my stand today. Yours too."'},
    {who:'me',t:M+': "Then we both know what these last matchdays are."'},
    {who:'rv',t:R+': "Auditions. Don\'t you dare get called up without me."'}]);
  if(S.phase==='wc'&&S.wc&&S.wc.stage==='sf')return fireBeat('wcsf','msg',[
    {who:'rv',t:'Semifinal of a WORLD CUP. From our dusty pitch in Genova.'},
    {who:'me',t:'You watching?'},
    {who:'rv',t:'Front row. Whole country is. Win it — or I will never let you forget.'}]);
  if(S.phase==='wc'&&S.wc&&S.wc.stage==='f')return fireBeat('wcf','call',[
    {who:'rv',t:R+': "No jokes tonight. You carry Genova out there tomorrow."'},
    {who:'rv',t:R+': "Every kid on every cage pitch. Me included."'},
    {who:'me',t:M+': "...One level above me, remember?"'},
    {who:'rv',t:R+': "Not tomorrow. Tomorrow you\'re above everyone. Now sleep."'}]);
}
/* ── DIALOGUE ─────────────────────────────────────────────── */
let DQ=[];
function talk(title,lines,after){DQ.push({title,lines,after});runDQ();}
function runDQ(){
  const ov=document.getElementById('st-dialog');if(!ov)return;
  if(ov.dataset.busy==='1')return;
  const d=DQ.shift();if(!d){ov.style.display='none';return;}
  ov.dataset.busy='1';ov.style.display='flex';
  let i=0;
  const t=ov.querySelector('.st-dlg-t'),b=ov.querySelector('.st-dlg-b');
  t.textContent=d.title;
  const f=document.getElementById('st-dlg-face');
  if(f&&STORY&&STORY.hero)f.innerHTML=heroFace(STORY.hero.name);
  const show=()=>{b.textContent=d.lines[i];};
  show();
  ov.onclick=()=>{i++;if(i<d.lines.length){show();}else{ov.dataset.busy='0';ov.onclick=null;if(d.after)d.after();runDQ();if(!DQ.length){ov.style.display='none';stRender();}}};
}

/* ── CREATE / OPEN ────────────────────────────────────────── */
window.storyOpen=function(){
  const sv=load();
  if(sv){window.STORY=sv;STORY.pending=null;stRender();showSc('s-story');setTimeout(maybeStoryBeat,500);return;}
  window.STORY=null;stRenderCreate();showSc('s-story');
};
function stRenderCreate(){
  const el=document.getElementById('st-body');if(!el)return;
  el.innerHTML=`
  <div class="st-cine">
    <div class="st-cine-head">
      <span class="st-jp">ラ・ヌオーヴァ・ステッラ</span>
      <h1>LA NUOVA STELLA</h1>
      <span class="st-tag">FROM A SCHOOL PITCH IN GENOVA · TO THE TOP OF THE WORLD</span>
    </div>
    <div class="st-roles2">
      <button class="st-rp fw" data-r="FW" onclick="stPickRole('FW')">
        <span class="st-rp-bg"></span>
        <span class="st-rp-in">
          <span class="st-rp-pos">FW</span>
          <span class="st-rp-name">IL BOMBER</span>
          <span class="st-rp-sub">STRIKER · PACE & POWER</span>
          <span class="st-rp-dest">${badge('genoa',30)} GENOA CFC · SERIE B</span>
        </span>
        <span class="st-rp-check">SELECTED ▮</span>
      </button>
      <button class="st-rp ca" data-r="CA" onclick="stPickRole('CA')">
        <span class="st-rp-bg"></span>
        <span class="st-rp-in">
          <span class="st-rp-pos">CA</span>
          <span class="st-rp-name">IL REGISTA</span>
          <span class="st-rp-sub">PLAYMAKER · TECHNIQUE & VISION</span>
          <span class="st-rp-dest">${badge('sampdoria',30)} SAMPDORIA · SERIE B</span>
        </span>
        <span class="st-rp-check">SELECTED ▮</span>
      </button>
    </div>
    <div class="st-namesbox">
      <div class="st-nb-row"><span class="st-nb-l">YOUR NAME</span><input id="st-n1" maxlength="18" placeholder="L.Moretti"></div>
      <div class="st-nb-row rival"><span class="st-nb-l">RIVAL'S NAME</span><input id="st-n2" maxlength="18" placeholder="D.Falco"></div>
    </div>
    <button class="st-begin" onclick="stBegin()"><span>▶ BEGIN STORY</span></button>
  </div>`;
  window._stRole='FW';stMarkRole();
}
window.stPickRole=function(r){window._stRole=r;stMarkRole();};
function stMarkRole(){document.querySelectorAll('.st-rp').forEach(b=>b.classList.toggle('on',b.dataset.r===window._stRole));}
window.stBegin=function(){
  const n1=(document.getElementById('st-n1').value||'').trim()||'L.Moretti';
  const n2=(document.getElementById('st-n2').value||'').trim()||'D.Falco';
  const role=window._stRole||'FW';
  const club=role==='FW'?'genoa':'sampdoria',rivalClub=role==='FW'?'sampdoria':'genoa';
  // schools cup bracket: hero school seed 0, rival school seed 7 (can only meet in the final)
  const mid=shuffle(SCHOOLS.slice(1,7));
  const order=['hs_garibaldi',...mid.slice(0,5),mid[5],'hs_sangiorgio'];
  const qf=[];for(let i=0;i<8;i+=2)qf.push({home:order[i],away:order[i+1],played:false});
  window.STORY={hero:{name:n1,rival:n2,role,club,rivalClub,level:1,xp:0,points:0,alloc:{spd:0,pwr:0,tec:0,def:0},goalsSeason:0},
    phase:'hs',hsSchool:'hs_garibaldi',rivalSchool:'hs_sangiorgio',
    hs:{stage:'qf',ko:{qf,sf:null,f:null},alive:true,rivalAlive:true},
    league:null,wc:null,pending:null,seasonB:1,seasonA:0};
  save();
  talk('SPRING · GENOVA',[
    'Last year of high school. One tournament left before real life begins.',
    n1+' ('+role+') of Liceo Garibaldi has one dream: Serie A, the Azzurri, the World Cup.',
    'Across the city, '+n2+' of Istituto San Giorgio chases the same dream — one step ahead, always.',
    'The National Schools Cup starts now. Show them who you are.']);
  stRender();
};

/* ── PROGRESSION ──────────────────────────────────────────── */
function xpNeed(l){return 70+l*22;}
function grantXP(amount){
  const H=STORY.hero;H.xp+=amount;let ups=0;
  while(H.xp>=xpNeed(H.level)){H.xp-=xpNeed(H.level);H.level++;H.points=(H.points||0)+PTS_PER_LVL;ups++;}
  return ups;
}
function myFixture(){
  const S=STORY;if(!S)return null;
  if(S.phase==='hs'){
    const rd=S.hs.ko[S.hs.stage];if(!rd)return null;
    return rd.find(m=>!m.played&&(m.home===S.hsSchool||m.away===S.hsSchool))||null;
  }
  if(S.phase==='sb'||S.phase==='sa'){
    const L=S.league;if(!L||L.md>=L.fix.length)return null;
    return L.fix[L.md].find(m=>m.home===S.hero.club||m.away===S.hero.club)||null;
  }
  if(S.phase==='wc'){
    const rd=S.wc.ko[S.wc.stage];if(!rd)return null;
    return rd.find(m=>!m.played&&(m.home==='italy'||m.away==='italy'))||null;
  }
  return null;
}
function koWinner(m){if(m.hg>m.ag)return m.home;if(m.ag>m.hg)return m.away;return m.pens[0]>m.pens[1]?m.home:m.away;}
function advanceKO(ko,stages){
  // sim unplayed of current stage, build next
  const S=STORY,cur=S.phase==='hs'?S.hs:S.wc,st=cur.stage,rd=ko[st];
  rd.forEach(m=>{if(m.played)return;const r=simMatch(m.home,m.away);m.hg=r.hg;m.ag=r.ag;m.played=true;if(m.hg===m.ag)m.pens=pens();});
  const winners=rd.map(koWinner);
  const ni=stages.indexOf(st)+1;
  if(ni>=stages.length){cur.champion=winners[0];cur.stage='done';return;}
  const next=stages[ni];ko[next]=[];
  for(let i=0;i<winners.length;i+=2)ko[next].push({home:winners[i],away:winners[i+1],played:false});
  cur.stage=next;
}
function startLeague(div){
  const teams=div==='B'?[...SERIE_B]:(()=>{ // A: 18 best A clubs + hero & rival club (story-promotion brings both up)
    const base=SERIE_A.filter(k=>k!==STORY.hero.club&&k!==STORY.hero.rivalClub);
    base.sort((a,b)=>teamOvr(b)-teamOvr(a));
    return [...base.slice(0,18),STORY.hero.club,STORY.hero.rivalClub];
  })();
  shuffle(teams);
  STORY.league={div,teams,tab:newTab(teams),fix:singleRR(teams),md:0};
}
function startWC(){
  const nats=Object.keys(T).filter(k=>!T[k]._career&&!T[k]._story&&k!=='italy');
  nats.sort((a,b)=>teamOvr(b)-teamOvr(a));
  const field=shuffle(nats.slice(0,15));
  const seeds=['italy',...field];
  const r16=[];for(let i=0;i<8;i++)r16.push({home:seeds[i],away:seeds[15-i],played:false});
  STORY.wc={stage:'r16',ko:{r16}};
}
function endOfRound(){
  const S=STORY,H=S.hero;
  if(S.phase==='hs'){
    if(S.hs.stage!=='done')return;
    const won=S.hs.champion===S.hsSchool;
    talk('THE SCOUT',[
      won?'CHAMPIONS! Liceo Garibaldi lift the National Schools Cup!':'The cup run is over — but the performances did not go unnoticed.',
      'A man in a grey coat approaches after the final whistle.',
      '"'+H.name+'. I work for '+tName(H.club)+'. Serie B. We want you."',
      'Meanwhile '+H.rival+' signs for '+tName(H.rivalClub)+'. The rivalry moves to the pros.',
      'CHAPTER 2 — SERIE B. Goal: promotion to Serie A.'],()=>{
        S.phase='sb';startLeague('B');injectHero(H.club,'hero');injectHero(H.rivalClub,'rival');save();stRender();
      });
    return;
  }
  if(S.phase==='sb'||S.phase==='sa'){
    const L=S.league;if(L.md<L.fix.length)return;
    const order=sortKeys(L.teams,L.tab),pos=order.indexOf(H.club)+1;
    if(S.phase==='sb'){
      if(pos<=2){
        talk('PROMOZIONE!',[tName(H.club)+' finish #'+pos+' — SERIE A, here we come!','Somehow, '+H.rival+' drags '+tName(H.rivalClub)+' up as well. Of course he does.','CHAPTER 3 — SERIE A. Goal: top 4 and the eyes of the national coach.'],()=>{S.phase='sa';S.seasonA++;startLeague('A');save();stRender();});
      }else{
        talk('SEASON OVER',['#'+pos+' is not enough. Promotion slipped away.','"Again," you tell the mirror. "One more season."'],()=>{S.seasonB++;startLeague('B');save();stRender();});
      }
    }else{
      if(pos<=4){
        talk('LA CHIAMATA',['#'+pos+' in Serie A. The phone rings — it is the AZZURRI head coach.','"'+H.name+', pack your bags. The World Cup squad has your name on it."','FINAL CHAPTER — THE WORLD CUP. 16 nations. One trophy.'],()=>{S.phase='wc';startWC();save();stRender();});
      }else{
        talk('SEASON OVER',['#'+pos+'. Good — not good enough for the national team.','Another season. Louder this time.'],()=>{S.seasonA++;startLeague('A');save();stRender();});
      }
    }
    return;
  }
  if(S.phase==='wc'&&S.wc.stage==='done'){
    if(S.wc.champion==='italy'){
      talk('CAMPIONI DEL MONDO',['ITALY ARE WORLD CHAMPIONS!','From a school pitch in Genova to the top of the world.','Even '+H.rival+' is smiling. "Next time," he says, "I lift it first."','THE END — LV '+H.level+' · thank you for playing LA NUOVA STELLA.'],()=>{S.phase='done';save();stRender();});
    }else{
      talk('SO CLOSE',['The dream dies at the hands of '+tName(S.wc.champion)+'.','The coach grips your shoulder: "We go again in four years. Stay ready."'],()=>{S.phase='done';S.wcLost=true;save();stRender();});
    }
  }
}

/* ── PLAY / SIM ───────────────────────────────────────────── */
function buildForMatch(k){
  if(STORY.phase==='hs'){stBuildTeam(k);if(k===STORY.hsSchool)injectHeroSchool('hero');if(k===STORY.rivalSchool)injectHeroSchool('rival');return;}
  if(k==='italy'){injectItaly();return;}
  stBuildTeam(k);
  if(k===STORY.hero.club)injectHero(k,'hero');
  if(k===STORY.hero.rivalClub)injectHero(k,'rival');
}
function injectHeroSchool(who){
  const k=who==='hero'?STORY.hsSchool:STORY.rivalSchool;
  injectHero(k,who);
}
function injectItaly(){
  const t=T.italy;if(!t)return;
  if(!t._origP)t._origP=t.p.map(p=>({...p}));
  t.p=t._origP.map(p=>({...p}));
  const S=STORY.hero,slotPos=HERO_SLOT[S.role],st=heroStats(S);
  const idx=t.p.findIndex(p=>p.pos===slotPos);
  const old=t.p[idx>=0?idx:9];
  t.p[idx>=0?idx:9]={...old,id:99901,name:S.name,origName:S.name,spd:st.spd,pwr:st.pwr,tec:st.tec,def:st.def,rar:2,_hero:true};
}
window.stPlayNext=function(){
  const m=myFixture();if(!m)return;
  const S=STORY;
  const mine=S.phase==='hs'?S.hsSchool:S.phase==='wc'?'italy':S.hero.club;
  const opp=m.home===mine?m.away:m.home;
  buildForMatch(mine);buildForMatch(opp);
  const cap=captainOf(opp);
  talk('TUNNEL · PRE-MATCH',preMatchLines(opp,cap),()=>stLaunch(m,mine,opp));
};
function stLaunch(m,mine,opp){
  selHome=mine;selAway=opp;HT=T[mine];AT=T[opp];
  STORY.pending={home:m.home,away:m.away,isHome:m.home===mine};save();
  G_teamEditorOrigin='story';
  openTeamMenu();
}
window.stSimNext=function(){
  const m=myFixture();
  if(m){const r=simMatch(m.home,m.away);applyMyResult(m,r.hg,r.ag,false);}
  else advanceAll();
  save();stRender();
  setTimeout(maybeStoryBeat,250);
};
function applyMyResult(m,hg,ag,played){
  const S=STORY,mine=S.phase==='hs'?S.hsSchool:S.phase==='wc'?'italy':S.hero.club;
  m.hg=hg;m.ag=ag;m.played=true;
  const isKO=S.phase==='hs'||S.phase==='wc';
  if(isKO&&hg===ag)m.pens=pens();
  const myG=m.home===mine?hg:ag,opG=m.home===mine?ag:hg;
  const res=myG>opG?'W':myG<opG?'L':'D';
  const koWin=isKO&&m.pens?(koWinner(m)===mine):null;
  // XP only when the user actually PLAYED the match
  let xp=(res==='W'||koWin===true)?90:res==='D'?50:25;
  xp+=myG*12;
  if(S.phase==='wc')xp+=40;
  if(!played)xp=Math.round(xp*0.5); // simulated matches still develop the hero, at half rate
  const ups=grantXP(xp);
  S._lastXP={xp,ups,sim:!played};
  S._last={home:m.home,away:m.away,hg,ag,pens:m.pens||null};
  advanceAll();
}
function advanceAll(){
  const S=STORY;
  if(S.phase==='hs'){if(S.hs.stage!=='done')advanceKO(S.hs.ko,['qf','sf','f']);S.hs.alive=isAlive(S.hsSchool,S.hs);S.hs.rivalAlive=isAlive(S.rivalSchool,S.hs);endOfRound();return;}
  if(S.phase==='sb'||S.phase==='sa'){
    const L=S.league,rd=L.fix[L.md];
    rd.forEach(mm=>{if(!mm.played){const r=simMatch(mm.home,mm.away);mm.hg=r.hg;mm.ag=r.ag;mm.played=true;}applyTab(L.tab,mm.home,mm.away,mm.hg,mm.ag);});
    L.md++;endOfRound();return;
  }
  if(S.phase==='wc'){if(S.wc.stage!=='done')advanceKO(S.wc.ko,['r16','qf','sf','f']);endOfRound();return;}
}
function isAlive(k,hsOrWc){
  if(hsOrWc.stage==='done')return hsOrWc.champion===k;
  const rd=hsOrWc.ko[hsOrWc.stage];return !!rd&&rd.some(m=>m.home===k||m.away===k);
}
window.storyOnFullTime=function(engHg,engAg){
  const p=STORY.pending;if(!p)return;
  const hg=p.isHome?engHg:engAg,ag=p.isHome?engAg:engHg;
  const m=myFixture();STORY.pending=null;
  if(m)applyMyResult(m,hg,ag,true);
  save();stRender();showSc('s-story');
  setTimeout(maybeStoryBeat,400);
};
window.stQuit=function(){if(!confirm('Delete story progress and start over?'))return;wipe();stRenderCreate();};

/* ── RENDER ───────────────────────────────────────────────── */
const PHASE_T={hs:'CH.1 · NATIONAL SCHOOLS CUP',sb:'CH.2 · SERIE B',sa:'CH.3 · SERIE A',wc:'CH.4 · WORLD CUP',done:'EPILOGUE'};
const KO_L={qf:'QUARTER-FINALS',sf:'SEMI-FINALS',f:'FINAL',r16:'ROUND OF 16'};
function heroCard(){
  const H=STORY.hero,st=heroStats(H),need=xpNeed(H.level);
  const bar=Math.min(100,Math.round(100*H.xp/need));
  const teamK=STORY.phase==='hs'?STORY.hsSchool:STORY.phase==='wc'?'italy':H.club;
  const stat=(l,v,c)=>`<div class="st-stat"><span>${l}</span><div class="st-sb"><i style="width:${v}%;background:${c}"></i></div><b>${v}</b></div>`;
  return `<div class="st-hero2">
    <div class="st-h-port">${heroFace(H.name)}<span class="st-lvhex">LV<b>${H.level}</b></span></div>
    <div class="st-h-main">
      <div class="st-h-row1">
        <div class="st-h-name">${H.name}</div>
        <div class="st-h-role ${H.role==='FW'?'fw':'ca'}">${H.role==='FW'?'IL BOMBER · FW':'IL REGISTA · CA'}</div>
      </div>
      <div class="st-h-club">${badge(teamK,22)} ${tName(teamK)}</div>
      <div class="st-xp"><i style="width:${bar}%"></i><span>${H.xp} / ${need} XP</span></div>
      ${(H.points||0)>0?`<button class="st-allocbtn" onclick="stOpenAlloc()">✦ ${H.points} STAT POINT${H.points>1?'S':''} — TRAIN NOW</button>`:''}
      <div class="st-stats2">
        ${stat('SPD',st.spd,'linear-gradient(90deg,#3c8aff,#7adcff)')}
        ${stat('PWR',st.pwr,'linear-gradient(90deg,#f0552c,#ffb13c)')}
        ${stat('TEC',st.tec,'linear-gradient(90deg,#9a4cff,#d9a6ff)')}
        ${stat('DEF',st.def,'linear-gradient(90deg,#2fae6c,#8ce8a8)')}
      </div>
    </div>
    <div class="st-h-rival">
      <span class="st-rv-tag">RIVAL</span>
      ${heroFace(H.rival,'sm')}
      <div class="st-rv-info"><b>${H.rival}</b><span>LV ${H.level+1} · ${tName(STORY.phase==='hs'?STORY.rivalSchool:H.rivalClub)}</span></div>
    </div>
  </div>`;
}
function rowHtml(k,r,hl){return `<tr class="${hl?'me':''}"><td class="tt">${badge(k,18)}<span>${tName(k)}</span></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pt">${pts(r)}</td></tr>`;}
function tableHtml(title,keys,tab,my){return `<div class="cup-tblw"><div class="cup-tbl-t">${title}</div><table class="cup-tbl"><thead><tr><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${sortKeys(keys,tab).map(k=>rowHtml(k,tab[k],k===my)).join('')}</tbody></table></div>`;}
function matchLine(m){const sc=m.played?`${m.hg}–${m.ag}${m.pens?` <i>(${m.pens[0]}–${m.pens[1]} p)</i>`:''}`:'vs';
  return `<div class="cup-mline${m.played?'':' up'}"><span class="l">${badge(m.home,16)} ${tName(m.home)}</span><b>${sc}</b><span class="r">${tName(m.away)} ${badge(m.away,16)}</span></div>`;}
window.stRender=function(){
  const S=STORY,el=document.getElementById('st-body');if(!el)return;
  if(!S){stRenderCreate();return;}
  if((S.phase==='sb'||S.phase==='sa')&&!S.league){startLeague(S.phase==='sb'?'B':'A');save();} // self-heal corrupted saves
  let html=`<div class="st-ribbon"><div class="st-rb-num">${({hs:'CH.01',sb:'CH.02',sa:'CH.03',wc:'CH.04',done:'FIN'})[S.phase]||''}</div><div class="st-rb-main"><div class="st-rb-t">${(PHASE_T[S.phase]||'').replace(/^CH\.\d+ · /,'')}</div><div class="st-rb-s">${
    S.phase==='hs'?(S.hs.stage==='done'?'FINISHED':KO_L[S.hs.stage]):
    S.phase==='sb'||S.phase==='sa'?('MATCHDAY '+(S.league.md+1)+' / '+S.league.fix.length+(S.phase==='sb'?' · SEASON '+S.seasonB:' · SEASON '+S.seasonA)):
    S.phase==='wc'?(S.wc.stage==='done'?'FINISHED':KO_L[S.wc.stage]):'STORY COMPLETE'}</div></div></div>`;
  let right='';
  if(S._last){const L=S._last;right+=`<div class="cup-last">FT &nbsp;${badge(L.home,18)} ${tName(L.home)} <b>${L.hg}–${L.ag}</b> ${tName(L.away)} ${badge(L.away,18)}${L.pens?` <i>(${L.pens[0]}–${L.pens[1]} pens)</i>`:''}${S._lastXP?` &nbsp;·&nbsp; <b class="st-xpg">+${S._lastXP.xp} XP${S._lastXP.sim?' (SIM)':''}${S._lastXP.ups?' · LEVEL UP! ×'+S._lastXP.ups:''}</b>`:''}</div>`;}
  if(S.phase==='done'){
    right+=`<div class="cup-champ">${S.wcLost?'🥈':'🏆'}<div><b>${S.hero.name}</b><span>${S.wcLost?'WORLD CUP RUNNER-UP STORY':'WORLD CHAMPION · STORY COMPLETE'}</span></div></div>
    <div class="cup-btns cup-foot"><button class="cz-b cz-save" onclick="stReplayWC()">🔁 REPLAY WORLD CUP</button><button class="cz-b cz-danger" onclick="stQuit()">NEW STORY</button></div>`;
    el.innerHTML=html+`<div class="st-grid"><aside class="st-col-l">${heroCard()}</aside><div class="st-col-r">${right}</div></div>`;return;
  }
  const m=myFixture();
  if(m){
    const mineK=S.phase==='hs'?S.hsSchool:S.phase==='wc'?'italy':S.hero.club;
    right+=`<div class="st-vs">
      <div class="st-vs-lbl">NEXT MATCH ${m.home===mineK?'· HOME':'· AWAY'}</div>
      <div class="st-vs-row">
        <div class="st-vs-team h">${badge(m.home,52)}<span>${tName(m.home)}</span></div>
        <div class="st-vs-mid">VS</div>
        <div class="st-vs-team a">${badge(m.away,52)}<span>${tName(m.away)}</span></div>
      </div>
      <div class="st-vs-btns"><button class="st-play" onclick="stPlayNext()">▶ PLAY MATCH</button><button class="st-sim" onclick="stSimNext()">⏩ SIM · ½ XP</button></div>
    </div>`;
  }else{
    right+=`<div class="st-vs"><div class="st-vs-lbl">NO FIXTURE THIS ROUND — SIM TO CONTINUE</div>
      <div class="st-vs-btns"><button class="st-play" onclick="stSimNext()">⏩ SIM ROUND</button></div></div>`;
  }
  if(S.phase==='hs'){['qf','sf','f'].forEach(st=>{if(!S.hs.ko[st])return;right+=`<div class="cup-tblw"><div class="cup-tbl-t">${KO_L[st]}</div>${S.hs.ko[st].map(matchLine).join('')}</div>`;});}
  else if(S.phase==='sb'||S.phase==='sa'){right+=tableHtml('SERIE '+S.league.div+' TABLE',S.league.teams,S.league.tab,S.hero.club);}
  else if(S.phase==='wc'){['r16','qf','sf','f'].forEach(st=>{if(!S.wc.ko[st])return;right+=`<div class="cup-tblw"><div class="cup-tbl-t">${KO_L[st]}</div>${S.wc.ko[st].map(matchLine).join('')}</div>`;});}
  right+=`<div class="cup-btns cup-foot"><button class="cz-b cz-danger" onclick="stQuit()">DELETE STORY</button></div>`;
  el.innerHTML=html+`<div class="st-grid"><aside class="st-col-l">${heroCard()}</aside><div class="st-col-r">${right}</div></div>`;
};
window.stReplayWC=function(){STORY.wcLost=false;STORY.phase='wc';startWC();save();stRender();};

/* ── PARALLAX (scroll + pointer tilt) ──────────────────────── */
(function(){
  let raf=0,sy=0,mx=0,my=0;
  function apply(){
    raf=0;
    const sc=document.getElementById('s-story');if(!sc)return;
    const L=sc.querySelectorAll('.st-par i');
    const f=[0.06,0.12,0.20,0.32,0.10];
    L.forEach((el,i)=>{el.style.transform=`translate3d(${mx*(8+i*7)}px,${(-sy*f[i])+my*(6+i*5)}px,0)`;});
    sc.style.setProperty('--mx',(50+mx*6)+'%');
    sc.style.setProperty('--my',(40+my*6)+'%');
  }
  function queue(){if(!raf)raf=requestAnimationFrame(apply);}
  document.addEventListener('scroll',e=>{
    if(e.target&&e.target.id==='st-body'){sy=e.target.scrollTop;queue();}
  },true);
  window.addEventListener('pointermove',e=>{
    const sc=document.getElementById('s-story');
    if(!sc||!sc.classList.contains('active'))return;
    mx=(e.clientX/innerWidth-0.5)*2;my=(e.clientY/innerHeight-0.5)*2;queue();
  },{passive:true});
})();
console.log('[STORY] La Nuova Stella active');
})();
