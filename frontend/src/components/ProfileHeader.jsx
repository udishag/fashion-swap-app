import React from 'react';
import udiPfp from '../assets/udipfp.jpeg'; // Adjust path if needed

export default function ProfileHeader() {
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
                        src={udiPfp}
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
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '500' }}>Udisha Gunawardena</h1>
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
                        {['aritzia', 'zara', 'lululemon', 'urban outfitters'].map(b => (
                            <span key={b} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}>{b}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0' }}>Styles & Aesthetics</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['minimalist', 'clean girl', 'coquette', '90s archival'].map(s => (
                            <span key={s} style={{ border: '1px solid #ddd', borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}>{s}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}