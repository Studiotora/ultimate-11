/*!
 * HD2D Water — stylized pixel-art water for three.js (r150+)
 * Studio Tora Lab · Ultimate Eleven
 *
 * Usage:
 *   const water = createHD2DWater(THREE, {
 *     width: 40, depth: 28,                       // world size (XZ) covered by the water plane
 *     position: new THREE.Vector3(20, -0.6, 14),  // centre of that rectangle, y = water level
 *     mask: myCanvas,                             // white = water, black = land (canvas / img / ImageData / (u,v)=>bool)
 *   });
 *   scene.add(water.object);
 *   // every frame, BEFORE renderer.render / composer.render:
 *   water.update(dt, renderer, scene, camera);
 *
 * Gameplay helpers:
 *   water.isWater(x, z)          -> true if that world point is water
 *   water.distanceAt(x, z)       -> world distance to the shore (+ in water, - on land)
 *   water.splash(x, z, strength) -> ripple ring + pixel droplets (ball / player falls in)
 *   water.ripple(x, z, strength) -> ripple only
 *
 * Mask orientation: canvas left->right = +X, top->bottom = +Z.
 * Keep the mask aspect ratio equal to width/depth.
 */
(function (root) {
  'use strict';

  const MAX_RIPPLES = 8;
  const RIPPLE_LIFE = 2.6;

  const VERT = /* glsl */`
    varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `;

  const FRAG = (colorspaceChunk) => /* glsl */`
    uniform float uTime;
    uniform sampler2D uSDF;
    uniform vec2  uOrigin;
    uniform vec2  uSize;
    uniform float uLevel;
    uniform float uPixel;
    uniform float uPosterize;
    uniform float uDither;
    uniform vec3  uDeep, uMid, uShallow, uLight, uFoam, uSky, uSun;
    uniform float uDeepDist;
    uniform float uShallowAlpha;
    uniform vec2  uFlow;
    uniform float uWaveScale;
    uniform float uNormalStrength;
    uniform float uFoamWidth, uFoamEdge, uFoamBands;
    uniform float uCaustics;
    uniform float uCrests;
    uniform vec3  uSunDir;
    uniform float uSheen;
    uniform float uGlints;
    uniform float uReflOn;
    uniform sampler2D uReflTex;
    uniform mat4  uReflMatrix;
    uniform float uReflectivity;
    uniform float uDistort;
    uniform vec4  uRipples[${MAX_RIPPLES}];

    varying vec3 vWorld;
    #include <fog_pars_fragment>

    float w_hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    vec2 w_hash2(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }
    float w_noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = w_hash(i);
      float b = w_hash(i + vec2(1.0, 0.0));
      float c = w_hash(i + vec2(0.0, 1.0));
      float d = w_hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    // F2 - F1 cellular distance: thin bright net = caustics
    float w_voro(vec2 x, float t) {
      vec2 n = floor(x); vec2 f = fract(x);
      float f1 = 8.0; float f2 = 8.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = w_hash2(n + g);
          o = 0.5 + 0.45 * sin(t + 6.2831 * o);
          vec2 r = g + o - f;
          float d = dot(r, r);
          if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
        }
      }
      return sqrt(f2) - sqrt(f1);
    }
    float waveH(vec2 q, float t) {
      float h = w_noise(q * 0.45 + vec2(t * 0.06, t * 0.04)) * 0.5;
      h += w_noise(q * 0.95 + vec2(-t * 0.13, t * 0.09) + 3.1) * 0.3;
      h += w_noise(q * 2.10 + vec2(t * 0.21, -t * 0.17) + 7.7) * 0.2;
      return h;
    }
    float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
    float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

    vec3 ramp(float v) {
      if (uPosterize > 0.5) {
        float idx = clamp(floor(v * 4.0), 0.0, 3.0);
        return idx < 0.5 ? uDeep : idx < 1.5 ? uMid : idx < 2.5 ? uShallow : uLight;
      }
      float s = clamp((v - 0.125) * 4.0, 0.0, 3.0);
      return s < 1.0 ? mix(uDeep, uMid, s) : s < 2.0 ? mix(uMid, uShallow, s - 1.0) : mix(uShallow, uLight, s - 2.0);
    }

    void main() {
      bool pix = uPixel > 0.0;
      vec2 cell = pix ? floor(vWorld.xz / uPixel) : floor(gl_FragCoord.xy);
      vec2 p = pix ? (cell + 0.5) * uPixel : vWorld.xz;

      float d = texture2D(uSDF, (p - uOrigin) / uSize).r;   // world distance to shore
      if (d < 0.0) discard;

      float t = uTime;
      vec2 fl = uFlow * t;
      vec2 q = (p - fl) * uWaveScale;

      // ---- surface normal from layered noise
      float e = 0.07;
      float h  = waveH(q, t);
      float hx = waveH(q + vec2(e, 0.0), t);
      float hz = waveH(q + vec2(0.0, e), t);
      vec3 n = normalize(vec3((h - hx) / e * uNormalStrength, 1.0, (h - hz) / e * uNormalStrength));

      // ---- ripples
      float ring = 0.0;
      vec2 rg = vec2(0.0);
      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = uRipples[i];
        float age = t - r.z;
        if (age < 0.0 || age > ${RIPPLE_LIFE.toFixed(2)}) continue;
        vec2 dv = p - r.xy;
        float dist = length(dv);
        float rad = age * (1.1 + 0.6 * r.w);
        float fade = 1.0 - age / ${RIPPLE_LIFE.toFixed(2)};
        float x1 = (dist - rad) * 7.0;
        float x2 = (dist - rad * 0.55) * 8.0;
        float band = (exp(-x1 * x1) + 0.6 * exp(-x2 * x2)) * fade * r.w;
        ring += band;
        rg += (dv / max(dist, 0.001)) * band * sin((dist - rad) * 14.0);
      }
      n = normalize(n + vec3(rg.x, 0.0, rg.y) * 0.9);

      float depthF = smoothstep(0.0, uDeepDist, d);

      // ---- caustics (stronger in shallows)
      vec2 cq = (p - fl * 0.5) * 0.85 * uWaveScale + (h - 0.5) * 0.7;
      float c1 = 1.0 - smoothstep(0.0, 0.11, w_voro(cq, t * 0.9));
      float c2 = 1.0 - smoothstep(0.0, 0.11, w_voro(cq * 1.55 + 7.3, -t * 1.15 + 2.0));
      float caus = (c1 * 0.65 + c2 * 0.45) * (1.0 - depthF * 0.8) * uCaustics;

      // ---- wave crest lines (contour of a stretched noise field)
      vec2 cr = (p - fl * 1.2) * uWaveScale * vec2(0.55, 1.35);
      float h2 = w_noise(cr + vec2(t * 0.18, t * 0.05)) * 0.65 + w_noise(cr * 2.3 - t * 0.12) * 0.35;
      float crest = (1.0 - step(0.026, abs(h2 - 0.6))) * smoothstep(0.25, 0.9, depthF) * uCrests;

      // ---- palette value
      float v = 0.08 + (1.0 - depthF) * 0.6 + (h - 0.5) * 0.5 + caus * 0.42 + ring * 0.6 + crest * 0.3;
      vec2 dcell = pix ? cell : gl_FragCoord.xy;
      v += (bayer4(dcell) - 0.5) * 0.22 * uDither;
      vec3 col = ramp(v);

      // ---- reflection (planar, distorted by the normal)
      vec3 V = normalize(cameraPosition - vec3(p.x, uLevel, p.y));
      float ndv = max(dot(n, V), 0.0);
      float fres = mix(0.3, 1.0, pow(1.0 - ndv, 2.0));
      vec3 refl = uSky;
      if (uReflOn > 0.5) {
        vec4 rc = uReflMatrix * vec4(p.x + n.x * uDistort, uLevel, p.y + n.z * uDistort, 1.0);
        vec2 ruv = clamp(rc.xy / rc.w, vec2(0.001), vec2(0.999));
        vec4 rs = texture2D(uReflTex, ruv);
        refl = mix(uSky, rs.rgb, rs.a);
      }
      col = mix(col, refl * mix(vec3(1.0), uLight, 0.25), fres * uReflectivity);

      // ---- sun sheen + crisp glints
      vec3 L = normalize(uSunDir);
      float spec = max(dot(reflect(-L, n), V), 0.0);
      col += uSun * pow(spec, 40.0) * uSheen;
      float tw = w_hash(dcell + floor(t * 6.0 + w_hash(dcell * 1.7) * 6.0));
      float glint = step(0.7, pow(spec, 28.0)) * step(0.78, tw) + step(0.9985, tw) * 0.6;
      glint = min(glint, 1.0) * uGlints;

      // ---- shore foam: solid lip + bands lapping toward the shore
      float fn  = w_noise(p * 1.6 + vec2(t * 0.30, -t * 0.22));
      float fn2 = w_noise(p * 3.6 - vec2(t * 0.45, t * 0.31));
      float lip = 1.0 - step(uFoamEdge * (0.55 + fn * 0.9), d);
      float zone = 1.0 - smoothstep(uFoamEdge, uFoamWidth, d);
      float bands = step(0.8, fract(d * uFoamBands - t * 0.55 + fn * 0.9)) * step(1.0 - zone, fn2 * 0.85 + 0.12) * step(0.02, zone);
      float foam = max(lip, bands);
      foam = max(foam, step(0.75, ring) * step(0.5, fn2 + ring * 0.4));
      foam = clamp(foam, 0.0, 1.0);

      col = mix(col, uFoam, foam);
      col = mix(col, uSun * 1.6, glint * (1.0 - foam));

      float alpha = mix(uShallowAlpha, 1.0, smoothstep(0.0, uDeepDist * 0.6, d));
      alpha = max(alpha, max(foam, glint));

      gl_FragColor = vec4(col, alpha);
      #include <tonemapping_fragment>
      ${colorspaceChunk}
      #include <fog_fragment>
    }
  `;

  // ---------- signed distance field (Felzenszwalb EDT) ----------
  const BIG = 1e20;
  function edt1d(f, n, s, d, v, z) {
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let r = v[k];
      let sv = ((f[q] + (q * s) * (q * s)) - (f[r] + (r * s) * (r * s))) / (2 * s * (q - r));
      while (sv <= z[k]) {
        k--; r = v[k];
        sv = ((f[q] + (q * s) * (q * s)) - (f[r] + (r * s) * (r * s))) / (2 * s * (q - r));
      }
      k++; v[k] = q; z[k] = sv; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q * s) k++;
      const dq = (q - v[k]) * s;
      d[q] = dq * dq + f[v[k]];
    }
  }
  function edt2d(feature, w, h, sx, sz) {
    // feature: Uint8Array 1 = feature pixel. returns squared distances in world units
    const out = new Float64Array(w * h);
    const n = Math.max(w, h);
    const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let i = 0; i < w * h; i++) out[i] = feature[i] ? 0 : BIG;
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) f[y] = out[y * w + x];
      edt1d(f, h, sz, d, v, z);
      for (let y = 0; y < h; y++) out[y * w + x] = d[y];
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) f[x] = out[y * w + x];
      edt1d(f, w, sx, d, v, z);
      for (let x = 0; x < w; x++) out[y * w + x] = d[x];
    }
    return out;
  }
  function buildSDF(water, w, h, worldW, worldD) {
    const sx = worldW / w, sz = worldD / h;
    const land = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) land[i] = water[i] ? 0 : 1;
    const toLand = edt2d(land, w, h, sx, sz);   // for water pixels
    const toWater = edt2d(water, w, h, sx, sz); // for land pixels
    const half = 0.5 * Math.min(sx, sz);
    const sdf = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const v = water[i] ? Math.sqrt(toLand[i]) - half : -(Math.sqrt(toWater[i]) - half);
      sdf[i] = Math.max(-500, Math.min(500, v));
    }
    return sdf;
  }
  function readMask(mask, res, worldW, worldD) {
    if (!mask) {
      const w = 4, h = 4;
      return { w, h, water: new Uint8Array(w * h).fill(1) };
    }
    if (typeof mask === 'function') {
      const w = res, h = Math.max(2, Math.round(res * worldD / worldW));
      const water = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) water[y * w + x] = mask((x + 0.5) / w, (y + 0.5) / h) ? 1 : 0;
      return { w, h, water };
    }
    let img = mask;
    const isImageData = mask.data && mask.width && mask.height && !mask.getContext;
    if (!isImageData) {
      const w = mask.naturalWidth || mask.videoWidth || mask.width;
      const h = mask.naturalHeight || mask.videoHeight || mask.height;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(mask, 0, 0);
      img = g.getImageData(0, 0, w, h);
    }
    const w = img.width, h = img.height, water = new Uint8Array(w * h), px = img.data;
    for (let i = 0; i < w * h; i++) {
      water[i] = (px[i * 4 + 3] > 127 && px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2] > 382) ? 1 : 0;
    }
    return { w, h, water };
  }

  // ---------- main factory ----------
  function createHD2DWater(THREE, opts) {
    opts = opts || {};
    const DEFAULT_PALETTE = { deep: '#17385a', mid: '#1f6688', shallow: '#38a1b0', light: '#9be6d6', foam: '#f2fbff', sky: '#bfe3f2', sun: '#fff4d6' };
    const o = Object.assign({
      width: 32, depth: 24,
      position: new THREE.Vector3(0, 0, 0),
      mask: null,
      maskResolution: 256,
      pixelSize: 1 / 16,        // world units per water pixel; 0 = smooth HD
      posterize: true,          // palette-stepped colours
      dither: 1,
      deepDistance: 3,          // distance from shore to reach deep colour
      shallowOpacity: 0.6,      // lets the bed show near the shore
      flow: [0, 0],             // drift in world units / second (rivers, canals)
      waveScale: 1,
      normalStrength: 0.9,
      foamWidth: 1.4,
      foamEdge: 0.16,
      foamBands: 3.2,
      caustics: 1,
      crests: 1,
      sunDirection: new THREE.Vector3(-0.25, 0.55, -1),
      sheen: 0.35,
      glints: 1,
      reflections: true,
      reflectionScale: 0.5,
      reflectivity: 0.5,
      distortion: 0.18,
      ambientRipples: 0.35,     // random little ripples per second (fish, bugs)
      droplets: 120,
    }, opts);
    const palette = Object.assign({}, DEFAULT_PALETTE, opts.palette || {});

    const W = o.width, D = o.depth;
    const pos = o.position.clone ? o.position.clone() : new THREE.Vector3(o.position[0], o.position[1], o.position[2]);
    const level = pos.y;
    const origin = new THREE.Vector2(pos.x - W / 2, pos.z - D / 2);

    // ---- shore distance field
    let sdfW = 4, sdfH = 4, sdfData = new Float32Array(16).fill(1000);
    const sdfTex = new THREE.DataTexture(new Uint16Array(16), 4, 4, THREE.RedFormat, THREE.HalfFloatType);
    sdfTex.magFilter = THREE.LinearFilter; sdfTex.minFilter = THREE.LinearFilter;
    sdfTex.wrapS = sdfTex.wrapT = THREE.ClampToEdgeWrapping;
    sdfTex.generateMipmaps = false;

    function setMask(mask) {
      const m = readMask(mask, o.maskResolution, W, D);
      sdfW = m.w; sdfH = m.h;
      sdfData = mask ? buildSDF(m.water, m.w, m.h, W, D) : new Float32Array(m.w * m.h).fill(500);
      const half = new Uint16Array(sdfData.length);
      for (let i = 0; i < sdfData.length; i++) half[i] = THREE.DataUtils.toHalfFloat(sdfData[i]);
      sdfTex.image = { data: half, width: sdfW, height: sdfH };
      sdfTex.needsUpdate = true;
    }
    setMask(o.mask);

    function distanceAt(x, z) {
      const u = (x - origin.x) / W * sdfW - 0.5, v = (z - origin.y) / D * sdfH - 0.5;
      const x0 = Math.max(0, Math.min(sdfW - 1, Math.floor(u))), y0 = Math.max(0, Math.min(sdfH - 1, Math.floor(v)));
      const x1 = Math.min(sdfW - 1, x0 + 1), y1 = Math.min(sdfH - 1, y0 + 1);
      const fx = Math.max(0, Math.min(1, u - x0)), fy = Math.max(0, Math.min(1, v - y0));
      const a = sdfData[y0 * sdfW + x0], b = sdfData[y0 * sdfW + x1], c = sdfData[y1 * sdfW + x0], d = sdfData[y1 * sdfW + x1];
      if (x < origin.x || z < origin.y || x > origin.x + W || z > origin.y + D) return -1;
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }
    const isWater = (x, z) => distanceAt(x, z) > 0;

    // ---- reflection target
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
    rt.texture.generateMipmaps = false;
    const reflMatrix = new THREE.Matrix4();

    const col = (c) => new THREE.Color(c);
    const ripples = [];
    for (let i = 0; i < MAX_RIPPLES; i++) ripples.push(new THREE.Vector4(0, 0, -999, 0));

    const uniforms = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uTime: { value: 0 },
      uSDF: { value: sdfTex },
      uOrigin: { value: origin },
      uSize: { value: new THREE.Vector2(W, D) },
      uLevel: { value: level },
      uPixel: { value: o.pixelSize },
      uPosterize: { value: o.posterize ? 1 : 0 },
      uDither: { value: o.dither },
      uDeep: { value: col(palette.deep) },
      uMid: { value: col(palette.mid) },
      uShallow: { value: col(palette.shallow) },
      uLight: { value: col(palette.light) },
      uFoam: { value: col(palette.foam) },
      uSky: { value: col(palette.sky) },
      uSun: { value: col(palette.sun) },
      uDeepDist: { value: o.deepDistance },
      uShallowAlpha: { value: o.shallowOpacity },
      uFlow: { value: new THREE.Vector2(o.flow[0], o.flow[1]) },
      uWaveScale: { value: o.waveScale },
      uNormalStrength: { value: o.normalStrength },
      uFoamWidth: { value: o.foamWidth },
      uFoamEdge: { value: o.foamEdge },
      uFoamBands: { value: o.foamBands },
      uCaustics: { value: o.caustics },
      uCrests: { value: o.crests },
      uSunDir: { value: o.sunDirection.clone().normalize() },
      uSheen: { value: o.sheen },
      uGlints: { value: o.glints },
      uReflOn: { value: o.reflections ? 1 : 0 },
      uReflTex: { value: rt.texture },
      uReflMatrix: { value: reflMatrix },
      uReflectivity: { value: o.reflectivity },
      uDistort: { value: o.distortion },
      uRipples: { value: ripples },
    });

    const csChunk = THREE.ShaderChunk.colorspace_fragment ? '#include <colorspace_fragment>' : '#include <encodings_fragment>';
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG(csChunk),
      transparent: true, depthWrite: false, fog: true,
    });

    const geo = new THREE.PlaneGeometry(W, D, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(pos);
    mesh.frustumCulled = false;
    mesh.name = 'HD2DWater';

    // ---- pixel droplets
    const N = o.droplets;
    const dPos = new Float32Array(N * 3).fill(-9999);
    const dVel = new Float32Array(N * 3);
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    let dropWorld = Math.max(0.09, (o.pixelSize || 0.05) * 2.2);
    const dMat = new THREE.PointsMaterial({
      color: col(palette.foam), size: dropWorld, sizeAttenuation: true,
      transparent: true, opacity: 0.95, depthWrite: false,
    });
    const points = new THREE.Points(dGeo, dMat);
    points.frustumCulled = false;
    let dNext = 0;

    const object = new THREE.Group();
    object.name = 'HD2DWaterGroup';
    object.add(mesh, points);

    let time = 0, rIdx = 0, ambientAcc = 0;

    function ripple(x, z, strength) {
      ripples[rIdx].set(x, z, time, strength == null ? 1 : strength);
      rIdx = (rIdx + 1) % MAX_RIPPLES;
    }
    function splash(x, z, strength) {
      const s = strength == null ? 1 : strength;
      ripple(x, z, Math.min(1.6, s));
      const count = Math.round(16 * s);
      for (let i = 0; i < count; i++) {
        const k = dNext; dNext = (dNext + 1) % N;
        const a = Math.random() * Math.PI * 2, sp = (0.6 + Math.random() * 1.6) * s;
        dPos[k * 3] = x + Math.cos(a) * 0.15; dPos[k * 3 + 1] = level + 0.02; dPos[k * 3 + 2] = z + Math.sin(a) * 0.15;
        dVel[k * 3] = Math.cos(a) * sp; dVel[k * 3 + 1] = (2.6 + Math.random() * 2.8) * s; dVel[k * 3 + 2] = Math.sin(a) * sp;
      }
    }

    // ---- reflection camera (same maths as three's Reflector)
    const _n = new THREE.Vector3(0, 1, 0), _rp = new THREE.Vector3(), _cp = new THREE.Vector3(), _rot = new THREE.Matrix4();
    const _look = new THREE.Vector3(), _view = new THREE.Vector3(), _target = new THREE.Vector3();
    const _plane = new THREE.Plane(), _clip = new THREE.Vector4(), _q = new THREE.Vector4(), _size = new THREE.Vector2();
    const _worldClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -level);
    const _clear = new THREE.Color();
    let vcam = null;

    function renderReflection(renderer, scene, camera) {
      if (!vcam || vcam.type !== camera.type) vcam = camera.isOrthographicCamera ? new THREE.OrthographicCamera() : new THREE.PerspectiveCamera();
      _rp.set(pos.x, level, pos.z);
      _cp.setFromMatrixPosition(camera.matrixWorld);
      _view.subVectors(_rp, _cp);
      if (_view.dot(_n) > 0) return;               // camera under water
      _view.reflect(_n).negate().add(_rp);
      _rot.extractRotation(camera.matrixWorld);
      _look.set(0, 0, -1).applyMatrix4(_rot).add(_cp);
      _target.subVectors(_rp, _look).reflect(_n).negate().add(_rp);
      vcam.position.copy(_view);
      vcam.up.set(0, 1, 0).applyMatrix4(_rot).reflect(_n);
      vcam.lookAt(_target);
      vcam.far = camera.far; vcam.near = camera.near;
      vcam.layers.mask = camera.layers.mask;
      vcam.updateMatrixWorld();
      vcam.projectionMatrix.copy(camera.projectionMatrix);

      reflMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      reflMatrix.multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse);

      const prevClipping = renderer.clippingPlanes;
      if (camera.isPerspectiveCamera) {
        // oblique near plane: clip everything under the water level
        _plane.setFromNormalAndCoplanarPoint(_n, _rp).applyMatrix4(vcam.matrixWorldInverse);
        _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
        const e = vcam.projectionMatrix.elements;
        _q.x = (Math.sign(_clip.x) + e[8]) / e[0];
        _q.y = (Math.sign(_clip.y) + e[9]) / e[5];
        _q.z = -1.0;
        _q.w = (1.0 + e[10]) / e[14];
        _clip.multiplyScalar(2.0 / _clip.dot(_q));
        e[2] = _clip.x; e[6] = _clip.y; e[10] = _clip.z + 1.0 - 0.003; e[14] = _clip.w;
      } else {
        renderer.clippingPlanes = [_worldClip];
      }

      renderer.getDrawingBufferSize(_size);
      const rw = Math.max(64, Math.round(_size.x * o.reflectionScale)), rh = Math.max(64, Math.round(_size.y * o.reflectionScale));
      if (rt.width !== rw || rt.height !== rh) rt.setSize(rw, rh);

      const prevRT = renderer.getRenderTarget();
      const prevXR = renderer.xr.enabled;
      const prevShadow = renderer.shadowMap.autoUpdate;
      renderer.getClearColor(_clear);
      const prevAlpha = renderer.getClearAlpha();
      const prevBg = scene.background;
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      if (prevBg && !prevBg.isColor) scene.background = null; // skyboxes/textures: fall back to sky colour
      renderer.setClearColor(uniforms.uSky.value, 0);
      object.visible = false;
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, vcam);
      object.visible = true;
      renderer.setRenderTarget(prevRT);
      renderer.setClearColor(_clear, prevAlpha);
      scene.background = prevBg;
      renderer.xr.enabled = prevXR;
      renderer.shadowMap.autoUpdate = prevShadow;
      renderer.clippingPlanes = prevClipping;
    }

    function update(dt, renderer, scene, camera) {
      dt = Math.min(dt || 0, 0.1);
      time += dt;
      uniforms.uTime.value = time;

      // ambient life
      if (o.ambientRipples > 0) {
        ambientAcc += dt * o.ambientRipples;
        while (ambientAcc >= 1) {
          ambientAcc -= Math.random();
          for (let tries = 0; tries < 8; tries++) {
            const x = origin.x + Math.random() * W, z = origin.y + Math.random() * D;
            if (distanceAt(x, z) > 0.8) { ripple(x, z, 0.25 + Math.random() * 0.2); break; }
          }
        }
      }

      // droplets
      let any = false;
      for (let i = 0; i < N; i++) {
        const k = i * 3;
        if (dPos[k + 1] < -9000) continue;
        any = true;
        dVel[k + 1] -= 14 * dt;
        dPos[k] += dVel[k] * dt; dPos[k + 1] += dVel[k + 1] * dt; dPos[k + 2] += dVel[k + 2] * dt;
        if (dPos[k + 1] < level && dVel[k + 1] < 0) dPos[k + 1] = -9999;
      }
      if (any) dGeo.attributes.position.needsUpdate = true;
      // three's point attenuation assumes a 90° fov: rescale so droplets keep their world size
      if (camera && camera.isPerspectiveCamera) dMat.size = dropWorld / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

      if (uniforms.uReflOn.value > 0.5 && renderer && scene && camera) renderReflection(renderer, scene, camera);
    }

    function setPalette(p) {
      const map = { deep: 'uDeep', mid: 'uMid', shallow: 'uShallow', light: 'uLight', foam: 'uFoam', sky: 'uSky', sun: 'uSun' };
      for (const k in p) if (map[k]) uniforms[map[k]].value.set(p[k]);
      if (p.foam) dMat.color.set(p.foam);
    }

    return {
      object, mesh, uniforms, material,
      update, ripple, splash, distanceAt, isWater, setMask, setPalette,
      get level() { return level; },
      setFlow(x, z) { uniforms.uFlow.value.set(x, z); },
      getFlow() { return uniforms.uFlow.value; },
      setPixelSize(s) { uniforms.uPixel.value = s; dropWorld = Math.max(0.09, (s || 0.05) * 2.2); dMat.size = dropWorld; },
      setPosterize(on) { uniforms.uPosterize.value = on ? 1 : 0; },
      setReflections(on) { uniforms.uReflOn.value = on ? 1 : 0; },
      setSunDirection(v) { uniforms.uSunDir.value.copy(v).normalize(); },
      dispose() {
        geo.dispose(); material.dispose(); rt.dispose(); sdfTex.dispose(); dGeo.dispose(); dMat.dispose();
        object.removeFromParent();
      },
    };
  }

  root.createHD2DWater = createHD2DWater;
  if (typeof module !== 'undefined' && module.exports) module.exports = createHD2DWater;
})(typeof window !== 'undefined' ? window : globalThis);
