/* ============================================================
   PS1-MOD  ·  Ultimate Eleven   (v2: anim + perf + no shake)
   Drop-in PSX look for the in-field engine. Two parts:
     1) POST-FX  — wraps draw(): low-res nearest upscale + dither.
     2) SPRITES  — side-profile billboards with a run cycle.
                   Activates only if assets/ps1/home.png & away.png
                   exist; otherwise the game keeps its disc tokens.
   Load AFTER game.js. Add ONE line in drawT (see notes).
   Console tuning: PS1.on / PS1.res / PS1.dither / PS1.spriteScale
   ============================================================ */
(function(){
  if(typeof window.draw!=='function'){ console.warn('[PS1] draw() not found — load after game.js'); return; }

  const PS1 = window.PS1 = {
    on:true, dither:true, scanlines:true, jitter:false, debug:true,
    pixelate:false,     // true = heavy PS1 framebuffer crush (blurs the nice sprites); off keeps them crisp
    res:300,            // internal framebuffer width (lower = chunkier)
    sprites:true,
    spriteScale:1.75,    // sprite height vs token radius
    runFps:11           // run-cycle speed
  };

  /* ---------- POST-FX ---------- */
  const low=document.createElement('canvas'), lctx=low.getContext('2d');
  let dither=null, lw=0, lh=0, jf=0, jx=0, jy=0;

  let dBlock=0;
  function buildDither(block){
    const s=block*2, t=document.createElement('canvas'); t.width=t.height=s;
    const c=t.getContext('2d');
    c.fillStyle='rgba(255,255,255,.04)'; c.fillRect(0,0,block,block);
    c.fillStyle='rgba(0,0,0,.04)';       c.fillRect(block,block,block,block);
    if(PS1.scanlines){ const lh2=Math.max(1,Math.round(block*0.5));
      c.fillStyle='rgba(0,0,0,.10)'; c.fillRect(0,0,s,lh2); c.fillRect(0,block,s,lh2); }
    dither=cx.createPattern(t,'repeat');
  }
  function ensureDither(){ const b=Math.max(2,Math.round(H/360)); if(b!==dBlock){ dBlock=b; buildDither(b); } }

  function postfx(){
    if(!W||!H) return;
    watchEvents();
    if(PS1.pixelate){                                   // heavy framebuffer crush (off by default)
      const want=Math.max(64,Math.round(PS1.res)), h=Math.round(want*H/W);
      if(want!==lw||h!==lh){ lw=want; lh=h; low.width=lw; low.height=lh; }
      lctx.imageSmoothingEnabled=false; lctx.clearRect(0,0,lw,lh);
      lctx.drawImage(CV,0,0,W,H,0,0,lw,lh);
      cx.imageSmoothingEnabled=false;
      cx.drawImage(low,0,0,lw,lh,0,0,W,H);
    }
    if(PS1.dither){ ensureDither(); if(dither){ cx.fillStyle=dither; cx.fillRect(0,0,W,H); } }
    cx.imageSmoothingEnabled=true;
    if(PS1.debug){
      const now=performance.now(); let run=0,tot=0;
      for(const id in ST){ tot++; if(now-ST[id].moveT<220)run++; }
      const fh=SHEETS.h&&SHEETS.h!=='none'?SHEETS.h.frames:'-';
      const fa=SHEETS.a&&SHEETS.a!=='none'?SHEETS.a.frames:'-';
      cx.save(); cx.setTransform(1,0,0,1,0,0);
      cx.fillStyle='rgba(0,0,0,.75)'; cx.fillRect(6,6,250,52);
      cx.fillStyle='#39ff7a'; cx.font='15px monospace';
      cx.fillText('PS1 sheets  h:'+fh+'f  a:'+fa+'f',14,26);
      cx.fillText('tracked:'+tot+'  running:'+run,14,46);
      cx.restore();
    }
  }

  const _origDraw=window.draw;
  window.draw=function(){ _origDraw(); if(PS1.on) postfx(); };

  /* ---------- SPRITES (side profile, run cycle, mirrored) ---------- */
  // Sheet = horizontal strip baked by ps1-sprite-baker.html:
  //   frame 0 = idle, frames 1..n = run cycle. Faces screen-right.
  const ASPECT = 128/192;                 // cell aspect from the baker
  const SHEETS = { h:null, a:null };
  const _sheetKey = { h:undefined, a:undefined };
  // Try a chain of URLs; first that loads wins. Old sheet stays visible
  // until the new one is ready (no flicker on team change).
  function loadSheet(side,urls){
    let i=0;
    const tryNext=()=>{
      if(i>=urls.length){ if(!SHEETS[side]) SHEETS[side]='none'; return; }
      const im=new Image(), url=urls[i++];
      im.onload=()=>{ let cw=im.height*ASPECT; let frames=Math.max(1,Math.round(im.width/cw));
                      SHEETS[side]={img:im, cw:im.width/frames, ch:im.height, frames};
                      console.log('[PS1] '+side+' sheet loaded: '+url, im.width+'x'+im.height, frames+' frames'); };
      im.onerror=tryNext;
      im.src=url;
    };
    tryNext();
  }
  // Per-team sheets: assets/ps1/{teamKey}.png (e.g. japan.png).
  // Missing file → falls back to home.png / away.png.
  function syncSheets(){
    const hk=(typeof selHome!=='undefined'&&selHome)?String(selHome).toLowerCase():null;
    const ak=(typeof selAway!=='undefined'&&selAway)?String(selAway).toLowerCase():null;
    if(hk!==_sheetKey.h){ _sheetKey.h=hk;
      loadSheet('h', hk?['assets/ps1/'+hk+'.png','assets/ps1/home.png']:['assets/ps1/home.png']); }
    if(ak!==_sheetKey.a){ _sheetKey.a=ak;
      loadSheet('a', ak?['assets/ps1/'+ak+'.png','assets/ps1/away.png']:['assets/ps1/away.png']); }
  }
  syncSheets();

  // sheet layout (combined): idle, run, pass, shoot   [start,count]
  const LAYOUT={ idle:0, run:[1,6], pass:[7,2], shoot:[9,3] };
  const ST={}, ACT={};
  window.PS1_action=(s,k,name)=>{ if(LAYOUT[name]) ACT[s+':'+k]={name,t0:performance.now()}; };

  // auto-detect passes/shots from the game's own state (no game.js edits)
  let lastCarrier=null, prevKick=false;
  function watchEvents(){
    syncSheets(); // team selection can change between matches — keep sheets in sync
    if(typeof G==='undefined'||!G) return;
    if(G.phase==='moving'&&G.poss&&G.ck) lastCarrier={s:G.poss,k:G.ck};
    const kicking = (G.phase==='pass_anim');
    if(kicking&&!prevKick&&lastCarrier){
      const shot=!!(G._shotTrail||G._shotZone);
      window.PS1_action(lastCarrier.s,lastCarrier.k, shot?'shoot':'pass');
    }
    prevKick=kicking;
  }

  function state(s,k,p,frames){
    const id=s+':'+k;
    const now=performance.now();
    const prev=ST[id]||{rx:p.x,ry:p.y,dir:0,moveT:-1e9};
    const ddx=p.x-prev.rx, ddy=p.y-prev.ry;       // displacement from reference point
    const dist=Math.hypot(ddx,ddy);
    const thresh=(W||1280)*0.0015;                // accumulate ~a few px before counting a step
    let rx=prev.rx, ry=prev.ry, dir=prev.dir, moveT=prev.moveT;
    if(dist>thresh){
      if(Math.abs(ddx)>thresh*0.4) dir = ddx>0?1:-1;
      moveT=now; rx=p.x; ry=p.y;                  // reset reference
    }
    ST[id]={rx,ry,dir,moveT};
    if(dir===0) dir=(typeof dirFor==='function'&&dirFor(s)>0)?1:-1;
    // one-shot pass/shoot animation override
    const act=ACT[id];
    if(act){
      const rng=LAYOUT[act.name], dur=act.name==='shoot'?480:360, el=now-act.t0;
      if(frames>=rng[0]+rng[1] && el<dur){
        const fi=Math.min(rng[1]-1, Math.floor(el/dur*rng[1]));
        return {dir, frame:rng[0]+fi};
      }
      delete ACT[id];
    }
    const running=(now-moveT)<220;                // recently moving -> run cycle
    let frame=0;
    if(frames>1 && running){
      const fps=PS1.runFps||11, R=LAYOUT.run;
      const rc=Math.max(1, Math.min(R[1], frames-R[0]));
      frame = R[0] + (Math.floor(now/1000*fps) % rc);
    }
    return {dir,frame};
  }

  // Called from drawT. Returns true if it rendered the player (skip default).
  window.PS1_drawSprite = function(s,k,pl,px,py,sc,iC,iCh){
    if(!PS1.on||!PS1.sprites) return false;
    const sh=SHEETS[s];
    if(!sh||sh==='none'||!sh.img.complete) return false;
    const p=PP[s][k]; if(!p) return false;

    const r=(typeof CR!=='undefined'?CR:13)*sc*(iC?1.15:1);
    const h=r*2*PS1.spriteScale, w=h*(sh.cw/sh.ch);
    const st=state(s,k,p,sh.frames);

    cx.save();
    cx.globalAlpha=1; // (was .6 for the chaser — players must never render transparent)
    cx.beginPath(); cx.ellipse(px,py+2*sc,w*0.28,w*0.13,0,0,Math.PI*2);
    cx.fillStyle='rgba(0,0,0,.4)'; cx.fill();
    // Rings: blue under the carrier, red under the chaser. Nothing else.
    if(iC||iCh){
      cx.beginPath(); cx.ellipse(px,py+2*sc,w*0.34,w*0.16,0,0,Math.PI*2);
      cx.lineWidth=2*sc; cx.strokeStyle=iC?'#2882f0':'#f03030'; cx.stroke();
    }
    cx.imageSmoothingEnabled=false;
    const sxc=st.frame*sh.cw, dx=px-w/2, dy=py-h+w*0.12;
    if(st.dir<0){ cx.save(); cx.translate(px,0); cx.scale(-1,1); cx.translate(-px,0);
                  cx.drawImage(sh.img,sxc,0,sh.cw,sh.ch,dx,dy,w,h); cx.restore(); }
    else        { cx.drawImage(sh.img,sxc,0,sh.cw,sh.ch,dx,dy,w,h); }
    cx.imageSmoothingEnabled=true;

    if(typeof jerseyNum==='function'){
      const num=String(jerseyNum(k,s));
      cx.font=`bold ${Math.round(9*sc)}px Orbitron,sans-serif`;
      cx.textAlign='center'; cx.textBaseline='middle';
      const ny=py-h+w*0.02;
      cx.lineWidth=Math.max(2,2.5*sc); cx.strokeStyle='rgba(0,0,0,.85)';
      cx.strokeText(num,px,ny); cx.fillStyle='#fff'; cx.fillText(num,px,ny);
    }
    cx.restore();
    return true;
  };

  console.log('[PS1] mod v2 active');
})();
