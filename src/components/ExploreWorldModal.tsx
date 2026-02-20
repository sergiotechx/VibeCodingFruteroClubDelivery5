import { useState, useEffect } from 'react';
import { regenmonHubApi, HubLeaderboardItem } from '../services/regenmonHubApi';
import type { GameState } from '../types/game';
import { getSpriteUrl } from '../utils/spriteResolver';
import './ExploreWorldModal.css';

interface ExploreWorldModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameState;
    onCoinsUpdate?: (newBalance: number) => void;
}

export function ExploreWorldModal({ isOpen, onClose, gameState, onCoinsUpdate }: ExploreWorldModalProps) {
    const [leaderboardData, setLeaderboardData] = useState<HubLeaderboardItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const LIMIT = 10;

    useEffect(() => {
        if (!isOpen) return;
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await regenmonHubApi.getLeaderboard(page, LIMIT);
                if (response.success) {
                    setLeaderboardData(response.data);
                    setTotalPages(response.pagination.totalPages);
                } else {
                    setError('No se pudo cargar el ranking.');
                }
            } catch {
                setError('Error conectando al Hub.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [isOpen, page]);

    if (!isOpen) return null;

    const mySprite = getSpriteUrl(gameState.petType, gameState.stage, 'happy');

    const clearStatus = () => {
        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleFeed = async () => {
        if (!selectedId) return;
        setActionLoading(true);
        try {
            const res = await regenmonHubApi.feedRegenmon(selectedId, gameState.regenmonId);
            setActionStatus({ type: res.success ? 'success' : 'error', text: res.data?.message || res.message || '¡Alimentado!' });
            if (res.success && res.data?.senderBalance !== undefined && onCoinsUpdate) {
                onCoinsUpdate(res.data.senderBalance);
            }
        } catch {
            setActionStatus({ type: 'error', text: 'Error al alimentar.' });
        } finally {
            setActionLoading(false);
            clearStatus();
        }
    };

    const handleGift = async () => {
        if (!selectedId) return;
        setActionLoading(true);
        try {
            const res = await regenmonHubApi.giftRegenmon(selectedId, gameState.regenmonId);
            setActionStatus({ type: res.success ? 'success' : 'error', text: res.data?.message || res.message || '¡Regalo enviado!' });
            if (res.success && res.data?.senderBalance !== undefined && onCoinsUpdate) {
                onCoinsUpdate(res.data.senderBalance);
            }
        } catch {
            setActionStatus({ type: 'error', text: 'Error al enviar regalo.' });
        } finally {
            setActionLoading(false);
            clearStatus();
        }
    };

    const handleSendMessage = async () => {
        if (!selectedId || !message.trim()) return;
        setActionLoading(true);
        try {
            const res = await regenmonHubApi.sendMessage(selectedId, message.trim(), gameState.regenmonId, gameState.petName);
            setActionStatus({ type: res.success ? 'success' : 'error', text: res.message || '¡Mensaje enviado!' });
            if (res.success) setMessage('');
        } catch {
            setActionStatus({ type: 'error', text: 'Error al enviar mensaje.' });
        } finally {
            setActionLoading(false);
            clearStatus();
        }
    };

    const selectedMonster = leaderboardData.find(m => m.id === selectedId);

    return (
        <div className="ew-overlay" onClick={onClose}>
            <div className="ew-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ew-header">
                    <h2>🌍 Explorar el Mundo</h2>
                    <button className="nes-btn is-error ew-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="ew-body">
                    {/* Left Panel - My Elemon + Actions */}
                    <div className="ew-left">
                        <div className="ew-my-elemon">
                            <img
                                src={mySprite}
                                alt={gameState.petName}
                                className="ew-my-sprite"
                                onError={e => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23333" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="30"%3E?%3C/text%3E%3C/svg%3E';
                                }}
                            />
                            <div className="ew-my-name">{gameState.petName}</div>
                            <div className="ew-my-stage">{gameState.stage.toUpperCase()}</div>
                        </div>

                        {/* Target info */}
                        <div className="ew-target-info">
                            {selectedMonster ? (
                                <div className="ew-target-selected">
                                    <span>🎯 Target:</span>
                                    <strong>{selectedMonster.name}</strong>
                                </div>
                            ) : (
                                <div className="ew-target-hint">
                                    ← Selecciona una mascota
                                </div>
                            )}
                        </div>

                        {/* Action Status */}
                        {actionStatus && (
                            <div className={`ew-status ${actionStatus.type}`}>
                                {actionStatus.type === 'success' ? '✅' : '❌'} {actionStatus.text}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="ew-actions">
                            <button
                                className="nes-btn is-success ew-action-btn"
                                onClick={handleFeed}
                                disabled={!selectedId || actionLoading}
                                title={!selectedId ? 'Selecciona una mascota primero' : 'Alimentar la mascota'}
                            >
                                🍖 Alimentar
                            </button>

                            <button
                                className="nes-btn is-warning ew-action-btn"
                                onClick={handleGift}
                                disabled={!selectedId || actionLoading}
                                title={!selectedId ? 'Selecciona una mascota primero' : 'Dar un regalo'}
                            >
                                🎁 Dar regalo
                            </button>

                            {/* Message */}
                            <div className="ew-message-section">
                                <label className="ew-msg-label">💬 Enviar mensaje</label>
                                <textarea
                                    className="nes-input ew-msg-input"
                                    placeholder="Escribe tu mensaje..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    disabled={!selectedId || actionLoading}
                                    rows={3}
                                />
                                <button
                                    className="nes-btn is-primary ew-action-btn"
                                    onClick={handleSendMessage}
                                    disabled={!selectedId || !message.trim() || actionLoading}
                                >
                                    📨 Enviar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Leaderboard */}
                    <div className="ew-right">
                        <h3 className="ew-right-title">🏆 Ranking Global</h3>

                        {isLoading ? (
                            <div className="ew-loading">Cargando...</div>
                        ) : error ? (
                            <div className="ew-error">{error}</div>
                        ) : (
                            <div className="ew-list">
                                {leaderboardData.map(item => {
                                    const isMe = gameState.regenmonId === item.id;
                                    const isSelected = selectedId === item.id;
                                    return (
                                        <label
                                            key={item.id}
                                            className={`ew-list-item ${isSelected ? 'selected' : ''} ${isMe ? 'is-me' : ''}`}
                                            title={isMe ? 'Esta es tu mascota' : 'Seleccionar esta mascota'}
                                        >
                                            <input
                                                type="radio"
                                                name="targetRegenmon"
                                                value={item.id}
                                                checked={isSelected}
                                                onChange={() => {
                                                    setSelectedId(item.id);
                                                    setActionStatus(null);
                                                }}
                                                className="ew-radio"
                                            />
                                            <div className="ew-item-sprite-wrap">
                                                <img
                                                    src={item.sprite}
                                                    alt={item.name}
                                                    className="ew-item-sprite"
                                                    onError={e => {
                                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23333" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="20"%3E?%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                            </div>
                                            <div className="ew-item-info">
                                                <div className="ew-item-name">
                                                    <span className="ew-item-rank">#{item.rank}</span>
                                                    {item.name}
                                                    {isMe && <span className="ew-me-badge">TÚ</span>}
                                                </div>
                                                <div className="ew-item-pts">🍇 {item.totalPoints}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="ew-pagination">
                            <button
                                className="nes-btn is-small"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                ◀
                            </button>
                            <span className="ew-page-info">Página {page} / {totalPages}</span>
                            <button
                                className="nes-btn is-small"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages || isLoading}
                            >
                                ▶
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
