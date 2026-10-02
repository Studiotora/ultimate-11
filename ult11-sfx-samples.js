/* Ultimate Eleven sampled sound. All active effects come from assets/audio. */
(function(){
  const A='assets/audio/';
  const files={
    kick:'aerial_shoot.wav',pass:'short-pass.mp3',cross:'cross.mp3',
    catch:'ball_catch GK.wav',tackle:'Tackle.wav',
    charge:'Pre Special Move Sound.wav',run:'running.mp3',
    cursor:'cursor.mp3',confirm:'confim.mp3',cancel:'Cancel.ogg',error:'Cancel.ogg',
    pauseOpen:'pause_open.wav',pauseClose:'pause_closed.wav',
    start:'whstl_start.wav',goal:'whstl_goal.wav',foul:'whstl_foul.wav',
    half:'whstl_halftime.wav',full:'whstl_final_whstl.wav'
  };
  const make=(name)=>{const a=new Audio(A+files[name]);a.preload='auto';return a;};
  const pools={},last={};let unlocked=false,duck=1,live=false,prevPhase='',scoreH=null,scoreA=null;
  const SFX=window.SFX={on:true,master:.7,crowd:.35,steps:.45,kick:.9,whistleVol:.8,
    mute(){this.on=false;stopBeds();},unmute(){this.on=true;},
    duck(level){duck=level==null?.22:Math.max(0,Math.min(1,level));},
    unduck(){duck=1;}
  };
  function volume(base){return Math.max(0,Math.min(1,base*SFX.master));}
  /* ONE-SHOTS ON WEB AUDIO (2026-09-28, author: "the pass sound is a few
     beats after the ball is kicked"). short-pass.mp3 opens with 289 ms of
     silence and cross.mp3 with 247 ms, and an <audio> element adds its own
     start latency on top. Every one-shot is now decoded once, its leading
     silence measured and skipped, and played through Web Audio (near-zero
     latency). The crowd / running beds stay on <audio> loops. Fallback: the
     old <audio> pool, which also skips the measured (or known) silence. */
  const PRE={pass:.275,cross:.233};                 // measured onsets, used until decoding finishes
  let ctx=null; const bufs={},trim={},live1={};
  function ensureCtx(){ if(ctx) return ctx; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
    try{ ctx=new AC(); }catch(e){ ctx=null; } return ctx; }
  function onset(buf){ const d=buf.getChannelData(0); let pk=0; for(let i=0;i<d.length;i++){ const v=Math.abs(d[i]); if(v>pk) pk=v; }
    const th=pk*.12; for(let i=0;i<d.length;i++) if(Math.abs(d[i])>th) return Math.max(0,i/buf.sampleRate-.012); return 0; }
  (function decodeAll(){ const c=ensureCtx(); if(!c||!window.fetch) return;
    Object.keys(files).forEach(name=>{ if(name==='run') return;
      fetch(A+encodeURIComponent(files[name])).then(r=>r.arrayBuffer()).then(ab=>new Promise((res,rej)=>c.decodeAudioData(ab,res,rej)))
        .then(buf=>{ bufs[name]=buf; trim[name]=onset(buf); }).catch(()=>{}); }); })();
  function play(name,gain=1,spacing=0,rate=1){
    if(!SFX.on||!unlocked||!files[name])return null;
    const now=performance.now();if(spacing&&now-(last[name]||0)<spacing)return null;
    last[name]=now;
    /* only through Web Audio when the context is RUNNING. A suspended context
       (no gesture yet, tab came back, output device changed) queues the sound
       silently - that was one way to lose every effect while the music, an
       <audio> element, kept playing. Not running: nudge it and use <audio>. */
    if(ctx&&ctx.state!=='running'&&ctx.state!=='closed'){ try{ ctx.resume(); }catch(e){} }
    if(ctx&&bufs[name]&&ctx.state==='running'){
      try{
        const src=ctx.createBufferSource(), g=ctx.createGain(); src.buffer=bufs[name]; g.gain.value=volume(gain);
        if(rate!==1) src.playbackRate.value=rate;
        src.connect(g); g.connect(ctx.destination); src.start(0,trim[name]||0);
        (live1[name]=live1[name]||[]).push(src); src.onended=()=>{ const l=live1[name]; const i=l?l.indexOf(src):-1; if(i>=0) l.splice(i,1); };
        return src; }catch(e){}
    }
    let pool=pools[name];if(!pool)pool=pools[name]=Array.from({length:3},()=>make(name));
    const a=pool.find(x=>x.paused||x.ended)||pool[0];
    try{a.pause();a.currentTime=trim[name]!=null?trim[name]:(PRE[name]||0);a.volume=volume(gain);const p=a.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}
    return a;
  }
  SFX._audio=()=>({unlocked,on:SFX.on,master:SFX.master,ctx:ctx?ctx.state:'none',decoded:Object.keys(bufs).length,trimMs:Object.fromEntries(Object.entries(trim).map(([k,v])=>[k,Math.round(v*1000)]))});
  function stop(name){(live1[name]||[]).splice(0).forEach(s=>{try{s.stop();}catch(e){}});
    (pools[name]||[]).forEach(a=>{a.pause();try{a.currentTime=0;}catch(e){}});}
  function stopBeds(){crowdBed.pause();runBed.pause();live=false;}
  const crowds=['crowd1.mp3','crowd2.mp3','crowd3.mp3','crowd4.mp3'];
  let crowdIndex=0,runLastMove=0,cheerUntil=0;
  const crowdBed=new Audio(A+crowds[crowdIndex]);crowdBed.preload='auto';
  crowdBed.addEventListener('ended',()=>{crowdIndex=(crowdIndex+1)%crowds.length;crowdBed.src=A+crowds[crowdIndex];if(live&&SFX.on)crowdBed.play().catch(()=>{});});
  const runBed=make('run');runBed.loop=true;
  function unlock(){unlocked=true;try{if(ctx&&ctx.state!=='running'&&ctx.state!=='closed')ctx.resume();}catch(e){}}
  ['pointerdown','touchstart','keydown','mousedown','click'].forEach(type=>addEventListener(type,unlock,{passive:true}));
  /* AUDIO LOCK FIX (author 2026-10-02: "sometimes all audio don't work aside
     from music"). Effects + crowd only unlocked on mouse / touch / keyboard.
     A gamepad fires none of those, and Chrome lets the MUSIC autoplay on a
     site played often - so a controller-only session had music and nothing
     else. Now also unlocked by: any gamepad button, and any page music that
     is already playing (proof the browser allows sound). */
  document.addEventListener('playing',e=>{ if(e.target&&(e.target.id==='bgMusic'||/^matchMusic/.test(e.target.id||''))) unlock(); },true);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&unlocked) unlock(); });
  function padPressed(){ try{ const l=navigator.getGamepads?navigator.getGamepads():[];
    for(const g of l){ if(g&&g.connected&&g.buttons.some(b=>b.pressed)) return true; } }catch(e){} return false; }

  SFX.cheer=function(intensity=1){
    if(!SFX.on||!unlocked)return;
    cheerUntil=performance.now()+1600*Math.max(1,intensity);
  };
  SFX.whistle=function(kind){const map={kickoff:'start',start:'start',goal:'goal',foul:'foul',half:'half',halftime:'half',full:'full'};
    play(map[kind]||'foul',SFX.whistleVol,250);if(kind==='goal')SFX.cheer(1.3);};
  SFX.ballKick=function(power=.55){play('kick',SFX.kick*(power>=.9?.55:.14),power>=.9?150:90);};
  SFX.shortPass=function(){play('pass',SFX.kick*.7,90);};
  SFX.cross=function(){play('cross',SFX.kick*.75,120);};
  SFX.step=function(){}; // running.mp3 is the movement bed; no generated footstep blips.
  SFX.tackle=function(){play('tackle',.62,170);};
  SFX.save=function(){play('catch',.7,250);};
  SFX.windup=function(){stop('charge');play('charge',.6);};
  SFX.windupStop=function(){stop('charge');};
  SFX.whoosh=function(){}; // No whoosh sample: don't play the aerial-shot recording for jumps or tackles.
  SFX.impact=function(){}; // goal whistle/crowd provide the impact; no synthetic boom.
  SFX.click=function(){SFX.confirm();};
  SFX.cursor=function(){play('cursor',.28,65);};
  SFX.confirm=function(){play('confirm',.48,90);};
  SFX.cancel=function(){play('cancel',.5,90);};
  /* ERROR (2026-09-29): a move refused for stamina, field or duel. No error
     recording exists yet, so it is the Cancel sample played lower and a
     little louder - distinct from the menu's cancel. Own name + spacing, so
     it never swallows a menu cancel. For a real sample, change error: in
     `files` at the top. */
  SFX.error=function(){play('error',.62,260,.74);};
  SFX.pauseOpen=function(){play('pauseOpen',.56,150);};
  SFX.pauseClose=function(){play('pauseClose',.55,150);};

  function menuTarget(el){return el&&el.closest&&el.closest('button,a,[role="button"],.menu-item,.tap,[data-sfx]');}
  function inGameplay(){return !!document.querySelector('#s-match.active')&&!document.querySelector('#pause-overlay.show');}
  document.addEventListener('pointerover',e=>{
    const el=menuTarget(e.target);if(el&&!el.contains(e.relatedTarget)&&!inGameplay())SFX.cursor();
  },true);
  document.addEventListener('focusin',e=>{if(menuTarget(e.target)&&!inGameplay())SFX.cursor();},true);
  document.addEventListener('click',e=>{
    const el=menuTarget(e.target);if(!el||inGameplay()||el.id==='pauseBtn')return;
    if(/back|cancel|close|return/i.test((el.id||'')+' '+(el.textContent||'').slice(0,28)))SFX.cancel();
    else SFX.confirm();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!inGameplay())SFX.cancel();},true);

  function watch(){
    requestAnimationFrame(watch);
    if(!unlocked&&padPressed()) unlock();
    if(unlocked&&ctx&&ctx.state==='suspended'&&padPressed()) unlock();
    if(!SFX.on||!unlocked||typeof G==='undefined'||!G){if(live)stopBeds();return;}
    const screen=document.querySelector('#s-match.active');
    const active=!!screen&&!G.paused&&['moving','pass_anim','duel','duel_result','corner','freekick','throwin'].includes(G.phase);
    /* the crowd never stops for kick-offs, goals or the scenes - only a PAUSE
       (the menu) silences it (author 2026-09-30) */
    const crowdActive=!!screen&&!G.paused&&!document.querySelector('#pause-overlay.show');
    if(crowdActive&&!live){live=true;crowdBed.play().catch(()=>{});}
    if(!crowdActive&&live)stopBeds();
    crowdBed.volume=volume(SFX.crowd*duck*(performance.now()<cheerUntil?1.5:1));
    if(active&&G.phase==='moving'&&typeof PP!=='undefined'&&PP[G.poss]){
      const p=PP[G.poss][G.ck];
      if(p){const now=performance.now(),prev=watch.last||{x:p.x,y:p.y,t:now};
        const dt=Math.max(1,now-prev.t),speed=Math.hypot(p.x-prev.x,p.y-prev.y)/dt;
        const moving=speed>.018;
        if(moving)runLastMove=now;
        if(moving&&runBed.paused)runBed.play().catch(()=>{});
        if(!moving&&now-runLastMove>220&&!runBed.paused)runBed.pause();
        runBed.volume=volume(SFX.steps*.35);
        watch.last={x:p.x,y:p.y,t:now};
      }
    }else if(!runBed.paused){runBed.pause();watch.last=null;}
    const kicking=G.phase==='pass_anim';
    if(kicking&&prevPhase!=='pass_anim'&&!G._cineHold){
      const flight=typeof ballTravel!=='undefined'?ballTravel:null;
      if(flight&&flight.active&&flight.physicalPass){
        if(flight.kind==='ground')SFX.shortPass();
        else if(flight.kind==='cross')SFX.cross();
        // A throw-in uses neither a foot pass nor a cross recording.
      }else if(G._shotTrail)SFX.ballKick(1);
    }
    prevPhase=G.phase;
    const h=Number(G.hG)||0,a=Number(G.aG)||0;
    if(scoreH!==null&&(h>scoreH||a>scoreA))SFX.whistle('goal');
    scoreH=h;scoreA=a;
  }
  requestAnimationFrame(watch);
  console.log('[SFX] sampled audio active');
})();
