// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProfileHeader.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import udiPfp from '../assets/udipfp.jpeg';

export default function ProfileHeader({ user }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState({
        username: 'moss curator',
        avatarUrl: null,
        brandsInterested: ['aritzia', 'zara', 'lululemon', 'urban outfitters'],
        stylesAesthetics: ['minimalist', 'clean girl', 'coquette', '90s archival']
    });

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

            // Upload to Supabase Storage Bucket 'avatars'
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Save Public URL to user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            alert("Profile picture updated successfully!");
            fetchUserData(); // Refresh view
        } catch (error) {
            console.error("Error uploading avatar:", error.message);
            alert("Error updating profile picture. Make sure an 'avatars' storage bucket is created in Supabase with public read access!");
        } finally {
            setUploading(false);
        }
    };

    const userTier = {
        level: 3,
        title: "Archival Connoisseur"
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
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
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '120px', height: '120px',
                        borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: '11px', opacity: 0, transition: 'opacity 0.2s',
                        hover: { opacity: 1 }
                    }} className="avatar-overlay">
                        {uploading ? "Uploading..." : "Change Photo"}
                    </div>

                    <style>{`.avatar-overlay:hover { opacity: 1 !important; }`}</style>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <button style={{
                        position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: '#fff', border: '1px solid #000', borderRadius: '20px',
                        padding: '4px 12px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                        join the waitlist
                    </button>
                </div>

                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '500', textTransform: 'lowercase' }}>
                        {userData.username}
                    </h1>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                        <strong>3.5</strong> available credits • <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{userTier.title}</span>
                    </p>
                    <div style={{ color: '#0066cc', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>✓</span> $10 PREMIUM FEED CURATION ACTIVE
                    </div>
                </div>
            </div>

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
        </div>
    );
}