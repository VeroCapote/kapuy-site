// Tests del motor de scoring — node --test, sin dependencias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreFunnel } from '../js/scoring.js';
import { QUESTIONS } from '../js/questions.js';

// Helpers: construir respuestas sintéticas.
function allValue(v) {
  const a = {};
  for (const q of QUESTIONS) a[q.id] = v;
  return a;
}
function stageValues(map) {
  // map: { stageKey: value } aplica ese value a las 2 preguntas de la etapa
  const a = {};
  for (const q of QUESTIONS) a[q.id] = map[q.stage] ?? 2;
  return a;
}

test('embudo perfecto → grado A y 100%', () => {
  const r = scoreFunnel({ ...allValue(2), gate: 'downstream' });
  assert.equal(r.healthPct, 100);
  assert.equal(r.grade, 'A');
  assert.equal(r.perfectSelfReport, true);
});

test('embudo colador → grado F', () => {
  const r = scoreFunnel({ ...allValue(0), gate: 'downstream' });
  assert.equal(r.healthPct, 0);
  assert.equal(r.grade, 'F');
});

test('la fuga principal es la etapa con menor puntaje', () => {
  const r = scoreFunnel({ ...stageValues({ conversion: 0 }), gate: 'downstream' });
  assert.equal(r.primaryLeak.key, 'conversion');
  assert.ok(r.primaryLeak.verdict.length > 0);
  assert.ok(r.primaryLeak.next.length > 0);
});

test('empate de fuga → gana la etapa más temprana del viaje', () => {
  // Conversión (03) y Retención (05) empatadas en 0 → debe elegir conversión.
  const r = scoreFunnel({ ...stageValues({ conversion: 0, retencion: 0 }), gate: 'downstream' });
  assert.equal(r.primaryLeak.key, 'conversion');
});

test('niveles por etapa: 0–1 fuga, 2 parcial, 3–4 sólido', () => {
  const r = scoreFunnel({ ...stageValues({ atraccion: 0, interes: 1, conversion: 2 }), gate: 'downstream' });
  const lvl = (k) => r.stageMap.find((s) => s.key === k).level;
  assert.equal(lvl('atraccion'), 'fuga');   // 0+0 = 0
  assert.equal(lvl('interes'), 'parcial');  // 1+1 = 2
  assert.equal(lvl('conversion'), 'solido'); // 2+2 = 4
});

test('deriva fuerte: quiere tráfico pero su fuga está aguas abajo', () => {
  const r = scoreFunnel({ ...stageValues({ retencion: 0 }), gate: 'traffic' });
  assert.equal(r.driftTripped, true);
  assert.equal(r.driftCaveat, 'strong');
});

test('deriva suave: quiere tráfico y su fuga sí es Atracción', () => {
  const r = scoreFunnel({ ...stageValues({ atraccion: 0 }), gate: 'traffic' });
  assert.equal(r.driftCaveat, 'soft');
});

test('sin deriva cuando no elige tráfico', () => {
  const r = scoreFunnel({ ...allValue(1), gate: 'downstream' });
  assert.equal(r.driftTripped, false);
  assert.equal(r.driftCaveat, null);
});

test('preguntas sin responder cuentan como fuga (conservador)', () => {
  const r = scoreFunnel({ gate: 'downstream' }); // nada respondido
  assert.equal(r.total, 0);
  assert.equal(r.grade, 'F');
});
