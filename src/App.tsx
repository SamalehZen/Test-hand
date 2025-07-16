import React, { useState } from 'react';
import { AuroraHero } from './components/AuroraHero';
import { AttributionApp } from './components/AttributionApp';
import { getSecteurStructure } from './utils/secteurStructure';

type AppState = 'hero' | 'app';

export default function App() {
  const [currentView, setCurrentView] = useState<AppState>('hero');
  const secteurStructure = getSecteurStructure();

  const handleGetStarted = () => {
    setCurrentView('app');
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  if (currentView === 'hero') {
    return <AuroraHero onGetStarted={handleGetStarted} />;
  }

  return (
    <AttributionApp 
      onBack={handleBackToHero} 
      secteurStructure={secteurStructure}
    />
  );
}
