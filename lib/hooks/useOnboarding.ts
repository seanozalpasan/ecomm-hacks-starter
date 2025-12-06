"use client";

import { useMutation } from "@tanstack/react-query";
import { saveOnboardingData } from "@/lib/utils/storage";

interface BasicsData {
  age: number;
  name: string;
  location: string;
}

interface LikesData {
  step: number;
  answer: string;
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
    onSuccess: (response, variables) => {
      saveOnboardingData({
        basics: variables,
      });
    },
  });
}

export function useSubmitLikes() {
  return useMutation({
    mutationFn: submitLikes,
    onSuccess: (response, variables) => {
      saveOnboardingData({
        likes: {
          [variables.step]: variables.answer,
        },
      });
    },
  });
}

