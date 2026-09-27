/* Santa Fede sample: native stadium extension, not a second match engine.
 * North wall / west housing / east church / south parking. All coordinates
 * follow the engine's authoritative pitch dimensions; architecture provisional.
 */
(function(){'use strict';
const COORDS={GK:{x:.065,y:.5},CB1:{x:.23,y:.5},CM1:{x:.40,y:.24},CM3:{x:.40,y:.76},ST:{x:.55,y:.5}};
const LABELS={GK:'GK',CB1:'CB',CM1:'LM',CM3:'RM',ST:'ST'};
let courtMap=null;let seed=73519;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function makePitch(T,reference,len,width){seed=5719;const c=document.createElement('canvas'),src=reference.image;c.width=src.width;c.height=src.height;const ctx=c.getContext('2d'),w=c.width,h=c.height;
  const cell=Math.max(2,Math.round(w/512));
  function paintSurface(art){seed=5719;
  // Pixel-cluster aggregate, broad worn tones and actual tar repairs replace
  // uniform per-pixel noise. Work in the existing authoritative pitch UVs.
  for(let y=0;y<h;y+=cell)for(let x=0;x<w;x+=cell){
    const tone=96+(rnd()-.5)*17+5*Math.sin(x/w*16)*Math.cos(y/h*13);
    ctx.fillStyle='rgb('+Math.round(tone)+','+Math.round(tone)+','+Math.round(tone-2)+')';ctx.fillRect(x,y,cell,cell);
    if(rnd()<.10){ctx.fillStyle='rgba(173,173,162,.15)';ctx.fillRect(x,y,cell,Math.max(1,cell/2))}
  }
  if(art){
    const sw=art.naturalWidth/2,sh=art.naturalHeight/2,tw=w*8/len,th=h*8/width;
    // Actual new asphalt artwork, sampled through a crisp 256px game tile.
    const tile=document.createElement('canvas');tile.width=tile.height=256;
    const tx=tile.getContext('2d');tx.imageSmoothingEnabled=false;tx.drawImage(art,sw*.008,sh*.008,sw*.984,sh*.984,0,0,256,256);
    // Keep the photographic-looking bright chips restrained. This is a matte
    // grey court, not loose gravel; the native film grade still runs afterward.
    const aggregate=tx.getImageData(0,0,256,256),ad=aggregate.data;
    for(let i=0;i<ad.length;i+=4){const v=62+(.299*ad[i]+.587*ad[i+1]+.114*ad[i+2]-95)*.30;ad[i]=ad[i+1]=ad[i+2]=Math.round(v)}
    tx.putImageData(aggregate,0,0);
    ctx.imageSmoothingEnabled=false;
    for(let iy=0;iy<h/th;iy++)for(let ix=0;ix<w/tw;ix++){
      ctx.save();ctx.translate((ix+(ix%2))*tw,(iy+(iy%2))*th);ctx.scale(ix%2?-1:1,iy%2?-1:1);ctx.drawImage(tile,0,0,tw,th);ctx.restore();
    }
  }
  for(let n=0;n<14;n++){
    const x=(.08+rnd()*.84)*w,y=(.07+rnd()*.86)*h,r=(.018+rnd()*.025)*w,points=[];
    for(let i=0;i<8;i++){const a=i*Math.PI/4,j=.80+rnd()*.30;points.push([x+Math.cos(a)*r*j,y+Math.sin(a)*r*j*.55])}
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
    ctx.fillStyle='rgba(46,48,46,.29)';ctx.fill();ctx.strokeStyle='rgba(38,40,38,.28)';ctx.lineWidth=Math.max(1,w/1000);ctx.stroke();
    if(art){ctx.save();ctx.clip();ctx.globalAlpha=.25;ctx.drawImage(art,art.naturalWidth/2,0,art.naturalWidth/2,art.naturalHeight/2,x-r,y-r*.65,r*2,r*1.30);ctx.restore();}
  }
  for(let n=0;n<24;n++){
    let x=rnd()*w,y=rnd()*h;ctx.beginPath();ctx.moveTo(x,y);
    const dx=(rnd()-.5)*w*.012,dy=(rnd()-.5)*h*.020;
    for(let j=0;j<12;j++){x+=dx+(rnd()-.5)*w*.006;y+=dy+(rnd()-.5)*h*.007;ctx.lineTo(x,y)}
    ctx.strokeStyle='rgba(33,35,33,.37)';ctx.lineWidth=Math.max(.75,w/1500);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.006,y-h*.012);ctx.lineTo(x+w*.013,y-h*.017);ctx.stroke();
  }
  for(let n=0;n<38;n++){
    const x=rnd()*w,y=rnd()*h;ctx.strokeStyle='rgba(204,201,184,.055)';ctx.lineWidth=2+rnd()*3;
    ctx.beginPath();ctx.ellipse(x,y,w*(.004+rnd()*.008),h*.003,rnd()*Math.PI,0,Math.PI*1.3);ctx.stroke();
  }
  // Read only the engine's existing white paint. This preserves every marking
  // location and gameplay distance, while distressing its visibility.
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mx=mask.getContext('2d');mx.drawImage(src,0,0);const paint=mx.getImageData(0,0,w,h),pd=paint.data;
  for(let i=0;i<pd.length;i+=4){const bright=Math.min(pd[i],pd[i+1],pd[i+2])>211,wear=rnd();pd[i]=205;pd[i+1]=200;pd[i+2]=176;pd[i+3]=bright&&wear>.23?Math.round(18+wear*39):0}mx.putImageData(paint,0,0);ctx.drawImage(mask,0,0);
  }
  paintSurface(window.U11_SANTA_ART?.courtImage());
  const map=new T.CanvasTexture(c);map.encoding=T.LinearEncoding;map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=8;map.userData={courtArtReady:!!window.U11_SANTA_ART?.courtImage(),disposed:false};
  courtMap=map;map.addEventListener('dispose',()=>map.userData.disposed=true);
  if(!map.userData.courtArtReady)window.U11_SANTA_ART.courtReady.then(image=>{if(image&&!map.userData.disposed){paintSurface(image);map.userData.courtArtReady=true;map.needsUpdate=true}});
  const geometry=new T.PlaneGeometry(len,width,112,72),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,-.021+.012*Math.sin(x*.51)*Math.sin(y*.62)+.004*Math.sin(x*.19+y*.37))}geometry.computeVertexNormals();
  // Native day pitch uses BasicMaterial + the renderer's real-shadow catcher;
  // native night pitch replaces it with its pool-light shader. Keep that path
  // rather than applying a second, incompatible ground-lighting model.
  const material=new T.MeshBasicMaterial({map});material.userData.santaCourt={aggregateCell:cell,repairs:14,cracks:24,scuffs:38,encoding:'display-ready',nativeMarkings:true};
  return {geometry,material,map};
}
function build(T,group,L,W){return window.U11_SANTA_ART.build(T,group,L,W)}
function trimSquad(squad){for(const key of Object.keys(squad))if(!COORDS[key])delete squad[key]}
window.U11_SANTA={build,makePitch,coords:COORDS,labels:LABELS,trimSquad,
 isFive:()=>typeof G!=='undefined'&&G?.matchSize===5,
 setTime:time=>window.U11_SANTA_ART.setTime(time),inspect:()=>({...window.U11_SANTA_ART.inspect(),court:courtMap?.userData})};
})();
