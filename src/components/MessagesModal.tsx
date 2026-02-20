import { useState, useEffect } from 'react';
import { regenmonHubApi, HubMessage } from '../services/regenmonHubApi';
import './MessagesModal.css';

interface MessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    petName: string;
    regenmonId: string | null;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function MessagesModal({ isOpen, onClose, petName, regenmonId }: MessagesModalProps) {
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const LIMIT = 20;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    useEffect(() => {
        if (!isOpen || !regenmonId) return;
        const fetchMessages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await regenmonHubApi.getMessages(regenmonId, page, LIMIT);
                if (res.success) {
                    setMessages(res.data.messages);
                    setTotal(res.data.total);
                } else {
                    setError('No se pudieron cargar los mensajes.');
                }
            } catch {
                setError('Error conectando al servidor.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [isOpen, regenmonId, page]);

    // Reset page when modal opens
    useEffect(() => {
        if (isOpen) setPage(1);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="msg-overlay" onClick={onClose}>
            <div className="msg-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="msg-header">
                    <h2>📬 Mensajes para {petName}</h2>
                    <button className="nes-btn is-error msg-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className="msg-body">
                    {isLoading ? (
                        <div className="msg-loading">Cargando mensajes...</div>
                    ) : error ? (
                        <div className="msg-error">{error}</div>
                    ) : messages.length === 0 ? (
                        <div className="msg-empty">
                            <span className="msg-empty-icon">📭</span>
                            <p>No hay mensajes aún.</p>
                            <p className="msg-empty-hint">¡Otros jugadores pueden enviarte mensajes desde el Explorador!</p>
                        </div>
                    ) : (
                        <div className="msg-list">
                            {messages.map((msg) => (
                                <div key={msg.id} className="msg-bubble">
                                    <div className="msg-bubble-header">
                                        <span className="msg-sender">👤 {msg.fromName}</span>
                                        <span className="msg-date">{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <div className="msg-text">{msg.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {total > LIMIT && (
                    <div className="msg-pagination">
                        <button
                            className="nes-btn is-small"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            ◀
                        </button>
                        <span className="msg-page-info">Página {page} / {totalPages}</span>
                        <button
                            className="nes-btn is-small"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages || isLoading}
                        >
                            ▶
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
