import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { GameState, PetType, PetStage, EvaluationResult } from '../types/game';
import { getStage } from '../utils/spriteResolver';
import { db } from '../services/supabase';
import { regenmonHubApi } from '../services/regenmonHubApi';

// const STORAGE_KEY = 'elemon_game_state'; // Removed
const DECAY_INTERVAL = 10000; // 10 seconds
const SYNC_INTERVAL = 5 * 1000; // 5 seconds (detect feed/gift from others)
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
    public: false,
    regenmonId: null,
    isRegisteredInHub: false,
    totalPoints: 0,
    trainingHistory: [],
    totalTrainings: 0,
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
                        public: pet.public ?? false,
                        regenmonId: pet.regenmon_id ?? null,
                        isRegisteredInHub: pet.is_registered_hub ?? false,
                        totalPoints: pet.total_points ?? 0,
                        trainingHistory: pet.training_history ?? [],
                        totalTrainings: pet.total_trainings ?? 0,
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

        // Attempt to register in the Hub
        try {
            const hubResponse = await regenmonHubApi.register(newState);
            if (hubResponse.success) {
                newState.regenmonId = hubResponse.data.id;
                newState.isRegisteredInHub = true;
                newState.coins = hubResponse.data.balance ?? 0;          // 💰 balance del Hub
                newState.totalPoints = hubResponse.data.totalPoints ?? 0; // 🍇 puntos del Hub
            }
        } catch (error) {
            console.error('Failed to register with Hub at start:', error);
            // proceed even if hub fails, we can retry later or just play local mode
        }

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

    // Update coins from external source (e.g., feed/gift responses)
    const updateCoins = useCallback((newBalance: number) => {
        setGameState(prev => {
            if (!prev) return prev;
            return { ...prev, coins: newBalance };
        });
    }, []);

    // Toggle public profile status
    const togglePublic = useCallback(async () => {
        if (!user?.id) return;

        setGameState((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                public: !prev.public
            };
        });

        // We can rely on the debounced save, or save immediately to be sure
        // Let's rely on the debounced save for consistency with other state, 
        // but if we needed immediate feedback we could call db.updatePetPublicStatus here.
    }, [user?.id]);

    // Perform game actions (eat, play, train)
    const performAction = useCallback(async (action: 'eat' | 'play' | 'train') => {
        if (!gameState) return;

        let newStats = { ...gameState.stats };
        let newTrainingHistory = [...gameState.trainingHistory];
        let newTotalTrainings = gameState.totalTrainings;

        // Stat changes only — no coin earn/spend
        if (action === 'eat') {
            newStats.hunger = Math.min(100, newStats.hunger + 20);
        } else if (action === 'play') {
            newStats.happiness = Math.min(100, newStats.happiness + 20);
        } else if (action === 'train') {
            newStats.energy = Math.min(100, newStats.energy + 20);
            newStats.hunger = Math.max(0, newStats.hunger - 1);
            newTotalTrainings += 1;
            newTrainingHistory.push(Date.now()); // 🕐 timestamp only on train
        }

        const deathTimer = (newStats.hunger > 0 && newStats.happiness > 0 && newStats.energy > 0) ? null : gameState.deathTimer;

        let updatedState = {
            ...gameState,
            stats: newStats,
            totalTrainings: newTotalTrainings,
            trainingHistory: newTrainingHistory,
            deathTimer: deathTimer,
            lastUpdate: Date.now(),
        };

        // Always sync with Hub on every action
        if (gameState.regenmonId) {
            try {
                const hubResponse = await regenmonHubApi.sync(gameState.regenmonId, updatedState);
                if (hubResponse.success) {
                    updatedState.coins = hubResponse.data.balance ?? updatedState.coins;          // 💰
                    updatedState.totalPoints = hubResponse.data.totalPoints ?? updatedState.totalPoints; // 🍇
                }
            } catch (error) {
                console.error("Failed to sync:", error);
                // Game continues normally even if sync fails
            }
        }

        setGameState(updatedState);
    }, [gameState]);

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

    // Passive Sync Effect (runs every 5 minutes)
    useEffect(() => {
        if (!gameState?.regenmonId) return;

        const syncInterval = setInterval(async () => {
            try {
                const hubResponse = await regenmonHubApi.sync(gameState.regenmonId!, gameState);
                if (hubResponse.success) {
                    setGameState(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            totalPoints: hubResponse.data.totalPoints,
                            coins: hubResponse.data.balance ?? prev.coins,
                        };
                    });
                }
            } catch (error) {
                console.error("Failed passive hub sync:", error);
            }
        }, SYNC_INTERVAL);

        return () => clearInterval(syncInterval);
    }, [gameState?.regenmonId, gameState?.stats, gameState?.totalPoints, gameState?.trainingHistory]);

    // Handle evaluation results
    const handleEvaluation = useCallback(async (result: EvaluationResult) => {
        if (!gameState) return;

        // Calculate stat change based on score
        let statChange = 0;
        if (result.score < 50) statChange = -5;
        else if (result.score >= 60) statChange = 10;
        // score 50-59 = no change

        const newStats = {
            hunger: Math.max(0, Math.min(100, gameState.stats.hunger + statChange)),
            happiness: Math.max(0, Math.min(100, gameState.stats.happiness + statChange)),
            energy: Math.max(0, Math.min(100, gameState.stats.energy + statChange)),
        };

        // evaluationCoins counter tracks gains for auto-evolution
        const newEvalCoins = gameState.evaluationCoins + Math.max(0, statChange);

        // Auto-evolution if 50 evaluation points accumulated
        let newStage = gameState.stage;
        let finalEvalCoins = newEvalCoins;

        if (newEvalCoins >= 50 && gameState.stage !== 'adult' && gameState.stage !== 'dead') {
            if (gameState.stage === 'egg') newStage = 'baby';
            else if (gameState.stage === 'baby') newStage = 'adult';
            finalEvalCoins = 0;
        }

        let updatedState: GameState = {
            ...gameState,
            stats: newStats,
            evaluationCoins: finalEvalCoins,
            stage: newStage,
            lastUpdate: Date.now(),
        };

        // Sync with Hub (same as eat/play/train actions)
        if (gameState.regenmonId) {
            try {
                const hubResponse = await regenmonHubApi.sync(gameState.regenmonId, updatedState);
                if (hubResponse.success) {
                    updatedState.coins = hubResponse.data.balance ?? updatedState.coins;
                    updatedState.totalPoints = hubResponse.data.totalPoints ?? updatedState.totalPoints;
                }
            } catch (error) {
                console.error("Failed to sync after evaluation:", error);
            }
        }

        setGameState(updatedState);
    }, [gameState]);

    return {
        gameState,
        startGame,
        resetGame,
        togglePublic,
        performAction,
        handleEvaluation,
        updateCoins,
        isLoading,
    };
}

