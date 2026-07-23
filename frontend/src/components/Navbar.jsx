import React from 'react';

const Navbar = ({ setView, onLogout }) => {
    return (
        <nav className="navbar">
            <h1 onClick={() => setView('feed')} style={{ cursor: 'pointer', fontSize: '1.6rem', fontWeight: 'bold' }}>
                moss.
            </h1>
            <div className="nav-links">
                <span onClick={() => setView('feed')} style={{ cursor: 'pointer' }}>shop</span> {/* Restored default feed view target */}
                <span onClick={() => setView('shop')} style={{ cursor: 'pointer' }}>upload</span> {/* Clear upload view link */}
                <span onClick={() => setView('profile')} style={{ cursor: 'pointer' }}>profile</span>

                {/* ADDED: Messages Link matching your current style */}
                <span onClick={() => setView('messages')} style={{ cursor: 'pointer' }}>messages</span>

                {/* Now triggers the immediate logout/redirect function */}
                <span onClick={onLogout} style={{ cursor: 'pointer', color: '#000' }}>logout</span>
            </div>
        </nav>
    );
};

export default Navbar;