/* ============================================================
   ULT11-KITRUN · Team Select kit preview
   Under each selection card the in-game sprite jogs on a strip of
   pitch, so you can see the kit before picking a team. Uses the
   home/away field sheets (assets/ps1/home.png & away.png), which are
   12x8 grids — the side-facing RUN is row 3 (12 frames). The away
   side is mirrored so the two players run toward the middle (VS).
   Load AFTER game.js. Self-contained; no engine edits.
   ============================================================ */
(function(){
  'use strict';
  const SHEET={ h:'assets/ps1/home.png', a:'assets/ps1/away.png' };
  const COLS=12, ROWS=8, RUN_ROW=3, RUN_FRAMES=12, FPS=11;
  const S={};   // per side → {img, top, bot}  (content bounds within a cell row, 0..1)

  // Scan the RUN row once so the tall cell padding doesn't render the player
  // tiny/floating — we crop to the actual sprite bounds. Falls back to the
  // lower half of the cell if the canvas is tainted (e.g. opened via file://).
  function measure(side, im){
    const info={img:im, top:0.46, bot:1.0};
    try{
      const cw=im.width/COLS, ch=im.height/ROWS, sc=Math.min(1, 480/im.width);
      const cv=document.createElement('canvas');
      cv.width=Math.max(1,Math.round(im.width*sc)); cv.height=Math.max(1,Math.round(im.height*sc));
      const cx=cv.getContext('2d',{willReadFrequently:true});
      cx.drawImage(im,0,0,cv.width,cv.height);
      const rowTop=RUN_ROW*ch*sc, rowH=ch*sc;
      const y0=Math.floor(rowTop), y1=Math.min(cv.height,Math.floor(rowTop+rowH));
      const d=cx.getImageData(0,0,cv.width,cv.height).data, Wc=cv.width;
      let minY=1e9,maxY=-1;
      for(let y=y0;y<y1;y++){ let has=false;
        for(let x=0;x<Wc;x+=2){ if(d[(y*Wc+x)*4+3]>24){ has=true; break; } }
        if(has){ if(y<minY)minY=y; maxY=y; } }
      if(maxY>minY){ info.top=(minY-rowTop)/rowH; info.bot=(maxY-rowTop)/rowH; }
    }catch(e){ /* tainted — keep default crop */ }
    S[side]=info;
  }
  Object.keys(SHEET).forEach(side=>{
    const im=new Image();
    im.onload=()=>measure(side,im);
    im.onerror=()=>{ S[side]=null; };
    im.src=SHEET[side];
  });

  function draw(cv, side, t){
    const ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
    const faceRight=(side==='h');            // home runs right, away runs left
    // ── pitch strip ──
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#1f7a34'); g.addColorStop(1,'#12561f');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // mowing stripes scroll opposite the run so the jog reads as motion
    const stripeW=16, period=stripeW*2;
    let off=((t*0.05)*(faceRight?-1:1))%period; if(off<0) off+=period;
    ctx.save(); ctx.globalAlpha=0.08; ctx.fillStyle='#ffffff';
    for(let x=-period+off; x<W+period; x+=period) ctx.fillRect(x,0,stripeW,H);
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,H-6); ctx.lineTo(W,H-6); ctx.stroke();
    // contact shadow
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(W/2, H-9, 34, 7, 0, 0, Math.PI*2); ctx.fill();
    // ── running sprite ──
    const info=S[side];
    if(info&&info.img){
      const im=info.img, cw=im.width/COLS, ch=im.height/ROWS;
      const fi=Math.floor(t/1000*FPS)%RUN_FRAMES, sx=fi*cw;
      const top=info.top, bot=info.bot;
      const syc=RUN_ROW*ch + top*ch, shc=Math.max(1,(bot-top)*ch);   // cropped source
      // "contain"-fit the sprite so it fills the strip (big player, little pitch)
      const aspect=cw/shc, pad=0.05;
      let dw=W*(1-pad*2), dh=dw/aspect;
      if(dh>H*(1-pad)){ dh=H*(1-pad); dw=dh*aspect; }
      const dx=(W-dw)/2, dy=H-5-dh;
      ctx.imageSmoothingEnabled=false;
      if(faceRight){
        ctx.drawImage(im, sx,syc,cw,shc, dx,dy,dw,dh);
      }else{
        ctx.save(); ctx.translate(W,0); ctx.scale(-1,1);
        ctx.drawImage(im, sx,syc,cw,shc, dx,dy,dw,dh);   // dx centred → symmetric under flip
        ctx.restore();
      }
    }
  }

  function tick(ts){
    const sts=document.getElementById('s-ts');
    if(sts && sts.offsetParent!==null){                 // only when Team Select is visible
      ['h','a'].forEach(side=>{ const cv=document.getElementById(side+'-run'); if(cv) draw(cv,side,ts); });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  console.log('[KITRUN] team-select kit preview active');
})();
