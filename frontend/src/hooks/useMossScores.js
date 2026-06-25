// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/hooks/useMossScores.js
// ────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// Switched to 127.0.0.1 to perfectly match what Flask is broadcasting
const ML_API_BASE = import.meta.env.VITE_ML_API_URL ?? 'http://127.0.0.1:5001'

export function useMossScores({ user, items }) {
    const [scores, setScores] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const userBrands = user?.brands_interested ?? []
    const hasPremium = user?.has_premium ?? false
    const uploadedBrands = user?.uploaded_brands ?? []
    const userStyles = user?.style_preferences ?? []

    useEffect(() => {
        console.log("🧠 ML Hook Triggered!");

        // We removed the strict userBrands check so it ALWAYS fires for you to test
        if (!items?.length) {
            console.log("🛑 Aborting ML: No items to score.");
            return;
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        const payload = {
            user_brands: userBrands.length > 0 ? userBrands : ["zara"],
            uploaded_brands: uploadedBrands,
            user_styles: userStyles,
            has_premium: hasPremium,
            items: items.map(item => ({
                item_id: item.id,
                item_brand: item.brand || "unknown",
                item_price: item.credits ?? 30,
                distance_km: item.distance_km ?? 3,
                is_mock: item.is_mock ?? true,
                // THE FIX: Provide a default string instead of null!
                item_style: item.style || "casual",
            })),
        }

        console.log("📦 Sending payload to Python:", payload);

        fetch(`${ML_API_BASE}/api/score-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(r => r.json())
            .then(data => {
                console.log("✅ Python ML Response:", data);
                if (cancelled) return
                if (data.status === 'success') setScores(data.results)
                else setError(data.message ?? 'scoring failed')
            })
            .catch(err => {
                console.error("❌ Python Fetch Error:", err);
                if (!cancelled) setError(err.message ?? 'ML service unreachable')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [
        JSON.stringify(userBrands),
        JSON.stringify(uploadedBrands),
        JSON.stringify(userStyles),
        hasPremium,
        JSON.stringify(items?.map(i => i.id)),
    ])

    const getScore = (itemId) =>
        scores.find(s => String(s.item_id) === String(itemId)) ?? null

    return { scores, loading, error, getScore }
}

export function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}