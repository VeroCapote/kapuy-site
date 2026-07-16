// Gate del dashboard. Corre antes que cualquier handler.
//
//   /dashboard        sin cookie  -> redirect a /dashboard/login
//   /api/dashboard    sin cookie  -> 401 (no redirige: es una API)
//   con cookie válida             -> pasa (return undefined = continue)
//
// Ojo: /dashboard/login y /api/dashboard-login quedan fuera del gate, si no
// nadie podría autenticarse nunca.

import { COOKIE_NAME, tokenFor, timingSafeEqual, readCookie } from './lib/auth.js';

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/api/dashboard'],
};

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  if (pathname === '/dashboard/login' || pathname === '/dashboard/login.html') {
    return undefined;
  }

  const expected = process.env.DASHBOARD_PASSWORD;

  // Sin password configurada no se abre la puerta "por conveniencia": se cierra.
  // Fallar abierto acá publicaría los números del negocio.
  if (!expected) {
    return Response.json(
      { ok: false, error: 'DASHBOARD_PASSWORD no está configurada en el servidor.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const cookie = readCookie(request, COOKIE_NAME);
  const authed =
    !!cookie && (await timingSafeEqual(cookie, await tokenFor(expected)));

  if (authed) return undefined;

  if (pathname === '/api/dashboard') {
    return Response.json(
      { ok: false, error: 'No autorizado.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const login = new URL('/dashboard/login', request.url);
  return Response.redirect(login, 302);
}
