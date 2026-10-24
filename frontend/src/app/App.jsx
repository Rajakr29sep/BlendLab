import React, { useState, useEffect } from "react";
import { FlaskConical } from 'lucide-react';
import IntroPage from '../pages/IntroPage.jsx';
import OverviewPage from '../pages/OverviewPage.jsx';
import VirtualLabPage from '../pages/VirtualLabPage.jsx';
import RecommendationsPage from '../pages/RecommendationsPage.jsx';
import DatasetExplorerPage from '../pages/DatasetExplorerPage.jsx';
import IngredientProfilesPage from '../pages/IngredientProfilesPage.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

const DEFAULT_CONFIG = {
  proteinA: 'Soy', proteinB: 'Chickpea', feed: 35, ss: 600, mc: 28,
  maxCostPerKg: '', minProteinPer100g: '',
  texturePreferences: { hardness: 60, chewiness: 60, springiness: 55, cohesion: 55 },
};
const PROTEINS = ['Chickpea', 'Faba', 'Lentil', 'Mungbean', 'Pea', 'Soy'];
const emptyProfile = () => ({ pricePerKg: '', proteinPer100g: '', source: '' });
function loadProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem('formulab-ingredient-profiles') || '{}');
    return Object.fromEntries(PROTEINS.map((name) => [name, { ...emptyProfile(), ...(parsed[name] || {}) }]));
  } catch {
    return Object.fromEntries(PROTEINS.map((name) => [name, emptyProfile()]));
  }
}

const PAGE_TITLES = {
  overview: 'Overview', 'virtual-lab': 'Virtual Lab', recommendations: 'Blend Rankings', dataset: 'Dataset Explorer', ingredients: 'Ingredient Data',
};

export default function App() {
  const [entered, setEntered] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [profiles, setProfiles] = useState(loadProfiles);

  useEffect(() => {
    localStorage.setItem('formulab-ingredient-profiles', JSON.stringify(profiles));
  }, [profiles]);

  function navigate(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!entered) return <IntroPage onEnter={() => setEntered(true)} />;

  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={navigate} />
    <div className="app-main">
      <Topbar pageTitle={PAGE_TITLES[activePage] || 'Workspace'} onGoToLab={() => navigate('virtual-lab')} />
      <main className="page-container">
        {activePage === 'overview' && <OverviewPage onNavigate={navigate} />}
        {activePage === 'virtual-lab' && <VirtualLabPage config={config} setConfig={setConfig} onShowRankings={() => navigate('recommendations')} />}
        {activePage === 'recommendations' && <RecommendationsPage config={config} setConfig={setConfig} profiles={profiles} onGoToIngredients={() => navigate('ingredients')} />}
        {activePage === 'dataset' && <DatasetExplorerPage />}
        {activePage === 'ingredients' && <IngredientProfilesPage profiles={profiles} setProfiles={setProfiles} />}
        <footer className="app-footer"><span><FlaskConical size={13} /> FORMULAB / PLANT PROTEIN INTELLIGENCE</span><span>Predictions are hypotheses until physical validation.</span></footer>
      </main>
    </div>
  </div>;
}
