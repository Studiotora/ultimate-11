/* Original procedural Ligurian story environment for Ultimate Eleven, Three r128.
 * Lumina-inspired seeded art, fixed light count and shared map/collision data.
 * No Lumina code or engine dependencies are copied into the game. */
(()=>{'use strict';
window.createGenovaCoast=function(T,scene){
 const root=new T.Group();root.name='Borgo_del_Mare';scene.add(root);
 const colliders=[],boats=[],lights=[],glows=[],gulls=[];
 let seed=711;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const A=CoastArt,materials=new Map(),batches=new Map();
 function mat(color){const key=String(color);if(!materials.has(key)){const kind=[0x977954,0x8f7654,0x70624b,0x998970].includes(color)?'wood':'stone';materials.set(key,A.material(color,kind,kind==='wood'?2:3));}return materials.get(key)}
 function box(w,h,d,x,y,z,color,rotate=0){const material=typeof color==='object'?color:mat(color);const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.y=rotate;m.castShadow=m.receiveShadow=true;root.add(m);return m}
 function collision(x,z,w,d){colliders.push({x,z,w,d})}
 function cylinder(r1,r2,h,x,y,z,color,n=10){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,n),mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m}
 const plaster=A.textures.plaster,paving=A.textures.paving,rooftex=A.textures.roof,grassTex=A.textures.grass;
 const stone=A.material(0xe9dcc2,'paving',3.2),roofmat=A.material(0xffffff,'roof',3.2);
 function surface(w,d,x,z,m,y=.02){const mesh=box(w,.12,d,x,y-.06,z,m);const uv=mesh.geometry.attributes.uv;mesh.userData.keepUV=true;for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*w/3,uv.getY(i)*d/3)}return mesh}
 // Compact 42 x 36 m footprint. All playable surfaces use the same walkable rectangles.
 const walkable=[{x:0,z:-4,w:42,d:24},{x:-15.5,z:13,w:11,d:10},{x:15.5,z:10,w:11,d:4}];
 walkable.push(...CoastCanal.walkable);                  // canal district, appended so the pier rectangles keep their indices
 surface(42,24,0,-4,stone);surface(11,10,-15.5,13,stone);surface(11,4,15.5,10,stone);
 box(42,1.3,24,0,-.72,-4,0x747c77);box(11,1.3,10,-15.5,-.72,13,0x747c77);box(11,1.3,4,15.5,-.72,10,0x747c77);
 // Quay edges, stones, ladder and mooring bollards.
 function edge(x,z,w,d){box(w,.28,d,x,.07,z,0xe2d6b7);collision(x,z,w,d)}
 edge(0,8,20,.45);edge(-10,13,.45,10);edge(-15.5,18,11,.45);edge(15.5,12,11,.45);edge(10,10,.45,4);   // the east rim at x=21 is gone: the promenade now carries on into the canal district (canal.js)
 for(let x=-20;x<=20;x+=2){box(1.94,.48,.06,x,-.40,8.04,0x939b89)}
 for(const [x,z] of [[-9,7.25],[-2,7.25],[5,7.25],[11,11.2],[19,11.2],[-10.9,12],[-15,17.2]]){cylinder(.14,.19,.55,x,.29,z,0x273e41);box(.52,.13,.16,x,.55,z,0x273e41)}
 // Grass terrace, cypress garden and tiled path. Grass stays walkable.
 const grass=A.material(0xe0e4bb,'grass',3);surface(8.2,7.5,16,-1,grass,.10);
 for(const x of [11.7,20.3])box(.2,.23,7.8,x,.12,-1,0xd1c4a7);
 for(const z of [-4.85,2.85])box(8.7,.23,.2,16,.12,z,0xd1c4a7);
 surface(2.1,7.8,16,-1,stone,.14);
 function tree(x,z,scale=1){cylinder(.09,.20,3.3*scale,x,1.65*scale,z,0x70624b);for(let i=0;i<5;i++){const angle=i*2.4;A.cluster(root,x+Math.cos(angle)*.6*scale,(2.7+i*.17)*scale,z+Math.sin(angle)*.5*scale,(1.1-i*.07)*scale)}collision(x,z,.55,.55)}

 tree(12.8,-3.2,.85);tree(19,-2.4,.85);tree(19,1.7,.7);tree(-19,14,.7);
 function planter(x,z){cylinder(.34,.26,.48,x,.24,z,0xb87858);A.cluster(root,x,.78,z,.45);A.cluster(root,x,.87,z,.33,true);collision(x,z,.55,.55)}

 // The neighbourhood continues uphill beyond the playable streets.
 const hillGeometry=new T.PlaneGeometry(240,170,40,30);hillGeometry.rotateX(-Math.PI/2);hillGeometry.translate(0,0,-101);
 const hp=hillGeometry.attributes.position;const hillY=(x,z)=>Math.max(0,(-z-17)*.16)+(Math.sin(x*.075)+Math.sin(z*.1)) * Math.min(2.5,Math.max(0,(-z-17)*.12));
 for(let i=0;i<hp.count;i++)hp.setY(i,hillY(hp.getX(i),hp.getZ(i))-.25);hillGeometry.computeVertexNormals();
 const hill=new T.Mesh(hillGeometry,mat(0x7c9270));hill.receiveShadow=true;root.add(hill);
 const distantColors=[0xbd9c82,0xcbab83,0xbb897d,0xc7bb9d,0xc59c75];
 for(let row=0;row<4;row++)for(let i=0;i<12;i++){const x=-50+i*9+(row%2)*3,z=-24-row*12-rnd()*3,y=hillY(x,z),w=4+rnd()*3,h=3+rnd()*4;box(w,h,5,x,y+h/2,z,distantColors[i%5]);box(w+.5,.25,5.5,x,y+h,z,roofmat);for(let f=0;f<2;f++)for(let k=0;k<3;k++)box(.46,.8,.06,x+(k-1)*w*.25,y+1.2+f*2,z+2.53,0x5c7063);}
 for(let i=0;i<32;i++){const x=-48+rnd()*104,z=-22-rnd()*48,y=hillY(x,z);const m=new T.Mesh(new T.ConeGeometry(.6+rnd()*.35,3+rnd()*2,7),mat(0x426b51));m.position.set(x,y+1.8,z);root.add(m)}
 function sign(text,x,y,z,w,color='#28464c',ink='#f4e9ce'){
  const c=document.createElement('canvas');c.width=512;c.height=96;const p=c.getContext('2d');p.fillStyle=color;p.fillRect(0,0,512,96);p.strokeStyle=ink;p.lineWidth=2;p.strokeRect(8,8,496,80);p.fillStyle=ink;p.font='600 37px Cinzel, serif';p.textAlign='center';p.textBaseline='middle';p.fillText(text,256,51,475);
  const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;const m=new T.Mesh(new T.PlaneGeometry(w,w*96/512),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);root.add(m);return m;
 }
 function building({x,z,w,d,h,color,shop,balcony=true}){
  const stucco=A.material(color,'plaster',8);box(w,h,d,x,h/2,z,stucco);collision(x,z,w+.12,d+.12);
  const front=z+d/2,cream=0xe8d7b5,shutter=A.material(0xcbd7bf,'shutter',1.7);
  box(w+.15,.5,d+.15,x,.28,z,0xa8a48e);box(w+.48,.22,d+.45,x,h-.03,z,cream);box(w+.28,.16,d+.25,x,h-.35,z,cream);
  // Low pitched terracotta roof, ridge and real overhangs.
  for(const side of [-1,1]){const r=box(w+.75,.18,(d+.65)/2/Math.cos(.26),x,h+.37,z+side*(d+.65)/4,roofmat);r.rotation.x=side*.26;}
  box(w+.75,.17,.23,x,h+.78,z,0xb26d4f);box(.48,.95,.52,x-w*.27,h+.72,z-.6,stucco);box(.67,.17,.69,x-w*.27,h+1.22,z-.6,cream);
  const floors=Math.floor((h-1)/2.2),cols=Math.max(2,Math.floor(w/1.9));
  for(let f=0;f<floors;f++){const y=2.8+f*2.05;if(y+1>h-.3)continue;box(w+.08,.08,d+.08,x,y-1,z,cream);
   for(let k=0;k<cols;k++){const wx=x+(k-(cols-1)/2)*(w/(cols+.25));
    box(.84,1.34,.12,wx,y,front+.07,cream);box(.63,1.1,.1,wx,y,front+.15,CoastArt.windowGlass(wx,y,front));box(.05,1.12,.04,wx,y,front+.22,cream);
    for(const s of [-1,1]){box(.33,1.24,.09,wx+s*.57,y,front+.15,shutter);for(let l=0;l<6;l++)box(.29,.045,.035,wx+s*.57,y-.48+l*.19,front+.21,0x5b7864)}
    box(1.08,.11,.31,wx,y-.71,front+.15,cream);
    if(balcony&&f===0&&k===1){box(1.7,.16,.88,wx,y-.79,front+.45,cream);box(1.7,.06,.05,wx,y-.05,front+.88,0x384a48);for(let b=0;b<9;b++)box(.025,.72,.025,wx-.8+b*.2,y-.42,front+.88,0x384a48);for(const s of [-1,1])box(.035,.72,.84,wx+s*.82,y-.42,front+.47,new T.MeshStandardMaterial({color:0x354a46,wireframe:true}));}
   }
  }
  // Both side elevations have shutters, including the sun-facing eastern wall.
  for(const s of [-1,1])for(let f=0;f<floors;f++){const y=2.8+f*2.05;if(y+1>h-.3)continue;for(let j=0;j<2;j++){const wz=z+(j-.5)*d*.5;box(.1,1.25,.8,x+s*(w/2+.07),y,wz,cream);box(.12,1.07,.59,x+s*(w/2+.13),y,wz,CoastArt.windowGlass(x+s*(w/2+.13),y,wz));for(const a of [-1,1])box(.1,1.21,.31,x+s*(w/2+.16),y,wz+a*.55,shutter)}}
  box(1.1,1.9,.15,x,.97,front+.12,cream);box(.88,1.76,.19,x,.90,front+.2,0x425950);box(.06,.12,.04,x+.28,.86,front+.31,0xc5b379);
  if(shop){sign(shop,x,2.15,front+.28,w*.84);const count=10;for(let i=0;i<count;i++){const aw=box(w*.9/count,.06,1.4,x-w*.45+w*.9/count*(i+.5),1.89,front+.76,i%2?0xede0bc:0x557c68);aw.rotation.x=.16;box(w*.9/count,.23,.06,aw.position.x,1.65,front+1.46,i%2?0xede0bc:0x557c68)}}
  // Small modern details: drainpipe and compact air-conditioning unit.
  cylinder(.045,.045,h-.4,x+w/2-.14,(h-.4)/2,front+.22,0x746f5d,6);box(.8,.44,.30,x-w*.32,2,front+.23,0xc4c7b9);
 }
 const buildings=[
 {x:-16.4,z:-10.7,w:6.5,d:7.6,h:10.3,color:0xd6936a,shop:'ALIMENTARI'},
 {x:-10.2,z:-11.8,w:5.7,d:7.1,h:8.6,color:0xd9b871,shop:'CASA DEL MARE'},
 {x:-4.3,z:-10.9,w:5.7,d:7.8,h:11,color:0xc9786b,shop:'FOCACCERIA'},
 {x:1.7,z:-11.8,w:5.9,d:7,h:9.4,color:0xe4c78c,shop:'TABACCHI'},
 {x:8,z:-11.2,w:6.2,d:7.2,h:10.5,color:0xde9a7b,shop:'GELATERIA'},
 {x:15.3,z:-11.7,w:7,d:7,h:8.3,color:0xd9d0ad,shop:'PENSIONE AURORA'},
 {x:-17.6,z:-1.7,w:5.7,d:6.1,h:7.2,color:0xc78973,shop:'BAR DEL PORTO'},
 {x:-17.8,z:7,w:5.3,d:5.2,h:6.1,color:0xe2b776,shop:'PESCATORI',balcony:false},
 ...CoastCanal.buildings
 ];buildings.forEach(building);
 addCoastDetails(T,root,buildings,box,cylinder,collision);
 // Connected alleys, centre piazza and a rose-compass inlay.
 const disc=new T.Mesh(new T.CircleGeometry(2.5,48),mat(0xd6cbb0));disc.rotation.x=-Math.PI/2;disc.position.set(0,.094,0);disc.receiveShadow=true;root.add(disc);
 for(let i=0;i<8;i++){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(-.22,.6);sh.lineTo(0,2.18);sh.lineTo(.22,.6);sh.closePath();const m=new T.Mesh(new T.ShapeGeometry(sh),mat(i%2?0xaaa993:0x697f79));m.rotation.set(-Math.PI/2,0,i*Math.PI/4);m.position.set(0,.1,0);root.add(m)}
 function bench(x,z,rot=0){const g=new T.Group();const parts=[];const add=(w,h,d,px,py,pz,c)=>{const m=box(w,h,d,px,py,pz,c);root.remove(m);g.add(m)};for(let i=0;i<4;i++){add(2,.10,.14,0,.48,-.25+i*.16,0x977954);add(2,.13,.09,0,.82+i*.13,-.39,0x977954)}for(const s of [-1,1]){add(.1,.53,.65,s*.72,.25,0,0x37494a);add(.1,.83,.09,s*.72,.71,-.39,0x37494a)}g.position.set(x,0,z);g.rotation.y=rot;root.add(g);collision(x,z,rot?1:2,rot?2:1)}
 bench(4.9,6.4);bench(18.6,4.3);bench(-18,14.8,Math.PI/2);
 function cafe(x,z){cylinder(.66,.66,.09,x,.84,z,0xe4d9bc,18);cylinder(.06,.08,.81,x,.4,z,0x3c4e48);for(const s of [-1,1]){box(.57,.09,.56,x+s*1.02,.46,z,0x4c7469);box(.57,.5,.07,x+s*1.02,.72,z-.25,0x4c7469);for(const a of [-1,1])box(.055,.48,.48,x+s*1.02+a*.22,.24,z,0x3c4e48)}collision(x,z,2.7,1.2)}
 cafe(-10.4,-3.3);cafe(-7.1,-3.3);cafe(-11,1.1);
 cylinder(.045,.06,2.9,-10.4,1.45,-3.3,0x998970);const parasol=new T.Mesh(new T.ConeGeometry(1.8,.5,8),mat(0xf1dfb4));parasol.position.set(-10.4,2.96,-3.3);parasol.castShadow=true;root.add(parasol);
 for(const [x,z] of [[-13,-5.8],[-1.1,-6.3],[5.2,-6.4],[11.3,-6.5],[-13,3.2],[9.4,2.4]])planter(x,z);
 // Night lamps: besides the point light, each lamp throws a warm additive pool on the quay and wears a halo at the bulb, so it visibly lights its own patch of stone.
 const poolTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,208,130,1)');r.addColorStop(.3,'rgba(255,176,92,.62)');r.addColorStop(.62,'rgba(255,146,70,.2)');r.addColorStop(1,'rgba(255,120,60,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;return tx})();
 const pools=[];
 // The map has more lamps than a forward renderer should light: seven real point lights follow the lamps nearest the camera focus (see assignLights); every lamp keeps its pool and halo.
 const bulb=new T.MeshStandardMaterial({color:0xf7de96,emissive:0xffbd60,emissiveIntensity:.4});glows.push(bulb);
 const lampSpots=[],slots=[];for(let i=0;i<7;i++){const l=new T.PointLight(0xffb866,0,10,1.9);l.position.set(0,3.3,0);scene.add(l);lights.push(l);slots.push({l,spot:null,k:0})}
 function assignLights(focus,night,dt){const fx=focus?focus.x:0,fz=focus?focus.z:0;
  const want=lampSpots.map(s=>({s,d:(s.x-fx)*(s.x-fx)+(s.z-fz)*(s.z-fz)})).sort((a,b)=>a.d-b.d).slice(0,slots.length).map(o=>o.s),set=new Set(want);
  for(const sl of slots){if(!sl.spot)continue;if(set.has(sl.spot))sl.k=Math.min(1,sl.k+dt*3);else{sl.k=Math.max(0,sl.k-dt*3);if(sl.k===0)sl.spot=null}}
  const held=new Set(slots.map(s=>s.spot).filter(Boolean));
  for(const sp of want){if(held.has(sp))continue;const free=slots.find(s=>!s.spot);if(free){free.spot=sp;free.k=0;held.add(sp)}}
  for(const sl of slots){if(sl.spot){sl.l.position.set(sl.spot.x,3.3,sl.spot.z);sl.l.intensity=night*2.6*sl.k}else sl.l.intensity=0}}
 function lamp(x,z){cylinder(.05,.11,3.5,x,1.75,z,0x354c4b);box(.50,.1,.50,x,3.32,z,0x354c4b);box(.28,.48,.28,x,3.55,z,bulb);box(.54,.13,.54,x,3.84,z,0x354c4b);lampSpots.push({x,z});collision(x,z,.3,.3);
  const pool=new T.Mesh(new T.PlaneGeometry(6.4,6.4),new T.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));pool.rotation.x=-Math.PI/2;pool.position.set(x,.13,z);pool.renderOrder=2;root.add(pool);
  const halo=new T.Sprite(new T.SpriteMaterial({map:poolTex,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));halo.scale.set(2.8,2.8,1);halo.position.set(x,3.55,z);halo.renderOrder=3;root.add(halo);
  pools.push({pool,halo,phase:x*1.7+z})}
 [[-12.3,5.8],[-5.3,5.8],[7.8,5.8],[19.5,10.8],[-19.5,16.5],[-11.8,-5.4],[11,-5.7]].forEach(v=>lamp(...v));
 // Painted scooters and a bicycle imply a present-day neighbourhood.
 function scooter(x,z,color){for(const dz of [-.55,.55]){const m=new T.Mesh(new T.TorusGeometry(.27,.07,6,14),mat(0x374143));m.rotation.y=Math.PI/2;m.position.set(x,.29,z+dz);root.add(m)}box(.38,.55,.62,x,.64,z,color);box(.5,.13,.57,x,.95,z-.18,0x3b4543);box(.35,.7,.12,x,.78,z+.48,color);box(.72,.07,.1,x,1.16,z+.47,0x9bafa8);collision(x,z,.8,1.6)}
 scooter(5.5,-6.4,0x87b9b4);scooter(-12.8,-4.3,0xd3b883);
 // Laundry between buildings, kept above the walking corridor.
 const wire=new T.BufferGeometry().setFromPoints([new T.Vector3(-14,5.4,-5.5),new T.Vector3(-7.6,5.1,-6.1)]);root.add(new T.Line(wire,new T.LineBasicMaterial({color:0x676f61})));
 for(let i=0;i<5;i++)box(.55,.75,.025,-13.2+i*1.05,4.91-i*.035,-5.57-i*.08,[0xe2e2cb,0x8faeb0,0xce937e,0xf2dbb7,0x526c8c][i]);
 // Rope fence along garden edge; the shore collision is independently continuous.
 for(let x=11;x<21;x+=1.5)cylinder(.055,.055,.8,x,.42,11.8,0xb9af8b,6);
 for(const y of [.4,.76])box(9.5,.035,.035,15.8,y,11.8,0xdecfae);
 function boat(x,z,color,angle,phase=rnd()*6){const g=new T.Group();const hull=new T.Mesh(new T.SphereGeometry(1,12,8),mat(color));hull.scale.set(.68,.4,1.6);hull.position.y=-.1;g.add(hull);const inner=new T.Mesh(new T.SphereGeometry(1,12,8),mat(0xe1d8b2));inner.scale.set(.59,.14,1.4);inner.position.y=.12;g.add(inner);for(const bz of [-.65,.2,.75]){const b=new T.Mesh(new T.BoxGeometry(1,.09,.2),mat(0x8f7654));b.position.set(0,.25,bz);g.add(b)}g.position.set(x,-.5,z);g.rotation.y=angle;scene.add(g);boats.push({g,x,z,phase});return g}
 boat(-7.4,10,0xc3e0d2,.4);boat(2.3,10.4,0x8daebd,-.4);boat(12.5,14.3,0xb96758,.2);
 for(const [x,z] of [[-7.4,10],[2.3,10.4]]){const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(x,0,7.6),new T.Vector3(x-.3,-.2,z-.8)]);scene.add(new T.Line(geo,new T.LineBasicMaterial({color:0xc1b38b})))}
 // The canal district (canal.js) is built here, after the shared helpers exist and before the sea mask is made, so its boats get ripples.
 CoastCanal.build({T,scene,root,A,box,cylinder,collision,mat,surface,edge,planter,tree,bench,cafe,lamp,boat,hillY,roofmat});
 const rocks=[];   // the rock islets now sit east of the canal district
 for(let i=0;i<28;i++){const x=82+rnd()*8,z=-6+rnd()*22,r=.4+rnd()*.7;const rock=new T.Mesh(new T.DodecahedronGeometry(r,0),mat(i%2?0x8c998d:0xb0ad94));rock.position.set(x,-.45,z);rock.scale.y=.7;rock.rotation.set(rnd(),rnd(),rnd());root.add(rock);rocks.push({x,z,r:r*.8})}
 // Created after the boats and rocks so the shore mask can include the islets and the boats get ripples.
 const sea=createCoastWater(T,scene,{boats,rocks}),water=sea.mesh;
 for(let i=0;i<5;i++){const g=new T.Group();for(const s of [-1,1]){const m=new T.Mesh(new T.BoxGeometry(.52,.04,.14),mat(0xf3e5cd));m.position.x=s*.24;m.rotation.z=s*.25;g.add(m)}scene.add(g);gulls.push({g,phase:i*1.9})}
 // Batch boxes and alpha-tested pixel foliage without throwing away texture density.
 root.updateMatrixWorld(true);const staticMeshes=[];root.traverse(o=>{if(o.isMesh&&['BoxGeometry','PlaneGeometry'].includes(o.geometry.type)&&!o.material.wireframe&&!o.userData.keepUV)staticMeshes.push(o)});
 for(const m of staticMeshes){const key=m.material.uuid+':'+m.geometry.type;let group=batches.get(key);if(!group)batches.set(key,group={material:m.material,type:m.geometry.type,list:[]});group.list.push(m)}
 for(const {material,type,list} of batches.values()){if(list.length<3)continue;const unit=type==='BoxGeometry'?new T.BoxGeometry(1,1,1):new T.PlaneGeometry(1,1),inst=new T.InstancedMesh(unit,material,list.length);const scale=new T.Matrix4();list.forEach((m,i)=>{const p=m.geometry.parameters;scale.makeScale(p.width,p.height,p.depth||1);inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(m.matrixWorld,scale));m.parent.remove(m);m.geometry.dispose()});inst.castShadow=inst.receiveShadow=true;inst.frustumCulled=false;scene.add(inst)}
 function canWalk(x,z,r=.32){const inside=walkable.some(a=>x>=a.x-a.w/2+r&&x<=a.x+a.w/2-r&&z>=a.z-a.d/2+r&&z<=a.z+a.d/2-r);if(!inside)return false;return !colliders.some(a=>x>a.x-a.w/2-r&&x<a.x+a.w/2+r&&z>a.z-a.d/2-r&&z<a.z+a.d/2+r)}
 // Connected rectangles overlap slightly at the two quay joins to accommodate the actor radius.
 walkable[1].d=10.8;walkable[1].z=12.6;walkable[2].d=4.8;walkable[2].z=9.6;
 let lastT=null;
 return {root,colliders,walkable,buildings:buildings.concat(CoastCanal.occluders),canWalk,lights,water,sea,heightAt:CoastCanal.heightAt,update(t,night,focus){const dt=Math.min(.1,Math.max(0,t-(lastT??t)));lastT=t;sea.update(t,night);A.glass.emissiveIntensity=night*.03;A.glassLit.emissiveIntensity=night*1.0;assignLights(focus,night,dt);glows.forEach(m=>m.emissiveIntensity=.2+night*2.6);pools.forEach(p=>{const f=1+.035*Math.sin(t*5+p.phase)+.02*Math.sin(t*13+p.phase*2);p.pool.material.opacity=night*.16*f;p.halo.material.opacity=night*.45*f});boats.forEach(({g,x,z,phase})=>{g.position.y=-.48+Math.sin(t*1.2+phase)*.045;g.rotation.z=Math.sin(t*.8+phase)*.025});gulls.forEach(({g,phase})=>{g.position.set(Math.sin(t*.08+phase)*22,13+Math.sin(t*.2+phase),Math.cos(t*.08+phase)*14);g.rotation.y=-t*.08-phase})}};
};
})();





