"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import type { users } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { type GiftSearchInput, giftSearchInputSchema } from "@/schemas/gifts";

type GiftSearchForm = GiftSearchInput;

type User = typeof users.$inferSelect;

type GiftSearchFormProps = {
	user: User;
	gameId: string;
	priceLimit: string | null;
	onSubmit: (data: GiftSearchForm) => void;
	isSubmitting?: boolean;
};

export function GiftSearchForm({
	user,
	gameId,
	priceLimit,
	onSubmit,
	isSubmitting = false,
}: GiftSearchFormProps) {
	const idPrefix = useId();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<GiftSearchForm>({
		resolver: zodResolver(giftSearchInputSchema),
		defaultValues: {
			query: "",
			gameId,
			priceLimit: priceLimit ?? null,
		},
	});

	return (
		<div className="w-full max-w-4xl space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-2xl font-semibold">
					You&apos;re getting a gift for {user.name}!
				</h1>

				{user.giftPreferences && user.giftPreferences.length > 0 && (
					<div className="space-y-2">
						<p className="text-muted-foreground">
							Here are some things they said they like:
						</p>
						<ul className="flex flex-wrap gap-2 justify-center">
							{user.giftPreferences.map((preference, index) => (
								<li
									key={index}
									className="px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-zinc-800 text-sm text-neutral-800 dark:text-neutral-200"
								>
									{preference}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<input type="hidden" {...register("gameId")} />
				<input type="hidden" {...register("priceLimit")} />
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-gift-search`}>
						Write some more about this person to find more personalized gifts.
					</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-gift-search`}
							type="text"
							placeholder="Interests, hobbies, favorite things not already listed…"
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.query && "border-destructive",
							)}
							disabled={isSubmitting}
							{...register("query")}
						/>
						{errors.query && (
							<p className="text-sm text-destructive mt-1">
								{errors.query.message}
							</p>
						)}
					</FieldContent>
				</Field>

				<div className="flex justify-center mt-8">
					<Button
						type="submit"
						disabled={isSubmitting}
						size="lg"
						className="hover:shadow-lg"
					>
						{isSubmitting ? "Searching…" : "Search for gifts"}
					</Button>
				</div>
			</form>
		</div>
	);
}

