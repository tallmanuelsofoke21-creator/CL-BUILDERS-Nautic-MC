import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { ApplicationItem, ApplicationStatus, ApplicationRole, StaffApplication, BuilderApplication } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Database directory and file path (safe for both local server and Vercel serverless /tmp)
let DATA_DIR = path.join(process.cwd(), 'data');

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

const SOURCE_DATA_DIR = path.join(process.cwd(), 'data');
const SOURCE_DB_FILE = path.join(SOURCE_DATA_DIR, 'applications.json');
const SOURCE_SETTINGS_FILE = path.join(SOURCE_DATA_DIR, 'settings.json');

interface AppSettings {
  discord_webhook_url?: string;
  server_name?: string;
  master_username?: string;
  master_password?: string;
}

const DEFAULT_OWNER_MASTER_USERNAME = process.env.DISCORD_MASTER_USERNAME || 'Cuando';
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
    // Cuando es rechazada: NO se menciona al usuario de Discord ni se muestra su nombre real/tag, solo su Nick de Minecraft
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

  // Solo mostrar el Discord del usuario si la postulación fue ACEPTADA (para proteger la privacidad en caso de rechazo)
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

  // El nombre y nick del Staff evaluador NO salen en Discord (se quedan guardados únicamente en la web)

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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'CL-BLD-51829',
    role: 'BUILDER',
    discord_username: 'LuciaBuilds#8819',
    discord_id: '881920391829102938',
    minecraft_username: 'Lucia_MC',
    age: 16,
    minecraft_discord_name: 'Lucia_MC (LuciaBuilds#8819)',
    time_playing_mc: '5 años.',
    time_building_mc: '3 años.',
    building_level: 'Intermedio-Avanzado.',
    building_styles: 'Moderno, Rústico y Castillos.',
    previous_builder_exp: 'Builder en un servidor privado entre amigos y creadora de mapas para PlanetMinecraft.',
    teamwork_exp: 'Muchísima experiencia colaborando en proyectos compartidos.',
    weekly_time: '12 a 15 horas semanales.',
    tools_programs: 'WorldEdit y Axiom.',
    why_join_builders: 'Me encanta la estética del servidor y quiero crear zonas hermosas para que los jugadores exploren.',
    contributions: 'Pueblos temáticos, minijuegos y decoración de interiores.',
    staff_modify_reaction: 'Escucharía atentamente los comentarios y realizaría los cambios necesarios para que encaje con el servidor.',
    rules_commitment: 'Sí, totalmente comprometida.',
    additional_info: 'Cuento con micrófono de buena calidad y disponibilidad de voz en Discord.',
    status: 'ACEPTADA',
    admin_notes: 'Candidata aprobada para prueba de construcción en el servidor creativo.',
    reviewed_by: 'Administración',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'CL-STF-73019',
    role: 'STAFF',
    discord_username: 'ValenCraft#1102',
    discord_id: '582910482910482019',
    minecraft_username: 'ValenPvP_07',
    age: 17,
    why_apply: 'Quiero ayudar activamente al servidor en el turno de noche, donde suelo ver que hay menos moderadores activos y más dudas de jugadores.',
    available_time: '4 horas todos los días entre 20:00 y 00:00.',
    about_user: 'Soy estudiante de secundaria, muy responsable y fanático del diseño y la moderación en Minecraft.',
    server_experience: 'Ayudante en SurvivalHispania durante 1 año.',
    why_left: 'Renuncié por época de exámenes finales, pero ahora cuento con total disponibilidad horaria.',
    why_choose_me: 'Gran paciencia para atender dudas de nuevos usuarios y excelente redacción en español.',
    teamwork: 'Excelente, me encanta colaborar en eventos y coordinar con otros miembros del equipo.',
    chat_conflict: 'Intervengo amablemente pidiendo calmar los ánimos y trasladar las discrepancias al chat privado. Si insisten con insultos o spam, aplico la sanción correspondiente según el reglamento.',
    corrupt_staff: 'Documento todo en video y envío el reporte directamente a la directiva superior sin generar drama interno.',
    status: 'ACEPTADA',
    admin_notes: 'Excelente redacción y buen historial. Pasa a fase de entrevista de voz en Discord.',
    reviewed_by: 'Administración',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'CL-STF-62184',
    role: 'STAFF',
    discord_username: 'ToxicGamer99#0001',
    discord_id: '992019482710384711',
    minecraft_username: 'X_ShadowKill_X',
    age: 16,
    why_apply: 'Quiero rango para tener permisos de baneo y volar.',
    available_time: 'A veces 1 hora.',
    about_user: 'Juego bastante pvp.',
    server_experience: 'Ninguna.',
    why_left: '',
    why_choose_me: 'Porque sé mucho de pvp.',
    teamwork: 'Prefiero hacer las cosas por mi cuenta.',
    chat_conflict: 'Los baneo de una.',
    corrupt_staff: 'Lo insulto en el chat.',
    status: 'RECHAZADA',
    admin_notes: 'Respuestas no acordes a los estándares del servidor. Falta de madurez y conocimiento de normativas.',
    reviewed_by: 'Administración',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
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
        memoryApplications = parsed.map((item) => (!item.role ? { ...item, role: 'STAFF' } : item));
        return memoryApplications;
      }
    }
    if (fs.existsSync(SOURCE_DB_FILE)) {
      const data = fs.readFileSync(SOURCE_DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryApplications = parsed.map((item) => (!item.role ? { ...item, role: 'STAFF' } : item));
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(memoryApplications, null, 2), 'utf-8');
        } catch {}
        return memoryApplications;
      }
    }
    // Default seed
    memoryApplications = [...INITIAL_SEED_APPLICATIONS];
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryApplications, null, 2), 'utf-8');
    } catch {}
    return memoryApplications;
  } catch (error) {
    console.error('Error reading database:', error);
    memoryApplications = [...INITIAL_SEED_APPLICATIONS];
    return memoryApplications;
  }
}

