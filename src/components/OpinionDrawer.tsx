import { useState } from 'react';
import type { EvaluationCategory, EvaluationResult } from '../types/game';
import { evaluateImage } from '../services/evaluationService';
import './OpinionDrawer.css';

interface OpinionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    petName: string;
    onEvaluationComplete: (result: EvaluationResult) => void;
}

export function OpinionDrawer({ isOpen, onClose, petName, onEvaluationComplete }: OpinionDrawerProps) {
    const [category, setCategory] = useState<EvaluationCategory | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [result, setResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            setError('Error al evaluar la imagen');
            console.error(err);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleComplete = () => {
        if (result) {
            onEvaluationComplete(result);
        }
        handleReset();
        onClose();
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

    return (
        <>
            <div className="opinion-overlay" onClick={handleClose}></div>
            <div className="opinion-drawer nes-container is-dark">
                <button className="nes-btn is-error close-btn" onClick={handleClose}>✕</button>

                <h2 className="title">ELEMON: {petName} Estudiante</h2>
                <p className="description">
                    Tu Elemon evaluará el material que subas. ¡Si te inspiras, se pondrá muy feliz!
                </p>

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
                            <div className="nes-text is-error error-message">{error}</div>
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
                            <p className="result-feedback">{result.feedback}</p>
                        </div>

                        {/* Complete Button */}
                        <button className="nes-btn is-primary complete-btn" onClick={handleComplete}>
                            ¡Entendido!
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
