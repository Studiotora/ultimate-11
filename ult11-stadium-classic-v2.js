/* Classic upgrade: bowl-only Blender GLB. All gameplay coordinates stay in pitch3d.
   Load after THREE/GLTFLoader and before ult11-pitch3d.js. */
(function(){
'use strict';
var assetURL=new URL('assets/stadium/classic-upgraded.glb?v=1',document.currentScript.src).href;
var cached=null, pending=null, active=null;
var colors={homeCol:'#1e72dc',awayCol:'#c22020'};
var api={status:'idle',error:null};
// Supporter identity is independent of the home/away UI colors.
var SUPPORTER_PALETTES={
 italy:['#2086dc','#edf1e8','#183553'],holland:['#ef821f','#f4eee1','#24447d'],netherlands:['#ef821f','#f4eee1','#24447d'],
 germany:['#e8e8de','#292d35','#ab3034'],brazil:['#e5c637','#2e824d','#315797'],spain:['#bc3037','#e1bd43','#283b59'],
 france:['#305bab','#e3e7e5','#bb3d43'],ireland:['#309958','#e6e3d8','#e89c38'],scotland:['#29385d','#e7e4dc','#53739b'],
 belgium:['#b7313c','#2c3039','#dbb849'],austria:['#bd3340','#eeeee5','#343742'],croatia:['#e5e4dc','#c23840','#305a98'],
 wales:['#bc3741','#e5e1d6','#3b704e'],switzerland:['#c83c43','#e7e5df','#3e4149'],uruguay:['#78bcda','#e5e4da','#283c55'],
 china:['#c33a40','#e4c44b','#393d46'],sweden:['#e8cb42','#365f9b','#e7e6dc'],northkorea:['#b93d42','#e3e3d8','#314b79'],
 usa:['#e6e7df','#324c7d','#b7464b'],morocco:['#b93640','#3a7b53','#e9e5d5'],japan:['#305dae','#e6e5dd','#b9474e'],
 argentina:['#82c6df','#efeee3','#334354'],england:['#ebece3','#ba4549','#334b70'],portugal:['#b43240','#38714f','#dbc474'],
 allstar:['#dac04e','#eee7d6','#343e59']
};
api.supporterPalette=function(key,fallback){
 key=String(key||'').toLowerCase();if(SUPPORTER_PALETTES[key])return SUPPORTER_PALETTES[key].slice();
 var club=typeof CR_CLUBS!=='undefined'&&CR_CLUBS[key];
 return club&&club.colors?[club.colors[0],club.colors[1]||'#eeeeea','#555e68']:[fallback||'#52677c','#deded5','#485560'];
};
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
  var uniforms={atlas:{value:texture},time:{value:0},eye:{value:new T.Vector3()},home:{value:new T.Color(colors.homeCol)},away:{value:new T.Color(colors.awayCol)},homeAlt:{value:new T.Color()},awayAlt:{value:new T.Color()},homeAccent:{value:new T.Color()},awayAccent:{value:new T.Color()},cheer:{value:0},winner:{value:0},standLight:{value:.9}};
  var material=new T.ShaderMaterial({uniforms:uniforms,side:T.DoubleSide,depthWrite:true,
    vertexShader:`attribute vec3 anchor;attribute vec4 fan;attribute vec2 facing;varying vec2 tileUV;varying float team;varying float shade;varying float outfit;uniform float time;uniform vec3 eye;uniform float cheer;uniform float winner;
    void main(){float near=1.-smoothstep(24.,48.,distance(eye,anchor));float motion=fan.z*near;float celebrate=cheer*(1.-step(.1,abs(fan.y-winner)));
    float wave=sin(time*3.2+fan.w);float raised=step(.55,wave+celebrate)*step(.01,motion);
    tileUV=vec2((uv.x+fan.x)/16.,(uv.y+1.-raised)/2.);team=fan.y;outfit=fract(fan.w*7.13);shade=(.71+.22*fract(fan.w*3.7))*(.84+.16*uv.y);
    vec2 right=facing;vec2 toward=eye.xz-anchor.xz;vec2 billboard=normalize(vec2(-toward.y,toward.x)+vec2(.00001));
    if(dot(right,billboard)<0.)billboard=-billboard;right=normalize(mix(right,billboard,near*fan.z*.5));
    vec3 p=anchor+vec3(right.x*position.x,position.y,right.y*position.x);
    p.y+=max(0.,sin(time*(3.5+celebrate*3.)+fan.w))*motion*(.018+celebrate*.13);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform sampler2D atlas;uniform vec3 home;uniform vec3 away;uniform vec3 homeAlt;uniform vec3 awayAlt;uniform vec3 homeAccent;uniform vec3 awayAccent;uniform float standLight;varying float outfit;varying vec2 tileUV;varying float team;varying float shade;
    void main(){vec4 p=texture2D(atlas,tileUV);if(p.a<.5)discard;vec3 shirt=mix(home,away,team);
    if(outfit>.55)shirt=mix(homeAlt,awayAlt,team);if(outfit>.68)shirt=mix(homeAccent,awayAccent,team);
    if(outfit>.76)shirt=vec3(.17,.20,.25);if(outfit>.81)shirt=vec3(.60,.57,.49);if(outfit>.86)shirt=vec3(.79,.78,.70);if(outfit>.91)shirt=vec3(.36,.41,.39);if(outfit>.96)shirt=vec3(.40,.29,.25);
    if(p.g>.65&&p.r<.1&&p.b<.1)p.rgb=shirt*p.g;
    float lamp=0.88+0.12*sin(tileUV.x*100.0+team*3.0);
    gl_FragColor=vec4(p.rgb*shade*standLight*lamp,1.);}`});
  state.crowdUniforms=uniforms;state.crowdStats={spectators:0,animated:0,flags:0,batches:0};
  state.flashSpots=[];var batches={},parents={},seed=731;
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
          var animated=tier===0&&row<3?1:(tier<2&&rnd()<.08?.45:0),team=rnd()<(Math.abs(x)>40?(x<0?.91:.09):(.5-.26*Math.tanh(x/18)))?0:1,variant=Math.floor(rnd()*16),phase=rnd()*6.283;
          // feet rest on the row deck; atlas proportions include a small seat-height offset.
          [[-.23,0,0,0],[.23,0,1,0],[.23,.88,1,1],[-.23,0,0,0],[.23,.88,1,1],[-.23,.88,0,1]].forEach(function(q){
            batch.p.push(q[0],q[1],0);batch.a.push(x*2/3,(h+.13)*2/3,-z*2/3);batch.uv.push(q[2],q[3]);batch.f.push(variant,team,animated,phase);batch.dir.push(dx/len,-dy/len);});
          if((z>0||Math.abs(x)>62)&&k%31===3)state.flashSpots.push([x*2/3,(h+1.1)*2/3,-z*2/3]);
          state.crowdStats.spectators++;if(animated)state.crowdStats.animated++;
        }
      });
    }
  });
  Object.keys(batches).forEach(function(key){var b=batches[key],g=new T.BufferGeometry();
    [['position',b.p,3],['anchor',b.a,3],['uv',b.uv,2],['fan',b.f,4],['facing',b.dir,2]].forEach(function(v){g.setAttribute(v[0],new T.Float32BufferAttribute(v[1],v[2]));});
    var mesh=new T.Mesh(g,material);mesh.name='pixel_crowd_'+key;mesh.frustumCulled=false;(parents[key]||model).add(mesh);state.crowdStats.batches++;
  });

}

