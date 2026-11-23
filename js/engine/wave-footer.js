/**
 * js/engine/wave-footer.js
 * Segundo efecto de agua oceánica en el horizonte del footer,
 * con decaimiento exponencial independiente de FPS y respuesta fluida al puntero.
 */

import { expSmoothingAlpha } from './math.js';

export function initOceanWave(director) {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let targetPointerX = 0.5;
  let pointerX = 0.5;
  let pointerInfluence = 0.0;

  const layers = [
    { amp: 0.14, freq: 2.1, speed: 0.75, phase: 0.0, baseY: 0.44, fill: 'rgba(2, 168, 242, 0.24)', crest: null },
    { amp: 0.13, freq: 2.8, speed: -0.95, phase: 1.7, baseY: 0.54, fill: 'rgba(4, 83, 170, 0.42)', crest: null },
    { amp: 0.11, freq: 3.3, speed: 1.25, phase: 3.2, baseY: 0.64, fill: 'rgba(2, 43, 94, 0.72)', crest: 'rgba(122, 217, 255, 0.35)' },
    { amp: 0.09, freq: 3.9, speed: 1.55, phase: 4.8, baseY: 0.74, fill: '#011938', crest: 'rgba(2, 168, 242, 0.65)' },
  ];

  function resize(dpr) {
    const scale = dpr || director.getEffectiveDpr();
    const w = Math.max(200, Math.floor((canvas.clientWidth || window.innerWidth) * scale));
    const h = Math.max(60, Math.floor((canvas.clientHeight || 112) * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  canvas.addEventListener(
    'pointermove',
    (e) => {
      const r = canvas.getBoundingClientRect();
      targetPointerX = (e.clientX - r.left) / Math.max(1, r.width);
      pointerInfluence = 1.0;
    },
    { passive: true }
  );

  function renderFrame(dt, timeSec) {
    const w = canvas.width;
    const h = canvas.height;

    pointerX += (targetPointerX - pointerX) * expSmoothingAlpha(10.0, dt);
    pointerInfluence *= Math.exp(-2.4 * dt);
    if (pointerInfluence < 0.002) pointerInfluence = 0.0;

    ctx.clearRect(0, 0, w, h);

    const steps = 64;
    for (let l = 0; l < layers.length; l++) {
      const layer = layers[l];
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const nx = i / steps;
        const x = nx * w;
        const distMouse = Math.abs(nx - pointerX);
        const swell = Math.exp(-distMouse * distMouse * 28.0) * pointerInfluence * (h * 0.16);
        const y =
          h * layer.baseY +
          Math.sin(nx * Math.PI * layer.freq + timeSec * layer.speed + layer.phase) * (h * layer.amp) +
          Math.cos(nx * Math.PI * (layer.freq * 1.6) - timeSec * (layer.speed * 0.7)) * (h * layer.amp * 0.35) -
          swell * (l * 0.25 + 0.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (layer.crest) {
        ctx.strokeStyle = layer.crest;
        ctx.lineWidth = Math.max(1.5, h * 0.018);
        ctx.stroke();
      }
      ctx.lineTo(w, h + 2);
      ctx.lineTo(0, h + 2);
      ctx.closePath();
      ctx.fillStyle = layer.fill;
      ctx.fill();
    }
  }

  director.register({
    id: 'ocean-wave',
    element: canvas,
    minIntervalMs: 0,
    onResize: resize,
    onTick: renderFrame,
  });
}
