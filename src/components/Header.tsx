import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AboutModal } from './AboutModal';

export const Header = () => {
    const { ready, authenticated, user, logout } = usePrivy();
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    if (!ready || !authenticated || !user) return null;

    const googleProfile = user.google;
    const avatarUrl = (googleProfile as any)?.picture;
    const displayName = (googleProfile as any)?.name || user.email?.address || 'Explorer';

    return (
        <>
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            imageRendering: 'pixelated'
                        }}
                    />
                ) : (
                    <div className="nes-container is-rounded is-dark" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        {displayName}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                        className="nes-btn is-error"
                        onClick={logout}
                        style={{ fontSize: '0.8rem' }}
                    >
                        Logout
                    </button>
                    <button
                        className="nes-btn"
                        onClick={() => setIsAboutOpen(true)}
                        style={{ fontSize: '0.7rem' }}
                    >
                        About
                    </button>
                </div>
            </div>

            <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        </>
    );
};
