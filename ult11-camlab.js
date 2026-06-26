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
  /* ---- FREE-MOVEMENT MODE ----
     You wanted no CPU opponent and free movement. The engine only lets the
     human steer while G.poss==='h', and opponents chase via ROLES.engager +
     trigger duels. So each frame we:
       • null ROLES.engager / G.chk  → nobody chases, no duel ever triggers
       • force possession to 'h'      → you always control your carrier
       • clear any duel that slips through
     Opponents still drift to formation shape (harmless bodies for framing).   */
  function freeMoveFrame(){
    if(LAB.active){
      try{
        if(typeof ROLES!=='undefined'&&ROLES){ ROLES.engager=null; ROLES.cover=null; }
        if(typeof G!=='undefined'&&G){
          G.chk=null;
          if(G.phase==='duel'||G.phase==='duel_result') resolveDuelInstant();
          // keep control on the human side so manual steering stays enabled
          if(G.poss!=='h' && G.phase==='moving'){
            const hq=(typeof sq==='function')?sq('h'):null;
            const hk = G.ck && hq && hq[G.ck] ? G.ck
                     : (hq?Object.keys(hq).find(k=>hq[k]&&hq[k].pos!=='GK'):null);
            if(hk){ G.poss='h'; G.ck=hk; if(typeof updP==='function')updP(); if(typeof updH==='function')updH(); }
          }
        }
      }catch(e){}
    }
    requestAnimationFrame(freeMoveFrame);
  }
  requestAnimationFrame(freeMoveFrame);

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

  /* ---- when leaving the match, deactivate the lab (best-effort) ---- */
  if(typeof window.showSc==='function'){
    const _origShowSc = window.showSc;
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
    title.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:4px';
    const tt=document.createElement('span');
    tt.textContent='CAMERA LAB';
    tt.style.cssText='font:800 13px system-ui;letter-spacing:.18em;color:#f0c040';
    const hide=document.createElement('button');
    hide.textContent='✕';
    hide.style.cssText='font:800 14px system-ui;color:#f0c040;background:transparent;border:0;cursor:pointer;padding:0 4px';
    hide.onclick=()=>{ panel.style.display='none'; showReopen(); };
    title.append(tt,hide);
    panel.appendChild(title);

    const C=P3D.cam, B=P3D.bowl;
    panel.appendChild(section('CAMERA'));
    panel.appendChild(row('Distance',  20,90,1,  ()=>C.dist,     v=>C.dist=v));
    panel.appendChild(row('Height',    6,60,1,   ()=>C.height,   v=>C.height=v));
    panel.appendChild(row('FOV',       20,70,1,  ()=>C.fov,      v=>C.fov=v));
    panel.appendChild(row('Elevation', 0.1,1.3,0.01, ()=>C.phi,  v=>C.phi=v));
    panel.appendChild(row('Look Y',    0,8,0.1,  ()=>C.lookY,    v=>C.lookY=v));
    panel.appendChild(row('Lift',      0,12,0.5, ()=>C.lift,     v=>C.lift=v));
    panel.appendChild(row('Follow spd',1,25,0.5, ()=>C.followLerp, v=>C.followLerp=v));
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

    panel.appendChild(section('PLAYERS'));
    panel.appendChild(row('Sprite size', 0.02,0.10,0.001, ()=>P3D.spriteFrac, v=>P3D.spriteFrac=v));

    panel.appendChild(section('LIGHTING'));
    const L=P3D.light, al=()=>{ if(P3D._applyLight) P3D._applyLight(); };
    panel.appendChild(row('Sun angle',  0,6.28,0.01, ()=>L.azim,      v=>{L.azim=v; al();}));
    panel.appendChild(row('Sun height', 0.05,1,0.01, ()=>L.elev,      v=>{L.elev=v; al();}));
    panel.appendChild(row('Key light',  0,3,0.05,    ()=>L.key,       v=>{L.key=v; al();}));
    panel.appendChild(row('Ambient',    0,2,0.05,    ()=>L.ambient,   v=>{L.ambient=v; al();}));
    panel.appendChild(row('Warmth',     0,1,0.01,    ()=>L.warmth,    v=>{L.warmth=v; al();}));
    panel.appendChild(row('Shadow',     0,0.9,0.01,  ()=>L.shadow,    v=>{L.shadow=v;}));
    panel.appendChild(row('Shadow len', 0,2,0.05,    ()=>L.shadowLen, v=>{L.shadowLen=v;}));
    panel.appendChild(row('Sun glow',   0,1,0.01,    ()=>L.glow,      v=>{L.glow=v; al();}));

    panel.appendChild(section('POST FX'));
    const F=P3D.fx, af=()=>{ if(P3D._applyFx) P3D._applyFx(); };
    const fxg=document.createElement('div'); fxg.style.cssText='display:flex;flex-wrap:wrap;margin-bottom:2px';
    fxg.appendChild(toggle('FX', ()=>F.on, v=>{F.on=v;}));
    panel.appendChild(fxg);
    panel.appendChild(row('Bloom',      0,2,0.05,    ()=>F.bloom,       v=>{F.bloom=v; af();}));
    panel.appendChild(row('Bloom size', 0,1,0.01,    ()=>F.bloomRadius, v=>{F.bloomRadius=v; af();}));
    panel.appendChild(row('Bloom thr',  0,1,0.01,    ()=>F.bloomThresh, v=>{F.bloomThresh=v; af();}));
    panel.appendChild(row('Tilt-shift', 0,1,0.01,    ()=>F.tilt,        v=>{F.tilt=v; af();}));
    panel.appendChild(row('Vignette',   0,1,0.01,    ()=>F.vignette,    v=>{F.vignette=v; af();}));

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
        +'bowl: '+JSON.stringify(P3D.bowl,null,2)+',\n'
        +'light: '+JSON.stringify(P3D.light,null,2)+',\n'
        +'fx: '+JSON.stringify(P3D.fx,null,2);
      try{ navigator.clipboard.writeText(out); copy.textContent='✓ COPIED'; }
      catch(e){ console.log(out); copy.textContent='✓ LOGGED (console)'; }
      setTimeout(()=>copy.textContent='⧉ COPY FINAL VALUES',1400);
    };
    panel.appendChild(copy);

    // save to localStorage — persists across reloads (camera + stadium + light)
    const save=document.createElement('button');
    save.textContent='💾 SAVE SETTINGS';
    save.style.cssText='width:100%;margin-top:6px;font:800 11px system-ui;letter-spacing:.08em;color:#04140c;'
      +'background:#1f9d63;border:0;border-radius:7px;padding:8px;cursor:pointer';
    save.onclick=()=>{
      const ok=window.P3D && P3D.saveCam && P3D.saveCam();
      save.textContent=ok?'✓ SAVED':'✗ SAVE FAILED';
      setTimeout(()=>save.textContent='💾 SAVE SETTINGS',1400);
    };
    panel.appendChild(save);

    // exit
    const exit=document.createElement('button');
    exit.textContent='← EXIT TO MENU';
    exit.style.cssText='width:100%;margin-top:6px;font:700 10px system-ui;color:#cfd8e3;'
      +'background:rgba(18,28,46,.92);border:1px solid rgba(240,192,64,.3);border-radius:7px;padding:7px;cursor:pointer';
    exit.onclick=()=>{ if(typeof exitToMenu==='function') exitToMenu(); else showSc('s-home'); };
    panel.appendChild(exit);

    (document.querySelector('.mviews')||document.body).appendChild(panel);
  }
  let reopenBtn=null;
  function showReopen(){
    if(!reopenBtn){
      reopenBtn=document.createElement('button');
      reopenBtn.textContent='⚙ LAB';
      reopenBtn.style.cssText='position:absolute;right:8px;top:8px;z-index:201;font:800 11px system-ui;'
        +'letter-spacing:.08em;color:#04140c;background:#f0c040;border:0;border-radius:7px;padding:7px 10px;cursor:pointer';
      reopenBtn.onclick=()=>{ reopenBtn.style.display='none'; if(panel)panel.style.display='block'; };
      (document.querySelector('.mviews')||document.body).appendChild(reopenBtn);
    }
    reopenBtn.style.display='block';
  }
  function showPanel(){ if(!window.P3D){ return; } if(!panel) buildPanel(); panel.style.display='block'; if(reopenBtn)reopenBtn.style.display='none'; P3D.on=true; }
  function hidePanel(){ if(panel) panel.style.display='none'; }

  console.log('[CamLab] ready — launch via the Camera Lab menu entry or camLabStart()');
})();
