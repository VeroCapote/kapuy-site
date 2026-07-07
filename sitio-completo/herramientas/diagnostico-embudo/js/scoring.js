// Diagnóstico de Fugas del Embudo — MOTOR DE SCORING (módulo puro)
// Entra un objeto de respuestas, sale un resultado. Sin DOM, sin fetch, sin
// globales. Se testea aislado antes de tocar la UI (ver test/scoring.test.js).

import { STAGES, QUESTIONS, STAGE_DIAGNOSIS } from './questions.js';

const STAGE_KEYS = STAGES.map((s) => s.key);

// Puntaje de etapa (0–4) → nivel.
function stageLevel(score) {
  if (score <= 1) return 'fuga';
  if (score === 2) return 'parcial';
  return 'solido';
}

// Salud global 0–100 → letra.
function healthGrade(pct) {
  if (pct >= 85) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 30) return 'D';
  return 'F';
}

/**
 * @param {Object} answers  { <questionId>: 0|1|2, gate: 'traffic'|'downstream'|'unsure' }
 * @returns resultado del diagnóstico
 */
export function scoreFunnel(answers = {}) {
  // Suma por etapa.
  const stageScores = {};
  const stageMax = {};
  for (const key of STAGE_KEYS) {
    stageScores[key] = 0;
    stageMax[key] = 0;
  }
  for (const q of QUESTIONS) {
    const raw = answers[q.id];
    const val = Number.isInteger(raw) ? raw : 0; // sin responder = fuga (conservador)
    stageScores[q.stage] += val;
    stageMax[q.stage] += 2;
  }

  // Mapa de fuerza/fuga por etapa (el "money shot" del resultado).
  const stageMap = STAGES.map((s) => ({
    key: s.key,
    name: s.name,
    index: s.index,
    score: stageScores[s.key],
    max: stageMax[s.key],
    level: stageLevel(stageScores[s.key]),
  }));

  // Salud global.
  const total = Object.values(stageScores).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(stageMax).reduce((a, b) => a + b, 0);
  const healthPct = Math.round((total / maxTotal) * 100);
  const grade = healthGrade(healthPct);

  // Fuga principal = etapa con menor puntaje.
  // Empate → la más temprana en el viaje (se arregla aguas arriba primero).
  let primaryLeak = stageMap[0];
  for (const s of stageMap) {
    if (s.score < primaryLeak.score) primaryLeak = s;
  }

  // Fortaleza = etapa con mayor puntaje (empate → la más temprana).
  let strength = stageMap[0];
  for (const s of stageMap) {
    if (s.score > strength.score) strength = s;
  }

  // Compuerta de deriva: cree que "más tráfico" es la solución.
  const driftTripped = answers.gate === 'traffic';
  // Fuerte si su fuga principal NO es Atracción (querría tráfico sobre una
  // fuga que está más abajo). Suave en cualquier otro caso.
  let driftCaveat = null;
  if (driftTripped) {
    driftCaveat = primaryLeak.key === 'atraccion' ? 'soft' : 'strong';
  }

  // Auto-reporte demasiado limpio (equivalente al "monoculture cap"):
  // todo perfecto → nota de segunda mirada, y tope suave de la banda.
  const perfectSelfReport = total === maxTotal;

  return {
    stageScores,
    stageMap,
    total,
    maxTotal,
    healthPct,
    grade,
    primaryLeak: {
      key: primaryLeak.key,
      name: primaryLeak.name,
      verdict: STAGE_DIAGNOSIS[primaryLeak.key].verdict,
      next: STAGE_DIAGNOSIS[primaryLeak.key].next,
    },
    strength: { key: strength.key, name: strength.name },
    driftTripped,
    driftCaveat,        // 'strong' | 'soft' | null
    perfectSelfReport,
  };
}
