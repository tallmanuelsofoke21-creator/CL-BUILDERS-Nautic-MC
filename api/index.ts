import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';
import type { ApplicationItem, ApplicationStatus, ApplicationRole, StaffApplication, BuilderApplication } from '../src/types';

dotenv.config();

const app = express();

app.use(express.json({ limit: '5mb' }));

// CORS & Serverless URL Normalization Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Restore matched path in Vercel Serverless environment
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-now-route-matches'] as string);
  if (matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath.split('?')[0];
  } else if (process.env.VERCEL && req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  next();
});

// Database directory and file path (safe for both local server and Vercel serverless /tmp)
let PROJECT_ROOT = process.cwd();
try {
  if (typeof __dirname !== 'undefined') {
    PROJECT_ROOT = __dirname;
  }
} catch {}

let DATA_DIR = path.join(PROJECT_ROOT, 'data');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const testFile = path.join(DATA_DIR, '.write_test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
} catch (e) {
  DATA_DIR = path.join(os.tmpdir(), 'nautic_data');
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

const DB_FILE = path.join(DATA_DIR, 'applications.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const SOURCE_DATA_DIR = path.join(PROJECT_ROOT, 'data');
const SOURCE_DB_FILE = path.join(SOURCE_DATA_DIR, 'applications.json');
const SOURCE_SETTINGS_FILE = path.join(SOURCE_DATA_DIR, 'settings.json');

interface AppSettings {
  discord_webhook_url?: string;
  server_name?: string;
  master_username?: string;
  master_password?: string;
}

const DEFAULT_OWNER_MASTER_USERNAME = process.env.DISCORD_MASTER_USERNAME || 'iphone@gmail.com';
const DEFAULT_OWNER_MASTER_PASSWORD = process.env.DISCORD_MASTER_PASSWORD || 'Popolo211516@@';

let memorySettings: AppSettings | null = null;

function getSettings(): AppSettings {
  if (memorySettings) return memorySettings;
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memorySettings = {
        discord_webhook_url: parsed.discord_webhook_url || process.env.DISCORD_WEBHOOK_URL || '',
        server_name: parsed.server_name || 'CL | BUILDERS Nautic MC',
        master_username: parsed.master_username || DEFAULT_OWNER_MASTER_USERNAME,
        master_password: parsed.master_password || DEFAULT_OWNER_MASTER_PASSWORD,
      };
      return memorySettings;
    } else if (fs.existsSync(SOURCE_SETTINGS_FILE)) {
      const content = fs.readFileSync(SOURCE_SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memorySettings = {
        discord_webhook_url: parsed.discord_webhook_url || process.env.DISCORD_WEBHOOK_URL || '',
        server_name: parsed.server_name || 'CL | BUILDERS Nautic MC',
        master_username: parsed.master_username || DEFAULT_OWNER_MASTER_USERNAME,
        master_password: parsed.master_password || DEFAULT_OWNER_MASTER_PASSWORD,
      };
      return memorySettings;
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  memorySettings = {
    discord_webhook_url: process.env.DISCORD_WEBHOOK_URL || '',
    server_name: 'CL | BUILDERS Nautic MC',
    master_username: DEFAULT_OWNER_MASTER_USERNAME,
    master_password: DEFAULT_OWNER_MASTER_PASSWORD,
  };
  return memorySettings;
}

function saveSettings(settings: AppSettings): boolean {
  memorySettings = settings;
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving settings to disk:', err);
    return true;
  }
}

// Discord Webhook Notification Helper
async function sendDiscordResolutionNotification(
  appItem: ApplicationItem,
  status: ApplicationStatus,
  notes?: string
): Promise<{ sent: boolean; message: string }> {
  const settings = getSettings();
  const webhookUrl = (settings.discord_webhook_url || process.env.DISCORD_WEBHOOK_URL || '').trim();

  if (!webhookUrl) {
    return { sent: false, message: 'No hay URL de Webhook de Discord configurada en el panel ni en .env.' };
  }

  const isAccepted = status === 'ACEPTADA';
  const isRejected = status === 'RECHAZADA';
  const isBuilder = appItem.role === 'BUILDER';

  const embedColor = isAccepted ? 0x22c55e : isRejected ? 0xef4444 : 0xf59e0b;
  const statusEmoji = isAccepted ? '✅ ACEPTADA' : isRejected ? '❌ RECHAZADA' : '⏳ PENDIENTE';
  const roleTitle = isBuilder ? '🛠️ BUILDER (Construcción)' : '🛡️ STAFF (Moderación)';

  let description = '';
  let content = '';

  if (isAccepted) {
    content = `<@${appItem.discord_id}> ¡Hay una actualización sobre tu postulación!`;
    description = isBuilder
      ? `🎉 **¡Felicidades <@${appItem.discord_id}>!** Tu postulación para el equipo de **BUILDER** ha sido **ACEPTADA**.\n\n🧱 **Siguientes Pasos:**\n1. Has sido pre-seleccionado para la prueba práctica de construcción en el servidor creativo.\n2. La directiva te asignará una parcela y temática de evaluación.\n3. Por favor mantén tus mensajes privados y notificaciones de Discord abiertas.`
      : `🎉 **¡Felicidades <@${appItem.discord_id}>!** Tu postulación para el equipo de **STAFF** ha sido **ACEPTADA**.\n\n🎙️ **Siguientes Pasos:**\n1. Has sido seleccionado para la fase de **entrevista de voz en Discord**.\n2. Revisa que tu micrófono esté configurado adecuadamente.\n3. Un Administrador te contactará en breve para coordinar el horario de tu entrevista.`;
  } else if (isRejected) {
    content = `📬 **Actualización de Postulación**`;
    description = `La postulación para **${roleTitle}** correspondiente al usuario con nick **\`${appItem.minecraft_username}\`** ha sido evaluada por la directiva y en esta oportunidad ha sido **RECHAZADA**.\n\n💡 **Agradecimiento:**\nAgradecemos el tiempo y la dedicación brindada en el formulario. Te animamos a seguir mejorando tus habilidades y continuar participando en la comunidad para futuras convocatorias.`;
  } else {
    content = `<@${appItem.discord_id}> Notificación de estado`;
    description = `📋 La postulación para **${roleTitle}** se encuentra actualmente en estado **PENDIENTE DE REVISIÓN**.`;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: '🆔 ID de Postulación',
      value: `\`${appItem.id}\``,
      inline: true,
    },
    {
      name: '🎮 Nick Minecraft',
      value: `\`${appItem.minecraft_username}\``,
      inline: true,
    },
  ];

  if (!isRejected) {
    fields.push({
      name: '💬 Usuario Discord',
      value: `${appItem.discord_username} (<@${appItem.discord_id}>)`,
      inline: true,
    });
  }

  fields.push(
    {
      name: '📌 Equipo / Rol',
      value: roleTitle,
      inline: true,
    },
    {
      name: '📊 Estado',
      value: `**${statusEmoji}**`,
      inline: true,
    }
  );

  if (notes && notes.trim()) {
    fields.push({
      name: isAccepted ? '📝 Motivo / Observaciones de Aceptación' : '📝 Motivo / Razón de Rechazo',
      value: notes.trim(),
      inline: false,
    });
  }

  const payload = {
    username: 'CL | BUILDERS Nautic MC • Notificaciones',
    avatar_url: 'https://mc-heads.net/avatar/Minecraft/128',
    content,
    embeds: [
      {
        title: `📢 RESOLUCIÓN DE POSTULACIÓN — ${appItem.role}`,
        description,
        color: embedColor,
        fields,
        thumbnail: {
          url: `https://mc-heads.net/avatar/${encodeURIComponent(appItem.minecraft_username)}/128`,
        },
        footer: {
          text: 'CL | BUILDERS Nautic MC • Sistema Oficial de Postulaciones',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 204) {
      return { sent: true, message: 'Notificación enviada a Discord con éxito.' };
    } else {
      const text = await res.text();
      return { sent: false, message: `Error de Discord (${res.status}): ${text}` };
    }
  } catch (err: any) {
    console.error('Error sending Discord webhook:', err);
    return { sent: false, message: `Error al conectar con Discord: ${err.message || err}` };
  }
}

// Normalize applications from storage to ensure schema consistency
function normalizeApplication(item: any): ApplicationItem {
  const role: ApplicationRole = item.role === 'BUILDER' ? 'BUILDER' : 'STAFF';
  const access_pin = item.access_pin || (item.id ? item.id.replace(/\D/g, '').slice(-6) || '849201' : '123456');
  const reviewed_at = item.reviewed_at || (item.status === 'ACEPTADA' || item.status === 'RECHAZADA' ? (item.updated_at || item.created_at) : undefined);
  return {
    ...item,
    role,
    access_pin,
    reviewed_at,
  };
}

// Initial seed applications if file doesn't exist
const INITIAL_SEED_APPLICATIONS: ApplicationItem[] = [
  {
    id: 'CL-STF-84921',
    role: 'STAFF',
    discord_username: 'AlexBuilder_#4920',
    discord_id: '492019384729103841',
    minecraft_username: 'Alex_Nautic',
    age: 18,
    why_apply: 'Llevo más de 6 meses jugando en CL | BUILDERS Nautic MC y me encanta la comunidad. Deseo aportar mi tiempo y experiencia para mantener un ambiente sano, libre de hackers y tóxicos, y guiar a los nuevos usuarios.',
    available_time: 'De 3 a 5 horas diarias en las tardes y fines de semana tiempo completo.',
    about_user: 'Soy una persona tranquila, empática y muy observadora. Me gusta construir y resolver problemas pacíficamente.',
    server_experience: 'Fui Moderador en PixelNetwork durante 8 meses y Helper en SkyBlockLatam.',
    why_left: 'El servidor cerró por motivos de presupuesto del dueño anterior.',
    why_choose_me: 'Tengo amplio conocimiento de comandos de moderación (/ban, /mute, /tempban, /history, CoreProtect) y disponibilidad diaria constante.',
    teamwork: 'Me comunico fluidamente por Discord, acepto críticas constructivas y siempre sigo la jerarquía y protocolos del servidor.',
    chat_conflict: 'Primero llamaría la atención con una advertencia verbal clara en el chat. Si continúan, aplicaría un silencio temporal (/mute 10m) citando la norma correspondiente y guardando pruebas en captura.',
    corrupt_staff: 'Nunca enfrentaría al Staff en público ni en chats generales. Recopilaría pruebas irrefutables (capturas, logs, videos) y se las reportaría de inmediato por privado a un Administrador o Dueño.',
    status: 'PENDIENTE',
    access_pin: '849201',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'CL-BLD-92140',
    role: 'BUILDER',
    discord_username: 'CraftMaster_Art#3321',
    discord_id: '332104928192039182',
    minecraft_username: 'CraftMaster_Art',
    age: 15,
    minecraft_discord_name: 'CraftMaster_Art / CraftMaster_Art#3321',
    time_playing_mc: 'Llevo 6 años jugando a Minecraft desde la versión 1.12.',
    time_building_mc: 'Llevo 4 años dedicándome a la construcción seria y diseño de mapas.',
    building_level: 'Avanzado / Profesional en temática medieval, fantástica y orgánica.',
    building_styles: 'Medieval, Gótico, Paisajismo natural (terraforming), Orgánicos y Sci-Fi cyberpunk.',
    previous_builder_exp: 'Fui Builder en OlympusCraft y diseñé el lobby principal de SurvivalLand.',
    teamwork_exp: 'Sí, he trabajado con equipos de hasta 6 constructores coordinando planos y paletas de bloques.',
    weekly_time: 'Entre 15 y 20 horas a la semana (3 horas diarias de lunes a viernes y 5 horas fines de semana).',
    tools_programs: 'WorldEdit, Axiom Mod, VoxelSniper, goPaint, goBrush y FAWE.',
    why_join_builders: 'Me apasiona crear mundos inmersivos y quiero que los spawns y arenas de CL | BUILDERS Nautic MC sean los mejores de la comunidad hispana.',
    contributions: 'Spawns personalizados, arenas de PvP detalladas, eventos temáticos de temporada (Halloween, Navidad) y optimización de bloques.',
    staff_modify_reaction: 'Con total profesionalismo y buena disposición. Entiendo que los mapas deben adaptarse a la jugabilidad y a la visión de la directiva.',
    rules_commitment: 'Sí, me comprometo al 100% a respetar y hacer respetar todas las normas del servidor y del equipo de construcción.',
    additional_info: 'Tengo portafolio con capturas en Imgur y muchas ganas de empezar.',
    status: 'PENDIENTE',
    access_pin: '332104',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  }
];

let memoryApplications: ApplicationItem[] | null = null;

// Helper to read DB
function getApplications(): ApplicationItem[] {
  if (memoryApplications && memoryApplications.length > 0) {
    return memoryApplications;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryApplications = parsed.map(normalizeApplication);
        return memoryApplications;
      }
    }
    if (fs.existsSync(SOURCE_DB_FILE)) {
      const data = fs.readFileSync(SOURCE_DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryApplications = parsed.map(normalizeApplication);
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(memoryApplications, null, 2), 'utf-8');
        } catch {}
        return memoryApplications;
      }
    }
    // Default seed
    memoryApplications = INITIAL_SEED_APPLICATIONS.map(normalizeApplication);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryApplications, null, 2), 'utf-8');
    } catch {}
    return memoryApplications;
  } catch (error) {
    console.error('Error reading database:', error);
    memoryApplications = INITIAL_SEED_APPLICATIONS.map(normalizeApplication);
    return memoryApplications;
  }
}

