import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ParentDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect PIN. Default is 1234 for demo.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="parent-auth-page">
        <header className="page-header">
          <Link to="/" className="back-button">
            ← Back to Home
          </Link>
          <h1>Parent Dashboard</h1>
        </header>
        
        <main className="auth-content">
          <form onSubmit={handleAuth} className="pin-form">
            <h2>Enter Parent PIN</h2>
            <p>This area is protected. Please enter your PIN to continue.</p>
            
            <div className="pin-input-group">
              <label htmlFor="pin-input">PIN:</label>
              <input
                id="pin-input"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="pin-input"
              />
            </div>
            
            <button type="submit" className="auth-button">
              Access Dashboard
            </button>
            
            <p className="demo-notice">
              Demo PIN: 1234
            </p>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="parent-dashboard-page">
      <header className="page-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <h1>Parent Dashboard</h1>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="logout-button"
        >
          Logout
        </button>
      </header>
      
      <main className="dashboard-content">
        <section className="stats-overview">
          <h2>Progress Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Games Played</h3>
              <span className="stat-number">12</span>
            </div>
            <div className="stat-card">
              <h3>Average Time</h3>
              <span className="stat-number">2:45</span>
            </div>
            <div className="stat-card">
              <h3>Best Score</h3>
              <span className="stat-number">1:23</span>
            </div>
            <div className="stat-card">
              <h3>Favorite Theme</h3>
              <span className="stat-number">Animals</span>
            </div>
          </div>
        </section>
        
        <section className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-date">Today, 2:30 PM</span>
              <span className="activity-desc">Completed Dinosaurs game in 3:15</span>
            </div>
            <div className="activity-item">
              <span className="activity-date">Yesterday, 4:45 PM</span>
              <span className="activity-desc">Completed Animals game in 2:50</span>
            </div>
            <div className="activity-item">
              <span className="activity-date">Dec 22, 1:20 PM</span>
              <span className="activity-desc">Created new Space theme</span>
            </div>
          </div>
        </section>
        
        <section className="dashboard-actions">
          <h2>Manage Games</h2>
          <div className="action-buttons">
            <Link to="/create" className="action-button">
              Create New Game
            </Link>
            <button className="action-button">
              View All Games
            </button>
            <button className="action-button">
              Export Progress Report
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ParentDashboard;