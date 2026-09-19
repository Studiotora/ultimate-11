/* Classic upgrade: bowl-only Blender GLB. All gameplay coordinates stay in pitch3d.
   Load after THREE/GLTFLoader and before ult11-pitch3d.js. */
(function(){
'use strict';
var assetURL=new URL('assets/stadium/classic-upgraded.glb?v=1',document.currentScript.src).href;
var cached=null, pending=null, active=null;
var colors={homeCol:'#1e72dc',awayCol:'#c22020'};
var api={status:'idle',error:null};
function load(T){
  if(cached)return Promise.resolve(cached);
  if(pending)return pending;
  api.status='loading';api.error=null;
  pending=new Promise(function(resolve,reject){
    if(!T.GLTFLoader){reject(new Error('GLTFLoader is unavailable'));return;}
    new T.GLTFLoader().load(assetURL,function(gltf){cached=gltf.scene;resolve(cached);},undefined,reject);
  }).catch(function(error){pending=null;api.status='error';api.error=String(error.message||error);throw error;});
  return pending;
}
// Seat-aligned crowd for the exported classic bowl. Coordinates mirror build-runtime.py.
// One atlas and one shared shader; geometry is batched by the existing camera sectors.
function buildCrowd(T,model,state){
  var canvas=document.createElement('canvas');canvas.width=256;canvas.height=48;
  var c=canvas.getContext('2d'),skins=['#e2ae83','#bf815a','#80543d','#edc4a1'];
  function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
  for(var pose=0;pose<2;pose++)for(var v=0;v<16;v++){
    var x=v*16,y=pose*24,skin=skins[v%4];
    rect(x+5,y+17,3,6,'#222b3d');rect(x+9,y+17,3,6,'#222b3d');
    rect(x+4,y+9,8,9,'#00ff00');rect(x+5,y+10,2,6,'#00d500');
    rect(x+5,y+3,6,6,skin);rect(x+5,y+2,6,3,v%3?'#30251f':'#9e7049');
    if(v%4===0)rect(x+4,y+2,8,2,'#00ff00');
    if(pose){rect(x+2,y+5,2,9,skin);rect(x+12,y+5,2,9,skin);
      if(v%3===0){rect(x+1,y+3,14,2,'#00ff00');rect(x+5,y+3,5,1,'#e3e6dc');}}
    else{rect(x+2,y+10,2,8,skin);rect(x+12,y+10,2,8,skin);}
    if(v%5===0)rect(x+7,y+10,2,7,'#e2e5de');
  }
  var texture=new T.CanvasTexture(canvas);texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;
  texture.generateMipmaps=false;state.crowdTexture=texture;
  var uniforms={atlas:{value:texture},time:{value:0},eye:{value:new T.Vector3()},home:{value:new T.Color(colors.homeCol)},away:{value:new T.Color(colors.awayCol)},cheer:{value:0},winner:{value:0}};
  var material=new T.ShaderMaterial({uniforms:uniforms,side:T.DoubleSide,depthWrite:true,
    vertexShader:`attribute vec3 anchor;attribute vec4 fan;attribute vec2 facing;varying vec2 tileUV;varying float team;varying float shade;uniform float time;uniform vec3 eye;uniform float cheer;uniform float winner;
    void main(){float near=1.-smoothstep(24.,48.,distance(eye,anchor));float motion=fan.z*near;float celebrate=cheer*(1.-step(.1,abs(fan.y-winner)));
    float wave=sin(time*3.2+fan.w);float raised=step(.55,wave+celebrate)*step(.01,motion);
    tileUV=vec2((uv.x+fan.x)/16.,(uv.y+1.-raised)/2.);team=fan.y;shade=.80+.20*fract(fan.w*3.7);
    vec2 right=facing;vec2 toward=eye.xz-anchor.xz;vec2 billboard=normalize(vec2(-toward.y,toward.x)+vec2(.00001));
    if(dot(right,billboard)<0.)billboard=-billboard;right=normalize(mix(right,billboard,near*fan.z*.5));
    vec3 p=anchor+vec3(right.x*position.x,position.y,right.y*position.x);
    p.y+=max(0.,sin(time*(3.5+celebrate*3.)+fan.w))*motion*(.018+celebrate*.13);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform sampler2D atlas;uniform vec3 home;uniform vec3 away;varying vec2 tileUV;varying float team;varying float shade;
    void main(){vec4 p=texture2D(atlas,tileUV);if(p.a<.5)discard;vec3 shirt=team<.5?home:(team<1.5?away:vec3(.48,.51,.54));
    if(p.g>.65&&p.r<.1&&p.b<.1)p.rgb=shirt*p.g;gl_FragColor=vec4(p.rgb*shade,1.);}`});
  state.crowdUniforms=uniforms;state.crowdStats={spectators:0,animated:0,flags:0,batches:0};
  var batches={},parents={},seed=731;
  function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  model.traverse(function(o){if(o.name==='bowl_fixed'||/^front_\d\d$/.test(o.name))parents[o.name]=o;});
  function outline(off){var hx=60+off,hy=40+off,r=12+off*.14,p=[];
    [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]].forEach(function(q){
      if(q[2]===270)p.push([-12,-hy],[12,-hy]);for(var i=0;i<9;i++){var a=(q[2]+i*90/8)*Math.PI/180;p.push([q[0]+r*Math.cos(a),q[1]+r*Math.sin(a)]);}});return p;}
  [[0,.8,11,.82,.50],[11.7,8.4,8,.83,.57],[20.8,15.7,9,.83,.61]].forEach(function(t,tier){
    for(var row=0;row<t[2];row++){var pts=outline(t[0]+row*t[3]+.43),h=t[1]+row*t[4];
      pts.forEach(function(a,i){var b=pts[(i+1)%pts.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),n=Math.max(1,Math.floor(len/.72));
        for(var k=0;k<n;k++){var u=(k+.5)/n,x=a[0]+dx*u,z=a[1]+dy*u;
          if((Math.abs(x)<2.4&&z>0)||k%16<2)continue;
          var occupancy=.77+.16*(.5+.5*Math.sin(i*2.7+tier));if(rnd()>occupancy)continue;
          var sector=z<-30?'front_'+String(Math.max(0,Math.min(11,Math.floor((x+96)/16)))).padStart(2,'0'):'bowl_fixed';
          var batch=batches[sector]||(batches[sector]={p:[],a:[],uv:[],f:[],dir:[]});
          var animated=tier===0&&row<3?1:(tier<2&&rnd()<.08?.45:0),team=rnd()<.28?2:(x<8?0:1),variant=Math.floor(rnd()*16),phase=rnd()*6.283;
          // feet rest on the row deck; atlas proportions include a small seat-height offset.
          [[-.23,0,0,0],[.23,0,1,0],[.23,.88,1,1],[-.23,0,0,0],[.23,.88,1,1],[-.23,.88,0,1]].forEach(function(q){
            batch.p.push(q[0],q[1],0);batch.a.push(x*2/3,(h+.13)*2/3,-z*2/3);batch.uv.push(q[2],q[3]);batch.f.push(variant,team,animated,phase);batch.dir.push(dx/len,-dy/len);});
          state.crowdStats.spectators++;if(animated)state.crowdStats.animated++;
        }
      });
    }
  });
  Object.keys(batches).forEach(function(key){var b=batches[key],g=new T.BufferGeometry();
    [['position',b.p,3],['anchor',b.a,3],['uv',b.uv,2],['fan',b.f,4],['facing',b.dir,2]].forEach(function(v){g.setAttribute(v[0],new T.Float32BufferAttribute(v[1],v[2]));});
    var mesh=new T.Mesh(g,material);mesh.name='pixel_crowd_'+key;mesh.frustumCulled=false;(parents[key]||model).add(mesh);state.crowdStats.batches++;
  });
  // Small supporter flags share one material and animate entirely on the GPU.
  var fm=new T.ShaderMaterial({side:T.DoubleSide,uniforms:uniforms,
    vertexShader:`uniform float time;attribute float flagTeam;varying vec2 v;varying float ft;void main(){v=uv;ft=flagTeam;vec3 p=position;p.z+=sin(p.x*5.+time*3.5)*.12*uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform vec3 home;uniform vec3 away;varying vec2 v;varying float ft;void main(){vec3 col=mix(home,away,ft);float stripe=step(.36,v.x)*step(v.x,.64);gl_FragColor=vec4(mix(col,vec3(.88),stripe),1.);}`});
  var flagBatches={};
  [-1,1].forEach(function(side){for(var i=0;i<10;i++){
    var x=-30+i*6.6,z=side*28.4,key=side>0?'front_'+String(Math.max(0,Math.min(11,Math.floor((x*1.5+96)/16)))).padStart(2,'0'):'bowl_fixed';
    var batch=flagBatches[key]||(flagBatches[key]={positions:[],uv:[],teams:[],poles:[]});
    for(var seg=0;seg<8;seg++){
      [[seg/8,0],[(seg+1)/8,0],[(seg+1)/8,1],[seg/8,0],[(seg+1)/8,1],[seg/8,1]].forEach(function(q){batch.positions.push(x+q[0],2.475+q[1]*.65,z);batch.uv.push(q[0],q[1]);batch.teams.push(x<5.33?0:1);});
    }
    batch.poles.push([x,2.2,z]);state.crowdStats.flags++;
  }});
  var poleMat=new T.MeshBasicMaterial({color:0x8b939e}),pg=new T.BoxGeometry(.035,1.6,.035),matrix=new T.Matrix4();
  Object.keys(flagBatches).forEach(function(key){var b=flagBatches[key],g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setAttribute('flagTeam',new T.Float32BufferAttribute(b.teams,1));
    var flag=new T.Mesh(g,fm);flag.name='supporter_flags';(parents[key]||model).add(flag);
    var poles=new T.InstancedMesh(pg,poleMat,b.poles.length);b.poles.forEach(function(p,i){matrix.makeTranslation(p[0],p[1],p[2]);poles.setMatrixAt(i,matrix);});poles.frustumCulled=false;(parents[key]||model).add(poles);state.crowdStats.batches+=2;
  });
}

function release(root){
  var gs=new Set(),ms=new Set();
  root.traverse(function(o){if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){ms.add(m);});});
  gs.forEach(function(g){g.dispose();});ms.forEach(function(m){m.dispose();});
}
api.dispose=function(){if(active){active.cancelled=true;if(active.crowdTexture)active.crowdTexture.dispose();release(active.root);if(active.root.parent)active.root.parent.remove(active.root);active=null;}};
api.setTeamColors=function(d){
  if(d){colors.homeCol=d.homeCol||colors.homeCol;colors.awayCol=d.awayCol||colors.awayCol;}
  if(!active)return;
  if(active.crowdUniforms){active.crowdUniforms.home.value.set(colors.homeCol);active.crowdUniforms.away.value.set(colors.awayCol);}
  active.materials.forEach(function(m){
    if(m.name==='seats_home')m.color.set(colors.homeCol);
    if(m.name==='seats_away')m.color.set(colors.awayCol);
  });
};
api.build=function(T,group,PLEN,PWID){
  api.dispose();
  var state={root:new T.Group(),materials:[],sectors:[],cancelled:false,ready:false};active=state;
  state.root.name='classic_upgraded';state.root.scale.set(PLEN/70,PLEN/70,PWID/44.87);
  group.add(state.root);
  state.readyPromise=load(T).then(function(template){
    if(state.cancelled)return false;
    var model=template.clone(true), materials=new Map();
    var discard=[];
    model.traverse(function(o){
      if(o.isLight||o.isCamera){discard.push(o);return;}
      if(!o.isMesh)return;
      o.geometry=o.geometry.clone();
      var old=o.material,name=old.name;
      if(!materials.has(name)){
        var glowing=/^(Lamp|Amber)$/.test(name);
        var m=glowing?new T.MeshBasicMaterial({color:old.color}):new T.MeshLambertMaterial({color:old.color,side:T.DoubleSide});
        m.name=name;materials.set(name,m);
      }
      o.material=materials.get(name);o.castShadow=false;o.receiveShadow=false;
    });
    discard.forEach(function(o){o.parent.remove(o);});
    state.materials=Array.from(materials.values());state.root.add(model);state.root.updateMatrixWorld(true);
    model.traverse(function(o){if(/^front_\d\d$/.test(o.name))state.sectors.push({node:o,box:new T.Box3().setFromObject(o)});});
    buildCrowd(T,model,state);
    state.ready=true;api.status='ready';api.setTeamColors();
    return true;
  });
  return state.readyPromise;
};
// Open only foreground sectors. The camera inside the seating perimeter sees a closed bowl.
api.update=function(camera){
  if(!active||!active.ready)return;
  var u=active.crowdUniforms,now=performance.now()/1000;
  if(u){u.time.value=now;active.root.updateMatrixWorld(true);u.eye.value.copy(camera.position);active.root.worldToLocal(u.eye.value);
    if(typeof G!=='undefined'){
      var score=[G.hG||0,G.aG||0];
      if(active.score&&(score[0]>active.score[0]||score[1]>active.score[1])){active.cheerUntil=now+5;u.winner.value=score[0]>active.score[0]?0:1;}
      active.score=score;
    }
    u.cheer.value=Math.max(0,Math.min(1,((active.cheerUntil||0)-now)/2));
  }
  var p=camera.position, dir=camera.getWorldDirection(new camera.position.constructor());
  active.sectors.forEach(function(s){
    var b=s.box, outside=p.z>b.min.z-.8, below=p.y<b.max.y+1;
    var dz=Math.max(0,p.z-b.min.z),reach=dz*Math.tan(camera.fov*Math.PI/360)*camera.aspect+3;
    var cx=p.x+(dir.z<-.05?dir.x*(b.min.z-p.z)/dir.z:0);
    s.node.visible=!(outside&&below&&dir.z<-.05&&b.max.x>cx-reach&&b.min.x<cx+reach);
  });
};
api.inspect=function(){return {status:api.status,error:api.error,crowd:active?active.crowdStats:null,parts:active?active.sectors.map(function(s){return {name:s.node.name,visible:s.node.visible};}):[],materials:active?active.materials.map(function(m){return {name:m.name,color:m.color.getHexString(),type:m.type};}):[]};};
api.placeFlags=function(T,group,tex,home,PLEN,PWID){
  var k=PLEN/70,w=PWID/44.87,mat=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true});
  for(var i=0;i<6;i++){
    var upper=i>=3,row=upper?3:5;
    var off=upper?11.7:0,base=upper?8.4:.8,rise=upper?.57:.5;
    var m=new T.Mesh(new T.PlaneGeometry(1.6*k,1.0*k),mat);
    m.position.set((home?-1:1)*(8+(i%3)*9)*k,(base+row*rise+.45)*2/3*k,-(40+off+row*.83-.1)*2/3*w);
    m.rotation.x=-Math.atan2(.83,rise);group.add(m);
  }
};
window.U11_CLASSIC=api;
})();
