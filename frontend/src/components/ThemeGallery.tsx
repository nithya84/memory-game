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
    </div>
  );
};

export default ThemeGallery;