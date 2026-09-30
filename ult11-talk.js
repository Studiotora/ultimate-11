/* ============================================================
   ULT11-TALK  ·  Ultimate Eleven   (author 2026-09-30)
   ONE dialogue box for every scene where a player speaks: the goal
   celebration, the captains before kick-off, the winning captain at
   full time. Square Enix style: a translucent window in the HOME /
   AWAY colour (blue / red), silver double frame, a Cinzel name plate,
   the line typed out in Rajdhani, a blinking ▼.
   The speaker is shown as his PROFILE - the head crop the in-game bust
   uses (game.js faceCropURL), open, no frame: the home player on the
   left looking in, the away player on the right looking back.
   Scenes (a whole cinematic) own the SKIP chip: ✕ / A / Enter / Start
   / click / tap skip the scene, not only the line.
   API: U11Talk.say({pl, side, text, hold}) -> Promise<'done'|'skipped'>
        U11Talk.line(pool, vars)   a random line (no repeat in a row)
        U11Talk.scene(onSkip) / .endScene() / .sceneActive() / .skipScene()
        U11Talk.captainOf(side)    the captain's squad key (Frisina / Falkner ...)
   Uses game.js: sq, selHome, selAway, faceCropURL, _portraitChainFor,
   duelInputScheme, calcOvr.
   ============================================================ */
