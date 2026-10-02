// Diagnóstico de Fugas del Embudo — UI (vanilla, sin framework).
// La lógica de puntaje vive en scoring.js; aquí solo orquestamos vistas.
import { scoreFunnel } from './scoring.js';
import { saveSubmission, saveContact, isConfigured } from './storage.js';
import {
  STAGES, QUESTIONS, GATE, HEALTH_BANDS, STAGE_LEVELS,
  DRIFT_CAVEATS, PERFECT_SELFREPORT_NOTE, BUSINESS_TYPES, INVESTMENT_RANGES,
} from './questions.js';

const AGENDA_URL = 'https://calendar.app.google/BLE4ZYhd7RVnfcFG6';
function track(name, params) { try { window.gtag && window.gtag('event', name, params || {}); } catch (e) {} }

const ITEMS = [...QUESTIONS, GATE]; // 10 preguntas + compuerta
const answers = {};
let step = -1; // -1 = intro

let app = document.getElementById('app');

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Reemplaza #app por un clon nuevo para re-disparar la animación de entrada.
// Reasigna la referencia del módulo — si no, el siguiente render opera sobre
// un nodo ya desprendido del DOM.
function paint(html) {
  const fresh = app.cloneNode(false);
  fresh.innerHTML = html;
  app.parentElement.replaceChild(fresh, app);
  app = fresh;
  return app;
}

// ── Vistas ────────────────────────────────────────────────────────────────
function renderIntro() {
  paint(`
    <section class="card intro" data-anim>
      <p class="eyebrow">Diagnóstico gratuito · 2 minutos</p>
      <h1>¿Por dónde se te <span class="acento">escapan</span> los clientes?</h1>
      <p class="lead">Cuando un negocio no vende lo que quiere, casi nunca es por falta de gente.
      Son <strong>fugas</strong> en puntos concretos del viaje del cliente. Responde 11 preguntas
      y descubre tu <strong>fuga principal</strong> y qué tan sano está el camino de tu cliente hasta la compra.</p>
      <button class="btn btn--morado" id="start">Empezar el diagnóstico →</button>
      <p class="hand-note">Honesto antes que bonito.</p>
    </section>
  `);
  document.getElementById('start').addEventListener('click', () => { track('diag_start'); step = 0; renderStep(); });
}

function renderStep() {
  const item = ITEMS[step];
  const total = ITEMS.length;
  const pct = Math.round((step / total) * 100);
  const stage = STAGES.find((s) => s.key === item.stage);
  const kicker = stage
    ? `${stage.index} · ${esc(stage.name)}`
    : 'Última · Tu prioridad';

  const options = item.options.map((o, i) => {
    const val = 'score' in o ? o.score : o.value;
    const selected = answers[item.id] === val ? ' is-selected' : '';
    return `<button class="option${selected}" data-val="${esc(val)}" data-i="${i}">
              <span class="tick" aria-hidden="true"></span>
              <span>${esc(o.label)}</span>
            </button>`;
  }).join('');

  paint(`
    <section class="card step" data-anim>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      <p class="eyebrow">${kicker} · ${step + 1}/${total}</p>
      <h2 class="q">${esc(item.text)}</h2>
      <div class="options">${options}</div>
      <div class="nav">
        <button class="btn-ghost" id="back" ${step === 0 ? 'disabled' : ''}>← Atrás</button>
      </div>
    </section>
  `);

  document.querySelectorAll('.option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.getAttribute('data-val');
      answers[item.id] = 'score' in item.options[+btn.getAttribute('data-i')]
        ? Number(raw) : raw;
      if (step < ITEMS.length - 1) { step += 1; renderStep(); }
      else renderResult();
    });
  });
  const back = document.getElementById('back');
  if (back) back.addEventListener('click', () => { if (step > 0) { step -= 1; renderStep(); } });
}

let submissionId = null;

