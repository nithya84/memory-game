import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CreateGame: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState(6);

  return (
    <div className="create-game-page">
      <header className="page-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <h1>Create Custom Game</h1>
      </header>
      
      <main className="create-form">
        <section className="theme-section">
          <h2>Choose a Theme</h2>
          <div className="theme-input-group">
            <label htmlFor="theme-input">
              What would you like your memory cards to show?
            </label>
            <input
              id="theme-input"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., animals, vehicles, dinosaurs, space..."
              className="theme-input"
            />
            <p className="input-help">
              Enter any theme and we'll generate matching images!
            </p>
          </div>
        </section>
        
        <section className="difficulty-section">
          <h2>Choose Difficulty</h2>
          <div className="difficulty-selector">
            <label htmlFor="difficulty-slider">
              Number of card pairs: {difficulty}
            </label>
            <input
              id="difficulty-slider"
              type="range"
              min="3"
              max="20"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="difficulty-slider"
            />
            <div className="difficulty-labels">
              <span>Easy (3)</span>
              <span>Hard (20)</span>
            </div>
          </div>
        </section>
        
        <section className="actions">
          <button 
            className="generate-button primary"
            disabled={!theme.trim()}
          >
            Generate Images
          </button>
          <Link to="/game" className="preview-button secondary">
            Use Sample Images
          </Link>
        </section>
      </main>
    </div>
  );
};

export default CreateGame;