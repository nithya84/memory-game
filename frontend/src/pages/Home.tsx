import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <header className="hero-section">
        <h1>Memory Game</h1>
        <p>Create personalized memory games with AI-generated themes</p>
      </header>
      
      <nav className="main-navigation">
        <Link to="/game" className="nav-button primary">
          Play Game
        </Link>
        <Link to="/create-game" className="nav-button secondary">
          Create Custom Game
        </Link>
        <Link to="/parent" className="nav-button tertiary">
          Parent Dashboard
        </Link>
      </nav>
      
      <section className="features">
        <div className="feature">
          <h3>Customizable Themes</h3>
          <p>Generate unique memory cards based on your child's interests</p>
        </div>
        <div className="feature">
          <h3>Adaptive Difficulty</h3>
          <p>Choose from 3 to 20 card pairs based on skill level</p>
        </div>
        <div className="feature">
          <h3>Progress Tracking</h3>
          <p>Monitor improvement and engagement over time</p>
        </div>
      </section>
    </div>
  );
};

export default Home;