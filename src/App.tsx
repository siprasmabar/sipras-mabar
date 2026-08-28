import React, { useState, useEffect } from 'react';
import { User, School } from './types';
import { storage } from './lib/storage';
import { LandingPage } from './components/landing/LandingPage';
import { LoginModal } from './components/auth/LoginModal';
import { FirstLoginPasswordModal } from './components/auth/FirstLoginPasswordModal';
import { AppLayout, NavTabId } from './components/layout/AppLayout';

// Module views
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { SchoolMap } from './components/map/SchoolMap';
import { SchoolProfileView } from './components/school/SchoolProfileView';
import { LandManager } from './components/infrastructure/LandManager';
import { BuildingManager } from './components/infrastructure/BuildingManager';
import { RoomManager } from './components/infrastructure/RoomManager';
import { SupportingFacilityManager } from './components/infrastructure/SupportingFacilityManager';
import { FacilityManager } from './components/facilities/FacilityManager';
import { SPTJMManager } from './components/sptjm/SPTJMManager';

// Admin views
import { SchoolMasterManager } from './components/admin/SchoolMasterManager';
import { UserManager } from './components/admin/UserManager';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { ActivityLogView } from './components/admin/ActivityLogView';
import { SchemaDocsViewer } from './components/admin/SchemaDocsViewer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [demoLoginPreset, setDemoLoginPreset] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [viewingPublicPortal, setViewingPublicPortal] = useState(!storage.getCurrentUser());

  // Listen to storage update events
  useEffect(() => {
    const handleStorageUpdate = () => {
      const u = storage.getCurrentUser();
      setCurrentUser(u);
    };
    window.addEventListener('sipras_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('sipras_storage_update', handleStorageUpdate);
  }, []);

  const handleOpenLogin = (presetUser?: User) => {
    setDemoLoginPreset(presetUser || null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
    setViewingPublicPortal(false);
    setActiveTab('dashboard');
    storage.logActivity(
      user,
      'Login',
      'Auth',
      user.id,
      `Pengguna ${user.full_name} (${user.role}) berhasil masuk ke sistem SIPRAS MABAR.`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      storage.logActivity(
        currentUser,
        'Logout',
        'Auth',
        currentUser.id,
        `Pengguna ${currentUser.full_name} keluar dari sistem.`
      );
    }
    storage.clearCurrentUser();
    setCurrentUser(null);
    setViewingPublicPortal(true);
  };

  // If user is not logged in or explicitly viewing public portal
  if (!currentUser || viewingPublicPortal) {
    return (
      <>
        <LandingPage onLoginClick={handleOpenLogin} />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialUser={demoLoginPreset}
        />
      </>
    );
  }

  // Operator lock check: if operator's school profile is not completed, enforce school_profile tab if they try to access locked tabs
  const isOperator = currentUser.role === 'school_operator';
  const operatorSchool = isOperator && currentUser.school_id ? storage.getSchoolById(currentUser.school_id) : null;
  const isProfileIncomplete = isOperator && operatorSchool && !operatorSchool.profile_completed;

  const currentTab = isProfileIncomplete && !['dashboard', 'map', 'school_profile'].includes(activeTab)
    ? 'school_profile'
    : activeTab;

  return (
    <>
      <AppLayout
        currentUser={currentUser}
        activeTab={currentTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        onBackToPortal={() => setViewingPublicPortal(true)}
      >
        {/* Route Renderers */}
        {currentTab === 'dashboard' && <OverviewDashboard currentUser={currentUser} />}

        {currentTab === 'map' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Peta Sebaran Sarana Prasarana Sekolah
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visualisasi geospasial GIS kondisi sarana prasarana sekolah di 12 Kecamatan Kab. Manggarai Barat
              </p>
            </div>
            <SchoolMap schools={storage.getSchools()} height="680px" showFilters={true} />
          </div>
        )}

        {currentTab === 'school_profile' && <SchoolProfileView currentUser={currentUser} />}

        {currentTab === 'land' && <LandManager currentUser={currentUser} />}

        {currentTab === 'building' && <BuildingManager currentUser={currentUser} />}

        {currentTab === 'room' && <RoomManager currentUser={currentUser} />}

        {currentTab === 'supporting' && <SupportingFacilityManager currentUser={currentUser} />}

        {currentTab === 'facility' && <FacilityManager currentUser={currentUser} />}

        {currentTab === 'sptjm' && <SPTJMManager currentUser={currentUser} />}

        {currentTab === 'admin_schools' && <SchoolMasterManager currentUser={currentUser} />}

        {currentTab === 'admin_users' && <UserManager currentUser={currentUser} />}

        {currentTab === 'admin_settings' && <SystemSettingsView currentUser={currentUser} />}

        {currentTab === 'admin_logs' && <ActivityLogView currentUser={currentUser} />}

        {currentTab === 'admin_schema' && <SchemaDocsViewer />}
      </AppLayout>

      {/* Mandatory First-Login Password Change Modal */}
      {currentUser.first_login && (
        <FirstLoginPasswordModal
          currentUser={currentUser}
          onPasswordChanged={updated => setCurrentUser(updated)}
        />
      )}
    </>
  );
}
