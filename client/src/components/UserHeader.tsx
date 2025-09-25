import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserHeader.css';

export default function UserHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = user.username 
    ? user.username
    : user.email.split('@')[0];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="user-header">
      <div className="user-info">
        <div className="user-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <span className="user-name">{displayName}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      
      <button 
        className="logout-button"
        onClick={handleLogout}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}