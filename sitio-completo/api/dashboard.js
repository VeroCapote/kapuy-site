// Capa de proyección del dashboard de embudo de Kapüy.
//
// Contrato: un adaptador por fuente. Cada uno atrapa sus propios errores y
// SIEMPRE devuelve; nunca lanza. Una fuente muerta degrada su propia tile a
// null (la UI pinta "—") y jamás tumba el endpoint completo.
//
// Regla dura: null = no sabemos. 0 = sabemos que es cero. No se confunden.
// Si una fuente no está configurada o no puede recolectar el dato, es null,
// nunca 0.

const SUPABASE_URL =
  process.env.KAPUY_SUPABASE_URL || 'https://eptkrujkcgwzgeqgevxp.supabase.co';
// Publishable key: pública por diseño, ya vive commiteada en el repo del sitio.
// Con RLS insert-only no lee filas; el agregado sale por SECURITY DEFINER.
const SUPABASE_ANON_KEY =
  process.env.KAPUY_SUPABASE_ANON_KEY ||
  'sb_publishable_EfMv_jfTzBStf2oKUzVyow_RWKatcAe';

const DEFAULT_PERIOD_DAYS = 30;

/** Fecha yyyy-mm-dd a N días de hoy. */
function daysAgoISO(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** fetch con timeout: una fuente lenta no puede colgar el dashboard entero. */
async function fetchJSON(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) {
      const detail =
        (body && (body.error?.message || body.message || body.error)) ||
        `HTTP ${res.status}`;
      throw new Error(String(detail));
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function metric({
  id,
  label,
  value = null,
  format = 'count',
  window: win,
  reading,
  status = 'pending',
  note = null,
}) {
  return { id, label, value, format, window: win, reading, status, note };
}

// ---------------------------------------------------------------------------
// Adaptador: Vercel Analytics (visitantes + clics al CTA)
// ---------------------------------------------------------------------------
async function sitioAdapter(periodDays) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;

  // Custom events NO se recolectan en plan Hobby. Ahí la API responde 0, y ese
  // 0 sería mentira: la gente puede estar clicando y Vercel simplemente no lo
  // registra. Por eso el clic al CTA queda pending salvo que se declare Pro
  // explícitamente. Un 0 falso es peor que un "—" honesto.
  const customEventsOn = process.env.VERCEL_ANALYTICS_CUSTOM_EVENTS === '1';

  const visitantes = metric({
    id: 'visitantes',
    label: 'Visitantes únicos',
    window: `últimos ${periodDays} días`,
    reading: 'Cuánta gente llegó. Si esto está plano, el cuello es tráfico—no mensaje.',
  });

  const ctaClicks = metric({
    id: 'cta_clicks',
    label: 'Clics al CTA de contacto',
    window: `últimos ${periodDays} días`,
    reading:
      'De los que llegaron, cuántos quisieron hablar. Este número juzga el mensaje.',
    note: customEventsOn
      ? null
      : 'Los custom events de Vercel Analytics requieren plan Pro. En Hobby no se recolectan, así que acá no hay dato que mostrar.',
  });

  const section = {
    id: 'sitio',
    label: 'Sitio',
    source: 'Vercel Analytics',
    question: '¿Llega gente?',
    status: 'pending',
    metrics: [visitantes, ctaClicks],
  };

  if (!token || !projectId) {
    section.note =
      'Falta configurar VERCEL_ANALYTICS_TOKEN y VERCEL_ANALYTICS_PROJECT_ID.';
    return section;
  }

  try {
    const qs = new URLSearchParams({
      projectId,
      since: daysAgoISO(periodDays),
      until: todayISO(),
    });
    if (teamId) qs.set('teamId', teamId);

    const body = await fetchJSON(
      `https://api.vercel.com/v1/query/web-analytics/visits/count?${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const v = body?.data?.visitors;
    if (typeof v === 'number') {
      visitantes.value = v;
      visitantes.status = 'live';
      section.status = 'live';
    } else {
      section.note = 'La API respondió sin el campo visitors.';
    }
  } catch (err) {
    section.note = `Vercel Analytics no respondió: ${err.message}`;
    return section;
  }

  if (customEventsOn) {
    try {
      const qs = new URLSearchParams({
        projectId,
        since: daysAgoISO(periodDays),
        until: todayISO(),
        filter: "eventName eq 'contacto_click'",
      });
      if (teamId) qs.set('teamId', teamId);

      const body = await fetchJSON(
        `https://api.vercel.com/v1/query/web-analytics/events/count?${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const c = body?.data?.count;
      if (typeof c === 'number') {
        ctaClicks.value = c;
        ctaClicks.status = 'live';
      }
    } catch (err) {
      ctaClicks.note = `No se pudo leer el evento: ${err.message}`;
    }
  }

  return section;
}

// ---------------------------------------------------------------------------
// Adaptador: Supabase (leads) — vía RPC SECURITY DEFINER con la anon key.
// La service-role key no aparece por ningún lado, ni acá ni en el navegador.
// ---------------------------------------------------------------------------
async function leadsAdapter(periodDays, visitantesValue) {
  const leads = metric({
    id: 'leads',
    label: 'Leads capturados',
    window: `últimos ${periodDays} días`,
    reading: 'Cuántos dejaron sus datos. El único número que se vuelve plata.',
  });

  const conversion = metric({
    id: 'conversion',
    label: 'Conversión visita→lead',
    format: 'percent',
    window: `últimos ${periodDays} días`,
    reading: 'De cada 100 que llegan, cuántos dejan datos. Acá se ve si el mensaje convence.',
  });

  const section = {
    id: 'leads',
    label: 'Leads',
    source: 'Supabase',
    question: '¿Dejan sus datos?',
    status: 'pending',
    metrics: [leads, conversion],
  };

  try {
    const body = await fetchJSON(
      `${SUPABASE_URL}/rest/v1/rpc/kapuy_dashboard_leads`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period_days: periodDays }),
      }
    );

    // Acá un 0 es un 0 de verdad: la tabla existe y respondió.
    if (typeof body?.leads_period === 'number') {
      leads.value = body.leads_period;
      leads.status = 'live';
      section.status = 'live';
      section.total_leads = body.leads_total ?? null;
      section.last_lead_at = body.last_lead_at ?? null;
    } else {
      section.note = 'El agregado respondió sin leads_period.';
      return section;
    }

    // La conversión solo existe si conocemos ambos lados. Con visitantes en
    // pending, dividir sería inventar.
    if (typeof visitantesValue === 'number' && visitantesValue > 0) {
      conversion.value = (leads.value / visitantesValue) * 100;
      conversion.status = 'live';
    } else {
      conversion.note =
        'Necesita visitantes en vivo para calcularse. Sin denominador no hay tasa.';
    }
  } catch (err) {
    section.note = `Supabase no respondió: ${err.message}`;
  }

  return section;
}

