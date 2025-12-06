"use client";

import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
	id: string;
	name: string;
	price: number;
	description: string;
	deliveryDate: Date;
	url: string;
}

interface ProductButtonProps {
	product: Product;
	selectedProductId: string | null;
	onSelect: (id: string) => void;
	index: number;
	isRefreshing: boolean;
}

export function ProductButton({
	product,
	selectedProductId,
	onSelect,
	index,
	isRefreshing,
}: ProductButtonProps) {
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
				"bg-white rounded-3xl cursor-pointer text-left w-full p-4",
				selectedProductId === product.id
					? "border-blue-500 ring-2 ring-green-200"
					: "",
			)}
			onClick={() => onSelect(product.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(product.id);
				}
			}}
		>
			{/* Image Placeholder */}
			<div className="w-full aspect-square bg-gray-200 rounded-3xl overflow-hidden" />

			{/* Product Info */}
			<div className="p-4 space-y-2">
				<h3 className="text-lg font-bold text-black dark:text-white">
					{product.name}
				</h3>
				<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
					{product.description}
				</p>
				<div className="pt-2">
					<span className="text-xs text-gray-500 dark:text-gray-400">
						Delivers {format(product.deliveryDate, "MMMM d, yyyy")}
					</span>
				</div>
				<div className="flex items-center justify-between pt-3 border-gray-100 dark:border-gray-800">
					<span className="text-lg font-bold text-black dark:text-white">
						${product.price.toFixed(2)}
					</span>
					<Button
						asChild
						variant="outline"
						size="sm"
						onClick={(e) => e.stopPropagation()}
						className="text-xs"
					>
						<Link href={product.url} target="_blank" rel="noopener noreferrer">
							<ExternalLink />
						</Link>
					</Button>
				</div>
			</div>
		</motion.button>
	);
}
