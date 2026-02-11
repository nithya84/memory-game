import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../contexts/UserPreferences';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const { preferences, updatePreferences } = useUserPreferences();

  return (
    <nav className="global-nav">
      <select
        value={preferences.theme}
        onChange={(e) => updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'high-contrast' })}
        className="theme-switcher"
        aria-label="Choose color theme"
        title="Select color theme for accessibility"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="high-contrast">High Contrast</option>
      </select>

      {isAboutPage ? (
        <Link to="/" className="nav-link">
          Home
        </Link>
      ) : (
        <Link to="/about" className="nav-link">
          About
        </Link>
      )}
    </nav>
  );
};

export default Navigation;
