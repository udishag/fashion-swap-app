// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProfileHeader.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────


import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import udiPfp from '../assets/udipfp.jpeg';

// Import local friend pfp assets
import franpfp from '../assets/franpfp.jpeg';
import natepfp from '../assets/natepfp.JPG';
import ishaalpfp from '../assets/ishaalpfp.JPG';

// Import the dedicated Fit Predictor Component
import FitPredictor from './FitPredictor';

export default function ProfileHeader({ user, products, onFitBaselineChange }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState({
        username: 'moss curator',
        avatarUrl: null,
        brandsInterested: ['aritzia', 'zara', 'lululemon', 'urban outfitters'],
        stylesAesthetics: ['minimalist', 'clean girl', 'coquette', '90s archival']
    });

    // Friends list using MOSS
    const mockFriends = [
        { name: 'fran', avatar: franpfp },
        { name: 'nathan', avatar: natepfp },
        { name: 'ishaal', avatar: ishaalpfp }
    ];

    // Filter products uploaded by the current logged-in user
    const [userUploadedItems, setUserUploadedItems] = useState([]);

    useEffect(() => {
        const filtered = (products || []).filter(item => item.uploaded_by === user?.id && !item.is_mock);
        setUserUploadedItems(filtered);
    }, [products, user]);

    // Trade stats
    const totalListings = userUploadedItems.length;
    const pendingTradesCount = 1;
    const completedTradesCount = 2;

    const fetchUserData = async () => {
        try {
            const { data: { user: authUser }, error } = await supabase.auth.getUser();

            if (authUser && authUser.user_metadata) {
                const meta = authUser.user_metadata;
                setUserData({
                    username: meta.username || authUser.email?.split('@')[0] || 'moss curator',
                    avatarUrl: meta.avatar_url || null,
                    brandsInterested: meta.brands_interested || ['aritzia', 'zara', 'lululemon'],
                    stylesAesthetics: meta.styles_aesthetics || ['minimalist', 'clean girl']
                });
            }
        } catch (err) {
            console.warn("Supabase context profile load glitch:", err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setUploading(true);
            const file = e.target.files[0];

            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error("No user logged in");

            const fileExt = file.name.split('.').pop();
            const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            alert("Profile picture updated successfully!");
            fetchUserData();
        } catch (error) {
            console.error("Error uploading avatar:", error.message);
        } finally {
            setUploading(false);
        }
    };

    // Mark an uploaded item as SOLD / TRADED
    const handleMarkAsSold = async (itemId) => {
        if (!window.confirm("Mark this piece as Traded/Sold? It will be archived.")) return;

        try {
            const { error } = await supabase
                .from('items')
                .update({ is_sold: true })
                .eq('id', itemId);

            if (error) throw error;

            setUserUploadedItems(prev => prev.filter(item => item.id !== itemId));
            alert("Listing marked as traded!");
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Updated locally for demo!");
            setUserUploadedItems(prev => prev.filter(item => item.id !== itemId));
        }
    };

    return (
        <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '850px', margin: '0 auto' }}>

            {/* --- USER DETAILS SECTION --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleAvatarClick}>
                    <img
                        src={userData.avatarUrl ? userData.avatarUrl : udiPfp}
                        alt="Profile"
                        style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            objectFit: 'cover', border: '1px solid #eaeaea',
                            opacity: uploading ? 0.5 : 1
                        }}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '500', textTransform: 'lowercase' }}>
                        {userData.username}
                    </h1>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                        <strong>3.5</strong> available credits • <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>ARCHIVAL CONNOISSEUR</span>
                    </p>
                    <div style={{ color: '#0066cc', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>✓</span> $10 PREMIUM FEED CURATION ACTIVE
                    </div>
                </div>
            </div>

            {/* --- PREFERENCES SECTION --- */}
            <div style={{ display: 'flex', gap: '60px', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0' }}>Brands Interested</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {userData.brandsInterested.map(b => (
                            <span key={b} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', textTransform: 'lowercase' }}>
                                {b}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0' }}>Styles & Aesthetics</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {userData.stylesAesthetics.map(s => (
                            <span key={s} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', textTransform: 'lowercase' }}>
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FIT PREDICTOR BASELINE COMPONENT --- */}
            <FitPredictor onFitBaselineChange={onFitBaselineChange} />

            {/* --- STATS SECTION --- */}
            <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', backgroundColor: '#fafafa', padding: '20px', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>{totalListings}</div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>your uploads</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #eaeaea', borderRight: '1px solid #eaeaea' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>{pendingTradesCount}</div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>trades pending</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>{completedTradesCount}</div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>trades completed</div>
                </div>
            </div>

            {/* --- GRID SPLIT: UPLOADS & FRIENDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>

                {/* User's Uploaded Clothes Feed */}
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                        Your Closet Uploads
                    </h3>
                    {userUploadedItems.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px' }}>No clothes uploaded yet. Head over to the Upload tab to start listing!</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                            {userUploadedItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#fff', position: 'relative' }}>
                                    <img
                                        src={item.clothImage}
                                        alt={item.title}
                                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                                    />
                                    <div style={{ padding: '8px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>{item.credits} cr</div>

                                        {/* ACTION BUTTON: MARK AS TRADED */}
                                        <button
                                            onClick={() => handleMarkAsSold(item.id)}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#111',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '4px',
                                                fontSize: '9px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Mark Traded
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Friends Using MOSS Section */}
                <div style={{ borderLeft: '1px solid #eaeaea', paddingLeft: '30px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                        Friends on MOSS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {mockFriends.map(friend => (
                            <div key={friend.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={friend.avatar}
                                    alt={friend.name}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                                />
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                                    @{friend.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}