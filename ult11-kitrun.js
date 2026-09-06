/* ============================================================
   ULT11-KITRUN · Team Select kit preview
   ONE long strip of pitch spans edge-to-edge under the captains
   (at the tabs-row height). The home sprite jogs on the left, the
   away sprite on the right (mirrored), so you can see the in-game
   kit before picking. Uses the home/away field sheets
   (assets/ps1/home.png & away.png) — 12x8 grids, side-run is row 3
   (12 frames). Load AFTER game.js. Self-contained; no engine edits.
   ============================================================ */
(function(){
  'use strict';
  const SHEET={ h:'assets/ps1/home.png', a:'assets/ps1/away.png' };
  const COLS=12, ROWS=8, RUN_ROW=3, RUN_FRAMES=12, FPS=11;
  const S={};   // per side → {img, top, bot} (content bounds within a cell row)

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

  // one running player centred at cx, feet on groundY, up to maxH tall
  function drawSprite(ctx, side, cx, groundY, maxH, t){
    const info=S[side]; if(!info||!info.img) return;
    const im=info.img, cw=im.width/COLS, ch=im.height/ROWS;
    const fi=Math.floor(t/1000*FPS)%RUN_FRAMES, sx=fi*cw;
    const syc=RUN_ROW*ch+info.top*ch, shc=Math.max(1,(info.bot-info.top)*ch);
    const aspect=cw/shc;
    const dh=maxH, dw=dh*aspect, dx=cx-dw/2, dy=groundY-dh;
    ctx.imageSmoothingEnabled=false;
    if(side==='h'){                                  // home faces right (toward centre)
      ctx.drawImage(im, sx,syc,cw,shc, dx,dy,dw,dh);
    }else{                                           // away mirrored, faces left
      ctx.save(); ctx.translate(cx*2,0); ctx.scale(-1,1);
      ctx.drawImage(im, sx,syc,cw,shc, dx,dy,dw,dh);
      ctx.restore();
    }
  }

  function draw(cv, t){
    const ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
    // ── pitch ──
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#1f7a34'); g.addColorStop(1,'#12561f');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // mow stripes drift slowly to sell motion
    const stripeW=Math.max(10,Math.round(W/34)), period=stripeW*2;
    let off=(t*0.03)%period; if(off<0) off+=period;
    ctx.save(); ctx.globalAlpha=0.07; ctx.fillStyle='#ffffff';
    for(let x=-period+off; x<W+period; x+=period) ctx.fillRect(x,0,stripeW,H);
    ctx.restore();
    const groundY=H-3, maxH=H*0.92;
    // home on the left third, away on the right third (clear of the centre tabs)
    [['h',W*0.22],['a',W*0.78]].forEach(([side,cx])=>{
      ctx.fillStyle='rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(cx, groundY-1, maxH*0.34, maxH*0.10, 0, 0, Math.PI*2); ctx.fill();
      drawSprite(ctx, side, cx, groundY, maxH, t);
    });
  }

  function tick(ts){
    const sts=document.getElementById('s-ts');
    if(sts && sts.offsetParent!==null){
      const cv=document.getElementById('ts-run'); if(cv) draw(cv, ts);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  console.log('[KITRUN] team-select kit strip active');
})();
