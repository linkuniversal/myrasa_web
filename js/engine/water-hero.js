/**
 * js/engine/water-hero.js
 * Shader WebGL del Hero mejorado con pendiente de normales, brillo Fresnel en crestas,
 * dithering ignNoise (de v5_postfx_lighting.js) y suavizado independiente de FPS.
 */

import { expSmoothingAlpha } from './math.js';

export function initWaterHero(director) {
  const canvas = document.getElementById('waterCanvas');
  const fallbackImg = document.getElementById('heroFallbackImg');
  const heroSection = document.querySelector('.hero-section');
  if (!canvas || !fallbackImg) return;

  const gl =
    canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'high-performance' }) ||
    canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  const vsSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      v_uv.y = 1.0 - v_uv.y;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_imgRes;
    uniform vec2 u_mouseLerp;
    uniform float u_time;
    uniform vec4 u_ripples[8];
    varying vec2 v_uv;

    vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
      float s = max(res.x / img.x, res.y / img.y);
      vec2 scaled = img * s;
      vec2 offset = (scaled - res) * 0.5;
      return (uv * res + offset) / scaled;
    }

    // Interleaved Gradient Noise (de v5_postfx_lighting.js) para eliminar banding en gradientes oscuros
    float ignNoise(vec2 pixelPos) {
      return fract(52.9829189 * fract(dot(pixelPos, vec2(0.06711056, 0.00583715))));
    }

    void main() {
      vec2 uv = coverUV(v_uv, u_res, u_imgRes);
      uv += (u_mouseLerp - 0.5) * 0.012;

      // Oleaje ambiental suave más presente de mitad hacia abajo (zona de mar)
      float waterMask = smoothstep(0.28, 0.62, v_uv.y);
      float ambientX = sin(v_uv.y * 22.0 + u_time * 1.35) * cos(v_uv.x * 14.0 - u_time * 0.90) * 0.0014;
      float ambientY = cos(v_uv.y * 17.0 - u_time * 1.05) * 0.0009;
      vec2 totalDisp = vec2(ambientX, ambientY) * (0.35 + 0.65 * waterMask);
      vec2 waveSlope = vec2(ambientX * 14.0, ambientY * 18.0) * waterMask;

      float causticGlow = 0.0;
      float aspect = u_res.x / max(1.0, u_res.y);

      for (int i = 0; i < 8; i++) {
        vec4 r = u_ripples[i];
        float age = u_time - r.z;
        if (age > 0.0 && age < 2.6 && r.w > 0.0) {
          vec2 diff = v_uv - r.xy;
          diff.x *= aspect;
          float dist = length(diff);
          float radius = age * 0.42;
          float band = exp(-pow((dist - radius) * 14.0, 2.0));
          float decay = (1.0 - age / 2.6) * r.w;
          float phase = (dist - radius) * 48.0;
          float wave = sin(phase) * band * decay;
          float slope = cos(phase) * band * decay;
          vec2 dir = dist > 0.0001 ? normalize(diff) : vec2(0.0);

          totalDisp += dir * wave * 0.014;
          waveSlope += dir * slope * 0.24;
          causticGlow += max(0.0, wave) * 0.12;
        }
      }

      vec2 finalUV = clamp(uv + totalDisp, 0.002, 0.998);
      vec4 color = texture2D(u_tex, finalUV);

      // Cálculo de normal de onda + Fresnel especular sutil hacia el sol del horizonte
      vec3 N = normalize(vec3(-waveSlope.x, -waveSlope.y, 1.0));
      vec3 L = normalize(vec3(0.32, -0.38, 0.87));
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 H = normalize(L + V);

      float ndotv = clamp(dot(N, V), 0.0, 1.0);
      float fresnel = 0.03 + 0.34 * pow(max(1.0 - ndotv, 0.0001), 3.6);
      float spec = pow(max(dot(N, H), 0.0001), 42.0) * waterMask;

      color.rgb += vec3(0.42, 0.80, 1.0) * (causticGlow + fresnel * 0.22);
      color.rgb += vec3(0.86, 0.95, 1.0) * (spec * 0.22);

      // Micro-dithering imperceptible (1/255) para gradientes cinematográficos puros
      float dither = (ignNoise(gl_FragCoord.xy) - 0.5) / 255.0;
      color.rgb += dither;

      gl_FragColor = color;
    }
  `;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uImgRes = gl.getUniformLocation(prog, 'u_imgRes');
  const uMouseLerp = gl.getUniformLocation(prog, 'u_mouseLerp');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRipples = gl.getUniformLocation(prog, 'u_ripples');

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const ripples = new Float32Array(32);
  let rippleIdx = 0;
  let lastSpawnSec = 0;
  const targetMouse = { x: 0.5, y: 0.5 };
  const lerpMouse = { x: 0.5, y: 0.5 };
  let imgLoaded = false;
  let imgW = 1920;
  let imgH = 1080;

  function resize(dpr) {
    const scale = dpr || director.getEffectiveDpr();
    const w = Math.max(1, Math.floor((canvas.clientWidth || 1280) * scale));
    const h = Math.max(1, Math.floor((canvas.clientHeight || 720) * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function uploadTexture(imgEl) {
    try {
      imgW = imgEl.naturalWidth || 1920;
      imgH = imgEl.naturalHeight || 1080;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgEl);
      imgLoaded = true;
      resize(director.getEffectiveDpr());
      renderFrame(0.016, performance.now() * 0.001);
    } catch (_) {
      canvas.style.display = 'none';
    }
  }

  if (fallbackImg.complete && fallbackImg.naturalWidth > 0) {
    uploadTexture(fallbackImg);
  } else {
    const heroImg = new Image();
    heroImg.onload = () => uploadTexture(heroImg);
    heroImg.onerror = () => {
      canvas.style.display = 'none';
    };
    heroImg.src = fallbackImg.getAttribute('src');
  }

  function spawnRipple(nx, ny, strength) {
    const nowSec = performance.now() * 0.001;
    if (nowSec - lastSpawnSec < 0.048) return;
    lastSpawnSec = nowSec;
    const base = rippleIdx * 4;
    ripples[base] = nx;
    ripples[base + 1] = ny;
    ripples[base + 2] = nowSec;
    ripples[base + 3] = strength;
    rippleIdx = (rippleIdx + 1) % 8;
  }

  if (heroSection) {
    heroSection.addEventListener(
      'pointermove',
      (e) => {
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width);
        const ny = (e.clientY - r.top) / Math.max(1, r.height);
        targetMouse.x = nx;
        targetMouse.y = ny;
        spawnRipple(nx, ny, 0.9);
      },
      { passive: true }
    );

    heroSection.addEventListener(
      'pointerdown',
      (e) => {
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width);
        const ny = (e.clientY - r.top) / Math.max(1, r.height);
        lastSpawnSec = 0;
        spawnRipple(nx, ny, 1.35);
      },
      { passive: true }
    );
  }

  function renderFrame(dt, timeSec) {
    if (!imgLoaded) return;
    const alpha = expSmoothingAlpha(3.8, dt);
    lerpMouse.x += (targetMouse.x - lerpMouse.x) * alpha;
    lerpMouse.y += (targetMouse.y - lerpMouse.y) * alpha;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uImgRes, imgW, imgH);
    gl.uniform2f(uMouseLerp, lerpMouse.x, lerpMouse.y);
    gl.uniform1f(uTime, timeSec);
    gl.uniform4fv(uRipples, ripples);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  director.register({
    id: 'water-hero',
    element: heroSection || canvas,
    minIntervalMs: 0,
    onResize: resize,
    onTick: renderFrame,
  });
}
