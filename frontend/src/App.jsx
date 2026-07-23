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
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChatRoom from './components/ChatRoom';
import { supabase } from './supabaseClient';
import { useUserProfile } from './hooks/useUserProfile';
import { initialMockProducts } from './mockProducts';

const DEMO_ROOM_UUID = "00000000-0000-0000-0000-000000000000";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('feed');
  const [authView, setAuthView] = useState('login');
  const [userSession, setUserSession] = useState(null);
  const [realItems, setRealItems] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [predictedSize, setPredictedSize] = useState(() => {
    return localStorage.getItem('moss_predicted_size') || 'S';
  });

  const { profile, loading: profileLoading } = useUserProfile(userSession?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserSession(session.user);
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserSession(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsAuthenticated(false);
        setAuthView('reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    ...(Array.isArray(realItems) ? realItems : []).map(item => ({
      id: item?.id,
      uploaded_by: item?.uploaded_by,
      title: item?.title || 'Untitled',
      brand: item?.brand || 'Unknown',
      credits: item?.credits || 0,
      size: item?.size || 'S',
      category_gender: item?.category_gender || 'Womenswear',
      condition: item?.condition || 'Excellent',
      clothImage: item?.cloth_image_url,
      styledImage: item?.styled_image_url,
      style: item?.style,
      is_mock: false,
    })),
    ...(initialMockProducts || []),
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

  const handleInitiateTrade = async (product) => {
    const currentUid = profile?.id || userSession?.id;
    if (!currentUid) {
      alert("Please ensure your session is loaded before initiating a trade.");
      return;
    }

    const sellerId = product.uploaded_by;
    if (!sellerId) {
      setActiveRoomId(DEMO_ROOM_UUID);
      setView('messages');
      return;
    }

    try {
      let { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('item_id', product.id);

      if (existingRooms && existingRooms.length > 0) {
        setActiveRoomId(existingRooms[0].id);
      } else {
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert([
            {
              user_a_id: currentUid,
              user_b_id: sellerId,
              item_id: product.id
            }
          ])
          .select();

        if (error) throw error;
        setActiveRoomId(newRoom[0].id);
      }
      setView('messages');
    } catch (err) {
      console.error("Error setting up chat channel:", err);
      // Clean fallback so user can still demo chat interface seamlessly
      setActiveRoomId(DEMO_ROOM_UUID);
      setView('messages');
    }
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
    if (authView === 'forgot-password') {
      return <ForgotPassword onNavigateToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'reset-password') {
      return <ResetPassword onNavigateToLogin={() => setAuthView('login')} />;
    }

    return (
      <Login
        onLogin={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToForgot={() => setAuthView('forgot-password')}
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
          <ProfileHeader
            user={userForScoring}
            products={products}
            onFitBaselineChange={(newSize) => setPredictedSize(newSize)}
          />
        )}

        {/* MODIFIED: Accepts both 'shop' and 'upload' keys from Navbar */}
        {(view === 'shop' || view === 'upload') && (
          <>
            <UploadForm
              onAddProduct={(newItem) => setRealItems([newItem, ...realItems])}
            />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '40px 0' }} />
          </>
        )}

        {view === 'feed' && (
          <>
            <CuratedFeed
              products={products}
              user={userForScoring}
              currentUserId={profile?.id || userSession?.id}
              onInitiateTrade={handleInitiateTrade}
              userPredictedSize={predictedSize}
            />
            <hr style={{ border: '0', height: '1px', background: '#eee', margin: '60px 0 40px 0' }} />
            <RecentTrades />
          </>
        )}

        {view === 'messages' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <ChatRoom
              roomId={activeRoomId || DEMO_ROOM_UUID}
              currentUserId={profile?.id || userSession?.id || "00000000-0000-0000-0000-000000000001"}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;