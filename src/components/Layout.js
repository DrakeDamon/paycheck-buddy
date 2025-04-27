import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Layout.css';

const Layout = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">
          <h1>PaycheckBuddy</h1>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/time-periods">Time Periods</Link>
            </li>
            <li>
              <Link to="/expenses">All Expenses</Link>
            </li>
            <li>
              <Link to="/paychecks">All Paychecks</Link>
            </li>
          </ul>
        </nav>
        <div className="user-controls">
          <span className="username">
            {currentUser?.username}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} PaycheckBuddy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;