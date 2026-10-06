/* ============================================================
   ULT11-ULTRA  ·  Ultimate Eleven                         2026-10-02
   The ULTRA SHOT meter: one per team, filled by what the team does well,
   spent by the CAPTAIN once per match on a shot that cannot be stopped.
   Roadmap: ULTRA-SHOT-ROADMAP.md (phases 0-4 live here + in game.js;
   the cinematic is ult11-ultrafx.js + the `ultra` hooks in cine3 / pitch3d).

   Rules (author's roadmap):  captain only · meter full · once per match ·
   unstoppable.  The meter never drains on its own; a lost ball takes 1 off.

   API  window.U11_ULTRA
     add(side,type)         a team earns (or loses) points. types below.
     duel({as,ds,win,...})  called once per duel verdict from game.js resDuel.
     canFire(side,key)      meter full + not used + `key` is the captain's slot.
     reason(side,key)       why not (text for the ticker), or '' when it can.
     consume(side)          at COMMIT: locks the meter ('USED'); never refunded.
     cpuWants(side)         the AI captain's decision (symmetric: both teams).
     reset() / flush()      match start / match end (telemetry).
     tele()                 telemetry summary + suggested MAX (1.3 x average).
   ============================================================ */
(function(){
'use strict';
const U=window.U11_ULTRA={};

/* ── tunables (author: "ULTRA_MAX = 100 placeholder - set from real numbers") ── */
U.MAX=60;                 // four real matches: two no fills, one CPU only, one both; retune with stored telemetry
U.GAIN={pass:1, intercept:2, dribble:3, tackle:3, shotOT:3, save:4, lost:-1};
U.RANGE=0.68;                // how close to goal the captain must be (progress 0..1; the box edge is ~0.82)
U.CPU_CHANCE=0.6;            // per decision, once the CPU captain is ready and in range
U.TEST_FRISINA=true;         // TEMP PLAYTEST: home Frisina may fire immediately and repeatedly; remove after visual tuning

const sides=['h','a'];
const fresh=()=>({h:0,a:0});
U.meter=fresh(); U.used={h:false,a:false}; U.raw=fresh(); U.peak=fresh();
U.counts={h:{},a:{}}; U.fullAt={h:null,a:null}; U.firedAt={h:null,a:null};
const KEY='u11_ultra_tele_v1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const say=t=>{ try{ if(typeof window.say==='function') window.say(t); }catch(e){} };
const GG=()=>{ try{ return (typeof G!=='undefined')?G:null; }catch(e){ return null; } };      // G is a script-scope `let` in game.js, not a window property
const clockNow=()=>{ try{ const t=(document.getElementById('htime')||{}).textContent||''; const g=GG(); return {half:(g&&g.half)||1,clock:t}; }catch(e){ return null; } };
const dbg=m=>{ try{ if(window.U11DBG) U11DBG('[ULTRA] '+m); }catch(e){} };

U.reset=function(){
  U.meter=fresh(); U.used={h:false,a:false}; U.raw=fresh(); U.peak=fresh();
  U.counts={h:{},a:{}}; U.fullAt={h:null,a:null}; U.firedAt={h:null,a:null}; U._cpuAt=0; U.testFires=0;
  hud();
};

U.add=function(side,type){
  if(side!=='h'&&side!=='a') return;
  const c=U.counts[side]; c[type]=(c[type]||0)+1;
  const g=U.GAIN[type]; if(g==null) return;
  U.raw[side]+=g;                                   // what the match produced (telemetry, even after USED)
  if(U.used[side]) return;
  const was=U.meter[side];
  U.meter[side]=clamp(was+g,0,U.MAX);
  if(U.meter[side]>U.peak[side]) U.peak[side]=U.meter[side];
  if(was<U.MAX&&U.meter[side]>=U.MAX&&!U.fullAt[side]){
    U.fullAt[side]=clockNow(); dbg(side+' meter FULL at '+JSON.stringify(U.fullAt[side]));
    const name=captainName(side);
    say('⚡ ULTRA SHOT ready'+(name?' — '+name+' (captain)':'')+'!');
    try{ if(window.U11_ULTRAFX&&U11_ULTRAFX.sfx) U11_ULTRAFX.sfx('ready'); }catch(e){}
  }
  hud();
};

/* one call per duel verdict (game.js resDuel): what each side did in it */
U.duel=function(o){
  if(!o||o.foul) return;
  const base=s=>String(s||'').replace(/^super-/,'');
  const ak=base(o.ak), da=base(o.defA), as=o.as, ds=o.ds;
  if(o.isShot){                                          // a shot that reached the keeper = ON TARGET
    if(ak==='shoot'||ak==='special') U.add(as,'shotOT');
    if(!o.win&&(da==='save'||da==='punch'||da==='supersave')) U.add(ds,'save');
    return;
  }
  if(o.win){                                             // the attacker came out on top
    if(ak==='dribble') U.add(as,'dribble');
    return;                                              // (a won pass / shot duel is counted when the pass lands / the shot is on target)
  }
  U.add(as,'lost');                                      // the carrier lost the ball
  if(da==='tackle') U.add(ds,'tackle');
  else if(da==='intercept') U.add(ds,'intercept');
  else if(da==='block') U.add(ds,'block');               // counted for telemetry; no points in the table
};

/* ── captain + firing rules ── */
function captainKey(side){ try{ return (window.U11Talk&&U11Talk.captainOf)?U11Talk.captainOf(side):null; }catch(e){ return null; } }
function captainName(side){ try{ const k=captainKey(side), p=k&&sq(side)[k]; return p?String(p.name||'').split('.').pop():''; }catch(e){ return ''; } }
U.captainKey=captainKey; U.captainName=captainName;
function testFrisina(side,key){
  try{ const p=U.TEST_FRISINA&&side==='h'&&key&&sq(side)[key]; return !!(p&&String(p.name||'').split('.').pop().toLowerCase()==='frisina'); }catch(e){ return false; }
}
function testTeam(side){ try{ return U.TEST_FRISINA&&side==='h'&&Object.keys(sq(side)).some(k=>testFrisina(side,k)); }catch(e){ return false; } }
U.testFrisina=testFrisina;

U.reason=function(side,key){
  if(testFrisina(side,key)) return '';
  if(testTeam(side)) return 'Frisina test Ultra — get Frisina the ball';
  if(U.used[side]) return 'Ultra Shot already used this match';
  if(U.meter[side]<U.MAX) return 'Ultra meter '+U.meter[side]+' / '+U.MAX;
  const ck=captainKey(side);
  if(!key||key!==ck) return 'Only the captain'+(captainName(side)?' ('+captainName(side)+')':'')+' can fire Ultra — get him the ball';
  return '';
};
U.canFire=function(side,key){ return !U.reason(side,key); };
U.consume=function(side){
  if(testFrisina(side,GG()&&GG().ck)){
    U.firedAt[side]=clockNow(); U.testFires=(U.testFires||0)+1;
    dbg('Frisina test Ultra fired #'+U.testFires); hud(); return;
  }
  U.used[side]=true; U.firedAt[side]=clockNow(); U.meter[side]=U.MAX;
  dbg(side+' FIRED at '+JSON.stringify(U.firedAt[side])+' · counts '+JSON.stringify(U.counts[side])); hud();
};
U.cpuWants=function(side){
  try{
    const g=GG(); if(!g||!U.canFire(side,g.ck)) return false;
    if(Date.now()<(U._cpuAt||0)) return false;
    U._cpuAt=Date.now()+4000;                         // one coin-flip per few seconds, not per frame
    return Math.random()<U.CPU_CHANCE;
  }catch(e){ return false; }
};

/* ── telemetry (phase 0): every match's totals, kept across sessions ── */
function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
U.flush=function(){
  try{
    const any=sides.some(s=>Object.keys(U.counts[s]).length);
    if(!any) return;
    const rec={t:Date.now(),max:U.MAX,
      h:{raw:U.raw.h,peak:U.peak.h,counts:U.counts.h,fullAt:U.fullAt.h,firedAt:U.firedAt.h},
      a:{raw:U.raw.a,peak:U.peak.a,counts:U.counts.a,fullAt:U.fullAt.a,firedAt:U.firedAt.a},
      score:(GG()?[GG().hG,GG().aG]:null)};
    const all=load(); all.push(rec); while(all.length>40) all.shift();
    localStorage.setItem(KEY,JSON.stringify(all));
    dbg('match saved · net points h '+rec.h.raw+' a '+rec.a.raw+' · peak h '+rec.h.peak+' a '+rec.a.peak);
  }catch(e){}
};
U.tele=function(){
  const all=load(), n=all.length;
  if(!n) return {matches:0,note:'play a match with ?debug=1, then call U11_ULTRA.tele()'};
  const per=[]; all.forEach(m=>{ per.push(m.h.raw,m.a.raw); });
  const avg=per.reduce((a,b)=>a+b,0)/per.length;
  const full=all.reduce((c,m)=>c+(m.h.fullAt?1:0)+(m.a.fullAt?1:0),0);
  return {matches:n,teamMatches:per.length,avgNetPointsPerTeamMatch:+avg.toFixed(1),min:Math.min(...per),max:Math.max(...per),
    currentMax:U.MAX,suggestedMax:Math.round(avg*1.3),metersThatFilled:full+' of '+per.length,
    last:all[n-1]};
};
U.clearTele=function(){ try{ localStorage.removeItem(KEY); }catch(e){} };

/* ── HUD: a skewed bar under each team banner (home left, away right) ── */
let el=null;
function css(){
  if(document.getElementById('ultra-css')) return;
  const st=document.createElement('style'); st.id='ultra-css';
  st.textContent=`
#ultra-hud{position:absolute;left:0;right:0;top:100%;height:16px;margin-top:8px;pointer-events:none;z-index:1}
#ultra-hud .ub{position:absolute;top:0;width:120px;height:14px;box-sizing:border-box;background:rgba(2,8,20,.82);border:1px solid rgba(255,255,255,.25);clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%)}
#ultra-hud .ub.h{left:0}
#ultra-hud .ub.a{right:0;transform:scaleX(-1)}
#ultra-hud .ub i{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);transition:transform .35s ease-out;background:linear-gradient(90deg,#1e72dc,#8fc6ff)}
#ultra-hud .ub.a i{background:linear-gradient(90deg,#c22020,#ff9a8a)}
#ultra-hud .ub span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 9px/1 var(--u-font-ui,'Rajdhani',sans-serif);letter-spacing:.12em;color:#fff;text-shadow:0 1px 1px #000;white-space:nowrap}
#ultra-hud .ub.a span{transform:scaleX(-1)}
#ultra-hud .ub.full{border-color:#ffd24a;animation:ultraPulse .7s ease-in-out infinite alternate}
#ultra-hud .ub.full i{background:linear-gradient(90deg,#ffb020,#fff2a8)}
#ultra-hud .ub.full span{color:#2a1500;text-shadow:none}
#ultra-hud .ub.used{opacity:.5;filter:grayscale(1)}
#ultra-hud .ub.h.full{pointer-events:auto;cursor:pointer}
@keyframes ultraPulse{from{box-shadow:0 0 5px #ffb020}to{box-shadow:0 0 16px #ffd24a}}
@media(prefers-reduced-motion:reduce){#ultra-hud .ub.full{animation:none}}`;
  document.head.appendChild(st);
}
function build(){
  const host=document.querySelector('#s-match .mhud'); if(!host) return false;
  if(el&&el.isConnected) return true;
  css();
  el=document.createElement('div'); el.id='ultra-hud';
  el.innerHTML='<div class="ub h" title="Ultra Shot — your captain, once per match"><i></i><span>ULTRA</span></div><div class="ub a" title="Opponent Ultra meter"><i></i><span>ULTRA</span></div>';
  host.appendChild(el);
  el.querySelector('.ub.h').addEventListener('click',()=>{ try{ if(typeof actUltra==='function') actUltra(); }catch(e){} });
  return true;
}
function hud(){
  if(!build()) return;
  sides.forEach(s=>{
    const b=el.querySelector('.ub.'+s), f=b.firstElementChild, t=b.lastElementChild;
    const test=testTeam(s), m=test?U.MAX:U.meter[s], full=test||(m>=U.MAX&&!U.used[s]);
    f.style.transform='scaleX('+(m/U.MAX).toFixed(3)+')';
    b.classList.toggle('full',full); b.classList.toggle('used',U.used[s]&&!test);
    t.textContent=test?'FRISINA TEST · U':U.used[s]?'ULTRA USED':full?(s==='h'?'ULTRA READY · U':'ULTRA READY'):'ULTRA';
  });
}
U.hud=hud;
document.addEventListener('DOMContentLoaded',()=>{ try{ hud(); }catch(e){} });
})();
