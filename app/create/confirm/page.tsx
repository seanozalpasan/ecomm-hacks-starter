"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearGameData, getGameData } from "@/lib/utils/game-storage";

interface GameData {
	name: string;
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
			name: data.name,
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
			toast.success("Game created successfully!");
			router.push("/");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create game",
			);
		},
	});

	useEffect(() => {
		const saved = getGameData();

		if (!saved.basics || !saved.invites || saved.invites.length === 0) {
			router.push("/create/basics");
			return;
		}

		setGameData({
			name: saved.basics.name || "",
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
				<p className="text-gray-600 dark:text-gray-300">Loading...</p>
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
			<h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
				Review and Confirm
			</h1>
			<p className="text-gray-600 dark:text-gray-300 mb-8">
				Please review the details before creating your Secret Santa game.
			</p>

			<div className="space-y-6 mb-8">
				<div className="border-b border-gray-200 dark:border-zinc-700 pb-4">
					<h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
						GAME DETAILS
					</h2>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span className="text-gray-600 dark:text-gray-300">
								Game Name
							</span>
							<span className="font-medium text-black dark:text-white">
								{gameData.name}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600 dark:text-gray-300">
								Price Limit
							</span>
							<span className="font-medium text-black dark:text-white">
								${gameData.priceLimit}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600 dark:text-gray-300">Deadline</span>
							<span className="font-medium text-black dark:text-white">
								{formattedDeadline}
							</span>
						</div>
						{gameData.categories.length > 0 && (
							<div>
								<span className="text-gray-600 dark:text-gray-300 block mb-1">
									Categories
								</span>
								<div className="flex flex-wrap gap-2">
									{gameData.categories.map((category) => (
										<span
											key={category}
											className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-black dark:text-white rounded text-sm"
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
					<h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
						PARTICIPANTS ({gameData.invites.length})
					</h2>
					<ul className="space-y-2">
						{gameData.invites.map((email) => (
							<li
								key={email}
								className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-black dark:text-white"
							>
								{email}
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 mb-8">
				<p className="text-sm text-black dark:text-white">
					Invitation emails will be sent to all participants. They will receive
					a link to accept or decline the invitation.
				</p>
			</div>

			<div className="flex justify-end gap-4">
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.back()}
					disabled={isPending}
				>
					Back
				</Button>
				<Button type="button" onClick={onSubmit} disabled={isPending}>
					{isPending ? "Creating..." : "Let's go"}
				</Button>
			</div>
		</div>
	);
}
