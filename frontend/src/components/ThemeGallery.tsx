import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useUserPreferences } from '../contexts/UserPreferences';
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

// Mock themes for initial launch
const MOCK_THEMES: Theme[] = [
  {
    id: '1',
    name: 'Dinosaurs',
    description: 'Friendly cartoon dinosaurs',
    imageCount: 30,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop',
      altText: 'Dinosaur'
    }
  },
  {
    id: '2',
    name: 'Vehicles',
    description: 'Cars, trucks, planes and more',
    imageCount: 25,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop',
      altText: 'Car'
    }
  },
  {
    id: '3',
    name: 'Ocean Animals',
    description: 'Dolphins, whales and sea creatures',
    imageCount: 28,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=150&h=150&fit=crop',
      altText: 'Dolphin'
    }
  },
  {
    id: '4',
    name: 'Space',
    description: 'Rockets, planets and astronauts',
    imageCount: 32,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=150&h=150&fit=crop',
      altText: 'Rocket'
    }
  },
  {
    id: '5',
    name: 'Farm Animals',
    description: 'Cows, pigs, chickens and horses',
    imageCount: 24,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=150&h=150&fit=crop',
      altText: 'Cow'
    }
  },
  {
    id: '6',
    name: 'Fruits',
    description: 'Apples, bananas and berries',
    imageCount: 26,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&h=150&fit=crop',
      altText: 'Apple'
    }
  },
  {
    id: '7',
    name: 'Musical Instruments',
    description: 'Piano, guitar, drums and more',
    imageCount: 22,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop',
      altText: 'Guitar'
    }
  },
  {
    id: '8',
    name: 'Sports',
    description: 'Balls, equipment and activities',
    imageCount: 29,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=150&h=150&fit=crop',
      altText: 'Soccer ball'
    }
  },
  {
    id: '9',
    name: 'Nature',
    description: 'Trees, flowers and landscapes',
    imageCount: 35,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1440342359438-84a27d23d3e6?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1440342359438-84a27d23d3e6?w=150&h=150&fit=crop',
      altText: 'Tree'
    }
  },
  {
    id: '10',
    name: 'Food',
    description: 'Pizza, cake and delicious treats',
    imageCount: 27,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150&h=150&fit=crop',
      altText: 'Pizza'
    }
  },
  {
    id: '11',
    name: 'Birds',
    description: 'Eagles, parrots and penguins',
    imageCount: 31,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=150&h=150&fit=crop',
      altText: 'Parrot'
    }
  },
  {
    id: '12',
    name: 'Shapes & Colors',
    description: 'Geometric shapes in bright colors',
    imageCount: 20,
    previewImage: {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop',
      altText: 'Colorful shapes'
    }
  }
];

const ThemeGallery: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, toggleReducedMotion } = useUserPreferences();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      } catch (error) {
        console.error('Failed to load themes:', error);
        // Fallback to mock themes on error
        setThemes(MOCK_THEMES);
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