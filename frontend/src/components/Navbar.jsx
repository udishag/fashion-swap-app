import React from 'react';

const Navbar = ({ setView }) => {
    return (
        <nav className="navbar">
            <h1 onClick={() => setView('feed')} style={{ cursor: 'pointer', fontSize: '1.6rem', fontWeight: 'bold' }}>
                moss.
            </h1>
            <div className="nav-links">
                <span onClick={() => setView('shop')}>shop</span>
                <span onClick={() => setView('profile')}>profile</span>
                <span style={{ color: '#aaa' }}>logout</span>
            </div>
        </nav>
    );
};

export default Navbar;