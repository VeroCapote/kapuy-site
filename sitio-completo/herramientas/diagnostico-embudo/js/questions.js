// Diagnóstico de Fugas del Embudo — CONTENIDO
// Instrumento de research + lead magnet para Kapüy.
//
// Regla ingameable (adaptada a un auditor): cada opción describe una
// SITUACIÓN REAL y neutral, sin la respuesta "correcta" evidente, para que
// el dueño conteste honesto y no lo que "queda bien". El puntaje vive en el
// código, no en la etiqueta que ve el usuario.
//
// Toda la copy va marcada [NEEDS_VOICE_REVIEW] — la revisión de voz es un
// paso aparte.

// Las 5 etapas del viaje del cliente = las 5 dimensiones del diagnóstico.
export const STAGES = [
  { key: 'atraccion',  index: '01', name: 'Atracción',        blurb: 'Que la persona correcta te encuentre y se reconozca.' },
  { key: 'interes',    index: '02', name: 'Interés',           blurb: 'Ganar confianza antes de pedir la venta.' },
  { key: 'conversion', index: '03', name: 'Conversión',        blurb: 'El momento de decidir, sin fricción.' },
  { key: 'compra',     index: '04', name: 'Compra y arranque', blurb: 'Los primeros pasos justo después de pagar.' },
  { key: 'retencion',  index: '05', name: 'Retención',         blurb: 'Que vuelva y te recomiende.' },
];

// 2 preguntas por etapa. score: 0 = fuga clara · 1 = parcial · 2 = sólido.
export const QUESTIONS = [
  // 01 — Atracción
  {
    id: 'atraccion_1', stage: 'atraccion',
    text: 'Cuando alguien llega por primera vez a tu web o perfil, lo primero que ve es…',
    options: [
      { label: 'Lo que ofrezco y por qué soy bueno en lo mío.', score: 0 },
      { label: 'Una mezcla: un poco de mí y un poco de lo que resuelvo.', score: 1 },
      { label: 'El problema de mi cliente, dicho con sus propias palabras.', score: 2 },
    ],
  },
  {
    id: 'atraccion_2', stage: 'atraccion',
    text: 'Si le preguntaras a un posible cliente “¿a qué se dedica esta marca?”, respondería…',
    options: [
      { label: 'Le costaría explicarlo con precisión.', score: 0 },
      { label: 'Diría más o menos a qué me dedico.', score: 1 },
      { label: 'Nombraría exactamente el problema que resuelvo.', score: 2 },
    ],
  },

  // 02 — Interés
  {
    id: 'interes_1', stage: 'interes',
    text: 'Entre que alguien te descubre y que le pides comprar o agendar, ¿qué recibe de ti?',
    options: [
      { label: 'Voy directo a la oferta; si le interesa, escribe.', score: 0 },
      { label: 'Algún contenido suelto, sin un orden claro.', score: 1 },
      { label: 'Un recurso útil y una prueba concreta (caso, testimonio) antes del precio.', score: 2 },
    ],
  },
  {
    id: 'interes_2', stage: 'interes',
    text: '¿Tienes forma de seguir en contacto con quien todavía no está listo para comprar?',
    options: [
      { label: 'No; si no compra en el momento, se pierde.', score: 0 },
      { label: 'Tengo sus datos, pero no les doy seguimiento constante.', score: 1 },
      { label: 'Sí, una secuencia o ritmo de contacto que nutre hasta que decide.', score: 2 },
    ],
  },

  // 03 — Conversión
  {
    id: 'conversion_1', stage: 'conversion',
    text: 'En tu página o proceso de venta, el cliente se encuentra con…',
    options: [
      { label: 'Varias opciones y botones distintos; que elija.', score: 0 },
      { label: 'Un camino más o menos claro, con algún paso de más.', score: 1 },
      { label: 'Un solo CTA claro por página, sin fricción.', score: 2 },
    ],
  },
  {
    id: 'conversion_2', stage: 'conversion',
    text: 'La objeción #1 por la que la gente NO te compra, ¿está resuelta antes del botón?',
    options: [
      { label: 'No tengo claro cuál es su objeción principal.', score: 0 },
      { label: 'La intuyo, pero no la respondo de forma explícita.', score: 1 },
      { label: 'Sí, la respondo justo antes de pedir la acción.', score: 2 },
    ],
  },

  // 04 — Compra y arranque
  {
    id: 'compra_1', stage: 'compra',
    text: 'Justo después de que alguien te compra o agenda, ¿qué pasa?',
    options: [
      { label: 'Nada automático; yo respondo cuando puedo.', score: 0 },
      { label: 'Un mensaje de confirmación básico.', score: 1 },
      { label: 'Un mensaje de bienvenida que dice “qué sigue” y cuál es el primer paso.', score: 2 },
    ],
  },
  {
    id: 'compra_2', stage: 'compra',
    text: 'En sus primeros días como cliente nuevo, la persona…',
    options: [
      { label: 'Queda algo perdida sobre cómo empezar.', score: 0 },
      { label: 'Sabe lo esencial, pero pregunta bastante.', score: 1 },
      { label: 'Tiene claro el camino; la experiencia se siente cuidada.', score: 2 },
    ],
  },

  // 05 — Retención
  {
    id: 'retencion_1', stage: 'retencion',
    text: 'Cerrada una venta, ¿qué haces para que el cliente vuelva o te recomiende?',
    options: [
      { label: 'Nada sistemático; espero que vuelva por su cuenta.', score: 0 },
      { label: 'A veces pido reseña o reactivo, sin un plan fijo.', score: 1 },
      { label: 'Un punto de contacto programado que pide reseña y ofrece el siguiente paso.', score: 2 },
    ],
  },
  {
    id: 'retencion_2', stage: 'retencion',
    text: 'De tus ingresos, ¿qué parte viene de clientes que repiten o recomiendan?',
    options: [
      { label: 'Casi todo es cliente nuevo; repetir es raro.', score: 0 },
      { label: 'Algo repite, pero no lo provoco yo.', score: 1 },
      { label: 'Una parte sana viene de recompra y referidos que sí cultivo.', score: 2 },
    ],
  },
];

// Compuerta anti-gaming / de deriva.
// La deriva del dominio: creer que "más tráfico" es la solución — justo el
// error que desmonta la guía de las 5 fugas.
export const GATE = {
  id: 'gate',
  text: 'Si pudieras arreglar UNA sola cosa para vender más este mes, ¿cuál sería?',
  options: [
    { label: 'Conseguir más tráfico y más clientes nuevos.', value: 'traffic' },   // deriva
    { label: 'Que la gente que YA llega no se me escape.', value: 'downstream' },
    { label: 'No estoy seguro de dónde está el problema.', value: 'unsure' },
  ],
};

// ── Copy de resultados (stubs — [NEEDS_VOICE_REVIEW]) ────────────────────
// Bandas de salud global del embudo.
export const HEALTH_BANDS = {
  A: { label: 'Embudo sólido',       tagline: 'Tu sistema retiene bien; el trabajo ahora es afinar, no tapar.' },
  B: { label: 'Embudo con fugas finas', tagline: 'La estructura está; se te escapan clientes en un par de puntos.' },
  C: { label: 'Embudo con fugas reales', tagline: 'Llega gente, pero se pierde por el camino en varias etapas.' },
  D: { label: 'Embudo que gotea',    tagline: 'Buena parte de lo que atraes se escapa antes de comprar o repetir.' },
  F: { label: 'Embudo colador',      tagline: 'Traer más gente hoy es llenar un balde sin fondo.' },
};

// Nivel por etapa según su puntaje (0–4).
export const STAGE_LEVELS = {
  fuga:    { label: 'Fuga',    tone: 'red' },
  parcial: { label: 'Parcial', tone: 'copper' },
  solido:  { label: 'Sólido',  tone: 'cobalt' },
};

// Diagnóstico + siguiente paso por etapa cuando es la FUGA PRINCIPAL.
export const STAGE_DIAGNOSIS = {
  atraccion: {
    verdict: 'Tu mensaje habla de ti antes que del problema de tu cliente, y la persona correcta no se reconoce al llegar.',
    next: 'En el primer pantallazo, una sola frase que nombre el problema del cliente con sus palabras.',
  },
  interes: {
    verdict: 'Pides la venta antes de generar confianza: sin valor ni prueba previos, la respuesta por defecto es “lo pienso”.',
    next: 'Entrega un recurso útil y una prueba concreta (un resultado real) visible antes del precio.',
  },
  conversion: {
    verdict: 'Hay fricción en el momento de decidir: demasiadas opciones o la objeción principal sin responder.',
    next: 'Un único CTA por página y responde la objeción #1 justo antes del botón.',
  },
  compra: {
    verdict: 'Hay silencio justo después de la venta, y ahí nace el arrepentimiento y la mala experiencia.',
    next: 'Un mensaje inmediato de bienvenida que diga “qué pasa ahora” y cuál es el primer paso.',
  },
  retencion: {
    verdict: 'Tratas la venta como el final y dejas sobre la mesa la forma más barata de crecer: que vuelva y te recomiende.',
    next: 'Un punto de contacto programado que pida reseña y ofrezca el siguiente paso.',
  },
};

// Caveats de la compuerta de deriva (respetuosos, educativos — no castigo).
export const DRIFT_CAVEATS = {
  strong:
    'Marcaste que lo que más necesitas es más tráfico — pero tu diagnóstico muestra que tu fuga principal está más abajo en el embudo. Traer más gente ahí no la arregla: multiplica el costo de la misma fuga. Primero se tapa, después se llena.',
  soft:
    'Ojo con la tentación de resolverlo trayendo más gente: casi nunca el problema es la cantidad de clientes, sino lo que pasa con los que ya llegan.',
};

// Nota de auto-reporte demasiado limpio (equivalente al "monoculture cap").
export const PERFECT_SELFREPORT_NOTE =
  'Un embudo perfecto en papel casi nunca lo es en la práctica. Vale una segunda mirada externa para ver lo que desde adentro no se nota.';
