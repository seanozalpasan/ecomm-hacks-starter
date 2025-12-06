"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
	userId?: string;
	gameId?: string;
};

export function EmptyState({ userId, gameId }: EmptyStateProps) {
	const router = useRouter();

	const handleGoToDashboard = () => {
		router.push("/dashboard");
	};

	const handleGoToGame = () => {
		if (gameId) {
			router.push(`/games/${gameId}`);
		}
	};

	return (
		<div className="flex  items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4 py-16 sm:py-32">
			<div className="w-full max-w-2xl text-center space-y-6">
				<h1 className="text-2xl font-semibold">
					Missing {!gameId ? "Game" : "Gift Recipient"} Information
				</h1>
				<p className="text-muted-foreground">
					{!userId && !gameId
						? "Please provide both a user ID and game ID to search for gifts."
						: !userId
							? "Please provide a user ID to search for gifts."
							: "Please provide a game ID to search for gifts."}
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
					{gameId ? (
						<Button onClick={handleGoToGame} variant="default">
							Go to Game
						</Button>
					) : null}
					<Button onClick={handleGoToDashboard} variant="outline">
						Return to Dashboard
					</Button>
				</div>
			</div>
		</div>
	);
}
