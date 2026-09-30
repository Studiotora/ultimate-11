/* ============================================================
   ULT11-FANFARE  ·  Ultimate Eleven   (author 2026-09-30)
   "A small song for the goal, like the classic FF7 fanfare after
   you win a duel." An ORIGINAL victory fanfare in that spirit (the
   FF7 melody itself is copyrighted, so this is our own tune):
   a rising pickup into a held chord, a little march phrase, a climb
   to a big final chord with a cymbal. ~5 s, Bb major, 132 bpm.
   Synthesised with Web Audio - no audio file:
     brass lead   2 detuned saws + a sub square, a filter that opens
                  on every note (the "blat"), vibrato on long notes
     low brass    chords on the beats
     timpani      pitched sine drop + a felt click
     snare roll   on the pickup, crash on the final chord
     hall         a generated reverb
   Follows SFX.on / SFX.master. Ducks the match music while it plays.
   TWO THEMES (author 2026-09-30):
     'hero'   our goal - the bright Bb-major fanfare
     'rival'  a CPU goal - "not like we lost, but the mood shifts": G minor,
              96 bpm, horns low over a string pad and timpani, a rising,
              determined phrase that ends on the dominant (D major) - the
              tension is left hanging: the match is not over.
   API: U11Fanfare.play(theme)  .stop(fadeSec)  .render(ctx,dest,t0,theme) (offline)
   ============================================================ */
