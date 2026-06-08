import React from 'react';

export default function Logout({ onSignBackIn }) {
    return (
        <div className="logout-container">
            <h1>see you soon.</h1>
            <p>you have been successfully logged out of moss.</p>

            {/* Triggers the parent function to completely reset authentication */}
            <button className="signin-btn" onClick={onSignBackIn}>
                sign back in
            </button>
        </div>
    );
}