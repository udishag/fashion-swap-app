import React, { useState, useEffect } from 'react';
import './Register.css';

// Import the client backend integration logic smoothly
import { supabase } from './supabaseClient';

// Import your asset graphic using native JavaScript routing to avoid path breaking
import registerPhoto from '../assets/registerPhoto.jpeg';

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