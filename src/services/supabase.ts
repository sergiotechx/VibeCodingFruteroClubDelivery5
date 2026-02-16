import { createClient } from '@supabase/supabase-js';
import type { GameState, PetType, PetStage } from '../types/game';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
    id: string;
    is_muted: boolean;
    created_at: string;
}

export interface Pet {
    id: string;
    user_id: string;
    name: string;
    type: PetType;
    stage: PetStage;
    hunger: number;
    happiness: number;
    energy: number;
    coins: number;
    birth_time: number;
    last_update: number;
    death_timer: number | null;
    happy_time_accumulated: number;
}

export const db = {
    async getUser(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*, pets(*)')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error;
        }

        return data as (User & { pets: Pet | null }) | null;
    },

    async createOrUpdateUser(userId: string) {
        const { error } = await supabase
            .from('users')
            .upsert({ id: userId }, { onConflict: 'id' });

        if (error) throw error;
    },

    async updateSettings(userId: string, isMuted: boolean) {
        const { error } = await supabase
            .from('users')
            .update({ is_muted: isMuted })
            .eq('id', userId);

        if (error) throw error;
    },

    async savePetState(userId: string, gameState: GameState) {
        // First ensure user exists (although getUser check usually happens first)

        const petData = {
            user_id: userId,
            name: gameState.petName,
            type: gameState.petType,
            stage: gameState.stage,
            hunger: gameState.stats.hunger,
            happiness: gameState.stats.happiness,
            energy: gameState.stats.energy,
            coins: gameState.coins,
            birth_time: gameState.birthTime,
            last_update: gameState.lastUpdate,
            death_timer: gameState.deathTimer,
            happy_time_accumulated: gameState.happyTimeAccumulated,
        };

        const { error } = await supabase
            .from('pets')
            .upsert(petData, { onConflict: 'user_id' });

        if (error) throw error;
    },

    async deletePet(userId: string) {
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }
};
