/* Standalone story-map adapter. No writes to Ultimate Eleven's campaign save.
 * Part of Test the World: time of day, weather, shadows, the orbit camera and the exit piers come from ../world/env.js. */
(async()=>{'use strict';
const $=s=>document.querySelector(s),T=window.THREE,load=$('#loading'),E=window.U11Env;
// Walk-only by default (Test the World): no teammate, no story stops, no quest HUD. ?story=1 brings the interlude back.
const STORY=/[?&]story=1/.test(location.search);if(!STORY)document.body.classList.add('walkonly');
const FROM=new URLSearchParams(location.search).get('from')||'',WORLD='../world/index.html';
if(!T){load.textContent='The shared Three.js file is missing. Keep this map beside marassi-square.';return}
const scene=new T.Scene();scene.background=new T.Color(0xb8c9bc);scene.fog=new T.FogExp2(0xb8c9bc,.008);
let renderer;try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'})}catch(e){load.textContent='This map needs WebGL. Please enable hardware acceleration and reload.';return}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('#view').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,220);camera.position.set(0,12.5,22);
const hemi=new T.HemisphereLight(0xc3ddeb,0xaa8a62,.55);scene.add(hemi);
const sun=new T.DirectionalLight(0xffd3a1,1.5);sun.position.set(-22,34,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:100});sun.shadow.bias=-.00035;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
try{await CoastArt.ready}catch(e){load.textContent=e.message;return}
const world=createGenovaCoast(T,scene);const finish=createCoastFinish(T,renderer);
const hero=buildMarassiHeroSprite(T),avatar=new T.Group();scene.add(avatar);
const scale=.75;const card=new T.Mesh(new T.PlaneGeometry(hero.planeWidth*scale,hero.planeHeight*scale),new T.MeshLambertMaterial({map:hero.texture,alphaTest:.5,side:T.DoubleSide}));card.position.y=hero.planeHeight*scale*(hero.footY-.5)+.05;avatar.add(card);
card.castShadow=true;card.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:hero.texture,alphaTest:.5,side:T.DoubleSide});     // the sprite's own silhouette casts the shadow
const shadow=new T.Mesh(new T.CircleGeometry(.39,24),new T.MeshBasicMaterial({color:0x273d3b,opacity:.28,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.11;scene.add(shadow);
const player={x:-3,z:3,faceX:0,faceZ:1,time:0},keys=new Set();let mode=1,night=0,golden=0,ready=false,nearest=null,dialogue=null,stage=0;
const objective=$('#objective'),prompt=$('#prompt');
const beats=!STORY?[]:[
 {id:'teammate',x:3,z:4.4,label:'Talk to your teammate',speaker:'TEAMMATE',lines:['There you are. I thought I would find you by the sea.','Before we head back to training, take a breath. This city has watched a thousand players chase the same dream.','Grab us a focaccia from the café. I will wait here.'],next:1},
 {id:'cafe',x:-11.5,z:3.6,label:'Stop at Bar del Porto',speaker:'CAFÉ OWNER',lines:['Two pieces of focaccia? Fresh from the oven.','You football kids are always in a hurry. Take the long way past the little garden. The view is worth it.'],next:2},
 {id:'overlook',x:16,z:6.7,label:'Look out over the sea',speaker:'A QUIET MOMENT',lines:['Salt in the air. Voices from the piazza. Somewhere beyond the rooftops, a whistle blows.','Whatever comes next, this is where the journey begins.'],next:3}
];
// Reuse the approved character sheet for the placeholder teammate, with a separate animation atlas.
const mateHero=buildMarassiHeroSprite(T);
const mate=new T.Mesh(new T.PlaneGeometry(mateHero.planeWidth*.75,mateHero.planeHeight*.75),new T.MeshLambertMaterial({map:mateHero.texture,color:0xbad1d6,alphaTest:.5,side:T.DoubleSide}));
mate.position.set(3,mateHero.planeHeight*.75*(mateHero.footY-.5)+.13,4.4);mate.visible=STORY;scene.add(mate);
mateHero.ready.then(ok=>{if(ok)mateHero.frame('idle','down',0,false)});
const marker=new T.Mesh(new T.OctahedronGeometry(.17),new T.MeshBasicMaterial({color:0xe6d699}));scene.add(marker);
const ring=new T.Mesh(new T.RingGeometry(.49,.55,32),new T.MeshBasicMaterial({color:0xf0deac,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.14;scene.add(ring);
function setStage(n){stage=n;objective.textContent=['Meet your teammate on the waterfront.','Pick up focaccia at Bar del Porto.','Take a quiet moment at the sea terrace.','Interlude complete. Explore, or return to Ultimate Eleven.'][n];$('#progress').style.width=(n/3*100)+'%'}
function interact(){if(!ready)return;if(dialogue){advance();return}if(!nearest)return;dialogue={beat:nearest,index:0};$('#dialogue').hidden=false;prompt.hidden=true;$('#speaker').textContent=nearest.speaker;$('#line').textContent=nearest.lines[0];$('#next').focus();keys.clear()}
function advance(){if(!dialogue)return;dialogue.index++;if(dialogue.index<dialogue.beat.lines.length){$('#line').textContent=dialogue.beat.lines[dialogue.index];return}const b=dialogue.beat;dialogue=null;$('#dialogue').hidden=true;if(b.next===stage+1)setStage(b.next);document.activeElement?.blur()}
function closeDialogue(){dialogue=null;$('#dialogue').hidden=true;keys.clear()}
$('#next').onclick=advance;prompt.onclick=interact;$('#touch-talk').onclick=interact;
const bar=E.hud({camera:()=>changeCamera(),back:{href:WORLD+'?at=borgo'}});
function changeCamera(){mode=(mode+1)%2;bar.setCameraLabel(mode?'FOLLOW':'OVERVIEW')}bar.setCameraLabel('FOLLOW');
const leave=()=>E.fadeOut(()=>{location.href=WORLD+'?at=borgo'},300);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;keys.add(e.code);if(e.code==='KeyE'&&STORY)interact();if(e.code==='Enter'&&dialogue&&document.activeElement!==$('#next'))advance();if(e.code==='KeyC')changeCamera();if(e.code==='Escape'||e.code==='Backspace'){if(dialogue)closeDialogue();else{e.preventDefault();leave()}}});
addEventListener('keyup',e=>keys.delete(e.code));let joystick={x:0,z:0,id:null};const stick=$('#stick'),nub=$('#nub');
function resetInput(){keys.clear();joystick.x=joystick.z=0;joystick.id=null;nub.style.transform='none'}addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput()});
function moveStick(e){if(e.pointerId!==joystick.id)return;const r=stick.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,z=e.clientY-r.top-r.height/2;const d=Math.hypot(x,z),s=d>37?37/d:1;x*=s;z*=s;joystick.x=x/37;joystick.z=z/37;nub.style.transform=`translate(${x}px,${z}px)`}
stick.addEventListener('pointerdown',e=>{joystick.id=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});stick.addEventListener('pointermove',moveStick);stick.addEventListener('pointerup',resetInput);stick.addEventListener('pointercancel',resetInput);stick.addEventListener('lostpointercapture',resetInput);
let padPressed=false,padBack=false;
// Frontal by default (+z side looking toward -z); Q / E or drag turns it all the way round. Overview = wide establishing view, follow = close and low.
const focus=new T.Vector3(0,1.6,0),offset=new T.Vector3(0,17,40),followOffset=new T.Vector3(0,9.5,21),desired=new T.Vector3(),base=new T.Vector3(),clock=new T.Clock();
const orbit=E.orbit({el:renderer.domElement});
const wx=E.weather3D(T,scene,camera,{scale:1});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?52:36;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function movement(dx,dz){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));for(let i=0;i<steps;i++){if(world.canWalk(player.x+dx/steps,player.z))player.x+=dx/steps;if(world.canWalk(player.x,player.z+dz/steps))player.z+=dz/steps}}
/* the two quay tips lead on: the west pier to Santa Fede, the east pier to the High School */
const PADS=[{to:'santa-fede',x:-15.5,z:15.6},{to:'highschool',x:15.2,z:10}];
PADS.forEach(p=>p.label=E.PLACES[p.to]);
const pads=E.exits(T,scene,PADS,{scale:1,radius:1.6,hold:.7,onTravel:def=>E.travel(WORLD,'borgo',def.to)});
const arrival=PADS.find(p=>p.to===FROM);if(arrival){const dx=player.x-arrival.x,dz=player.z-arrival.z,l=Math.hypot(dx,dz)||1;
  for(let d=3.6;d>1.2;d-=.4){const x=arrival.x+dx/l*d,z=arrival.z+dz/l*d;if(world.canWalk(x,z)){player.x=x;player.z=z;break}}}
