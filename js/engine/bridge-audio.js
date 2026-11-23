/**
 * js/engine/bridge-audio.js
 * Sintetizador WebAudio opcional "Puente de Mando" (0 KB de MP3).
 * Extraído y adaptado de audio/game_audio.js (rampas seguras >= 0.0001, ataque >= 5.5ms).
 */

import { bus, state, MYRASA_EVENTS } from '../contract.js';
import { clamp } from './math.js';

const MIN_EXP_VAL = 0.0001;
const MIN_ATTACK_SEC = 0.006;

function safeExp(v) {
  return Math.max(MIN_EXP_VAL, Number.isFinite(v) ? v : MIN_EXP_VAL);
}

export class BridgeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = Boolean(state.audioEnabled);
    this._lastClickMs = -999;
    this._lastPingMs = -999;

    bus.addEventListener(MYRASA_EVENTS.AUDIO_TOGGLED, (e) => {
      this.setEnabled(Boolean(e.detail?.enabled));
    });

    bus.addEventListener(MYRASA_EVENTS.UI_INTERACTION, () => {
      if (this.enabled) this.triggerUiClick();
    });

    bus.addEventListener(MYRASA_EVENTS.PORT_LOCKED, (e) => {
      if (this.enabled && !e.detail?.silent) {
        this.triggerSonarPing(Boolean(e.detail?.own));
      }
    });
  }

  _ensureContext() {
    if (this.ctx) return true;
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? 0.55 : 0.0;
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch (_) {
      this.ctx = null;
      return false;
    }
  }

  setEnabled(nextEnabled) {
    this.enabled = Boolean(nextEnabled);
    state.audioEnabled = this.enabled;

    if (this.enabled) {
      this._ensureContext();
      if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.03);
      }
      this.triggerUiClick();
    } else if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.03);
    }
  }

  /**
   * Clic táctil mecánico de consola naval (17ms, adaptado de game_audio.js).
   */
  triggerUiClick() {
    if (!this.enabled) return;
    if (!this._ensureContext() || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const nowMs = performance.now();
    if (nowMs - this._lastClickMs < 24) return;
    this._lastClickMs = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1480.0, now);
    osc.frequency.exponentialRampToValueAtTime(620.0, now + 0.015);

    g.gain.setValueAtTime(MIN_EXP_VAL, now);
    g.gain.linearRampToValueAtTime(0.055, now + MIN_ATTACK_SEC);
    g.gain.exponentialRampToValueAtTime(MIN_EXP_VAL, now + 0.018);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  /**
   * Ping sutil de radar ECDIS naval al fijar un puerto objetivo.
   */
  triggerSonarPing(isOwnOffice = false) {
    if (!this.enabled) return;
    if (!this._ensureContext() || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const nowMs = performance.now();
    if (nowMs - this._lastPingMs < 90) return;
    this._lastPingMs = nowMs;

    const now = this.ctx.currentTime;
    const baseHz = isOwnOffice ? 1318.5 : 1046.5;

    // Pulso principal limpio + armónico de eco suave
    const notes = [
      { delay: 0.0, freq: baseHz, amp: 0.068, dur: 0.28 },
      { delay: 0.085, freq: baseHz * 1.498, amp: 0.026, dur: 0.24 },
    ];

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const t0 = now + n.delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(safeExp(n.freq), t0);
      osc.frequency.exponentialRampToValueAtTime(safeExp(n.freq * 0.992), t0 + n.dur);

      g.gain.setValueAtTime(MIN_EXP_VAL, t0);
      g.gain.linearRampToValueAtTime(clamp(n.amp, MIN_EXP_VAL, 0.2), t0 + MIN_ATTACK_SEC);
      g.gain.exponentialRampToValueAtTime(MIN_EXP_VAL, t0 + n.dur);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.02);
    }
  }
}
