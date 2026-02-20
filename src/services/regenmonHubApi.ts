import type { GameState } from '../types/game';

const API_BASE_URL = 'https://regenmon-final.vercel.app/api';

export interface HubRegisterResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        name: string;
        appUrl: string;
        balance: number;
        totalPoints: number;
        registeredAt: string;
        alreadyRegistered?: boolean;
    }
}

export interface HubSyncResponse {
    success: boolean;
    data: {
        totalPoints: number;
        balance: number;
    }
}

export interface HubLeaderboardItem {
    rank: number;
    id: string;
    name: string;
    ownerName: string | null;
    sprite: string;
    stage: number;
    totalPoints: number;
    balance: number;
    registeredAt: string;
    lastSynced: string;
}

export interface HubLeaderboardResponse {
    success: boolean;
    message?: string;
    data: HubLeaderboardItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface HubProfileResponse {
    success: boolean;
    data: {
        id: string;
        name: string;
        ownerName: string | null;
        sprite: string;
        appUrl: string;
        totalPoints: number;
        balance: number;
        stats: {
            happiness: number;
            energy: number;
            hunger: number;
        };
        registeredAt: string;
        lastSynced: string;
        visits: number;
    }
}

export interface HubInteractionResponse {
    success: boolean;
    message: string;
    data?: {
        message?: string;
        senderBalance?: number;
        targetName?: string;
        cost?: number;
        amount?: number;
    };
}

export interface HubMessage {
    id: string;
    fromRegenmonId: string;
    fromName: string;
    message: string;
    createdAt: string;
}

export interface HubMessagesResponse {
    success: boolean;
    data: {
        messages: HubMessage[];
        total: number;
    };
}

export const regenmonHubApi = {
    async register(gameState: GameState, ownerName: string = 'elemon_user'): Promise<HubRegisterResponse> {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: gameState.petName,
                    ownerName: ownerName,
                    appUrl: appUrl,
                    sprite: `${appUrl}/assets/${gameState.petType}-adult_happy.png`
                }),
            });

            if (!response.ok) {
                throw new Error(`Hub Registration failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error calling Regenmon Hub /register:", error);
            throw error;
        }
    },

    async sync(regenmonId: string, gameState: GameState): Promise<HubSyncResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    regenmonId: regenmonId,
                    stats: {
                        happiness: gameState.stats.happiness,
                        energy: gameState.stats.energy,
                        hunger: gameState.stats.hunger
                    },
                    totalPoints: gameState.totalPoints,
                    trainingHistory: gameState.trainingHistory
                }),
            });

            if (!response.ok) {
                // Return gracefully if sync fails so it doesn't break the game, just doesn't update points
                console.error(`Hub Sync failed: ${response.status} ${response.statusText}`);
                throw new Error("Sync Failed");
            }

            return await response.json();
        } catch (error) {
            console.error("Error calling Regenmon Hub /sync:", error);
            throw error;
        }
    },

    async getLeaderboard(page: number = 1, limit: number = 10): Promise<HubLeaderboardResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`Hub Leaderboard failed: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error calling Regenmon Hub /leaderboard:", error);
            throw error;
        }
    },

    async getRegenmonProfile(id: string): Promise<HubProfileResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/regenmon/${id}`);
            if (!response.ok) {
                throw new Error(`Hub Profile failed: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error calling Regenmon Hub /regenmon/${id}:`, error);
            throw error;
        }
    },

    async feedRegenmon(targetRegenmonId: string, senderRegenmonId?: string | null): Promise<HubInteractionResponse> {
        try {
            const body: Record<string, string> = {};
            if (senderRegenmonId) body.fromRegenmonId = senderRegenmonId;
            const response = await fetch(`${API_BASE_URL}/regenmon/${targetRegenmonId}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data?.message || `Error ${response.status}: ${response.statusText}` };
            }
            return data;
        } catch (error) {
            console.error(`Error calling /regenmon/${targetRegenmonId}/feed:`, error);
            throw error;
        }
    },

    async giftRegenmon(targetRegenmonId: string, senderRegenmonId?: string | null, amount: number = 10): Promise<HubInteractionResponse> {
        try {
            const body: Record<string, string | number> = { amount };
            if (senderRegenmonId) body.fromRegenmonId = senderRegenmonId;
            const response = await fetch(`${API_BASE_URL}/regenmon/${targetRegenmonId}/gift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data?.message || `Error ${response.status}: ${response.statusText}` };
            }
            return data;
        } catch (error) {
            console.error(`Error calling /regenmon/${targetRegenmonId}/gift:`, error);
            throw error;
        }
    },

    async sendMessage(targetRegenmonId: string, message: string, senderRegenmonId?: string | null, fromName?: string): Promise<HubInteractionResponse> {
        try {
            const body: Record<string, string> = { message };
            if (senderRegenmonId) body.fromRegenmonId = senderRegenmonId;
            if (fromName) body.fromName = fromName;
            const response = await fetch(`${API_BASE_URL}/regenmon/${targetRegenmonId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data?.message || `Error ${response.status}: ${response.statusText}` };
            }
            return data;
        } catch (error) {
            console.error(`Error calling /regenmon/${targetRegenmonId}/messages:`, error);
            throw error;
        }
    },

    async getMessages(regenmonId: string, page: number = 1, limit: number = 20): Promise<HubMessagesResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/regenmon/${regenmonId}/messages?limit=${limit}&page=${page}`);
            if (!response.ok) {
                throw new Error(`Hub Messages failed: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error calling /regenmon/${regenmonId}/messages:`, error);
            throw error;
        }
    },
};
