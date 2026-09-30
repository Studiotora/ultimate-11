/* ============================================================
   ULT11-WHISTLETITLE  ·  Ultimate Eleven   (author 2026-09-30)
   "Make the foul banner consistent with our style and fonts."
   The foul used to stack FOUR things: the "🟨 FOUL — FREE KICK"
   event banner, the referee card, a wobbling red FREE KICK box
   dead centre, and the yellow-card popup landing on top of it.
   Now ONE title, a sibling of the GOAL title (ult11-goaltitle.js):
   the same lower-third diagonal band, a Cinzel word, a Rajdhani
   player card - but calmer, because a whistle is a stoppage, not
   a celebration (no burst, no sparks, silver instead of gold).
   The booking lives INSIDE it: the card flips in on the player's
   card row ("YELLOW CARD" / "SECOND YELLOW · SENT OFF").
     tone 'foul'    amber   FREE KICK
     tone 'pen'     red     PENALTY
     tone 'offside' blue    OFFSIDE
   LAYERS (author 2026-09-30): game -> the referee blowing his whistle and
   pointing (assets/ui/referee_whistle.png, rising in from the lower left) ->
   the band + word + player card on top. The referee comes with FREE KICK
   and PENALTY; OFFSIDE (the linesman's call) goes without him.
   Fonts: Cinzel / Rajdhani / Bold Pixel only (house rule).
   API: U11WhistleTitle.show({word, tone, name, team, col, minute,
        card:'yellow'|'red'|null, cardSub, portrait:[urls], dur}) · .hide()
   ============================================================ */
