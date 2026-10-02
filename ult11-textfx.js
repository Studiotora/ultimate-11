/* ============================================================
   ULT11-TEXTFX  ·  Ultimate Eleven   (author 2026-10-01)
   A small text-motion engine for every title in the game, inspired by
   the motion vocabulary of TRPG cut-in tools (our own code): a word is
   split into letters and gets an IN, a HOLD and an OUT.
     IN   per letter: fade rise drop converge slide tracking spread blur
                      pop shrink flip spin bounce typewriter glitch
          whole word: slam zoom wipe flash
          order: start | end | center | edges | random · ease · strength
     HOLD float wave heartbeat glow tremble (looped until the OUT)
     OUT  per letter: fade float sink scatter blur shrink
          whole word: zoom wipe recede
   House style only: the fonts are set by the caller's CSS (Cinzel /
   Rajdhani / Bold Pixel). Web Animations API, no library.
   API: U11TextFX.play(el, text, spec) -> {done:Promise, out(), cancel()}
        spec = {in:{fx,dur,stagger,order,ease,str}, hold:{fx,dur}, out:{fx,dur,stagger,order,ease}}
        U11TextFX.matchIntro(opts) -> Promise   (the first use: before kick-off)
   ============================================================ */
(function(){
'use strict';
const FX={};
window.U11TextFX=FX;

const EASE={ out:'cubic-bezier(.2,.8,.2,1)', strong:'cubic-bezier(.08,.9,.1,1)', smooth:'cubic-bezier(.45,0,.2,1)',
  back:'cubic-bezier(.34,1.56,.64,1)', linear:'linear', in:'cubic-bezier(.6,0,.9,.4)' };
const rnd=(a,b)=>a+Math.random()*(b-a);

/* letters -> spans (a space keeps its width) */
function split(el,text){
  el.textContent=''; const out=[];
  for(const ch of String(text)){
    const s=document.createElement('span'); s.className='tfx-c';
    s.style.display='inline-block'; s.style.whiteSpace='pre'; s.style.willChange='transform,opacity,filter';
    s.textContent=ch===' '?' ':ch; el.appendChild(s); out.push(s);
  }
  return out;
}
/* the start delay rank of letter i for an order */
function rank(n,order){
  const idx=[...Array(n).keys()], c=(n-1)/2;
  if(order==='end') return idx.map(i=>n-1-i);
  if(order==='center'){ const d=idx.map(i=>Math.abs(i-c)); return d.map(v=>Math.round(v*2)/2); }
  if(order==='edges'){ const d=idx.map(i=>c-Math.abs(i-c)); return d.map(v=>Math.round(v*2)/2); }
  if(order==='random'){ const r=idx.slice().sort(()=>Math.random()-.5); const out=[]; r.forEach((v,k)=>out[v]=k); return out; }
  return idx;
}
/* per-letter IN keyframes: [from, to] - "to" is always the resting letter */
function inFrames(fx,i,n,s){
  const c=(n-1)/2, off=i-c, em=v=>v.toFixed(3)+'em';
  switch(fx){
    case 'rise':     return [{transform:'translateY('+em(.65*s)+')',opacity:0},{transform:'none',opacity:1}];
    case 'drop':     return [{transform:'translateY('+em(-.9*s)+')',opacity:0},{transform:'none',opacity:1}];
    case 'converge': return [{transform:'translateX('+em(off*.7*s)+')',opacity:0},{transform:'none',opacity:1}];
    case 'slide':    return [{transform:'translateX('+em(-1.4*s)+')',opacity:0},{transform:'none',opacity:1}];
    case 'slideR':   return [{transform:'translateX('+em(1.4*s)+')',opacity:0},{transform:'none',opacity:1}];
    case 'tracking': return [{transform:'translateX('+em(off*.45*s)+')',opacity:0,filter:'blur(6px)'},{transform:'none',opacity:1,filter:'blur(0)'}];
    case 'spread':   return [{transform:'translateX('+em(-off*.9*s)+') scale(.6)',opacity:0},{transform:'none',opacity:1}];
    case 'blur':     return [{opacity:0,filter:'blur('+(12*s)+'px)'},{opacity:1,filter:'blur(0)'}];
    case 'pop':      return [{transform:'scale(0)',opacity:0},{transform:'scale(1.25)',opacity:1,offset:.7},{transform:'none',opacity:1}];
    case 'shrink':   return [{transform:'scale('+(1+2*s)+')',opacity:0,filter:'blur(4px)'},{transform:'none',opacity:1,filter:'blur(0)'}];
    case 'flip':     return [{transform:'perspective(400px) rotateX(95deg)',opacity:0},{transform:'none',opacity:1}];
    case 'spin':     return [{transform:'rotate(-200deg) scale(.2)',opacity:0},{transform:'none',opacity:1}];
    case 'bounce':   return [{transform:'translateY('+em(-1.1*s)+')',opacity:0},{transform:'none',opacity:1,offset:.45},
                             {transform:'translateY('+em(-.28*s)+')',offset:.68},{transform:'none',offset:.84},{transform:'translateY('+em(-.07*s)+')',offset:.93},{transform:'none',opacity:1}];
    case 'typewriter': return [{opacity:0},{opacity:0,offset:.49},{opacity:1,offset:.5},{opacity:1}];
    case 'glitch':   return [{opacity:0,transform:'translate('+em(rnd(-.3,.3))+','+em(rnd(-.2,.2))+')'},{opacity:1,offset:.2,transform:'translate('+em(rnd(-.15,.15))+',0)'},
                             {opacity:.2,offset:.4},{opacity:1,offset:.55,transform:'translate('+em(rnd(-.08,.08))+',0)'},{opacity:1,transform:'none'}];
    default:         return [{opacity:0},{opacity:1}];
  }
}
/* whole-word IN, on the container */
function wordIn(fx,s){
  switch(fx){
    case 'slam':  return [{transform:'scale('+(1+2.2*s)+')',opacity:0,filter:'blur(8px)'},{transform:'scale(.94)',opacity:1,filter:'blur(0)',offset:.6},{transform:'none',opacity:1}];
    case 'zoom':  return [{transform:'scale(.25)',opacity:0},{transform:'none',opacity:1}];
    case 'wipe':  return [{clipPath:'inset(-20% 100% -20% 0)'},{clipPath:'inset(-20% 0 -20% 0)'}];
    case 'flash': return [{opacity:0,filter:'brightness(5) blur(3px)'},{opacity:1,filter:'brightness(2.2)',offset:.3},{opacity:1,filter:'brightness(1)'}];
    default:      return [{opacity:0},{opacity:1}];
  }
}
/* per-letter OUT keyframes: [resting, gone] */
function outFrames(fx,i,n,s){
  const em=v=>v.toFixed(3)+'em';
  switch(fx){
    case 'float':   return [{transform:'none',opacity:1},{transform:'translateY('+em(-.7*s)+')',opacity:0}];
    case 'sink':    return [{transform:'none',opacity:1},{transform:'translateY('+em(.7*s)+')',opacity:0}];
    case 'scatter': return [{transform:'none',opacity:1},{transform:'translate('+em(rnd(-1.6,1.6)*s)+','+em(rnd(-1.2,1.2)*s)+') rotate('+rnd(-120,120).toFixed(0)+'deg) scale(.4)',opacity:0}];
    case 'blur':    return [{opacity:1,filter:'blur(0)'},{opacity:0,filter:'blur('+(12*s)+'px)'}];
    case 'shrink':  return [{transform:'none',opacity:1},{transform:'scale(0)',opacity:0}];
    default:        return [{opacity:1},{opacity:0}];
  }
}
function wordOut(fx,s){
  switch(fx){
    case 'zoom':   return [{transform:'none',opacity:1,filter:'blur(0)'},{transform:'scale('+(1+1.6*s)+')',opacity:0,filter:'blur(6px)'}];
    case 'wipe':   return [{clipPath:'inset(-20% 0 -20% 0)'},{clipPath:'inset(-20% 0 -20% 100%)'}];
    case 'recede': return [{transform:'none',opacity:1},{transform:'scale(.55)',opacity:0}];
    default:       return [{opacity:1},{opacity:0}];
  }
}
const WHOLE_IN={slam:1,zoom:1,wipe:1,flash:1}, WHOLE_OUT={zoom:1,wipe:1,recede:1};

/* HOLD: loops until the OUT starts */
function hold(fx,el,chars){
  const L=[];
  const loop=(t,kf,dur,delay)=>{ L.push(t.animate(kf,{duration:dur,iterations:Infinity,delay:delay||0,easing:'ease-in-out',composite:'add'})); };
  if(fx==='float') loop(el,[{transform:'translateY(0)'},{transform:'translateY(-.05em)'},{transform:'translateY(0)'}],2200);
  else if(fx==='wave') chars.forEach((c,i)=>loop(c,[{transform:'translateY(0)'},{transform:'translateY(-.09em)'},{transform:'translateY(0)'}],1300,-i*110));
  else if(fx==='heartbeat') loop(el,[{transform:'scale(1)'},{transform:'scale(1.07)',offset:.12},{transform:'scale(1)',offset:.26},{transform:'scale(1.04)',offset:.38},{transform:'scale(1)',offset:.55},{transform:'scale(1)'}],1100);
  else if(fx==='tremble') loop(el,[{transform:'translate(0,0)'},{transform:'translate(.012em,-.01em)'},{transform:'translate(-.012em,.01em)'},{transform:'translate(0,0)'}],180);
  else if(fx==='glow') L.push(el.animate([{filter:'brightness(1)'},{filter:'brightness(1.35)'},{filter:'brightness(1)'}],{duration:1400,iterations:Infinity,easing:'ease-in-out'}));
  return L;
}

/* play one word: in -> hold -> out (out on its own timer if hold.dur is set, else on .out()) */
FX.play=function(el,text,spec){
  spec=spec||{}; const I=Object.assign({fx:'fade',dur:420,stagger:45,order:'start',ease:'out',str:1},spec.in||{});
  const Hd=Object.assign({fx:'none',dur:null},spec.hold||{}), O=Object.assign({fx:'fade',dur:320,stagger:25,order:'start',ease:'in',str:1},spec.out||{});
  const chars=split(el,text), n=chars.length, anims=[]; let holds=[], cancelled=false, outP=null, resolveDone;
  const done=new Promise(r=>resolveDone=r);
  // IN
  let inEnd=0;
  if(WHOLE_IN[I.fx]){ anims.push(el.animate(wordIn(I.fx,I.str),{duration:I.dur,easing:EASE[I.ease]||I.ease,fill:'backwards'})); inEnd=I.dur; }
  else { const rk=rank(n,I.order);
    chars.forEach((c,i)=>{ const d=rk[i]*I.stagger; inEnd=Math.max(inEnd,d+I.dur);
      anims.push(c.animate(inFrames(I.fx,i,n,I.str),{duration:I.dur,delay:d,easing:EASE[I.ease]||I.ease,fill:'backwards'})); }); }
  const tHold=setTimeout(()=>{ if(!cancelled&&Hd.fx!=='none') holds=hold(Hd.fx,el,chars); },inEnd);
  const out=()=>{
    if(outP) return outP; clearTimeout(tHold); clearTimeout(tOut);
    outP=new Promise(res=>{
      holds.forEach(a=>a.cancel()); holds=[]; let end=0;
      if(WHOLE_OUT[O.fx]){ el.animate(wordOut(O.fx,O.str),{duration:O.dur,easing:EASE[O.ease]||O.ease,fill:'forwards'}); end=O.dur; }
      else { const rk=rank(n,O.order);
        chars.forEach((c,i)=>{ const d=rk[i]*O.stagger; end=Math.max(end,d+O.dur);
          c.animate(outFrames(O.fx,i,n,O.str),{duration:O.dur,delay:d,easing:EASE[O.ease]||O.ease,fill:'forwards'}); }); }
      setTimeout(()=>{ res(); resolveDone(); },end);
    });
    return outP;
  };
  const tOut=Hd.dur!=null?setTimeout(out,inEnd+Hd.dur):0;
  return {done, out, inEnd, cancel(){ cancelled=true; clearTimeout(tHold); clearTimeout(tOut); holds.forEach(a=>a.cancel()); anims.forEach(a=>{ try{a.cancel();}catch(e){} }); resolveDone(); }};
};

/* ════════ MATCH INTRO: the first use ════════
   Before the captains talk: a place & time caption, the two teams converging
   from their sides with their Team Select flags, VS slammed in the middle,
   the competition + difficulty, then everything scatters away. ~4 s,
   skippable (Confirm / Start / click). Home blue, away red as everywhere. */
const CSS=`
#u11mi{position:fixed;inset:0;z-index:2147482700;pointer-events:none;display:none;overflow:hidden}
#u11mi.on{display:block}
#u11mi .mi-dim{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 52%,rgba(3,6,14,.35),rgba(3,6,14,.78));opacity:0;transition:opacity .35s}
#u11mi.on .mi-dim{opacity:1}
#u11mi.out .mi-dim{opacity:0;transition:opacity .45s .15s}
#u11mi .mi-band{position:absolute;left:-6vw;right:-6vw;top:50%;height:min(30vh,22vw);transform:translateY(-50%) skewY(-3deg);
  background:linear-gradient(90deg,rgba(4,8,18,0),rgba(4,8,18,.9) 16%,rgba(4,8,18,.9) 84%,rgba(4,8,18,0));
  border-top:2px solid rgba(201,211,230,.55);border-bottom:2px solid rgba(201,211,230,.55);clip-path:inset(0 50% 0 50%)}
#u11mi .mi-band::before,#u11mi .mi-band::after{content:'';position:absolute;top:0;bottom:0;width:50%;opacity:.38}
#u11mi .mi-band::before{left:0;background:linear-gradient(90deg,transparent 10%,#1e72dc 60%,transparent)}
#u11mi .mi-band::after{right:0;background:linear-gradient(270deg,transparent 10%,#c22020 60%,transparent)}
#u11mi .mi-cap{position:absolute;left:0;right:0;top:calc(50% - min(19vh,14vw));text-align:center;white-space:nowrap;
  font-family:'Rajdhani',sans-serif;font-weight:600;font-size:min(2.3vh,1.7vw);letter-spacing:.42em;color:#dfe7f6;text-shadow:0 2px 0 rgba(0,0,0,.6)}
#u11mi .mi-row{position:absolute;left:0;right:0;top:50%;transform:translateY(-55%);display:flex;align-items:center;justify-content:center;gap:min(3vw,40px)}
#u11mi .mi-team{display:flex;align-items:center;gap:min(1.4vw,18px)}
#u11mi .mi-team.a{flex-direction:row-reverse}
#u11mi .mi-name{font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:min(8.2vh,6vw);line-height:1;letter-spacing:.08em}
/* the silver lives on EACH letter: a clipped gradient on the parent breaks once the letters animate on their own */
#u11mi .mi-name .tfx-c{background:linear-gradient(180deg,#ffffff 0%,#e9eef7 42%,#aab4c6 60%,#f4f7fc 63%,#cfd7e5 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.016em rgba(8,12,24,.9);
  filter:drop-shadow(0 .03em 0 rgba(0,0,0,.7)) drop-shadow(0 0 .14em var(--g))}
#u11mi .mi-team.h{--g:#1e72dc} #u11mi .mi-team.a{--g:#c22020}
#u11mi .mi-flag{width:min(7vh,5.2vw);height:min(4.7vh,3.5vw);border-radius:3px;overflow:hidden;flex:none;opacity:0;
  box-shadow:0 0 0 1px rgba(10,16,34,.9),0 0 0 2px rgba(201,211,230,.55),0 4px 12px rgba(0,0,0,.5);font-size:min(4vh,3vw);line-height:1;display:flex;align-items:center;justify-content:center}
#u11mi .mi-flag svg,#u11mi .mi-flag img{width:100%;height:100%;display:block;object-fit:contain}
#u11mi .mi-vs{font-family:'Bold Pixel','Rajdhani',monospace;font-size:min(6vh,4.4vw);line-height:1;color:#f4d98a;
  text-shadow:0 0 .2em rgba(244,217,138,.6),0 .06em 0 #3a2a06}
#u11mi .mi-sub{position:absolute;left:0;right:0;top:calc(50% + min(10vh,7.4vw));text-align:center;white-space:nowrap;
  font-family:'Rajdhani',sans-serif;font-weight:700;font-size:min(2.6vh,1.9vw);letter-spacing:.38em;color:var(--dc,#f4d98a);text-shadow:0 0 .6em var(--dc,#f4d98a),0 2px 0 rgba(0,0,0,.6)}
@media (prefers-reduced-motion:reduce){#u11mi *{animation-duration:.01s!important;transition:none!important}}`;
let root=null, run=null;
function build(){
  if(root) return;
  const st=document.createElement('style'); st.id='u11mi-css'; st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement('div'); root.id='u11mi';
  root.innerHTML='<div class="mi-dim"></div><div class="mi-band"></div><div class="mi-cap"></div>'+
    '<div class="mi-row"><div class="mi-team h"><div class="mi-flag"></div><div class="mi-name"></div></div>'+
    '<div class="mi-vs"></div><div class="mi-team a"><div class="mi-flag"></div><div class="mi-name"></div></div></div><div class="mi-sub"></div>';
  document.body.appendChild(root);
}
function flagInto(el,key,emoji){
  el.innerHTML=''; let svg=''; try{ svg=(window.TS2&&TS2.flagSVG)?TS2.flagSVG(key):''; }catch(e){}
  if(svg){ el.innerHTML=svg; return; }
  let srcs=[]; try{ srcs=typeof emblemSrcs==='function'?emblemSrcs(String(key||'').toLowerCase(),false).slice():[]; }catch(e){}
  const im=document.createElement('img'); im.alt='';
  im.onerror=()=>{ const n=srcs.shift(); if(n) im.src=n; else el.textContent=emoji||'🏳'; };
  el.appendChild(im); const f=srcs.shift(); if(f) im.src=f; else el.textContent=emoji||'🏳';
}
const DIFF_COL={rookie:'#8fe3a8',pro:'#dfe7f6',champion:'#f4d98a',legend:'#ff6a5a'};
FX.introActive=()=>!!run;
FX.matchIntro=function(o){
  build(); if(run) run.finish();
  return new Promise(resolve=>{
    const parts=[], timers=[]; let ended=false;
    const finish=()=>{ if(ended) return; ended=true; timers.forEach(clearTimeout); parts.forEach(p=>p.cancel());
      root.className=''; root.querySelectorAll('.mi-flag').forEach(f=>f.getAnimations().forEach(a=>a.cancel()));
      root.querySelector('.mi-band').getAnimations().forEach(a=>a.cancel()); run=null; resolve(); };
    run={finish};
    root.style.setProperty('--dc',DIFF_COL[o.diffKey]||'#f4d98a');
    flagInto(root.querySelector('.mi-team.h .mi-flag'),o.homeKey,o.homeFlag);
    flagInto(root.querySelector('.mi-team.a .mi-flag'),o.awayKey,o.awayFlag);
    root.className='on';
    const band=root.querySelector('.mi-band');
    band.animate([{clipPath:'inset(0 50% 0 50%)'},{clipPath:'inset(0 0 0 0)'}],{duration:420,easing:EASE.strong,fill:'forwards'});
    const P=(sel,text,spec)=>{ const p=FX.play(root.querySelector(sel),text,spec); parts.push(p); return p; };
    // 0.15 s  place & time: letters track in from the centre
    timers.push(setTimeout(()=>P('.mi-cap',o.caption,{in:{fx:'tracking',order:'center',dur:520,stagger:14,str:1.2},out:{fx:'fade',dur:260,stagger:0}}),150));
    // 0.45 s  the teams converge from their sides, flags slide in
    timers.push(setTimeout(()=>{
      P('.mi-team.h .mi-name',o.home,{in:{fx:'slide',order:'end',dur:520,stagger:38,ease:'strong',str:1.4},hold:{fx:'float'},out:{fx:'scatter',order:'random',dur:420,stagger:18}});
      P('.mi-team.a .mi-name',o.away,{in:{fx:'slideR',order:'start',dur:520,stagger:38,ease:'strong',str:1.4},hold:{fx:'float'},out:{fx:'scatter',order:'random',dur:420,stagger:18}});
      root.querySelector('.mi-team.h .mi-flag').animate([{opacity:0,transform:'translateX(-120%)'},{opacity:1,transform:'none'}],{duration:480,delay:120,easing:EASE.back,fill:'forwards'});
      root.querySelector('.mi-team.a .mi-flag').animate([{opacity:0,transform:'translateX(120%)'},{opacity:1,transform:'none'}],{duration:480,delay:120,easing:EASE.back,fill:'forwards'});
    },450));
    // 1.15 s  VS slams in and beats
    timers.push(setTimeout(()=>P('.mi-vs','VS',{in:{fx:'slam',dur:380,str:1},hold:{fx:'heartbeat'},out:{fx:'zoom',dur:380,str:1.4}}),1150));
    // 1.5 s   competition · difficulty flickers on and glows
    timers.push(setTimeout(()=>P('.mi-sub',o.sub,{in:{fx:'glitch',order:'random',dur:380,stagger:22},hold:{fx:'glow'},out:{fx:'blur',dur:300,stagger:8}}),1500));
    // 3.4 s   out: names scatter, VS zooms through, captions fade, band closes
    timers.push(setTimeout(()=>{
      root.classList.add('out');
      parts.forEach(p=>p.out());
      root.querySelectorAll('.mi-flag').forEach(f=>f.animate([{opacity:1},{opacity:0,transform:'scale(.6)'}],{duration:300,fill:'forwards'}));
      band.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 50% 0 50%)'}],{duration:420,delay:180,easing:EASE.in,fill:'forwards'});
      timers.push(setTimeout(finish,700));
    },(o.hold||3400)));
  });
};
FX.skipIntro=function(){ if(run){ run.finish(); return true; } return false; };
})();
