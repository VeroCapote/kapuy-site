// Almacenamiento en Supabase — inserción directa desde el navegador con la
// anon key (RLS insert-only). Sin backend; el sitio sigue estático.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export function isConfigured() {
  return SUPABASE_URL && SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('TU_') && !SUPABASE_ANON_KEY.includes('TU_');
}

function uuid() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

function sessionId() {
  try {
    let s = sessionStorage.getItem('kapuy_diag_session');
    if (!s) { s = uuid(); sessionStorage.setItem('kapuy_diag_session', s); }
    return s;
  } catch (e) { return uuid(); }
}

// INSERT puro. Genera el uuid en cliente y usa return=minimal para no gatillar
// un SELECT (que RLS insert-only bloquearía). Ver PATTERNS.md.
async function insert(table, row) {
  if (!isConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) return { ok: false, status: res.status, reason: await res.text().catch(() => '') };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

// Fila anónima de research al completar el quiz. Devuelve el id generado.
export async function saveSubmission(result, answers) {
  const id = uuid();
  await insert('diagnostico_submissions', {
    id,
    session_id: sessionId(),
    responses: answers,
    computed: {
      grade: result.grade,
      healthPct: result.healthPct,
      primaryLeak: result.primaryLeak.key,
      strength: result.strength.key,
      driftTripped: result.driftTripped,
      driftCaveat: result.driftCaveat,
      perfectSelfReport: result.perfectSelfReport,
      stageScores: result.stageScores,
    },
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  });
  return id;
}

// Pedido de diagnóstico con Vero. Va a hello_leads (source = 'diagnostico')
// para que dispare el mismo aviso por correo que el formulario de la home
// (trigger hello_leads_aviso). La fila anónima de research sigue en
// diagnostico_submissions.
export async function saveContact(submissionId, { email, businessType, investment, wantsUpdates, result }) {
  const lines = [
    'Pidió el diagnóstico con Vero.',
    `Resultado: nota ${result.grade} (${result.healthPct}/100). Fuga principal: ${result.primaryLeak.name}. Fortaleza: ${result.strength.name}.`,
    `Inversión mensual en marketing: ${investment || 'no dijo'}.`,
    `Cree que su problema es más tráfico: ${result.driftTripped ? 'sí' : 'no'}.`,
    submissionId ? `Ref. respuestas: ${submissionId}` : '',
  ].filter(Boolean);
  return insert('hello_leads', {
    email,
    business_type: businessType || null,
    wants_call: true,
    wants_updates: !!wantsUpdates,
    source: 'diagnostico',
    lang: 'es',
    message: lines.join('\n'),
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  });
}
