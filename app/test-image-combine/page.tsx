"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

export default function TestImageCombinePage() {
	const [personImage, setPersonImage] = useState<File | null>(null);
	const [productImage, setProductImage] = useState<File | null>(null);
	const [personPreview, setPersonPreview] = useState<string>("");
	const [productPreview, setProductPreview] = useState<string>("");
	const [resultImage, setResultImage] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const handlePersonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPersonImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPersonPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setProductImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setProductPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setResultImage("");

		if (!personImage || !productImage) {
			toast.error("Missing images", {
				description: "Please select both a person image and a product image",
			});
			return;
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("personImage", personImage);
			formData.append("productImage", productImage);

			const response = await fetch("/api/images/combine", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to process images");
			}

			setResultImage(data.resultImage);
			toast.success("Images combined successfully", {
				description: "Your combined image is ready!",
			});
		} catch (err) {
			toast.error("Failed to combine images", {
				description:
					err instanceof Error
						? err.message
						: "An error occurred while processing your images",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setPersonImage(null);
		setProductImage(null);
		setPersonPreview("");
		setProductPreview("");
		setResultImage("");
	};

	return (
		<div className=" bg-gray-50 py-12 px-4">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold text-center mb-8">
					Image Combination Test
				</h1>

				<form
					onSubmit={handleSubmit}
					className="bg-white rounded-lg shadow-lg p-8 mb-8"
				>
					<div className="grid md:grid-cols-2 gap-8 mb-8">
						{/* Person Image Upload */}
						<div>
							<label className="block text-lg font-semibold mb-4">
								Person Image
							</label>
							<input
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handlePersonImageChange}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
							/>
							{personPreview && (
								<div className="mt-4 relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
									<Image
										src={personPreview}
										alt="Person preview"
										fill
										className="object-contain"
									/>
								</div>
							)}
						</div>

						{/* Product Image Upload */}
						<div>
							<label className="block text-lg font-semibold mb-4">
								Product Image
							</label>
							<input
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								onChange={handleProductImageChange}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
							/>
							{productPreview && (
								<div className="mt-4 relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
									<Image
										src={productPreview}
										alt="Product preview"
										fill
										className="object-contain"
									/>
								</div>
							)}
						</div>
					</div>

					{/* Buttons */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={loading || !personImage || !productImage}
							className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{loading ? "Processing..." : "Combine Images"}
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
						>
							Reset
						</button>
					</div>
				</form>

				{/* Result */}
				{resultImage && (
					<div className="bg-white rounded-lg shadow-lg p-8">
						<h2 className="text-2xl font-bold mb-4">Result</h2>
						<div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
							<Image
								src={resultImage}
								alt="Combined result"
								fill
								className="object-contain"
							/>
						</div>
						<p className="mt-4 text-sm text-gray-600">
							Generated using Google Gemini AI
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
