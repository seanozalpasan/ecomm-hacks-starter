"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ProductButton } from "@/components/product-button";
import { Button } from "@/components/ui/button";

interface Product {
	id: string;
	name: string;
	price: number;
	description: string;
	deliveryDate: Date;
	url: string;
}

const hardcodedProducts: Product[] = [
	{
		id: "1",
		name: "Product Title",
		price: 6.99,
		description: "Short description about the product this is cool great yeah",
		deliveryDate: new Date("2024-12-25"),
		url: "https://example.com/product/1",
	},
	{
		id: "2",
		name: "Product Title",
		price: 6.99,
		description: "Short description about the product this is cool great yeah",
		deliveryDate: new Date("2024-12-25"),
		url: "https://example.com/product/2",
	},
	{
		id: "3",
		name: "Product Title",
		price: 6.99,
		description: "Short description about the product this is cool great yeah",
		deliveryDate: new Date("2024-12-25"),
		url: "https://example.com/product/3",
	},
];

export default function SelectProductPage() {
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [rotation, setRotation] = useState(0);
	const [showFinishAnimation, setShowFinishAnimation] = useState(false);

	const handleRefresh = () => {
		setIsRefreshing(true);
		setSelectedProductId(null);
		setShowFinishAnimation(false);
		// Simulate refresh duration
		setTimeout(() => {
			setIsRefreshing(false);
			// Trigger finish animation - quick rotation
			setShowFinishAnimation(true);
		}, 1500);
	};

	const handleChoose = () => {
		if (selectedProductId) {
			const selectedProduct = hardcodedProducts.find(
				(p) => p.id === selectedProductId,
			);
			console.log("Selected product:", selectedProduct);
		}
	};

	return (
		<div className=" bg-white">
			<div className="container mx-auto px-4 py-8">
				{/* Product Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
					{hardcodedProducts.map((product, index) => (
						<ProductButton
							key={product.id}
							product={product}
							selectedProductId={selectedProductId}
							onSelect={setSelectedProductId}
							index={index}
							isRefreshing={isRefreshing}
						/>
					))}
				</div>

				{/* Bottom Action Buttons */}
				<div className="flex items-center justify-center gap-4">
					<Button
						variant="outline"
						size="lg"
						onClick={handleRefresh}
						className="flex items-center gap-2"
					>
						<motion.div
							animate={
								isRefreshing
									? {
											rotate: [rotation, rotation + 360],
										}
									: showFinishAnimation
										? { rotate: rotation + 360 }
										: { rotate: rotation }
							}
							transition={
								isRefreshing
									? {
											duration: 1,
											repeat: Infinity,
											ease: "linear",
										}
									: showFinishAnimation
										? {
												duration: 0.5,
												ease: "easeOut",
											}
										: {}
							}
							onAnimationComplete={() => {
								if (isRefreshing) {
									setRotation((prev) => prev + 360);
								} else if (showFinishAnimation) {
									setRotation((prev) => prev + 360);
									setShowFinishAnimation(false);
								}
							}}
							className="inline-flex"
						>
							<RefreshCw className="w-4 h-4" />
						</motion.div>
					</Button>
					<Button
						size="lg"
						onClick={handleChoose}
						disabled={!selectedProductId}
						className="min-w-[120px]"
					>
						Choose
					</Button>
				</div>
			</div>
		</div>
	);
}
