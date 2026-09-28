/* Colores del sitio: UN color de fondo, UN color de acento y UN color de letras/títulos.
   Se aplica en toda la página a la vez (variables CSS). Se carga en <head> para evitar parpadeos. */
(function () {
  var DEFAULTS = { accent: '#c6941f', background: '#123339', text: '#eaf4f1' };
  var HEX = /^#[0-9a-fA-F]{6}$/;

  function lum(h) {
    var c = [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; })
      .map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function clean(t) {
    t = t || {};
    return {
      accent: HEX.test(t.accent) ? t.accent : DEFAULTS.accent,
      background: HEX.test(t.background) ? t.background : DEFAULTS.background,
      text: HEX.test(t.text) ? t.text : DEFAULTS.text
    };
  }
  function apply(theme) {
    var t = clean(theme), s = document.documentElement.style;
    s.setProperty('--navy-900', t.background);
    s.setProperty('--gold-600', t.accent);
    s.setProperty('--ink', t.text);
    s.setProperty('--on-accent', lum(t.accent) > 0.45 ? '#17282c' : '#ffffff');
    if (t.accent.toLowerCase() === DEFAULTS.accent) s.removeProperty('--brand-gradient');
    else s.setProperty('--brand-gradient', 'linear-gradient(135deg, var(--gold-500), var(--gold-600))');
    return t;
  }
  function cache(theme) { try { localStorage.setItem('rd_theme', JSON.stringify(clean(theme))); } catch (e) {} }

  try { var saved = JSON.parse(localStorage.getItem('rd_theme') || 'null'); if (saved) apply(saved); } catch (e) {}
  window.RDTheme = { DEFAULTS: DEFAULTS, apply: apply, cache: cache, clean: clean, contrast: contrast };
})();
