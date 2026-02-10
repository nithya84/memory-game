import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Theme } from './ThemeGallery';
import { useUserPreferences } from '../contexts/UserPreferences';
import { DIFFICULTY_LEVELS, DifficultyLevel } from '../constants/difficultyLevels';
import { apiService } from '../services/api';
import { sendErrorNotification } from '../services/errorNotification';
import './DifficultySelection.css';

const DifficultySelection: React.FC = () => {
  const navigate = useNavigate();
  const { themeId } = useParams<{ themeId: string }>();
  const { preferences, toggleReducedMotion } = useUserPreferences();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load theme data from URL parameter
  useEffect(() => {
    if (!themeId) {
      navigate('/');
      return;
    }

    const loadTheme = async () => {
      try {
        const response = await apiService.getThemes();
        const theme = response.themes?.find((t: Theme) => t.id === themeId);

        if (!theme) {
          setError('Theme not found. Please select a theme from the gallery.');
          sendErrorNotification('Theme Not Found', `Theme ID: ${themeId} not found in API response`);
        } else {
          setSelectedTheme(theme);
          setError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to load theme:', errorMessage);
        setError('Unable to load theme details. Please try again later.');

        // Send throttled error notification
        sendErrorNotification('Theme Load Failure', `Theme ID: ${themeId}, Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [themeId, navigate]);

  if (loading) {
    return (
      <div className="difficulty-selection">
        <div className="difficulty-content">
          <div className="loading">Loading theme...</div>
        </div>
      </div>
    );
  }

  if (error || !selectedTheme) {
    return (
      <div className="difficulty-selection">
        <div className="difficulty-content">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error || 'Unable to load theme details.'}</p>
            <div className="error-actions">
              <Link to="/" className="back-to-themes-button">
                ← Back to Themes
              </Link>
              <button
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    navigate(`/game/${themeId}/${difficulty.pairs}`);
  };

  return (
    <div className="difficulty-selection">

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