"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { useSubmitLikes } from "@/lib/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { getOnboardingData } from "@/lib/utils/storage";
import { likesInputSchema } from "@/schemas/onboarding/likes";

type LikesFormData = typeof likesInputSchema._type;

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

	const onSubmit = (data: LikesFormData) => {
		submitLikes(
			{
				favoriteColor: data.favoriteColor,
				favoriteHobby: data.favoriteHobby,
				favoriteGift: data.favoriteGift,
			},
			{
				onSuccess: () => {
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
						<input
							id={`${idPrefix}-favoriteColor`}
							type="text"
							{...register("favoriteColor")}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.favoriteColor && "border-destructive",
							)}
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
						<textarea
							id={`${idPrefix}-favoriteHobby`}
							{...register("favoriteHobby")}
							rows={4}
							className={cn(
								"flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50 resize-none",
								errors.favoriteHobby && "border-destructive",
							)}
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
						<textarea
							id={`${idPrefix}-favoriteGift`}
							{...register("favoriteGift")}
							rows={4}
							className={cn(
								"flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50 resize-none",
								errors.favoriteGift && "border-destructive",
							)}
							placeholder="Describe your ideal gift"
						/>
						<FieldError
							errors={errors.favoriteGift ? [errors.favoriteGift] : []}
						/>
					</FieldContent>
				</Field>

				<div className="flex justify-between gap-4 pt-4">
					<button
						type="button"
						onClick={() => router.push("/onboarding/basics")}
						className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? "Saving..." : "Complete"}
					</button>
				</div>
			</form>
		</div>
	);
}
