import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Game } from './pages';
import About from './pages/About';
import ThemeGallery from './components/ThemeGallery';
import DifficultySelection from './components/DifficultySelection';
import Navigation from './components/Navigation';
import { UserPreferencesProvider } from './contexts/UserPreferences';
import './App.css';

function App() {
  return (
    <UserPreferencesProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<ThemeGallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/theme/:themeId" element={<DifficultySelection />} />
            <Route path="/game/:themeId/:difficulty" element={<Game />} />
          </Routes>
        </div>
      </Router>
    </UserPreferencesProvider>
  );
}

export default App;