// frontend/src/components/ProfileHeader.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const convertBraToInches = (inputValue) => {
    if (!inputValue) return null;
    if (!isNaN(inputValue)) return parseFloat(inputValue);
    const match = String(inputValue).toUpperCase().trim().match(/(\d+)([A-Z]+)/);
    if (!match) return parseFloat(inputValue) || null;
    const band = parseInt(match[1]);
    const cup = match[2];
    const cupValues = { 'AA': 0.5, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'DD': 5, 'E': 6, 'F': 7 };
    return band + (cupValues[cup] || 2);
};

export default function ProfileHeader({ user, profileUser, onStartMessage }) {
    const isOwnProfile = !profileUser;
    const displayUser = profileUser || user;

    const [activeTab, setActiveTab] = useState('measurements');
    const [isEditingFit, setIsEditingFit] = useState(false);
    const [measurements, setMeasurements] = useState({ bustInput: '', waist: '', hips: '' });
    const [savedBustInches, setSavedBustInches] = useState(null);
    const [bodyScanFile, setBodyScanFile] = useState(null);
    const [bodyScanUrl, setBodyScanUrl] = useState(null);
    const [brands, setBrands] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!displayUser?.id) return;
            const { data } = await supabase.from('profiles').select('bust, waist, hips, body_scan_url, brands_interested').eq('id', displayUser.id).single();
            if (data) {
                setMeasurements({ bustInput: data.bust ? String(data.bust) : '', waist: data.waist || '', hips: data.hips || '' });
                setSavedBustInches(data.bust || null);
                setBodyScanUrl(data.body_scan_url || null);
                setBrands(data.brands_interested || ['Aritzia', 'Zara', 'Reformation']);
            }
        };
        fetchProfileData();
    }, [displayUser]);

    const handleSaveFitProfile = async () => {
        setIsSaving(true);
        const calculatedBust = convertBraToInches(measurements.bustInput);
        let finalImageUrl = bodyScanUrl;

        try {
            if (bodyScanFile) {
                const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('item-images')
                    .upload(`public/${Date.now()}_bodyscan_${bodyScanFile.name}`, bodyScanFile);
                if (uploadErr) throw uploadErr;
                finalImageUrl = supabase.storage.from('item-images').getPublicUrl(uploadData.path).data.publicUrl;
            }

            await supabase.from('profiles').update({
                bust: calculatedBust,
                waist: parseFloat(measurements.waist) || null,
                hips: parseFloat(measurements.hips) || null,
                body_scan_url: finalImageUrl
            }).eq('id', user.id);

            setSavedBustInches(calculatedBust);
            setBodyScanUrl(finalImageUrl);
            setIsEditingFit(false);
        } catch (error) {
            alert("Failed to update fit profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBrand = async () => {
        const newBrand = prompt("Enter a brand you love:");
        if (!newBrand || !newBrand.trim()) return;

        const updatedBrands = [...brands, newBrand.trim()];
        setBrands(updatedBrands);
        await supabase.from('profiles').update({ brands_interested: updatedBrands }).eq('id', user.id);
    };

    // MOSS Aesthetic Colors
    const mossColors = ['#F7DDD5', '#FFC3CC', '#D2DB76'];
    const inputStyle = { width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #28301C', background: 'transparent', outline: 'none', fontSize: '1rem', color: '#28301C', marginBottom: '24px', fontFamily: 'var(--font-body)' };
    const labelStyle = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65613F', display: 'block', marginBottom: '4px', fontWeight: '600' };

    const tabStyle = (isActive) => ({
        background: 'none', border: 'none', fontSize: '0.95rem',
        fontWeight: isActive ? '700' : '500',
        color: isActive ? '#28301C' : '#9ca3af',
        borderBottom: isActive ? '2px solid #28301C' : '2px solid transparent',
        paddingBottom: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em', textTransform: 'lowercase'
    });

    const displayName = displayUser?.username || displayUser?.email?.split('@')[0] || 'moss user';

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

            {/* HEADER */}
            <div style={{ textAlign: 'center', padding: '60px 0 40px 0' }}>
                <h1 style={{ fontFamily: 'var(--font-display, "Fraunces", serif)', fontSize: '3.8rem', color: '#28301C', margin: '0 0 16px 0', letterSpacing: '-0.03em', textTransform: 'lowercase' }}>
                    {displayName}.
                </h1>
                <p style={{ color: '#65613F', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>
                    Toronto, ON • Fashion & Lifestyle
                </p>
            </div>

            {/* SCROLLING PILL BRANDS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '60px', alignItems: 'center' }}>
                {brands.map((b, idx) => (
                    <span key={idx} style={{
                        padding: '8px 24px',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        color: '#28301C',
                        fontWeight: '600',
                        backgroundColor: mossColors[idx % mossColors.length],
                        border: '1px solid rgba(40,48,28,0.1)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        {b}
                    </span>
                ))}
                {isOwnProfile && (
                    <button onClick={handleAddBrand} style={{
                        padding: '6px 20px',
                        borderRadius: '999px',
                        fontSize: '1.2rem',
                        color: '#28301C',
                        backgroundColor: 'transparent',
                        border: '1px dashed #28301C',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        opacity: 0.7
                    }}
                        onMouseOver={(e) => e.target.style.opacity = 1}
                        onMouseOut={(e) => e.target.style.opacity = 0.7}
                    >
                        +
                    </button>
                )}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', borderBottom: '1px solid #eaeaea', marginBottom: '40px' }}>
                <button style={tabStyle(activeTab === 'measurements')} onClick={() => setActiveTab('measurements')}>fit metrics</button>
                <button style={tabStyle(activeTab === 'closet')} onClick={() => setActiveTab('closet')}>my closet</button>
                <button style={tabStyle(activeTab === 'trades')} onClick={() => setActiveTab('trades')}>trade history</button>
            </div>

            {/* TAB CONTENT: MEASUREMENTS */}
            {activeTab === 'measurements' && (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#28301C', margin: 0 }}>your metrics.</h3>
                        {isOwnProfile && (
                            <button onClick={() => setIsEditingFit(true)} style={{ padding: '10px 24px', backgroundColor: '#D2DB76', color: '#28301C', border: 'none', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                calibrate fit
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', backgroundColor: '#FCFAF8', padding: '40px', borderRadius: '24px', border: '1px solid rgba(40,48,28,0.1)' }}>
                        {/* Mannequin Display */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '160px', height: '220px', borderRadius: '16px', backgroundColor: '#F7DDD5', overflow: 'hidden', border: '1px solid rgba(40,48,28,0.1)' }}>
                                {bodyScanUrl ? (
                                    <img src={bodyScanUrl} alt="Mannequin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28301C', fontSize: '0.8rem', textAlign: 'center', padding: '20px', fontWeight: '600' }}>upload base silhouette</div>
                                )}
                            </div>
                        </div>

                        {/* Metrics Display */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(40,48,28,0.1)', paddingBottom: '16px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#65613F', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Bust</span>
                                <span style={{ fontSize: '1.2rem', color: '#28301C', fontWeight: '700' }}>{savedBustInches || '--'}"</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(40,48,28,0.1)', paddingBottom: '16px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#65613F', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Waist</span>
                                <span style={{ fontSize: '1.2rem', color: '#28301C', fontWeight: '700' }}>{measurements.waist || '--'}"</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#65613F', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Hips</span>
                                <span style={{ fontSize: '1.2rem', color: '#28301C', fontWeight: '700' }}>{measurements.hips || '--'}"</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CLOSET & TRADES */}
            {activeTab === 'closet' && (
                <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center', padding: '80px 20px', backgroundColor: '#FCFAF8', borderRadius: '24px', border: '1px solid rgba(40,48,28,0.1)' }}>
                    <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#28301C', margin: '0 0 12px 0' }}>curated pieces.</h3>
                    <p style={{ color: '#65613F', fontSize: '0.95rem' }}>Your uploaded items will appear here beautifully gridded.</p>
                </div>
            )}

            {activeTab === 'trades' && (
                <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center', padding: '80px 20px', backgroundColor: '#FCFAF8', borderRadius: '24px', border: '1px solid rgba(40,48,28,0.1)' }}>
                    <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#28301C', margin: '0 0 12px 0' }}>trade history.</h3>
                    <p style={{ color: '#65613F', fontSize: '0.95rem' }}>Your past exchanges and pending requests.</p>
                </div>
            )}

            {/* Modal Overlay */}
            {isEditingFit && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(252,250,248,0.8)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #D2DB76' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 32px 0', color: '#28301C', fontSize: '2rem', textTransform: 'lowercase' }}>calibration.</h2>

                        <label style={labelStyle}>Your Mannequin Photo</label>
                        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="file" accept="image/*" onChange={(e) => setBodyScanFile(e.target.files[0])} style={{ fontSize: '0.9rem', padding: '12px 0' }} />
                        </div>

                        <label style={labelStyle}>Bust (Inches or Bra Size)</label>
                        <input type="text" value={measurements.bustInput} onChange={(e) => setMeasurements({ ...measurements, bustInput: e.target.value })} style={inputStyle} placeholder="e.g. 36C or 39" />

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Waist</label>
                                <input type="number" step="0.5" value={measurements.waist} onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })} style={inputStyle} placeholder="28" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Hips</label>
                                <input type="number" step="0.5" value={measurements.hips} onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })} style={inputStyle} placeholder="38" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                            <button onClick={() => setIsEditingFit(false)} style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', border: '1px solid #28301C', borderRadius: '999px', color: '#28301C', cursor: 'pointer', fontWeight: '600' }}>cancel</button>
                            <button onClick={handleSaveFitProfile} disabled={isSaving} style={{ flex: 1, padding: '16px', backgroundColor: '#28301C', border: 'none', borderRadius: '999px', color: '#D2DB76', cursor: 'pointer', fontWeight: '600' }}>
                                {isSaving ? 'saving...' : 'save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}