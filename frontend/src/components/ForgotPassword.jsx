import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const ForgotPassword = ({ onNavigateToLogin }) => {
    const [email, setEmail] = useState('');
    const [statusMsg, setStatusMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // Tracks if we should show green text

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);
        setIsSuccess(false);

        const cleanEmail = email.trim().toLowerCase();

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                redirectTo: 'http://localhost:5173/reset-password',
            });

            if (resetError) {
                // Log the real error (like rate limits) to the console for YOU to see, 
                // but hide it from the actual user interface.
                console.error("Supabase Background Error:", resetError.message);
            }

            // INDUSTRY STANDARD UX: 
            // Always show a success message so bad actors can't guess emails, 
            // and normal users don't see ugly rate-limit server errors.
            setIsSuccess(true);
            setStatusMsg("if this email is registered, a recovery link has been sent.");

        } catch (err) {
            setIsSuccess(false);
            setStatusMsg("error: unable to process request at this time.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-form-wrapper" style={{ margin: '0 auto', maxWidth: '400px', padding: '40px 20px' }}>
            <h2 className="login-header">reset password</h2>
            <p className="login-subheader">enter your email to receive a recovery link.</p>

            <form onSubmit={handleResetPassword}>
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
                        color: isSuccess ? '#15803d' : '#b91c1c'
                    }}>
                        {statusMsg}
                    </p>
                )}

                <button type="submit" className="login-btn" disabled={isLoading}>
                    {isLoading ? "sending..." : "send link"}
                </button>
            </form>

            <p className="login-footer-text" style={{ marginTop: '20px' }}>
                remembered it? <span onClick={onNavigateToLogin} style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}>back to login</span>
            </p>
        </div>
    );
};

export default ForgotPassword;