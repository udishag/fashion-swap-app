// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProfileHeader.jsx 
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import udiPfp from '../assets/udipfp.jpeg';

// Import the dedicated Components
import FitPredictor from './FitPredictor';
import FriendManager from './FriendManager';

export default function ProfileHeader({ user, products, profileUser, onOpenFriendProfile, onStartMessage, onFitBaselineChange }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Custom aesthetic notification state
    const [toast, setToast] = useState('');

    const isMyProfile = !profileUser;

    const [userData, setUserData] = useState({
        username: 'moss curator',
        avatarUrl: null,
        brandsInterested: ['aritzia', 'zara', 'lululemon', 'urban outfitters'],
        stylesAesthetics: ['minimalist', 'clean girl', 'coquette', '90s archival']
    });

    const displayUser = isMyProfile ? userData : profileUser;

    // AESTHETIC POPUP HELPER
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000); // Disappears after 3 seconds
    };

    // FIXED CACHE/FLASHING GLITCH: Calculate items synchronously during render, NOT in a useEffect
    const targetIdentifier = isMyProfile ? user?.id : profileUser?.username;
    const userUploadedItems = (products || []).filter(item => {
        if (isMyProfile) {
            return item.uploaded_by === user?.id && !item.is_mock && !item.is_sold;
        } else {
            return item.uploaded_by === targetIdentifier || (item.brand && !item.is_sold);
        }
    });

    const totalListings = userUploadedItems.length;

    const fetchUserData = async () => {
        if (!isMyProfile) return;
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

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
    }, [user, isMyProfile]);

    const handleAvatarClick = () => {
        if (!isMyProfile) return;
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

            showToast("profile picture updated.");
            fetchUserData();
        } catch (error) {
            showToast("error uploading image.");
        } finally {
            setUploading(false);
        }
    };

    const handleMarkAsSold = async (itemId) => {
        if (!isMyProfile) return;
        if (!window.confirm("mark this piece as traded/sold? it will be archived.")) return;

        try {
            const { error } = await supabase
                .from('items')
                .update({ is_sold: true })
                .eq('id', itemId);

            if (error) throw error;
            showToast("listing marked as traded.");
        } catch (err) {
            showToast("updated locally for demo.");
        }
    };

    return (
        <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>

            {/* --- CUSTOM MOSS AESTHETIC TOAST NOTIFICATION --- */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: '500',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    textTransform: 'lowercase',
                    letterSpacing: '0.5px'
                }}>
                    {toast}
                </div>
            )}

            {/* --- USER DETAILS SECTION --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
                <div style={{ position: 'relative', cursor: isMyProfile ? 'pointer' : 'default' }} onClick={handleAvatarClick}>
                    <img
                        src={displayUser.avatarUrl || udiPfp}
                        alt="Profile"
                        style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            objectFit: 'cover', border: '1px solid #eaeaea',
                            opacity: uploading ? 0.5 : 1
                        }}
                    />
                    {isMyProfile && (
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    )}
                </div>

                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '500', textTransform: 'lowercase' }}>
                        @{displayUser.username}
                    </h1>

                    {isMyProfile ? (
                        <>
                            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                                <strong>3.5</strong> available credits • <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>ARCHIVAL CONNOISSEUR</span>
                            </p>
                            <div style={{ color: '#0066cc', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>✓</span> $10 PREMIUM FEED CURATION ACTIVE
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>
                                MOSS Member • Active Closet Curator
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => onStartMessage(displayUser)}
                                    style={{
                                        backgroundColor: '#000000',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '20px',
                                        padding: '8px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    message @{displayUser.username}
                                </button>
                                <button
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('friendships')
                                            .insert([{ user_id: user?.id, friend_id: displayUser.id, status: 'pending' }]);

                                        if (error) {
                                            showToast("request already sent.");
                                        } else {
                                            showToast("friend request sent.");
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        color: '#000000',
                                        border: '1px solid #000000',
                                        borderRadius: '20px',
                                        padding: '8px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    add friend
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PREFERENCES SECTION --- */}
            <div style={{ display: 'flex', gap: '60px', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0' }}>Brands Interested</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {(displayUser.brandsInterested || []).map(b => (
                            <span key={b} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', textTransform: 'lowercase' }}>
                                {b}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0' }}>Styles & Aesthetics</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {(displayUser.stylesAesthetics || []).map(s => (
                            <span key={s} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', textTransform: 'lowercase' }}>
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FIT PREDICTOR BASELINE COMPONENT --- */}
            {isMyProfile && (
                <FitPredictor onFitBaselineChange={onFitBaselineChange} />
            )}

            {/* --- STATS SECTION --- */}
            {isMyProfile && (
                <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', backgroundColor: '#fafafa', padding: '20px', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>{totalListings}</div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>your uploads</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #eaeaea', borderRight: '1px solid #eaeaea' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>1</div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>trades pending</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>2</div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginTop: '4px' }}>trades completed</div>
                    </div>
                </div>
            )}

            {/* --- GRID SPLIT: UPLOADS & FRIENDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>

                {/* Closet Uploads Feed */}
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                        {isMyProfile ? 'Your Closet Uploads' : `@${displayUser.username}'s Closet`}
                    </h3>
                    {userUploadedItems.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px' }}>no active listings available right now.</p>
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

                                        {isMyProfile && (
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
                                                mark traded
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SOCIAL GRAPH: Managed by FriendManager */}
                <FriendManager
                    currentUser={user}
                    isMyProfile={isMyProfile}
                    onOpenFriendProfile={onOpenFriendProfile}
                />

            </div>

        </div>
    );
}