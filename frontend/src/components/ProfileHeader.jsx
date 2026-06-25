import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import udiPfp from '../assets/udipfp.jpeg'; // Adjust path if needed

export default function ProfileHeader() {
    // 1. Establish data hooks initialized to your clean baseline defaults
    const [userData, setUserData] = useState({
        username: 'loading...',
        avatarUrl: null, // Initialized to null
        brandsInterested: ['aritzia', 'zara', 'lululemon', 'urban outfitters'],
        stylesAesthetics: ['minimalist', 'clean girl', 'coquette', '90s archival']
    });

    // 2. Fetch the session directly out of your Supabase DB container on load
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                // 2. Inside your useEffect fetch block, map it:
                if (user && user.user_metadata) {
                    const meta = user.user_metadata;
                    setUserData({
                        username: meta.username || 'moss curator',
                        avatarUrl: meta.avatar_url || null, // Extracts the uploaded link string
                        brandsInterested: meta.brands_interested || [],
                        stylesAesthetics: meta.styles_aesthetics || []
                    });
                }
            } catch (err) {
                console.warn("Supabase context profile load glitch, falling back to mock layers:", err);
            }
        };

        fetchUserData();
    }, []);

    // Tier definition examples:
    // Tier 1: "Thrift Novice" or "Style Initiate"
    // Tier 2: "Curator" or "Sartorialist"
    // Tier 3: "Archival Connoisseur" or "Fashionista"
    const userTier = {
        level: 3,
        title: "Archival Connoisseur"
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={userData.avatarUrl ? userData.avatarUrl : udiPfp} // Uses DB image if real, otherwise snaps to your fallback!
                        alt="Profile"
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
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
                    {/* DYNAMIC LAYER: Lowercase formatted username context injected directly */}
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
                        {/* DYNAMIC LAYER: Maps the registered arrays directly into the CSS selectors */}
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
                        {/* DYNAMIC LAYER: Maps the custom aesthetics arrays directly into the CSS selectors */}
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