import React, { useState, useEffect } from 'react';
import shanzayImg from '../assets/shanzay.JPG';
import emImg from '../assets/em.JPG';
import udishaImg from '../assets/udisha.jpg';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [shanzayImg, emImg, udishaImg];

    useEffect(() => {
        const slideTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(slideTimer);
    }, [slides.length]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // For Beta Launch: grant access if fields aren't empty
        if (email && password) {
            onLogin();
        } else {
            alert("please enter your email and password.");
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
                {/* Subtle branding watermark on the imagery side */}
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

                        <button type="submit" className="login-btn">
                            sign in
                        </button>
                    </form>

                    <p className="login-footer-text">
                        don't have an account? <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}>sign up!</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;