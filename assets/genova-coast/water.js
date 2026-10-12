/* Harbour water for Borgo del Mare: adapter around hd2d-water.js (Studio Tora Lab, unmodified)
 * for the bundled three r128. It supplies the shore mask, the r128 colour/depth handling the
 * module does not do itself, the day/night grade and boat ripples, and keeps the old
 * createCoastWater(T,scene) -> {mesh,update,reflect,stats} surface so world.js / scene.js barely change. */
(()=>{'use strict';window.createCoastWater=function(T,scene,opts={}){
if(!T.Object3D.prototype.removeFromParent)T.Object3D.prototype.removeFromParent=function(){if(this.parent)this.parent.remove(this);return this}; // dispose() needs it; r128 predates it
const W=300,D=180,level=-.65,center={x:40,z:30},res=1200; // 1200 px over 300 m = 0.25 m mask pixels, so every quay edge lands exactly on a pixel border; wide enough for the canal district in the east
const ox=center.x-W/2,oz=center.z-D/2,rocks=opts.rocks||[],boats=opts.boats||[];
// Land footprints = the quay boxes in world.js ([x0,x1,z0,z1]); anything north of z=-16 is the hill.
const quays=window.CoastCanal?CoastCanal.quays:[[-21,21,-16,8],[-21,-10,8,18],[10,21,8,12]];     // promenade, piers and the canal district (canal.js)
function isWater(u,v){const x=ox+u*W,z=oz+v*D;if(z<-16)return false;
 for(const q of quays)if(x>q[0]&&x<q[1]&&z>q[2]&&z<q[3])return false;
 for(const r of rocks){const dx=x-r.x,dz=z-r.z;if(dx*dx+dz*dz<r.r*r.r)return false}
 return true}
// Day palette in display (sRGB) values; the module expects linear on r128, which has no colour management.
const day={deep:'#0e3a5e',mid:'#1d7399',shallow:'#34a8b4',light:'#a4ecd8',foam:'#f4fcff',sky:'#bfe3f2',sun:'#fff0cc'};
const slot={deep:'uDeep',mid:'uMid',shallow:'uShallow',light:'uLight',foam:'uFoam',sky:'uSky',sun:'uSun'};
const nightTint=new T.Color(.26,.36,.58),tint=new T.Color(),tmp=new T.Color(),SHEEN=.06,GLINTS=.55; // sun sheen / glint strength at noon, faded out at night
const pixelRatio=Math.min(window.devicePixelRatio||1,1.5);
const water=createHD2DWater(T,{width:W,depth:D,position:new T.Vector3(center.x,level,center.z),mask:isWater,maskResolution:res,
 palette:day,pixelSize:1/16,deepDistance:7,shallowOpacity:.72,normalStrength:.75,
 sunDirection:new T.Vector3(-.45,.70,-.55),sheen:SHEEN,glints:GLINTS,reflectivity:.18,distortion:.08,
 reflectionScale:Math.min(.5,720/(Math.max(innerWidth,innerHeight)*pixelRatio)),ambientRipples:.3});
// Same pipeline as the rest of the map: display-referred output, no second tone-map, depth written so
// the depth-of-field pass in finish.js sees the sea surface instead of the far plane.
water.material.toneMapped=false;water.material.depthWrite=true;
// Render the reflection with the same output encoding as the main pass so every material reuses its compiled
// program (a Linear target doubled the shader count), and decode it back to linear where the water samples it.
water.uniforms.uReflTex.value.encoding=T.sRGBEncoding;
water.material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('vec4 rs = texture2D(uReflTex, ruv);','vec4 rs = texture2D(uReflTex, ruv); rs.rgb = pow(max(rs.rgb, vec3(0.0)), vec3(2.2));')};
water.mesh.name='Ligurian_sea';water.mesh.renderOrder=0;water.object.children.forEach(c=>{if(c.isPoints)c.renderOrder=1});
scene.add(water.object);
let last=null,dt=0,frame=0,captures=0,reflectionCalls=0;const next=boats.map((b,i)=>1.2+i*1.1);
function grade(n){tint.setRGB(1,1,1).lerp(nightTint,n*.88);
 for(const k in slot){tmp.set(day[k]);if(k!=='sun')tmp.multiply(tint);tmp.convertSRGBToLinear();water.uniforms[slot[k]].value.copy(tmp)}
 water.uniforms.uGlints.value=GLINTS*(1-n);water.uniforms.uSheen.value=SHEEN*(1-n)}
function update(t,n){dt=last===null?0:Math.max(0,t-last);last=t;grade(n);
 boats.forEach((b,i)=>{if(t>=next[i]){water.ripple(b.x,b.z,.6);next[i]=t+3.2+i*.4}})} // strength >0.47 is what lets the leading ring foam up
// Called once per frame after update(): advances the water and refreshes the planar reflection every second frame.
function reflect(renderer,camera){const full=frame++%2===0,c0=renderer.info.render.calls;
 water.update(dt,full?renderer:null,full?scene:null,full?camera:null);
 if(full){captures++;reflectionCalls=Math.max(0,renderer.info.render.calls-c0)}}
return {mesh:water.mesh,object:water.object,material:water.material,water,palette:day,update,reflect,
 stats(){const img=water.uniforms.uReflTex.value.image;return {captures,reflectionCalls,resolution:img?img.width:0}},
 dispose(){water.dispose()}};
};})();
