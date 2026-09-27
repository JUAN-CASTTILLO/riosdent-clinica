// server.js — Rios Dent (sitio + panel admin)
require('dotenv').config(); // lee el archivo .env (si existe) y carga sus variables
const express = require('express');
const crypto = require('crypto');
const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Las imágenes y videos de servicios/galería viajan como data-URL (base64)
// dentro del JSON, así que subimos bastante el límite normal de body-parser.
// Ojo: videos largos o en alta resolución pueden superar esto — para el
// panel de administración conviene usar videos cortos (unos segundos) y
// livianos (unos pocos MB), no clips de varios minutos en HD.
app.use(express.json({ limit: '40mb' }));
app.use(express.static('public'));

// Tokens de admin en memoria: alcanza para un panel de una sola clínica.
// Si el servidor se reinicia, hay que volver a iniciar sesión (no pasa nada,
// los datos guardados no se pierden).
const activeTokens = new Set();

function requireAdmin(req, res, next) {
  const token = req.header('x-admin-token');
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// ---------- Datos públicos ----------
app.get('/api/data', async (req, res) => {
  const data = await storage.getData();
  res.json(data);
});

// ---------- Login admin ----------
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'admin_password_not_configured' });
  }
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'wrong_password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  activeTokens.add(token);
  res.json({ token });
});

// ---------- Endpoints admin (requieren token) ----------
app.put('/api/admin/contact', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  const { contactEmail, contactPhone } = req.body || {};
  if (contactEmail) data.contactEmail = String(contactEmail).trim();
  if (contactPhone) data.contactPhone = String(contactPhone).replace(/\D/g, '');
  await storage.setData(data);
  res.json(data);
});

app.put('/api/admin/main-address', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  const { mainAddress } = req.body || {};
  if (mainAddress) data.mainAddress = String(mainAddress).trim();
  await storage.setData(data);
  res.json(data);
});

app.post('/api/admin/sedes', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  const { name, address, phone } = req.body || {};
  if (!name || !address) return res.status(400).json({ error: 'missing_fields' });
  data.sedes = data.sedes || [];
  data.sedes.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: String(name).trim(),
    address: String(address).trim(),
    phone: String(phone || '').replace(/\D/g, '')
  });
  await storage.setData(data);
  res.json(data);
});

app.delete('/api/admin/sedes/:id', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  data.sedes = (data.sedes || []).filter(s => s.id !== req.params.id);
  await storage.setData(data);
  res.json(data);
});

app.post('/api/admin/gallery', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  const { src, caption } = req.body || {};
  if (!src || !src.startsWith('data:image/')) return res.status(400).json({ error: 'invalid_image' });
  data.gallery = data.gallery || [];
  data.gallery.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    src,
    caption: String(caption || '').slice(0, 120)
  });
  await storage.setData(data);
  res.json(data);
});

app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  data.gallery = (data.gallery || []).filter(g => g.id !== req.params.id);
  await storage.setData(data);
  res.json(data);
});

app.post('/api/admin/services', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  const { title, description, mediaType, mediaSrc } = req.body || {};
  if (!title || !description || !mediaSrc) return res.status(400).json({ error: 'missing_fields' });
  if (!mediaSrc.startsWith('data:image/') && !mediaSrc.startsWith('data:video/')) {
    return res.status(400).json({ error: 'invalid_media' });
  }
  data.services = data.services || [];
  data.services.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    title: String(title).trim(),
    description: String(description).trim(),
    mediaType: mediaType === 'video' ? 'video' : 'image',
    mediaSrc
  });
  await storage.setData(data);
  res.json(data);
});

app.delete('/api/admin/services/:id', requireAdmin, async (req, res) => {
  const data = await storage.getData();
  data.services = (data.services || []).filter(s => s.id !== req.params.id);
  await storage.setData(data);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Rios Dent corriendo en el puerto ${PORT} (almacenamiento: ${storage.backend})`);
  if (!ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD no está configurada: el panel de administración va a rechazar todos los intentos de login hasta que la definas.');
  }
});
