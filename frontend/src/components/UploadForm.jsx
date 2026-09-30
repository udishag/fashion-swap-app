// frontend/src/components/UploadForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getCityCoordinates } from '../utils/cities';

const BRAND_TIERS = {
    'aritzia': 3, 'zara': 3, 'urban outfitters': 3, 'lululemon': 3,
    'brandy melville': 3, 'reformation': 3, 'free people': 3,
    'anthropologie': 3, 'madewell': 3, 'cos': 3, 'oak + fort': 3,
    'alo': 3, 'alo yoga': 3, 'ba&sh': 3, 'sezane': 3,
    'gap': 2, 'garage': 2, 'princess polly': 2, 'american eagle': 2,
    'hollister': 2, 'abercrombie': 2, 'abercrombie & fitch': 2,
    'uniqlo': 2, 'banana republic': 2, 'j.crew': 2, 'everlane': 2,
    'h&m': 1, 'shein': 1, 'thrifted': 1, 'vintage': 1, 'winners': 1,
};

export default function UploadForm({ onAddProduct }) {
    // FORM STATES
    const [title, setTitle] = useState('');
    const [brand, setBrand] = useState('');
    const [credits, setCredits] = useState('');
    const [size, setSize] = useState('S');
    const [categoryGender, setCategoryGender] = useState('Womenswear');
    const [color, setColor] = useState('');
    const [condition, setCondition] = useState('Excellent');
    const [details, setDetails] = useState('');

    // NEW: MEASUREMENT STATES
    const [bust, setBust] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');

    const [selectedCity, setSelectedCity] = useState('mississauga');

    // UI STATES
    const [submitting, setSubmitting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);

    // CAMERA/FILE STATES
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);

    useEffect(() => {
        const hasConsented = localStorage.getItem('moss_ai_consent');
        if (!hasConsented) setShowConsentModal(true);
    }, []);

    const updateBrandAndCredits = (inputBrand) => {
        setBrand(inputBrand);
        const lowerBrand = inputBrand.toLowerCase().trim();
        setCredits(inputBrand === '' ? '' : (BRAND_TIERS[lowerBrand] || 2).toFixed(1));
    };

    const handleFileChange = (e, isFront) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isFront) {
            setFrontFile(file);
            setFrontPreview(URL.createObjectURL(file));
        } else {
            setBackFile(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    const handleLensScan = async () => {
        if (!frontFile) {
            setErrorMsg("please provide at least a front image to scan.");
            return;
        }

        setAnalyzing(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('image_front', frontFile);
        if (backFile) formData.append('image_back', backFile);

        try {
            const res = await fetch('http://127.0.0.1:5001/api/analyze-item', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server crashed without returning an error message');
            }

            const data = await res.json();

            // 1. Auto-fill the standard details
            if (data.title) setTitle(data.title);
            if (data.color) setColor(data.color);
            if (data.categoryGender) setCategoryGender(data.categoryGender);
            if (data.condition) setCondition(data.condition);
            if (data.size) setSize(data.size);
            if (data.details) setDetails(data.details);
            if (data.brand) updateBrandAndCredits(data.brand);

            // 2. Auto-fill the physical measurements (NEW)
            if (data.estimated_measurements) {
                if (data.estimated_measurements.bust) setBust(String(data.estimated_measurements.bust));
                if (data.estimated_measurements.waist) setWaist(String(data.estimated_measurements.waist));
                if (data.estimated_measurements.hips) setHips(String(data.estimated_measurements.hips));
            }

            setHasScanned(true);
        } catch (err) {
            console.error('Vision error caught:', err.message);
            setErrorMsg(`moss lens error: ${err.message}`);
            setHasScanned(true);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!title || !brand || !frontFile) {
            setErrorMsg('required fields and a front image are missing.');
            return;
        }

        setSubmitting(true);

        try {
            const { data: frontUpload, error: frontErr } = await supabase.storage
                .from('item-images')
                .upload(`public/${Date.now()}_front_${frontFile.name}`, frontFile);
            if (frontErr) throw new Error(frontErr.message);

            let backUrl = null;
            if (backFile) {
                const { data: backUpload } = await supabase.storage
                    .from('item-images')
                    .upload(`public/${Date.now()}_back_${backFile.name}`, backFile);
                backUrl = supabase.storage.from('item-images').getPublicUrl(backUpload.path).data.publicUrl;
            }

            const frontUrl = supabase.storage.from('item-images').getPublicUrl(frontUpload.path).data.publicUrl;
            const { data: authData } = await supabase.auth.getUser();

            const { data: newItem, error: insertErr } = await supabase
                .from('items')
                .insert({
                    uploaded_by: authData.user.id,
                    title,
                    brand: brand.trim().toLowerCase(),
                    credits: parseFloat(credits) || 0.0,
                    size,
                    category_gender: categoryGender,
                    color: color.trim().toLowerCase() || 'multi',
                    condition,
                    cloth_image_url: frontUrl,
                    styled_image_url: backUrl || frontUrl,
                    is_mock: false,
                    // NEW: Saving measurements to the database
                    bust: bust ? parseFloat(bust) : null,
                    waist: waist ? parseFloat(waist) : null,
                    hips: hips ? parseFloat(hips) : null
                })
                .select().single();

            if (insertErr) throw insertErr;

            alert("listing curated successfully!");
            setTitle(''); setBrand(''); setCredits(''); setColor(''); setDetails('');
            setBust(''); setWaist(''); setHips('');
            setFrontFile(null); setBackFile(null); setFrontPreview(null); setBackPreview(null); setHasScanned(false);
            onAddProduct?.(newItem);

        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = { width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #D2DB76', background: 'transparent', outline: 'none', fontSize: '1rem', color: '#28301C', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' };
    const labelStyle = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65613F', display: 'block', marginBottom: '4px', fontWeight: '500' };

    return (
        <div style={{ position: 'relative', maxWidth: '650px', margin: '0 auto', padding: '20px 0', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>
            {/* ... Modal and Image Upload remain untouched for brevity, keep your exact previous code here ... */}

            {showConsentModal && (
                <div style={{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, backgroundColor: 'rgba(247,221,213,0.95)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: '2.8rem', color: '#28301C', fontFamily: 'var(--font-display, "Fraunces", serif)' }}>moss lens.</h2>
                    <p style={{ margin: '0 0 32px 0', color: '#28301C', fontSize: '1rem', lineHeight: '1.6', maxWidth: '340px' }}>
                        snap your pieces. our vision ai will extract the brand, style, and fit effortlessly.
                    </p>
                    <button onClick={() => { localStorage.setItem('moss_ai_consent', 'true'); setShowConsentModal(false); }} style={{ padding: '16px 36px', backgroundColor: '#28301C', color: '#FFC3CC', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.02em', transition: 'transform 0.2s' }}>
                        open lens
                    </button>
                </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '2.4rem', margin: '0 0 8px 0', color: '#28301C', fontFamily: 'var(--font-display, "Fraunces", serif)', fontWeight: '500', textTransform: 'lowercase', letterSpacing: '-0.02em' }}>curate your closet.</h3>
                <span style={{ fontSize: '0.85rem', color: '#65613F', letterSpacing: '0.05em', textTransform: 'uppercase' }}>powered by vision ai</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ position: 'relative', aspectRatio: '3/4', backgroundColor: 'var(--moss-cream, #FCFAF8)', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {frontPreview ? (
                        <img src={frontPreview} alt="Front preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <label style={{ cursor: 'pointer', textAlign: 'center', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '30px', backgroundColor: '#FFC3CC', color: '#28301C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px' }}>📷</div>
                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#28301C', marginBottom: '8px' }}>front / flat lay</span>
                            <span style={{ fontSize: '0.85rem', color: '#65613F' }}>required</span>
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, true)} style={{ display: 'none' }} />
                        </label>
                    )}
                    {analyzing && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(252,250,248,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28301C', fontWeight: '600', fontSize: '1.1rem' }}>
                            analyzing fabric & fit...
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, backgroundColor: '#F7DDD5', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                        {backPreview ? (
                            <img src={backPreview} alt="Back/Tag preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <label style={{ cursor: 'pointer', textAlign: 'center', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>🏷️</div>
                                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#28301C', marginBottom: '4px' }}>brand tag</span>
                                <span style={{ fontSize: '0.75rem', color: '#65613F' }}>highly recommended</span>
                                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, false)} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>
                    {!hasScanned && (
                        <button onClick={handleLensScan} disabled={analyzing || !frontFile} style={{ padding: '20px', backgroundColor: '#28301C', color: '#FFC3CC', border: 'none', borderRadius: '20px', cursor: (analyzing || !frontFile) ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'opacity 0.2s', opacity: (!frontFile || analyzing) ? 0.6 : 1 }}>
                            {analyzing ? 'scanning...' : 'extract details ✨'}
                        </button>
                    )}
                </div>
            </div>

            {errorMsg && <p style={{ color: '#28301C', fontSize: '0.9rem', textAlign: 'center', padding: '16px', backgroundColor: '#FFC3CC', borderRadius: '12px', fontWeight: '500' }}>{errorMsg}</p>}

            {hasScanned && (
                <form onSubmit={handleSubmit} style={{ animation: 'fadeIn 0.5s ease', backgroundColor: 'transparent', padding: '10px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

                        <div>
                            <label style={labelStyle}>item title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...inputStyle, fontSize: '1.4rem', fontFamily: 'var(--font-display, "Fraunces", serif)' }} required />
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ flex: 2 }}>
                                <label style={labelStyle}>brand</label>
                                <input type="text" value={brand} onChange={(e) => updateBrandAndCredits(e.target.value)} style={inputStyle} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>credits</label>
                                <input type="text" value={credits ? `${credits} cr` : ''} readOnly style={{ ...inputStyle, color: '#28301C', fontWeight: '700' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>size</label>
                                <select value={size} onChange={(e) => setSize(e.target.value)} style={inputStyle}>
                                    {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'PLUS'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>colorway</label>
                                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        {/* NEW: Measurement Inputs */}
                        <div style={{ display: 'flex', gap: '24px', backgroundColor: '#F9F9F9', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Bust (in)</label>
                                <input type="number" step="0.5" placeholder="e.g. 33" value={bust} onChange={(e) => setBust(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Waist (in)</label>
                                <input type="number" step="0.5" placeholder="e.g. 28" value={waist} onChange={(e) => setWaist(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Hips (in)</label>
                                <input type="number" step="0.5" placeholder="e.g. 39" value={hips} onChange={(e) => setHips(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>style notes & fabric details</label>
                            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} style={inputStyle} />
                        </div>

                        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '18px', marginTop: '16px', backgroundColor: '#28301C', color: '#D2DB76', border: 'none', borderRadius: '999px', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.02em', cursor: submitting ? 'wait' : 'pointer' }}>
                            {submitting ? 'publishing to feed...' : 'publish to closet'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}