(function(){
'use strict';
const TK={};
window.U11Talk=TK;

/* ─── CAPTAINS (author: "Frisina is Italy's captain and Falkner Germany's") ───
   Other teams: the best-rated outfield player on the pitch. */
TK.CAPTAINS={ italy:'frisina', germany:'falkner' };
const surname=n=>String(n||'').split('.').pop().trim().toLowerCase();
TK.captainOf=function(side){
  try{
    const q=sq(side), team=side==='h'?selHome:selAway, want=TK.CAPTAINS[String(team||'').toLowerCase()];
    const keys=Object.keys(q).filter(k=>q[k]);
    if(want){ const k=keys.find(k=>surname(q[k].name)===want); if(k) return k; }
    let best=null, bo=-1;
    keys.forEach(k=>{ if(q[k].pos==='GK') return; let o=0; try{ o=calcOvr(q[k]); }catch(e){} if(o>bo){ bo=o; best=k; } });
    return best||keys[0]||null;
  }catch(e){ return null; }
};

/* ─── LINES ───  {team} = the speaker's team, {opp} = the other team */
TK.LINES={
  goal:[
    "That one was for everyone in the stands!",
    "Give me the ball and I'll finish it. Simple.",
    "The net was calling my name.",
    "We don't stop here. The next one's coming!",
    "Did you see that? Pure instinct.",
    "Every sprint in training... all for this moment.",
    "The keeper never stood a chance.",
    "This is our pitch tonight!",
    "Too slow, too late!",
    "One more step toward the top!",
    "Thanks for the pass. Half of that goal is yours!",
    "When I see the goal, my body just moves.",
    "Feel that? That's the sound of momentum.",
    "I promised them a goal. Promise kept.",
    "No hesitation. Just the ball and the net.",
    "Hear that roar? This is why I play!",
    "Stay focused, everyone. We finish this together!",
    "My legs were burning... but it was worth it!",
    "That's how {team} does it!",
    "Remember this name!"
  ],
  // before kick-off: the home captain opens...
  preOpen:[
    "So we finally meet, {opp}. I hope you came ready.",
    "Ninety minutes. Give it everything, because we will.",
    "Good luck out there. You're going to need it.",
    "My team has trained for this day. Don't disappoint us.",
    "Shake on it - and then let the ball do the talking.",
    "{team} doesn't lose on this pitch. Not tonight.",
    "I've watched every one of your matches. I know your game.",
    "Let's give the crowd something they'll never forget.",
    "No excuses after the whistle. Deal?",
    "Whatever happens, we play it fair - and we play it hard."
  ],
  // ...and the away captain answers
  preReply:[
    "Ready? We've been waiting for this all season.",
    "Big words. Let's see if your legs back them up.",
    "Luck? We make our own. See you at full time.",
    "{opp} will remember our name after tonight.",
    "Deal. And when it's over, no tears.",
    "You know our game? Then you know how this ends.",
    "Fair and hard. That's the only way we know.",
    "The crowd's here for a show. We brought one.",
    "Talk is cheap, captain. The pitch decides.",
    "We didn't come all this way to be polite."
  ],
  // full time: the winning captain
  win:[
    "That's how {team} finishes a match!",
    "Every one of you gave everything. This win is yours!",
    "{opp} fought hard. But tonight was ours.",
    "We believed until the last second - and it paid off!",
    "Remember this feeling. We're only getting started.",
    "Hold your heads high, {opp}. It was a real battle.",
    "The crowd carried us. Thank you, all of you!",
    "Ninety minutes of heart. That's our football.",
    "One match at a time - and this one is in the bag!",
    "I'm proud to wear this armband today."
  ],
  // full time, a draw: the home captain, then the away captain
  drawHome:[
    "A draw... we'll take the lesson, not the point.",
    "Neither side broke. Respect, {opp}.",
    "We'll be back. Next time, there's a winner.",
    "Even. But I know we had more to give."
  ],
  drawAway:[
    "Next time, captain. Next time it's ours.",
    "A fair result. Our rivalry isn't over.",
    "You didn't break us - and we didn't break you.",
    "We'll meet again. Count on it."
  ]
};
const _last={};
TK.line=function(pool,vars){
  const L=TK.LINES[pool]||[]; if(!L.length) return '';
  let i=Math.floor(Math.random()*L.length); if(L.length>1&&i===_last[pool]) i=(i+1)%L.length; _last[pool]=i;
  return L[i].replace(/\{(\w+)\}/g,(m,k)=>(vars&&vars[k]!=null)?vars[k]:m);
};

const CSS=`
#u11tk{position:fixed;inset:0;z-index:2147482850;pointer-events:none}
#u11tk .tk-box{position:absolute;left:50%;bottom:9%;width:min(64vw,880px);transform:translate(-50%,16px);opacity:0;
  padding:min(1.3vw,16px) min(2vw,26px) min(1.3vw,16px) calc(min(12vw,156px) + min(1.2vw,16px));
  background:linear-gradient(180deg,var(--bgA,rgba(12,48,110,.72)) 0%,var(--bgB,rgba(4,16,40,.8)) 100%);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
  border:2px solid #c9d3e6;border-radius:6px;
  box-shadow:inset 0 0 0 2px rgba(10,16,34,.8),inset 0 0 0 3px rgba(150,175,225,.55),0 10px 34px rgba(0,0,0,.55);
  transition:opacity .22s ease,transform .3s cubic-bezier(.2,.9,.25,1)}
#u11tk.right .tk-box{padding:min(1.3vw,16px) calc(min(12vw,156px) + min(1.2vw,16px)) min(1.3vw,16px) min(2vw,26px)}
#u11tk.on .tk-box{opacity:1;transform:translate(-50%,0)}
#u11tk .tk-box::before{content:'';position:absolute;inset:6px;border-radius:3px;pointer-events:none;
  background:repeating-linear-gradient(180deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px)}
/* the profile: the in-game bust's head crop, open, standing on the window's floor */
#u11tk .tk-por{position:absolute;bottom:3px;left:min(1vw,12px);width:min(11.5vw,150px);height:min(11.5vw,150px);pointer-events:none}
#u11tk.right .tk-por{left:auto;right:min(1vw,12px)}
#u11tk .tk-por img{position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;
  filter:drop-shadow(0 0 1px rgba(0,0,0,.9)) drop-shadow(0 4px 10px rgba(0,0,0,.45))}
#u11tk.right .tk-por img{transform:scaleX(-1)}
#u11tk .tk-por.sheet{overflow:hidden;border-radius:4px}
/* no in-game face: the team flag, centred in the portrait slot, never mirrored */
#u11tk.flag .tk-por{bottom:50%;transform:translateY(50%);width:min(8vw,104px);height:min(6.4vw,84px)}
#u11tk.flag .tk-por img,#u11tk.flag.right .tk-por img{object-position:50% 50%;transform:none;
  filter:drop-shadow(0 0 1px rgba(0,0,0,.8)) drop-shadow(0 3px 8px rgba(0,0,0,.45))}
#u11tk .tk-flagtxt{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:min(5vw,64px);line-height:1}
#u11tk.emoji .tk-flagtxt{display:flex}
/* the Team Select flag (TS2.flagSVG): a small waving-free flag card with a thin frame */
#u11tk.svgflag .tk-flagtxt{inset:14% 4%;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px rgba(10,16,34,.9),0 0 0 2px rgba(201,211,230,.55),0 4px 10px rgba(0,0,0,.45)}
#u11tk.svgflag .tk-flagtxt svg{width:100%;height:100%;display:block}
#u11tk .tk-por.sheet img{left:-40%;top:-6%;width:180%;height:300%;bottom:auto;object-fit:cover;object-position:50% 0}
#u11tk .tk-name{display:inline-block;margin:calc(-1 * min(2.6vw,34px)) 0 min(.6vw,8px) 0;padding:min(.35vw,4px) min(1.2vw,16px);
  font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:min(1.45vw,19px);letter-spacing:.14em;color:#f4d98a;
  background:linear-gradient(180deg,var(--plA,#1b2f6a),var(--plB,#0b1740));border:2px solid #c9d3e6;border-radius:4px;
  box-shadow:inset 0 0 0 1px rgba(150,175,225,.5);text-shadow:0 1px 0 #1a1204}
#u11tk.right .tk-head{text-align:right}
#u11tk .tk-text{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:min(1.75vw,23px);line-height:1.35;color:#f2f5fb;
  letter-spacing:.02em;text-shadow:0 2px 0 rgba(0,0,0,.55);min-height:2.7em}
#u11tk .tk-next{position:absolute;right:min(1.2vw,16px);bottom:min(.9vw,12px);width:0;height:0;border-left:7px solid transparent;
  border-right:7px solid transparent;border-top:9px solid #f4d98a;opacity:0}
#u11tk.right .tk-next{right:calc(min(12vw,156px) + min(1.2vw,16px))}
#u11tk.done .tk-next{animation:tkBlink .8s steps(2,end) infinite}
@keyframes tkBlink{0%{opacity:1}100%{opacity:0}}
#u11tk .tk-skip{position:absolute;right:min(2.2vw,28px);bottom:min(2.4vh,22px);pointer-events:auto;cursor:pointer;display:none;
  align-items:center;gap:.6em;padding:.35em .9em;
  font-family:'Rajdhani',sans-serif;font-weight:700;font-size:min(1.1vw,14px);letter-spacing:.24em;color:#dfe7f6;
  background:linear-gradient(180deg,rgba(16,34,86,.85),rgba(4,10,32,.85));border:1px solid rgba(201,211,230,.7);border-radius:4px}
#u11tk.scene .tk-skip{display:flex}
#u11tk .tk-skip b{font-weight:700;color:#f4d98a;padding:0 .35em;border:1px solid rgba(244,217,138,.6);border-radius:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){#u11tk *{transition:none!important}}`;

let root=null, cur=null, scene=null;
function build(){
  if(root) return;
  const st=document.createElement('style'); st.id='u11tk-css'; st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement('div'); root.id='u11tk';
  root.innerHTML='<div class="tk-box"><div class="tk-por"><img alt=""><span class="tk-flagtxt"></span></div><div class="tk-head"><div class="tk-name"></div></div>'+
    '<div class="tk-text"></div><i class="tk-next"></i></div><div class="tk-skip">SKIP <b></b></div>';
  document.body.appendChild(root);
  const chip=root.querySelector('.tk-skip');
  chip.addEventListener('pointerdown',e=>{ e.stopPropagation(); });
  chip.addEventListener('click',e=>{ e.stopPropagation(); TK.skipScene(); });
  // a click / tap anywhere during a scene moves the dialogue on (the SKIP chip skips the scene)
  document.addEventListener('pointerdown',e=>{ if(scene&&!(e.target.closest&&e.target.closest('#pause-overlay,.ae-modal,.tk-skip'))) TK.advance(); },true);
}
function rgbaK(h,k,a){ const m=/^#?([0-9a-f]{6})$/i.exec(String(h||'')); const n=m?parseInt(m[1],16):0x1e72dc;
  return 'rgba('+Math.round((n>>16&255)*k)+','+Math.round((n>>8&255)*k)+','+Math.round((n&255)*k)+','+a+')'; }
function skipGlyph(){
  let s=''; try{ s=typeof duelInputScheme==='function'?duelInputScheme():''; }catch(e){}
  // the scene skip is Start (Esc on a keyboard): Confirm now moves the dialogue on
  return s==='playstation'?'OPTIONS':s==='xbox'?'MENU':s==='keyboard'?'ESC':'TAP HERE';
}
TK.sideColor=side=>side==='h'?'#1e72dc':'#c22020';

TK.say=function(o){
  build(); TK.hide(true);
  return new Promise(resolve=>{
    const pl=o.pl, side=o.side||'h', col=o.col||TK.sideColor(side);
    root.style.setProperty('--bgA',rgbaK(col,0.46,0.72)); root.style.setProperty('--bgB',rgbaK(col,0.16,0.8));
    root.style.setProperty('--plA',rgbaK(col,0.6,0.96)); root.style.setProperty('--plB',rgbaK(col,0.26,0.96));
    root.classList.toggle('right',side==='a');
    root.querySelector('.tk-name').textContent=surname(pl&&pl.name).toUpperCase();
    /* the profile: his in-game bust crop. Only Italy and Germany have front
       sheets - everyone else shows his team's FLAG (author 2026-09-30: "just
       use flags ... the same flag as Team Select"): TS2.flagSVG, the Team
       Select flag art; clubs / unknown teams: the badge PNG, else the emoji. */
    const por=root.querySelector('.tk-por'), img=por.querySelector('img'), fl=por.querySelector('.tk-flagtxt');
    let face=null; try{ face=window.faceCropURL?faceCropURL(pl):null; }catch(e){}
    const team=String((side==='h'?selHome:selAway)||'').toLowerCase(), tobj=(typeof T!=='undefined'&&T[team])||null;
    fl.textContent=''; por.classList.remove('sheet'); root.classList.toggle('flag',!face); root.classList.remove('emoji','svgflag');
    img.style.visibility='hidden'; img.onload=()=>{ img.style.visibility='visible'; };
    let tsFlag=''; if(!face){ try{ tsFlag=(window.TS2&&TS2.flagSVG)?TS2.flagSVG(team):''; }catch(e){} }
    if(face){ img.onerror=null; img.src=face; }
    else if(tsFlag){ img.onerror=null; img.removeAttribute('src'); root.classList.add('emoji','svgflag'); fl.innerHTML=tsFlag; }
    else{
      let srcs=[]; try{ srcs=(typeof emblemSrcs==='function'?emblemSrcs(team,false):['assets/team/'+team+'.png']).slice(); }catch(e){ srcs=['assets/team/'+team+'.png']; }
      img.onerror=()=>{ const n=srcs.shift(); if(n){ img.src=n; return; }
        img.style.visibility='hidden'; root.classList.add('emoji'); fl.textContent=(tobj&&tobj.flag)||'🏳'; };
      const f0=srcs.shift(); if(f0) img.src=f0; else img.onerror();
    }
    const text=String(o.text||''), tx=root.querySelector('.tk-text'); tx.textContent='';
    root.classList.remove('done'); void root.offsetWidth; root.classList.add('on');
    /* the line waits for the player (author 2026-09-30: "the dialogue ends right
       away without me pressing anything"): typed out, then the ▼ blinks until
       Confirm (TK.advance). A safety net moves on after 12 s untouched. */
    cur={resolve,timers:[],type:0,text,tx,finish:null};
    let i=0;
    const typed=()=>{ if(!cur) return; clearInterval(cur.type); cur.type=0; tx.textContent=text; root.classList.add('done'); };
    cur.finish=typed;
    cur.type=setInterval(()=>{
      if(!cur) return;
      i++; tx.textContent=text.slice(0,i);
      if(i>=text.length) typed();
    },28);
    cur.timers.push(setTimeout(()=>TK.next(),12000));
  });
};
/* the line is over: forget it BEFORE hiding (hide() resolves a live line as 'skipped') */
TK.next=function(){ if(!cur) return; const c=cur; cur=null; TK.hide(true); c.resolve('done'); };
/* Confirm / click: finish the typing first, then move on */
TK.advance=function(){ if(!cur) return false; if(cur.type){ cur.finish(); return true; } TK.next(); return true; };
TK.hide=function(keepScene){
  if(cur){ clearInterval(cur.type); cur.timers.forEach(clearTimeout); const c=cur; cur=null; c.resolve('skipped'); }
  if(root){ root.classList.remove('on','done'); if(!keepScene) root.classList.remove('scene'); }
};
TK.talking=()=>!!cur;

/* scenes: the SKIP chip + the skip route (Start / Esc / the chip); Confirm and a click advance */
TK.scene=function(onSkip){ build(); scene={onSkip}; root.querySelector('.tk-skip b').textContent=skipGlyph(); root.classList.add('scene'); };
TK.endScene=function(){ scene=null; if(root) root.classList.remove('scene'); };
TK.sceneActive=()=>!!scene;
TK.skipScene=function(){ if(!scene) return false; const f=scene.onSkip; TK.endScene(); TK.hide(); try{ f&&f(); }catch(e){ console.warn('[talk] skip',e); } return true; };
})();
