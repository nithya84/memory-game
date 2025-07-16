import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GameBoard } from '../components';
import { ThemeImage } from '../services/api';

interface LocationState {
  customImages?: ThemeImage[];
  themeName?: string;
}

const Game: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [difficulty, setDifficulty] = useState(6);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const handleGameComplete = (stats: { moves: number; time: number }) => {
    console.log('Game completed!', stats);
    // TODO: Save game statistics
  };

  const handleNewGame = () => {
    setGameKey(prev => prev + 1);
    setGameStarted(false);
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setGameKey(prev => prev + 1);
  };

  const maxSelection = parseInt(import.meta.env.VITE_MAX_SELECTION_COUNT || '20');
  const maxPairs = state?.customImages ? Math.min(state.customImages.length, maxSelection) : maxSelection;

  return (
    <div className="game-page">
      <nav className="game-nav">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <Link to="/settings" className="settings-button">
          Settings
        </Link>
      </nav>
      
      <main className="game-main">
        {!gameStarted ? (
          <div className="game-setup">
            <h1>{state?.themeName ? `${state.themeName} Memory Game` : 'Memory Game'}</h1>
            <p>Choose your difficulty level to start playing!</p>
            
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
                  max={maxPairs}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="difficulty-slider"
                />
                <div className="difficulty-labels">
                  <span>Easy (3)</span>
                  <span>Hard ({maxPairs})</span>
                </div>
              </div>
            </section>
            
            <button 
              className="start-game-button primary"
              onClick={handleStartGame}
            >
              Start Game
            </button>
          </div>
        ) : (
          <GameBoard
            key={gameKey}
            difficulty={difficulty}
            customImages={state?.customImages}
            onGameComplete={handleGameComplete}
            onNewGame={handleNewGame}
          />
        )}
      </main>
    </div>
  );
};

export default Game;