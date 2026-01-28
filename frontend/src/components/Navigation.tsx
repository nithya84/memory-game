import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';

  return (
    <nav className="global-nav">
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