(function(){
'use strict';
const FF={ vol:1.0 };   // peak ~0.5 at SFX.master .7 (measured offline), level with the sampled effects
window.U11Fanfare=FF;

const BPM=132, B=60/BPM;                      // one beat
const N=(n)=>440*Math.pow(2,(n-69)/12);        // MIDI -> Hz
// note names -> MIDI (Bb major world)
const M={F3:53,Bb3:58,C4:60,D4:62,Eb4:63,F4:65,G4:67,A4:69,Bb4:70,C5:72,D5:74,Eb5:75,F5:77,G5:79,A5:81,Bb5:82,
         Bb1:34,F2:41,Bb2:46,Eb2:39,C2:36,F1:29,Eb3:51,G3:55,A3:57,
         G2:43,D2:38,A2:45,D3:50,C3:48,Fs3:54,Bb3b:58,G4b:67,Fs4:66,D4b:62};

/* the tune: [start beat, length in beats, MIDI] - lead and a harmony voice */
const LEAD=[
  [0.00,0.18,M.F4],[0.19,0.18,M.Bb4],[0.38,0.18,M.D5],        // rising pickup
  [0.60,1.55,M.F5],                                           // held
  [2.30,0.45,M.Eb5],[2.80,0.45,M.D5],[3.30,0.45,M.C5],        // march phrase
  [3.80,0.72,M.D5],[4.55,0.22,M.Bb4],[4.80,0.95,M.C5],
  [5.90,0.20,M.Bb4],[6.12,0.20,M.C5],[6.34,0.20,M.D5],[6.56,0.20,M.Eb5],   // climb
  [6.80,0.55,M.F5],[7.40,0.22,M.G5],[7.66,0.22,M.A5],
  [7.95,2.60,M.Bb5]                                           // final
];
const HARM=[
  [0.60,1.55,M.D5],
  [2.30,0.45,M.C5],[2.80,0.45,M.Bb4],[3.30,0.45,M.A4],
  [3.80,0.72,M.Bb4],[4.55,0.22,M.G4],[4.80,0.95,M.A4],
  [6.80,0.55,M.D5],[7.40,0.22,M.Eb5],[7.66,0.22,M.F5],
  [7.95,2.60,M.F5]
];
// low brass chords [beat, len, [notes]]
const CHORDS=[
  [0.60,1.55,[M.Bb2,M.F3,M.D4]],
  [2.30,1.45,[M.Eb3,M.G3,M.Bb3]],
  [3.80,0.95,[M.Bb2,M.F3,M.D4]],
  [4.80,0.95,[M.F2,M.C4,M.A3]],
  [5.90,0.85,[M.Eb3,M.G3,M.Bb3]],
  [6.80,1.10,[M.F2,M.C4,M.A3]],
  [7.95,2.60,[M.Bb1,M.Bb2,M.F3,M.D4]]
];
const TIMP=[[0.60,M.Bb2],[2.30,M.Eb2],[3.80,M.Bb2],[4.80,M.F2],[6.80,M.F2],[7.95,M.Bb1],[8.45,M.Bb1]];

/* ─── RIVAL (a CPU goal) ─── G minor, 96 bpm */
const RB=60/96;
const R_LEAD=[
  [0.00,0.30,M.D4],[0.33,0.30,M.G4],                          // two-note call
  [0.70,1.30,M.Bb4],                                          // held
  [2.10,0.48,M.A4],[2.60,0.48,M.G4],[3.10,1.25,M.D5],         // rising, determined
  [4.40,0.45,M.C5],[4.90,0.45,M.Bb4],[5.40,0.45,M.A4],
  [5.90,2.40,M.D5]                                            // on the dominant: not over
];
const R_HARM=[
  [0.70,1.30,M.G4],
  [2.10,0.48,M.Fs4],[2.60,0.48,M.D4],[3.10,1.25,M.Bb4],
  [4.40,0.45,M.G4],[4.90,0.45,M.G4],[5.40,0.45,M.Fs4],
  [5.90,2.40,M.A4]
];
const R_CHORDS=[
  [0.00,2.10,[M.G2,M.D3,M.G3,M.Bb3]],        // Gm
  [2.10,1.00,[M.Eb2,M.G3,M.Bb3]],            // Eb
  [3.10,1.30,[M.G2,M.Bb3,M.D4]],             // Gm
  [4.40,1.50,[M.C3,M.Eb3,M.G3]],             // Cm
  [5.90,2.60,[M.D2,M.A2,M.D3,M.Fs3,M.A3]]    // D major - the dominant, unresolved
];
const R_TIMP=[[0.70,M.G2],[3.10,M.G2],[4.40,M.C3],[5.90,M.D2],[6.40,M.D2],[6.90,M.D2]];
/* a slow string pad */
function strings(ctx,dest,t,dur,midi,vel,nodes){
  const f=N(midi), g=ctx.createGain(), lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.min(2200,f*5); lp.Q.value=0.5;
  const end=t+dur;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+0.28); g.gain.setValueAtTime(vel,Math.max(t+0.28,end-0.35)); g.gain.exponentialRampToValueAtTime(0.0001,end+0.5);
  lp.connect(g); g.connect(dest);
  [-11,0,11].forEach(c=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=c;
    const og=ctx.createGain(); og.gain.value=0.33; o.connect(og); og.connect(lp); o.start(t); o.stop(end+0.6); nodes.push(o); });
}
/* a low tam-tam swell under the last chord */
function tamtam(ctx,dest,t,vel,nodes){
  const n=ctx.createBufferSource(), lp=ctx.createBiquadFilter(), g=ctx.createGain();
  n.buffer=noiseBuf(ctx,3); lp.type='lowpass'; lp.frequency.value=700;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+0.5); g.gain.exponentialRampToValueAtTime(0.0001,t+2.8);
  n.connect(lp); lp.connect(g); g.connect(dest); n.start(t); nodes.push(n);
}
function timpRoll(ctx,dest,t,dur,midi,vel,nodes){          // a crescendo roll: quick soft strokes
  for(let x=0;x<dur;x+=0.055){ const k=x/dur; timpani(ctx,dest,t+x,midi,vel*(0.15+0.85*k*k),nodes); }
}
FF.themes={hero:1,rival:1};

