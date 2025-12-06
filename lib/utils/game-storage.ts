const GAME_STORAGE_KEY = "secretSantaGameData";

export interface GameStorageData {
	basics?: {
		name: string;
		priceLimit: number;
		deadline: string;
		categories: string[];
	};
	invites?: string[];
}

export function getGameData(): GameStorageData {
	if (typeof window === "undefined") return {};

	try {
		const stored = localStorage.getItem(GAME_STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

export function saveGameData(data: Partial<GameStorageData>) {
	if (typeof window === "undefined") return;

	try {
		const current = getGameData();
		const updated = { ...current, ...data };
		localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(updated));
	} catch (error) {
		console.error("Failed to save game data:", error);
	}
}

export function clearGameData() {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem(GAME_STORAGE_KEY);
	} catch (error) {
		console.error("Failed to clear game data:", error);
	}
}
