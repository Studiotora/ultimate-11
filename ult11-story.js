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

/* ════ SCHOOL ROSTERS & CAST · ★ EDIT PLAYER NAMES HERE ════
   Portraits follow the usual player convention; VN cast portraits:
   assets/story/cast/coach-garibaldi.png · coach-sgiorgio.png
   assets/story/cast/captain-{garibaldi|sgiorgio|vesuvio|meneghino|dante|capitolino|sabaudo|adriatica}.png
   assets/story/cast/gk-garibaldi.png · gk-sgiorgio.png
   NOTE: Garibaldi's CM3 and San Giorgio's ST never appear — they are
   the slots replaced by the hero/rival depending on the chosen role. */
const ST_ROSTERS={
 hs_garibaldi:[ // Liceo Garibaldi (CA hero / FW rival)
  {pos:'GK', n:'A.Tognoli',j:1},
  {pos:'RB', n:'P.Sala',   j:2},
  {pos:'CB1',n:'M.Greco',  j:5,cap:true},
  {pos:'CB2',n:'S.Monti',  j:4},
  {pos:'LB', n:'F.Riva',   j:3},
  {pos:'CM1',n:'G.Donati', j:6},
  {pos:'CM2',n:'L.Villa',  j:8},
  {pos:'CM3',n:'E.Bellini',j:10}, // ← replaced by CA hero / CA rival
  {pos:'LW', n:'D.Neri',   j:11},
  {pos:'ST', n:'R.Carbone',j:9},
  {pos:'RW', n:'T.Fiore',  j:7}],
 hs_sangiorgio:[ // Ist. San Giorgio (FW hero / CA rival)
  {pos:'GK', n:'C.Piras',  j:1},
  {pos:'RB', n:'V.Testa',  j:2},
  {pos:'CB1',n:'N.Mauro',  j:5,cap:true},
  {pos:'CB2',n:'I.Basile', j:4},
  {pos:'LB', n:'O.Longo',  j:3},
  {pos:'CM1',n:'B.Gatti',  j:6},
  {pos:'CM2',n:'U.Coppola',j:8},
  {pos:'CM3',n:'A.Amato',  j:10},
  {pos:'LW', n:'S.Leone',  j:11},
  {pos:'ST', n:'M.Ferrara',j:9}, // ← replaced by FW hero / FW rival
  {pos:'RW', n:'G.Marini', j:7}]
};
function shortHs(k){return k.replace('hs_','').replace('sangiorgio','sgiorgio');}
const SCHOOL_CAPTAINS={hs_garibaldi:'GRECO',hs_sangiorgio:'MAURO',
 hs_vesuvio:'CAPITAN ESPOSITO',hs_meneghino:'CAPITAN COLOMBO',hs_dante:'CAPITAN BARBIERI',
 hs_capitolino:'CAPITAN RICCI',hs_sabaudo:'CAPITAN CONTI',hs_adriatica:'CAPITAN MARINO'};
function stExtendCast(){ // runs after story-script.js (load order)
  if(!window.STORY_CAST||!window.STORY_ALIAS)return;
  Object.assign(STORY_CAST,{
    'coach-garibaldi':{name:'MISTER FABBRI'},
    'captain-garibaldi':{name:'GRECO'},
    'gk-garibaldi':{name:'TOGNOLI'},
    'gk-sgiorgio':{name:'PIRAS'},
    'captain-vesuvio':{name:SCHOOL_CAPTAINS.hs_vesuvio},
    'captain-meneghino':{name:SCHOOL_CAPTAINS.hs_meneghino},
    'captain-dante':{name:SCHOOL_CAPTAINS.hs_dante},
    'captain-capitolino':{name:SCHOOL_CAPTAINS.hs_capitolino},
    'captain-sabaudo':{name:SCHOOL_CAPTAINS.hs_sabaudo},
    'captain-adriatica':{name:SCHOOL_CAPTAINS.hs_adriatica}});
  // 'school' ids follow the hero's school; literal sgiorgio ids follow the RIVAL school
  Object.assign(STORY_ALIAS.CA,{'coach-school':'coach-garibaldi','captain-school':'captain-garibaldi','gk-school':'gk-garibaldi'});
  Object.assign(STORY_ALIAS.FW,{'coach-school':'coach-sgiorgio','captain-school':'captain-sgiorgio','gk-school':'gk-sgiorgio',
    'coach-sgiorgio':'coach-garibaldi','captain-sgiorgio':'captain-garibaldi'});
}
stExtendCast();

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
  const fixed=ST_ROSTERS[key]||null;
  const used=new Set(),pick=()=>{let n;do{n=SURNAMES[Math.floor(r()*SURNAMES.length)];}while(used.has(n));used.add(n);return n;};
  const players=[],reserves=[];
  LINEUP.forEach((row,i)=>{
    const fx=(fixed&&!row.r)?fixed.find(f=>f.pos===row.pos&&!f._used):null;
    if(fx)fx._used=true;
    const ln=fx?null:pick(),fi=fx?null:String.fromCharCode(65+Math.floor(r()*26));
    const nm=fx?fx.n:fi+'.'+ln;
    const sb=fx&&fx.ovr?fx.ovr:base+Math.floor(r()*range),isGK=row.pos==='GK';
    const pl={id:hash(key)%80000+1000+i,name:nm,origName:nm,pos:row.pos,
      spd:Math.max(40,sb-Math.floor(r()*8)),pwr:Math.max(40,sb-Math.floor(r()*8)),
      tec:Math.max(40,sb-Math.floor(r()*8)),
      def:isGK?sb:(['LW','ST','RW'].includes(row.pos)?Math.max(35,sb-12-Math.floor(r()*8)):sb-Math.floor(r()*8)),
      rar:sb>=80?2:1,jersey:(fx&&fx.j)||row.j,clubKey:key};
    if(isGK){pl.sav=Math.min(95,sb+4+Math.floor(r()*6));pl.ref=Math.min(95,sb+Math.floor(r()*5));}
    players.push(pl);if(row.r)reserves.push(pl.id);
  });
  if(fixed)fixed.forEach(f=>delete f._used);
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
  const phase=STORY.phase==='fr3'?'sb':STORY.phase==='fr4'?'wc':STORY.phase; // friendlies map to club/ita art
  const nm=who==='rival'?H.rival:H.name;
  const ln=String(nm||'').split('.').pop().toLowerCase().trim().replace(/[^a-z0-9]/g,'');
  const rl=role.toLowerCase(),cx=charCtx(role,phase);
  const chain=[`assets/story/hero-${rl}-${cx}.png`,`assets/players/hero-${rl}-${cx}.png`,`assets/story/hero-${rl}-school.png`,`assets/players/${ln}.png`,gen].join('|');
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



/* ════ DEV FLAG · ★ REMOVE FOR RELEASE ════ */
window.UE_DEV=true; // shows the "DEV SKIP · WIN" button in the story hub

/* ── VN DIALOGUE ENGINE (story-script.js scenes) ───────────── */
let VNJOBS=[],VNsc=null,VNi=0,VNtyping=null;
function vnTok(t){
  const H=STORY.hero;
  const map={'{HERO}':(H.name||'').split('.').pop().toUpperCase(),
    '{RIVAL}':(H.rival||'').split('.').pop().toUpperCase(),
    '{CLUB}':tName(H.club).toUpperCase(),'{RIVALCLUB}':tName(H.rivalClub).toUpperCase()};
  const al=(window.STORY_ALIAS&&STORY_ALIAS[H.role])||{};
  const nm=k=>{const id=al[k];return (id&&STORY_CAST[id])?STORY_CAST[id].name:'';};
  map['{COACH}']=nm('coach-club');map['{CAPT}']=nm('captain-club');map['{GK}']=nm('gk-club');map['{OPPCAPT}']=nm('captain-opp');
  map['{SCHOOL}']=tName(STORY.hsSchool).toUpperCase();map['{RIVALSCHOOL}']=tName(STORY.rivalSchool).toUpperCase();
  const nm2=k=>{const id=al[k]||k;return STORY_CAST[id]?STORY_CAST[id].name:'';};
  map['{SCHOOLCAPT}']=nm2('captain-school');map['{SCHOOLGK}']=nm2('gk-school');map['{RIVALSCHOOLCAPT}']=nm2('captain-sgiorgio');
  Object.entries(map).forEach(([k,v])=>{t=t.split(k).join(v);});
  return t;
}
function vnResolve(who){
  if(who==='hero')return{id:'hero',name:vnTok('{HERO}')};
  if(who==='rival')return{id:'rival',name:vnTok('{RIVAL}')};
  const al=(window.STORY_ALIAS&&STORY_ALIAS[STORY.hero.role])||{};
  const id=al[who]||who;
  const c=window.STORY_CAST&&STORY_CAST[id];
  return{id,name:c?vnTok(c.name):who.toUpperCase()};
}
function vnPlay(keys,after){
  if(!window.STORY_SCRIPT){if(after)after();stRender();return;}
  VNJOBS.push({keys:Array.isArray(keys)?[...keys]:[keys],after});
  if(!VNsc)vnNextScene();
}
const VN_BG={ch1_intro:'genova',ch1_pre_qf:'stadium',ch1_post_qf_win:'stadium',ch1_pre_sf:'stadium',ch1_final_locker:'locker',ch1_pre_final:'stadium',ch1_post_final_win:'stadium',ch1_post_final_loss:'stadium',ch1_scout:'genova',ch2_arrival:'genova',ch2_training:'training',ch2_pre_md1:'locker',ch2_derby_pre:'stadium',ch2_derby_post:'stadium',ch2_phone_mid:'genova',ch2_promotion:'stadium',ch3_arrival:'stadium',ch3_friendly_pre:'locker',ch3_press:'press',ch3_callup:'genova',ch4_ritiro:'ritiro',ch4_friendly_pre:'locker',ch4_semi_pre:'stadium',ch4_final_pre:'locker',ch4_final_win:'stadium',ch4_final_loss:'stadium',generic_pre:'locker',generic_pre_ita:'locker',generic_post_win:'stadium',generic_post_loss:'stadium'};
function vnNextScene(){
  const ov=document.getElementById('st-vn');
  const job=VNJOBS[0];
  if(!job){VNsc=null;if(ov)ov.style.display='none';stRender();return;}
  const k=job.keys.shift();
  if(k===undefined){VNJOBS.shift();const f=job.after;if(f)f();vnNextScene();return;}
  let sc=STORY_SCRIPT[k];
  if(Array.isArray(sc))sc={title:'PRE-PARTITA',lines:sc[Math.floor(Math.random()*sc.length)]};
  if(!sc||!ov){vnNextScene();return;}
  VNsc=sc;VNi=0;ov.style.display='block';
  const bgEl=ov.querySelector('.st-vn-bg');
  if(bgEl){const b=VN_BG[k]||(k&&k.indexOf('pre')>=0?'stadium':null);
    bgEl.style.backgroundImage=b?`url('assets/story/vn/${b}.png'),url('assets/story/dialog-bg.png'),radial-gradient(95% 80% at 50% 35%,#1b1226 0%,#0c0814 55%,#05040a 100%)`:'';}
  ov.querySelector('.st-vn-title').textContent=vnTok(sc.title);
  ov.querySelector('#st-vn-prog').innerHTML=sc.lines.map(()=>'<i></i>').join('');
  vnShowLine();
}
function vnShowLine(){
  const ov=document.getElementById('st-vn'),L=VNsc.lines[VNi],me=L.who==='hero';
  const who=vnResolve(L.who);
  ov.querySelector('#st-vn-hero').className='st-vn-port l '+(me?'lit':'dim');
  const other=ov.querySelector('#st-vn-other');
  other.className='st-vn-port r '+(me?'dim':'lit');
  // hero portrait via the fixed art slots; rival likewise; others from cast folder
  ov.querySelector('#st-vn-hero').innerHTML=charFace('hero');
  if(!me){
    if(who.id==='rival')other.innerHTML=charFace('rival');
    else if(other.dataset.cur!==who.id){
      other.dataset.cur=who.id;
      const gen=(typeof _GENERIC_PLAYER_SVG_URL!=='undefined')?_GENERIC_PLAYER_SVG_URL:'';
      other.innerHTML=`<span class="st-face"><img src="assets/story/cast/${who.id}.png" onerror="this.onerror=null;this.src='${gen}'"></span>`;
    }
  }
  const plate=ov.querySelector('.st-vn-plate');
  plate.textContent=who.name;
  plate.classList.toggle('right',!me);
  const full=vnTok(L.text),el=ov.querySelector('.st-vn-text');
  clearInterval(VNtyping);el.textContent='';el.dataset.full=full;
  let i=0;VNtyping=setInterval(()=>{el.textContent=full.slice(0,++i);if(i>=full.length)clearInterval(VNtyping);},14);
  [...ov.querySelectorAll('#st-vn-prog i')].forEach((p,n)=>p.className=n<=VNi?'on':'');
}
window.vnAdvance=function(){
  const ov=document.getElementById('st-vn');if(!VNsc||!ov)return;
  const el=ov.querySelector('.st-vn-text');
  if(el.textContent!==el.dataset.full){clearInterval(VNtyping);el.textContent=el.dataset.full;return;}
  if(VNi<VNsc.lines.length-1){VNi++;vnShowLine();}
  else vnNextScene();
};