let live=null;                                 // {ctx, out, nodes, t0}
function noiseBuf(ctx,sec){
  const b=ctx.createBuffer(1,Math.max(1,Math.round(ctx.sampleRate*sec)),ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b;
}
function hall(ctx){
  const len=Math.round(ctx.sampleRate*1.8), b=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
  const cv=ctx.createConvolver(); cv.buffer=b; return cv;
}
/* one brass note */
function brass(ctx,dest,t,dur,midi,vel,nodes,bright){
  const f=N(midi), g=ctx.createGain(), lp=ctx.createBiquadFilter();
  lp.type='lowpass'; lp.Q.value=1.2;
  const top=Math.min(9000,f*(bright||7)), rest=Math.min(6000,f*3.2);
  lp.frequency.setValueAtTime(f*1.2,t); lp.frequency.linearRampToValueAtTime(top,t+0.035); lp.frequency.exponentialRampToValueAtTime(rest,t+0.18);
  const a=0.025, rel=Math.min(0.16,dur*0.5), end=t+dur;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+a); g.gain.linearRampToValueAtTime(vel*0.78,t+0.12);
  g.gain.setValueAtTime(vel*0.78,Math.max(t+0.12,end-rel)); g.gain.exponentialRampToValueAtTime(0.0001,end+0.04);
  lp.connect(g); g.connect(dest);
  const vib=ctx.createOscillator(), vg=ctx.createGain(); vib.frequency.value=5.6; vg.gain.setValueAtTime(0,t);
  if(dur>0.5){ vg.gain.setValueAtTime(0,t+0.28); vg.gain.linearRampToValueAtTime(f*0.0045,t+0.6); }
  vib.connect(vg);
  [[ 'sawtooth',-7,0.5],['sawtooth',7,0.5],['square',-1200,0.18]].forEach(([type,cents,lvl])=>{
    const o=ctx.createOscillator(), og=ctx.createGain(); o.type=type; o.frequency.value=f; o.detune.value=cents; og.gain.value=lvl;
    vg.connect(o.frequency); o.connect(og); og.connect(lp); o.start(t); o.stop(end+0.1); nodes.push(o);
  });
  vib.start(t); vib.stop(end+0.1); nodes.push(vib);
}
function timpani(ctx,dest,t,midi,vel,nodes){
  const f=N(midi), o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(f*1.5,t); o.frequency.exponentialRampToValueAtTime(f,t+0.06);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+0.006); g.gain.exponentialRampToValueAtTime(0.0001,t+0.75);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t+0.8); nodes.push(o);
  const n=ctx.createBufferSource(), nf=ctx.createBiquadFilter(), ng=ctx.createGain();
  n.buffer=noiseBuf(ctx,0.08); nf.type='bandpass'; nf.frequency.value=900; nf.Q.value=0.8;
  ng.gain.setValueAtTime(vel*0.5,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.07);
  n.connect(nf); nf.connect(ng); ng.connect(dest); n.start(t); nodes.push(n);
}
function snareRoll(ctx,dest,t,dur,vel,nodes){
  const n=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g=ctx.createGain(), am=ctx.createGain(), lfo=ctx.createOscillator();
  n.buffer=noiseBuf(ctx,dur+0.1); hp.type='highpass'; hp.frequency.value=1800;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vel,t+dur*0.85); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.06);
  lfo.frequency.value=22; const lg=ctx.createGain(); lg.gain.value=0.5; am.gain.value=0.5; lfo.connect(lg); lg.connect(am.gain);
  n.connect(hp); hp.connect(am); am.connect(g); g.connect(dest); n.start(t); lfo.start(t); lfo.stop(t+dur+0.1); nodes.push(n,lfo);
}
function crash(ctx,dest,t,vel,nodes){
  const n=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g=ctx.createGain();
  n.buffer=noiseBuf(ctx,2.4); hp.type='highpass'; hp.frequency.value=4200;
  g.gain.setValueAtTime(vel,t); g.gain.exponentialRampToValueAtTime(0.0001,t+2.3);
  n.connect(hp); hp.connect(g); g.connect(dest); n.start(t); nodes.push(n);
}
/* everything scheduled into (ctx,dest) from t0 */
FF.render=function(ctx,dest,t0,theme){
  const nodes=[], mix=ctx.createGain(), wet=ctx.createGain(), dry=ctx.createGain(), comp=ctx.createDynamicsCompressor();
  const rv=hall(ctx); wet.gain.value=theme==='rival'?0.36:0.28; dry.gain.value=0.9;
  comp.threshold.value=-14; comp.ratio.value=3; comp.attack.value=0.004; comp.release.value=0.2;
  mix.connect(dry); mix.connect(rv); rv.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(dest);
  if(theme==='rival'){
    const T=b=>t0+b*RB;
    timpRoll(ctx,mix,T(0),0.68*RB,M.G2,0.34,nodes);                           // the roll into the first chord
    R_LEAD.forEach(([b,l,m])=>brass(ctx,mix,T(b),l*RB,m,0.2,nodes,4.2));      // horns: darker filter
    R_HARM.forEach(([b,l,m])=>brass(ctx,mix,T(b),l*RB,m,0.12,nodes,3.6));
    R_CHORDS.forEach(([b,l,ns])=>ns.forEach(m=>{ strings(ctx,mix,T(b),l*RB,m,0.055,nodes); brass(ctx,mix,T(b),l*RB,m,0.045,nodes,2.8); }));
    R_TIMP.forEach(([b,m],i)=>timpani(ctx,mix,T(b),m,i>=4?0.32:0.5,nodes));
    tamtam(ctx,mix,T(5.9),0.09,nodes);
    return {nodes, out:mix, dur:8.3*RB+1.9};
  }
  const T=b=>t0+b*B;
  LEAD.forEach(([b,l,m])=>brass(ctx,mix,T(b),l*B,m,0.22,nodes,8));
  HARM.forEach(([b,l,m])=>brass(ctx,mix,T(b),l*B,m,0.14,nodes,6));
  CHORDS.forEach(([b,l,ns])=>ns.forEach(m=>brass(ctx,mix,T(b),l*B,m,0.075,nodes,4)));
  TIMP.forEach(([b,m])=>timpani(ctx,mix,T(b),m,0.55,nodes));
  snareRoll(ctx,mix,T(0),0.58*B,0.10,nodes);
  snareRoll(ctx,mix,T(7.2),0.72*B,0.12,nodes);
  crash(ctx,mix,T(7.95),0.16,nodes);
  return {nodes, out:mix, dur:10.6*B+1.8};
};
FF.duration=10.6*B+1.8;
FF.durationOf=th=>th==='rival'?8.3*RB+1.9:FF.duration;

