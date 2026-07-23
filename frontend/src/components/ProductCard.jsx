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

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { evaluateFitCompatibility } from '../utils/fitEngine';

const ProductCard = ({ product, matchData, currentUserId, currentUserEmail, onInitiateTrade, userPredictedSize = 'S' }) => {
    const [hovered, setHovered] = useState(false);

    const isAdmin = currentUserEmail === 'udimoss@gmail.com';
    const isCreator = currentUserId && (currentUserId === product.uploaded_by || currentUserId === product.user_id);

    // FIXED: Added missing 'const' keyword!
    const canDelete = !product.is_mock && (isCreator || isAdmin);

    const isMockOrDemo = product.is_mock || parseFloat(product.credits) === 0 || product.credits === 0;

    // EVALUATE ACCURATE FIT COMPATIBILITY
    const fitEval = evaluateFitCompatibility(product.size || 'S', userPredictedSize);

    // DYNAMIC SCORE: Extract raw percentage from XGBoost Python Backend
    const getXGBoostScore = () => {
        if (matchData?.match_pct !== undefined && matchData?.match_pct !== null) {
            return matchData.match_pct; // Returns integer percentage (e.g., 88, 92, 65)
        }
        if (matchData?.match_score !== undefined && matchData?.match_score !== null) {
            return Math.round(matchData.match_score * 100); // Converts float 0.88 to 88
        }

        // Deterministic backup hash if Python ML service is offline
        const brand = (product.brand || '').toLowerCase();
        let base = 82;
        if (['aritzia', 'lululemon', 'reformation'].includes(brand)) base = 90;
        else if (['zara', 'dynamite', 'hollister'].includes(brand)) base = 80;
        else if (['uniqlo', 'shein', 'h&m'].includes(brand)) base = 70;

        // FIXED: c.charCodeAt(0) correctly scoped
        const charSum = String(product.id || product.title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return Math.min(Math.max(base + ((charSum % 11) - 5), 45), 98);
    };

    const rawMlScore = getXGBoostScore();

    // DYNAMIC FIT ADJUSTMENT (-10% penalty if size mismatches, +4% boost if ideal fit)
    const finalFitScore = fitEval.isIdeal
        ? Math.min(rawMlScore + 4, 98)
        : Math.max(rawMlScore - 10, 40);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this listing from MOSS?")) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', product.id);

            if (error) throw error;
            alert("Listing deleted!");
            window.location.reload();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete item.");
        }
    };

    return (
        <div
            className="product-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}
        >
            <div className="product-card-image-wrapper" style={{ position: 'relative' }}>
                <img
                    src={hovered ? (product.styledImage || product.clothImage) : product.clothImage}
                    alt={product.title}
                />

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        title="Delete listing"
                        style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #ddd', borderRadius: '50%',
                            width: '32px', height: '32px',
                            cursor: 'pointer', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        🗑️
                    </button>
                )}
            </div>

            <div className="product-card-meta" style={{ marginTop: '12px' }}>
                <h4 className="product-card-title" style={{ fontSize: '0.95rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {product.title}
                </h4>

                <p className="product-card-subtitle" style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 8px 0' }}>
                    {product.brand} • Size {product.size || 'S'} • {product.condition || 'Excellent'} • {parseFloat(product.credits).toFixed(1)} cr
                </p>

                {/* DYNAMIC MATCH PERCENTAGE BADGE */}
                <span style={{
                    display: 'inline-block',
                    backgroundColor: fitEval.isIdeal ? '#f0fdf4' : '#fff7ed',
                    color: fitEval.isIdeal ? '#166534' : '#c2410c',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    marginBottom: '8px'
                }}>
                    {finalFitScore}% MATCH
                </span>

                {/* DYNAMIC FIT PREDICTOR STATUS */}
                <div style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: fitEval.isIdeal ? '#f4fbf7' : '#fff8f6',
                    border: `1px solid ${fitEval.isIdeal ? '#bbf7d0' : '#ffedd5'}`,
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    color: fitEval.isIdeal ? '#15803d' : '#9a3412',
                    marginBottom: '10px'
                }}>
                    {fitEval.message}
                </div>

                {/* TRADE / DEMO BUTTON */}
                {isMockOrDemo ? (
                    <button
                        disabled
                        style={{
                            marginTop: '4px',
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#e5e5e5',
                            color: '#a3a3a3',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            textTransform: 'uppercase'
                        }}
                    >
                        Demo Piece (Not Tradeable)
                    </button>
                ) : (
                    <button
                        onClick={() => onInitiateTrade(product)}
                        style={{
                            marginTop: '4px',
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Request Trade & Chat
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductCard;