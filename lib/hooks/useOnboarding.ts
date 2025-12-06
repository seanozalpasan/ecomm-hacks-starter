"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveOnboardingData } from "@/lib/utils/storage";

interface BasicsData {
	birthday: Date;
	name: string;
	location: string;
}

interface CompleteOnboardingData {
	basics: {
		birthday: string;
		name: string;
		location: string;
	};
	interests: string[];
}

async function submitBasics(data: BasicsData) {
	const response = await fetch("/api/onboarding/basics", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to submit basics");
	}

	return response.json();
}

async function completeOnboarding(data: CompleteOnboardingData) {
	const response = await fetch("/api/onboarding/complete", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to complete onboarding");
	}

	return response.json();
}

export function useSubmitBasics() {
	return useMutation({
		mutationFn: submitBasics,
		onSuccess: (_response, variables) => {
			saveOnboardingData({
				basics: {
					...variables,
					birthday: variables.birthday.toISOString(),
				},
			});
		},
	});
}

export function useCompleteOnboarding() {
	return useMutation({
		mutationFn: completeOnboarding,
		onSuccess: () => {
			// Clear onboarding data from localStorage
			localStorage.removeItem("onboarding");
			toast.success("Onboarding completed!", {
				description: "Your profile has been created successfully.",
			});
		},
		onError: (error) => {
			toast.error("Failed to complete onboarding", {
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		},
	});
}
