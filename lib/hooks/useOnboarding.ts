"use client";

import { useMutation } from "@tanstack/react-query";
import { saveOnboardingData } from "@/lib/utils/storage";

interface BasicsData {
	birthday: Date;
	name: string;
	location: string;
}

interface LikesData {
	favoriteColor: string;
	favoriteHobby: string;
	favoriteGift: string;
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

async function submitLikes(data: LikesData) {
	const response = await fetch("/api/onboarding/likes", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to submit likes");
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

export function useSubmitLikes() {
	return useMutation({
		mutationFn: submitLikes,
		onSuccess: (_response, variables) => {
			saveOnboardingData({
				likes: {
					1: variables.favoriteColor,
					2: variables.favoriteHobby,
					3: variables.favoriteGift,
				},
			});
		},
	});
}
