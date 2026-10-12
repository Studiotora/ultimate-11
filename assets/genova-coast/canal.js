/* The canal district: the east end of Borgo del Mare (merged from the standalone "Borgo · Canale" lab scene).
 * The harbour promenade carries on east as a second piazza with a fountain and a row of shopfronts; a stone canal
 * leaves the harbour beside the east pier, crossed by a hump-backed bridge, and ends in a water gate. The south bank is a
 * quiet quay with a market. Everything is built from the Borgo's own materials (CoastArt, world-space pixel tiles) and
 * helpers, so it reads as one town. Land footprints are shared with water.js (shore mask) and world.js (walkable rects). */
(()=>{'use strict';
const BR={x:44,zc:11,half:3.8,width:3,hump:.85};                 // the bridge: deck runs along z across the canal, rises BR.hump in the middle
const LEVEL=-.65,BED=-1.3,X1=75;                                  // water level, canal bed, east end of the district
const quays=[[-21,X1,-16,8],[-21,-10,8,18],[10,21,8,12],[21,X1,14,28],[70,X1,8,14]];   // land footprints [x0,x1,z0,z1]: promenade + north bank, west pier, east pier, south bank, gate block
const walkable=[{x:47.65,z:-4,w:54.7,d:24},{x:48,z:21,w:54,d:14},{x:BR.x,z:BR.zc,w:BR.width,d:8.6}];   // rects overlap the neighbours so the actor radius clears every join
const buildings=[
 {x:24.8,z:-11.4,w:6.4,d:7.2,h:9.1,color:0xc9a36f,shop:'PANIFICIO'},
 {x:31.4,z:-11,w:6.2,d:7.6,h:10.2,color:0xd7907a,shop:'LIBRERIA'},
 {x:37.9,z:-11.8,w:6.4,d:7,h:8.8,color:0xe2c386,shop:'ENOTECA'},
 {x:44.7,z:-11.2,w:7,d:7.4,h:11,color:0xcf7f68,shop:'TRATTORIA DEL CANALE'},
 {x:51.5,z:-11.7,w:6.5,d:7.1,h:9.4,color:0xdbb27b,shop:'FARMACIA'},
 {x:58,z:-11,w:6.2,d:7.6,h:10.1,color:0xc8a08a,shop:'OSTERIA'},
 {x:64.6,z:-11.6,w:6.6,d:7,h:8.2,color:0xd8cba4,shop:'PESCHERIA'},
 {x:71,z:-11.2,w:5.6,d:7.4,h:9.3,color:0xd29a73,shop:'BOTTEGA'}
];
const occluders=[{x:69.5,z:11,w:11.6,d:8.2,h:4.2}];                // the water gate: counts for the camera pull-in like a building, but gets no facade
/* height of the walking surface: the bridge hump, flat everywhere else */
function heightAt(x,z){if(Math.abs(x-BR.x)>BR.width/2||z<=BR.zc-BR.half||z>=BR.zc+BR.half)return 0;const t=(z-(BR.zc-BR.half))/(2*BR.half);return 4*BR.hump*t*(1-t)}

function build(c){
 const {T,scene,root,A,box,cylinder,collision,mat,surface,edge,planter,tree,bench,cafe,lamp,boat,hillY,roofmat}=c;
 const stoneM=A.material(0xe9dcc2,'paving',3.2),bricks=A.material(0xd9c5b3,'brick',2.6),capM=A.material(0xe6dcc3,'stone',3),plasterM=A.material(0xd9c9a4,'plaster',8),woodM=mat(0x8f7654);
 const g0=BR.x-BR.width/2-.8,g1=BR.x+BR.width/2+.8;           // curb gap at the bridge

 /* ---- ground, plinths, canal bed */
 surface(54,24,48,-4,stoneM);surface(54,14,48,21,stoneM);
 box(54,1.3,24,48,-.72,-4,0x747c77);box(54,1.3,14,48,-.72,21,0x747c77);box(5,1.3,6,72.5,-.72,11,0x747c77);
 const bed=new T.Mesh(new T.PlaneGeometry(49,6),A.material(0x8a8160,'paving',3));bed.rotation.x=-Math.PI/2;bed.position.set(45.5,BED,11);bed.receiveShadow=true;root.add(bed);

 /* ---- quay edges: curbs with collision, dressed stone below, mooring bollards */
 edge((21+g0)/2,7.8,g0-21,.45);edge((g1+X1)/2,7.8,X1-g1,.45);edge((21+g0)/2,14.2,g0-21,.45);edge((g1+X1)/2,14.2,X1-g1,.45);   // both banks of the canal
 edge(21.2,21,.45,14);edge(48,27.8,54,.45);edge(X1-.2,-4,.45,24);edge(X1-.2,21,.45,14);edge(21,10,.45,4);                       // west / south / east rims, east pier tip
 for(let x=22;x<X1;x+=2){if(x>g0-1&&x<g1+1)continue;box(1.94,.48,.06,x,-.40,8.04,0x939b89);box(1.94,.48,.06,x,-.40,13.96,0x939b89)}
 for(let x=22;x<X1;x+=2)box(1.94,.48,.06,x,-.40,28.04,0x939b89);
 for(let z=14;z<28;z+=2)box(.06,.48,1.94,20.96,-.40,z+1,0x939b89);
 for(let z=-16;z<8;z+=2)box(.06,.48,1.94,X1+.04,-.40,z+1,0x939b89);
 for(const x of [24,31,39,49,57,66]){for(const z of [7.25,14.75]){cylinder(.14,.19,.55,x,.29,z,0x273e41);box(.52,.13,.16,x,.55,z,0x273e41)}}

 /* ---- the bridge: stone arch with the notch cut from the bed up, parapets that follow the hump */
 function arch({x,cz,half,top,arcR,arcY,width,hump,material}){
  const a0=Math.asin(T.MathUtils.clamp((BED-arcY)/arcR,-1,1)),x0=arcR*Math.cos(a0),s=new T.Shape();
  s.moveTo(-half,BED);s.lineTo(-x0,BED);s.absarc(0,arcY,arcR,Math.PI-a0,a0,true);s.lineTo(half,BED);s.lineTo(half,top);
  if(hump)s.quadraticCurveTo(0,top+hump*2,-half,top);else s.lineTo(-half,top);s.closePath();
  const geo=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:false,curveSegments:24});geo.translate(0,0,-width/2);geo.rotateY(Math.PI/2);
  const m=new T.Mesh(geo,material);m.position.set(x,0,cz);m.castShadow=m.receiveShadow=true;root.add(m);return m}
 arch({x:BR.x,cz:BR.zc,half:BR.half,top:.02,arcR:2.7,arcY:-2.25,width:BR.width,hump:BR.hump,material:bricks});
 for(const xo of [BR.width/2-.12,-(BR.width/2-.12)]){
  const pts=[];for(let i=0;i<=18;i++){const t=i/18;pts.push([-BR.half+t*2*BR.half,4*BR.hump*t*(1-t)+.02])}
  const s=new T.Shape();s.moveTo(pts[0][0],pts[0][1]-.05);pts.forEach(p=>s.lineTo(p[0],p[1]+.5));for(let i=pts.length-1;i>=0;i--)s.lineTo(pts[i][0],pts[i][1]-.05);
  const geo=new T.ExtrudeGeometry(s,{depth:.24,bevelEnabled:false});geo.translate(0,0,-.12);geo.rotateY(Math.PI/2);
  const m=new T.Mesh(geo,capM);m.position.set(BR.x+xo,0,BR.zc);m.castShadow=m.receiveShadow=true;root.add(m)}

 /* ---- the water gate: the canal runs into the town under a stone gatehouse */
 // Kept low (no roof) on purpose: it stands between the default camera and the east end of the north bank.
 arch({x:67,cz:11,half:3.6,top:3,arcR:3.2,arcY:-1.75,width:6,material:bricks});
 box(5,3,7.2,72.5,1.5,11,plasterM);
 {const s=new T.Shape();s.moveTo(-4.1,0);s.lineTo(4.1,0);s.lineTo(0,1.15);s.closePath();                       // low gable, ridge along the canal
  const geo=new T.ExtrudeGeometry(s,{depth:11.8,bevelEnabled:false});geo.translate(0,0,-5.9);geo.rotateY(Math.PI/2);
  const m=new T.Mesh(geo,[capM,roofmat]);m.position.set(69.5,3,11);m.castShadow=true;root.add(m)}
 {const dark=new T.Mesh(new T.PlaneGeometry(6.2,3.4),new T.MeshBasicMaterial({color:0x0b0d10}));dark.rotation.y=-Math.PI/2;dark.position.set(69.9,-.2,11);root.add(dark)}

 /* ---- north bank: a second piazza with a fountain on the bridge's axis */
 {const fx=BR.x,fz=-2,rim=A.material(0xe2d8bf,'stone',2.6),water=new T.MeshStandardMaterial({color:0x2f7f98,roughness:.25,emissive:0x0c2a36,emissiveIntensity:.25});
  const body=new T.Mesh(new T.CylinderGeometry(2.2,2.3,.45,32),rim);body.position.set(fx,.22,fz);body.castShadow=body.receiveShadow=true;root.add(body);
  const ring=new T.Mesh(new T.TorusGeometry(2.22,.22,8,40),rim);ring.rotation.x=Math.PI/2;ring.position.set(fx,.5,fz);ring.castShadow=ring.receiveShadow=true;root.add(ring);
  const pool=new T.Mesh(new T.CircleGeometry(2.1,32),water);pool.rotation.x=-Math.PI/2;pool.position.set(fx,.47,fz);root.add(pool);
  const stem=new T.Mesh(new T.CylinderGeometry(.4,.55,1.3,12),rim);stem.position.set(fx,1.05,fz);stem.castShadow=true;root.add(stem);
  const bowl=new T.Mesh(new T.CylinderGeometry(1.0,.5,.3,20),rim);bowl.position.set(fx,1.8,fz);bowl.castShadow=true;root.add(bowl);
  const bowlWater=new T.Mesh(new T.CircleGeometry(.88,20),water);bowlWater.rotation.x=-Math.PI/2;bowlWater.position.set(fx,1.96,fz);root.add(bowlWater);
  const spout=new T.Mesh(new T.ConeGeometry(.17,.55,8),rim);spout.position.set(fx,2.2,fz);root.add(spout);
  collision(fx,fz,4.9,4.9)}
 function parasol(x,z){cylinder(.045,.06,2.9,x,1.45,z,0x998970);const p=new T.Mesh(new T.ConeGeometry(1.8,.5,8),mat(0xf1dfb4));p.position.set(x,2.96,z);p.castShadow=true;root.add(p)}
 cafe(32.4,-4.9);cafe(35.8,-4.9);parasol(32.4,-4.9);cafe(56.8,-4.9);cafe(60.2,-4.9);parasol(60.2,-4.9);
 bench(31,5.4);bench(36.5,5.4);bench(51.5,5.4);bench(58,5.4);
 for(const [x,z] of [[24,-6.4],[38.6,-6.4],[50.8,-6.4],[65.6,-6.4],[27.5,3.2],[62.5,3.2]])planter(x,z);
 tree(23.6,1.2,.8);tree(71.5,1.4,.8);tree(37.6,1.8,.7);tree(50.4,1.8,.7);

 /* ---- lamps along both banks, two strings of bunting across the canal */
 for(const x of [27,36,41,47,56,63])lamp(x,7.2);
 for(const x of [27,36,56,63])lamp(x,14.8);
 lamp(31,22);lamp(58,22);
 function bunting(x,z0,z1){const N=22,P=i=>{const t=i/N;return [x,3.4-Math.sin(Math.PI*t)*1,z0+(z1-z0)*t]},cols=[[.75,.22,.17],[.96,.94,.88],[.18,.55,.34],[.95,.78,.29]],pos=[],col=[],line=[];
  for(let i=0;i<=N;i++)line.push(new T.Vector3(...P(i)));root.add(new T.Line(new T.BufferGeometry().setFromPoints(line),new T.LineBasicMaterial({color:0x2b2722})));
  for(let i=1;i<N;i++){const [px,py,pz]=P(i),cc=cols[i%4];pos.push(px,py,pz-.17,px,py,pz+.17,px,py-.38,pz);col.push(...cc,...cc,...cc)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();
  root.add(new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide})))}
 bunting(36,7.2,14.8);bunting(56,7.2,14.8);
 boat(33,11,0xb96758,Math.PI/2+.05,1.3);boat(56.5,11.1,0x8daebd,Math.PI/2-.07,2.6);boat(26.5,10.7,0xc3e0d2,Math.PI/2+.12,4.1);

 /* ---- south bank: market stalls, crates, planters */
 function stall(x,z,awn){box(2.6,.85,1.1,x,.43,z,woodM);for(const sx of [-1.25,1.25])box(.08,2.5,.08,x+sx,1.25,z-.45,0x6a5a42);
  for(let i=0;i<8;i++){const a=box(.33,.06,1.7,x-1.15+i*.33,2.5,z-.1,i%2?0xede0bc:awn);a.rotation.x=.16}
  for(let i=0;i<4;i++)box(.5,.2,.4,x-.95+i*.62,.95,z,[0xe09a3a,0xd8c23a,0x6f9a45,0xc4513a][i]);collision(x,z,2.8,1.4)}
 stall(48.5,20.6,0x557c68);stall(53.6,20.6,0xb4503c);stall(62,20.4,0x557c68);
 for(const [x,z] of [[33,17],[33.9,17.15],[33.45,17.1]])box(.7,.6,.6,x,.3+(x===33.45?.6:0),z,0x9b7348);collision(33.5,17.1,1.8,.8);
 for(const x of [24,31,38,45,52,59,66])planter(x,16.8);
 tree(23.8,26,.8);tree(72.2,26,.8);

 /* ---- more of the hillside town behind the east end (own random stream: the original layout stays untouched) */
 let s=4242;const r2=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296},dc=[0xbd9c82,0xcbab83,0xbb897d,0xc7bb9d,0xc59c75];
 for(let row=0;row<4;row++)for(let i=12;i<19;i++){const x=-50+i*9+(row%2)*3,z=-24-row*12-r2()*3,y=hillY(x,z),w=4+r2()*3,h=3+r2()*4;
  box(w,h,5,x,y+h/2,z,dc[i%5]);box(w+.5,.25,5.5,x,y+h,z,roofmat);for(let f=0;f<2;f++)for(let k=0;k<3;k++)box(.46,.8,.06,x+(k-1)*w*.25,y+1.2+f*2,z+2.53,0x5c7063)}
 for(let i=0;i<18;i++){const x=56+r2()*58,z=-22-r2()*48,y=hillY(x,z),m=new T.Mesh(new T.ConeGeometry(.6+r2()*.35,3+r2()*2,7),mat(0x426b51));m.position.set(x,y+1.8,z);root.add(m)}
}
window.CoastCanal={BRIDGE:BR,LEVEL,quays,walkable,buildings,occluders,heightAt,build};
})();
