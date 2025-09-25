import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import UserHeader from './components/UserHeader';
import OrchestratorSearch from './components/OrchestratorSearch';
import './App.css';

// Main App Content (authenticated)
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="App">
        <AuthScreen />
      </div>
    );
  }

  // Show main app content if authenticated
  return (
    <div className="App">
      <UserHeader />
      <div className="main-content">
        <OrchestratorSearch />
      </div>
    </div>
  );
}

// Root App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