// ---------------------------------------------------------------------------
// Adaptador: Kit (suscriptores, aperturas, clics)
// ---------------------------------------------------------------------------
async function emailAdapter(periodDays) {
  const key = process.env.KIT_API_KEY;

  const subs = metric({
    id: 'subs_nuevos',
    label: 'Suscriptores nuevos',
    window: `últimos ${periodDays} días`,
    reading: 'Cuántos entraron a la lista. Sin lista no hay a quién volverle a hablar.',
  });

  // Ojo: email_stats de Kit tiene ventana FIJA de 90 días. No acepta rango.
  // Lo etiquetamos como lo que es en vez de fingir que son 30 días.
  const openRate = metric({
    id: 'open_rate',
    label: 'Tasa de apertura',
    format: 'percent',
    window: 'últimos 90 días',
    reading: 'Si no abren, el asunto no está haciendo su trabajo.',
  });

  const clickRate = metric({
    id: 'click_rate',
    label: 'Tasa de clics',
    format: 'percent',
    window: 'últimos 90 días',
    reading: 'Abren pero no clican: el contenido no mueve a la acción.',
  });

  const section = {
    id: 'email',
    label: 'Email',
    source: 'Kit',
    question: '¿Abren y clican?',
    status: 'pending',
    metrics: [subs, openRate, clickRate],
  };

  if (!key) {
    section.note = 'Falta configurar KIT_API_KEY.';
    return section;
  }

  const headers = { 'X-Kit-Api-Key': key, Accept: 'application/json' };
  let algoVivo = false;

  try {
    const qs = new URLSearchParams({
      starting: daysAgoISO(periodDays),
      ending: todayISO(),
    });
    const body = await fetchJSON(
      `https://api.kit.com/v4/account/growth_stats?${qs}`,
      { headers }
    );
    const n = body?.stats?.new_subscribers ?? body?.new_subscribers;
    if (typeof n === 'number') {
      subs.value = n;
      subs.status = 'live';
      algoVivo = true;
    }
  } catch (err) {
    subs.note = `Kit growth_stats: ${err.message}`;
  }

  try {
    const body = await fetchJSON('https://api.kit.com/v4/account/email_stats', {
      headers,
    });
    const s = body?.stats ?? body;
    if (typeof s?.open_rate === 'number') {
      openRate.value = s.open_rate;
      openRate.status = 'live';
      algoVivo = true;
    }
    if (typeof s?.click_rate === 'number') {
      clickRate.value = s.click_rate;
      clickRate.status = 'live';
      algoVivo = true;
    }
  } catch (err) {
    openRate.note = `Kit email_stats: ${err.message}`;
    clickRate.note = `Kit email_stats: ${err.message}`;
  }

  section.status = algoVivo ? 'live' : 'pending';
  if (!algoVivo && !section.note) section.note = 'Kit no devolvió datos legibles.';
  return section;
}

// ---------------------------------------------------------------------------
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const raw = parseInt(url.searchParams.get('period') || '', 10);
    const periodDays =
      Number.isFinite(raw) && raw > 0 && raw <= 90 ? raw : DEFAULT_PERIOD_DAYS;

    // En paralelo, pero leads necesita visitantes para la tasa: sitio primero.
    const sitio = await sitioAdapter(periodDays);
    const visitantes = sitio.metrics.find((m) => m.id === 'visitantes');

    const [leads, email] = await Promise.all([
      leadsAdapter(periodDays, visitantes?.value),
      emailAdapter(periodDays),
    ]);

    return Response.json(
      {
        ok: true,
        generated_at: new Date().toISOString(),
        period_days: periodDays,
        sections: [sitio, leads, email],
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  },
};
