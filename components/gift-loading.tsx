"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { searchGifts } from "@/lib/api/searchGifts";
import type { GiftSearchInput } from "@/schemas/gifts";

export function GiftLoading() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const performSearch = async () => {
			const query = searchParams.get("query");
			const gameId = searchParams.get("gameId");
			const priceLimit = searchParams.get("priceLimit");

			if (!query || !gameId) {
				// Missing required params, redirect back to search
				router.push(
					`/gifts/search?step=search&gameId=${gameId || ""}&userId=${searchParams.get("userId") || ""}`,
				);
				return;
			}

			try {
				const data: GiftSearchInput = {
					query,
					gameId,
					priceLimit: priceLimit || null,
				};

				const result = await searchGifts(data);
				const products = result.products.slice(0, 3); // Ensure only 3 products

				// Store products in sessionStorage
				sessionStorage.setItem("giftSearchResults", JSON.stringify(products));

				// Redirect to pick page
				router.push(
					`/gifts/search?step=pick&gameId=${gameId}&userId=${searchParams.get("userId") || ""}`,
				);
			} catch (error) {
				console.error("Error searching gifts:", error);
				// On error, redirect back to search
				router.push(
					`/gifts/search?step=search&gameId=${gameId}&userId=${searchParams.get("userId") || ""}`,
				);
			}
		};

		performSearch();
	}, [router, searchParams]);

	return (
		<div className="relative min-h-screen bg-linear-to-b from-white via-emerald-50/30 to-white px-4 py-12 flex items-center justify-center">
			<div className="w-full max-w-5xl space-y-8">
				<div
					className="flex flex-col items-center gap-2 text-center"
					aria-live="polite"
					aria-busy="true"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
						<span>Finding gifts...</span>
					</div>
					<p className="text-sm text-muted-foreground">
						Hang tight—this can take a few seconds while we pull options.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[0, 1, 2].map((index) => (
						<div
							key={index}
							className="space-y-4 rounded-xl border border-border/70 bg-white/90 p-4 shadow-sm animate-in fade-in duration-500 motion-reduce:animate-none"
							style={{ animationDelay: `${index * 80}ms` }}
						>
							<Skeleton className="h-48 w-full rounded-lg motion-reduce:animate-none" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
								<Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
							</div>
							<Skeleton className="h-6 w-24 motion-reduce:animate-none" />
							<Skeleton className="h-10 w-full motion-reduce:animate-none" />
						</div>
					))}
				</div>

				<p className="text-xs text-muted-foreground text-center">
					Feel free to stay on this tab—we&apos;ll move you to the picks as soon
					as they&apos;re ready.
				</p>
			</div>
		</div>
	);
}
