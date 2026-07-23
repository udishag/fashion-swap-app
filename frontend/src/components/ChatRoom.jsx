import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import mossLogo from '../assets/moss_logo_transparent_black.png';

export default function ChatRoom({ roomId, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Ensure room_id conforms to UUID format to satisfy Supabase constraints
    const safeRoomId = (roomId && roomId.length === 36)
        ? roomId
        : '00000000-0000-0000-0000-000000000000';

    const storageKey = `moss_chat_messages_${safeRoomId}`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load initial messages (Supabase + LocalStorage persistence)
    useEffect(() => {
        const fetchMessages = async () => {
            // 1. Check local storage first so user messages never vanish when switching tabs
            const localSaved = localStorage.getItem(storageKey);
            let cached = [];
            if (localSaved) {
                try { cached = JSON.parse(localSaved); } catch (e) { }
            }

            // 2. Query Supabase
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', safeRoomId)
                .order('created_at', { ascending: true });

            if (!error && data && data.length > 0) {
                // Merge database messages with local cache without duplicates
                const combinedMap = new Map();
                [...cached, ...data].forEach(msg => combinedMap.set(msg.id || msg.created_at || Math.random(), msg));
                const merged = Array.from(combinedMap.values());
                setMessages(merged);
                localStorage.setItem(storageKey, JSON.stringify(merged));
            } else if (cached.length > 0) {
                setMessages(cached);
            }
        };

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel(`room-${safeRoomId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${safeRoomId}` },
                (payload) => {
                    setMessages((prev) => {
                        const updated = [...prev, payload.new];
                        localStorage.setItem(storageKey, JSON.stringify(updated));
                        return updated;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [safeRoomId, storageKey]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const textToSend = newMessage.trim();
        setNewMessage('');

        const newMsgObj = {
            id: `msg_${Date.now()}`,
            room_id: safeRoomId,
            sender_id: currentUserId || '00000000-0000-0000-0000-000000000001',
            message_text: textToSend,
            created_at: new Date().toISOString()
        };

        // 1. Immediately update local state & LocalStorage for instant UI feedback & tab switching persistence
        setMessages((prev) => {
            const updated = [...prev, newMsgObj];
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });

        // 2. Sync directly to Supabase in background
        try {
            await supabase.from('messages').insert([
                {
                    room_id: safeRoomId,
                    sender_id: currentUserId || '00000000-0000-0000-0000-000000000001',
                    message_text: textToSend
                }
            ]);
        } catch (err) {
            console.warn("Supabase insertion fallback handled locally:", err);
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '480px',
            height: '620px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
        }}>
            {/* DEPOP HEADER */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                backgroundColor: '#ffffff'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111' }}>
                        @moss_curator
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                        ● Active Trade Negotiation
                    </p>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                    MOSS SECURE
                </span>
            </div>

            {/* ITEM PREVIEW BANNER WITH LOGO */}
            <div style={{
                padding: '12px 20px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #eaeaea',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    padding: '4px',
                    boxSizing: 'border-box'
                }}>
                    <img
                        src={mossLogo}
                        alt="MOSS"
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111' }}>Item Swap Request</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Arrange a public meetup spot for trade</div>
                </div>
            </div>

            {/* MESSAGES FEED */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#ffffff'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#a3a3a3', fontSize: '0.85rem', marginTop: 'auto', marginBottom: 'auto' }}>
                        Start the conversation below to arrange your trade meetup!
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender_id === currentUserId || !msg.sender_id || msg.sender_id.includes('fallback') || msg.sender_id.includes('00000000');
                        return (
                            <div
                                key={msg.id || i}
                                style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '78%'
                                }}
                            >
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    backgroundColor: isMe ? '#000000' : '#f3f3f3',
                                    color: isMe ? '#ffffff' : '#111111',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    {msg.message_text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT TRAY WITH PERFECTLY CENTERED ARROW ICON */}
            <form onSubmit={handleSendMessage} style={{
                padding: '16px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                backgroundColor: '#ffffff'
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message seller..."
                    style={{
                        flex: 1,
                        padding: '12px 18px',
                        borderRadius: '24px',
                        border: '1px solid #e5e5e5',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: '#fafafa'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '42px',
                        height: '42px',
                        minWidth: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >

                </button>
            </form>
        </div>
    );
}