/**
 * js/engine/director.js
 * Bucle maestro único con deltaTime real, IntersectionObserver por módulo,
 * throttling selectivo (30Hz/60Hz) y gobernador adaptativo de DPR (extraído de core.js & ui.js).
 */

import { clamp } from './math.js';

export class MarineDirector {
  constructor() {
    this.tasks = [];
    this.rafId = null;
    this.lastTimeMs = 0;

    // Gobernador adaptativo de DPR (core.js)
    this.governedDprCap = 1.75;
    this._frameDeltas = new Float32Array(60);
    this._deltaIdx = 0;
    this._deltaCount = 0;
    this._onDprDropCallbacks = [];

    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              let anyNowVisible = false;
              for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                for (let j = 0; j < this.tasks.length; j++) {
                  const task = this.tasks[j];
                  if (task.element === entry.target) {
                    const wasVis = task.visible;
                    task.visible = entry.isIntersecting;
                    if (!wasVis && task.visible) {
                      anyNowVisible = true;
                    }
                  }
                }
              }
              if (anyNowVisible && this.rafId === null && !this.reducedMotion) {
                this.start();
              }
            },
            { rootMargin: '60px 0px' }
          )
        : null;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.lastTimeMs = 0;
          this.start();
        }
      });
    }
  }

  onDprChange(cb) {
    if (typeof cb === 'function') this._onDprDropCallbacks.push(cb);
  }

  getEffectiveDpr() {
    const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return Math.min(raw, this.governedDprCap);
  }

  /**
   * Registra un módulo visual/físico en el loop maestro.
   * @param {object} config { id, element, minIntervalMs (0 = full fps, 32 = 30Hz), onResize, onTick }
   */
  register(config) {
    const task = {
      id: config.id || `task_${this.tasks.length}`,
      element: config.element || null,
      minIntervalMs: Number(config.minIntervalMs) || 0,
      lastDrawMs: -9999,
      visible: config.element ? true : true,
      onResize: typeof config.onResize === 'function' ? config.onResize : null,
      onTick: typeof config.onTick === 'function' ? config.onTick : null,
    };

    this.tasks.push(task);

    if (this._observer && task.element) {
      this._observer.observe(task.element);
    }

    if (task.onResize) {
      task.onResize(this.getEffectiveDpr());
    }

    // En modo movimiento reducido, renderiza 1 frame limpio y no inicia loop continuo
    if (this.reducedMotion && task.onTick) {
      task.onTick(0.016, 0.0, true);
    }

    return task;
  }

  triggerResizeAll() {
    const dpr = this.getEffectiveDpr();
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].onResize) {
        this.tasks[i].onResize(dpr);
      }
    }
  }

  _recordFramePerf(rawDeltaMs) {
    if (this.governedDprCap <= 1.15 || rawDeltaMs <= 0.5 || rawDeltaMs >= 250.0) return;

    this._frameDeltas[this._deltaIdx] = rawDeltaMs;
    this._deltaIdx = (this._deltaIdx + 1) % 60;
    if (this._deltaCount < 60) {
      this._deltaCount++;
      return;
    }

    let sum = 0.0;
    for (let i = 0; i < 60; i++) sum += this._frameDeltas[i];
    if (sum / 60.0 > 18.5) {
      this.governedDprCap = 1.15;
      this._deltaCount = 0;
      const dpr = this.getEffectiveDpr();
      for (let i = 0; i < this._onDprDropCallbacks.length; i++) {
        this._onDprDropCallbacks[i](dpr);
      }
      this.triggerResizeAll();
    }
  }

  start() {
    if (this.reducedMotion || this.rafId !== null) return;
    this.lastTimeMs = 0;
    const loop = (nowMs) => {
      if (typeof document !== 'undefined' && document.hidden) {
        this.rafId = null;
        return;
      }

      if (this.lastTimeMs === 0) {
        this.lastTimeMs = nowMs;
      }
      const rawDeltaMs = nowMs - this.lastTimeMs;
      this.lastTimeMs = nowMs;
      const dt = clamp(rawDeltaMs * 0.001, 0.001, 0.05);
      const timeSec = nowMs * 0.001;

      this._recordFramePerf(rawDeltaMs);

      let anyVisible = false;
      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];
        if (!task.visible) continue;
        anyVisible = true;

        if (task.minIntervalMs > 0 && nowMs - task.lastDrawMs < task.minIntervalMs) {
          continue;
        }
        task.lastDrawMs = nowMs;
        if (task.onTick) {
          task.onTick(dt, timeSec, false);
        }
      }

      if (anyVisible) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