focus.set(player.x,2,player.z-2);

/* ---------- time of day, weather, shadows ---------- */
const DAYBG=new T.Color(0xb8c9bc),GOLDBG=new T.Color(0xdcb88f),NIGHTBG=new T.Color(0x0f1626),HSKY=new T.Color(0xc3ddeb),HSKYN=new T.Color(0x3b4f7a),HGND=new T.Color(0xaa8a62),HGNDN=new T.Color(0x141018),SUNDAY=new T.Color(0xffd3a1),MOON=new T.Color(0x9fb6ff),SUNSET=new T.Color(1,.62,.36);let lk=E.look();
const SUN={classic:[-30,36,10],golden:[-58,15,14],night:[24,40,-8]},sunTo=new T.Vector3(),sunNow=new T.Vector3(-30,36,10);
E.on(()=>{lk=E.look()});
function applyEnv(dt){const k=1-Math.exp(-dt*1.6);night+=(lk.night-night)*k;golden+=(lk.golden-golden)*k;
  const sp=SUN[lk.time];sunTo.set(sp[0],sp[1],sp[2]);sunNow.lerp(sunTo,k);
  sun.position.set(player.x+sunNow.x,sunNow.y,player.z+sunNow.z);sun.target.position.set(player.x,0,player.z);
  sun.intensity=(1.5*(1-night)+.1*night)*(1-.1*golden)*lk.wSun;                  // day curve scaled by the weather; the night sun is only a faint moon so the lamps carry the scene
  sun.color.copy(SUNDAY).lerp(SUNSET,golden*.85).lerp(MOON,night);
  hemi.intensity=(.46-.17*night)*lk.wHemi*(1-.08*golden);hemi.color.copy(HSKY).lerp(HSKYN,night);hemi.groundColor.copy(HGND).lerp(HGNDN,night);
  const gu=finish.uniforms;gu.glowAmount.value=.027+night*.05;gu.glowThreshold.value=.79-night*.19;gu.glowWide.value=night*.02;                 // lamps and lit windows bloom at night
  sun.castShadow=lk.shadows;
  scene.background.copy(DAYBG).lerp(GOLDBG,golden).lerp(NIGHTBG,night);scene.fog.color.copy(scene.background);E.applyFog(scene,{density:.008},lk);
  renderer.toneMappingExposure=(1.0-night*.02)*(1+golden*.03)}
