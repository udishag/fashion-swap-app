import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const BRAND_TIERS = {
    'aritzia': 3, 'zara': 3, 'urban outfitters': 3, 'lululemon': 3,
    'brandy melville': 3, 'reformation': 3, 'free people': 3,
    'anthropologie': 3, 'madewell': 3, 'cos': 3, 'oak + fort': 3,
    'alo': 3, 'alo yoga': 3, 'ba&sh': 3, 'sezane': 3,
    'gap': 2, 'garage': 2, 'princess polly': 2, 'american eagle': 2,
    'hollister': 2, 'abercrombie': 2, 'abercrombie & fitch': 2,
    'uniqlo': 2, 'banana republic': 2, 'j.crew': 2, 'everlane': 2,
    'frank and oak': 2, 'simons': 2, 'dynamite': 2, 'reitmans': 2,
    'h&m': 1, 'shein': 1, 'walmart': 1, 'pre-owned/thrifted': 1,
    'thrifted': 1, 'vintage': 1, 'target': 1, 'old navy': 1,
    'forever 21': 1, 'joe fresh': 1, 'winners': 1,
};

export default function UploadForm({ onAddProduct }) {
    const [title, setTitle] = useState('');
    const [brand, setBrand] = useState('');
    const [credits, setCredits] = useState('');
    const [size, setSize] = useState('S');
    const [categoryGender, setCategoryGender] = useState('Womenswear');
    const [color, setColor] = useState('');
    const [condition, setCondition] = useState('Excellent');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [clothFile, setClothFile] = useState(null);
    const [styledFile, setStyledFile] = useState(null);

    const handleBrandChange = (e) => {
        const inputBrand = e.target.value;
        setBrand(inputBrand);
        const lowerBrand = inputBrand.toLowerCase().trim();
        setCredits(inputBrand === '' ? '' : (BRAND_TIERS[lowerBrand] || 2).toFixed(1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!title || !brand || !clothFile || !styledFile) {
            setErrorMsg('All fields and images are required.');
            return;
        }

        setSubmitting(true);

        try {
            const { data: clothUpload, error: clothErr } = await supabase.storage
                .from('item-images')
                .upload(`public/${Date.now()}_cloth_${clothFile.name}`, clothFile);
            if (clothErr) throw new Error("Cloth upload failed: " + clothErr.message);

            const { data: styledUpload, error: styledErr } = await supabase.storage
                .from('item-images')
                .upload(`public/${Date.now()}_styled_${styledFile.name}`, styledFile);
            if (styledErr) throw new Error("Styled upload failed: " + styledErr.message);

            const { data: clothData } = supabase.storage.from('item-images').getPublicUrl(clothUpload.path);
            const { data: styledData } = supabase.storage.from('item-images').getPublicUrl(styledUpload.path);

            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr || !authData?.user) throw new Error('You must be logged in to upload.');

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
                    cloth_image_url: clothData.publicUrl,
                    styled_image_url: styledData.publicUrl,
                    is_mock: false,
                })
                .select()
                .single();

            if (insertErr) throw insertErr;

            alert("Listing published successfully with fit metadata!");
            setTitle(''); setBrand(''); setCredits(''); setColor(''); setClothFile(null); setStyledFile(null);
            onAddProduct?.(newItem);

        } catch (err) {
            console.error("Upload error caught:", err);
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ border: '1px solid #111', padding: '40px', maxWidth: '600px', marginBottom: '40px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>LIST AN ITEM ON MOSS</h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '0.1em' }}>[ FIT PREDICTOR COMPATIBLE ]</span>
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="item name" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none' }} required />

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input type="text" placeholder="brand" value={brand} onChange={handleBrandChange} style={{ flex: 2, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none' }} required />
                    <input type="text" value={credits ? `${credits} cr` : ''} readOnly placeholder="credits" style={{ flex: 1, padding: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#6b7280', outline: 'none' }} />
                </div>

                {/* NEW METADATA INPUT ROW */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <select value={size} onChange={(e) => setSize(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <option value="XXS">Size XXS</option>
                        <option value="XS">Size XS</option>
                        <option value="S">Size S</option>
                        <option value="M">Size M</option>
                        <option value="L">Size L</option>
                        <option value="XL">Size XL</option>
                        <option value="PLUS SIZE">Size Plus</option>

                    </select>

                    <select value={categoryGender} onChange={(e) => setCategoryGender(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <option value="Womenswear">Womenswear</option>
                        <option value="Menswear">Menswear</option>
                        <option value="Unisex">Unisex</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input type="text" placeholder="color (e.g. pink, washed denim)" value={color} onChange={(e) => setColor(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none' }} />
                    <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <option value="New with tags">New with tags</option>
                        <option value="Excellent">Excellent condition</option>
                        <option value="Good">Good condition</option>
                        <option value="Fair">Fair / Vintage wear</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, border: '1px dashed #d1d5db', padding: '20px', textAlign: 'center', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.8rem', marginBottom: '8px', fontWeight: '600' }}>1. cloth lay</p>
                        <input type="file" accept="image/*" onChange={(e) => setClothFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} required />
                    </div>
                    <div style={{ flex: 1, border: '1px dashed #d1d5db', padding: '20px', textAlign: 'center', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.8rem', marginBottom: '8px', fontWeight: '600' }}>2. user styled</p>
                        <input type="file" accept="image/*" onChange={(e) => setStyledFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} required />
                    </div>
                </div>
                {errorMsg && <p style={{ color: '#b91c1c', fontSize: '0.8rem', marginBottom: '16px' }}>{errorMsg}</p>}
                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', fontWeight: 'bold', letterSpacing: '0.05em', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'publishing...' : 'publish listing'}
                </button>
            </form>
        </div>
    );
}