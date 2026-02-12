import type { PetType, PetStage, Emotion, GameState } from '../types/game';

/**
 * Calculates the current emotion based on pet stats
 * Happy: All stats > 50
 * Sad: Otherwise
 */
export function getEmotion(stats: GameState['stats']): Emotion {
    const { hunger, happiness, energy } = stats;

    if (hunger > 50 && happiness > 50 && energy > 50) {
        return 'happy';
    }

    return 'sad';
}

/**
 * Calculates the current stage based on time alive
 * Egg: 0-3 minutes
 * Baby: 3-6 minutes
 * Adult: 6+ minutes
 */
export function getStage(birthTime: number, currentStage: PetStage): PetStage {
    // If already dead, stay dead
    if (currentStage === 'dead') {
        return 'dead';
    }

    const minutesAlive = (Date.now() - birthTime) / (1000 * 60);

    if (minutesAlive < 3) {
        return 'egg';
    } else if (minutesAlive < 6) {
        return 'baby';
    } else {
        return 'adult';
    }
}

/**
 * Resolves the sprite path based on pet type, stage, and emotion
 * Pattern: /assets/{type}-{stage}-{emotion}.png
 * Dead state: /assets/{type}-dead.png
 */
export function getSpriteUrl(
    type: PetType,
    stage: PetStage,
    emotion: Emotion
): string {
    if (stage === 'dead') {
        return `/assets/${type}-dead.png`;
    }

    return `/assets/${type}-${stage}-${emotion}.png`;
}