// Opaque terracing, under-decks and rear walls; front pieces inherit camera clearance.
function buildStandShell(T,model,state){
  var parents={},batches={};model.traverse(function(o){if(o.name==='bowl_fixed'||/^front_\d\d$/.test(o.name))parents[o.name]=o;});
  function outline(off){var hx=60+off,hy=40+off,r=12+off*.14,p=[];
    [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]].forEach(function(q){
      if(q[2]===270)p.push([-12,-hy],[12,-hy]);for(var i=0;i<9;i++){var a=(q[2]+i*90/8)*Math.PI/180;p.push([q[0]+r*Math.cos(a),q[1]+r*Math.sin(a)]);}});return p;}
  function band(inner,outer,yi,yo,col){var a=outline(inner),b=outline(outer);
    for(var i=0;i<a.length;i++){var j=(i+1)%a.length,n=Math.max(1,Math.ceil(Math.hypot(a[i][0]-a[j][0],a[i][1]-a[j][1])/4));
      for(var k=0;k<n;k++){
        var pts=[[a,i,j,k/n,yi],[a,i,j,(k+1)/n,yi],[b,i,j,(k+1)/n,yo],[b,i,j,k/n,yo]].map(function(q){return [(q[0][q[1]][0]*(1-q[3])+q[0][q[2]][0]*q[3])*2/3,q[4]*2/3,-(q[0][q[1]][1]*(1-q[3])+q[0][q[2]][1]*q[3])*2/3];});
        var cx=(pts[0][0]+pts[2][0])*.75,cz=-(pts[0][2]+pts[2][2])*.75,key=cz<-30?'front_'+String(Math.max(0,Math.min(11,Math.floor((cx+96)/16)))).padStart(2,'0'):'bowl_fixed';
        var batch=batches[key]||(batches[key]={p:[],c:[]});[0,1,2,0,2,3].forEach(function(v){batch.p.push.apply(batch.p,pts[v]);batch.c.push.apply(batch.c,col);});
      }
    }
  }
  [[0,.8,11,.82,.50],[11.7,8.4,8,.83,.57],[20.8,15.7,9,.83,.61]].forEach(function(t){
    var off=t[0],base=t[1],rows=t[2],depth=t[3],rise=t[4],end=off+rows*depth,top=base+(rows-1)*rise;
    for(var row=0;row<rows;row++){
      var d=off+row*depth,h=base+row*rise;
      band(d,d+depth,h-.045,h-.045,[.44,.47,.48]);
      if(row<rows-1)band(d+depth-.015,d+depth-.015,h-.06,h+rise-.045,[.22,.27,.31]);
    }
    // Continuous backing prevents any small mesh seams revealing the sky behind seats.
    band(off,end,base-.65,top-.15,[.19,.24,.28]);
    band(end,end+2.3,top-.06,top-.06,[.27,.32,.35]);
    band(end+2.3,end+2.3,-.25,top+.25,[.23,.28,.32]);
    band(off-.07,off-.07,base-.48,base-.06,[.12,.17,.22]);
  });
  var mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});mat.name='terrace_structure';
  state.shellTriangles=0;
  Object.keys(batches).forEach(function(key){var b=batches[key],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeVertexNormals();
    var m=new T.Mesh(g,mat);m.name='solid_terracing_'+key;(parents[key]||model).add(m);state.shellTriangles+=b.p.length/9;
  });
  // Baked ambient occlusion on the existing concrete: roof undersides stay darker.
  model.traverse(function(o){if(!o.isMesh||!o.material||!/^Concrete|Dark concrete|Roof silver$/.test(o.material.name))return;
    var g=o.geometry,a=g.attributes.position,n=g.attributes.normal,col=[];
    for(var i=0;i<a.count;i++){var up=n?n.getY(i):1,shade=up<-.2?.48:(up>.4?.88:.68);for(var k=0;k<3;k++)col.push(shade);}
    g.setAttribute('color',new T.Float32BufferAttribute(col,3));o.material.vertexColors=true;o.material.needsUpdate=true;
  });
}

