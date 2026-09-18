import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { HomeDashboard } from './components/home/HomeDashboard';
import { SpaceView } from './components/space/SpaceView';
import { ProjectWorkspace } from './components/project/ProjectWorkspace';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Modals } from './components/common/Modals';

const MainContent: React.FC = () => {
  const { currentView, isLoading } = useApp();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 68px)', color: 'var(--text-muted)' }}>
        Loading AI Study Companion workspace...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
      {currentView !== 'admin' && <Sidebar />}
      <main style={{ flex: 1, overflowY: 'auto', height: 'calc(100vh - 68px)' }}>
        {currentView === 'home' && <HomeDashboard />}
        {currentView === 'space' && <SpaceView />}
        {currentView === 'project' && <ProjectWorkspace />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <MainContent />
        <Modals />
      </div>
    </AppProvider>
  );
};

export default App;