function renderResult() {
  const r = scoreFunnel(answers);
  const band = HEALTH_BANDS[r.grade];
  track('diag_result', { nota: r.grade, fuga: r.primaryLeak.key });

  // Guardar la fila de research (anónima) al llegar al resultado.
  submissionId = null;
  const submissionSaved = isConfigured()
    ? saveSubmission(r, { ...answers }).then((id) => { submissionId = id; }).catch(() => {})
    : Promise.resolve();

  const rows = r.stageMap.map((s) => {
    const lv = STAGE_LEVELS[s.level];
    const isLeak = s.key === r.primaryLeak.key;
    return `<div class="map-row${isLeak ? ' is-leak' : ''}">
      <span class="map-idx">${s.index}</span>
      <span class="map-name">${esc(s.name)}${isLeak ? ' <em>· tu fuga principal</em>' : ''}</span>
      <span class="chip chip-${lv.tone}">${lv.label}</span>
    </div>`;
  }).join('');

  const caveat = r.driftCaveat
    ? `<aside class="caveat"><span class="label">Un apunte</span><p>${esc(DRIFT_CAVEATS[r.driftCaveat])}</p></aside>`
    : '';
  const perfectNote = r.perfectSelfReport
    ? `<aside class="caveat"><span class="label">Un apunte</span><p>${esc(PERFECT_SELFREPORT_NOTE)}</p></aside>`
    : '';
  const typeOpts = BUSINESS_TYPES.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  const invOpts = INVESTMENT_RANGES.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');

  paint(`
    <section class="card result" data-anim>
      <p class="eyebrow">Tu diagnóstico</p>
      <p class="claim-kicker">Tu fuga principal es</p>
      <h1 class="claim"><span class="acento">${esc(r.primaryLeak.name)}</span></h1>

      <div class="health">
        <div class="health-num">${r.healthPct}<span>/100</span></div>
        <div class="health-meta">
          <span class="grade">Salud del camino · ${r.grade}</span>
          <strong>${esc(band.label)}</strong>
          <p>${esc(band.tagline)}</p>
        </div>
      </div>

      <div class="verdict">
        <p><strong>Qué está pasando.</strong> ${esc(r.primaryLeak.verdict)}</p>
        <p><strong>El primer arreglo.</strong> ${esc(r.primaryLeak.next)}</p>
      </div>

      ${caveat}${perfectNote}

      <div class="map">
        <p class="map-title">Tu camino, etapa por etapa</p>
        ${rows}
      </div>

      <div class="funnel" id="funnel">
        <h3>¿Quieres que lo revisemos contigo?</h3>
        <p class="funnel-body">Este resultado te dice dónde está la fuga. Lo que no te dice es cómo taparla en tu negocio.
        Cada mes abrimos 4 diagnósticos con Vero, directora de estrategia de Kapüy: 30 minutos sobre tu caso.
        Es gratis y no te vamos a perseguir después.</p>

        <form id="optin" class="optin" novalidate>
          <label class="field"><span>Tu correo</span>
            <input type="email" id="email" placeholder="tu@negocio.com" autocomplete="email" required></label>
          <label class="field"><span>¿Qué tipo de negocio tienes?</span>
            <select id="btype" required><option value="">Elige una opción</option>${typeOpts}</select></label>
          <label class="field"><span>¿Cuánto inviertes al mes en marketing, sumando todo (pauta, contenido y quien te ayuda)?</span>
            <select id="invest" required><option value="">Elige una opción</option>${invOpts}</select></label>
          <label class="opt"><input type="checkbox" name="updates"> Quiero recibir lo que publiquen. Poco y bueno.</label>

          <p class="consent">Usamos tus datos solo para esta conversación. Nunca publicamos ni citamos tus respuestas sin tu permiso por escrito.</p>

          <button type="submit" class="btn btn--lima">Pedir mi diagnóstico →</button>
          <p class="stub-note" id="stubnote" role="status"></p>
        </form>
      </div>

      <div class="result-nav">
        <button class="btn-ghost" id="restart">↺ Volver a empezar</button>
      </div>
    </section>
  `);

  document.getElementById('restart').addEventListener('click', () => {
    for (const k of Object.keys(answers)) delete answers[k];
    step = -1; renderIntro();
  });
  document.getElementById('optin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const note = document.getElementById('stubnote');
    const btn = form.querySelector('button[type=submit]');
    const email = document.getElementById('email').value.trim();
    const businessType = document.getElementById('btype').value;
    const investment = document.getElementById('invest').value;
    if (!email || !/.+@.+\..+/.test(email)) {
      note.textContent = 'Ese correo no se ve bien. ¿Lo revisas?'; return;
    }
    if (!businessType || !investment) {
      note.textContent = 'Contesta las dos preguntas para que llegue preparada a la llamada.'; return;
    }
    if (!isConfigured()) { note.textContent = 'Prueba local: no se guarda nada.'; return; }

    btn.disabled = true; btn.textContent = 'Enviando…';
    await submissionSaved;
    const res = await saveContact(submissionId, {
      email, businessType, investment,
      wantsUpdates: form.querySelector('input[name=updates]').checked,
      result: r,
    });
    if (res.ok) {
      track('diag_lead', { nota: r.grade, fuga: r.primaryLeak.key, inversion: investment, negocio: businessType });
      document.getElementById('funnel').innerHTML = `
        <h3>Listo. Ahora elige tu hora.</h3>
        <p class="funnel-body">Ya tenemos tu resultado. Escoge el momento que te quede mejor y llegamos a la llamada con tu caso leído.</p>
        <a class="btn btn--lima" id="agenda" href="${AGENDA_URL}" target="_blank" rel="noopener">Elegir mi hora →</a>`;
      document.getElementById('agenda').addEventListener('click', () => track('diag_agenda_click'));
    } else {
      note.textContent = 'Algo se rompió de nuestro lado, que en una web de marketing da pena. Escríbenos a hey@kapuymarketing.com y lo vemos.';
      btn.disabled = false; btn.textContent = 'Pedir mi diagnóstico →';
    }
  });
}

renderIntro();
