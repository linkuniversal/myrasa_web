/**
 * js/engine/radar.js
 * Carta Náutica Radar ECDIS con coordenadas reales WGS84 (AR/ROU),
 * caché estática Offscreen (de ui.js), throttling a 30Hz y zoom suave por dt.
 */

import {
  operatingPorts,
  ECDIS_GEO_PATHS,
  state,
  bus,
  emitEvent,
  MYRASA_EVENTS,
} from '../contract.js';
import { expSmoothingAlpha, calcNauticalFromHQ } from './math.js';

export function initTacticalRadar(director) {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let sweepAngle = 0.0;
  let blipCoords = [];

  // Offscreen static map cache (ui.js minimapStaticCanvas pattern)
  let staticCanvas = null;
  let staticDirty = true;
  let staticCachedW = 0;
  let staticCachedH = 0;

  const curBounds = { minLat: 26.2, maxLat: 41.8, maxLon: 65.8, minLon: 53.6 };

  function getTargetBounds() {
    if (state.portFilter === 'parana') {
      return { minLat: 26.5, maxLat: 35.1, maxLon: 62.4, minLon: 57.0 };
    }
    if (state.portFilter === 'atlantic') {
      return { minLat: 33.1, maxLat: 41.8, maxLon: 65.8, minLon: 53.6 };
    }
    return { minLat: 26.2, maxLat: 41.8, maxLon: 65.8, minLon: 53.6 };
  }

  function getFilteredPortSet() {
    const set = new Set();
    for (let i = 0; i < operatingPorts.length; i++) {
      const p = operatingPorts[i];
      if (state.portFilter === 'own' && !p.own) continue;
      if (state.portFilter === 'parana' && p.zone !== 'parana') continue;
      if (state.portFilter === 'atlantic' && p.zone !== 'atlantic') continue;
      set.add(p.name);
    }
    return set;
  }

  function project(lat, lon, w, h) {
    const padX = w * 0.10;
    const padTop = h * 0.14;
    const padBot = h * 0.19;
    const plotW = w - padX * 2;
    const plotH = h - padTop - padBot;

    const midLatRad = (((curBounds.minLat + curBounds.maxLat) * 0.5) * Math.PI) / 180;
    const lonSpan = (curBounds.maxLon - curBounds.minLon) * Math.cos(midLatRad);
    const latSpan = curBounds.maxLat - curBounds.minLat;

    const scale = Math.min(plotW / lonSpan, plotH / latSpan);
    const drawnW = lonSpan * scale;
    const drawnH = latSpan * scale;
    const offsetX = padX + (plotW - drawnW) * 0.5;
    const offsetY = padTop + (plotH - drawnH) * 0.5;

    return {
      x: offsetX + (curBounds.maxLon - lon) * Math.cos(midLatRad) * scale,
      y: offsetY + (lat - curBounds.minLat) * scale,
    };
  }

  function drawPoly(targetCtx, points, w, h, strokeStyle, lineWidth) {
    targetCtx.strokeStyle = strokeStyle;
    targetCtx.lineWidth = lineWidth;
    targetCtx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = project(points[i][0], points[i][1], w, h);
      if (i === 0) targetCtx.moveTo(p.x, p.y);
      else targetCtx.lineTo(p.x, p.y);
    }
    targetCtx.stroke();
  }

  function renderStaticChart(w, h) {
    if (typeof document === 'undefined') return;
    if (!staticCanvas) staticCanvas = document.createElement('canvas');
    staticCanvas.width = w;
    staticCanvas.height = h;
    staticCachedW = w;
    staticCachedH = h;

    const sCtx = staticCanvas.getContext('2d');
    if (!sCtx) return;

    sCtx.clearRect(0, 0, w, h);
    sCtx.strokeStyle = 'rgba(2, 168, 242, 0.11)';
    sCtx.lineWidth = Math.max(1, w * 0.0018);
    sCtx.fillStyle = 'rgba(122, 217, 255, 0.36)';
    sCtx.font = `600 ${Math.max(9, Math.round(w * 0.017))}px "JetBrains Mono", monospace`;

    const lats = [28, 30, 32, 34, 36, 38, 40];
    for (let i = 0; i < lats.length; i++) {
      const lat = lats[i];
      if (lat < curBounds.minLat || lat > curBounds.maxLat) continue;
      const pL = project(lat, curBounds.maxLon, w, h);
      const pR = project(lat, curBounds.minLon, w, h);
      sCtx.beginPath();
      sCtx.moveTo(0, pL.y);
      sCtx.lineTo(w, pR.y);
      sCtx.stroke();
      sCtx.fillText(`${lat}°S`, 12, pL.y - 4);
    }

    const lons = [64, 62, 60, 58, 56, 54];
    for (let i = 0; i < lons.length; i++) {
      const lon = lons[i];
      if (lon < curBounds.minLon || lon > curBounds.maxLon) continue;
      const pT = project(curBounds.minLat, lon, w, h);
      sCtx.beginPath();
      sCtx.moveTo(pT.x, 0);
      sCtx.lineTo(pT.x, h);
      sCtx.stroke();
      sCtx.fillText(`${lon}°W`, pT.x + 4, h * 0.11);
    }

    const hqP = project(34.6037, 58.3816, w, h);
    const maxSweepR = Math.max(w, h) * 0.65;
    sCtx.strokeStyle = 'rgba(2, 168, 242, 0.14)';
    const rings = [0.18, 0.36, 0.56, 0.78];
    for (let i = 0; i < rings.length; i++) {
      sCtx.beginPath();
      sCtx.arc(hqP.x, hqP.y, maxSweepR * rings[i], 0, Math.PI * 2);
      sCtx.stroke();
    }

    drawPoly(sCtx, ECDIS_GEO_PATHS.parana, w, h, 'rgba(108, 224, 255, 0.38)', Math.max(1.8, w * 0.004));
    drawPoly(sCtx, ECDIS_GEO_PATHS.uruguay, w, h, 'rgba(122, 217, 255, 0.30)', Math.max(1.5, w * 0.0032));
    drawPoly(sCtx, ECDIS_GEO_PATHS.atlantic, w, h, 'rgba(122, 217, 255, 0.42)', Math.max(1.8, w * 0.0038));

    staticDirty = false;
  }

  function resize(dpr) {
    const scale = dpr || director.getEffectiveDpr();
    const w = Math.max(200, Math.floor((canvas.clientWidth || 560) * scale));
    const h = Math.max(160, Math.floor((canvas.clientHeight || 460) * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      staticDirty = true;
    }
  }

  bus.addEventListener(MYRASA_EVENTS.PORT_FILTER_CHANGED, () => {
    staticDirty = true;
  });

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / Math.max(1, rect.width);
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;

      let closest = null;
      let minD = 32 * dpr;
      for (let i = 0; i < blipCoords.length; i++) {
        const item = blipCoords[i];
        const d = Math.hypot(px - item.x, py - item.y);
        if (d < minD) {
          minD = d;
          closest = item.port;
        }
      }

      if (closest) {
        const nav = calcNauticalFromHQ(closest.lat, closest.lon);
        state.lockedPortName = closest.name;
        state.targetBearingDeg = nav.bearingDeg;
        emitEvent(MYRASA_EVENTS.PORT_LOCKED, {
          port: closest,
          own: closest.own,
          nm: nav.nm,
          bearingDeg: nav.bearingDeg,
          silent: false,
        });
      }
    },
    { passive: true }
  );

  function renderFrame(dt, timeSec) {
    const tb = getTargetBounds();
    const zoomDiff =
      Math.abs(tb.minLat - curBounds.minLat) +
      Math.abs(tb.maxLat - curBounds.maxLat) +
      Math.abs(tb.minLon - curBounds.minLon) +
      Math.abs(tb.maxLon - curBounds.maxLon);

    if (zoomDiff > 0.008) {
      const alpha = expSmoothingAlpha(5.8, dt);
      curBounds.minLat += (tb.minLat - curBounds.minLat) * alpha;
      curBounds.maxLat += (tb.maxLat - curBounds.maxLat) * alpha;
      curBounds.minLon += (tb.minLon - curBounds.minLon) * alpha;
      curBounds.maxLon += (tb.maxLon - curBounds.maxLon) * alpha;
      staticDirty = true;
    } else if (zoomDiff > 0.0) {
      curBounds.minLat = tb.minLat;
      curBounds.maxLat = tb.maxLat;
      curBounds.minLon = tb.minLon;
      curBounds.maxLon = tb.maxLon;
      staticDirty = true;
    }

    const w = canvas.width;
    const h = canvas.height;
    if (staticDirty || staticCachedW !== w || staticCachedH !== h) {
      renderStaticChart(w, h);
    }

    ctx.clearRect(0, 0, w, h);
    if (staticCanvas) {
      ctx.drawImage(staticCanvas, 0, 0);
    }

    const hqP = project(34.6037, 58.3816, w, h);
    const maxSweepR = Math.max(w, h) * 0.65;

    // Barrido del radar proporcional a dt (1.2 rad/s exactos en cualquier monitor)
    sweepAngle = (sweepAngle + 1.2 * dt) % (Math.PI * 2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hqP.x, hqP.y);
    ctx.arc(hqP.x, hqP.y, maxSweepR, sweepAngle - 0.48, sweepAngle);
    ctx.closePath();

    const sweepGrad = ctx.createRadialGradient(hqP.x, hqP.y, 0, hqP.x, hqP.y, maxSweepR);
    sweepGrad.addColorStop(0, 'rgba(2, 168, 242, 0.28)');
    sweepGrad.addColorStop(0.75, 'rgba(2, 168, 242, 0.08)');
    sweepGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(108, 224, 255, 0.75)';
    ctx.lineWidth = Math.max(1.4, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(hqP.x, hqP.y);
    ctx.lineTo(hqP.x + Math.cos(sweepAngle) * maxSweepR, hqP.y + Math.sin(sweepAngle) * maxSweepR);
    ctx.stroke();
    ctx.restore();

    // Ecos dinámicos de los 20 puertos
    const activeNames = getFilteredPortSet();
    blipCoords = [];

    for (let i = 0; i < operatingPorts.length; i++) {
      const port = operatingPorts[i];
      const pt = project(port.lat, port.lon, w, h);
      const inFilter = activeNames.has(port.name);
      if (inFilter) blipCoords.push({ x: pt.x, y: pt.y, port });

      const angle = Math.atan2(pt.y - hqP.y, pt.x - hqP.x);
      let diff = sweepAngle - angle;
      while (diff < 0) diff += Math.PI * 2;
      while (diff > Math.PI * 2) diff -= Math.PI * 2;
      const decay = Math.max(0, 1 - diff / 2.2);

      const isLocked = state.lockedPortName === port.name;
      const baseR = port.own ? Math.max(4, w * 0.0085) : Math.max(2.6, w * 0.0055);

      if (isLocked) {
        const pulse = baseR * 2.2 + Math.sin(timeSec * 5.0) * (w * 0.004);
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = Math.max(1.6, w * 0.0032);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `700 ${Math.max(10, Math.round(w * 0.02))}px "JetBrains Mono", monospace`;
        const text = port.name.toUpperCase();
        const labelX =
          pt.x > w * 0.68
            ? pt.x - pulse - ctx.measureText(text).width - 8
            : pt.x + pulse + 8;
        ctx.fillText(text, labelX, pt.y + 4);
      }

      const alpha = inFilter ? 0.45 + decay * 0.55 : 0.16;
      ctx.fillStyle = isLocked
        ? '#22C55E'
        : port.own
          ? `rgba(2, 168, 242, ${alpha})`
          : `rgba(225, 244, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, baseR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  director.register({
    id: 'tactical-radar',
    element: canvas,
    minIntervalMs: 32, // 30 Hz suave (ui.js pattern)
    onResize: resize,
    onTick: renderFrame,
  });
}
