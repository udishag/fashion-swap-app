import React from 'react';

export default function Logout({ setView }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            fontFamily: 'sans-serif',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '36px', fontWeight: '400', marginBottom: '10px', letterSpacing: '1px' }}>
                See you soon.
            </h1>
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
                You have been successfully logged out of moss.
            </p>
            <button
                onClick={() => setView('shop')}
                style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    letterSpacing: '0.5px'
                }}
            >
                Sign Back In
            </button>
        </div>
    );
}