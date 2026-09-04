/* ═══════════════════════════════════════════════════════════════
   ult11-bowl2.js — OVAL BOWL secondary stadium for Ultimate Eleven
   Elliptical continuous bowl (StadiView-style structure, own code):
   3 tiers of ringStrip slabs, glass concourse, roof ring, instanced
   rainbow seats + instanced crowd bodies, roof rim lamps.
   Loaded BEFORE ult11-pitch3d.js. pitch3d calls U11_OVAL.build()
   from placeAllStadium() when P3D.stadium==='oval'.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── LOCKED CONFIG ─────────────────────────────────────────── */
var CFG={
  SEG:120,            // ellipse segments (mobile-friendly; 160 = smoother)
  SPREAD_X:3,         // push all stands outward along pitch length (world units)
  SPREAD_Z:3,         // push all stands outward along pitch width
  OPEN_FRONT:true,    // cut the camera-side (+Z) arc so broadcast cam sees the pitch
  OPEN_A0:0.38,       // arc removed: from OPEN_A0 to PI-OPEN_A0 (radians on the ellipse)
  // URL overrides for phone tuning (no redeploy): ?ovalsx=5&ovalsz=7&ovalopen=0
  SEAT_SPACING:0.387, // world units (0.58 × 70/105)
  occupancy:0.5,      // fraction of seats holding a body
  floodCount:14,      // roof rim lamps
  // tier table, already scaled for a 70-unit pitch (StadiView dims × 70/105)
  TIERS:[
    {rows:18, rx:42.0, rz:30.7, y: 0.93, dr:0.567, dy:0.320, palette:'rainbow', sections:32},
    {rows:12, rx:54.7, rz:43.3, y:10.13, dr:0.533, dy:0.400, palette:'steel',   sections:24},
    {rows:16, rx:62.7, rz:51.3, y:18.40, dr:0.533, dy:0.467, palette:'night',   sections:32}
  ],
  ROOF:{inRx:61.3,inRz:50.0,inY:29.3,outRx:80.0,outRz:66.7,outY:32.0}
};
CFG.TIERS.forEach(function(t){
  t.rxTop=t.rx+t.rows*t.dr; t.rzTop=t.rz+t.rows*t.dr; t.yTop=t.y+t.rows*t.dy;
});

var TAU=Math.PI*2;
(function urlTune(){
  try{
    var q=new URLSearchParams(location.search);
    if(q.get('ovalsx')!=null) CFG.SPREAD_X=parseFloat(q.get('ovalsx'))||0;
    if(q.get('ovalsz')!=null) CFG.SPREAD_Z=parseFloat(q.get('ovalsz'))||0;
    if(q.get('ovalopen')!=null) CFG.OPEN_FRONT=q.get('ovalopen')!=='0';
  }catch(e){}
})();

/* ── HELPERS ───────────────────────────────────────────────── */
function canvasTexture(T,w,h,draw,repX,repY){
  var c=document.createElement('canvas'); c.width=w; c.height=h;
  draw(c.getContext('2d'),w,h);
  var t=new T.CanvasTexture(c);
  if(repX||repY){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repX||1,repY||1);}
  t.anisotropy=4; return t;
}
function ringStrip(T,rx1,rz1,y1,rx2,rz2,y2,seg,mat,repU,a0,a1){
  var pos=[],uv=[],idx=[]; repU=repU||10;
  if(a0==null){a0=0;a1=TAU;}
  var span=a1-a0;
  for(var i=0;i<=seg;i++){
    var a=a0+(i/seg)*span,c=Math.cos(a),s=Math.sin(a);
    pos.push(rx1*c,y1,rz1*s, rx2*c,y2,rz2*s);
    uv.push((i/seg)*repU,0,(i/seg)*repU,1);
  }
  for(i=0;i<seg;i++){var k=i*2; idx.push(k,k+2,k+1, k+1,k+2,k+3);}
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals();
  var m=new T.Mesh(g,mat); m.matrixAutoUpdate=false; return m;
}
function arcTable(rx,rz){
  var N=800,s=new Float32Array(N+1),a=new Float32Array(N+1);
  var L=0,px=rx,pz=0;
  for(var i=1;i<=N;i++){
    var th=(i/N)*TAU,x=rx*Math.cos(th),z=rz*Math.sin(th);
    L+=Math.hypot(x-px,z-pz); s[i]=L; a[i]=th; px=x; pz=z;
  }
  return {s:s,a:a,L:L,N:N};
}
function thetaAt(tb,dist){
  dist=((dist%tb.L)+tb.L)%tb.L;
  var lo=0,hi=tb.N;
  while(lo<hi){var mid=(lo+hi)>>1; if(tb.s[mid]<dist)lo=mid+1; else hi=mid;}
  var i=Math.max(1,lo), f=(dist-tb.s[i-1])/((tb.s[i]-tb.s[i-1])||1);
  return tb.a[i-1]+(tb.a[i]-tb.a[i-1])*f;
}

