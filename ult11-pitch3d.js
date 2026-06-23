/* ============================================================
   ULT11-PITCH3D  ·  Ultimate Eleven
   2.5D (HD-2D) stadium renderer — a READ-ONLY three.js layer that
   draws the live match in a broadcast-side 3D view.

   CONTRACT (important):
     • game.js stays the single source of truth. This layer never
       moves a player, never passes, never touches G/PP/ball.
       It ONLY reads PP[s][k].{x,y}, ball.{x,y}, G.* each frame and
       draws billboards + stadium + ball in 3D.
     • Toggle: window.P3D.on = true/false   (default OFF)
       Also: a 3D button is injected next to the PS1 button if found.
     • Coexists with ps1-mod.js: both wrap window.draw. When 3D is ON
       we hide the 2D canvas content (the 3D canvas covers it) but the
       engine 2D draw still runs underneath for free (cheap; can be
       short-circuited later — see P3D.suppress2D).

   LOAD ORDER in index.html (after game.js, after ps1-mod.js):
     <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
     <script src="ps1-mod.js"></script>
     <script src="ult11-pitch3d.js"></script>
   (three.js can also be lazy-loaded — this file will inject it if THREE is missing.)

   ASSETS (see ASSET-PATHS.md): all PNGs live under assets/stadium/ and
   the existing assets/ps1/ sheets are reused for players.
   ============================================================ */