let _ctx=null, _musicVol=null;
function ctxGet(){ if(_ctx) return _ctx; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
  try{ _ctx=new AC(); }catch(e){ _ctx=null; } return _ctx; }
function duckMusic(on){
  try{ const a=document.getElementById('matchMusic1'); if(!a) return;
    if(on){ if(_musicVol==null) _musicVol=a.volume; a.volume=Math.min(a.volume,0.06); }
    else if(_musicVol!=null){ a.volume=_musicVol; _musicVol=null; } }catch(e){}
}
FF.play=function(theme){
  const S=window.SFX; if(S&&S.on===false) return false;
  const ctx=ctxGet(); if(!ctx) return false;
  try{ if(ctx.state==='suspended') ctx.resume(); }catch(e){}
  FF.stop(0);
  const master=ctx.createGain(); master.gain.value=FF.vol*((S&&S.master!=null)?S.master:0.7); master.connect(ctx.destination);
  const t0=ctx.currentTime+0.05, r=FF.render(ctx,master,t0,theme);
  live={ctx,master,nodes:r.nodes,t0};
  duckMusic(true);
  clearTimeout(FF._end); FF._end=setTimeout(()=>{ duckMusic(false); live=null; },r.dur*1000+100);
  return true;
};
FF.stop=function(fade){
  if(!live) return;
  const L=live; live=null; clearTimeout(FF._end); duckMusic(false);
  const t=L.ctx.currentTime, f=fade==null?0.25:fade;
  try{ L.master.gain.cancelScheduledValues(t); L.master.gain.setValueAtTime(L.master.gain.value,t); L.master.gain.linearRampToValueAtTime(0.0001,t+Math.max(0.01,f)); }catch(e){}
  setTimeout(()=>{ L.nodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); try{ L.master.disconnect(); }catch(e){} },(f+0.05)*1000);
};
FF.active=()=>!!live;
})();
