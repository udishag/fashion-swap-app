import React from 'react';
import ProductCard from './ProductCard';

const CuratedFeed = ({ products }) => {
    return (
        <div className="curated-feed">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '25px', letterSpacing: '0.1em' }}>
                YOUR CURATED FEED
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '40px 24px'
            }}>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default CuratedFeed;