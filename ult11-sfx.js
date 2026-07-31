/* ============================================================
   ULT11-SFX  ·  Ultimate Eleven   ·  in-match sound
   Self-contained WebAudio synth — NO asset files, works offline.
   Reads engine state (G / PP / ball) the same way ps1-mod does,
   so it needs ZERO game.js edits. Load AFTER game.js.
   Console: SFX.on / SFX.master / SFX.crowd / SFX.mute()
   ============================================================ */
(function(){
  const SFX = window.SFX = {
    on:true, master:0.9, crowd:0.35, steps:0.5, kick:0.9, whistleVol:0.8,
    mute(){ SFX.on=false; }, unmute(){ SFX.on=true; }
  };

  let AC=null, busMaster=null, busCrowd=null, crowdNode=null, crowdGain=null, started=false;
  // unlock on first user gesture (mobile autoplay policy)
  function ensure(){
    if(AC) return AC;
    try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
    busMaster=AC.createGain(); busMaster.gain.value=SFX.master; busMaster.connect(AC.destination);
    busCrowd =AC.createGain(); busCrowd.gain.value=0; busCrowd.connect(busMaster);
    return AC;
  }
  function resume(){ if(AC&&AC.state==='suspended') AC.resume(); }
  ['pointerdown','touchstart','keydown','click'].forEach(ev=>
    addEventListener(ev,()=>{ ensure(); resume(); }, {passive:true, once:false}));

  /* ---------- CROWD AMBIENCE (filtered noise bed, breathes with play) ---------- */
  function buildCrowd(){
    if(crowdNode||!AC) return;
    const N=2*AC.sampleRate, buf=AC.createBuffer(1,N,AC.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<N;i++) d[i]=(Math.random()*2-1);
    crowdNode=AC.createBufferSource(); crowdNode.buffer=buf; crowdNode.loop=true;
    const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=780; lp.Q.value=0.6;
    const hp=AC.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=120;
    crowdGain=AC.createGain(); crowdGain.gain.value=1;
    crowdNode.connect(lp); lp.connect(hp); hp.connect(crowdGain); crowdGain.connect(busCrowd);
    crowdNode.start();
    // slow random swell so it never sounds static
    (function swell(){ if(!AC)return;
      const t=AC.currentTime, base=0.55+Math.random()*0.5;
      crowdGain.gain.cancelScheduledValues(t);
      crowdGain.gain.linearRampToValueAtTime(base, t+2+Math.random()*3);
      setTimeout(swell, 2500+Math.random()*3000);
    })();
  }
  // short cheer/roar burst (goal / big save)
  SFX.cheer=function(intensity){
    if(!SFX.on||!ensure()) return; resume(); buildCrowd();
    const t=AC.currentTime, g=AC.createGain();
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime((intensity||1)*0.9,t+0.15);
    g.gain.exponentialRampToValueAtTime(0.001,t+1.8);
    const src=AC.createBufferSource();
    const N=AC.sampleRate*2, b=AC.createBuffer(1,N,AC.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<N;i++) d[i]=(Math.random()*2-1);
    src.buffer=b;
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=650; bp.Q.value=0.7;
    src.connect(bp); bp.connect(g); g.connect(busMaster); src.start(t); src.stop(t+1.9);
  };

  /* ---------- REFEREE WHISTLE (two-tone FM, like a pea whistle) ---------- */
  SFX.whistle=function(kind){ // kind: 'kickoff' | 'goal' | 'foul' | 'full'
    if(!SFX.on||!ensure()) return; resume();
    // if the context is still suspended (no gesture yet), retry once it resumes
    if(AC.state==='suspended'){ AC.resume().then(()=>SFX.whistle(kind)).catch(()=>{}); return; }
    const t=AC.currentTime, v=SFX.whistleVol*SFX.master;
    const g=AC.createGain(); g.connect(busMaster);
    const o=AC.createOscillator(); o.type='triangle';
    const trill=AC.createOscillator(); trill.type='sine'; trill.frequency.value=22;
    const td=AC.createGain(); td.gain.value=90; trill.connect(td); td.connect(o.frequency);
    o.frequency.value=2450; o.connect(g); o.start(t); trill.start(t);
    const blast=(t0,dur,vol)=>{ g.gain.setValueAtTime(0,t0);
      g.gain.linearRampToValueAtTime(vol,t0+0.02);
      g.gain.setValueAtTime(vol,t0+dur-0.05);
      g.gain.exponentialRampToValueAtTime(0.001,t0+dur); };
    let end;
    if(kind==='kickoff'||kind==='goal'){ blast(t,0.5,0.5*v); end=t+0.55; }
    else if(kind==='full'){ blast(t,0.28,0.5*v); blast(t+0.34,0.28,0.5*v); blast(t+0.68,0.7,0.55*v); end=t+1.45; }
    else { blast(t,0.16,0.45*v); blast(t+0.22,0.16,0.45*v); end=t+0.42; } // foul: two short pips
    o.stop(end); trill.stop(end);
    if(kind==='goal') SFX.cheer(1.0);
  };

  /* ---------- BALL KICK (thud + snap transient) ---------- */
  SFX.ballKick=function(power){ // power 0..1
    if(!SFX.on||!ensure()) return; resume();
    const t=AC.currentTime, v=SFX.kick*SFX.master*(0.6+(power||0.6)*0.6);
    // low thud
    const o=AC.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(55,t+0.12);
    const g=AC.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
    o.connect(g); g.connect(busMaster); o.start(t); o.stop(t+0.18);
    // click transient (leather snap)
    const N=AC.sampleRate*0.05, b=AC.createBuffer(1,N,AC.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<N;i++) d[i]=(Math.random()*2-1)*(1-i/N);
    const src=AC.createBufferSource(); src.buffer=b;
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2200; bp.Q.value=0.8;
    const cg=AC.createGain(); cg.gain.value=v*0.5;
    src.connect(bp); bp.connect(cg); cg.connect(busMaster); src.start(t); src.stop(t+0.05);
  };

  /* ---------- FOOTSTEP STOMP (soft turf thud) ---------- */
  SFX.step=function(){
    if(!SFX.on||!ensure()) return;
    const t=AC.currentTime, v=SFX.steps*SFX.master*(0.5+Math.random()*0.5);
    const N=AC.sampleRate*0.06, b=AC.createBuffer(1,N,AC.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<N;i++) d[i]=(Math.random()*2-1)*(1-i/N)*(1-i/N);
    const src=AC.createBufferSource(); src.buffer=b;
    const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420;
    const g=AC.createGain(); g.gain.value=v*0.5;
    src.connect(lp); lp.connect(g); g.connect(busMaster); src.start(t); src.stop(t+0.06);
  };

  /* ---------- CROWD DUCK (let cutscene video audio breathe) ---------- */
  let ducked=false;
  SFX.duck=function(level,secs){
    ducked=true;
    if(!AC||!busCrowd) return;
    const t=AC.currentTime;
    busCrowd.gain.cancelScheduledValues(t);
    busCrowd.gain.linearRampToValueAtTime(SFX.crowd*(level==null?0.22:level), t+(secs||0.25));
  };
  SFX.unduck=function(secs){
    ducked=false;
    if(!AC||!busCrowd) return;
    const t=AC.currentTime;
    busCrowd.gain.cancelScheduledValues(t);
    busCrowd.gain.linearRampToValueAtTime(SFX.crowd, t+(secs||0.6));
  };

  /* ---------- CINEMATIC ONE-SHOTS (super shot) ---------- */
  function noiseBuf(secs,shape){
    const N=Math.max(1,Math.floor(AC.sampleRate*secs));
    const b=AC.createBuffer(1,N,AC.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<N;i++){ const e=shape?shape(i/N):1; d[i]=(Math.random()*2-1)*e; }
    return b;
  }
  SFX.windup=function(secs){
    if(!SFX.on||!ensure()) return; resume();
    const dur=secs||4.0, t=AC.currentTime, v=SFX.master*0.30;
    const o=AC.createOscillator(); o.type='sawtooth';
    o.frequency.setValueAtTime(70,t); o.frequency.exponentialRampToValueAtTime(480,t+dur);
    const lp=AC.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.setValueAtTime(300,t); lp.frequency.exponentialRampToValueAtTime(3200,t+dur);
    const g=AC.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(v,t+dur*0.85);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(lp); lp.connect(g); g.connect(busMaster);
    o.start(t); o.stop(t+dur+0.05);
    SFX._windupOsc=o;
  };
  SFX.windupStop=function(){ try{ if(SFX._windupOsc) SFX._windupOsc.stop(); }catch(e){} SFX._windupOsc=null; };
  SFX.whoosh=function(secs){
    if(!SFX.on||!ensure()) return; resume();
    const dur=secs||0.9, t=AC.currentTime, v=SFX.master*0.5;
    const src=AC.createBufferSource(); src.buffer=noiseBuf(dur,x=>Math.sin(Math.PI*x));
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.1;
    bp.frequency.setValueAtTime(1800,t); bp.frequency.exponentialRampToValueAtTime(320,t+dur);
    const g=AC.createGain(); g.gain.value=v;
    src.connect(bp); bp.connect(g); g.connect(busMaster);
    src.start(t); src.stop(t+dur);
  };
  SFX.impact=function(){
    if(!SFX.on||!ensure()) return; resume();
    const t=AC.currentTime, v=SFX.master*0.85;
    const o=AC.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(38,t+0.22);
    const g=AC.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.28);
    o.connect(g); g.connect(busMaster); o.start(t); o.stop(t+0.3);
    const src=AC.createBufferSource(); src.buffer=noiseBuf(0.18,x=>Math.pow(1-x,2));
    const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400;
    const ng=AC.createGain(); ng.gain.value=v*0.6;
    src.connect(lp); lp.connect(ng); ng.connect(busMaster); src.start(t); src.stop(t+0.18);
  };
  SFX.save=function(){
    if(!SFX.on||!ensure()) return; resume();
    const t=AC.currentTime, v=SFX.master*0.7;
    const src=AC.createBufferSource(); src.buffer=noiseBuf(0.14,x=>Math.pow(1-x,1.6));
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=900; bp.Q.value=0.7;
    const g=AC.createGain(); g.gain.value=v;
    src.connect(bp); bp.connect(g); g.connect(busMaster); src.start(t); src.stop(t+0.14);
    const o=AC.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(210,t); o.frequency.exponentialRampToValueAtTime(80,t+0.13);
    const og=AC.createGain(); og.gain.setValueAtTime(v*0.7,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.16);
    o.connect(og); og.connect(busMaster); o.start(t); o.stop(t+0.17);
  };

  /* ---------- ENGINE WATCHER (auto-fire from game state, no game.js edits) ---------- */
  let prevPhase=null, prevScoreH=null, prevScoreA=null, prevKick=false, matchLive=false, kickoffDone=false;
  const stepClock={};   // per-player footstep cadence
  function num(x){ return typeof x==='number'?x:0; }
  let _lastStepScan=0;
  function watch(){
    requestAnimationFrame(watch);
    if(!SFX.on||typeof G==='undefined'||!G){ return; }
    // idle-cheap: outside a live match there's nothing to synth — bail before
    // touching the audio graph so the menu costs nothing.
    if(!G.mt && !matchLive){ return; }
    ensure();
    // keep bus gains live
    if(busMaster) busMaster.gain.value=SFX.master;
    // crowd on only during live match phases
    const live=(G.phase==='moving'||G.phase==='pass_anim'||G.phase==='duel'||G.phase==='duel_result');
    if(live && !matchLive){ matchLive=true; buildCrowd();
      if(busCrowd&&!ducked) busCrowd.gain.linearRampToValueAtTime(SFX.crowd, (AC?AC.currentTime:0)+1.5);
      if(!kickoffDone){ kickoffDone=true; SFX.whistle('kickoff'); } }
    if(!live && matchLive){ matchLive=false;
      if(busCrowd&&AC&&!ducked) busCrowd.gain.linearRampToValueAtTime(0, AC.currentTime+1.0); }

    // ball kick — on entering pass_anim
    const kicking=(G.phase==='pass_anim');
    if(kicking&&!prevKick&&!G._cineHold){
      const shot=!!(G._shotTrail||G._shotZone);
      SFX.ballKick(shot?1.0:0.55);
    }
    prevKick=kicking;

    // goal detection — the engine only keeps G.hG / G.aG
    {
      const sh=num(G.hG), sa=num(G.aG);
      if(prevScoreH!==null && (sh>prevScoreH||sa>prevScoreA)){ SFX.impact(); SFX.whistle('goal'); }
      prevScoreH=sh; prevScoreA=sa;
    }

    // footstep stomps — cadence per moving player (throttled ~30Hz, not per frame)
    if(live && typeof PP!=='undefined' && performance.now()-_lastStepScan>=33){
      _lastStepScan=performance.now();
      const now=performance.now();
      ['h','a'].forEach(s=>{ const side=PP[s]; if(!side)return;
        for(const k in side){ const p=side[k]; if(!p)continue;
          const id=s+':'+k, st=stepClock[id]||(stepClock[id]={x:p.x,y:p.y,t:0});
          const d=Math.hypot(p.x-st.x, p.y-st.y);
          st.x=p.x; st.y=p.y;
          if(d>(W||1280)*0.0016 && now-st.t>230){ st.t=now; if(Math.random()<0.5) SFX.step(); }
        }
      });
    }
    prevPhase=G.phase;
  }
  requestAnimationFrame(watch);

  /* ---------- UI CLICK (soft synth blip for menu + in-game buttons) ---------- */
  SFX.click=function(){
    if(!SFX.on||!ensure()) return; resume();
    if(AC.state==='suspended'){ AC.resume().catch(()=>{}); }
    const t=AC.currentTime, v=SFX.master*0.35;
    const o=AC.createOscillator(); o.type='triangle';
    o.frequency.setValueAtTime(660,t); o.frequency.exponentialRampToValueAtTime(880,t+0.05);
    const g=AC.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
    o.connect(g); g.connect(busMaster); o.start(t); o.stop(t+0.1);
  };
  addEventListener('pointerdown',e=>{
    const el=e.target&&e.target.closest&&e.target.closest(
      'button,.btn,[role="button"],a,.menu-item,.tap,[data-sfx]');
    if(el) SFX.click();
  }, {passive:true, capture:true});

  console.log('[SFX] audio module active — whistle / crowd / steps / kick');
})();
