"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
	type GiftSearchInput,
	giftSearchInputSchema,
} from "@/schemas/gifts/search";
import { searchGifts } from "@/services/gifts/search";

type GiftSearchForm = GiftSearchInput;

export function GiftSearchClient() {
	const idPrefix = useId();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<GiftSearchForm>({
		resolver: zodResolver(giftSearchInputSchema),
		defaultValues: { query: "" },
	});

	const onSubmit = async (data: GiftSearchForm) => {
		const result = await searchGifts(data);
		console.log("Search query:", result.data.query, "results:", result.results);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl">
			<Field>
				<FieldLabel htmlFor={`${idPrefix}-gift-search`}>
					What are you looking to give your friend?
				</FieldLabel>
				<FieldContent>
					<input
						id={`${idPrefix}-gift-search`}
						type="text"
						placeholder="e.g., birthday gift, anniversary present..."
						className={cn(
							"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
							"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
							"placeholder:text-muted-foreground",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-50",
							errors.query && "border-destructive",
						)}
						{...register("query")}
					/>
					{errors.query && (
						<p className="text-sm text-destructive mt-1">
							{errors.query.message}
						</p>
					)}
				</FieldContent>
			</Field>
		</form>
	);
}