/* scene routing */
function hsCaptScene(opp){ // register a one-off captain face-off vs this school
  if(!window.STORY_SCRIPT)return null;
  const id='captain-'+shortHs(opp);
  if(!STORY_CAST[id])return null;
  const cap=STORY_CAST[id].name;
  const V=[
   [{who:id,text:'Quindi sei tu quello di cui parlano tutti.'},{who:'hero',text:'Le parole costano poco. Novanta minuti no.'},{who:id,text:'Bella risposta. Vediamo se i tuoi piedi sono d\'accordo.'}],
   [{who:id,text:'Questo è il nostro campo. Testa bassa e non ti farai male.'},{who:'hero',text:'Sono qui per i tre punti, non per i consigli.'},{who:id,text:'Allora te ne andrai senza nessuno dei due.'}],
   [{who:id,text:'Una stella non batte undici uomini.'},{who:'hero',text:'Giusto. Per questo ho portato dieci amici.'}]];
  const key='dyn_capt_'+opp+'_'+STORY.hs.stage;
  STORY_SCRIPT[key]={title:'PRE-PARTITA · '+tName(opp).toUpperCase(),lines:V[hash(key)%V.length]};
  return key;
}
function preSceneFor(m){
  const S=STORY;
  if(S.phase==='hs'){
    const opp=m.home===S.hsSchool?m.away:m.home;
    const face=opp!==S.rivalSchool?hsCaptScene(opp):null;
    if(S.hs.stage==='qf')return face?['ch1_pre_qf',face]:['ch1_pre_qf'];
    if(S.hs.stage==='sf')return face?['ch1_pre_sf',face]:['ch1_pre_sf'];
    if(S.hs.stage==='f')return face?['ch1_final_locker',face]:['ch1_final_locker','ch1_pre_final'];
  }
  if(S.phase==='fr3')return['ch3_friendly_pre'];
  if(S.phase==='fr4')return['ch4_friendly_pre'];
  if(S.phase==='wc'){
    if(S.wc.stage==='sf')return['ch4_semi_pre'];
    if(S.wc.stage==='f')return['ch4_final_pre'];
    return['generic_pre_ita'];
  }
  const opp=m.home===S.hero.club?m.away:m.home;
  if(opp===S.hero.rivalClub)return['ch2_derby_pre'];
  if(S.phase==='sb'&&S.league.md===0)return['ch2_pre_md1'];
  return['generic_pre'];
}
function postSceneFor(m,won){
  const S=STORY;
  if(S.phase==='hs'&&S.hs.stage==='qf'&&won)return['ch1_post_qf_win'];
  if((S.phase==='sb'||S.phase==='sa')&&(m.home===S.hero.rivalClub||m.away===S.hero.rivalClub))return['ch2_derby_post'];
  return null;
}
/* ── STAT POINT ALLOCATION → routed to EDIT CHARACTER view ── */
window.stOpenAlloc=function(){window._stView='edit';stRender();};
window.stCloseAlloc=function(){const ov=document.getElementById('st-alloc');if(ov)ov.style.display='none';window._stView='hub';save();stRender();};
window.stRenderAlloc=function(){};
window.stSpend=function(){};
function captainOf(teamKey){
  const S=STORY;
  if(S&&teamKey===S.hero.rivalClub)return{name:S.hero.rival,rival:true};
  if(S&&S.phase==='hs'&&teamKey===S.rivalSchool)return{name:S.hero.rival,rival:true};
  if(SCHOOL_CAPTAINS[teamKey])return{name:SCHOOL_CAPTAINS[teamKey],rival:false};
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
  stInjectCss();window._stView='hub';
  const sv=load();
  if(sv){window.STORY=sv;STORY.pending=null;stRender();showSc('s-story');stFit();setTimeout(maybeStoryBeat,500);return;}
  window.STORY=null;stRenderCreate();showSc('s-story');stFit();
};
const ROLE_T={
  FW:{rn:'IL BOMBER',rp:'FW',h3:'BOMBER',desc:"L'istinto del gol. Attacca la profondità, domina l'area e trasforma ogni occasione in rete.",ab:'TIRO FULMINEO',abd:'Aumenta la potenza e la precisione dei tiri in corsa.'},
  CA:{rn:'IL REGISTA',rp:'CA',h3:'REGISTA',desc:'Il cervello della squadra. Controlla il ritmo, detta i tempi e trasforma il gioco in arte.',ab:'PASSAGGIO ILLUMINANTE',abd:'Aumenta la precisione e la velocità dei passaggi filtranti.'}};
