import { useState, useEffect, useCallback } from 'react';
import type { GameState, PetType, PetStage } from '../types/game';
import { getStage } from '../utils/spriteResolver';

const STORAGE_KEY = 'elemon_game_state';
const DECAY_INTERVAL = 10000; // 10 seconds
const DEATH_THRESHOLD = 60000; // 60 seconds at 0

const INITIAL_STATE: Omit<GameState, 'petName' | 'petType'> = {
    stage: 'egg',
    stats: {
        hunger: 100,
        happiness: 100,
        energy: 100,
    },
    birthTime: Date.now(),
    lastUpdate: Date.now(),
    deathTimer: null,
    happyTimeAccumulated: 0,
};

export function useGameState() {
    const [gameState, setGameState] = useState<GameState | null>(null);

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as GameState;
                setGameState(parsed);
            } catch (error: unknown) {
                console.error('Failed to load game state:', error);
            }
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (gameState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        }
    }, [gameState]);

    // Initialize new game
    const startGame = useCallback((petName: string, petType: PetType) => {
        const newState: GameState = {
            petName,
            petType,
            ...INITIAL_STATE,
            birthTime: Date.now(),
            lastUpdate: Date.now(),
            happyTimeAccumulated: 0,
        };
        setGameState(newState);
    }, []);

    // Reset game (clear localStorage and state)
    const resetGame = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setGameState(null);
    }, []);

    // Increase a specific stat by amount (max 100)
    const increaseStat = useCallback((stat: 'hunger' | 'happiness' | 'energy', amount: number) => {
        setGameState((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                stats: {
                    ...prev.stats,
                    [stat]: Math.min(100, prev.stats[stat] + amount),
                },
                lastUpdate: Date.now(),
                // Reset death timer if stat goes above 0
                deathTimer: prev.stats[stat] + amount > 0 ? null : prev.deathTimer,
            };
        });
    }, []);

    // Stat decay and death detection
    useEffect(() => {
        if (!gameState || gameState.stage === 'dead') return;

        const interval = setInterval(() => {
            setGameState((prev) => {
                if (!prev || prev.stage === 'dead') return prev;

                const now = Date.now();
                const timeSinceLastUpdate = now - prev.lastUpdate;

                // Check if pet is currently happy (all stats > 50)
                const isHappy = prev.stats.hunger > 50 && prev.stats.happiness > 50 && prev.stats.energy > 50;

                // Accumulate happy time if currently happy
                const newHappyTimeAccumulated = isHappy
                    ? prev.happyTimeAccumulated + timeSinceLastUpdate
                    : prev.happyTimeAccumulated;

                // Randomly select a stat to decay
                const stats = ['hunger', 'happiness', 'energy'] as const;
                const randomStat = stats[Math.floor(Math.random() * stats.length)];

                const newStats = {
                    ...prev.stats,
                    [randomStat]: Math.max(0, prev.stats[randomStat] - 5),
                };

                // Check if any stat is at 0
                const hasZeroStat = Object.values(newStats).some(val => val === 0);

                let newDeathTimer = prev.deathTimer;
                let newStage: PetStage = prev.stage;

                if (hasZeroStat) {
                    // Start death timer if not already started
                    if (newDeathTimer === null) {
                        newDeathTimer = Date.now();
                    } else {
                        // Check if 60 seconds have passed
                        if (Date.now() - newDeathTimer >= DEATH_THRESHOLD) {
                            newStage = 'dead';
                        }
                    }
                } else {
                    // Reset death timer if all stats are above 0
                    newDeathTimer = null;
                }

                // Update stage based on time alive (if not dead)
                if (newStage !== 'dead') {
                    newStage = getStage(prev.birthTime, prev.stage);
                }

                return {
                    ...prev,
                    stats: newStats,
                    stage: newStage,
                    deathTimer: newDeathTimer,
                    lastUpdate: now,
                    happyTimeAccumulated: newHappyTimeAccumulated,
                };
            });
        }, DECAY_INTERVAL);

        return () => clearInterval(interval);
    }, [gameState]);

    return {
        gameState,
        startGame,
        resetGame,
        increaseStat,
    };
}