// Seat finish: broad lighting and fine seat-to-seat variation without extra meshes.
// This is attached only to the imported seat materials, so the original geometry
// and the near-side camera sectors keep their existing behaviour.
function finishSeats(material){
  material.onBeforeCompile=function(shader){
    shader.vertexShader='varying vec3 vAstraSeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vAstraSeat=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vAstraSeat;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+
      'float seatNoise=fract(sin(dot(floor(vAstraSeat.xz*2.6),vec2(127.1,311.7)))*43758.5453);\n'+
      'float aisleGlow=pow(max(0.0,1.0-abs(sin(vAstraSeat.x*0.22))),18.0);\n'+
      'diffuseColor.rgb*=mix(0.80,1.08,seatNoise)*(0.91+0.10*aisleGlow);');
  };
  material.customProgramCacheKey=function(){return 'astra-seat-finish-v1';};
  material.needsUpdate=true;
}

// Thin strips trace the real tier edges. All strips share one draw call and
// stay attached to camera sectors so no foreground ribbon crosses gameplay.
function buildConcourse(T,model,state){
  var parents={},batches={};
  model.traverse(function(o){if(o.name==='bowl_fixed'||/^front_\d\d$/.test(o.name))parents[o.name]=o;});
  function outline(off){var hx=60+off,hy=40+off,r=12+off*.14,p=[];
    [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]].forEach(function(q){
      if(q[2]===270)p.push([-12,-hy],[12,-hy]);for(var i=0;i<9;i++){var a=(q[2]+i*90/8)*Math.PI/180;p.push([q[0]+r*Math.cos(a),q[1]+r*Math.sin(a)]);}});return p;}
  [[10.9,6.10],[19.85,12.45],[28.35,20.30]].forEach(function(t,tier){
    var path=outline(t[0]);
    for(var i=0;i<path.length;i++){
      var a=path[i],b=path[(i+1)%path.length],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
      for(var j=0;j<count;j++){
        var x0=a[0]+(b[0]-a[0])*j/count,z0=a[1]+(b[1]-a[1])*j/count;
        var x1=a[0]+(b[0]-a[0])*(j+1)/count,z1=a[1]+(b[1]-a[1])*(j+1)/count;
        var key=(z0+z1)<-60?'front_'+String(Math.max(0,Math.min(11,Math.floor(((x0+x1)*.5+96)/16)))).padStart(2,'0'):'bowl_fixed';
        var arr=batches[key]||(batches[key]={p:[],uv:[]}),h=t[1],s=2/3;
        var quad=[[x0,h-.065,z0,0,0],[x1,h-.065,z1,1,0],[x1,h+.065,z1,1,1],[x0,h+.065,z0,0,1]];
        [0,1,2,0,2,3].forEach(function(q){var v=quad[q];arr.p.push(v[0]*s,v[1]*s,-v[2]*s);arr.uv.push((j+v[3])*0.25+tier*0.17,v[4]);});
      }
    }
  });
  var uniforms={time:{value:0}};
  var mat=new T.ShaderMaterial({uniforms:uniforms,side:T.DoubleSide,depthWrite:false,transparent:true,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float time;varying vec2 vUv;void main(){float module=step(.08,fract(vUv.x));float pulse=.92+.08*sin(time*.8+vUv.x*3.0);vec3 navy=vec3(.025,.075,.13);vec3 cyan=vec3(.12,.51,.75);vec3 amber=vec3(.90,.53,.17);float accent=step(.84,fract(vUv.x*.29));vec3 ink=mix(cyan,amber,accent);float edge=smoothstep(0.,.2,vUv.y)*(1.-smoothstep(.8,1.,vUv.y));gl_FragColor=vec4(mix(navy,ink,module*edge*.74)*pulse,.94);}',
    fog:false});
  state.concourseUniforms=uniforms;
  Object.keys(batches).forEach(function(key){var b=batches[key],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
    var mesh=new T.Mesh(g,mat);mesh.name='astra_concourse_'+key;mesh.frustumCulled=false;(parents[key]||model).add(mesh);
  });
}

