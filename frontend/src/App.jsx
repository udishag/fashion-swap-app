import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CuratedFeed from './components/CuratedFeed';
import UploadForm from './components/UploadForm';
import ProfileHeader from './components/ProfileHeader';
import RecentTrades from './components/RecentTrades';
import Login from './components/Login';
import Register from './components/Register';

// 1. IMPORT YOUR Curated Mock Baseline Items!
import { initialMockProducts } from './mockProducts';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('feed');
  const [authView, setAuthView] = useState('login');
  const [userSession, setUserSession] = useState(null);

  // 2. SET INITIAL STATE DIRECTLY TO YOUR CURATED MOCK ITEMS
  const [products, setProducts] = useState(initialMockProducts);

  // 3. SAFE PRODUCTION BACKEND SYNC ENVIRONMENT LAYER
  useEffect(() => {
    // Uses your secure Render live backend string, or falls back to local dev
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:5000';

    fetch(`${backendUrl}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Combines your user uploads dynamically on top of your mock layout items
          setProducts([...data, ...initialMockProducts]);
        }
      })
      .catch(err => {
        console.warn("Backend sleeping or unreachable. Securely using launch assets baseline.", err);
      });
  }, []);

  const handleLoginSuccess = (user) => {
    setUserSession(user);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = (newUserProfile) => {
    setUserSession(newUserProfile);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthView('login');
    setView('feed');
    setUserSession(null);
  };

  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onLogin={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="page-container">
        <Navbar setView={setView} onLogout={handleLogout} />
      </header>

      <main className="page-container" style={{ paddingBottom: '60px' }}>

        {view === 'profile' && (
          <ProfileHeader user={userSession} />
        )}

        {view === 'shop' && (
          <>
            {/* Prepends dynamically added items seamlessly above the grid layout */}
            <UploadForm onAddProduct={(newItem) => setProducts([newItem, ...products])} />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '40px 0' }} />
          </>
        )}

        <CuratedFeed products={products} />

        <hr style={{ border: '0', height: '1px', background: '#eee', margin: '60px 0 40px 0' }} />
        <RecentTrades />

      </main>
    </div>
  );
}

export default App;