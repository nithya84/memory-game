import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardData } from './Card';
import { useUserPreferences } from '../contexts/UserPreferences';
import { DIFFICULTY_LEVELS, getNextDifficulty, getPreviousDifficulty, getDifficultyByPairs } from '../constants/difficultyLevels';
import './GameBoard.css';

export interface GameState {
  cards: CardData[];
  flippedCards: string[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  gameStarted: boolean;
  gameWon: boolean;
  startTime: number | null;
  endTime: number | null;
}

interface CustomImage {
  url: string;
  altText: string;
}

interface GameBoardProps {
  difficulty?: number; // Number of pairs (3-20)
  customImages?: CustomImage[];
  onGameComplete?: (stats: { moves: number; time: number }) => void;
  onNewGame?: () => void;
  onDifficultyChange?: (newDifficulty: number, difficultyLabel: string) => void;
}

// Animal theme images matching the Figma design
const ANIMAL_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop', alt: 'Cat' },
  { url: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=300&h=300&fit=crop', alt: 'Dog' },
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', alt: 'Bear' },
  { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=300&fit=crop', alt: 'Fox' },
  { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop', alt: 'Monkey' },
  { url: 'https://images.unsplash.com/photo-1567201080580-bfcc97dae346?w=300&h=300&fit=crop', alt: 'Lion' },
  { url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=300&h=300&fit=crop', alt: 'Tiger' },
  { url: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=300&h=300&fit=crop', alt: 'Elephant' },
  { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop', alt: 'Owl' },
  { url: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop', alt: 'Penguin' },
  { url: 'https://images.unsplash.com/photo-1560743173-567a3b5658b1?w=300&h=300&fit=crop', alt: 'Parrot' },
  { url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&h=300&fit=crop', alt: 'Giraffe' },
  { url: 'https://images.unsplash.com/photo-1551041036-dbc6b3b8394e?w=300&h=300&fit=crop', alt: 'Zebra' },
  { url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=300&h=300&fit=crop', alt: 'Rabbit' },
  { url: 'https://images.unsplash.com/photo-1573160103600-9d99f66f1fed?w=300&h=300&fit=crop', alt: 'Wolf' },
  { url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&h=300&fit=crop', alt: 'Deer' },
  { url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop', alt: 'Fish' },
  { url: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?w=300&h=300&fit=crop', alt: 'Turtle' },
  { url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=300&fit=crop', alt: 'Eagle' },
  { url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=300&fit=crop', alt: 'Bird' }
];

const GameBoard: React.FC<GameBoardProps> = ({ 
  difficulty = 6,
  customImages,
  onGameComplete,
  onNewGame,
  onDifficultyChange
}) => {
  const { preferences, setCardFlipBackDelay } = useUserPreferences();
  
  const currentDifficulty = getDifficultyByPairs(difficulty);
  const nextDifficulty = getNextDifficulty(difficulty);
  const prevDifficulty = getPreviousDifficulty(difficulty);
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: difficulty,
    moves: 0,
    gameStarted: false,
    gameWon: false,
    startTime: null,
    endTime: null
  });

  // Helper function to randomly select N items from array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize game cards
  const initializeGame = useCallback(() => {
    // Get available images
    const availableImages = customImages && customImages.length >= difficulty
      ? customImages
      : ANIMAL_IMAGES;

    // Randomly select N images from available pool
    const shuffledImages = shuffleArray(availableImages);
    const imagesToUse = shuffledImages.slice(0, difficulty);

    const cardPairs: CardData[] = [];

    // Create pairs of cards
    imagesToUse.forEach((image, index) => {
      // First card of the pair
      cardPairs.push({
        id: `card-${index}-a`,
        imageUrl: image.url,
        altText: image.altText,
        isMatched: false
      });
      
      // Second card of the pair
      cardPairs.push({
        id: `card-${index}-b`,
        imageUrl: image.url,
        altText: image.altText,
        isMatched: false
      });
    });
    
    // Shuffle the cards
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    setGameState(prev => ({
      ...prev,
      cards: shuffledCards,
      flippedCards: [],
      matchedPairs: 0,
      totalPairs: difficulty,
      moves: 0,
      gameStarted: false,
      gameWon: false,
      startTime: null,
      endTime: null
    }));
  }, [difficulty, customImages]);

  // Handle card click
  const handleCardClick = useCallback((cardId: string) => {
    setGameState(prev => {
      // Start the game on first click
      if (!prev.gameStarted) {
        return {
          ...prev,
          flippedCards: [cardId],
          gameStarted: true,
          startTime: Date.now()
        };
      }

      // Ignore if card is already flipped, matched, or if two cards are already flipped
      const clickedCard = prev.cards.find(card => card.id === cardId);
      if (prev.flippedCards.includes(cardId) || prev.flippedCards.length >= 2 || clickedCard?.isMatched) {
        return prev;
      }

      const newFlippedCards = [...prev.flippedCards, cardId];
      
      // If two cards are flipped, check for match
      if (newFlippedCards.length === 2) {
        const [firstCardId, secondCardId] = newFlippedCards;
        const firstCard = prev.cards.find(card => card.id === firstCardId);
        const secondCard = prev.cards.find(card => card.id === secondCardId);
        
        const isMatch = firstCard && secondCard && 
          firstCard.imageUrl === secondCard.imageUrl && 
          firstCard.id !== secondCard.id;

        if (isMatch) {
          // Mark cards as matched
          const updatedCards = prev.cards.map(card => 
            card.id === firstCardId || card.id === secondCardId 
              ? { ...card, isMatched: true }
              : card
          );

          const newMatchedPairs = prev.matchedPairs + 1;
          const gameWon = newMatchedPairs === prev.totalPairs;
          
          return {
            ...prev,
            cards: updatedCards,
            flippedCards: [],
            matchedPairs: newMatchedPairs,
            moves: prev.moves + 1,
            gameWon,
            endTime: gameWon ? Date.now() : null
          };
        } else {
          // No match - cards will be flipped back after delay
          return {
            ...prev,
            flippedCards: newFlippedCards,
            moves: prev.moves + 1
          };
        }
      }

      return {
        ...prev,
        flippedCards: newFlippedCards
      };
    });
  }, []);

  // Auto-flip back unmatched cards after delay
  useEffect(() => {
    if (gameState.flippedCards.length === 2) {
      const [firstCardId, secondCardId] = gameState.flippedCards;
      const firstCard = gameState.cards.find(card => card.id === firstCardId);
      const secondCard = gameState.cards.find(card => card.id === secondCardId);
      
      const isMatch = firstCard && secondCard && 
        firstCard.imageUrl === secondCard.imageUrl && 
        firstCard.id !== secondCard.id;

      if (!isMatch) {
        const timer = setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            flippedCards: []
          }));
        }, preferences.cardFlipBackDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [gameState.flippedCards, gameState.cards]);

  // Handle game completion
  useEffect(() => {
    if (gameState.gameWon && gameState.startTime && gameState.endTime && onGameComplete) {
      const gameTime = gameState.endTime - gameState.startTime;
      onGameComplete({
        moves: gameState.moves,
        time: gameTime
      });
    }
  }, [gameState.gameWon, gameState.moves, gameState.startTime, gameState.endTime, onGameComplete]);

  // Initialize game on component mount or difficulty change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Calculate grid columns optimized for desktop viewing
  const getGridColumns = () => {
    const totalCards = difficulty * 2;
    if (totalCards <= 12) return 3; // 3x3 or 4x3
    if (totalCards <= 16) return 4; // 4x4
    if (totalCards <= 24) return 6; // 4x6
    if (totalCards <= 32) return 8; // 4x8
    return 10; // 4x10 for 40 cards (20 pairs)
  };

  const isCardFlipped = (cardId: string) => {
    const card = gameState.cards.find(c => c.id === cardId);
    return gameState.flippedCards.includes(cardId) || (card?.isMatched ?? false);
  };


  return (
    <div className="game-board-container">
      {/* Game Controls */}
      <div className="game-accessibility-controls">
        <div className="timing-control">
          <label className="timing-label">Card View Time:</label>
          <select 
            value={preferences.cardFlipBackDelay}
            onChange={(e) => setCardFlipBackDelay(Number(e.target.value))}
            className="timing-select"
            aria-label="Choose how long cards stay visible when they don't match"
            title="How long cards stay open when they don't match"
          >
            <option value={1000}>Quick (1s)</option>
            <option value={2000}>Normal (2s)</option>
            <option value={3000}>Slow (3s)</option>
            <option value={5000}>Extra Slow (5s)</option>
          </select>
        </div>
      </div>

      <div className="game-header">
        <h1>Memory Match</h1>
        <p className="game-subtitle">Find all the matching pairs!</p>
        <div className="game-stats">
          <span>{gameState.matchedPairs}/{gameState.totalPairs} Matched</span>
        </div>
      </div>

      <div 
        className="game-board"
        data-columns={getGridColumns()}
        style={{ 
          '--total-cards': gameState.cards.length
        } as React.CSSProperties}
      >
        {gameState.cards.map((card) => {
          const cardFlipped = isCardFlipped(card.id);
          const cardDisabled = gameState.gameWon || 
            (gameState.flippedCards.length >= 2 && !cardFlipped && !card.isMatched);
          
          return (
            <Card
              key={card.id}
              card={card}
              isFlipped={cardFlipped}
              isDisabled={cardDisabled}
              onClick={handleCardClick}
            />
          );
        })}
      </div>

      {gameState.gameWon && (
        <div className="game-complete">
          <h2>🎉 Congratulations!</h2>
          <p>You completed the game in {gameState.moves} moves!</p>
          <button onClick={initializeGame} className="play-again-btn">
            Play Again
          </button>
        </div>
      )}

      <div className="game-controls">
        {/* Difficulty Navigation */}
        {onDifficultyChange && (
          <div className="difficulty-navigation">
            <button 
              onClick={() => {
                if (prevDifficulty) {
                  onDifficultyChange(prevDifficulty.pairs, prevDifficulty.label);
                }
              }}
              disabled={!prevDifficulty}
              className="difficulty-nav-btn level-down"
              title={prevDifficulty ? `Try easier level: ${prevDifficulty.label}` : 'Already at easiest level'}
            >
              ⬇️ Level Down{prevDifficulty ? ` (${prevDifficulty.label})` : ''}
            </button>
            
            <button 
              onClick={() => {
                if (nextDifficulty) {
                  onDifficultyChange(nextDifficulty.pairs, nextDifficulty.label);
                }
              }}
              disabled={!nextDifficulty}
              className="difficulty-nav-btn level-up"
              title={nextDifficulty ? `Try harder level: ${nextDifficulty.label}` : 'Already at hardest level'}
            >
              ⬆️ Level Up{nextDifficulty ? ` (${nextDifficulty.label})` : ''}
            </button>
          </div>
        )}
        
        <button onClick={onNewGame || initializeGame} className="new-game-btn">
          🔄 New Game (Same Level)
        </button>
      </div>
    </div>
  );
};

export default GameBoard;