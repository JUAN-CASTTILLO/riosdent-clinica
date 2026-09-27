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
  const loc = document.getElementById('ubicacion');
  const map = document.getElementById('map');
  if (loc && map) {
    const q = encodeURIComponent(loc.dataset.address);
    const frame = map.querySelector('.map__frame');
    const shield = map.querySelector('.map__shield');
    loc.querySelector('[data-maps-directions]').href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
    loc.querySelector('[data-maps-open]').href = 'https://www.google.com/maps/search/?api=1&query=' + q;

    const loadMap = () => {
      if (frame.src) return;
      frame.addEventListener('load', () => map.classList.add('is-loaded'), { once: true });
      frame.src = 'https://www.google.com/maps?q=' + q + '&z=16&hl=es&output=embed';
    };
    if ('IntersectionObserver' in window) {
      const mo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '300px 0px' });
      mo.observe(map);
    } else loadMap();

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

/* =========================================================
   RIOS DENT — Datos dinámicos + panel Admin (con servidor)
   Acceso: abrí el sitio y agregá #admin-riosdent al final de la
   URL (ej: https://tu-sitio.onrender.com/#admin-riosdent).
   La clave la definís vos en la variable de entorno
   ADMIN_PASSWORD del servidor (ver README). No hay clave por
   defecto: si no la configuraste, el panel no va a dejar entrar
   a nadie.
   Todo lo que guardes acá queda en el servidor y se muestra para
   cualquier persona que visite el sitio.
   ========================================================= */
