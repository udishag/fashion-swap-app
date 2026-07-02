import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const ResetPassword = ({ onNavigateToLogin }) => {
    const [newPassword, setNewPassword] = useState('');
    const [statusMsg, setStatusMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        setIsLoading(false);

        if (error) {
            setStatusMsg(`error: ${error.message}`);
        } else {
            setStatusMsg("password successfully updated! you can now log in.");
        }
    };

    return (
        <div className="login-form-wrapper" style={{ margin: '0 auto', maxWidth: '400px', padding: '40px 20px' }}>
            <h2 className="login-header">new password</h2>
            <p className="login-subheader">secure your wardrobe.</p>

            <form onSubmit={handleUpdatePassword}>
                <div className="input-group">
                    <label>new password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
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
                    {isLoading ? "updating..." : "update password"}
                </button>
            </form>

            {statusMsg && !statusMsg.includes('error') && (
                <p className="login-footer-text" style={{ marginTop: '20px' }}>
                    <span onClick={onNavigateToLogin} style={{ textDecoration: 'underline', cursor: 'pointer' }}>go to login</span>
                </p>
            )}
        </div>
    );
};

export default ResetPassword;