(function(){
'use strict';
const WT={ dur:2100 };
window.U11WhistleTitle=WT;

const CSS=`
#u11wt{position:fixed;inset:0;pointer-events:none;z-index:2147482900;overflow:hidden;display:none;
  --tone:#ffb22e;--tone2:#7a4a06;--c1:#1e72dc;--c2:#0b2a55}
#u11wt.on{display:block}
#u11wt.pen{--tone:#ff4048;--tone2:#6e0a10}
#u11wt.offside{--tone:#5fb4ff;--tone2:#0b3a6e}
#u11wt .wt-vig{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(3,6,14,.42) 72%,rgba(3,6,14,.66) 90%,rgba(3,6,14,.5) 100%);opacity:0}
#u11wt.on .wt-vig{animation:wtFade .35s ease-out forwards}
@keyframes wtFade{to{opacity:1}}
/* the referee: between the game and the band */
#u11wt .wt-ref{position:absolute;left:max(-2vw,-30px);bottom:-2vh;height:min(78vh,54vw);   /* +18% (author 2026-09-30), elbow stays on the left edge */width:auto;opacity:0;
  transform:translate(-6%,18%) scale(.96);transform-origin:30% 100%;
  filter:drop-shadow(0 0 min(3vh,24px) rgba(0,0,0,.55)) drop-shadow(0 .6vh 0 rgba(0,0,0,.35))}
#u11wt.noref .wt-ref{display:none}
#u11wt.on .wt-ref{animation:wtRef .5s cubic-bezier(.16,1,.3,1) forwards}
@keyframes wtRef{0%{opacity:0;transform:translate(-6%,18%) scale(.96)}100%{opacity:1;transform:translate(0,0) scale(1)}}
#u11wt.out .wt-ref{animation:wtRefOut .34s cubic-bezier(.6,0,.8,.4) forwards!important}
@keyframes wtRefOut{from{opacity:1;transform:none}to{opacity:0;transform:translate(-8%,14%)}}
/* the band */
#u11wt .wt-band{position:absolute;left:-6vw;right:-6vw;top:74%;height:min(13vh,10vw);transform:translateY(-50%) skewY(-3.5deg);
  -webkit-mask:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);mask:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%)}
#u11wt .wt-slash{position:absolute;left:0;right:0;transform:translateX(-120%)}
#u11wt .wt-slash.c{top:10%;bottom:10%;background:linear-gradient(90deg,rgba(4,8,18,0),rgba(4,8,18,.88) 14%,rgba(4,8,18,.88) 86%,rgba(4,8,18,0))}
#u11wt .wt-slash.a{top:2%;height:6%;background:linear-gradient(90deg,transparent,var(--tone) 18%,var(--tone) 64%,#fff 65%,var(--tone) 66%,transparent)}
#u11wt .wt-slash.b{bottom:4%;height:3%;background:linear-gradient(90deg,transparent,rgba(220,230,250,.75) 25%,rgba(220,230,250,.35) 75%,transparent)}
#u11wt.on .wt-slash.c{animation:wtSlash .4s cubic-bezier(.2,.9,.2,1) .04s forwards}
#u11wt.on .wt-slash.a{animation:wtSlash .45s cubic-bezier(.2,.9,.2,1) .0s forwards}
#u11wt.on .wt-slash.b{animation:wtSlashR .45s cubic-bezier(.2,.9,.2,1) .1s forwards}
@keyframes wtSlash{to{transform:translateX(0)}}
@keyframes wtSlashR{0%{transform:translateX(120%)}100%{transform:translateX(0)}}
/* the word: silver, lit from the tone */
#u11wt .wt-word{position:absolute;left:0;right:0;top:74%;transform:translateY(-58%);text-align:center;white-space:nowrap;
  font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:min(10.5vh,8.2vw);line-height:1;letter-spacing:.1em}
#u11wt .wt-l{display:inline-block;opacity:0;
  background:linear-gradient(180deg,#ffffff 0%,#e9eef7 40%,#aab4c6 60%,#f4f7fc 63%,#cfd7e5 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  -webkit-text-stroke:.016em rgba(8,12,24,.9);
  filter:drop-shadow(0 .03em 0 rgba(0,0,0,.7)) drop-shadow(0 0 .14em var(--tone))}
#u11wt .wt-l.sp{width:.32em}
#u11wt.on .wt-l{animation:wtIn .32s cubic-bezier(.2,1.2,.35,1) forwards}
@keyframes wtIn{0%{opacity:0;transform:translateX(-.35em) skewX(-14deg);filter:blur(6px)}
  100%{opacity:1;transform:none;filter:drop-shadow(0 .03em 0 rgba(0,0,0,.7)) drop-shadow(0 0 .14em var(--tone))}}
/* the player row */
#u11wt .wt-card{position:absolute;left:50%;top:calc(74% + min(6.4vh,4.9vw));transform:translate(-50%,0);
  display:flex;align-items:center;gap:min(1.6vh,1.2vw);opacity:0;padding:min(.8vh,.6vw) min(2.6vh,2vw) min(.8vh,.6vw) min(1vh,.8vw);
  background:linear-gradient(90deg,rgba(4,8,18,0),rgba(4,8,18,.92) 12%,rgba(4,8,18,.92) 88%,rgba(4,8,18,0));
  border-top:1px solid rgba(220,230,250,.28);border-bottom:1px solid rgba(220,230,250,.28)}
#u11wt.on .wt-card{animation:wtCard .4s cubic-bezier(.2,.9,.25,1) .34s forwards}
@keyframes wtCard{0%{opacity:0;transform:translate(-50%,40%)}100%{opacity:1;transform:translate(-50%,0)}}
#u11wt.noplayer .wt-card{display:none}
#u11wt .wt-face{width:min(8.6vh,6.4vw);height:min(8.6vh,6.4vw);clip-path:polygon(18% 0,100% 0,82% 100%,0 100%);
  background:linear-gradient(160deg,var(--c1),var(--c2));overflow:hidden;position:relative;box-shadow:0 0 0 2px var(--tone)}
#u11wt .wt-face img{position:absolute;left:-40%;top:-6%;width:180%;height:300%;object-fit:cover;object-position:50% 0}
#u11wt .wt-face img.crop{left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%}   /* game.js faceCropURL: the bust's own head crop */
#u11wt .wt-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1}
#u11wt .wt-name{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:min(3.7vh,2.8vw);letter-spacing:.14em;color:#fff;
  text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 12px rgba(0,0,0,.6)}
#u11wt .wt-meta{margin-top:.35em;display:flex;align-items:center;gap:.7em;font-family:'Rajdhani',sans-serif;font-weight:600;
  font-size:min(2vh,1.5vw);letter-spacing:.24em;color:var(--tone)}
#u11wt .wt-meta .m{font-family:'Bold Pixel','Rajdhani',monospace;letter-spacing:.06em;color:#fff}
/* the booking: a real card flipping in beside the name */
#u11wt .wt-book{display:none;align-items:center;gap:min(1.1vh,.8vw);margin-left:min(1.4vh,1vw);padding-left:min(1.6vh,1.2vw);
  border-left:1px solid rgba(220,230,250,.22)}
#u11wt.booked .wt-book{display:flex}
#u11wt .wt-cardi{width:min(3.6vh,2.7vw);height:min(5vh,3.8vw);border-radius:3px;transform:rotate(-9deg) rotateY(90deg);
  box-shadow:0 4px 14px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.35)}
#u11wt .wt-cardi.yellow{background:linear-gradient(150deg,#ffe766,#f2b300)}
#u11wt .wt-cardi.red{background:linear-gradient(150deg,#ff5a5a,#c20a0a)}
#u11wt.on.booked .wt-cardi{animation:wtFlip .45s cubic-bezier(.2,1.4,.4,1) .72s forwards}
@keyframes wtFlip{to{transform:rotate(-9deg) rotateY(0)}}
#u11wt .wt-bk{display:flex;flex-direction:column;line-height:1.05;opacity:0}
#u11wt.on.booked .wt-bk{animation:wtFade .3s ease-out .86s forwards}
#u11wt .wt-bk b{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:min(2.5vh,1.9vw);letter-spacing:.16em}
#u11wt .wt-bk b.yellow{color:#ffd23a} #u11wt .wt-bk b.red{color:#ff4b4b}
#u11wt .wt-bk span{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:min(1.7vh,1.3vw);letter-spacing:.22em;color:rgba(230,236,248,.8)}
#u11wt.out .wt-band,#u11wt.out .wt-word,#u11wt.out .wt-card{animation:wtOut .34s cubic-bezier(.6,0,.8,.4) forwards!important}
#u11wt.out .wt-vig{transition:opacity .35s;opacity:0!important}
@keyframes wtOut{to{opacity:0;transform:translate(60vw,-4vh) skewX(-18deg)}}
@media (prefers-reduced-motion:reduce){#u11wt *{animation-duration:.01s!important}}`;

let root=null, tOut=0, tHide=0;
function build(){
  if(root) return;
  const st=document.createElement('style'); st.id='u11wt-css'; st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement('div'); root.id='u11wt';
  root.innerHTML='<div class="wt-vig"></div><img class="wt-ref" alt="" src="assets/ui/referee_whistle.png">'+
    '<div class="wt-band"><div class="wt-slash c"></div><div class="wt-slash a"></div><div class="wt-slash b"></div></div>'+
    '<div class="wt-word"></div><div class="wt-card"><div class="wt-face"><img alt=""></div>'+
    '<div class="wt-txt"><div class="wt-name"></div><div class="wt-meta"></div></div>'+
    '<div class="wt-book"><div class="wt-cardi"></div><div class="wt-bk"><b></b><span></span></div></div></div>';
  document.body.appendChild(root);            // not #viewport: a transformed parent would clip a fixed layer
}
function darker(h){ const m=/^#?([0-9a-f]{6})$/i.exec(String(h||'')); if(!m) return '#0b2a55';
  const n=parseInt(m[1],16), f=v=>Math.round(v*0.32).toString(16).padStart(2,'0'); return '#'+f(n>>16&255)+f(n>>8&255)+f(n&255); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

WT.show=function(o){
  o=o||{}; build();
  clearTimeout(tOut); clearTimeout(tHide);
  root.className=''; void root.offsetWidth;
  const tone=o.tone==='pen'?'pen':(o.tone==='offside'?'offside':'foul');
  const col=o.col||'#1e72dc';
  root.style.setProperty('--c1',col); root.style.setProperty('--c2',darker(col));
  const word=String(o.word||'FREE KICK').toUpperCase();
  root.querySelector('.wt-word').innerHTML=word.split('').map((ch,i)=>ch===' '
    ?'<span class="wt-l sp"></span>'
    :'<span class="wt-l" style="animation-delay:'+(0.08+i*0.035).toFixed(3)+'s">'+esc(ch)+'</span>').join('');
  root.querySelector('.wt-name').textContent=String(o.name||'').toUpperCase();
  root.querySelector('.wt-meta').innerHTML=(o.label?'<span>'+esc(o.label)+'</span>':'')+
    (o.minute?'<span class="m">'+esc(o.minute)+'′</span>':'')+
    (o.team?'<span>'+esc(String(o.team).toUpperCase())+'</span>':'');
  const card=o.card==='red'?'red':(o.card==='yellow'?'yellow':null);
  if(card){
    root.querySelector('.wt-cardi').className='wt-cardi '+card;
    const b=root.querySelector('.wt-bk b'); b.className=card; b.textContent=card==='red'?'RED CARD':'YELLOW CARD';
    root.querySelector('.wt-bk span').textContent=String(o.cardSub||(card==='red'?'SENT OFF':'BOOKED')).toUpperCase();
  }
  const img=root.querySelector('.wt-face img'), chain=(o.portrait||[]).slice();
  img.classList.toggle('crop',!!o.faceCrop);
  img.style.visibility='hidden';
  img.onerror=()=>{ img.classList.remove('crop'); const n=chain.shift(); if(n) img.src=n; else img.style.visibility='hidden'; };
  img.onload=()=>{ img.style.visibility='visible'; };
  const first=chain.shift(); if(first) img.src=first;
  root.classList.add(tone); if(card) root.classList.add('booked'); if(!o.name) root.classList.add('noplayer');
  if(o.ref===false||(o.ref==null&&tone==='offside')) root.classList.add('noref');
  root.classList.add('on');
  const dur=o.dur||WT.dur;
  tOut=setTimeout(()=>root.classList.add('out'),dur-340);
  tHide=setTimeout(()=>WT.hide(),dur);
};
// load the referee art up front, so the first foul has it
try{ const pre=new Image(); pre.src='assets/ui/referee_whistle.png'; }catch(e){}
WT.hide=function(){ if(!root) return; clearTimeout(tOut); clearTimeout(tHide); root.className=''; };
})();
