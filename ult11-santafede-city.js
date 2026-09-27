/* ============================================================
   ULT11-SANTAFEDE-CITY  ·  Ultimate Eleven   (Claude, 2026-09-26)
   Author: "Santa Fede needs a background, or it looks like it's on an
   island." Beyond Astra's wall / church / houses there was only sky and
   bare ground. This adds the neighbourhood around the campetto:

     1. STREETS   - a wide asphalt ground apron out to the city ring
     2. BLOCKS    - a ring of Genova apartment blocks (ochre / salmon /
                    pink / yellow / cream), 5-11 storeys, rows of green-
                    shuttered windows, terracotta or slate roofs, drawn as
                    nearest-sampled pixel textures; rooftops show over the
                    wall, taller ones further out (the city climbs the hill)
     3. HILLSIDE  - the Genova panorama (same painting as Marassi Square)
                    wrapped round the horizon, hazed, its painted sky
                    melting into the U11Sky dome
   Placed OUTSIDE the measured bounding box of Astra's environment, so it
   follows that layout if it changes. Everything is MeshBasic with baked
   shading (the match renderer's display-referred pipeline), merged per
   material: ~9 draw calls. setTime('night') lights random windows.
   API: U11_SANTA_CITY.build(T, group, PLEN, PWID)  ·  .setTime(look)
   Assets: assets/stadiums/santa-fede/genova-backdrop.jpg (176 KB)
   ============================================================ */
(function(){
'use strict';
let active=null;
const PALETTES=[
  {wall:'#d9a45f',dark:'#b9854a',trim:'#ecd3a4'},   // ochre
  {wall:'#d98f74',dark:'#b8705a',trim:'#f0cdb8'},   // salmon
  {wall:'#e2b3a6',dark:'#c29084',trim:'#f4ddd4'},   // faded pink
  {wall:'#e6cf86',dark:'#c4ad66',trim:'#f6e8bb'},   // yellow
  {wall:'#e8dcc4',dark:'#c7baa0',trim:'#fbf3e2'},   // cream
  {wall:'#c9a78a',dark:'#a8876c',trim:'#e6d2bf'}];  // sand
function rng(seed){ return ()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }; }

// one facade tile = 3 windows x 3 floors, 48x48 px, drawn as pixel art
function facadeCanvas(p,night,r){
  const c=document.createElement('canvas'); c.width=c.height=48; const x=c.getContext('2d');
  x.fillStyle=p.wall; x.fillRect(0,0,48,48);
  for(let i=0;i<40;i++){ x.fillStyle=r()<.5?p.dark:p.trim; x.globalAlpha=.18; x.fillRect(Math.floor(r()*48),Math.floor(r()*48),1+Math.floor(r()*3),1); }  // plaster wear
  x.globalAlpha=1;
  if(night){ x.globalCompositeOperation='multiply'; x.fillStyle='#39455e'; x.fillRect(0,0,48,48); x.globalCompositeOperation='source-over'; }
  for(let fy=0;fy<3;fy++){ const y0=fy*16;
    x.fillStyle=night?'#4a4a55':p.trim; x.fillRect(0,y0+14,48,1);                           // string course
    for(let wx=0;wx<3;wx++){ const x0=wx*16+5;
      const lit=night&&r()<.34, open=r()<.55;
      x.fillStyle=lit?(r()<.5?'#ffd48a':'#ffbf6a'):(night?'#141b28':'#2b3440'); x.fillRect(x0,y0+3,6,9);   // window
      if(!night&&r()<.5){ x.fillStyle='#46576a'; x.fillRect(x0,y0+3,6,2); }                         // sky reflection
      x.fillStyle=night?'#1d2b22':'#3f6a4c';                                                         // green shutters
      if(open){ x.fillRect(x0-3,y0+3,2,9); x.fillRect(x0+7,y0+3,2,9); } else x.fillRect(x0,y0+3,6,9);
      if(!open&&lit){ x.fillStyle='#ffcf85'; x.fillRect(x0+1,y0+4,1,7); x.fillRect(x0+4,y0+4,1,7); }   // light through the slats
      x.fillStyle=night?'#4a4a55':p.trim; x.fillRect(x0-1,y0+12,8,1);                                                 // sill
    } }
  return c;
}
function tex(T,canvas){ const t=new T.CanvasTexture(canvas); t.magFilter=T.NearestFilter; t.minFilter=T.LinearMipmapLinearFilter;
  t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=4; return t; }
function roofCanvas(col,dark){ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d');
  x.fillStyle=col; x.fillRect(0,0,32,32); x.fillStyle=dark; for(let y=0;y<32;y+=4) x.fillRect(0,y,32,1);
  for(let y=0;y<32;y+=4) for(let i=0;i<32;i+=6) x.fillRect((i+(y%8?3:0))%32,y,1,4); return c; }

// merge boxes into one BufferGeometry per material key; uv scaled to world size
function Merger(){ const m={}; return { add(key,geo){ (m[key]=m[key]||[]).push(geo); }, keys:()=>Object.keys(m),
  merged(T,key){ const list=m[key]; let n=0; list.forEach(g=>n+=g.attributes.position.count);
    const P=new Float32Array(n*3), U=new Float32Array(n*2), C=new Float32Array(n*3); let o=0;
    list.forEach(g=>{ P.set(g.attributes.position.array,o*3); U.set(g.attributes.uv.array,o*2); C.set(g.attributes.color.array,o*3); o+=g.attributes.position.count; g.dispose(); });
    const out=new T.BufferGeometry(); out.setAttribute('position',new T.BufferAttribute(P,3)); out.setAttribute('uv',new T.BufferAttribute(U,2)); out.setAttribute('color',new T.BufferAttribute(C,3));
    return out; } }; }
// one face (quad) as a non-indexed triangle pair, with a baked shade in vertex colour
function quad(T,a,b,c,d,u0,v0,u1,v1,shade){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array([...a,...b,...c,...a,...c,...d]),3));
  g.setAttribute('uv',new T.BufferAttribute(new Float32Array([u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1]),2));
  const s=Array.isArray(shade)?shade:[shade,shade,shade]; g.setAttribute('color',new T.BufferAttribute(new Float32Array([...s,...s,...s,...s,...s,...s]),3));
  return g; }

