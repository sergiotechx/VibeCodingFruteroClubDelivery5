import { useState, useEffect } from 'react';
import { regenmonHubApi, HubLeaderboardItem } from '../services/regenmonHubApi';
import type { GameState } from '../types/game';
import { PublicProfileModal } from '../components/PublicProfileModal';

interface LeaderboardScreenProps {
    onPlayClick: () => void;
    gameState: GameState | null;
}

export function LeaderboardScreen({ onPlayClick, gameState }: LeaderboardScreenProps) {
    const [leaderboardData, setLeaderboardData] = useState<HubLeaderboardItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRegenmonId, setSelectedRegenmonId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const response = await regenmonHubApi.getLeaderboard(page, LIMIT);
                if (response.success) {
                    setLeaderboardData(response.data);
                    setTotalPages(response.pagination.totalPages);
                } else {
                    setError("Failed to load leaderboard.");
                }
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
                setError("Error connecting to the Hub.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [page]);

    return (
        <div className="screen leaderboard-screen" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            minHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
            boxSizing: 'border-box'
        }}>
            {/* Floating PLAY Button */}
            <div style={{ marginBottom: '30px', animation: 'float 3s ease-in-out infinite' }}>
                <button
                    className="nes-btn is-primary"
                    onClick={onPlayClick}
                    style={{ fontSize: '1.5rem', padding: '10px 30px' }}
                >
                    PLAY
                </button>
            </div>

            <h2 className="title" style={{ color: 'white', textShadow: '2px 2px 0 #000', marginBottom: '20px' }}>
                🏆 Ranking Global
            </h2>

            {/* Leaderboard Container */}
            <div className="nes-container is-rounded is-dark" style={{ width: '100%', maxWidth: '800px', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>Cargando ranking...</p>
                ) : error ? (
                    <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {leaderboardData.map((item) => {
                            const rank = item.rank;

                            // Highlight current user's pet if they are logged in and registered
                            const isCurrentUser = gameState?.regenmonId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`nes-container is-rounded ${isCurrentUser ? 'is-warning' : 'is-dark'}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                        ...(isCurrentUser ? { backgroundColor: 'rgba(255, 204, 0, 0.2)' } : {})
                                    }}
                                    onClick={() => setSelectedRegenmonId(item.id)}
                                    title="Click para ver perfil"
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <h3 style={{ marginRight: '15px', minWidth: '40px' }}>#{rank}</h3>

                                    <div style={{ width: '64px', height: '64px', marginRight: '15px', backgroundColor: '#333', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <img src={item.sprite} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = '❓'; }} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{item.name}</h4>
                                        <div style={{ fontSize: '0.7rem', color: '#ccc' }}>
                                            Reg: {new Date(item.registeredAt).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {item.ownerName && (
                                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                                                🧑‍💻 {item.ownerName}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '1.2rem', textAlign: 'right', minWidth: '80px' }}>
                                            🍇 {item.totalPoints}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button
                        className={`nes-btn is-small ${page === 1 ? 'is-disabled' : ''}`}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        Anterior
                    </button>
                    <span>Página {page}</span>
                    <button
                        className={`nes-btn is-small ${page >= totalPages ? 'is-disabled' : ''}`}
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages || isLoading}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Floating animation keyframes injection */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>

            {/* Public Profile Modal */}
            {selectedRegenmonId && (
                <PublicProfileModal
                    regenmonId={selectedRegenmonId}
                    onClose={() => setSelectedRegenmonId(null)}
                />
            )}
        </div>
    );
}
