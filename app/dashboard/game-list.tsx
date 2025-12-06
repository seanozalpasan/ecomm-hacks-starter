"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Game {
	id: string;
	name: string;
	dueDate: string;
	players: number;
	status: "Active" | "In Progress";
}

export function GameList() {
	const {
		data: games,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["games", "current"],
		queryFn: async () => {
			const res = await fetch("/api/games");
			if (!res.ok) {
				throw new Error("Failed to fetch games");
			}
			const json = await res.json();
			if (!json.success) {
				throw new Error(json.error || "Failed to fetch games");
			}
			return json.data as Game[];
		},
	});

	if (isLoading) {
		return (
			<div className="text-center py-8 text-gray-500">Loading games...</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8 text-red-600">
				Error loading games. Please try again.
			</div>
		);
	}

	if (!games || games.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">No active games</div>
		);
	}

	return (
		<div className="space-y-3">
			{games.map((game) => (
				<Link
					key={game.id}
					href={`/dashboard/games/${game.id}`}
					className="block bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition cursor-pointer"
				>
					<div className="flex justify-between items-start">
						<div className="flex-1">
							<h3 className="font-bold text-gray-900 text-lg">{game.name}</h3>
							<p className="text-sm text-gray-900 mt-1">{game.dueDate}</p>
						</div>
						<button
							type="button"
							className="text-gray-600 hover:text-gray-900 p-1 -mt-1"
							onClick={(e) => {
								e.preventDefault();
								// TODO: Implement options menu
							}}
							aria-label="Game options"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<circle cx="10" cy="5" r="1.5" fill="currentColor" />
								<circle cx="10" cy="10" r="1.5" fill="currentColor" />
								<circle cx="10" cy="15" r="1.5" fill="currentColor" />
							</svg>
						</button>
					</div>
				</Link>
			))}
		</div>
	);
}
