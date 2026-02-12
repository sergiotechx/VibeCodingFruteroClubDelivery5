import { useEffect } from 'react';
import './IntroScreen.css';

interface IntroScreenProps {
    onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
    useEffect(() => {
        // Fallback: auto-advance after 10 seconds if video doesn't load
        const timeout = setTimeout(onComplete, 10000);
        return () => clearTimeout(timeout);
    }, [onComplete]);

    return (
        <div className="intro-screen">
            <video
                className="intro-video"
                src="/assets/intro.mp4"
                autoPlay
                muted
                playsInline
                onEnded={onComplete}
                onError={() => {
                    console.warn('Video failed to load, advancing to start screen');
                    onComplete();
                }}
            />
            <div className="intro-overlay">
                <div className="loading-text">LOADING WORLD...</div>
                <h1 className="intro-title">ELEMON</h1>
            </div>
        </div>
    );
}
