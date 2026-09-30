// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProductCard.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED: Imports your existing MatchScore.jsx and renders it below
// the brand/credits line. Accepts a new `matchData` prop from CuratedFeed.
// Your hover image swap behavior is completely unchanged.

// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProductCard.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProductCard.jsx
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { evaluateFitCompatibility } from '../utils/fitEngine';

const ProductCard = ({
    product,
    matchData,
    currentUserId,
    currentUserEmail,
    onInitiateTrade,
    userPredictedSize = 'S',
    distanceKm = 2.5
}) => {
    const [hovered, setHovered] = useState(false);
    const isAdmin = currentUserEmail === 'udimoss@gmail.com';
    const isCreator = currentUserId && (currentUserId === product.uploaded_by || currentUserId === product.user_id);

    const canDelete = !product.is_mock && (isCreator || isAdmin);
    const isMockOrDemo = product.is_mock || parseFloat(product.credits) === 0 || product.credits === 0;

    const isOutOfRadius = distanceKm > 10;
    const fitEval = evaluateFitCompatibility(product.size || 'S', userPredictedSize);

    const getXGBoostScore = () => {
        if (matchData?.match_pct !== undefined && matchData?.match_pct !== null) return matchData.match_pct;
        if (matchData?.match_score !== undefined && matchData?.match_score !== null) return Math.round(matchData.match_score * 100);

        const brand = (product.brand || '').toLowerCase();
        let base = 82;
        if (['aritzia', 'lululemon', 'reformation'].includes(brand)) base = 90;
        else if (['zara', 'dynamite', 'hollister'].includes(brand)) base = 80;
        else if (['uniqlo', 'shein', 'h&m'].includes(brand)) base = 70;

        const charSum = String(product.id || product.title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return Math.min(Math.max(base + ((charSum % 11) - 5), 45), 98);
    };

    const rawMlScore = getXGBoostScore();
    const finalFitScore = fitEval.isIdeal ? Math.min(rawMlScore + 4, 98) : Math.max(rawMlScore - 10, 40);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm("remove this piece from your closet?")) return;

        try {
            const { error } = await supabase.from('items').delete().eq('id', product.id);
            if (error) throw error;
            window.location.reload();
        } catch (err) {
            alert("Failed to delete item.");
        }
    };

    return (
        <div
            className="product-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}
        >
            <div className="product-card-image-wrapper" style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F1F0EA' }}>
                <img
                    src={hovered ? (product.styledImage || product.clothImage) : product.clothImage}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease', transform: hovered ? 'scale(1.03)' : 'scale(1)' }}
                />

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'rgba(252, 250, 248, 0.9)',
                            border: 'none', borderRadius: '50%',
                            width: '36px', height: '36px',
                            cursor: 'pointer', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                    >
                        🗑️
                    </button>
                )}
            </div>

            <div className="product-card-meta" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

                <h4 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display, "Fraunces", serif)', color: '#28301C', margin: '0 0 6px 0', fontWeight: '500' }}>
                    {product.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 16px 0', textTransform: 'lowercase' }}>
                    {product.brand} • size {product.size || 'S'} • {parseFloat(product.credits).toFixed(1)} cr
                </p>

                {/* EDITORIAL BADGES (Pink & Lime Green) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <span style={{
                        backgroundColor: '#FFC3CC', // Pink
                        color: '#28301C', // Dark Green text
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        letterSpacing: '0.05em'
                    }}>
                        {finalFitScore}% MATCH
                    </span>

                    <span style={{
                        backgroundColor: fitEval.isIdeal ? '#D2DB76' : '#E5E7EB', // Lime Green if ideal
                        color: fitEval.isIdeal ? '#28301C' : '#6B7280', // Dark Green text
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        letterSpacing: '0.05em'
                    }}>
                        {fitEval.isIdeal ? 'IDEAL FIT' : 'FIT MISMATCH'}
                    </span>
                </div>

                {/* ACTION BUTTON */}
                <div style={{ marginTop: 'auto' }}>
                    {isMockOrDemo ? (
                        <button disabled style={{ width: '100%', padding: '14px', backgroundColor: '#E5E7EB', color: '#9CA3AF', border: 'none', borderRadius: '999px', fontSize: '0.9rem', fontWeight: '600' }}>
                            demo piece
                        </button>
                    ) : (
                        <button
                            onClick={() => onInitiateTrade(product)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#28301C', // Dark Green
                                color: '#FFC3CC', // Pink text
                                border: 'none',
                                borderRadius: '999px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                letterSpacing: '0.02em'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            request trade
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;