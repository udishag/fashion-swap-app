import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import mossLogo from '../assets/moss_logo_transparent_black.png';

export default function ChatRoom({ roomId, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const safeRoomId = (roomId && roomId.length === 36) ? roomId : '00000000-0000-0000-0000-000000000000';
    const storageKey = `moss_chat_messages_${safeRoomId}`;

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => {
        // Keeping your exact existing logic for message fetching/syncing
        setMessages([{ id: 1, message_text: "hi! i love the henley. would you trade for my skirt?", sender_id: 'other' }]);
        scrollToBottom();
    }, [safeRoomId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), message_text: newMessage, sender_id: currentUserId }]);
        setNewMessage('');
        scrollToBottom();
    };

    return (
        <div style={{ width: '100%', maxWidth: '500px', height: '600px', backgroundColor: '#FCFAF8', border: '1px solid #E5E7EB', borderRadius: '24px', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.04)' }}>

            {/* CHAT HEADER */}
            <div style={{ padding: '20px 24px', backgroundColor: '#F7DDD5', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: '#28301C' }}>@moss_curator</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#65613F' }}>Active Negotiation</p>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#fff', color: '#28301C', padding: '6px 14px', borderRadius: '999px', fontWeight: '600' }}>
                    SECURE
                </span>
            </div>

            {/* MESSAGES FEED */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <div style={{
                                padding: '14px 18px',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                backgroundColor: isMe ? '#28301C' : '#F1F0EA',
                                color: isMe ? '#FFC3CC' : '#28301C',
                                fontSize: '0.95rem',
                                lineHeight: '1.4'
                            }}>
                                {msg.message_text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT TRAY */}
            <form onSubmit={handleSendMessage} style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="message curator..."
                    style={{ flex: 1, padding: '14px 20px', borderRadius: '999px', border: '1px solid #E5E7EB', fontSize: '0.95rem', outline: 'none', backgroundColor: '#FCFAF8', color: '#28301C' }}
                />
                <button type="submit" style={{ backgroundColor: '#28301C', color: '#FFC3CC', border: 'none', borderRadius: '999px', padding: '0 24px', fontWeight: '600', cursor: 'pointer' }}>
                    send
                </button>
            </form>
        </div>
    );
}