function build(T,group,PLEN,PWID){
  dispose();
  const k=PLEN/70, root=new T.Group(); root.name='Santa Fede city'; group.add(root);
  // what Astra built: keep out of it
  const box=new T.Box3(); group.updateMatrixWorld(true);
  group.traverse(o=>{ if(o.isMesh&&o.geometry&&o!==root){ o.geometry.computeBoundingBox&&o.geometry.computeBoundingBox(); const b=o.geometry.boundingBox; if(b){ const bb=b.clone().applyMatrix4(o.matrixWorld); if(isFinite(bb.min.x)&&bb.max.y>0.5) box.union(bb); } } });
  if(box.isEmpty()) box.set(new T.Vector3(-50*k,0,-42*k),new T.Vector3(46*k,20*k,42*k));
  const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2;
  const hx=(box.max.x-box.min.x)/2+4*k, hz=(box.max.z-box.min.z)/2+4*k;
  const r=rng(9127), mg=Merger(), facades=[], mats=[];
  const TILE=9*k;                                  // one facade tile = 3 windows x 3 floors (~13 m)
  /* SOUTH END = CORSO SARDEGNA (author 2026-09-26). Behind the south goal:
     the (now empty) parking, a pavement, the avenue - two lanes each way -
     another pavement, the petrol station straight across from the campetto,
     a line of buildings behind it, then the city rings and the valley.
     All x values are native world units, south = -X. */
  const XP=-(PLEN/2+22*k);                         // far edge of Astra's parking
  const XR0=XP-3*k, XR1=XR0-10*k;                  // the road (4 x ~3.5 m lanes)
  const XS0=XR1-3*k, XS1=XS0-20*k;                 // far pavement -> station lot
  const XL0=XS1-1*k, XL1=XL0-12*k;                 // the line of buildings behind it
  const XSB=XL1-6*k;                               // the rest of the city starts here
  // 1) street apron
  const apron=new T.Mesh(new T.PlaneGeometry(760*k,760*k),new T.MeshBasicMaterial({color:0x4b4d4f,fog:true}));
  apron.rotation.x=-Math.PI/2; apron.position.set(cx,-0.12,cz); root.add(apron); mats.push(apron.material);
  // 2) block ring: rows of buildings on concentric rectangles outside the box
  /* Corso Sardegna (author 2026-09-26): behind the WALL side (+X, north) the
     road climbs the hill, so that side is a terraced city - taller blocks
     stepping up row after row - and the valley panorama rises high behind
     it. The other three sides stay a normal street height. */
  const rings=[{off:10,h:[7,14],d:10},{off:30,h:[10,19],d:12},{off:58,h:[13,26],d:14},
               {off:88,h:[13,22],d:14,hill:1},{off:118,h:[13,22],d:15,hill:1},{off:150,h:[12,20],d:16,hill:1}];
  rings.forEach((R,ri)=>{
    const ax=hx+R.off*k, az=hz+R.off*k;           // this ring's rectangle half sizes
    const sides=[[-ax,-az,ax,-az],[ax,-az,ax,az],[ax,az,-ax,az],[-ax,az,-ax,-az]];
    sides.forEach(([x0,z0,x1,z1],si)=>{ x0=+x0; x1=+x1;
      const hillSide=si===1;                           // outward normal +X: the wall side, up the hill
      if(R.hill&&!hillSide) return;
      if(si===3){ const xa=Math.min(cx-ax,XSB-(R.off-10)*k); x0=x1=xa-cx; }   // south: behind Corso Sardegna
      const L=Math.hypot(x1-x0,z1-z0), ux=(x1-x0)/L, uz=(z1-z0)/L, nx=uz, nz=-ux;   // outward normal
      let s=0;
      while(s<L){
        const w=(8+r()*12)*k, d=R.d*k*(0.8+r()*0.5);
        let h=(R.h[0]+r()*(R.h[1]-R.h[0]))*k; if(hillSide) h=h*1.12+R.off*0.13*k;   // the slope lifts every row behind the wall; the valley still shows over the top
        if(r()<0.12){ s+=w*0.6; continue; }                                        // a gap: a side street
        const px=cx+x0+ux*(s+w/2)+nx*(-d*0.1), pz=cz+z0+uz*(s+w/2)+nz*(-d*0.1);
        const pi=Math.floor(r()*PALETTES.length), key='w'+pi, roofKey=r()<0.72?'rt':'rs';
        // footprint corners (w along the side, d outward)
        const hw=w/2, P=(a,b)=>[px+ux*a+nx*b, pz+uz*a+nz*b];
        const c0=P(-hw,0),c1=P(hw,0),c2=P(hw,d),c3=P(-hw,d);
        { const mnx=Math.min(c0[0],c1[0],c2[0],c3[0]), mxx=Math.max(c0[0],c1[0],c2[0],c3[0]);
          if(mxx>XS0-1*k&&mnx<XP+1*k){ s+=w+0.2*k; continue; } }                   // keep the avenue open to the horizon
        const face=(A,B,shade)=>{ const len=Math.hypot(B[0]-A[0],B[1]-A[1]);
          mg.add(key,quad(T,[A[0],0,A[1]],[B[0],0,B[1]],[B[0],h,B[1]],[A[0],h,A[1]],0,0,len/TILE,h/TILE,shade)); };
        // light from the sun side (-x,+z-ish); faces toward the court get the most view
        face(c1,c0,0.93);  face(c0,c3,0.78); face(c2,c1,0.86); face(c3,c2,0.72);
        const y=h; mg.add(roofKey,quad(T,[c0[0],y,c0[1]],[c1[0],y,c1[1]],[c2[0],y,c2[1]],[c3[0],y,c3[1]],0,0,w/(6*k),d/(6*k),0.9));
        // a parapet/cornice strip
        mg.add('cornice',quad(T,[c1[0],y,c1[1]],[c0[0],y,c0[1]],[c0[0],y+0.7*k,c0[1]],[c1[0],y+0.7*k,c1[1]],0,0,1,1,0.95));
        s+=w+(r()<0.35?(1+r()*3)*k:0.2*k);
      }
    });
  });
  // the line of buildings facing the avenue, behind the station
  { let z=-170*k; while(z<170*k){ const w=(9+r()*10)*k, d=12*k, h=(11+r()*8)*k;
      if(r()<0.1){ z+=w*0.5; continue; }
      const pi=Math.floor(r()*PALETTES.length), key='w'+pi, rk=r()<0.7?'rt':'rs';
      const x0=XL0, x1=XL1, z0=z, z1=z+w;
      const F=(A,B,sh)=>{ const len=Math.hypot(B[0]-A[0],B[1]-A[1]); mg.add(key,quad(T,[A[0],0,A[1]],[B[0],0,B[1]],[B[0],h,B[1]],[A[0],h,A[1]],0,0,len/TILE,h/TILE,sh)); };
      F([x0,z1],[x0,z0],0.95); F([x0,z0],[x1,z0],0.78); F([x1,z1],[x0,z1],0.8);
      mg.add(rk,quad(T,[x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1],0,0,d/(6*k),w/(6*k),0.9));
      mg.add('cornice',quad(T,[x0,h,z1],[x0,h,z0],[x0,h+0.7*k,z0],[x0,h+0.7*k,z1],0,0,1,1,0.95));
      z+=w+0.2*k; } }
  // distance haze (aerial perspective): further blocks melt into the sky colour
  const HZ={hazeCol:{value:new T.Color(0xcfe2ef)},hazeNear:{value:30*k},hazeFar:{value:190*k},hazeMax:{value:0.72}};
  const withHaze=m=>{ m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,HZ);
      sh.fragmentShader='uniform vec3 hazeCol; uniform float hazeNear,hazeFar,hazeMax;\n'+sh.fragmentShader.replace('#include <fog_fragment>',
        '#ifdef USE_FOG\n gl_FragColor.rgb=mix(gl_FragColor.rgb,hazeCol,smoothstep(hazeNear,hazeFar,fogDepth)*hazeMax);\n#endif'); };
    m.customProgramCacheKey=()=>'santa-city-haze-v1'; return m; };
  // materials: day + night facade maps per palette
  const facadeMat={};
  PALETTES.forEach((p,i)=>{ const rr=rng(311+i*97);
    const day=tex(T,facadeCanvas(p,false,rr)), night=tex(T,facadeCanvas(p,true,rng(311+i*97)));
    const m=withHaze(new T.MeshBasicMaterial({map:day,vertexColors:true,fog:true,side:T.DoubleSide})); m.userData={day,night}; facadeMat['w'+i]=m; facades.push(m); mats.push(m); });
  const roofT=tex(T,roofCanvas('#b0583a','#8a3f28')), roofS=tex(T,roofCanvas('#6b6f78','#555861'));
  const matFor={rt:new T.MeshBasicMaterial({map:roofT,vertexColors:true,fog:true,side:T.DoubleSide}),rs:new T.MeshBasicMaterial({map:roofS,vertexColors:true,fog:true,side:T.DoubleSide}),
    cornice:new T.MeshBasicMaterial({color:0xe9dcc4,vertexColors:true,fog:true,side:T.DoubleSide}),...facadeMat};
  [matFor.rt,matFor.rs,matFor.cornice].forEach(withHaze); withHaze(apron.material);
  mats.push(matFor.rt,matFor.rs,matFor.cornice);
  mg.keys().forEach(key=>{ const mesh=new T.Mesh(mg.merged(T,key),matFor[key]); mesh.name='city_'+key; mesh.matrixAutoUpdate=false; mesh.updateMatrix(); root.add(mesh); });
  const corso=buildCorso(T,root,k,cz,{XP,XR0,XR1,XS0,XS1},withHaze,mats);
  // 3) hillside panorama ring
  const pano=new T.TextureLoader().load('assets/stadiums/santa-fede/genova-backdrop.jpg',t=>{ t.needsUpdate=true; });
  pano.wrapS=T.MirroredRepeatWrapping; pano.repeat.set(9,1); pano.magFilter=T.LinearFilter;
  const PR=330*k, PH=150*k;                     // the valley rises high behind the city (author: correct for Corso Sardegna)
  const cyl=new T.CylinderGeometry(PR,PR,PH,72,1,true);
  const panoMat=new T.MeshBasicMaterial({map:pano,side:T.BackSide,transparent:true,depthWrite:false,fog:false,color:0xdfe6ee});
  panoMat.onBeforeCompile=sh=>{ sh.uniforms.haze={value:new T.Color(0xcfe2ef)}; panoMat.userData.shader=sh;
    sh.fragmentShader='uniform vec3 haze;\n'+sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       diffuseColor.rgb=mix(diffuseColor.rgb,haze,0.38);                       // aerial perspective
       diffuseColor.a*=1.0-smoothstep(.70,.93,vUv.y);                          // painted sky melts into the dome`); };
  panoMat.customProgramCacheKey=()=>'santa-city-pano-v1';
  const ring=new T.Mesh(cyl,panoMat); ring.position.set(cx,PH*0.5-18*k,cz); ring.renderOrder=-15; root.add(ring); mats.push(panoMat);
  active={root,facades,panoMat,apron,mats,HZ,corso,textures:[roofT,roofS,pano,...facades.flatMap(m=>[m.userData.day,m.userData.night])],box};
  setTime(lastLook);
  return active;
}
/* CORSO SARDEGNA: pavements with kerbs, the four-lane avenue running off to
   the horizon both ways, street lamps, and a generic petrol station (the
   game keeps real brands out - see BRAND_SAFE / roadmap 0.3). Returns the
   materials whose colour changes with the time of day
   (userData.dn = [day, night, golden]; userData.maps = [day, night]). */
