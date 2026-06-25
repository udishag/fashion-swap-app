import React, { useState, useEffect } from 'react';
import shanzayImg from '../assets/shanzay.JPG';
import emImg from '../assets/em.JPG';
import udishaImg from '../assets/udisha.jpg';
import { supabase } from '../supabaseClient';

const Login = ({ onLogin, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const slides = [shanzayImg, emImg, udishaImg];

    useEffect(() => {
        const slideTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(slideTimer);
    }, [slides.length]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!email || !password) {
            alert("please enter your email and password.");
            return;
        }

        setIsVerifying(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });

        setIsVerifying(false);

        if (error) {
            if (error.message.toLowerCase().includes('invalid login credentials')) {
                alert("no account found with those details — redirecting you to sign up.");
                onNavigateToRegister();
            } else {
                setErrorMsg(error.message);
            }
            return;
        }

        onLogin({ id: data.user.id, email: data.user.email });
    };

    return (
        <div className="login-split-container">
            <div className="login-slideshow-half">
                <img
                    src={slides[currentSlide]}
                    alt="moss lookbook display"
                    className="login-slideshow-image"
                />
                <span style={{ position: 'absolute', bottom: '40px', left: '40px', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    moss.
                </span>
            </div>

            <div className="login-form-half">
                <div className="login-form-wrapper">
                    <h2 className="login-header">login</h2>
                    <p className="login-subheader">enter your details to access your wardrobe.</p>

                    <form onSubmit={handleSubmit}>
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

                        <div className="input-group">
                            <label>password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {errorMsg && <p style={{ color: '#b91c1c', fontSize: '0.8rem', marginBottom: '12px' }}>{errorMsg}</p>}

                        <button type="submit" className="login-btn" disabled={isVerifying}>
                            {isVerifying ? "verifying..." : "sign in"}
                        </button>
                    </form>

                    <p className="login-footer-text">
                        don't have an account? <span onClick={onNavigateToRegister} style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}>sign up!</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;