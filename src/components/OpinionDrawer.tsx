import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EvaluationCategory, EvaluationResult, PetStage } from '../types/game';
import { evaluateImage } from '../services/evaluationService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './OpinionDrawer.css';

interface OpinionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    petName: string;
    onEvaluationComplete: (result: EvaluationResult) => void;
    currentStage: PetStage;
    evaluationCoins: number;
}

export function OpinionDrawer({ isOpen, onClose, petName, onEvaluationComplete, currentStage, evaluationCoins }: OpinionDrawerProps) {
    // Audio player for "Estudia.mp3"
    // Note: useAudioPlayer handles autoplay if not muted globally
    const { isMuted, toggleMute } = useAudioPlayer(isOpen ? '/assets/Estudia.mp3' : '');

    const [category, setCategory] = useState<EvaluationCategory | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [result, setResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState(0);

    const LOADING_MESSAGES = [
        '🔄 Evaluando tu trabajo...',
        '🤔 Tu ELEMON está pensando...',
        '📝 Analizando la imagen...',
        '✨ Casi listo...',
    ];

    // Rotate loading messages
    useEffect(() => {
        if (!isEvaluating) return;
        setLoadingMsg(0);
        const interval = setInterval(() => {
            setLoadingMsg(prev => (prev + 1) % 4);
        }, 2500);
        return () => clearInterval(interval);
    }, [isEvaluating]);

    // ... (handlers remain the same)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen debe ser menor a 5MB');
            return;
        }

        // Validate type
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            setError('Solo se permiten imágenes PNG o JPG');
            return;
        }

        setError(null);
        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleEvaluate = async () => {
        if (!category || !imageFile) {
            setError('Selecciona una categoría y sube una imagen');
            return;
        }

        setIsEvaluating(true);
        setError(null);

        try {
            const evaluationResult = await evaluateImage(imageFile, category);
            setResult(evaluationResult);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido al evaluar la imagen';
            setError(message);
            console.error('Evaluation error:', err);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleComplete = () => {
        if (result) {
            onEvaluationComplete(result);
        }
        handleReset();
    };

    const handleReset = () => {
        setCategory(null);
        setImageFile(null);
        setImagePreview(null);
        setResult(null);
        setError(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    const getResultEmoji = (score: number) => {
        if (score >= 80) return '🏆';
        if (score >= 60) return '⭐';
        if (score >= 40) return '👍';
        return '💪';
    };

    const getResultBackground = (score: number) => {
        if (score >= 80) return '#FFA50033';
        if (score >= 60) return '#FFD70033';
        if (score >= 40) return '#FFD70033';
        return '#FF634733';
    };

    return createPortal(
        <div className="opinion-modal-wrapper">
            <div className="opinion-overlay-backdrop" onClick={handleClose}></div>
            <div className="opinion-drawer nes-container is-dark">

                {/* Header Controls (Audio + Close) */}
                <div className="drawer-header-controls">
                    <button
                        className="nes-btn is-warning control-btn audio-btn"
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute music' : 'Mute music'}
                    >
                        {isMuted ? '🔇' : '🎵'}
                    </button>
                    <button className="nes-btn is-error control-btn close-btn" onClick={handleClose}>✕</button>
                </div>

                <h2 className="title">
                    <div style={{ textShadow: '2px 2px #000', marginBottom: '0.25rem' }}>ELEMON</div>
                    <div style={{ color: '#FFA500', fontSize: '1.2em', margin: '0.5rem 0', textTransform: 'uppercase' }}>{petName}</div>
                    <div style={{ fontSize: '0.8em', color: '#ccc' }}>Estudiante</div>
                </h2>
                <p className="description">
                    Tu Elemon evaluará el material que subas. ¡Si te inspiras, se pondrá muy feliz!
                </p>

                {/* Evolution Progress Section */}
                <div className="evolution-progress-section" style={{ marginBottom: '2rem', textAlign: 'center', padding: '0 1rem' }}>
                    {currentStage === 'adult' ? (
                        <div className="nes-container is-rounded is-dark" style={{ borderColor: '#ffd700', color: '#ffd700', padding: '1rem' }}>
                            <p style={{ marginBottom: 0 }}>🌟 ¡Tu Elemon ha alcanzado su máximo potencial! (Etapa Adulta)</p>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#aaa' }}>
                                Progreso Evolución ({evaluationCoins}/50 ⭐)
                            </p>
                            <progress
                                className={`nes-progress ${evaluationCoins >= 40 ? 'is-success' : 'is-primary'}`}
                                value={evaluationCoins}
                                max="50"
                                style={{ height: '24px' }}
                            ></progress>
                            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: '#666' }}>
                                *Al llegar a 50 puntos de estudio, evolucionará.
                            </p>
                        </>
                    )}
                </div>

                {!result ? (
                    <>
                        {/* Category Selection */}
                        <div className="category-section">
                            <h3>Selecciona Categoría:</h3>
                            <div className="category-buttons">
                                <button
                                    className={`nes-btn category-btn letras ${category === 'letras' ? 'selected' : ''}`}
                                    onClick={() => setCategory('letras')}
                                >
                                    Letras 🎵
                                </button>
                                <button
                                    className={`nes-btn category-btn poemas ${category === 'poemas' ? 'selected' : ''}`}
                                    onClick={() => setCategory('poemas')}
                                >
                                    Poemas 📜
                                </button>
                                <button
                                    className={`nes-btn category-btn diseno ${category === 'diseño' ? 'selected' : ''}`}
                                    onClick={() => setCategory('diseño')}
                                >
                                    Diseño 🎨
                                </button>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="upload-section">
                            <label htmlFor="image-upload" className="nes-btn is-primary upload-btn">
                                📸 Subir Captura
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="image-preview-container">
                                <img src={imagePreview} alt="Preview" className="image-preview" />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="eval-error-box">
                                <span className="eval-error-icon">⚠️</span>
                                <p className="eval-error-text">{error}</p>
                                <button className="nes-btn is-warning eval-retry-btn" onClick={() => { setError(null); handleEvaluate(); }}>
                                    🔄 Reintentar
                                </button>
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {isEvaluating && (
                            <div className="eval-loading-overlay">
                                <div className="eval-loading-spinner">🔮</div>
                                <p className="eval-loading-text">{LOADING_MESSAGES[loadingMsg]}</p>
                                <p className="eval-loading-hint">Esto puede tardar unos segundos...</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button
                                className="nes-btn is-success"
                                onClick={handleEvaluate}
                                disabled={!category || !imageFile || isEvaluating}
                            >
                                {isEvaluating ? '🔄 Evaluando...' : '✅ Evaluar'}
                            </button>
                            <button className="nes-btn" onClick={handleClose}>
                                ❌ Cancelar
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Results Card */}
                        <div
                            className="results-card nes-container is-rounded"
                            style={{ backgroundColor: getResultBackground(result.score) }}
                        >
                            <div className="result-emoji">{getResultEmoji(result.score)}</div>
                            <h3 className="result-score">Puntuación: {result.score}/100</h3>

                            {/* Coin Feedback */}
                            <div className="coin-feedback" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                                {result.score >= 60 && <span style={{ color: '#228B22' }}>¡Tus stats subieron +10! 💪</span>}
                                {result.score >= 50 && result.score < 60 && <span style={{ color: '#8B4513' }}>Sin cambios en stats 😐</span>}
                                {result.score < 50 && <span style={{ color: '#D8000C' }}>Tus stats bajaron -5 😰</span>}
                            </div>

                            <p className="result-feedback">{result.feedback}</p>
                        </div>

                        {/* Complete Button */}
                        <button className="nes-btn is-primary complete-btn" onClick={handleComplete}>
                            Estudiar más
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
