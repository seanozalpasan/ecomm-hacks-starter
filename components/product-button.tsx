"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ProductResult } from "@/lib/api/searchGifts";

interface ProductButtonProps {
	product: ProductResult;
	isSelected: boolean;
	onSelect: () => void;
	index: number;
	isRefreshing: boolean;
}

export function ProductButton({
	product,
	isSelected,
	onSelect,
	index,
	isRefreshing,
}: ProductButtonProps) {
	// Get the first available image
	const productImage =
		product.images && product.images.length > 0
			? product.images[0]
			: product.imageUrl || null;

	// Check if price is $0.00 or invalid
	const isPriceUnavailable =
		product.price === "$0.00" ||
		product.price === "0.00" ||
		product.price === "$0" ||
		product.price === "0" ||
		!product.price;

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 50 }}
			animate={{
				opacity: 1,
				y: 0,
				filter: isRefreshing ? "blur(4px)" : "blur(0px)",
			}}
			transition={{
				ease: "easeInOut",
				duration: 0.5,
				delay: isRefreshing ? 0 : index * 0.1,
			}}
			layout
			className={cn(
				"bg-white dark:bg-zinc-900 rounded-3xl cursor-pointer text-left w-full p-4 border-2 transition-shadow",
				isSelected
					? "border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 shadow-lg"
					: "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
			)}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
		>
			{/* Product Image */}
			<div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
				{productImage ? (
					<img
						src={productImage}
						alt={product.title}
						className="w-full h-full object-cover"
						onError={(event) => {
							const target = event.target as HTMLImageElement;
							target.style.display = "none";
						}}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<svg
							className="w-12 h-12 text-zinc-300 dark:text-zinc-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
				)}
			</div>

			{/* Product Info */}
			<div className="pt-4 space-y-2">
				<h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
					{product.title}
				</h3>
				<p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
					{product.description}
				</p>
				{product.deliveryDate && (
					<p className="text-xs text-zinc-500 dark:text-zinc-500 pt-1">
						Arrives {product.deliveryDate}
					</p>
				)}
				{!product.deliveryDate && product.daysToShip && (
					<p className="text-xs text-zinc-500 dark:text-zinc-500 pt-1">
						Ships in {product.daysToShip} days
					</p>
				)}
				<div className="flex items-center justify-between pt-3">
					{isPriceUnavailable ? (
						<span className="text-sm text-zinc-500 dark:text-zinc-400">
							See price on site
						</span>
					) : (
						<span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							{product.price}
						</span>
					)}
					<Button
						asChild
						variant="outline"
						size="sm"
						onClick={(e) => e.stopPropagation()}
						className="text-xs h-8 w-8 p-0"
						aria-label={`View ${product.title} on external site`}
					>
						<Link href={product.url} target="_blank" rel="noopener noreferrer">
							<ExternalLink className="w-4 h-4" />
						</Link>
					</Button>
				</div>
			</div>
		</motion.button>
	);
}
