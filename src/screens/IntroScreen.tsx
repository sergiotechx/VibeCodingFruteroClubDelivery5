import { useEffect, useState, useMemo } from 'react';
import './IntroScreen.css';

interface IntroScreenProps {
    onComplete: () => void;
}

const BOOT_MESSAGES = [
    'INITIALIZING SYSTEM...',
    'LOADING CARTRIDGE...',
    'CHECKING MEMORY...',
    'READY!',
];

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const [hasStarted, setHasStarted] = useState(false);
    const [bootPhase, setBootPhase] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showStart, setShowStart] = useState(false);

    // Generate starfield once
    const stars = useMemo(() =>
        Array.from({ length: 60 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() > 0.7 ? 3 : 2,
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 3,
        })),
        []);

    // Boot sequence animation (before click)
    useEffect(() => {
        // Progress bar fills over 4 seconds
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { clearInterval(progressInterval); return 100; }
                return p + 2;
            });
        }, 80);

        // Boot messages advance every ~1.2s
        const timers = BOOT_MESSAGES.map((_, i) =>
            setTimeout(() => setBootPhase(i), i * 1200)
        );

        // Show "CLICK TO START" after boot completes
        const showTimer = setTimeout(() => setShowStart(true), BOOT_MESSAGES.length * 1200);

        return () => {
            clearInterval(progressInterval);
            timers.forEach(clearTimeout);
            clearTimeout(showTimer);
        };
    }, []);

    useEffect(() => {
        if (!hasStarted) return;
        const timeout = setTimeout(onComplete, 10000);
        return () => clearTimeout(timeout);
    }, [hasStarted, onComplete]);

    if (hasStarted) {
        return (
            <div className="intro-screen" onClick={onComplete}>
                <div className="intro-scanlines" />
                <video
                    className="intro-video"
                    src="/assets/intro.mp4"
                    autoPlay
                    playsInline
                    onEnded={onComplete}
                    onError={() => { console.warn('Video failed'); onComplete(); }}
                />
                <div className="intro-overlay">
                    <div className="loading-text">LOADING WORLD...</div>
                    <h1 className="intro-title crt-flicker">ELEMON</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="intro-screen" onClick={() => showStart && setHasStarted(true)} style={{ cursor: showStart ? 'pointer' : 'default' }}>
            {/* Starfield Background */}
            <div className="starfield">
                {stars.map(s => (
                    <div
                        key={s.id}
                        className="star"
                        style={{
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            width: `${s.size}px`,
                            height: `${s.size}px`,
                            animationDelay: `${s.delay}s`,
                            animationDuration: `${s.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* CRT Scanlines Overlay */}
            <div className="intro-scanlines" />

            {/* Content */}
            <div className="intro-overlay">
                <h1 className="intro-title crt-flicker">ELEMON</h1>

                {/* Pixel Progress Bar */}
                <div className="pixel-progress-bar">
                    <div className="pixel-progress-track">
                        {Array.from({ length: 20 }, (_, i) => (
                            <div
                                key={i}
                                className={`pixel-block ${i < Math.floor(progress / 5) ? 'filled' : ''}`}
                            />
                        ))}
                    </div>
                    <div className="pixel-progress-label">{Math.min(100, progress)}%</div>
                </div>

                {/* Boot Text */}
                <div className="boot-console">
                    {BOOT_MESSAGES.slice(0, bootPhase + 1).map((msg, i) => (
                        <div key={i} className={`boot-line ${i === bootPhase ? 'typing' : ''}`}>
                            {'> '}{msg}
                        </div>
                    ))}
                </div>

                {/* Click to Start */}
                {showStart && (
                    <div className="start-prompt">
                        ▶ PRESS START ◀
                    </div>
                )}
            </div>
        </div>
    );
}
