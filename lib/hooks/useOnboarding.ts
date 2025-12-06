"use client";

import { useMutation } from "@tanstack/react-query";
import { getOnboardingData, saveOnboardingData } from "@/lib/utils/storage";

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
	const likesResponse = await fetch("/api/onboarding/likes", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!likesResponse.ok) {
		const error = await likesResponse.json();
		throw new Error(error.error || "Failed to submit likes");
	}

	const saved = getOnboardingData();
	if (!saved.basics) {
		throw new Error(
			"Basics step missing. Please complete basics before likes.",
		);
	}

	const completeResponse = await fetch("/api/onboarding/complete", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			basics: saved.basics,
			likes: data,
		}),
	});

	if (!completeResponse.ok) {
		const error = await completeResponse.json();
		throw new Error(error.error || "Failed to complete onboarding");
	}

	return completeResponse.json();
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
