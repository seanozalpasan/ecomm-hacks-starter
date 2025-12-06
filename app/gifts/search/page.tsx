import { GiftSearchClient } from "@/components/gift-search-client";
import { getGameDetails } from "@/services/games/get-game";
import { getUserById } from "@/services/user/query";

import { EmptyState } from "./EmptyState";

type Props = {
	searchParams: Promise<{ userId?: string; gameId?: string }>;
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
		<div className="flex  items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4 py-16 sm:py-32">
			<div className="w-full max-w-2xl">
				<GiftSearchClient
					user={user}
					gameId={game.id}
					priceLimit={game.priceLimit}
				/>
			</div>
		</div>
	);
}
