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
            console.log("1. Starting upload for:", clothFile.name);

            const { data: clothUpload, error: clothErr } = await supabase.storage
                .from('item-images')
                .upload(`public/${Date.now()}_cloth_${clothFile.name}`, clothFile);
            if (clothErr) throw new Error("Cloth upload failed: " + clothErr.message);
            console.log("2. Cloth uploaded successfully:", clothUpload);

            const { data: styledUpload, error: styledErr } = await supabase.storage
                .from('item-images')
                .upload(`public/${Date.now()}_styled_${styledFile.name}`, styledFile);
            if (styledErr) throw new Error("Styled upload failed: " + styledErr.message);
            console.log("3. Styled uploaded successfully:", styledUpload);

            const { data: clothData } = supabase.storage.from('item-images').getPublicUrl(clothUpload.path);
            const { data: styledData } = supabase.storage.from('item-images').getPublicUrl(styledUpload.path);

            // GET REAL AUTH USER — this is the auth.uid() that the RLS policy checks
            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr || !authData?.user) throw new Error('You must be logged in to upload.');

            console.log("4. Inserting into DB with URLs:", clothData.publicUrl, styledData.publicUrl);

            const { data: newItem, error: insertErr } = await supabase
                .from('items')
                .insert({
                    uploaded_by: authData.user.id,
                    title,
                    brand: brand.trim().toLowerCase(),
                    credits: parseFloat(credits) || 0.0,
                    cloth_image_url: clothData.publicUrl,
                    styled_image_url: styledData.publicUrl,
                    is_mock: false,
                })
                .select()
                .single();

            if (insertErr) throw insertErr;

            console.log("5. Insert Successful!");
            alert("Listing published successfully!");
            setTitle(''); setBrand(''); setCredits(''); setClothFile(null); setStyledFile(null);
            onAddProduct?.(newItem);

        } catch (err) {
            console.error(">>> FULL UPLOAD ERROR CAUGHT <<< :", err);
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ border: '1px solid #111', padding: '40px', maxWidth: '600px', marginBottom: '40px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>LIST AN ITEM ON MOSS</h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '0.1em' }}>[ PREVIEW MODE ]</span>
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="item name" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none' }} required />
                <input type="text" placeholder="brand" value={brand} onChange={handleBrandChange} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none' }} required />
                <input type="text" value={credits} readOnly style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#6b7280', outline: 'none' }} />

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
                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', backgroundColor: '#4b5563', color: 'white', border: 'none', fontWeight: 'bold', letterSpacing: '0.05em', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'uploading...' : 'publish listing'}
                </button>
            </form>
        </div>
    );
}