var RAINBOW=['#5b21b6','#6d28d9','#7c3aed','#4f46e5','#4338ca','#2563eb','#0284c7','#0ea5e9',
  '#0d9488','#10b981','#22c55e','#65a30d','#a3b60b','#eab308','#f59e0b','#f97316',
  '#ea580c','#dc2626','#b91c1c','#be185d','#9d174d','#7e22ce','#6d28d9','#5b21b6',
  '#4f46e5','#4338ca','#2563eb','#0284c7','#0ea5e9','#10b981','#22c55e','#eab308'];

/* ── BUILD ─────────────────────────────────────────────────── */
/* build(T, group, PLEN, PWID): fills `group` with the oval bowl.
   Scale: CFG dims assume PLEN=70; scale factor k=PLEN/70 keeps it
   correct if the world pitch length ever changes. */
function build(T,group,PLEN,PWID){
  var k=PLEN/70;
  function sc(v){return v*k;}
  var SPX=CFG.SPREAD_X*k, SPZ=CFG.SPREAD_Z*k;
  var openF=CFG.OPEN_FRONT;
  if(window.P3D && P3D.bowl && P3D.bowl.openFront===false) openF=false;
  // arc pieces: full ring, or two arcs skipping the +Z (camera) side
  var CUT0=CFG.OPEN_A0, CUT1=Math.PI-CFG.OPEN_A0;
  function arcs(){ return openF ? [[CUT1,CUT0+TAU]] : [[0,TAU]]; }
  function inCut(th){
    if(!openF) return false;
    th=((th%TAU)+TAU)%TAU;
    return th>CUT0 && th<CUT1;
  }
  function addRS(rx1,rz1,y1,rx2,rz2,y2,seg,mat,repU){
    arcs().forEach(function(A){
      var frac=(A[1]-A[0])/TAU;
      group.add(ringStrip(T,rx1,rz1,y1,rx2,rz2,y2,
        Math.max(8,Math.round(seg*frac)),mat,(repU||10)*frac,A[0],A[1]));
    });
  }
  var seed=12345;
  function rng(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  function sectionBaseColor(t,i2){
    if(t.palette==='rainbow') return new T.Color(RAINBOW[i2%RAINBOW.length]);
    if(t.palette==='steel'){var c=new T.Color(0x2e4a78);
      c.offsetHSL(((i2%5)-2)*0.012,0,((i2%3)-1)*0.03);return c;}
    var c2=new T.Color(0x27306a);
    c2.offsetHSL(((i2%7)-3)*0.01,0,((i2%4)-1.5)*0.02);return c2;
  }
  var SEG=CFG.SEG;
  var MAT={
    concrete:new T.MeshLambertMaterial({color:0x3a4657,side:T.DoubleSide}),
    concreteDark:new T.MeshLambertMaterial({color:0x222b3a,side:T.DoubleSide}),
    rail:new T.MeshPhongMaterial({color:0x9fb0c8,shininess:60,side:T.DoubleSide})
  };
  var stepTex=canvasTexture(T,64,64,function(x,w,h){
    var g=x.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#242e42');g.addColorStop(0.8,'#1a2130');
    g.addColorStop(0.85,'#0b101a');g.addColorStop(1,'#151c2a');
    x.fillStyle=g;x.fillRect(0,0,w,h);
    x.globalAlpha=0.1;
    for(var i=0;i<130;i++){x.fillStyle=Math.random()>0.5?'#000':'#3a4a66';
      x.fillRect(Math.random()*w,Math.random()*h,2,1);}
  });
  stepTex.wrapS=stepTex.wrapT=T.RepeatWrapping;
  var glassMat=new T.MeshBasicMaterial({side:T.DoubleSide,
    map:canvasTexture(T,1024,64,function(x,w,h){
      x.fillStyle='#070c17';x.fillRect(0,0,w,h);
      for(var i=0;i<64;i++){
        var lit=Math.random()<0.6;
        x.fillStyle=lit?'rgba(255,205,130,'+(0.25+Math.random()*0.55).toFixed(2)+')':'#0d1526';
        x.fillRect(i*16+2,8,12,h-16);
        if(lit&&Math.random()<0.35){x.fillStyle='rgba(20,26,40,.9)';x.fillRect(i*16+5,20,4,h-28);}
      }
    },10,1)});

  var TIERS=CFG.TIERS.map(function(t){
    var o={rows:t.rows,rx:sc(t.rx)+SPX,rz:sc(t.rz)+SPZ,y:sc(t.y),dr:sc(t.dr),dy:sc(t.dy),
      palette:t.palette,sections:t.sections};
    o.rxTop=o.rx+o.rows*o.dr; o.rzTop=o.rz+o.rows*o.dr; o.yTop=o.y+o.rows*o.dy;
    o.yIn=o.y-(1.2/t.dr)*t.dy*k*0.667-0.03;
    o.yOut=o.yTop+(1.0/t.dr)*t.dy*k*0.667-0.03;
    return o;
  });

  TIERS.forEach(function(t,i){
    var slabTex=stepTex.clone(); slabTex.needsUpdate=true; slabTex.repeat.set(110,t.rows);
    var slabMat=new T.MeshLambertMaterial({map:slabTex,side:T.DoubleSide});
    var u=sc(1);
    addRS(t.rx-1.2*u,t.rz-1.2*u,t.yIn, t.rxTop+u,t.rzTop+u,t.yOut, SEG,slabMat,1);
    if(i===0){
      addRS(t.rx-1.2*u,t.rz-1.2*u,0.05, t.rx-1.2*u,t.rz-1.2*u,t.yIn, SEG,MAT.concreteDark,60);
    }else{
      addRS(t.rx-1.2*u,t.rz-1.2*u,t.yIn-u, t.rx-1.2*u,t.rz-1.2*u,t.yIn, SEG,MAT.concreteDark,60);
    }
    addRS(t.rx-1.15*u,t.rz-1.15*u,t.yIn-0.02, t.rx-1.15*u,t.rz-1.15*u,t.yIn+0.85*u, SEG,MAT.rail,80);
    var wInX=(i===0)?t.rx-3.4*u:TIERS[i-1].rxTop+u;
    var wInZ=(i===0)?t.rz-3.4*u:TIERS[i-1].rzTop+u;
    addRS(wInX,wInZ,t.yIn, t.rx-1.2*u,t.rz-1.2*u,t.yIn, SEG,MAT.concreteDark,40);
    var wallH=(i===2?2.6:1.2)*u*0.667;
    addRS(t.rxTop+u,t.rzTop+u,t.yOut, t.rxTop+u,t.rzTop+u,t.yOut+wallH, SEG,MAT.concrete,60);
    if(i<2){
      var nt=TIERS[i+1];
      addRS(t.rxTop+u,t.rzTop+u,t.yOut+wallH, t.rxTop+u,t.rzTop+u,nt.yIn-u*0.667, SEG,glassMat,10);
      addRS(t.rxTop+u,t.rzTop+u,nt.yIn-u*0.667, nt.rx-1.2*u,nt.rz-1.2*u,nt.yIn-u*0.667, SEG,MAT.concreteDark,40);
    }
  });

  /* roof ring */
  var R={inRx:sc(CFG.ROOF.inRx)+SPX,inRz:sc(CFG.ROOF.inRz)+SPZ,inY:sc(CFG.ROOF.inY),
         outRx:sc(CFG.ROOF.outRx)+SPX,outRz:sc(CFG.ROOF.outRz)+SPZ,outY:sc(CFG.ROOF.outY)};
  addRS(R.inRx,R.inRz,R.inY, R.outRx,R.outRz,R.outY, SEG,
    new T.MeshLambertMaterial({color:0x8f9ab0,side:T.DoubleSide}),1);
  addRS(R.inRx,R.inRz,R.inY+0.6, R.outRx,R.outRz,R.outY+0.6, SEG,
    new T.MeshLambertMaterial({color:0x232b3a,side:T.DoubleSide}),1);
  addRS(R.outRx,R.outRz,R.outY, R.outRx,R.outRz,R.outY+0.6, SEG,MAT.concreteDark,80);
  var t2=TIERS[2];
  addRS(R.outRx,R.outRz,R.outY, t2.rxTop+sc(1),t2.rzTop+sc(1),t2.yOut+sc(1.73), SEG,
    new T.MeshLambertMaterial({color:0x1a2233,side:T.DoubleSide}),60);

  /* roof rim lamps */
  var lampGlow=canvasTexture(T,128,128,function(x,w,h){
    var g=x.createRadialGradient(64,64,2,64,64,63);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(0.35,'rgba(255,240,200,0.45)');
    g.addColorStop(1,'rgba(255,230,180,0)');
    x.fillStyle=g;x.fillRect(0,0,w,h);
  });
  var lampBox=new T.BoxGeometry(sc(1.47),sc(0.6),sc(0.33));
  var lampMat=new T.MeshBasicMaterial({color:0xfff6dd});
  for(var li=0;li<CFG.floodCount;li++){
    var a=(li/CFG.floodCount)*TAU;
    if(inCut(a)) continue;
    var lx=R.inRx*Math.cos(a),lz=R.inRz*Math.sin(a);
    var head=new T.Mesh(lampBox,lampMat);
    head.position.set(lx,R.inY-0.4,lz); head.lookAt(0,0,0); group.add(head);
    var halo=new T.Sprite(new T.SpriteMaterial({map:lampGlow,color:0xfff1cf,
      transparent:true,opacity:0.5,depthWrite:false,blending:T.AdditiveBlending}));
    halo.position.set(lx,R.inY-0.4,lz); halo.scale.set(sc(10),sc(10),1); group.add(halo);
  }

  /* seats: one InstancedMesh, arc-length spacing, section palettes */
  var SP=CFG.SEAT_SPACING*k, AISLE=1.0*k;
  var rowsAll=[];
  TIERS.forEach(function(t,ti){
    for(var r=0;r<t.rows;r++){
      var rx=t.rx+r*t.dr, rz=t.rz+r*t.dr, y=t.y+r*t.dy;
      var tb=arcTable(rx,rz);
      var perSec=tb.L/t.sections;
      var n=Math.floor((perSec-AISLE)/SP);
      rowsAll.push({t:t,tb:tb,rx:rx,rz:rz,y:y,sections:t.sections,perSec:perSec,n:n});
    }
  });
  var SEAT_COUNT=0;
  rowsAll.forEach(function(Rw){SEAT_COUNT+=Rw.n*Rw.sections;});

  var seatGeo=new T.BoxGeometry(sc(0.28),sc(0.23),sc(0.27));
  var seatMesh=new T.InstancedMesh(seatGeo,new T.MeshLambertMaterial({color:0xffffff}),SEAT_COUNT);
  var dummy=new T.Object3D(), jitter=new T.Color();
  var occ=[];
  var idx=0;
  rowsAll.forEach(function(Rw){
    for(var s=0;s<Rw.sections;s++){
      var base=sectionBaseColor(Rw.t,s);
      var s0=s*Rw.perSec+AISLE/2+(Rw.perSec-AISLE-Rw.n*SP)/2;
      for(var q=0;q<Rw.n;q++){
        var th=thetaAt(Rw.tb,s0+(q+0.5)*SP);
        if(inCut(th)){
          dummy.position.set(0,-999,0); dummy.rotation.set(0,0,0);
          dummy.scale.setScalar(0.0001); dummy.updateMatrix();
          seatMesh.setMatrixAt(idx,dummy.matrix);
          idx++; continue;
        }
        var x=Rw.rx*Math.cos(th),z=Rw.rz*Math.sin(th);
        var yaw=Math.atan2(-x,-z);
        dummy.position.set(x,Rw.y,z);
        dummy.rotation.set(0,yaw,0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        seatMesh.setMatrixAt(idx,dummy.matrix);
        jitter.copy(base).offsetHSL((rng()-0.5)*0.02,(rng()-0.5)*0.08,(rng()-0.5)*0.16);
        seatMesh.setColorAt(idx,jitter);
        if(rng()<CFG.occupancy) occ.push([x,Rw.y,z,yaw]);
        idx++;
      }
    }
  });
  seatMesh.instanceMatrix.needsUpdate=true;
  if(seatMesh.instanceColor) seatMesh.instanceColor.needsUpdate=true;
  seatMesh.frustumCulled=false;
  group.add(seatMesh);

  /* crowd: instanced torsos + heads on occupied seats */
  var torsoGeo=new T.CylinderGeometry(sc(0.107),sc(0.127),sc(0.333),5);
  var headGeo=new T.SphereGeometry(sc(0.073),6,5);
  var torso=new T.InstancedMesh(torsoGeo,new T.MeshLambertMaterial({color:0xffffff}),occ.length);
  var heads=new T.InstancedMesh(headGeo,new T.MeshLambertMaterial({color:0xd9b08c}),occ.length);
  var cc=new T.Color();
  for(var i2=0;i2<occ.length;i2++){
    var o=occ[i2];
    dummy.position.set(o[0],o[1]+sc(0.30),o[2]);
    dummy.rotation.set(0,o[3],0);
    dummy.scale.setScalar(0.9+rng()*0.25);
    dummy.updateMatrix();
    torso.setMatrixAt(i2,dummy.matrix);
    var h=rng();
    if(h<0.40)cc.setHSL(0.60,0.45,0.40+rng()*0.25);
    else if(h<0.70)cc.setHSL(0,0,0.5+rng()*0.35);
    else cc.setHSL(0.02+rng()*0.12,0.45,0.4+rng()*0.3);
    torso.setColorAt(i2,cc);
    dummy.position.y=o[1]+sc(0.55);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    heads.setMatrixAt(i2,dummy.matrix);
  }
  torso.instanceMatrix.needsUpdate=true;
  heads.instanceMatrix.needsUpdate=true;
  if(torso.instanceColor)torso.instanceColor.needsUpdate=true;
  torso.frustumCulled=false; heads.frustumCulled=false;
  group.add(torso); group.add(heads);

  var info={seats:SEAT_COUNT,bodies:occ.length,TIERS:TIERS,
            openF:openF,CUT0:CUT0,CUT1:CUT1,R:R,k:k,SPX:SPX,SPZ:SPZ};
  window.U11_OVAL._last=info;
  return info;
}

window.U11_OVAL={build:build,CFG:CFG};
})();
