import React, { useState, useEffect } from 'react';
import './Register.css';

// Import the client backend integration logic smoothly
import { supabase } from './supabaseClient';

// Import your asset graphic using native JavaScript routing to avoid path breaking
import registerPhoto from '../assets/registerPhoto.jpeg';

const getWelcomeEmailHTML = (username) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>welcome to moss.</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .logo { font-size: 2.4rem; font-weight: 700; letter-spacing: -1px; text-transform: lowercase; color: #000000; margin-bottom: 5px; }
        .subtitle { font-size: 0.9rem; font-weight: 400; color: #666666; margin-bottom: 35px; text-transform: lowercase; letter-spacing: 0.5px; }
        .hero-container { width: 100%; margin-bottom: 35px; border: 1px solid #eeeeee; }
        .hero-image { width: 100%; height: auto; display: block; object-fit: cover; }
        .headline { font-size: 1.6rem; font-weight: 400; color: #000000; text-transform: lowercase; margin-bottom: 15px; letter-spacing: -0.5px; }
        .body-text { font-size: 0.9rem; line-height: 1.6; color: #333333; text-align: center; max-width: 420px; margin: 0 auto 40px auto; font-weight: 300; }
        .signature-section { margin-top: 40px; font-family: inherit; color: #000000; font-size: 0.95rem; line-height: 1.5; text-transform: lowercase; }
        .footer { font-size: 0.7rem; color: #999999; text-transform: lowercase; margin-top: 60px; border-top: 1px solid #eeeeee; padding-top: 20px; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="logo">moss.</div>
        <div class="subtitle">welcome to the new era of style.</div>
        
        <div class="hero-container">
            <img src="https://i.postimg.cc/x8GyDTxx/udi-Headshot.png" alt="moss. founders" class="hero-image" />
        </div>

        <div class="headline">your inbox just got more beautiful.</div>
        
        <div class="body-text">
            congratulations ${username.toLowerCase()}, you're officially on the list. we are building a space where fashion is defined by personal curation, and we are incredibly excited to have you along for this journey. explore your profile, find your next favorite piece, and become part of a community that understands style is personal.
        </div>

        <div class="signature-section">
            much love,<br>
            <strong>udi & co-founder</strong>
        </div>

        <div class="footer">
            &copy; moss. 2026. toronto & mississauga.<br>
            <a href="#" style="color: #999999; text-decoration: underline;">unsubscribe</a>
        </div>
    </div>
</body>
</html>
`;

const Register = ({ onRegisterSuccess, onNavigateToLogin }) => {
    // Establish baseline default backup constants directly inside state so pills never show empty
    const [validBrands, setValidBrands] = useState([
        'aritzia', 'urban outfitters', 'zara', 'brandy melville', 'uniqlo', 'h&m', 'shein', 'walmart'
    ]);
    const [validAesthetics, setValidAesthetics] = useState([
        '90s archival', 'clean girl', 'coquette', 'minimalist', 'streetwear', 'vintage'
    ]);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        brandsInterested: [],
        stylesAesthetics: [],
        profilePic: null,
        latitude: null,
        longitude: null
    });

    const [errors, setErrors] = useState({ email: '', phone: '' });
    const [passwordCriteria, setPasswordCriteria] = useState({ length: false, alpha: false, number: false });
    const [showPassword, setShowPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Fetch tag vectors dynamically from your backend app server constants
    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/tags')
            .then(res => res.json())
            .then(data => {
                if (data.brands && data.aesthetics) {
                    setValidBrands(data.brands);
                    setValidAesthetics(data.aesthetics);
                }
            })
            .catch(err => {
                console.warn("Using local constants array fallback. Remember to spin up app.py on port 5000!", err);
            });
    }, []);

    // Request geo coordinate access patterns
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
                () => setFormData(prev => ({ ...prev, latitude: 43.6532, longitude: -79.3832 }))
            );
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'email') {
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            setErrors(prev => ({
                ...prev,
                email: gmailRegex.test(value) ? '' : 'please enter a valid gmail address (e.g., name@gmail.com)'
            }));
        }

        if (name === 'phone') {
            const phoneRegex = /^(\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
            setErrors(prev => ({
                ...prev,
                phone: phoneRegex.test(value) ? '' : 'please enter a 10-digit phone number, including your area code'
            }));
        }
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, password: val }));
        setPasswordCriteria({
            length: val.length >= 8 && val.length <= 20,
            alpha: /[A-Za-z]/.test(val),
            number: /\d/.test(val)
        });
    };

    const toggleTag = (field, tag) => {
        setFormData(prev => {
            const existing = prev[field];
            const updated = existing.includes(tag)
                ? existing.filter(t => t !== tag)
                : [...existing, tag];
            return { ...prev, [field]: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (errors.email || errors.phone || !passwordCriteria.length || !passwordCriteria.alpha || !passwordCriteria.number) {
            setStatusMessage('please optimize and resolve validation input field errors.');
            return;
        }
        if (formData.brandsInterested.length === 0 || formData.stylesAesthetics.length === 0) {
            setStatusMessage('please select at least one brand and style tag selector pill.');
            return;
        }

        setStatusMessage('creating account container inside database context...');

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        phone: formData.phone,
                        brands_interested: formData.brandsInterested,
                        styles_aesthetics: formData.stylesAesthetics,
                        latitude: formData.latitude,
                        longitude: formData.longitude
                    }
                }
            });

            if (error) {
                setStatusMessage(`database submission failure: ${error.message.toLowerCase()}`);
            } else if (data?.user) {
                setStatusMessage('account initialized successfully!');

                // --- ADDED: EMAILING ENGINE FETCH API ---
                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'moss. <onboarding@resend.dev>',
                            to: formData.email,
                            subject: 'welcome to moss.',
                            html: getWelcomeEmailHTML(formData.username)
                        })
                    });
                    console.log("Welcome automated email successfully dispatched to Resend network context.");
                } catch (emailErr) {
                    console.error("Mailing loop network connection failure:", emailErr);
                }
                // --- END OF EMAIL ROUTINE ---

                if (onRegisterSuccess) {
                    onRegisterSuccess(formData);
                }
            }
        } catch (catchErr) {
            console.error("Supabase integration unexpected error loop:", catchErr);
            setStatusMessage('unexpected network context connection loop broken.');
        }
    };

    return (
        <div className="moss-register-container">
            {/* Left Column Visual Branding Panel - Now using the verified JS asset reference */}
            <div className="register-visual-panel">
                <img src={registerPhoto} alt="MOSS Curation Look" className="branding-image" />
                <div className="branding-overlay-title">
                    <h1>moss.</h1>
                    <p>welcome to the new era of style.</p>
                </div>
            </div>

            {/* Right Column Registration Processing Panel */}
            <div className="register-form-panel">
                <div className="form-contents-wrapper">
                    <h2>register</h2>
                    <p className="signin-prompt">have an account? <span onClick={onNavigateToLogin}>sign in</span></p>

                    <form onSubmit={handleSubmit} className="minimalist-input-form">
                        <div className="input-row">
                            <input type="text" name="username" placeholder="username" required onChange={handleInputChange} />
                        </div>

                        <div className="input-row">
                            <input type="email" name="email" placeholder="email address" required onChange={handleInputChange} />
                            {errors.email && <p className="moss-error-msg">{errors.email}</p>}
                        </div>

                        <div className="input-row">
                            <input type="tel" name="phone" placeholder="phone number" required onChange={handleInputChange} />
                            {errors.phone && <p className="moss-error-msg">{errors.phone}</p>}
                        </div>

                        <div className="input-row password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="password"
                                required
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                value={formData.password}
                                onChange={handlePasswordChange}
                            />
                            <span className="toggle-password-visibility" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? "hide" : "show"}
                            </span>
                        </div>

                        {/* FIXED: Horizontal Validator Dashboard matches CSS container rules */}
                        <div className="moss-password-dashboard">
                            <span className={passwordCriteria.length ? "met" : "unmet"}>• min 8 chars</span>
                            <span className={passwordCriteria.alpha ? "met" : "unmet"}>• letter</span>
                            <span className={passwordCriteria.number ? "met" : "unmet"}>• number</span>
                        </div>

                        {/* Brands Pill Selection Grid */}
                        <div className="tag-selection-section">
                            <label>brands interested</label>
                            <div className="tag-cloud-container">
                                {validBrands.map(brand => {
                                    const isSelected = formData.brandsInterested.includes(brand);
                                    return (
                                        <button
                                            key={brand}
                                            type="button"
                                            className={`pill-selection-tag ${isSelected ? 'active' : ''}`}
                                            onClick={() => toggleTag('brandsInterested', brand)}
                                        >
                                            {brand.toLowerCase()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Aesthetics Pill Selection Grid */}
                        <div className="tag-selection-section">
                            <label>styles & aesthetics</label>
                            <div className="tag-cloud-container">
                                {validAesthetics.map(style => {
                                    const isSelected = formData.stylesAesthetics.includes(style);
                                    return (
                                        <button
                                            key={style}
                                            type="button"
                                            className={`pill-selection-tag ${isSelected ? 'active' : ''}`}
                                            onClick={() => toggleTag('stylesAesthetics', style)}
                                        >
                                            {style.toLowerCase()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="input-row file-upload-row">
                            <label htmlFor="profilePicUpload" className="custom-file-label">upload profile picture</label>
                            <input id="profilePicUpload" type="file" accept="image/*" required onChange={(e) => setFormData({ ...formData, profilePic: e.target.files[0] })} />
                            {formData.profilePic && <span className="file-ready-text">✓ {formData.profilePic.name} loaded</span>}
                        </div>

                        <button type="submit" className="moss-black-submit-btn">create account</button>
                        {statusMessage && <div className="form-status-alert">{statusMessage}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;