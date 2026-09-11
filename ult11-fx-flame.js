/* ============================================================
   ULT11-FX-FLAME  ·  Ultimate Eleven
   Energy/flame ShaderMaterial for the ported ribbon geometry.

   WHY THIS EXISTS
   Every trail in the game renders through an additive
   MeshBasicMaterial with a per-vertex `color`. That is the ceiling:
   "lightning" can only ever be a blue strip with fast wobble, and
   "dragon" can only be an orange strip with slow wobble. They differ
   by hue and jitter because hue and jitter are the only channels a
   vertex-coloured basic material has.

   This material reads the attributes ult11-ribbon.js writes:

     aDist    arc-length 0 at the TAIL, 1 at the BALL. Because points
              are appended head-first and expired from the front, this
              doubles as the AGE axis - so taper, heat and fade all
              come off one value instead of being baked on the CPU.
     aSide    -1 / +1 per edge vertex. Interpolated across the strip it
              passes through 0 on the centre line, so abs(vSide) is a
              free "distance from the spine" for the core gradient.
     aRandom  stable per-vertex seed, so strands do not all boil in sync.

   The noise is a compact 2D value-noise fbm written here rather than
   lifted, so this file carries no third-party code. (ult11-ribbon.js
   is the MIT port and carries its own attribution.)

   USAGE
     const m = U11Flame.material({core:'#fff3d0', mid:'#ff7a1e',
                                  edge:'#ff2a12', erode:0.55, speed:1.6});
     m.uniforms.uTime.value = seconds;      // drive every frame
     m.uniforms.uHeat.value = 0..1;         // master intensity

   Presets in U11Flame.PRESETS map the game's TRAIL_STYLES names onto
   colour/erosion/speed triples.
   ============================================================ */
