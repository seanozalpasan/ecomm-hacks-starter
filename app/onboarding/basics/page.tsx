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
import { useSubmitBasics } from "@/lib/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { getOnboardingData } from "@/lib/utils/storage";
import { basicsInputSchema } from "@/schemas/onboarding/basics";

const basicsSchema = basicsInputSchema;

type BasicsFormData = z.infer<typeof basicsSchema>;

export default function BasicsPage() {
	const router = useRouter();
	const { mutate: submitBasics, isPending } = useSubmitBasics();
	const idPrefix = useId();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<BasicsFormData>({
		resolver: zodResolver(basicsSchema),
		defaultValues: {
			birthday: undefined,
			name: "",
			location: "",
		},
	});

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getOnboardingData();
		if (saved.basics) {
			if (saved.basics.birthday) {
				setValue("birthday", new Date(saved.basics.birthday));
			}
			setValue("name", saved.basics.name);
			setValue("location", saved.basics.location);
		}
	}, [setValue]);

	const onSubmit = (data: BasicsFormData) => {
		submitBasics(data, {
			onSuccess: () => {
				router.push("/onboarding/likes");
			},
		});
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Tell us about yourself
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				We need some basic information to get started.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-name`}
							type="text"
							{...register("name")}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.name && "border-destructive",
							)}
							placeholder="Enter your name"
						/>
						<FieldError errors={errors.name ? [errors.name] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-birthday`}>Birthday</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-birthday`}
							type="date"
							{...register("birthday", { valueAsDate: true })}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.birthday && "border-destructive",
							)}
							placeholder="Select your birthday"
						/>
						<FieldError errors={errors.birthday ? [errors.birthday] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-location`}>Location</FieldLabel>
					<FieldContent>
						<input
							id={`${idPrefix}-location`}
							type="text"
							{...register("location")}
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
								"placeholder:text-muted-foreground",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
								errors.location && "border-destructive",
							)}
							placeholder="Enter your location"
						/>
						<FieldError errors={errors.location ? [errors.location] : []} />
					</FieldContent>
				</Field>

				<div className="flex justify-end gap-4 pt-4">
					<button
						type="button"
						onClick={() => router.back()}
						className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? "Saving..." : "Next"}
					</button>
				</div>
			</form>
		</div>
	);
}
