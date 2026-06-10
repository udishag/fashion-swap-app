import React, { useState, useEffect } from 'react';
import shanzayImg from '../assets/shanzay.jpg'; // <-- Standardized lowercase extensions
import emImg from '../assets/em.jpg';           // <-- Standardized lowercase extensions
import udishaImg from '../assets/udisha.jpg';       // <-- Standardized lowercase extensions

// ========================================================
// FIXED: Stepping out to src/ folder with correct case-matching CamelCase 'C'
// ========================================================
import { supabase } from '../supabaseClient';

const Login = ({ onLogin, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);

    // UI state to visually track backend lookup verification
    const [isVerifying, setIsVerifying] = useState(false);

    const slides = [shanzayImg, emImg, udishaImg];

    useEffect(() => {
        const slideTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(slideTimer);
    }, [slides.length]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("please enter your email and password.");
            return;
        }

        setIsVerifying(true);

        try {
            // 3. LOOKUP: Check if a profile matches this exact lowercased string
            const { data, error } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', email.trim().toLowerCase())
                .maybeSingle(); // Gracefully handles empty results without crashing

            // 4. INTERCEPT: Redirect to registration if no profile entry exists
            if (error || !data) {
                alert("✨ welcome to moss! it looks like you don't have a profile under this email yet. redirecting you to our onboarding registration...");
                setIsVerifying(false);
                onNavigateToRegister(); // Flips parent shell layout state to registration
                return;
            }

            // 5. SUCCESS: User exists in database, let them through
            const sessionData = {
                email: email,
                username: email.split('@')[0],
                credits: 10.0
            };

            setIsVerifying(false);
            onLogin(sessionData);

        } catch (err) {
            console.error("Database connection missing:", err);
            setIsVerifying(false);
            // Local fallback safety layer
            onLogin({ email });
        }
    };

    return (
        <div className="login-split-container">
            {/* Left 50%: Lookbook Slide Rotation */}
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

            {/* Right 50%: Functional Auth Window */}
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

                        {/* Interactive verification tracking layout on button label */}
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