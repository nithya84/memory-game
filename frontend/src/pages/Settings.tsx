import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/game" className="back-button">
          ← Back to Game
        </Link>
        <h1>Settings</h1>
      </header>
      
      <main className="settings-content">
        <section className="audio-settings">
          <h2>Audio Settings</h2>
          
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Enable Sound Effects
            </label>
          </div>
          
          <div className="setting-item">
            <label htmlFor="volume-slider" className="setting-label">
              Volume: {volume}%
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={!soundEnabled}
              className="volume-slider"
            />
          </div>
        </section>
        
        <section className="accessibility-settings">
          <h2>Accessibility</h2>
          
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
              />
              High Contrast Mode
            </label>
          </div>
        </section>
        
        <section className="game-settings">
          <h2>Game Settings</h2>
          
          <div className="setting-item">
            <Link to="/create" className="setting-button">
              Create New Game
            </Link>
          </div>
          
          <div className="setting-item">
            <Link to="/" className="setting-button">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;