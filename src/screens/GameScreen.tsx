import { useState } from 'react';
import type { GameState, EvaluationResult } from '../types/game';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getSpriteUrl, getEmotion } from '../utils/spriteResolver';
import { ResetModal } from '../components/ResetModal';
import { EvolutionCountdown } from '../components/EvolutionCountdown';
import { ChatArea } from '../components/ChatArea';
import { OpinionDrawer } from '../components/OpinionDrawer';
import './GameScreen.css';

interface GameScreenProps {
    gameState: GameState;
    onAction: (action: 'eat' | 'play' | 'train') => void;
    onEvaluation: (result: EvaluationResult) => void;
    onReset: () => void;
}

export function GameScreen({ gameState, onAction, onEvaluation, onReset }: GameScreenProps) {
    const { isMuted, toggleMute } = useAudioPlayer('/assets/music.mp3');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isOpinionOpen, setIsOpinionOpen] = useState(false);

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

    const handleEvaluationComplete = (result: EvaluationResult) => {
        onEvaluation(result);
        setIsOpinionOpen(false);
    };

    return (
        <div className="game-screen">
            <div className="content-wrapper">
                <div className="game-container">
                    {/* Header */}
                    <header className="game-header">
                        <div className="header-info">
                            <h1 className="pet-name">{gameState.petName}</h1>
                            <div className="coin-counter">
                                💰 {gameState.coins}
                            </div>
                        </div>
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
                            onClick={() => onAction('eat')}
                            disabled={gameState.stage === 'dead' || gameState.stats.hunger >= 100 || gameState.coins < 10}
                            title={gameState.coins < 10 ? 'Not enough coins (10)' : 'Cost: 10 coins'}
                        >
                            <div className="btn-content">
                                <span>🍖 Comer</span>
                                <span className="btn-cost">-10💰</span>
                            </div>
                        </button>
                        <button
                            className="nes-btn is-warning action-btn"
                            onClick={() => onAction('play')}
                            disabled={gameState.stage === 'dead' || gameState.stats.happiness >= 100}
                        >
                            <div className="btn-content">
                                <span>👋 Jugar</span>
                                <span className="btn-gain">+5💰</span>
                            </div>
                        </button>
                        <button
                            className="nes-btn is-success action-btn"
                            onClick={() => onAction('train')}
                            disabled={gameState.stage === 'dead' || gameState.stats.energy >= 100}
                        >
                            <div className="btn-content">
                                <span>🏋️ Entrenar</span>
                                <span className="btn-gain">+6💰</span>
                            </div>
                        </button>
                        <button
                            className="nes-btn is-primary action-btn opinion-btn"
                            onClick={() => setIsOpinionOpen(true)}
                            disabled={gameState.stage === 'dead'}
                        >
                            <div className="btn-content">
                                <span>Opinión 🤔</span>
                            </div>
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

                {/* Chat Area */}
                <ChatArea
                    petName={gameState.petName}
                    petType={gameState.petType}
                    stats={gameState.stats}
                />
            </div>

            <ResetModal
                isOpen={isResetModalOpen}
                petName={gameState.petName}
                onConfirm={handleResetConfirm}
                onCancel={handleResetCancel}
            />
            <OpinionDrawer
                isOpen={isOpinionOpen}
                onClose={() => setIsOpinionOpen(false)}
                petName={gameState.petName}
                onEvaluationComplete={handleEvaluationComplete}
            />
        </div>
    );
}
