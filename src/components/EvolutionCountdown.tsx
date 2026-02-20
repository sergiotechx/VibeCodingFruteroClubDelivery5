import { useState, useEffect, useRef } from 'react';
import type { PetStage, Emotion } from '../types/game';
import './EvolutionCountdown.css';

interface EvolutionCountdownProps {
    stage: PetStage;
    emotion: Emotion;
    happyTimeAccumulated: number;
}

// Evolution milestones in milliseconds
const EVOLUTION_MILESTONES = {
    egg: 3 * 60 * 1000,    // 3 minutes to baby
    baby: 6 * 60 * 1000,   // 6 minutes total to adult
    adult: 0,              // no evolution
    dead: 0,               // no evolution
};

const NEXT_STAGE = {
    egg: 'Baby',
    baby: 'Adult',
    adult: null,
    dead: null,
};

export function EvolutionCountdown({ stage, emotion, happyTimeAccumulated }: EvolutionCountdownProps) {
    const [, setTick] = useState(0);
    const lastSyncedAt = useRef(Date.now());
    const lastSyncedValue = useRef(happyTimeAccumulated);

    // When the parent updates happyTimeAccumulated, reset the interpolation anchor
    useEffect(() => {
        lastSyncedAt.current = Date.now();
        lastSyncedValue.current = happyTimeAccumulated;
    }, [happyTimeAccumulated]);

    // Force re-render every second for smooth countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Don't show countdown for adult or dead stages
    if (stage === 'adult' || stage === 'dead') {
        return null;
    }

    const milestone = EVOLUTION_MILESTONES[stage];
    const nextStage = NEXT_STAGE[stage];

    // Interpolate locally: add elapsed time since last parent sync (only when not paused)
    const isPaused = emotion === 'sad';
    const elapsed = isPaused ? 0 : Date.now() - lastSyncedAt.current;
    const interpolated = lastSyncedValue.current + elapsed;
    const timeRemaining = Math.max(0, milestone - interpolated);

    // Convert to minutes and seconds
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Calculate progress percentage
    const progress = (interpolated / milestone) * 100;

    return (
        <div className={`evolution-countdown ${isPaused ? 'paused' : ''}`}>
            <div className="nes-container is-rounded countdown-container">
                <div className="countdown-header">
                    <span className="countdown-label">Next Evolution</span>
                    {isPaused && <span className="paused-indicator">⏸️ PAUSED</span>}
                </div>

                <div className="countdown-info">
                    <div className="stage-info">
                        <span className="current-stage">{stage.toUpperCase()}</span>
                        <span className="arrow">→</span>
                        <span className="next-stage">{nextStage?.toUpperCase()}</span>
                    </div>

                    <div className="time-display">
                        <span className="time-value">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
