// frontend/src/components/MatchScore.jsx
import React from 'react';

export default function MatchScore({ score, tradeable, blockedReason }) {
    // Return nothing if the ML API hasn't loaded the score yet
    if (score === undefined || score === null) return null;

    const percentage = Math.round(score * 100);

    // Default minimalist styling (for display-only or unavailable items)
    let bgColor = '#f3f4f6'; // subtle grey
    let textColor = '#9ca3af'; // muted text
    let text = 'Unavailable';

    // Update styling and text based on the hard filters from the algorithm
    if (tradeable) {
        bgColor = '#dcfce7'; // crisp light green
        textColor = '#166534'; // dark green
        text = `${percentage}% Match`;
    } else if (blockedReason === 'mock_item') {
        text = 'Display Only';
    } else if (blockedReason === 'premium_required') {
        bgColor = '#fef3c7'; // soft amber
        textColor = '#92400e'; // dark amber
        text = 'Unlock Premium';
    } else if (blockedReason === 'out_of_range') {
        text = 'Out of Range';
    }

    return (
        <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: bgColor,
            color: textColor,
            marginTop: '6px'
        }}>
            {text}
        </div>
    );
}