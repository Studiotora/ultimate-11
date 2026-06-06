/* ============================================================
   PS1-MOD  ·  Ultimate Eleven
   Drop-in that gives the in-field engine a PSX look WITHOUT
   touching game logic. Two parts:
     1) POST-FX  — wraps draw(): low-res nearest upscale + dither
                   + scanlines + sub-pixel jitter. Works alone.
     2) SPRITES  — optional low-poly billboards in drawT. Activates
                   only if assets/ps1/home.png & away.png exist;
                   otherwise the game keeps its normal disc tokens.
   Load AFTER game.js:  <script src="ps1-mod.js" defer></script>
   For sprites, add ONE line inside drawT (see integration note).
   Toggle live in console:  PS1.on=false / PS1.dither=false ...
   ============================================================ */
(function(){
  if(typeof window.draw!=='function'){ console.warn('[PS1] draw() not found — load after game.js'); return; }

  const PS1 = window.PS1 = {
    on:true, dither:true, scanlines:true, jitter:true,
    res:300,          // internal framebuffer width (lower = chunkier)
    sprites:true,     // use billboards if sheets are present
    spriteScale:2.6   // sprite height vs token radius
  };

  /* ---------- POST-FX ---------- */
  const low = document.createElement('canvas');
  const lctx = low.getContext('2d');
  let dither=null, lw=0, lh=0, jf=0, jx=0, jy=0;

  function buildDither(block){
    const t=document.createElement('canvas'); t.width=t.height=block*2;
    const c=t.getContext('2d');
    c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(0,0,block,block);
    c.fillStyle='rgba(0,0,0,.05)';       c.fillRect(block,block,block,block);
    dither=cx.createPattern(t,'repeat');
  }

  function postfx(){
    if(!W||!H) return;
    const want=Math.max(64,Math.round(PS1.res));
    const h=Math.round(want*H/W);
    if(want!==lw||h!==lh){
      lw=want; lh=h; low.width=lw; low.height=lh;
      buildDither(Math.max(2,Math.round(W/lw)));
    }
    // downsample current full-res frame
    lctx.imageSmoothingEnabled=false;
    lctx.clearRect(0,0,lw,lh);
    lctx.drawImage(CV,0,0,W,H,0,0,lw,lh);
    // jitter (PSX vertex-snap shimmer)
    if(PS1.jitter){ if(++jf>3){jf=0; jx=(Math.random()*3|0)-1; jy=(Math.random()*3|0)-1;} }
    else { jx=jy=0; }
    // upscale nearest
    cx.imageSmoothingEnabled=false;
    cx.clearRect(0,0,W,H);
    cx.drawImage(low,0,0,lw,lh, jx,jy,W,H);
    cx.imageSmoothingEnabled=true;
    // dither + scanlines
    if(PS1.dither&&dither){ cx.save(); cx.globalAlpha=.9; cx.fillStyle=dither; cx.fillRect(0,0,W,H); cx.restore(); }
    if(PS1.scanlines){
      cx.save(); cx.globalAlpha=.10; cx.fillStyle='#000';
      const step=Math.max(2,Math.round(H/lh));
      for(let y=0;y<H;y+=step) cx.fillRect(0,y,W,1);
      cx.restore();
    }
  }

  const _origDraw = window.draw;
  window.draw = function(){ _origDraw(); if(PS1.on) postfx(); };

  /* ---------- SPRITES (optional side-profile billboards) ---------- */
  // Single side-profile frame per kit, baked with ps1-sprite-baker.html
  // facing screen-right; the game mirrors it horizontally for left.
  const SHEETS = { h:null, a:null };
  function loadSheet(side,url){
    const im=new Image();
    im.onload=()=>{ SHEETS[side]={img:im,cw:im.width,ch:im.height}; };
    im.onerror=()=>{ SHEETS[side]='none'; };
    im.src=url;
  }
  loadSheet('h','assets/ps1/home.png');
  loadSheet('a','assets/ps1/away.png');

  // derive left/right facing from movement, fall back to attack direction
  const LAST = new WeakMap();
  function facingDir(s,p){
    const prev=LAST.get(p); let d=0;
    if(prev){ const dx=p.x-prev.x; if(Math.abs(dx)>0.4) d = dx>0?1:-1; }
    LAST.set(p,{x:p.x,y:p.y});
    if(d===0) d=(typeof dirFor==='function' && dirFor(s)>0)?1:-1;
    return d;
  }

  // Called from drawT. Returns true if it rendered the player (skip default).
  window.PS1_drawSprite = function(s,k,pl,px,py,sc,iC,iCh){
    if(!PS1.on||!PS1.sprites) return false;
    const sh=SHEETS[s];
    if(!sh||sh==='none'||!sh.img.complete) return false;
    const p = PP[s][k]; if(!p) return false;

    const r=(typeof CR!=='undefined'?CR:13)*sc*(iC?1.15:1);
    const h=r*2*PS1.spriteScale;
    const w=h*(sh.cw/sh.ch);
    const dir=facingDir(s,p);

    cx.save();
    cx.globalAlpha=iCh?.6:1;
    // ground shadow
    cx.beginPath();cx.ellipse(px,py+2*sc,w*0.28,w*0.13,0,0,Math.PI*2);
    cx.fillStyle='rgba(0,0,0,.4)';cx.fill();
    // selection / chaser ring on the ground
    if(iC||iCh){
      cx.beginPath();cx.ellipse(px,py+2*sc,w*0.34,w*0.16,0,0,Math.PI*2);
      cx.lineWidth=2*sc;cx.strokeStyle=iC?'#ffd54a':(s==='h'?'#2882f0':'#f03030');cx.stroke();
    }
    // billboard (feet anchored at py), mirrored when facing left
    cx.imageSmoothingEnabled=false;
    const dx=px-w/2, dy=py-h+w*0.12;
    if(dir<0){ cx.save(); cx.translate(px,0); cx.scale(-1,1); cx.translate(-px,0);
               cx.drawImage(sh.img,0,0,sh.cw,sh.ch,dx,dy,w,h); cx.restore(); }
    else     { cx.drawImage(sh.img,0,0,sh.cw,sh.ch,dx,dy,w,h); }
    cx.imageSmoothingEnabled=true;

    // jersey number tag above head
    if(typeof jerseyNum==='function'){
      const num=String(jerseyNum(k,s));
      cx.font=`bold ${Math.round(9*sc)}px Orbitron,sans-serif`;
      cx.textAlign='center';cx.textBaseline='middle';
      const ny=py-h+w*0.02;
      cx.lineWidth=Math.max(2,2.5*sc);cx.strokeStyle='rgba(0,0,0,.85)';
      cx.strokeText(num,px,ny);cx.fillStyle='#fff';cx.fillText(num,px,ny);
    }
    // spirit arc (around feet)
    const maxSp=pl.pos==='GK'?2000:1500;
    const spArc=Math.max(0,Math.min(1,(pl.spirit||maxSp)/maxSp));
    if(spArc<0.98){
      cx.beginPath();cx.arc(px,py+2*sc,w*0.36,-Math.PI/2,-Math.PI/2+spArc*Math.PI*2);
      cx.strokeStyle=spArc>0.5?'rgba(68,200,255,.9)':spArc>0.25?'rgba(240,192,64,.9)':'rgba(220,32,32,.9)';
      cx.lineWidth=2.2*sc;cx.stroke();
    }
    cx.restore();
    return true;
  };

  console.log('[PS1] mod active — PS1.on toggles, sheets:', 'assets/ps1/home.png, assets/ps1/away.png');
})();
