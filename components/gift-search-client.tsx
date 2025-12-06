"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { ChristmasLoadingSkeleton } from "@/components/christmas-loading-skeleton";
import { ProductButton } from "@/components/product-button";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { type ProductResult, searchGifts } from "@/lib/api/searchGifts";
import type { users } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { type GiftSearchInput, giftSearchInputSchema } from "@/schemas/gifts";

type GiftSearchForm = GiftSearchInput;

type User = typeof users.$inferSelect;

type GiftSearchClientProps = {
	user: User;
	gameId: string;
	priceLimit: string | null;
};

export function GiftSearchClient({
	user,
	gameId,
	priceLimit,
}: GiftSearchClientProps) {
	const idPrefix = useId();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [products, setProducts] = useState<ProductResult[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [lastQuery, setLastQuery] = useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
	} = useForm<GiftSearchForm>({
		resolver: zodResolver(giftSearchInputSchema),
		defaultValues: {
			query: "",
			gameId,
			priceLimit: priceLimit ?? null,
		},
	});

	const performSearch = async (query: string) => {
		const data: GiftSearchInput = {
			query,
			gameId,
			priceLimit: priceLimit ?? null,
		};
		const result = await searchGifts(data);
		return result.products;
	};

	const onSubmit = async (data: GiftSearchForm) => {
		setIsSubmitting(true);
		setSelectedIndex(null);
		setSaveSuccess(false);
		setSaveError(null);
		try {
			const result = await searchGifts(data);
			setProducts(result.products);
			setLastQuery(data.query);
		} catch (error) {
			console.error("Error searching gifts:", error);
			setProducts([]);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		setSelectedIndex(null);
		setSaveSuccess(false);
		setSaveError(null);
		try {
			const query = getValues("query") || lastQuery;
			const newProducts = await performSearch(query);
			setProducts(newProducts);
		} catch (error) {
			console.error("Error refreshing gifts:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleChoose = async () => {
		if (selectedIndex === null) return;

		const selectedProduct = displayProducts[selectedIndex];
		if (!selectedProduct) return;

		setIsSaving(true);
		setSaveError(null);

		try {
			const response = await fetch("/api/gifts/saved", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					gameId,
					recipientId: user.id,
					product: selectedProduct,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to save gift selection");
			}

			setSaveSuccess(true);
		} catch (error) {
			console.error("Error saving gift:", error);
			setSaveError(
				error instanceof Error
					? error.message
					: "Failed to save your selection",
			);
		} finally {
			setIsSaving(false);
		}
	};

	// API returns exactly 3 products, but slice to ensure we never show more than 3
	const displayProducts = products.slice(0, 3);

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
									className="px-3 py-1.5 rounded-full dark:bg-zinc-800 text-sm text-neutral-800 dark:text-neutral-200"
								>
									{preference}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{!saveSuccess && (
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
								disabled={isSubmitting || displayProducts.length > 0}
								{...register("query")}
							/>
							{errors.query && (
								<p className="text-sm text-destructive mt-1">
									{errors.query.message}
								</p>
							)}
						</FieldContent>
					</Field>

					{displayProducts.length === 0 && (
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
					)}
				</form>
			)}

			{isSubmitting && <ChristmasLoadingSkeleton recipientName={user.name} />}

			{/* Success Message */}
			{saveSuccess && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center py-12 space-y-4"
				>
					<div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
						<svg
							className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						Gift saved!
					</h2>
					<p className="text-muted-foreground">
						Your gift choice for {user.name} has been saved.
					</p>
					<Button
						variant="outline"
						onClick={() => window.history.back()}
						className="mt-4"
					>
						Back to game
					</Button>
				</motion.div>
			)}

			{/* Product Selection Grid */}
			{!isSubmitting && !saveSuccess && displayProducts.length > 0 && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">
							Pick a gift for {user.name}
						</h2>
						{priceLimit && (
							<span className="text-sm text-muted-foreground">
								Under ${priceLimit}
							</span>
						)}
					</div>

					{/* 3-Card Selectable Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{displayProducts.map((product, index) => (
							<ProductButton
								key={product.url || `${product.title}-${index}`}
								product={product}
								isSelected={selectedIndex === index}
								onSelect={() => setSelectedIndex(index)}
								index={index}
								isRefreshing={isRefreshing}
							/>
						))}
					</div>

					{/* Error Message */}
					{saveError && (
						<p className="text-sm text-destructive text-center">{saveError}</p>
					)}

					{/* Action Buttons */}
					<div className="flex items-center justify-center gap-4 pt-4">
						<Button
							variant="outline"
							size="lg"
							onClick={handleRefresh}
							disabled={isRefreshing || isSaving}
							className="flex items-center gap-2"
						>
							<motion.div
								animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
								transition={
									isRefreshing
										? { duration: 1, repeat: Infinity, ease: "linear" }
										: {}
								}
								className="inline-flex"
							>
								<RefreshCw className="w-4 h-4" />
							</motion.div>
							<span className="sr-only sm:not-sr-only">New suggestions</span>
						</Button>
						<Button
							size="lg"
							onClick={handleChoose}
							disabled={selectedIndex === null || isSaving}
							className="min-w-[140px]"
						>
							{isSaving ? "Saving…" : "Choose this gift"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
