// Login del dashboard. Recibe la password compartida, y si calza emite la
// cookie que el middleware valida. La password nunca viaja de vuelta ni se
// guarda en la cookie: lo que se guarda es su derivado.

import { COOKIE_NAME, tokenFor, timingSafeEqual } from '../lib/auth.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

    const expected = process.env.DASHBOARD_PASSWORD;
    if (!expected) {
      return Response.json(
        { ok: false, error: 'DASHBOARD_PASSWORD no está configurada.' },
        { status: 500 }
      );
    }

    let password = '';
    const ctype = request.headers.get('content-type') || '';
    try {
      if (ctype.includes('application/json')) {
        const body = await request.json();
        password = String(body?.password ?? '');
      } else {
        const form = await request.formData();
        password = String(form.get('password') ?? '');
      }
    } catch {
      password = '';
    }

    const ok = await timingSafeEqual(
      await tokenFor(password),
      await tokenFor(expected)
    );

    if (!ok) {
      return Response.json(
        { ok: false, error: 'Password incorrecta.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const token = await tokenFor(expected);
    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
        },
      }
    );
  },
};
