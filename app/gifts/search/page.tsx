import { Suspense } from "react";
import { getGameDetails } from "@/services/games/get-game";
import { getUserById } from "@/services/user/query";
import { EmptyState } from "./EmptyState";
import { GiftSearchPageClient } from "./gift-search-page-client";

type Props = {
	searchParams: Promise<{
		userId?: string;
		gameId?: string;
		step?: string;
		query?: string;
	}>;
};

export default async function GiftsSearchPage({ searchParams }: Props) {
	const params = await searchParams;
	const { userId, gameId } = params;

	// Try to avoid querying db if we just don't have the params
	if (!userId || !gameId) {
		return <EmptyState userId={userId} gameId={gameId} />;
	}

	const [user, game] = await Promise.all([
		getUserById(userId),
		getGameDetails(gameId),
	]);

	// If queries don't return valid user and game also show empty state
	if (!user || !game) {
		return <EmptyState userId={userId} gameId={gameId} />;
	}

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<GiftSearchPageClient
				user={user}
				gameId={game.id}
				priceLimit={game.priceLimit}
				initialStep={params.step || "search"}
				initialQuery={params.query}
			/>
		</Suspense>
	);
}
