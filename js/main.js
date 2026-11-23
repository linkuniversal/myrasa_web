/**
 * js/main.js
 * Punto de entrada modular ES (sin dependencias externas).
 * Inicializa Director único, UI Controller, WebAudio Puente de Mando y los 4 lienzos interactivos.
 */

import { MarineDirector } from './engine/director.js';
import { BridgeAudioEngine } from './engine/bridge-audio.js';
import { initWaterHero } from './engine/water-hero.js';
import { initNavalGyroscope } from './engine/gyro.js';
import { initTacticalRadar } from './engine/radar.js';
import { initOceanWave } from './engine/wave-footer.js';
import { initDomController } from './ui/dom-controller.js';

function boot() {
  const director = new MarineDirector();
  new BridgeAudioEngine();

  const domCtrl = initDomController(director);

  initWaterHero(director);
  initNavalGyroscope(director);
  initTacticalRadar(director);
  initOceanWave(director);

  // Resize throttled por rAF para recalcular --header-total y canvases en rotación móvil
  let resizePending = false;
  window.addEventListener(
    'resize',
    () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        domCtrl.syncHeaderHeightVar();
        director.triggerResizeAll();
      });
    },
    { passive: true }
  );

  domCtrl.syncHeaderHeightVar();
  director.start();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
