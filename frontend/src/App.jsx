import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CuratedFeed from './components/CuratedFeed';
import UploadForm from './components/UploadForm';
import ProfileHeader from './components/ProfileHeader';
import RecentTrades from './components/RecentTrades';
import Login from './components/Login';
import Register from './components/Register'; // Import the new MOSS registration component

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Controls dashboard login access
  const [view, setView] = useState('feed'); // Tracks authenticated dashboard views: 'feed', 'shop', or 'profile'
  const [authView, setAuthView] = useState('login'); // Tracks unauthenticated views: 'login' or 'register'
  const [products, setProducts] = useState([]);
  const [userSession, setUserSession] = useState(null); // Dynamic session storage context for database registration payload

  // Sync with your Python backend database
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Database connection missing:", err));
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setUserSession(user);
    setIsAuthenticated(true);
  };

  // Handle successful registration pipeline
  const handleRegisterSuccess = (newUserProfile) => {
    setUserSession(newUserProfile);
    setIsAuthenticated(true); // Automatically logs them in upon successful sign up
  };

  // Immediate logout redirect reset loop
  const handleLogout = () => {
    setIsAuthenticated(false); // Shows the unauthenticated screens
    setAuthView('login');       // Defaults back to login layout for safety
    setView('feed');           // Resets standard view back to default
    setUserSession(null);      // Clears session buffer
  };

  // ========================================================
  // 1. UNAUTHENTICATED ROUTING LAYER (Login / Register Split)
  // ========================================================
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    // Fallback default: Render Login component frame
    return (
      <Login
        onLogin={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  // ========================================================
  // 2. AUTHENTICATED MOSS PLATFORM SHELL (Dashboard & Feed)
  // ========================================================
  return (
    <div className="app-shell">
      {/* Aligns 'moss.' with the feed below using the global container */}
      <header className="page-container">
        <Navbar setView={setView} onLogout={handleLogout} />
      </header>

      {/* Standardized alignment for all main content */}
      <main className="page-container" style={{ paddingBottom: '60px' }}>

        {/* PROFILE VIEW ONLY: Show Profile Header Info (passes down dynamic profile states if available) */}
        {view === 'profile' && (
          <ProfileHeader user={userSession} />
        )}

        {/* SHOP VIEW ONLY: Show Upload Workspace Pipeline */}
        {view === 'shop' && (
          <>
            <UploadForm onAddProduct={(newItem) => setProducts([newItem, ...products])} />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '40px 0' }} />
          </>
        )}

        {/* FEED ALWAYS VISIBLE: Anchored under headers */}
        <CuratedFeed products={products} />

        {/* RECENT TRADES LOOP FOOTER */}
        <hr style={{ border: '0', height: '1px', background: '#eee', margin: '60px 0 40px 0' }} />
        <RecentTrades />

      </main>
    </div>
  );
}

export default App;