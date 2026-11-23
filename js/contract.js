/**
 * js/contract.js
 * Única fuente de verdad: Datos corporativos MYRASA, Estado Global y Bus de Eventos.
 * 100% fiel a la información original del proyecto.
 */

export const PORTAL_AUTH_ENDPOINT = '';

export const MYRASA_EVENTS = Object.freeze({
  LANG_CHANGED: 'myrasa:lang-changed',
  PORT_FILTER_CHANGED: 'myrasa:port-filter-changed',
  PORT_LOCKED: 'myrasa:port-locked',
  OFFICE_CHANGED: 'myrasa:office-changed',
  AUDIO_TOGGLED: 'myrasa:audio-toggled',
  UI_INTERACTION: 'myrasa:ui-interaction',
  KPI_PING: 'myrasa:kpi-ping',
});

export const state = {
  lang: 'es',
  officeKey: 'bsas',
  portFilter: 'all',
  lockedPortName: 'Buenos Aires',
  audioEnabled: false,
  targetBearingDeg: 142.0,
};

export const bus = new EventTarget();

export function emitEvent(name, detail = {}) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export const i18n = {
  es: {
    liveDuty: 'Guardia 24/7 · 365 Días',
    navContactTop: 'Contacto Directo',
    navTrayectoria: 'Trayectoria',
    navServicios: 'Servicios',
    navPuertos: 'Red de Puertos',
    navOficinas: 'Oficinas & Guardias',
    navEmpresa: 'Empresa',
    navPortal: 'Portal Clientes',
    navCta: 'Asistencia',
    audioOff: 'PUENTE: OFF',
    audioOn: 'PUENTE: ON',
    heroEyebrow: 'Agencia Marítima · Operando desde 1992',
    heroHeadline: 'Navegación segura y logística <em>sin sub-agentes</em>',
    heroSubheadline:
      'Más de 34 años asistiendo buques tanque, remolcadores de empuje y barcazas en 20 puertos y zonas de alijo de Argentina y Uruguay. Atención operativa 24/7 los 365 días.',
    nomPortLabel: 'Puerto de Escala',
    nomServLabel: 'Tipo de Operación',
    nomBtn: 'Conectar Guardia',
    alertTitle: 'Guardia Operativa Activa · Argentina & Uruguay',
    alertSub:
      'Cobertura propia directa en 20 puertos de la Hidrovía Paraná, Río de la Plata y Costa Atlántica.',
    alertBtn: 'Ver Guardias ATA',
    alertClose: 'Cerrar',
    aboutKicker: 'Tradición & Respaldo Naval',
    aboutHeadline: 'Tres décadas cuidando cada <em>escala portuaria</em>',
    kpiYears: 'Años',
    kpiPorts: 'Puertos',
    kpiOffices: 'Oficinas',
    kpiUnits: 'Unidades',
    aboutBody:
      'Desde 1992, Mar y Ríos Argentinos S.A. opera con estructura y personal propio en los principales nodos energéticos y fluviales de la región. Asistimos buques tanque, remolcadores de empuje y barcazas bajo los más exigentes estándares de seguridad de <strong>Bureau Veritas</strong> y <strong>Lloyd’s Register</strong>, garantizando operación directa sin intermediarios.',
    gyroNote: 'Inercia reactiva al rumbo',
    photoTankerCaption: 'Asistencia especializada a buques tanque y alijos STS',
    srvKicker: 'Portafolio Operativo',
    srvHeadline: 'Soluciones integrales <em>a bordo y en muelle</em>',
    idx1: '01 · Agenciamiento & Línea',
    idx2: '02 · Trasbordos & Alijos STS',
    idx3: '03 · Lanchas & Amarraderos',
    idx4: '04 · Logística & Peritajes',
    sideCertTitle: 'Cobertura Operativa Directa',
    sideCertSub:
      'Personal ATA habilitado en cada puerto para despachos ágiles y asistencia a tripulaciones.',
    netKicker: 'Corredor Fluvial & Marítimo',
    netHeadline: 'De la Hidrovía Paraná al <em>Atlántico Sur y ROU</em>',
    netDesc:
      'Conectamos operaciones en 20 terminales estratégicas con 5 oficinas propias ubicadas en los puntos neurálgicos del comercio fluvial, petrolero y cerealero.',
    netPhotoTag: 'TERMINALES FLUVIALES & ATLÁNTICAS · AR / ROU',
    fAll: 'Todos (20)',
    fOwn: 'Oficinas Propias (5)',
    fParana: 'Hidrovía Paraná',
    fAtlantic: 'Atlántico & ROU',
    dirKicker: 'Guardias & Contactos Directos',
    dirHeadline: 'Oficinas Propias & <em>Personal ATA</em>',
    dirSub:
      'Comunicate en forma directa con nuestros jefes de operaciones, agentes ATA y área administrativa sin intermediarios.',
    tabAdmin: 'Administración & Comex',
    orgKicker: 'Estructura Corporativa',
    orgHeadline: 'Dirección & <em>Conducción Operativa</em>',
    hqKicker: 'Sede Central',
    hqHeadline: 'Casa Central <em>Buenos Aires</em>',
    openGps: 'Abrir en GPS',
    footerSub:
      'Mar y Ríos Argentinos S.A. · Agencia Marítima operando desde 1992 con oficinas propias en los principales puertos de Argentina y operación regional en Uruguay.',
    footNavTitle: 'Navegación',
    footContactTitle: 'Canales Directos 24/7',
    portalKicker: 'Acceso Privado',
    portalTitle: 'Portal de <em>Clientes</em>',
    portalSub:
      'Consultá estados operativos (SOF), proformas (PDA), documentación de despacho y facturación en curso.',
    portalUserLabel: 'Usuario / Empresa Armadora',
    portalPassLabel: 'Clave de Acceso',
    portalSubmit: 'Ingresar al Portal ↗',
    portalNoAcc: '¿Necesitás habilitar tu acceso?',
    portalReq: 'Solicitar credenciales',
  },
  en: {
    liveDuty: '24/7 Duty · 365 Days',
    navContactTop: 'Direct Contact',
    navTrayectoria: 'Heritage',
    navServicios: 'Services',
    navPuertos: 'Port Network',
    navOficinas: 'Offices & Duty',
    navEmpresa: 'Company',
    navPortal: 'Client Portal',
    navCta: '24/7 Desk',
    audioOff: 'BRIDGE: OFF',
    audioOn: 'BRIDGE: ON',
    heroEyebrow: 'Maritime Agency · Operating since 1992',
    heroHeadline: 'Safe navigation & logistics <em>with no sub-agents</em>',
    heroSubheadline:
      'Over 34 years assisting tankers, push-tugs, and barges across 20 ports and STS lightering zones in Argentina and Uruguay. Direct 24/7/365 port attendance.',
    nomPortLabel: 'Port of Call',
    nomServLabel: 'Operation Type',
    nomBtn: 'Connect Duty Desk',
    alertTitle: 'Active 24/7 Port Duty · Argentina & Uruguay',
    alertSub:
      'Direct own-office coverage across 20 terminals in the Paraná Waterway, River Plate & Atlantic Coast.',
    alertBtn: 'View ATA Duty',
    alertClose: 'Dismiss',
    aboutKicker: 'Naval Heritage & Standards',
    aboutHeadline: 'Three decades safeguarding every <em>port call</em>',
    kpiYears: 'Years',
    kpiPorts: 'Ports',
    kpiOffices: 'Offices',
    kpiUnits: 'Units',
    aboutBody:
      'Since 1992, Mar y Ríos Argentinos S.A. has operated with its own offices and local staff across the region’s key energy and river hubs. We assist tankers, push-tugs, and barges under strict <strong>Bureau Veritas</strong> and <strong>Lloyd’s Register</strong> safety standards, with zero sub-agents.',
    gyroNote: 'Reactive heading inertia',
    photoTankerCaption: 'Specialized attendance for oil tankers & STS lightering',
    srvKicker: 'Operational Portfolio',
    srvHeadline: 'Integral solutions <em>on board & ashore</em>',
    idx1: '01 · General & Liner Agency',
    idx2: '02 · STS & Transshipments',
    idx3: '03 · Launches & Mooring',
    idx4: '04 · Logistics & Surveys',
    sideCertTitle: 'Direct Operational Coverage',
    sideCertSub:
      'Licensed ATA officers in every port for fast vessel clearance and full crew husbandry.',
    netKicker: 'River & Maritime Corridor',
    netHeadline: 'From the Paraná Waterway to the <em>South Atlantic & ROU</em>',
    netDesc:
      'Connecting vessel operations across 20 strategic terminals backed by 5 own offices at the core hubs of energy, river and bulk trade.',
    netPhotoTag: 'RIVER & ATLANTIC TERMINALS · AR / ROU',
    fAll: 'All (20)',
    fOwn: 'Own Offices (5)',
    fParana: 'Paraná River',
    fAtlantic: 'Atlantic & ROU',
    dirKicker: 'Duty Desks & Direct Contacts',
    dirHeadline: 'Own Offices & <em>ATA Staff</em>',
    dirSub:
      'Reach our operations heads, licensed ATA port agents, and treasury team directly with zero intermediaries.',
    tabAdmin: 'Management & Treasury',
    orgKicker: 'Corporate Structure',
    orgHeadline: 'Executive Board & <em>Operations</em>',
    hqKicker: 'Headquarters',
    hqHeadline: 'Buenos Aires <em>Head Office</em>',
    openGps: 'Open in GPS',
    footerSub:
      'Mar y Ríos Argentinos S.A. · Maritime Agency operating since 1992 with own offices across Argentina and regional operations in Uruguay.',
    footNavTitle: 'Navigation',
    footContactTitle: '24/7 Direct Channels',
    portalKicker: 'Private Access',
    portalTitle: 'Client <em>Portal</em>',
    portalSub:
      'Access live Statements of Facts (SOF), proforma DAs (PDA), vessel clearance docs, and invoicing.',
    portalUserLabel: 'Username / Shipowner',
    portalPassLabel: 'Access Key',
    portalSubmit: 'Sign In to Portal ↗',
    portalNoAcc: 'Need account credentials?',
    portalReq: 'Request access',
  },
};