(() => {
  const ADMIN_HASH = '#admin-riosdent';
  const API = '/api';
  let data = null;
  let adminToken = sessionStorage.getItem('rd_admin_token') || null;

  const waHref = phone => 'https://wa.me/' + phone.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, quiero reservar un turno');
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function fetchData() {
    const res = await fetch(API + '/data');
    data = await res.json();
    renderPublic();
  }

  function renderPublic() {
    if (!data) return;
    const $ = id => document.getElementById(id);
    if ($('contactEmail')) $('contactEmail').textContent = data.contactEmail;
    if ($('contactPhone')) $('contactPhone').textContent = '+' + data.contactPhone;
    if ($('contactAddress')) $('contactAddress').textContent = data.mainAddress.split(',').slice(0, 2).join(',');
    const wa = waHref(data.contactPhone);
    if ($('contactWaLink')) $('contactWaLink').href = wa;
    if ($('waFloat')) $('waFloat').href = wa;

    const loc = document.getElementById('ubicacion');
    if (loc) {
      loc.dataset.address = data.mainAddress;
      const addrText = loc.querySelector('[data-address-text]');
      if (addrText) addrText.textContent = data.mainAddress;
      const q = encodeURIComponent(data.mainAddress);
      const dirLink = loc.querySelector('[data-maps-directions]');
      const openLink = loc.querySelector('[data-maps-open]');
      if (dirLink) dirLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
      if (openLink) openLink.href = 'https://www.google.com/maps/search/?api=1&query=' + q;
      const frame = loc.querySelector('.map__frame');
      if (frame) frame.src = '';
    }

    const otherSedes = document.getElementById('otherSedes');
    if (otherSedes) {
      otherSedes.innerHTML = (data.sedes || []).map(s => `
        <div class="sede-card">
          <h3><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.address)}${s.phone ? '<br>Tel/WhatsApp: +' + escapeHtml(s.phone) : ''}</p>
          <a class="btn btn--outline" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">Cómo llegar</a>
        </div>`).join('');
    }

    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
      const items = (data.services || []).map(s => `
        <div class="service-card">
          <div class="service-card__media">${s.mediaType === 'video'
            ? `<video src="${s.mediaSrc}" muted loop playsinline controls></video>`
            : `<img src="${s.mediaSrc}" alt="${escapeHtml(s.title)}" loading="lazy">`}</div>
          <div class="service-card__body">
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.description)}</p>
          </div>
        </div>`).join('');
      servicesGrid.innerHTML = items || '<p class="services-dynamic__empty">Muy pronto vamos a sumar más servicios acá.</p>';
    }

    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
      const items = (data.gallery || []).map(g => `<div class="gallery__item"><img src="${g.src}" alt="${escapeHtml(g.caption || 'Foto de la clínica')}" loading="lazy"></div>`).join('');
      galleryGrid.innerHTML = items || '<p class="gallery__empty">Muy pronto vas a poder ver más fotos de la clínica acá.</p>';
    }
  }

  fetchData();

  /* ---------- Panel Admin ---------- */
  function initAdmin() {
    const root = document.getElementById('adminRoot');
    const gate = document.getElementById('adminGate');
    const panel = document.getElementById('adminPanel');
    if (!root) return;

    const openIfHash = () => {
      if (location.hash.startsWith(ADMIN_HASH)) {
        root.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (adminToken) { gate.hidden = true; panel.hidden = false; fillForms(); }
      } else {
        root.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('hashchange', openIfHash);
    openIfHash();
    document.getElementById('adminExit')?.addEventListener('click', () => {
      history.replaceState(null, '', location.pathname + location.search); openIfHash();
    });

    async function api(path, opts = {}) {
      const res = await fetch(API + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '', ...(opts.headers || {}) }
      });
      if (res.status === 401) throw new Error('unauthorized');
      if (!res.ok) throw new Error('request_failed');
      return res.json();
    }

    document.getElementById('adminLoginBtn')?.addEventListener('click', async () => {
      const pass = document.getElementById('adminPass').value;
      const errEl = document.getElementById('adminErr');
      errEl.textContent = '';
      try {
        const r = await fetch(API + '/admin/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass })
        });
        if (!r.ok) throw new Error();
        const { token } = await r.json();
        adminToken = token;
        sessionStorage.setItem('rd_admin_token', token);
        gate.hidden = true; panel.hidden = false; fillForms();
      } catch { errEl.textContent = 'Clave incorrecta.'; }
    });
    document.getElementById('adminPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('adminLoginBtn').click(); });

    function fillForms() {
      document.getElementById('fContactEmail').value = data.contactEmail;
      document.getElementById('fContactPhone').value = data.contactPhone;
      document.getElementById('fMainAddress').value = data.mainAddress;
      renderSedeList();
      renderServiceList();
      renderThumbs();
    }

    let pendingServiceMedia = null; // { mediaType, mediaSrc, name }
    document.getElementById('fServiceMedia')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onload = () => {
        pendingServiceMedia = { mediaType, mediaSrc: reader.result, name: file.name };
        document.getElementById('serviceMediaName').textContent = 'Archivo listo: ' + file.name;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('addService')?.addEventListener('click', async () => {
      const title = document.getElementById('fServiceTitle').value.trim();
      const description = document.getElementById('fServiceDesc').value.trim();
      const msg = document.getElementById('saveServiceMsg');
      if (!title || !description) { msg.textContent = 'Completá título y descripción.'; return; }
      if (!pendingServiceMedia) { msg.textContent = 'Subí una foto o un video para el servicio.'; return; }
      try {
        data = await api('/admin/services', { method: 'POST', body: JSON.stringify({
          title, description, mediaType: pendingServiceMedia.mediaType, mediaSrc: pendingServiceMedia.mediaSrc
        })});
        document.getElementById('fServiceTitle').value = '';
        document.getElementById('fServiceDesc').value = '';
        document.getElementById('serviceMediaName').textContent = '';
        pendingServiceMedia = null;
        renderServiceList(); renderPublic();
        msg.textContent = 'Servicio agregado ✓';
      } catch { msg.textContent = 'Error al guardar (¿el archivo es muy pesado?)'; }
      setTimeout(() => { msg.textContent = ''; }, 3000);
    });

    function renderServiceList() {
      const list = document.getElementById('serviceList');
      if (!list) return;
      list.innerHTML = (data.services || []).map(s => `
        <div class="admin__card">
          <div><strong>${escapeHtml(s.title)}</strong><span>${s.mediaType === 'video' ? '🎬 video' : '🖼️ foto'}</span></div>
          <button data-id="${s.id}">Quitar</button>
        </div>`).join('') || '<p class="hint">Todavía no agregaste servicios.</p>';
      list.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', async () => {
        data = await api('/admin/services/' + b.dataset.id, { method: 'DELETE' });
        renderServiceList(); renderPublic();
      }));
    }

    document.getElementById('saveContact')?.addEventListener('click', async () => {
      try {
        data = await api('/admin/contact', { method: 'PUT', body: JSON.stringify({
          contactEmail: document.getElementById('fContactEmail').value.trim(),
          contactPhone: document.getElementById('fContactPhone').value.replace(/\D/g, '')
        })});
        renderPublic(); flash('saveContactMsg', 'Guardado ✓');
      } catch { flash('saveContactMsg', 'Error al guardar'); }
    });

    document.getElementById('saveMain')?.addEventListener('click', async () => {
      try {
        data = await api('/admin/main-address', { method: 'PUT', body: JSON.stringify({
          mainAddress: document.getElementById('fMainAddress').value.trim()
        })});
        renderPublic(); flash('saveMainMsg', 'Guardado ✓');
      } catch { flash('saveMainMsg', 'Error al guardar'); }
    });

    document.getElementById('addSede')?.addEventListener('click', async () => {
      const name = document.getElementById('fSedeName').value.trim();
      const address = document.getElementById('fSedeAddress').value.trim();
      const phone = document.getElementById('fSedePhone').value.replace(/\D/g, '');
      if (!name || !address) return;
      data = await api('/admin/sedes', { method: 'POST', body: JSON.stringify({ name, address, phone }) });
      document.getElementById('fSedeName').value = '';
      document.getElementById('fSedeAddress').value = '';
      document.getElementById('fSedePhone').value = '';
      renderSedeList(); renderPublic();
    });

    function renderSedeList() {
      const list = document.getElementById('sedeList');
      if (!list) return;
      list.innerHTML = (data.sedes || []).map(s => `
        <div class="admin__card">
          <div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.address)}</span></div>
          <button data-id="${s.id}">Quitar</button>
        </div>`).join('') || '<p class="hint">Todavía no agregaste otras sedes.</p>';
      list.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', async () => {
        data = await api('/admin/sedes/' + b.dataset.id, { method: 'DELETE' });
        renderSedeList(); renderPublic();
      }));
    }

    document.getElementById('fGalleryUpload')?.addEventListener('change', e => {
      [...e.target.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = async () => {
          data = await api('/admin/gallery', { method: 'POST', body: JSON.stringify({ src: reader.result, caption: file.name }) });
          renderThumbs(); renderPublic();
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    });

    function renderThumbs() {
      const wrap = document.getElementById('adminThumbs');
      if (!wrap) return;
      wrap.innerHTML = (data.gallery || []).map(g => `
        <figure><img src="${g.src}" alt=""><button data-id="${g.id}" aria-label="Quitar">✕</button></figure>`).join('');
      wrap.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', async () => {
        data = await api('/admin/gallery/' + b.dataset.id, { method: 'DELETE' });
        renderThumbs(); renderPublic();
      }));
    }

    function flash(id, text) {
      const el = document.getElementById(id);
      el.textContent = text;
      setTimeout(() => { el.textContent = ''; }, 2500);
    }
  }
  document.addEventListener('DOMContentLoaded', initAdmin);
  if (document.readyState !== 'loading') initAdmin();
})();