const STAT_L={spd:'VELOCITÀ',pwr:'POTENZA',tec:'TECNICA',def:'DIFESA'};
function svCharImg(extraCls){ // big hub/select character art with fallback chain
  const H=STORY&&STORY.hero,role=H?H.role.toLowerCase():(window._stRole||'FW').toLowerCase();
  const phase=H?(STORY.phase==='fr3'?'sb':STORY.phase==='fr4'?'wc':STORY.phase):'hs';
  const ctx=H?charCtx(H.role,phase):'school';
  const chain=[`assets/story/char-hub-${role}.png`,`assets/story/char-hub.png`,`assets/story/hero-${role}-${ctx}.png`,`assets/story/hero-${role}-school.png`];
  return `<img class="char ${extraCls||''}" src="${chain[0]}" data-c="${chain.slice(1).join('|')}"
    onerror="const d=(this.dataset.c||'').split('|').filter(Boolean);if(d.length){this.src=d.shift();this.dataset.c=d.join('|');}else{this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';}">
    <span class="char fb ${extraCls||''}"><i></i></span>`;
}
function stRenderCreate(){
  const el=document.getElementById('st-body');if(!el)return;
  const seg=v=>{let h='';for(let i=0;i<10;i++)h+=`<i class="${i<v?'on':''}"></i>`;return h;};
  el.innerHTML=`
  <div class="sv-sel" id="sv-sel">
    <div class="split">
      <div class="half fw" id="h-fw" onclick="stPickRole('FW')">
        <div class="hbg"></div>
        <div class="bigcrest l">${badge('genoa',230)}</div>
        <img class="char" src="assets/story/char-fw.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="char fb"><i></i></span>
        <div class="role fw">
          <div class="rname">IL BOMBER</div><div class="rpos">FW</div><div class="rclub">GENOA</div>
          <div class="stats">
            <div class="srow"><span>POTENZA</span><div class="segs">${seg(8)}</div></div>
            <div class="srow"><span>VELOCITÀ</span><div class="segs">${seg(8)}</div></div>
            <div class="srow"><span>TECNICA</span><div class="segs">${seg(7)}</div></div>
            <div class="srow"><span>DIFESA</span><div class="segs">${seg(5)}</div></div>
          </div>
        </div>
        <span class="selchk">SELECTED ▮</span>
      </div>
      <div class="half ca" id="h-ca" onclick="stPickRole('CA')">
        <div class="hbg"></div>
        <div class="bigcrest r">${badge('sampdoria',230)}</div>
        <img class="char" src="assets/story/char-ca.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="char fb"><i></i></span>
        <div class="role ca">
          <div class="rname">IL REGISTA</div><div class="rpos">CA</div><div class="rclub">SAMPDORIA</div>
          <div class="stats">
            <div class="srow"><span>TECNICA</span><div class="segs">${seg(8)}</div></div>
            <div class="srow"><span>VELOCITÀ</span><div class="segs">${seg(7)}</div></div>
            <div class="srow"><span>POTENZA</span><div class="segs">${seg(6)}</div></div>
            <div class="srow"><span>DIFESA</span><div class="segs">${seg(6)}</div></div>
          </div>
        </div>
        <span class="selchk">SELECTED ▮</span>
      </div>
      <div class="vsline"></div><div class="vs">VS</div>
      <div class="title"><span class="slash"></span><div class="l1">CHARACTER</div><div class="l2">SELECTION</div></div>
      <div class="subpick">SCEGLI IL TUO<b>GIOCATORE</b></div>
      <div class="arrow l" onclick="stPickRole('FW')">❮</div>
      <div class="arrow r" onclick="stPickRole('CA')">❯</div>
      <button class="sv-home" onclick="showSc('s-home')">‹ HOME</button>
    </div>
    <div class="bottom">
      <div class="panel np"><img class="npbg" src="assets/story/jersey-bg.png" onerror="this.onerror=null;this.style.display='none'">
        <div class="ptitle">NAME CREATION</div>
        <div class="namegrid">
          <div class="sil"><img src="assets/story/name-silhouette.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="fb"><i></i></span></div>
          <div class="fields">
            <div class="frow"><label>NOME</label><input id="f-nome" maxlength="12" placeholder="Luca"></div>
            <div class="frow"><label>COGNOME</label><input id="f-cognome" maxlength="14" placeholder="Moretti"></div>
            <div class="frow"><label>SOPRANNOME</label><input id="f-sopra" maxlength="14" placeholder="(opzionale)"></div>
            <div class="frow rival"><label>RIVALE</label><input id="f-rival" maxlength="16" placeholder="D.Falco"></div>
          </div>
          <div class="jersey"><span class="jtxt"><b id="j-name">TUO NOME</b><u id="j-num">9</u></span></div>
        </div>
      </div>
      <div class="panel startp">
        <div class="startart"><img src="assets/story/start-art.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="fb"></span></div>
        <div class="skick">INIZIA LA TUA CARRIERA</div>
        <div class="sname">LA NUOVA STELLA</div>
        <div class="ssub">DALL'ANONIMATO ALLA GLORIA.<br>IL CAMPO È IL TUO PALCOSCENICO.</div>
        <button class="startbtn" onclick="stBegin()"><span class="ball">⚽</span> START STORY MODE</button>
      </div>
    </div>
    <div class="foot">
      <span><span class="glyph g-x">✕</span>CONFERMA</span><span class="sep">|</span>
      <span><span class="glyph g-o">◯</span>INDIETRO</span>
    </div>
  </div>`;
  window._stRole=window._stRole||'FW';stMarkRole();
  ['f-cognome','f-sopra'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{
    const n=document.getElementById('f-sopra').value.trim()||document.getElementById('f-cognome').value.trim();
    document.getElementById('j-name').textContent=(n||'TUO NOME').toUpperCase();
  }));
  stFit();
}
window.stPickRole=function(r){window._stRole=r;stMarkRole();};
function stMarkRole(){
  const r=window._stRole||'FW';
  const f=document.getElementById('h-fw'),c=document.getElementById('h-ca');
  if(f)f.classList.toggle('dim',r!=='FW');
  if(c)c.classList.toggle('dim',r!=='CA');
  const j=document.getElementById('j-num');if(j)j.textContent=r==='FW'?'9':'10';
}
window.stBegin=function(){
  const cap=s=>s?s[0].toUpperCase()+s.slice(1):'';
  const nome=cap((document.getElementById('f-nome').value||'').trim())||'Luca';
  const cognome=cap((document.getElementById('f-cognome').value||'').trim())||'Moretti';
  const sopra=(document.getElementById('f-sopra').value||'').trim();
  const n1=nome[0].toUpperCase()+'.'+cognome;
  const n2=(document.getElementById('f-rival').value||'').trim()||'D.Falco';
  const role=window._stRole||'FW';
  const club=role==='FW'?'genoa':'sampdoria',rivalClub=role==='FW'?'sampdoria':'genoa';
  // hero school depends on role: CA → Liceo Garibaldi, FW → Ist. San Giorgio (rival gets the other)
  const hsSchool=role==='CA'?'hs_garibaldi':'hs_sangiorgio';
  const rivalSchool=role==='CA'?'hs_sangiorgio':'hs_garibaldi';
  const mid=shuffle(SCHOOLS.filter(k=>k!==hsSchool&&k!==rivalSchool));
  const order=[hsSchool,...mid,rivalSchool]; // seeds 0 & 7 → can only meet in the final
  const qf=[];for(let i=0;i<8;i+=2)qf.push({home:order[i],away:order[i+1],played:false});
  window.STORY={hero:{name:n1,rival:n2,role,club,rivalClub,nick:sopra,level:1,xp:0,points:0,alloc:{spd:0,pwr:0,tec:0,def:0},goalsSeason:0},
    phase:'hs',hsSchool,rivalSchool,
    hs:{stage:'qf',ko:{qf,sf:null,f:null},alive:true,rivalAlive:true},
    league:null,wc:null,pending:null,seasonB:1,seasonA:0};
  save();
  window._stView='hub';
  vnPlay(['ch1_intro']);
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
  if(S.phase==='fr3'||S.phase==='fr4'){
    return (S.friendly&&!S.friendly.m.played)?S.friendly.m:null;
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
    vnPlay([won?'ch1_post_final_win':'ch1_post_final_loss','ch1_scout','ch2_arrival','ch2_training'],()=>{
      S.phase='sb';startLeague('B');injectHero(H.club,'hero');injectHero(H.rivalClub,'rival');save();
    });
    return;
  }
  if(S.phase==='fr3'){
    if(!S.friendly||!S.friendly.m.played)return;
    vnPlay(['ch3_press'],()=>{S.phase='sa';S.seasonA++;startLeague('A');S.friendly=null;save();});
    return;
  }
  if(S.phase==='fr4'){
    if(!S.friendly||!S.friendly.m.played)return;
    vnPlay(['ch4_wc_open'],()=>{S.phase='wc';startWC();S.friendly=null;save();});
    return;
  }
  if(S.phase==='sb'||S.phase==='sa'){
    const L=S.league;if(L.md<L.fix.length)return;
    const order=sortKeys(L.teams,L.tab),pos=order.indexOf(H.club)+1;
    if(S.phase==='sb'){
      if(pos<=2){
        vnPlay(['ch2_promotion','ch3_arrival'],()=>{S.phase='fr3';S.friendly={opp:'holland',m:{home:H.club,away:'holland',played:false}};save();});
      }else{
        talk('SEASON OVER',['#'+pos+' is not enough. Promotion slipped away.','"Again," you tell the mirror. "One more season."'],()=>{S.seasonB++;startLeague('B');save();stRender();});
      }
    }else{
      if(pos<=4){
        vnPlay(['ch3_callup','ch4_ritiro'],()=>{S.phase='fr4';S.friendly={opp:'argentina',m:{home:'italy',away:'argentina',played:false}};save();});
      }else{
        talk('SEASON OVER',['#'+pos+'. Good — not good enough for the national team.','Another season. Louder this time.'],()=>{S.seasonA++;startLeague('A');save();stRender();});
      }
    }
    return;
  }
  if(S.phase==='wc'&&S.wc.stage==='done'){
    if(S.wc.champion==='italy'){
      vnPlay(['ch4_final_win'],()=>{S.phase='done';save();});
    }else{
      vnPlay(['ch4_final_loss'],()=>{S.phase='done';S.wcLost=true;save();});
    }
  }
}

/* ── PLAY / SIM ───────────────────────────────────────────── */
function buildForMatch(k){
  if(STORY.phase==='hs'){stBuildTeam(k);if(k===STORY.hsSchool)injectHeroSchool('hero');if(k===STORY.rivalSchool)injectHeroSchool('rival');return;}
  if(k==='italy'){injectItaly();return;}
  if(T[k]&&!T[k]._story&&!CR_CLUBS[k]&&!ST_CLUBS[k])return; // plain national opponent (friendlies)
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
  // CH.4: the rival is called up too — rivals become teammates
  const rRole=S.role==='FW'?'CA':'FW',rSlot=HERO_SLOT[rRole],rst=rivalStats(rRole,S.level+1);
  const ri=t.p.findIndex(p=>p.pos===rSlot&&!p._hero);
  const rOld=t.p[ri>=0?ri:7];
  t.p[ri>=0?ri:7]={...rOld,id:99902,name:S.rival,origName:S.rival,spd:rst.spd,pwr:rst.pwr,tec:rst.tec,def:rst.def,rar:2,_rival:true};
}
window.stPlayNext=function(){
  const m=myFixture();if(!m)return;
  const S=STORY;
  const mine=S.phase==='hs'?S.hsSchool:(S.phase==='wc'||S.phase==='fr4')?'italy':S.hero.club;
  const opp=m.home===mine?m.away:m.home;
  buildForMatch(mine);buildForMatch(opp);
  vnPlay(preSceneFor(m),()=>stLaunch(m,mine,opp));
};
/* ★ DEV ONLY — REMOVE FOR RELEASE: instantly win the next match with full XP */
window.stDevSkip=function(){
  if(!window.UE_DEV)return;
  const m=myFixture();if(!m){stSimNext();return;}
  const S=STORY,mine=S.phase==='hs'?S.hsSchool:(S.phase==='wc'||S.phase==='fr4')?'italy':S.hero.club;
  const hg=m.home===mine?3:1,ag=m.home===mine?1:3;
  const post=postSceneFor(m,true);
  applyMyResult(m,hg,ag,true);
  if(post)vnPlay(post);
  save();stRender();setTimeout(maybeStoryBeat,250);
};
function stLaunch(m,mine,opp){
  selHome=mine;selAway=opp;HT=T[mine];AT=T[opp];
  STORY.pending={home:m.home,away:m.away,isHome:m.home===mine};save();
  G_teamEditorOrigin='story';
  // close the VN layer & drain the queue BEFORE switching screens,
  // then switch to the team menu explicitly (fixes "dialogue ends → stuck on hub")
  VNJOBS.length=0;VNsc=null;clearInterval(VNtyping);
  const ov=document.getElementById('st-vn');if(ov)ov.style.display='none';
  openTeamMenu();
  if(typeof showSc==='function')showSc('s-team');
}
window.stSimNext=function(){
  const m=myFixture();
  if(m){const r=simMatch(m.home,m.away);applyMyResult(m,r.hg,r.ag,false);}
  else advanceAll();
  save();stRender();
  setTimeout(maybeStoryBeat,250);
};
function applyMyResult(m,hg,ag,played){
  const S=STORY,mine=S.phase==='hs'?S.hsSchool:(S.phase==='wc'||S.phase==='fr4')?'italy':S.hero.club;
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
  if(S.phase==='fr3'||S.phase==='fr4'){endOfRound();return;}
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
  if(m){
    const mine=STORY.phase==='hs'?STORY.hsSchool:(STORY.phase==='wc'||STORY.phase==='fr4')?'italy':STORY.hero.club;
    const won=(m.home===mine?hg:ag)>(m.home===mine?ag:hg);
    const post=postSceneFor(m,won);
    applyMyResult(m,hg,ag,true);
    if(post)vnPlay(post);
  }
  save();stRender();showSc('s-story');
  setTimeout(maybeStoryBeat,400);
};
window.stQuit=function(){if(!confirm('Delete story progress and start over?'))return;wipe();stRenderCreate();};

