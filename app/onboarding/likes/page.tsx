"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import type z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitLikes } from "@/lib/hooks/useOnboarding";
import { getOnboardingData } from "@/lib/utils/storage";
import { likesInputSchema } from "@/schemas/onboarding";

type LikesFormData = z.infer<typeof likesInputSchema>;

export default function LikesPage() {
	const router = useRouter();
	const { mutate: submitLikes, isPending } = useSubmitLikes();
	const idPrefix = useId();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<LikesFormData>({
		resolver: zodResolver(likesInputSchema),
		defaultValues: {
			favoriteColor: "",
			favoriteHobby: "",
			favoriteGift: "",
		},
	});

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getOnboardingData();
		if (saved.likes) {
			if (saved.likes[1]) setValue("favoriteColor", saved.likes[1]);
			if (saved.likes[2]) setValue("favoriteHobby", saved.likes[2]);
			if (saved.likes[3]) setValue("favoriteGift", saved.likes[3]);
		}
	}, [setValue]);

	const onSubmit = async (data: LikesFormData) => {
		submitLikes(
			{
				favoriteColor: data.favoriteColor,
				favoriteHobby: data.favoriteHobby,
				favoriteGift: data.favoriteGift,
			},
			{
				onSuccess: async () => {
					// Check if there's a pending invite to accept
					const pendingInviteId = localStorage.getItem("pendingInviteAccept");
					if (pendingInviteId) {
						try {
							// Accept the invite
							const response = await fetch("/api/games/invite/respond", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									inviteId: pendingInviteId,
									action: "accept",
								}),
							});
							localStorage.removeItem("pendingInviteAccept");

							if (response.ok) {
								const result = await response.json();
								if (result.data?.gameId) {
									toast.success("Invitation accepted!", {
										description: "Redirecting to your game...",
									});
									router.push(`/games/${result.data.gameId}`);
									return;
								}
							} else {
								const error = await response.json();
								toast.error("Failed to accept invitation", {
									description: error.error || "Please try again later",
								});
							}
						} catch (error) {
							console.error("Failed to auto-accept invite:", error);
							toast.error("Failed to accept invitation", {
								description:
									error instanceof Error
										? error.message
										: "Please try again later",
							});
						}
					}
					router.push("/");
				},
			},
		);
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Tell us what you like
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Help us understand your preferences
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-favoriteColor`}>
						What's your favorite color?
					</FieldLabel>
					<FieldContent>
						<Input
							id={`${idPrefix}-favoriteColor`}
							type="text"
							{...register("favoriteColor")}
							aria-invalid={errors.favoriteColor ? "true" : undefined}
							placeholder="Enter your favorite color"
						/>
						<FieldError
							errors={errors.favoriteColor ? [errors.favoriteColor] : []}
						/>
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-favoriteHobby`}>
						What's your favorite hobby or activity?
					</FieldLabel>
					<FieldContent>
						<Textarea
							id={`${idPrefix}-favoriteHobby`}
							{...register("favoriteHobby")}
							rows={4}
							aria-invalid={errors.favoriteHobby ? "true" : undefined}
							placeholder="Tell us about your favorite hobby or activity"
						/>
						<FieldError
							errors={errors.favoriteHobby ? [errors.favoriteHobby] : []}
						/>
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-favoriteGift`}>
						What's your favorite type of gift to receive?
					</FieldLabel>
					<FieldContent>
						<Textarea
							id={`${idPrefix}-favoriteGift`}
							{...register("favoriteGift")}
							rows={4}
							aria-invalid={errors.favoriteGift ? "true" : undefined}
							placeholder="Describe your ideal gift"
						/>
						<FieldError
							errors={errors.favoriteGift ? [errors.favoriteGift] : []}
						/>
					</FieldContent>
				</Field>

				<div className="flex justify-between gap-4 pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={() => router.push("/onboarding/basics")}
					>
						Back
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Saving..." : "Complete"}
					</Button>
				</div>
			</form>
		</div>
	);
}
