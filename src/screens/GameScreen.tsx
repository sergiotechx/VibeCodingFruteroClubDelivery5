import { useState } from 'react';
import type { GameState } from '../types/game';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getSpriteUrl, getEmotion } from '../utils/spriteResolver';
import { ResetModal } from '../components/ResetModal';
import { EvolutionCountdown } from '../components/EvolutionCountdown';
import './GameScreen.css';

interface GameScreenProps {
    gameState: GameState;
    onIncreaseStat: (stat: 'hunger' | 'happiness' | 'energy') => void;
    onReset: () => void;
}

export function GameScreen({ gameState, onIncreaseStat, onReset }: GameScreenProps) {
    const { isMuted, toggleMute } = useAudioPlayer('/assets/music.mp3');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const emotion = getEmotion(gameState.stats);
    const spriteUrl = getSpriteUrl(gameState.petType, gameState.stage, emotion);

    const handleResetClick = () => {
        setIsResetModalOpen(true);
    };

    const handleResetConfirm = () => {
        setIsResetModalOpen(false);
        onReset();
    };

    const handleResetCancel = () => {
        setIsResetModalOpen(false);
    };

    return (
        <div className="game-screen">
            <div className="game-container">
                {/* Header */}
                <header className="game-header">
                    <h1 className="pet-name">{gameState.petName}</h1>
                    <div className="header-controls">
                        <button
                            className="nes-btn is-small control-btn"
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute music' : 'Mute music'}
                        >
                            {isMuted ? '🔇' : '🎵'}
                        </button>
                        <button
                            className="nes-btn is-small is-error control-btn"
                            onClick={handleResetClick}
                            title="Reset cartridge"
                        >
                            ♻️
                        </button>
                    </div>
                </header>

                {/* Pet Display */}
                <div className="pet-display">
                    <div className="pet-sprite-container">
                        <img
                            src={spriteUrl}
                            alt={`${gameState.petName} - ${gameState.stage}`}
                            className={`pet-sprite ${emotion === 'happy' ? 'floating' : ''}`}
                            onError={(e) => {
                                // Fallback to placeholder if sprite fails to load
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="40"%3E?%3C/text%3E%3C/svg%3E';
                            }}
                        />
                    </div>
                    <div className="pet-stage-label">{gameState.stage.toUpperCase()}</div>
                </div>

                {/* Evolution Countdown */}
                <EvolutionCountdown
                    stage={gameState.stage}
                    emotion={emotion}
                    happyTimeAccumulated={gameState.happyTimeAccumulated}
                />

                {/* Stats Display */}
                <div className="stats-section">
                    <div className="stat-row">
                        <label className="stat-label">🍖 Hunger</label>
                        <div className="stat-bar-container">
                            <progress
                                className="nes-progress is-error"
                                value={gameState.stats.hunger}
                                max="100"
                            />
                            <span className="stat-value">{gameState.stats.hunger}</span>
                        </div>
                    </div>

                    <div className="stat-row">
                        <label className="stat-label">👋 Happiness</label>
                        <div className="stat-bar-container">
                            <progress
                                className="nes-progress is-warning"
                                value={gameState.stats.happiness}
                                max="100"
                            />
                            <span className="stat-value">{gameState.stats.happiness}</span>
                        </div>
                    </div>

                    <div className="stat-row">
                        <label className="stat-label">🏋️ Energy</label>
                        <div className="stat-bar-container">
                            <progress
                                className="nes-progress is-success"
                                value={gameState.stats.energy}
                                max="100"
                            />
                            <span className="stat-value">{gameState.stats.energy}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="actions-section">
                    <button
                        className="nes-btn is-error action-btn"
                        onClick={() => onIncreaseStat('hunger')}
                        disabled={gameState.stage === 'dead'}
                    >
                        🍖 Comer
                    </button>
                    <button
                        className="nes-btn is-warning action-btn"
                        onClick={() => onIncreaseStat('happiness')}
                        disabled={gameState.stage === 'dead'}
                    >
                        👋 Jugar
                    </button>
                    <button
                        className="nes-btn is-success action-btn"
                        onClick={() => onIncreaseStat('energy')}
                        disabled={gameState.stage === 'dead'}
                    >
                        🏋️ Entrenar
                    </button>
                </div>

                {/* Death Message */}
                {gameState.stage === 'dead' && (
                    <div className="death-message">
                        <div className="nes-container is-dark">
                            <p>💀 {gameState.petName} has passed away...</p>
                            <p>Reset the cartridge to start a new adventure.</p>
                        </div>
                    </div>
                )}
            </div>

            <ResetModal
                isOpen={isResetModalOpen}
                petName={gameState.petName}
                onConfirm={handleResetConfirm}
                onCancel={handleResetCancel}
            />
        </div>
    );
}
