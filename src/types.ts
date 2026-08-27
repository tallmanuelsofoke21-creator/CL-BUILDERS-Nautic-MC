export type ApplicationStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
export type ApplicationRole = 'STAFF' | 'BUILDER';

export interface BaseApplication {
  id: string;
  role: ApplicationRole;
  discord_username: string;
  discord_id: string;
  minecraft_username: string;
  age: number;
  status: ApplicationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewer_discord?: string;
  reviewer_minecraft?: string;
  reviewed_at?: string;
  access_pin?: string;
  discord_notified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffApplication extends BaseApplication {
  role: 'STAFF';
  why_apply: string;
  available_time: string;
  about_user: string;
  server_experience: string;
  why_left?: string;
  why_choose_me: string;
  teamwork: string;
  chat_conflict: string;
  corrupt_staff: string;
}

export interface BuilderApplication extends BaseApplication {
  role: 'BUILDER';
  minecraft_discord_name: string; // 1. ¿Cuál es tu nombre de Minecraft/Discord?
  time_playing_mc: string; // 2. ¿Cuánto tiempo llevas jugando Minecraft?
  time_building_mc: string; // 3. ¿Cuánto tiempo llevas construyendo en Minecraft?
  building_level: string; // 4. ¿Qué nivel de construcción consideras que tienes?
  building_styles: string; // 5. ¿Qué estilos de construcción sabes hacer?
  previous_builder_exp: string; // 6. ¿Has sido Builder en algún otro servidor?
  teamwork_exp: string; // 7. ¿Tienes experiencia trabajando en equipo?
  weekly_time: string; // 8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente?
  tools_programs: string; // 9. ¿Qué programas o herramientas de construcción utilizas?
  why_join_builders: string; // 10. ¿Por qué quieres formar parte del equipo de Builders?
  contributions: string; // 11. ¿Qué aportarías al equipo de construcción?
  staff_modify_reaction: string; // 12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción?
  rules_commitment: string; // 13. ¿Te comprometes a respetar las normas del servidor y del equipo?
  additional_info?: string; // 14. ¿Hay algo más que quieras añadir sobre ti?
}

export type ApplicationItem = StaffApplication | BuilderApplication;

export interface StaffSubmissionData {
  role: 'STAFF';
  discord_username: string;
  discord_id: string;
  minecraft_username: string;
  age: number;
  why_apply: string;
  available_time: string;
  about_user: string;
  server_experience: string;
  why_left?: string;
  why_choose_me: string;
  teamwork: string;
  chat_conflict: string;
  corrupt_staff: string;
}

export interface BuilderSubmissionData {
  role: 'BUILDER';
  discord_username: string;
  discord_id: string;
  minecraft_username: string;
  age: number;
  minecraft_discord_name: string;
  time_playing_mc: string;
  time_building_mc: string;
  building_level: string;
  building_styles: string;
  previous_builder_exp: string;
  teamwork_exp: string;
  weekly_time: string;
  tools_programs: string;
  why_join_builders: string;
  contributions: string;
  staff_modify_reaction: string;
  rules_commitment: string;
  additional_info?: string;
}

export type ApplicationSubmissionData = StaffSubmissionData | BuilderSubmissionData;

export interface ApplicationStats {
  total: number;
  pendientes: number;
  aceptadas: number;
  rechazadas: number;
  staffCount: number;
  builderCount: number;
  recentCount: number;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

export interface PublicStatusResponse {
  id: string;
  role: ApplicationRole;
  discord_username: string;
  minecraft_username: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface ApplicantAuthResponse {
  success: boolean;
  token?: string;
  discord_id?: string;
  discord_username?: string;
  error?: string;
}

export interface MyApplicationsResponse {
  discord_id: string;
  discord_username: string;
  in_review: ApplicationItem[];
  history: ApplicationItem[];
}

export type AppView = 'home' | 'form' | 'status' | 'my-applications' | 'admin';

