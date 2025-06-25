import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService, ThemeImage } from '../services/api';

const CreateGame: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState<'cartoon' | 'realistic' | 'simple'>('cartoon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ThemeImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

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
    } else if (newSelected.size < 20) {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleCreateGame = () => {
    if (selectedImages.size !== 20) {
      setError('Please select exactly 20 images');
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
        
        <section className="style-section">
          <h2>Choose Style</h2>
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
        </section>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {generatedImages.length === 0 ? (
          <section className="actions">
            <button 
              className="generate-button primary"
              disabled={!theme.trim() || isGenerating}
              onClick={handleGenerateImages}
            >
              {isGenerating ? 'Generating Images...' : 'Generate Images'}
            </button>
            <Link to="/game" className="preview-button secondary">
              Use Sample Images
            </Link>
          </section>
        ) : (
          <>
            <section className="image-selector">
              <h2>Select Images for Your Game</h2>
              <p>Choose exactly 20 images from the generated set. Selected: {selectedImages.size}/20</p>
              
              <div className="image-grid">
                {generatedImages.map((image) => (
                  <div 
                    key={image.id}
                    className={`image-option ${selectedImages.has(image.id) ? 'selected' : ''}`}
                    onClick={() => handleImageToggle(image.id)}
                  >
                    <img src={image.thumbnailUrl} alt={image.altText} />
                    <div className="selection-indicator">
                      {selectedImages.has(image.id) ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="actions">
              <button 
                className="create-game-button primary"
                disabled={selectedImages.size !== 20}
                onClick={handleCreateGame}
              >
                {selectedImages.size === 20 ? 'Create Game with 20 Images' : `Select ${20 - selectedImages.size} more images`}
              </button>
              <button 
                className="regenerate-button secondary"
                onClick={() => {
                  setGeneratedImages([]);
                  setSelectedImages(new Set());
                }}
              >
                Generate Different Images
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default CreateGame;