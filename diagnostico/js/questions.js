// Diagnóstico de Fugas del Embudo — CONTENIDO
// Instrumento de research + lead magnet para Kapüy.
//
// Regla ingameable (adaptada a un auditor): cada opción describe una
// SITUACIÓN REAL y neutral, sin la respuesta "correcta" evidente, para que
// el dueño conteste honesto y no lo que "queda bien". El puntaje vive en el
// código, no en la etiqueta que ve el usuario.
//
// Copy revisada con la voz de Kapüy y aprobada por Vero el 2026-10-02.
// v2 (aprobada por Vero el 2026-10-29): etapa Claridad al inicio, resultado
// que decide en vez de poner nota y cierre con puente al Blueprint.
// Borrador en 1 · Kapüy/Dirección/web-hello/borrador-diagnostico-v2.md
export const VERSION = 'v2';

// Claridad + las 5 etapas del viaje del cliente = las 6 dimensiones.
// `en` es cómo se nombra la etapa dentro del título del resultado.
export const STAGES = [
  { key: 'claridad',   index: '01', name: 'Claridad',          en: 'la claridad de tu marca',              blurb: 'Saber qué eres, para quién y qué te hace distinto.' },
  { key: 'atraccion',  index: '02', name: 'Atracción',         en: 'cómo te encuentran',                   blurb: 'Que la persona correcta te encuentre y se reconozca.' },
  { key: 'interes',    index: '03', name: 'Interés',           en: 'cómo te ganas su confianza',           blurb: 'Ganar confianza antes de pedir la venta.' },
  { key: 'conversion', index: '04', name: 'Conversión',        en: 'el momento de decidir',                blurb: 'El momento de decidir, sin fricción.' },
  { key: 'compra',     index: '05', name: 'Compra y arranque', en: 'lo que pasa después de que te compran', blurb: 'Los primeros pasos justo después de pagar.' },
  { key: 'retencion',  index: '06', name: 'Retención',         en: 'la recompra y las recomendaciones',    blurb: 'Que vuelva y te recomiende.' },
];

// 2 preguntas por etapa. score: 0 = fuga clara · 1 = parcial · 2 = sólido.
export const QUESTIONS = [
  // 01 — Claridad (v2)
  {
    id: 'claridad_1', stage: 'claridad',
    text: 'Si alguien te pregunta por qué elegirte a ti y no a otro, ¿qué respondes?',
    options: [
      { label: 'Que hago un buen trabajo y atiendo bien.', score: 0 },
      { label: 'Tengo una respuesta, pero cambia según con quién hable.', score: 1 },
      { label: 'Siempre la misma, y es algo que mi competencia no puede decir.', score: 2 },
    ],
  },
  {
    id: 'claridad_2', stage: 'claridad',
    text: '¿Para quién es tu marca?',
    options: [
      { label: 'Para cualquiera que necesite lo que vendo.', score: 0 },
      { label: 'Tengo un cliente en mente, pero termino hablándole a todos.', score: 1 },
      { label: 'Para un tipo de cliente muy concreto, y sé a quién no le sirvo.', score: 2 },
    ],
  },

  // 02 — Atracción
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

  // 03 — Interés
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

  // 04 — Conversión
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

  // 05 — Compra y arranque
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

  // 06 — Retención
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

// Diagnóstico + lo que haríamos primero, por etapa, cuando es la FUGA PRINCIPAL.
// v2: `next` es una decisión, no una táctica suelta.
export const STAGE_DIAGNOSIS = {
  claridad: {
    verdict: 'Tu marca todavía no tiene claro qué es, y se nota en todo lo que publicas. Mientras eso no esté resuelto, cualquier arreglo en el embudo es un parche.',
    next: 'Antes de tocar redes o pauta, definir quién eres, para quién eres y qué te hace distinto. Todo lo demás sale de ahí.',
  },
  atraccion: {
    verdict: 'Hablas de ti antes que del problema de tu cliente. La persona correcta llega y no se reconoce.',
    next: 'Decidir a quién le hablas y nombrar su problema con sus palabras, antes de hablar de ti.',
  },
  interes: {
    verdict: 'Pides la venta antes de ganarte la confianza. Sin una prueba previa, la respuesta por defecto es «lo pienso».',
    next: 'Decidir qué prueba necesita ver tu cliente para confiar, y ponerla antes del precio.',
  },
  conversion: {
    verdict: 'Hay fricción justo cuando la persona va a decidir: demasiadas opciones o su duda principal sin responder.',
    next: 'Elegir un solo camino hacia la compra y quitar todo lo que compite con él.',
  },
  compra: {
    verdict: 'Después de pagar hay silencio, y ahí nace el arrepentimiento.',
    next: 'Diseñar los primeros días del cliente nuevo para que sepa qué sigue sin tener que preguntar.',
  },
  retencion: {
    verdict: 'Tratas la venta como el final y dejas en la mesa la forma más barata de crecer: que vuelvan y te recomienden.',
    next: 'Tratar a quien ya te compró como tu canal más barato: decidir cuándo volver a hablarle y qué ofrecerle.',
  },
};

// Título del resultado según la última pregunta (la compuerta). {etapa} va en
// el bloque lima. v2: el resultado decide, no pone nota.
export const RESULT_TITLES = {
  traffic:    'Tu problema no es traer más gente. Es {etapa}.',
  downstream: 'Tienes razón: el problema está en lo que ya llega. Concretamente, en {etapa}.',
  unsure:     'No estás seguro de dónde está el problema. Nosotras sí: {etapa}.',
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
