import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useUserPreferences } from '../contexts/UserPreferences';
import { sendErrorNotification } from '../services/errorNotification';
import './ThemeGallery.css';

export interface Theme {
  id: string;
  name: string;
  description: string;
  imageCount: number;
  previewImage: {
    url: string;
    thumbnailUrl: string;
    altText: string;
  };
}

const ThemeGallery: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, toggleReducedMotion } = useUserPreferences();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme suggestion form state
  const [themeName, setThemeName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const response = await apiService.getThemes();
        setThemes(response.themes || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to load themes:', errorMessage);
        setError('Unable to load themes. Please try again later.');

        // Send throttled error notification
        sendErrorNotification('Theme Load Failure', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadThemes();
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    navigate(`/theme/${theme.id}`);
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!themeName.trim() || !email.trim()) {
      setSubmitStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Submit to Web3Forms
      const formData = new FormData();
      formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '');
      formData.append('subject', 'New Memory Game Theme Suggestion');
      formData.append('themeName', themeName.trim());
      formData.append('email', email.trim());
      formData.append('description', description.trim() || 'No additional details provided');
      formData.append('from_name', 'Memory Game Theme Suggestion Form');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Show success and reset form
        setSubmitStatus('success');
        setThemeName('');
        setEmail('');
        setDescription('');

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="theme-gallery">
        <div className="gallery-header">
          <h1>Memory Game</h1>
          <p>Choose your theme, choose the number of pairs you want to play with, and start matching!</p>
        </div>
        <div className="loading">Loading themes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-gallery">
        <div className="gallery-header">
          <h1>Memory Game</h1>
          <p>Choose your theme, choose the number of pairs you want to play with, and start matching!</p>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-gallery">
      <div className="gallery-header">
        <h1>Memory Game</h1>
        <p>Choose your theme, choose the number of pairs you want to play with, and start matching!</p>
      </div>

      <div className="themes-grid">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="theme-card"
            onClick={() => handleThemeSelect(theme)}
          >
            <div className="theme-preview">
              <img
                src={theme.previewImage.thumbnailUrl}
                alt={theme.previewImage.altText}
                loading="lazy"
              />
            </div>
            <div className="theme-info">
              <h3 className="theme-name">{theme.name}</h3>
              <p className="theme-description">{theme.description}</p>
              <span className="theme-count">{theme.imageCount} images</span>
            </div>
          </div>
        ))}
      </div>

      <div className="theme-suggestion-section">
        <h2>Suggest a New Theme</h2>
        <p className="suggestion-description">
          Have an idea for a theme your child would love? Let us know and we'll reach out when it's ready!
        </p>

        <form onSubmit={handleSuggestionSubmit} className="suggestion-form">
          <div className="form-group">
            <label htmlFor="themeName">Theme Name</label>
            <input
              type="text"
              id="themeName"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="e.g., Trains, Butterflies, Weather"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Details <span className="optional-label">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any specific things you'd like to see in this theme?"
              className="form-input form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>

          {submitStatus === 'success' && (
            <div className="form-message success">
              Thank you! We'll reach out when your theme is ready.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="form-message error">
              Please fill in all fields with valid information.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ThemeGallery;