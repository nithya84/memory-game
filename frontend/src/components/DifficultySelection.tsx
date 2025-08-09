import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Theme } from './ThemeGallery';
import { useUserPreferences } from '../contexts/UserPreferences';
import { DIFFICULTY_LEVELS, DifficultyLevel } from '../constants/difficultyLevels';
import { apiService } from '../services/api';
import './DifficultySelection.css';


const DifficultySelection: React.FC = () => {
  const navigate = useNavigate();
  const { themeId } = useParams<{ themeId: string }>();
  const { preferences, toggleReducedMotion } = useUserPreferences();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  // Load theme data from URL parameter
  useEffect(() => {
    if (!themeId) {
      navigate('/');
      return;
    }

    const loadTheme = async () => {
      try {
        setLoading(true);
        const response = await apiService.getThemes();
        const theme = response.themes?.find((t: Theme) => t.id === themeId);
        
        if (!theme) {
          navigate('/');
          return;
        }
        
        setSelectedTheme(theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [themeId, navigate]);

  if (!selectedTheme || loading) {
    return (
      <div className="difficulty-selection">
        <div className="difficulty-content">
          <div className="loading">Loading theme...</div>
        </div>
      </div>
    );
  }

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    navigate(`/game/${themeId}/${difficulty.pairs}`);
  };

  return (
    <div className="difficulty-selection">
      {/* Accessibility Controls */}
      <div className="accessibility-controls">
        <button 
          onClick={toggleReducedMotion}
          className="accessibility-button"
          aria-label={preferences.reducedMotion ? 'Enable animations' : 'Disable animations for easier viewing'}
          title={preferences.reducedMotion ? 'Turn animations back on' : 'Turn off animations'}
        >
          {preferences.reducedMotion ? '🐌 Static Mode' : '✨ Animated'}
        </button>
      </div>

      <div className="difficulty-header">
        <Link to="/" className="back-button">
          ← Back to Themes
        </Link>
        
        <div className="selected-theme">
          <img 
            src={selectedTheme.previewImage.thumbnailUrl} 
            alt={selectedTheme.previewImage.altText}
            className="theme-preview-small"
          />
          <div className="theme-details">
            <h2>{selectedTheme.name}</h2>
            <p>{selectedTheme.description}</p>
            <span>{selectedTheme.imageCount} images available</span>
          </div>
        </div>
      </div>

      <div className="difficulty-content">
        <h3>Choose Difficulty Level</h3>
        <p>Select how many pairs you'd like to match</p>
        
        <div className="difficulty-grid">
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level.pairs}
              className="difficulty-card"
              onClick={() => handleDifficultySelect(level)}
              style={{ '--difficulty-color': level.color } as React.CSSProperties}
            >
              <div className="difficulty-icon">
                {'●'.repeat(DIFFICULTY_LEVELS.indexOf(level) + 1)}
              </div>
              <h4 className="difficulty-label">{level.label}</h4>
              <p className="difficulty-description">{level.description}</p>
              <p className="difficulty-pairs">{level.pairs} pairs</p>
              <span className="difficulty-time">{level.estimatedTime}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DifficultySelection;