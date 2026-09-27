/* Santa Fede HD-2D environment. Native match/camera coordinates are untouched.
 * Bitmap originals and prompts live in assets/stadiums/santa-fede/.
 */
(function(){'use strict';
const moduleURL=document.currentScript.src;
const sources={};let active=null;
for(const [key,file] of Object.entries({materials:'material-atlas-v1.png',details:'detail-atlas-v1.png',foliage:'foliage-atlas-v1.png',court:'court-surfaces-v1.png',spectators:'spectators-chibi-v1.png'})){
  const image=new Image(),source=sources[key]={image,state:'loading'};
  source.promise=new Promise(resolve=>{
    image.onload=()=>{source.state='ready';resolve(image)};
    image.onerror=()=>{source.state='failed';console.warn('[Santa Fede] Texture unavailable:',file);resolve(null)};
  });
  image.src=new URL('assets/stadiums/santa-fede/'+file,moduleURL).href;
}
function build(T,parent,nativeL,nativeW){
  const k=nativeL/70,across=nativeW/k,length=nativeL/k,halfA=across/2,halfL=length/2;
  const root=new T.Group();root.name='Santa Fede authored environment';root.rotation.y=-Math.PI/2;root.scale.setScalar(k);parent.add(root);
  const materials=new Map(),windows=[],lamps=[],practicals=[],glows=[];
  const balconySpots=[],spectatorSpots=[];
  const counts={spectators:0,spectatorZones:{north:0,balcony:0,gap:0,fence:0},arches:0,balconies:0,lanterns:0,foliageCards:0,trees:0,treeShadowCards:0};
  function atlas(key,index,tiled,fallback,region=null){
    const c=document.createElement('canvas');c.width=c.height=key==='foliage'?128:256;
    const cx=c.getContext('2d');cx.fillStyle=fallback;cx.fillRect(0,0,c.width,c.height);
    const texture=new T.CanvasTexture(c);texture.userData={disposed:false,ready:false};texture.encoding=T.sRGBEncoding;
    texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.anisotropy=8;
    texture.wrapS=texture.wrapT=tiled?T.MirroredRepeatWrapping:T.ClampToEdgeWrapping;
    texture.addEventListener('dispose',()=>texture.userData.disposed=true);
    function fill(image){if(!image||texture.userData.disposed)return;
      const w=image.naturalWidth/2,h=image.naturalHeight/2;
      cx.imageSmoothingEnabled=false;cx.clearRect(0,0,c.width,c.height);
      // Use only this quadrant, preserving the unmodified master atlas on disk.
      const rect=region?region.map((v,i)=>v*(i%2?image.naturalHeight:image.naturalWidth)):[(index%2)*w,Math.floor(index/2)*h,w,h];
      cx.drawImage(image,...rect,0,0,c.width,c.height);
      texture.userData.ready=true;texture.needsUpdate=true;
    }
    if(sources[key].state==='ready')fill(sources[key].image);else sources[key].promise.then(fill);
    return texture;
  }
  function material(name,color,map,tileSize=0){
    if(materials.has(name))return materials.get(name);
    const m=new T.MeshLambertMaterial({color,map:map||null});m.color.convertSRGBToLinear();
    m.userData.tileSize=tileSize;m.userData.sfDisplay=true;materials.set(name,m);return m;
  }
  const plaster=material('ivory lime plaster',0xffffff,atlas('materials',0,true,'#bfb09c'),10);
  const boundary=material('cool weathered boundary render',0xffffff,atlas('court',3,true,'#96988b',[.505,.505,.49,.49]),11.5);
  const house=material('salmon stucco',0xffffff,atlas('court',2,true,'#b98571',[.005,.505,.49,.49]),9);
  const stone=material('carved limestone',0xffffff,atlas('materials',1,true,'#9e9c88'),2.8);
  const roof=material('terracotta roofing',0xffffff,atlas('materials',2,true,'#a75e43'),2.8);
  const iron=material('aged green iron',0x43514b),dark=material('window recess',0x252c2b);
  const wood=material('carved walnut',0xffffff,atlas('details',1,false,'#64523a'));
  const shutters=material('worn shutter slats',0xffffff,atlas('details',2,false,'#3e5b4c'));
  const glassMap=atlas('details',0,false,'#4b686c'),windowMap=atlas('details',3,false,'#686b61');
  const pavement=material('pavement',0x89897c,atlas('materials',1,true,'#89897c'),3.8);
  function uvProject(g,m,x,y,z){
    const size=m.userData.tileSize;if(!size)return;
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),axis=nx>.5?'x':ny>.5?'y':'z';
      uv.setXY(i,(axis==='x'?p.getZ(i)+z:p.getX(i)+x)/size,(axis==='y'?p.getZ(i)+z:p.getY(i)+y)/size);
    }
  }
  function mesh(name,g,m,x=0,y=0,z=0,cast=true){
    const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;root.add(o);return o;
  }
  function box(name,x,y,z,w,h,d,m,cast=true){
    // Lambert evaluates light at vertices. A one-metre facade grid prevents
    // nearby window lights being interpolated across an entire 16 m wall.
    const facade=name.startsWith('residence varied street frontage');
    const g=new T.BoxGeometry(w,h,d,1,facade?Math.ceil(h):1,facade?Math.ceil(d):1);
    uvProject(g,m,x,y,z);return mesh(name,g,m,x,y,z,cast);
  }
  function rod(name,a,b,r=.035,m=iron){
    const pa=new T.Vector3(...a),pb=new T.Vector3(...b),v=pb.clone().sub(pa);
    const o=mesh(name,new T.CylinderGeometry(r,r,v.length(),8),m);
    o.position.copy(pa.add(pb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function sign(text,x,y,z,width,height,rotation=0){
    const c=document.createElement('canvas');c.width=512;c.height=96;const cx=c.getContext('2d');
    cx.fillStyle='#34463f';cx.fillRect(0,0,512,96);cx.strokeStyle='#b3a98b';cx.lineWidth=3;cx.strokeRect(7,7,498,82);
    cx.fillStyle='#e0d3ad';cx.font='bold 25px Georgia';cx.textAlign='center';cx.fillText(text,256,58);
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.magFilter=T.NearestFilter;
    const o=mesh('enamel sign '+text,new T.PlaneGeometry(width,height),new T.MeshLambertMaterial({map:t}),x,y,z,false);o.rotation.y=rotation;return o;
  }
  function archShape(w,straight){const sh=new T.Shape(),r=w/2;sh.moveTo(-r,0);sh.lineTo(r,0);sh.lineTo(r,straight);sh.absarc(0,straight,r,0,Math.PI,false);sh.closePath();return sh}
  function archRing(name,x,y,z,w,straight,border,rotation){
    const sh=archShape(w,straight),r=w/2-border,hole=new T.Path();
    hole.moveTo(-r,border);hole.lineTo(-r,straight);hole.absarc(0,straight,r,Math.PI,0,true);hole.lineTo(r,border);hole.closePath();sh.holes.push(hole);
    const g=new T.ExtrudeGeometry(sh,{depth:.24,bevelEnabled:true,bevelThickness:.025,bevelSize:.035,bevelSegments:1,curveSegments:10});
    const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2.8,p.getY(i)/2.8);
    const o=mesh(name,g,stone,x,y,z);o.rotation.y=rotation;counts.arches++;return o;
  }
  function archedPane(name,x,y,z,w,straight,map,lit,rotation){
    const g=new T.ShapeGeometry(archShape(w,straight),12),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/w+.5,p.getY(i)/(straight+w/2));
    const m=map?new T.MeshBasicMaterial({map,color:0xffffff}):dark;
    const o=mesh(name,g,m,x,y,z,false);o.rotation.y=rotation;if(map)windows.push({m,lit});return o;
  }
  function gable(name,cx,cz,w,len,eave,ridge){
    const positions=[cx-w/2,eave,cz-len/2,cx,ridge,cz-len/2,cx-w/2,eave,cz+len/2,
      cx,ridge,cz-len/2,cx,ridge,cz+len/2,cx-w/2,eave,cz+len/2,
      cx,ridge,cz-len/2,cx+w/2,eave,cz-len/2,cx+w/2,eave,cz+len/2,
      cx,ridge,cz-len/2,cx+w/2,eave,cz+len/2,cx,ridge,cz+len/2];
    for(let i=0;i<positions.length;i+=9)for(let q=0;q<3;q++){const v=positions[i+3+q];positions[i+3+q]=positions[i+6+q];positions[i+6+q]=v;}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(Array.from({length:positions.length/3},(_,i)=>[positions[i*3]/2.8,positions[i*3+2]/2.8]).flat(),2));g.computeVertexNormals();
    mesh(name,g,roof);
    // Close the eave-to-wall seam and give the roof a solid fascia.
    box(name+' eave fascia',cx,eave-.11,cz,w,.30,len,stone);
    for(const sz of [-1,1]){const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,ridge-eave);sh.closePath();
      const gableEnd=new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false});
      uvProject(gableEnd,plaster,cx,eave,cz+sz*len/2);
      const o=mesh(name+' end',gableEnd,plaster,cx,eave,cz+sz*(len/2-.16));o.rotation.y=sz<0?Math.PI:0;
    }
    rod('terracotta ridge cap',[cx,ridge+.045,cz-len/2],[cx,ridge+.045,cz+len/2],.11,roof);
  }
  function lantern(x,y,z,rotation=0){
    const o=box('lantern iron cap',x,y+.31,z,.40,.10,.40,iron);
    box('lantern lower rim',x,y-.30,z,.32,.08,.32,iron);
    const m=new T.MeshBasicMaterial({color:0xffd598});glows.push(m);
    box('lantern warm panes',x,y,z,.26,.52,.26,m,false);
    for(const sx of [-1,1])for(const sz of [-1,1])box('lantern frame',x+sx*.14,y,z+sz*.14,.035,.61,.035,iron,false);
    // Decay 0 ignores the distance cutoff in the legacy r128 light shader:
    // church lanterns then illuminate the opposite houses across the court.
    const l=new T.PointLight(0xffc987,0,12*k,2);l.position.set(x,y,z);root.add(l);practicals.push(l);counts.lanterns++;
    o.rotation.y=rotation;
  }
  // A stone edge hides the old untextured apron without covering playing lines.
  box('north runoff paving',0,-.016,-halfL-2.7,across+7,.032,5.4,pavement,false);
  box('south runoff paving',0,-.016,halfL+3.1,across+7,.032,6.2,pavement,false);
  for(const sx of [-1,1]){box('side sidewalk',sx*(halfA+1.65),-.016,0,3.3,.032,length,pavement,false);
    box('court stone curb',sx*(halfA+3.1),.07,0,.22,.14,length,stone,false);
  }
  // Tall north wall, behind the +X goal in native coordinates.
  // Meet the inner facades with 2 cm of hidden overlap, not the building centres.
  const wallZ=-halfL-4,wallWidth=across+8+.04;
  box('north plaster wall',0,5,wallZ,wallWidth,10,.8,boundary);
  const damp=material('boundary damp render',0xc2cbbb,boundary.map,11.5);
  // Uneven low damp skirt, never a uniform stripe across the whole wall.
  for(let x=-wallWidth/2;x<wallWidth/2;x+=3.8){const w=Math.min(3.8,wallWidth/2-x),h=1.5+.22*Math.sin(x*1.7);
    box('boundary damp base',x+w/2,h/2,wallZ+.409,w,h,.015,damp,false);
  }
  box('north stone foot course',0,.62,wallZ+.48,wallWidth,1.24,.27,stone);
  box('north coping lower',0,9.91,wallZ,wallWidth-.12,.20,1.00,stone);
  box('north coping top',0,10.11,wallZ,wallWidth-.02,.19,1.17,stone);
  const pierHalf=Math.floor((wallWidth-2.4)/12)*6;
  for(let x=-pierHalf;x<=pierHalf;x+=6){box('north stone pier',x,4.8,wallZ+.5,.48,9.6,.45,stone);box('pier cap',x,9.6,wallZ+.5,.69,.22,.64,stone)}
  // One mounted board sits in front of all piers rather than clipping into them.
  box('campetto enamel sign backing',0,5.7,wallZ+.86,12,.95,.14,iron);
  sign('SANTA FEDE · IL CAMPETTO',0,5.7,wallZ+.94,11.8,.88);
  // Court fence: fine wire and real support poles; no opaque camera barrier.
  const nc=document.createElement('canvas');nc.width=nc.height=32;const nx=nc.getContext('2d');nx.strokeStyle='rgba(145,155,143,.65)';nx.lineWidth=1;nx.strokeRect(.5,.5,31,31);
  const nt=new T.CanvasTexture(nc);nt.wrapS=nt.wrapT=T.RepeatWrapping;nt.repeat.set((across+6)/.6,6);
  const fence=new T.MeshBasicMaterial({map:nt,transparent:true,opacity:.30,side:T.DoubleSide,depthWrite:false});
  mesh('north wire fence',new T.PlaneGeometry(across+6,3.5),fence,0,1.75,-halfL-1.5,false);
  for(let x=-halfA-2;x<=halfA+2;x+=6)rod('fence post',[x,0,-halfL-1.5],[x,3.5,-halfL-1.5],.04);
  // West residence: inset window openings, textured shutters, lived-in balconies.
  const west=-halfA-9,houseFace=west+5,houseLength=length+12;
  /* TWO BUILDINGS, NOT ONE (author 2026-09-26, from Street View of Corso
     Sardegna): the west side is the BACK of two apartment buildings with a
     gap between them - room for spectators later - and no street doors or
     shop shutters at the bottom, since nobody's front door faces the court.
     Claude edit on Astra's residence; everything else here is unchanged. */
  const resLit=[];
  const gapHalf=4.6, bLen=houseLength/2-gapHalf, bZ=[-(gapHalf+bLen/2),gapHalf+bLen/2];
  const inGap=z=>Math.abs(z)<gapHalf+1.1;
  const paints=[0xffffff,0xe7d3bf];
  bZ.forEach((bz,i)=>{
    box('west residence '+i,west,8,bz,10,16,bLen,house);
    const m=material('residence property '+i,paints[i],house.map,7+i*.65);
    box('residence varied street frontage '+i,houseFace+.023,8,bz,.045,16,bLen,m,false);
    box('residence stone base',houseFace+.1,1.1,bz,.30,2.2,bLen,stone);
    for(const [y,projection] of [[2.9,.40],[15.35,.35],[16,.65]])box('residence string course',houseFace+.12,y,bz,projection,.20,bLen+.4,stone);
    gable('residence tile roof',west,bz,10.9,bLen+.7,16.15,17.35);
  });
  // the gap: a low boundary wall with a railing, where people can stand and watch
  // The street between the houses is above the court, level with the low wall.
  const raisedRoad=material('raised gap asphalt',0x85847b,atlas('court',0,true,'#77776e',[.005,.005,.49,.49]),5);
  box('raised gap street foundation',houseFace-4,.55,0,7,1.1,gapHalf*2,stone);
  box('raised gap street surface',houseFace-4,1.125,0,7,.05,gapHalf*2,raisedRoad,false);
  box('gap boundary wall',houseFace-.4,.55,0,.5,1.1,gapHalf*2,stone);
  for(let j=0;j<=12;j++)rod('gap railing bar',[houseFace-.4,1.1,-gapHalf+j*gapHalf*2/12],[houseFace-.4,2.05,-gapHalf+j*gapHalf*2/12],.022);
  rod('gap railing top',[houseFace-.4,2.05,-gapHalf],[houseFace-.4,2.05,gapHalf],.03);
  const cols=Math.floor((length+4)/4.6);
  for(let floor=0;floor<4;floor++)for(let n=0;n<cols;n++){
    const z=(n-(cols-1)/2)*4.6,y=4.3+floor*2.95;
    if(inGap(z)) continue;
    box('residence window dark reveal',houseFace+.13,y,z,.10,1.85,1.46,dark,false);
    const m=new T.MeshBasicMaterial({map:windowMap,color:0xffffff});
    m.color.setHex([0xffffff,0xbacdd7,0xd4c6b5,0xc4d3c8][(n+floor*2)%4]).convertSRGBToLinear();
    m.color.multiplyScalar([.80,.92,1][(n+floor)%3]);
    const lit=(n*5+floor*3+1)%3===0;windows.push({m,lit,res:true});if(lit)resLit.push({y,z,floor});   // ~1 in 3 homes awake at night
    box('residence painted window',houseFace+.20,y,z,.045,1.72,1.30,m,false);
    box('window projecting sill',houseFace+.32,y-.98,z,.56,.14,1.7,stone);
    for(const sz of [-1,1]){
      const shut=box('green louvred shutter',houseFace+.32,y,z+sz*1.0,.14,1.90,.65,shutters);
      shut.rotation.y=sz*((n+floor)%4===0?.42:.10);
    }
    if((floor+n)%2===0){counts.balconies++;
      balconySpots.push({x:houseFace+1.02,y:y-1.005,z,floor,n});                      // author: the two buildings need balconies
      box('balcony floor',houseFace+.83,y-1.1,z,1.9,.19,2.65,stone);
      const rx=houseFace+1.68;
      rod('balcony outer top',[rx,y-.15,z-1.2],[rx,y-.15,z+1.2],.036);
      rod('balcony outer bottom',[rx,y-1.02,z-1.2],[rx,y-1.02,z+1.2],.029);
      for(let j=0;j<9;j++)rod('balcony baluster',[rx,y-1.02,z-1.2+j*.30],[rx,y-.15,z-1.2+j*.30],.022);
      for(const sz of [-1,1]){rod('closed balcony return',[houseFace,y-.15,z+sz*1.2],[rx,y-.15,z+sz*1.2],.032);
        for(let j=1;j<4;j++)rod('return baluster',[houseFace+j*.42,y-1.02,z+sz*1.2],[houseFace+j*.42,y-.15,z+sz*1.2],.022);
      }
    }
  }
  /* WINDOW LIGHT AT NIGHT (author 2026-09-26: "at night some windows need to
     cast light"). Each lit window throws a soft warm pool on the facade round
     it (additive card, bloom picks it up); four of the lowest lit windows get
     real point lights that warm the balconies and the court edge. */
  const spillC=document.createElement('canvas');spillC.width=spillC.height=64;{const g=spillC.getContext('2d'),gr=g.createRadialGradient(32,34,2,32,34,31);
    gr.addColorStop(0,'rgba(255,200,120,.85)');gr.addColorStop(.45,'rgba(255,170,90,.32)');gr.addColorStop(1,'rgba(255,150,70,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
  const spillM=new T.MeshBasicMaterial({map:new T.CanvasTexture(spillC),transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false});
  const winGlow=new T.Group();winGlow.name='lit window spill';winGlow.visible=false;root.add(winGlow);
  resLit.forEach(({y,z})=>{const s=new T.Mesh(new T.PlaneGeometry(3.4,3.8),spillM);s.position.set(houseFace+.42,y-.15,z);s.rotation.y=Math.PI/2;s.renderOrder=3;winGlow.add(s);});
  const winLights=[];
  resLit.filter(w=>w.floor<=1).filter((w,i,a)=>i%Math.max(1,Math.floor(a.length/4))===0).slice(0,4).forEach(({y,z})=>{
    const l=new T.PointLight(0xffb66e,0,7*k,2);l.position.set(houseFace+1.4,y-.3,z);root.add(l);winLights.push(l);});
  // back of the buildings: no doors, no shop shutters - a plain plinth with a
  // few small barred service windows high up (cellars / stairwells)
  for(let n=0;n<cols;n++){
    const z=(n-(cols-1)/2)*4.6;
    if(inGap(z)||n%2) continue;
    box('back service window',houseFace+.14,2.25,z,.06,.55,.9,dark,false);
    for(let j=0;j<4;j++)rod('service window bar',[houseFace+.2,1.98,z-.33+j*.22],[houseFace+.2,2.52,z-.33+j*.22],.018);
  }
  // East church. The wall remains solid behind recessed arched glazing;
  // separate stone rings, sills and surrounds give the facade real depth.
  const east=halfA+9,face=east-5,churchLength=length+8;
  box('church nave backing',east,5.5,0,10,11,churchLength,plaster);
  box('church stone plinth',face-.15,.72,0,.46,1.44,churchLength,stone);
  box('church base cap',face-.27,1.46,0,.59,.18,churchLength+.18,stone);
  for(const [y,w,h] of [[10.30,.55,.23],[10.75,.75,.28],[11.05,.88,.20]])box('church layered cornice',face-.15,y,0,w,h,churchLength+.4,stone);
  gable('church roof',east,0,11.2,churchLength+.5,11.24,14.0);
  const bays=Math.floor((churchLength-4)/6.2),bayStep=(churchLength-4)/bays;
  for(let n=0;n<bays;n++){
    const z=-churchLength/2+2+(n+.5)*bayStep;
    const reveal=mesh('church recessed arch shadow',new T.ShapeGeometry(archShape(1.55,2.7),12),dark,face-.075,4.0,z,false);reveal.rotation.y=-Math.PI/2;
    archedPane('church stained glazing',face-.10,4.13,z,1.24,2.58,glassMap,n%4===1,-Math.PI/2);
    archRing('church carved arch',face-.27,4.0,z,1.9,2.72,.26,-Math.PI/2);
    box('church deep stone sill',face-.43,3.98,z,.82,.20,2.3,stone);
    const pz=z-bayStep/2;
    box('church pier body',face-.25,5.85,pz,.62,8.6,.67,stone);
    box('church pier base',face-.4,1.90,pz,.85,.50,.96,stone);
    box('church pier capital',face-.39,10.01,pz,.85,.35,1.02,stone);
    if(n%2===0){rod('church lamp bracket',[face-.25,3.2,pz],[face-1.0,3.2,pz],.04);lantern(face-1.02,2.92,pz)}
  }
  for(const z of [-churchLength/2+.45,churchLength/2-.45]){
    rod('church aged downpipe',[face-.82,.2,z],[face-.82,10.85,z],.075);
    for(const y of [1,4.8,8.6])box('pipe collar',face-.86,y,z,.16,.07,.18,iron,false);
  }
  // Front entry faces the south parking, with an arched portal and rose.
  const front=churchLength/2+.015;
  box('church portal dark opening',east,2.30,front+.04,3.35,4.6,.06,dark,false);
  box('church carved double door',east,1.99,front+.09,2.55,3.90,.04,wood,false);
  archRing('church entrance stone arch',east,0,front+.15,3.6,3.5,.40,0);
  for(let step=0;step<3;step++)box('church entry step',east,.09+step*.15,front+.90-step*.22,5.5,.18,1.7-step*.40,stone);
  const roseMat=new T.MeshBasicMaterial({map:glassMap});windows.push({m:roseMat,lit:true});
  const rose=mesh('church rose glazing',new T.CircleGeometry(1.0,24),roseMat,east,7.2,front+.06,false);
  const ring=mesh('rose carved ring',new T.TorusGeometry(1.18,.16,6,24),stone,east,7.2,front+.18);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod('rose stone tracery',[east,7.2,front+.23],[east+Math.sin(a)*.96,7.2+Math.cos(a)*.96,front+.23],.026,stone)}
  sign('PARROCCHIA SANTA FEDE',east,5.5,front+.27,5.3,.56);
  for(const sx of [-1,1])lantern(east+sx*2.5,2.8,front+.40);
  const towerX=east+3.6,towerZ=-churchLength/2+3.2;
  box('church campanile',towerX,9,towerZ,4.5,18,4.5,plaster);
  for(const y of [11.4,14.0,17.5,18.0])box('campanile stone belt',towerX,y,towerZ,4.85,.23,4.85,stone);
  for(const sz of [-1,1]){
    archedPane('belfry dark arch',towerX,14.1,towerZ+sz*2.28,2.45,1.55,null,false,sz<0?Math.PI:0);
    archRing('belfry stone arch',towerX,14,towerZ+sz*2.32,2.8,1.65,.18,sz<0?Math.PI:0);
  }
  gable('campanile roof',towerX,towerZ,5.0,5.0,18.10,19.35);
  rod('campanile cross upright',[towerX,19.5,towerZ],[towerX,21.5,towerZ],.045);
  rod('campanile cross arms',[towerX-.65,20.8,towerZ],[towerX+.65,20.8,towerZ],.045);
  // Actual alpha sprites on lit cards, beside modeled planters and outside play.
  const foliageMaterials=[
    atlas('foliage',0,false,'rgba(0,0,0,0)',[.04,0,.41,.64]),
    atlas('foliage',1,false,'rgba(0,0,0,0)',[.49,.075,.49,.47]),
    atlas('foliage',2,false,'rgba(0,0,0,0)',[.055,.62,.425,.365]),
    atlas('foliage',3,false,'rgba(0,0,0,0)',[.53,.56,.43,.43])
  ].map(map=>new T.MeshLambertMaterial({map,side:T.DoubleSide,alphaTest:.60}));
  function foliage(kind,x,y,z,w,h,rotation=0){
    const m=foliageMaterials[kind],o=mesh('pixel foliage',new T.PlaneGeometry(w,h),m,x,y,z,false);o.rotation.y=rotation;counts.foliageCards++;return o;
  }
  const terracotta=material('terracotta pots',0x956a50);
  function planter(x,z,rotation=0){
    mesh('terracotta planter',new T.CylinderGeometry(.54,.40,.65,10),terracotta,x,.325,z);
    mesh('planter soil',new T.CylinderGeometry(.48,.48,.045,10),material('soil',0x3c4030),x,.65,z,false);
    foliage(1,x,1.45,z,1.65,1.7,rotation);foliage(1,x,1.45,z,1.65,1.7,rotation+Math.PI/2);
  }
  for(const x of [-halfA+4,halfA-4])planter(x,wallZ+1.50);
  for(const x of [-13,-4,14])foliage(0,x,7.9,wallZ+.43,2.1,4.1);
  for(const z of [-halfL+8,halfL-8])planter(face-1.35,z,-Math.PI/2);
  for(let z=-halfL+12;z<halfL;z+=19){
    box('church flower trough',face-.7,.35,z,.65,.65,1.65,terracotta);
    foliage(2,face-.87,1.0,z,1.6,1.0,-Math.PI/2);
  }
  for(const z of [-halfL+4,halfL-4])foliage(3,halfA+3,.30,z,1.05,.60,-Math.PI/2);
  for(const z of [-19,19])foliage(2,houseFace+1.75,3.65,z,1.5,1.0,Math.PI/2);   // z 0 is the gap now
  /* SOUTH FENCE (author 2026-09-26): a tall green metal fence behind the south
     goal, open near the church as the entrance, with trees on the parking side
     - layers (court / fence / trees / parking / avenue) for a 3D feeling. */
  {const fz=halfL+2.2,H=4.6,x0=-halfA-4,g0=halfA-7,g1=halfA+3.2;
    const mc=document.createElement('canvas');mc.width=mc.height=16;const mg=mc.getContext('2d');
    mg.strokeStyle='#2f5e40';mg.lineWidth=2;mg.strokeRect(1,1,14,14);mg.strokeStyle='rgba(70,120,85,.9)';mg.lineWidth=1;mg.beginPath();mg.moveTo(8,0);mg.lineTo(8,16);mg.stroke();
    const mt=new T.CanvasTexture(mc);mt.wrapS=mt.wrapT=T.RepeatWrapping;mt.magFilter=T.NearestFilter;mt.repeat.set((g0-x0)/.55,H/.55);
    const mesh_=new T.MeshBasicMaterial({map:mt,transparent:true,alphaTest:.25,side:T.DoubleSide,depthWrite:false});
    mesh('south green fence',new T.PlaneGeometry(g0-x0,H),mesh_,(x0+g0)/2,H/2,fz,false);
    const green=material('green fence iron',0x2c5a3c);
    for(let x=x0;x<=g0+.01;x+=2.6)rod('fence post',[x,0,fz],[x,H+.1,fz],.055,green);
    for(const y of [.12,H*.5,H])rod('fence rail',[x0,y,fz],[g0,y,fz],.04,green);
    // the entrance: two brick gate pillars with stone caps, the gate leaves swung open
    const brick=material('gate brick',0x9c5b43);
    for(const gx of [g0,g1]){box('gate pillar',gx,1.4,fz,.62,2.8,.62,brick);box('gate pillar cap',gx,2.86,fz,.78,.14,.78,stone);}
    const gateMap=mt.clone();gateMap.repeat.set(4.6/.55,2.2/.55);gateMap.needsUpdate=true;
    const gateMaterial=mesh_.clone();gateMaterial.map=gateMap;
    for(const [gx,dir] of [[g0,1],[g1,-1]]){const leaf=new T.Group();leaf.name='south entrance gate';leaf.position.set(gx+dir*.35,0,fz);leaf.rotation.y=dir*1.25;root.add(leaf);
      const lm=new T.Mesh(new T.PlaneGeometry(4.6,2.2),gateMaterial);lm.position.set(dir*2.3,1.15,0);leaf.add(lm);}
    // trees on the parking side: trunk + crossed leaf cards (Astra's pixel foliage)
    const bark=material('plane tree bark',0x5d5245);
    const tree=(x,z,s)=>{counts.trees++;mesh('tree trunk',new T.CylinderGeometry(.16*s,.24*s,3.4*s,7),bark,x,1.7*s,z);
      // Same centred crown from every angle; alpha-tested leaves cast silhouettes.
      for(let q=0;q<3;q++)for(const [y,w,h] of [[4.4,5.2,4.6],[5.7,3.8,2.6]]){
        const leaf=foliage(1,x,y*s,z,w*s,h*s,q*Math.PI/3);leaf.name='parking tree crown';leaf.castShadow=true;counts.treeShadowCards++;
      }};
    [[halfA-1.5,halfL+6.5,1.15],[halfA+6.5,halfL+9,1.3],[-halfA+1,halfL+7,1.2],[-7,halfL+19.5,1.35],[8,halfL+20,1.25],[-halfA-2,halfL+17,1.1]].forEach(t=>tree(...t));
  }
  // Parking stays behind the south goal. Modest geometry, not a new play area.
  const parkingMat=material('parking asphalt',0x656860);
  box('south parking',0,-.018,halfL+13,across+20,.036,18,parkingMat,false);
  for(let x=-halfA+2;x<halfA;x+=6.6){
    for(const sx of [-1,1])box('worn parking stripe',x+sx*1.25,.004,halfL+14,.055,.008,5.3,material('parking paint',0xa4a28b),false);
    if(window.U11_SANTA_CARS===true&&Math.round(x)%3!==0){   // author 2026-09-26: the parking lot stays empty
      const body=material('car paint '+Math.round(x),[0x627978,0x97736a,0x9c9f96][Math.abs(Math.round(x))%3]);
      box('parked car body',x,.62,halfL+14,2.0,.76,3.9,body);
      box('car glass cabin',x,1.2,halfL+14,1.67,.62,1.85,material('car glass',0x354c52));
      for(const sx of [-1,1])for(const sz of [-1,1]){
        const o=mesh('car tyre',new T.CylinderGeometry(.32,.32,.18,10),material('rubber',0x242924),x+sx*.96,.35,halfL+14+sz*1.17);o.rotation.z=Math.PI/2;
      }
    }
  }
  // Local neighbours: alpha-tested, lit chibi cards, batched per pose. Fixed
  // orientations face the court; real walls/rails supply the body occlusion.
  const neighbours=new T.Group();neighbours.name='Santa Fede chibi neighbours';root.add(neighbours);
  function person(zone,variant,x,y,z,h,yaw){
    spectatorSpots.push({zone,variant,x,y,z,height:h,yaw});counts.spectators++;counts.spectatorZones[zone]++;
  }
  box('north elevated spectator street',0,9.54,wallZ-2.1,wallWidth-.2,.22,3.1,raisedRoad,false);
  [-20,-17.4,-11.8,-9.1,-2.7,.2,7.4,10.1,16.8,19.2].forEach((x,i)=>
    person('north',i%4,x,9.65,wallZ-.84-(i%2)*.24,2.28+(i%3)*.07,0));
  balconySpots.filter(p=>(p.n*3+p.floor)%5===0||p.floor===0&&p.n===4).forEach((p,i)=>{
    person('balcony',4+i%4,p.x,p.y,p.z,2.02+(i%3)*.06,Math.PI/2);
    if(i===1||i===4)person('balcony',4+(i+1)%4,p.x-.03,p.y,p.z+.86,1.91,Math.PI/2);
  });
  [-3.75,-2.55,-.95,.45,2.3,3.65].forEach((z,i)=>
    person('gap',8+i%4,houseFace-1.03,1.15,z,1.88+(i%3)*.12,Math.PI/2));
  [-22.5,-21,-17.5,-15.9,-11.5,-10,-5.5,-4.0,.2,1.7,6.0,7.5,11.5,13].forEach((x,i)=>
    person('fence',8+i%4,x,.018,halfL+3.45+(i%3)*.16,1.9+(i%3)*.10,Math.PI));
  const variants=new Map();for(const p of spectatorSpots){if(!variants.has(p.variant))variants.set(p.variant,[]);variants.get(p.variant).push(p)}
  for(const [variant,people] of variants){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
    const cx=canvas.getContext('2d'),map=new T.CanvasTexture(canvas);
    map.encoding=T.sRGBEncoding;map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=8;
    map.userData={ready:false,disposed:false};map.addEventListener('dispose',()=>map.userData.disposed=true);
    function fill(image){if(!image||map.userData.disposed)return;
      const x0=Math.round(variant%4*image.naturalWidth/4),y0=Math.round(Math.floor(variant/4)*image.naturalHeight/4);
      const w=Math.round((variant%4+1)*image.naturalWidth/4)-x0,h=Math.round((Math.floor(variant/4)+1)*image.naturalHeight/4)-y0;
      const cell=document.createElement('canvas');cell.width=w;cell.height=h;const cc=cell.getContext('2d');cc.drawImage(image,x0,y0,w,h,0,0,w,h);
      const pixels=cc.getImageData(0,0,w,h).data;let l=w,r=-1,t=h,b=-1;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
      if(r<l)return;const sw=r-l+1,sh=b-t+1,scale=Math.min(124/sw,188/sh),dw=sw*scale,dh=sh*scale;
      cx.imageSmoothingEnabled=false;cx.clearRect(0,0,128,192);cx.drawImage(cell,l,t,sw,sh,(128-dw)/2,190-dh,dw,dh);
      map.userData.ready=true;map.needsUpdate=true;
    }
    if(sources.spectators.state==='ready')fill(sources.spectators.image);else sources.spectators.promise.then(fill);
    const m=new T.MeshLambertMaterial({map,side:T.DoubleSide,alphaTest:.5});
    const geometry=new T.PlaneGeometry(2/3,1);geometry.translate(0,.5,0);
    const fans=new T.InstancedMesh(geometry,m,people.length);fans.name='neighbour pose '+variant;
    fans.castShadow=true;fans.receiveShadow=true;fans.frustumCulled=false;
    fans.customDepthMaterial=new T.MeshDepthMaterial({map,alphaTest:.5,depthPacking:T.RGBADepthPacking,side:T.DoubleSide});
    geometry.addEventListener('dispose',()=>fans.customDepthMaterial.dispose());
    const dummy=new T.Object3D();people.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.y=p.yaw;dummy.scale.setScalar(p.height);dummy.updateMatrix();fans.setMatrixAt(i,dummy.matrix)});
    fans.instanceMatrix.needsUpdate=true;neighbours.add(fans);
  }
  // Visible corner banks and local facade lights; no stadium roof rig here.
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*(halfA+2.7),z=sz*(halfL+2.7);
    rod('court light pole',[x,0,z],[x,8.1,z],.085);
    const bank=box('court lamp bank',x,8.05,z,1.5,.45,.46,iron);bank.rotation.x=sz*.25;
    const glow=new T.MeshBasicMaterial({color:0xffefd6});glows.push(glow);
    for(let q=0;q<3;q++)box('court lamp lens',x-.48+q*.48,7.98,z-sz*.25,.34,.22,.035,glow,false);
    const l=new T.SpotLight(0xffedd2,0,100*k,1.03,.68,0);l.position.set(x-sx*.48,7.72,z-sz*.60);l.target.position.set(sx*halfA*.28,0,sz*halfL*.38);
    l.castShadow=true;l.shadow.mapSize.set(512,512);l.shadow.bias=-.00035;l.shadow.normalBias=.035;root.add(l,l.target);lamps.push(l);
  }
  const fill=new T.HemisphereLight(0xb1c2d7,0x736450,0);root.add(fill);
  const houseFill=new T.SpotLight(0xc7d7e5,0,115*k,1.22,.96,0);houseFill.position.set(0,10,0);houseFill.target.position.set(houseFace,8,0);root.add(houseFill,houseFill.target);
  const wash=new T.SpotLight(0xf0d5af,0,95*k,1.10,.90,0);wash.position.set(halfA-10,12,-halfL+10);wash.target.position.set(face,5,0);root.add(wash,wash.target);
  // Batch by material identity, preserving warm windows and shadow receivers.
  root.updateMatrixWorld(true);const buckets=new Map(),dynamic=new Set(windows.map(w=>w.m));
  for(const o of [...root.children]){
    if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||dynamic.has(o.material))continue;
    const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
  }
  for(const objects of buckets.values()){
    if(objects.length<2)continue;const positions=[],normals=[],uvs=[];
    for(const o of objects){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);
      positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);
      root.remove(o);g.dispose();o.geometry.dispose();
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    const merged=mesh('Santa Fede batched '+objects[0].material.uuid,g,objects[0].material,0,0,0,objects[0].castShadow);
    if(merged.castShadow&&merged.material.alphaTest>0){
      // r128 does not transfer alpha maps to its default shadow material.
      merged.name='parking tree crowns';
      merged.customDepthMaterial=new T.MeshDepthMaterial({map:merged.material.map,alphaTest:merged.material.alphaTest,depthPacking:T.RGBADepthPacking,side:T.DoubleSide});
      g.addEventListener('dispose',()=>merged.customDepthMaterial.dispose());
    }
  }
  // The native r128 match grades display-referred color and has no final
  // linear-to-sRGB pass. Decode assets for lighting, then encode only these
  // material outputs before that legacy grade. No global renderer changes.
  const graded=new Set();root.traverse(o=>{
    const m=o.material;if(!m||graded.has(m)||(!m.userData.sfDisplay&&m.map?.encoding!==T.sRGBEncoding))return;graded.add(m);
    m.onBeforeCompile=(shader,renderer)=>{
      if(renderer.outputEncoding!==T.LinearEncoding)return;
      shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>',
        'gl_FragColor.rgb=mix(gl_FragColor.rgb*12.92,1.055*pow(max(gl_FragColor.rgb,vec3(0.0)),vec3(1.0/2.4))-.055,step(vec3(.0031308),gl_FragColor.rgb));');
    };
    m.customProgramCacheKey=()=> 'santa-fede-display-v1';
  });
  active={root,spectatorSpots,windows,lamps,practicals,fill,houseFill,wash,glows,counts,winGlow,winLights,extent:[nativeL,nativeW],joins:{wallHalf:wallWidth/2,facadeHalf:halfA+4,copingHalf:(wallWidth-.02)/2,pierHalf},layout:{northWall:[nativeL/2+4*k,0],southParking:[-nativeL/2-13*k,0],eastChurch:[0,nativeW/2+9*k],westHouses:[0,-nativeW/2-9*k]}};
  return active;
}
// dayFill (Claude 2026-09-26, sky pass): scales the two shadow-free DAY fills - they were
// what made daytime read flat ("an IKEA room"); the real sky light replaces them
let dayFill=0.45, lastTime='classic';
function setDayFill(v){dayFill=Math.max(0,+v||0);setTime(lastTime);}
function setTime(time){if(!active)return;lastTime=time;const night=time==='night',golden=time==='golden';
  active.lamps.forEach(l=>l.intensity=night?.20:0);active.fill.intensity=night?.24:(golden?.20:.34)*dayFill;
  active.wash.intensity=night?.20:0;active.practicals.forEach(l=>l.intensity=night?.26:0);
  active.houseFill.intensity=night?0:(golden?.15:.30)*dayFill;
  active.windows.forEach(w=>{if(!w.dayColor)w.dayColor=w.m.color.clone();w.m.color.copy(w.dayColor);if(night){w.m.color.multiplyScalar(w.lit?.95:.55);if(w.lit)w.m.color.multiply(new w.m.color.constructor(0xffd29a));if(w.lit&&w.res)w.m.color.setRGB(1.9,1.4,.8);}});
  if(active.winGlow)active.winGlow.visible=night;(active.winLights||[]).forEach(l=>l.intensity=night?.22:0);
  active.glows.forEach(m=>m.color.setHex(night?0xffd79b:0xb4afa0));
}
window.U11_SANTA_ART={build,setTime,setDayFill,get dayFill(){return dayFill},courtReady:sources.court.promise,courtImage:()=>sources.court.state==='ready'?sources.court.image:null,
  inspect:()=>active?{lamps:active.lamps.length,windows:active.windows.length,extent:active.extent,layout:active.layout,joins:active.joins,lighting:{time:lastTime,lanternDecay:active.practicals.map(l=>l.decay),windowLights:active.winLights.map(l=>({intensity:l.intensity,distance:l.distance}))},details:active.counts,spectators:{people:active.spectatorSpots,source:sources.spectators.state,batches:new Set(active.spectatorSpots.map(p=>p.variant)).size},pixelTiles:(()=>{const maps=new Set();active.root.traverse(o=>{if(o.material?.map?.userData?.ready!==undefined)maps.add(o.material.map)});return {count:maps.size,ready:[...maps].filter(t=>t.userData.ready).length}})(),assets:Object.fromEntries(Object.entries(sources).map(([key,v])=>[key,v.state]))}:null};
})();
