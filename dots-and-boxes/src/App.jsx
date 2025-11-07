import React, { useState } from 'react';
import ModeSelector from './components/ModeSelector.jsx';
import ReplayViewer from './components/ReplayViewer.jsx';
import SinglePlayerGame from './components/SinglePlayerGame.jsx';

const MODE_REPLAY = 'replay';
const MODE_SINGLE = 'single';
const MODE_PVP = 'pvp';

const modeComponents = {
  [MODE_REPLAY]: ReplayViewer,
  [MODE_SINGLE]: SinglePlayerGame,
  [MODE_PVP]: () => (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p>멀티플레이 (PVP 대전) 기능은 곧 제공될 예정입니다.</p>
    </div>
  ),
};

function App() {
  const [mode, setMode] = useState(MODE_SINGLE);
  const ActiveComponent = modeComponents[mode];

  return (
    <div className="app-container">
      <h1 className="section-title">Dots and Boxes</h1>
      <ModeSelector selectedMode={mode} onChange={setMode} />
      <div className="mode-content">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default App;
