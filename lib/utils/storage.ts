const STORAGE_KEY = "onboarding_data";

export interface OnboardingData {
	basics?: {
		birthday: string;
		name: string;
		location: string;
	};
	likes?: {
		[step: number]: string;
	};
}

export function getOnboardingData(): OnboardingData {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : {};
	} catch {
		return {};
	}
}

export function saveOnboardingData(data: Partial<OnboardingData>): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const existing = getOnboardingData();
		const updated = {
			...existing,
			...data,
			likes: {
				...(existing.likes || {}),
				...(data.likes || {}),
			},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	} catch (error) {
		console.error("Failed to save onboarding data:", error);
	}
}

export function clearOnboardingData(): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error("Failed to clear onboarding data:", error);
	}
}
