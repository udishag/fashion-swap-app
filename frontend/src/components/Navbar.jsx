import React from 'react';

const Navbar = ({ setView, onLogout }) => {
    // Subtle editorial styling for the links using the softer 'Jungle' green
    const linkStyle = {
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '500',
        color: '#65613F', // Jungle 
        fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
        transition: 'color 0.2s ease',
        textTransform: 'lowercase',
        letterSpacing: '0.02em'
    };

    return (
        <nav className="navbar" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr', // This perfectly centers the middle links
            alignItems: 'center',
            padding: '24px 0',
            borderBottom: '1px solid #E5E7EB', // Very subtle, airy gray border
            marginBottom: '40px',
            backgroundColor: 'transparent'
        }}>
            {/* LEFT: LOGO */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <h1 onClick={() => setView('feed')} style={{
                    cursor: 'pointer',
                    fontSize: '2.2rem',
                    fontWeight: '600',
                    color: '#28301C', // Dark Green
                    fontFamily: 'var(--font-display, "Fraunces", serif)',
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    moss.
                </h1>
            </div>

            {/* CENTER: NAVIGATION LINKS */}
            <div className="nav-links" style={{ display: 'flex', gap: '48px', alignItems: 'center', justifyContent: 'center' }}>
                <span
                    onClick={() => setView('feed')}
                    style={linkStyle}
                    onMouseOver={(e) => e.target.style.color = '#28301C'}
                    onMouseOut={(e) => e.target.style.color = '#65613F'}
                >shop</span>
                <span
                    onClick={() => setView('shop')}
                    style={linkStyle}
                    onMouseOver={(e) => e.target.style.color = '#28301C'}
                    onMouseOut={(e) => e.target.style.color = '#65613F'}
                >upload</span>
                <span
                    onClick={() => setView('profile')}
                    style={linkStyle}
                    onMouseOver={(e) => e.target.style.color = '#28301C'}
                    onMouseOut={(e) => e.target.style.color = '#65613F'}
                >profile</span>
                <span
                    onClick={() => setView('messages')}
                    style={linkStyle}
                    onMouseOver={(e) => e.target.style.color = '#28301C'}
                    onMouseOut={(e) => e.target.style.color = '#65613F'}
                >messages</span>
            </div>

            {/* RIGHT: ACTION (LOGOUT) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onLogout}
                    style={{
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#28301C', // Dark Green text
                        backgroundColor: '#F7DDD5', // Peony background
                        padding: '10px 24px',
                        borderRadius: '999px',
                        border: 'none',
                        fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
                        transition: 'transform 0.2s, background-color 0.2s',
                        letterSpacing: '0.02em',
                        textTransform: 'lowercase'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.backgroundColor = '#FFC3CC'; // Brightens to Pink on hover
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.backgroundColor = '#F7DDD5';
                    }}
                >
                    logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;