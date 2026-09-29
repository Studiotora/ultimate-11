(function(){
'use strict';
window.U11_HIGHSCHOOL={build:function(T,root,plen,pwid){
var pending=[],atlas=new Image();
// Warm facade fill preserves visible schoolyard detail beneath the canopy.
var amb=new T.AmbientLight(0xe4e8db,.62);amb.name='U11HS_amb';root.add(amb);
var fill=new T.DirectionalLight(0xffedcb,.70);fill.name='U11HS_fill';fill.position.set(-35,30,65);root.add(fill);
var siteRoot=root;
var skyMap=new T.TextureLoader().load('assets/stadium/highschool/afternoon-sky.png');
var sky=new T.Mesh(new T.SphereGeometry(850,32,16),new T.MeshBasicMaterial({map:skyMap,side:T.BackSide,fog:false,depthWrite:false}));
sky.renderOrder=-12;sky.name='U11HS_sky';root.add(sky);
function mat(color,tile){var m=new T.MeshLambertMaterial({color:color});if(tile!=null)pending.push([m,tile]);return m;}
var concrete=mat(0xd5ccb8,0),roof=mat(0x899ca8,1),track=mat(0xbe8262,2),leaves=mat(0xc5cf8c,3),blue=mat(0x315388),steel=mat(0x58778a),white=mat(0xe5ddc7),wood=mat(0x675644),glass=mat(0x6c899c),dark=mat(0x162c3c);
atlas.onload=function(){pending.forEach(function(p){var c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(atlas,(p[1]%2)*atlas.width/2,Math.floor(p[1]/2)*atlas.height/2,atlas.width/2,atlas.height/2,0,0,512,512);var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;p[0].map=t;p[0].needsUpdate=true;});};atlas.src='assets/stadium/highschool/materials-atlas.png';
var boxG=new T.BoxGeometry(1,1,1),batches={};
function flush(){Object.keys(batches).forEach(function(k){var b=batches[k],inst=new T.InstancedMesh(boxG,b.m,b.items.length),o=new T.Object3D();b.items.forEach(function(v,i){o.position.set(v[0],v[1],v[2]);o.scale.set(v[3],v[4],v[5]);o.updateMatrix();inst.setMatrixAt(i,o.matrix);});root.add(inst);});batches={};}
function box(x,y,z,w,h,d,m){var k=m.uuid;if(!batches[k])batches[k]={m:m,items:[]};batches[k].items.push([x,y,z,w,h,d]);}
function mesh(g,m,x,y,z){var a=new T.Mesh(g,m);a.position.set(x,y,z);root.add(a);return a;}
function bar(a,b,r,m){var va=new T.Vector3(a[0],a[1],a[2]),vb=new T.Vector3(b[0],b[1],b[2]),delta=vb.clone().sub(va);var o=mesh(new T.CylinderGeometry(r,r,delta.length(),6),m,0,0,0);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
var edge=-pwid/2,front=edge-3,back=front-6.6;
box(0,-.13,edge-1.4,plen+18,.22,2.4,track);box(0,-.14,front-4,plen+20,.25,7.5,concrete);
flush();var standRoot=new T.Group();siteRoot.add(standRoot);root=standRoot;standRoot.scale.x=.72;
for(var row=0;row<7;row++){var y=.20+row*.40,z=front-1-row*.78;box(0,y/2,z,44,y,.86,concrete);
for(var col=0;col<49;col++){var x=(col-24)*.85;if(Math.abs(x)<1.45||Math.abs(Math.abs(x)-10.2)<.9)continue;
box(x,y+.20,z,.73,.12,.50,blue);box(x,y+.46,z-.23,.73,.48,.09,blue);box(x,y+.08,z,.08,.22,.38,steel);
if(((col*17+row*31)%19)<4){var shirt=[blue,white,dark][(col+row)%3];box(x,y+.53,z+.03,.28,.47,.23,shirt);box(x-.10,y+.19,z+.25,.10,.40,.12,dark);box(x+.10,y+.19,z+.25,.10,.40,.12,dark);mesh(new T.SphereGeometry(.14,7,5),white,x,y+.90,z);mesh(new T.SphereGeometry(.15,7,5,0,Math.PI*2,0,Math.PI*.50),wood,x,y+.94,z);}}}
box(0,2,back-.1,45,1.2,.28,concrete);[-22.4,22.4].forEach(function(x){box(x,1.65,front-3.4,.38,3.3,6.5,concrete);});
box(0,6.45,front-3.6,46,.22,8.2,roof);box(0,6.24,front+.4,46,.25,.22,steel);box(0,6.24,back-.5,46,.25,.22,steel);
for(var x=-22;x<=22;x+=5.5){box(x,3.20,front-.10,.18,6.4,.18,steel);box(x,3.20,back,.18,6.4,.18,steel);box(x,6.16,front-3.6,.14,.2,8,steel);bar([x,5.1,back],[x,6.18,back+1.5],.045,steel);}
for(var rz=front-7.5;rz<front+.6;rz+=.32)box(0,6.34,rz,46,.07,.035,steel);
box(0,3.8,back+.9,6,3,2.3,concrete);box(0,4.15,back+2.09,5.45,1.55,.05,glass);box(0,5.40,back+.9,6.5,.22,2.8,white);
[-2.7,-.9,.9,2.7].forEach(function(x){box(x,4.15,back+2.15,.065,1.6,.06,white);});box(0,3.32,back+2.15,5.5,.08,.06,white);
for(var aisle=-10.2;aisle<=10.2;aisle+=10.2){bar([aisle,.75,front-.2],[aisle,3.0,front-5.6],.035,white);for(var q=0;q<4;q++)box(aisle,.65+q*.57,front-.4-q*1.5,.05,1.1,.05,white);}
box(0,2.67,back-.1,45,.12,.42,white);flush();root=siteRoot;
var c=document.createElement('canvas');c.width=c.height=64;var ctx=c.getContext('2d');ctx.strokeStyle='rgba(202,216,179,.64)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,32);ctx.lineTo(32,0);ctx.lineTo(64,32);ctx.lineTo(32,64);ctx.closePath();ctx.stroke();
var ft=new T.CanvasTexture(c);ft.wrapS=ft.wrapT=T.RepeatWrapping;ft.repeat.set(110,5);
mesh(new T.PlaneGeometry(plen+12,2),new T.MeshBasicMaterial({map:ft,transparent:true,side:T.DoubleSide,depthWrite:false}),0,1,edge-2.6);
for(var i=-40;i<=40;i+=4)box(i,1.05,edge-2.6,.075,2.1,.075,steel);box(0,2.05,edge-2.6,82,.07,.07,steel);
function banner(text,x,w,bg,fg){var ca=document.createElement('canvas');ca.width=1024;ca.height=160;var cx=ca.getContext('2d');cx.fillStyle=bg;cx.fillRect(0,0,1024,160);cx.strokeStyle='#b8ac7c';cx.lineWidth=5;cx.strokeRect(5,5,1014,150);cx.fillStyle=fg;cx.font='bold 50px Rajdhani,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,512,83,945);mesh(new T.PlaneGeometry(w,1.62),new T.MeshBasicMaterial({map:new T.CanvasTexture(ca),side:T.DoubleSide}),x,1.05,edge-2.48);}
banner('SCHOOL FOOTBALL TOURNAMENT',0,10,'#e7dfc8','#203857');banner('SEIZE TOMORROW',-12.9,6.5,'#203b64','#ebe3cf');banner('MORE THAN A GAME',12.9,6.5,'#203b64','#ebe3cf');
[-24,24].forEach(function(x){var translucent=new T.MeshLambertMaterial({color:0xdbe2d2,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false});box(x,.95,edge-2.7,8,1.9,.035,translucent);box(x,2,edge-2,8,.06,1.5,translucent);
for(var k=-4;k<=4;k+=2){var points=[];for(var n=0;n<=12;n++){var a=n/12*Math.PI/2;points.push(new T.Vector3(x+k,Math.sin(a)*2,edge-2.7+Math.cos(a)*1.5));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.035,5,false),white,0,0,0);}
for(var k=-3;k<=3;k++){box(x+k,.5,edge-1.75,.75,.10,.55,blue);box(x+k,.82,edge-2,.75,.55,.08,blue);}});
[-29,29].forEach(function(x){box(x,6.1,back-17,17,12,8,concrete);box(x,12.2,back-17,18,.5,9,white);
for(var floor=0;floor<3;floor++)for(var col=0;col<8;col++){var xx=x-7+col*2,yy=2.9+floor*3.6;box(xx,yy,back-12.95,1.65,2.5,.10,glass);box(xx,yy,back-12.85,.055,2.5,.04,white);box(xx,yy+.1,back-12.85,1.65,.055,.04,white);}
for(var floor=0;floor<4;floor++)box(x,1.15+floor*3.6,back-12.8,17,.24,.4,white);});
// Curved shelter glazing and a few modest sideline equipment details.
[-24,24].forEach(function(x){var cm=new T.MeshLambertMaterial({color:0xdce9e4,transparent:true,opacity:.25,side:T.DoubleSide,depthWrite:false});
var g=new T.BufferGeometry(),v=[],uv=[],indices=[];for(var i=0;i<=16;i++){var a=i/16*Math.PI/2;v.push(x-4,Math.sin(a)*2,edge-2.7+Math.cos(a)*1.5,x+4,Math.sin(a)*2,edge-2.7+Math.cos(a)*1.5);uv.push(0,i/16,1,i/16);if(i<16){var k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();root.add(new T.Mesh(g,cm));
box(x,.12,edge-1.9,8.4,.15,2.1,concrete);box(x-4.4,.32,edge-1.8,.5,.6,.5,dark);box(x+4.3,.21,edge-1.6,.3,.4,.3,blue);});
[-19,19].forEach(function(x){box(x,0,back-4,2,.06,12,concrete);box(x,3.5,front-1,.08,7,.08,steel);box(x,7,front-1,.38,.5,.3,white);});
var leafG=new T.IcosahedronGeometry(1,1);
for(var i=0;i<24;i++){var x=-47+i*4.1,z=back-12-(i%3)*3.1,h=4.6+(i*13%7)*.50;bar([x,0,z],[x,h*.8,z],.18,wood);for(var j=0;j<7;j++){var a=j*2.4+i;var treeMesh=mesh(leafG,leaves,x+Math.sin(a)*1.6,h+Math.cos(j)*1.4,z+Math.cos(a));treeMesh.scale.set(1.55+(j%2)*.45,1.8,1.55);}}
// The school ground is a complete site: every camera sees the same physical campus.
var L=plen/2,W=pwid/2,walk=mat(0xb4b19b,0),asphalt=new T.MeshBasicMaterial({color:0x555c60}),brick=mat(0xb9906e,0),hedge=mat(0x658648,3),treeMid=mat(0x819b58,3),treeDark=mat(0x557343,3),line=mat(0xdbd7bf),rubber=mat(0x292f31),carBlue=mat(0x406987),carRed=mat(0x984e43),carCream=mat(0xc7c4ae),carGreen=mat(0x536b61);
// Reuse the pitch renderer's grass so the visible apron joins an uninterrupted landscape.
if(siteRoot.parent){siteRoot.parent.children.some(function(o){if(o.isMesh&&o.geometry&&o.geometry.parameters&&Math.abs((o.geometry.parameters.width||0)-plen*2.4)<.01&&o.material){var gm=o.material.clone();if(gm.map){gm.map=gm.map.clone();gm.map.repeat.set(1600/24,1600/24);gm.map.needsUpdate=true;}var ground=mesh(new T.PlaneGeometry(1600,1600),gm,0,-.075,0);ground.rotation.x=-Math.PI/2;return true;}return false;});}
// Four connected terracotta runoff strips and pale pedestrian circuit.
box(0,-.019,W+1.65,plen+7,.04,3.3,track);
[-1,1].forEach(function(s){box(s*(L+1.75),-.019,0,3.5,.04,pwid,track);box(s*(L+5.4),-.01,0,2.6,.05,pwid+13,walk);});
box(0,-.01,W+5.1,plen+13,.05,2.7,walk);
box(0,-.01,back-5.8,plen+23,.05,2.7,walk);
// Paving joints and low stone curbs make the pedestrian routes legible.
for(var x=-L-6;x<L+6;x+=2.2){box(x,.022,W+5.1,.024,.01,2.65,concrete);box(x,.022,back-5.8,.024,.01,2.65,concrete);}
[-1,1].forEach(function(s){box(s*(L+6.8),.09,0,.16,.2,pwid+14,concrete);});
box(0,.07,W+6.5,plen+14,.16,.16,concrete);
// Continuous chain-link perimeter, with a proper entrance opening on the south.
function fence(ax,az,bx,bz,height){var len=Math.hypot(bx-ax,bz-az),h=height||2.2,tex=ft.clone();tex.repeat.set(len*1.2,h*2.3);tex.needsUpdate=true;var fm=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false});var panel=mesh(new T.PlaneGeometry(len,h),fm,(ax+bx)/2,h/2,(az+bz)/2);panel.rotation.y=-Math.atan2(bz-az,bx-ax);var num=Math.ceil(len/3.7);for(var n=0;n<=num;n++){var t=n/num;box(ax+(bx-ax)*t,h/2,az+(bz-az)*t,.08,h+.12,.08,steel);}bar([ax,h,az],[bx,h,bz],.034,steel);bar([ax,.12,az],[bx,.12,bz],.025,steel);}
fence(-L-3.2,-W-2.6,-L-3.2,W+3.25);fence(L+3.2,-W-2.6,L+3.2,W+3.25);
fence(-L-3.2,W+3.25,-12,W+3.25);fence(-6,W+3.25,L+3.2,W+3.25);
// Higher ball-stop net panels remain behind both goals.
fence(-L-3.25,-8,-L-3.25,8,4.8);fence(L+3.25,-8,L+3.25,8,4.8);
// Roads surround the campus; sidewalks, crossings and painted center lines are geometry.
box(0,-.014,51,166,.06,7,asphalt);box(0,-.014,-66,166,.06,6,asphalt);
box(70,-.014,-7.5,6,.06,117,asphalt);box(-80,-.014,-7.5,6,.06,117,asphalt);
box(0,.011,46.5,165,.10,2,walk);box(0,.011,55.5,170,.10,2,walk);
box(65.5,.011,-8,2,.10,119,walk);box(-75.5,.011,-8,2,.10,119,walk);
box(0,.011,-61.5,165,.10,2,walk);
for(var x=-77;x<78;x+=7){box(x,.024,51,3,.012,.095,line);box(x,.024,-66,3,.012,.095,line);}
for(var z=-59;z<48;z+=7){box(70,.024,z,.095,.012,3,line);box(-80,.024,z,.095,.012,3,line);}
[-1,1].forEach(function(s){box(0,.025,51+s*3.12,166,.014,.085,line);});
for(var k=0;k<7;k++){box(-12+k*.85,.03,51,.5,.015,5.7,line);box(70,.03,39+k*.85,5.5,.015,.5,line);}
// East parking court: two rows of marked bays, planted central island and parked cars.
box(54,-.013,2,18,.07,70,asphalt);box(54,.03,-33.2,18,.14,.22,concrete);box(54,.03,37.2,18,.14,.22,concrete);
for(var z=-30;z<=34;z+=3.4){box(47.7,.029,z,5.2,.02,.065,line);box(60,.029,z,5.2,.02,.065,line);}
box(54,.14,3,1.4,.34,30,concrete);box(54,.36,3,1.1,.3,29,hedge);
var wheelG=new T.CylinderGeometry(.33,.33,.22,8),wheelItems=[];
function car(x,z,m,alongZ){flush();var carRoot=new T.Group();siteRoot.add(carRoot);root=carRoot;carRoot.position.set(x,0,z);carRoot.rotation.y=alongZ?Math.PI/2:0;box(0,.60,0,3.8,.62,1.7,m);box(-.2,1.14,0,1.95,.69,1.48,m);box(-.2,1.21,.755,1.8,.39,.025,glass);box(-.2,1.21,-.755,1.8,.39,.025,glass);box(.80,1.15,0,.025,.50,1.32,glass);box(-1.22,1.15,0,.025,.46,1.32,glass);box(1.91,.60,0,.05,.17,1.4,white);box(-1.91,.61,0,.05,.17,1.4,carRed);[-1.15,1.15].forEach(function(wx){[-.88,.88].forEach(function(wz){var wh=mesh(wheelG,rubber,wx,.36,wz);wh.rotation.x=Math.PI/2;});});flush();root=siteRoot;}
var colors=[carBlue,carCream,carGreen,carRed,white];
for(var n=0;n<15;n++){if(n%4!==2)car(n%2?47.8:59.9,-26+n*4.1,colors[n%5],false);}
car(21,51.9,carCream,false);car(-41,49.9,carBlue,false);
// West gymnasium: a fully modeled double-height hall with skylights and glazing on all sides.
box(-57,5.3,-9,23,10.6,31,concrete);box(-57,.3,-9,24,.55,32,brick);
var roofA=mesh(new T.BoxGeometry(12.2,.28,33),roof,-62.8,11.1,-9);roofA.rotation.z=.14;
var roofB=mesh(new T.BoxGeometry(12.2,.28,33),roof,-51.2,11.1,-9);roofB.rotation.z=-.14;
box(-57,11.97,-9,.18,.14,33,steel);
for(var zz=-22;zz<=4;zz+=4.2){box(-45.44,5.3,zz,.08,6.9,3.5,glass);box(-68.56,5.3,zz,.08,6.9,3.5,glass);box(-45.35,5.3,zz,.06,7,.08,white);box(-45.32,4.4,zz,.06,.09,3.5,white);box(-68.63,4.4,zz,.06,.09,3.5,white);[-62.7,-51.3].forEach(function(xx){var sk=mesh(new T.BoxGeometry(3.7,.06,2.15),glass,xx,11.32,zz);sk.rotation.z=xx<-57?.14:-.14;});}
for(var xx=-65;xx<=-49;xx+=3.9){box(xx,4.6,6.54,3.15,5.5,.08,glass);box(xx,4.6,-24.54,3.15,5.5,.08,glass);box(xx,4.6,6.62,.06,5.6,.05,white);box(xx,4.5,6.62,3.2,.07,.05,white);}
box(-57,1.9,6.64,3.2,3.8,.12,steel);box(-57,1.9,6.73,.08,3.8,.04,white);box(-57,4.2,7.5,5,.15,2.1,roof);box(-57,.01,11,10,.07,8,walk);box(-45,.01,-7,3,.07,39,walk);
// Front changing rooms and caretaker lodge frame a pedestrian entrance plaza.
box(15,2.0,37,24,4,7.3,brick);box(15,4.13,37,24.6,.27,7.9,roof);box(15,4.31,37,23.7,.12,7,asphalt);
[-1,1].forEach(function(s){for(var x=5;x<27;x+=5.4){box(x,1.5,37+s*3.69,1.15,2.9,.08,blue);box(x+2,2.5,37+s*3.72,1.7,.9,.08,glass);box(x+2,2.5,37+s*3.78,.05,.9,.04,white);box(x+.36,1.35,37+s*3.76,.09,.12,.05,white);}});
for(var x=5;x<=25;x+=10)box(x,4.53,37,1,.5,.8,concrete);
box(-13,1.9,38,6.2,3.8,6.2,brick);box(-13,4,38,7,.25,7,roof);box(-13,1.6,41.15,1.35,3.1,.1,blue);box(-15,2.3,41.2,1.5,1.5,.08,glass);box(-9.86,2.3,38,.08,1.5,3.6,glass);
box(-9,.01,36,7,.08,20,walk);box(6,.01,42,42,.08,2.5,walk);
[-12,-6].forEach(function(x){box(x,1.4,W+3.4,.4,2.8,.4,brick);box(x,2.87,W+3.4,.57,.18,.57,concrete);});
// Modest opposite-side bleachers, backed by benches, lamps and planted edges.
for(var r=0;r<4;r++){var zz=W+6.7+r*.7,yy=.35+r*.36;box(-22,yy,zz,12,.13,.62,white);for(var x=-27;x<=-17;x+=2.5){box(x,yy/2,zz,.09,yy,.09,steel);}}bar([-28,1.9,W+9.1],[-16,1.9,W+9.1],.035,steel);
function bench(x,z,rot){flush();var gr=new T.Group();siteRoot.add(gr);root=gr;gr.position.set(x,0,z);gr.rotation.y=rot||0;for(var n=0;n<3;n++)box(0,.52,-.20+n*.17,2,.075,.12,wood);box(0,.89,-.28,2,.43,.075,wood);[-.74,.74].forEach(function(a){box(a,.26,0,.10,.5,.55,steel);box(a,.74,-.30,.09,.80,.09,steel);});flush();root=siteRoot;}
[[-30,32],[-18,34],[-2,31],[31,31],[-40,-34],[38,-36],[-51,12],[-63,12],[18,-39],[-17,-39]].forEach(function(p){bench(p[0],p[1],0);});
function lamp(x,z,h){h=h||5;box(x,h/2,z,.085,h,.085,steel);box(x,h,z,.80,.08,.08,steel);[-.35,.35].forEach(function(s){box(x+s,h-.1,z,.23,.18,.30,white);});box(x,.18,z,.24,.36,.24,concrete);}
for(var x=-33;x<=34;x+=16){lamp(x,W+3.8,5.1);lamp(x,-W-3.2,5.1);}for(var z=-17;z<=20;z+=18){lamp(-L-4,z,5.1);lamp(L+4,z,5.1);}for(var x=-62;x<=62;x+=20)lamp(x,45,5.5);
[[-4,30],[33,29],[-37,19],[38,-17],[42,29],[-16,43]].forEach(function(p){box(p[0],.55,p[1],.48,1.1,.48,hedge);box(p[0],1.12,p[1],.55,.09,.55,steel);});
// Bicycle hoops and bikes beside the changing rooms.
for(var x=3;x<16;x+=1.8){bar([x,0,44],[x,.8,44],.035,steel);bar([x,.8,44],[x+.7,.8,44],.035,steel);bar([x+.7,.8,44],[x+.7,0,44],.035,steel);}
var rimG=new T.TorusGeometry(.36,.028,4,12);
for(var n=0;n<4;n++){var x=3.3+n*2.5;[-.59,.59].forEach(function(z){var rim=mesh(rimG,dark,x,.4,43.5+z);rim.rotation.y=Math.PI/2;});bar([x,.4,42.91],[x,.8,43.55],.026,blue);bar([x,.8,43.55],[x,.4,44.09],.026,blue);bar([x,.4,42.91],[x,.4,43.7],.025,blue);bar([x,.4,43.7],[x,.8,43.55],.025,blue);box(x,.88,43.52,.2,.065,.3,dark);}
// Fill the reverse elevations of both school blocks: these are buildings, not facades.
[-29,29].forEach(function(cx){var cz=back-17;for(var f=0;f<3;f++){var yy=2.9+f*3.6;for(var n=0;n<8;n++){var xx=cx-7+n*2;box(xx,yy,cz-4.05,1.65,2.5,.1,glass);box(xx,yy,cz-4.12,.055,2.5,.04,white);box(xx,yy+.1,cz-4.12,1.65,.055,.04,white);}[-1,1].forEach(function(s){for(var j=-2.5;j<=2.5;j+=2.5){box(cx+s*8.55,yy,cz+j,.1,2.5,1.8,glass);box(cx+s*8.62,yy,cz+j,.04,2.5,.055,white);}});}box(cx,.01,cz+6.1,19,.07,3,walk);box(cx,.01,-58,3,.07,9,walk);});
// Instanced planted canopy: varied silhouettes, grounded shade, and continuous distant tree belts.
var treeInstances=[[],[],[]],trunks=[],shadows=[];
function tree(x,z,size,seed){var h=size||5.8;trunks.push([x,h*.40,z,.21,h*.8,.21]);shadows.push([x+1.1,.016,z+.9,h*.59,1,h*.43]);for(var j=0;j<9;j++){var a=j*2.399+seed,r=(j%3)*.55;treeInstances[(j+seed)%3].push([x+Math.cos(a)*r,h*.72+Math.sin(j*1.7)*h*.14,z+Math.sin(a)*r,h*(.24+(j%2)*.04),h*.27,h*.24]);}}
function shrub(x,z,s){treeInstances[2].push([x,s*.55,z,s,s*.6,s*.7]);}
for(var x=-71;x<=64;x+=6.8){tree(x,58+(Math.floor(x+80)%3)*1.2,5.2+(Math.floor(x+80)%4)*.6,Math.floor(x+80));if(Math.abs(x)>9)tree(x,-58,5.5+(Math.floor(x+80)%3),Math.floor(x+81));}
for(var z=-52;z<45;z+=7){tree(-72,z,5.7+(Math.floor(z+54)%3)*.7,Math.floor(z+54));tree(64,z,5.2+(Math.floor(z+54)%4)*.5,Math.floor(z+55));}
[[-40,31],[-36,38],[-26,40],[-20,40],[-1,38],[1,44],[30,39],[36,38],[41,38],[-42,-23],[-42,8],[-46,20],[-61,22],[-55,31],[-65,35],[45,-40],[45,27],[54,-30],[54,17],[54,31],[-10,-49],[8,-48]].forEach(function(p,i){tree(p[0],p[1],5.1+i%3*.6,i);});
for(var x=-70;x<66;x+=2.4){if(x<-16||x>-4)shrub(x,44.2,1.35);shrub(x,-60,1.0);}
for(var z=-29;z<36;z+=2.4){shrub(43.5,z,1.1);shrub(63.4,z,1.0);}
for(var x=-27;x<32;x+=2.4){if(x>-15&&x<-3)continue;shrub(x,41.5,.9);}
// Multiple irregular outer rings hide the edge of the terrain from orbit and ground cameras.
for(var ring=0;ring<4;ring++){var count=76+ring*12;for(var n=0;n<count;n++){var a=n/count*Math.PI*2,rx=98+ring*25+Math.sin(n*3.1)*7,rz=83+ring*23+Math.cos(n*1.7)*6;tree(Math.cos(a)*rx,Math.sin(a)*rz,6+(n*7%5)*.7,n+ring);}}
function instance(g,m,items){if(!items.length)return;var inst=new T.InstancedMesh(g,m,items.length),o=new T.Object3D();items.forEach(function(v,i){o.position.set(v[0],v[1],v[2]);o.scale.set(v[3],v[4],v[5]);o.updateMatrix();inst.setMatrixAt(i,o.matrix);});inst.name='Highschool campus planting';siteRoot.add(inst);}
instance(boxG,wood,trunks);[leaves,treeMid,treeDark].forEach(function(m,i){instance(leafG,m,treeInstances[i]);});
var shadowG=new T.CircleGeometry(1,12);shadowG.rotateX(-Math.PI/2);instance(shadowG,new T.MeshBasicMaterial({color:0x233724,transparent:true,opacity:.16,depthWrite:false}),shadows);
flush();

}};
})();

