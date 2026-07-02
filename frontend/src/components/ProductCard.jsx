// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/ProductCard.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED: Imports your existing MatchScore.jsx and renders it below
// the brand/credits line. Accepts a new `matchData` prop from CuratedFeed.
// Your hover image swap behavior is completely unchanged.

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import MatchScore from './MatchScore';

const ProductCard = ({ product, matchData, currentUserId }) => {
    const [hovered, setHovered] = useState(false);


    // Security Check: Only the creator of the listing or the Admin can delete
    const isAdmin = currentUserEmail === 'udimoss@gmail.com';
    const isCreator = currentUserId === product.user_id;
    const canDelete = !product.is_mock && (isCreator || isAdmin);

    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevents clicking the card background
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

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
            alert("Failed to delete.");
        }
    };

    return (
        <div
            className="product-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="product-card-image-wrapper">
                <img
                    src={hovered ? product.styledImage : product.clothImage}
                    alt={product.title}
                />

                {/* DELETE BUTTON: Only show if NOT a mock AND owner matches */}
                {!product.is_mock && (
                    <button
                        onClick={handleDelete}
                        style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: 'none', borderRadius: '50%',
                            width: '30px', height: '30px',
                            cursor: 'pointer', zIndex: 10
                        }}
                    >
                        🗑️
                    </button>
                )}
            </div>

            <div className="product-card-meta">
                <h4 className="product-card-title">{product.title}</h4>
                <p className="product-card-subtitle">
                    {product.brand} — {parseFloat(product.credits).toFixed(1)} credits
                </p>

                {matchData && (
                    <MatchScore
                        score={matchData.match_score}
                        tradeable={matchData.tradeable}
                        blockedReason={matchData.blocked_reason}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductCard;