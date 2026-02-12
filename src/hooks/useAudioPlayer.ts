import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'elemon_music_muted';

export function useAudioPlayer(audioUrl: string) {
    const [isMuted, setIsMuted] = useState(true); // Default OFF
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load mute preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            setIsMuted(saved === 'true');
        }
    }, []);

    // Save mute preference to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isMuted));
    }, [isMuted]);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [audioUrl]);

    // Control playback based on mute state
    useEffect(() => {
        if (!audioRef.current) return;

        if (isMuted) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch((error: unknown) => {
                console.error('Failed to play audio:', error);
            });
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
    }, []);

    return {
        isMuted,
        toggleMute,
    };
}
