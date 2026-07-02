import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const ForgotPassword = ({ onNavigateToLogin }) => {
    const [email, setEmail] = useState('');
    const [statusMsg, setStatusMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            // IMPORTANT: Change this to your Vercel URL when deploying (e.g., 'https://moss-exchange.vercel.app/')
            redirectTo: 'http://localhost:5173/',
        });

        setIsLoading(false);

        if (error) {
            setStatusMsg(`error: ${error.message}`);
        } else {
            setStatusMsg("if an account exists, a reset link has been sent to your email.");
        }
    };

    return (
        <div className="login-form-wrapper" style={{ margin: '0 auto', maxWidth: '400px', padding: '40px 20px' }}>
            <h2 className="login-header">reset password</h2>
            <p className="login-subheader">enter your email to receive a recovery link.</p>

            <form onSubmit={handleResetRequest}>
                <div className="input-group">
                    <label>email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your email address"
                        required
                    />
                </div>

                {statusMsg && (
                    <p style={{
                        fontSize: '0.85rem',
                        marginBottom: '12px',
                        color: statusMsg.includes('error') ? '#b91c1c' : '#15803d'
                    }}>
                        {statusMsg}
                    </p>
                )}

                <button type="submit" className="login-btn" disabled={isLoading}>
                    {isLoading ? "sending..." : "send link"}
                </button>
            </form>

            <p className="login-footer-text" style={{ marginTop: '20px' }}>
                remembered it? <span onClick={onNavigateToLogin} style={{ textDecoration: 'underline', cursor: 'pointer' }}>back to login</span>
            </p>
        </div>
    );
};

export default ForgotPassword;