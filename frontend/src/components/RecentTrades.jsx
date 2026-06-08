import React from 'react';

// Use your existing assets for the friend trade previews
import sansitaImg from '../assets/sanMossTrade.JPG';
import emilyImg from '../assets/eMossTrade.jpeg';

const RecentTrades = () => {
    const trades = [
        {
            id: 1,
            name: "sansita",
            item: "floral corset top",
            time: "2 hours ago",
            img: sansitaImg
        },
        {
            id: 2,
            name: "emily",
            item: "lace knit set",
            time: "yesterday",
            img: emilyImg
        }
    ];

    return (
        <div className="recent-trades-wrapper">
            {/* Standardized class for perfect alignment */}
            <h2 className="section-header">pieces successfully received / friends recent trades</h2>

            <div className="feed-grid">
                {trades.map((trade) => (
                    <div key={trade.id} className="product-card">
                        <div className="product-card-image-wrapper">
                            <img src={trade.img} alt={trade.item} />
                        </div>
                        <div className="product-card-meta">
                            <h4 className="product-card-title">{trade.name}</h4>
                            <p className="product-card-subtitle">{trade.item}</p>
                            <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{trade.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTrades;