(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: fondo al hacer scroll + menú móvil ---------- */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.querySelectorAll('#navLinks a');

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  links.forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Link activo según la sección visible ---------- */
  const sections = ['inicio', 'equipo', 'ubicacion', 'contacto']
    .map(id => document.getElementById(id)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Reveal al entrar en pantalla ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- Carrusel de opiniones ---------- */
  // Reseñas reales de Google Maps
  const reviews = [
    { name: 'Ramiro Gonzalez', date: 'Hace un día', color: '#3f6592',
      text: '“Excelente! Tuve una urgencia odontológica y me atendieron enseguida, super amables, dedicados y profesionales. Realmente recomendable. Espero les vaya bien.”' },
    { name: 'Ya Bi', date: 'Hace 2 semanas', color: '#5b7f6e',
      text: '“Atención de excelencia. Tecnología de primera y amplio horario. Llegué con un problema que comprometía la salud, funcionalidad y estética de mi boca. En 30 días me fui con una sonrisa nueva y con los controles correspondientes. Muyyy conforme y feliz por lo logrado. Gracias Dr. Fernando Rios.”' },
    { name: 'Paula Najson', date: 'Hace 2 semanas', color: '#8a6a8f',
      text: '“Profesionalismo, buena atención. No he sentido dolor a pesar de las diversas intervenciones. Creo que los aranceles son muy accesibles. Recomiendo.”' },
    { name: 'Luz Angela Bermudez M', date: 'Hace 2 semanas', color: '#a0704a',
      text: '“Excelente profesional, muy amable, atiende realmente las urgencias a la hora que sea. Agradecida.”' },
    { name: 'Braian Suarezz', date: 'Hace una semana', color: '#4f7c8f',
      text: '“Muy buena atención y responsabilidad, me seguiré atendiendo con ellos 👌”' },
    { name: 'Raul German Rios Garcia', date: 'Hace 2 semanas', color: '#6b6f9a',
      text: '“Excelente servicio!!”' }
  ];
  const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const avatars = document.getElementById('reviewAvatars');
  const body = document.getElementById('reviewBody');
  const dotsWrap = document.getElementById('reviewDots');
  const card = document.getElementById('reviewCard');
  const [prevBtn, mainAv, nextBtn] = avatars.children;
  const nameEl = body.querySelector('.review-card__name');
  const textEl = body.querySelector('.review-card__text');
  const dateEl = body.querySelector('.review-card__date');
  let current = 0, timer = null, busy = false;

  reviews.forEach((r, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Reseña de ' + r.name);
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });

  const render = i => {
    const n = reviews.length;
    const prev = reviews[(i - 1 + n) % n], next = reviews[(i + 1) % n], r = reviews[i];
    [[mainAv, r], [prevBtn, prev], [nextBtn, next]].forEach(([el, rv]) => {
      el.querySelector('span').textContent = initials(rv.name);
      el.style.setProperty('--av', rv.color);
    });
    nameEl.textContent = r.name;
    dateEl.textContent = r.date + ' · Google';
    textEl.textContent = r.text;
    [...dotsWrap.children].forEach((d, k) => d.setAttribute('aria-selected', k === i));
  };

  const go = i => {
    const n = reviews.length;
    i = (i + n) % n;
    if (i === current || busy) return;
    current = i;
    if (reduceMotion) { render(i); return restart(); }
    busy = true;
    body.classList.add('is-leaving');
    avatars.classList.add('is-leaving');
    setTimeout(() => {
      render(i);
      body.classList.remove('is-leaving');
      avatars.classList.remove('is-leaving');
      busy = false;
    }, 420);
    restart();
  };

  const restart = () => {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(current + 1), 6500);
  };

  [prevBtn, nextBtn].forEach(b => b.addEventListener('click', () => go(current + Number(b.dataset.dir))));
  card.addEventListener('mouseenter', () => clearInterval(timer));
  card.addEventListener('mouseleave', restart);
  // Deslizar con el dedo para cambiar de opinión
  let touchX = null;
  card.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  card.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1)); else restart();
    touchX = null;
  }, { passive: true });

  render(0);
  restart();

  /* ---------- Botón fijo "Reservar turno" en celular ---------- */
  const cta = document.getElementById('mobileCta');
  const hero = document.getElementById('inicio');
  const contact = document.getElementById('contacto');
  let pastHero = false, atContact = false;
  const syncCta = () => cta.classList.toggle('is-visible', pastHero && !atContact);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; syncCta(); }).observe(hero);
  new IntersectionObserver(([e]) => { atContact = e.isIntersecting; syncCta(); }, { rootMargin: '0px 0px -20% 0px' }).observe(contact);

  /* ---------- Mapa de Google (carga diferida + activación al tocar) ---------- */
  // La dirección la define el panel admin (sede principal): cms.js llama a window.RD_setMap(dirección).
  const loc = document.getElementById('ubicacion');
  const map = document.getElementById('map');
  if (loc && map) {
    const frame = map.querySelector('.map__frame');
    const shield = map.querySelector('.map__shield');
    let mapAddress = null, mapSeen = false;

    const loadMap = () => {
      if (!mapAddress) return;
      map.classList.remove('is-loaded');
      frame.addEventListener('load', () => map.classList.add('is-loaded'), { once: true });
      frame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(mapAddress) + '&z=16&hl=es&output=embed';
    };
    window.RD_setMap = address => {
      mapAddress = address || null;
      map.hidden = !mapAddress;
      if (mapAddress && mapSeen) loadMap();
    };
    if ('IntersectionObserver' in window) {
      const mo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { mapSeen = true; loadMap(); mo.disconnect(); } }, { rootMargin: '300px 0px' });
      mo.observe(map);
    } else { mapSeen = true; loadMap(); }

    // El mapa no "atrapa" el scroll hasta que el usuario lo activa
    shield.addEventListener('click', () => map.classList.add('is-active'));
    map.addEventListener('mouseleave', () => map.classList.remove('is-active'));
    document.addEventListener('touchstart', e => { if (!map.contains(e.target)) map.classList.remove('is-active'); }, { passive: true });
  }

  /* ---------- Formulario ---------- */
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(input => {
      const bad = !input.value.trim();
      input.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) {
      msg.style.color = '#c0504d';
      msg.textContent = 'Por favor completa tu nombre y teléfono.';
      return;
    }
    msg.style.color = '';
    msg.textContent = '¡Gracias! Te contactaremos a la brevedad para confirmar tu turno.';
    form.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
