import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Game } from './pages';
import ThemeGallery from './components/ThemeGallery';
import DifficultySelection from './components/DifficultySelection';
import Admin from './pages/Admin';
import { UserPreferencesProvider } from './contexts/UserPreferences';
import './App.css';

function App() {
  return (
    <UserPreferencesProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ThemeGallery />} />
            <Route path="/theme/:themeId" element={<DifficultySelection />} />
            <Route path="/game/:themeId/:difficulty" element={<Game />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </UserPreferencesProvider>
  );
}

export default App;