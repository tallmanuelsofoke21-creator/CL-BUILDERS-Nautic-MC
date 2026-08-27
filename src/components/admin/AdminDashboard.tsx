import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  LogOut, 
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Hammer,
  Sparkles,
  UserCheck,
  Radio
} from 'lucide-react';
import { ApplicationItem, ApplicationStatus, ApplicationRole, ApplicationStats } from '../../types';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { DiscordSettingsModal } from './DiscordSettingsModal';

interface AdminDashboardProps {
  token: string;
  adminUsername: string;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUsername,
  onLogout,
  onNavigateHome,
}) => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pendientes: 0,
    aceptadas: 0,
    rechazadas: 0,
    staffCount: 0,
    builderCount: 0,
    recentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscordSettings, setShowDiscordSettings] = useState(false);

  // Filters & Search (Default to PENDIENTE so the main queue only shows pending applications)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('PENDIENTE');
  const [roleFilter, setRoleFilter] = useState<'ALL' | ApplicationRole>('ALL');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'age_desc' | 'minecraft'>('newest');

  // Quick Action notification toast
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal inspection
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (sortOption) params.append('sort', sortOption);

      const res = await fetch(`/api/admin/applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Error al cargar postulaciones.');
      }

      const data = await res.json();
      setApplications(data);
    } catch (err) {
      setError('Error al obtener la lista de postulaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchApplications();
  }, [statusFilter, roleFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchApplications();
  };

  // Quick direct status toggle from row
  const handleQuickStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const savedStaffMc = localStorage.getItem('staff_reviewer_mc') || adminUsername || 'Staff Directivo';
      const savedStaffDc = localStorage.getItem('staff_reviewer_dc') || adminUsername || 'Staff Directivo';
      const defaultReason = newStatus === 'ACEPTADA'
        ? 'Aceptada rápidamente desde el panel de administración.'
        : 'Rechazada rápidamente desde el panel de administración.';

      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: defaultReason,
          reviewer_minecraft: savedStaffMc,
          reviewer_discord: savedStaffDc,
          notify_discord: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const updated = data.application as ApplicationItem;
        
        // If viewing PENDIENTE, immediately remove the resolved postulation from the list
        if (statusFilter === 'PENDIENTE') {
          setApplications((prev) => prev.filter((a) => a.id !== appId));
        } else if (statusFilter === 'ACEPTADA' && newStatus !== 'ACEPTADA') {
          setApplications((prev) => prev.filter((a) => a.id !== appId));
        } else if (statusFilter === 'RECHAZADA' && newStatus !== 'RECHAZADA') {
          setApplications((prev) => prev.filter((a) => a.id !== appId));
        } else {
          setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
        }

        fetchStats();
        setActionNotice({
          text: `Postulación #${appId} ${newStatus === 'ACEPTADA' ? 'ACEPTADA' : 'RECHAZADA'} y quitada de pendientes.${data.discord?.sent ? ' (Notificación enviada a Discord)' : ''}`,
          type: 'success',
        });
      } else {
        setActionNotice({
          text: data.error || `Error al actualizar la postulación a ${newStatus}.`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error in quick status change:', err);
      setActionNotice({
        text: 'Error de conexión con el servidor.',
        type: 'error',
      });
    }
  };

  const handleResetSeed = async () => {
    if (window.confirm('¿Deseas reestablecer los datos de ejemplo iniciales (Staff y Builders)?')) {
      try {
        setRefreshing(true);
        await fetch('/api/admin/seed', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchStats();
        await fetchApplications();
        setActionNotice({
          text: 'Datos de muestra reestablecidos con éxito.',
          type: 'info',
        });
      } catch (err) {
        console.error('Error resetting seed:', err);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return;

    const headers = [
      'ID',
      'Rol',
      'Discord User',
      'Discord ID',
      'Minecraft Nick',
      'Edad',
      'Estado',
      'Fecha Creacion',
    ];

    const rows = applications.map((a) => [
      a.id,
      a.role,
      `"${a.discord_username.replace(/"/g, '""')}"`,
      `"${a.discord_id}"`,
      `"${a.minecraft_username.replace(/"/g, '""')}"`,
      a.age,
      a.status,
      `"${new Date(a.created_at).toLocaleString('es-ES')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `postulaciones_nautic_mc_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'ACEPTADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ACEPTADA
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            RECHAZADA
          </span>
        );
      case 'PENDIENTE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            PENDIENTE
          </span>
        );
    }
  };

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-blue-500/40 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{actionNotice.text}</span>
        </div>
      )}

      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2638] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            Panel de Administración y Moderación
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Gestión de Postulaciones (Staff & Builders)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Conectado como <strong className="text-slate-200">{adminUsername}</strong> • Servidor CL | BUILDERS Nautic MC
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Discord Webhook Settings Button */}
          <button
            id="admin-btn-discord-settings"
            onClick={() => setShowDiscordSettings(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#8a95ff] hover:text-white border border-[#5865F2]/40 transition-colors text-xs font-bold flex items-center gap-2"
            title="Configurar Webhook de Discord"
          >
            <Radio className="w-4 h-4 text-[#5865F2]" />
            <span>Webhook Discord</span>
          </button>

          <button
            id="admin-btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs flex items-center gap-1.5"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            id="admin-btn-export"
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs flex items-center gap-1.5"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            id="admin-btn-logout"
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`bg-[#121620] border rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-blue-500 bg-blue-950/10 ring-1 ring-blue-500/50' : 'border-[#1e2638] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Postulaciones
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            {stats.total}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span className="text-amber-400 font-semibold">{stats.builderCount || 0} Builders</span>
            <span>•</span>
            <span className="text-blue-400 font-semibold">{stats.staffCount || 0} Staff</span>
          </div>
        </div>

        {/* Pendientes */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PENDIENTE' ? 'ALL' : 'PENDIENTE')}
          className={`bg-[#121620] border rounded-2xl p-5 shadow-lg cursor-pointer transition-all ${
            statusFilter === 'PENDIENTE' ? 'border-amber-500 bg-amber-950/10 ring-1 ring-amber-500/50' : 'border-[#1e2638] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 mt-3">
            {stats.pendientes}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Esperando evaluación directiva
          </span>
        </div>

        {/* Aceptadas */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ACEPTADA' ? 'ALL' : 'ACEPTADA')}
          className={`bg-[#121620] border rounded-2xl p-5 shadow-lg cursor-pointer transition-all ${
            statusFilter === 'ACEPTADA' ? 'border-emerald-500 bg-emerald-950/10 ring-1 ring-emerald-500/50' : 'border-[#1e2638] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Aceptadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-3">
            {stats.aceptadas}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Aprobados para entrevista/prueba
          </span>
        </div>

        {/* Rechazadas */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'RECHAZADA' ? 'ALL' : 'RECHAZADA')}
          className={`bg-[#121620] border rounded-2xl p-5 shadow-lg cursor-pointer transition-all ${
            statusFilter === 'RECHAZADA' ? 'border-rose-500 bg-rose-950/10 ring-1 ring-rose-500/50' : 'border-[#1e2638] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Rechazadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-rose-400 mt-3">
            {stats.rechazadas}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            No cumplen requisitos mínimos
          </span>
        </div>
      </div>

      {/* Search, Filter Bar & Sort Controls */}
      <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Discord, Discord ID, Minecraft o ID (ej: CL-BLD-92140)..."
                className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              id="admin-search-btn"
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Buscar
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTimeout(fetchApplications, 50);
                }}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Limpiar
              </button>
            )}
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Ordenar por:</span>
            <select
              id="admin-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-[#0b0e16] border border-[#222c3f] rounded-xl px-3 py-2.5 text-xs text-white focus:border-blue-500"
            >
              <option value="newest">Más recientes primero</option>
              <option value="oldest">Más antiguas primero</option>
              <option value="age_desc">Mayor edad</option>
              <option value="minecraft">Nick de Minecraft (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Dual Filter Tabs: Roles & Statuses */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1e2638]">
          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <span className="text-slate-500 mr-1 text-[11px] uppercase tracking-wider">Rol:</span>
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-500 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              TODOS LOS ROLES
            </button>

            <button
              onClick={() => setRoleFilter('BUILDER')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                roleFilter === 'BUILDER'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/60 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              BUILDERS ({stats.builderCount || 0})
            </button>

            <button
              onClick={() => setRoleFilter('STAFF')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                roleFilter === 'STAFF'
                  ? 'bg-blue-600 text-white border-blue-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/60 text-blue-400 border-blue-500/30 hover:bg-blue-500/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              STAFF ({stats.staffCount || 0})
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <span className="text-slate-500 mr-1 text-[11px] uppercase tracking-wider">Estado:</span>
            
            <button
              onClick={() => setStatusFilter('PENDIENTE')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'PENDIENTE'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/60 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({stats.pendientes})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACEPTADA')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ACEPTADA'
                  ? 'bg-emerald-600 text-white border-emerald-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/60 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aceptadas ({stats.aceptadas})</span>
            </button>

            <button
              onClick={() => setStatusFilter('RECHAZADA')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'RECHAZADA'
                  ? 'bg-rose-600 text-white border-rose-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/60 text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazadas ({stats.rechazadas})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm'
                  : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <span>Todas ({stats.total})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#121620] border border-[#1e2638] rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Cargando postulaciones...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4 animate-in fade-in">
            {statusFilter === 'PENDIENTE' ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-extrabold text-white">🎉 ¡Excelente! No hay postulaciones pendientes</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Todas las postulaciones han sido evaluadas y procesadas por el equipo directivo.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('ACEPTADA')}
                    className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ver Aceptadas ({stats.aceptadas})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('RECHAZADA')}
                    className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Ver Rechazadas ({stats.rechazadas})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    Ver Todas ({stats.total})
                  </button>
                </div>
              </>
            ) : (
              <>
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No se encontraron postulaciones</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No hay solicitudes que coincidan con los filtros seleccionados.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('PENDIENTE');
                    setRoleFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0b0e16] border-b border-[#1e2638] text-xs uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Discord</th>
                  <th className="px-5 py-4">Discord ID</th>
                  <th className="px-5 py-4">Minecraft</th>
                  <th className="px-5 py-4 text-center">Edad</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4 text-right">Acción Rápida & Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/70">
                {applications.map((app) => {
                  const isBuilder = app.role === 'BUILDER';
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-[#161c2b]/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      {/* ID */}
                      <td className="px-5 py-4 font-mono text-xs font-bold whitespace-nowrap">
                        <span className={isBuilder ? 'text-amber-400' : 'text-blue-400'}>
                          {app.id}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          isBuilder 
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                            : 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {isBuilder ? <Hammer className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {isBuilder ? 'BUILDER' : 'STAFF'}
                        </span>
                      </td>

                      {/* Discord */}
                      <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                        {app.discord_username}
                      </td>

                      {/* Discord ID */}
                      <td className="px-5 py-4 text-xs font-mono text-slate-400 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span>{app.discord_id}</span>
                          <button
                            onClick={() => handleCopy(app.id, app.discord_id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                            title="Copiar Discord ID"
                          >
                            {copiedMap[app.id] ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Minecraft */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://mc-heads.net/avatar/${app.minecraft_username}/20`}
                            alt="Skin"
                            className="w-5 h-5 rounded bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="font-semibold text-white">{app.minecraft_username}</span>
                        </div>
                      </td>

                      {/* Edad */}
                      <td className="px-5 py-4 text-center font-bold text-slate-200">
                        {app.age}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(app.created_at)}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Accept */}
                          {app.status !== 'ACEPTADA' && (
                            <button
                              id={`quick-accept-${app.id}`}
                              onClick={() => handleQuickStatusChange(app.id, 'ACEPTADA')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold transition-all"
                              title="Aceptar directamente"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Reject */}
                          {app.status !== 'RECHAZADA' && (
                            <button
                              id={`quick-reject-${app.id}`}
                              onClick={() => handleQuickStatusChange(app.id, 'RECHAZADA')}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all"
                              title="Rechazar directamente"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Open Full Detail Modal */}
                          <button
                            id={`btn-view-${app.id}`}
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ml-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Revisar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discord Settings Modal */}
      {showDiscordSettings && (
        <DiscordSettingsModal
          adminToken={token}
          onClose={() => setShowDiscordSettings(false)}
          onSettingsSaved={() => {
            setActionNotice({ text: 'Configuración de Discord guardada con éxito.', type: 'success' });
          }}
        />
      )}

      {/* Modal Inspector */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          adminToken={token}
          onClose={() => setSelectedApp(null)}
          onStatusUpdated={(updated) => {
            if (statusFilter === 'PENDIENTE' && updated.status !== 'PENDIENTE') {
              setApplications((prev) => prev.filter((a) => a.id !== updated.id));
            } else if (statusFilter === 'ACEPTADA' && updated.status !== 'ACEPTADA') {
              setApplications((prev) => prev.filter((a) => a.id !== updated.id));
            } else if (statusFilter === 'RECHAZADA' && updated.status !== 'RECHAZADA') {
              setApplications((prev) => prev.filter((a) => a.id !== updated.id));
            } else {
              setApplications((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
            }
            fetchStats();
          }}
          onDelete={async (deletedId) => {
            try {
              const res = await fetch(`/api/admin/applications/${deletedId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                setApplications((prev) => prev.filter((a) => a.id !== deletedId));
                setSelectedApp(null);
                fetchStats();
              }
            } catch (err) {
              console.error('Error deleting application:', err);
            }
          }}
        />
      )}
    </div>
  );
};
