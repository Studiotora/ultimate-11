/* Pixel materials: world-unit mapping survives instancing; no stretched face UVs.
 * Shared by the Borgo and Marassi Square (CoastArt.patch retargets an existing material), so the maps use one material look. */
(()=>{'use strict';const T=THREE,textures={},cache=new Map(),BASE=document.currentScript.src;let seed=61519;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function canvas(n=128){const c=document.createElement('canvas');c.width=c.height=n;return c}
function tex(c,repeat=true){const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.magFilter=T.NearestFilter;t.minFilter=repeat?T.LinearMipmapLinearFilter:T.NearestFilter;t.generateMipmaps=repeat;t.wrapS=t.wrapT=repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;t.anisotropy=4;return t}
function paint(kind){const c=canvas(64),p=c.getContext('2d');const pal=kind==='grass'?['#304b3a','#435e3d','#597345','#7d8d50','#a3a965']:kind==='wood'?['#5f5447','#75664f','#84715a','#9b8564']:['#878779','#acaa95','#b9b39f','#c8c1ad'];p.fillStyle=pal[1];p.fillRect(0,0,64,64);
for(let i=0;i<650;i++){p.fillStyle=pal[rand()*pal.length|0];const x=rand()*64|0,y=rand()*64|0;p.fillRect(x,y,kind==='wood'?1:2+rand()*4,kind==='wood'?4+rand()*15:1+rand()*3)}return tex(c)}
textures.grass=paint('grass');textures.wood=paint('wood');textures.stone=paint('stone');
/* Brick for the Ferraris wall: 4 bricks across and 8 courses per tile, hand-picked reds with a lit top edge, a shaded foot and the odd burnt brick. */
function brickTile(){const c=canvas(128),p=c.getContext('2d'),reds=['#9a5a43','#a8654a','#b2704f','#8c4f3b','#bd7c5a','#a05b45'];p.fillStyle='#6f5b4c';p.fillRect(0,0,128,128);
  for(let row=0;row<8;row++){const off=row%2?16:0;for(let col=-1;col<4;col++){const x=col*32+off,y=row*16,r=rand();p.fillStyle=r<.09?'#5e3a30':reds[rand()*reds.length|0];p.fillRect(x+1,y+1,30,14);
    p.fillStyle='rgba(255,230,200,.20)';p.fillRect(x+1,y+1,30,2);p.fillStyle='rgba(30,12,8,.28)';p.fillRect(x+1,y+13,30,2);
    for(let i=0;i<7;i++){p.fillStyle=rand()<.5?'rgba(255,225,190,.18)':'rgba(40,18,12,.2)';p.fillRect(x+2+rand()*26|0,y+3+rand()*9|0,2+rand()*3|0,1+rand()*2|0)}}}
  return tex(c)}
textures.brick=brickTile();
const windowCanvas=canvas(48),wp=windowCanvas.getContext('2d');wp.fillStyle='#172e33';wp.fillRect(0,0,48,48);wp.fillStyle='#426368';wp.fillRect(3,2,19,43);wp.fillRect(26,2,19,43);wp.fillStyle='#839591';for(let i=0;i<18;i++){wp.fillRect(3+i,4+i,2,9);wp.fillRect(26+i,16+i,2,7)}wp.fillStyle='#b3afa0';wp.fillRect(22,0,4,48);wp.fillRect(0,24,48,3);wp.fillStyle='#d3c8a5';wp.fillRect(3,2,3,43);wp.fillRect(42,2,3,43);wp.fillStyle='#627469';for(let i=0;i<6;i++)wp.fillRect(6+i,3,1,27-i*3);textures.window=tex(windowCanvas,false);
const glass=new T.MeshStandardMaterial({map:textures.window,roughness:.48,color:0xffffff,emissive:0xb97d3e,emissiveIntensity:0});
/* About 4 windows in 10 are lit at night: the lit panes use a twin material whose emissive world.js switches on; the choice is a position hash, so the seeded layout is untouched. */
const glassLit=glass.clone();glassLit.emissive.set(0xffa24a);
function windowGlass(x,y,z){const h=Math.imul(Math.round(x*7)*73856093^Math.round(y*7)*19349663^Math.round(z*7)*83492791,2654435761)>>>0;return (h>>>8)%100<42?glassLit:glass}
function foliage(){const c=canvas(96),p=c.getContext('2d');const colors=['#1c3833','#2b4c3b','#3c6344','#537a48','#799452','#a7b76a'];
for(let layer=0;layer<4;layer++)for(let i=0;i<280;i++){const x=48+(rand()-.5)*78,y=48+(rand()-.5)*70;const nx=(x-48)/39,ny=(y-48)/36;if(nx*nx+ny*ny>1+Math.sin(x*.7)*.07)continue;const r=2+rand()*7;p.fillStyle=colors[Math.max(0,Math.min(5,(layer+(48-y)/25+rand()*2)|0))];p.fillRect(x|0,y|0,r|0,r*.7|0)}
for(let i=0;i<240;i++){const x=rand()*96|0,y=rand()*96|0;if(p.getImageData(x,y,1,1).data[3]){p.fillStyle=colors[3+(rand()*3|0)];p.fillRect(x,y,2,1)}}return tex(c,false)}textures.foliage=foliage();
function flowers(){const c=canvas(48),p=c.getContext('2d');for(let i=0;i<30;i++){const x=4+rand()*40,y=9+rand()*25;p.fillStyle='#436342';p.fillRect(x|0,y|0,1,48-y);p.fillStyle=['#b15767','#d18386','#e5b4aa','#e6ca8d'][i%4];p.fillRect(x-2|0,y-1|0,4,3);p.fillStyle='#eed998';p.fillRect(x|0,y|0,1,1)}return tex(c,false)}textures.flowers=flowers();
const ready=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{['plaster','roof','paving','shutter'].forEach((name,i)=>{const c=canvas(128),p=c.getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(im,(i%2)*im.width/2,(i>>1)*im.height/2,im.width/2,im.height/2,0,0,128,128);textures[name]=tex(c)});resolve()};im.onerror=()=>reject(Error('Pixel material atlas could not load'));im.src=new URL('assets/liguria-materials-v2.png',BASE).href});
function material(color,kind='plaster',units=8){const key=[color,kind,units].join(':');if(cache.has(key))return cache.get(key);const m=new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:.98});patch(m,kind,units);cache.set(key,m);return m}
/* Map an existing material onto one of the pixel tiles in world space (tile = `units` metres). Keeps the material's own colour. */
function patch(m,kind='plaster',units=8){m.map=textures[kind];m.userData.pixelMaterial=kind;m.userData.texelsPerUnit=128/units;
m.onBeforeCompile=s=>{s.uniforms.coastScale={value:1/units};s.vertexShader='varying vec3 vCoastP;varying vec3 vCoastN;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 coastLocal=vec4(transformed,1.0);vec3 coastNormal=normal;
#ifdef USE_INSTANCING
coastLocal=instanceMatrix*coastLocal;coastNormal=mat3(instanceMatrix)*coastNormal;
#endif
vCoastP=(modelMatrix*coastLocal).xyz;vCoastN=normalize(mat3(modelMatrix)*coastNormal);`);
s.fragmentShader='varying vec3 vCoastP;varying vec3 vCoastN;uniform float coastScale;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 cn=abs(normalize(vCoastN));vec2 cu=cn.y>max(cn.x,cn.z)?vCoastP.xz:(cn.x>cn.z?vCoastP.zy:vCoastP.xy);vec4 ct=texture2D(map,cu*coastScale);ct.rgb=mix(vec3(.94),ct.rgb,${kind==='plaster'?'.60':kind==='stone'?'.55':'1.0'});diffuseColor*=mapTexelToLinear(ct);`)};m.customProgramCacheKey=()=> 'coast-world-pixel-v2-'+kind;m.needsUpdate=true;return m}
const leafMaterial=new T.MeshLambertMaterial({map:textures.foliage,alphaTest:.45,side:T.DoubleSide}),flowerMaterial=new T.MeshLambertMaterial({map:textures.flowers,alphaTest:.45,side:T.DoubleSide});
function cluster(parent,x,y,z,size=1,flower=false){const material=flower?flowerMaterial:leafMaterial;for(let i=0;i<3;i++){const m=new T.Mesh(new T.PlaneGeometry(size*2,size*(flower?1:1.65)),material);m.position.set(x,y,z);m.rotation.y=i*Math.PI/3;m.castShadow=m.receiveShadow=true;parent.add(m)} }
window.CoastArt={ready,textures,material,patch,cluster,glass,glassLit,windowGlass};
})();

