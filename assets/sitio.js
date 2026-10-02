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
    return K;
  };

  K.setLang = setLang;
  window.KAPUY = K;
})();
