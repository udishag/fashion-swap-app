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

const CuratedFeed = ({ products, user, currentUserId }) => {
    // Calling your actual ML hook that targets localhost:5001
    const { getScore, loading, error } = useMossScores({ user, items: products });

    return (
        <div className="curated-feed">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>
                    YOUR CURATED FEED
                </h2>
                {/* Visual indicator if the Python backend is disconnected */}
                {error && <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>ML Status: {error}</span>}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '40px 24px'
            }}>
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        // Passes the exact score returned from app.py
                        matchData={!loading ? getScore(product.id) : null}
                        currentUserId={currentUserId}

                        // NEW LINE: This tells the ProductCard exactly who is looking at it
                        // so it knows whether to show the delete button or not!
                        currentUserEmail={user?.email}
                    />
                ))}
            </div>
        </div>
    );
};

export default CuratedFeed;