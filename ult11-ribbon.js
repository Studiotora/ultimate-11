/* ============================================================
   ULT11-RIBBON  ·  Ultimate Eleven
   Pre-allocated triangle-strip ribbon geometry along a polyline.

   PORTED from AvatarCastingAbilitiesThreeJS (MIT, achrefelouafi):
     src/effects/RibbonGeometry.js
   https://github.com/achrefelouafi/AvatarCastingAbilitiesThreeJS
   Original is MIT-licensed. Changes made for U11:
     • ES module  →  global IIFE  (window.U11Ribbon), no build step
     • three r185 → r128: addUpdateRange()/clearUpdateRanges() do not
       exist before r159, so the partial-upload hint is written the r128
       way (attribute.updateRange) with the modern calls kept behind a
       feature test — this file works on both.
     • `??` / `?.` removed; nothing else in the 3D layer uses them.
     • added makeMesh(): U11 wires ribbons as {mesh,geo} pairs.

   WHY THIS EXISTS
   ult11-pitch3d.js already builds ribbons (makeRibbon/ribbonUpdate) and
   they are decent: billboard-facing, whip-tapered, age-faded. What they
   cannot do is drive a SHADER. They write a per-vertex `color` on a
   MeshBasicMaterial, so "lightning" and "flame" differ only by tint and
   wobble. This builder writes the attributes a real effect shader needs:

     aDist    arc-length ratio 0..1  (NOT index ratio — uneven point
              spacing stops stretching the texture)
     aSide    -1 / +1, which edge of the strip a vertex is on
     aRandom  stable per-vertex seed
     aNormal  surface normal, for fresnel/lighting
     aCenter / aTangent  (opt-in via {frame:true}) — the curve's local
              frame, so a fragment shader can raymarch AROUND the
              polyline and treat the ribbon as a proxy hull.

   It also adds modes the current code has no equivalent for — notably
   UPRIGHT, a vertical curtain whose lower edge sits on the polyline.
   That is the one for a ground crack or a standing flame wall.

   USAGE
     const r = new U11Ribbon.Geometry(96);
     r.build(pointsArray, {width:0.6, mode:U11Ribbon.Mode.BILLBOARD,
                           cameraPosition:camera.position});
     mesh.geometry = r.geometry;      // or U11Ribbon.makeMesh(...)

   Buffers are allocated once. build() rewrites only the vertices it
   needs and moves the draw range — no per-frame allocation.
   ============================================================ */
(function (global) {
  'use strict';

  var Mode = {
    /** Lies in the ground plane. Cast previews, pitch-level sweeps. */
    FLAT: 'flat',
    /** Always faces the camera. Comet tails — what U11 uses today. */
    BILLBOARD: 'billboard',
    /** Fixed normal supplied per build. Corkscrews. */
    ORIENTED: 'oriented',
    /** Vertical curtain: lower edge on the polyline, upper edge `width`
        above it. Real height rather than a camera-facing strip. */
    UPRIGHT: 'upright'
  };

  // Scratch vectors — allocated on first use so this file can load before
  // three.js does (U11 loads scripts with `defer`, order is not guaranteed
  // to be resolved at parse time).
  var _t = null, _side = null, _view = null, _up = null, _p = null, _n = null;
  function scratch(T) {
    if (_t) return;
    _t = new T.Vector3(); _side = new T.Vector3(); _view = new T.Vector3();
    _up = new T.Vector3(0, 1, 0); _p = new T.Vector3(); _n = new T.Vector3();
  }

  function RibbonGeometry(maxSegments, opts) {
    var T = global.THREE;
    if (!T) throw new Error('[U11Ribbon] three.js is not loaded yet');
    scratch(T);

    maxSegments = maxSegments || 128;
    opts = opts || {};
    var frame = !!opts.frame;

    this._T = T;
    this.maxSegments = maxSegments;
    this.hasFrame = frame;
    this.segmentCount = 0;

    var vertexCount = (maxSegments + 1) * 2;

    this.geometry = new T.BufferGeometry();
    this.positions = new Float32Array(vertexCount * 3);
    this.normals = new Float32Array(vertexCount * 3);
    this.uvs = new Float32Array(vertexCount * 2);
    this.dists = new Float32Array(vertexCount);
    this.sides = new Float32Array(vertexCount);
    this.randoms = new Float32Array(vertexCount);
    this.centers = frame ? new Float32Array(vertexCount * 3) : null;
    this.tangents = frame ? new Float32Array(vertexCount * 3) : null;

    for (var i = 0; i < vertexCount; i++) {
      this.sides[i] = (i % 2 === 0) ? -1 : 1;
      this.randoms[i] = Math.random();
    }

    // Uint16 caps us at 65535 vertices; a ribbon that long is a bug, not a
    // feature, but assert rather than silently wrap the indices.
    if (vertexCount > 65535) throw new Error('[U11Ribbon] maxSegments too large for Uint16 indices');
    var indices = new Uint16Array(maxSegments * 6);
    for (var s = 0; s < maxSegments; s++) {
      var a = s * 2;
      indices.set([a, a + 1, a + 2, a + 2, a + 1, a + 3], s * 6);
    }

    var dyn = T.DynamicDrawUsage;
    function attr(arr, size, dynamic) {
      var at = new T.BufferAttribute(arr, size);
      // setUsage landed in r125; guard anyway so this file is safe to reuse.
      if (dynamic && dyn !== undefined && at.setUsage) at.setUsage(dyn);
      return at;
    }

    this.geometry.setAttribute('position', attr(this.positions, 3, true));
    this.geometry.setAttribute('aNormal', attr(this.normals, 3, true));
    this.geometry.setAttribute('uv', attr(this.uvs, 2, true));
    this.geometry.setAttribute('aDist', attr(this.dists, 1, true));
    this.geometry.setAttribute('aSide', attr(this.sides, 1, false));
    this.geometry.setAttribute('aRandom', attr(this.randoms, 1, false));
    if (frame) {
      this.geometry.setAttribute('aCenter', attr(this.centers, 3, true));
      this.geometry.setAttribute('aTangent', attr(this.tangents, 3, true));
    }
    this.geometry.setIndex(new T.BufferAttribute(indices, 1));
    this.geometry.setDrawRange(0, 0);
    // Positions are world-space and rewritten every frame, so a computed
    // bounding sphere would be stale the moment it is calculated. A fixed
    // huge sphere is the cheap correct answer; the caller should also set
    // mesh.frustumCulled = false (makeMesh does).
    this.geometry.boundingSphere = new T.Sphere(new T.Vector3(), 1e4);
  }

  /**
   * Rebuild from a polyline.
   * @param {Array} points  world-space points, each with .x/.y/.z (>= 2)
   * @param {object} o
   *   o.width          base width in world units
   *   o.mode           one of U11Ribbon.Mode  (default BILLBOARD)
   *   o.cameraPosition required for BILLBOARD
   *   o.normal         fixed normal for ORIENTED
   *   o.widthProfile   fn(t, i) -> multiplier, t = arc-length ratio
   *   o.twist          radians of roll accumulated along the ribbon
   *   o.twistPhase     starting roll
   *   o.count          how many of `points` to use
   */
  RibbonGeometry.prototype.build = function (points, o) {
    o = o || {};
    var count = Math.min(o.count !== undefined ? o.count : points.length, this.maxSegments + 1);
    if (count < 2) { this.clear(); return this; }

    var width = (o.width !== undefined) ? o.width : 0.5;
    var mode = o.mode || Mode.BILLBOARD;
    var cameraPosition = o.cameraPosition || null;
    var normal = o.normal || null;
    var widthProfile = o.widthProfile || null;
    var twist = o.twist || 0;
    var twistPhase = o.twistPhase || 0;

    var upright = (mode === Mode.UPRIGHT);
    var i, v;

    // Pass 1: arc length. Parameterising by DISTANCE rather than index is the
    // whole point — U11's current ribbon uses i/(n-1), so a fast ball that
    // lays sparse points stretches the texture and the taper unevenly.
    var total = 0;
    for (i = 1; i < count; i++) total += dist3(points[i], points[i - 1]);
    var invTotal = total > 1e-5 ? 1 / total : 0;

    var travelled = 0;
    for (i = 0; i < count; i++) {
      var pt = points[i];
      if (i > 0) travelled += dist3(pt, points[i - 1]);
      var t = travelled * invTotal;

      // Central-difference tangent where possible.
      if (i === 0) sub3(_t, points[1], points[0]);
      else if (i === count - 1) sub3(_t, points[count - 1], points[count - 2]);
      else sub3(_t, points[i + 1], points[i - 1]);
      if (_t.lengthSq() < 1e-10) _t.set(0, 0, 1);
      _t.normalize();

      if (upright) {
        _side.copy(_up);
      } else if (mode === Mode.FLAT) {
        _side.crossVectors(_t, _up);
      } else if (mode === Mode.ORIENTED && normal) {
        _side.crossVectors(_t, normal);
      } else {
        _view.set(pt.x, pt.y, pt.z);
        if (cameraPosition) _view.subVectors(cameraPosition, _view); else _view.copy(_up);
        _side.crossVectors(_t, _view);
      }
      if (_side.lengthSq() < 1e-10) _side.set(1, 0, 0);
      _side.normalize();

      if (twist !== 0) _side.applyAxisAngle(_t, twist * t + twistPhase);

      _n.crossVectors(_t, _side).normalize();

      var scaled = width * (widthProfile ? widthProfile(t, i) : 1);
      // Upright ribbons GROW from the polyline; the others straddle it.
      var lowOff = upright ? 0 : -scaled * 0.5;
      var highOff = upright ? scaled : scaled * 0.5;

      var i2 = i * 2, o0 = i2 * 3, o1 = (i2 + 1) * 3;

      this.positions[o0] = pt.x + _side.x * lowOff;
      this.positions[o0 + 1] = pt.y + _side.y * lowOff;
      this.positions[o0 + 2] = pt.z + _side.z * lowOff;

      this.positions[o1] = pt.x + _side.x * highOff;
      this.positions[o1 + 1] = pt.y + _side.y * highOff;
      this.positions[o1 + 2] = pt.z + _side.z * highOff;

      for (v = 0; v < 2; v++) {
        var on = (i2 + v) * 3;
        this.normals[on] = _n.x; this.normals[on + 1] = _n.y; this.normals[on + 2] = _n.z;
      }

      if (this.hasFrame) {
        for (v = 0; v < 2; v++) {
          var oc = (i2 + v) * 3;
          this.centers[oc] = pt.x; this.centers[oc + 1] = pt.y; this.centers[oc + 2] = pt.z;
          this.tangents[oc] = _t.x; this.tangents[oc + 1] = _t.y; this.tangents[oc + 2] = _t.z;
        }
      }

      this.uvs[i2 * 2] = t; this.uvs[i2 * 2 + 1] = 0;
      this.uvs[(i2 + 1) * 2] = t; this.uvs[(i2 + 1) * 2 + 1] = 1;
      this.dists[i2] = t; this.dists[i2 + 1] = t;
    }

    this.segmentCount = count - 1;

    var vc = count * 2, at = this.geometry.attributes;
    var uploads = [[at.position, 3], [at.aNormal, 3], [at.uv, 2], [at.aDist, 1]];
    if (this.hasFrame) { uploads.push([at.aCenter, 3], [at.aTangent, 3]); }

    for (var u = 0; u < uploads.length; u++) {
      var a = uploads[u][0], itemSize = uploads[u][1];
      a.needsUpdate = true;
      // Partial-upload hint. r159+ uses addUpdateRange(); r128 uses the
      // single updateRange object. Feature-test rather than version-test.
      if (a.addUpdateRange) {
        if (a.clearUpdateRanges) a.clearUpdateRanges();
        a.addUpdateRange(0, vc * itemSize);
      } else if (a.updateRange) {
        a.updateRange.offset = 0;
        a.updateRange.count = vc * itemSize;
      }
    }

    this.geometry.setDrawRange(0, this.segmentCount * 6);
    return this;
  };

  /** Hide without touching the buffers. */
  RibbonGeometry.prototype.clear = function () {
    this.segmentCount = 0;
    this.geometry.setDrawRange(0, 0);
    return this;
  };

  RibbonGeometry.prototype.dispose = function () { this.geometry.dispose(); };

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function sub3(out, a, b) { out.set(a.x - b.x, a.y - b.y, a.z - b.z); return out; }

  /* Convenience: geometry + mesh in one, wired the way U11 expects
     (frustum culling off, additive, depth-write off, double-sided). */
  function makeMesh(maxSegments, material, opts) {
    var T = global.THREE;
    var ribbon = new RibbonGeometry(maxSegments, opts);
    var mat = material || new T.MeshBasicMaterial({
      color: 0xffffff, transparent: true, blending: T.AdditiveBlending,
      depthWrite: false, side: T.DoubleSide, fog: false
    });
    var mesh = new T.Mesh(ribbon.geometry, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    return { ribbon: ribbon, mesh: mesh, material: mat };
  }

  global.U11Ribbon = { Geometry: RibbonGeometry, Mode: Mode, makeMesh: makeMesh };
})(window);
