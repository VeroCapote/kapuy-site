// Diagnóstico de Fugas del Embudo — UI (vanilla, sin framework).
// La lógica de puntaje vive en scoring.js; aquí solo orquestamos vistas.
import { scoreFunnel } from './scoring.js';
import { saveSubmission, saveContact, isConfigured } from './storage.js';
import {
  STAGES, QUESTIONS, GATE, HEALTH_BANDS, STAGE_LEVELS,
  DRIFT_CAVEATS, PERFECT_SELFREPORT_NOTE, BUSINESS_TYPES, INVESTMENT_RANGES,
  RESULT_TITLES,
} from './questions.js';

const AGENDA_URL = 'https://calendar.app.google/E3eW4fh68oWo4GWF9';
function track(name, params) { try { window.gtag && window.gtag('event', name, params || {}); } catch (e) {} }

const ITEMS = [...QUESTIONS, GATE]; // 12 preguntas + compuerta
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
      <svg class="intro-ola" viewBox="0 0 900 160" preserveAspectRatio="none" fill="none" stroke-width="1.25" aria-hidden="true">
        <path stroke="#CDFC8A" vector-effect="non-scaling-stroke" d="M0 70 C200 -10 380 150 600 60 S820 0 900 30"/>
        <path fill="#CDFC8A" d="M0 92 C200 12 380 172 600 82 S820 22 900 52 L900 170 L0 170 Z"/>
        <path stroke="#3C183C" vector-effect="non-scaling-stroke" d="M0 114 C200 34 380 194 600 104 S820 44 900 74"/>
      </svg>
      <p class="tag">Gratis · 2 minutos</p>
      <h1>¿Por dónde se te <span class="acento">escapan</span> los clientes?</h1>
      <p class="lead">Cuando un negocio no vende lo que quiere, casi nunca es por falta de gente.
      O la marca no tiene claro qué es, o los clientes se escapan en algún punto del camino.
      Responde 13 preguntas y te decimos <strong>qué arreglaríamos primero</strong>.</p>
      <button class="btn btn--lima" id="start">Empezar el diagnóstico →</button>
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
  const kicker = stage ? esc(stage.name) : 'Última pregunta';

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
      <p class="kicker">${kicker} <span>· ${step + 1} de ${total}</span></p>
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
    ? `<aside class="caveat"><strong>Un apunte.</strong> ${esc(DRIFT_CAVEATS[r.driftCaveat])}</aside>`
    : '';
  const perfectNote = r.perfectSelfReport
    ? `<aside class="caveat"><strong>Un apunte.</strong> ${esc(PERFECT_SELFREPORT_NOTE)}</aside>`
    : '';
  // v2: el título decide según la última respuesta; la nota ya no se muestra
  // (se sigue guardando para research).
  const title = esc(RESULT_TITLES[answers.gate] || RESULT_TITLES.unsure)
    .replace(/\{etapa\}(\.?)/, (_, punto) => `<span class="acento">${esc(r.primaryLeak.en)}${punto}</span>`);
  const typeOpts = BUSINESS_TYPES.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  const invOpts = INVESTMENT_RANGES.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');

  paint(`
    <section class="card result" data-anim>
      <h1 class="claim">${title}</h1>

      <div class="verdict">
        <p><strong>Qué está pasando.</strong> ${esc(r.primaryLeak.verdict)}</p>
        <p><strong>Lo que haríamos primero.</strong> ${esc(r.primaryLeak.next)}</p>
      </div>

      ${caveat}${perfectNote}

      <div class="map">
        <h2 class="map-title">Tu camino, etapa por etapa</h2>
        <p class="banda"><strong>${esc(band.label)}.</strong> ${esc(band.tagline)}</p>
        ${rows}
      </div>

      <div class="funnel" id="funnel">
        <h3>¿Lo vemos contigo?</h3>
        <p class="funnel-body">Este resultado te dice dónde mirar. Lo que no te dice es qué hacer en tu negocio.
        En 30 minutos, gratis, Vero revisa tu caso contigo. Si tiene sentido, el siguiente paso es el
        <strong>Kapüy Growth Blueprint</strong>: en dos semanas, claridad sobre qué es tu marca y el camino completo para crecer.
        Y si no somos para ti, te lo decimos.</p>

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