export const serviceChapters = [
  {
    id: 'srv-cap-1',
    num: '01',
    titleEs: 'Agenciamiento General & Línea Regular',
    titleEn: 'General & Liner Port Agency',
    services: [
      {
        num: '01',
        es: 'Agentes Generales',
        en: 'General Agents',
        dEs: 'Representación integral de navieras ante autoridades portuarias, aduaneras y prefectura naval.',
        dEn: 'Full representation of shipping lines before port, customs, and coast guard authorities.',
        icon: '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
      },
      {
        num: '02',
        es: 'Agentes de Línea',
        en: 'Liner Agents',
        dEs: 'Coordinación comercial y operativa para servicios regulares de carga y tráfico fluvial.',
        dEn: 'Commercial and operational coordination for regular liner and river cargo services.',
        icon: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 10h18M9 4v14"/>',
      },
    ],
  },
  {
    id: 'srv-cap-2',
    num: '02',
    titleEs: 'Trasbordos, Alijos STS & Armadores',
    titleEn: 'STS Lightering, Transshipments & Husbandry',
    services: [
      {
        num: '03',
        es: 'Agentes Armadores y Tripulación',
        en: 'Owners & Crew Husbandry',
        dEs: 'Asistencia a buques tanque y tripulaciones: embarques, desembarques, migraciones y sanidad.',
        dEn: 'Tanker & crew support: sign-on/off, immigration clearance, medical care & provisions.',
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      },
      {
        num: '04',
        es: 'Trasbordos & Alijos STS',
        en: 'Ship-to-Ship (STS) Transfers',
        dEs: 'Operaciones especializadas de alijo y transferencia de hidrocarburos y cargas en zonas habilitadas.',
        dEn: 'Specialized STS lightering and cargo transfer operations across designated anchorage zones.',
        icon: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7 7"/><path d="M3 3l7 7"/><path d="M21 16v5h-5"/><path d="M3 16v5h5"/><path d="M14 14l7 7"/><path d="M10 14l-7 7"/>',
      },
    ],
  },
  {
    id: 'srv-cap-3',
    num: '03',
    titleEs: 'Servicios Fluviales, Lanchas & Amarraderos',
    titleEn: 'Fluvial Launches & Mooring Services',
    services: [
      {
        num: '05',
        es: 'Servicio de Amarraderos',
        en: 'Mooring & Berthing Services',
        dEs: 'Coordinación de amarre, desamarre, remolcadores de empuje y trenes de barcazas.',
        dEn: 'Berthing coordination, mooring gangs, push-tugs and river barge convoy operations.',
        icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
      },
      {
        num: '06',
        es: 'Servicio de Lanchas Rápidas',
        en: 'Fast Launch Boat Service',
        dEs: 'Traslado ágil y seguro de tripulación, autoridades portuarias, prácticos e inspectores.',
        dEn: 'Fast & safe offshore transfers for crew, pilots, surveyors, and port authorities.',
        icon: '<path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M4 17l2-7h12l2 7"/><path d="M9 10V6h6v4"/>',
      },
    ],
  },
  {
    id: 'srv-cap-4',
    num: '04',
    titleEs: 'Logística Portuaria & Peritajes de Clase',
    titleEn: 'Integrated Logistics & Class Surveys',
    services: [
      {
        num: '07',
        es: 'Servicios Auxiliares & Clase',
        en: 'Auxiliary & Class Services',
        dEs: 'Inspecciones Bureau Veritas / Lloyd’s Register, peritajes técnicos, provisiones y reparaciones.',
        dEn: 'Class inspections (Bureau Veritas / Lloyd’s), technical surveys, stores & vessel repairs.',
        icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
      },
      {
        num: '08',
        es: 'Logística Portuaria Integral',
        en: 'Integrated Port Logistics',
        dEs: 'Gestión puerta-a-puerto para compañías petroleras, energéticas y cargas especiales.',
        dEn: 'End-to-end maritime logistics trusted by major oil, energy & bulk companies.',
        icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
      },
    ],
  },
];

