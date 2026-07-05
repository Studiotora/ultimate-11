/* ============================================================
   ULT11-SFX  ·  Ultimate Eleven   ·  in-match sound
   Self-contained WebAudio synth — NO asset files, works offline.
   Reads engine state (G / PP / ball) the same way ps1-mod does,
   so it needs ZERO game.js edits. Load AFTER game.js.
   Console: SFX.on / SFX.master / SFX.crowd / SFX.mute()
   ============================================================ */
(function(){
  const SFX = window.SFX = {
    on:true, master:0.9, crowd:0.35, steps:0.5, kick:0.9, whistle:0.8,
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
    const t=AC.currentTime, v=SFX.whistle*SFX.master;
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

  /* ---------- ENGINE WATCHER (auto-fire from game state, no game.js edits) ---------- */
  let prevPhase=null, prevScoreH=null, prevScoreA=null, prevKick=false, matchLive=false;
  const stepClock={};   // per-player footstep cadence
  function num(x){ return typeof x==='number'?x:0; }
  function watch(){
    requestAnimationFrame(watch);
    if(!SFX.on||typeof G==='undefined'||!G){ return; }
    ensure();
    // keep bus gains live
    if(busMaster) busMaster.gain.value=SFX.master;
    // crowd on only during live match phases
    const live=(G.phase==='moving'||G.phase==='pass_anim'||G.phase==='duel'||G.phase==='duel_result');
    if(live && !matchLive){ matchLive=true; buildCrowd();
      if(busCrowd) busCrowd.gain.linearRampToValueAtTime(SFX.crowd, (AC?AC.currentTime:0)+1.5);
      SFX.whistle('kickoff'); }
    if(!live && matchLive){ matchLive=false;
      if(busCrowd&&AC) busCrowd.gain.linearRampToValueAtTime(0, AC.currentTime+1.0); }
    if(busCrowd&&matchLive) busCrowd.gain.value=busCrowd.gain.value; // (ramp target set above)

    // ball kick — on entering pass_anim
    const kicking=(G.phase==='pass_anim');
    if(kicking&&!prevKick){
      const shot=!!(G._shotTrail||G._shotZone);
      SFX.ballKick(shot?1.0:0.55);
    }
    prevKick=kicking;

    // goal detection — score changed
    if(typeof G.score==='object'&&G.score){
      const sh=num(G.score.h), sa=num(G.score.a);
      if(prevScoreH!==null && (sh>prevScoreH||sa>prevScoreA)){ SFX.whistle('goal'); }
      prevScoreH=sh; prevScoreA=sa;
    } else if(typeof scoreH!=='undefined'){
      if(prevScoreH!==null && (num(scoreH)>prevScoreH||num(scoreA)>prevScoreA)){ SFX.whistle('goal'); }
      prevScoreH=num(scoreH); prevScoreA=num(scoreA);
    }

    // footstep stomps — cadence per moving player
    if(live && typeof PP!=='undefined'){
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
  console.log('[SFX] audio module active — whistle / crowd / steps / kick');
})();
