"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getGameData, clearGameData } from "@/lib/utils/game-storage";

interface GameData {
	priceLimit: number;
	deadline: string;
	categories: string[];
	invites: string[];
}

async function createGame(data: GameData) {
	const response = await fetch("/api/games/create", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			priceLimit: data.priceLimit,
			deadline: new Date(data.deadline),
			categories: data.categories,
			invites: data.invites,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to create game");
	}

	return response.json();
}

export default function CreateGameConfirmPage() {
	const router = useRouter();
	const [gameData, setGameData] = useState<GameData | null>(null);

	const { mutate: submitGame, isPending } = useMutation({
		mutationFn: createGame,
		onSuccess: () => {
			clearGameData();
			router.push("/");
		},
		onError: (error) => {
			alert(error instanceof Error ? error.message : "Failed to create game");
		},
	});

	useEffect(() => {
		const saved = getGameData();

		if (!saved.basics || !saved.invites || saved.invites.length === 0) {
			router.push("/create/basics");
			return;
		}

		setGameData({
			priceLimit: saved.basics.priceLimit,
			deadline: saved.basics.deadline,
			categories: saved.basics.categories || [],
			invites: saved.invites,
		});
	}, [router]);

	const onSubmit = () => {
		if (!gameData) return;
		submitGame(gameData);
	};

	if (!gameData) {
		return (
			<div className="max-w-md mx-auto text-center">
				<p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
			</div>
		);
	}

	const deadlineDate = new Date(gameData.deadline);
	const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Review and Confirm
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Please review the details before creating your Secret Santa game.
			</p>

			<div className="space-y-6 mb-8">
				<div className="border-b border-zinc-200 dark:border-zinc-700 pb-4">
					<h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
						GAME DETAILS
					</h2>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span className="text-zinc-600 dark:text-zinc-400">
								Price Limit
							</span>
							<span className="font-medium text-zinc-900 dark:text-zinc-50">
								${gameData.priceLimit}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-zinc-600 dark:text-zinc-400">
								Deadline
							</span>
							<span className="font-medium text-zinc-900 dark:text-zinc-50">
								{formattedDeadline}
							</span>
						</div>
						{gameData.categories.length > 0 && (
							<div>
								<span className="text-zinc-600 dark:text-zinc-400 block mb-1">
									Categories
								</span>
								<div className="flex flex-wrap gap-2">
									{gameData.categories.map((category) => (
										<span
											key={category}
											className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm"
										>
											{category}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				<div>
					<h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
						PARTICIPANTS ({gameData.invites.length})
					</h2>
					<ul className="space-y-2">
						{gameData.invites.map((email) => (
							<li
								key={email}
								className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50"
							>
								{email}
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-8">
				<p className="text-sm text-purple-900 dark:text-purple-100">
					When you click "Create Game", invitation emails will be sent to all
					participants. They will receive a link to accept or decline the
					invitation.
				</p>
			</div>

			<div className="flex justify-end gap-4">
				<button
					type="button"
					onClick={() => router.back()}
					disabled={isPending}
					className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-50"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onSubmit}
					disabled={isPending}
					className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? "Creating..." : "Create Game"}
				</button>
			</div>
		</div>
	);
}