(function(){
  const P3D = window.P3D = {
    on:false,
    suppress2D:true,     // when on, blank the 2D canvas so only 3D shows
    // camera (broadcast band — deliberately constrained so it can't break HD-2D)
    cam:{ height:26, dist:46, fov:38, zoomIn:0.5,
          phiMin:0.34, phiMax:0.82, thetaLimit:0.20 },  // tight clamps vs the sandbox
    bowl:{ yOff:0, rScale:1.0, radStep:1.0, yStep:1.4 },
    spriteScale:1.9,     // billboard height vs engine token radius CR
    ready:false
  };

  /* ---- wait for the engine canvas + globals ---- */
  function boot(){
    const CV = document.getElementById('C');
    if(!CV || typeof window.draw!=='function' || typeof PP==='undefined'){
      return setTimeout(boot, 120);
    }
    if(typeof window.THREE==='undefined'){
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload=()=>init(CV); s.onerror=()=>console.warn('[P3D] three.js failed to load');
      document.head.appendChild(s);
    } else init(CV);
  }

  function init(CV){
    const T=window.THREE;

    /* ---- overlay canvas, sized to #C, sitting directly on top ---- */
    const gl=document.createElement('canvas');
    gl.id='C3D';
    gl.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:2';
    CV.parentNode.insertBefore(gl, CV.nextSibling);

    const renderer=new T.WebGLRenderer({canvas:gl,antialias:true,alpha:true});
    const scene=new T.Scene();
    scene.fog=new T.Fog('#16202e',180,560);
    const camera=new T.PerspectiveCamera(P3D.cam.fov,1,0.1,2000);

    // lighting is BAKED into the PNGs — keep it minimal & static.
    scene.add(new T.HemisphereLight('#ffe2a8','#1c2e16',0.65));
    const sun=new T.DirectionalLight('#ffd28a',1.1); sun.position.set(-60,80,40); scene.add(sun);

    /* ---- world scale: map engine px [0..W,0..H] → world units ---- */
    // We pick a fixed world pitch; engine coords are normalized into it each
    // frame, so it self-corrects if W/H change on resize/rotate.
    const PLEN=70;                       // world length (engine X / goal-to-goal)
    let   PWID=PLEN*0.62;                // world width  (engine Y / touchline)  set from field aspect
    function ex2wx(x){ return (x/ (window.W||1280) - 0.5) * PLEN; }   // engine x → world X
    function ey2wz(y){ return (y/ (window.H||720)  - 0.5) * PWID; }   // engine y → world Z

    /* ════════ PITCH ════════ */
    const loader=new T.TextureLoader();
    let pitchMesh=null;
    function buildPitch(tex,aspect){
      PWID=PLEN/(aspect||1.78);
      if(pitchMesh) scene.remove(pitchMesh);
      tex.anisotropy=8;
      pitchMesh=new T.Mesh(new T.PlaneGeometry(PLEN,PWID),
        new T.MeshBasicMaterial({map:tex}));        // unlit: lighting baked in
      pitchMesh.rotation.x=-Math.PI/2; scene.add(pitchMesh);
      placeAllStadium();
    }
    loader.load('assets/stadium/pitch.png',
      t=>buildPitch(t, t.image.width/t.image.height),
      undefined,
      ()=>{ // fallback: flat green
        const c=document.createElement('canvas');c.width=1280;c.height=720;
        const x=c.getContext('2d');x.fillStyle='#1f5a26';x.fillRect(0,0,1280,720);
        buildPitch(new T.CanvasTexture(c),1.78);
      });

    /* ════════ 9-PANEL FLAT TIERED STADIUM ════════
       3 walls (far touchline + both goal ends) × 3 tiers (lower/upper/roof).
       Near touchline omitted (camera side). Tiers step back + up. */
    const TIER = {
      lower: { depth:0.06, yBase:0.0, hScale:0.40, wScale:1.06 },
      upper: { depth:0.22, yBase:2.4, hScale:0.56, wScale:1.30 },
      roof:  { depth:0.40, yBase:5.2, hScale:0.86, wScale:1.58 },
    };
    const TIER_KEYS=['lower','upper','roof'];
    const LAYER_TEX={lower:null,upper:null,roof:null};
    const panels={far:{},cpu:{},plr:{}};

    function makePanel(tex,w,h){
      const m=new T.Mesh(new T.PlaneGeometry(w,h),
        new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false,fog:true}));
      return m;
    }
    function buildTier(tk){
      const TI=TIER[tk], tex=LAYER_TEX[tk]; if(!TI||!tex||!pitchMesh) return;
      const S=P3D.bowl;
      const depth=TI.depth*S.radStep, yb=TI.yBase*S.yStep + S.yOff;
      const h=PWID*TI.hScale, yC=yb+h/2;
      // far touchline (+Z toward camera; faces +Z so no rotation)
      if(panels.far[tk]) scene.remove(panels.far[tk]);
      { const w=PLEN*TI.wScale*S.rScale; const m=makePanel(tex,w,h);
        m.position.set(0, yC, -(PWID/2 + PWID*depth + PWID*0.04));
        m.renderOrder=-20+TIER_KEYS.indexOf(tk); panels.far[tk]=m; scene.add(m); }
      // end walls
      const endW=PWID*TI.wScale*1.15*S.rScale;
      [['cpu',+1],['plr',-1]].forEach(([side,sgn])=>{
        if(panels[side][tk]) scene.remove(panels[side][tk]);
        const m=makePanel(tex,endW,h);
        m.position.set(sgn*(PLEN/2 + PLEN*depth*0.5 + PLEN*0.03), yC, 0);
        m.rotation.y = sgn>0 ? -Math.PI/2 : Math.PI/2;
        m.renderOrder=-20+TIER_KEYS.indexOf(tk); panels[side][tk]=m; scene.add(m);
      });
    }
    function placeAllStadium(){ TIER_KEYS.forEach(buildTier); }
    function loadLayer(key){
      loader.load('assets/stadium/'+key+'.png',
        t=>{ t.anisotropy=8; LAYER_TEX[key]=t; if(pitchMesh) buildTier(key); },
        undefined,
        ()=>{ /* missing tier → silently skip; bowl still works with whatever loaded */ });
    }
    loadLayer('lower'); loadLayer('upper'); loadLayer('roof');

    /* ════════ PLAYER BILLBOARDS (reuse assets/ps1 sheets) ════════
       Same 7×6 grid + facing logic as ps1-mod. We keep a sprite per
       (side,key) and update its cell from engine movement each frame. */
    const GRID={cols:7,rows:6};
    const ROW={down:{run:0,act:3}, up:{run:1,act:4}, side:{run:2,act:5}};
    const COL={idle:0, run:[1,6], pass:[0,3], shoot:[3,4]};
    const SHEETS={h:null,a:null}; const _sk={h:undefined,a:undefined};
    function loadSheet(side,urls){
      let i=0; const next=()=>{ if(i>=urls.length){ if(!SHEETS[side])SHEETS[side]='none'; return; }
        const im=new Image(), u=urls[i++];
        im.onload=()=>SHEETS[side]={img:im, cw:im.width/GRID.cols, ch:im.height/GRID.rows};
        im.onerror=next; im.src=u; }; next();
    }
    function syncSheets(){
      const hk=(typeof selHome!=='undefined'&&selHome)?String(selHome).toLowerCase():null;
      const ak=(typeof selAway!=='undefined'&&selAway)?String(selAway).toLowerCase():null;
      if(hk!==_sk.h){ _sk.h=hk; loadSheet('h', hk?['assets/ps1/'+hk+'.png','assets/ps1/home.png']:['assets/ps1/home.png']); }
      if(ak!==_sk.a){ _sk.a=ak; loadSheet('a', ak?['assets/ps1/'+ak+'.png','assets/ps1/away.png']:['assets/ps1/away.png']); }
    }
    syncSheets();

    const sprites={};   // id -> {sprite, shadow, tex}
    const stt={};       // id -> facing/flip/ref state (mirrors ps1-mod.state)
    function ensureSprite(id, sheet){
      if(sprites[id]) return sprites[id];
      const tex=new T.Texture(sheet.img);
      tex.magFilter=T.NearestFilter; tex.minFilter=T.NearestFilter;
      tex.repeat.set(1/GRID.cols,1/GRID.rows); tex.needsUpdate=true;
      const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true}));
      sp.center.set(0.5,0); scene.add(sp);
      const sh=new T.Mesh(new T.CircleGeometry(0.9,16),
        new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.36}));
      sh.rotation.x=-Math.PI/2; sh.position.y=0.04; scene.add(sh);
      return sprites[id]={sprite:sp,shadow:sh,tex};
    }
    function cellState(id,p){
      const now=performance.now();
      const prev=stt[id]||{rx:p.x,ry:p.y,face:'side',flip:false,moveT:-1e9};
      const ddx=p.x-prev.rx, ddy=p.y-prev.ry, dist=Math.hypot(ddx,ddy);
      const thresh=(window.W||1280)*0.0015;
      let {rx,ry,face,flip,moveT}=prev;
      if(dist>thresh){
        if(Math.abs(ddx)>=Math.abs(ddy)){ face='side'; flip=ddx<0; }   // sheet faces right
        else { face=ddy>0?'down':'up'; }                               // +y toward camera
        moveT=now; rx=p.x; ry=p.y;
      }
      stt[id]={rx,ry,face,flip,moveT};
      const band=ROW[face]||ROW.side;
      const running=(now-moveT)<220;
      let col=COL.idle;
      if(running){ const R=COL.run; col=R[0]+(Math.floor(now/1000*11)%R[1]); }
      return {row:band.run, col, flip};
    }
    const seen=new Set();
    function syncPlayers(){
      seen.clear();
      ['h','a'].forEach(s=>{
        const sheet=SHEETS[s]; if(!sheet||sheet==='none'||!sheet.img.complete) return;
        const q=sq(s);
        Object.keys(q).forEach(k=>{
          const pl=q[k], p=PP[s] && PP[s][k]; if(!pl||!p) return;
          const id=s+':'+k; seen.add(id);
          const o=ensureSprite(id,sheet);
          // size from engine token radius CR, in world units (rough scale)
          const CRv=(typeof CR!=='undefined'?CR:13);
          const wpx=CRv*2*P3D.spriteScale;
          const hWorld=(wpx/(window.H||720))*PWID*1.7;   // map px height into world
          const wWorld=hWorld*(sheet.cw/sheet.ch);
          const st=cellState(id,p);
          o.tex.offset.set(st.col/GRID.cols, 1-(st.row+1)/GRID.rows);
          o.sprite.scale.set(wWorld*(st.flip?-1:1), hWorld, 1);
          const wx=ex2wx(p.x), wz=ey2wz(p.y);
          o.sprite.position.set(wx,0.05,wz);
          o.shadow.position.set(wx,0.04,wz);
          o.shadow.scale.setScalar(Math.max(0.5,wWorld*0.4));
        });
      });
      // hide sprites whose players vanished (subs, etc.)
      for(const id in sprites){ const vis=seen.has(id);
        sprites[id].sprite.visible=vis; sprites[id].shadow.visible=vis; }
    }

    /* ════════ BALL ════════ */
    const ballMesh=new T.Mesh(new T.SphereGeometry(0.22,16,12),
      new T.MeshBasicMaterial({color:'#f4f4f4'}));
    scene.add(ballMesh);
    function syncBall(){
      if(typeof ball==='undefined'||!ball) return;
      ballMesh.position.set(ex2wx(ball.x),0.22,ey2wz(ball.y));
    }

    /* ════════ CAMERA (broadcast, follows carrier, constrained) ════════ */
    const orbit={theta:0, phi:0.55};
    const camFocus={x:0,z:0,dist:P3D.cam.dist};
    // optional light user look (kept tiny so HD-2D never breaks)
    let drag=false,lx=0,ly=0;
    gl.style.pointerEvents='none';   // canvas itself ignores; we listen on #C's parent for drag
    const looker=CV.parentNode;
    looker.addEventListener('pointerdown',e=>{ if(!P3D.on)return; drag=true; lx=e.clientX; ly=e.clientY; });
    addEventListener('pointerup',()=>drag=false);
    addEventListener('pointermove',e=>{ if(!P3D.on||!drag)return;
      const C=P3D.cam;
      orbit.theta=Math.max(-C.thetaLimit,Math.min(C.thetaLimit,orbit.theta-(e.clientX-lx)*0.004));
      orbit.phi=Math.max(C.phiMin,Math.min(C.phiMax,orbit.phi+(e.clientY-ly)*0.003));
      lx=e.clientX; ly=e.clientY; });

    function carrierPos(){
      if(typeof G==='undefined'||!G||!G.poss||!G.ck) return null;
      const p=PP[G.poss] && PP[G.poss][G.ck]; return p||null;
    }
    function updateCamera(dt){
      const C=P3D.cam;
      camera.fov=C.fov; camera.updateProjectionMatrix();
      // focus = ball (so passes lead the eye) blended toward carrier
      let fx=0,fz=0;
      if(typeof ball!=='undefined'&&ball){ fx=ex2wx(ball.x); fz=ey2wz(ball.y); }
      const cp=carrierPos(); if(cp){ fx=(fx+ex2wx(cp.x))/2; fz=(fz+ey2wz(cp.y))/2; }
      const depth01=Math.max(0,Math.min(1,(-(fz)/(PWID/2))*0.5+0.5));
      const targetDist=C.dist - C.zoomIn*depth01*(C.dist*0.42);
      const k=Math.min(1,dt*6);
      camFocus.x+=(fx-camFocus.x)*k;
      camFocus.z+=(fz*0.35-camFocus.z)*k;     // partial Z so the view stays sideways
      camFocus.dist+=(targetDist-camFocus.dist)*k;
      const r=camFocus.dist, ph=orbit.phi, th=orbit.theta;
      camera.position.set(camFocus.x + r*Math.cos(ph)*Math.sin(th),
                          C.height*Math.sin(ph)+2,
                          camFocus.z + r*Math.cos(ph)*Math.cos(th));
      camera.lookAt(camFocus.x,1.0,camFocus.z);
    }

    /* ---- size sync to #C ---- */
    function resize(){
      const w=CV.clientWidth||CV.width, h=CV.clientHeight||CV.height;
      if(!w||!h) return;
      camera.aspect=w/h; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(w,h,false);
    }
    addEventListener('resize',resize);

    /* ---- hook draw(): render 3D after the engine's 2D pass ---- */
    let lastTs=performance.now();
    const _prevDraw=window.draw;          // (this is ps1-mod's wrapped draw — fine)
    window.draw=function(){
      _prevDraw();                         // engine (+PS1) draw 2D underneath
      if(!P3D.on){ if(gl.style.display!=='none'){gl.style.display='none'; if(P3D.suppress2D)CV.style.visibility='';} return; }
      if(gl.style.display==='none'){ gl.style.display='block'; resize(); if(P3D.suppress2D)CV.style.visibility='hidden'; }
      const now=performance.now(); const dt=Math.min(0.05,(now-lastTs)/1000); lastTs=now;
      syncSheets(); syncPlayers(); syncBall(); updateCamera(dt);
      renderer.render(scene,camera);
    };

    /* ---- inject a 3D toggle button next to PS1 button if present ---- */
    function injectButton(){
      // try to find the PS1 button or any toolbar; otherwise float one
      let host=document.querySelector('#fieldShotBtn');
      const b=document.createElement('button');
      b.textContent='2.5D';
      b.style.cssText='position:absolute;left:8px;top:8px;z-index:140;font:700 11px Orbitron,sans-serif;'
        +'letter-spacing:.1em;color:#cfd8e3;background:rgba(18,28,46,.92);border:1px solid rgba(240,192,64,.3);'
        +'border-radius:6px;padding:6px 10px;cursor:pointer';
      b.onclick=()=>{ P3D.on=!P3D.on; b.style.background=P3D.on?'#1f9d63':'rgba(18,28,46,.92)';
                      b.style.color=P3D.on?'#04140c':'#cfd8e3'; };
      document.querySelector('.mviews')?.appendChild(b) || document.body.appendChild(b);
    }
    injectButton();

    resize();
    P3D.ready=true;
    console.log('[P3D] 2.5D renderer ready — toggle via the 2.5D button or window.P3D.on=true');
  }

  boot();
})();