export const operatingPorts = [
  { name: 'Buenos Aires', tagEs: 'Oficina Propia · Casa Central', tagEn: 'Own Office · HQ', zone: 'atlantic', own: true, lat: 34.6037, lon: 58.3816 },
  { name: 'Dock Sud', tagEs: 'Oficina Propia · Terminal Petrolera', tagEn: 'Own Office · Oil Terminal', zone: 'atlantic', own: true, lat: 34.6490, lon: 58.3380 },
  { name: 'La Plata', tagEs: 'Oficina Propia · (0221) 469-2985', tagEn: 'Own Office · +54 221 469-2985', zone: 'atlantic', own: true, lat: 34.8630, lon: 57.8810 },
  { name: 'San Lorenzo', tagEs: 'Oficina Propia · (03476) 43-1188', tagEn: 'Own Office · +54 3476 43-1188', zone: 'parana', own: true, lat: 32.7470, lon: 60.7310 },
  { name: 'Barranqueras', tagEs: 'Oficina Propia · Chaco', tagEn: 'Own Office · Chaco', zone: 'parana', own: true, lat: 27.4820, lon: 58.9320 },
  { name: 'Diamante', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 32.0670, lon: 60.6420 },
  { name: 'Rosario', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 32.9468, lon: 60.6393 },
  { name: 'San Nicolás', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 33.3330, lon: 60.2110 },
  { name: 'Ramallo', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 33.4840, lon: 60.0020 },
  { name: 'San Pedro', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 33.6790, lon: 59.6670 },
  { name: 'Ibicuy', tagEs: 'Hidrovía Paraná', tagEn: 'Paraná Waterway', zone: 'parana', own: false, lat: 33.7510, lon: 59.1770 },
  { name: 'Guazú', tagEs: 'Paraná Guazú', tagEn: 'Paraná Guazú', zone: 'parana', own: false, lat: 33.8980, lon: 58.8550 },
  { name: 'Lima y Zárate', tagEs: 'Complejo Portuario', tagEn: 'Port Complex', zone: 'parana', own: false, lat: 34.0980, lon: 59.0240 },
  { name: 'Campana', tagEs: 'Terminal Fluvial', tagEn: 'River Terminal', zone: 'parana', own: false, lat: 34.1630, lon: 58.9590 },
  { name: 'Mar del Plata', tagEs: 'Costa Atlántica', tagEn: 'Atlantic Coast', zone: 'atlantic', own: false, lat: 38.0370, lon: 57.5350 },
  { name: 'Necochea', tagEs: 'Puerto Quequén / Costa', tagEn: 'Atlantic Coast', zone: 'atlantic', own: false, lat: 38.5790, lon: 58.7030 },
  { name: 'Bahía Blanca', tagEs: 'Puerto Aguas Profundas', tagEn: 'Deep Water Port', zone: 'atlantic', own: false, lat: 38.7860, lon: 62.2630 },
  { name: 'San Antonio Este', tagEs: 'Patagonia Norte', tagEn: 'North Patagonia', zone: 'atlantic', own: false, lat: 40.8080, lon: 64.7560 },
  { name: 'Nueva Palmira (ROU)', tagEs: 'Uruguay · Zona Franca', tagEn: 'Uruguay · Free Port', zone: 'atlantic', own: false, lat: 33.8760, lon: 58.4190 },
  { name: 'Montevideo (ROU)', tagEs: 'Uruguay · Hub Atlántico', tagEn: 'Uruguay · Atlantic Hub', zone: 'atlantic', own: false, lat: 34.9059, lon: 56.2116 },
];

