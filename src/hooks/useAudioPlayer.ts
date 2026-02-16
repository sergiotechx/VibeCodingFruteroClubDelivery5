import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { db } from '../services/supabase';

export function useAudioPlayer(audioUrl: string) {
    const { user } = usePrivy();
    const [isMuted, setIsMuted] = useState(false); // Default unmuted, will load from DB
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load mute preference from Supabase
    useEffect(() => {
        if (!user?.id) return;

        const loadSettings = async () => {
            try {
                const userData = await db.getUser(user.id);
                if (userData) {
                    setIsMuted(userData.is_muted);
                } else {
                    // Create user if not exists (default settings)
                    await db.createOrUpdateUser(user.id);
                }
            } catch (error) {
                console.error('Failed to load audio settings:', error);
            }
        };

        loadSettings();
    }, [user?.id]);

    // Save mute preference to Supabase
    const toggleMute = useCallback(async () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (user?.id) {
            try {
                // Ensure user exists before updating
                await db.createOrUpdateUser(user.id);
                await db.updateSettings(user.id, newMutedState);
            } catch (error) {
                console.error('Failed to save audio settings:', error);
                // Revert on failure? Maybe unnecessary for UI feeling
            }
        }
    }, [isMuted, user?.id]);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audioRef.current = audio;

        // Try to play immediately if not muted
        if (!isMuted) {
            audio.play().catch(() => {
                // Autoplay policy might block this, expected
            });
        }

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [audioUrl]); // Remove isMuted from dependency to avoid recreating audio on mute toggle

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

    return {
        isMuted,
        toggleMute,
    };
}
