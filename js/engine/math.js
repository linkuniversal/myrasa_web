/**
 * js/engine/math.js
 * Motor matemático puro (extraído de kin.js & world_nav_and_story.js).
 * Cero dependencias de DOM/WebGL. 100% independiente de la tasa de refresco (60/120/144Hz).
 */

export const TWO_PI = Math.PI * 2.0;
export const DEG_TO_RAD = Math.PI / 180.0;
export const RAD_TO_DEG = 180.0 / Math.PI;

export function clamp(val, lo, hi) {
  if (!Number.isFinite(val)) return lo;
  return val < lo ? lo : val > hi ? hi : val;
}

export function lerp(a, b, u) {
  return a + (b - a) * u;
}

/**
 * Suavizado exponencial independiente del framerate (core.js).
 */
export function expSmoothingAlpha(speed, dt) {
  return 1.0 - Math.exp(-speed * Math.max(0.0, dt));
}

/**
 * Curva Hermite C1 (world_nav_and_story.js).
 */
export function smoothstep01(u) {
  const t = clamp(u, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Curva Quíntica C2 (world_nav_and_story.js) — cero tirones en aceleración.
 */
export function smootherstep01(u) {
  const t = clamp(u, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

export function wrapAngleDeg360(deg) {
  const m = deg % 360.0;
  return m < 0.0 ? m + 360.0 : m;
}

/**
 * Diferencia angular más corta en grados [-180, +180] para que la rosa
 * del giroscopio nunca dé vueltas largas innecesarias.
 */
export function shortestAngleDeltaDeg(fromDeg, toDeg) {
  let d = ((toDeg - fromDeg + 180.0) % 360.0);
  if (d < 0.0) d += 360.0;
  return d - 180.0;
}

/**
 * Generador pseudoaleatorio determinístico mulberry32 (kin.js).
 */
export function createMulberry32(seed = 0x5f8a0d10) {
  let a = (seed >>> 0) || 0x5f8a0d10;
  return function nextRandom() {
    let t = (a = (a + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Oscilador armónico de 2° orden con sub-stepping (adaptado de stepBikeDynamicsSpring en kin.js).
 * Mantiene el mismo comportamiento físico exacto en monitores de 60Hz, 120Hz o 144Hz.
 */
export function createSpringState(initialValue = 0.0) {
  return { val: initialValue, vel: 0.0 };
}

export function stepSpring(
  spring,
  target,
  dt,
  { wn = 9.5, zeta = 0.85, min = -Infinity, max = Infinity, subSteps = 2 } = {}
) {
  const h = clamp(dt, 0.0, 0.05);
  if (h <= 1e-7) return spring.val;

  const subDt = h / subSteps;
  const wn2 = wn * wn;
  const damp2 = 2.0 * zeta * wn;

  for (let i = 0; i < subSteps; i++) {
    const accel = wn2 * (target - spring.val) - damp2 * spring.vel;
    spring.vel += accel * subDt;
    spring.val = clamp(spring.val + spring.vel * subDt, min, max);
  }
  return spring.val;
}

/**
 * Distancia en Millas Náuticas (NM) y Rumbo Verdadero (Bearing 0..360°)
 * usando fórmula esférica Haversine desde Casa Central hacia cualquier puerto.
 */
export function calcNauticalFromHQ(latS, lonW, hqLatS = 34.6037, hqLonW = 58.3816) {
  const phi1 = -hqLatS * DEG_TO_RAD;
  const phi2 = -latS * DEG_TO_RAD;
  const lam1 = -hqLonW * DEG_TO_RAD;
  const lam2 = -lonW * DEG_TO_RAD;

  const dPhi = phi2 - phi1;
  const dLam = lam2 - lam1;

  const a =
    Math.sin(dPhi * 0.5) * Math.sin(dPhi * 0.5) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam * 0.5) * Math.sin(dLam * 0.5);
  const km = 6371.0 * 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1.0 - a)));
  const nm = Math.round(km / 1.852);

  if (nm === 0) {
    return { nm: 0, bearingDeg: 142.0 };
  }

  const y = Math.sin(dLam) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
  const bearingDeg = wrapAngleDeg360(Math.atan2(y, x) * RAD_TO_DEG);

  return { nm, bearingDeg };
}

export function formatDMS(dec, hemi) {
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.round((abs - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'${hemi}`;
}

export function cardinalDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const norm = wrapAngleDeg360(deg);
  return dirs[Math.round(norm / 45.0) % 8];
}