/* rain pocks the harbour */
let rippleT=0;
function rainRipples(dt){if(!lk.rain)return;rippleT-=dt;if(rippleT>0)return;rippleT=.09/Math.min(1.6,lk.rain);const w=world.sea.water;
  for(let i=0;i<4;i++){const a=Math.random()*6.283,r=6+Math.random()*26,x=focus.x+Math.cos(a)*r,z=focus.z+Math.sin(a)*r;if(w.isWater(x,z)){w.ripple(x,z,.28+Math.random()*.2);break}}}

function render(){const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;let ix=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x,iz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joystick.z;
 const gp=navigator.getGamepads?.()?.find(p=>p);if(gp){ix+=Math.abs(gp.axes[0])>.18?gp.axes[0]:0;iz+=Math.abs(gp.axes[1])>.18?gp.axes[1]:0;const p=!!gp.buttons[0]?.pressed;if(p&&!padPressed&&STORY)interact();padPressed=p;const bk=!!gp.buttons[1]?.pressed;if(bk&&!padBack)leave();padBack=bk}else padPressed=padBack=false;
 const length=Math.hypot(ix,iz);if(length>1){ix/=length;iz/=length}const moving=length>.1&&!dialogue&&ready,sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||gp?.buttons[7]?.pressed;
 orbit.update(dt);
 if(moving){const w=orbit.toWorld(ix,iz);movement(w[0]*dt*(sprint?5.8:3.3),w[1]*dt*(sprint?5.8:3.3));player.faceX=ix;player.faceZ=iz}     // keys follow the screen, so they follow the camera as it turns
 player.time+=dt*(moving?(sprint?12:8):3);const dir=player.faceZ<-.5?'up':Math.abs(player.faceX)>.4?'right':'down',mirror=dir==='right'&&player.faceX<0;hero.frame(moving?(sprint?'run':'walk'):'idle',dir,Math.floor(player.time),mirror);card.scale.x=mirror?-1:1;const gh=world.heightAt(player.x,player.z);avatar.position.set(player.x,.08+gh,player.z);card.rotation.y=Math.atan2(camera.position.x-player.x,camera.position.z-player.z);shadow.position.x=player.x;shadow.position.y=.11+gh;shadow.position.z=player.z;     // gh: the hero climbs the hump of the canal bridge
 mate.rotation.y=Math.atan2(camera.position.x-mate.position.x,camera.position.z-mate.position.z);
  /* overview slides along the long map */
 const target=mode?new T.Vector3(player.x,2+gh,player.z-2):new T.Vector3(T.MathUtils.clamp(player.x,-10,60)*.8,2.4,3.5+Math.max(0,player.z-8)*.4);focus.lerp(target,1-Math.exp(-dt*4));
 base.copy(mode?followOffset:offset);if(innerWidth/innerHeight<1&&!mode)base.multiplyScalar(1.28);orbit.offset(base,desired);
 let len=desired.length();desired.normalize();                                     // keep the camera out of the buildings: shorten the arm where it would enter one
 for(let s=5;s<=len;s+=.6){const px=focus.x+desired.x*s,pz=focus.z+desired.z*s,py=focus.y+desired.y*s;if(py<14&&world.buildings.some(b=>Math.abs(px-b.x)<b.w/2+.4&&Math.abs(pz-b.z)<b.d/2+.4&&py<b.h+1)){len=Math.max(4.5,s-1.2);break}}
 desired.multiplyScalar(len).add(focus);desired.y=Math.max(desired.y,1.8);camera.position.lerp(desired,1-Math.exp(-dt*(mode?4:3)));camera.lookAt(focus);
 nearest=null;if(!dialogue&&ready)for(const b of beats)if(Math.hypot(player.x-b.x,player.z-b.z)<2.5&&b.next<=stage+1){nearest=b;break}prompt.hidden=!nearest||!!dialogue;if(nearest)prompt.textContent='E · '+nearest.label;
 const active=beats[Math.min(stage,2)];marker.visible=ring.visible=!!active&&stage<3;if(active){marker.position.set(active.x,3.1+Math.sin(t*2)*.12,active.z);marker.rotation.y=t;ring.position.set(active.x,.14,active.z)}
 applyEnv(dt);rainRipples(dt);world.update(t,night,focus);world.sea.reflect(renderer,camera);wx.update(dt,focus);pads.update(player,dt,t,()=>ready&&!dialogue);
 finish.render(scene,camera,camera.position.distanceTo(focus));requestAnimationFrame(render)}
hero.ready.then(ok=>{if(!ok){load.textContent='The shared player sprites could not load. Check that marassi-square/assets/hero-v3 is present.';return}hero.frame('idle','down',0,false);renderer.compile(scene,camera);ready=true;load.hidden=true;E.fadeIn();if(!STORY)E.banner('BORGO DEL MARE','GENOVA · THE HARBOUR','THE PIER TIPS LEAD TO THE NEXT PLACE')});
// Readable integration/test surface; does not depend on the football match globals.
window.GenovaCoast={version:6,story:STORY,world,player,scene,camera,renderer,orbit,pads,sun,hemi,get ready(){return ready},get stage(){return stage},get dialogue(){return dialogue},get cameraMode(){return mode},get night(){return night},get golden(){return golden},interact,advance,setStage,teleport(x,z){if(!world.canWalk(x,z))return false;player.x=x;player.z=z;return true},reset(){closeDialogue();setStage(0);player.x=-3;player.z=3;resetInput()},state(){return {ready,stage,player:{x:player.x,z:player.z},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,programs:renderer.info.programs.length,camera:mode,night,golden,water:world.sea.stats()}}};
render();
})();
