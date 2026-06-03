import React from 'react';
import eMossTrade from '../assets/eMossTrade.jpeg';
import sanMossTrade from '../assets/sanMossTrade.JPG';

export default function RecentTrades() {
    const trades = [
        { id: 1, friend: "Sansita", item: "Floral Corset Top", img: sanMossTrade, time: "2 hours ago" },
        { id: 2, friend: "Emily", item: "Lace Knit Set", img: eMossTrade, time: "Yesterday" }
    ];

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                Pieces Successfully Received / Friends Recent Trades
            </h3>
            <div style={{ display: 'flex', gap: '30px' }}>
                {trades.map(trade => (
                    <div key={trade.id} style={{ width: '180px' }}>
                        <div style={{ width: '180px', height: '240px', overflow: 'hidden', borderRadius: '4px', marginBottom: '8px' }}>
                            <img src={trade.img} alt="Traded piece" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 'bold' }}>{trade.friend}</p>
                        <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#333' }}>{trade.item}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>{trade.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}