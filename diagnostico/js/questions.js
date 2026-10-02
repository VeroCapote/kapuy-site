// Diagnóstico de Fugas del Embudo — CONTENIDO
// Instrumento de research + lead magnet para Kapüy.
//
// Regla ingameable (adaptada a un auditor): cada opción describe una
// SITUACIÓN REAL y neutral, sin la respuesta "correcta" evidente, para que
// el dueño conteste honesto y no lo que "queda bien". El puntaje vive en el
// código, no en la etiqueta que ve el usuario.
//
// Copy revisada con la voz de Kapüy y aprobada por Vero el 2026-10-02.

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
      { label: 'Sí, le hago seguimiento con un ritmo hasta que decide.', score: 2 },
    ],
  },

  // 03 — Conversión
  {
    id: 'conversion_1', stage: 'conversion',
    text: 'En tu página o proceso de venta, el cliente se encuentra con…',
    options: [
      { label: 'Varias opciones y botones distintos; que elija.', score: 0 },
      { label: 'Un camino más o menos claro, con algún paso de más.', score: 1 },
      { label: 'Un solo paso claro: un botón, una acción, sin vueltas.', score: 2 },
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
      { label: 'Lo contacto en un momento planificado para pedirle reseña y ofrecerle lo siguiente.', score: 2 },
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

// ── Copy de resultados (aprobada 2026-10-02) ─────────────────────────────
// Bandas de salud global del embudo.
export const HEALTH_BANDS = {
  A: { label: 'Camino sólido',          tagline: 'Tu camino retiene bien. El trabajo ahora es afinar, no tapar.' },
  B: { label: 'Fugas finas',            tagline: 'La estructura está, pero se te escapan clientes en uno o dos puntos concretos.' },
  C: { label: 'Fugas reales',           tagline: 'Llega gente, pero se pierde en varias etapas antes de comprar.' },
  D: { label: 'Gotea por varios lados', tagline: 'Buena parte de lo que atraes se va antes de comprar o de volver.' },
  F: { label: 'Balde sin fondo',        tagline: 'Traer más gente hoy es llenar un balde sin fondo.' },
};

// Nivel por etapa según su puntaje (0–4).
export const STAGE_LEVELS = {
  fuga:    { label: 'Fuga',    tone: 'fuga' },
  parcial: { label: 'Parcial', tone: 'parcial' },
  solido:  { label: 'Sólido',  tone: 'solido' },
};

// Diagnóstico + siguiente paso por etapa cuando es la FUGA PRINCIPAL.
export const STAGE_DIAGNOSIS = {
  atraccion: {
    verdict: 'Hablas de ti antes que del problema de tu cliente. La persona correcta llega y no se reconoce.',
    next: 'Pon arriba de todo una sola frase que nombre su problema con sus palabras.',
  },
  interes: {
    verdict: 'Pides la venta antes de ganarte la confianza. Sin una prueba previa, la respuesta por defecto es «lo pienso».',
    next: 'Antes del precio, muestra algo útil y una prueba real: un caso, un testimonio, un resultado.',
  },
  conversion: {
    verdict: 'Hay fricción justo cuando la persona va a decidir: demasiadas opciones o su duda principal sin responder.',
    next: 'Un solo paso claro por página, y responde su duda número uno justo antes del botón.',
  },
  compra: {
    verdict: 'Después de pagar hay silencio, y ahí nace el arrepentimiento.',
    next: 'Un mensaje inmediato que diga qué pasa ahora y cuál es el primer paso.',
  },
  retencion: {
    verdict: 'Tratas la venta como el final y dejas en la mesa la forma más barata de crecer: que vuelvan y te recomienden.',
    next: 'Contacta a cada cliente en un momento planificado para pedirle reseña y ofrecerle lo siguiente.',
  },
};

// Caveats de la compuerta de deriva (respetuosos, educativos, no castigo).
export const DRIFT_CAVEATS = {
  strong:
    'Marcaste que lo que más necesitas es más tráfico, pero tu fuga principal está más abajo. Traer más gente ahí no la arregla: hace más cara la misma fuga. Primero se tapa, después se llena.',
  soft:
    'Ojo con la tentación de resolverlo trayendo más gente. Casi nunca el problema es cuánta gente llega, sino qué pasa con la que ya llegó.',
};

// Nota de auto-reporte demasiado limpio.
export const PERFECT_SELFREPORT_NOTE =
  'Un camino perfecto en papel casi nunca lo es en la práctica. Una mirada de afuera ve lo que desde adentro no se nota.';

// Filtro del ICP: solo en el formulario del diagnóstico con Vero, no en el cuestionario.
export const BUSINESS_TYPES = [
  'Marca de consumo con producto propio',
  'Salud o bienestar',
  'Startup',
  'Servicios profesionales',
  'Otro',
];
export const INVESTMENT_RANGES = [
  'Menos de $300',
  '$300 a $1.000',
  '$1.000 a $3.000',
  'Más de $3.000',
];
