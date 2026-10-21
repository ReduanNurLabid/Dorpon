import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AmbientBackground } from './components/AmbientBackground';
import { Header } from './components/Header';
import { FloatingDock } from './components/FloatingDock';
import { TopStoriesFeed } from './components/TopStoriesFeed';
import { CurrentAffairsFeed } from './components/CurrentAffairsFeed';
import { DiscoverFeed } from './components/DiscoverFeed';
import { StudyCanvasModal } from './components/StudyCanvasModal';
import { SettingsModal } from './components/SettingsModal';

const MainLayout: React.FC = () => {
  const { activeTab, focusMode } = useApp();

  return (
    <AmbientBackground>
      {/* Top Header */}
      {!focusMode && <Header />}

      {/* Main Tab Content */}
      <main className="flex-1 w-full">
        {activeTab === 'top_stories' && <TopStoriesFeed />}
        {activeTab === 'current_affairs' && <CurrentAffairsFeed />}
        {activeTab === 'discover' && <DiscoverFeed />}
      </main>

      {/* Bottom Floating Navigation Dock */}
      {!focusMode && <FloatingDock />}

      {/* Modals & Overlays */}
      <StudyCanvasModal />
      <SettingsModal />
    </AmbientBackground>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
