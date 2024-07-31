import React, { useState } from 'react';

interface AddressBarProps {
    link: string;
    onLinkChange: (newLink: string) => void;
}

export const AddressBar: React.FC<AddressBarProps> = ({ link, onLinkChange }) => {
    const [inputValue, setInputValue] = useState(link);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            onLinkChange(inputValue);
        }
    };

    const handleOkClick = () => {
        onLinkChange(inputValue);
    };

    return (
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', margin: '0', display: 'flex', alignItems: 'center' }}>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                    flex: '1',
                    padding: '10px',
                    fontSize: '16px',
                    marginRight: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc'
                }}
            />
            <button
                onClick={handleOkClick}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                OK
            </button>
        </div>
    );
};
