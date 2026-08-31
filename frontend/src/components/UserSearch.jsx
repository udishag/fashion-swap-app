import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function UserSearch({ currentUserId, onSelectUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // Search items or profiles table matching the query
            const { data, error } = await supabase
                .from('items')
                .select('uploaded_by, brand')
                .ilike('brand', `%${query}%`)
                .limit(5);

            if (!error && data) {
                // Filter unique uploaders/users
                setSearchResults(data);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '20px 0' }}>
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search MOSS users..."
                style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e5e5e5',
                    fontSize: '0.85rem',
                    outline: 'none',
                    backgroundColor: '#fafafa'
                }}
            />

            {searchResults.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '45px',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #eaeaea',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    zIndex: 10,
                    overflow: 'hidden'
                }}>
                    {searchResults.map((user, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                onSelectUser({ username: user.uploaded_by || 'curator', id: user.uploaded_by });
                                setSearchTerm('');
                                setSearchResults([]);
                            }}
                            style={{
                                padding: '10px 16px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                borderBottom: idx < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}
                        >
                            @{user.uploaded_by || user.brand}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}