export const portsDirectoryData = {
  bsas: {
    metaEs: 'CABA & Dock Sud · Tel: (011) 4342-7412',
    metaEn: 'Buenos Aires & Dock Sud · Tel: +54 11 4342-7412',
    officeEmail: 'baires@myrasa.com.ar',
    staff: [
      { name: 'Rodrigo Fandiño Nalerio', ata: true, roleEs: 'Jefe Operativo · Oficina Central', roleEn: 'Head of Operations · Central Office', tel: '+5491120161221', wa: '5491120161221', email: 'rfandino@myrasa.com.ar' },
      { name: 'Manuel Meijome', ata: false, roleEs: 'Oficina Central Buenos Aires', roleEn: 'Buenos Aires Head Office', tel: '+5491152263881', wa: '5491152263881', email: 'mmeijome@myrasa.com.ar' },
      { name: 'Matías Ponce', ata: true, roleEs: 'Operaciones Buenos Aires', roleEn: 'Buenos Aires Operations', tel: '+5491153039685', wa: '5491153039685', email: 'mponce@myrasa.com.ar' },
      { name: 'Julio César Alegre', ata: false, roleEs: 'Operaciones Buenos Aires', roleEn: 'Buenos Aires Operations', tel: '+5491124164148', wa: '5491124164148', email: 'jalegre@myrasa.com.ar' },
      { name: 'Cristian Kozlowski', ata: false, roleEs: 'Oficina Central Buenos Aires', roleEn: 'Buenos Aires Head Office', tel: '+5491124164151', wa: '5491124164151', email: 'ckozlowski@myrasa.com.ar' },
    ],
  },
  laplata: {
    metaEs: 'Puerto La Plata · Tel: (0221) 469-2985',
    metaEn: 'La Plata Port · Tel: +54 221 469-2985',
    officeEmail: 'laplata@myrasa.com.ar',
    staff: [
      { name: 'Federico A. Romero Huergo', ata: true, roleEs: 'Operaciones La Plata', roleEn: 'La Plata Operations', tel: '+5491124109899', wa: '5491124109899', email: 'fhuergo@myrasa.com.ar' },
      { name: 'Ramiro Gastón Díaz', ata: false, roleEs: 'Operaciones La Plata', roleEn: 'La Plata Operations', tel: '+5491120161222', wa: '5491120161222', email: 'laplata@myrasa.com.ar' },
    ],
  },
  sanlorenzo: {
    metaEs: 'San Lorenzo, Santa Fe · Tel: (03476) 43-1188',
    metaEn: 'San Lorenzo, Santa Fe · Tel: +54 3476 43-1188',
    officeEmail: 'sanlorenzo@myrasa.com.ar',
    staff: [
      { name: 'Mauricio Rivollier', ata: false, roleEs: 'Oficina San Lorenzo', roleEn: 'San Lorenzo Office', tel: '+5491135458339', wa: '5491135458339', email: 'mrivollier@myrasa.com.ar' },
      { name: 'Gisel Mariana Presson', ata: false, roleEs: 'Oficina San Lorenzo', roleEn: 'San Lorenzo Office', tel: '+5491152263881', wa: '5491152263881', email: 'gpresson@myrasa.com.ar' },
    ],
  },
  barranqueras: {
    metaEs: 'Puerto Barranqueras, Chaco · Atención Directa',
    metaEn: 'Barranqueras Port, Chaco · Direct Attendance',
    officeEmail: 'barranqueras@myrasa.com.ar',
    staff: [
      { name: 'Sebastián A. Yucherchen', ata: false, roleEs: 'Responsable Puerto Barranqueras', roleEn: 'Barranqueras Port Manager', tel: '+5493624152540', wa: '5493624152540', email: 'syucherchen@myrasa.com.ar' },
    ],
  },
  gerencia: {
    metaEs: 'Dirección, Comex y Documentación',
    metaEn: 'Executive Board, Treasury & Billing',
    officeEmail: 'operations@myrasa.com.ar',
    staff: [
      { name: 'Javier Marchionni', ata: false, roleEs: 'Gerente General', roleEn: 'General Manager', tel: '+541143427412', wa: '', email: 'baires@myrasa.com.ar' },
      { name: 'Maximiliano Cassola', ata: false, roleEs: 'Tesorería y Comercio Exterior', roleEn: 'Treasury & Foreign Trade', tel: '+541143427412', wa: '', email: 'baires@myrasa.com.ar' },
      { name: 'Nicolás Ortega', ata: false, roleEs: 'Documentación y Órdenes de Facturación', roleEn: 'Documentation & Billing Orders', tel: '+5491160950484', wa: '5491160950484', email: 'nortega@myrasa.com.ar' },
    ],
  },
};

