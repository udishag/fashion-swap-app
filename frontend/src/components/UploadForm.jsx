import React, { useState } from 'react';

const UploadForm = ({ onAddProduct }) => {
    const [title, setTitle] = useState('');
    const [brand, setBrand] = useState('');
    const [credits, setCredits] = useState('');
    const [clothFile, setClothFile] = useState(null);
    const [styledFile, setStyledFile] = useState(null);

    // Track visual UI preview strings separate from binary data blobs
    const [clothPreview, setClothPreview] = useState(null);
    const [styledPreview, setStyledPreview] = useState(null);

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !brand || !clothFile || !styledFile) {
            alert("MOSS needs a title, brand, item photo, and style match photo to list!");
            return;
        }

        // Prepare multi-part network boundary submission form
        const formData = new FormData();
        formData.append('title', title);
        formData.append('brand', brand);
        formData.append('credits', credits || 0);
        formData.append('clothImage', clothFile);
        formData.append('styledImage', styledFile);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/upload', {
                method: 'POST',
                body: formData, // Browser sets correct header type automatically
            });

            if (response.ok) {
                const savedProduct = await response.json();
                onAddProduct(savedProduct); // Updates parent state feed loop live

                // Clear all states
                setTitle(''); setBrand(''); setCredits('');
                setClothFile(null); setStyledFile(null);
                setClothPreview(null); setStyledPreview(null);
            } else {
                alert("Upload failed. Make sure your Python backend is running.");
            }
        } catch (error) {
            console.error("Networking Pipeline Error:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '550px', margin: '0 auto', padding: '30px', border: '1px solid #000', borderRadius: '0px' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', fontSize: '1.1rem' }}>List an Item on MOSS</h3>

            <div style={{ marginBottom: '15px' }}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ITEM NAME" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="BRAND (e.g. Aritzia, Vintage)" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input type="number" step="0.1" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="CREDIT VALUE (e.g. 3.0)" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                <div style={{ flex: 1, border: '1px dashed #ccc', padding: '10px', textAlign: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>1. CLOTH LAY</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setClothFile, setClothPreview)} style={{ width: '100%', fontSize: '0.7rem' }} />
                    {clothPreview && <img src={clothPreview} alt="Lay preview" style={{ width: '100%', height: '120px', objectFit: 'cover', marginTop: '10px' }} />}
                </div>

                <div style={{ flex: 1, border: '1px dashed #ccc', padding: '10px', textAlign: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>2. USER STYLED</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setStyledFile, setStyledPreview)} style={{ width: '100%', fontSize: '0.7rem' }} />
                    {styledPreview && <img src={styledPreview} alt="Styled preview" style={{ width: '100%', height: '120px', objectFit: 'cover', marginTop: '10px' }} />}
                </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                PUBLISH LISTING
            </button>
        </form>
    );
};

export default UploadForm;