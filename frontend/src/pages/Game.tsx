import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameBoard } from '../components';
import { Theme } from '../components/ThemeGallery';
import { apiService } from '../services/api';
import { getDifficultyByPairs } from '../constants/difficultyLevels';

interface GameParams {
  themeId: string;
  difficulty: string;
}

// Helper function to generate mock images based on theme
const generateMockImagesForTheme = (theme: Theme, pairs: number) => {
  const images = [];
  for (let i = 0; i < pairs; i++) {
    images.push({
      url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=300&h=300&fit=crop&auto=format&q=80`,
      altText: `${theme.name} ${i + 1}`
    });
  }
  return images;
};

const Game: React.FC = () => {
  const navigate = useNavigate();
  const { themeId, difficulty: difficultyParam } = useParams<GameParams>();
  
  const [gameKey, setGameKey] = useState(0);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeImages, setThemeImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const difficulty = parseInt(difficultyParam || '0', 10);
  const difficultyConfig = getDifficultyByPairs(difficulty);

  // Load theme and images based on URL parameters
  useEffect(() => {
    if (!themeId || !difficulty || !difficultyConfig) {
      navigate('/');
      return;
    }

    const loadThemeAndImages = async () => {
      try {
        setLoading(true);
        
        // First load all themes to get the theme data
        const themesResponse = await apiService.getThemes();
        const selectedTheme = themesResponse.themes?.find((t: Theme) => t.id === themeId);
        
        if (!selectedTheme) {
          navigate('/');
          return;
        }
        
        setTheme(selectedTheme);
        
        // Then load the theme images
        const imagesResponse = await apiService.getThemeImages(themeId);
        
        // Transform API response to format expected by GameBoard
        const images = imagesResponse.images?.map((img: any) => ({
          url: img.url,
          altText: img.altText || `${selectedTheme.name} image`
        })) || [];
        
        setThemeImages(images);
      } catch (error) {
        console.error('Failed to load theme data:', error);
        // If we can't load the theme, redirect to home
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadThemeAndImages();
  }, [themeId, difficulty, difficultyConfig, navigate]);

  const handleGameComplete = (stats: { moves: number; time: number }) => {
    console.log(`Game completed! Theme: ${theme?.name}, Difficulty: ${difficultyConfig?.label}`, stats);
    // TODO: Save game statistics
  };

  const handleNewGame = () => {
    setGameKey(prev => prev + 1);
  };

  const handleDifficultyChange = (newDifficulty: number, difficultyLabel: string) => {
    // Navigate to new URL with updated difficulty
    navigate(`/game/${themeId}/${newDifficulty}`, { replace: true });
    
    // Trigger a new game with the new difficulty
    setGameKey(prev => prev + 1);
  };

  const handleBackToThemes = () => {
    navigate('/');
  };

  if (!theme || !difficulty || !difficultyConfig) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="game-page">
        <nav className="game-nav">
          <button onClick={handleBackToThemes} className="back-button">
            ← Back to Themes
          </button>
          <div className="game-info">
            <span className="theme-name">{theme.name}</span>
            <span className="difficulty-badge">{difficultyConfig.label}</span>
            <span className="pairs-count">{difficulty} pairs</span>
          </div>
        </nav>
        <main className="game-main">
          <div className="loading">Loading theme images...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="game-page">
      <nav className="game-nav">
        <button onClick={handleBackToThemes} className="back-button">
          ← Back to Themes
        </button>
      </nav>

      <main className="game-main">
        <GameBoard
          key={gameKey}
          difficulty={difficulty}
          customImages={themeImages}
          themeName={theme.name}
          onGameComplete={handleGameComplete}
          onNewGame={handleNewGame}
          onDifficultyChange={handleDifficultyChange}
        />
      </main>
    </div>
  );
};

export default Game;