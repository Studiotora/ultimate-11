/* ============================================================
   ULT11-CAMLAB · Ultimate Eleven — "Camera Lab" dev mode
   A friendly match with NO duels, forced 2.5D, and a live tuning
   panel for the camera + stadium. Read-only over the engine; reuses
   startGame()/initMatch()/tick() exactly as a normal friendly.

   What it does:
     • New home-menu entry → camLabStart()
     • Picks two teams (or reuses current selHome/selAway) and launches
       a normal friendly via startGame().
     • Suppresses duels: window.opDuel is wrapped to no-op while the lab
       is active, so the ball just carries on (pure camera test).
     • Forces P3D.on = true and shows a slider panel bound to P3D.cam /
       P3D.bowl. Sliders rebuild the bowl / retune the camera live.
     • Sprite/shadow debug toggle (P3D.debug) — foot dot + shadow dot + x/y.
     • "Copy values" dumps the current cam+bowl config to the clipboard.

   LOAD ORDER (index.html): after game.js, after ult11-pitch3d.js.
   ============================================================ */
(function(){
  const LAB = window.CAMLAB = { active:false, noDuels:true };

  /* ---- duel suppression via PHASE WATCHER ----
     game.js declares opDuel/G as top-level (not on window), so wrapping
     window.opDuel won't intercept the engine's internal calls. Instead we
     watch G.phase every frame: the instant a duel opens while the lab is
     active, we close it and resolve possession so play flows on, no panel.
       • shot duel  → ball to defending GK
       • tackle duel → possession to the engager/defender                    */
  function resolveDuelInstant(){
    try{
      if(typeof G==='undefined'||!G) return;
      const as=G.poss, ds=as==='h'?'a':'h';
      const dq=(typeof sq==='function')?sq(ds):null;
      // engager if one was assigned (tackle), else GK (shot) — either way the
      // defending side gets the ball so play continues without a panel.
      let dk = G.chk || (dq && dq['GK'] ? 'GK' : (dq?Object.keys(dq).find(k=>dq[k]):null));
      if(typeof closeDuel==='function') closeDuel();
      if(dq && dk && dq[dk]){ G.poss=ds; G.ck=dk; }
      G.chk=null; G.pm=false; G.phase='moving';
      if(typeof G.kickoffUntil!=='undefined') G.kickoffUntil=Date.now()+300;
      if(typeof updP==='function') updP();
      if(typeof updH==='function') updH();
    }catch(e){ console.warn('[CamLab] duel resolve failed', e); }
  }
  function watchPhase(){
    if(LAB.active && LAB.noDuels && typeof G!=='undefined' && G &&
       (G.phase==='duel' || G.phase==='duel_result')){
      resolveDuelInstant();
    }
    requestAnimationFrame(watchPhase);
  }
  requestAnimationFrame(watchPhase);

  /* ---- launch: reuse the friendly flow ---- */
  function camLabStart(){
    LAB.active = true;
    // Ensure two valid teams via the engine's own commit path.
    try{
      const needTeams = (typeof selHome==='undefined'||!selHome||!selAway||selHome===selAway||
                         typeof HT==='undefined'||!HT||!AT);
      if(needTeams && typeof syncTeamSelections==='function'){
        if(typeof homeIdx!=='undefined'){ homeIdx=0; awayIdx=1; }
        syncTeamSelections();
      }
    }catch(e){ console.warn('[CamLab] team default failed', e); }
    if(typeof startGame!=='function'){ alert('Engine not ready'); return; }
    // force 2.5D on, with the lab camera + bowl defaults
    if(window.P3D){ P3D.on=true; }
    startGame();
    // panel + 2.5D come up once the match screen is live
    setTimeout(showPanel, 1500);
  }
  window.camLabStart = camLabStart;

  /* ---- when leaving the match, deactivate the lab ---- */
  const _origShowSc = window.showSc;
  if(typeof _origShowSc==='function'){
    window.showSc = function(id){
      if(id!=='s-match' && LAB.active){ LAB.active=false; hidePanel(); if(window.P3D)P3D.on=false; }
      return _origShowSc.apply(this, arguments);
    };
  }

  /* ════════ TUNING PANEL ════════ */
  let panel=null;
  function row(label, min,max,step, get,set){
    const wrap=document.createElement('label');
    wrap.style.cssText='display:flex;align-items:center;gap:8px;font:600 11px system-ui;color:#cfd8e3;margin:3px 0';
    const name=document.createElement('span'); name.textContent=label; name.style.cssText='flex:0 0 92px';
    const sl=document.createElement('input'); sl.type='range'; sl.min=min; sl.max=max; sl.step=step;
    sl.value=get(); sl.style.cssText='flex:1';
    const val=document.createElement('span'); val.textContent=(+get()).toFixed(step<1?2:0);
    val.style.cssText='flex:0 0 40px;text-align:right;color:#f0c040';
    sl.oninput=()=>{ set(+sl.value); val.textContent=(+sl.value).toFixed(step<1?2:0); };
    wrap.append(name,sl,val); return wrap;
  }
  function toggle(label, get,set){
    const b=document.createElement('button'); b.textContent=label+': '+(get()?'ON':'OFF');
    b.style.cssText='font:700 10px system-ui;letter-spacing:.05em;color:#cfd8e3;background:rgba(18,28,46,.92);'
      +'border:1px solid rgba(240,192,64,.3);border-radius:6px;padding:5px 8px;cursor:pointer;margin:2px';
    b.onclick=()=>{ set(!get()); b.textContent=label+': '+(get()?'ON':'OFF'); };
    return b;
  }
  function section(t){ const h=document.createElement('div');
    h.textContent=t; h.style.cssText='font:800 10px system-ui;letter-spacing:.12em;color:#6fa8ff;margin:8px 0 2px';
    return h; }

  function buildPanel(){
    panel=document.createElement('div');
    panel.id='camlab-panel';
    panel.style.cssText='position:absolute;right:8px;top:8px;z-index:200;width:268px;max-height:92%;overflow:auto;'
      +'background:rgba(8,14,26,.94);border:1px solid rgba(240,192,64,.25);border-radius:10px;padding:10px 12px;'
      +'backdrop-filter:blur(6px)';
    const title=document.createElement('div');
    title.textContent='CAMERA LAB';
    title.style.cssText='font:800 13px system-ui;letter-spacing:.18em;color:#f0c040;margin-bottom:4px';
    panel.appendChild(title);

    const C=P3D.cam, B=P3D.bowl;
    panel.appendChild(section('CAMERA'));
    panel.appendChild(row('Distance',  20,90,1,  ()=>C.dist,     v=>C.dist=v));
    panel.appendChild(row('Height',    6,60,1,   ()=>C.height,   v=>C.height=v));
    panel.appendChild(row('FOV',       20,70,1,  ()=>C.fov,      v=>C.fov=v));
    panel.appendChild(row('Elevation', 0.1,1.3,0.01, ()=>C.phi,  v=>C.phi=v));
    panel.appendChild(row('Look Y',    0,8,0.1,  ()=>C.lookY,    v=>C.lookY=v));
    panel.appendChild(row('Lift',      0,12,0.5, ()=>C.lift,     v=>C.lift=v));
    panel.appendChild(row('Follow spd',1,14,0.5, ()=>C.followLerp, v=>C.followLerp=v));
    panel.appendChild(row('Z-follow',  0,1,0.01, ()=>C.zFollow,  v=>C.zFollow=v));
    panel.appendChild(row('Inward yaw',0,1.2,0.01,()=>C.inwardYaw, v=>C.inwardYaw=v));

    panel.appendChild(section('STADIUM'));
    const reb=()=>{ if(P3D._rebuildBowl) P3D._rebuildBowl(); };
    panel.appendChild(row('Bowl gap',  0,30,1, ()=>B.gap,   v=>{B.gap=v; reb();}));
    panel.appendChild(row('Tier rake', 30,80,1,()=>B.rake,  v=>{B.rake=v; reb();}));
    panel.appendChild(row('Tier height',12,40,1,()=>B.tierH, v=>{B.tierH=v; reb();}));
    panel.appendChild(row('Y offset', -10,20,1, ()=>B.yOff, v=>{B.yOff=v; reb();}));
    const tg=document.createElement('div'); tg.style.cssText='display:flex;flex-wrap:wrap;margin-top:4px';
    tg.appendChild(toggle('Roof',   ()=>B.roof,      v=>{B.roof=v; reb();}));
    tg.appendChild(toggle('Sharp',  ()=>B.sharp,     v=>{B.sharp=v; reb();}));
    tg.appendChild(toggle('NearStand',()=>!B.openFront, v=>{B.openFront=!v; reb();}));
    panel.appendChild(tg);

    panel.appendChild(section('DEBUG'));
    const dg=document.createElement('div'); dg.style.cssText='display:flex;flex-wrap:wrap';
    dg.appendChild(toggle('Sprite dots', ()=>P3D.debug, v=>P3D.debug=v));
    panel.appendChild(dg);

    // copy values
    const copy=document.createElement('button');
    copy.textContent='⧉ COPY FINAL VALUES';
    copy.style.cssText='width:100%;margin-top:10px;font:800 11px system-ui;letter-spacing:.08em;color:#04140c;'
      +'background:#f0c040;border:0;border-radius:7px;padding:8px;cursor:pointer';
    copy.onclick=()=>{
      const out='// Camera Lab — paste into P3D defaults in ult11-pitch3d.js\n'
        +'cam: '+JSON.stringify(P3D.cam,null,2)+',\n'
        +'bowl: '+JSON.stringify(P3D.bowl,null,2);
      try{ navigator.clipboard.writeText(out); copy.textContent='✓ COPIED'; }
      catch(e){ console.log(out); copy.textContent='✓ LOGGED (console)'; }
      setTimeout(()=>copy.textContent='⧉ COPY FINAL VALUES',1400);
    };
    panel.appendChild(copy);

    // exit
    const exit=document.createElement('button');
    exit.textContent='← EXIT TO MENU';
    exit.style.cssText='width:100%;margin-top:6px;font:700 10px system-ui;color:#cfd8e3;'
      +'background:rgba(18,28,46,.92);border:1px solid rgba(240,192,64,.3);border-radius:7px;padding:7px;cursor:pointer';
    exit.onclick=()=>{ if(typeof exitToMenu==='function') exitToMenu(); else showSc('s-home'); };
    panel.appendChild(exit);

    (document.querySelector('.mviews')||document.body).appendChild(panel);
  }
  function showPanel(){ if(!window.P3D){ return; } if(!panel) buildPanel(); panel.style.display='block'; P3D.on=true; }
  function hidePanel(){ if(panel) panel.style.display='none'; }

  console.log('[CamLab] ready — launch via the Camera Lab menu entry or camLabStart()');
})();
