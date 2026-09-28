# Rios Dent — sitio + panel de administración

## 🚀 Arranque rápido (sin escribir comandos)

1. Descomprimí este zip completo en una carpeta (por ejemplo, en el Escritorio).
2. Necesitás tener [Node.js](https://nodejs.org) instalado (versión 18+). Si no
   lo tenés, instalalo primero (es un instalador normal, "Siguiente, Siguiente,
   Finalizar").
3. Adentro de la carpeta, hacé **doble clic en `iniciar.bat`** (Windows) o
   `iniciar.sh` (Mac/Linux).
4. La primera vez va a tardar un minuto instalando cosas; después se abre solo
   en tu navegador en `http://localhost:3000`.
5. Para el panel de administración: agregá `#admin-riosdent` al final de la
   dirección. La clave ya viene puesta: **`RiosDent2026!`** (podés cambiarla,
   ver más abajo).
6. Para apagar el sitio, cerrá esa ventana negra que se abrió.

Esto es para **probarlo en tu computadora**. Para que lo vea todo el mundo en
internet (tus pacientes), seguí la guía de Render más abajo — ahí sí hay que
hacer algunos pasos manuales, pero solo una vez.

---

Sitio de la clínica con un panel privado para actualizar el email, el
WhatsApp, la sede principal, agregar sedes nuevas y subir fotos a la
galería. **A diferencia de la versión anterior (artifact), acá los
cambios quedan guardados en el servidor: los ve cualquier persona que
visite el sitio, no solo vos.**

## 1. Cómo entrar al panel de administración

1. Andá a tu sitio publicado y agregá `#admin-riosdent` al final de la URL.
   Ejemplo: `https://riosdent-clinica.onrender.com/#admin-riosdent`
2. Ingresá la clave configurada en la variable de entorno `ADMIN_PASSWORD`.
   En este zip ya viene con la clave `RiosDent2026!` puesta en el archivo
   `.env` para que puedas probarlo sin configurar nada. **Antes de
   publicarlo en internet (Render), cambiala por una tuya** — ver la
   sección "Cambiar la clave" más abajo.
3. Desde ahí podés (todo se guarda en el servidor y lo ve cualquier visitante):
   - **Colores de la página**: elegir el color principal (dorado), el de fondo
     (verde) y el de letras/títulos. Es UN color para toda la página; podés
     escribir el código (ej. `#d63a3a`) o usar el selector, y volver a los
     colores originales cuando quieras.
   - **Contacto**: cambiar email y WhatsApp.
   - **Sedes y ubicación**: agregar, **editar** y **quitar** cualquier sede
     (incluida la original), con su dirección. La marcada como *Principal*
     sale en el mapa de "Ubicación"; las demás aparecen como tarjetas.
   - **Servicios** (una sola lista): agregar, **editar** (foto/video, título,
     descripción) y **quitar** cualquier servicio, incluidos los que vienen de fábrica.
   - **Imágenes principales**: cambiar la foto de portada, la de la clínica y
     la del especialista (con botón "Restaurar original").
   - **Textos de la página**: editar los textos principales (portada,
     servicios, clínica, atención experta, ubicación).
   - **Galería**: subir y quitar fotos.
4. El enlace `#admin-riosdent` no aparece en ningún menú — es "secreto"
   en el sentido de que nadie lo va a encontrar navegando, pero no es
   seguridad real por sí solo. La clave (`ADMIN_PASSWORD`) es lo que
   realmente protege el panel: elegí una clave larga y no la compartas
   por canales públicos.

## 2. Probarlo en tu computadora (opcional, antes de subirlo)

Necesitás tener [Node.js](https://nodejs.org) instalado (versión 18 o
superior).

```bash
npm install
cp .env.example .env
# abrí .env y poné una clave en ADMIN_PASSWORD
npm start
```

Abrí `http://localhost:3000` en el navegador. El sitio va a guardar los
datos en `data/site-data.json` mientras no configures una base de datos.

## 3. Subir el proyecto a GitHub

Render despliega desde un repositorio de GitHub (o GitLab/Bitbucket).

1. Creá un repositorio nuevo y vacío en [github.com](https://github.com/new).
2. Desde la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Sitio Rios Dent"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

## 4. Desplegar en Render (gratis)

1. Creá una cuenta en [render.com](https://render.com) (no pide tarjeta
   para el plan gratuito).
2. **New +** → **Web Service** → conectá tu repositorio de GitHub.
3. Configuración del servicio:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. En la pestaña **Environment**, agregá la variable:
   - `ADMIN_PASSWORD` → la clave que vas a usar para entrar al panel.
5. Click en **Create Web Service**. En unos minutos vas a tener una URL
   como `https://riosdent-clinica.onrender.com`.

También incluí un archivo `render.yaml` en el proyecto: si en vez de
"Web Service" elegís **New + → Blueprint** y apuntás al repo, Render lee
ese archivo y te pide directamente las variables de entorno.

### ⚠️ Importante sobre el plan gratuito de Render

- El servicio gratuito **se "duerme" después de 15 minutos sin visitas**
  y tarda unos segundos en reactivarse con la primera visita siguiente.
  Es normal, no es un error.
- El **disco del plan gratuito no es permanente**: si guardaste los
  datos solo en el archivo `data/site-data.json` (sin base de datos),
  esa información puede perderse cada vez que Render vuelve a
  desplegar el servicio (por ejemplo, si actualizás el código).

Para que los datos del panel de administración **nunca se pierdan**,
seguí el paso 5.

## 5. Sobre subir videos en "Servicios"

Cuando creás un servicio con un video (en vez de foto), el archivo se
guarda codificado dentro del mismo JSON de datos — no hace falta
configurar nada extra para que funcione. Pero para que la página cargue
rápido y no falle el guardado:

- Usá videos **cortos** (unos pocos segundos a un minuto) y de **poco
  peso** (idealmente menos de 20-25 MB). Si es muy pesado, vas a ver el
  mensaje "Error al guardar" en el panel.
- Si necesitás videos largos o en alta calidad, lo ideal a futuro es
  subirlos a YouTube/Vimeo (no incluidos en privado) y pegar el link —
  eso es un cambio más grande que no está en esta versión, pero te lo
  puedo armar si lo necesitás.

## 6. (Recomendado) Conectar una base de datos gratuita para que los datos no se pierdan

La forma más simple y realmente gratis para siempre es usar
[Neon](https://neon.tech) (Postgres gratuito sin fecha de vencimiento):

1. Creá una cuenta gratis en [neon.tech](https://neon.tech) y un proyecto nuevo.
2. Copiá el **Connection String** que te da Neon (empieza con
   `postgresql://...`).
3. En Render, andá a tu servicio → **Environment** → agregá la variable:
   - `DATABASE_URL` → pegá ahí el connection string de Neon.
4. Guardá los cambios. Render va a reiniciar el servicio solo, y a
   partir de ese momento el sitio va a guardar todo (contacto, sedes,
   galería) en esa base de datos en vez de en el archivo local.

*(Alternativa: Render también ofrece una base Postgres propia gratuita,
pero esa vence a los 30 días y se borra si no la pasás a un plan pago —
por eso para "gratis para siempre" conviene Neon.)*

## Nota sobre los colores
Las tarjetas claras (por ejemplo la portada y el formulario de contacto) mantienen
letra oscura para que siempre se lean; el resto de la página usa el color de letras
que elijas. Si elegís letras y fondo muy parecidos, el panel te avisa del poco contraste.

## Estructura del proyecto

```
riosdent-clinica/
├── server.js          # servidor Express + API del panel admin
├── storage.js          # guarda los datos en archivo local o en Postgres
├── package.json
├── render.yaml          # configuración lista para Render (opcional)
├── .env.example
├── data/                # datos locales (si no usás base de datos)
└── public/
    ├── index.html
    ├── css/styles.css
    ├── js/script.js       (comportamiento del sitio)
    ├── js/theme.js        (colores: fondo / principal / letras)
    ├── js/cms.js          (contenido dinámico + panel admin)
    └── assets/img/       # fotos originales del sitio
```

## Cambiar la clave de administrador más adelante

Solo tenés que cambiar el valor de `ADMIN_PASSWORD` en Render
(**Environment** → editar la variable → **Save**). No hace falta tocar
el código ni volver a desplegar manualmente, Render reinicia el
servicio solo.
