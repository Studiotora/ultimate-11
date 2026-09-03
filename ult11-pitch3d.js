/* ============================================================
   ULT11-PITCH3D  ·  Ultimate Eleven
   2.5D (HD-2D) stadium renderer — a READ-ONLY three.js layer that
   draws the live match in a broadcast-side 3D view.

   CONTRACT (important):
     • game.js stays the single source of truth. This layer never
       moves a player, never passes, never touches G/PP.
       ONE exception: during a super-shot cinematic it drives ball.x/y/bz
       directly — the engine is frozen by G._cineHold for the duration, so
       there is no contest for ball authority.
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

   ASSETS (see ASSET-PATHS.md): stand PNGs live under assets/stadium/ and
   the existing assets/ps1/ sheets are reused for players. The PITCH is
   procedural pixel turf by default (P3D.pixelPitch=true, P3D.pitchPx);
   set P3D.pixelPitch=false to load assets/stadium/pitch.png again.
   GFX UPGRADE PACK toggles: P3D.gfx.{sky,masts,lamps,boards,flags,flashes}.
   ============================================================ */
(function(){
  const P3D = window.P3D = {
    on:true,
    suppress2D:true,     // when on, blank the 2D canvas so only 3D shows
    // camera (broadcast band — deliberately constrained so it can't break HD-2D)
    cam:{ height:26, dist:46, fov:38, zoomIn:0.5,
          phiMin:0.34, phiMax:0.82, thetaLimit:0.20,
          // ---- Camera Lab tunables ----
          phi:0.55,          // fixed elevation when not dragging
          followLerp:11,     // how fast focus chases the carrier (higher = snappier)
          zFollow:0.45,      // 0=stay sideways at midline, 1=fully follow Z
          inwardYaw:0.55,    // how much the camera turns inward near the goals
          lookY:1.0,         // height of the look-at point
          lift:2 },          // extra camera height offset
    bowl:{ yOff:0, gap:0, rake:50, tierH:30, sharp:false, roof:true,
           openFront:true, mode:'crowd', tiers:{1:true,2:true,3:true} },
    // ---- STADIUM VARIANT ----
    // 'classic' = segmented photo-textured bowl (default)
    // 'oval'    = elliptical lit bowl from ult11-bowl2.js (secondary stadium)
    // Set via ?stadium=oval / ?stadium=classic (persists in localStorage),
    // or at runtime: P3D.stadium='oval'; P3D._rebuildBowl();
    stadium:(function(){
      try{
        const q=new URLSearchParams(location.search).get('stadium');
        if(q==='oval'||q==='classic'){ localStorage.setItem('ue_stadium',q); return q; }
        const s=localStorage.getItem('ue_stadium');
        if(s==='oval'||s==='classic') return s;
      }catch(e){}
      return 'classic';
    })(),
    spriteScale:1.9,     // (legacy) billboard height vs engine token radius CR
    spriteY:-0.12,       // vertical plant offset (negative sinks feet into pitch for low-angle cam)
    spriteFrac:0.045,    // billboard height as fraction of world pitch LENGTH (HD-2D)
    // ---- LIGHTING / SHADOWS (Camera Lab → LIGHTING) ----
    light:{ azim:3.14,    // sun NORTH → shadows cast SOUTH (+Z). Sun angle slider rotates this.
            elev:0.78,    // sun height 0..1 (lower = longer shadows, lower glow)
            key:1.35,     // directional key-light intensity (models the bowl)
            ambient:0.55, // hemisphere ambient intensity
            warmth:0.55,  // 0 cool → 1 warm (tints fog, key light, glow)
            shadow:0.40,  // player shadow opacity
            shade:0.45,   // stand/crowd darkening 0=bright .. 1=black (Stand shade slider)
            shadowLen:1.0,// player shadow stretch (with elev)
            castSil:true, // stretched silhouette cast shadow — P3D.light.castSil=false to kill
            glow:0.45 },  // warm sun-pool intensity on the pitch (0 = off)
    // ---- POST-PROCESSING (Camera Lab → POST FX); needs the post scripts in index.html ----
    fx:{ on:true, bloom:0.55, bloomRadius:0.5, bloomThresh:0.82, tilt:0.45, vignette:0.5,
         rays:0.55, rayDecay:0.95, raySamples:60,
         sat:1.0, contrast:1.0, lift:0.0, split:0.0 },   // grade: saturation/contrast/lift + warm-cool split-tone
    // ---- QUALITY / PERFORMANCE ----
    // 'auto' watches the framerate and steps quality down (then back up) to
    // hold ~55fps. Force a tier with ?q=low|med|high (great for a stable
    // trailer capture). 'high' = full FX + 2x DPR; 'low' = no post-FX, 1x DPR.
    quality:(function(){
      try{ const q=new URLSearchParams(location.search).get('q');
        if(['low','med','high','auto'].includes(q)) return q; }catch(e){}
      return 'auto';
    })(),
    _tier:'high',        // the live tier auto mode is currently applying
    debug:false,         // sprite/shadow debug overlay (Camera Lab)
    // ---- GFX UPGRADE PACK ----
    pixelPitch:true,     // procedural pixel-art turf instead of assets/stadium/pitch.png
    pitchPx:768,         // turf texture width in texels (lower = chunkier pixels)
    gfx:{ sky:true, masts:true, lamps:true, boards:true, flags:true, flashes:true },
    // super-shot cinematic camera (console-tunable): hold = charging aura, chase = ball flight
    cine:{ holdDist:9.6, holdHeight:1.55, holdSide:1.1, holdLookAhead:20, holdLookY:1.25,
           chaseDist:7.5, chaseHeight:2.4, chaseLookY:1.0 },
    // sprite animation cadence (frames per second) — console-tunable
    anim:{ runFpsMin:8, runFpsMax:13, idleFps:3, shootMs:720, passMs:520 },
    ready:true
  };
  // 2.5D is the ONLY renderer now — lock the flag so nothing (camlab,
  // stale localStorage, console) can flip the game back to flat 2D.
  try{Object.defineProperty(P3D,'on',{get:()=>true,set:()=>{},configurable:false});}catch(e){}

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

    /* ---- persisted camera / stadium / sprite settings (localStorage) ----
       Apply any saved tuning over the code defaults BEFORE the bowl + camera
       build, so a reload restores your last saved look. Save with P3D.saveCam()
       (e.g. from the console, or wire it to a Camera Lab button). */
    try{
      const saved=JSON.parse(localStorage.getItem('ue_p3d_cam')||'null');
      if(saved){
        if(saved.cam)  Object.assign(P3D.cam,  saved.cam);
        if(saved.bowl) Object.assign(P3D.bowl, saved.bowl);
        if(saved.light)Object.assign(P3D.light,saved.light);
        if(saved.fx)   Object.assign(P3D.fx,   saved.fx);
        if(saved.spriteFrac!=null) P3D.spriteFrac=saved.spriteFrac;
        if(saved.spriteY!=null) P3D.spriteY=saved.spriteY;
        console.log('[P3D] restored saved camera settings');
      }
    }catch(e){}
    P3D.saveCam=function(){
      try{
        localStorage.setItem('ue_p3d_cam', JSON.stringify(
          {cam:P3D.cam, bowl:P3D.bowl, light:P3D.light, fx:P3D.fx, spriteFrac:P3D.spriteFrac, spriteY:P3D.spriteY}));
        console.log('[P3D] camera settings saved — they will persist across reloads');
        return true;
      }catch(e){ console.warn('[P3D] saveCam failed',e); return false; }
    };
    P3D.clearCam=function(){ try{localStorage.removeItem('ue_p3d_cam');}catch(e){}
      console.log('[P3D] saved camera settings cleared (defaults on next reload)'); };

    /* ---- overlay canvas, sized to #C, sitting directly on top ---- */
    const gl=document.createElement('canvas');
    gl.id='C3D';
    gl.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:2';
    CV.parentNode.insertBefore(gl, CV.nextSibling);

    const renderer=new T.WebGLRenderer({canvas:gl,antialias:true,alpha:true});
    const scene=new T.Scene();
    scene.fog=new T.Fog('#16202e',180,560);
    const camera=new T.PerspectiveCamera(P3D.cam.fov,1,0.1,2000);

    /* ---- LIGHTS (live-tunable via P3D.light / Camera Lab) ----
       The pitch & crowd are pre-lit MeshBasic photos, so these lights mostly
       model the bowl structure (Lambert) + set the overall warm mood. The
       on-pitch "sun" is faked with an additive glow plane (see pitchGlow). */
    const hemi=new T.HemisphereLight('#ffe2a8','#1c2e16',0.55);
    scene.add(hemi);
    const sun=new T.DirectionalLight('#ffd28a',1.35);
    scene.add(sun);
    // lerp helper: cool→warm color by t
    function mix(a,b,t){ return a+(b-a)*t; }
    function warmColor(t){ // t=0 cool blue-white, t=1 golden
      const r=mix(0.78,1.00,t), g=mix(0.85,0.84,t), b=mix(1.00,0.62,t);
      return new T.Color(r,g,b);
    }
    function applyLight(){
      const Lt=P3D.light;
      const az=Lt.azim, el=Math.max(0.05,Math.min(1,Lt.elev));
      // sun sits opposite the cast direction, raised by elevation
      const horiz=Math.cos(el*Math.PI/2), vert=Math.sin(el*Math.PI/2);
      sun.position.set(Math.sin(az)*horiz*120, vert*120+20, Math.cos(az)*horiz*120);
      sun.intensity=Lt.key;
      sun.color.copy(warmColor(Lt.warmth));
      hemi.intensity=Lt.ambient;
      hemi.color.copy(warmColor(Lt.warmth*0.8));
      // fog: warm haze when warm, cool when cold
      const fogCol=new T.Color().copy(warmColor(Lt.warmth)).multiplyScalar(0.5);
      if(scene.fog) scene.fog.color.copy(fogCol);
      if(typeof updatePitchGlow==='function') updatePitchGlow();
      // live stand darkening (Stand shade slider)
      try{
        const sh=Math.max(0.05,1-(Lt.shade!=null?Lt.shade:0.45));
        scene.traverse(o=>{
          const m=o.material; if(!m) return;
          (Array.isArray(m)?m:[m]).forEach(mm=>{
            if(mm&&mm.userData&&mm.userData.isStand&&mm.color) mm.color.setScalar(sh);
            if(mm&&mm.userData&&mm.userData.isShadow) mm.opacity=Lt.shadow;
          });
        });
      }catch(e){}
    }
    P3D._applyLight=applyLight;     // Camera Lab calls this when light sliders change
    let updatePitchGlow=null;       // defined once pitchGlow exists (after pitch build)

    /* soft round shadow + warm sun-pool textures (shared) */
    function makeRadialTex(stops){
      const c=document.createElement('canvas'); c.width=c.height=128;
      const x=c.getContext('2d'); const g=x.createRadialGradient(64,64,2,64,64,63);
      stops.forEach(s=>g.addColorStop(s[0],s[1])); x.fillStyle=g; x.fillRect(0,0,128,128);
      const t=new T.CanvasTexture(c); t.minFilter=T.LinearFilter; t.magFilter=T.LinearFilter; return t;
    }
    const SHADOW_TEX=makeRadialTex([[0,'rgba(0,0,0,0.62)'],[0.55,'rgba(0,0,0,0.32)'],[1,'rgba(0,0,0,0)']]);
    const GLOW_TEX  =makeRadialTex([[0,'rgba(255,226,150,0.9)'],[0.5,'rgba(255,210,130,0.35)'],[1,'rgba(255,200,120,0)']]);
    // warm sun-pool on the grass — additive fake light (pitch itself is unlit)
    const pitchGlow=new T.Mesh(new T.PlaneGeometry(1,1),
      new T.MeshBasicMaterial({map:GLOW_TEX,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:0.45}));
    pitchGlow.rotation.x=-Math.PI/2; pitchGlow.position.y=0.02; pitchGlow.renderOrder=1; scene.add(pitchGlow);
    updatePitchGlow=function(){
      const Lt=P3D.light, az=Lt.azim, el=Math.max(0.05,Math.min(1,Lt.elev));
      const reach=PWID*(0.30+(1-el)*0.25);                 // glow sits toward sun side
      pitchGlow.position.set(-Math.sin(az)*reach, 0.02, -Math.cos(az)*reach);
      const size=PWID*(1.5+(1-el)*0.6);
      pitchGlow.scale.set(size,size,1);
      pitchGlow.material.opacity=Lt.glow;
      pitchGlow.visible=Lt.glow>0.001;
    };
    // reusable math for directional player shadows
    const _AX=new T.Vector3(1,0,0), _AY=new T.Vector3(0,1,0);
    const _qF=new T.Quaternion(), _qS=new T.Quaternion();

    /* ---- world scale: map engine px [0..W,0..H] → world units ---- */
    // We pick a fixed world pitch; engine coords are normalized into it each
    // frame, so it self-corrects if W/H change on resize/rotate.
    const PLEN=70;                       // world length (engine X / goal-to-goal)
    let   PWID=PLEN*0.62;                // world width  (engine Y / touchline)  set from field aspect
    // EXACT engine logical pitch (from drawDebugPitch in game.js):
    //   goal-lines x=0.07 & 0.93 ; sidelines y=0.01 & 0.99.
    // Map those onto the plane edges so 3D matches the 2D engine 1:1.
    const M3D={x0:0.07,x1:0.93,y0:0.01,y1:0.99};
    const fbCx=(M3D.x0+M3D.x1)/2, fbCy=(M3D.y0+M3D.y1)/2;
    const fbSx=(M3D.x1-M3D.x0)||1, fbSy=(M3D.y1-M3D.y0)||1;
    function ex2wx(x){ return ((x/(CV.width ||1280)) - fbCx)/fbSx * PLEN; }
    function ey2wz(y){ return ((y/(CV.height|| 720)) - fbCy)/fbSy * PWID; }

    /* ════════ PITCH ════════ */
    const loader=new T.TextureLoader();
    let pitchMesh=null, apronMesh=null;
    const goalGroup=new T.Group(); scene.add(goalGroup);

    /* ════════ DEBUG PITCH (procedural — no PNG) ════════
       Draw the field on a canvas using the EXACT engine logical constants so
       the 3D markings sit where the 2D engine puts them. The plane spans the
       engine playable rect (x .07–.93, y .01–.99); the canvas is drawn in that
       same normalized space. Engine x/y coordinate ticks are printed so we can
       read off alignment directly. Toggle: window.DEBUG_PITCH3D (default true). */
    function makeDebugPitchTex(){
      const cw=2048, ch=Math.round(cw*0.641);   // world aspect PWID/PLEN
      const c=document.createElement('canvas'); c.width=cw; c.height=ch;
      const x=c.getContext('2d');
      // grass with mow stripes
      for(let i=0;i<10;i++){ x.fillStyle=(i%2)?'#3f7d34':'#478a3a';
        x.fillRect(i*cw/10,0,cw/10,ch); }
      // The plane = engine rect [.07,.93]x[.01,.99]. Convert an engine fraction
      // (ex,ey in 0..1 of W,H) to canvas px within that rect:
      const EX0=0.07,EX1=0.93,EY0=0.01,EY1=0.99;
      const u=ex=>((ex-EX0)/(EX1-EX0))*cw;
      const v=ey=>((ey-EY0)/(EY1-EY0))*ch;
      x.lineWidth=Math.max(2,cw*0.0016); x.strokeStyle='rgba(255,255,255,.95)';
      const L=(x1,y1,x2,y2)=>{x.beginPath();x.moveTo(u(x1),v(y1));x.lineTo(u(x2),v(y2));x.stroke();};
      const gL=0.07,gR=0.93,Yt=0.01,Yb=0.99;
      // outer + halfway
      L(gL,Yt,gR,Yt); L(gL,Yb,gR,Yb); L(gL,Yt,gL,Yb); L(gR,Yt,gR,Yb); L(0.5,Yt,0.5,Yb);
      // centre circle r=0.085·W → in engine-x units; convert to canvas
      const cr=0.085*( cw/(EX1-EX0) );           // 0.085 of W mapped to canvas px
      x.beginPath(); x.arc(u(0.5),v(0.5),cr,0,7); x.stroke();
      x.beginPath(); x.arc(u(0.5),v(0.5),cw*0.004,0,7); x.fillStyle='#fff'; x.fill();
      // penalty box: depth .16·W, y .22–.78
      const pa=0.16;
      L(gR,0.22,gR-pa,0.22); L(gR-pa,0.22,gR-pa,0.78); L(gR-pa,0.78,gR,0.78);
      L(gL,0.22,gL+pa,0.22); L(gL+pa,0.22,gL+pa,0.78); L(gL+pa,0.78,gL,0.78);
      // goal box: depth .06·W, y .38–.62
      const ga=0.06;
      L(gR,0.38,gR-ga,0.38); L(gR-ga,0.38,gR-ga,0.62); L(gR-ga,0.62,gR,0.62);
      L(gL,0.38,gL+ga,0.38); L(gL+ga,0.38,gL+ga,0.62); L(gL+ga,0.62,gL,0.62);
      // penalty spots x .11 from each goal
      [[gR-0.11,0.5],[gL+0.11,0.5]].forEach(s=>{x.beginPath();x.arc(u(s[0]),v(s[1]),cw*0.003,0,7);x.fillStyle='#fff';x.fill();});
      // COORDINATE TICKS — engine x along top, engine y along left (in W/H px)
      x.fillStyle='#ffe14d'; x.font='bold '+Math.round(cw*0.013)+'px monospace';
      x.textAlign='center'; x.textBaseline='top';
      for(let ex=0.1; ex<=0.9; ex+=0.1){ const px=u(ex);
        L(ex,Yt,ex,Yt+0.012); x.fillText('x'+Math.round(ex*(CV.width||1280)), px, v(Yt)+6); }
      x.textAlign='left'; x.textBaseline='middle';
      for(let ey=0.1; ey<=0.9; ey+=0.1){ const py=v(ey);
        L(gL,ey,gL+0.01,ey); x.fillText('y'+Math.round(ey*(CV.height||720)), u(gL)+8, py); }
      const tex=new T.CanvasTexture(c); tex.anisotropy=8; return tex;
    }
    /* ════════ PIXEL PITCH (procedural — no PNG) ════════
       Chunky ordered-dither turf drawn at P3D.pitchPx texels across the
       playable rect, nearest-filtered so every texel stays a crisp square
       under the camera. Markings come from the SAME engine constants as the
       debug pitch, so play still lines up 1:1. Toggle: P3D.pixelPitch. */
    function makePixelPitchTex(){
      const cw=Math.max(256,Math.round(P3D.pitchPx||768)), ch=Math.round(cw*0.641);
      const c=document.createElement('canvas'); c.width=cw; c.height=ch;
      const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
      let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      const EX0=0.07,EX1=0.93,EY0=0.01,EY1=0.99;
      const u=ex=>((ex-EX0)/(EX1-EX0))*cw, v=ey=>((ey-EY0)/(EY1-EY0))*ch;
      // 1) mow stripes — 14 bands, light/dark
      const NB=14, bw=cw/NB, LIGHT=[62,120,52], DARK=[42,92,38];
      for(let i=0;i<NB;i++){ const col=(i%2)?DARK:LIGHT;
        x.fillStyle='rgb('+col[0]+','+col[1]+','+col[2]+')'; x.fillRect(Math.round(i*bw),0,Math.ceil(bw)+1,ch); }
      // 2) pixel grain — 2-texel cells, plus a cross-mow checker and worn patches
      const cell=Math.max(2,Math.round(cw/384));
      const img=x.getImageData(0,0,cw,ch), d=img.data;
      for(let py=0;py<ch;py+=cell){
        for(let px=0;px<cw;px+=cell){
          const r=rnd(); let dv=0;
          if(r<0.10)dv=15; else if(r<0.22)dv=7; else if(r<0.34)dv=-6; else if(r<0.40)dv=-13;
          dv+=(Math.floor((py/ch)*8)%2)?3:-3;                       // cross-mow bands
          const ex=px/cw, ey=py/ch;
          let wear=Math.max(0,1-Math.hypot((ex-0.5)*2.2,(ey-0.5)*1.4)*3)*0.5;   // centre circle
          if((ex<0.13||ex>0.87)&&Math.abs(ey-0.5)<0.26) wear+=0.35*(1-Math.abs(ey-0.5)/0.26); // goalmouths
          wear*=0.6+0.4*rnd();
          for(let yy=0;yy<cell;yy++)for(let xx=0;xx<cell;xx++){
            const i=((py+yy)*cw+(px+xx))*4; if(i>=d.length)continue;
            d[i]  =Math.max(0,Math.min(255,d[i]  +dv+wear*40));
            d[i+1]=Math.max(0,Math.min(255,d[i+1]+dv+wear*10));
            d[i+2]=Math.max(0,Math.min(255,d[i+2]+dv*0.6-wear*14));
          }
        }
      }
      x.putImageData(img,0,0);
      // 3) crisp pixel markings (rects + sampled arcs, snapped to the cell grid)
      const LW=cell*2, snap=q=>Math.round(q/cell)*cell;
      x.fillStyle='#f3f5ee';
      const HL=(x1,y1,x2,y2)=>{ const ax=snap(u(x1)),ay=snap(v(y1)),bx=snap(u(x2)),by=snap(v(y2));
        if(ax===bx) x.fillRect(ax-LW/2,Math.min(ay,by)-LW/2,LW,Math.abs(by-ay)+LW);
        else        x.fillRect(Math.min(ax,bx)-LW/2,ay-LW/2,Math.abs(bx-ax)+LW,LW); };
      const ARC=(cxp,cyp,r,a0,a1)=>{ const n=Math.max(24,Math.round(r*2.5));
        for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n;
          x.fillRect(snap(cxp+Math.cos(a)*r)-LW/2,snap(cyp+Math.sin(a)*r)-LW/2,LW,LW); } };
      const DOT=(cxp,cyp)=>x.fillRect(snap(cxp)-LW,snap(cyp)-LW,LW*2,LW*2);
      const gL=0.07,gR=0.93,Yt=0.01,Yb=0.99, sx=cw/(EX1-EX0);
      HL(gL,Yt,gR,Yt); HL(gL,Yb,gR,Yb); HL(gL,Yt,gL,Yb); HL(gR,Yt,gR,Yb); HL(0.5,Yt,0.5,Yb);
      const cr=0.085*sx; ARC(u(0.5),v(0.5),cr,0,Math.PI*2); DOT(u(0.5),v(0.5));
      const pa=0.16, ga=0.06;
      HL(gR,0.22,gR-pa,0.22); HL(gR-pa,0.22,gR-pa,0.78); HL(gR-pa,0.78,gR,0.78);
      HL(gL,0.22,gL+pa,0.22); HL(gL+pa,0.22,gL+pa,0.78); HL(gL+pa,0.78,gL,0.78);
      HL(gR,0.38,gR-ga,0.38); HL(gR-ga,0.38,gR-ga,0.62); HL(gR-ga,0.62,gR,0.62);
      HL(gL,0.38,gL+ga,0.38); HL(gL+ga,0.38,gL+ga,0.62); HL(gL+ga,0.62,gL,0.62);
      DOT(u(gR-0.11),v(0.5)); DOT(u(gL+0.11),v(0.5));
      const dA=Math.acos(Math.min(1,(0.05*sx)/cr));                 // penalty-arc "D" outside the box
      ARC(u(gR-0.11),v(0.5),cr,Math.PI-dA,Math.PI+dA); ARC(u(gL+0.11),v(0.5),cr,-dA,dA);
      const qr=cw*0.012;                                            // corner quadrants
      ARC(u(gL),v(Yt),qr,0,Math.PI/2); ARC(u(gR),v(Yt),qr,Math.PI/2,Math.PI);
      ARC(u(gR),v(Yb),qr,Math.PI,Math.PI*1.5); ARC(u(gL),v(Yb),qr,Math.PI*1.5,Math.PI*2);
      const tex=new T.CanvasTexture(c);
      tex.magFilter=T.NearestFilter; tex.minFilter=T.LinearMipmapLinearFilter; tex.anisotropy=8;
      return tex;
    }
    function makeApronTex(){
      const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
      x.fillStyle='#3a7030'; x.fillRect(0,0,256,256);
      let seed=99; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      for(let py=0;py<256;py+=2)for(let px=0;px<256;px+=2){ const r=rnd(); if(r<0.5)continue;
        x.fillStyle=r<0.7?'#34662c':r<0.85?'#3f7a36':r<0.95?'#457f3b':'#2c5a26'; x.fillRect(px,py,2,2); }
      const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping;
      t.magFilter=T.NearestFilter; t.minFilter=T.LinearMipmapLinearFilter; t.anisotropy=8; return t;
    }
    function buildApron(){
      if(apronMesh) scene.remove(apronMesh);
      const aL=PLEN*2.4, aW=PWID*2.4;
      let mat;
      if(P3D.pixelPitch!==false){ const t=makeApronTex(); t.repeat.set(aL/24,aW/24); mat=new T.MeshBasicMaterial({map:t}); }
      else mat=new T.MeshBasicMaterial({color:0x4c8c3f});
      apronMesh=new T.Mesh(new T.PlaneGeometry(aL,aW),mat);
      apronMesh.rotation.x=-Math.PI/2; apronMesh.position.y=-0.05;
      scene.add(apronMesh);
    }
    function buildGoals(){
      goalGroup.clear();
      // net = repeating diamond-mesh canvas texture (reads as real netting)
      function netTex(rx,ry){
        const c=document.createElement('canvas');c.width=c.height=64;
        const x=c.getContext('2d');x.clearRect(0,0,64,64);
        x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=1.5;
        for(let i=-64;i<=128;i+=16){
          x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();
          x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();
        }
        const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);
        return t;
      }
      const netMatFor=(rx,ry)=>new T.MeshBasicMaterial({map:netTex(rx,ry),transparent:true,
        opacity:0.5,side:T.DoubleSide,depthWrite:false});
      const postMat=new T.MeshLambertMaterial({color:0xe8e8e8});   // shaded, not glow-white
      const HW=PWID*0.052;          // half goal-mouth
      const GH=PWID*0.030;          // crossbar height
      const DEP=PWID*0.030;         // net depth at the ground
      const TOPD=DEP*0.5;           // net depth at the top (box shape)
      const r=PWID*0.0009;          // post radius — thin
      const NPM=8;                  // ~net cells per meter-ish density
      [-1,1].forEach(side=>{
        const gx=side*(PLEN/2);
        const tx=gx+side*TOPD;      // top-back rail x
        const bx=gx+side*DEP;       // ground-back bar x
        const g=new T.Group();
        // front uprights + crossbar
        [-HW,HW].forEach(z=>{
          const p=new T.Mesh(new T.CylinderGeometry(r,r,GH,10),postMat);
          p.position.set(gx,GH/2,z); g.add(p);
        });
        const cb=new T.Mesh(new T.CylinderGeometry(r,r,HW*2+r*2,10),postMat);
        cb.rotation.x=Math.PI/2; cb.position.set(gx,GH,0); g.add(cb);
        // thin back frame: top-back rail, ground bar, and corner stanchions
        const tb=new T.Mesh(new T.CylinderGeometry(r*0.6,r*0.6,HW*2,8),postMat);
        tb.rotation.x=Math.PI/2; tb.position.set(tx,GH,0); g.add(tb);
        const bb=new T.Mesh(new T.CylinderGeometry(r*0.6,r*0.6,HW*2,8),postMat);
        bb.rotation.x=Math.PI/2; bb.position.set(bx,r,0); g.add(bb);
        [-HW,HW].forEach(z=>{
          // short top link front→top-back
          const l1=new T.Mesh(new T.CylinderGeometry(r*0.55,r*0.55,TOPD,6),postMat);
          l1.rotation.z=Math.PI/2; l1.position.set((gx+tx)/2,GH,z); g.add(l1);
          // slope rail top-back→ground-back
          const len=Math.hypot(DEP-TOPD,GH);
          const l2=new T.Mesh(new T.CylinderGeometry(r*0.55,r*0.55,len,6),postMat);
          l2.position.set((tx+bx)/2,GH/2,z);
          l2.rotation.z=side*Math.atan2(DEP-TOPD,GH);
          g.add(l2);
        });
        // ── NET PANELS (each sized + UV-repeated so the mesh is continuous) ──
        // roof: front crossbar → top-back rail (horizontal)
        const roof=new T.Mesh(new T.PlaneGeometry(TOPD,HW*2),netMatFor(TOPD*NPM,HW*2*NPM));
        roof.rotation.set(-Math.PI/2,0,0);        // flat: local x→world X (depth), y→Z (span)
        roof.position.set((gx+tx)/2,GH,0); g.add(roof);
        // back: top-back rail → ground bar (slanted, edges meet both rails)
        const slant=Math.hypot(DEP-TOPD,GH);
        const back=new T.Mesh(new T.PlaneGeometry(HW*2,slant),netMatFor(HW*2*NPM,slant*NPM));
        back.position.set((tx+bx)/2,GH/2,0);
        back.rotation.y=Math.PI/2;
        back.rotation.x=side*Math.atan2(DEP-TOPD,GH);
        g.add(back);
        // sides: true profile polygon (front post → top link → slope → ground)
        [-HW,HW].forEach(z=>{
          const sh=new T.Shape();
          sh.moveTo(0,0); sh.lineTo(0,GH); sh.lineTo(side*TOPD,GH); sh.lineTo(side*DEP,0);
          sh.closePath();
          const sd=new T.Mesh(new T.ShapeGeometry(sh),netMatFor(DEP*NPM,GH*NPM));
          // ShapeGeometry lies in XY = exactly a side panel's plane (normal = Z)
          sd.position.set(gx,0,z);
          g.add(sd);
        });
        goalGroup.add(g);
      });
    }
    function buildPitch(tex,aspect){
      PWID=PLEN*0.641;                              // engine playable-rect aspect
      if(pitchMesh) scene.remove(pitchMesh);
      pitchMesh=new T.Mesh(new T.PlaneGeometry(PLEN,PWID),
        new T.MeshBasicMaterial({map:tex}));
      pitchMesh.rotation.x=-Math.PI/2; pitchMesh.position.y=0; scene.add(pitchMesh);
      buildApron(); buildGoals(); placeAllStadium();
    }
    /* NOTE: the initial buildPitch() call lives lower down, AFTER the bowl
       consts (crowdTex / bowlGroup / TIER_TEX / CORNER_TEX) are declared —
       calling it here would hit those in the temporal dead zone and throw,
       killing init() before the render loop/buttons register. */

    /* ════════ SEGMENTED BOWL STADIUM (ported from stadium-live sandbox) ════════
       Each tier = 4 straight walls + 4 corners. Straights take a flat crowd
       strip (no stretch); corners take their own texture. Risers fill the gap
       between tiers; a base hoarding closes the near side so no void shows.
       Tunable live via P3D.bowl (driven by Camera Lab sliders). */
    const TIER_KEY=['lower','upper','roof'];
    const TIER_TEX={lower:null,upper:null,roof:null};
    const CORNER_TEX={lower:null,upper:null,roof:null};
    let bowlGroup=new T.Group(); scene.add(bowlGroup);

    function makeCrowdTexture(){
      const c=document.createElement('canvas'); c.width=512;c.height=128;
      const x=c.getContext('2d'); x.fillStyle='#11161f'; x.fillRect(0,0,512,128);
      const cols=['#c94f4f','#d9d2c8','#3b6fb0','#e0b15a','#4c8c5a','#bcc4cc','#8a5a8f'];
      for(let i=0;i<5200;i++){ x.fillStyle=cols[(Math.random()*cols.length)|0];
        x.fillRect(Math.random()*512, Math.random()*128, 2.2, 2.6); }
      const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(18,1);
      return t;
    }
    const crowdTex=makeCrowdTexture();

    function buildStraightWall(ax,az,bx,bz, yB,yT, out, mat, uRepeat){
      const dx=bx-ax, dz=bz-az, len=Math.hypot(dx,dz)||1;
      let nx=dz/len, nz=-dx/len; const mxp=(ax+bx)/2, mzp=(az+bz)/2;
      if(nx*mxp+nz*mzp<0){ nx=-nx; nz=-nz; }
      const aBot=[ax,yB,az], bBot=[bx,yB,bz];
      const aTop=[ax+nx*out,yT,az+nz*out], bTop=[bx+nx*out,yT,bz+nz*out];
      const g=new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(
        [...aBot,...bBot,...bTop, ...aBot,...bTop,...aTop],3));
      const u=uRepeat||1;
      g.setAttribute('uv', new T.Float32BufferAttribute([0,0,u,0,u,1, 0,0,u,1,0,1],2));
      g.computeVertexNormals();
      return new T.Mesh(g,mat);
    }
    function buildRiser(blHL,blHW, tlHL,tlHW, r, yB,yT, mat, sharp, openFront){
      const grp=new T.Group(); const seg=sharp?1:6;
      const ring=(hl,hw)=>({hl:hl-r, hw:hw-r});
      const lo=ring(blHL,blHW), hi=ring(tlHL,tlHW);
      const sides=[
        ['back',  [-lo.hl,-blHW],[ lo.hl,-blHW], [-hi.hl,-tlHW],[ hi.hl,-tlHW]],
        ['right', [ blHL,-lo.hw],[ blHL, lo.hw], [ tlHL,-hi.hw],[ tlHL, hi.hw]],
        ['front', [ lo.hl, blHW],[-lo.hl, blHW], [ hi.hl, tlHW],[-hi.hl, tlHW]],
        ['left',  [-blHL, lo.hw],[-blHL,-lo.hw], [-tlHL, hi.hw],[-tlHL,-hi.hw]],
      ];
      for(const [name,la,lb,ha,hb] of sides){
        if(openFront && name==='front') continue;
        const g=new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(
          [la[0],yB,la[1], lb[0],yB,lb[1], hb[0],yT,hb[1],
           la[0],yB,la[1], hb[0],yT,hb[1], ha[0],yT,ha[1]],3));
        g.computeVertexNormals(); grp.add(new T.Mesh(g,mat));
      }
      const corners=[
        ['c_br', lo.hl,-lo.hw, hi.hl,-hi.hw, -Math.PI/2],
        ['c_fr', lo.hl, lo.hw, hi.hl, hi.hw, 0],
        ['c_fl',-lo.hl, lo.hw,-hi.hl, hi.hw, Math.PI/2],
        ['c_bl',-lo.hl,-lo.hw,-hi.hl,-hi.hw, Math.PI],
      ];
      for(const [name,lcx,lcz,hcx,hcz,a0] of corners){
        if(openFront && (name==='c_fl'||name==='c_fr')) continue;
        const pos=[];
        for(let i=0;i<seg;i++){
          const t0=a0+(Math.PI/2)*(i/seg), t1=a0+(Math.PI/2)*((i+1)/seg);
          const lax=lcx+Math.cos(t0)*r, laz=lcz+Math.sin(t0)*r;
          const lbx=lcx+Math.cos(t1)*r, lbz=lcz+Math.sin(t1)*r;
          const hax=hcx+Math.cos(t0)*r, haz=hcz+Math.sin(t0)*r;
          const hbx=hcx+Math.cos(t1)*r, hbz=hcz+Math.sin(t1)*r;
          pos.push(lax,yB,laz, lbx,yB,lbz, hbx,yT,hbz, lax,yB,laz, hbx,yT,hbz, hax,yT,haz);
        }
        const g=new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos,3));
        g.computeVertexNormals(); grp.add(new T.Mesh(g,mat));
      }
      return grp;
    }
    function buildCorner(cx,cz, r, a0, yB,yT, out, mat, sharp){
      const seg=sharp?1:6; const positions=[], uvs=[];
      for(let i=0;i<seg;i++){
        const t0=a0+(Math.PI/2)*(i/seg), t1=a0+(Math.PI/2)*((i+1)/seg);
        const ax=cx+Math.cos(t0)*r, az=cz+Math.sin(t0)*r;
        const bx=cx+Math.cos(t1)*r, bz=cz+Math.sin(t1)*r;
        const aOut=[Math.cos(t0),Math.sin(t0)], bOut=[Math.cos(t1),Math.sin(t1)];
        const aBot=[ax,yB,az], bBot=[bx,yB,bz];
        const aTop=[ax+aOut[0]*out,yT,az+aOut[1]*out], bTop=[bx+bOut[0]*out,yT,bz+bOut[1]*out];
        const u0=i/seg, u1=(i+1)/seg;
        positions.push(...aBot,...bBot,...bTop, ...aBot,...bTop,...aTop);
        uvs.push(u0,0,u1,0,u1,1, u0,0,u1,1,u0,1);
      }
      const g=new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(positions,3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uvs,2));
      g.computeVertexNormals();
      return new T.Mesh(g,mat);
    }
    function mkTexMat(tex){
      let m=tex;
      if(!m || m.image===undefined || (m.image&&m.image.width===0)) m=crowdTex;
      if(m===crowdTex){ m=m.clone(); m.wrapS=m.wrapT=T.RepeatWrapping; m.needsUpdate=true; }
      const sh=1-(P3D.light.shade!=null?P3D.light.shade:0.45);
      const m2=new T.MeshBasicMaterial({map:m, color:0xffffff, side:T.DoubleSide});
      m2.color.setScalar(Math.max(0.05,sh));
      m2.userData.isStand=true;
      return m2;
    }
    function buildTierSegmented(ihl,ihw,r, yB,yT, out, opts){
      const grp=new T.Group(); const {backMat,texFor,openFront,sharp}=opts;
      const hl=ihl-r, hw=ihw-r;
      const walls=[
        ['back', -hl,-ihw,  hl,-ihw],
        ['right', ihl,-hw,  ihl, hw],
        ['front', hl, ihw, -hl, ihw],
        ['left', -ihl, hw, -ihl,-hw],
      ];
      const corners=[
        ['c_br', hl,-hw, -Math.PI/2],['c_fr', hl, hw, 0],
        ['c_fl',-hl, hw,  Math.PI/2],['c_bl',-hl,-hw, Math.PI],
      ];
      for(const [name,ax,az,bx,bz] of walls){
        if(openFront && name==='front') continue;
        const back=buildStraightWall(ax,az,bx,bz, yB,yT, out, backMat,1);
        back.renderOrder=0; grp.add(back);
        const tm=texFor&&texFor(name,false);
        if(tm){ const t=buildStraightWall(ax,az,bx,bz, yB-0.15,yT+0.15, out-0.6, tm, 1);
          t.renderOrder=10; grp.add(t); }
      }
      for(const [name,cx,cz,a0] of corners){
        if(openFront && (name==='c_fl'||name==='c_fr')) continue;
        const back=buildCorner(cx,cz,r,a0, yB,yT, out, backMat, sharp);
        back.renderOrder=0; grp.add(back);
        const tm=texFor&&texFor(name,true);
        if(tm){ const t=buildCorner(cx,cz,r,a0, yB-0.15,yT+0.15, out-0.6, tm, sharp);
          t.renderOrder=10; grp.add(t); }
      }
      return grp;
    }

    // master bowl build — reads P3D.bowl live. Re-callable any time (Camera Lab).
    function placeAllStadium(){
      if(!pitchMesh) return;
      scene.remove(bowlGroup); bowlGroup=new T.Group(); scene.add(bowlGroup);
      // ---- OVAL secondary stadium (ult11-bowl2.js) ----
      if(P3D.stadium==='oval' && window.U11_OVAL){
        try{ window.U11_OVAL.build(T,bowlGroup,PLEN,PWID); }
        catch(e){ if(/[?&]debug=1/.test(location.search)) alert('OVAL build failed: '+e.message); }
        if(bowlGroup.children.length){ _bowlInfo={type:'oval'}; try{buildExtras();}catch(e){console.warn('[P3D] extras',e);} return; }
      }
      if(P3D.stadium==='oval' && !window.U11_OVAL && /[?&]debug=1/.test(location.search)){
        alert('OVAL selected but ult11-bowl2.js not loaded — check index.html script tag');
      }
      const S=P3D.bowl;
      // The sandbox was tuned at pitch 300x190. The live pitch is ~70x43, so
      // every absolute dimension must scale by U = PWID/190 to reproduce the
      // SAME proportions. Sliders stay in sandbox units; U converts to world.
      const U = PWID/190;
      const RUNOFF = 6*U;                                   // tight apron — stands hug the pitch
      const baseHL = PLEN/2 + RUNOFF + (S.gap||0)*U;
      const baseHW = PWID/2 + RUNOFF + (S.gap||0)*U;
      const r = (S.sharp? 40 : 60) * U;                     // corner radius, scaled
      const th = (S.tierH!=null?S.tierH:30) * U;            // tier height, scaled
      const rakeRad = (S.rake!=null?S.rake:50)*Math.PI/180;
      const out = th/Math.tan(rakeRad);
      const of = (S.openFront!=null)? S.openFront : true;
      const mode = S.mode||'crowd';
      const DIAG=['#2f6bd6','#8a3fd6','#d63f54'];

      let yB=(S.yOff||0)*U, ihl=baseHL, ihw=baseHW, prevTop=null; const tierInfo=[];
      for(let n=1;n<=3;n++){
        if(S.tiers && S.tiers[n]===false){ yB+=th*0.92; ihl+=out*0.92; ihw+=out*0.92; continue; }
        const key=TIER_KEY[n-1], idx=n-1;
        const backMat=(mode==='color')
          ? new T.MeshLambertMaterial({color:DIAG[idx], side:T.DoubleSide})
          : new T.MeshLambertMaterial({color:'#39434f', side:T.DoubleSide});
        if(prevTop){
          const fillMat=new T.MeshLambertMaterial({color:'#2b333d', side:T.DoubleSide});
          bowlGroup.add(buildRiser(prevTop.ihl,prevTop.ihw, ihl,ihw, r, prevTop.y, yB, fillMat, S.sharp, of));
        }
        const texFor=(segName,isCorner)=>{
          if(mode==='solid') return null;
          if(isCorner) return mkTexMat(CORNER_TEX[key]||TIER_TEX[key]||crowdTex);
          return mkTexMat(TIER_TEX[key]||crowdTex);
        };
        bowlGroup.add(buildTierSegmented(ihl,ihw,r, yB,yB+th, out,
          {backMat, texFor, openFront:of, sharp:S.sharp}));
        tierInfo.push({yB,yT:yB+th,ihl,ihw});
        prevTop={ y:yB+th, ihl:ihl+out, ihw:ihw+out };
        yB+=th*0.92; ihl+=out*0.92; ihw+=out*0.92;
      }
      // base hoarding — full perimeter, closes the near side
      const hoMat=new T.MeshLambertMaterial({color:'#1d242c', side:T.DoubleSide});
      bowlGroup.add(buildTierSegmented(baseHL,baseHW,r, (S.yOff||0)*U, (S.yOff||0)*U+th*0.12, 0.4,
        {backMat:hoMat, texFor:null, openFront:false, sharp:S.sharp}));
      // roof
      if(S.roof!==false){
        const roofY=yB+th*0.35;
        bowlGroup.add(buildTierSegmented(ihl,ihw,r, roofY,roofY+2, -(out*1.4),
          {backMat:new T.MeshLambertMaterial({color:'#2a3340', side:T.DoubleSide}), texFor:null, openFront:of, sharp:S.sharp}));
        bowlGroup.add(buildTierSegmented(ihl-out*0.5,ihw-out*0.5,r, roofY-1,roofY, -(out*1.3),
          {backMat:new T.MeshBasicMaterial({color:'#fff7e0', side:T.DoubleSide}), texFor:null, openFront:of, sharp:S.sharp}));
      }
      _bowlInfo={type:'classic',baseHL,baseHW,r,th,out,of,U,sharp:S.sharp,tiers:tierInfo,
                 roofY:(S.roof!==false)?yB+th*0.35:null,topHL:ihl,topHW:ihw,yTop:yB};
      try{ buildExtras(); }catch(e){ console.warn('[P3D] extras failed',e); }
    }
    P3D._rebuildBowl=function(){placeAllStadium();placeFlags();};   // Camera Lab calls this

    /* ── SUPPORTER FLAGS in the stands ─────────────────────────────
       Big banner quads leaning against the lower tier: home crest ×3
       (back-left straight + behind home goal), away crest ×3 mirrored.
       game.js calls P3D.setTeamFlags({home:[srcs],away:[srcs],homeCol,awayCol})
       with the same PNG chains used for the HUD emblems. */
    let flagGroup=new T.Group(); scene.add(flagGroup);
    let flagData=null;
    function bannerTex(img,color,emoji){
      const c=document.createElement('canvas'); c.width=192; c.height=128;
      const x=c.getContext('2d');
      if(emoji){ // national: the flag itself IS the banner
        x.font='120px serif'; x.textAlign='center'; x.textBaseline='middle';
        x.fillText(emoji,96,68);
      } else {
        x.fillStyle=color||'#20304a'; x.fillRect(0,0,192,128);
        x.strokeStyle='rgba(255,255,255,.45)'; x.lineWidth=4; x.strokeRect(3,3,186,122);
        if(img){ const s=Math.min(150/img.width,92/img.height);
          const w=img.width*s, h=img.height*s;
          x.drawImage(img,(192-w)/2,(122-h)/2+3,w,h); }
      }
      return new T.CanvasTexture(c);
    }
    function loadFirst(srcs,cb){
      (function tryN(i){ if(!srcs||i>=srcs.length)return cb(null);
        const im=new Image(); im.onload=()=>cb(im); im.onerror=()=>tryN(i+1); im.src=srcs[i]; })(0);
    }
    P3D.setTeamFlags=function(d){ flagData=d; placeFlags(); try{buildBoards();placeCornerFlags();}catch(e){} };
    // deterministic pseudo-random per match so flags scatter but don't jitter
    function _rng(seed){ return ()=>{ seed=(seed*9301+49297)%233280; return seed/233280; }; }
    function placeFlags(){
      scene.remove(flagGroup); flagGroup=new T.Group(); scene.add(flagGroup);
      const OV=(P3D.stadium==='oval'&&window.U11_OVAL&&window.U11_OVAL._last)
               ? window.U11_OVAL._last : null;
      if(P3D.stadium==='oval'&&!OV) return;   // oval selected but not built yet
      if(!flagData) return;
      const S=P3D.bowl, U=PWID/190;
      const RUNOFF=6*U;
      const baseHL=PLEN/2+RUNOFF+(S.gap||0)*U;
      const baseHW=PWID/2+RUNOFF+(S.gap||0)*U;
      const th=(S.tierH!=null?S.tierH:30)*U;
      const rakeRad=(S.rake!=null?S.rake:50)*Math.PI/180;
      const out=th/Math.tan(rakeRad);
      const lean=Math.atan2(out,th);
      const y0=(S.yOff||0)*U+th*0.12;
      const bh=th*0.34, bw=bh*1.5;              // small — reads as a fan flag
      function addFlag(tex,wall,frac,tier,hJit,rng){
        const yBase=y0+(tier===1?th*1.08:0);
        const yC=yBase+th*(0.2+hJit*0.55);      // random height on the tier face
        const off=out*((yC-y0-(tier===1?th*1.08:0))/th)-0.4;  // hug the rake, slightly proud
        const m=new T.Mesh(new T.PlaneGeometry(bw*(0.85+rng()*0.4),bh*(0.85+rng()*0.4)),
          new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}));
        const tilt=(rng()-0.5)*0.25;            // slight random waving tilt
        if(wall==='back'){  m.position.set(frac*baseHL, yC, -(baseHW+off));
                            m.rotation.x=lean; m.rotation.z=tilt; }
        if(wall==='left'){  m.position.set(-(baseHL+off), yC, frac*baseHW);
                            m.rotation.y=Math.PI/2; m.rotation.z=-lean; m.rotation.x=tilt; }
        if(wall==='right'){ m.position.set( (baseHL+off), yC, frac*baseHW);
                            m.rotation.y=-Math.PI/2; m.rotation.z=lean; m.rotation.x=tilt; }
        m.rotation.order='YXZ';
        flagGroup.add(m);
      }
      function addFlagOval(tex,theta,tierIdx,hJit,rng){
        const t=OV.TIERS[Math.min(tierIdx,OV.TIERS.length-1)];
        const fr=0.2+hJit*0.55;
        const yC=t.y+fr*(t.yTop-t.y);
        const rX=t.rx+fr*t.rows*t.dr-0.5, rZ=t.rz+fr*t.rows*t.dr-0.5;
        const x=rX*Math.cos(theta), z=rZ*Math.sin(theta);
        const leanT=Math.atan2(t.dr,t.dy);
        const m=new T.Mesh(new T.PlaneGeometry(bw*(0.85+rng()*0.4),bh*(0.85+rng()*0.4)),
          new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}));
        m.rotation.order='YXZ';
        m.position.set(x,yC,z);
        m.rotation.y=Math.atan2(-x,-z);
        m.rotation.x=leanT;
        m.rotation.z=(rng()-0.5)*0.25;
        flagGroup.add(m);
      }
      function scatter(tex,homeSide,rng){
        if(OV){
          // home end ≈ θ=π (−x), away end ≈ θ=0 (+x); ranges dodge the open-front cut
          for(let i=0;i<10;i++){
            const tier=rng()<0.55?0:1;
            const th=homeSide ? Math.PI+(-0.30+rng()*1.60)
                              : -1.25+rng()*1.55;
            addFlagOval(tex,th,tier,rng(),rng);
          }
          return;
        }
        // 10 flags per team, random spots on their half: back straight + own end,
        // mixed between lower (tier 0) and middle (tier 1) stands
        for(let i=0;i<10;i++){
          const tier=rng()<0.55?0:1;
          const hJit=rng();
          if(rng()<0.6){ // back straight, own half
            const f=(0.08+rng()*0.72)*(homeSide?-1:1);
            addFlag(tex,'back',f,tier,hJit,rng);
          } else {       // own end stand
            const f=(rng()*1.6-0.8);
            addFlag(tex,homeSide?'left':'right',f,tier,hJit,rng);
          }
        }
      }
      const seed=(Date.now()%100000)|1;
      loadFirst(flagData.homeFlag?null:flagData.home,img=>{
        const t=bannerTex(img,flagData.homeCol,flagData.homeFlag);
        scatter(t,true,_rng(seed));
      });
      loadFirst(flagData.awayFlag?null:flagData.away,img=>{
        const t=bannerTex(img,flagData.awayCol,flagData.awayFlag);
        scatter(t,false,_rng(seed*7));
      });
    }
    // console test: P3D.debugFlags() — colored boards, no PNGs needed
    P3D.debugFlags=function(){
      flagData={home:[],away:[],homeCol:'#1e72dc',awayCol:'#c22020'};
      placeFlags();
    };


    /* ════════════════════════════════════════════════════════════════
       GFX UPGRADE PACK — sky dome, floodlight masts, roof lamp strip,
       scrolling LED perimeter boards, corner flags, crowd camera flashes,
       plus the particle / ring / ribbon pools shared by the super-shot
       aura and the ball comet. Toggles: P3D.gfx.*  Rebuilt with the bowl.
       ════════════════════════════════════════════════════════════════ */
    let _bowlInfo=null, extrasGroup=null, boardGroup=null, cornerGroup=null;
    let boardTex=null, flashPts=null, skyMesh=null;
    const MASTS=[], CFLAGS=[];
    function gfxOn(k){ return !(P3D.gfx&&P3D.gfx[k]===false); }
    function haloTex(){
      if(!haloTex._t) haloTex._t=makeRadialTex([[0,'rgba(255,255,255,1)'],[0.18,'rgba(255,244,214,0.55)'],[0.5,'rgba(255,225,170,0.14)'],[1,'rgba(255,215,150,0)']]);
      return haloTex._t;
    }
    function ringTex(){
      if(ringTex._t) return ringTex._t;
      const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
      const g=x.createRadialGradient(128,128,70,128,128,128);
      g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.55,'rgba(255,255,255,0)');
      g.addColorStop(0.72,'rgba(255,255,255,1)'); g.addColorStop(0.82,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g; x.fillRect(0,0,256,256);
      const t=new T.CanvasTexture(c); t.minFilter=T.LinearFilter; ringTex._t=t; return t;
    }
    function flameTex(){
      if(flameTex._t) return flameTex._t;
      const c=document.createElement('canvas'); c.width=128; c.height=256; const x=c.getContext('2d');
      const blob=(cy,sy,r,a)=>{ x.save(); x.translate(64,cy); x.scale(1,sy);
        const g=x.createRadialGradient(0,0,2,0,0,r);
        g.addColorStop(0,'rgba(255,255,255,'+a+')'); g.addColorStop(0.4,'rgba(255,255,255,'+(a*0.5)+')');
        g.addColorStop(0.75,'rgba(255,255,255,'+(a*0.14)+')'); g.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=g; x.beginPath(); x.arc(0,0,r,0,7); x.fill(); x.restore(); };
      blob(170,1.4,60,0.95); blob(95,1.9,34,0.75); blob(40,2.2,16,0.5);
      const t=new T.CanvasTexture(c); t.minFilter=T.LinearFilter; flameTex._t=t; return t;
    }
    /* team colour for aura / trail: sampled from the kit on the sprite sheet
       (idle cell), falling back to the HUD colours when the canvas is tainted. */
    const _kitCache=new WeakMap();
    function kitColorOf(sheet){
      if(!sheet||sheet==='none'||!sheet.img||!sheet.img.complete) return null;
      if(_kitCache.has(sheet.img)) return _kitCache.get(sheet.img);
      let out=null;
      try{
        const c=document.createElement('canvas'); c.width=c.height=48; const x=c.getContext('2d');
        x.drawImage(sheet.img,0,0,sheet.cw,sheet.ch,0,0,48,48);
        const d=x.getImageData(0,0,48,48).data, bins=new Array(24).fill(0);
        for(let i=0;i<d.length;i+=4){
          if(d[i+3]<140) continue;
          const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;
          const s=(mx===mn)?0:(mx-mn)/(1-Math.abs(2*l-1));
          if(s<0.45||l<0.22||l>0.82) continue;
          let h; if(mx===r)h=((g-b)/(mx-mn))%6; else if(mx===g)h=(b-r)/(mx-mn)+2; else h=(r-g)/(mx-mn)+4;
          h=((h*60)+360)%360;
          if(h>15&&h<50&&l>0.45) continue;                    // skin tones
          bins[Math.floor(h/15)%24]++;
        }
        let best=0; for(let i=1;i<24;i++) if(bins[i]>bins[best]) best=i;
        if(bins[best]>20){ const col=new T.Color().setHSL((best*15+7.5)/360,0.92,0.56); out='#'+col.getHexString(); }
      }catch(e){ out=null; }
      _kitCache.set(sheet.img,out); return out;
    }
    function sideColor(s){
      try{ const k=kitColorOf(SHEETS[s]); if(k) return k; }catch(e){}
      if(flagData) return s==='h'?(flagData.homeCol||'#1e72dc'):(flagData.awayCol||'#c22020');
      return s==='h'?'#1e72dc':'#c22020';
    }
    /* sky dome — dusk gradient with a warm horizon band + stars, unfogged */
    function buildSky(){
      if(skyMesh||!gfxOn('sky')) return;
      const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d');
      const g=x.createLinearGradient(0,0,0,512);
      g.addColorStop(0,'#05081a'); g.addColorStop(0.30,'#0f1d3d'); g.addColorStop(0.44,'#2a3f6e');
      g.addColorStop(0.492,'#8a6a70'); g.addColorStop(0.512,'#d9925a'); g.addColorStop(0.56,'#3b3350'); g.addColorStop(1,'#0a0d16');
      x.fillStyle=g; x.fillRect(0,0,1024,512);
      for(let i=0;i<260;i++){ const sy=Math.pow(Math.random(),1.6)*205, a=0.25+Math.random()*0.75;
        x.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')'; const s=Math.random()<0.12?2:1; x.fillRect(Math.random()*1024,sy,s,s); }
      const t=new T.CanvasTexture(c); t.minFilter=T.LinearFilter; t.magFilter=T.LinearFilter;
      skyMesh=new T.Mesh(new T.SphereGeometry(900,32,16),new T.MeshBasicMaterial({map:t,side:T.BackSide,fog:false,depthWrite:false}));
      skyMesh.renderOrder=-10; scene.add(skyMesh);
    }
    /* crowd camera flashes — one Points draw call, per-point phase, strobe in the shader */
    function buildFlashes(spots){
      if(flashPts){ scene.remove(flashPts); flashPts.geometry.dispose(); flashPts.material.dispose(); flashPts=null; }
      if(!gfxOn('flashes')||!spots.length) return;
      const n=spots.length, pos=new Float32Array(n*3), ph=new Float32Array(n), sp=new Float32Array(n);
      spots.forEach((s,i)=>{ pos[i*3]=s[0]; pos[i*3+1]=s[1]; pos[i*3+2]=s[2]; ph[i]=Math.random()*100; sp[i]=0.6+Math.random()*1.4; });
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.BufferAttribute(pos,3));
      g.setAttribute('phase',new T.BufferAttribute(ph,1));
      g.setAttribute('spd',new T.BufferAttribute(sp,1));
      const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
        uniforms:{time:{value:0},scale:{value:1}},
        vertexShader:[
          'attribute float phase; attribute float spd; uniform float time; uniform float scale; varying float vA;',
          'void main(){ float t=fract((time*spd+phase)*0.13);',
          '  float a=smoothstep(0.0,0.006,t)*(1.0-smoothstep(0.006,0.032,t)); vA=a;',
          '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
          '  gl_PointSize=(2.5+12.0*a)*scale*(75.0/max(1.0,-mv.z)); gl_Position=projectionMatrix*mv; }'].join('\n'),
        fragmentShader:[
          'varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d);',
          '  float k=smoothstep(0.5,0.05,r); gl_FragColor=vec4(vec3(1.0,0.97,0.9)*k*vA*1.6,k*vA); }'].join('\n')});
      flashPts=new T.Points(g,m); flashPts.frustumCulled=false; scene.add(flashPts);
    }
    /* masts, roof lamps, flash spots — rebuilt whenever the bowl is */
    function buildExtras(){
      buildSky();
      if(extrasGroup){ scene.remove(extrasGroup); extrasGroup=null; }
      extrasGroup=new T.Group(); scene.add(extrasGroup); MASTS.length=0;
      const B=_bowlInfo; if(!B) return;
      const spots=[];
      if(B.type==='classic'){
        const r=B.r, th=B.th, out=B.out, of=B.of;
        B.tiers.forEach((t,ti)=>{
          const N=[150,110,80][ti]||60;
          for(let i=0;i<N;i++){
            const v=Math.random(), y=t.yB+v*th+0.3, o=v*(out-0.6)-0.35, w=Math.random();
            if(w<0.5)       spots.push([(Math.random()*2-1)*(t.ihl-r*0.7), y, -(t.ihw+o)]);
            else if(w<0.75) spots.push([-(t.ihl+o), y, (Math.random()*2-1)*(t.ihw-r*0.7)]);
            else            spots.push([ (t.ihl+o), y, (Math.random()*2-1)*(t.ihw-r*0.7)]);
          }
        });
        if(B.roofY!=null && gfxOn('lamps')){
          const iy=B.roofY+1.25, hl=B.topHL-out*1.4+0.4, hw=B.topHW-out*1.4+0.4;
          extrasGroup.add(buildTierSegmented(hl,hw,r, iy-0.12,iy+0.18, 0,
            {backMat:new T.MeshBasicMaterial({color:'#fff1cf',side:T.DoubleSide,fog:false}),texFor:null,openFront:of,sharp:B.sharp}));
          const lampGeo=new T.BoxGeometry(1.4,0.42,0.5), lampMat=new T.MeshBasicMaterial({color:'#fff8e6',fog:false});
          const halo=new T.SpriteMaterial({map:haloTex(),color:'#ffe9bf',transparent:true,opacity:0.7,depthWrite:false,blending:T.AdditiveBlending,fog:false});
          const put=(x,z)=>{ const m=new T.Mesh(lampGeo,lampMat); m.position.set(x,iy-0.45,z); m.lookAt(0,0,0); extrasGroup.add(m);
            const h=new T.Sprite(halo); h.position.set(x,iy-0.45,z); h.scale.set(7,7,1); extrasGroup.add(h); };
          for(let i=0;i<9;i++) put(-hl*0.85+(i/8)*hl*1.7, -hw);
          for(let i=0;i<5;i++){ put(-hl, -hw*0.8+(i/4)*hw*1.6); put(hl, -hw*0.8+(i/4)*hw*1.6); }
          if(!of) for(let i=0;i<9;i++) put(-hl*0.85+(i/8)*hl*1.7, hw);
        }
        if(gfxOn('masts')){
          const top=(B.roofY!=null?B.roofY:B.yTop)+13, mx=B.topHL+out*0.6+3, mz=B.topHW+out*0.6+3;
          const mastMat=new T.MeshLambertMaterial({color:'#38414f'}), headMat=new T.MeshLambertMaterial({color:'#1c2230'});
          const lampMat=new T.MeshBasicMaterial({color:'#fffaf0',fog:false});
          const haloM=new T.SpriteMaterial({map:haloTex(),color:'#fff0cc',transparent:true,opacity:0.95,depthWrite:false,blending:T.AdditiveBlending,fog:false});
          [[-mx,-mz],[mx,-mz],[-mx,mz],[mx,mz]].forEach(([x,z])=>{
            const pole=new T.Mesh(new T.BoxGeometry(0.55,top,0.55),mastMat); pole.position.set(x,top/2,z); extrasGroup.add(pole);
            const head=new T.Group(); head.position.set(x,top,z); head.lookAt(0,4,0);
            head.add(new T.Mesh(new T.BoxGeometry(4.2,2.4,0.4),headMat));
            for(let i=0;i<4;i++)for(let j=0;j<2;j++){ const l=new T.Mesh(new T.BoxGeometry(0.8,0.8,0.3),lampMat); l.position.set(-1.5+i,-0.55+j*1.1,0.3); head.add(l); }
            extrasGroup.add(head);
            const h=new T.Sprite(haloM.clone()); h.material.opacity=0.7; h.position.set(x,top,z); h.scale.set(12,12,1); extrasGroup.add(h); MASTS.push(h);
            const h2=new T.Sprite(haloM.clone()); h2.material.opacity=0.22; h2.position.set(x,top,z); h2.scale.set(34,34,1); extrasGroup.add(h2);
          });
        }
      } else if(B.type==='oval' && window.U11_OVAL && window.U11_OVAL._last){
        const O=window.U11_OVAL._last, TAU=Math.PI*2;
        const inCut=th=>{ if(!O.openF) return false; th=((th%TAU)+TAU)%TAU; return th>O.CUT0&&th<O.CUT1; };
        O.TIERS.forEach((t,ti)=>{
          const N=[220,140,120][ti]||80;
          for(let i=0;i<N;i++){
            const th=Math.random()*TAU; if(inCut(th)) continue;
            const fr=Math.random(), rx=t.rx+fr*t.rows*t.dr-0.5, rz=t.rz+fr*t.rows*t.dr-0.5;
            spots.push([rx*Math.cos(th), t.y+fr*(t.yTop-t.y)+0.5, rz*Math.sin(th)]);
          }
        });
      }
      buildFlashes(spots);
      buildBoards(); placeCornerFlags();
    }
    /* LED perimeter boards — team panels + branding, scrolling, per-wall repeats */
    function makeBoardTex(){
      const hc=(flagData&&flagData.homeCol)||'#1e72dc', ac=(flagData&&flagData.awayCol)||'#c22020';
      let hn='HOME', an='AWAY';
      try{ if(typeof HT!=='undefined'&&HT&&HT.name) hn=HT.name; if(typeof AT!=='undefined'&&AT&&AT.name) an=AT.name; }catch(e){}
      const c=document.createElement('canvas'); c.width=2048; c.height=128; const x=c.getContext('2d');
      const panels=[
        {bg:hc,fg:'#ffffff',txt:hn.toUpperCase()},   {bg:'#0b0e16',fg:'#ffd24a',txt:'ULTIMATE ELEVEN'},
        {bg:ac,fg:'#ffffff',txt:an.toUpperCase()},   {bg:'#101826',fg:'#7fd7ff',txt:'\u26A1 SUPER SHOT'},
        {bg:hc,fg:'#ffffff',txt:hn.toUpperCase()},   {bg:'#0b0e16',fg:'#ffd24a',txt:'ULTIMATE ELEVEN'},
        {bg:ac,fg:'#ffffff',txt:an.toUpperCase()},   {bg:'#16121e',fg:'#ff8ad0',txt:'HD-2D ARENA'}];
      const pw=c.width/panels.length;
      x.textAlign='center'; x.textBaseline='middle';
      panels.forEach((p,i)=>{
        x.fillStyle=p.bg; x.fillRect(i*pw,0,pw,128);
        const g=x.createLinearGradient(0,0,0,128); g.addColorStop(0,'rgba(255,255,255,0.22)'); g.addColorStop(0.5,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,0.35)');
        x.fillStyle=g; x.fillRect(i*pw,0,pw,128);
        x.font='bold 64px "Bebas Neue",Impact,sans-serif'; x.fillStyle=p.fg;
        x.shadowColor=p.fg; x.shadowBlur=16; x.fillText(p.txt,i*pw+pw/2,66,pw-30); x.shadowBlur=0;
        x.fillStyle='rgba(0,0,0,0.55)'; x.fillRect(i*pw-3,0,6,128);
      });
      x.fillStyle='rgba(0,0,0,0.28)';
      for(let yy=0;yy<128;yy+=4) x.fillRect(0,yy,c.width,1);
      for(let xx=0;xx<c.width;xx+=4) x.fillRect(xx,0,1,128);
      const t=new T.CanvasTexture(c); t.wrapS=T.RepeatWrapping; t.wrapT=T.ClampToEdgeWrapping; t.anisotropy=8; return t;
    }
    function buildBoards(){
      if(boardGroup){ scene.remove(boardGroup); boardGroup=null; }
      if(!gfxOn('boards')||!_bowlInfo) return;
      let hl,hw,r,y0;
      if(_bowlInfo.type==='classic'){ hl=_bowlInfo.baseHL-0.35; hw=_bowlInfo.baseHW-0.35; r=_bowlInfo.r; y0=(P3D.bowl.yOff||0)*_bowlInfo.U; }
      else { const O=window.U11_OVAL&&window.U11_OVAL._last; if(!O) return; const t0=O.TIERS[0]; hl=t0.rx-2.2; hw=t0.rz-2.2; r=Math.min(hl,hw)*0.9; y0=0; }
      boardGroup=new T.Group(); scene.add(boardGroup);
      boardTex=makeBoardTex();
      const mat=new T.MeshBasicMaterial({map:boardTex,side:T.DoubleSide,fog:false});
      const H=1.0;
      const walls=[[-hl+r,-hw, hl-r,-hw],[hl,-hw+r, hl,hw-r],[hl-r,hw, -hl+r,hw],[-hl,hw-r, -hl,-hw+r]];
      walls.forEach(([ax,az,bx,bz])=>{
        const len=Math.hypot(bx-ax,bz-az), rep=Math.max(1,Math.round(len/(H*16)));
        boardGroup.add(buildStraightWall(ax,az,bx,bz, y0+0.04, y0+0.04+H, 0.15, mat, rep));
      });
      const cap=new T.MeshBasicMaterial({color:'#0b0e16',side:T.DoubleSide});
      [[hl-r,-hw+r,-Math.PI/2],[hl-r,hw-r,0],[-hl+r,hw-r,Math.PI/2],[-hl+r,-hw+r,Math.PI]].forEach(([cx,cz,a0])=>{
        boardGroup.add(buildCorner(cx,cz,r,a0, y0+0.04,y0+0.04+H, 0.15, cap, false));
      });
    }
    /* corner flags in team colours (home = left end, away = right end) */
    function placeCornerFlags(){
      if(cornerGroup){ scene.remove(cornerGroup); cornerGroup=null; } CFLAGS.length=0;
      if(!gfxOn('flags')) return;
      cornerGroup=new T.Group(); scene.add(cornerGroup);
      const hc=(flagData&&flagData.homeCol)||'#1e72dc', ac=(flagData&&flagData.awayCol)||'#c22020';
      const poleG=new T.CylinderGeometry(0.05,0.05,1.7,6), poleM=new T.MeshLambertMaterial({color:'#f2f2f2'});
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sz])=>{
        const x=sx*PLEN/2, z=sz*PWID/2;
        const p=new T.Mesh(poleG,poleM); p.position.set(x,0.85,z); cornerGroup.add(p);
        const fg=new T.PlaneGeometry(0.75,0.45); fg.translate(0.375,0,0);
        const f=new T.Mesh(fg,new T.MeshBasicMaterial({color:sx<0?hc:ac,side:T.DoubleSide}));
        f.position.set(x,1.45,z); f.userData.ph=Math.random()*6; cornerGroup.add(f); CFLAGS.push(f);
      });
    }
    /* ── particle pool (embers, sparks) ── */
    const PARTS=[];
    function spawnPart(x,y,z,vx,vy,vz,col,size,life,grav){
      let p=PARTS.find(p=>!p.alive);
      if(!p){ if(PARTS.length>=300) return;
        if(!spawnPart._tex) spawnPart._tex=fxGradTex('#ffffff');
        const m=new T.SpriteMaterial({map:spawnPart._tex,color:col,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,fog:false});
        p={sp:new T.Sprite(m),alive:false}; scene.add(p.sp); PARTS.push(p); }
      p.alive=true; p.life=life; p.max=life; p.vx=vx; p.vy=vy; p.vz=vz; p.g=grav||0; p.size=size;
      p.sp.material.color.set(col); p.sp.visible=true; p.sp.position.set(x,y,z); p.sp.scale.set(size,size,1);
    }
    function tickParts(dt){
      for(const p of PARTS){ if(!p.alive) continue;
        p.life-=dt; if(p.life<=0){ p.alive=false; p.sp.visible=false; continue; }
        p.vy-=p.g*dt; const s=p.sp.position; s.x+=p.vx*dt; s.y+=p.vy*dt; s.z+=p.vz*dt;
        if(s.y<0.03&&p.g>0){ s.y=0.03; p.vy=-p.vy*0.35; p.vx*=0.7; p.vz*=0.7; }
        const f=p.life/p.max; p.sp.material.opacity=Math.min(1,f*1.4); const k=p.size*(0.35+0.65*f); p.sp.scale.set(k,k,1); }
    }
    /* ── expanding ground rings (shockwaves) ── */
    const RINGS=[];
    function spawnRing(x,z,col,from,to,life,y){
      let r=RINGS.find(r=>!r.alive);
      if(!r){ const m=new T.MeshBasicMaterial({map:ringTex(),color:col,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false});
        r={m:new T.Mesh(new T.PlaneGeometry(1,1),m),alive:false}; r.m.rotation.x=-Math.PI/2; r.m.renderOrder=3; scene.add(r.m); RINGS.push(r); }
      r.alive=true; r.life=life; r.max=life; r.from=from; r.to=to;
      r.m.material.color.set(col); r.m.visible=true; r.m.position.set(x,y!=null?y:0.06,z); r.m.scale.set(from,from,1);
    }
    function tickRings(dt){
      for(const r of RINGS){ if(!r.alive) continue; r.life-=dt; if(r.life<=0){ r.alive=false; r.m.visible=false; continue; }
        const t=1-r.life/r.max, e=1-Math.pow(1-t,2.2), s=r.from+(r.to-r.from)*e; r.m.scale.set(s,s,1); r.m.material.opacity=(1-t)*0.9; }
    }
    /* ── one-shot flash sprites ── */
    const FLASHES=[];
    function spawnFlash(x,y,z,size,col){
      const fl=new T.Sprite(new T.SpriteMaterial({map:fxGradTex(col||'#ffffff'),transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,fog:false}));
      fl.position.set(x,y,z); fl.scale.set(size,size,1); scene.add(fl); FLASHES.push({sp:fl,life:0.26,max:0.26});
    }
    function tickFlashes(dt){
      for(let i=FLASHES.length-1;i>=0;i--){ const f=FLASHES[i]; f.life-=dt;
        if(f.life<=0){ scene.remove(f.sp); f.sp.material.dispose(); FLASHES.splice(i,1); continue; }
        f.sp.material.opacity=(f.life/f.max)*0.85; const s=f.sp.scale.x*(1+dt*3.5); f.sp.scale.set(s,s,1); }
    }
    /* ── camera-facing ribbon trail (comet tail) ── */
    function makeRibbon(maxN,col){
      const g=new T.BufferGeometry();
      const pos=new Float32Array(maxN*2*3), colr=new Float32Array(maxN*2*3);
      g.setAttribute('position',new T.BufferAttribute(pos,3)); g.setAttribute('color',new T.BufferAttribute(colr,3));
      const idx=[]; for(let i=0;i<maxN-1;i++){ const a=i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); } g.setIndex(idx);
      const m=new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false});
      const mesh=new T.Mesh(g,m); mesh.frustumCulled=false; mesh.visible=false; scene.add(mesh);
      return {mesh,pts:[],maxN,col:new T.Color(col),width:0.6,g,pos,colr};
    }
    function ribbonPush(R,x,y,z){ R.pts.push({x,y,z,t:performance.now()}); if(R.pts.length>R.maxN) R.pts.shift(); }
    function ribbonUpdate(R,now){
      const LIFE=300;
      while(R.pts.length&&now-R.pts[0].t>LIFE) R.pts.shift();
      const n=R.pts.length;
      if(n<2){ R.mesh.visible=false; return; }
      R.mesh.visible=true;
      const cp=camera.position;
      for(let i=0;i<n;i++){
        const p=R.pts[i], q=R.pts[Math.min(n-1,i+1)], o=R.pts[Math.max(0,i-1)];
        let tx=q.x-o.x,ty=q.y-o.y,tz=q.z-o.z; const tl=Math.hypot(tx,ty,tz)||1; tx/=tl;ty/=tl;tz/=tl;
        let vx=cp.x-p.x,vy=cp.y-p.y,vz=cp.z-p.z; const vl=Math.hypot(vx,vy,vz)||1; vx/=vl;vy/=vl;vz/=vl;
        let sx=ty*vz-tz*vy, sy=tz*vx-tx*vz, sz=tx*vy-ty*vx; const sl=Math.hypot(sx,sy,sz)||1; sx/=sl;sy/=sl;sz/=sl;
        const f=i/(n-1), age=Math.max(0,1-(now-p.t)/LIFE);
        const w=R.width*(0.08+0.92*f*f)*age, b=age*age*(0.12+0.88*f*f);
        const k=i*6;
        R.pos[k]=p.x+sx*w; R.pos[k+1]=p.y+sy*w; R.pos[k+2]=p.z+sz*w;
        R.pos[k+3]=p.x-sx*w; R.pos[k+4]=p.y-sy*w; R.pos[k+5]=p.z-sz*w;
        const mw=f*f*f;
        const r=R.col.r+(1-R.col.r)*mw, gg=R.col.g+(1-R.col.g)*mw, bb=R.col.b+(1-R.col.b)*mw;
        R.colr[k]=r*b; R.colr[k+1]=gg*b; R.colr[k+2]=bb*b; R.colr[k+3]=r*b; R.colr[k+4]=gg*b; R.colr[k+5]=bb*b;
      }
      const last=R.pts[n-1];
      for(let i=n;i<R.maxN;i++){ const k=i*6;
        R.pos[k]=R.pos[k+3]=last.x; R.pos[k+1]=R.pos[k+4]=last.y; R.pos[k+2]=R.pos[k+5]=last.z;
        for(let j=0;j<6;j++) R.colr[k+j]=0; }
      R.g.attributes.position.needsUpdate=true; R.g.attributes.color.needsUpdate=true;
    }
    /* ── SHOT STYLE — who is shooting decides how the ball travels ──
       power  (PWR well above TEC): flat, fast, straight drive, topspin
       curve  (TEC well above PWR): slower banana that bows away from the
              goal centre and curls back in, side-spin
       normal: mild arc in between. Also shapes the comet tail. */
    function shotStyleFor(pl){
      if(!pl) return {kind:'normal',curve:0.45,loft:0.6,speed:1.05};
      const pwr=pl.pwr||pl.pow||50, tec=pl.tec||50;
      if(pwr>=tec+6) return {kind:'power', curve:0.08, loft:0.32, speed:1.35};
      if(tec>=pwr+6) return {kind:'curve', curve:1.0,  loft:0.75, speed:0.88};
      return {kind:'normal',curve:0.45,loft:0.6,speed:1.05};
    }
    // perpendicular to the shot line, flipped so the bow goes AWAY from the
    // goal centre first (the ball then curls back in — an in-swinger)
    function shotPerp(fx,fy,tx,ty){
      const dx=tx-fx, dy=ty-fy, L=Math.hypot(dx,dy)||1;
      let px=-dy/L, py=dx/L;
      const Hh=(CV.height||720), toward=Hh*0.5-fy;
      const sideSign=(Math.abs(toward)<Hh*0.04)?(Math.random()<0.5?1:-1):-Math.sign(toward);
      if(Math.sign(py)!==sideSign){ px=-px; py=-py; }
      return {px,py,L};
    }
    let _os={bt:null};   // open-play shot state (style + bend axis for the current ballTravel)
    /* ── ball FX: comet (shots) + resting halo (open play) ── */
    let shotRibbon=null, ballGlow=null, ballCore=null, ballHalo=null, _lastFxBall=null;
    function ensureBallFx(){
      if(shotRibbon) return;
      shotRibbon=makeRibbon(40,'#ffd24a');
      const mk=(col,op)=>{ const s=new T.Sprite(new T.SpriteMaterial({map:fxGradTex(col),transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false,fog:false})); s.visible=false; scene.add(s); return s; };
      ballGlow=mk('#ffb040',0.9); ballCore=mk('#ffffff',0.95); ballHalo=mk('#ffd24a',0.28);
    }
    function shotBallFx(c,x,y,z,d,hot,warm){
      ensureBallFx();
      const col=(c&&c.col)||'#ffd24a';
      ballHalo.visible=false;
      if(warm&&!hot){
        const pu=1+0.18*Math.sin(performance.now()*0.008);
        ballGlow.visible=true; ballGlow.material.color.set(col); ballGlow.material.opacity=0.16; ballGlow.position.set(x,y,z); ballGlow.scale.set(d*1.5*pu,d*1.5*pu,1);
        ballCore.visible=false; _lastFxBall={x,y,z}; return;
      }
      ballGlow.material.opacity=0.6;
      if(hot){
        const kind=(c&&c.style&&c.style.kind)||(_os.st&&_os.st.kind)||'normal';
        shotRibbon.col.set(col); shotRibbon.width=d*(kind==='power'?0.65:kind==='curve'?1.1:0.9); ribbonPush(shotRibbon,x,y,z);
        const pu=1+0.25*Math.sin(performance.now()*0.03);
        ballGlow.visible=true; ballGlow.material.color.set(col); ballGlow.position.set(x,y,z); ballGlow.scale.set(d*2.2*pu,d*2.2*pu,1);
        ballCore.visible=true; ballCore.material.opacity=0.55; ballCore.position.set(x,y,z); ballCore.scale.set(d*1.25,d*1.25,1);
        if(_lastFxBall){ const dx=x-_lastFxBall.x, dy=y-_lastFxBall.y, dz=z-_lastFxBall.z, L=Math.hypot(dx,dy,dz);
          if(L>0.02){ const nS=kind==='curve'?3:kind==='power'?1:2; for(let i=0;i<nS;i++){ const j=()=>(Math.random()-0.5)*(kind==='power'?1.2:3);
            spawnPart(x-dx*0.3,y,z-dz*0.3, -dx/L*2+j(), 1+j(), -dz/L*2+j(), Math.random()<0.5?'#ffffff':col,
                      d*(0.35+Math.random()*0.35), 0.28+Math.random()*0.22, 9); } } }
      } else { ballGlow.visible=false; ballCore.visible=false; }
      _lastFxBall={x,y,z};
    }
    function openPlayBallFx(x,y,z,d,shooting){
      ensureBallFx();
      if(shooting){ const col=(typeof G!=='undefined'&&G&&G.poss)?sideColor(G.poss):'#ffd24a'; shotBallFx({col},x,y,z,d,true); }
      else {
        if(ballGlow.visible){ ballGlow.visible=false; ballCore.visible=false; } _lastFxBall=null;
        ballHalo.visible=!cine; ballHalo.position.set(x,y,z); const s=d*2.4; ballHalo.scale.set(s,s,1);
      }
    }
    /* ── super-shot punctuation ── */
    function kickBurst(c){
      const x=ex2wx(c.fx), z=ey2wz(c.fy), hh=PLEN*(P3D.spriteFrac||0.045);
      spawnRing(x,z,'#ffffff',hh*0.3,hh*4.5,0.45); spawnRing(x,z,c.col,hh*0.5,hh*7,0.7);
      spawnFlash(x,hh*0.4,z,hh*1.1,'#ffffff');
      for(let i=0;i<34;i++){ const a=Math.random()*Math.PI*2, sp=4+Math.random()*9;
        spawnPart(x,0.3+Math.random()*0.6,z, Math.cos(a)*sp, 2+Math.random()*6, Math.sin(a)*sp,
                  Math.random()<0.4?'#ffffff':c.col, hh*(0.06+Math.random()*0.08), 0.4+Math.random()*0.4, 12); }
      try{ if(typeof shakeScreen==='function') shakeScreen(9,160); }catch(e){}
    }
    function impactBurst(c,x,y,z,d){
      const hh=PLEN*(P3D.spriteFrac||0.045);
      if(c.isGoal){
        spawnRing(x,z,'#ffffff',d,hh*5,0.5,0.08); spawnRing(x,z,c.col,d,hh*8,0.8,0.08);
        spawnFlash(x,y,z,hh*1.8,'#ffffff');
        for(let i=0;i<48;i++){ const a=Math.random()*Math.PI*2, b=Math.random()*Math.PI, sp=3+Math.random()*8;
          spawnPart(x,y,z, Math.sin(b)*Math.cos(a)*sp, Math.abs(Math.cos(b))*sp+2, Math.sin(b)*Math.sin(a)*sp,
                    Math.random()<0.5?'#ffffff':c.col, d*(0.4+Math.random()*0.6), 0.5+Math.random()*0.5, 10); }
        try{ if(typeof shakeScreen==='function') shakeScreen(7,220); }catch(e){}
      } else {
        spawnRing(x,z,'#cfe6ff',d,hh*2.5,0.4,0.08);
        for(let i=0;i<14;i++){ const a=Math.random()*Math.PI*2, sp=1+Math.random()*3;
          spawnPart(x,y,z, Math.cos(a)*sp, 1+Math.random()*3, Math.sin(a)*sp, '#dfefff', d*(0.3+Math.random()*0.4), 0.3+Math.random()*0.3, 8); }
        try{ if(typeof shakeScreen==='function') shakeScreen(3,90); }catch(e){}
      }
      if(ballGlow){ ballGlow.visible=false; ballCore.visible=false; }
    }
    function tickGfx(dt,now){
      if(flashPts){ flashPts.material.uniforms.time.value=now*0.001; flashPts.material.uniforms.scale.value=renderer.getPixelRatio(); }
      if(boardTex) boardTex.offset.x-=dt*0.045;
      for(const f of CFLAGS) f.rotation.y=Math.sin(now*0.003+f.userData.ph)*0.45+(f.position.x<0?0.3:Math.PI-0.3);
      for(const h of MASTS) h.material.opacity=0.6+0.12*Math.sin(now*0.02+h.position.x);
      tickParts(dt); tickRings(dt); tickFlashes(dt);
      if(shotRibbon) ribbonUpdate(shotRibbon,now);
      if(cine&&ballHalo) ballHalo.visible=false;
    }
    P3D.gfxRebuild=function(){ try{ buildExtras(); }catch(e){ console.warn('[P3D] gfxRebuild',e); } };
    // debug handles (console): sheet layouts, cell resolver, live sprites, loaded sheets
    P3D._dbg=function(){ return {LAYOUTS,cellOf,sprites,SHEETS,GK_SHEET}; };

    /* ---- initial pitch + stadium build (safe here: all bowl consts above are
       now initialized, so placeAllStadium won't hit a temporal dead zone).
       Default = assets/stadium/pitch.png. Set window.DEBUG_PITCH3D=true for the
       procedural debug pitch with engine coordinate ticks. ---- */
    if(window.DEBUG_PITCH3D===true){
      buildPitch(makeDebugPitchTex(), 1.56);
    } else if(P3D.pixelPitch!==false){
      buildPitch(makePixelPitchTex(), 1.56);              // pixel turf — no PNG needed
    } else {
      loader.load('assets/stadium/pitch.png',
        t=>buildPitch(t, t.image.width/t.image.height),
        undefined,
        ()=>{ const c=document.createElement('canvas');c.width=1280;c.height=720;
          const x=c.getContext('2d');x.fillStyle='#1f5a26';x.fillRect(0,0,1280,720);
          buildPitch(new T.CanvasTexture(c),1.56); });
    }

    function loadLayer(key){
      loader.load('assets/stadium/'+key+'.png',
        t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; t.anisotropy=8; t.colorSpace=T.SRGBColorSpace;
             TIER_TEX[key]=t; if(pitchMesh) placeAllStadium(); }, undefined, ()=>{});
      loader.load('assets/stadium/'+key+'_corner.png',
        t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; t.anisotropy=8; t.colorSpace=T.SRGBColorSpace;
             CORNER_TEX[key]=t; if(pitchMesh) placeAllStadium(); }, undefined, ()=>{});
    }
    loadLayer('lower'); loadLayer('upper'); loadLayer('roof');

    /* ════════ PLAYER BILLBOARDS (reuse assets/ps1 sheets) ════════
       Same 7×6 grid + facing logic as ps1-mod. We keep a sprite per
       (side,key) and update its cell from engine movement each frame. */
    /* ════════ SPRITE SHEET LAYOUTS ════════
       Two layouts supported so old and new art coexist. Which one a sheet uses
       is auto-detected from its pixel dimensions on load.
         LEGACY 7 cols: col0 idle(1), col1-6 run(6)
         NEW   10 cols: col0-1 idle(2), col2-9 run(8)
       Rows are identical: 0 DOWN-run 1 UP-run 2 SIDE-run
                           3 DOWN-act 4 UP-act 5 SIDE-act
       Action band: cols 0-2 pass, cols 3-6 shoot. SIDE faces RIGHT. */
    /* V3 12-col sheet — ONE ANIMATION PER ROW (12 frames each, SIDE faces RIGHT):
         row 0 idle FRONT   row 1 idle BACK    row 2 shoot/pass (side)
         row 3 run SIDE     row 4 run SOUTH    row 5 run NORTH
       Rows you have not drawn yet can hold duplicates; they are just picked by
       facing. pass = first 8 frames of the shoot row, shoot = all 12.
       Detected by aspect (w/h ≈ 1.47) or by putting "12x6" in the file name. */
    const LAYOUTS={
      7 :{cols:7 , rows:6, idle:[0,1], run:[1,6], pass:[0,3], shoot:[3,4]},
      10:{cols:10, rows:6, idle:[0,2], run:[2,8], pass:[0,3], shoot:[3,4]},
      12:{cols:12, rows:6, idle:[0,12], run:[0,12], pass:[0,8], shoot:[0,12], idleFps:4, fpsScale:0.9,
          rowFor:{ idle:{down:0, up:1, side:0}, run:{side:3, down:4, up:5}, act:{down:2, up:2, side:2} }}
    };
    const GRID=LAYOUTS[7];                 // fallback for unmeasured sheets
    /* Scan every cell's alpha once per sheet: where the feet are (padB = empty
       fraction below the lowest opaque pixel), the body's horizontal centre
       (cx) and its height fraction (h). Sprites are then anchored at the FEET
       instead of the cell edge, so padded sheets never float, and scaled so a
       player is the same world height whatever the cell padding. */
    function measureSheet(sheet){
      try{
        const img=sheet.img, L=sheet.L||GRID, cols=L.cols, rows=L.rows;
        const sc=Math.min(1,1400/img.width);
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.width*sc)); c.height=Math.max(1,Math.round(img.height*sc));
        const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0,c.width,c.height);
        const d=x.getImageData(0,0,c.width,c.height).data, Wc=c.width;
        const cw=c.width/cols, ch=c.height/rows, anchor=new Array(cols*rows);
        for(let r=0;r<rows;r++)for(let q=0;q<cols;q++){
          const x0=Math.floor(q*cw), x1=Math.floor((q+1)*cw), y0=Math.floor(r*ch), y1=Math.floor((r+1)*ch);
          let minX=1e9,maxX=-1,minY=1e9,maxY=-1;
          for(let yy=y0;yy<y1;yy++){ let has=false;
            for(let xx=x0;xx<x1;xx++){ if(d[(yy*Wc+xx)*4+3]>40){ has=true; if(xx<minX)minX=xx; if(xx>maxX)maxX=xx; } }
            if(has){ if(yy<minY)minY=yy; maxY=yy; } }
          anchor[r*cols+q]=(maxX<0)?{cx:0.5,padB:0,h:1}
            :{cx:((minX+maxX)/2-x0)/cw, padB:(y1-1-maxY)/ch, h:(maxY-minY+1)/ch};
        }
        sheet.anchor=anchor;
        const i0=cellOf(L,'down','idle',0), ref=anchor[i0.row*cols+i0.col];
        sheet.hRef=Math.max(0.5,Math.min(1,ref?ref.h:1));
        console.log('[P3D] sheet measured: body '+Math.round(sheet.hRef*100)+'% of cell, feet pad '+Math.round((ref?ref.padB:0)*100)+'%');
      }catch(e){ sheet.anchor=null; sheet.hRef=1; console.warn('[P3D] sheet measure failed (tainted canvas?)',e); }
    }
    function layoutFor(img,url){
      if(!img||!img.width||!img.height) return GRID;
      const m=/(\d+)x6/.exec(url||'');        // explicit: name it team.12x6.png
      if(m&&LAYOUTS[+m[1]]) return LAYOUTS[+m[1]];
      if(P3D.forceLayout&&LAYOUTS[P3D.forceLayout]) return LAYOUTS[P3D.forceLayout];
      const asp=img.width/img.height;
      if(asp>1.33&&asp<1.58) return LAYOUTS[12];   // 12 cols of ~166x226 cells
      const measured=img.width/(img.height/6);   // rows are always 6 (square-ish cells)
      let best=GRID,bestErr=Infinity;
      for(const k of [7,10]){
        const e=Math.abs(LAYOUTS[k].cols-measured);
        if(e<bestErr){bestErr=e;best=LAYOUTS[k];}
      }
      return bestErr<=1.5?best:GRID;
    }
    // resolve (facing, animation, frame index) → sheet cell for any layout
    function cellOf(L,face,anim,idx){
      L=L||GRID;
      const rng=L[anim]||L.run;
      const col=rng[0]+Math.min(rng[1]-1,Math.max(0,idx|0));
      let row;
      if(L.rowFor){ const grp=(anim==='pass'||anim==='shoot')?'act':anim; const r=L.rowFor[grp]||L.rowFor.run;
        row=(r[face]!=null?r[face]:r.side); }
      else { const band=ROW[face]||ROW.side; row=(anim==='pass'||anim==='shoot')?band.act:band.run; }
      return {row,col};
    }
    /* run cadence scales with real movement speed; idle gets a slow breath */
    const ANIM={runFpsMin:9, runFpsMax:17, idleFps:2.2, moveHoldMs:220};
    const ROW={down:{run:0,act:3}, up:{run:1,act:4}, side:{run:2,act:5}};
    const COL={idle:0, run:[1,6], pass:[0,3], shoot:[3,4]};
    const SHEETS={h:null,a:null}; const _sk={h:undefined,a:undefined};
    let GK_SHEET=null;                                 // shared keeper sheet for BOTH teams
    (function(){ const im=new Image();
      im.onload=()=>{const L=layoutFor(im,'assets/ps1/gk.png');GK_SHEET={img:im,L,cw:im.width/L.cols,ch:im.height/L.rows};measureSheet(GK_SHEET);};
      im.src='assets/ps1/gk.png'; })();
    function loadSheet(side,urls){
      let i=0; const next=()=>{ if(i>=urls.length){ if(!SHEETS[side])SHEETS[side]='none'; return; }
        const im=new Image(), u=urls[i++];
        im.onload=()=>{const L=layoutFor(im,u);
          SHEETS[side]={img:im,L,cw:im.width/L.cols,ch:im.height/L.rows};
          measureSheet(SHEETS[side]);
          console.log('[P3D] '+side+' sheet '+u+' '+im.width+'x'+im.height+
            ' -> '+L.cols+' cols x '+L.rows+' rows, cell '+
            (im.width/L.cols).toFixed(0)+'x'+(im.height/L.rows).toFixed(0)+
            ', run '+JSON.stringify(L.run)+' idle '+JSON.stringify(L.idle));};
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
      const _L=sheet.L||GRID;
      tex.repeat.set(1/_L.cols,1/_L.rows); tex.needsUpdate=true;
      const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,alphaTest:0.5}));
      sp.center.set(0.5,0); scene.add(sp);
      // soft round CONTACT shadow under the feet
      const sh=new T.Mesh(new T.PlaneGeometry(1,1),
        new T.MeshBasicMaterial({map:SHADOW_TEX,transparent:true,opacity:P3D.light.shadow,depthWrite:false}));
      sh.material.userData.isShadow=true;
      sh.rotation.x=-Math.PI/2; sh.position.y=0.04; sh.renderOrder=2; scene.add(sh);
      // SILHOUETTE cast shadow — same sprite texture, tinted black, laid flat &
      // stretched away from the sun (real shape, since the sprite is transparent).
      const sil=new T.Mesh(new T.PlaneGeometry(1,1),
        new T.MeshBasicMaterial({map:tex,color:0x000000,transparent:true,alphaTest:0.5,
                                 opacity:P3D.light.shadow,depthWrite:false}));
      sil.material.userData.isShadow=true;
      sil.renderOrder=2; scene.add(sil);
      return sprites[id]={sprite:sp,shadow:sh,sil,tex,_sheetImg:sheet.img,_L:(sheet.L||GRID)};
    }
    function cellState(id,p,wx,wz,L){
      L=L||GRID;
      const now=performance.now();
      const prev=stt[id]||{rx:p.x,ry:p.y,face:'side',flip:false,moveT:-1e9,
                           spd:0,lx:p.x,ly:p.y,lt:now,phase:Math.random()*1000,aph:Math.random()*100,apt:now};
      // smoothed speed drives run cadence (jog vs sprint)
      const dtS=Math.max(1,now-(prev.lt||now))/1000;
      const inst=Math.hypot(p.x-(prev.lx==null?p.x:prev.lx),p.y-(prev.ly==null?p.y:prev.ly))/dtS;
      prev.spd=(prev.spd||0)*0.82+inst*0.18;
      prev.lx=p.x; prev.ly=p.y; prev.lt=now;
      const ddx=p.x-prev.rx, ddy=p.y-prev.ry, dist=Math.hypot(ddx,ddy);
      const thresh=(CV.width||1280)*0.0015;
      let {rx,ry,face,flip,moveT}=prev;
      if(dist>thresh){
        const dwx=ddx*_wpeX, dwz=ddy*_wpeZ;             // engine delta → world delta
        const sX=dwx*_camRX+dwz*_camRZ;                 // screen-horizontal (abs only)
        const sZ=dwx*_camFX+dwz*_camFZ;                 // screen-depth (+ = away)
        if(Math.abs(sX)>=Math.abs(sZ)){
          face='side';
          // flip from the ACTUAL on-screen horizontal motion (project feet now vs
          // feet+velocity). Sign-proof and works for the camera-followed carrier.
          _fp.set(wx,0.05,wz).project(camera);
          _fp2.set(wx+dwx,0.05,wz+dwz).project(camera);
          const sdx=_fp2.x-_fp.x;
          if(Math.abs(sdx)>1e-5) flip=sdx<0;            // moving screen-left → mirror (sheet faces right)
        } else {
          face=sZ>0?'up':'down';                        // away → back row, toward → front row
        }
        moveT=now; rx=p.x; ry=p.y;
      }
      stt[id]={rx,ry,face,flip,moveT,spd:prev.spd,lx:prev.lx,ly:prev.ly,lt:prev.lt,phase:prev.phase,aph:prev.aph,apt:prev.apt};
      if(L.rowFor&&face!=='side') flip=false;   // dedicated front/back rows are never mirrored
      const band=ROW[face]||ROW.side;
      // one-shot pass/shoot animation override (action band, same facing) —
      // same mechanism as ps1-mod's PS1_action, ported to the 3D billboards.
      const act=ACT[id];
      if(act){
        const A=P3D.anim||ANIM;
        const rng=(act.name==='shoot'?L.shoot:L.pass), dur=(act.name==='shoot'?(A.shootMs||720):(A.passMs||520))*Math.max(0.6,rng[1]/8), el=now-act.t0;
        if(el<dur){ const fi=Math.min(rng[1]-1, Math.floor(el/dur*rng[1]));
          const cc=cellOf(L,face,act.name,fi); return {row:cc.row, col:cc.col, flip}; }
        delete ACT[id];
      }
      const running=(now-moveT)<ANIM.moveHoldMs;
      if(running){
        // cadence ramps with measured speed instead of a fixed 11fps
        const ref=(CV.width||1280)*0.30;
        const t=Math.max(0,Math.min(1,(prev.spd||0)/ref));
        const A=P3D.anim||ANIM;
        const fps=(A.runFpsMin+(A.runFpsMax-A.runFpsMin)*t)*(L.fpsScale||1);
        const R=L.run;
        // accumulate phase by fps*dt so a changing fps never warps the cycle
        const adt=Math.max(0,Math.min(0.1,(now-(prev.apt||now))/1000));
        stt[id].aph=(prev.aph||0)+fps*adt; stt[id].apt=now;
        const cc=cellOf(L,face,'run',Math.floor(stt[id].aph)%R[1]); return {row:cc.row, col:cc.col, flip};
      }
      stt[id].apt=now;
      const I=L.idle;
      if(I[1]>1){   // multi-frame idle, phase-offset per player so nobody syncs
        const fi=Math.floor((now+prev.phase*370)/1000*((P3D.anim&&P3D.anim.idleFps)||L.idleFps||ANIM.idleFps))%I[1];
        const cc=cellOf(L,face,'idle',fi); return {row:cc.row, col:cc.col, flip};
      }
      const cc=cellOf(L,face,'idle',0); return {row:cc.row, col:cc.col, flip};
    }
    /* one-shot action triggers — auto-detected from engine phase transitions */
    const ACT={};
    P3D.action=function(s,k,name){ if(COL[name]) ACT[s+':'+k]={name,t0:performance.now()}; };
    let _lastCarrier=null,_prevKick=false;
    function watchActions(){
      if(typeof G==='undefined'||!G) return;
      if(G.phase==='moving'&&G.poss&&G.ck) _lastCarrier={s:G.poss,k:G.ck};
      const kicking=(G.phase==='pass_anim');
      if(kicking&&!_prevKick&&_lastCarrier){
        const shot=!!(G._shotTrail||G._shotZone);
        P3D.action(_lastCarrier.s,_lastCarrier.k, shot?'shoot':'pass');
      }
      _prevKick=kicking;
    }
    const seen=new Set();
    let _camRX=1,_camRZ=0,_camFX=0,_camFZ=1,_wpeX=1,_wpeZ=1;
    const _camRgt=new T.Vector3(), _camFwd=new T.Vector3();
    const _fp=new T.Vector3(), _fp2=new T.Vector3();   // for projected screen-motion flip
    function syncPlayers(){
      seen.clear();
      // camera-relative ground axes (for sprite facing) + engine→world scale
      _camRgt.setFromMatrixColumn(camera.matrixWorld,0); _camRgt.y=0; _camRgt.normalize();
      camera.getWorldDirection(_camFwd); _camFwd.y=0; _camFwd.normalize();
      _camRX=_camRgt.x; _camRZ=_camRgt.z; _camFX=_camFwd.x; _camFZ=_camFwd.z;
      _wpeX=PLEN/((CV.width||1280)*fbSx); _wpeZ=PWID/((CV.height||720)*fbSy);
      ['h','a'].forEach(s=>{
        const sheet=SHEETS[s]; if(!sheet||sheet==='none'||!sheet.img.complete) return;
        const q=sq(s);
        Object.keys(q).forEach(k=>{
          const pl=q[k], p=PP[s] && PP[s][k]; if(!pl||!p) return;
          const id=s+':'+k; seen.add(id);
          const useSheet=(k==='GK'&&GK_SHEET&&GK_SHEET.img.complete)?GK_SHEET:sheet;
          const o=ensureSprite(id,useSheet);
          if(o._sheetImg!==useSheet.img){         // (re)bind texture if the sheet changed
            o.tex.image=useSheet.img; o.tex.needsUpdate=true; o._sheetImg=useSheet.img;
          }
          // sprite height = fixed fraction of world pitch LENGTH (HD-2D scale).
          // P3D.spriteFrac defaults to ~0.045 of PLEN — tune in Camera Lab.
          const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
          const hWorld=PLEN*frac/(useSheet.hRef||1);      // body height stays constant across sheets
          const wWorld=hWorld*(useSheet.cw/useSheet.ch);
          o._anchor=useSheet.anchor||null; o._cols=(o._L||GRID).cols;
          // keep feet on the pitch: clamp x to the goal lines (GK sits at ~0.05 in
          // the engine, which would render BEHIND the goal line) and y to sidelines.
          const W=(CV.width||1280), H=(CV.height||720);
          const cx=Math.min(Math.max(p.x,0.07*W),0.93*W);
          const cy=Math.min(Math.max(p.y,0.01*H),0.99*H);
          const wx=ex2wx(cx), wz=ey2wz(cy);
          const st=cellState(id,p,wx,wz,(o._L||GRID));
          // Mirror via UV, not scale: THREE.Sprite ignores negative scale.x.
          // flip → repeat.x negative + offset shifted one cell to the right edge.
          const _L=(o._L||GRID);
          const cw=1/_L.cols, ch=1/_L.rows;
          const ox=st.col*cw, oy=1-(st.row+1)*ch;
          if(st.flip){ o.tex.repeat.set(-cw,ch); o.tex.offset.set(ox+cw,oy); }
          else       { o.tex.repeat.set( cw,ch); o.tex.offset.set(ox,   oy); }
          // anchor the sprite at the FEET of this exact frame (not the cell edge)
          const an=o._anchor&&o._anchor[st.row*_L.cols+st.col];
          const padB=an?an.padB:0, acx=an?(st.flip?1-an.cx:an.cx):0.5;
          o.sprite.center.set(acx,padB);
          o.sprite.scale.set(wWorld, hWorld, 1);
          o.sprite.position.set(wx,0.05+(P3D.spriteY||0),wz);
          // ---- shadows ----
          const Lt=P3D.light, az=Lt.azim, el=Math.max(0.05,Math.min(1,Lt.elev));
          const cdx=-Math.sin(az), cdz=-Math.cos(az);        // cast direction (away from sun)
          // small soft CONTACT patch under the feet
          const baseR=Math.max(0.3, wWorld*0.5);
          o.shadow.position.set(wx,0.04,wz);
          o.shadow.scale.set(baseR, baseR*0.55, 1);
          o.shadow.material.opacity=Lt.shadow*0.55;
          // SILHOUETTE cast: lay the sprite flat, stretch away from the sun
          const projLen=hWorld*(0.55+(1-el)*Lt.shadowLen*2.6);
          o.sil.position.set(wx+cdx*projLen*(0.5-padB), 0.045, wz+cdz*projLen*(0.5-padB));
          o.sil.scale.set(wWorld, projLen, 1);
          _qF.setFromAxisAngle(_AX,-Math.PI/2); _qS.setFromAxisAngle(_AY,az);
          o.sil.quaternion.copy(_qS).multiply(_qF);
          o.sil.visible = (Lt.castSil!==false);
          o.sil.material.opacity=Lt.shadow*0.8;
          // dust puff: BALL CARRIER only (every player was too noisy)
          const st2=stt[id];
          const _isCarrier=(typeof G!=='undefined'&&G&&G.poss&&G.ck)&&(id===G.poss+':'+G.ck);
          if(_isCarrier && st2 && (performance.now()-st2.moveT)<70){
            if(!st2._dustT || performance.now()-st2._dustT>140){
              st2._dustT=performance.now();
              const bdx=(st2.flip?1:-1);                 // behind = opposite facing
              for(let di=0; di<2; di++){
                spawnTrail(wx+bdx*wWorld*0.35+(Math.random()-.5)*wWorld*0.25,
                           0.05+Math.random()*0.06,
                           wz+0.18+(Math.random()-.5)*wWorld*0.3,
                           '#a88a5e', hWorld*(0.16+Math.random()*0.06));
              }
            }
          }
        });
      });
      // hide sprites whose players vanished (subs, etc.)
      for(const id in sprites){ const vis=seen.has(id);
        sprites[id].sprite.visible=vis; sprites[id].shadow.visible=vis;
        if(sprites[id].sil) sprites[id].sil.visible=vis; }
    }

    /* ════════ SPRITE/SHADOW DEBUG OVERLAY (Camera Lab) ════════
       Projects each player's sprite foot-anchor (green) and shadow-disc center
       (red) to screen space and labels engine (x,y). Reveals any offset between
       where the billboard plants and where its shadow lands. */
    let dbgCv=null, dbgCx=null;
    function ensureDbgCanvas(){
      if(dbgCv) return;
      dbgCv=document.createElement('canvas'); dbgCv.id='C3D_dbg';
      dbgCv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;display:none';
      CV.parentNode.insertBefore(dbgCv, gl.nextSibling); dbgCx=dbgCv.getContext('2d');
    }
    const _v3=new T.Vector3();
    function projectToScreen(wx,wy,wz, w,h){
      _v3.set(wx,wy,wz).project(camera);
      return { x:(_v3.x*0.5+0.5)*w, y:(-_v3.y*0.5+0.5)*h, z:_v3.z };
    }
    P3D.playerScreenPos=function(side,key){
      const o=sprites[side+':'+key]; if(!o||!o.sprite||!o.sprite.visible)return null;
      const sp=o.sprite.position;
      const W=(CV.width||1280),H=(CV.height||720);
      const foot=projectToScreen(sp.x,sp.y,sp.z,W,H);
      const head=projectToScreen(sp.x,sp.y+o.sprite.scale.y,sp.z,W,H);
      if(foot.z>1)return null;                         // behind the camera
      return { x:foot.x, y:(foot.y+head.y)/2, r:Math.max(18,Math.abs(foot.y-head.y)*0.5) };
    };
    function drawDebug(){
      ensureDbgCanvas();
      if(!P3D.debug){ if(dbgCv.style.display!=='none') dbgCv.style.display='none'; return; }
      const w=CV.clientWidth||CV.width, h=CV.clientHeight||CV.height;
      if(dbgCv.width!==w||dbgCv.height!==h){ dbgCv.width=w; dbgCv.height=h; }
      dbgCv.style.display='block';
      dbgCx.clearRect(0,0,w,h);
      dbgCx.font='10px monospace'; dbgCx.textAlign='center';
      for(const id in sprites){
        const o=sprites[id]; if(!o.sprite.visible) continue;
        const sp=o.sprite.position, sh=o.shadow.position;
        const pFoot=projectToScreen(sp.x,sp.y,sp.z, w,h);      // sprite anchor (center.y=0 → foot)
        const pShad=projectToScreen(sh.x,sh.y,sh.z, w,h);      // shadow centre
        if(pFoot.z>1||pShad.z>1) continue;                      // behind camera
        // line between them so any mismatch is obvious
        dbgCx.strokeStyle='rgba(255,255,0,.6)'; dbgCx.lineWidth=1;
        dbgCx.beginPath(); dbgCx.moveTo(pFoot.x,pFoot.y); dbgCx.lineTo(pShad.x,pShad.y); dbgCx.stroke();
        // shadow center (red)
        dbgCx.fillStyle='#ff3b3b'; dbgCx.beginPath(); dbgCx.arc(pShad.x,pShad.y,4,0,7); dbgCx.fill();
        // sprite foot (green)
        dbgCx.fillStyle='#2bff6a'; dbgCx.beginPath(); dbgCx.arc(pFoot.x,pFoot.y,4,0,7); dbgCx.fill();
        // engine x,y label
        const st=stt[id];
        if(st){ dbgCx.fillStyle='#fff';
          dbgCx.fillText(Math.round(st.rx)+','+Math.round(st.ry), pFoot.x, pFoot.y-8); }
      }
    }
    P3D._drawDebug=drawDebug;

    /* ════════ 2.5D HUD: radar + carrier/chaser name tags + click hit-test ════════
       The 2D engine drew these on #C, which is hidden under the GL canvas while
       2.5D is on. We redraw them here using the 3D camera projection, and expose
       P3D.pickPlayerAt so the engine's tap-to-pass works against 3D positions. */
    let hudCv=null, hudCx=null;
    function ensureHud(){
      if(hudCv) return;
      hudCv=document.createElement('canvas'); hudCv.id='C3D_hud';
      hudCv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;display:none';
      CV.parentNode.insertBefore(hudCv, gl.nextSibling); hudCx=hudCv.getContext('2d');
    }
    // foot world position of an engine player (same clamp + mapping as the sprite)
    function footWorld(p){
      const W=(CV.width||1280), H=(CV.height||720);
      const cx=Math.min(Math.max(p.x,0.07*W),0.93*W);
      const cy=Math.min(Math.max(p.y,0.01*H),0.99*H);
      return {x:ex2wx(cx), z:ey2wz(cy)};
    }
    // nearest home teammate (not carrier) to a client click, in 3D screen space
    P3D.pickPlayerAt=function(clientX, clientY){
      if(typeof PP==='undefined'||!PP||!PP.h) return null;
      const rect=gl.getBoundingClientRect();
      const px=(clientX-rect.left), py=(clientY-rect.top);
      const w=gl.clientWidth||gl.width, h=gl.clientHeight||gl.height;
      let best=null, bestD=1e9;
      const hq=(typeof hSq!=='undefined')?hSq:(typeof sq==='function'?sq('h'):null);
      for(const k in (hq||{})){
        if(!hq[k]) continue;
        if(typeof G!=='undefined'&&G&&k===G.ck) continue;   // skip the carrier
        const p=PP.h[k]; if(!p) continue;
        const fw=footWorld(p);
        const s=projectToScreen(fw.x,1.2,fw.z, w,h);          // aim at chest height
        if(s.z>1) continue;                                   // behind camera
        const d=Math.hypot(s.x-px, s.y-py);
        if(d<bestD){ bestD=d; best=k; }
      }
      return (best && bestD<70) ? best : best;                // nearest wins; tolerance generous
    };
    function tag(ctx,sx,sy,txt,col){
      ctx.font='700 12px Orbitron, system-ui';
      const w=ctx.measureText(txt).width+16;
      ctx.fillStyle='rgba(2,4,10,.82)'; ctx.fillRect(sx-w/2,sy-58,w,18);
      ctx.fillStyle=col; ctx.fillRect(sx-w/2,sy-58,3,18);
      ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(txt,sx+1,sy-45);
    }
    function drawRadar3D(ctx,w,h){
      if(typeof PP==='undefined'||!PP) return;
      const rw=Math.min(220,w*0.28), rh=rw*0.52, rx=(w-rw)/2, ry=h-rh-14;
      ctx.save(); ctx.globalAlpha=.92;
      // frame
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(rx-3,ry-3,rw+6,rh+6,6); else ctx.rect(rx-3,ry-3,rw+6,rh+6);
      ctx.fillStyle='rgba(6,12,10,.80)'; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=1; ctx.stroke();
      // turf
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(rx,ry,rw,rh,3); else ctx.rect(rx,ry,rw,rh);
      ctx.fillStyle='rgba(26,58,26,.72)'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle='rgba(255,255,255,.030)';
      for(let i=0;i<8;i+=2) ctx.fillRect(rx+i*(rw/8),ry,rw/8,rh);
      ctx.restore();
      // markings
      const LN='rgba(255,255,255,.62)';
      ctx.strokeStyle=LN; ctx.lineWidth=1;
      ctx.strokeRect(rx+.5,ry+.5,rw-1,rh-1);
      ctx.beginPath(); ctx.moveTo(rx+rw/2,ry); ctx.lineTo(rx+rw/2,ry+rh); ctx.stroke();
      ctx.beginPath(); ctx.arc(rx+rw/2,ry+rh/2,rw*0.055,0,7); ctx.stroke();
      ctx.beginPath(); ctx.arc(rx+rw/2,ry+rh/2,1.5,0,7); ctx.fillStyle=LN; ctx.fill();
      const paW=rw*0.13, paH=rh*0.50, gaW=rw*0.05, gaH=rh*0.25;
      [0,1].forEach(sd=>{
        const x0=sd?rx+rw-paW:rx;
        ctx.strokeRect(x0+.5,ry+(rh-paH)/2+.5,paW-1,paH-1);
        const g0=sd?rx+rw-gaW:rx;
        ctx.strokeRect(g0+.5,ry+(rh-gaH)/2+.5,gaW-1,gaH-1);
        const sx=sd?rx+rw-paW*0.65:rx+paW*0.65;
        ctx.beginPath(); ctx.arc(sx,ry+rh/2,1.1,0,7); ctx.fillStyle=LN; ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.5)';
        ctx.fillRect(sd?rx+rw:rx-2.5, ry+(rh-rh*0.14)/2, 2.5, rh*0.14);
      });
      const W=(CV.width||1280), H=(CV.height||720);
      const rpx=x=>rx+(x/W)*rw, rpy=y=>ry+(y/H)*rh;
      const poss=(typeof G!=='undefined'&&G)?G.poss:'h', ck=(typeof G!=='undefined'&&G)?G.ck:null;
      ['h','a'].forEach(s=>{ const col=s==='h'?'#4ea0ff':'#ff5050';
        Object.keys(PP[s]||{}).forEach(k=>{ const p=PP[s][k]; if(!p) return;
          if(s===poss&&k===ck) return;
          ctx.beginPath(); ctx.arc(rpx(p.x),rpy(p.y),2.6,0,7); ctx.fillStyle=col; ctx.fill();
          ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=.8; ctx.stroke(); }); });
      const cp=(ck&&PP[poss])?PP[poss][ck]:null;
      if(cp){ const ccol=poss==='h'?'#4ea0ff':'#ff5050'; const t=(Math.sin(Date.now()/220)+1)/2;
        ctx.save(); ctx.shadowColor=ccol; ctx.shadowBlur=6+t*7;
        ctx.beginPath(); ctx.arc(rpx(cp.x),rpy(cp.y),3.6,0,7); ctx.fillStyle='#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(rpx(cp.x),rpy(cp.y),5+t*1.6,0,7); ctx.strokeStyle=ccol; ctx.lineWidth=1.4; ctx.stroke();
        ctx.restore(); }
      if(typeof ball!=='undefined'&&ball){ ctx.beginPath(); ctx.arc(rpx(ball.x),rpy(ball.y),2.6,0,7);
        ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle='#ffd24a'; ctx.lineWidth=1; ctx.stroke(); }
      ctx.restore();
    }
    function drawHUD(){
      ensureHud();
      if(typeof G==='undefined'||!G || !(G.phase==='moving'||G.phase==='pass_anim')){
        if(hudCv.style.display!=='none') hudCv.style.display='none'; return;
      }
      const w=CV.clientWidth||CV.width, h=CV.clientHeight||CV.height;
      if(hudCv.width!==w||hudCv.height!==h){ hudCv.width=w; hudCv.height=h; }
      hudCv.style.display='block'; hudCx.clearRect(0,0,w,h);
      // name tags removed — active players now shown in the 2D bust HUD
      drawRadar3D(hudCx,w,h);
    }
    P3D._drawHUD=drawHUD;

    /* ════════ BALL ════════ */
    // Real sphere, not a billboard: it rolls (rotates about the axis
    // perpendicular to travel), lifts with ball.bz, and drops a ground
    // shadow that shrinks + fades with height.
    const ballCv=document.createElement('canvas'); ballCv.width=256; ballCv.height=128;
    const bcx=ballCv.getContext('2d');
    bcx.fillStyle='#f4f6fa'; bcx.fillRect(0,0,256,128);
    // classic panel look: staggered dark pentagons + seams
    bcx.fillStyle='#141a24';
    [[0.10,0.28],[0.36,0.22],[0.62,0.30],[0.86,0.20],
     [0.22,0.66],[0.48,0.72],[0.74,0.64],[0.98,0.70]].forEach(function(p){
      const x=p[0]*256, y=p[1]*128, r=17;
      bcx.beginPath();
      for(let a=0;a<5;a++){
        const th=-Math.PI/2+a*Math.PI*2/5;
        const vx=x+Math.cos(th)*r, vy=y+Math.sin(th)*r*0.82;
        a?bcx.lineTo(vx,vy):bcx.moveTo(vx,vy);
      }
      bcx.closePath(); bcx.fill();
    });
    bcx.strokeStyle='rgba(20,26,36,.30)'; bcx.lineWidth=2;
    bcx.beginPath(); bcx.moveTo(0,48); bcx.lineTo(256,44);
    bcx.moveTo(0,92); bcx.lineTo(256,96); bcx.stroke();
    const ballTex=new T.CanvasTexture(ballCv);
    ballTex.minFilter=T.LinearFilter; ballTex.magFilter=T.LinearFilter;
    const ballMesh=new T.Mesh(new T.SphereGeometry(0.5,18,14),
      new T.MeshLambertMaterial({map:ballTex,color:0xffffff}));
    scene.add(ballMesh);
    // soft blob shadow
    const bShCv=document.createElement('canvas'); bShCv.width=bShCv.height=64;
    const shx=bShCv.getContext('2d');
    const shg=shx.createRadialGradient(32,32,1,32,32,31);
    shg.addColorStop(0,'rgba(0,0,0,.55)'); shg.addColorStop(0.6,'rgba(0,0,0,.22)');
    shg.addColorStop(1,'rgba(0,0,0,0)');
    shx.fillStyle=shg; shx.fillRect(0,0,64,64);
    const ballShadow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(bShCv),
      transparent:true,depthWrite:false,opacity:0.45}));
    scene.add(ballShadow);
    let _bPrevX=null,_bPrevZ=null;
    const _bAxis=new T.Vector3();
    function syncBall(){
      if(cine) return;   // cinematic drives the ball directly
      if(typeof ball==='undefined'||!ball) return;
      const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
      const d=PLEN*frac*0.21;                // ball ~0.21 of player sprite height
      ballMesh.scale.setScalar(d);           // geometry r=0.5 → diameter d
      let bx=ball.x, by=ball.y;
      // Cosmetic: when a carrier is dribbling, pull the rendered ball toward his
      // feet so it doesn't read as detached (engine keeps it slightly ahead).
      // During passes / loose balls, show the true ball position so it travels.
      const cp=carrierPos();
      const passing=(typeof G!=='undefined'&&G&&(G.phase==='pass_anim'||(G.phase==='moving'&&G.pm)));
      if(cp && !passing){
        const t=0.6;                         // 0 = true pos, 1 = on the sprite
        bx+=(cp.x-bx)*t; by+=(cp.y-by)*t;
      }
      let hgtMul=1;
      try{
        const shooting=!!(typeof G!=='undefined'&&G&&G._shotTrail);
        if(shooting&&typeof ballTravel!=='undefined'&&ballTravel&&ballTravel.active){
          const bt=ballTravel;
          if(_os.bt!==bt){                   // a new shot → pick the shooter's style once
            const s=G.poss, pl=(typeof sq==='function'&&G.ck&&sq(s))?sq(s)[G.ck]:null;
            const st=shotStyleFor(pl), pp=shotPerp(bt.fx,bt.fy,bt.tx,bt.ty);
            _os={bt,st,px:pp.px,py:pp.py,L:pp.L,amt:(CV.width||1280)*0.05*st.curve};
            window.U11DBG&&U11DBG('[3D] open-play shot style: '+st.kind);
          }
          const t=Math.min(1,Math.hypot(bx-_os.bt.fx,by-_os.bt.fy)/_os.L);
          const off=Math.sin(Math.PI*t)*_os.amt;
          bx+=_os.px*off; by+=_os.py*off; hgtMul=_os.st.loft;
        } else if(!shooting) _os.bt=null;
      }catch(e){}
      const r=d*0.5, hgt=Math.max(0,(ball.bz||0)*0.09)*hgtMul;
      const bwy=r+hgt;                       // resting on the turf, lifted by bz
      const wx=ex2wx(bx), wz=ey2wz(by);
      ballMesh.position.set(wx,bwy,wz);
      // ROLL: rotate about the axis perpendicular to the direction of travel
      if(_bPrevX!==null){
        const ddx=wx-_bPrevX, ddz=wz-_bPrevZ, trav=Math.hypot(ddx,ddz);
        if(trav>1e-4&&r>1e-6){
          _bAxis.set(ddz,0,-ddx).normalize();
          ballMesh.rotateOnWorldAxis(_bAxis,trav/r);
        }
      }
      _bPrevX=wx; _bPrevZ=wz;
      // shadow shrinks + fades as the ball climbs
      const shs=d*1.35/(1+hgt*0.55);
      ballShadow.position.set(wx,0.025,wz);
      ballShadow.scale.set(shs,shs*0.55,1);
      ballShadow.material.opacity=0.45/(1+hgt*0.8);
      // shot energy trail (3D replacement for the 2D _shotTrail glow)
      try{ openPlayBallFx(wx,bwy,wz,d,!!(typeof G!=='undefined'&&G&&G._shotTrail)); }catch(e){}
    }

    /* ════════ REFEREE ════════
       Sprite-sheet billboard (assets/ps1/referee.png) that follows the action,
       trailing the ball at a set distance so he isn't on top of the play. He
       stays on the field and may fall outside the camera frame — that's fine.
       Sheet: 5 cols × 3 rows. col0 = idle, cols1-4 = run cycle.
       rows: 0=down(toward cam), 1=up(away), 2=side(faces right; mirror=left). */
    const REFG={cols:5,rows:3};
    const REFROW={down:0,up:1,side:2};
    let refSheet=null;
    (function(){ const im=new Image();
      im.onload=()=>refSheet={img:im, cw:im.width/REFG.cols, ch:im.height/REFG.rows};
      im.onerror=()=>{}; im.src='assets/ps1/referee.png'; })();
    const refTex=new T.Texture(); refTex.magFilter=T.NearestFilter; refTex.minFilter=T.NearestFilter;
    const refMesh=new T.Sprite(new T.SpriteMaterial({map:refTex,transparent:true,alphaTest:0.5}));
    refMesh.center.set(0.5,0); refMesh.visible=false; scene.add(refMesh);
    const refSh=new T.Mesh(new T.PlaneGeometry(1,1),
      new T.MeshBasicMaterial({map:SHADOW_TEX,transparent:true,opacity:0.35,depthWrite:false}));
    refSh.rotation.x=-Math.PI/2; refSh.position.y=0.04; refSh.renderOrder=2; refSh.visible=false; scene.add(refSh);
    // x,y normalized 0..1 field; gap = trailing distance, speed = max step/sec (field frac)
    const REF={x:0.5,y:0.4, gap:0.13, speed:0.55, face:'down', flip:false, moveT:-1e9};
    let refInit=false, _refTexBound=false;
    function syncRef(dt){
      if(!refSheet||!refSheet.img.complete){ refMesh.visible=false; refSh.visible=false; return; }
      if(!_refTexBound){ refTex.image=refSheet.img; refTex.needsUpdate=true; _refTexBound=true; }
      refMesh.visible=true; refSh.visible=true;
      const W=(CV.width||1280), H=(CV.height||720);
      const now=performance.now();
      // TARGET = the action (carrier, else loose ball)
      let tx,ty;
      const cp=carrierPos();
      if(cp){ tx=cp.x/W; ty=cp.y/H; }
      else if(typeof ball!=='undefined'&&ball){ tx=ball.x/W; ty=ball.y/H; }
      else { tx=REF.x; ty=REF.y; }
      if(!refInit){ REF.x=tx; REF.y=ty-REF.gap; refInit=true; }
      // close toward the action but hold gap distance off it
      const dx=tx-REF.x, dy=ty-REF.y, d=Math.hypot(dx,dy);
      let moving=false;
      if(d>REF.gap){
        const step=Math.min(REF.speed*dt, d-REF.gap);
        REF.x+=dx/d*step; REF.y+=dy/d*step; moving=(step>1e-4);
      }
      if(moving) REF.moveT=now;
      // FACING from camera-relative motion (same axes as players)
      if(moving && d>1e-4){
        const ewx=dx*W, ewy=dy*H;                       // engine-px delta
        const dwx=ewx*_wpeX, dwz=ewy*_wpeZ;             // → world delta
        const sX=dwx*_camRX+dwz*_camRZ, sZ=dwx*_camFX+dwz*_camFZ;
        if(Math.abs(sX)>=Math.abs(sZ)){
          REF.face='side';
          const wx0=ex2wx(REF.x*W), wz0=ey2wz(REF.y*H);
          _fp.set(wx0,0.05,wz0).project(camera);
          _fp2.set(wx0+dwx,0.05,wz0+dwz).project(camera);
          const sdx=_fp2.x-_fp.x; if(Math.abs(sdx)>1e-5) REF.flip=sdx<0;
        } else { REF.face=sZ>0?'up':'down'; }
      }
      const cx=Math.min(Math.max(REF.x,0.05),0.95)*W;
      const cy=Math.min(Math.max(REF.y,0.04),0.96)*H;
      const wx=ex2wx(cx), wz=ey2wz(cy);
      const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
      const hWorld=PLEN*frac;
      const wWorld=hWorld*(refSheet.cw/refSheet.ch);
      // cell: row by facing, col idle/run
      const running=(now-REF.moveT)<160;
      const row=REFROW[REF.face]!=null?REFROW[REF.face]:REFROW.down;
      const col=running?(1+(Math.floor(now/1000*9)%4)):0;
      const cw=1/REFG.cols, chh=1/REFG.rows;
      const ox=col*cw, oy=1-(row+1)*chh;
      if(REF.flip && REF.face==='side'){ refTex.repeat.set(-cw,chh); refTex.offset.set(ox+cw,oy); }
      else                             { refTex.repeat.set( cw,chh); refTex.offset.set(ox,   oy); }
      refMesh.scale.set(wWorld,hWorld,1);
      refMesh.position.set(wx,0.05,wz);
      const r=Math.max(0.3,wWorld*0.5);
      refSh.position.set(wx,0.04,wz); refSh.scale.set(r,r*0.55,1);
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
      // DUEL PASS-PICK: overhead tactical view so every teammate is visible/tappable
      if(typeof G!=='undefined'&&G&&G.pm&&G.phase==='duel'){
        const cp2=carrierPos();
        const fx2=cp2?ex2wx(cp2.x)*0.4:0, fz2=cp2?ey2wz(cp2.y)*0.4:0;
        camera.position.set(fx2, PLEN*0.60, fz2+8);
        camera.lookAt(fx2, 0, fz2);
        return;
      }
      // FOCUS: during a pass/loose ball, follow the BALL (it leads to the
      // receiver); otherwise follow the carrier. This keeps far receivers framed.
      let fx=0,fz=0, cx01=0.5;
      const passing = (typeof G!=='undefined'&&G&&(G.phase==='pass_anim'||G.phase==='moving'&&G.pm));
      const cp=carrierPos();
      if(passing && typeof ball!=='undefined'&&ball){
        fx=ex2wx(ball.x); fz=ey2wz(ball.y); cx01=ball.x/(CV.width||1280);
      } else if(cp){ fx=ex2wx(cp.x); fz=ey2wz(cp.y); cx01=cp.x/(CV.width||1280); }
      else if(typeof ball!=='undefined'&&ball){ fx=ex2wx(ball.x); fz=ey2wz(ball.y); cx01=ball.x/(CV.width||1280); }
      const k=Math.min(1,dt*C.followLerp);
      camFocus.x+=(fx-camFocus.x)*k;
      camFocus.z+=(fz*C.zFollow-camFocus.z)*k;     // partial Z so view stays sideways
      // AUTO-ZOOM near the SOUTH touchline: as the carrier approaches the near
      // edge, pull the camera in so the dark base/sponsor panel goes out of frame.
      const cyN = cp ? cp.y/(CV.height||720) : 0.5;        // 0..1 (1 = near/south)
      const southProx = Math.max(0, (cyN - 0.62)/0.38);   // 0 at mid, →1 at south edge
      const targetDist = C.dist * (1 - 0.5*southProx);     // up to 50% closer
      camFocus.dist+=(targetDist-camFocus.dist)*k;
      // INWARD YAW: at midfield theta≈0 (pure sideways); near either goal, turn in.
      // cx01: 0=left goal, 0.5=mid, 1=right goal  →  signed -1..1
      const sideSigned=(cx01-0.5)*2;               // -1 .. +1
      const autoTheta = sideSigned * C.inwardYaw;  // turn toward the active goal
      const th = (drag? orbit.theta : autoTheta);
      const ph = (drag? orbit.phi   : C.phi);
      const r=camFocus.dist;
      camera.position.set(camFocus.x + r*Math.cos(ph)*Math.sin(th),
                          C.height*Math.sin(ph)+C.lift,
                          camFocus.z + r*Math.cos(ph)*Math.cos(th));
      camera.lookAt(camFocus.x, C.lookY, camFocus.z);
    }

    /* ════════ SUPER-SHOT CINEMATIC ════════
       CT J style: camera swings frontal on the striker (kick anim) → hard cut
       to the keeper → ball flies in with a colored trail → net (goal) or GK
       catch/dive (save). Outcome is decided by the duel BEFORE this plays —
       this is pure presentation. Engine sits in idle/duel_result meanwhile.
       GK dive sheet: assets/ps1/gk_dive.png (5 cols × 3 rows:
       row0 = catch/center, row1 = dive left, row2 = dive right). Optional —
       falls back to the team sheet's action row until the asset exists. */
    let cine=null;
    /* Drop-in cinematic sprites (optional — sheet frames used if missing):
       assets/ps1/striker_windup.png  — single frame, back view, wind-up (transparent)
       assets/ps1/gk_cine.png         — frontal GK sheet, 3 cols x 2 rows (transparent) */
    /* SELECTION MARKER under the player you control.
       Was a soft additive blur at 0.50 alpha — it washed out completely
       against a bright pitch. Now a hard-edged ring: bright defined rim,
       darker contrast outline so it reads on any grass tone, plus a subtle
       inner fill and a leading arrow so you can see WHO you have and which
       way he faces at a glance. */
    const selCv=document.createElement('canvas'); selCv.width=selCv.height=256;
    (function(){ const g=selCv.getContext('2d');
      const C=128;
      // dark contrast ring first (keeps the bright ring legible on light grass)
      g.beginPath(); g.arc(C,C,104,0,7);
      g.lineWidth=22; g.strokeStyle='rgba(0,10,30,0.55)'; g.stroke();
      // soft inner pool so the player sits in a readable disc
      const gr=g.createRadialGradient(C,C,8,C,C,104);
      gr.addColorStop(0,'rgba(70,170,255,0.34)');
      gr.addColorStop(0.72,'rgba(70,170,255,0.16)');
      gr.addColorStop(1,'rgba(70,170,255,0.04)');
      g.fillStyle=gr; g.beginPath(); g.arc(C,C,104,0,7); g.fill();
      // the hard bright rim — this is what actually reads
      g.beginPath(); g.arc(C,C,104,0,7);
      g.lineWidth=13; g.strokeStyle='rgba(120,215,255,0.98)'; g.stroke();
      // inner highlight edge for a crisp double-line look
      g.beginPath(); g.arc(C,C,90,0,7);
      g.lineWidth=4; g.strokeStyle='rgba(235,250,255,0.85)'; g.stroke();
    })();
    const selTex=new T.Texture(selCv); selTex.needsUpdate=true;
    // NormalBlending (not additive) so the dark contrast ring survives — additive
    // blending erased the very outline that makes it visible on bright grass.
    const selMesh=new T.Mesh(new T.PlaneGeometry(1,1),
      new T.MeshBasicMaterial({map:selTex,transparent:true,depthWrite:false}));
    selMesh.rotation.x=-Math.PI/2; selMesh.renderOrder=2; selMesh.visible=false; scene.add(selMesh);
    function updateSelGlow(){
      try{
        if(typeof G==='undefined'||!G||typeof PP==='undefined'||cine){selMesh.visible=false;return;}
        let k=null;
        if(G.poss==='h')k=G.ck;
        else if(typeof ROLES!=='undefined'&&ROLES)k=ROLES.engager;
        const p=k&&PP.h?PP.h[k]:null;
        if(!p||(G.phase!=='moving'&&G.phase!=='idle')){selMesh.visible=false;return;}
        // 1.45x (was 0.85) — the marker now clearly frames the player, and a
        // slow pulse makes it findable in a crowded box.
        const pulse=1+Math.sin(performance.now()*0.004)*0.05;
        const s=PLEN*(P3D.spriteFrac!=null?P3D.spriteFrac:0.045)*1.45*pulse;
        selMesh.scale.set(s,s,1);
        selMesh.position.set(ex2wx(p.x),0.03,ey2wz(p.y));
        selMesh.visible=true;
      }catch(e){selMesh.visible=false;}
    }
    /* ════════ SAKUGA CHARGE FX — wind-up hold (v2, layered) ════════
       2D overlay: focus vignette, team-tinted converging speed lines,
       strobing lightning arcs off the shooter.  3D: white core + two
       flickering team-colour flame sprites, twin counter-rotating floor
       rings, pulsing floor pool, an additive glowing copy of the shooter's
       own sprite cell, rising embers, periodic ground shockwaves, and the
       charge glow on the ball. Everything scales with `chg` (0→1 over the
       hold) so the build-up reads before the kick. */
    let fxCv=null,fxCtx=null,_fxT=0,_fxLastCrackle=0,_fxLastRing=0;
    let auraCore=null,auraFlame=null,auraFlame2=null,auraRing1=null,auraRing2=null,auraFloor=null,auraSil=null,ballGlowSp=null;
    function fxGradTex(col){
      const c=document.createElement('canvas');c.width=c.height=128;
      const g=c.getContext('2d');
      const gr=g.createRadialGradient(64,64,4,64,64,62);
      gr.addColorStop(0,col+'ee');gr.addColorStop(0.45,col+'66');gr.addColorStop(1,col+'00');
      g.fillStyle=gr;g.beginPath();g.arc(64,64,62,0,7);g.fill();
      const t=new T.Texture(c);t.needsUpdate=true;return t;
    }
    function ensureHoldFx(){
      if(!fxCv){
        fxCv=document.createElement('canvas');fxCv.width=CV.width||1280;fxCv.height=CV.height||720;
        fxCv.id='cine-fx';
        fxCv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:40;';
        (CV.parentNode||document.body).appendChild(fxCv);
        fxCtx=fxCv.getContext('2d');
      }
      if(!auraCore){
        const spr=(tex,col,op)=>{ const s=new T.Sprite(new T.SpriteMaterial({map:tex,color:col,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false,fog:false})); s.visible=false; scene.add(s); return s; };
        auraCore=spr(fxGradTex('#ffffff'),'#fff6d5',0.4);
        auraFlame=spr(flameTex(),'#ffd24a',0.8);   auraFlame.center.set(0.5,0.1);
        auraFlame2=spr(flameTex(),'#ffffff',0.5);  auraFlame2.center.set(0.5,0.1);
        const flat=(tex,col,op)=>{ const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:tex,color:col,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
          m.rotation.x=-Math.PI/2; m.renderOrder=3; m.visible=false; scene.add(m); return m; };
        auraRing1=flat(ringTex(),'#ffd24a',0.9); auraRing2=flat(ringTex(),'#ffffff',0.6); auraFloor=flat(fxGradTex('#ffffff'),'#ffd24a',0.5);
        auraSil=new T.Sprite(new T.SpriteMaterial({transparent:true,opacity:0.4,blending:T.AdditiveBlending,depthWrite:false,fog:false,alphaTest:0.4}));
        auraSil.center.set(0.5,0); auraSil.visible=false; scene.add(auraSil);
        ballGlowSp=spr(fxGradTex('#fff3b0'),'#ffffff',0.9);
      }
      fxCv.style.display='block';
    }
    function hideHoldFx(){
      try{ applyFx(); }catch(e){}
      if(fxCv){fxCtx.clearRect(0,0,fxCv.width,fxCv.height);fxCv.style.display='none';}
      [auraCore,auraFlame,auraFlame2,auraRing1,auraRing2,auraFloor,auraSil,ballGlowSp].forEach(o=>{ if(o) o.visible=false; });
    }
    function drawHoldFx(c,dt){
      ensureHoldFx();
      if(bloomPass){ bloomPass.strength=P3D.fx.bloom*0.4; bloomPass.threshold=Math.max(P3D.fx.bloomThresh,0.93); }
      _fxT+=dt;
      const col=c.col||'#ffd24a';
      const W2=fxCv.width,H2=fxCv.height;
      const swx=ex2wx(c.fx),swz=ey2wz(c.fy);
      const hh=PLEN*(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
      const chg=Math.min(1,_fxT/2.0);                        // charge 0→1 across the hold
      const sp=projectToScreen(swx,hh*0.5,swz,W2,H2);
      const cc=new T.Color(col), cr=Math.round(cc.r*255), cgn=Math.round(cc.g*255), cb=Math.round(cc.b*255);
      const g=fxCtx;
      g.clearRect(0,0,W2,H2);
      // focus vignette — deepens as the charge builds
      const vg=g.createRadialGradient(sp.x,sp.y,H2*0.16,sp.x,sp.y,H2*0.9);
      vg.addColorStop(0,'rgba(0,0,20,0)');vg.addColorStop(1,'rgba(0,0,20,'+(0.35+0.35*chg).toFixed(2)+')');
      g.fillStyle=vg;g.fillRect(0,0,W2,H2);
      g.save();g.globalCompositeOperation='lighter';
      // converging speed lines, team-tinted at the rim → white at the core
      const N=18+Math.round(12*chg);
      for(let i=0;i<N;i++){
        const a=(i/N)*Math.PI*2+Math.sin(_fxT*3+i)*0.05;
        const R=Math.hypot(W2,H2)*0.62;
        const r1=R*(0.55+0.35*((i*2654435761>>>0)%100)/100);
        const r0=H2*(0.15+0.05*Math.sin(_fxT*9+i*1.7));
        const x1=sp.x+Math.cos(a)*r1,y1=sp.y+Math.sin(a)*r1;
        const x0=sp.x+Math.cos(a)*r0,y0=sp.y+Math.sin(a)*r0;
        const al=(0.05+0.11*Math.abs(Math.sin(_fxT*7+i*2.3)))*(0.5+0.5*chg);
        const lg=g.createLinearGradient(x1,y1,x0,y0);
        lg.addColorStop(0,'rgba('+cr+','+cgn+','+cb+',0)');lg.addColorStop(1,'rgba(255,248,225,'+al.toFixed(3)+')');
        g.strokeStyle=lg; g.lineWidth=1.0+((i%3===0)?1.4:0)+0.6*chg;
        g.beginPath();g.moveTo(x1,y1);g.lineTo(x0,y0);g.stroke();
      }
      // lightning arcs snapping off the shooter (strobe)
      const bolts=(Math.random()<(0.35+0.5*chg))?(1+Math.floor(Math.random()*3)):0;
      const bodyR=Math.max(24,Math.abs(projectToScreen(swx,hh,swz,W2,H2).y-projectToScreen(swx,0,swz,W2,H2).y));
      for(let b=0;b<bolts;b++){
        const a=Math.random()*Math.PI*2;
        const ox=sp.x+Math.cos(a)*bodyR*0.25, oy=sp.y+(Math.random()-0.5)*bodyR;
        const len=bodyR*(0.5+Math.random()*1.1), segs=5+Math.floor(Math.random()*5);
        const pts=[[ox,oy]];
        for(let s=1;s<=segs;s++){ const t=s/segs;
          pts.push([ox+Math.cos(a)*len*t+(Math.random()-0.5)*bodyR*0.45, oy+Math.sin(a)*len*t+(Math.random()-0.5)*bodyR*0.45]); }
        const draw=(w,st)=>{ g.strokeStyle=st; g.lineWidth=w; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]);
          for(let s=1;s<pts.length;s++) g.lineTo(pts[s][0],pts[s][1]); g.stroke(); };
        g.shadowColor='rgb('+cr+','+cgn+','+cb+')'; g.shadowBlur=10;
        draw(2.6,'rgba('+cr+','+cgn+','+cb+',0.8)'); g.shadowBlur=0; draw(1.1,'rgba(255,255,255,0.9)');
      }
      g.restore();
      // ── 3D layers ──
      const pu=1+0.12*Math.sin(_fxT*6), flick=0.9+Math.random()*0.25;
      const sh=sprites[c.o.as+':'+c.o.sk];
      const tint=new T.Color(col).lerp(new T.Color('#ffffff'),0.45);     // light team tint, never pure white
      auraCore.visible=true; auraCore.material.color.copy(tint); auraCore.position.set(swx,hh*0.42,swz);
      const cs=hh*(0.45+0.25*chg)*pu; auraCore.scale.set(cs,cs,1); auraCore.material.opacity=0.06+0.12*chg;
      auraFlame.visible=true; auraFlame.material.color.set(col); auraFlame.position.set(swx,0.1,swz);
      auraFlame.scale.set(hh*(0.95+0.35*chg)*flick, hh*(1.35+0.75*chg)*(0.95+0.1*Math.sin(_fxT*11)),1); auraFlame.material.opacity=0.10+0.16*chg;
      auraFlame2.visible=true; auraFlame2.material.color.copy(tint); auraFlame2.position.set(swx,0.1,swz);
      auraFlame2.scale.set(hh*(0.55+0.2*chg)*(2-flick), hh*(1.0+0.6*chg)*(0.95+0.1*Math.cos(_fxT*13)),1); auraFlame2.material.opacity=0.04+0.08*chg;
      const rs=hh*(1.3+0.6*chg);
      auraRing1.visible=true; auraRing1.material.color.set(col); auraRing1.material.opacity=0.55; auraRing1.position.set(swx,0.07,swz); auraRing1.scale.set(rs*pu,rs*pu,1); auraRing1.rotation.z+=dt*2.4;
      auraRing2.visible=true; auraRing2.material.opacity=0.3; auraRing2.position.set(swx,0.08,swz); auraRing2.scale.set(rs*0.68/pu,rs*0.68/pu,1); auraRing2.rotation.z-=dt*3.6;
      auraFloor.visible=true; auraFloor.material.color.set(col); auraFloor.position.set(swx,0.05,swz); auraFloor.scale.set(rs*1.1,rs*1.1,1);
      auraFloor.material.opacity=0.03+0.07*chg*Math.abs(Math.sin(_fxT*6));
      // glowing silhouette: the shooter's own current sheet cell, tinted + pulsing
      if(sh&&sh.sprite&&sh.sprite.visible){
        const map=sh.sprite.material.map;
        if(auraSil.material.map!==map){ auraSil.material.map=map; auraSil.material.needsUpdate=true; }
        auraSil.visible=true; auraSil.material.color.set(col);
        auraSil.center.copy(sh.sprite.center);
        auraSil.position.copy(sh.sprite.position); auraSil.position.y+=0.01;
        auraSil.scale.copy(sh.sprite.scale).multiplyScalar(1.0+0.03*Math.sin(_fxT*14));
        auraSil.material.opacity=0.08+0.18*chg*(0.6+0.4*Math.abs(Math.sin(_fxT*9)));
      }
      // charge glow on the ball
      const bw=(typeof ball!=='undefined'&&ball)?{x:ex2wx(ball.x),z:ey2wz(ball.y)}:{x:swx,z:swz};
      ballGlowSp.visible=true; ballGlowSp.material.color.set(col); ballGlowSp.position.set(bw.x,0.35,bw.z);
      const bs=hh*(0.25+0.3*chg)*(1+0.2*Math.sin(_fxT*10)); ballGlowSp.scale.set(bs,bs,1); ballGlowSp.material.opacity=0.2+0.25*chg;
      // rising embers
      const now=performance.now();
      if(now-_fxLastCrackle>(70-40*chg)){
        _fxLastCrackle=now;
        for(let i=0;i<2+Math.round(3*chg);i++){
          const a=Math.random()*Math.PI*2, rr=hh*(0.15+Math.random()*0.45);
          spawnPart(swx+Math.cos(a)*rr,0.1+Math.random()*0.3,swz+Math.sin(a)*rr,
                    (Math.random()-0.5)*0.8, 1.6+Math.random()*2.6+chg*1.5, (Math.random()-0.5)*0.8,
                    Math.random()<0.35?'#ffffff':col, hh*(0.05+Math.random()*0.09), 0.5+Math.random()*0.6, -0.6);
        }
      }
      // periodic ground shockwave — faster as the charge peaks
      if(now-_fxLastRing>(900-500*chg)){ _fxLastRing=now; spawnRing(swx,swz,col,hh*0.4,hh*(2.5+2*chg),0.6); }
    }
    /* ════════ CINEMATIC SPRITE ASSETS — PER TEAM, WITH FALLBACK ════════
       Both sides now run this cinematic (human □ and CPU), so the wind-up
       striker and the cinematic keeper must be able to wear the right kit.
       Each slot tries the team file first, then the shared default:

         wind-up striker   assets/ps1/{teamkey}_windup.png
                        →  assets/ps1/striker_windup.png
         cinematic GK      assets/ps1/{teamkey}_gk_cine.png     (3 cols x 2 rows)
                        →  assets/ps1/gk_cine.png
         GK dive sheet     assets/ps1/{teamkey}_gk_dive.png     (5 cols x 3 rows)
                        →  assets/ps1/gk_dive.png

       teamkey is the engine key, lower-case (japan, brazil, club07 …).
       The striker slot uses the ATTACKING team's key, both GK slots use the
       DEFENDING team's key. Missing files simply fall through — nothing to
       wire up, drop a PNG in and it is picked up on the next cinematic.
       Cutscene video for the skill banner is unchanged:
         assets/cutscene/{lastname}.webm | .mp4 | .png
         assets/cutscene/{teamkey}-shoot.webm | .mp4 | .png   (team fallback) */
    const DIVE={cols:5,rows:3};
    let cineWindupTex=null,cineWindupAR=0.65,cineGkTex=null,diveSheet=null;
    const _cineTexCache={}, _cineSheetCache={};
    function _cineTex(url,cb){
      if(_cineTexCache[url]!==undefined){cb(_cineTexCache[url]);return;}
      const im=new Image();
      im.onload=()=>{
        const t=new T.Texture(im);
        t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.needsUpdate=true;
        _cineTexCache[url]={tex:t,ar:(im.height?im.width/im.height:0.65)};
        cb(_cineTexCache[url]);
      };
      im.onerror=()=>{_cineTexCache[url]='none';cb('none');};
      im.src=url;
    }
    function _cineSheet(url,cb){
      if(_cineSheetCache[url]!==undefined){cb(_cineSheetCache[url]);return;}
      const im=new Image();
      im.onload=()=>{_cineSheetCache[url]={img:im,cw:im.width/DIVE.cols,ch:im.height/DIVE.rows};
                     cb(_cineSheetCache[url]);};
      im.onerror=()=>{_cineSheetCache[url]='none';cb('none');};
      im.src=url;
    }
    function _chain(urls,loader,cb){
      (function nxt(i){
        if(i>=urls.length){cb(null);return;}
        loader(urls[i],r=>{ (r&&r!=='none')?cb(r):nxt(i+1); });
      })(0);
    }
    function _keyChain(key,teamFile,defFile){
      const k=(key||'').toString().toLowerCase();
      return k?['assets/ps1/'+k+teamFile,'assets/ps1/'+defFile]:['assets/ps1/'+defFile];
    }
    // Called from start(): repoint the three slots at this fixture's teams.
    function cineLoadFor(asKey,dsKey){
      _chain(_keyChain(asKey,'_windup.png','striker_windup.png'),_cineTex,
        r=>{ if(r){cineWindupTex=r.tex;cineWindupAR=r.ar||0.65;} });
      _chain(_keyChain(dsKey,'_gk_cine.png','gk_cine.png'),_cineTex,
        r=>{ if(r)cineGkTex=r.tex; });
      _chain(_keyChain(dsKey,'_gk_dive.png','gk_dive.png'),_cineSheet,
        r=>{ diveSheet=r||'none'; });
    }
    cineLoadFor(null,null);   // warm the shared defaults at boot
    // trail pool — additive fading ghosts behind the ball
    const TRAIL=[];
    function spawnTrail(x,y,z,col,size){
      let t=TRAIL.find(t=>!t.alive);
      if(!t){
        const m=new T.SpriteMaterial({color:col,transparent:true,opacity:0.85,
          blending:T.AdditiveBlending,depthWrite:false});
        t={sp:new T.Sprite(m),alive:false,life:0};
        scene.add(t.sp); TRAIL.push(t);
      }
      t.alive=true; t.life=0.45; t.max=0.45;
      t.sp.material.color.set(col);
      t.sp.visible=true; t.sp.position.set(x,y,z); t.sp.scale.set(size,size,1); t.size=size;
    }
    function tickTrail(dt){
      TRAIL.forEach(t=>{ if(!t.alive)return;
        t.life-=dt; if(t.life<=0){t.alive=false;t.sp.visible=false;return;}
        const f=t.life/t.max;
        t.sp.material.opacity=0.85*f; const s=t.size*(0.4+0.6*f); t.sp.scale.set(s,s,1); });
    }
    function clearTrail(){ TRAIL.forEach(t=>{t.alive=false;t.sp.visible=false;}); }
    // force a sprite to an explicit sheet cell (used on shooter + GK)
    // layout-aware: pick a frame of an animation by index, or by 0..1 progress
    function forceAnim(id,face,anim,idx,flip){
      const o=sprites[id]; if(!o)return;
      const cc=cellOf(o._L||GRID,face,anim,idx); forceCell(id,cc.row,cc.col,flip);
    }
    function forceAnimT(id,face,anim,t,flip){
      const o=sprites[id]; if(!o)return;
      const rng=((o._L||GRID)[anim])||[0,1];
      forceAnim(id,face,anim,Math.round(Math.max(0,Math.min(1,t))*(rng[1]-1)),flip);
    }
    function forceCell(id,row,col,flip){
      const o=sprites[id]; if(!o)return;
      const _L=(o._L||GRID);
      const cw=1/_L.cols, ch=1/_L.rows;
      const ox=col*cw, oy=1-(row+1)*ch;
      if(flip){ o.tex.repeat.set(-cw,ch); o.tex.offset.set(ox+cw,oy); }
      else    { o.tex.repeat.set( cw,ch); o.tex.offset.set(ox,oy); }
      const an=o._anchor&&o._anchor[row*_L.cols+col];
      o.sprite.center.set(an?(flip?1-an.cx:an.cx):0.5, an?an.padB:0);
    }
    /* opts: {as, sk, ds, isGoal, color, onDone} — engine sides/keys */
    P3D.superCine=function(o){
      if(cine || !P3D.on || typeof PP==='undefined'){ o&&o.onDone&&o.onDone(); return; }
      const sp=PP[o.as]&&PP[o.as][o.sk], gp=PP[o.ds]&&PP[o.ds]['GK'];
      if(!sp||!gp){ o.onDone&&o.onDone(); return; }
      const W=(CV.width||1280);
      const _dir=(o.dir!=null)?o.dir:((o.as==='h')?1:-1);      // engine attack dir (halves swap!)
      const gx=(o.gx!=null)?o.gx:((_dir>0)?W*0.93:W*0.07);     // target goal-line x
      cine={t:0,o,dir:_dir,
        fx:sp.x, fy:sp.y,          // engine-space flight endpoints
        tx:gp.x, ty:gp.y,
        nx:gx,   ny:gp.y,          // net point (goal outcome)
        col:o.color||sideColor(o.as),
        gkRestore:null, diveDir:(Math.random()<0.5?1:2)};
      if(typeof ball!=='undefined'&&ball){ ball.x=sp.x; ball.y=sp.y; ball.bz=0; }
    };
    P3D.cineActive=function(){ return !!cine; };
    function cineEnd(){
      if(!cine)return;
      try{hideHoldFx();_fxT=0;}catch(e){}
      if(cine.v2)window.U11DBG&&U11DBG('[3D] cine v2 end');
      if(cine.shRestore){ const s2=cine.shRestore;
        if(s2.g&&s2.g.sprite){ s2.g.sprite.material.map=s2.map; s2.g.sprite.material.needsUpdate=true;
          if(s2.g.sil&&s2.silMap){ s2.g.sil.material.map=s2.silMap; s2.g.sil.material.needsUpdate=true; } } }
      const r=cine.gkRestore;
      if(r){ const og=sprites[cine.o.ds+':GK'];
        if(og){ og.sprite.material.map=r.map; og.tex=r.map; og.sil.material.map=r.map;
                r.map.needsUpdate=true; } }
      clearTrail();
      const cb=cine.o.onDone; cine=null;
      if(cb)cb();
    }
    /* ════════ SUPER-SHOT CINEMATIC v2 — behind-the-shooter flow ════════
       Phase-driven from game.js:
         start({as,sk,ds})       → camera settles behind the shooter (hold)
         fly(onArrive)           → kick anim + ball flight, camera chases ball
         (wait)                  → ball holds short of GK while duel menu runs
         finish({isGoal,onDone}) → ball into net / into GK hands, then end
         abort()                 → immediate teardown, no callback */
    P3D.superCine2={
      active(){ return !!(cine&&cine.v2); },
      start(o){
        if(cine||!P3D.on||typeof PP==='undefined'){window.U11DBG&&U11DBG('[3D] start blocked: '+(cine?'cine busy':'no PP'));return false;}
        const sp=PP[o.as]&&PP[o.as][o.sk], gp=PP[o.ds]&&PP[o.ds]['GK'];
        if(!sp||!gp){window.U11DBG&&U11DBG('[3D] start blocked: sp='+!!sp+' gp='+!!gp);return false;}
        const W=(CV.width||1280);
        const dir=(o.dir!=null)?o.dir:((o.as==='h')?1:-1);     // engine attack dir (halves swap!)
        const gx=(o.gx!=null)?o.gx:((dir>0)?W*0.93:W*0.07);
        const stopX=gp.x-dir*W*0.045;                 // hold point just short of the keeper
        try{
          // game.js declares selHome/selAway as top-level `let` — reachable by
          // bare name from a later script, NOT via window.*
          const _sh=(typeof selHome!=='undefined')?selHome:null;
          const _sa=(typeof selAway!=='undefined')?selAway:null;
          cineLoadFor(o.asKey!=null?o.asKey:(o.as==='h'?_sh:_sa),
                      o.dsKey!=null?o.dsKey:(o.ds==='h'?_sh:_sa));
        }catch(e){}
        cine={v2:true,mode:'hold',t:0,ft:0,ot:0,o,dir,arrived:false,gkRestore:null,
          fx:sp.x,fy:sp.y, tx:stopX,ty:gp.y, gx,gy:gp.y, kx:gp.x,ky:gp.y,
          col:o.color||sideColor(o.as)};
        try{
          const shooter=(typeof sq==='function'&&sq(o.as))?sq(o.as)[o.sk]:null;
          const st=shotStyleFor(shooter), pp=shotPerp(sp.x,sp.y,stopX,gp.y);
          Object.assign(cine,{style:st,perpX:pp.px,perpY:pp.py,curveAmt:W*0.05*st.curve,dur:1.6/st.speed});
          window.U11DBG&&U11DBG('[3D] super shot style: '+st.kind+' ('+(shooter?((shooter.origName||shooter.name)+' pwr'+shooter.pwr+' tec'+shooter.tec):'?')+')');
        }catch(e){}
        if(typeof ball!=='undefined'&&ball){ball.x=sp.x;ball.y=sp.y;ball.bz=0;}
        return true;
      },
      fly(onArrive){
        if(!(cine&&cine.v2&&cine.mode==='hold'))return;
        cine.mode='fly';cine.ft=0;cine.onArrive=onArrive;
        try{ kickBurst(cine); }catch(e){}
        try{ // kick burst flash (radial white), ~0.3s
          let b=document.getElementById('cine-burst');
          if(!b){ b=document.createElement('div'); b.id='cine-burst';
            b.style.cssText='position:fixed;inset:0;z-index:55;pointer-events:none;'
              +'background:radial-gradient(circle at 50% 55%, rgba(255,255,255,.95) 0%, rgba(255,240,180,.5) 22%, rgba(255,255,255,0) 60%);'
              +'opacity:0;';
            document.body.appendChild(b); }
          if(b.animate)b.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.35)'}],{duration:320,easing:'ease-out'});
        }catch(e){}
      },
      finish(o){
        if(!(cine&&cine.v2)){o&&o.onDone&&o.onDone();return;}
        cine.mode='out';cine.ot=0;cine.isGoal=!!o.isGoal;cine.o.onDone=o.onDone;
      },
      abort(){ if(cine&&cine.v2){cine.o.onDone=null;cineEnd();} }
    };
    function cineStep2(dt){
      const c=cine; if(!c)return;
      if(c._lm!==c.mode){c._lm=c.mode;window.U11DBG&&U11DBG('[3D] cine v2 mode='+c.mode+' (frames running)');}
      c.t+=dt;
      if(typeof G==='undefined'||!G||typeof PP==='undefined'||!PP[c.o.as]){cineEnd();return;}
      const sid=c.o.as+':'+c.o.sk;
      const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
      const d=PLEN*frac*0.21;
      let bx=c.fx,by=c.fy,bz=0;
      if(c.mode==='hold'){
        const g=sprites[sid];
        if(cineWindupTex&&g&&g.sprite){                // dedicated wind-up sprite
          if(!c.shRestore)c.shRestore={g,map:g.sprite.material.map,silMap:g.sil?g.sil.material.map:null};
          if(g.sprite.material.map!==cineWindupTex){
            cineWindupTex.repeat.set(1,1); cineWindupTex.offset.set(0,0);
            g.sprite.material.map=cineWindupTex; g.sprite.material.needsUpdate=true;
            if(g.sil){ g.sil.material.map=cineWindupTex; g.sil.material.needsUpdate=true; }
          }
          const hh=PLEN*frac;                          // override per-frame (syncPlayers resets scale)
          g.sprite.center.set(0.5,0);
          g.sprite.scale.set(hh*cineWindupAR,hh,1);
          if(g.sil)g.sil.scale.set(hh*cineWindupAR,hh,1);
        }
        else forceAnim(sid,'up','shoot',0,false);       // fallback: sheet wind-up, back view
        drawHoldFx(c,dt);                              // sakuga charge: lines/aura/glow
      }else if(c.mode==='fly'||c.mode==='wait'){
        if(!c._fxOff){c._fxOff=true;_fxT=0;hideHoldFx();}
        if(c.shRestore&&!c._shBack){                  // shooter back on his sheet for kick frames
          const r=c.shRestore;
          if(r.g&&r.g.sprite){ r.g.sprite.material.map=r.map; r.g.sprite.material.needsUpdate=true;
            if(r.g.sil&&r.silMap){ r.g.sil.material.map=r.silMap; r.g.sil.material.needsUpdate=true; } }
          c._shBack=true;
        }
        if(!gkCineCell(c,0,0))forceAnim(c.o.ds+':GK','down','idle',0,false); // keeper set, facing the ball
        cineGkNudge(c);                               // ...a step off his line
        const stl=c.style||{curve:0,loft:1,speed:1,kind:'normal'}, dur=c.dur||1.6;
        if(c.mode==='fly'){
          c.ft+=dt/dur;
          const kf=Math.min(3,Math.floor((c.ft*dur)/0.14));
          forceAnimT(sid,'up','shoot',kf/3,false);    // kick frames, back view
          if(c.ft>=1){
            c.ft=1;c.mode='wait';
            if(c.onArrive&&!c.arrived){c.arrived=true;const cb=c.onArrive;c.onArrive=null;setTimeout(cb,0);}
          }
        }
        const ft=Math.min(1,c.ft);
        const fe=ft*ft*(3-2*ft);
        bx=c.fx+(c.tx-c.fx)*fe; by=c.fy+(c.ty-c.fy)*fe;
        if(c.curveAmt){ const off=Math.sin(Math.PI*fe)*c.curveAmt; bx+=c.perpX*off; by+=c.perpY*off; }  // banana
        bz=(46*3.2*fe*(1-fe)*0.7+8*Math.sin(fe*Math.PI))*stl.loft;
        if(c.mode==='wait')bz=4+Math.sin(c.t*6)*0.8;  // hover short of the keeper
      }else if(c.mode==='out'){
        c.ot+=dt;
        const gt=Math.min(1,c.ot/0.55);
        if(c.isGoal){ bx=c.tx+(c.gx-c.tx)*gt; by=c.ty+(c.gy-c.ty)*gt; bz=Math.max(0,4*(1-gt)); }
        else{
          const W3=(CV.width||1280), d3=(c.dir!=null)?c.dir:1;
          const hx=c.kx-d3*W3*0.022;                 // the keeper's displayed (nudged) spot
          bx=c.tx+(hx-c.tx)*gt; by=c.ty+(c.ky-c.ty)*gt;
          bz=4*(1-gt)+3.4*gt;                        // settle into the gloves
        }
        if(!gkCineCell(c,c.isGoal?2:1,c.isGoal?0:1))
          forceAnimT(c.o.ds+':GK','down','shoot',Math.min(3,Math.floor(c.ot/0.18))/3,false);
        cineGkNudge(c);
        if(c.ot>=0.85&&!c._fired){                    // outcome shown — hand control to game.js,
          c._fired=true;                              // keep the frontal camera until it releases us
          const cb=c.o.onDone; c.o.onDone=null;
          if(cb)setTimeout(cb,0);
        }
        if(c.ot>=12){cineEnd();return;}               // failsafe
      }
      if(typeof ball!=='undefined'&&ball){ball.x=bx;ball.y=by;ball.bz=0;}
      const W2=(CV.width||1280);
      const bwx=ex2wx(Math.min(Math.max(bx,0.02*W2),0.98*W2)),bwz=ey2wz(by);
      const bwy=0.05+bz*0.09;
      ballMesh.scale.set(d,d,1); ballMesh.position.set(bwx,bwy,bwz);
      if(c.mode==='fly'&&c.style){
        if(c.style.kind==='curve') ballMesh.rotateOnWorldAxis(_AY,dt*26);                 // side-spin
        else if(c._pbw){ const ddx=bwx-c._pbw.x, ddz=bwz-c._pbw.z;                       // topspin along travel
          if(Math.hypot(ddx,ddz)>1e-4){ _bAxis.set(ddz,0,-ddx).normalize(); ballMesh.rotateOnWorldAxis(_bAxis,dt*(c.style.kind==='power'?40:22)); } }
      }
      c._pbw={x:bwx,z:bwz};
      try{ shotBallFx(c,bwx,bwy,bwz,d,(c.mode==='fly'||(c.mode==='out'&&c.isGoal)),c.mode==='wait'); }catch(e){}
      if(c.mode==='out'&&c.ot>=0.55&&!c._impact){ c._impact=true; try{ impactBurst(c,bwx,bwy,bwz,d); }catch(e){} }
      c._bw={x:bwx,y:bwy,z:bwz};
    }
    // Cinematic keeper uses its own dedicated sheet (assets/ps1/gk_cine.png, 3x2):
    //  top row: ready / lean / flying dive — bottom: low block / catch / sprawl.
    function gkCineCell(c,col,row){
      const g=sprites[c.o.ds+':GK']; if(!g||!g.sprite||!cineGkTex)return false;
      if(!c.gkRestore)c.gkRestore={map:g.sprite.material.map};
      if(g.sprite.material.map!==cineGkTex){
        g.sprite.material.map=cineGkTex; g.sprite.material.needsUpdate=true;
        if(g.sil){ g.sil.material.map=cineGkTex; g.sil.material.needsUpdate=true; }
      }
      cineGkTex.repeat.set(1/3,1/2);
      cineGkTex.offset.set(col/3,1-(row+1)/2);
      return true;
    }
    function cineGkNudge(c){
      const g=sprites[c.o.ds+':GK']; if(!g||!g.sprite)return;
      const W=(CV.width||1280);
      const d=(c.dir!=null)?c.dir:1;
      const nx=c.kx-d*W*0.02;                       // between his line and the ball
      const wx=ex2wx(nx), wz=ey2wz(c.ky);
      g.sprite.position.x=wx; g.sprite.position.z=wz;
      if(g.sil){ g.sil.position.x=wx; g.sil.position.z=wz; }
    }
    function cineCamera2(){
      const c=cine; if(!c)return;
      const swx=ex2wx(c.fx),swz=ey2wz(c.fy);
      const gwx=ex2wx(c.gx),gwz=ey2wz(c.gy);
      if(c.mode==='hold'){
        // Behind the shooter ALONG the shooter→goal line — goal centred ahead,
        // full body in the lower frame, slight over-the-shoulder offset.
        let dx=gwx-swx,dz=gwz-swz;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
        const CC=P3D.cine||{};
        const dv=(CC.holdDist||9.6)-Math.min(0.8,c.t*0.16);      // slow dolly-in
        const sd=(CC.holdSide!=null?CC.holdSide:1.1);
        camera.position.set(swx-dx*dv-dz*sd, (CC.holdHeight||1.55), swz-dz*dv+dx*sd);
        const la=Math.min(L*0.6,(CC.holdLookAhead||20));
        camera.lookAt(swx+dx*la, (CC.holdLookY||1.25), swz+dz*la);
      }else if(c.mode==='out'){
        // Outcome: FIXED frontal frame on the goal (goal + keeper + net), no motion.
        let dx=swx-gwx,dz=swz-gwz;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
        camera.position.set(gwx+dx*13,3.2,gwz+dz*13);
        camera.lookAt(gwx,1.1,gwz);
      }else{
        // Chase: behind the ball along the ball→goal line.
        const b=c._bw||{x:swx,y:0.5,z:swz};
        let dx=gwx-b.x,dz=gwz-b.z;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
        const CC=P3D.cine||{}, cd=(CC.chaseDist||7.5);
        camera.position.set(b.x-dx*cd,Math.max(0.5,b.y)+(CC.chaseHeight||2.4),b.z-dz*cd);
        camera.lookAt(gwx,(CC.chaseLookY||1.0),gwz);
      }
    }

    // timeline (s): 0–1.5 striker frontal + kick · 1.5 cut to GK ·
    // 1.35–2.6 flight · 2.6–3.6 outcome · 3.8 end
    function cineStep(dt){
      const c=cine; if(!c)return;
      c.t+=dt;
      if(typeof G==='undefined'||!G||typeof PP==='undefined'||!PP[c.o.as]){ cineEnd(); return; }
      const W=(CV.width||1280);
      const sid=c.o.as+':'+c.o.sk, gid=c.o.ds+':GK';
      // ── shooter: frontal action row, kick frames over phase A ──
      if(c.t<2.5){
        const kf=Math.min(3,Math.floor(Math.max(0,(c.t-1.55))/0.28));  // 0..3
        forceAnimT(sid,'down','shoot',kf/3,false);
      }
      // ── ball flight (engine coords + tall arc) — slowed for readability ──
      const T0=2.6, T1=4.9;
      if(c.t>=T0){
        const ft=Math.min(1,(c.t-T0)/(T1-T0));
        const fe=ft*ft*(3-2*ft);              // ease so the strike reads, not a blur
        let bx,by,bz;
        if(ft<1){ bx=c.fx+(c.tx-c.fx)*fe; by=c.fy+(c.ty-c.fy)*fe; bz=46*4*fe*(1-fe)*0.7+10*Math.sin(fe*Math.PI); }
        else if(c.o.isGoal){
          const gt=Math.min(1,(c.t-T1)/0.4);
          bx=c.tx+(c.nx-c.tx)*gt; by=c.ty+(c.ny-c.ty)*gt; bz=Math.max(0,7*(1-gt));
        } else { bx=c.tx; by=c.ty; bz=4; }
        if(typeof ball!=='undefined'&&ball){ ball.x=bx; ball.y=by; ball.bz=0; }
        const bwx=ex2wx(Math.min(Math.max(bx,0.02*W),0.98*W)), bwz=ey2wz(by);
        const bwy=0.05+bz*0.09;
        const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
        const d=PLEN*frac*0.21;
        ballMesh.scale.set(d,d,1); ballMesh.position.set(bwx,bwy,bwz);
        try{ shotBallFx(c,bwx,bwy,bwz,d,c.t<T1+0.4); }catch(e){}
      } else {
        ballMesh.position.set(ex2wx(c.fx),0.05,ey2wz(c.fy));
      }
      // ── keeper: face the play after the cut; dive/catch on arrival ──
      if(c.t>=2.55){
        const og=sprites[gid];
        if(og && diveSheet && diveSheet!=='none' && !c.gkRestore && c.t>=4.6){
          const tex=new T.Texture(diveSheet.img);
          tex.magFilter=T.NearestFilter; tex.minFilter=T.NearestFilter;
          tex.needsUpdate=true;
          c.gkRestore={map:og.sprite.material.map};
          og.sprite.material.map=tex; og.tex=tex; og.sil.material.map=tex;
        }
        if(c.gkRestore){
          const row=c.o.isGoal?c.diveDir:0;     // goal → dive & miss, save → catch
          const fr=Math.min(DIVE.cols-1,Math.floor(Math.max(0,(c.t-4.6))/0.16));
          const cw=1/DIVE.cols, ch=1/DIVE.rows;
          og.tex.repeat.set(cw,ch); og.tex.offset.set(fr*cw,1-(row+1)*ch);
        } else {
          if(c.t<4.6) forceAnim(gid,'down','pass',0,false); else forceAnimT(gid,'down','shoot',Math.min(3,Math.floor((c.t-4.6)/0.18))/3,false);
        }
      }
      if(c.t>=6.4) cineEnd();
    }
    function cineCamera(){
      const c=cine; if(!c)return;
      const swx=ex2wx(c.fx), swz=ey2wz(c.fy);
      const gwx=ex2wx(c.tx), gwz=ey2wz(c.ty);
      const dir=(c.dir!=null)?c.dir:((c.o.as==='h')?1:-1);   // engine attack dir (halves swap!)
      if(c.t<2.55){
        // PHASE A — frontal on the striker: goal-side, low, slow dolly-in.
        const dv=6.5-Math.min(2.5,c.t)*0.7;   // slow dolly-in
        camera.position.set(swx+dir*dv, 2.0, swz+2.2);
        camera.lookAt(swx, 1.5, swz);
      } else {
        // PHASE B/C — hard cut: field side of the keeper, ball incoming.
        camera.position.set(gwx-dir*8.5, 2.4, gwz+2.6);
        camera.lookAt(gwx, 1.3, gwz);
      }
    }

    /* ---- size sync to #C ---- */
    function resize(){
      const w=CV.clientWidth||CV.width, h=CV.clientHeight||CV.height;
      if(!w||!h) return;
      camera.aspect=w/h; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(w,h,false);
      if(typeof resizeComposer==='function') resizeComposer();
    }
    addEventListener('resize',resize);

    /* ---- render 3D on an INDEPENDENT rAF loop ----
       Do NOT depend on wrapping window.draw: other modules (ps1-mod, camlab)
       may re-wrap it after us, or the engine may call draw by a local name, in
       which case our wrapper would silently never run. A standalone loop that
       reads P3D.on each frame is immune to load order / draw ownership. */
    let lastTs=performance.now();
    let _lastW=0,_lastH=0;
    function _matchActive(){
      // cheap: the match screen carries .active only while a match is on-screen
      const el=document.getElementById('s-match');
      return !!(el && el.classList.contains('active'));
    }
    function loop3d(){
      requestAnimationFrame(loop3d);
      // Idle in menus: P3D.on is intentionally locked true, so without this the
      // full 5-pass composer would render 60fps behind every menu. Skip all
      // render work unless the match screen is actually showing.
      if(!P3D.on || !_matchActive()){
        if(gl.style.display!=='none'){ gl.style.display='none'; if(P3D.suppress2D)CV.style.visibility=''; }
        if(hudCv && hudCv.style.display!=='none') hudCv.style.display='none';
        return;
      }
      if(gl.style.display==='none'){ gl.style.display='block'; resize(); if(P3D.suppress2D)CV.style.visibility='hidden'; }
      // Auto-resize: fullscreen enter/exit changes canvas size — re-sync or it stays blurry.
      const _cw=CV.clientWidth,_ch=CV.clientHeight;
      if(_cw&&_ch&&(_cw!==_lastW||_ch!==_lastH)){ _lastW=_cw;_lastH=_ch;resize(); }
      const now=performance.now(); const dt=Math.min(0.05,(now-lastTs)/1000); lastTs=now;
      monitorQuality(now);
      syncSheets(); watchActions(); syncPlayers();
      updateSelGlow();
      if(cine){ try{ if(cine.v2){cineStep2(dt);cineCamera2();} else {cineStep(dt);cineCamera();} }catch(e){console.error('[P3D] cine error',e); cineEnd();} }
      else    { syncBall(); updateCamera(dt); }
      tickTrail(dt);
      try{ tickGfx(dt,now); }catch(e){}
      syncRef(dt);
      // anchor god rays at the sun's projected screen position
      if(rayPass){
        _v3.copy(sun.position).project(camera);
        rayPass.uniforms.lightPos.value.set(_v3.x*0.5+0.5, _v3.y*0.5+0.5);
        rayPass.enabled = (P3D.fx.rays>0.001) && (_v3.z<1) && !(cine&&cine.v2&&cine.mode==='hold');   // off when sun behind camera / during the charge hold
      }
      if(composer && P3D.fx && P3D.fx.on) composer.render(dt);
      else renderer.render(scene,camera);
      drawDebug(); drawHUD();
    }
    requestAnimationFrame(loop3d);

    /* ---- 2.5D toggle buttons removed — engine is always on ---- */

    /* ════════ POST-PROCESSING (HD-2D: bloom + tilt-shift + vignette) ════════
       Uses stock three.js r128 example passes loaded in index.html. If any are
       missing (scripts blocked/offline) we silently fall back to direct render —
       no black screen. */
    let composer=null, bloomPass=null, hTilt=null, vTilt=null, vignettePass=null, rayPass=null, gradePass=null;
    // HD-2D color grade — saturation, contrast, lift, and warm-highlight /
    // cool-shadow split-toning (the Octopath signature look).
    const GradeShader={
      uniforms:{ tDiffuse:{value:null}, sat:{value:1.0}, contrast:{value:1.0},
                 lift:{value:0.0}, split:{value:0.0},
                 shadowTint:{value:new T.Color(0.88,0.94,1.10)},
                 highTint:{value:new T.Color(1.10,1.00,0.86)} },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:[
        'varying vec2 vUv; uniform sampler2D tDiffuse;',
        'uniform float sat, contrast, lift, split; uniform vec3 shadowTint, highTint;',
        'void main(){',
        '  vec3 c=texture2D(tDiffuse,vUv).rgb;',
        '  float l=dot(c,vec3(0.299,0.587,0.114));',
        '  c=mix(vec3(l),c,sat);',
        '  c=(c-0.5)*contrast+0.5+lift;',
        '  float w=smoothstep(0.30,0.75,l);',
        '  vec3 tint=mix(shadowTint,highTint,w);',
        '  c=mix(c,c*tint,split);',
        '  gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);',
        '}'
      ].join('\n')
    };
    // Screen-space radial light-scatter (god rays) — samples toward the sun's
    // projected screen position and accumulates a warm streaked glow. Tested GLSL.
    const GodRayShader={
      uniforms:{ tDiffuse:{value:null}, lightPos:{value:new T.Vector2(0.5,0.85)},
                 exposure:{value:0.25}, decay:{value:0.95}, density:{value:0.6},
                 weight:{value:0.4}, samples:{value:60}, tint:{value:new T.Color(1.0,0.86,0.6)} },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:[
        'varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 lightPos;',
        'uniform float exposure, decay, density, weight; uniform int samples; uniform vec3 tint;',
        'void main(){',
        '  vec2 uv=vUv; vec4 base=texture2D(tDiffuse,uv);',
        '  vec2 delta=(uv-lightPos)*(density/float(samples));',
        '  vec2 coord=uv; float illum=1.0; vec3 ray=vec3(0.0);',
        '  for(int i=0;i<200;i++){ if(i>=samples)break; coord-=delta;',
        '    vec3 s=texture2D(tDiffuse,coord).rgb; float lum=max(s.r,max(s.g,s.b));',
        '    s*=smoothstep(0.55,1.0,lum);',           // only bright pixels streak (sun/sky)
        '    s*=illum*weight; illum*=decay; ray+=s; }',
        '  gl_FragColor=base+vec4(ray*exposure*tint,1.0);',
        '}'
      ].join('\n')
    };
    function buildComposer(){
      if(!(T.EffectComposer && T.RenderPass && T.ShaderPass && T.UnrealBloomPass)){
        console.warn('[P3D] post-processing scripts not found — running without FX');
        return false;
      }
      composer=new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene,camera));
      bloomPass=new T.UnrealBloomPass(new T.Vector2(1,1),
        P3D.fx.bloom, P3D.fx.bloomRadius, P3D.fx.bloomThresh);
      composer.addPass(bloomPass);
      rayPass=new T.ShaderPass(GodRayShader);     // god rays after bloom, before tilt/grade
      composer.addPass(rayPass);
      if(T.HorizontalTiltShiftShader && T.VerticalTiltShiftShader){
        hTilt=new T.ShaderPass(T.HorizontalTiltShiftShader);
        vTilt=new T.ShaderPass(T.VerticalTiltShiftShader);
        hTilt.uniforms.r.value=0.5; vTilt.uniforms.r.value=0.5;   // sharp band at vertical centre
        composer.addPass(hTilt); composer.addPass(vTilt);
      }
      gradePass=new T.ShaderPass(GradeShader);    // grade after DOF, before vignette
      composer.addPass(gradePass);
      if(T.VignetteShader){
        vignettePass=new T.ShaderPass(T.VignetteShader);
        composer.addPass(vignettePass);
      }
      const ps=composer.passes; ps[ps.length-1].renderToScreen=true;
      resizeComposer(); applyFx();
      console.log('[P3D] post-processing ready (bloom + tilt-shift + vignette)');
      return true;
    }
    function resizeComposer(){
      if(!composer) return;
      const w=CV.clientWidth||CV.width, h=CV.clientHeight||CV.height; if(!w||!h) return;
      composer.setPixelRatio(Math.min(devicePixelRatio,2));
      composer.setSize(w,h);
      if(bloomPass) bloomPass.setSize(w,h);
    }
    /* ════════ ADAPTIVE QUALITY ════════
       Three tiers change two things: renderer pixel ratio, and how many
       post passes run. In 'auto' we sample frame time and step down when
       we're slow, back up when we have headroom — with hysteresis so it
       never oscillates. Manual tiers (?q=) pin it and skip the monitor. */
    const QTIERS={
      high:{ dpr:Math.min(devicePixelRatio,2), fx:true,  rays:true,  grade:true  },
      med :{ dpr:Math.min(devicePixelRatio,1.5), fx:true,  rays:false, grade:true  },
      low :{ dpr:1,                              fx:false, rays:false, grade:false }
    };
    let _curTier=null;
    function applyTier(name){
      const t=QTIERS[name]||QTIERS.high; if(name===_curTier) return;
      _curTier=name; P3D._tier=name;
      try{
        renderer.setPixelRatio(t.dpr);
        if(composer){ composer.setPixelRatio(t.dpr); composer.setSize(CV.clientWidth||CV.width, CV.clientHeight||CV.height); }
        // rays + grade are the heaviest passes — toggle them per tier
        if(rayPass)   rayPass.enabled   = t.rays  && (P3D.fx.rays>0.001);
        if(gradePass) gradePass.enabled = t.grade;
        P3D.fx.on = t.fx;   // low tier drops the whole composer (see loop3d)
        if(typeof resize==='function') resize();
      }catch(e){ console.warn('[P3D] applyTier failed',e); }
    }
    // frame-time monitor (auto mode only)
    let _fpsAcc=0,_fpsN=0,_fpsCheck=0,_downAt=0,_fpsLast=0;
    function monitorQuality(now){
      if(P3D.quality!=='auto'){ applyTier(P3D.quality); return; }
      if(!_fpsLast){ _fpsLast=now; return; }
      const fdt=now-_fpsLast; _fpsLast=now;
      if(fdt>0){ _fpsAcc+=1000/fdt; _fpsN++; }
      if(now-_fpsCheck>800){                 // evaluate ~1x/sec
        const fps=_fpsN? _fpsAcc/_fpsN : 60;
        _fpsAcc=0;_fpsN=0;_fpsCheck=now;
        const order=['low','med','high'], i=order.indexOf(_curTier||'high');
        if(fps<48 && i>0){ applyTier(order[i-1]); _downAt=now; }        // struggling → drop
        else if(fps>58 && i<2 && now-_downAt>4000){ applyTier(order[i+1]); } // headroom → recover
      }
    }
    P3D._applyTier=applyTier;

    function applyFx(){
    
      if(!composer) return;
      if(bloomPass){ bloomPass.strength=P3D.fx.bloom; bloomPass.radius=P3D.fx.bloomRadius; bloomPass.threshold=P3D.fx.bloomThresh; }
      if(hTilt&&vTilt){ const b=P3D.fx.tilt*0.0035; hTilt.uniforms.h.value=b; vTilt.uniforms.v.value=b; }
      if(vignettePass){ vignettePass.uniforms.offset.value=1.0; vignettePass.uniforms.darkness.value=1.0+P3D.fx.vignette*0.9; }
      if(gradePass){ const g=gradePass.uniforms;
        g.sat.value=P3D.fx.sat; g.contrast.value=P3D.fx.contrast;
        g.lift.value=P3D.fx.lift; g.split.value=P3D.fx.split;
        gradePass.enabled=(Math.abs(P3D.fx.sat-1)>0.001||Math.abs(P3D.fx.contrast-1)>0.001||
                           Math.abs(P3D.fx.lift)>0.001||P3D.fx.split>0.001); }
      if(rayPass){ const u=rayPass.uniforms;
        u.exposure.value=P3D.fx.rays*0.45; u.decay.value=P3D.fx.rayDecay;
        u.samples.value=Math.max(8,Math.min(200,Math.round(P3D.fx.raySamples)));
        u.weight.value=0.45; u.density.value=0.7;
        u.tint.value.copy(warmColor(P3D.light.warmth)); }
    }
    P3D._applyFx=applyFx;
    buildComposer();

    applyLight();      // set initial sun / ambient / fog / pitch glow
    resize();
    applyTier(P3D.quality==='auto'?'high':P3D.quality);   // start high, auto steps down if needed
    P3D.ready=true;
    console.log('[P3D] 2.5D renderer ready — toggle via the 2.5D button or window.P3D.on=true');
  }

  boot();
})();