// The gap between the second and third seating decks becomes a glass suite
// level. Window frames, varied interior light, and reflections are procedural;
// each camera sector holds one small mesh rather than dozens of room objects.
function buildSuites(T,model,state){
  var parents={},batches={};
  model.traverse(function(o){if(o.name==='bowl_fixed'||/^front_\d\d$/.test(o.name))parents[o.name]=o;});
  function outline(off){var hx=60+off,hy=40+off,r=12+off*.14,p=[];
    [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]].forEach(function(q){
      if(q[2]===270)p.push([-12,-hy],[12,-hy]);for(var i=0;i<9;i++){var a=(q[2]+i*90/8)*Math.PI/180;p.push([q[0]+r*Math.cos(a),q[1]+r*Math.sin(a)]);}});return p;}
  var path=outline(20.55),distance=0;
  for(var i=0;i<path.length;i++){
    var a=path[i],b=path[(i+1)%path.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    var count=Math.max(1,Math.ceil(len/1.6));
    for(var j=0;j<count;j++){
      var f0=j/count,f1=(j+1)/count,x0=a[0]+(b[0]-a[0])*f0,z0=a[1]+(b[1]-a[1])*f0;
      var x1=a[0]+(b[0]-a[0])*f1,z1=a[1]+(b[1]-a[1])*f1;
      var key=(z0+z1)<-60?'front_'+String(Math.max(0,Math.min(11,Math.floor(((x0+x1)*.5+96)/16)))).padStart(2,'0'):'bowl_fixed';
      var dst=batches[key]||(batches[key]={p:[],uv:[]}),s=2/3;
      var p=[[x0,12.95,z0,distance+len*f0,0],[x1,12.95,z1,distance+len*f1,0],
             [x1,15.15,z1,distance+len*f1,1],[x0,15.15,z0,distance+len*f0,1]];
      [0,1,2,0,2,3].forEach(function(v){var q=p[v];dst.p.push(q[0]*s,q[1]*s,-q[2]*s);dst.uv.push(q[3]/2.0,q[4]);});
    }
    distance+=len;
  }
  var mat=new T.ShaderMaterial({side:T.DoubleSide,depthWrite:true,fog:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;void main(){float pane=floor(vUv.x);float hash=fract(sin(pane*89.13)*43758.54);float frame=step(.065,fract(vUv.x))*step(fract(vUv.x),.935)*step(.11,vUv.y)*step(vUv.y,.91);float occupied=step(.24,hash);vec3 dark=vec3(.018,.035,.060);vec3 cool=vec3(.11,.25,.35);vec3 warm=vec3(.65,.42,.20);vec3 room=mix(cool,warm,step(.61,hash));room*=.56+.30*hash;vec3 glass=mix(dark,room,frame*occupied);glass+=vec3(.025,.058,.075)*frame*(1.-vUv.y);float reflection=pow(max(0.,1.-abs(fract(vUv.x*.13+vUv.y*.23)-.5)*2.),16.);glass+=vec3(.05,.08,.09)*frame*reflection;gl_FragColor=vec4(glass,1.0);}' });
  state.suitePanels=0;
  Object.keys(batches).forEach(function(key){var b=batches[key],g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
    var m=new T.Mesh(g,mat);m.name='astra_suites_'+key;m.frustumCulled=false;(parents[key]||model).add(m);
    state.suitePanels+=b.p.length/18;
  });
}

function release(root){
  var gs=new Set(),ms=new Set();
  root.traverse(function(o){if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){ms.add(m);});});
  gs.forEach(function(g){g.dispose();});ms.forEach(function(m){m.dispose();});
}
api.dispose=function(){if(active){active.cancelled=true;if(active.crowdTexture)active.crowdTexture.dispose();release(active.root);if(active.root.parent)active.root.parent.remove(active.root);active=null;}};
api.setTeamColors=function(d){
  if(d){colors.homeCol=d.homeCol||colors.homeCol;colors.awayCol=d.awayCol||colors.awayCol;colors.homeKey=d.homeKey||colors.homeKey;colors.awayKey=d.awayKey||colors.awayKey;}
  if(!active)return;
  if(active.crowdUniforms){var u=active.crowdUniforms,h=api.supporterPalette(colors.homeKey,colors.homeCol),a=api.supporterPalette(colors.awayKey,colors.awayCol);
    u.home.value.set(h[0]);u.homeAlt.value.set(h[1]);u.homeAccent.value.set(h[2]);u.away.value.set(a[0]);u.awayAlt.value.set(a[1]);u.awayAccent.value.set(a[2]);}
  active.materials.forEach(function(m){
    if(m.name==='seats_home')m.color.set('#364857');
    if(m.name==='seats_away'||m.name==='seats_neutral')m.color.set('#40505c');
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
        if(/^seats_(home|away|neutral)$/.test(name))finishSeats(m);
      }
      o.material=materials.get(name);o.castShadow=false;o.receiveShadow=false;
    });
    discard.forEach(function(o){o.parent.remove(o);});
    state.materials=Array.from(materials.values());state.root.add(model);state.root.updateMatrixWorld(true);
    model.traverse(function(o){if(/^front_\d\d$/.test(o.name))state.sectors.push({node:o,box:new T.Box3().setFromObject(o)});});
    buildStandShell(T,model,state);
    buildCrowd(T,model,state);
    buildConcourse(T,model,state);
    buildSuites(T,model,state);
    state.ready=true;api.status='ready';api.setTeamColors();
    return true;
  });
  return state.readyPromise;
};
// Open only foreground sectors. The camera inside the seating perimeter sees a closed bowl.
api.update=function(camera){
  if(!active||!active.ready)return;
  var u=active.crowdUniforms,now=performance.now()/1000;
  if(active.concourseUniforms)active.concourseUniforms.time.value=now;
  if(u){u.time.value=now;active.root.updateMatrixWorld(true);u.eye.value.copy(camera.position);active.root.worldToLocal(u.eye.value);
    var light=window.P3D&&P3D.light;u.standLight.value=light?Math.max(.55,Math.min(1.15,1.07-(light.shade||0)*.28)):.93;
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
api.inspect=function(){return {status:api.status,error:api.error,crowd:active?active.crowdStats:null,shellTriangles:active?active.shellTriangles:0,suitePanels:active?active.suitePanels:0,parts:active?active.sectors.map(function(s){return {name:s.node.name,visible:s.node.visible};}):[],materials:active?active.materials.map(function(m){return {name:m.name,color:m.color.getHexString(),type:m.type};}):[]};};
api.flashSpots=function(){if(!active)return [];return active.flashSpots.map(function(p){return [p[0]*active.root.scale.x,p[1]*active.root.scale.y,p[2]*active.root.scale.z];});};
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
