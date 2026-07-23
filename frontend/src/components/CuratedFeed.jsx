// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/CuratedFeed.jsx (replaces existing)
// ────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED: Added the useMossScores hook call, and now passes a new
// `user` prop through to scoring + a `matchData` prop down to each
// ProductCard. Your existing layout/grid styling is completely unchanged.

// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/components/CuratedFeed.jsx
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';
import ProductCard from './ProductCard';
import { useMossScores } from '../hooks/useMossScores';

const CuratedFeed = ({ products = [], user, currentUserId, onInitiateTrade, userPredictedSize = 'S' }) => {
    const safeProducts = Array.isArray(products) ? products : [];
    const { getScore, loading, error } = useMossScores({ user: user || {}, items: safeProducts });

    return (
        <div className="curated-feed">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>
                    YOUR CURATED FEED
                </h2>
                {error && <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>ML Status: {error}</span>}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '40px 24px'
            }}>
                {safeProducts.map((product) => {
                    if (!product || !product.id) return null;
                    const matchData = (!loading && typeof getScore === 'function') ? getScore(product.id) : null;

                    return (
                        <ProductCard
                            key={product.id}
                            product={product}
                            matchData={matchData}
                            currentUserId={currentUserId}
                            currentUserEmail={user?.email}
                            onInitiateTrade={onInitiateTrade}
                            userPredictedSize={userPredictedSize}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default CuratedFeed;