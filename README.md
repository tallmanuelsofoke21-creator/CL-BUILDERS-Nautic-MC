# ⚔️ CL | BUILDERS Nautic MC — Sistema Oficial de Postulaciones

Plataforma web moderna y completa para la gestión y evaluación de postulaciones de **Staff (Moderación)** y **Builders (Construcción)** para el servidor de Minecraft **CL | BUILDERS Nautic MC**.

---

## 🚀 Características Principales

- 📋 **Formularios Dinámicos**: Postulaciones especializadas para Moderación y Equipo de Construcción.
- 🔍 **Consulta de Estado en Tiempo Real**: Los aspirantes pueden consultar el estado de su postulación mediante su Nick de Minecraft o ID único.
- 🛡️ **Panel de Administración Protegido**:
  - Acceso con credenciales de seguridad (`/admin` o atajo secreto `Ctrl + Shift + S` / `Alt + S`).
  - Gestión completa de postulaciones (Aceptar, Rechazar, Ver detalles, Eliminar).
  - 🤖 **Evaluador con Inteligencia Artificial (Gemini AI)**: Análisis automático de respuestas y sugerencia de dictamen.
  - 💬 **Integración con Discord Webhook**: Notificaciones automáticas a canales de Discord con mención a los usuarios aceptados y mensajes profesionales respetando la privacidad.
  - ⚙️ **Panel de Configuración**: Modificación de Webhooks, credenciales y pruebas de integración en vivo.

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Canvas Confetti.
- **Backend / API**: Express, Node.js, Vercel Serverless Functions.
- **IA**: Google Gemini API (`@google/genai`).

---

## 💻 Ejecución Local

### 1. Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```env
GEMINI_API_KEY="tu_api_key_de_gemini"
ADMIN_USERNAME="Cuando"
ADMIN_PASSWORD="TuPasswordSegura"
ADMIN_SESSION_SECRET="tu_clave_secreta_aqui"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🐙 Guía para Subir a GitHub

Sigue estos comandos en tu terminal dentro de la carpeta del proyecto:

```bash
# 1. Inicializar el repositorio Git (si no está inicializado)
git init

# 2. Agregar todos los archivos al control de versiones
git add .

# 3. Crear el primer commit
git commit -m "feat: initial commit CL BUILDERS Nautic MC staff applications"

# 4. Renombrar la rama principal a main
git branch -M main

# 5. Conectar con tu repositorio de GitHub (reemplaza con tu URL de GitHub)
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git

# 6. Subir tus archivos a GitHub
git push -u origin main
```

---

## ⚡ Guía para Desplegar en Vercel

### Opción A: Desde la Web de Vercel (Recomendado)

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona e importa el repositorio de GitHub que acabas de subir.
4. En **Framework Preset**, selecciona **Vite**.
5. Despliega la sección **Environment Variables** y añade las siguientes variables:
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini (opcional para el evaluador IA).
   - `ADMIN_USERNAME`: Nombre de usuario para el panel de administración (ej: `Cuando`).
   - `ADMIN_PASSWORD`: Contraseña para el panel de administración.
   - `ADMIN_SESSION_SECRET`: Una clave secreta para firmar sesiones (ej: `cl_builders_secret_99812`).
   - `DISCORD_WEBHOOK_URL`: La URL del webhook de Discord donde llegarán las resoluciones.
6. Haz clic en **"Deploy"**. ¡Tu web estará en línea en segundos con HTTPS y dominio gratuito de Vercel!

### Opción B: Mediante Vercel CLI (Línea de comandos)

1. Instala Vercel CLI si no lo tienes:
   ```bash
   npm i -g vercel
   ```
2. Ejecuta el comando de despliegue:
   ```bash
   vercel
   ```
3. Sigue las instrucciones interactivas y luego para producción ejecuta:
   ```bash
   vercel --prod
   ```

---

## 🔒 Atajos de Teclado del Administrador

- **`Ctrl + Shift + S`** o **`Alt + S`**: Abre directamente el panel de acceso del Administrador / Staff desde cualquier lugar de la web.
