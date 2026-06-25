// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/App.jsx  (replaces existing file)
// ────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED FROM YOUR ORIGINAL:
// 1. Removed the fetch() to a Java backend — never actually connected in
//    your running app, confirmed earlier.
// 2. Added useUserProfile(userSession?.email) — pulls brands_interested,
//    style_preferences, has_premium, uploaded_brands from Supabase,
//    looked up by EMAIL (matching how your real Login.jsx works — no
//    Login/Register/CSS changes needed).
// 3. Products are now real Supabase items (from the new `items` table)
//    merged with your mock baseline, instead of items from a dead backend
//    endpoint.
// 4. CuratedFeed receives a `user` prop built from real profile data.
//
// NOTHING in Login.jsx, Register.jsx, or their CSS needs to change.

// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/App.jsx
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CuratedFeed from './components/CuratedFeed';
import UploadForm from './components/UploadForm';
import ProfileHeader from './components/ProfileHeader';
import RecentTrades from './components/RecentTrades';
import Login from './components/Login';
import Register from './components/Register';
import { supabase } from './supabaseClient';
import { useUserProfile } from './hooks/useUserProfile';

import { initialMockProducts } from './mockProducts';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('feed');
  const [authView, setAuthView] = useState('login');
  const [userSession, setUserSession] = useState(null);
  const [realItems, setRealItems] = useState([]);

  // Looked up by the real Supabase auth UUID now that Login/Register use
  // actual supabase.auth sessions (signInWithPassword / signUp).
  const { profile, loading: profileLoading } = useUserProfile(userSession?.id);

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Could not load real items, using mock baseline only.", error);
          return;
        }
        setRealItems(data ?? []);
      });
  }, []);

  const products = [
    ...realItems.map(item => ({
      id: item.id,
      uploaded_by: item.uploaded_by,
      title: item.title,
      brand: item.brand,
      credits: item.credits,
      clothImage: item.cloth_image_url,
      styledImage: item.styled_image_url,
      style: item.style,
      lat: item.lat,
      lon: item.lon,
      is_mock: false,
    })),
    ...initialMockProducts,
  ];

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

  const userForScoring = {
    email: userSession?.email,
    id: userSession?.id,
    brands_interested: profile?.brands_interested ?? [],
    style_preferences: profile?.style_preferences ?? [],
    has_premium: profile?.has_premium ?? false,
    uploaded_brands: profile?.uploaded_brands ?? [],
    lat: profile?.lat,
    lon: profile?.lon,
  };

  return (
    <div className="app-shell">
      <header className="page-container">
        <Navbar setView={setView} onLogout={handleLogout} />
      </header>

      <main className="page-container" style={{ paddingBottom: '60px' }}>

        {view === 'profile' && (
          <ProfileHeader user={userForScoring} />
        )}

        {view === 'shop' && (
          <>
            <UploadForm
              onAddProduct={(newItem) => setRealItems([newItem, ...realItems])}
            />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '40px 0' }} />
          </>
        )}

        <CuratedFeed
          products={products}
          user={userForScoring}
          currentUserId={profile?.id}
        />

        <hr style={{ border: '0', height: '1px', background: '#eee', margin: '60px 0 40px 0' }} />
        <RecentTrades />

      </main>
    </div>
  );
}

export default App;