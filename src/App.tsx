import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { ApplicationForm } from './components/ApplicationForm';
import { StatusCheckerView } from './components/StatusCheckerView';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Footer } from './components/Footer';
import { ApplicationRole } from './types';

export type AppView = 'home' | 'form' | 'status' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('Staff Admin');
  const [statusSearchId, setStatusSearchId] = useState<string>('');
  const [formInitialRole, setFormInitialRole] = useState<ApplicationRole>('BUILDER');

  // Check URL pathname or hash on load (e.g. #staff, #admin or /admin)
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/admin' || path === '/staff' || hash === '#admin' || hash === '#staff') {
        setCurrentView('admin');
      } else if (path === '/postular' || hash === '#postular') {
        setCurrentView('form');
      } else if (path === '/estado' || hash === '#estado') {
        setCurrentView('status');
      }
    };

    // Secret keyboard shortcut: Ctrl+Shift+S or Alt+S to open Staff view
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        setCurrentView('admin');
        window.history.pushState(null, '', '#staff');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Check persisted admin token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('nautic_admin_token');
    const savedUser = localStorage.getItem('nautic_admin_user');

    if (savedToken) {
      // Verify token with backend
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) {
            setAdminToken(savedToken);
            if (savedUser) setAdminUsername(savedUser);
          } else {
            localStorage.removeItem('nautic_admin_token');
            localStorage.removeItem('nautic_admin_user');
            setAdminToken(null);
          }
        })
        .catch(() => {
          // If offline or error
        });
    }
  }, []);

  const handleNavigate = (view: AppView, role?: ApplicationRole) => {
    if (role) {
      setFormInitialRole(role);
    }
    setCurrentView(view);
    // Update hash for easy bookmarking without reloading
    if (view === 'admin') window.history.pushState(null, '', '#admin');
    else if (view === 'form') window.history.pushState(null, '', '#postular');
    else if (view === 'status') window.history.pushState(null, '', '#estado');
    else window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('nautic_admin_token');
    localStorage.removeItem('nautic_admin_user');
    sessionStorage.removeItem('nautic_staff_pin_verified');
    setAdminToken(null);
    handleNavigate('home');
  };

  const handleCheckStatusWithId = (id?: string) => {
    if (id) setStatusSearchId(id);
    handleNavigate('status');
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#f1f5f9] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Sticky Navigation */}
      <Navbar
        currentView={currentView}
        currentRole={formInitialRole}
        onNavigate={(view, role) => handleNavigate(view, role)}
        isAdminLoggedIn={!!adminToken}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'home' && (
          <HomeHero
            onStartApplication={(role) => handleNavigate('form', role)}
            onCheckStatus={() => handleNavigate('status')}
          />
        )}

        {currentView === 'form' && (
          <ApplicationForm
            key={formInitialRole}
            initialRole={formInitialRole}
            onBackToHome={() => handleNavigate('home')}
            onCheckStatus={handleCheckStatusWithId}
          />
        )}

        {currentView === 'status' && (
          <StatusCheckerView
            initialIdentifier={statusSearchId}
            onBackToHome={() => handleNavigate('home')}
            onApplyNew={() => handleNavigate('form')}
          />
        )}

        {currentView === 'admin' && (
          <>
            {adminToken ? (
              <AdminDashboard
                token={adminToken}
                adminUsername={adminUsername}
                onLogout={handleAdminLogout}
                onNavigateHome={() => handleNavigate('home')}
              />
            ) : (
              <AdminLogin
                onLoginSuccess={handleAdminLoginSuccess}
                onBackToHome={() => handleNavigate('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={(view) => handleNavigate(view)} />
    </div>
  );
}
