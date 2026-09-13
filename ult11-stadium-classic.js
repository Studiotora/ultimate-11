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
function release(root){
  var gs=new Set(),ms=new Set();
  root.traverse(function(o){if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){ms.add(m);});});
  gs.forEach(function(g){g.dispose();});ms.forEach(function(m){m.dispose();});
}
api.dispose=function(){if(active){active.cancelled=true;release(active.root);if(active.root.parent)active.root.parent.remove(active.root);active=null;}};
api.setTeamColors=function(d){
  if(d){colors.homeCol=d.homeCol||colors.homeCol;colors.awayCol=d.awayCol||colors.awayCol;}
  if(!active)return;
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
    state.ready=true;api.status='ready';api.setTeamColors();
    return true;
  });
  return state.readyPromise;
};
// Open only foreground sectors. The camera inside the seating perimeter sees a closed bowl.
api.update=function(camera){
  if(!active||!active.ready)return;
  var p=camera.position, dir=camera.getWorldDirection(new camera.position.constructor());
  active.sectors.forEach(function(s){
    var b=s.box, outside=p.z>b.min.z-.8, below=p.y<b.max.y+1;
    var dz=Math.max(0,p.z-b.min.z),reach=dz*Math.tan(camera.fov*Math.PI/360)*camera.aspect+3;
    var cx=p.x+(dir.z<-.05?dir.x*(b.min.z-p.z)/dir.z:0);
    s.node.visible=!(outside&&below&&dir.z<-.05&&b.max.x>cx-reach&&b.min.x<cx+reach);
  });
};
api.inspect=function(){return {status:api.status,error:api.error,parts:active?active.sectors.map(function(s){return {name:s.node.name,visible:s.node.visible};}):[],materials:active?active.materials.map(function(m){return {name:m.name,color:m.color.getHexString(),type:m.type};}):[]};};
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
