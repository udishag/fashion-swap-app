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

export function useUserProfile(email) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!email) return

        let cancelled = false
        setLoading(true)

        async function load() {
            const cleanEmail = email.trim().toLowerCase()

            // 1. Get the stated profile row by email
            const { data: profileRow, error: profileErr } = await supabase
                .from('profiles')
                .select('id, brands_interested, style_preferences, has_premium, lat, lon')
                .eq('email', cleanEmail)
                .maybeSingle()

            if (profileErr || !profileRow) {
                if (!cancelled) {
                    setError(profileErr?.message ?? 'no profile found')
                    setLoading(false)
                }
                return
            }

            // 2. Compute uploaded_brands live from the items table, keyed
            // by the profile's real id (uploaded_by still uses the UUID
            // primary key from profiles, not the email).
            const { data: uploadedItems, error: itemsErr } = await supabase
                .from('items')
                .select('brand')
                .eq('uploaded_by', profileRow.id)

            if (itemsErr) {
                if (!cancelled) {
                    setError(itemsErr.message)
                    setLoading(false)
                }
                return
            }

            const uploaded_brands = (uploadedItems ?? []).map(i => i.brand)

            if (!cancelled) {
                setProfile({ ...profileRow, uploaded_brands })
                setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [email])

    return { profile, loading, error }
}