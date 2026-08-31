// frontend/src/components/FriendManager.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import UserSearch from './UserSearch';

export default function FriendManager({ currentUser, isMyProfile, onOpenFriendProfile }) {
    const [realFriends, setRealFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [toast, setToast] = useState('');
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    useEffect(() => {
        const fetchFriendData = async () => {
            if (!currentUser?.id) return;

            // 1. Fetch pending requests where the current user is the RECEIVER
            if (isMyProfile) {
                const { data: pending } = await supabase
                    .from('friendships')
                    .select('*')
                    .eq('friend_id', currentUser.id)
                    .eq('status', 'pending');
                if (pending) setPendingRequests(pending);
            }

            // 2. Fetch accepted friends where the user is EITHER the sender or receiver
            const { data: accepted } = await supabase
                .from('friendships')
                .select('*')
                .eq('status', 'accepted')
                .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

            if (accepted) setRealFriends(accepted);
        };

        fetchFriendData();
    }, [currentUser, isMyProfile]);

    const handleAcceptRequest = async (requestId) => {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) {
            alert("Error accepting request: " + error.message);
        } else {
            alert("Friend request accepted!");
            // Remove from pending list locally
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            // Ideally, re-fetch friends list here to show the new friend instantly
        }
    };

    return (
        <div style={{ borderLeft: '1px solid #eaeaea', paddingLeft: '30px' }}>

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                Find Friends
            </h3>
            <UserSearch currentUserId={currentUser?.id} onSelectUser={onOpenFriendProfile} />

            {/* --- PENDING REQUESTS (Only you can see your pending requests) --- */}
            {isMyProfile && pendingRequests.length > 0 && (
                <div style={{ marginBottom: '30px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#b91c1c' }}>
                        Pending Requests ({pendingRequests.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pendingRequests.map(req => (
                            <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                                <span style={{ fontSize: '12px', fontWeight: '500' }}>User ID: {req.user_id.substring(0, 8)}</span>
                                <button
                                    onClick={() => handleAcceptRequest(req.id)}
                                    style={{ backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                    Accept
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- REAL FRIENDS ON MOSS --- */}
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '30px 0 20px 0' }}>
                Friends on MOSS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {realFriends.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '13px' }}>No friends added yet.</p>
                ) : (
                    realFriends.map((friendship) => {
                        const actualFriendId = friendship.user_id === currentUser?.id ? friendship.friend_id : friendship.user_id;
                        return (
                            <div
                                key={friendship.id}
                                onClick={() => onOpenFriendProfile({ id: actualFriendId, username: 'MOSS Friend' })}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>
                                    PFP
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                                    Friend ID: {actualFriendId.substring(0, 6)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}