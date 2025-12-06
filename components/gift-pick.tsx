"use client";

import { RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, useEffect, useId, useState } from "react";
import { ProductButton } from "@/components/product-button";
import { Button } from "@/components/ui/button";
import type { ProductResult } from "@/lib/api/searchGifts";
import { searchGifts } from "@/lib/api/searchGifts";
import type { users } from "@/lib/db/schema";
import type { GiftSearchInput } from "@/schemas/gifts";

type User = typeof users.$inferSelect;

type GiftPickProps = {
	user: User;
	gameId: string;
	priceLimit: string | null;
};

export function GiftPick({ user, gameId, priceLimit }: GiftPickProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [products, setProducts] = useState<ProductResult[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [personImage, setPersonImage] = useState<File | null>(null);
	const [productImageFile, setProductImageFile] = useState<File | null>(null);
	const [productPreview, setProductPreview] = useState<string>("");
	const [combinedImage, setCombinedImage] = useState<string>("");
	const [combineError, setCombineError] = useState<string | null>(null);
	const [isCombining, setIsCombining] = useState(false);
	const [isPreparingProductImage, setIsPreparingProductImage] = useState(false);
	const personInputId = useId();
	const [showPersonalize, setShowPersonalize] = useState(true);

	// Load products from sessionStorage on mount
	useEffect(() => {
		const stored = sessionStorage.getItem("giftSearchResults");
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as ProductResult[];
				setProducts(parsed);
			} catch (error) {
				console.error("Error parsing stored products:", error);
			}
		}
	}, []);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		setSelectedIndex(null);
		setSaveSuccess(false);
		setSaveError(null);
		setProductImageFile(null);
		setProductPreview("");
		setCombinedImage("");
		setCombineError(null);

		try {
			const query = searchParams.get("query") || "";
			const data: GiftSearchInput = {
				query,
				gameId,
				priceLimit: priceLimit ?? null,
			};

			const result = await searchGifts(data);
			const newProducts = result.products.slice(0, 3);
			setProducts(newProducts);

			// Update sessionStorage
			sessionStorage.setItem("giftSearchResults", JSON.stringify(newProducts));
		} catch (error) {
			console.error("Error refreshing gifts:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleChoose = async () => {
		if (selectedIndex === null) return;

		const displayProducts = products.slice(0, 3);
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

	const handlePersonImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setPersonImage(file);
		setCombineError(null);
		setCombinedImage("");
	};

	const prepareProductImageFile = async (product: ProductResult) => {
		const candidate =
			product.imageUrl || (product.images?.[0] as string | undefined) || "";
		if (!candidate) {
			setProductImageFile(null);
			setCombineError(
				"We couldn't find an image for this gift. Try another option.",
			);
			return;
		}

		setIsPreparingProductImage(true);
		setCombineError(null);

		try {
			const response = await fetch(candidate);
			if (!response.ok) {
				throw new Error("Unable to load the product image");
			}

			const blob = await response.blob();
			const type = blob.type || "image/jpeg";
			const safeName =
				product.title?.slice(0, 32).replace(/[^a-z0-9]/gi, "-") ||
				"product-image";

			setProductImageFile(new File([blob], `${safeName}.jpg`, { type }));
			setProductPreview(candidate);
		} catch (error) {
			console.error("Error preparing product image:", error);
			setProductImageFile(null);
			setProductPreview(candidate);
			setCombineError(
				error instanceof Error
					? error.message
					: "Unable to prep the product image. Try again.",
			);
		} finally {
			setIsPreparingProductImage(false);
		}
	};

	const handleSelectProduct = (index: number) => {
		setSelectedIndex(index);
		setCombinedImage("");
		setCombineError(null);
		setShowPersonalize(true);

		const product = products[index];
		if (!product) return;

		void prepareProductImageFile(product);
	};

	const handleCombine = async () => {
		setCombineError(null);
		setCombinedImage("");

		if (!personImage) {
			setCombineError("Add a photo of the person first.");
			return;
		}

		if (selectedIndex === null || !productImageFile) {
			setCombineError("Select a gift so we can include its image.");
			return;
		}

		setIsCombining(true);

		try {
			const formData = new FormData();
			formData.append("personImage", personImage);
			formData.append("productImage", productImageFile);

			const response = await fetch("/api/images/combine", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to combine images");
			}

			setCombinedImage(data.resultImage);
		} catch (error) {
			console.error("Error combining images:", error);
			setCombineError(
				error instanceof Error
					? error.message
					: "Failed to combine images. Please try again.",
			);
		} finally {
			setIsCombining(false);
		}
	};

	const displayProducts = products.slice(0, 3);

	if (saveSuccess) {
		return (
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
						<title>Gift saved</title>
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
		);
	}

	if (displayProducts.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">No products found.</p>
				<Button
					variant="outline"
					onClick={() =>
						router.push(
							`/gifts/search?step=search&gameId=${gameId}&userId=${user.id}`,
						)
					}
					className="mt-4"
				>
					Back to search
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Pick a gift for {user.name}</h2>
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
						onSelect={() => handleSelectProduct(index)}
						index={index}
						isRefreshing={isRefreshing}
					/>
				))}
			</div>

			{selectedIndex !== null && showPersonalize && (
				<div className="space-y-4 rounded-xl border border-border/60 p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="space-y-1">
							<h3 className="text-base font-semibold text-foreground">
								Personalize the preview
							</h3>
							<p className="text-sm text-muted-foreground">
								Upload a photo of {user.name} and preview it with the selected
								gift before you save.
							</p>
						</div>
						<div className="flex items-center gap-3">
							{combinedImage && (
								<span className="text-xs font-medium text-emerald-600">
									Preview ready
								</span>
							)}
							<Button
								size="icon"
								variant="ghost"
								aria-label="Close personalization"
								onClick={() => setShowPersonalize(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor={personInputId}>
								Person photo
							</label>
							<input
								id={personInputId}
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handlePersonImageChange}
								className="block w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Preview result</p>
							<div className="relative w-full max-w-md aspect-square overflow-hidden rounded-lg border bg-muted">
								{combinedImage ? (
									<Image
										src={combinedImage}
										alt="Combined preview"
										fill
										sizes="(max-width: 768px) 100vw, 50vw"
										className="object-cover"
										unoptimized
									/>
								) : productPreview ? (
									<Image
										src={productPreview}
										alt="Selected gift (blurred until combined)"
										fill
										sizes="(max-width: 768px) 100vw, 50vw"
										className="object-cover"
										unoptimized
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
										Select a gift to see its image here.
									</div>
								)}
							</div>
						</div>
					</div>

					{combineError && (
						<p className="text-sm text-destructive">{combineError}</p>
					)}

					<div className="flex flex-wrap items-center gap-3">
						<Button
							size="sm"
							onClick={handleCombine}
							disabled={
								isCombining ||
								isPreparingProductImage ||
								!personImage ||
								selectedIndex === null ||
								!productImageFile
							}
						>
							{isCombining ? "Combining…" : "Preview with photo"}
						</Button>
						{personImage && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setPersonImage(null);
									setCombinedImage("");
								}}
							>
								Clear person photo
							</Button>
						)}
						{isPreparingProductImage && (
							<span className="text-xs text-muted-foreground">
								Loading product image…
							</span>
						)}
					</div>
				</div>
			)}
			{selectedIndex !== null && !showPersonalize && (
				<div className="flex justify-center">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowPersonalize(true)}
					>
						Show personalize preview
					</Button>
				</div>
			)}

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
	);
}
