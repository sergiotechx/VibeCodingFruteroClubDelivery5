import { useState } from 'react';
import type { PetType, CharacterOption } from '../types/game';
import './StartScreen.css';

interface StartScreenProps {
    onStart: (petName: string, petType: PetType) => void;
}

const CHARACTERS: CharacterOption[] = [
    { type: 'fire', name: 'Fosforito', emoji: '🔥' },
    { type: 'water', name: 'Charquito', emoji: '💧' },
    { type: 'earth', name: 'Mugresito', emoji: '🥔' },
    { type: 'air', name: 'Suspiro', emoji: '💨' },
];

export function StartScreen({ onStart }: StartScreenProps) {
    const [petName, setPetName] = useState('');
    const [selectedType, setSelectedType] = useState<PetType | null>(null);

    const handleStart = () => {
        if (petName.trim() && selectedType) {
            onStart(petName.trim(), selectedType);
        }
    };

    return (
        <div className="start-screen">
            <div className="start-container">
                <header className="start-header">
                    <h1 className="start-title">ELEMON</h1>
                    <p className="start-subtitle">Pocket Monster Pal</p>
                </header>

                <div className="start-content">
                    <h2 className="section-title">Choose a pal</h2>

                    <div className="character-grid">
                        {CHARACTERS.map((char) => (
                            <button
                                key={char.type}
                                className={`character-card ${selectedType === char.type ? 'selected' : ''}`}
                                onClick={() => setSelectedType(char.type)}
                            >
                                <div className="character-preview">
                                    <img
                                        src={`/assets/${char.type}-adult-happy.png`}
                                        alt={char.name}
                                        className="character-sprite"
                                        onError={(e) => {
                                            // Fallback to emoji if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="character-emoji hidden">{char.emoji}</div>
                                </div>
                                <div className="character-name">{char.name}</div>
                            </button>
                        ))}
                    </div>

                    <div className="name-input-section">
                        <label htmlFor="pet-name" className="input-label">
                            Name your companion:
                        </label>
                        <input
                            id="pet-name"
                            type="text"
                            className="nes-input"
                            placeholder="Enter name..."
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            maxLength={12}
                        />
                    </div>

                    <div className="button-container">
                        <button
                            className="nes-btn is-warning action-btn"
                            onClick={handleStart}
                            disabled={!petName.trim() || !selectedType}
                        >
                            Start Adventure
                        </button>
                    </div>
                </div>

                <footer className="start-footer">
                    © 2023 RetroPals Inc.
                </footer>
            </div>
        </div>
    );
}