function buildCorso(T,root,k,cz,Z,withHaze,mats){
  const out=[], L=820*k;
  const M=(opt,dn)=>{ const m=withHaze(new T.MeshBasicMaterial(Object.assign({fog:true},opt))); if(dn){ m.userData.dn=dn; out.push(m); } mats.push(m); return m; };
  const add=(geo,m,x,y,z)=>{ const o=new T.Mesh(geo,m); o.position.set(x,y,z); o.matrixAutoUpdate=false; o.updateMatrix(); root.add(o); return o; };
  const px=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return [c,c.getContext('2d')]; };
  const ctex=c=>{ const t=new T.CanvasTexture(c); t.magFilter=T.NearestFilter; return t; };
  // road: 64 px across the four lanes, 64 px along ~12 wu
  const [rc,x]=px(64,64);
  x.fillStyle='#3a3c3f'; x.fillRect(0,0,64,64);
  for(let i=0;i<260;i++){ x.fillStyle=Math.random()<.5?'#34363a':'#44464a'; x.fillRect(Math.floor(Math.random()*64),Math.floor(Math.random()*64),1,1); }
  x.fillStyle='rgba(0,0,0,.18)'; [9,24,39,54].forEach(u=>x.fillRect(u,0,3,64));      // tyre wear
  x.fillStyle='#d9d6cc'; x.fillRect(2,0,1,64); x.fillRect(61,0,1,64);                // edge lines
  x.fillRect(31,0,1,64); x.fillRect(33,0,1,64);                                       // double solid centre line
  x.fillRect(17,0,1,34); x.fillRect(47,0,1,34);                                       // lane dashes
  const rt=ctex(rc); rt.wrapS=rt.wrapT=T.RepeatWrapping; rt.repeat.set(1,L/(12*k)); rt.anisotropy=8;
  const roadW=Z.XR0-Z.XR1, road=new T.PlaneGeometry(roadW,L); road.rotateX(-Math.PI/2);
  add(road,M({map:rt},[0xffffff,0x3e4450,0xf2dcc4]),(Z.XR0+Z.XR1)/2,0.01,cz);
  // pavements (raised) + kerbs on the road side
  const walkM=M({color:0x9b978d},[0x9b978d,0x2c3038,0x9c8a78]), kerbM=M({color:0xc9c4b8},[0xc9c4b8,0x464a54,0xc8b39a]);
  add(new T.BoxGeometry(Z.XP-Z.XR0,0.14*k,L),walkM,(Z.XP+Z.XR0)/2,0.07*k,cz);
  add(new T.BoxGeometry(Z.XR1-Z.XS0,0.14*k,L),walkM,(Z.XR1+Z.XS0)/2,0.07*k,cz);
  add(new T.BoxGeometry(0.35*k,0.18*k,L),kerbM,Z.XR0,0.09*k,cz);
  add(new T.BoxGeometry(0.35*k,0.18*k,L),kerbM,Z.XR1,0.09*k,cz);
  // street lamps on both pavements, staggered, arms over the road (merged: poles + heads)
  const poles=[], heads=[];
  const lamp=(bx,dir,z)=>{ const p=new T.BoxGeometry(0.22*k,5.4*k,0.22*k); p.translate(bx,2.7*k,z); poles.push(p);
    const a=new T.BoxGeometry(1.6*k,0.16*k,0.16*k); a.translate(bx+dir*0.8*k,5.35*k,z); poles.push(a);
    const h=new T.BoxGeometry(0.7*k,0.22*k,0.4*k); h.translate(bx+dir*1.5*k,5.2*k,z); heads.push(h); };
  for(let z=-190*k;z<=190*k;z+=16*k){ lamp(Z.XR0+0.6*k,-1,cz+z); lamp(Z.XR1-0.6*k,1,cz+z+8*k); }
  const merge=list=>{ const P=[]; list.forEach(g=>{ const q=g.index?g.toNonIndexed():g; for(const v of q.attributes.position.array) P.push(v); if(q!==g) q.dispose(); g.dispose(); });
    const o=new T.BufferGeometry(); o.setAttribute('position',new T.BufferAttribute(new Float32Array(P),3)); return o; };
  add(merge(poles),M({color:0x3c4148},[0x3c4148,0x1a1d22,0x3c3a3a]),0,0,0);
  add(merge(heads),M({color:0x8d949c},[0x8d949c,0xfff2c0,0xb0a090]),0,0,0);
  // ── the petrol station, straight across from the campetto ──
  const sx=(Z.XS0+Z.XS1)/2, fz=cz;
  add(new T.BoxGeometry(Z.XS0-Z.XS1,0.1*k,54*k),M({color:0x8e8c86},[0x8e8c86,0x7a7e86,0x958474]),sx,0.05*k,fz);   // forecourt (lit at night)
  // canopy on four columns: white fascia with a blue band and a yellow rule, bright underside at night
  const cw=12*k, cl=26*k, cy=4.2*k, ct=0.9*k, cxp=Z.XS0-9*k;
  const [fc,f]=px(128,8); f.fillStyle='#f3f4f2'; f.fillRect(0,0,128,8); f.fillStyle='#1f5fb4'; f.fillRect(0,5,128,3); f.fillStyle='#f2c230'; f.fillRect(0,4,128,1);
  const ft=ctex(fc); ft.wrapS=T.RepeatWrapping; ft.repeat.set(3,1);
  const fasc=M({map:ft},[0xffffff,0xffffff,0xf6e2cc]), under=M({color:0xd8dde2},[0xd8dde2,0xfff6e0,0xe6d4c0]), top=M({color:0x9aa0a6});
  add(new T.BoxGeometry(cw,ct,cl),[fasc,fasc,top,under,fasc,fasc],cxp,cy+ct/2,fz);
  const colM=M({color:0xe6e8ea},[0xe6e8ea,0xb8c0cc,0xe6d4c0]);
  for(const dx of [-3.5,3.5]) for(const dz of [-9,9]) add(new T.BoxGeometry(0.5*k,cy,0.5*k),colM,cxp+dx*k,cy/2,fz+dz*k);
  // two pump islands, two pumps each
  const islM=M({color:0xbfbcb4},[0xbfbcb4,0x6a6e76,0xc0ac98]), pumpM=M({color:0xf1f2f0},[0xf1f2f0,0xd4dcea,0xf0dcc6]), pumpB=M({color:0x1f5fb4},[0x1f5fb4,0x2b62b8,0x3a5a90]);
  for(const dz of [-5,5]){ add(new T.BoxGeometry(1.4*k,0.25*k,7*k),islM,cxp,0.125*k,fz+dz*k);
    for(const pz of [-1.8,1.8]){ add(new T.BoxGeometry(0.8*k,1.9*k,1.0*k),pumpM,cxp,1.2*k,fz+(dz+pz)*k); add(new T.BoxGeometry(0.82*k,0.35*k,1.02*k),pumpB,cxp,2.0*k,fz+(dz+pz)*k); } }
  // kiosk: a small shop, glass front toward the road (lit at night)
  const [kc,kx]=px(64,32);
  kx.fillStyle='#e9e6de'; kx.fillRect(0,0,64,32); kx.fillStyle='#1f5fb4'; kx.fillRect(0,0,64,7); kx.fillStyle='#f2c230'; kx.fillRect(0,7,64,1);
  kx.fillStyle='#2b3a48'; kx.fillRect(4,11,56,17); kx.fillStyle='#4f6b82'; for(let i=6;i<60;i+=9) kx.fillRect(i,12,5,4);
  kx.fillStyle='#e9e6de'; for(let i=4;i<=60;i+=14) kx.fillRect(i,11,1,17);
  const [kn,kk]=px(64,32); kk.drawImage(kc,0,0); kk.fillStyle='#ffe7a8'; kk.fillRect(4,11,56,17); kk.fillStyle='#f6d27a'; for(let i=4;i<=60;i+=14) kk.fillRect(i,11,1,17);
  const ktD=ctex(kc), ktN=ctex(kn);
  const kFront=M({map:ktD},[0xffffff,0xffffff,0xf6e2cc]); kFront.userData.maps=[ktD,ktN];
  const kWall=M({color:0xe2ddd2},[0xe2ddd2,0x5a5f6a,0xe2cdb4]);
  add(new T.BoxGeometry(6*k,3.4*k,11*k),[kFront,kWall,M({color:0x8a8f96}),kWall,kWall,kWall],Z.XS1+4*k,1.7*k,fz-17*k);
  // price totem by the road, facing the campetto
  const [tc,tx]=px(32,96);
  tx.fillStyle='#1f5fb4'; tx.fillRect(0,0,32,96); tx.fillStyle='#f2c230'; tx.fillRect(0,28,32,2);
  tx.fillStyle='#ffffff'; tx.font="bold 9px 'Rajdhani',sans-serif"; tx.textAlign='center'; tx.fillText('CARBU',16,12); tx.fillText('RANTI',16,23);
  tx.fillStyle='#0d2f5e'; for(let i=0;i<3;i++) tx.fillRect(3,36+i*19,26,15);
  tx.fillStyle='#ffcf4a'; tx.font="bold 8px 'Rajdhani',sans-serif"; ['1,899','1,789','0,829'].forEach((v,i)=>tx.fillText(v,16,47+i*19));
  const tt=ctex(tc);
  const totF=M({map:tt},[0xffffff,0xffffff,0xf6e2cc]), totS=M({color:0x1f5fb4},[0x1f5fb4,0x2b4f86,0x2f5a9a]);
  add(new T.BoxGeometry(0.5*k,7.2*k,2.2*k),[totF,totS,totS,totS,totS,totS],Z.XS0-1.5*k,3.6*k,fz+19*k);
  return out;
}
let lastLook='classic';
function setTime(look){ lastLook=look||'classic'; if(!active) return;
  const night=lastLook==='night', golden=lastLook==='golden';
  active.facades.forEach(m=>{ m.map=night?m.userData.night:m.userData.day; m.color.setScalar(night?1.0:0.9); if(golden) m.color.setRGB(0.98,0.84,0.72); m.needsUpdate=true; });
  active.HZ.hazeCol.value.setHex(night?0x0d1526:golden?0xe9b98f:0xc9dbe8); active.HZ.hazeMax.value=night?0.55:0.72;
  active.apron.material.color.setHex(night?0x16191f:golden?0x4d4540:0x4b4d4f);
  active.panoMat.color.setHex(night?0x1a2438:golden?0xe8c7a8:0xdfe6ee);
  const sh=active.panoMat.userData.shader; if(sh) sh.uniforms.haze.value.setHex(night?0x121c30:golden?0xf2c49a:0xcfe2ef);
  active.root.traverse(o=>{ if(o.material&&o.material.map&&o.name.startsWith('city_r')) o.material.color.setScalar(night?0.35:1); });
  active.root.traverse(o=>{ if(o.name==='city_cornice') o.material.color.setHex(night?0x3a3f4c:0xe9dcc4); });
  (active.corso||[]).forEach(m=>{ const v=m.userData.dn; if(v) m.color.setHex(night?v[1]:golden&&v[2]!=null?v[2]:v[0]);
    if(m.userData.maps){ m.map=m.userData.maps[night?1:0]; m.needsUpdate=true; } });
}
function dispose(){ if(!active) return; try{ active.root.parent&&active.root.parent.remove(active.root);
  active.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); active.mats.forEach(m=>m.dispose()); active.textures.forEach(t=>t&&t.dispose()); }catch(e){} active=null; }
window.U11_SANTA_CITY={build,setTime,dispose,inspect:()=>active?{box:[active.box.min.toArray(),active.box.max.toArray()],children:active.root.children.length}:null};
})();
