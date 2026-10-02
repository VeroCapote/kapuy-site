#!/usr/bin/env python3
"""Genera la versión en inglés del sitio en /en/.

Las páginas en español son la fuente: cada una ya trae su diccionario ES/EN.
Este script las abre en Chrome sin interfaz con ?build=en, guarda el HTML ya
traducido en en/ y le ajusta lo que el diccionario no cubre (idioma, meta
description, canonical y links internos).

Cuándo correrlo: cada vez que cambie el copy de index, quienes-somos,
comunidad o privacidad. Uso, desde la raíz del repo:

    python3 tools/build-en.py

Necesita Google Chrome instalado. No instala nada.
"""
import functools, http.server, os, re, socket, subprocess, sys, threading

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = 'https://www.kapuymarketing.com'
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

# fuente, destino, ruta ES, ruta EN, título y descripción para buscadores y redes
PAGINAS = [
    ('index.html', 'en/index.html', '/', '/en/',
     'Kapüy · We move tides',
     'Marketing agency for businesses that have already burned money without knowing where it went. Strategy that sets the direction, ideas people remember and the funnel that holds them together.'),
    ('quienes-somos.html', 'en/about.html', '/quienes-somos', '/en/about',
     'About us · Kapüy',
     'Kapüy is strategy, creativity and soul for businesses that have already burned money without knowing on what. Who’s behind it and how we work.'),
    ('comunidad.html', 'en/community.html', '/comunidad', '/en/community',
     'Kapüy for the community',
     'One free marketing consultation a month for a nonprofit with no resources: the full strategy and the system to run it.'),
    ('privacidad.html', 'en/privacy.html', '/privacidad', '/en/privacy',
     'Privacy · Kapüy',
     'What data kapuymarketing.com collects, what we use it for and how to ask us to delete it.'),
]
RUTAS = {es: en for _, _, es, en, _, _ in PAGINAS}


def alternates(es, en):
    return ('<link rel="alternate" hreflang="es" href="%s%s" />\n'
            '<link rel="alternate" hreflang="en" href="%s%s" />\n'
            '<link rel="alternate" hreflang="x-default" href="%s%s" />\n') % (SITIO, es, SITIO, en, SITIO, es)


def preparar_fuente(fuente, es, en):
    """Deja la página en español marcada como de idioma fijo y con sus hreflang."""
    ruta = os.path.join(RAIZ, fuente)
    s = open(ruta, encoding='utf-8').read()
    s = re.sub(r'<html lang="es"[^>]*>', '<html lang="es" data-idioma-fijo>', s, count=1)
    s = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\n', '', s)
    s = re.sub(r'(<link rel="canonical"[^>]*>\n)', lambda m: m.group(1) + alternates(es, en), s, count=1)
    open(ruta, 'w', encoding='utf-8').write(s)


def servidor():
    with socket.socket() as so:
        so.bind(('127.0.0.1', 0)); puerto = so.getsockname()[1]
    class Callado(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Callado, directory=RAIZ)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', puerto), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, puerto


def renderizar(puerto, fuente):
    url = 'http://127.0.0.1:%d/%s?build=en' % (puerto, fuente)
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=4000',
                        # sin Analytics: que no meta sus scripts en el HTML guardado
                        '--host-resolver-rules=MAP www.googletagmanager.com 127.0.0.1, MAP www.google-analytics.com 127.0.0.1',
                        '--dump-dom', url], capture_output=True, text=True, timeout=90)
    if '<html' not in r.stdout:
        sys.exit('Chrome no devolvió HTML para %s:\n%s' % (fuente, r.stderr[-800:]))
    return r.stdout


def ajustar(html, es, en, titulo, desc):
    html = '<!DOCTYPE html>\n' + html[html.index('<html'):]
    html = re.sub(r'<html[^>]*>', '<html lang="en" data-idioma-fijo>', html, count=1)
    html = re.sub(r'<meta name="description" content="[^"]*"', '<meta name="description" content="%s"' % desc, html, count=1)
    html = re.sub(r'<meta property="og:title" content="[^"]*"', '<meta property="og:title" content="%s"' % titulo, html, count=1)
    html = re.sub(r'<meta property="og:description" content="[^"]*"', '<meta property="og:description" content="%s"' % desc, html, count=1)
    html = re.sub(r'<meta property="og:url" content="[^"]*"', '<meta property="og:url" content="%s%s"' % (SITIO, en), html, count=1)
    html = re.sub(r'<link rel="canonical" href="[^"]*"', '<link rel="canonical" href="%s%s"' % (SITIO, en), html, count=1)
    html = html.replace('content="Kapüy · Movemos mareas"', 'content="Kapüy · We move tides"')
    html = html.replace('<meta property="og:type"', '<meta property="og:locale" content="en_US">\n<meta property="og:type"', 1)

    def link(m):
        ruta, hash_ = m.group(1), m.group(2) or ''
        return 'href="%s%s"' % (RUTAS.get(ruta, ruta), hash_)
    # Links internos a páginas con versión EN (no toca /assets, /diagnostico ni hreflang)
    cuerpo_ini = html.index('</head>')
    cabeza, cuerpo = html[:cuerpo_ini], html[cuerpo_ini:]
    cuerpo = re.sub(r'href="(/[a-z-]*)(#[a-z-]+)?"', link, cuerpo)
    return cabeza + cuerpo


def main():
    os.makedirs(os.path.join(RAIZ, 'en'), exist_ok=True)
    for fuente, _, es, en, _, _ in PAGINAS:
        preparar_fuente(fuente, es, en)
    srv, puerto = servidor()
    try:
        for fuente, destino, es, en, titulo, desc in PAGINAS:
            html = ajustar(renderizar(puerto, fuente), es, en, titulo, desc)
            open(os.path.join(RAIZ, destino), 'w', encoding='utf-8').write(html)
            print('✓ %s → %s' % (fuente, destino))
    finally:
        srv.shutdown()


if __name__ == '__main__':
    main()
