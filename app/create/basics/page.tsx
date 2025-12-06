"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { getGameData, saveGameData } from "@/lib/utils/game-storage";
import { gameBasicsSchema } from "@/schemas/games/create";

type GameBasicsFormData = z.infer<typeof gameBasicsSchema>;

export default function CreateGameBasicsPage() {
	const router = useRouter();
	const idPrefix = useId();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<GameBasicsFormData>({
		resolver: zodResolver(gameBasicsSchema),
		defaultValues: {
			priceLimit: 50,
			deadline: undefined,
			categories: [],
		},
	});

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getGameData();
		if (saved.basics) {
			setValue("priceLimit", saved.basics.priceLimit);
			if (saved.basics.deadline) {
				setValue("deadline", new Date(saved.basics.deadline));
			}
			setValue("categories", saved.basics.categories || []);
		}
	}, [setValue]);

	const onSubmit = (data: GameBasicsFormData) => {
		saveGameData({
			basics: {
				...data,
				deadline: data.deadline.toISOString(),
			},
		});
		router.push("/create/invites");
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Create Secret Santa Game
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Set up the details for your gift exchange.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-priceLimit`}>
						Price Limit ($)
					</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-priceLimit`}
							type="number"
							step="0.01"
							{...register("priceLimit", { valueAsNumber: true })}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.priceLimit && "border-destructive",
							)}
							placeholder="50"
						/>
						<FieldError
							errors={errors.priceLimit ? [errors.priceLimit] : []}
						/>
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-deadline`}>
						Gift Exchange Deadline
					</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-deadline`}
							type="date"
							{...register("deadline", { valueAsDate: true })}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.deadline && "border-destructive",
							)}
						/>
						<FieldError errors={errors.deadline ? [errors.deadline] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-categories`}>
						Gift Categories (Optional)
					</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-categories`}
							type="text"
							placeholder="e.g., Books, Tech, Home Decor (comma-separated)"
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
							)}
							onChange={(e) => {
								const value = e.target.value;
								const categories = value
									? value.split(",").map((cat) => cat.trim())
									: [];
								setValue("categories", categories);
							}}
						/>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
							Separate categories with commas
						</p>
					</FieldContent>
				</Field>

				<div className="flex justify-end gap-4 pt-4">
					<button
						type="button"
						onClick={() => router.push("/")}
						className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
					>
						Next
					</button>
				</div>
			</form>
		</div>
	);
}
