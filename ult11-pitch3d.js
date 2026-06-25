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
          phiMin:0.34, phiMax:0.82, thetaLimit:0.20,
          // ---- Camera Lab tunables ----
          phi:0.55,          // fixed elevation when not dragging
          followLerp:6,      // how fast focus chases the carrier (higher = snappier)
          zFollow:0.35,      // 0=stay sideways at midline, 1=fully follow Z
          inwardYaw:0.55,    // how much the camera turns inward near the goals
          lookY:1.0,         // height of the look-at point
          lift:2 },          // extra camera height offset
    bowl:{ yOff:0, gap:0, rake:50, tierH:30, sharp:false, roof:true,
           openFront:true, mode:'crowd', tiers:{1:true,2:true,3:true} },
    spriteScale:1.9,     // (legacy) billboard height vs engine token radius CR
    spriteFrac:0.045,    // billboard height as fraction of world pitch LENGTH (HD-2D)
    debug:false,         // sprite/shadow debug overlay (Camera Lab)
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
      const RUNOFF = 26*U;                                  // sandbox runoff
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
      bowlGroup.add(buildTierSegmented(baseHL,baseHW,r, (S.yOff||0)*U, (S.yOff||0)*U+th*0.55, 0.5,
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
          o.shadow.position.set(wx,0.04,wz);
          o.shadow.scale.setScalar(Math.max(0.3,wWorld*0.42));
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
      // FOCUS: follow whoever has the ball (both teams); fall back to ball.
      let fx=0,fz=0, cx01=0.5;
      const cp=carrierPos();
      if(cp){ fx=ex2wx(cp.x); fz=ey2wz(cp.y); cx01=cp.x/(window.W||1280); }
      else if(typeof ball!=='undefined'&&ball){ fx=ex2wx(ball.x); fz=ey2wz(ball.y); cx01=ball.x/(window.W||1280); }
      const k=Math.min(1,dt*C.followLerp);
      camFocus.x+=(fx-camFocus.x)*k;
      camFocus.z+=(fz*C.zFollow-camFocus.z)*k;     // partial Z so view stays sideways
      camFocus.dist+=(C.dist-camFocus.dist)*k;
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
      drawDebug();
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
