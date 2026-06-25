// ────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: frontend/src/hooks/useUserProfile.js  (NEW FILE)
// ────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED FROM THE EARLIER VERSION: looks up the profile by EMAIL,
// not by a Supabase auth user id — because your actual Login.jsx never
// creates a real Supabase Auth session, so there's no auth.uid() to key
// off of. This matches what Login.jsx already does (queries `profiles`
// by email) rather than assuming auth that isn't there.
//
// USAGE (in App.jsx):
//   const { profile, loading } = useUserProfile(userSession?.email)

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useUserProfile(userId) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!userId) return

        let cancelled = false
        setLoading(true)

        async function load() {
            const { data: profileRow, error: profileErr } = await supabase
                .from('profiles')
                .select('id, brands_interested, style_preferences, has_premium, lat, lon')
                .eq('id', userId)
                .maybeSingle()

            if (profileErr || !profileRow) {
                if (!cancelled) { setError(profileErr?.message ?? 'no profile found'); setLoading(false) }
                return
            }

            const { data: uploadedItems, error: itemsErr } = await supabase
                .from('items')
                .select('brand')
                .eq('uploaded_by', profileRow.id)

            if (itemsErr) {
                if (!cancelled) { setError(itemsErr.message); setLoading(false) }
                return
            }

            if (!cancelled) {
                setProfile({ ...profileRow, uploaded_brands: (uploadedItems ?? []).map(i => i.brand) })
                setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [userId])

    return { profile, loading, error }
}