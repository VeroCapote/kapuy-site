/* ══════════════════════════════════════════════════════════
   Kapüy · comportamiento compartido de todas las páginas
   · Idioma ES/EN (recuerda la elección en localStorage 'kapuy_lang')
   · Menú móvil
   · GA4: clics a los botones del calendario (data-cta)

   Cada página llama a KAPUY.init(dict) con su propio diccionario.
   Las claves de navegación comunes viven aquí para no repetirlas.
   ══════════════════════════════════════════════════════════ */
(function () {
  var COMUN = {
    tagline:   { es: 'Movemos mareas', en: 'We move tides' },
    navOferta: { es: 'Qué hacemos', en: 'What we do' },
    navQuien:  { es: 'Para quién', en: "Who it's for" },
    navTst:    { es: 'Testimonios', en: 'Testimonials' },
    navNos:    { es: 'Quiénes somos', en: 'About us' },
    navCom:    { es: 'Comunidad', en: 'Community' },
    hablemos:  { es: 'Hablemos', en: "Let's talk" },
    menu:      { es: 'Menú', en: 'Menu' },
    ciBtn:     { es: 'Agenda una llamada', en: 'Book a call' }
  };

  var dict = {};
  var K = { lang: 'es' };

  function setLang(next) {
    K.lang = next;
    document.documentElement.lang = next;
    if (dict._title) document.title = dict._title[next];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = dict[el.dataset.i18n];
      if (entry) el.innerHTML = entry[next];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var entry = dict._ph && dict._ph[el.dataset.i18nPh];
      if (entry) el.placeholder = entry[next];
    });
    document.querySelectorAll('.idioma button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === next));
    });
    try { localStorage.setItem('kapuy_lang', next); } catch (e) {}
  }

  K.init = function (pageDict) {
    dict = Object.assign({}, COMUN, pageDict || {});
    K.dict = dict;

    // Páginas con versión propia por idioma (/ y /en/): el idioma lo fija la
    // URL y el selector navega a la otra versión. Sin <link hreflang>, el
    // selector cambia el texto en la misma página (404, etc.).
    var fijo = document.documentElement.hasAttribute('data-idioma-fijo');
    function alterna(lang) {
      var l = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
      return l ? l.getAttribute('href') : null;
    }

    document.querySelectorAll('.idioma button').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = b.dataset.lang;
        if (window.gtag) gtag('event', 'idioma_cambio', { idioma: next });
        if (fijo && next !== K.lang && alterna(next)) {
          try { localStorage.setItem('kapuy_lang', next); } catch (e) {}
          location.href = alterna(next).replace(/^https:\/\/www\.kapuymarketing\.com/, '') + location.hash;
          return;
        }
        setLang(next);
      });
    });

    // Menú móvil
    var btn = document.querySelector('.menu-btn');
    var panel = document.getElementById('menu-panel');
    if (btn && panel) {
      btn.addEventListener('click', function () {
        var abierto = panel.classList.toggle('abierto');
        btn.setAttribute('aria-expanded', String(abierto));
      });
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          panel.classList.remove('abierto');
          btn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // GA4: mismo evento que la home v1 (home_booking_click) + ubicación y página
    document.querySelectorAll('[data-cta]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.gtag) gtag('event', 'home_booking_click', {
          idioma: K.lang, ubicacion: a.dataset.cta, pagina: location.pathname
        });
      });
    });

    // GA4: clics al diagnóstico gratuito (data-diag = ubicación).
    // Delegado porque el link del bloque de contacto se re-pinta al cambiar idioma.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-diag]');
      if (a && window.gtag) gtag('event', 'diag_click', { idioma: K.lang, ubicacion: a.dataset.diag, pagina: location.pathname });
    });

    var saved = null;
    try { saved = localStorage.getItem('kapuy_lang'); } catch (e) {}
    var navEn = (navigator.language || 'es').toLowerCase().indexOf('en') === 0;
    var build = new URLSearchParams(location.search).get('build');

    if (build) {
      // tools/build-en.py renderiza la versión en inglés con ?build=en
      setLang(build);
    } else if (fijo) {
      setLang(document.documentElement.lang);
      // Nunca redirigimos por idioma (Google rastrea con navegador en inglés).
      // A quien tiene el navegador en inglés le ofrecemos la versión EN.
      if (K.lang === 'es' && navEn && saved !== 'es' && alterna('en')) {
        var bar = document.createElement('a');
        bar.className = 'aviso-idioma';
        bar.href = alterna('en').replace(/^https:\/\/www\.kapuymarketing\.com/, '');
        bar.textContent = 'Read this page in English →';
        bar.addEventListener('click', function () { if (window.gtag) gtag('event', 'idioma_cambio', { idioma: 'en', ubicacion: 'aviso' }); });
        document.body.insertBefore(bar, document.body.firstChild);
      }
    } else {
      // Default ES (la marca opera desde LATAM); cae a EN por navegador.
      setLang(saved || (navEn ? 'en' : 'es'));
    }
    popupDiag();
    return K;
  };


  /* ── Pop-up del diagnóstico ─────────────────────────────────
     Solo en home y quiénes somos (ES y EN). Una vez por persona:
     si lo cierra, no vuelve en 14 días. Nunca a quien ya tocó un
     botón de agendar o del diagnóstico. Aparece al pasar la mitad
     de la página o, en computadora, al ir a cerrar la pestaña
     (siempre después de 10 s). En celular es una franja abajo. */
  var POP = {
    eb:    { es: 'Diagnóstico gratis', en: 'Free diagnostic' },
    h:     { es: '¿Por dónde se te escapan los clientes?', en: 'Where are your customers slipping away?' },
    p:     { es: '11 preguntas, 2 minutos. Ves tu resultado sin dejar el correo.', en: '11 questions, 2 minutes, in Spanish. See your result without leaving your email.' },
    btn:   { es: 'Hacer el diagnóstico', en: 'Take the diagnostic' },
    no:    { es: 'Ahora no', en: 'Not now' },
    cerrar:{ es: 'Cerrar', en: 'Close' }
  };
  var POP_KEY = 'kapuy_popup_diag', POP_DIAS = 14;
  var POP_PAGINAS = ['/', '/index.html', '/quienes-somos', '/en/', '/en/index.html', '/en/about'];

  function popLeer() { try { return localStorage.getItem(POP_KEY); } catch (e) { return null; } }
  function popMarcar(v) { try { localStorage.setItem(POP_KEY, v); } catch (e) {} }

  function popupDiag() {
    if (POP_PAGINAS.indexOf(location.pathname) === -1) return;
    if (new URLSearchParams(location.search).get('build')) return;
    var prev = popLeer();
    if (prev === 'nunca' || (prev && Date.now() - Number(prev) < POP_DIAS * 864e5)) return;

    var listo = false, mostrado = false, t0 = Date.now();
    setTimeout(function () { listo = true; }, 10000);

    // Quien ya agenda o ya fue al diagnóstico no necesita el empujón
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-cta],[data-diag]')) popMarcar('nunca');
    });

    function mostrar(motivo) {
      if (mostrado || !listo || popLeer() === 'nunca') return;
      mostrado = true;
      var L = K.lang;
      var el = document.createElement('aside');
      el.className = 'pop-diag';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-labelledby', 'pop-diag-h');
      el.innerHTML =
        '<button type="button" class="pop-x" aria-label="' + POP.cerrar[L] + '">×</button>' +
        '<p class="eb">' + POP.eb[L] + '</p>' +
        '<p class="pop-h" id="pop-diag-h">' + POP.h[L] + '</p>' +
        '<p class="pop-p">' + POP.p[L] + '</p>' +
        '<div class="pop-fila"><a class="btn btn--lima" href="/diagnostico" data-diag="popup">' + POP.btn[L] + '</a>' +
        '<button type="button" class="pop-no">' + POP.no[L] + '</button></div>';
      document.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('abierto'); });
      popMarcar(String(Date.now()));
      if (window.gtag) gtag('event', 'popup_diag_ver', { idioma: L, motivo: motivo, segundos: Math.round((Date.now() - t0) / 1000) });

      function cerrar(como) {
        el.classList.remove('abierto');
        setTimeout(function () { el.remove(); }, 300);
        document.removeEventListener('keydown', esc);
        if (window.gtag) gtag('event', 'popup_diag_cerrar', { idioma: L, como: como });
      }
      function esc(e) { if (e.key === 'Escape') cerrar('escape'); }
      el.querySelector('.pop-x').addEventListener('click', function () { cerrar('x'); });
      el.querySelector('.pop-no').addEventListener('click', function () { cerrar('ahora_no'); });
      el.querySelector('a').addEventListener('click', function () {
        if (window.gtag) gtag('event', 'popup_diag_click', { idioma: L });
      });
      document.addEventListener('keydown', esc);
    }

    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0 && scrollY / h >= 0.5) mostrar('scroll');
    }, { passive: true });

    if (matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget && e.clientY <= 0) mostrar('salida');
      });
    }
  }

  K.setLang = setLang;
  window.KAPUY = K;
})();
