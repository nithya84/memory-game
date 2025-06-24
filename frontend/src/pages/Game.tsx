import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GameBoard } from '../components';

const Game: React.FC = () => {
  const [difficulty, setDifficulty] = useState(6);
  const [gameKey, setGameKey] = useState(0);

  const handleGameComplete = (stats: { moves: number; time: number }) => {
    console.log('Game completed!', stats);
    // TODO: Save game statistics
  };

  const handleNewGame = () => {
    setGameKey(prev => prev + 1);
  };

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
        <GameBoard
          key={gameKey}
          difficulty={difficulty}
          onGameComplete={handleGameComplete}
        />
      </main>
    </div>
  );
};

export default Game;