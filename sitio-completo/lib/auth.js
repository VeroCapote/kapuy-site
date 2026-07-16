// Auth compartida entre el middleware y el endpoint de login.
// Password compartida, no cuentas: no hay usuarios que gestionar.

export const COOKIE_NAME = 'kapuy_dash';

// La cookie guarda un derivado de la password, nunca la password. El sufijo
// evita que el hash sirva para otra cosa si alguna vez se reusa el valor.
const DOMAIN_SEPARATOR = '::kapuy-dashboard-v1';

export async function tokenFor(password) {
  const data = new TextEncoder().encode(String(password) + DOMAIN_SEPARATOR);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparación en tiempo constante: no filtra la password carácter a carácter. */
export async function timingSafeEqual(a, b) {
  const A = new TextEncoder().encode(String(a));
  const B = new TextEncoder().encode(String(b));
  if (A.length !== B.length) return false;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff |= A[i] ^ B[i];
  return diff === 0;
}

export function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}
