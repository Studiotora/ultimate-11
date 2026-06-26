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
    light:{ azim:0.70,    // sun direction in the XZ plane (also shadow cast dir + glow pos)
            elev:0.78,    // sun height 0..1 (lower = longer shadows, lower glow)
            key:1.35,     // directional key-light intensity (models the bowl)
            ambient:0.55, // hemisphere ambient intensity
            warmth:0.55,  // 0 cool → 1 warm (tints fog, key light, glow)
            shadow:0.40,  // player shadow opacity
            shadowLen:1.0,// player shadow stretch (with elev)
            glow:0.45 },  // warm sun-pool intensity on the pitch (0 = off)
    // ---- POST-PROCESSING (Camera Lab → POST FX); needs the post scripts in index.html ----
    fx:{ on:true, bloom:0.55, bloomRadius:0.5, bloomThresh:0.82, tilt:0.45, vignette:0.5 },
    debug:false,         // sprite/shadow debug overlay (Camera Lab)
    ready:true
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
      sun.position.set(-Math.sin(az)*horiz*120, vert*120+20, -Math.cos(az)*horiz*120);
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
      const postMat=new T.MeshBasicMaterial({color:0xffffff});
      const netMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.18,side:T.DoubleSide});
      const HW=PWID*0.052;         // half goal-mouth (~7.3m of 68m)
      const GH=PWID*0.030;         // crossbar height (~2.4m)
      const DEP=PWID*0.026;        // net depth (outward, off pitch)
      const r=PWID*0.0016;         // post radius
      [-1,1].forEach(side=>{
        const gx=side*(PLEN/2);    // goal-line
        const bx=gx + side*DEP;    // net back, OUTWARD off the pitch
        const g=new T.Group();
        // two front uprights
        [-HW,HW].forEach(z=>{
          const p=new T.Mesh(new T.CylinderGeometry(r,r,GH,8),postMat);
          p.position.set(gx,GH/2,z); g.add(p);
        });
        // crossbar (front, spans Z)
        const cb=new T.Mesh(new T.CylinderGeometry(r,r,HW*2,8),postMat);
        cb.rotation.x=Math.PI/2; cb.position.set(gx,GH,0); g.add(cb);
        // back ground bar
        const bb=new T.Mesh(new T.CylinderGeometry(r*0.8,r*0.8,HW*2,8),postMat);
        bb.rotation.x=Math.PI/2; bb.position.set(bx,r,0); g.add(bb);
        // top slope rails: front-top → back-bottom (both sides)
        [-HW,HW].forEach(z=>{
          const len=Math.hypot(DEP,GH);
          const sr=new T.Mesh(new T.CylinderGeometry(r*0.7,r*0.7,len,6),postMat);
          sr.position.set((gx+bx)/2,GH/2,z);
          // rotate around Z so it leans from top-front down to back-ground
          sr.rotation.z=side*Math.atan2(DEP,GH);
          g.add(sr);
        });
        // NET — slanted back panel: top edge at front-top, bottom edge at back-ground
        const slantLen=Math.hypot(DEP,GH);
        const bn=new T.Mesh(new T.PlaneGeometry(HW*2,slantLen),netMat);
        bn.position.set((gx+bx)/2,GH/2,0);
        bn.rotation.y=Math.PI/2;                              // normal along X (faces pitch)
        bn.rotation.x=side*Math.atan2(DEP,GH);                // lean to match slope rails
        g.add(bn);
        // side net panels (two right-triangle-ish quads, faces sideways)
        [-HW,HW].forEach(z=>{
          const sd=new T.Mesh(new T.PlaneGeometry(DEP,GH),netMat);
          sd.position.set((gx+bx)/2,GH/2,z);                  // normal along Z
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
    P3D._rebuildBowl=placeAllStadium;   // Camera Lab calls this when sliders change

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
      const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true}));
      sp.center.set(0.5,0); scene.add(sp);
      const sh=new T.Mesh(new T.PlaneGeometry(1,1),
        new T.MeshBasicMaterial({map:SHADOW_TEX,transparent:true,opacity:P3D.light.shadow,depthWrite:false}));
      sh.rotation.x=-Math.PI/2; sh.position.y=0.04; sh.renderOrder=2; scene.add(sh);
      return sprites[id]={sprite:sp,shadow:sh,tex};
    }
    function cellState(id,p){
      const now=performance.now();
      const prev=stt[id]||{rx:p.x,ry:p.y,face:'side',flip:false,moveT:-1e9};
      const ddx=p.x-prev.rx, ddy=p.y-prev.ry, dist=Math.hypot(ddx,ddy);
      const thresh=(CV.width||1280)*0.0015;
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
          // sprite height = fixed fraction of world pitch LENGTH (HD-2D scale).
          // P3D.spriteFrac defaults to ~0.045 of PLEN — tune in Camera Lab.
          const frac=(P3D.spriteFrac!=null?P3D.spriteFrac:0.045);
          const hWorld=PLEN*frac;
          const wWorld=hWorld*(sheet.cw/sheet.ch);
          const st=cellState(id,p);
          o.tex.offset.set(st.col/GRID.cols, 1-(st.row+1)/GRID.rows);
          o.sprite.scale.set(wWorld*(st.flip?-1:1), hWorld, 1);
          const wx=ex2wx(p.x), wz=ey2wz(p.y);
          o.sprite.position.set(wx,0.05,wz);
          // ---- directional soft shadow (cast away from the sun) ----
          const Lt=P3D.light, az=Lt.azim, el=Math.max(0.05,Math.min(1,Lt.elev));
          const baseR=Math.max(0.3, wWorld*0.46);
          const elong=1+(1-el)*Lt.shadowLen*2.2;           // lower sun → longer
          const cdx=-Math.sin(az), cdz=-Math.cos(az);       // cast direction (away from sun)
          const off=baseR*(elong-1)*0.6;                    // shift centre down-shadow
          o.shadow.position.set(wx+cdx*off, 0.04, wz+cdz*off);
          o.shadow.scale.set(baseR, baseR*elong, 1);        // width × length(=cast dir)
          _qF.setFromAxisAngle(_AX,-Math.PI/2); _qS.setFromAxisAngle(_AY,az);
          o.shadow.quaternion.copy(_qS).multiply(_qF);      // flat, length aligned to cast dir
          o.shadow.material.opacity=Lt.shadow;
        });
      });
      // hide sprites whose players vanished (subs, etc.)
      for(const id in sprites){ const vis=seen.has(id);
        sprites[id].sprite.visible=vis; sprites[id].shadow.visible=vis; }
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
    const ballMesh=new T.Sprite(new T.SpriteMaterial({map:ballTex,transparent:true}));
    ballMesh.center.set(0.5,0);              // bottom-anchored at the ground point
    scene.add(ballMesh);
    function syncBall(){
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
      ballMesh.position.set(ex2wx(bx),0.05,ey2wz(by));
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
    function loop3d(){
      requestAnimationFrame(loop3d);
      if(!P3D.on){
        if(gl.style.display!=='none'){ gl.style.display='none'; if(P3D.suppress2D)CV.style.visibility=''; }
        return;
      }
      if(gl.style.display==='none'){ gl.style.display='block'; resize(); if(P3D.suppress2D)CV.style.visibility='hidden'; }
      const now=performance.now(); const dt=Math.min(0.05,(now-lastTs)/1000); lastTs=now;
      syncSheets(); syncPlayers(); syncBall(); updateCamera(dt);
      if(composer && P3D.fx && P3D.fx.on) composer.render(dt);
      else renderer.render(scene,camera);
      drawDebug();
    }
    requestAnimationFrame(loop3d);

    /* ---- inject a 2.5D toggle button (robust, retries until DOM ready) ---- */
    function injectButton(){
      if(document.getElementById('p3dToggleBtn')) return true;
      const b=document.createElement('button');
      b.id='p3dToggleBtn';
      b.textContent='2.5D';
      b.style.cssText='position:fixed;left:50%;top:96px;transform:translateX(-50%);z-index:99999;'
        +'font:700 11px Orbitron,sans-serif;letter-spacing:.1em;color:#cfd8e3;'
        +'background:rgba(18,28,46,.92);border:1px solid rgba(240,192,64,.45);'
        +'border-radius:6px;padding:6px 12px;cursor:pointer';
      b.onclick=()=>{ P3D.on=!P3D.on; b.style.background=P3D.on?'#1f9d63':'rgba(18,28,46,.92)';
                      b.style.color=P3D.on?'#04140c':'#cfd8e3'; };
      document.body.appendChild(b);
      // reflect current state
      b.style.background=P3D.on?'#1f9d63':'rgba(18,28,46,.92)';
      b.style.color=P3D.on?'#04140c':'#cfd8e3';
      return true;
    }
    /* Bind the permanent index.html button (#view25Btn) directly to P3D, and
       inject a JS fallback button, so the toggle can never fire before init. */
    (function wireToggles(){
      const idx=document.getElementById('view25Btn');
      if(idx && !idx._p3dWired){
        idx._p3dWired=true;
        idx.onclick=()=>{ P3D.on=!P3D.on;
          idx.style.background=P3D.on?'#1f9d63':'';
          idx.style.color=P3D.on?'#04140c':''; };
      }
      injectButton();
      if(!idx) setTimeout(wireToggles,500);
    })();

    /* ════════ POST-PROCESSING (HD-2D: bloom + tilt-shift + vignette) ════════
       Uses stock three.js r128 example passes loaded in index.html. If any are
       missing (scripts blocked/offline) we silently fall back to direct render —
       no black screen. */
    let composer=null, bloomPass=null, hTilt=null, vTilt=null, vignettePass=null;
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
      if(T.HorizontalTiltShiftShader && T.VerticalTiltShiftShader){
        hTilt=new T.ShaderPass(T.HorizontalTiltShiftShader);
        vTilt=new T.ShaderPass(T.VerticalTiltShiftShader);
        hTilt.uniforms.r.value=0.5; vTilt.uniforms.r.value=0.5;   // sharp band at vertical centre
        composer.addPass(hTilt); composer.addPass(vTilt);
      }
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
