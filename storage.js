// storage.js
// Guarda toda la información editable del sitio (contacto, sede principal,
// otras sedes, galería) en un único objeto JSON.
//
// - Si existe la variable de entorno DATABASE_URL, se usa una base de datos
//   Postgres (recomendado para producción: los datos no se pierden nunca,
//   ni siquiera si Render reinicia o redeploya el servicio).
// - Si NO existe DATABASE_URL, se guarda en un archivo local
//   data/site-data.json (más simple, pero en el plan gratuito de Render el
//   disco es efímero: los datos pueden perderse en cada redeploy).
//
// En ambos casos la forma de usar el módulo es la misma:
//   const storage = require('./storage');
//   const data = await storage.getData();
//   await storage.setData(newData);

const fs = require('fs');
const path = require('path');

const DEFAULT_DATA = {
  contactEmail: 'hola@dentrics.com',
  contactPhone: '59898388129',
  primarySedeId: 'sede-principal',
  sedes: [
    { id: 'sede-principal', name: 'Sede principal', address: 'Av. Santa Fe 1234, Buenos Aires, Argentina', phone: '59898388129' }
  ],
  gallery: [],
  services: [
    { id: 'srv-ortodoncia', title: 'Ortodoncia', description: 'Corregimos la posición de tus dientes con brackets o alineadores, para una sonrisa más pareja y saludable.', mediaType: 'image', mediaSrc: 'assets/img/ortodoncia.jpg' },
    { id: 'srv-implantes', title: 'Implantes dentales', description: 'Reemplazamos piezas perdidas con implantes de alta precisión, planificados digitalmente.', mediaType: 'image', mediaSrc: 'assets/img/implantes.jpg' },
    { id: 'srv-limpieza', title: 'Limpieza dental', description: 'Limpieza profesional para eliminar sarro y placa, cuidando tu salud bucal en cada visita.', mediaType: 'image', mediaSrc: 'assets/img/limpieza.jpg' },
    { id: 'srv-protesis', title: 'Prótesis dental', description: 'Coronas, puentes y prótesis a medida para recuperar función y estética.', mediaType: 'image', mediaSrc: 'assets/img/protesis.jpg' },
    { id: 'srv-pediatria', title: 'Odontopediatría', description: 'Atención especializada y amigable para los más chicos de la familia.', mediaType: 'image', mediaSrc: 'assets/img/pediatria.jpg' }
  ],
  theme: {
    accent: '#c6941f',     // color principal (botones, detalles) — dorado
    background: '#123339', // color de fondo de toda la página — verde oscuro
    text: '#eaf4f1'        // color de letras y títulos
  },
  images: {
    hero: null,
    clinic: null,
    doctor: null
  },
  texts: {
    heroText: 'Recibe el mejor cuidado para tus dientes con nuestro equipo experto. Nos aseguramos de que tu sonrisa se mantenga sana y hermosa.',
    servicesLead: 'Conocé en detalle cada tratamiento, con fotos o videos reales de nuestro consultorio.',
    clinicLead: 'Tratamientos modernos adaptados a tus necesidades, para una experiencia odontológica cómoda y satisfactoria.',
    expertTitle: 'Atención experta',
    expertText: 'Nuestros odontólogos se capacitan continuamente para brindarte el más alto nivel de servicios dentales.',
    locationLead: 'Te esperamos en nuestro consultorio. Consultá cómo llegar desde donde estés con un solo toque.'
  }
};

const usingPostgres = !!process.env.DATABASE_URL;

let impl;

if (usingPostgres) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const ready = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_data (
        id INT PRIMARY KEY DEFAULT 1,
        payload JSONB NOT NULL
      );
    `);
    const { rows } = await pool.query('SELECT payload FROM site_data WHERE id = 1');
    if (rows.length === 0) {
      await pool.query('INSERT INTO site_data (id, payload) VALUES (1, $1)', [DEFAULT_DATA]);
    }
  })();

  impl = {
    async getData() {
      await ready;
      const { rows } = await pool.query('SELECT payload FROM site_data WHERE id = 1');
      return rows[0] ? { ...DEFAULT_DATA, ...rows[0].payload } : DEFAULT_DATA;
    },
    async setData(data) {
      await ready;
      await pool.query('UPDATE site_data SET payload = $1 WHERE id = 1', [data]);
      return data;
    },
    backend: 'postgres'
  };
} else {
  const filePath = path.join(__dirname, 'data', 'site-data.json');

  function ensureFile() {
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(DEFAULT_DATA, null, 2));
  }

  impl = {
    async getData() {
      ensureFile();
      try {
        return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
      } catch {
        return DEFAULT_DATA;
      }
    },
    async setData(data) {
      ensureFile();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return data;
    },
    backend: 'file'
  };
}

module.exports = impl;
