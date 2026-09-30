/* ============================================================
   ULT11-GOALTITLE  ·  Ultimate Eleven   (author 2026-09-26)
   ONE goal title, replacing the three that used to stack on top of
   each other (#gfl "GOAL!" + #goal-banner "GOAL!" + the referee card),
   all dead centre over the goal the camera was trying to show.

   It lives in the LOWER THIRD, so the goal-net orbit camera
   (ult11-pitch3d.js goalCam) stays visible above it. Beats:
     0.00  impact  - flash + a burst in the scorer's team colour
     0.08  slashes - two team-colour bands whip across on a diagonal
     0.18  GOAL    - Cinzel letters slam in one by one, gold, a light
                     sweep runs through them, embers rise
     0.55  scorer  - portrait card + name (Rajdhani) + minute and the
                     new score (Bold Pixel) slide in under the word
     ~2.9  out     - everything wipes off along the slash
   Fonts: Cinzel / Rajdhani / Bold Pixel only (house rule).
   API: U11GoalTitle.show({name, team, side, col, col2, minute,
        score:[h,a], codes:[H,A], portrait:[urls]})  ·  .hide()
   ============================================================ */
(function(){
'use strict';
const GT={ dur:2900 };
window.U11GoalTitle=GT;

const CSS=`
#u11gt{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;display:none;
  --c1:#1e72dc;--c2:#0b2a55;--gold1:#fff6d6;--gold2:#ffd35a;--gold3:#c4861c}
#u11gt.on{display:block}
#u11gt .gt-flash{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 62%,#fff 0%,rgba(255,255,255,.55) 22%,rgba(255,255,255,0) 60%);
  opacity:0;mix-blend-mode:screen}
#u11gt.on .gt-flash{animation:gtFlash .55s ease-out forwards}
@keyframes gtFlash{0%{opacity:1}100%{opacity:0}}
#u11gt .gt-burst{position:absolute;left:50%;top:72%;width:160vmax;height:160vmax;margin:-80vmax 0 0 -80vmax;
  background:repeating-conic-gradient(from 0deg,var(--c1) 0deg 2.2deg,transparent 2.2deg 9deg);
  -webkit-mask:radial-gradient(circle,transparent 0 9%,#000 16%,rgba(0,0,0,.55) 34%,transparent 62%);
          mask:radial-gradient(circle,transparent 0 9%,#000 16%,rgba(0,0,0,.55) 34%,transparent 62%);
  opacity:0;mix-blend-mode:screen}
#u11gt.on .gt-burst{animation:gtBurst 1.5s cubic-bezier(.15,.8,.3,1) forwards}
@keyframes gtBurst{0%{opacity:.95;transform:scale(.35) rotate(0)}60%{opacity:.45}100%{opacity:0;transform:scale(1.25) rotate(14deg)}}
#u11gt .gt-vig{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 52%,rgba(3,6,14,.5) 70%,rgba(3,6,14,.78) 88%,rgba(3,6,14,.6) 100%);opacity:0}
#u11gt.on .gt-vig{animation:gtFade .4s ease-out .05s forwards}
@keyframes gtFade{to{opacity:1}}
/* the band that carries the word */
#u11gt .gt-band{position:absolute;left:-6vw;right:-6vw;top:72%;height:min(19vh,14vw);transform:translateY(-50%) skewY(-3.5deg);
  -webkit-mask:linear-gradient(90deg,transparent 0,#000 16%,#000 84%,transparent 100%);mask:linear-gradient(90deg,transparent 0,#000 16%,#000 84%,transparent 100%)}
#u11gt .gt-slash{position:absolute;left:0;right:0;transform:translateX(-120%)}
#u11gt .gt-slash.a{top:-8%;height:14%;background:linear-gradient(90deg,transparent,var(--c1) 12%,var(--c1) 70%,#fff 71%,var(--c1) 72%,transparent)}
#u11gt .gt-slash.b{bottom:-6%;height:9%;background:linear-gradient(90deg,transparent,var(--gold2) 20%,var(--gold3) 80%,transparent)}
#u11gt .gt-slash.c{top:8%;bottom:8%;background:linear-gradient(90deg,rgba(4,8,18,0),rgba(4,8,18,.86) 14%,rgba(4,8,18,.86) 86%,rgba(4,8,18,0));}
#u11gt.on .gt-slash.a{animation:gtSlash .5s cubic-bezier(.2,.9,.2,1) .06s forwards}
#u11gt.on .gt-slash.c{animation:gtSlash .45s cubic-bezier(.2,.9,.2,1) .12s forwards}
#u11gt.on .gt-slash.b{animation:gtSlashR .5s cubic-bezier(.2,.9,.2,1) .16s forwards}
@keyframes gtSlash{0%{transform:translateX(-120%)}100%{transform:translateX(0)}}
@keyframes gtSlashR{0%{transform:translateX(120%)}100%{transform:translateX(0)}}
/* GOAL */
#u11gt .gt-word{position:absolute;left:0;right:0;top:72%;transform:translateY(-60%);text-align:center;white-space:nowrap;
  font-family:'Cinzel',Georgia,serif;font-weight:900;font-size:min(17vh,13.5vw);line-height:1;letter-spacing:.06em}
#u11gt .gt-l{display:inline-block;position:relative;opacity:0;
  background:linear-gradient(180deg,var(--gold1) 0%,var(--gold2) 38%,var(--gold3) 62%,#fff0b8 64%,var(--gold2) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  -webkit-text-stroke:.018em rgba(40,20,0,.85);
  filter:drop-shadow(0 .03em 0 #4a2c00) drop-shadow(0 0 .12em rgba(255,200,80,.55))}
#u11gt.on .gt-l{animation:gtSlam .42s cubic-bezier(.2,1.5,.35,1) forwards}
@keyframes gtSlam{0%{opacity:0;transform:scale(2.6) translateY(-.08em);filter:blur(8px) drop-shadow(0 0 0 #000)}
  55%{opacity:1;filter:blur(0) drop-shadow(0 .03em 0 #4a2c00) drop-shadow(0 0 .25em rgba(255,220,120,.9))}
  100%{opacity:1;transform:scale(1);filter:drop-shadow(0 .03em 0 #4a2c00) drop-shadow(0 0 .12em rgba(255,200,80,.55))}}
#u11gt .gt-sweep{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.95) 49%,rgba(255,255,255,.95) 51%,transparent 60%);
  background-size:300% 100%;background-position:120% 0;
  -webkit-background-clip:text;background-clip:text;color:transparent;mix-blend-mode:screen}
#u11gt.on .gt-sweep{animation:gtSweep .75s ease-in-out .78s forwards}
@keyframes gtSweep{to{background-position:-20% 0}}
/* scorer card */
#u11gt .gt-card{position:absolute;left:50%;top:calc(72% + min(8.6vh,6.4vw));transform:translate(-50%,0);
  display:flex;align-items:center;gap:min(1.8vh,1.3vw);opacity:0;padding:min(.9vh,.7vw) min(3vh,2.2vw) min(.9vh,.7vw) min(1vh,.8vw);
  background:linear-gradient(90deg,rgba(4,8,18,0),rgba(4,8,18,.92) 12%,rgba(4,8,18,.92) 88%,rgba(4,8,18,0));
  border-top:1px solid rgba(255,211,90,.35);border-bottom:1px solid rgba(255,211,90,.35)}
#u11gt.on .gt-card{animation:gtCard .45s cubic-bezier(.2,.9,.25,1) .55s forwards}
@keyframes gtCard{0%{opacity:0;transform:translate(-50%,40%)}100%{opacity:1;transform:translate(-50%,0)}}
#u11gt .gt-face{width:min(11vh,8.2vw);height:min(11vh,8.2vw);clip-path:polygon(18% 0,100% 0,82% 100%,0 100%);
  background:linear-gradient(160deg,var(--c1),var(--c2));overflow:hidden;position:relative;box-shadow:0 0 0 2px var(--gold2)}
#u11gt .gt-face img{position:absolute;left:-40%;top:-6%;width:180%;height:300%;object-fit:cover;object-position:50% 0}
#u11gt .gt-face img.crop{left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%}   /* game.js faceCropURL: the bust's own head crop */
#u11gt .gt-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1}
#u11gt .gt-name{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:min(4.6vh,3.4vw);letter-spacing:.14em;color:#fff;
  text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 14px rgba(0,0,0,.6)}
#u11gt .gt-meta{margin-top:.35em;display:flex;align-items:center;gap:.7em;font-family:'Rajdhani',sans-serif;font-weight:600;
  font-size:min(2.3vh,1.7vw);letter-spacing:.22em;color:var(--gold2)}
#u11gt .gt-sc{font-family:'Bold Pixel','Rajdhani',monospace;letter-spacing:.08em;color:#fff;font-size:1.25em;
  padding:.15em .55em;background:rgba(0,0,0,.45);border:1px solid rgba(255,211,90,.55)}
#u11gt .gt-sc b{font-weight:normal;color:var(--gold2)}
#u11gt canvas{position:absolute;inset:0;width:100%;height:100%}
#u11gt.out .gt-band,#u11gt.out .gt-word,#u11gt.out .gt-card{animation:gtOut .38s cubic-bezier(.6,0,.8,.4) forwards!important}
#u11gt.out .gt-vig{transition:opacity .4s;opacity:0!important}
@keyframes gtOut{to{opacity:0;transform:translate(60vw,-4vh) skewX(-18deg)}}
@media (prefers-reduced-motion:reduce){#u11gt *{animation-duration:.01s!important}}`;

let root=null, cv=null, cx=null, raf=0, parts=[], tOut=0, tHide=0;
function build(){
  if(root) return;
  const st=document.createElement('style'); st.id='u11gt-css'; st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement('div'); root.id='u11gt';
  root.innerHTML='<div class="gt-flash"></div><div class="gt-burst"></div><div class="gt-vig"></div><canvas></canvas>'+
    '<div class="gt-band"><div class="gt-slash c"></div><div class="gt-slash a"></div><div class="gt-slash b"></div></div>'+
    '<div class="gt-word"></div><div class="gt-card"><div class="gt-face"><img alt=""></div>'+
    '<div class="gt-txt"><div class="gt-name"></div><div class="gt-meta"></div></div></div>';
  document.body.appendChild(root);            // not #viewport: a transformed parent would clip a fixed layer
  cv=root.querySelector('canvas'); cx=cv.getContext('2d');
}
function hexA(h,a){ const m=/^#?([0-9a-f]{6})$/i.exec(String(h||'')); if(!m) return 'rgba(255,211,90,'+a+')';
  const n=parseInt(m[1],16); return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'; }
function darker(h){ const m=/^#?([0-9a-f]{6})$/i.exec(String(h||'')); if(!m) return '#0b2a55';
  const n=parseInt(m[1],16), f=v=>Math.round(v*0.32).toString(16).padStart(2,'0'); return '#'+f(n>>16&255)+f(n>>8&255)+f(n&255); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// sparks: gold + team colour, burst from the word then drifting up as embers
function sparks(col){
  const r=root.getBoundingClientRect(), W=cv.width=Math.round(r.width*Math.min(2,window.devicePixelRatio||1)), H=cv.height=Math.round(r.height*Math.min(2,window.devicePixelRatio||1));
  const s=W/Math.max(1,r.width), cyy=H*0.72; parts=[];
  const cols=['#fff6d6','#ffd35a','#ffb22e',col,col,'#ffffff'];
  for(let i=0;i<150;i++){ const a=Math.random()*Math.PI*2, v=(3+Math.random()*11)*s;
    parts.push({x:W*(0.3+Math.random()*0.4),y:cyy+(Math.random()-.5)*H*0.08,vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.6-4*s,
      g:0.16*s,life:1,dec:0.006+Math.random()*0.012,sz:(1.2+Math.random()*2.6)*s,c:cols[i%cols.length],d:Math.random()*0.35}); }
  for(let i=0;i<60;i++) parts.push({x:Math.random()*W,y:H*(0.7+Math.random()*0.35),vx:(Math.random()-.5)*0.6*s,vy:-(0.6+Math.random()*1.6)*s,
      g:-0.004*s,life:1,dec:0.004+Math.random()*0.005,sz:(1+Math.random()*2)*s,c:i%3?'#ffd35a':col,d:0.3+Math.random()*0.8,ember:1});
  const t0=performance.now();
  cancelAnimationFrame(raf);
  (function step(){ const el=(performance.now()-t0)/1000; cx.clearRect(0,0,W,H); let alive=0;
    cx.globalCompositeOperation='lighter';
    for(const p of parts){ if(el<p.d) { alive++; continue; } if(p.life<=0) continue; alive++;
      p.vx*=0.985; p.vy=p.vy*0.985+p.g; p.x+=p.vx; p.y+=p.vy; p.life-=p.dec;
      const a=Math.max(0,p.life); cx.fillStyle=hexA(p.c,a*(p.ember?0.7:1));
      if(p.ember){ cx.beginPath(); cx.arc(p.x,p.y,p.sz,0,6.283); cx.fill(); }
      else { cx.save(); cx.translate(p.x,p.y); cx.rotate(Math.atan2(p.vy,p.vx)); cx.fillRect(-p.sz*2.2,-p.sz*0.4,p.sz*4.4,p.sz*0.8); cx.restore(); } }
    cx.globalCompositeOperation='source-over';
    if(alive&&root.classList.contains('on')) raf=requestAnimationFrame(step); else cx.clearRect(0,0,W,H); })();
}

GT.show=function(o){
  o=o||{}; build();
  clearTimeout(tOut); clearTimeout(tHide); cancelAnimationFrame(raf);
  root.classList.remove('on','out'); void root.offsetWidth;
  const col=o.col||'#1e72dc';
  root.style.setProperty('--c1',col); root.style.setProperty('--c2',o.col2||darker(col));
  // GOAL, letter by letter, the sweep laid over the same letters
  const word='GOAL';
  const w=root.querySelector('.gt-word');
  w.innerHTML=word.split('').map((ch,i)=>'<span class="gt-l" style="animation-delay:'+(0.18+i*0.075).toFixed(3)+'s">'+ch+'</span>').join('')+
    '<span class="gt-l" style="animation-delay:'+(0.18+word.length*0.075+0.05).toFixed(3)+'s">!</span>'+
    '<div class="gt-sweep">'+word+'!</div>';
  const sw=w.querySelector('.gt-sweep'); sw.style.letterSpacing='.06em';
  // scorer
  root.querySelector('.gt-name').textContent=String(o.name||'').toUpperCase();
  const sc=o.score||[0,0], cd=o.codes||['HOM','AWY'];
  root.querySelector('.gt-meta').innerHTML=(o.minute?'<span>'+esc(o.minute)+'′</span>':'')+
    (o.team?'<span>'+esc(String(o.team).toUpperCase())+'</span>':'')+
    '<span class="gt-sc">'+esc(cd[0])+' <b>'+(+sc[0])+'</b>-<b>'+(+sc[1])+'</b> '+esc(cd[1])+'</span>';
  const img=root.querySelector('.gt-face img'), chain=(o.portrait||[]).slice();
  img.classList.toggle('crop',!!o.faceCrop);
  img.style.visibility='hidden';
  img.onerror=()=>{ img.classList.remove('crop'); const n=chain.shift(); if(n) img.src=n; else img.style.visibility='hidden'; };
  img.onload=()=>{ img.style.visibility='visible'; };
  const first=chain.shift(); if(first) img.src=first;
  root.classList.add('on');
  try{ sparks(col); }catch(e){}
  const dur=o.dur||GT.dur;
  tOut=setTimeout(()=>root.classList.add('out'),dur-380);
  tHide=setTimeout(()=>GT.hide(),dur);
};
GT.hide=function(){ if(!root) return; clearTimeout(tOut); clearTimeout(tHide); cancelAnimationFrame(raf);
  root.classList.remove('on','out'); try{ cx.clearRect(0,0,cv.width,cv.height); }catch(e){} };
})();
