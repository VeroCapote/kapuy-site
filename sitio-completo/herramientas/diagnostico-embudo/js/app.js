// Diagnóstico de Fugas del Embudo — UI (vanilla, sin framework).
// La lógica de puntaje vive en scoring.js; aquí solo orquestamos vistas.
import { scoreFunnel } from './scoring.js';
import { saveSubmission, saveContact, isConfigured } from './storage.js';
import {
  STAGES, QUESTIONS, GATE, HEALTH_BANDS, STAGE_LEVELS,
  DRIFT_CAVEATS, PERFECT_SELFREPORT_NOTE,
} from './questions.js';

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
      <p class="eyebrow">Diagnóstico gratuito · 2 min</p>
      <h1>¿Por dónde se te <span class="accent">escapan</span> los clientes?</h1>
      <p class="lead">Cuando un negocio no vende lo que quiere, casi nunca es por falta de gente.
      Son <strong>fugas</strong> en puntos concretos del viaje del cliente. Responde 11 preguntas
      y descubre tu <strong>fuga principal</strong> y qué tan sano está tu embudo.</p>
      <button class="btn-primary" id="start">Empezar el diagnóstico</button>
      <span class="hand-note">honesto &gt; bonito</span>
    </section>
  `);
  document.getElementById('start').addEventListener('click', () => { step = 0; renderStep(); });
}

function renderStep() {
  const item = ITEMS[step];
  const total = ITEMS.length;
  const pct = Math.round((step / total) * 100);
  const stage = STAGES.find((s) => s.key === item.stage);
  const kicker = stage
    ? `${stage.index} — ${esc(stage.name)}`
    : 'Última — Tu prioridad';

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

  paint(`
    <section class="card result" data-anim>
      <p class="eyebrow">Tu diagnóstico</p>
      <p class="claim-kicker">Tu fuga principal es</p>
      <h1 class="claim accent">${esc(r.primaryLeak.name)}</h1>

      <div class="health">
        <div class="health-num">${r.healthPct}<span>/100</span></div>
        <div class="health-meta">
          <span class="grade">Salud del embudo · ${r.grade}</span>
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
        <p class="map-title">Tu embudo, etapa por etapa</p>
        ${rows}
      </div>

      <!-- Bloque de embudo + consentimiento -->
      <div class="funnel">
        <h3>¿Le entramos a taparla?</h3>
        <p class="funnel-body">Kapüy diseña el sistema invisible que conecta las 5 etapas de tu embudo.
        Este diagnóstico es la versión automática de lo que hacemos a mano contigo.
        Agenda un diagnóstico humano de 20 min y salimos con tu fuga principal ya con plan.</p>

        <form id="optin" class="optin" novalidate>
          <input type="email" id="email" placeholder="tu@correo.com" autocomplete="email" required>
          <label class="opt"><input type="checkbox" name="ask" checked> Quiero agendar un diagnóstico con Kapüy</label>
          <label class="opt"><input type="checkbox" name="notify"> Avísenme cuando lancen la herramienta completa</label>
          <label class="opt"><input type="checkbox" name="list"> Súmenme a los correos de Kapüy</label>

          <div class="consent">
            <strong>Qué haremos con tu información:</strong> la usamos solo para contactarte sobre esta
            conversación — nada más. Nunca publicaremos, citaremos ni atribuiremos tus respuestas ni nada
            que compartas sin tu permiso explícito y por escrito. Si más adelante decides aparecer como caso,
            esa es una conversación aparte que tendremos contigo directamente.
          </div>

          <button type="submit" class="btn-primary">Enviar y agendar</button>
          <p class="stub-note" id="stubnote">${isConfigured()
            ? 'Tus datos se usan solo para contactarte sobre esto. Nada de spam.'
            : '⚠︎ Prueba local: Supabase no está configurado (falta config.js). Aún no guarda nada.'}</p>
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
    if (!email || !/.+@.+\..+/.test(email)) {
      note.textContent = 'Escribe un correo válido para continuar.';
      note.classList.remove('ok'); return;
    }
    const opts = {
      ask: form.querySelector('input[name=ask]').checked,
      notify: form.querySelector('input[name=notify]').checked,
      list: form.querySelector('input[name=list]').checked,
    };

    if (!isConfigured()) {
      note.textContent = `✓ Local: capturaríamos "${email}" (${r.primaryLeak.key}, ${r.grade}). Supabase no configurado.`;
      note.classList.add('ok'); return;
    }

    btn.disabled = true; btn.textContent = 'Enviando…';
    await submissionSaved;                       // asegurar que exista el submissionId
    const res = await saveContact(submissionId, { email, opts, result: r });
    if (res.ok) {
      note.textContent = '✓ ¡Listo! Te contactamos para agendar tu diagnóstico.';
      note.classList.add('ok');
      btn.textContent = 'Enviado ✓';
    } else {
      note.textContent = 'Uy, no se pudo guardar. Intenta de nuevo en un momento.';
      note.classList.remove('ok');
      btn.disabled = false; btn.textContent = 'Enviar y agendar';
    }
  });
}

renderIntro();