(function (global) {
  'use strict';

  /* ── GLSL ───────────────────────────────────────────────────────────
     Value noise + 3-octave fbm. Cheap enough for a mobile fill-rate
     budget; simplex would cost more than it buys at ribbon scale. */
  var NOISE = [
    'float u11hash(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    'float u11noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',            // smoothstep interpolation
    '  float a = u11hash(i);',
    '  float b = u11hash(i + vec2(1.0, 0.0));',
    '  float c = u11hash(i + vec2(0.0, 1.0));',
    '  float d = u11hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    'float u11fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for(int i = 0; i < 3; i++){',
    '    v += a * u11noise(p);',
    '    p *= 2.02; a *= 0.5;',
    '  }',
    '  return v;',
    '}'
  ].join('\n');

  var VERT = [
    'attribute float aDist;',
    'attribute float aSide;',
    'attribute float aRandom;',
    'varying float vDist;',
    'varying float vSide;',
    'varying float vRand;',
    'void main(){',
    '  vDist = aDist; vSide = aSide; vRand = aRandom;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    NOISE,
    'uniform float uTime;',
    'uniform float uHeat;',    // master intensity, 0..1+
    'uniform float uErode;',   // how hard noise eats the edges
    'uniform float uSpeed;',   // how fast the turbulence scrolls
    'uniform float uScale;',   // turbulence frequency along the ribbon
    'uniform vec3  uCore;',    // white-hot centre, near the ball
    'uniform vec3  uMid;',
    'uniform vec3  uEdge;',    // coolest, at the tail
    'varying float vDist;',
    'varying float vSide;',
    'varying float vRand;',
    'void main(){',
    /* spine = 1 on the centre line, 0 at the edges. aSide is -1/+1 at
       the two edge vertices and interpolates through 0 between them. */
    '  float spine = 1.0 - abs(vSide);',
    /* Turbulence scrolls BACKWARD along the ribbon (-uTime), so the fire
       appears to be shed by the ball rather than crawling toward it. */
    '  float n = u11fbm(vec2(vDist * uScale - uTime * uSpeed,',
    '                        vSide * 1.7 + vRand * 4.0));',
    /* Erode the silhouette with that noise. Without this the strip has
       a clean parallel edge and instantly reads as a ribbon, not fire.
       The tail erodes harder than the head so it frays as it dies. */
    '  float bite = uErode * (0.35 + 0.65 * (1.0 - vDist));',
    '  float mask = smoothstep(0.0, 0.62, spine + (n - 0.5) * 2.0 * bite);',
    /* Heat: hottest on the spine AND near the head. pow() biases it so
       only the last stretch behind the ball goes white. */
    '  float heat = pow(vDist, 1.45) * pow(spine, 0.65);',
    '  vec3 col = mix(uEdge, uMid, smoothstep(0.0, 0.55, heat));',
    '  col = mix(col, uCore, smoothstep(0.55, 1.0, heat));',
    /* Fade toward the tail. This replaces the CPU age fade the old
       ribbon did with per-point timestamps and vertex colours. */
    '  float fade = pow(vDist, 0.85);',
    '  float a = mask * fade * uHeat;',
    '  if(a <= 0.003) discard;',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  function toVec3(T, hex) { var c = new T.Color(hex); return new T.Vector3(c.r, c.g, c.b); }

  /* Colour/behaviour per trail style. Keys match TRAIL_STYLES in
     ult11-pitch3d.js; anything missing falls back to 'standard'. */
  var PRESETS = {
    standard : { core:'#fffdf0', mid:'#ffd24a', edge:'#ff9a10', erode:0.30, speed:1.1, scale:5.0 },
    flame    : { core:'#fff6d8', mid:'#ff8a1e', edge:'#e0300a', erode:0.62, speed:1.8, scale:6.5 },
    dragon   : { core:'#fffaf0', mid:'#ff6a12', edge:'#c81000', erode:0.78, speed:2.4, scale:8.0 },
    tiger    : { core:'#fff4cf', mid:'#ffb020', edge:'#e05a00', erode:0.58, speed:1.7, scale:6.0 },
    drive    : { core:'#ffffff', mid:'#5b9dff', edge:'#1030c8', erode:0.22, speed:1.3, scale:4.0 },
    lightning: { core:'#ffffff', mid:'#7fd8ff', edge:'#1a6ad0', erode:0.50, speed:3.2, scale:9.0 },
    ice      : { core:'#ffffff', mid:'#8fe8ff', edge:'#2a86c8', erode:0.34, speed:1.0, scale:5.0 },
    wind     : { core:'#ffffff', mid:'#bfe9ff', edge:'#6aa8d0', erode:0.46, speed:1.5, scale:6.0 },
    nature   : { core:'#f0ffe8', mid:'#4fe06a', edge:'#128a3a', erode:0.44, speed:1.2, scale:5.5 },
    aura     : { core:'#fff0f8', mid:'#ff5ca8', edge:'#a01060', erode:0.50, speed:1.6, scale:6.0 },
    galaxy   : { core:'#ffffff', mid:'#b07cff', edge:'#4a1a90', erode:0.56, speed:1.4, scale:6.5 },
    shadow   : { core:'#c8a8ff', mid:'#7a4cc4', edge:'#1a0f2e', erode:0.60, speed:1.2, scale:6.0 },
    after    : { core:'#ffffff', mid:'#6fd0ff', edge:'#2060a0', erode:0.30, speed:1.0, scale:4.5 }
  };

  function material(opts) {
    var T = global.THREE;
    if (!T) throw new Error('[U11Flame] three.js is not loaded yet');
    opts = opts || {};
    var p = PRESETS[opts.preset] || PRESETS.standard;
    function pick(k, d) { return (opts[k] !== undefined) ? opts[k] : (p[k] !== undefined ? p[k] : d); }

    var m = new T.ShaderMaterial({
      uniforms: {
        uTime : { value: 0 },
        uHeat : { value: 1 },
        uErode: { value: pick('erode', 0.4) },
        uSpeed: { value: pick('speed', 1.4) },
        uScale: { value: pick('scale', 6.0) },
        uCore : { value: toVec3(T, pick('core', '#ffffff')) },
        uMid  : { value: toVec3(T, pick('mid',  '#ffd24a')) },
        uEdge : { value: toVec3(T, pick('edge', '#ff8a10')) }
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: T.DoubleSide,
      fog: false
    });
    m.u11preset = opts.preset || 'standard';
    return m;
  }

  /* Repoint an existing material at another preset without rebuilding the
     program - uniforms only, so no shader recompile mid-match. */
  function applyPreset(m, name, tint) {
    var T = global.THREE;
    var p = PRESETS[name] || PRESETS.standard;
    if (!m || !m.uniforms) return;
    m.uniforms.uErode.value = p.erode;
    m.uniforms.uSpeed.value = p.speed;
    m.uniforms.uScale.value = p.scale;
    m.uniforms.uCore.value.copy(toVec3(T, p.core));
    m.uniforms.uMid.value.copy(toVec3(T, tint || p.mid));
    m.uniforms.uEdge.value.copy(toVec3(T, p.edge));
    m.u11preset = name;
  }

  global.U11Flame = { material: material, applyPreset: applyPreset, PRESETS: PRESETS,
                      GLSL: { noise: NOISE, vert: VERT, frag: FRAG } };
})(window);
