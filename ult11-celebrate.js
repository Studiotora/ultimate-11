/* ============================================================
   ULT11-CELEBRATE  ·  Ultimate Eleven   (author 2026-09-30)
   After a goal: the scorer runs toward his team-mates, they run in
   to him, he jumps, and little pixel symbols (stars, sparkles,
   notes, hearts, "!") pop around him. Then he says a line in the
   shared dialogue box (ult11-talk.js). Skippable.
     0.0 s   ball into the net + the GOAL title (name, minute, score)
     ~1.3 s  cut to the scorer: the run, the team-mates, the jumps
     ~2.9 s  (title gone) his line
     end     -> game.js restarts for the kick-off (done callback)
   Music: the fanfare (ult11-fanfare.js) from the cut - 'hero' for our
   goals, 'rival' for the CPU's.
   Also used by the full-time scene: U11Celebrate.sparkle(side,key,on)
   and U11Celebrate.gather(side,key,opts).
   Uses game.js: PP, PT, sq, W, H, jumpPlayer, stepJumps, _stPopScreen.
   API: U11Celebrate.run({scorer, side, key, gen, delay, team, theme, done}),
        .skip(), .active()
   ============================================================ */
(function(){
'use strict';
const CB={};
window.U11Celebrate=CB;

const CSS=`
#u11cb{position:fixed;inset:0;z-index:2147482800;pointer-events:none}
#u11cb .cb-sym{position:absolute;width:0;height:0}
#u11cb .cb-sym canvas{position:absolute;image-rendering:pixelated;image-rendering:crisp-edges;transform:translate(-50%,-50%)}`;

/* ---- pixel symbols, drawn once as tiny bitmaps ---- */
const GLYPHS={
  star:['....#....','...###...','...###...','#########','.#######.','..#####..','.###.###.','.##...##.','#.......#'],
  spark:['...#...','...#...','..###..','#######','..###..','...#...','...#...'],
  note:['..####','..#..#','..#..#','..#..#','###.##','###.##','.#....'],
  heart:['.##.##.','#######','#######','.#####.','..###..','...#...'],
  bang:['###','###','###','###','.#.','...','###']
};
const _gCache={};
function glyph(name,col,scale){
  const key=name+col+scale; if(_gCache[key]) return _gCache[key];
  const g=GLYPHS[name], h=g.length, w=g[0].length, c=document.createElement('canvas');
  c.width=(w+2)*scale; c.height=(h+2)*scale; const x=c.getContext('2d');
  const put=(px,py,cc)=>{ x.fillStyle=cc; x.fillRect(px*scale,py*scale,scale,scale); };
  // dark 1-px outline first, then the colour, then a white highlight pixel
  for(let y=0;y<h;y++) for(let i=0;i<w;i++) if(g[y][i]==='#') for(const d of [[-1,0],[1,0],[0,-1],[0,1]]) put(i+1+d[0],y+1+d[1],'#1a1030');
  for(let y=0;y<h;y++) for(let i=0;i<w;i++) if(g[y][i]==='#') put(i+1,y+1,col);
  outer: for(let y=0;y<h;y++) for(let i=0;i<w;i++) if(g[y][i]==='#'){ put(i+1,y+1,'#ffffff'); break outer; }
  return (_gCache[key]=c);
}

let root=null;
function build(){
  if(root) return;
  const st=document.createElement('style'); st.id='u11cb-css'; st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement('div'); root.id='u11cb'; document.body.appendChild(root);
}

/* ---- the symbol emitter: follows one player, bursts on demand ---- */
const FX={side:null,key:null,col:'#1e72dc',syms:[]};
function burst(n){
  if(!FX.side) return; build();
  const kinds=['star','star','spark','spark','note','heart','bang'], cols=['#ffd35a','#ffd35a','#ffffff',FX.col,'#ff8fb1','#8fe3ff'];
  for(let i=0;i<n;i++){
    const kind=kinds[(Math.random()*kinds.length)|0];
    const c=kind==='heart'?'#ff6f9a':kind==='note'?'#8fe3ff':cols[(Math.random()*cols.length)|0];
    const src=glyph(kind,c,Math.random()<0.3?4:3), cv=document.createElement('canvas');
    cv.width=src.width; cv.height=src.height; cv.getContext('2d').drawImage(src,0,0);
    const el=document.createElement('div'); el.className='cb-sym'; el.appendChild(cv); root.appendChild(el);
    const a=Math.random()*Math.PI*2, r=0.6+Math.random()*1.1;
    FX.syms.push({el,cv,born:performance.now(),life:900+Math.random()*700,ox:Math.cos(a)*r,oy:-0.3+Math.sin(a)*r*0.7,vx:(Math.random()-.5)*0.5,rise:0.7+Math.random()*0.8,spin:(Math.random()-.5)*40});
  }
}
function tickSyms(){
  let pos=null; try{ if(FX.side) pos=_stPopScreen(FX.side,FX.key); }catch(e){}
  const now=performance.now();
  for(let i=FX.syms.length-1;i>=0;i--){
    const q=FX.syms[i], t=(now-q.born)/q.life;
    if(t>=1){ q.el.remove(); FX.syms.splice(i,1); continue; }
    if(!pos){ q.el.style.opacity='0'; continue; }
    const rr=pos.r*1.6;
    q.el.style.left=(pos.x+(q.ox+q.vx*t)*rr)+'px';
    q.el.style.top=(pos.y+(q.oy-q.rise*t)*rr)+'px';
    const sc=t<0.15?0.4+4*t:1;
    q.cv.style.transform='translate(-50%,-50%) scale('+sc.toFixed(2)+') rotate('+(q.spin*t).toFixed(1)+'deg)';
    q.el.style.opacity=String(t<0.7?1:(1-t)/0.3);
  }
}
CB.sparkle=function(side,key,on,col){
  build();
  if(!on){ FX.side=null; FX.syms.forEach(q=>q.el.remove()); FX.syms.length=0; return; }
  FX.side=side; FX.key=key; FX.col=col||(side==='h'?'#1e72dc':'#c22020');
};
CB.burst=burst;
// the symbols keep animating whether or not a gather loop is running
(function idle(){ try{ if(FX.syms.length) tickSyms(); }catch(e){} requestAnimationFrame(idle); })();

/* ---- a group running to one man, then hopping ----
   opts: count (team-mates), meetFrac (how far HE runs toward them, 0 = he waits),
   hopMs, hopAll (team-mates hop more), keepers, onJump. Returns stop(). */
CB.gather=function(side,key,opts){
  opts=opts||{};
  const me=PP[side]&&PP[side][key]; if(!me) return ()=>{};
  const q=sq(side), n=opts.count||4;
  const pool=Object.keys(q).filter(m=>m!==key&&(opts.keepers||m!=='GK')&&q[m]&&PP[side][m])
    .sort((a,b)=>Math.hypot(PP[side][a].x-me.x,PP[side][a].y-me.y)-Math.hypot(PP[side][b].x-me.x,PP[side][b].y-me.y)).slice(0,n);
  let cx=0,cy=0; pool.forEach(m=>{ cx+=PP[side][m].x; cy+=PP[side][m].y; });
  if(pool.length){ cx/=pool.length; cy/=pool.length; } else { cx=W/2; cy=H/2; }
  const f=opts.meetFrac!=null?opts.meetFrac:0.38;
  const mx=Math.max(W*.1,Math.min(W*.9,me.x+(cx-me.x)*f)), my=Math.max(H*.12,Math.min(H*.88,me.y+(cy-me.y)*f));
  const g={me:{tx:mx,ty:my,speed:W*0.0046,arrived:f===0},
    mates:pool.map((m,i)=>{ const a=(i/Math.max(1,Math.min(6,pool.length)))*Math.PI*2+0.6, rr=1+Math.floor(i/6)*0.8;
      return {k:m,tx:mx+Math.cos(a)*W*.034*rr,ty:my+Math.sin(a)*H*.06*rr,speed:W*(0.0052+Math.random()*0.0012),arrived:false}; }),
    nextJump:0, stop:false};
  let last=performance.now();
  const step=(now)=>{
    if(g.stop) return;
    const dt=Math.min(3,(now-last)/16.667); last=now;
    const mv=(p,t)=>{ const dx=t.tx-p.x, dy=t.ty-p.y, d=Math.hypot(dx,dy); if(d<W*.004){ t.arrived=true; return; }
      const st=Math.min(d,t.speed*dt); p.x+=dx/d*st; p.y+=dy/d*st; };
    const P=PP[side]; if(!P||!P[key]){ g.stop=true; return; }
    if(!g.me.arrived) mv(P[key],g.me);
    g.mates.forEach(m=>{ const p=P[m.k]; if(p&&!m.arrived) mv(p,m); });
    if(PT[side]){ PT[side][key]={x:P[key].x,y:P[key].y}; g.mates.forEach(m=>{ const p=P[m.k]; if(p) PT[side][m.k]={x:p.x,y:p.y}; }); }
    const nowMs=Date.now();
    if(g.me.arrived&&nowMs>=g.nextJump){ try{ jumpPlayer(side,key,true); }catch(e){} g.nextJump=nowMs+(opts.hopMs||900); if(opts.onJump) opts.onJump(); }
    const hopP=opts.hopAll?0.03:0.012;
    g.mates.forEach(m=>{ if(m.arrived&&Math.random()<hopP) try{ jumpPlayer(side,m.k,true); }catch(e){} });
    try{ if(typeof stepJumps==='function') stepJumps(); }catch(e){}
    if(FX.side===side&&FX.key===key&&g.me.arrived&&Math.random()<0.16) burst(1);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return ()=>{ g.stop=true; };
};

/* ---- the goal celebration ---- */
let R=null;
CB.active=()=>!!R;
function valid(){ return R && typeof G!=='undefined' && G && !G.over && G.goalGen===R.gen; }
CB.run=function(o){
  build(); if(R) cleanup();
  R={o,side:o.side,key:o.key,gen:o.gen,timers:[],stopGather:null};
  if(window.U11Talk) U11Talk.scene(()=>CB.skip());
  const d=o.delay||0;
  R.timers.push(setTimeout(()=>startRun(),d+1300));
  R.timers.push(setTimeout(()=>startTalk(),d+2950));
};
function startRun(){
  if(!valid()) return CB.skip();
  const s=R.side, k=R.key;
  try{ if(window.P3D&&P3D.celebrate) P3D.celebrate(s,k); }catch(e){}
  try{ if(window.U11Fanfare) U11Fanfare.play(R.o.theme||'hero'); }catch(e){}   // 'hero' ours, 'rival' a CPU goal
  CB.sparkle(s,k,true,R.o.col);
  R.stopGather=CB.gather(s,k,{onJump:()=>burst(10)});
}
function startTalk(){
  if(!valid()) return CB.skip();
  if(!window.U11Talk){ R.timers.push(setTimeout(()=>CB.finish(),2500)); return; }
  const gen=R.gen;
  U11Talk.say({pl:R.o.scorer, side:R.side, text:U11Talk.line('goal',{team:R.o.team||'this team'}), hold:1900})
    .then(res=>{ if(res==='done'&&R&&R.gen===gen) CB.finish(); });
}
/* ---- end: natural or skipped ---- */
CB.finish=function(){
  if(!R) return;
  const done=R.o.done, gen=R.gen;
  cleanup();
  if(typeof G!=='undefined'&&G&&G.goalGen===gen&&typeof done==='function') done();
};
CB.skip=function(silent){
  if(!R) return false;
  try{ if(window.U11Fanfare) U11Fanfare.stop(0.3); }catch(e){}   // a skip cuts the fanfare; a natural end lets the last chord ring
  if(silent){ cleanup(); return true; }
  CB.finish(); return true;
};
function cleanup(){
  if(!R) return;
  R.timers.forEach(clearTimeout); if(R.stopGather) R.stopGather();
  CB.sparkle(null,null,false);
  try{ if(window.U11Talk){ U11Talk.endScene(); U11Talk.hide(); } }catch(e){}
  try{ if(window.P3D&&P3D.celebrate) P3D.celebrate(null); }catch(e){}
  R=null;
}
})();
