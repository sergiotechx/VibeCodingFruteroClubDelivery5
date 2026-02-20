import { useState, useEffect } from 'react';
import { regenmonHubApi, HubProfileResponse } from '../services/regenmonHubApi';

interface PublicProfileModalProps {
    regenmonId: string;
    onClose: () => void;
}

export function PublicProfileModal({ regenmonId, onClose }: PublicProfileModalProps) {
    const [profile, setProfile] = useState<HubProfileResponse['data'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await regenmonHubApi.getRegenmonProfile(regenmonId);
                if (response.success) {
                    setProfile(response.data);
                } else {
                    setError("No se pudo cargar el perfil.");
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                setError("Error conectando con el servidor.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [regenmonId]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="nes-dialog is-dark is-rounded" style={{
                width: '90%',
                maxWidth: '500px',
                padding: '2rem',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button
                    className="nes-btn is-error"
                    onClick={onClose}
                    style={{ position: 'absolute', top: '10px', right: '10px' }}
                >
                    X
                </button>

                <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Perfil de Regenmon</h2>

                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>Cargando datos del Regenmon...</p>
                ) : error ? (
                    <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
                ) : profile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '128px', height: '128px', backgroundColor: '#333', borderRadius: '50%', overflow: 'hidden', marginBottom: '15px' }}>
                            <img
                                src={profile.sprite}
                                alt={profile.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = '❓'; }}
                            />
                        </div>

                        <h3 className="pet-name" style={{ fontSize: '2rem', marginBottom: '10px' }}>{profile.name}</h3>

                        {profile.ownerName && (
                            <p style={{ color: '#ccc', marginBottom: '20px' }}>
                                Entrenador: <span style={{ color: 'white' }}>{profile.ownerName}</span>
                            </p>
                        )}

                        <div className="nes-container is-rounded" style={{ width: '100%', backgroundColor: 'black', marginBottom: '20px' }}>
                            <p><strong>🍇 $FRUTA:</strong> {profile.totalPoints}</p>
                            <p><strong>👁️ Visitas:</strong> {profile.visits}</p>
                            <p><strong>📅 Registro:</strong> {new Date(profile.registeredAt).toLocaleString()}</p>

                            <hr style={{ margin: '15px 0' }} />

                            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Estadísticas</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '1.2rem' }}>
                                <span>👋 {profile.stats.happiness}</span>
                                <span>🍖 {profile.stats.hunger}</span>
                                <span>🏋️ {profile.stats.energy}</span>
                            </div>
                        </div>

                        <button className="nes-btn" onClick={onClose} style={{ width: '100%' }}>
                            Volver al Ranking
                        </button>
                    </div>
                ) : null}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
