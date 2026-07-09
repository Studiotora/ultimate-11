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
    spriteScale:1.9,     // (legacy) billboard height vs engine token radius CR
    spriteFrac:0.045,    // billboard height as fraction of world pitch LENGTH (HD-2D)
    // ---- LIGHTING / SHADOWS (Camera Lab → LIGHTING) ----
    light:{ azim:3.14,    // sun NORTH → shadows cast SOUTH (+Z). Sun angle slider rotates this.
            elev:0.78,    // sun height 0..1 (lower = longer shadows, lower glow)
            key:1.35,     // directional key-light intensity (models the bowl)
            ambient:0.55, // hemisphere ambient intensity
            warmth:0.55,  // 0 cool → 1 warm (tints fog, key light, glow)
            shadow:0.40,  // player shadow opacity
            shadowLen:1.0,// player shadow stretch (with elev)
            glow:0.45 },  // warm sun-pool intensity on the pitch (0 = off)
    // ---- POST-PROCESSING (Camera Lab → POST FX); needs the post scripts in index.html ----
    fx:{ on:true, bloom:0.55, bloomRadius:0.5, bloomThresh:0.82, tilt:0.45, vignette:0.5,
         rays:0.55, rayDecay:0.95, raySamples:60,
         sat:1.0, contrast:1.0, lift:0.0, split:0.0 },   // grade: saturation/contrast/lift + warm-cool split-tone
    debug:false,         // sprite/shadow debug overlay (Camera Lab)
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
        console.log('[P3D] restored saved camera settings');
      }
    }catch(e){}
    P3D.saveCam=function(){
      try{
        localStorage.setItem('ue_p3d_cam', JSON.stringify(
          {cam:P3D.cam, bowl:P3D.bowl, light:P3D.light, fx:P3D.fx, spriteFrac:P3D.spriteFrac}));
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
    function buildApron(){
      if(apronMesh) scene.remove(apronMesh);
      const aL=PLEN*2.4, aW=PWID*2.4;
      apronMesh=new T.Mesh(new T.PlaneGeometry(aL,aW),
        new T.MeshBasicMaterial({color:0x4c8c3f}));
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
      return new T.MeshBasicMaterial({map:m, color:0xffffff, side:T.DoubleSide});
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

      let yB=(S.yOff||0)*U, ihl=baseHL, ihw=baseHW, prevTop=null;
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
    P3D.setTeamFlags=function(d){ flagData=d; placeFlags(); };
    // deterministic pseudo-random per match so flags scatter but don't jitter
    function _rng(seed){ return ()=>{ seed=(seed*9301+49297)%233280; return seed/233280; }; }
    function placeFlags(){
      scene.remove(flagGroup); flagGroup=new T.Group(); scene.add(flagGroup);
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
      function scatter(tex,homeSide,rng){
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

    /* ---- initial pitch + stadium build (safe here: all bowl consts above are
       now initialized, so placeAllStadium won't hit a temporal dead zone).
       Default = assets/stadium/pitch.png. Set window.DEBUG_PITCH3D=true for the
       procedural debug pitch with engine coordinate ticks. ---- */
    if(window.DEBUG_PITCH3D===true){
      buildPitch(makeDebugPitchTex(), 1.56);
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
      const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,alphaTest:0.5}));
      sp.center.set(0.5,0); scene.add(sp);
      // soft round CONTACT shadow under the feet
      const sh=new T.Mesh(new T.PlaneGeometry(1,1),
        new T.MeshBasicMaterial({map:SHADOW_TEX,transparent:true,opacity:P3D.light.shadow,depthWrite:false}));
      sh.rotation.x=-Math.PI/2; sh.position.y=0.04; sh.renderOrder=2; scene.add(sh);
      // SILHOUETTE cast shadow — same sprite texture, tinted black, laid flat &
      // stretched away from the sun (real shape, since the sprite is transparent).
      const sil=new T.Mesh(new T.PlaneGeometry(1,1),
        new T.MeshBasicMaterial({map:tex,color:0x000000,transparent:true,alphaTest:0.5,
                                 opacity:P3D.light.shadow,depthWrite:false}));
      sil.renderOrder=2; scene.add(sil);
      return sprites[id]={sprite:sp,shadow:sh,sil,tex};
    }
    function cellState(id,p,wx,wz){
      const now=performance.now();
      const prev=stt[id]||{rx:p.x,ry:p.y,face:'side',flip:false,moveT:-1e9};
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
      stt[id]={rx,ry,face,flip,moveT};
      const band=ROW[face]||ROW.side;
      // one-shot pass/shoot animation override (action band, same facing) —
      // same mechanism as ps1-mod's PS1_action, ported to the 3D billboards.
      const act=ACT[id];
      if(act){
        const rng=COL[act.name], dur=act.name==='shoot'?480:360, el=now-act.t0;
        if(el<dur){ const fi=Math.min(rng[1]-1, Math.floor(el/dur*rng[1]));
          return {row:band.act, col:rng[0]+fi, flip}; }
        delete ACT[id];
      }
      const running=(now-moveT)<220;
      let col=COL.idle;
      if(running){ const R=COL.run; col=R[0]+(Math.floor(now/1000*11)%R[1]); }
      return {row:band.run, col, flip};
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
          const o=ensureSprite(id,sheet);
          // sprite height = fixed fraction of world pitch LENGTH (HD-2D scale).
          // P3D.spriteFrac defaults to ~0.045 of PLEN — tune in Camera Lab.
          const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
          const hWorld=PLEN*frac;
          const wWorld=hWorld*(sheet.cw/sheet.ch);
          // keep feet on the pitch: clamp x to the goal lines (GK sits at ~0.05 in
          // the engine, which would render BEHIND the goal line) and y to sidelines.
          const W=(CV.width||1280), H=(CV.height||720);
          const cx=Math.min(Math.max(p.x,0.07*W),0.93*W);
          const cy=Math.min(Math.max(p.y,0.01*H),0.99*H);
          const wx=ex2wx(cx), wz=ey2wz(cy);
          const st=cellState(id,p,wx,wz);
          // Mirror via UV, not scale: THREE.Sprite ignores negative scale.x.
          // flip → repeat.x negative + offset shifted one cell to the right edge.
          const cw=1/GRID.cols, ch=1/GRID.rows;
          const ox=st.col*cw, oy=1-(st.row+1)*ch;
          if(st.flip){ o.tex.repeat.set(-cw,ch); o.tex.offset.set(ox+cw,oy); }
          else       { o.tex.repeat.set( cw,ch); o.tex.offset.set(ox,   oy); }
          o.sprite.scale.set(wWorld, hWorld, 1);
          o.sprite.position.set(wx,0.05,wz);
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
          o.sil.position.set(wx+cdx*projLen*0.5, 0.045, wz+cdz*projLen*0.5);
          o.sil.scale.set(wWorld, projLen, 1);
          _qF.setFromAxisAngle(_AX,-Math.PI/2); _qS.setFromAxisAngle(_AY,az);
          o.sil.quaternion.copy(_qS).multiply(_qF);
          o.sil.material.opacity=Lt.shadow*0.8;
          // mockup detail: soft dust puff behind ANY sprinting player.
          const st2=stt[id];
          if(st2 && (performance.now()-st2.moveT)<70){
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
      ctx.save(); ctx.globalAlpha=.9;
      ctx.fillStyle='rgba(4,10,6,.6)'; ctx.fillRect(rx,ry,rw,rh);
      ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.5; ctx.strokeRect(rx,ry,rw,rh);
      ctx.beginPath(); ctx.moveTo(rx+rw/2,ry); ctx.lineTo(rx+rw/2,ry+rh); ctx.stroke();
      ctx.beginPath(); ctx.arc(rx+rw/2,ry+rh/2,rw*0.06,0,7); ctx.stroke();
      const W=(CV.width||1280), H=(CV.height||720);
      const rpx=x=>rx+(x/W)*rw, rpy=y=>ry+(y/H)*rh;
      const poss=(typeof G!=='undefined'&&G)?G.poss:'h', ck=(typeof G!=='undefined'&&G)?G.ck:null;
      ['h','a'].forEach(s=>{ const col=s==='h'?'#4ea0ff':'#ff5050';
        Object.keys(PP[s]||{}).forEach(k=>{ const p=PP[s][k]; if(!p) return;
          if(s===poss&&k===ck) return;
          ctx.beginPath(); ctx.arc(rpx(p.x),rpy(p.y),2.4,0,7); ctx.fillStyle=col; ctx.fill(); }); });
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
    // ⚽ emoji ball — flat billboard rendered from a canvas, anchored at the
    // ground point so it sits at the player's feet (no float, no oversize).
    const ballCv=document.createElement('canvas'); ballCv.width=ballCv.height=128;
    const bcx=ballCv.getContext('2d');
    bcx.clearRect(0,0,128,128); bcx.font='104px serif';
    bcx.textAlign='center'; bcx.textBaseline='middle';
    bcx.fillText('⚽',64,70);
    const ballTex=new T.Texture(ballCv); ballTex.needsUpdate=true;
    ballTex.minFilter=T.LinearFilter; ballTex.magFilter=T.LinearFilter;
    const ballMesh=new T.Sprite(new T.SpriteMaterial({map:ballTex,transparent:true,alphaTest:0.2}));
    ballMesh.center.set(0.5,0);              // bottom-anchored at the ground point
    scene.add(ballMesh);
    function syncBall(){
      if(cine) return;   // cinematic drives the ball directly
      if(typeof ball==='undefined'||!ball) return;
      const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
      const d=PLEN*frac*0.21;                // ball ~0.21 of player sprite height
      ballMesh.scale.set(d,d,1);
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
      const bwy=0.05+((ball.bz||0)*0.09);
      ballMesh.position.set(ex2wx(bx),bwy,ey2wz(by));
      // shot energy trail (3D replacement for the 2D _shotTrail glow)
      if(typeof G!=='undefined'&&G&&G._shotTrail){
        spawnTrail(ex2wx(bx),bwy+d*0.5,ey2wz(by),'#ffb040',d*1.5);
      }
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
    let cineWindupTex=null,cineWindupAR=0.65,cineGkTex=null;
    (function(){
      const a=new Image();
      a.onload=()=>{const t=new T.Texture(a);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.needsUpdate=true;cineWindupTex=t;cineWindupAR=a.width/a.height;};
      a.src='assets/ps1/striker_windup.png';
      const b=new Image();
      b.onload=()=>{const t=new T.Texture(b);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.needsUpdate=true;cineGkTex=t;};
      b.src='assets/ps1/gk_cine.png';
    })();
    const DIVE={cols:5,rows:3};
    let diveSheet=null;
    (function(){ const im=new Image();
      im.onload=()=>diveSheet={img:im,cw:im.width/DIVE.cols,ch:im.height/DIVE.rows};
      im.onerror=()=>diveSheet='none';
      im.src='assets/ps1/gk_dive.png'; })();
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
    function forceCell(id,row,col,flip){
      const o=sprites[id]; if(!o)return;
      const cw=1/GRID.cols, ch=1/GRID.rows;
      const ox=col*cw, oy=1-(row+1)*ch;
      if(flip){ o.tex.repeat.set(-cw,ch); o.tex.offset.set(ox+cw,oy); }
      else    { o.tex.repeat.set( cw,ch); o.tex.offset.set(ox,oy); }
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
        col:o.color||'#ffd24a',
        gkRestore:null, diveDir:(Math.random()<0.5?1:2)};
      if(typeof ball!=='undefined'&&ball){ ball.x=sp.x; ball.y=sp.y; ball.bz=0; }
    };
    P3D.cineActive=function(){ return !!cine; };
    function cineEnd(){
      if(!cine)return;
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
        cine={v2:true,mode:'hold',t:0,ft:0,ot:0,o,dir,arrived:false,gkRestore:null,
          fx:sp.x,fy:sp.y, tx:stopX,ty:gp.y, gx,gy:gp.y, kx:gp.x,ky:gp.y,
          col:o.color||'#ffd24a'};
        if(typeof ball!=='undefined'&&ball){ball.x=sp.x;ball.y=sp.y;ball.bz=0;}
        return true;
      },
      fly(onArrive){ if(cine&&cine.v2&&cine.mode==='hold'){cine.mode='fly';cine.ft=0;cine.onArrive=onArrive;} },
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
          g.sprite.scale.set(hh*cineWindupAR,hh,1);
          if(g.sil)g.sil.scale.set(hh*cineWindupAR,hh,1);
        }
        else forceCell(sid,ROW.up.act,3,false);        // fallback: sheet wind-up, back view
      }else if(c.mode==='fly'||c.mode==='wait'){
        if(c.shRestore&&!c._shBack){                  // shooter back on his sheet for kick frames
          const r=c.shRestore;
          if(r.g&&r.g.sprite){ r.g.sprite.material.map=r.map; r.g.sprite.material.needsUpdate=true;
            if(r.g.sil&&r.silMap){ r.g.sil.material.map=r.silMap; r.g.sil.material.needsUpdate=true; } }
          c._shBack=true;
        }
        if(!gkCineCell(c,0,0))forceCell(c.o.ds+':GK',ROW.down.run,0,false); // keeper set, facing the ball
        cineGkNudge(c);                               // ...a step off his line
        if(c.mode==='fly'){
          c.ft+=dt/1.6;
          const kf=Math.min(3,Math.floor((c.ft*1.6)/0.14));
          forceCell(sid,ROW.up.act,3+kf,false);       // kick frames, back view
          if(c.ft>=1){
            c.ft=1;c.mode='wait';
            if(c.onArrive&&!c.arrived){c.arrived=true;const cb=c.onArrive;c.onArrive=null;setTimeout(cb,0);}
          }
        }
        const ft=Math.min(1,c.ft);
        const fe=ft*ft*(3-2*ft);
        bx=c.fx+(c.tx-c.fx)*fe; by=c.fy+(c.ty-c.fy)*fe;
        bz=46*3.2*fe*(1-fe)*0.7+8*Math.sin(fe*Math.PI);
        if(c.mode==='wait')bz=4+Math.sin(c.t*6)*0.8;  // hover short of the keeper
      }else if(c.mode==='out'){
        c.ot+=dt;
        const gt=Math.min(1,c.ot/0.55);
        if(c.isGoal){ bx=c.tx+(c.gx-c.tx)*gt; by=c.ty+(c.gy-c.ty)*gt; bz=Math.max(0,4*(1-gt)); }
        else        { bx=c.tx+(c.kx-c.tx)*gt; by=c.ty+(c.ky-c.ty)*gt; bz=4+6*gt; }
        if(!gkCineCell(c,c.isGoal?2:1,c.isGoal?0:1))
          forceCell(c.o.ds+':GK',ROW.down.act,Math.min(6,3+Math.floor(c.ot/0.18)),false);
        cineGkNudge(c);
        if(c.ot>=0.85){cineEnd();return;}
      }
      if(typeof ball!=='undefined'&&ball){ball.x=bx;ball.y=by;ball.bz=0;}
      const W2=(CV.width||1280);
      const bwx=ex2wx(Math.min(Math.max(bx,0.02*W2),0.98*W2)),bwz=ey2wz(by);
      const bwy=0.05+bz*0.09;
      ballMesh.scale.set(d,d,1); ballMesh.position.set(bwx,bwy,bwz);
      if(c.mode==='fly'||(c.mode==='out'&&c.isGoal))spawnTrail(bwx,bwy+d*0.5,bwz,c.col,d*1.8);
      c._bw={x:bwx,y:bwy,z:bwz};
    }
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
        const dv=6.8-Math.min(0.8,c.t*0.16);      // slow dolly-in
        camera.position.set(swx-dx*dv-dz*0.9, 2.4, swz-dz*dv+dx*0.9);
        camera.lookAt(swx+dx*Math.min(L*0.55,14), 1.15, swz+dz*Math.min(L*0.55,14));
      }else{
        // Chase: behind the ball along the ball→goal line.
        const b=c._bw||{x:swx,y:0.5,z:swz};
        let dx=gwx-b.x,dz=gwz-b.z;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
        camera.position.set(b.x-dx*5.2,b.y+2.0,b.z-dz*5.2);
        camera.lookAt(gwx,1.0,gwz);
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
        forceCell(sid, ROW.down.act, 3+kf, false);
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
        if(c.t<T1+0.4) spawnTrail(bwx,bwy+d*0.5,bwz,c.col,d*1.8);
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
          forceCell(gid, ROW.down.act, c.t<4.6?0:3+Math.min(3,Math.floor((c.t-4.6)/0.18)), false);
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
    function loop3d(){
      requestAnimationFrame(loop3d);
      if(!P3D.on){
        if(gl.style.display!=='none'){ gl.style.display='none'; if(P3D.suppress2D)CV.style.visibility=''; }
        if(hudCv && hudCv.style.display!=='none') hudCv.style.display='none';
        return;
      }
      if(gl.style.display==='none'){ gl.style.display='block'; resize(); if(P3D.suppress2D)CV.style.visibility='hidden'; }
      // Auto-resize: fullscreen enter/exit changes canvas size — re-sync or it stays blurry.
      const _cw=CV.clientWidth,_ch=CV.clientHeight;
      if(_cw&&_ch&&(_cw!==_lastW||_ch!==_lastH)){ _lastW=_cw;_lastH=_ch;resize(); }
      const now=performance.now(); const dt=Math.min(0.05,(now-lastTs)/1000); lastTs=now;
      syncSheets(); watchActions(); syncPlayers();
      if(cine){ try{ if(cine.v2){cineStep2(dt);cineCamera2();} else {cineStep(dt);cineCamera();} }catch(e){console.error('[P3D] cine error',e); cineEnd();} }
      else    { syncBall(); updateCamera(dt); }
      tickTrail(dt);
      syncRef(dt);
      // anchor god rays at the sun's projected screen position
      if(rayPass){
        _v3.copy(sun.position).project(camera);
        rayPass.uniforms.lightPos.value.set(_v3.x*0.5+0.5, _v3.y*0.5+0.5);
        rayPass.enabled = (P3D.fx.rays>0.001) && (_v3.z<1);   // off when sun behind camera
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
    P3D.ready=true;
    console.log('[P3D] 2.5D renderer ready — toggle via the 2.5D button or window.P3D.on=true');
  }

  boot();
})();
