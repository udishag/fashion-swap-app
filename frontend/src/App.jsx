import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CuratedFeed from './components/CuratedFeed';
import UploadForm from './components/UploadForm';
import ProfileHeader from './components/ProfileHeader';
import RecentTrades from './components/RecentTrades';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Controls login access
  const [view, setView] = useState('feed'); // Tracks: 'feed', 'shop', or 'profile'
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Database connection missing:", err));
  }, []);

  // If user hasn't authenticated yet, intercept routing and show the 50-50 layout
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <Navbar setView={setView} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 60px 40px' }}>

        {/* PROFILE VIEW ONLY: Show Profile Header Info */}
        {view === 'profile' && (
          <ProfileHeader />
        )}

        {/* SHOP VIEW ONLY: Show Upload Workspace Pipeline */}
        {view === 'shop' && (
          <>
            <UploadForm onAddProduct={(newItem) => setProducts([newItem, ...products])} />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '40px 0' }} />
          </>
        )}

        {/* FEED ALWAYS VISIBLE: Shows at root feed and stays anchored under elements */}
        <CuratedFeed products={products} />

        {/* RECENT TRADES LOOP FOOTER */}
        <hr style={{ border: '0', height: '1px', background: '#eee', margin: '60px 0 40px 0' }} />
        <RecentTrades />

      </main>
    </div>
  );
}

export default App;