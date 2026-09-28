/* =========================================================
   RIOS DENT — contenido dinámico + panel Admin
   Acceso al panel: agregá #admin-riosdent al final de la URL.
   Todo lo que se guarda queda en el servidor y lo ve cualquier visitante.
   ========================================================= */
(() => {
  const ADMIN_HASH = '#admin-riosdent';
  const API = '/api';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waHref = p => 'https://wa.me/' + String(p).replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, quiero reservar un turno');
  const MARK = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  const TEXT_FIELDS = [
    ['heroText', 'txtHeroText', 'Portada — texto debajo del título', 3],
    ['servicesLead', 'txtServicesLead', 'Servicios — texto de introducción', 2],
    ['clinicLead', 'txtClinicLead', 'Nuestra clínica — texto de introducción', 3],
    ['expertTitle', 'txtExpertTitle', 'Atención experta — título', 1],
    ['expertText', 'txtExpertText', 'Atención experta — texto', 3],
    ['locationLead', 'txtLocationLead', 'Ubicación — texto de introducción', 2]
  ];
  const IMAGE_SLOTS = [
    ['hero', 'heroImg', 'Portada (inicio)'],
    ['clinic', 'clinicImg', 'Foto de la clínica'],
    ['doctor', 'doctorImg', 'Foto del especialista']
  ];
  const PRESETS = [
    { name: 'Original', accent: '#c6941f', background: '#123339', text: '#eaf4f1' },
    { name: 'Azul y blanco', accent: '#2f7de1', background: '#0f2447', text: '#ffffff' },
    { name: 'Claro', accent: '#b8801a', background: '#f6f1e7', text: '#1d2b2f' },
    { name: 'Rojo y negro', accent: '#d63a3a', background: '#141414', text: '#ffffff' }
  ];

  let data = null;
  let adminToken = sessionStorage.getItem('rd_admin_token') || null;

  /* ---------- Sitio público ---------- */
  async function load() {
    try {
      const r = await fetch(API + '/data');
      data = await r.json();
    } catch { return; }
    render();
  }

  function render() {
    if (!data) return;
    const T = data.texts || {};
    if (window.RDTheme) { window.RDTheme.apply(data.theme); window.RDTheme.cache(data.theme); }

    TEXT_FIELDS.forEach(([key, id]) => { if (T[key] && $(id)) $(id).textContent = T[key]; });
    IMAGE_SLOTS.forEach(([key, id]) => { const src = data.images && data.images[key]; if (src && $(id)) $(id).src = src; });

    // Contacto
    if ($('contactEmail')) $('contactEmail').textContent = data.contactEmail;
    if ($('contactPhone')) $('contactPhone').textContent = '+' + data.contactPhone;
    const wa = waHref(data.contactPhone);
    if ($('contactWaLink')) $('contactWaLink').href = wa;
    if ($('waFloat')) $('waFloat').href = wa;

    // Sedes: la principal define mapa y dirección; el resto son tarjetas
    const sedes = data.sedes || [];
    const primary = sedes.find(s => s.id === data.primarySedeId) || sedes[0] || null;
    const loc = $('ubicacion');
    if (loc) {
      const q = primary ? encodeURIComponent(primary.address) : '';
      const addr = loc.querySelector('[data-address-text]');
      if (addr) addr.textContent = primary ? primary.address + (primary.name ? ' — ' + primary.name : '') : 'Próximamente';
      const dir = loc.querySelector('[data-maps-directions]');
      const open = loc.querySelector('[data-maps-open]');
      if (dir) { dir.href = 'https://www.google.com/maps/dir/?api=1&destination=' + q; dir.hidden = !primary; }
      if (open) { open.href = 'https://www.google.com/maps/search/?api=1&query=' + q; open.hidden = !primary; }
      if (window.RD_setMap) window.RD_setMap(primary ? primary.address : null);
      if ($('contactAddress')) $('contactAddress').textContent = primary ? primary.address.split(',').slice(0, 2).join(',') : '—';
    }
    const others = sedes.filter(s => !primary || s.id !== primary.id);
    if ($('otherSedes')) {
      $('otherSedes').innerHTML = others.map(s => `
        <div class="sede-card">
          <h3>${MARK}${esc(s.name)}</h3>
          <p>${esc(s.address)}${s.phone ? '<br>Tel/WhatsApp: +' + esc(s.phone) : ''}</p>
          <a class="btn btn--outline" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">Cómo llegar</a>
        </div>`).join('');
    }

    // Servicios (una sola lista, 100% editable)
    if ($('servicesGrid')) {
      $('servicesGrid').innerHTML = (data.services || []).map(s => `
        <div class="service-card">
          <div class="service-card__media">${s.mediaType === 'video'
            ? `<video src="${s.mediaSrc}" muted loop playsinline controls></video>`
            : `<img src="${s.mediaSrc}" alt="${esc(s.title)}" loading="lazy">`}</div>
          <div class="service-card__body"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>
        </div>`).join('') || '<p class="services-dynamic__empty">Muy pronto vamos a sumar servicios acá.</p>';
    }

    // Galería
    if ($('galleryGrid')) {
      $('galleryGrid').innerHTML = (data.gallery || []).map(g =>
        `<div class="gallery__item"><img src="${g.src}" alt="${esc(g.caption || 'Foto de la clínica')}" loading="lazy"></div>`).join('')
        || '<p class="gallery__empty">Muy pronto vas a poder ver más fotos de la clínica acá.</p>';
    }
  }

  /* ---------- Panel Admin ---------- */
  function initAdmin() {
    const root = $('adminRoot');
    if (!root) return;
    const gate = $('adminGate'), panel = $('adminPanel');
    let editingSede = null, editingService = null, pendingMedia = null;
    let draftTheme = null;

    const api = async (path, opts = {}) => {
      const res = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' } });
      if (res.status === 401) { adminToken = null; sessionStorage.removeItem('rd_admin_token'); gate.hidden = false; panel.hidden = true; throw new Error('unauthorized'); }
      if (!res.ok) throw new Error('failed');
      data = await res.json();
      render();
      return data;
    };
    const flash = (id, text) => { const el = $(id); if (!el) return; el.textContent = text; setTimeout(() => { el.textContent = ''; }, 2800); };
    const readFile = file => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });

    const openIfHash = () => {
      const open = location.hash.startsWith(ADMIN_HASH);
      root.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && adminToken && data) { gate.hidden = true; panel.hidden = false; fillAll(); }
    };
    window.addEventListener('hashchange', openIfHash);
    $('adminExit')?.addEventListener('click', () => { history.replaceState(null, '', location.pathname + location.search); openIfHash(); });

    $('adminLoginBtn')?.addEventListener('click', async () => {
      $('adminErr').textContent = '';
      try {
        const r = await fetch(API + '/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('adminPass').value }) });
        if (!r.ok) throw new Error();
        adminToken = (await r.json()).token;
        sessionStorage.setItem('rd_admin_token', adminToken);
        if (!data) await load();
        gate.hidden = true; panel.hidden = false; fillAll();
      } catch { $('adminErr').textContent = 'Clave incorrecta.'; }
    });
    $('adminPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('adminLoginBtn').click(); });

    function fillAll() {
      $('fContactEmail').value = data.contactEmail;
      $('fContactPhone').value = data.contactPhone;
      draftTheme = window.RDTheme.clean(data.theme);
      fillTheme(); renderSedes(); renderServices(); renderSlots(); fillTexts(); renderThumbs();
    }

    /* --- Colores --- */
    function fillTheme() {
      ['accent', 'background', 'text'].forEach(k => { $('c_' + k).value = draftTheme[k]; $('h_' + k).value = draftTheme[k]; });
      const p = $('themePreview');
      p.style.background = draftTheme.background; p.style.color = draftTheme.text;
      p.querySelector('.btnp').style.background = draftTheme.accent;
      p.querySelector('.btnp').style.color = '#fff';
      const ratio = window.RDTheme.contrast(draftTheme.text, draftTheme.background);
      $('themeWarn').textContent = ratio < 3 ? '⚠️ Poco contraste entre las letras y el fondo: el texto puede costar leerse.' : '';
      $('presetList').innerHTML = PRESETS.map((pr, i) => `<button data-i="${i}"><i style="background:${pr.accent}"></i><i style="background:${pr.background}"></i><i style="background:${pr.text}"></i>${pr.name}</button>`).join('');
      $('presetList').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const { accent, background, text } = PRESETS[b.dataset.i]; draftTheme = { accent, background, text }; fillTheme();
      }));
    }
    ['accent', 'background', 'text'].forEach(k => {
      $('c_' + k)?.addEventListener('input', e => { draftTheme[k] = e.target.value; fillTheme(); });
      $('h_' + k)?.addEventListener('input', e => {
        let v = e.target.value.trim(); if (v && v[0] !== '#') v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) { draftTheme[k] = v.toLowerCase(); $('c_' + k).value = draftTheme[k]; fillTheme(); }
      });
    });
    $('saveTheme')?.addEventListener('click', async () => {
      try { await api('/admin/theme', { method: 'PUT', body: JSON.stringify(draftTheme) }); flash('saveThemeMsg', 'Colores aplicados a toda la página ✓'); }
      catch { flash('saveThemeMsg', 'Error al guardar'); }
    });
    $('resetTheme')?.addEventListener('click', async () => {
      draftTheme = { ...window.RDTheme.DEFAULTS }; fillTheme();
      try { await api('/admin/theme', { method: 'PUT', body: JSON.stringify(draftTheme) }); flash('saveThemeMsg', 'Colores originales restaurados ✓'); } catch {}
    });

    /* --- Contacto --- */
    $('saveContact')?.addEventListener('click', async () => {
      try {
        await api('/admin/contact', { method: 'PUT', body: JSON.stringify({ contactEmail: $('fContactEmail').value.trim(), contactPhone: $('fContactPhone').value.replace(/\D/g, '') }) });
        flash('saveContactMsg', 'Guardado ✓');
      } catch { flash('saveContactMsg', 'Error al guardar'); }
    });

    /* --- Sedes (agregar / editar / principal / quitar) --- */
    function renderSedes() {
      const list = $('sedeList');
      list.innerHTML = (data.sedes || []).map(s => `
        <div class="admin__card">
          <div><strong>${esc(s.name)}${s.id === data.primarySedeId ? '<span class="badge">Principal</span>' : ''}</strong><span>${esc(s.address)}</span></div>
          <div class="actions">
            ${s.id === data.primarySedeId ? '' : `<button data-act="primary" data-id="${s.id}">Hacer principal</button>`}
            <button data-act="edit" data-id="${s.id}">Editar</button>
            <button class="danger" data-act="del" data-id="${s.id}">Quitar</button>
          </div>
        </div>`).join('') || '<p class="hint">No hay sedes. Agregá una abajo.</p>';
      list.querySelectorAll('button').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id, s = data.sedes.find(x => x.id === id);
        if (b.dataset.act === 'edit') {
          editingSede = id; $('fSedeName').value = s.name; $('fSedeAddress').value = s.address; $('fSedePhone').value = s.phone || '';
          $('addSede').textContent = 'Guardar cambios'; $('cancelSede').hidden = false; $('fSedeName').focus();
        } else if (b.dataset.act === 'primary') { await api(`/admin/sedes/${id}/primary`, { method: 'PUT' }); renderSedes(); }
        else if (confirm(`¿Quitar la sede "${s.name}"?`)) { await api(`/admin/sedes/${id}`, { method: 'DELETE' }); if (editingSede === id) resetSedeForm(); renderSedes(); }
      }));
    }
    function resetSedeForm() { editingSede = null; ['fSedeName', 'fSedeAddress', 'fSedePhone'].forEach(i => $(i).value = ''); $('addSede').textContent = 'Agregar sede'; $('cancelSede').hidden = true; }
    $('cancelSede')?.addEventListener('click', resetSedeForm);
    $('addSede')?.addEventListener('click', async () => {
      const body = { name: $('fSedeName').value.trim(), address: $('fSedeAddress').value.trim(), phone: $('fSedePhone').value.replace(/\D/g, '') };
      if (!body.name || !body.address) return flash('saveSedeMsg', 'Completá nombre y dirección.');
      try {
        await api(editingSede ? `/admin/sedes/${editingSede}` : '/admin/sedes', { method: editingSede ? 'PUT' : 'POST', body: JSON.stringify(body) });
        resetSedeForm(); renderSedes(); flash('saveSedeMsg', 'Guardado ✓');
      } catch { flash('saveSedeMsg', 'Error al guardar'); }
    });

    /* --- Servicios (agregar / editar / quitar) --- */
    function renderServices() {
      const list = $('serviceList');
      list.innerHTML = (data.services || []).map(s => `
        <div class="admin__card">
          <div><strong>${esc(s.title)}</strong><span>${s.mediaType === 'video' ? '🎬 video' : '🖼️ foto'}</span></div>
          <div class="actions"><button data-act="edit" data-id="${s.id}">Editar</button><button class="danger" data-act="del" data-id="${s.id}">Quitar</button></div>
        </div>`).join('') || '<p class="hint">No hay servicios. Agregá uno abajo.</p>';
      list.querySelectorAll('button').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id, s = data.services.find(x => x.id === id);
        if (b.dataset.act === 'edit') {
          editingService = id; pendingMedia = null; $('fServiceTitle').value = s.title; $('fServiceDesc').value = s.description;
          $('serviceMediaName').textContent = 'Dejá vacío para mantener la foto/video actual.';
          $('addService').textContent = 'Guardar cambios'; $('cancelService').hidden = false; $('fServiceTitle').focus();
        } else if (confirm(`¿Quitar el servicio "${s.title}"?`)) { await api(`/admin/services/${id}`, { method: 'DELETE' }); if (editingService === id) resetServiceForm(); renderServices(); }
      }));
    }
    function resetServiceForm() { editingService = null; pendingMedia = null; $('fServiceTitle').value = ''; $('fServiceDesc').value = ''; $('serviceMediaName').textContent = ''; $('addService').textContent = 'Agregar servicio'; $('cancelService').hidden = true; }
    $('cancelService')?.addEventListener('click', resetServiceForm);
    $('fServiceMedia')?.addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      pendingMedia = { mediaType: f.type.startsWith('video/') ? 'video' : 'image', mediaSrc: await readFile(f) };
      $('serviceMediaName').textContent = 'Archivo listo: ' + f.name; e.target.value = '';
    });
    $('addService')?.addEventListener('click', async () => {
      const title = $('fServiceTitle').value.trim(), description = $('fServiceDesc').value.trim();
      if (!title || !description) return flash('saveServiceMsg', 'Completá título y descripción.');
      if (!editingService && !pendingMedia) return flash('saveServiceMsg', 'Subí una foto o un video.');
      try {
        await api(editingService ? `/admin/services/${editingService}` : '/admin/services', { method: editingService ? 'PUT' : 'POST', body: JSON.stringify({ title, description, ...(pendingMedia || {}) }) });
        resetServiceForm(); renderServices(); flash('saveServiceMsg', 'Guardado ✓');
      } catch { flash('saveServiceMsg', 'Error al guardar (¿archivo muy pesado?)'); }
    });

    /* --- Imágenes principales --- */
    function renderSlots() {
      $('imageSlots').innerHTML = IMAGE_SLOTS.map(([key, id, label]) => {
        const current = (data.images && data.images[key]) || document.getElementById(id).getAttribute('src');
        const custom = !!(data.images && data.images[key]);
        return `<div class="admin__slot"><strong>${label}</strong><img src="${current}" alt="">
          <div class="row"><label class="admin__filebtn">Cambiar<input type="file" accept="image/*" data-key="${key}" hidden></label>
          ${custom ? `<button class="admin__ghost" data-reset="${key}">Restaurar original</button>` : ''}</div></div>`;
      }).join('');
      $('imageSlots').querySelectorAll('input[type=file]').forEach(inp => inp.addEventListener('change', async e => {
        const f = e.target.files[0]; if (!f) return;
        try { await api('/admin/images', { method: 'PUT', body: JSON.stringify({ key: inp.dataset.key, src: await readFile(f) }) }); renderSlots(); flash('saveImagesMsg', 'Imagen actualizada ✓'); }
        catch { flash('saveImagesMsg', 'Error al subir (¿muy pesada?)'); }
      }));
      $('imageSlots').querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
        await api('/admin/images', { method: 'PUT', body: JSON.stringify({ key: b.dataset.reset, src: null }) });
        const def = { hero: 'assets/img/hero-cirujano.webp', clinic: 'assets/img/clinica.jpg', doctor: 'assets/img/especialista.jpg' }[b.dataset.reset];
        $(IMAGE_SLOTS.find(s => s[0] === b.dataset.reset)[1]).src = def; renderSlots();
      }));
    }

    /* --- Textos --- */
    function fillTexts() {
      $('textFields').innerHTML = TEXT_FIELDS.map(([key, id, label, rows]) =>
        `<label>${label}<textarea data-key="${key}" rows="${rows}">${esc((data.texts && data.texts[key]) || $(id).textContent)}</textarea></label>`).join('');
    }
    $('saveTexts')?.addEventListener('click', async () => {
      const body = {}; $('textFields').querySelectorAll('textarea').forEach(t => { body[t.dataset.key] = t.value; });
      try { await api('/admin/texts', { method: 'PUT', body: JSON.stringify(body) }); flash('saveTextsMsg', 'Textos guardados ✓'); } catch { flash('saveTextsMsg', 'Error al guardar'); }
    });

    /* --- Galería --- */
    $('fGalleryUpload')?.addEventListener('change', async e => {
      for (const f of [...e.target.files]) {
        try { await api('/admin/gallery', { method: 'POST', body: JSON.stringify({ src: await readFile(f), caption: f.name }) }); } catch {}
      }
      e.target.value = ''; renderThumbs();
    });
    function renderThumbs() {
      const wrap = $('adminThumbs');
      wrap.innerHTML = (data.gallery || []).map(g => `<figure><img src="${g.src}" alt=""><button data-id="${g.id}" aria-label="Quitar">✕</button></figure>`).join('');
      wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', async () => { await api('/admin/gallery/' + b.dataset.id, { method: 'DELETE' }); renderThumbs(); }));
    }

    openIfHash();
  }

  const start = async () => { await load(); initAdmin(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
