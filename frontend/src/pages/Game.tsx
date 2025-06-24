import React from 'react';
import { Link } from 'react-router-dom';

const Game: React.FC = () => {
  return (
    <div className="game-page">
      <header className="game-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <h1>Memory Game</h1>
        <div className="game-info">
          <span>Pairs: 0/6</span>
          <span>Time: 00:00</span>
        </div>
      </header>
      
      <main className="game-area">
        <div className="game-board-placeholder">
          <h2>Game Board Coming Soon!</h2>
          <p>This is where the memory game grid will be displayed.</p>
          <div className="placeholder-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="placeholder-card">
                Card {i + 1}
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <aside className="game-controls">
        <button className="control-button">New Game</button>
        <button className="control-button">Pause</button>
        <Link to="/settings" className="control-button">
          Settings
        </Link>
      </aside>
    </div>
  );
};

export default Game;