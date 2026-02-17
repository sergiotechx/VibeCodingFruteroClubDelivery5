import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { GameState, PetType, PetStage, EvaluationResult } from '../types/game';
import { getStage } from '../utils/spriteResolver';
import { db } from '../services/supabase';

// const STORAGE_KEY = 'elemon_game_state'; // Removed
const DECAY_INTERVAL = 10000; // 10 seconds
const DEATH_THRESHOLD = 60000; // 60 seconds at 0

const INITIAL_STATE: Omit<GameState, 'petName' | 'petType'> = {
    stage: 'egg',
    stats: {
        hunger: 100,
        happiness: 100,
        energy: 100,
    },
    coins: 100,
    birthTime: Date.now(),
    lastUpdate: Date.now(),
    deathTimer: null,
    happyTimeAccumulated: 0,
    evaluationCoins: 0,
};

export function useGameState() {
    const { user } = usePrivy();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load state from Supabase on mount/auth
    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        const loadGame = async () => {
            try {
                setIsLoading(true);
                const userData = await db.getUser(user.id);

                if (userData?.pets) {
                    const pet = userData.pets;
                    // Map DB pet to GameState
                    const loadedState: GameState = {
                        petName: pet.name,
                        petType: pet.type,
                        stage: pet.stage,
                        stats: {
                            hunger: pet.hunger,
                            happiness: pet.happiness,
                            energy: pet.energy,
                        },
                        coins: pet.coins ?? 100, // Default to 100 if null (legacy)
                        birthTime: Number(pet.birth_time),
                        lastUpdate: Number(pet.last_update),
                        deathTimer: pet.death_timer ? Number(pet.death_timer) : null,
                        happyTimeAccumulated: Number(pet.happy_time_accumulated),
                        evaluationCoins: pet.evaluation_coins ?? 0,
                    };
                    setGameState(loadedState);
                } else if (!userData) {
                    // Create user row if missing
                    await db.createOrUpdateUser(user.id);
                }
            } catch (error) {
                console.error('Failed to load game state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadGame();
    }, [user?.id]);

    // Save state to Supabase whenever it changes (debounced)
    useEffect(() => {
        if (!gameState || !user?.id) return;

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout (debounce 2s to catch rapid clicks, but logic updates every 10s anyway)
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await db.savePetState(user.id, gameState);
            } catch (error) {
                console.error('Failed to auto-save game state:', error);
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [gameState, user?.id]);

    // Initialize new game
    const startGame = useCallback(async (petName: string, petType: PetType) => {
        if (!user?.id) return;

        const newState: GameState = {
            petName,
            petType,
            ...INITIAL_STATE,
            birthTime: Date.now(),
            lastUpdate: Date.now(),
            happyTimeAccumulated: 0,
        };

        setGameState(newState);

        // Save immediately
        try {
            await db.createOrUpdateUser(user.id); // Ensure user exists
            await db.savePetState(user.id, newState);
        } catch (error) {
            console.error('Failed to save new game:', error);
        }
    }, [user?.id]);

    // Reset game (clear Supabase and state)
    const resetGame = useCallback(async () => {
        if (!user?.id) return;

        try {
            await db.deletePet(user.id);
            setGameState(null);
        } catch (error) {
            console.error('Failed to reset game:', error);
        }
    }, [user?.id]);

    // Perform game actions (eat, play, train)
    const performAction = useCallback((action: 'eat' | 'play' | 'train') => {
        setGameState((prev) => {
            if (!prev) return prev;

            let newStats = { ...prev.stats };
            let newCoins = prev.coins;

            if (action === 'eat') {
                if (newCoins < 10) return prev; // Cannot eat if insufficient coins
                newCoins -= 10;
                newStats.hunger = Math.min(100, newStats.hunger + 20);
            } else if (action === 'play') {
                newCoins += 5;
                newStats.happiness = Math.min(100, newStats.happiness + 20);
            } else if (action === 'train') {
                newCoins += 6;
                newStats.energy = Math.min(100, newStats.energy + 20);
                newStats.hunger = Math.max(0, newStats.hunger - 1); // "resta un punto de hunger"
            }

            return {
                ...prev,
                stats: newStats,
                coins: newCoins,
                lastUpdate: Date.now(),
                // Reset death timer if relevant stat goes above 0 (simplified logic, decay handles this mostly)
                deathTimer: (newStats.hunger > 0 && newStats.happiness > 0 && newStats.energy > 0) ? null : prev.deathTimer,
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

    // Handle evaluation results
    const handleEvaluation = useCallback((result: EvaluationResult) => {
        setGameState((prev) => {
            if (!prev) return prev;

            // Calculate coin change based on score
            let coinChange = 0;
            if (result.score < 50) coinChange = -3;
            else if (result.score >= 60) coinChange = 10;
            // score 50-59 = 0 coins (no change)

            // IMPORTANT: Coins are added/subtracted from the main coins field
            const newCoins = Math.max(0, prev.coins + coinChange);

            // evaluation_coins counter only tracks GAINS (not losses)
            const newEvalCoins = prev.evaluationCoins + Math.max(0, coinChange);

            // Auto-evolution if 50 evaluation coins accumulated
            let newStage = prev.stage;
            let finalEvalCoins = newEvalCoins;
            let finalCoins = newCoins;

            if (newEvalCoins >= 50 && prev.stage !== 'adult' && prev.stage !== 'dead') {
                // Force evolution
                if (prev.stage === 'egg') newStage = 'baby';
                else if (prev.stage === 'baby') newStage = 'adult';

                // Deduct 50 coins from main balance as "training cost"
                finalCoins = Math.max(0, newCoins - 50);

                // Reset evaluation counter
                finalEvalCoins = 0;
            }

            return {
                ...prev,
                coins: finalCoins,              // Visible field in UI
                evaluationCoins: finalEvalCoins, // Internal counter
                stage: newStage,
                lastUpdate: Date.now()
            };
        });
    }, []);

    return {
        gameState,
        startGame,
        resetGame,
        performAction,
        handleEvaluation,
        isLoading,
    };
}