/* ── RENDER · STORY HUB / EDIT (1920×1080 scaled stage) ───── */
const PHASE_T={hs:'CH.1 · NATIONAL SCHOOLS CUP',sb:'CH.2 · SERIE B',fr3:'CH.3 · AMICHEVOLE INTERNAZIONALE',sa:'CH.3 · SERIE A',fr4:'CH.4 · RITIRO AZZURRO',wc:'CH.4 · WORLD CUP',done:'EPILOGUE'};
const KO_L={qf:'QUARTI DI FINALE',sf:'SEMIFINALI',f:'FINALE',r16:'OTTAVI DI FINALE'};
function stFit(){
  const sc=document.getElementById('st-scaler');if(!sc)return;
  const k=Math.min(innerWidth/1920,innerHeight/1080);
  sc.style.transform='translate(-50%,-50%) scale('+k+')';
}
addEventListener('resize',stFit);
function myTeamKey(){const S=STORY;return S.phase==='hs'?S.hsSchool:(S.phase==='wc'||S.phase==='fr4')?'italy':S.hero.club;}
function chapInfo(){
  const S=STORY,k=myTeamKey();
  const M={hs:{cap:'CAPITOLO 1',dream:'IL TUO SOGNO INIZIA QUI.',p:'Il torneo interscolastico di Genova è il primo passo verso la gloria.'},
    sb:{cap:'CAPITOLO 2',dream:'LA PORTA DEL CALCIO PRO.',p:'Serie B · Stagione '+S.seasonB+' — chiudi tra le prime 2 per la promozione.'},
    fr3:{cap:'CAPITOLO 3',dream:'IL GRANDE SALTO.',p:'Amichevole internazionale prima del debutto in Serie A.'},
    sa:{cap:'CAPITOLO 3',dream:'IL GRANDE PALCOSCENICO.',p:'Serie A · Stagione '+S.seasonA+' — chiudi tra le prime 4 per la convocazione azzurra.'},
    fr4:{cap:'CAPITOLO 4',dream:'RITIRO AZZURRO.',p:'Amichevole con la nazionale prima del Mondiale.'},
    wc:{cap:'CAPITOLO 4',dream:'IL MONDO TI GUARDA.',p:'Fase a eliminazione diretta della Coppa del Mondo.'},
    done:{cap:'EPILOGO',dream:'LA LEGGENDA È SCRITTA.',p:'La tua storia è completa.'}};
  return{...M[S.phase],team:k,tn:tName(k)};
}
function svBars(){
  const st=heroStats(STORY.hero);
  return Object.keys(STAT_L).map(k=>`<div class="arow"><span>${STAT_L[k]}</span><div class="abar"><i style="width:${st[k]}%"></i></div><b>${st[k]}</b></div>`).join('');
}
function svRadar(){
  const st=heroStats(STORY.hero),A=Object.keys(STAT_L).map(k=>[STAT_L[k],st[k]]);
  const C=85,R=72,N=A.length;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/N;return (C+r*Math.cos(a)).toFixed(1)+','+(C+r*Math.sin(a)).toFixed(1);};
  let g='';
  for(let ring=1;ring<=3;ring++){const r=R*ring/3;g+=`<polygon points="${A.map((_,i)=>pt(i,r)).join(' ')}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`;}
  g+=A.map((_,i)=>`<line x1="${C}" y1="${C}" x2="${pt(i,R).split(',')[0]}" y2="${pt(i,R).split(',')[1]}" stroke="rgba(255,255,255,.14)"/>`).join('');
  g+=`<polygon points="${A.map(([_,v],i)=>pt(i,R*v/100)).join(' ')}" class="rfill"/>`;
  return `<svg class="radar" viewBox="0 0 170 170">${g}</svg>`;
}
function svMrow(m,my){
  const sc=m.played?`${m.hg} - ${m.ag}`:'VS';
  const win=m.played&&((m.home===my&&(m.hg>m.ag||(m.pens&&m.pens[0]>m.pens[1])))||(m.away===my&&(m.ag>m.hg||(m.pens&&m.pens[1]>m.pens[0]))));
  const mine=m.home===my||m.away===my;
  return `<div class="mrow${win?' win':mine?' me':''}${m.played?'':' up'}">${badge(m.home,34)}<span class="tn">${tName(m.home)}</span><span class="sc${m.played?'':' vs'}">${sc}${m.pens?`<i> (${m.pens[0]}-${m.pens[1]}p)</i>`:''}</span><span class="tn r">${tName(m.away)}</span>${badge(m.away,34)}</div>`;
}
function svBracket(ko,stages,my){
  return stages.filter(s=>ko[s]).map(s=>`<div class="stagelbl">${KO_L[s]}</div>`+ko[s].map(m=>svMrow(m,my)).join('')).join('');
}
function svTable(){
  const L=STORY.league,my=STORY.hero.club;
  const rows=sortKeys(L.teams,L.tab).map((k,i)=>{const r=L.tab[k];
    return `<tr class="${k===my?'me':''}"><td class="ps">${i+1}</td><td class="tt">${badge(k,22)}<span>${tName(k)}</span></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pt">${pts(r)}</td></tr>`;}).join('');
  return `<table class="sv-tbl"><thead><tr><th>#</th><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function svRightSub(){
  const S=STORY;
  if(S.phase==='hs')return S.hs.stage==='done'?'TORNEO CONCLUSO':KO_L[S.hs.stage];
  if(S.phase==='sb'||S.phase==='sa')return 'GIORNATA '+Math.min(S.league.md+1,S.league.fix.length)+' / '+S.league.fix.length;
  if(S.phase==='fr3'||S.phase==='fr4')return 'AMICHEVOLE · '+tName(S.friendly?S.friendly.opp:'').toUpperCase();
  if(S.phase==='wc')return S.wc.stage==='done'?'MONDIALE CONCLUSO':KO_L[S.wc.stage];
  return 'STORIA COMPLETA';
}
function svRightTitle(){
  const S=STORY;
  return{hs:'TORNEO INTERSCOLASTICO DI GENOVA',sb:'SERIE B · CAMPIONATO',fr3:'AMICHEVOLE INTERNAZIONALE',sa:'SERIE A · CAMPIONATO',fr4:'RITIRO AZZURRO',wc:'COPPA DEL MONDO',done:'EPILOGO'}[S.phase]||'';
}
function svNextPanel(){
  const S=STORY,my=myTeamKey(),m=myFixture();
  if(S.phase==='done'){
    return `<div class="next done"><div class="top"><span class="pp">${S.wcLost?'🥈 FINALISTA MONDIALE':'🏆 CAMPIONE DEL MONDO'}</span></div>
      <div class="champname">${STORY.hero.name}${STORY.hero.nick?' “'+STORY.hero.nick.toUpperCase()+'”':''}</div>
      <div class="btns"><button class="st-play" onclick="stReplayWC()">🔁 REPLAY WORLD CUP</button><button class="st-sim" onclick="stQuit()">NUOVA STORIA</button></div></div>`;
  }
  if(!m){
    return `<div class="next"><div class="top"><span class="pp">PROSSIMA PARTITA</span><span class="st2">${svRightSub()}</span></div>
      <div class="nofx">NESSUNA PARTITA IN QUESTO TURNO</div>
      <div class="btns"><button class="st-play" onclick="stSimNext()">⏩ SIMULA TURNO</button></div></div>`;
  }
  return `<div class="next"><div class="top"><span class="pp">PROSSIMA PARTITA ${m.home===my?'· CASA':'· TRASFERTA'}</span><span class="st2">${svRightSub()}</span></div>
    <div class="vsrow">
      <div class="tcol">${badge(m.home,92)}<b>${tName(m.home)}</b></div>
      <div class="bigvs">VS</div>
      <div class="tcol">${badge(m.away,92)}<b>${tName(m.away)}</b></div>
    </div>
    <div class="btns"><button class="st-play" onclick="stPlayNext()">▶ GIOCA</button><button class="st-sim" onclick="stSimNext()">⏩ SIM · ½ XP</button>${window.UE_DEV?'<button class="st-sim dev" onclick="stDevSkip()">🛠 DEV WIN</button>':''}</div></div>`;
}
window.stRender=function(){
  const S=STORY,el=document.getElementById('st-body');if(!el)return;
  stInjectCss();
  if(!S){stRenderCreate();return;}
  if((S.phase==='sb'||S.phase==='sa')&&!S.league){startLeague(S.phase==='sb'?'B':'A');save();}
  if((S.phase==='fr3'||S.phase==='fr4')&&!S.friendly){S.friendly={opp:S.phase==='fr3'?'holland':'argentina',m:S.phase==='fr3'?{home:S.hero.club,away:'holland',played:false}:{home:'italy',away:'argentina',played:false}};save();}
  const sc=document.getElementById('st-scaler');
  if(sc)sc.classList.toggle('ca',S.hero.role==='CA');
  if(window._stView==='edit'){stRenderEdit();return;}
  const H=S.hero,RT=ROLE_T[H.role],ci=chapInfo(),st=heroStats(H),need=xpNeed(H.level);
  const dispName=(H.name||'').toUpperCase()+(H.nick?' “'+H.nick.toUpperCase()+'”':'');
  let right='';
  if(S._last){const L=S._last;right+=`<div class="lastft">FT&nbsp;${badge(L.home,20)} ${tName(L.home)} <b>${L.hg}–${L.ag}</b> ${tName(L.away)} ${badge(L.away,20)}${L.pens?` <i>(${L.pens[0]}–${L.pens[1]}p)</i>`:''}${S._lastXP?` · <em>+${S._lastXP.xp} XP${S._lastXP.sim?' (SIM)':''}${S._lastXP.ups?' · LEVEL UP ×'+S._lastXP.ups:''}</em>`:''}</div>`;}
  if(S.phase==='hs')right+=`<div class="brk">${svBracket(S.hs.ko,['qf','sf','f'],S.hsSchool)}</div>`;
  else if(S.phase==='sb'||S.phase==='sa')right+=`<div class="brk tblwrap">${svTable()}</div>`;
  else if(S.phase==='wc')right+=`<div class="brk">${svBracket(S.wc.ko,['r16','qf','sf','f'],'italy')}</div>`;
  else if(S.phase==='fr3'||S.phase==='fr4')right+=`<div class="brk"><div class="stagelbl">PARTITA SECCA</div>${S.friendly?svMrow(S.friendly.m,myTeamKey()):''}</div>`;
  else if(S.phase==='done')right+=`<div class="brk"><div class="stagelbl">CARRIERA</div><div class="epil">${S.wcLost?'Finale mondiale persa — ma la leggenda di Genova continua.':'Campione del Mondo. Dal campetto di Genova al tetto del pianeta.'}</div></div>`;
  el.innerHTML=`
  <div class="sv-hub">
    <div class="hbg2"></div>
    ${svCharImg('hubchar')}
    <div class="brand"><h1>LA NUOVA STELLA</h1><div class="ul"></div><div class="mode">MODALITÀ STORIA</div></div>
    <div class="chapter">
      <div class="crest-big">${badge(ci.team,104)}</div>
      <div class="txt"><div class="cap">${ci.cap}</div><h2>${ci.tn.toUpperCase()}</h2><div class="dream">${ci.dream}</div><p>${ci.p}</p></div>
    </div>
    <div class="menu">
      <div class="mbtn hot" onclick="${myFixture()?'stPlayNext()':'stSimNext()'}"><span class="ic">⚽</span><span class="tt"><b>NEXT MATCH</b><span>PROSSIMA PARTITA</span></span><span class="chev">❯</span></div>
      <div class="mbtn" onclick="stOpenAlloc()"><span class="ic">👤</span><span class="tt"><b>EDIT CHARACTER</b><span>MODIFICA GIOCATORE${(H.points||0)>0?' · <em>'+H.points+' PT</em>':''}</span></span></div>
      <div class="mbtn" onclick="showSc('s-home')"><span class="ic">↩</span><span class="tt"><b>GO BACK</b><span>TORNA AL MENU</span></span></div>
    </div>
    <div class="attrs"><span class="lbl">ATTRIBUTI</span>${svRadar()}<div class="alist">${svBars()}</div></div>
    <div class="ident2">
      <div class="hname">${dispName}</div>
      <div class="rrow"><span class="rolechip">${RT.rn} · ${RT.rp}</span><span class="clubchip">${ci.tn.toUpperCase()}</span></div>
      <div class="row1"><span class="lv">LV.<b>${H.level}</b></span><span class="exp"><i>EXP</i>${H.xp} / ${need}</span></div>
      <div class="expbar"><i style="width:${Math.min(100,Math.round(100*H.xp/need))}%"></i></div>
      <div class="expav" onclick="stOpenAlloc()"><span class="t">PUNTI ABILITÀ</span><span class="v">${H.points||0} <span class="chip">PTS</span></span>${(H.points||0)>0?'<span class="train">✦ ALLENATI ORA ❯</span>':''}</div>
      <div class="abrow"><span class="ic">✦</span><div><b>${RT.ab}</b><span>${RT.abd}</span></div></div>
    </div>
    <div class="rivbox">${heroFace(H.rival,'sm')}<div><b>RIVALE · ${H.rival}</b><span>LV ${H.level+1} · ${tName(S.phase==='hs'?S.rivalSchool:H.rivalClub)}</span></div></div>
    <div class="tour">
      <div class="head"><span class="cup">🏆</span><div><h2>${svRightTitle()}</h2><div class="sub">${svRightSub()}</div></div></div>
      ${right}
    </div>
    ${svNextPanel()}
    <div class="foot">
      <span><span class="glyph g-x">✕</span>CONFERMA</span><span class="sep">|</span>
      <span><span class="glyph g-o">◯</span>INDIETRO</span>
      <button class="delstory" onclick="stQuit()">🗑 DELETE STORY</button>
    </div>
  </div>`;
  stFit();
};
/* ── EDIT CHARACTER view ──────────────────────────────────── */
let EPEND=null;
function stRenderEdit(){
  const el=document.getElementById('st-body'),S=STORY,H=S.hero;if(!el)return;
  if(!EPEND)EPEND={spd:0,pwr:0,tec:0,def:0};
  const st=heroStats(H),RT=ROLE_T[H.role],need=xpNeed(H.level);
  const spent=Object.values(EPEND).reduce((a,b)=>a+b,0);
  const left=(H.points||0)-spent;
  const rows=Object.keys(STAT_L).map(k=>{
    const v=st[k],p=EPEND[k],nv=v+p;
    return `<div class="erow"><span>${STAT_L[k]}</span>
      <div class="ebar"><i style="width:${v}%"></i><u style="left:${v}%;width:${p}%"></u></div>
      <div class="val">${v}${p?`<em>+${p}</em>`:''}</div>
      <button class="ebtn" ${p<=0?'disabled':''} onclick="stEMod('${k}',-1)">−</button>
      <button class="ebtn plus" ${(left<1||nv>=STAT_CAP)?'disabled':''} onclick="stEMod('${k}',1)">＋</button></div>`;
  }).join('');
  el.innerHTML=`
  <div class="sv-hub sv-edit">
    <div class="hbg2"></div>
    ${svCharImg('editchar')}
    <div class="brand"><h1>EDIT CHARACTER</h1><div class="ul"></div><div class="mode">MODIFICA <b>GIOCATORE</b></div></div>
    <div class="ident">
      <div class="nm">${(H.name||'').toUpperCase()}${H.nick?' “'+H.nick.toUpperCase()+'”':''}</div>
      <div class="rl">${RT.rn} · ${RT.rp}</div>
      <div class="lvrow"><span class="lv2">LV.<b>${H.level}</b></span></div>
      <div class="expbar"><i style="width:${Math.min(100,Math.round(100*H.xp/need))}%"></i></div>
      <div class="expt">EXP ${H.xp} / ${need}</div>
    </div>
    <div class="pool">
      <div class="t">PUNTI DISPONIBILI</div>
      <div class="v">${left} <span class="chip">PTS</span></div>
      <div class="cost">COSTO POTENZIAMENTO: <b>1 PUNTO</b> = +1 · MAX ${STAT_CAP}</div>
    </div>
    <div class="backbtn" onclick="stEBack()"><span style="font-size:22px">↩</span><div><b>GO BACK</b><span>TORNA AL MENU STORIA</span></div></div>
    <div class="editp">
      <div class="et">POTENZIAMENTO ATTRIBUTI</div>
      <div class="es">SPENDI PUNTI PER MIGLIORARE IL TUO GIOCATORE</div>
      <div class="rows">${rows}</div>
      <div class="cbar">
        <button class="cbtn ok" ${spent<=0?'disabled':''} onclick="stEConfirm()">✕ CONFERMA</button>
        <button class="cbtn rst" ${spent<=0?'disabled':''} onclick="stEReset()">▢ RESET</button>
      </div>
      <div class="note">L'allenamento è permanente — i punti confermati non sono rimborsabili.</div>
    </div>
    <div class="foot">
      <span><span class="glyph g-x">✕</span>CONFERMA</span><span class="sep">|</span>
      <span><span class="glyph g-o">◯</span>INDIETRO</span>
    </div>
  </div>`;
  stFit();
}
window.stEMod=function(k,d){
  const H=STORY.hero,st=heroStats(H);
  const spent=Object.values(EPEND).reduce((a,b)=>a+b,0);
  if(d>0&&((H.points||0)-spent<1||st[k]+EPEND[k]>=STAT_CAP))return;
  if(d<0&&EPEND[k]<=0)return;
  EPEND[k]+=d;stRenderEdit();
};
window.stEReset=function(){EPEND={spd:0,pwr:0,tec:0,def:0};stRenderEdit();};
window.stEConfirm=function(){
  const H=STORY.hero,spent=Object.values(EPEND).reduce((a,b)=>a+b,0);
  if(spent<=0)return;
  Object.keys(EPEND).forEach(k=>{H.alloc[k]=(H.alloc[k]||0)+EPEND[k];});
  H.points=Math.max(0,(H.points||0)-spent);
  EPEND=null;save();window._stView='hub';stRender();
};
window.stEBack=function(){EPEND=null;window._stView='hub';stRender();};
window.stReplayWC=function(){STORY.wcLost=false;STORY.phase='wc';startWC();save();stRender();};
/* ── CSS (injected — bypasses style.css CDN cache) ────────── */
let _stCss=false;
function stInjectCss(){
  if(_stCss)return;_stCss=true;
  const s=document.createElement('style');s.id='st-style';
  s.textContent=`
#s-story{background:#000}
#st-scaler{position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:center;background:#070508;
 --ac:#e22531;--ac2:#ff3b47;--acL:#ff5b66;--deep:#c01024;--deep2:#7d0c18;--dark:#7a0a14;--glow:255,40,55;--bgA:#3a1d22;--bgB:#1a0d12}
#st-scaler.ca{--ac:#2f6fe0;--ac2:#4f8dff;--acL:#7ea9ff;--deep:#1241c0;--deep2:#0c2c7d;--dark:#0a2a7a;--glow:70,130,255;--bgA:#101d3a;--bgB:#0a1124}
#st-body{position:absolute;inset:0;font-family:'Barlow Condensed','Rajdhani',sans-serif;color:#fff}
#st-body *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
#st-body .uee .fb{display:none}
/* ════ SELECT ════ */
#st-body .sv-sel{position:absolute;inset:0;display:grid;grid-template-rows:1fr 290px 56px;overflow:hidden;background:#04060c}
#st-body .split{position:relative;min-height:0}
#st-body .half{position:absolute;inset:0;overflow:hidden;cursor:pointer;transition:filter .25s}
#st-body .half.dim{filter:saturate(.35) brightness(.55)}
#st-body .half.dim .selchk{display:none}
#st-body .selchk{position:absolute;bottom:24px;font-style:italic;font-weight:800;font-size:24px;letter-spacing:2px;color:#ffce3c;text-shadow:0 0 12px rgba(255,200,60,.7);z-index:4}
#st-body .half.fw .selchk{left:120px}
#st-body .half.ca .selchk{right:110px}
#st-body .half.fw{clip-path:polygon(0 0,56% 0,44% 100%,0 100%)}
#st-body .half.ca{clip-path:polygon(56% 0,100% 0,100% 100%,44% 100%)}
#st-body .half .hbg{position:absolute;inset:0;background-size:cover;background-position:center}
#st-body .half.fw .hbg{background-image:url('assets/story/bg-red.png'),radial-gradient(120% 130% at 18% 25%,#5b0a12 0%,#2a050b 45%,#0b0307 100%)}
#st-body .half.ca .hbg{background-image:url('assets/story/bg-blue.png'),radial-gradient(120% 130% at 82% 25%,#0a2f7a 0%,#071536 45%,#03060f 100%)}
#st-body .half.fw::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,40,40,.16) 42%,transparent 55%)}
#st-body .half.ca::before{content:'';position:absolute;inset:0;background:linear-gradient(-115deg,transparent 30%,rgba(60,130,255,.16) 42%,transparent 55%)}
#st-body .half .char{position:absolute;bottom:0;height:700px;width:auto;max-width:760px;object-fit:contain;object-position:bottom;filter:drop-shadow(0 0 26px rgba(0,0,0,.8))}
#st-body .half.fw .char{left:27%;transform:translateX(-50%)}
#st-body .half.ca .char{left:73%;transform:translateX(-50%)}
#st-body .char.fb{display:none;align-items:flex-end;justify-content:center;width:340px;height:700px}
#st-body .char.fb i{display:block;width:300px;height:620px;background:radial-gradient(60% 30% at 50% 12%,#1c2640 0 30%,transparent 31%),linear-gradient(#16203a,#0a101f);clip-path:polygon(38% 0,62% 0,66% 14%,86% 22%,92% 100%,8% 100%,14% 22%,34% 14%);opacity:.85}
#st-body .vsline{position:absolute;left:50%;top:-6%;height:115%;width:8px;background:linear-gradient(#fff0,#ffffffd9 30%,#ffffffd9 70%,#fff0);transform:translateX(-50%) rotate(17.4deg);filter:drop-shadow(0 0 14px rgba(255,255,255,.8));z-index:5;pointer-events:none}
#st-body .vs{position:absolute;left:50%;top:26%;transform:translate(-50%,-50%) rotate(-6deg);z-index:6;font-family:'Permanent Marker',cursive;font-size:96px;text-shadow:0 0 22px rgba(255,255,255,.65),4px 4px 0 rgba(0,0,0,.55);pointer-events:none}
#st-body .title{position:absolute;top:34px;left:52px;z-index:7;line-height:.86;pointer-events:none}
#st-body .title .l1,#st-body .title .l2{font-family:'Permanent Marker',cursive;letter-spacing:1px}
#st-body .title .l1{font-size:72px;text-shadow:3px 3px 0 #000,0 0 18px rgba(255,255,255,.3)}
#st-body .title .l2{font-size:50px;color:#e22531;transform:rotate(-3deg);display:inline-block;text-shadow:2px 2px 0 #000}
#st-body .title .slash{position:absolute;left:-6%;top:-22%;width:130%;height:150%;z-index:-1;background:linear-gradient(105deg,transparent 38%,rgba(190,20,30,.85) 48%,rgba(120,8,16,.9) 55%,transparent 66%);clip-path:polygon(0 30%,100% 0,86% 70%,8% 92%);filter:blur(1px)}
#st-body .subpick{position:absolute;top:230px;left:56px;z-index:7;font-weight:800;letter-spacing:3px;font-size:18px;pointer-events:none}
#st-body .subpick b{display:block;color:#ff3b47;font-size:1.3em}
#st-body .sv-home{position:absolute;right:26px;top:26px;z-index:9;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.3);color:#fff;font-family:inherit;font-weight:800;letter-spacing:2px;font-size:18px;padding:8px 20px;cursor:pointer;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%)}
#st-body .role{position:absolute;z-index:6;width:430px;display:flex;flex-direction:column;gap:8px;pointer-events:none}
#st-body .role.fw{left:108px;top:280px;align-items:flex-start;text-align:left}
#st-body .role.ca{right:96px;top:260px;align-items:flex-end;text-align:right}
#st-body .bigcrest{position:absolute;top:290px;opacity:.38;filter:drop-shadow(0 8px 20px rgba(0,0,0,.8))}
#st-body .bigcrest.l{left:150px}
#st-body .bigcrest.r{right:150px}
#st-body .rname{font-style:italic;font-weight:800;font-size:42px;letter-spacing:1px;text-shadow:2px 2px 0 rgba(0,0,0,.6)}
#st-body .rpos{font-style:italic;font-weight:800;font-size:52px;line-height:.9}
#st-body .role.fw .rpos{color:#ff5b66;text-shadow:0 0 16px rgba(255,60,70,.8)}
#st-body .role.ca .rpos{color:#4f8dff;text-shadow:0 0 16px rgba(70,130,255,.8)}
#st-body .rclub{font-weight:800;letter-spacing:2px;font-size:22px;padding:5px 22px;margin-top:4px}
#st-body .role.fw .rclub{background:#c01024;clip-path:polygon(0 0,100% 0,94% 100%,0 100%)}
#st-body .role.ca .rclub{background:#1241c0;clip-path:polygon(6% 0,100% 0,100% 100%,0 100%)}
#st-body .stats{margin-top:16px;display:flex;flex-direction:column;gap:7px;font-weight:800;letter-spacing:1px;font-size:16px}
#st-body .srow{display:flex;align-items:center;gap:12px}
#st-body .role.ca .srow{flex-direction:row-reverse}
#st-body .srow span{width:110px}
#st-body .role.ca .srow span{text-align:right}
#st-body .segs{display:flex;gap:4px}
#st-body .segs i{width:17px;height:15px;background:#262b36;box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}
#st-body .role.fw .segs i.on{background:linear-gradient(180deg,#ff4250,#b40e1e);box-shadow:0 0 6px rgba(255,50,60,.6)}
#st-body .role.ca .segs i.on{background:linear-gradient(180deg,#4f8dff,#1241c0);box-shadow:0 0 6px rgba(70,130,255,.6)}
#st-body .arrow{position:absolute;top:42%;z-index:8;font-size:66px;font-weight:900;cursor:pointer;user-select:none;line-height:1;transition:transform .12s}
#st-body .arrow:active{transform:scale(.85)}
#st-body .arrow.l{left:22px;text-shadow:0 0 14px #ff3b47,2px 2px 0 #7a0a14}
#st-body .arrow.r{right:22px;text-shadow:0 0 14px #4f8dff,2px 2px 0 #0a2a7a}
#st-body .bottom{display:grid;grid-template-columns:1.15fr 1fr;gap:18px;padding:14px 22px 6px;z-index:9}
#st-body .panel{position:relative;border:1px solid rgba(120,150,220,.35);border-radius:6px;overflow:hidden;background:linear-gradient(160deg,rgba(16,24,48,.92),rgba(6,9,20,.95));clip-path:polygon(0 0,100% 0,99% 100%,1% 100%);padding:14px 22px}
#st-body .ptitle{display:inline-block;font-family:'Permanent Marker',cursive;font-size:24px;letter-spacing:1px;padding-bottom:2px;border-bottom:3px solid #c01024;text-shadow:2px 2px 0 #000;margin-bottom:10px}
#st-body .namegrid{display:grid;grid-template-columns:120px 1fr 160px;gap:16px;align-items:stretch}
#st-body .sil{position:relative;background:linear-gradient(#0d1530,#070b18);border:1px solid rgba(120,150,220,.25)}
#st-body .jersey{position:relative;background:transparent}
#st-body .sil img{width:100%;height:100%;object-fit:cover}
#st-body .panel.np .npbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.85}
#st-body .panel.np::before{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(160deg,rgba(8,12,26,.78),rgba(5,8,18,.62))}
#st-body .panel.np>*:not(.npbg){position:relative;z-index:1}
#st-body .jersey .jtxt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;z-index:1;background:rgba(5,8,18,.35);border:1px solid rgba(120,150,220,.35)}
#st-body .jersey .jtxt b{font-family:'Anton','Rajdhani',sans-serif;font-size:17px;letter-spacing:3px;color:#cfe0ff;text-shadow:0 2px 6px #000}
#st-body .jersey .jtxt u{font-family:'Anton','Rajdhani',sans-serif;font-size:80px;text-decoration:none;text-shadow:0 0 16px rgba(120,170,255,.7),0 2px 6px #000}
#st-body .sil .fb{position:absolute;inset:0;display:none;align-items:flex-end;justify-content:center}
#st-body .sil .fb i{width:70%;height:80%;background:linear-gradient(#15203c,#0a101f);clip-path:polygon(38% 0,62% 0,66% 14%,86% 22%,92% 100%,8% 100%,14% 22%,34% 14%);opacity:.8}
#st-body .fields{display:flex;flex-direction:column;gap:6px;justify-content:center}
#st-body .frow{display:grid;grid-template-columns:118px 1fr;gap:10px;align-items:center}
#st-body .frow label{font-weight:800;letter-spacing:2px;font-size:13px;color:#aebadd}
#st-body .frow.rival label{color:#ff8a93}
#st-body .frow input{background:#0a0f1f;border:1px solid rgba(120,150,220,.4);color:#fff;font-family:inherit;font-weight:600;font-size:17px;letter-spacing:1px;padding:6px 12px;outline:none;clip-path:polygon(0 0,100% 0,99% 100%,1% 100%)}
#st-body .frow input:focus{border-color:#4f8dff;box-shadow:0 0 10px rgba(70,130,255,.4)}
#st-body .frow input::placeholder{color:#5b6890}
#st-body .startp{display:flex;flex-direction:column;justify-content:center;gap:6px}
#st-body .startart{position:absolute;right:0;top:0;bottom:0;width:42%;z-index:0}
#st-body .startp>*:not(.startart){position:relative;z-index:1}
#st-body .startart img{width:100%;height:100%;object-fit:cover;mask-image:linear-gradient(90deg,transparent,#000 35%);-webkit-mask-image:linear-gradient(90deg,transparent,#000 35%)}
#st-body .startart .fb{position:absolute;inset:0;display:none;background:linear-gradient(90deg,transparent,#2a1c08 40%),radial-gradient(60% 50% at 70% 80%,#ffb13c33,transparent)}
#st-body .skick{font-weight:800;letter-spacing:4px;color:#4f8dff;font-size:16px}
#st-body .sname{font-family:'Permanent Marker',cursive;font-size:52px;line-height:.95;text-shadow:3px 3px 0 #000,0 0 24px rgba(255,210,80,.35);white-space:nowrap}
#st-body .sname::after{content:'★';color:#ffce3c;font-size:.5em;margin-left:10px;text-shadow:0 0 14px #ffce3c}
#st-body .ssub{font-weight:700;letter-spacing:2px;font-size:14px;color:#cdd6ef;max-width:60%}
#st-body .startbtn{margin-top:6px;align-self:flex-start;display:flex;align-items:center;gap:14px;border:none;cursor:pointer;background:linear-gradient(180deg,#ffd96a,#d8a51f);color:#1a1404;font-family:inherit;font-style:italic;font-weight:800;font-size:28px;letter-spacing:2px;padding:9px 36px 9px 18px;clip-path:polygon(0 0,100% 0,96% 100%,4% 100%);box-shadow:0 0 26px -4px rgba(255,200,70,.8);transition:transform .12s}
#st-body .startbtn:active{transform:scale(.95)}
#st-body .startbtn .ball{width:36px;height:36px;border-radius:50%;background:#10101a;display:flex;align-items:center;justify-content:center;color:#ffd96a;font-size:19px}
/* ════ HUB + EDIT ════ */
#st-body .sv-hub{position:absolute;inset:0;overflow:hidden}
#st-body .hbg2{position:absolute;inset:0;background:url('assets/story/hub-bg.png') center/cover no-repeat,radial-gradient(95% 80% at 52% 30%,var(--bgA) 0%,var(--bgB) 45%,#070508 100%)}
#st-body .hbg2::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,3,6,.92) 0%,rgba(5,3,6,.55) 20%,transparent 38%,transparent 60%,rgba(5,3,6,.78) 78%,rgba(5,3,6,.94) 100%),linear-gradient(rgba(5,3,6,.35),transparent 25%,transparent 70%,rgba(5,3,6,.85))}
#st-body .sv-hub>.char.hubchar{position:absolute;left:560px;bottom:0;height:1010px;width:auto;max-width:560px;object-fit:contain;object-position:bottom;z-index:2;filter:drop-shadow(0 0 30px rgba(0,0,0,.85))}
#st-body .sv-hub>.char.fb.hubchar{left:620px;width:380px;height:900px}
#st-body .sv-hub>.char.fb i{width:330px;height:880px;background:radial-gradient(60% 24% at 50% 9%,#241620 0 30%,transparent 31%),linear-gradient(#2a161e,#120a10);clip-path:polygon(38% 0,62% 0,66% 11%,88% 18%,94% 100%,6% 100%,12% 18%,34% 11%);opacity:.9}
#st-body .sv-edit>.char.editchar{left:660px;height:980px}
#st-body .brand{position:absolute;left:44px;top:30px;z-index:5}
#st-body .brand h1{font-family:'Permanent Marker',cursive;font-size:56px;line-height:1;letter-spacing:1px;text-shadow:3px 3px 0 #000;margin:0}
#st-body .sv-hub:not(.sv-edit) .brand h1::after{content:'★';color:#ffce3c;font-size:.45em;margin-left:10px;vertical-align:middle;text-shadow:0 0 14px #ffce3c}
#st-body .brand .ul{width:300px;height:4px;background:linear-gradient(90deg,var(--ac),transparent);margin:10px 0 8px}
#st-body .brand .mode{font-weight:800;letter-spacing:4px;font-size:19px}
#st-body .brand .mode b{color:var(--ac2)}
#st-body .chapter{position:absolute;left:38px;top:160px;z-index:5;display:flex;gap:18px;align-items:flex-start;width:400px;padding:16px 18px;background:linear-gradient(160deg,rgba(8,6,12,.72),rgba(8,6,12,.45));backdrop-filter:blur(3px);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--ac);clip-path:polygon(0 0,100% 0,97% 100%,0 100%)}
#st-body .crest-big .uee img{filter:drop-shadow(0 6px 16px rgba(0,0,0,.8))}
#st-body .crest-big .uee .fb{display:none;font-size:64px}
#st-body .chapter .txt .cap{font-style:italic;font-weight:800;color:var(--ac2);letter-spacing:2px;font-size:18px}
#st-body .chapter .txt h2{font-family:'Permanent Marker',cursive;font-size:30px;line-height:1.05;margin:2px 0;text-shadow:2px 2px 0 #000}
#st-body .chapter .txt .dream{font-weight:800;letter-spacing:1px;color:var(--ac2);font-size:16px;margin-bottom:6px}
#st-body .chapter .txt p{font-weight:500;font-size:15px;line-height:1.35;color:#d9d3dc;margin:0}
#st-body .menu{position:absolute;left:38px;top:386px;z-index:5;display:flex;flex-direction:column;gap:14px;width:340px}
#st-body .mbtn{position:relative;display:flex;align-items:center;gap:16px;padding:14px 20px;border:1px solid rgba(255,255,255,.14);cursor:pointer;clip-path:polygon(2.5% 0,100% 0,97.5% 100%,0 100%);background:linear-gradient(160deg,rgba(28,22,30,.92),rgba(12,9,14,.95));transition:transform .12s}
#st-body .mbtn:active{transform:scale(.97)}
#st-body .mbtn.hot{background:linear-gradient(100deg,var(--deep) 0%,var(--deep2) 60%,var(--dark) 100%);border-color:var(--acL);box-shadow:0 0 24px -6px rgba(var(--glow),.8)}
#st-body .mbtn .ic{width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
#st-body .mbtn .tt b{display:block;font-style:italic;font-weight:800;font-size:23px;letter-spacing:1px;line-height:1}
#st-body .mbtn .tt span{font-weight:700;letter-spacing:2px;font-size:13px;color:#cfc6d4;opacity:.85}
#st-body .mbtn .tt span em{font-style:normal;color:#ffce3c}
#st-body .mbtn .chev{margin-left:auto;font-size:26px;font-weight:900}
#st-body .attrs{position:absolute;left:38px;top:716px;z-index:5;width:460px;display:flex;gap:18px;align-items:center;padding:14px 18px;background:linear-gradient(160deg,rgba(8,6,12,.72),rgba(8,6,12,.45));backdrop-filter:blur(3px);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--ac);clip-path:polygon(0 0,100% 0,97% 100%,0 100%)}
#st-body .attrs .lbl{position:absolute;top:-32px;left:0;font-style:italic;font-weight:800;color:var(--ac2);letter-spacing:3px;font-size:20px;text-shadow:0 2px 4px #000}
#st-body .radar{width:170px;height:170px;flex:none}
#st-body .radar .rfill{fill:rgba(var(--glow),.35);stroke:var(--ac);stroke-width:2;filter:drop-shadow(0 0 8px rgba(var(--glow),.7))}
#st-body .alist{display:flex;flex-direction:column;gap:9px;flex:1}
#st-body .arow{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:1px;font-size:15px}
#st-body .arow span{width:96px;color:#e8e2ec}
#st-body .abar{flex:1;height:7px;background:#241d28;position:relative}
#st-body .abar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--dark),var(--ac));box-shadow:0 0 8px rgba(var(--glow),.55)}
#st-body .arow b{width:30px;text-align:right;font-size:16px}
/* identity banner above the hero */
#st-body .ident2{position:absolute;left:560px;top:34px;z-index:5;width:560px;padding:16px 20px 14px;background:linear-gradient(160deg,rgba(8,6,12,.78),rgba(8,6,12,.5));backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--ac);clip-path:polygon(0 0,100% 0,97% 100%,0 100%)}
#st-body .ident2 .hname{font-family:'Permanent Marker',cursive;font-size:42px;line-height:1;text-shadow:3px 3px 0 #000,0 0 18px rgba(0,0,0,.9);white-space:nowrap}
#st-body .ident2 .rrow{display:flex;gap:12px;margin:10px 0 8px}
#st-body .ident2 .rolechip{font-style:italic;font-weight:800;font-size:19px;letter-spacing:1px;color:#fff;background:var(--deep);padding:4px 16px;clip-path:polygon(4% 0,100% 0,96% 100%,0 100%);text-shadow:0 1px 3px rgba(0,0,0,.8)}
#st-body .ident2 .clubchip{font-weight:800;font-size:17px;letter-spacing:2px;color:#fff;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.25);padding:4px 14px;clip-path:polygon(4% 0,100% 0,96% 100%,0 100%)}
#st-body .ident2 .row1{display:flex;align-items:baseline;gap:14px}
#st-body .ident2 .lv{font-style:italic;font-weight:800;font-size:22px;text-shadow:0 2px 4px #000}
#st-body .ident2 .lv b{font-family:'Anton','Rajdhani',sans-serif;font-size:44px;margin-left:6px;letter-spacing:2px}
#st-body .ident2 .exp{margin-left:auto;font-weight:800;letter-spacing:1px;font-size:18px;color:#fff;text-shadow:0 2px 4px #000}
#st-body .ident2 .exp i{font-style:italic;color:#cfc6d4;margin-right:10px}
#st-body .ident2 .expbar{margin:8px 0 10px}
#st-body .expav{cursor:pointer;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
#st-body .expav .t{font-style:italic;font-weight:800;color:#ffce3c;letter-spacing:2px;font-size:17px;text-shadow:0 2px 4px #000}
#st-body .expav .v{display:flex;align-items:center;gap:10px;font-family:'Anton','Rajdhani',sans-serif;font-size:34px;color:#ffce3c;text-shadow:0 0 16px rgba(255,200,60,.6),0 2px 4px #000}
#st-body .expav .chip{font-family:inherit;font-weight:800;font-size:13px;color:#1a1404;background:linear-gradient(180deg,#ffd96a,#d8a51f);padding:5px 9px;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
#st-body .expav .train{font-style:italic;font-weight:800;font-size:16px;letter-spacing:1px;color:#ffce3c;animation:stPulse 1.4s infinite;text-shadow:0 2px 4px #000}
@keyframes stPulse{50%{opacity:.45}}
#st-body .abrow{margin-top:12px;display:flex;gap:12px;align-items:flex-start}
#st-body .abrow .ic{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;font-size:18px;color:#ffce3c;border:2px solid #ffce3c;border-radius:50%;box-shadow:0 0 14px rgba(255,200,60,.5);background:rgba(0,0,0,.4)}
#st-body .abrow b{display:block;color:#ffce3c;font-weight:800;letter-spacing:1px;font-size:17px;text-shadow:0 2px 4px #000}
#st-body .abrow div span{font-weight:600;font-size:14px;line-height:1.3;color:#f0eaf3;text-shadow:0 2px 4px #000}
/* rival box bottom-left */
#st-body .rivbox{position:absolute;left:44px;top:928px;z-index:5;width:430px;display:flex;gap:14px;align-items:center;padding:10px 14px;background:linear-gradient(160deg,rgba(8,5,10,.85),rgba(8,5,10,.6));backdrop-filter:blur(3px);border:1px solid rgba(255,255,255,.18);border-left:4px solid var(--ac2);clip-path:polygon(0 0,100% 0,98% 100%,0 100%)}
#st-body .rivbox .st-face{width:54px;height:54px;flex:none}
#st-body .rivbox b{display:block;font-weight:800;font-size:18px;letter-spacing:1px;text-shadow:0 2px 4px #000}
#st-body .rivbox span{font-weight:700;font-size:14px;letter-spacing:1px;color:#e8e2ec;text-shadow:0 2px 4px #000}
#st-body .expbar{height:9px;background:#241d28;margin:8px 0 12px;position:relative}
#st-body .expbar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--dark),var(--ac2));box-shadow:0 0 10px rgba(var(--glow),.7)}
#st-body .tour{position:absolute;left:1180px;top:30px;width:710px;z-index:5;display:flex;flex-direction:column;max-height:736px}
#st-body .tour .head{display:flex;gap:16px;align-items:center;flex:none}
#st-body .tour .cup{font-size:38px;filter:drop-shadow(0 0 10px rgba(255,180,40,.6))}
#st-body .tour h2{font-style:italic;font-weight:800;font-size:28px;letter-spacing:1px;line-height:1;margin:0}
#st-body .tour .sub{font-weight:800;letter-spacing:2px;font-size:14px;color:#cfc6d4;margin-top:3px}
#st-body .lastft{flex:none;margin-top:10px;display:flex;align-items:center;gap:8px;font-weight:800;letter-spacing:1px;font-size:16px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);padding:7px 12px}
#st-body .lastft em{font-style:normal;color:#ffce3c}
#st-body .brk{margin-top:12px;position:relative;padding-left:26px;overflow-y:auto;min-height:0}
#st-body .brk::before{content:'';position:absolute;left:8px;top:10px;bottom:10px;width:2px;background:rgba(255,255,255,.25)}
#st-body .brk.tblwrap{padding-left:0}
#st-body .brk.tblwrap::before{display:none}
#st-body .stagelbl{font-weight:800;letter-spacing:2px;font-size:15px;color:#e8e2ec;margin:10px 0 6px}
#st-body .mrow{position:relative;display:grid;grid-template-columns:42px 1fr 110px 1fr 42px;align-items:center;gap:8px;height:44px;margin-bottom:7px;padding:0 10px;background:linear-gradient(100deg,rgba(24,19,27,.92),rgba(11,8,13,.94));border:1px solid rgba(255,255,255,.12);clip-path:polygon(1% 0,100% 0,99% 100%,0 100%)}
#st-body .mrow .tn{font-weight:800;letter-spacing:1px;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#st-body .mrow .tn.r{text-align:right}
#st-body .mrow .sc{text-align:center;font-family:'Anton','Rajdhani',sans-serif;font-size:20px;letter-spacing:2px}
#st-body .mrow .sc i{font-size:12px;color:#cfc6d4}
#st-body .mrow .sc.vs{font-family:inherit;font-style:italic;font-weight:800;color:#b9aec2;font-size:17px}
#st-body .mrow.me{border-color:rgba(var(--glow),.6)}
#st-body .mrow.win{background:linear-gradient(100deg,var(--deep) 0%,var(--deep2) 45%,rgba(11,8,13,.94) 100%);border-color:var(--acL)}
#st-body .mrow.up.me{box-shadow:0 0 14px -4px rgba(var(--glow),.8)}
#st-body .epil{font-weight:600;font-size:18px;line-height:1.4;color:#e8e2ec;padding:10px 4px}
#st-body .sv-tbl{width:100%;border-collapse:collapse;font-size:16px}
#st-body .sv-tbl th{font-weight:800;letter-spacing:1px;font-size:13px;color:#b9aec2;text-align:center;padding:4px 4px;border-bottom:1px solid rgba(255,255,255,.2);position:sticky;top:0;background:#0d0a10}
#st-body .sv-tbl th:nth-child(2){text-align:left}
#st-body .sv-tbl td{padding:3px 4px;text-align:center;font-weight:700;border-bottom:1px solid rgba(255,255,255,.08)}
#st-body .sv-tbl td.tt{display:flex;align-items:center;gap:8px;text-align:left;font-weight:800;white-space:nowrap}
#st-body .sv-tbl td.ps{color:#b9aec2}
#st-body .sv-tbl td.pt{font-family:'Anton','Rajdhani',sans-serif;font-size:17px}
#st-body .sv-tbl tr.me td{background:rgba(var(--glow),.18);color:#fff}
#st-body .next{position:absolute;left:1180px;top:782px;width:710px;height:250px;z-index:5;border:1px solid rgba(255,180,60,.4);clip-path:polygon(.6% 0,100% 0,99.4% 100%,0 100%);overflow:hidden;background:url('assets/story/vs-pitch.png') center/cover no-repeat,linear-gradient(160deg,#141826,#090b14)}
#st-body .next::before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(6,8,16,.55),rgba(6,8,16,.8))}
#st-body .next>*{position:relative;z-index:1}
#st-body .next .top{display:flex;justify-content:space-between;align-items:center;padding:12px 22px 0}
#st-body .next .pp{font-style:italic;font-weight:800;color:var(--ac2);letter-spacing:2px;font-size:20px}
#st-body .next .st2{font-weight:800;letter-spacing:2px;font-size:16px}
#st-body .next .vsrow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:4px 60px 0;text-align:center}
#st-body .next .tcol{display:flex;flex-direction:column;align-items:center;gap:4px}
#st-body .next .tcol .uee img{filter:drop-shadow(0 6px 14px rgba(0,0,0,.8))}
#st-body .next .tcol b{font-weight:800;letter-spacing:1px;font-size:19px}
#st-body .next .bigvs{font-family:'Permanent Marker',cursive;font-size:56px;color:#ffce3c;text-shadow:3px 3px 0 #000,0 0 22px rgba(255,200,60,.7);transform:rotate(-4deg)}
#st-body .next .btns{position:absolute;left:0;right:0;bottom:0;display:flex;border-top:1px solid rgba(255,255,255,.15)}
#st-body .next .btns button{flex:1;border:none;cursor:pointer;font-family:inherit;font-style:italic;font-weight:800;letter-spacing:2px;font-size:19px;padding:11px 6px;color:#fff;border-right:1px solid rgba(255,255,255,.12)}
#st-body .next .btns button:last-child{border-right:none}
#st-body .next .btns .st-play{background:linear-gradient(180deg,var(--ac),var(--deep2));text-shadow:0 1px 2px rgba(0,0,0,.5)}
#st-body .next .btns .st-sim{background:rgba(10,8,14,.85)}
#st-body .next .btns .st-sim.dev{color:#ffce3c}
#st-body .next .nofx{padding:34px 22px 0;font-style:italic;font-weight:800;font-size:22px;letter-spacing:1px;color:#cfc6d4;text-align:center}
#st-body .next.done .champname{font-family:'Permanent Marker',cursive;font-size:44px;text-align:center;padding-top:26px;text-shadow:3px 3px 0 #000,0 0 24px rgba(255,200,60,.6)}
#st-body .foot{position:absolute;left:0;right:0;bottom:0;height:50px;display:flex;gap:40px;align-items:center;padding:0 30px;font-weight:700;letter-spacing:2px;font-size:16px;color:#dfe6f5;background:linear-gradient(transparent,rgba(0,0,0,.7));z-index:6}
#st-body .glyph{display:inline-flex;width:26px;height:26px;border-radius:50%;border:2px solid currentColor;align-items:center;justify-content:center;margin-right:9px;font-size:14px;font-weight:900}
#st-body .g-x{color:#7ea0ff}#st-body .g-o{color:#ff5b66}
#st-body .sep{opacity:.3}
#st-body .delstory{margin-left:auto;background:none;border:1px solid rgba(255,90,100,.5);color:#ff8a93;font-family:inherit;font-weight:800;letter-spacing:2px;font-size:14px;padding:7px 16px;cursor:pointer;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%)}
/* edit view */
#st-body .ident{position:absolute;left:44px;top:230px;z-index:5;width:400px}
#st-body .ident .nm{font-family:'Permanent Marker',cursive;font-size:42px;line-height:1;text-shadow:2px 2px 0 #000}
#st-body .ident .rl{display:inline-block;margin-top:12px;font-style:italic;font-weight:800;font-size:21px;letter-spacing:1px;background:var(--deep);padding:6px 20px;clip-path:polygon(4% 0,100% 0,96% 100%,0 100%)}
#st-body .ident .lvrow{margin-top:24px}
#st-body .ident .lv2{font-style:italic;font-weight:800;font-size:24px}
#st-body .ident .lv2 b{font-family:'Anton','Rajdhani',sans-serif;font-size:48px;margin-left:6px}
#st-body .ident .expbar{width:340px;margin:10px 0 6px}
#st-body .ident .expt{font-weight:800;letter-spacing:1px;font-size:16px;color:#cfc6d4}
#st-body .pool{position:absolute;left:44px;top:520px;z-index:5}
#st-body .pool .t{font-style:italic;font-weight:800;color:#ffce3c;letter-spacing:2px;font-size:21px}
#st-body .pool .v{display:flex;align-items:center;gap:14px;font-family:'Anton','Rajdhani',sans-serif;font-size:60px;color:#ffce3c;text-shadow:0 0 18px rgba(255,200,60,.55)}
#st-body .pool .chip{font-family:inherit;font-weight:800;font-size:15px;color:#1a1404;background:linear-gradient(180deg,#ffd96a,#d8a51f);padding:7px 11px;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
#st-body .pool .cost{margin-top:8px;font-weight:700;letter-spacing:1px;font-size:15px;color:#b9aec2}
#st-body .pool .cost b{color:#ffce3c}
#st-body .backbtn{position:absolute;left:44px;top:920px;z-index:5;display:flex;align-items:center;gap:14px;padding:14px 24px;width:300px;border:1px solid rgba(255,255,255,.16);cursor:pointer;clip-path:polygon(2.5% 0,100% 0,97.5% 100%,0 100%);background:linear-gradient(160deg,rgba(28,22,30,.92),rgba(12,9,14,.95))}
#st-body .backbtn:active{transform:scale(.97)}
#st-body .backbtn b{font-style:italic;font-weight:800;font-size:22px;letter-spacing:1px;display:block}
#st-body .backbtn span:not(:first-child),#st-body .backbtn div span{font-weight:700;letter-spacing:2px;font-size:12px;color:#cfc6d4;display:block}
#st-body .editp{position:absolute;left:1080px;top:130px;width:800px;z-index:5}
#st-body .editp .et{font-style:italic;font-weight:800;font-size:38px;letter-spacing:1px}
#st-body .editp .es{font-weight:800;letter-spacing:3px;font-size:15px;color:var(--ac2);margin-bottom:18px}
#st-body .erow{display:grid;grid-template-columns:170px 1fr 90px 56px 56px;align-items:center;gap:14px;height:84px;margin-bottom:14px;padding:0 20px;background:linear-gradient(100deg,rgba(22,18,26,.94),rgba(10,8,13,.95));border:1px solid rgba(255,255,255,.12);clip-path:polygon(.8% 0,100% 0,99.2% 100%,0 100%)}
#st-body .erow>span{font-weight:800;letter-spacing:1px;font-size:21px}
#st-body .ebar{height:9px;background:#241d28;position:relative}
#st-body .ebar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--dark),var(--ac));box-shadow:0 0 8px rgba(var(--glow),.55);transition:width .15s}
#st-body .ebar u{position:absolute;inset:0 auto 0 0;background:rgba(255,206,60,.85);mix-blend-mode:screen;transition:width .15s,left .15s}
#st-body .erow .val{font-family:'Anton','Rajdhani',sans-serif;font-size:28px;text-align:right}
#st-body .erow .val em{font-style:normal;color:#ffce3c;font-size:22px;margin-left:4px}
#st-body .ebtn{width:52px;height:52px;border:none;cursor:pointer;font-family:'Anton','Rajdhani',sans-serif;font-size:26px;color:#fff;clip-path:polygon(12% 0,88% 0,100% 50%,88% 100%,12% 100%,0 50%);background:linear-gradient(180deg,#2c2433,#16111c);border:1px solid rgba(255,255,255,.2);transition:transform .1s}
#st-body .ebtn.plus{background:linear-gradient(180deg,var(--ac),var(--deep2));box-shadow:0 0 14px -2px rgba(var(--glow),.8)}
#st-body .ebtn:disabled{opacity:.22;cursor:default}
#st-body .ebtn:not(:disabled):active{transform:scale(.88)}
#st-body .cbar{display:flex;gap:18px;margin-top:18px}
#st-body .cbtn{flex:none;display:flex;align-items:center;gap:12px;border:none;cursor:pointer;font-family:inherit;font-style:italic;font-weight:800;font-size:26px;letter-spacing:2px;padding:12px 36px;clip-path:polygon(3% 0,100% 0,97% 100%,0 100%)}
#st-body .cbtn.ok{background:linear-gradient(180deg,#ffd96a,#d8a51f);color:#1a1404;box-shadow:0 0 24px -4px rgba(255,200,70,.8)}
#st-body .cbtn.rst{background:linear-gradient(160deg,rgba(28,22,30,.95),rgba(12,9,14,.95));color:#fff;border:1px solid rgba(255,255,255,.25)}
#st-body .cbtn:active{transform:scale(.95)}
#st-body .cbtn:disabled{opacity:.35;cursor:default;transform:none}
#st-body .editp .note{margin-top:14px;font-weight:700;letter-spacing:1px;font-size:14px;color:#b9aec2}
`;
  document.head.appendChild(s);
}
stInjectCss();
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