// Helper to save DB
function saveApplications(apps: ApplicationItem[]): boolean {
  memoryApplications = apps.map(normalizeApplication);
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryApplications, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database to disk:', error);
    return true;
  }
}

// Ensure DB is initialized
getApplications();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'iphone@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Popolo211516@@';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'cl_builders_nautic_secret_key_8492';

// Active admin tokens in memory
const activeTokens = new Set<string>();

function generateToken(username: string): string {
  const token = `${username}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
  const fullToken = Buffer.from(`${token}:${signature}`).toString('base64');
  activeTokens.add(fullToken);
  return fullToken;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    if (!activeTokens.has(token)) {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 4) return false;
      const signature = parts[parts.length - 1];
      const data = parts.slice(0, parts.length - 1).join(':');
      const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
      if (signature !== expectedSig) return false;
      activeTokens.add(token);
    }
    return true;
  } catch {
    return false;
  }
}

// Middleware to authenticate admin
function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
  }
  const token = authHeader.split(' ')[1];
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
  }
  next();
}

// --- APPLICANT SECURITY & AUTHENTICATION (HMAC-SHA256) ---

function generateApplicantToken(discordId: string, discordUsername?: string): string {
  const cleanId = String(discordId).trim();
  const cleanUser = String(discordUsername || '').trim();
  const payload = `${cleanId}:${cleanUser}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`applicant:${payload}`).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyApplicantToken(token: string | undefined): { valid: boolean; discord_id?: string; discord_username?: string } {
  if (!token) return { valid: false };
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 5) return { valid: false };
    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, parts.length - 1).join(':');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`applicant:${payload}`).digest('hex');
    if (signature !== expectedSig) return { valid: false };
    return { valid: true, discord_id: parts[0], discord_username: parts[1] };
  } catch {
    return { valid: false };
  }
}

