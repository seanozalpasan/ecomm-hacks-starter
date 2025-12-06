"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GiftLoading } from "@/components/gift-loading";
import { GiftPick } from "@/components/gift-pick";
import { GiftSearchForm } from "@/components/gift-search-form";
import type { users } from "@/lib/db/schema";
import type { GiftSearchInput } from "@/schemas/gifts";

type User = typeof users.$inferSelect;

type GiftSearchPageClientProps = {
	user: User;
	gameId: string;
	priceLimit: string | null;
	initialStep?: string;
	initialQuery?: string;
};

export function GiftSearchPageClient({
	user,
	gameId,
	priceLimit,
	initialStep = "search",
	initialQuery,
}: GiftSearchPageClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const step = searchParams.get("step") || initialStep;

	const handleSearchSubmit = (data: GiftSearchInput) => {
		// Navigate to loading page with query params
		const params = new URLSearchParams({
			step: "loading",
			query: data.query,
			gameId,
			userId: user.id,
		});
		if (priceLimit) {
			params.set("priceLimit", priceLimit);
		}
		router.push(`/gifts/search?${params.toString()}`);
	};

	// Render appropriate component based on step
	if (step === "loading") {
		return (
			<Suspense fallback={<div>Loading...</div>}>
				<GiftLoading />
			</Suspense>
		);
	}

	if (step === "pick") {
		return (
			<div className="flex items-center justify-center  font-sans dark:bg-black px-4 py-16 sm:py-32">
				<div className="w-full max-w-4xl">
					<Suspense fallback={<div>Loading...</div>}>
						<GiftPick user={user} gameId={gameId} priceLimit={priceLimit} />
					</Suspense>
				</div>
			</div>
		);
	}

	// Default to search step
	return (
		<div className="flex items-center justify-center  font-sans dark:bg-black px-4 py-16 sm:py-32">
			<div className="w-full max-w-2xl">
				<GiftSearchForm
					user={user}
					gameId={gameId}
					priceLimit={priceLimit}
					onSubmit={handleSearchSubmit}
				/>
			</div>
		</div>
	);
}
