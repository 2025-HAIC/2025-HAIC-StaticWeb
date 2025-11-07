import React, { useState, useEffect } from 'react';
import ModeSelector from './components/ModeSelector.jsx';
import ReplayViewer from './components/ReplayViewer.jsx';
import SinglePlayerGame from './components/SinglePlayerGame.jsx';
import PvP from './components/PvP.jsx';

const MODE_REPLAY = 'replay';
const MODE_SINGLE = 'single';
const MODE_PVP = 'pvp';

const modeComponents = {
  [MODE_REPLAY]: ReplayViewer,
  [MODE_SINGLE]: SinglePlayerGame,
  [MODE_PVP]: PvP,
};

function App() {
  const [mode, setMode] = useState(MODE_SINGLE);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);
  const ActiveComponent = modeComponents[mode];

  return (
    <div className="app-container">
      <header style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="main-title">2025 HAIC</h2>
          <h1 className="section-title">Dots and Boxes</h1>
        </div>
      </header>
  <ModeSelector selectedMode={mode} onChange={setMode} theme={theme} setTheme={setTheme} />
      <div className="mode-content">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default App;
