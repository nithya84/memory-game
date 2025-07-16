import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService, ThemeImage } from '../services/api';
import './CreateGame.css';

const CreateGame: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState<'cartoon' | 'realistic' | 'simple'>('cartoon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ThemeImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  
  // Configurable selection count for testing
  const maxSelection = parseInt(import.meta.env.VITE_MAX_SELECTION_COUNT || '20');

  const handleGenerateImages = async () => {
    if (!theme.trim()) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await apiService.generateTheme({
        theme: theme.trim(),
        style
      });
      
      if (response.images) {
        setGeneratedImages(response.images);
        setSelectedImages(new Set()); // Clear previous selections
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageToggle = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else if (newSelected.size < maxSelection) {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleCreateGame = () => {
    if (selectedImages.size !== maxSelection) {
      setError(`Please select exactly ${maxSelection} images`);
      return;
    }
    
    const selectedImageData = generatedImages.filter(img => selectedImages.has(img.id));
    navigate('/game', {
      state: {
        customImages: selectedImageData,
        themeName: theme
      }
    });
  };

  return (
    <div className="create-game-page">
      <header className="create-game-header">
        <div className="create-game-nav">
          <Link to="/">EduPlay</Link>
          <Link to="/">Home</Link>
          <Link to="/game">Games</Link>
          <Link to="/settings">Settings</Link>
        </div>
        <div className="user-profile">
          <div className="user-avatar">👤</div>
        </div>
      </header>
      
      <main className="create-game-main">
        <h1 className="page-title">Customize Memory Game</h1>
        <p className="page-subtitle">
          Select a theme and images for your child's memory game. You can choose up to {maxSelection} images.
        </p>
        
        <section className="form-section">
          <h2 className="section-title">Theme</h2>
          <div className="theme-input-container">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Dinosaurs"
              className="theme-input"
            />
          </div>
          
          <h2 className="section-title">Style</h2>
          <div className="style-selector">
            {(['cartoon', 'realistic', 'simple'] as const).map((styleOption) => (
              <label key={styleOption} className="style-option">
                <input
                  type="radio"
                  name="style"
                  value={styleOption}
                  checked={style === styleOption}
                  onChange={(e) => setStyle(e.target.value as typeof style)}
                />
                <span className="style-label">
                  {styleOption.charAt(0).toUpperCase() + styleOption.slice(1)}
                </span>
              </label>
            ))}
          </div>
          
          <div className="generate-section">
            <button 
              className={`generate-button ${isGenerating ? 'loading' : ''}`}
              disabled={!theme.trim() || isGenerating}
              onClick={handleGenerateImages}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </section>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {generatedImages.length > 0 && (
          <section className="images-section">
            <div className="images-header">
              <h2 className="section-title">Images</h2>
              <span className="selection-counter">Selected: {selectedImages.size}/{maxSelection}</span>
            </div>
            
            <div className="image-grid">
              {generatedImages.map((image) => (
                <div 
                  key={image.id}
                  className={`image-option ${selectedImages.has(image.id) ? 'selected' : ''}`}
                  onClick={() => handleImageToggle(image.id)}
                >
                  <img src={image.thumbnailUrl} alt={image.altText} />
                  <div className="selection-indicator">
                    ✓
                  </div>
                </div>
              ))}
            </div>
            
            <div className="actions-section">
              <button 
                className="create-game-button"
                disabled={selectedImages.size !== maxSelection}
                onClick={handleCreateGame}
              >
                {selectedImages.size === maxSelection ? 'Save Customization' : `Select ${maxSelection - selectedImages.size} more images`}
              </button>
              <button 
                className="regenerate-button"
                onClick={() => {
                  setGeneratedImages([]);
                  setSelectedImages(new Set());
                }}
              >
                Generate Different Images
              </button>
            </div>
          </section>
        )}
        
        {generatedImages.length === 0 && (
          <div className="actions-section">
            <Link to="/game" className="sample-games-link">
              Use Sample Images
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateGame;