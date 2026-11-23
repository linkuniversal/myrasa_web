/**
 * js/ui/dom-controller.js
 * Controlador UI desacoplado con dirty-checking domCache (ui.js),
 * sincronización exacta de --header-total para 100% responsive (320px–4K),
 * contadores KPI con smootherstep01, Scroll-Spy, Drawer y Portal Clientes.
 */

import {
  PORTAL_AUTH_ENDPOINT,
  MYRASA_EVENTS,
  state,
  bus,
  emitEvent,
  i18n,
  serviceChapters,
  operatingPorts,
  portsDirectoryData,
} from '../contract.js';
import {
  smootherstep01,
  calcNauticalFromHQ,
  formatDMS,
} from '../engine/math.js';

export function initDomController(director) {
  const siteHeader = document.getElementById('siteHeader');
  const floatingDock = document.getElementById('gacFloatingDock');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileBackdrop = document.getElementById('mobileDrawerBackdrop');
  const mobileToggleBtn = document.getElementById('mobileMenuToggleBtn');
  const mobileCloseBtn = document.getElementById('drawerCloseBtn');
  const portalModal = document.getElementById('portalModal');
  const portalForm = document.getElementById('portalLoginForm');
  const portalStatus = document.getElementById('portalStatusMsg');
  const portalUser = document.getElementById('portalUser');
  const portalPass = document.getElementById('portalPass');

  const radarLockNameEl = document.getElementById('radarLockName');
  const radarLockCoordEl = document.getElementById('radarLockCoord');
  const bridgeAudioBtn = document.getElementById('btnBridgeAudio');
  const bridgeAudioLabel = document.getElementById('bridgeAudioLabel');

  const chapterIds = ['srv-cap-1', 'srv-cap-2', 'srv-cap-3', 'srv-cap-4'];
  const navLinks = Array.from(document.querySelectorAll('.sticky-nav-link'));

  // Cache de estado DOM para cero mutaciones redundantes en scroll (ui.js)
  const domCache = {
    isScrolled: null,
    dockVisible: null,
    activeChapterId: '',
    headerHeightPx: -1,
    audioEnabled: null,
    lockNameText: '',
    lockCoordText: '',
  };

  /* ========================================================================
     1. SINCRONIZACIÓN MATEMÁTICA DE ALTURA DE HEADER (--header-total)
     ======================================================================== */
  function syncHeaderHeightVar() {
    if (!siteHeader) return;
    const h = Math.round(siteHeader.getBoundingClientRect().height);
    if (h > 0 && h !== domCache.headerHeightPx) {
      domCache.headerHeightPx = h;
      document.documentElement.style.setProperty('--header-total', `${h}px`);
    }
  }

  /* ========================================================================
     2. RENDERIZADO DE CONTENIDO (SERVICIOS, PUERTOS, OFICINAS, ORGANIGRAMA)
     ======================================================================== */
  function renderServices() {
    const container = document.getElementById('servicesGrid');
    if (!container) return;
    const isEn = state.lang === 'en';

    container.innerHTML = serviceChapters
      .map((chap) => {
        const chapTitle = isEn ? chap.titleEn : chap.titleEs;
        const cardsHtml = chap.services
          .map(
            (s) => `
          <article class="service-card-2030">
            <div class="srv-card-top">
              <div class="srv-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
              </div>
              <span class="srv-num">${s.num}</span>
            </div>
            <div>
              <h4 class="srv-title">${isEn ? s.en : s.es}</h4>
              <p class="srv-desc">${isEn ? s.dEn : s.dEs}</p>
            </div>
          </article>
        `
          )
          .join('');

        return `
        <div class="service-chapter-block" id="${chap.id}">
          <div class="service-chapter-header">
            <span class="service-chapter-num">${chap.num}</span>
            <h3 class="service-chapter-title">${chapTitle}</h3>
          </div>
          <div class="services-cards-grid">${cardsHtml}</div>
        </div>
      `;
      })
      .join('');
  }

  function getFilteredPorts() {
    return operatingPorts.filter((p) => {
      if (state.portFilter === 'own') return p.own;
      if (state.portFilter === 'parana') return p.zone === 'parana';
      if (state.portFilter === 'atlantic') return p.zone === 'atlantic';
      return true;
    });
  }

  function renderPorts() {
    const grid = document.getElementById('portsShowcaseGrid');
    if (!grid) return;
    const isEn = state.lang === 'en';
    const filtered = getFilteredPorts();

    grid.innerHTML = filtered
      .map((p) => {
        const isLocked = state.lockedPortName === p.name ? 'is-radar-locked' : '';
        return `
        <button type="button" class="port-showcase-card ${p.own ? 'has-office' : ''} ${isLocked}" data-port-name="${p.name}">
          <span class="port-card-info">
            <span class="port-card-name">${p.name}</span>
            <span class="port-card-tag">${isEn ? p.tagEn : p.tagEs}</span>
          </span>
          ${p.own ? '<span class="office-beacon-dot" title="Oficina Propia"></span>' : ''}
        </button>
      `;
      })
      .join('');
  }

  function syncLockedPortDom(port, nm) {
    const isEn = state.lang === 'en';
    const badge = port.own
      ? isEn
        ? 'OWN OFFICE'
        : 'OFICINA PROPIA'
      : isEn
        ? 'ACTIVE PORT'
        : 'PUERTO ACTIVO';
    const distTag = nm === 0 ? 'HQ' : `${nm} NM`;
    const nextName = `LOCK: ${port.name.toUpperCase()} (${badge})`;
    const nextCoord = `${formatDMS(port.lat, 'S')} · ${formatDMS(port.lon, 'W')} · ${distTag}`;

    if (radarLockNameEl && nextName !== domCache.lockNameText) {
      domCache.lockNameText = nextName;
      radarLockNameEl.textContent = nextName;
    }
    if (radarLockCoordEl && nextCoord !== domCache.lockCoordText) {
      domCache.lockCoordText = nextCoord;
      radarLockCoordEl.textContent = nextCoord;
    }

    const cards = document.querySelectorAll('.port-showcase-card');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.classList.toggle(
        'is-radar-locked',
        card.getAttribute('data-port-name') === port.name
      );
    }
  }

  function lockPort(portName, silent = false) {
    const found = operatingPorts.find((p) => p.name === portName);
    if (!found) return;

    const nav = calcNauticalFromHQ(found.lat, found.lon);
    state.lockedPortName = found.name;
    state.targetBearingDeg = nav.bearingDeg;

    emitEvent(MYRASA_EVENTS.PORT_LOCKED, {
      port: found,
      own: found.own,
      nm: nav.nm,
      bearingDeg: nav.bearingDeg,
      silent,
    });
  }

  bus.addEventListener(MYRASA_EVENTS.PORT_LOCKED, (e) => {
    const port = e.detail?.port;
    if (!port) return;
    const nm = Number.isFinite(e.detail?.nm)
      ? e.detail.nm
      : calcNauticalFromHQ(port.lat, port.lon).nm;
    syncLockedPortDom(port, nm);
  });

  function renderOfficeBoard(key) {
    const box = document.getElementById('officeBoardBox');
    const data = portsDirectoryData[key];
    if (!box || !data) return;
    const isEn = state.lang === 'en';

    const cards = data.staff
      .map((p) => {
        const role = isEn ? p.roleEn : p.roleEs;
        const ata = p.ata ? '<span class="ata-badge">ATA</span>' : '';
        const waBtn = p.wa
          ? `<a href="https://wa.me/${p.wa}" target="_blank" rel="noopener noreferrer" class="staff-action-btn wa" title="WhatsApp ${p.name}" aria-label="WhatsApp ${p.name}">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </a>`
          : '';
        return `
        <div class="staff-card">
          <div class="staff-meta">
            <div class="staff-name-row">
              <span class="staff-name">${p.name}</span>
              ${ata}
            </div>
            <span class="staff-role">${role}</span>
          </div>
          <div class="staff-btns">
            ${waBtn}
            <a href="tel:${p.tel}" class="staff-action-btn" title="Tel ${p.tel}" aria-label="Llamar a ${p.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
            <a href="mailto:${p.email}" class="staff-action-btn" title="${p.email}" aria-label="Email a ${p.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>
      `;
      })
      .join('');

    box.innerHTML = `
      <div class="office-board-meta">
        <span class="office-meta-title">${isEn ? data.metaEn : data.metaEs}</span>
        <a href="mailto:${data.officeEmail}" class="office-meta-email">${data.officeEmail}</a>
      </div>
      <div class="staff-cards-grid">${cards}</div>
    `;
  }

  function renderOrg() {
    const box = document.getElementById('orgTiersContainer');
    if (!box) return;
    const isEn = state.lang === 'en';
    box.innerHTML = `
      <div class="org-tier">
        <span class="org-tier-label">${isEn ? 'Executive & Administration' : 'Dirección & Administración'}</span>
        <div class="org-row"><strong>${isEn ? 'General Manager' : 'Gerente General'}</strong><span>Javier Marchionni</span></div>
        <div class="org-row"><strong>${isEn ? 'Treasury & Foreign Trade' : 'Tesorería y Comercio Exterior'}</strong><span>Maximiliano Cassola</span></div>
        <div class="org-row"><strong>${isEn ? 'Documentation & Billing' : 'Documentación y Facturación'}</strong><span>Nicolás Ortega</span></div>
        <div class="org-row"><strong>${isEn ? 'Corporate Areas' : 'Áreas Internas'}</strong><span>${isEn ? 'Accounting, HR, Payroll & Tax' : 'Contabilidad, RRHH, Proveedores e Impuestos'}</span></div>
      </div>
      <div class="org-tier">
        <span class="org-tier-label">${isEn ? 'Operations & Port ATA Management' : 'Jefatura Operativa & Puertos (ATA)'}</span>
        <div class="org-row"><strong>${isEn ? 'Head of Operations (ATA)' : 'Jefe Operativo (ATA)'}</strong><span>Rodrigo Fandiño Nalerio</span></div>
        <div class="org-row"><strong>Buenos Aires / Dock Sud</strong><span>Matías Ponce (ATA) · Julio C. Alegre</span></div>
        <div class="org-row"><strong>Puerto La Plata</strong><span>Federico Romero Huergo (ATA) · Ramiro Díaz</span></div>
        <div class="org-row"><strong>San Lorenzo</strong><span>Mauricio Rivollier · Gisel M. Presson</span></div>
        <div class="org-row"><strong>Barranqueras (Chaco)</strong><span>Sebastián Yucherchen</span></div>
      </div>
    `;
  }

  /* ========================================================================
     3. IDIOMA & AUDIO TOGGLE
     ======================================================================== */
  function syncAudioToggleDom() {
    const enabled = Boolean(state.audioEnabled);
    if (enabled === domCache.audioEnabled) return;
    domCache.audioEnabled = enabled;
    const dict = i18n[state.lang] || i18n.es;
    if (bridgeAudioBtn) {
      bridgeAudioBtn.classList.toggle('is-active', enabled);
      bridgeAudioBtn.setAttribute('aria-pressed', String(enabled));
    }
    if (bridgeAudioLabel) {
      bridgeAudioLabel.textContent = enabled ? dict.audioOn : dict.audioOff;
    }
  }

  function applyLanguage(lang) {
    state.lang = lang === 'en' ? 'en' : 'es';
    document.body.setAttribute('data-lang', state.lang);
    document.documentElement.setAttribute('lang', state.lang);

    document.getElementById('langEs')?.classList.toggle('active', state.lang === 'es');
    document.getElementById('langEn')?.classList.toggle('active', state.lang === 'en');
    const dLabel = document.getElementById('drawerLangLabel');
    if (dLabel) dLabel.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';

    const dict = i18n[state.lang] || i18n.es;
    const nodes = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const k = el.getAttribute('data-i18n');
      if (dict[k]) {
        if (k.includes('Headline') || k === 'aboutBody' || k === 'portalTitle') {
          el.innerHTML = dict[k];
        } else {
          el.textContent = dict[k];
        }
      }
    }

    domCache.audioEnabled = null;
    syncAudioToggleDom();

    renderServices();
    renderPorts();
    if (state.lockedPortName) lockPort(state.lockedPortName, true);
    renderOfficeBoard(state.officeKey);
    renderOrg();
    syncHeaderHeightVar();
    emitEvent(MYRASA_EVENTS.LANG_CHANGED, { lang: state.lang });
  }

  function toggleLanguage() {
    const next = state.lang === 'es' ? 'en' : 'es';
    applyLanguage(next);
    emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'lang' });
    try {
      localStorage.setItem('myrasa_web_lang', next);
    } catch (_) {}
  }

  /* ========================================================================
     4. MODALES, DRAWER MÓVIL & NOMINADOR WHATSAPP
     ======================================================================== */
  function openMobileMenu() {
    if (!mobileDrawer || !mobileBackdrop) return;
    mobileDrawer.classList.add('open');
    mobileBackdrop.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    mobileToggleBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'drawer_open' });
  }

  function closeMobileMenu() {
    if (!mobileDrawer || !mobileBackdrop) return;
    mobileDrawer.classList.remove('open');
    mobileBackdrop.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    mobileToggleBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMobileMenu() {
    if (mobileDrawer?.classList.contains('open')) closeMobileMenu();
    else openMobileMenu();
  }

  function openPortalModal() {
    if (portalStatus) {
      portalStatus.classList.remove('visible');
      portalStatus.textContent = '';
    }
    if (portalModal) {
      portalModal.classList.add('open');
      emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'portal_open' });
      setTimeout(() => portalUser?.focus(), 180);
    }
  }

  function closePortalModal() {
    portalModal?.classList.remove('open');
  }

  async function handlePortalLogin(e) {
    e.preventDefault();
    const user = portalUser ? portalUser.value.trim() : '';
    const pass = portalPass ? portalPass.value : '';
    const isEn = state.lang === 'en';
    if (!portalStatus) return;

    if (!PORTAL_AUTH_ENDPOINT) {
      portalStatus.innerHTML = isEn
        ? `<strong>Cloudflare Auth ready:</strong> Set <code>PORTAL_AUTH_ENDPOINT</code> to your Cloudflare Worker or Access URL to authenticate <strong>${user}</strong> securely.`
        : `<strong>Portal listo para Cloudflare:</strong> Configurá <code>PORTAL_AUTH_ENDPOINT</code> con la URL de tu Worker o Cloudflare Access para validar a <strong>${user}</strong> de forma segura.`;
      portalStatus.classList.add('visible');
      return;
    }

    try {
      const res = await fetch(PORTAL_AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        portalStatus.textContent = isEn
          ? 'Invalid credentials. Contact operations@myrasa.com.ar.'
          : 'Credenciales inválidas. Contactá a operations@myrasa.com.ar.';
        portalStatus.classList.add('visible');
      }
    } catch (_) {
      portalStatus.textContent = isEn
        ? 'Connection error. Please retry.'
        : 'Error de conexión con el servidor de acceso.';
      portalStatus.classList.add('visible');
    }
  }

  function submitNomination() {
    const portSel = document.getElementById('nomPort');
    const servSel = document.getElementById('nomService');
    if (!portSel || !servSel) return;
    const selectedOption = portSel.options[portSel.selectedIndex];
    const wa = selectedOption.getAttribute('data-wa') || '5491120161221';
    const portText = selectedOption.text;
    const servText = servSel.value;

    const msg =
      state.lang === 'en'
        ? `Hello MYRASA, we require port assistance.\n• Port: ${portText}\n• Operation: ${servText}`
        : `Hola MYRASA, solicitamos asistencia operativa portuaria.\n• Puerto: ${portText}\n• Operación: ${servText}`;

    emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'nomination' });
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  /* ========================================================================
     5. CONTADORES KPI CON CURVA C2 (smootherstep01) + REVELADO SEGURO
     ======================================================================== */
  function initKpiCountersAndReveal() {
    const kpis = Array.from(document.querySelectorAll('.kpi-num[data-count]'));
    let kpisAnimated = false;

    function animateKpis() {
      if (kpisAnimated || kpis.length === 0) return;
      kpisAnimated = true;

      if (director.reducedMotion) {
        for (let i = 0; i < kpis.length; i++) {
          const target = Number(kpis[i].getAttribute('data-count')) || 0;
          kpis[i].textContent = target === 34 ? '34+' : String(target);
        }
        return;
      }

      const startMs = performance.now();
      const durationMs = 1350.0;

      function stepKpi(nowMs) {
        const u = Math.min(1.0, (nowMs - startMs) / durationMs);
        const eased = smootherstep01(u);
        for (let i = 0; i < kpis.length; i++) {
          const el = kpis[i];
          const target = Number(el.getAttribute('data-count')) || 0;
          const val = Math.round(target * eased);
          const text = target === 34 && u >= 1.0 ? '34+' : String(val);
          if (el.textContent !== text) el.textContent = text;
        }
        if (u < 1.0) {
          requestAnimationFrame(stepKpi);
        }
      }
      requestAnimationFrame(stepKpi);
    }

    const kpiRow = document.querySelector('.stats-kpi-row');
    if (kpiRow && 'IntersectionObserver' in window) {
      const kpiObs = new IntersectionObserver(
        (entries, obs) => {
          if (entries[0].isIntersecting) {
            animateKpis();
            obs.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      kpiObs.observe(kpiRow);
    } else {
      animateKpis();
    }

    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !director.reducedMotion) {
      document.documentElement.classList.add('js-reveal-ready');
      const revealObs = new IntersectionObserver(
        (entries, obs) => {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
      );

      for (let i = 0; i < reveals.length; i++) {
        const el = reveals[i];
        if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
          el.classList.add('is-visible');
        } else {
          revealObs.observe(el);
        }
      }

      setTimeout(() => {
        for (let i = 0; i < reveals.length; i++) {
          reveals[i].classList.add('is-visible');
        }
      }, 1300);
    } else {
      for (let i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('is-visible');
      }
    }
  }

  /* ========================================================================
     6. ELEVATOR SCROLL + ZERO-GC SCROLL-SPY + EVENT DELEGATION
     ======================================================================== */
  function bindEvents() {
    document.getElementById('btnLangToggle')?.addEventListener('click', toggleLanguage);
    document.getElementById('btnDrawerLang')?.addEventListener('click', toggleLanguage);

    bridgeAudioBtn?.addEventListener('click', () => {
      const next = !state.audioEnabled;
      state.audioEnabled = next;
      syncAudioToggleDom();
      emitEvent(MYRASA_EVENTS.AUDIO_TOGGLED, { enabled: next });
    });

    mobileToggleBtn?.addEventListener('click', toggleMobileMenu);
    mobileCloseBtn?.addEventListener('click', closeMobileMenu);
    mobileBackdrop?.addEventListener('click', closeMobileMenu);

    document.getElementById('btnOpenPortalDesktop')?.addEventListener('click', openPortalModal);
    document.getElementById('btnOpenPortalFooter')?.addEventListener('click', openPortalModal);
    document.getElementById('btnOpenPortalDrawer')?.addEventListener('click', () => {
      closeMobileMenu();
      openPortalModal();
    });
    document.getElementById('btnClosePortal')?.addEventListener('click', closePortalModal);
    portalModal?.addEventListener('click', (e) => {
      if (e.target === portalModal) closePortalModal();
    });
    portalForm?.addEventListener('submit', handlePortalLogin);

    document.getElementById('btnNomSubmit')?.addEventListener('click', submitNomination);
    document.getElementById('btnCloseAlert')?.addEventListener('click', () => {
      document.getElementById('opsAlertStrip')?.classList.add('is-dismissed');
      emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'alert_dismiss' });
    });

    // Delegación en filtros de puertos
    document.getElementById('portsFilterBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.port-filter-btn');
      if (!btn) return;
      const filterKey = btn.getAttribute('data-filter') || 'all';
      state.portFilter = filterKey;

      const allBtns = document.querySelectorAll('.port-filter-btn');
      for (let i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.toggle('active', allBtns[i] === btn);
      }

      renderPorts();
      emitEvent(MYRASA_EVENTS.PORT_FILTER_CHANGED, { filter: filterKey });
      emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'port_filter' });

      const list = getFilteredPorts();
      if (list.length && !list.some((p) => p.name === state.lockedPortName)) {
        lockPort(list[0].name, true);
      }
    });

    // Delegación en tarjetas de puertos
    document.getElementById('portsShowcaseGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.port-showcase-card');
      if (!card) return;
      const portName = card.getAttribute('data-port-name');
      if (portName) lockPort(portName, false);
    });

    // Delegación en tabs de oficinas
    document.querySelector('.office-tabs-bar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.office-tab-btn');
      if (!btn) return;
      const key = btn.getAttribute('data-port');
      if (!key) return;
      state.officeKey = key;

      const tabs = document.querySelectorAll('.office-tab-btn');
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('active', tabs[i] === btn);
      }
      renderOfficeBoard(key);
      emitEvent(MYRASA_EVENTS.OFFICE_CHANGED, { officeKey: key });
      emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'office_tab' });
    });

    // Cerrar drawer al navegar desde enlaces móviles
    mobileDrawer?.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#"]')) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePortalModal();
        closeMobileMenu();
      }
    });

    // Aterrizaje tipo ascensor con compensación exacta de altura dinámica del Header
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      emitEvent(MYRASA_EVENTS.UI_INTERACTION, { source: 'nav_anchor' });

      if (hash === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const headerH = siteHeader ? siteHeader.getBoundingClientRect().height : 116;
      const isMainSection = target.tagName === 'SECTION';
      const destY =
        target.getBoundingClientRect().top + window.scrollY - headerH + (isMainSection ? 2 : -28);
      window.scrollTo({ top: Math.max(0, destY), behavior: 'smooth' });
    });

    let scrollTicking = false;
    function updateOnScroll() {
      scrollTicking = false;
      const y = window.scrollY || window.pageYOffset;

      const nextScrolled = y > 24;
      if (siteHeader && nextScrolled !== domCache.isScrolled) {
        domCache.isScrolled = nextScrolled;
        siteHeader.classList.toggle('is-scrolled', nextScrolled);
      }

      const nextDock = y > window.innerHeight * 0.55;
      if (floatingDock && nextDock !== domCache.dockVisible) {
        domCache.dockVisible = nextDock;
        floatingDock.classList.toggle('is-visible', nextDock);
      }

      const headerH = siteHeader ? siteHeader.getBoundingClientRect().height : 116;
      const triggerY = headerH + 140;
      let activeId = chapterIds[0];

      for (let i = 0; i < chapterIds.length; i++) {
        const el = document.getElementById(chapterIds[i]);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerY) {
          activeId = chapterIds[i];
        }
      }

      if (activeId !== domCache.activeChapterId) {
        domCache.activeChapterId = activeId;
        for (let i = 0; i < navLinks.length; i++) {
          const link = navLinks[i];
          link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        }
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(updateOnScroll);
        }
      },
      { passive: true }
    );
    updateOnScroll();
  }

  // Inicialización inicial
  let savedLang = 'es';
  try {
    const l = localStorage.getItem('myrasa_web_lang');
    if (l === 'es' || l === 'en') savedLang = l;
  } catch (_) {}

  applyLanguage(savedLang);
  bindEvents();
  initKpiCountersAndReveal();

  return {
    syncHeaderHeightVar,
  };
}
