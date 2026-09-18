import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Space, Project, Citation } from '../types';
import { api } from '../api';

interface AppContextType {
  spaces: Space[];
  projects: Project[];
  activeSpaceId: string | null;
  activeProjectId: string | null;
  currentView: 'home' | 'space' | 'project' | 'admin';
  projectTab: 'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics';
  activeProjectDetails: any | null;
  isLoading: boolean;
  activeModal: string | null;
  selectedCitation: Citation | null;
  setCurrentView: (view: 'home' | 'space' | 'project' | 'admin') => void;
  setProjectTab: (tab: 'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics') => void;
  selectSpace: (spaceId: string) => void;
  selectProject: (projectId: string, tab?: 'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics') => void;
  refreshData: () => Promise<void>;
  refreshActiveProject: () => Promise<void>;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  setSelectedCitation: (citation: Citation | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'space' | 'project' | 'admin'>('home');
  const [projectTab, setProjectTab] = useState<'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics'>('overview');
  const [activeProjectDetails, setActiveProjectDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const refreshData = async () => {
    try {
      const [spacesData, projectsData] = await Promise.all([
        api.getSpaces(),
        api.getProjects()
      ]);
      setSpaces(spacesData.spaces || []);
      setProjects(projectsData.projects || []);
    } catch (err) {
      console.error('Failed to load initial spaces & projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActiveProject = async () => {
    if (!activeProjectId) return;
    try {
      const details = await api.getProjectDetails(activeProjectId);
      setActiveProjectDetails(details);
    } catch (err) {
      console.error(`Failed to refresh project ${activeProjectId}:`, err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      refreshActiveProject();
    }
  }, [activeProjectId]);

  const selectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setCurrentView('space');
  };

  const selectProject = (projectId: string, tab: 'overview' | 'materials' | 'tutor' | 'quiz' | 'mastery' | 'analytics' = 'overview') => {
    setActiveProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setActiveSpaceId(proj.space_id);
    }
    setProjectTab(tab);
    setCurrentView('project');
  };

  const openModal = (modalName: string, data?: any) => {
    if (data && modalName === 'source_preview') {
      setSelectedCitation(data);
    }
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <AppContext.Provider
      value={{
        spaces,
        projects,
        activeSpaceId,
        activeProjectId,
        currentView,
        projectTab,
        activeProjectDetails,
        isLoading,
        activeModal,
        selectedCitation,
        setCurrentView,
        setProjectTab,
        selectSpace,
        selectProject,
        refreshData,
        refreshActiveProject,
        openModal,
        closeModal,
        setSelectedCitation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
