import React, { useState } from 'react';
import ProductCard from './ProductCard';
import FitPredictor from './FitPredictor';
import { useMossScores } from '../hooks/useMossScores';
import { calculateHaversineDistance } from '../utils/geo';

const CuratedFeed = ({ products = [], user, currentUserId, onInitiateTrade, userPredictedSize = 'S' }) => {
    const safeProducts = Array.isArray(products) ? products : [];
    const { getScore, loading, error } = useMossScores({ user: user || {}, items: safeProducts });

    // NEW: State to track which item is selected for the heatmap
    const [selectedItem, setSelectedItem] = useState(null);

    const userLat = user?.latitude || 43.6532;
    const userLng = user?.longitude || -79.3832;

    return (
        <div className="curated-feed" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2.4rem', fontWeight: '500', fontFamily: 'var(--font-display, "Fraunces", serif)', color: '#28301C', textTransform: 'lowercase', margin: 0, letterSpacing: '-0.02em' }}>
                    curated feed.
                </h2>
                {error && <span style={{ color: '#FFC3CC', backgroundColor: '#28301C', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>ML Status: {error}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '40px 24px' }}>
                {safeProducts.map((product) => {
                    if (!product || !product.id) return null;
                    const matchData = (!loading && typeof getScore === 'function') ? getScore(product.id) : null;
                    const distanceKm = calculateHaversineDistance(userLat, userLng, product.latitude, product.longitude);
                    return (
                        <div key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <ProductCard
                                product={product}
                                matchData={matchData}
                                currentUserId={currentUserId}
                                currentUserEmail={user?.email}
                                onInitiateTrade={onInitiateTrade}
                                userPredictedSize={userPredictedSize}
                                distanceKm={distanceKm}
                            />
                            {/* NEW: Button to trigger the heatmap modal */}
                            <button
                                onClick={() => setSelectedItem(product)}
                                style={{ width: '100%', padding: '12px', marginTop: '12px', backgroundColor: '#D2DB76', color: '#28301C', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'lowercase', letterSpacing: '0.02em' }}
                            >
                                view fit ✨
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* NEW: The Heatmap Modal Overlay */}
            {selectedItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(40,48,28,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#FCFAF8', borderRadius: '24px' }}>
                        <button
                            onClick={() => setSelectedItem(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: '#28301C', color: '#FFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >✕</button>
                        <FitPredictor
                            targetItem={{
                                ...selectedItem,
                                bust: selectedItem?.bust || selectedItem?.measurements?.bust || 36,
                                waist: selectedItem?.waist || selectedItem?.measurements?.waist || 28,
                                hips: selectedItem?.hips || selectedItem?.measurements?.hips || 38,
                            }}
                            userProfile={{
                                id: user?.id,
                                measurements: { bust: user?.bust || 39, waist: user?.waist || 28, hips: user?.hips || 38 },
                                body_scan_url: user?.body_scan_url
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CuratedFeed;