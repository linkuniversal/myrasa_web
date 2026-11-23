/**
 * js/engine/gyro.js
 * Giroscopio Naval MK-IV con física armónica de 2° orden (kin.js),
 * enlace vivo al rumbo verdadero (bearing) del puerto bloqueado en el radar
 * y dirty-checking domCache (ui.js) para cero reflows de texto.
 */

import { bus, state, MYRASA_EVENTS } from '../contract.js';
import {
  clamp,
  createSpringState,
  stepSpring,
  shortestAngleDeltaDeg,
  wrapAngleDeg360,
  cardinalDir,
} from './math.js';

export function initNavalGyroscope(director) {
  const canvas = document.getElementById('gyroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pitchEl = document.getElementById('gyroPitch');
  const rollEl = document.getElementById('gyroRoll');
  const hdgEl = document.getElementById('gyroHdg');

  const pitchSpring = createSpringState(0.0);
  const rollSpring = createSpringState(0.0);
  const hdgSpring = createSpringState(state.targetBearingDeg || 142.0);
  const scrollImpulse = createSpringState(0.0);

  let baseBearingDeg = state.targetBearingDeg || 142.0;
  let pointerBiasRoll = 0.0;
  let pointerBiasPitch = 0.0;
  let pointerBiasHdg = 0.0;
  let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  // Caché offscreen para la rosa del compás (se dibuja 1 vez al cambiar tamaño y luego se rota con drawImage)
  let bezelCanvas = null;
  let bezelSizePx = 0;

  // Dirty-checking cache (ui.js) para evitar mutaciones DOM innecesarias a 60/120 FPS
  const domCache = {
    pitchText: '',
    rollText: '',
    hdgText: '',
  };

  bus.addEventListener(MYRASA_EVENTS.PORT_LOCKED, (e) => {
    if (Number.isFinite(e.detail?.bearingDeg)) {
      baseBearingDeg = e.detail.bearingDeg;
      // Sutil impulso de timón al cambiar de puerto
      rollSpring.vel += clamp(shortestAngleDeltaDeg(hdgSpring.val, baseBearingDeg) * 0.25, -24, 24);
    }
  });

  function buildCompassBezelCache(w, h) {
    if (typeof document === 'undefined') return;
    if (!bezelCanvas) bezelCanvas = document.createElement('canvas');
    if (bezelSizePx === w && bezelCanvas.width === w) return;

    bezelSizePx = w;
    bezelCanvas.width = w;
    bezelCanvas.height = h;
    const bCtx = bezelCanvas.getContext('2d');
    if (!bCtx) return;

    const cx = w * 0.5;
    const cy = h * 0.5;
    const outerR = w * 0.45;

    bCtx.clearRect(0, 0, w, h);
    bCtx.save();
    bCtx.translate(cx, cy);

    bCtx.strokeStyle = 'rgba(2, 168, 242, 0.48)';
    bCtx.lineWidth = Math.max(1, w * 0.008);
    bCtx.beginPath();
    bCtx.arc(0, 0, outerR, 0, Math.PI * 2);
    bCtx.stroke();

    for (let deg = 0; deg < 360; deg += 15) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      const isMid = deg % 45 === 0;
      const len = isMajor ? outerR * 0.14 : isMid ? outerR * 0.1 : outerR * 0.06;
      bCtx.strokeStyle = isMajor ? '#7AD9FF' : 'rgba(122, 217, 255, 0.5)';
      bCtx.lineWidth = isMajor ? Math.max(1.5, w * 0.01) : Math.max(1, w * 0.005);
      bCtx.beginPath();
      bCtx.moveTo(Math.cos(rad) * (outerR - len), Math.sin(rad) * (outerR - len));
      bCtx.lineTo(Math.cos(rad) * outerR, Math.sin(rad) * outerR);
      bCtx.stroke();
    }
    bCtx.restore();
  }

  function resize(dpr) {
    const scale = Math.min(dpr || director.getEffectiveDpr(), 2.0);
    const size = canvas.clientWidth || 184;
    const targetPx = Math.max(64, Math.floor(size * scale));
    if (canvas.width !== targetPx || canvas.height !== targetPx) {
      canvas.width = targetPx;
      canvas.height = targetPx;
      buildCompassBezelCache(targetPx, targetPx);
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2.0;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2.0;
      pointerBiasRoll = nx * 13.5;
      pointerBiasPitch = -ny * 8.5;
      pointerBiasHdg = nx * 12.0;
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      const curY = window.scrollY || window.pageYOffset;
      const delta = curY - lastScrollY;
      lastScrollY = curY;
      scrollImpulse.vel = clamp(scrollImpulse.vel + delta * 0.45, -28.0, 28.0);
    },
    { passive: true }
  );

  function renderFrame(dt, timeSec) {
    // Oleaje oceánico suave + amortiguamiento de inercia del puntero independiente de FPS
    const seaRoll = Math.sin(timeSec * 0.9) * 1.4;
    const seaPitch = Math.cos(timeSec * 1.15) * 1.0;

    const decay = Math.exp(-0.55 * dt);
    pointerBiasRoll *= decay;
    pointerBiasPitch *= decay;
    pointerBiasHdg *= decay;

    stepSpring(scrollImpulse, 0.0, dt, { wn: 7.5, zeta: 0.78, min: -12, max: 12 });

    const curPitch = stepSpring(
      pitchSpring,
      pointerBiasPitch + seaPitch + scrollImpulse.val * 0.45,
      dt,
      { wn: 9.2, zeta: 0.72, min: -22, max: 22 }
    );
    const curRoll = stepSpring(rollSpring, pointerBiasRoll + seaRoll, dt, {
      wn: 9.2,
      zeta: 0.72,
      min: -26,
      max: 26,
    });

    const desiredBearing = wrapAngleDeg360(baseBearingDeg + pointerBiasHdg);
    const shortestDelta = shortestAngleDeltaDeg(hdgSpring.val, desiredBearing);
    const curHdg = stepSpring(hdgSpring, hdgSpring.val + shortestDelta, dt, {
      wn: 6.8,
      zeta: 0.86,
    });

    // Actualización DOM solo si el texto formateado realmente cambió (zero reflows!)
    const pText = `PITCH: ${curPitch >= 0 ? '+' : ''}${curPitch.toFixed(1)}°`;
    if (pitchEl && pText !== domCache.pitchText) {
      domCache.pitchText = pText;
      pitchEl.textContent = pText;
    }

    const rText = `ROLL: ${curRoll >= 0 ? '+' : ''}${curRoll.toFixed(1)}°`;
    if (rollEl && rText !== domCache.rollText) {
      domCache.rollText = rText;
      rollEl.textContent = rText;
    }

    const hdgRound = Math.round(wrapAngleDeg360(curHdg));
    const hText = `HDG: ${String(hdgRound).padStart(3, '0')}° ${cardinalDir(hdgRound)}`;
    if (hdgEl && hText !== domCache.hdgText) {
      domCache.hdgText = hText;
      hdgEl.textContent = hText;
    }

    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const outerR = w * 0.45;
    const innerR = outerR * 0.78;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);

    // 1. Rosa del compás cacheada en offscreen
    if (bezelCanvas && bezelSizePx === w) {
      ctx.save();
      ctx.rotate((-curHdg * Math.PI) / 180);
      ctx.drawImage(bezelCanvas, -cx, -cy);
      ctx.restore();
    }

    // 2. Horizonte artificial interno recortado
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.clip();

    ctx.rotate((curRoll * Math.PI) / 180);
    const pitchPx = (curPitch / 25) * innerR;
    ctx.translate(0, pitchPx);

    const skyGrad = ctx.createLinearGradient(0, -innerR * 1.5, 0, 0);
    skyGrad.addColorStop(0, '#0453AA');
    skyGrad.addColorStop(1, '#022B5E');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-innerR * 2, -innerR * 2.5, innerR * 4, innerR * 2.5);

    const seaGrad = ctx.createLinearGradient(0, 0, 0, innerR * 1.5);
    seaGrad.addColorStop(0, '#011938');
    seaGrad.addColorStop(1, '#010C1D');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(-innerR * 2, 0, innerR * 4, innerR * 2.5);

    ctx.strokeStyle = '#02A8F2';
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(-innerR * 1.6, 0);
    ctx.lineTo(innerR * 1.6, 0);
    ctx.stroke();

    const marks = [-20, -10, 10, 20];
    for (let i = 0; i < marks.length; i++) {
      const deg = marks[i];
      const y = -(deg / 25) * innerR;
      const halfW = Math.abs(deg) === 20 ? innerR * 0.34 : innerR * 0.22;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
      ctx.lineWidth = Math.max(1, w * 0.006);
      ctx.beginPath();
      ctx.moveTo(-halfW, y);
      ctx.lineTo(halfW, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Aro interior, triángulo índice y silueta de proa fija
    ctx.strokeStyle = 'rgba(122, 217, 255, 0.55)';
    ctx.lineWidth = Math.max(1, w * 0.007);
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#7AD9FF';
    ctx.beginPath();
    ctx.moveTo(0, -innerR + w * 0.015);
    ctx.lineTo(-w * 0.025, -innerR - w * 0.028);
    ctx.lineTo(w * 0.025, -innerR - w * 0.028);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1.6, w * 0.011);
    ctx.beginPath();
    ctx.moveTo(-innerR * 0.34, 0);
    ctx.lineTo(-innerR * 0.12, 0);
    ctx.lineTo(-innerR * 0.12, innerR * 0.1);
    ctx.moveTo(innerR * 0.34, 0);
    ctx.lineTo(innerR * 0.12, 0);
    ctx.lineTo(innerR * 0.12, innerR * 0.1);
    ctx.stroke();

    ctx.fillStyle = '#02A8F2';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, w * 0.015), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  director.register({
    id: 'naval-gyro',
    element: canvas,
    minIntervalMs: 0,
    onResize: resize,
    onTick: renderFrame,
  });
}
