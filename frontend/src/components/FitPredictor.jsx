import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { calculatePredictedSize } from '../utils/fitEngine';

export default function FitPredictor({ onFitBaselineChange }) {
    const [fitItems, setFitItems] = useState([
        { brand: 'Aritzia', item: 'Sculpt Knit Tank', size: 'S' },
        { brand: 'Aritzia', item: 'TNAButter™ Romper', size: 'S' },
        { brand: "Levi's", item: '501 High Rise Denim', size: '25' }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newBrand, setNewBrand] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newSize, setNewSize] = useState('M');

    // Load saved references from Supabase / localStorage on mount
    useEffect(() => {
        const loadFitData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.fit_references) {
                    const saved = user.user_metadata.fit_references;
                    setFitItems(saved);
                    onFitBaselineChange?.(calculatePredictedSize(saved));
                    return;
                }
            } catch (err) {
                console.warn("Could not load fit references from Supabase:", err);
            }

            // LocalStorage Fallback
            const localSaved = localStorage.getItem('moss_fit_references');
            if (localSaved) {
                try {
                    const parsed = JSON.parse(localSaved);
                    setFitItems(parsed);
                    onFitBaselineChange?.(calculatePredictedSize(parsed));
                } catch (e) { }
            }
        };

        loadFitData();
    }, []);

    // Save references to Supabase & LocalStorage
    const saveFitItems = async (newList) => {
        setFitItems(newList);
        const computedSize = calculatePredictedSize(newList);
        onFitBaselineChange?.(computedSize);

        localStorage.setItem('moss_fit_references', JSON.stringify(newList));
        localStorage.setItem('moss_predicted_size', computedSize);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.auth.updateUser({
                    data: {
                        fit_references: newList,
                        predicted_size: computedSize
                    }
                });
            }
        } catch (err) {
            console.error("Error saving fit items to Supabase:", err);
        }
    };

    const handleAddReference = async (e) => {
        e.preventDefault();
        if (!newBrand.trim() || !newItemName.trim()) return;

        const updatedList = [
            ...fitItems,
            { brand: newBrand.trim(), item: newItemName.trim(), size: newSize }
        ];

        await saveFitItems(updatedList);
        setNewBrand('');
        setNewItemName('');
        setShowAddModal(false);
    };

    const handleRemoveReference = async (indexToRemove) => {
        const updatedList = fitItems.filter((_, idx) => idx !== indexToRemove);
        await saveFitItems(updatedList);
    };

    const predictedBaselineSize = calculatePredictedSize(fitItems);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '40px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🔍</span>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0, color: '#111' }}>
                        Fit Predictor Baseline
                    </h3>
                    <span style={{
                        backgroundColor: '#111111',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                    }}>
                        PREDICTED SIZE: {predictedBaselineSize}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddModal(!showAddModal)}
                    style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textTransform: 'lowercase'
                    }}
                >
                    {showAddModal ? 'cancel' : '+ add reference piece'}
                </button>
            </div>

            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                MOSS analyzes your reference wardrobe items to compute your baseline size (<strong>Size {predictedBaselineSize}</strong>) and evaluates fits across all trade listings.
            </p>

            {showAddModal && (
                <form onSubmit={handleAddReference} style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #eee'
                }}>
                    <input
                        type="text"
                        placeholder="Brand (e.g. Aritzia)"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Item Name (e.g. Sculpt Knit)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                        required
                    />
                    <select
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}
                    >
                        <option value="XXS">XXS</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                    </select>
                    <button
                        type="submit"
                        style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Save & Recalculate
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fitItems.map((refItem, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        backgroundColor: '#fafafa',
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px'
                    }}>
                        <div style={{ fontSize: '12px', color: '#222' }}>
                            <span style={{ fontWeight: '700' }}>{refItem.brand}</span> — {refItem.item}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e5e5e5', padding: '2px 8px', borderRadius: '4px', color: '#111' }}>
                                size {refItem.size}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemoveReference(idx)}
                                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '13px' }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}