/* Polilíneas geográficas reales WGS84 (Latitud Sur, Longitud Oeste) para la Carta ECDIS */
export const ECDIS_GEO_PATHS = Object.freeze({
  parana: [
    [27.20, 58.60], [27.48, 58.93], [28.45, 59.10], [29.15, 59.65],
    [30.72, 60.02], [31.65, 60.70], [32.07, 60.64], [32.75, 60.73],
    [32.95, 60.63], [33.33, 60.21], [33.48, 60.00], [33.68, 59.66],
    [33.75, 59.18], [33.90, 58.85], [34.10, 59.02], [34.16, 58.95], [34.45, 58.52],
  ],
  uruguay: [
    [32.30, 58.12], [33.15, 58.32], [33.88, 58.42], [34.18, 58.28],
    [34.47, 57.84], [34.72, 57.12], [34.91, 56.21], [34.96, 54.95], [34.65, 54.15],
  ],
  atlantic: [
    [34.45, 58.52], [34.60, 58.38], [34.65, 58.34], [34.86, 57.88],
    [35.38, 57.16], [36.28, 56.72], [37.12, 56.86], [38.04, 57.54],
    [38.58, 58.70], [38.98, 61.28], [38.79, 62.26], [39.95, 62.10],
    [40.81, 64.76], [41.35, 65.05],
  ],
});
