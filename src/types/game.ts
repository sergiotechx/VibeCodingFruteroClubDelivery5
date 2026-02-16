export type PetType = 'fire' | 'water' | 'earth' | 'air';
export type PetStage = 'egg' | 'baby' | 'adult' | 'dead';
export type Emotion = 'happy' | 'sad';

export interface GameState {
    petName: string;
    petType: PetType;
    stage: PetStage;
    stats: {
        hunger: number;
        happiness: number;
        energy: number;
    };
    birthTime: number; // timestamp when pet was created
    lastUpdate: number; // timestamp of last stat update
    deathTimer: number | null; // timestamp when a stat first reached 0
    happyTimeAccumulated: number; // total milliseconds spent happy since birth
    coins: number;
}

export interface CharacterOption {
    type: PetType;
    name: string;
    emoji: string;
}