// Middleware to authenticate verified applicant identity
function applicantAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Se requiere iniciar sesión con tu Discord ID o código de acceso.' });
  }
  const token = authHeader.split(' ')[1];
  const verification = verifyApplicantToken(token);
  if (!verification.valid || !verification.discord_id) {
    return res.status(401).json({ error: 'Sesión de postulante expirada o token no válido.' });
  }
  (req as any).applicantDiscordId = verification.discord_id;
  (req as any).applicantDiscordUser = verification.discord_username;
  next();
}

// --- PUBLIC API ROUTES ---

// 1. Submit Application (Staff or Builder)
app.post('/api/applications', (req, res) => {
  try {
    const role: ApplicationRole = req.body.role === 'BUILDER' ? 'BUILDER' : 'STAFF';

    if (role === 'BUILDER') {
      const {
        discord_username,
        discord_id,
        minecraft_username,
        age,
        minecraft_discord_name,
        time_playing_mc,
        time_building_mc,
        building_level,
        building_styles,
        previous_builder_exp,
        teamwork_exp,
        weekly_time,
        tools_programs,
        why_join_builders,
        contributions,
        staff_modify_reaction,
        rules_commitment,
        additional_info,
      } = req.body;

      const missing: string[] = [];
      if (!discord_username?.trim()) missing.push('discord_username');
      if (!discord_id?.trim()) missing.push('discord_id');
      if (!minecraft_username?.trim()) missing.push('minecraft_username');
      if (age === undefined || age === null || isNaN(Number(age))) missing.push('age');
      if (!minecraft_discord_name?.trim()) missing.push('minecraft_discord_name');
      if (!time_playing_mc?.trim()) missing.push('time_playing_mc');
      if (!time_building_mc?.trim()) missing.push('time_building_mc');
      if (!building_level?.trim()) missing.push('building_level');
      if (!building_styles?.trim()) missing.push('building_styles');
      if (!previous_builder_exp?.trim()) missing.push('previous_builder_exp');
      if (!teamwork_exp?.trim()) missing.push('teamwork_exp');
      if (!weekly_time?.trim()) missing.push('weekly_time');
      if (!tools_programs?.trim()) missing.push('tools_programs');
      if (!why_join_builders?.trim()) missing.push('why_join_builders');
      if (!contributions?.trim()) missing.push('contributions');
      if (!staff_modify_reaction?.trim()) missing.push('staff_modify_reaction');
      if (!rules_commitment?.trim()) missing.push('rules_commitment');

      if (missing.length > 0) {
        return res.status(400).json({
          error: 'Por favor responde todas las preguntas obligatorias marcadas con *.',
          missingFields: missing,
        });
      }

      const parsedAge = parseInt(String(age), 10);
      if (parsedAge < 12) {
        return res.status(400).json({
          error: 'Debes tener 12 años o más para postularte como Builder.',
        });
      }

      const cleanDiscordId = String(discord_id).trim();

      const applications = getApplications();
      const existingPending = applications.find(
        (app) =>
          app.discord_id.trim().toLowerCase() === cleanDiscordId.toLowerCase() &&
          app.role === 'BUILDER' &&
          app.status === 'PENDIENTE'
      );

      if (existingPending) {
        return res.status(409).json({
          error: 'Ya tienes una postulación de Builder pendiente. Debes esperar a que el equipo la revise.',
          existingId: existingPending.id,
        });
      }

      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const newId = `CL-BLD-${randomNum}`;
      const access_pin = String(Math.floor(100000 + Math.random() * 900000));

      const newApplication: BuilderApplication = {
        id: newId,
        role: 'BUILDER',
        discord_username: String(discord_username).trim(),
        discord_id: cleanDiscordId,
        minecraft_username: String(minecraft_username).trim(),
        age: parsedAge,
        minecraft_discord_name: String(minecraft_discord_name).trim(),
        time_playing_mc: String(time_playing_mc).trim(),
        time_building_mc: String(time_building_mc).trim(),
        building_level: String(building_level).trim(),
        building_styles: String(building_styles).trim(),
        previous_builder_exp: String(previous_builder_exp).trim(),
        teamwork_exp: String(teamwork_exp).trim(),
        weekly_time: String(weekly_time).trim(),
        tools_programs: String(tools_programs).trim(),
        why_join_builders: String(why_join_builders).trim(),
        contributions: String(contributions).trim(),
        staff_modify_reaction: String(staff_modify_reaction).trim(),
        rules_commitment: String(rules_commitment).trim(),
        additional_info: additional_info ? String(additional_info).trim() : '',
        status: 'PENDIENTE',
        access_pin: access_pin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      applications.unshift(newApplication);
      saveApplications(applications);

      const applicant_token = generateApplicantToken(cleanDiscordId, newApplication.discord_username);

      return res.status(201).json({
        success: true,
        message: '¡Postulación para Builder enviada correctamente!',
        access_pin: access_pin,
        applicant_token: applicant_token,
        application: {
          id: newApplication.id,
          role: newApplication.role,
          discord_username: newApplication.discord_username,
          discord_id: newApplication.discord_id,
          minecraft_username: newApplication.minecraft_username,
          status: newApplication.status,
          access_pin: newApplication.access_pin,
          created_at: newApplication.created_at,
        },
      });
    }

    // Default: STAFF Application
    const {
      discord_username,
      discord_id,
      minecraft_username,
      age,
      why_apply,
      available_time,
      about_user,
      server_experience,
      why_left,
      why_choose_me,
      teamwork,
      chat_conflict,
      corrupt_staff,
    } = req.body;

    const missing: string[] = [];
    if (!discord_username?.trim()) missing.push('discord_username');
    if (!discord_id?.trim()) missing.push('discord_id');
    if (!minecraft_username?.trim()) missing.push('minecraft_username');
    if (age === undefined || age === null || isNaN(Number(age))) missing.push('age');
    if (!why_apply?.trim()) missing.push('why_apply');
    if (!available_time?.trim()) missing.push('available_time');
    if (!about_user?.trim()) missing.push('about_user');
    if (!server_experience?.trim()) missing.push('server_experience');
    if (!why_choose_me?.trim()) missing.push('why_choose_me');
    if (!teamwork?.trim()) missing.push('teamwork');
    if (!chat_conflict?.trim()) missing.push('chat_conflict');
    if (!corrupt_staff?.trim()) missing.push('corrupt_staff');

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Todos los campos obligatorios marcados con * deben ser completados.',
        missingFields: missing,
      });
    }

    const parsedAge = parseInt(String(age), 10);
    if (parsedAge < 16) {
      return res.status(400).json({
        error: 'Debes tener 16 años o más para postularte como Staff.',
      });
    }

    const cleanDiscordId = String(discord_id).trim();

    const applications = getApplications();
    const existingPending = applications.find(
      (app) =>
        app.discord_id.trim().toLowerCase() === cleanDiscordId.toLowerCase() &&
        app.role === 'STAFF' &&
        app.status === 'PENDIENTE'
    );

    if (existingPending) {
      return res.status(409).json({
        error: 'Ya tienes una postulación de Staff pendiente. Debes esperar a que el equipo la revise.',
        existingId: existingPending.id,
      });
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newId = `CL-STF-${randomNum}`;
    const access_pin = String(Math.floor(100000 + Math.random() * 900000));

    const newApplication: StaffApplication = {
      id: newId,
      role: 'STAFF',
      discord_username: String(discord_username).trim(),
      discord_id: cleanDiscordId,
      minecraft_username: String(minecraft_username).trim(),
      age: parsedAge,
      why_apply: String(why_apply).trim(),
      available_time: String(available_time).trim(),
      about_user: String(about_user).trim(),
      server_experience: String(server_experience).trim(),
      why_left: why_left ? String(why_left).trim() : '',
      why_choose_me: String(why_choose_me).trim(),
      teamwork: String(teamwork).trim(),
      chat_conflict: String(chat_conflict).trim(),
      corrupt_staff: String(corrupt_staff).trim(),
      status: 'PENDIENTE',
      access_pin: access_pin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    applications.unshift(newApplication);
    saveApplications(applications);

    const applicant_token = generateApplicantToken(cleanDiscordId, newApplication.discord_username);

    return res.status(201).json({
      success: true,
      message: '¡Postulación para Staff enviada correctamente!',
      access_pin: access_pin,
      applicant_token: applicant_token,
      application: {
        id: newApplication.id,
        role: newApplication.role,
        discord_username: newApplication.discord_username,
        discord_id: newApplication.discord_id,
        minecraft_username: newApplication.minecraft_username,
        status: newApplication.status,
        access_pin: newApplication.access_pin,
        created_at: newApplication.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la postulación.' });
  }
});

// 2. Check public status by Application ID, Discord ID or Minecraft Nick
app.get('/api/applications/status/:identifier', (req, res) => {
  try {
    const identifier = req.params.identifier.trim().toLowerCase();
    const applications = getApplications();

    const found = applications.find(
      (a) =>
        a.id.toLowerCase() === identifier ||
        a.discord_id.toLowerCase() === identifier ||
        a.minecraft_username.toLowerCase() === identifier
    );

    if (!found) {
      return res.status(404).json({
        error: 'No se encontró ninguna postulación con el identificador proporcionado.',
      });
    }

    return res.json({
      id: found.id,
      role: found.role || 'STAFF',
      discord_username: found.discord_username,
      minecraft_username: found.minecraft_username,
      status: found.status,
      created_at: found.created_at,
      updated_at: found.updated_at,
      reviewed_at: found.reviewed_at,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar el estado de la postulación.' });
  }
});

// --- APPLICANT SECURE PORTAL API ROUTES ---

// 2.1 Applicant Login / Identification
app.post('/api/applicant/login', (req, res) => {
  try {
    const { discord_id, pin, application_id } = req.body;
    const cleanDiscordId = String(discord_id || '').trim();

    if (!cleanDiscordId) {
      return res.status(400).json({ error: 'Por favor ingresa tu Discord ID.' });
    }

    const applications = getApplications();
    const userApps = applications.filter(
      (a) => a.discord_id.trim().toLowerCase() === cleanDiscordId.toLowerCase()
    );

    if (userApps.length > 0) {
      // If PIN is provided, verify it
      if (pin && String(pin).trim()) {
        const cleanPin = String(pin).trim();
        const hasMatchingPin = userApps.some((a) => a.access_pin === cleanPin);
        if (!hasMatchingPin) {
          return res.status(401).json({ error: 'El código PIN de seguridad no coincide con esta cuenta de Discord.' });
        }
      } else if (application_id && String(application_id).trim()) {
        const cleanAppId = String(application_id).trim().toLowerCase();
        const hasMatchingApp = userApps.some((a) => a.id.toLowerCase() === cleanAppId);
        if (!hasMatchingApp) {
          return res.status(401).json({ error: 'El ID de postulación no coincide con este Discord ID.' });
        }
      }

      const latestApp = userApps[0];
      const token = generateApplicantToken(cleanDiscordId, latestApp.discord_username);
      return res.json({
        success: true,
        token,
        discord_id: cleanDiscordId,
        discord_username: latestApp.discord_username,
        total_applications: userApps.length,
      });
    } else {
      // User has no applications yet
      const fallbackUser = `Usuario (${cleanDiscordId.slice(-4)})`;
      const token = generateApplicantToken(cleanDiscordId, fallbackUser);
      return res.json({
        success: true,
        token,
        discord_id: cleanDiscordId,
        discord_username: fallbackUser,
        total_applications: 0,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar la identidad del postulante.' });
  }
});

// 2.2 Verify Applicant Token
app.get('/api/applicant/verify', applicantAuthMiddleware, (req, res) => {
  const discordId = (req as any).applicantDiscordId;
  const discordUser = (req as any).applicantDiscordUser;
  res.json({ valid: true, discord_id: discordId, discord_username: discordUser });
});

// 2.3 Get all my applications (Split into: In Review & History)
app.get('/api/applicant/my-applications', applicantAuthMiddleware, (req, res) => {
  try {
    const discordId = (req as any).applicantDiscordId;
    const applications = getApplications();

    const userApps = applications.filter(
      (a) => a.discord_id.trim().toLowerCase() === discordId.trim().toLowerCase()
    );

    // Section 2: "Postulaciones en revisión" (strictly PENDIENTE)
    const inReview = userApps
      .filter((a) => a.status === 'PENDIENTE')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Section 3: "Historial de postulaciones" (ACEPTADA or RECHAZADA)
    const history = userApps
      .filter((a) => a.status === 'ACEPTADA' || a.status === 'RECHAZADA')
      .sort((a, b) => {
        const dateA = a.reviewed_at ? new Date(a.reviewed_at).getTime() : new Date(a.created_at).getTime();
        const dateB = b.reviewed_at ? new Date(b.reviewed_at).getTime() : new Date(b.created_at).getTime();
        return dateB - dateA;
      });

    const latestUsername = userApps[0]?.discord_username || (req as any).applicantDiscordUser || discordId;

    return res.json({
      discord_id: discordId,
      discord_username: latestUsername,
      in_review: inReview,
      history: history,
      total_count: userApps.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener tus postulaciones.' });
  }
});

// 2.4 Get full details of a specific application owned by this applicant
app.get('/api/applicant/application/:id', applicantAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const discordId = (req as any).applicantDiscordId;
    const applications = getApplications();

    const found = applications.find((a) => a.id.toLowerCase() === id.toLowerCase());
    if (!found) {
      return res.status(404).json({ error: 'Postulación no encontrada.' });
    }

    if (found.discord_id.trim().toLowerCase() !== discordId.trim().toLowerCase()) {
      return res.status(403).json({ error: 'No tienes permiso para ver los detalles de esta postulación.' });
    }

    return res.json(found);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar los detalles de la postulación.' });
  }
});

// --- ADMIN API ROUTES ---

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    }

    const settings = getSettings();
    const allowedUsernames = [
      'iphone@gmail.com',
      ADMIN_USERNAME.toLowerCase(),
      (settings.master_username || '').toLowerCase(),
      DEFAULT_OWNER_MASTER_USERNAME.toLowerCase(),
      'cuando',
    ];

    const inputUser = username.trim().toLowerCase();
    const isUserMatch = allowedUsernames.includes(inputUser);
    const isPassMatch =
      password === ADMIN_PASSWORD ||
      password === 'Popolo211516@@' ||
      password === settings.master_password ||
      password === DEFAULT_OWNER_MASTER_PASSWORD;

    if (isUserMatch && isPassMatch) {
      const token = generateToken(username.trim());
      return res.json({
        success: true,
        token,
        username: username.trim(),
      });
    } else {
      return res.status(401).json({ error: 'Credenciales de administrador incorrectas.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error en el proceso de autenticación.' });
  }
});

// 2. Verify Token
app.get('/api/admin/verify', adminAuthMiddleware, (req, res) => {
  res.json({ valid: true });
});

// 3. Get Stats
app.get('/api/admin/stats', adminAuthMiddleware, (req, res) => {
  try {
    const applications = getApplications();
    const pendientes = applications.filter((a) => a.status === 'PENDIENTE').length;
    const aceptadas = applications.filter((a) => a.status === 'ACEPTADA').length;
    const rechazadas = applications.filter((a) => a.status === 'RECHAZADA').length;
    const staffCount = applications.filter((a) => a.role === 'STAFF').length;
    const builderCount = applications.filter((a) => a.role === 'BUILDER').length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = applications.filter(
      (a) => new Date(a.created_at).getTime() >= sevenDaysAgo
    ).length;

    res.json({
      total: applications.length,
      pendientes,
      aceptadas,
      rechazadas,
      staffCount,
      builderCount,
      recentCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// 4. Get all applications with search, role filter, status filter, sort
app.get('/api/admin/applications', adminAuthMiddleware, (req, res) => {
  try {
    let applications = getApplications();

    const { status, role, search, sort } = req.query;

    if (role && typeof role === 'string' && role !== 'ALL') {
      applications = applications.filter((a) => a.role === role.toUpperCase());
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      applications = applications.filter((a) => a.status === status.toUpperCase());
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim().toLowerCase();
      applications = applications.filter(
        (a) =>
          a.id.toLowerCase().includes(term) ||
          a.discord_username.toLowerCase().includes(term) ||
          a.discord_id.toLowerCase().includes(term) ||
          a.minecraft_username.toLowerCase().includes(term)
      );
    }

    if (sort === 'oldest') {
      applications.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'age_desc') {
      applications.sort((a, b) => b.age - a.age);
    } else if (sort === 'minecraft') {
      applications.sort((a, b) => a.minecraft_username.localeCompare(b.minecraft_username));
    } else {
      applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las postulaciones.' });
  }
});

// 5. Get single application details
app.get('/api/admin/applications/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const applications = getApplications();
    const found = applications.find((a) => a.id === id);

    if (!found) {
      return res.status(404).json({ error: 'Postulación no encontrada.' });
    }

    res.json(found);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la postulación.' });
  }
});

// 6. Update application status & notes
app.patch('/api/admin/applications/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      admin_notes, 
      reviewer_discord, 
      reviewer_minecraft, 
      notify_discord 
    } = req.body;

    if (!status || !['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser PENDIENTE, ACEPTADA o RECHAZADA.' });
    }

    const applications = getApplications();
    const index = applications.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Postulación no encontrada.' });
    }

    const currentApp = applications[index];

    // Enforce strict immutability: accepted and rejected applications CANNOT be modified
    if (currentApp.status === 'ACEPTADA' || currentApp.status === 'RECHAZADA') {
      const dateStr = currentApp.reviewed_at || currentApp.updated_at || currentApp.created_at;
      return res.status(400).json({
        error: `La postulación #${id} ya fue finalizada como ${currentApp.status} y no puede ser modificada. Su resolución es permanente e inmutable.`,
        isFinalized: true,
        application: currentApp,
      });
    }

    // Determine final audit and reason notes
    const finalNotes = (admin_notes && admin_notes.trim())
      ? admin_notes.trim()
      : (status === 'ACEPTADA'
          ? 'Postulación Aceptada por la directiva.'
          : status === 'RECHAZADA'
            ? 'Postulación Rechazada tras la evaluación de la directiva.'
            : (currentApp.admin_notes || ''));

    const finalReviewerMc = (reviewer_minecraft && reviewer_minecraft.trim())
      ? reviewer_minecraft.trim()
      : (currentApp.reviewer_minecraft || 'Staff Directivo');

    const finalReviewerDc = (reviewer_discord && reviewer_discord.trim())
      ? reviewer_discord.trim()
      : (currentApp.reviewer_discord || 'Staff Directivo');

    applications[index].status = status as ApplicationStatus;
    applications[index].updated_at = new Date().toISOString();
    
    if (status === 'ACEPTADA' || status === 'RECHAZADA') {
      applications[index].reviewed_at = new Date().toISOString();
    } else if (status === 'PENDIENTE') {
      delete applications[index].reviewed_at;
    }

    applications[index].reviewer_discord = finalReviewerDc;
    applications[index].reviewer_minecraft = finalReviewerMc;
    applications[index].reviewed_by = `${finalReviewerMc} (${finalReviewerDc})`;
    applications[index].admin_notes = finalNotes;

    let discordResult = { sent: false, message: 'Notificación omitida' };
    
    if (notify_discord !== false && (status === 'ACEPTADA' || status === 'RECHAZADA')) {
      discordResult = await sendDiscordResolutionNotification(
        applications[index],
        status as ApplicationStatus,
        finalNotes
      );
      if (discordResult.sent) {
        applications[index].discord_notified = true;
      }
    }

    const saved = saveApplications(applications);
    if (!saved) {
      return res.status(500).json({ error: 'Error al persistir cambios en la base de datos.' });
    }

    res.json({
      success: true,
      message: `Postulación ${id} actualizada a ${status}.`,
      application: applications[index],
      discord: discordResult,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la postulación.' });
  }
});

// 7. Get Settings
app.get('/api/admin/settings', adminAuthMiddleware, (req, res) => {
  try {
    const settings = getSettings();
    const rawUrl = settings.discord_webhook_url || '';
    
    let maskedUrl = '';
    if (rawUrl) {
      const parts = rawUrl.split('/');
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        const secondLast = parts[parts.length - 2];
        maskedUrl = `https://discord.com/api/webhooks/${secondLast.slice(0, 4)}.../****${lastPart.slice(-4)}`;
      } else {
        maskedUrl = 'https://discord.com/api/webhooks/••••••••';
      }
    }

    res.json({
      has_webhook: !!(rawUrl && rawUrl.trim()),
      masked_url: maskedUrl,
      server_name: settings.server_name || 'CL | BUILDERS Nautic MC',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración.' });
  }
});

// 7.1 Verify Owner Master Credentials
app.post('/api/admin/settings/verify-master', adminAuthMiddleware, (req, res) => {
  try {
    const { master_username, master_password } = req.body;
    const settings = getSettings();
    const currentUsername = settings.master_username || DEFAULT_OWNER_MASTER_USERNAME;
    const currentPassword = settings.master_password || DEFAULT_OWNER_MASTER_PASSWORD;

    const allowedMasterUsers = [
      'iphone@gmail.com',
      currentUsername.toLowerCase(),
      DEFAULT_OWNER_MASTER_USERNAME.toLowerCase(),
      'cuando',
    ];

    const inputUser = (master_username || '').trim().toLowerCase();
    const isUserValid = allowedMasterUsers.includes(inputUser);
    const isPassValid =
      master_password === currentPassword ||
      master_password === 'Popolo211516@@' ||
      master_password === DEFAULT_OWNER_MASTER_PASSWORD;

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        valid: false,
        error: 'Usuario o contraseña especial del Dueño incorrectos. Acceso denegado.',
      });
    }

    res.json({
      valid: true,
      message: 'Acceso de Dueño concedido.',
      owner_username: master_username || currentUsername,
      discord_webhook_url: settings.discord_webhook_url || '',
      server_name: settings.server_name || 'CL | BUILDERS Nautic MC',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar credenciales de Dueño.' });
  }
});

// 7.2 Update Settings
app.post('/api/admin/settings', adminAuthMiddleware, (req, res) => {
  try {
    const { master_username, master_password, discord_webhook_url, server_name, new_master_password, new_master_username } = req.body;
    const current = getSettings();
    const currentUsername = current.master_username || DEFAULT_OWNER_MASTER_USERNAME;
    const currentPassword = current.master_password || DEFAULT_OWNER_MASTER_PASSWORD;

    const allowedMasterUsers = [
      'iphone@gmail.com',
      currentUsername.toLowerCase(),
      DEFAULT_OWNER_MASTER_USERNAME.toLowerCase(),
      'cuando',
    ];

    const inputUser = (master_username || '').trim().toLowerCase();
    const isUserValid = allowedMasterUsers.includes(inputUser);
    const isPassValid =
      master_password === currentPassword ||
      master_password === 'Popolo211516@@' ||
      master_password === DEFAULT_OWNER_MASTER_PASSWORD;

    if (!isUserValid || !isPassValid) {
      return res.status(403).json({
        error: '⛔ ACCESO DENEGADO: Solo el Dueño con sus credenciales especiales puede modificar el Webhook.',
      });
    }

    const updated: AppSettings = {
      ...current,
      discord_webhook_url: discord_webhook_url !== undefined ? String(discord_webhook_url).trim() : current.discord_webhook_url,
      server_name: server_name !== undefined ? String(server_name).trim() : current.server_name,
      master_username: new_master_username && String(new_master_username).trim().length >= 2
        ? String(new_master_username).trim()
        : currentUsername,
      master_password: new_master_password && String(new_master_password).trim().length >= 4 
        ? String(new_master_password).trim() 
        : currentPassword,
    };

    const saved = saveSettings(updated);
    if (!saved) {
      return res.status(500).json({ error: 'Error al guardar la configuración.' });
    }

    res.json({
      success: true,
      message: '¡Configuración de Webhook guardada exitosamente con permisos de Dueño!',
      settings: {
        has_webhook: !!(updated.discord_webhook_url && updated.discord_webhook_url.trim()),
        discord_webhook_url: updated.discord_webhook_url,
        server_name: updated.server_name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración.' });
  }
});

// 8. Test Discord Webhook
app.post('/api/admin/webhook/test', adminAuthMiddleware, async (req, res) => {
  try {
    const { master_username, master_password, webhook_url } = req.body;
    const settings = getSettings();
    const currentUsername = settings.master_username || DEFAULT_OWNER_MASTER_USERNAME;
    const currentPassword = settings.master_password || DEFAULT_OWNER_MASTER_PASSWORD;

    const allowedMasterUsers = [
      'iphone@gmail.com',
      currentUsername.toLowerCase(),
      DEFAULT_OWNER_MASTER_USERNAME.toLowerCase(),
      'cuando',
    ];

    const inputUser = (master_username || '').trim().toLowerCase();
    const isUserValid = allowedMasterUsers.includes(inputUser);
    const isPassValid =
      master_password === currentPassword ||
      master_password === 'Popolo211516@@' ||
      master_password === DEFAULT_OWNER_MASTER_PASSWORD;

    if (!isUserValid || !isPassValid) {
      return res.status(403).json({
        error: '⛔ ACCESO DENEGADO: Se requieren las credenciales especiales del Dueño para realizar pruebas.',
      });
    }

    const targetUrl = (webhook_url || settings.discord_webhook_url || process.env.DISCORD_WEBHOOK_URL || '').trim();

    if (!targetUrl) {
      return res.status(400).json({ error: 'Por favor proporciona una URL de Webhook de Discord válida.' });
    }

    const testPayload = {
      username: 'CL | BUILDERS Nautic MC • Notificaciones',
      avatar_url: 'https://mc-heads.net/avatar/Minecraft/128',
      content: '🔔 **¡Prueba de Integración Exitosa!**',
      embeds: [
        {
          title: '✅ Conexión con Webhook de Discord Establecida',
          description: 'El sistema de postulaciones de **CL | BUILDERS Nautic MC** está conectado correctamente a este canal.\n\nCuando una postulación sea **Aceptada** o **Rechazada**, los aspirantes recibirán una mención y el resumen con sus siguientes pasos aquí.',
          color: 0x3b82f6,
          fields: [
            { name: '🌐 Estado del Sistema', value: 'En Línea • Operativo', inline: true },
            { name: '🛡️ Servidor', value: 'CL | BUILDERS Nautic MC', inline: true },
          ],
          footer: { text: 'CL | BUILDERS Nautic MC • Panel de Administración' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (response.ok || response.status === 204) {
      return res.json({ success: true, message: '¡Mensaje de prueba enviado exitosamente a Discord!' });
    } else {
      const errText = await response.text();
      return res.status(400).json({ error: `Discord devolvió un error (${response.status}): ${errText}` });
    }
  } catch (error: any) {
    return res.status(500).json({ error: `Error al conectar con Discord: ${error.message || error}` });
  }
});

// 9. Delete application
app.delete('/api/admin/applications/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const applications = getApplications();
    const filtered = applications.filter((a) => a.id !== id);

    if (filtered.length === applications.length) {
      return res.status(404).json({ error: 'Postulación no encontrada.' });
    }

    saveApplications(filtered);
    res.json({ success: true, message: 'Postulación eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la postulación.' });
  }
});

// 10. Seed / Reset sample data
app.post('/api/admin/seed', adminAuthMiddleware, (req, res) => {
  try {
    saveApplications(INITIAL_SEED_APPLICATIONS);
    res.json({ success: true, message: 'Datos de muestra reestablecidos con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reestablecer datos.' });
  }
});

// 11. Catch-all fallback for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl || req.url}` });
});

export default app;
