import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AmbientBackground } from './components/AmbientBackground';
import { Header } from './components/Header';
import { FloatingDock } from './components/FloatingDock';
import { TopStoriesFeed } from './components/TopStoriesFeed';
import { CurrentAffairsFeed } from './components/CurrentAffairsFeed';
import { DiscoverFeed } from './components/DiscoverFeed';
import { SavedStoriesFeed } from './components/SavedStoriesFeed';
import { StudyCanvasModal } from './components/StudyCanvasModal';
import { AudioPlayerDock } from './components/AudioPlayerDock';
import { AudioPlayerSheet } from './components/AudioPlayerSheet';
import { SettingsModal } from './components/SettingsModal';

const MainLayout: React.FC = () => {
  const { activeTab, focusMode, isSerif } = useApp();

  return (
    <AmbientBackground>
      {/* Top Header */}
      {!focusMode && <Header />}

      {/* Main Tab Content */}
      <main className="flex-1 w-full">
        {activeTab === 'top_stories' && <TopStoriesFeed />}
        {activeTab === 'current_affairs' && <CurrentAffairsFeed />}
        {activeTab === 'discover' && <DiscoverFeed />}
        {activeTab === 'saved' && <SavedStoriesFeed />}
      </main>

      {/* Persistent Audio Mini-Player Dock */}
      <AudioPlayerDock />

      {/* Bottom Floating Navigation Dock */}
      {!focusMode && <FloatingDock />}

      {/* Modals & Overlays */}
      <StudyCanvasModal />
      <AudioPlayerSheet />
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