// Helper to save DB
function saveApplications(apps: ApplicationItem[]): boolean {
  memoryApplications = apps;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(apps, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database to disk:', error);
    return true;
  }
}

// Ensure DB is initialized
getApplications();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Cuando';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Popolo211516@@';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'cl_builders_nautic_secret_key_8492';

// Active tokens in memory
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
      // Also verify cryptographic signature in case server restarted
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

      // Anti-Spam Check: Check if user already has a PENDING builder application
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      applications.unshift(newApplication);
      saveApplications(applications);

      return res.status(201).json({
        success: true,
        message: '¡Postulación para Builder enviada correctamente!',
        application: {
          id: newApplication.id,
          role: newApplication.role,
          discord_username: newApplication.discord_username,
          minecraft_username: newApplication.minecraft_username,
          status: newApplication.status,
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

    // Anti-Spam Check: Check if user already has a PENDING staff application
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    applications.unshift(newApplication);
    saveApplications(applications);

    return res.status(201).json({
      success: true,
      message: '¡Postulación para Staff enviada correctamente!',
      application: {
        id: newApplication.id,
        role: newApplication.role,
        discord_username: newApplication.discord_username,
        minecraft_username: newApplication.minecraft_username,
        status: newApplication.status,
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
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar el estado de la postulación.' });
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

    if (username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      const token = generateToken(ADMIN_USERNAME);
      return res.json({
        success: true,
        token,
        username: ADMIN_USERNAME,
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

    // Calculate recent count (last 7 days)
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

    // Filter by role
    if (role && typeof role === 'string' && role !== 'ALL') {
      applications = applications.filter((a) => a.role === role.toUpperCase());
    }

    // Filter by status
    if (status && typeof status === 'string' && status !== 'ALL') {
      applications = applications.filter((a) => a.status === status.toUpperCase());
    }

    // Search by discord username, discord id, minecraft username, or id
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

    // Sort
    if (sort === 'oldest') {
      applications.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'age_desc') {
      applications.sort((a, b) => b.age - a.age);
    } else if (sort === 'minecraft') {
      applications.sort((a, b) => a.minecraft_username.localeCompare(b.minecraft_username));
    } else {
      // Default: newest first
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
    const previousStatus = currentApp.status;

    // Validación obligatoria cuando se ACEPTA o RECHAZA:
    if (status === 'ACEPTADA' || status === 'RECHAZADA') {
      // 1. Razón / Motivo obligatorio
      if (!admin_notes || !admin_notes.trim()) {
        return res.status(400).json({
          error: `Es obligatorio indicar el motivo/razón de ${status === 'ACEPTADA' ? 'aceptación' : 'rechazo'}.`,
        });
      }

      // 2. Nick de Minecraft del Staff obligatorio
      if (!reviewer_minecraft || !reviewer_minecraft.trim()) {
        return res.status(400).json({
          error: 'Es obligatorio que el Staff ingrese su Nick de Minecraft para registrar la auditoría.',
        });
      }

      // 3. Usuario de Discord del Staff obligatorio
      if (!reviewer_discord || !reviewer_discord.trim()) {
        return res.status(400).json({
          error: 'Es obligatorio que el Staff ingrese su Usuario de Discord para registrar la auditoría.',
        });
      }

      // 4. Bloqueo para evitar aceptar/notificar dos veces por error al hacer clic doble
      if (previousStatus === status && currentApp.discord_notified) {
        return res.status(400).json({
          error: `Esta postulación ya ha sido marcada como ${status} y la notificación ya fue enviada previamente.`,
          alreadyResolved: true,
        });
      }
    }

    applications[index].status = status as ApplicationStatus;
    applications[index].updated_at = new Date().toISOString();
    applications[index].reviewed_at = new Date().toISOString();
    
    if (reviewer_discord?.trim() && reviewer_minecraft?.trim()) {
      applications[index].reviewer_discord = reviewer_discord.trim();
      applications[index].reviewer_minecraft = reviewer_minecraft.trim();
      applications[index].reviewed_by = `${reviewer_minecraft.trim()} (${reviewer_discord.trim()})`;
    }

    if (admin_notes !== undefined) {
      applications[index].admin_notes = admin_notes.trim();
    }

    // Dispatch Discord Webhook Notification when status is ACEPTADA or RECHAZADA (solo si no fue notificada antes para ese estado)
    let discordResult = { sent: false, message: 'Notificación omitida' };
    
    if (notify_discord !== false && (status === 'ACEPTADA' || status === 'RECHAZADA')) {
      // Si cambia de estado o no ha sido notificada
      if (previousStatus !== status || !currentApp.discord_notified) {
        discordResult = await sendDiscordResolutionNotification(
          applications[index],
          status as ApplicationStatus,
          admin_notes
        );
        if (discordResult.sent) {
          applications[index].discord_notified = true;
        }
      } else {
        discordResult = { sent: false, message: 'Ya se había notificado previamente este estado.' };
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

// 7. Get Settings (Masked for standard staff, requires Master Password to unlock details)
app.get('/api/admin/settings', adminAuthMiddleware, (req, res) => {
  try {
    const settings = getSettings();
    const rawUrl = settings.discord_webhook_url || '';
    
    // Mask URL for security so non-authorized staff cannot see or copy the webhook token
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

    const isUserValid = (master_username || '').trim().toLowerCase() === currentUsername.trim().toLowerCase();
    const isPassValid = (master_password || '') === currentPassword;

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        valid: false,
        error: 'Usuario o contraseña especial del Dueño incorrectos. Acceso denegado.',
      });
    }

    res.json({
      valid: true,
      message: 'Acceso de Dueño concedido.',
      owner_username: currentUsername,
      discord_webhook_url: settings.discord_webhook_url || '',
      server_name: settings.server_name || 'CL | BUILDERS Nautic MC',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar credenciales de Dueño.' });
  }
});

// 7.2 Update Settings (STRICTLY REQUIRES OWNER MASTER USERNAME & PASSWORD)
app.post('/api/admin/settings', adminAuthMiddleware, (req, res) => {
  try {
    const { master_username, master_password, discord_webhook_url, server_name, new_master_password, new_master_username } = req.body;
    const current = getSettings();
    const currentUsername = current.master_username || DEFAULT_OWNER_MASTER_USERNAME;
    const currentPassword = current.master_password || DEFAULT_OWNER_MASTER_PASSWORD;

    const isUserValid = (master_username || '').trim().toLowerCase() === currentUsername.trim().toLowerCase();
    const isPassValid = (master_password || '') === currentPassword;

    if (!isUserValid || !isPassValid) {
      return res.status(403).json({
        error: '⛔ ACCESO DENEGADO: Solo el Dueño (Cuando) con sus credenciales especiales puede modificar el Webhook.',
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

// 8. Test Discord Webhook (STRICTLY REQUIRES OWNER MASTER PASSWORD & USERNAME)
app.post('/api/admin/webhook/test', adminAuthMiddleware, async (req, res) => {
  try {
    const { master_username, master_password, webhook_url } = req.body;
    const settings = getSettings();
    const currentUsername = settings.master_username || DEFAULT_OWNER_MASTER_USERNAME;
    const currentPassword = settings.master_password || DEFAULT_OWNER_MASTER_PASSWORD;

    const isUserValid = (master_username || '').trim().toLowerCase() === currentUsername.trim().toLowerCase();
    const isPassValid = (master_password || '') === currentPassword;

    if (!isUserValid || !isPassValid) {
      return res.status(403).json({
        error: '⛔ ACCESO DENEGADO: Se requieren las credenciales especiales del Dueño (Cuando) para realizar pruebas.',
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


// --- VITE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CL | BUILDERS Nautic MC Server running on http://localhost:${PORT}`);
  });
}

// Only start standalone HTTP server when executed directly (not when imported in Vercel Serverless)
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
