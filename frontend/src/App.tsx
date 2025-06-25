import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, Game, CreateGame, Settings, ParentDashboard } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/parent" element={<ParentDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;