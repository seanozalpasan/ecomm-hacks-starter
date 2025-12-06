"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, Crown, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CircularUserImages from "@/components/circular-user-images";
import { Button } from "@/components/ui/button";

interface GamePageProps {
	params: Promise<{
		gameId: string;
	}>;
}

interface GameData {
	id: string;
	priceLimit: string | null;
	deadline: Date;
	categories: string[] | null;
	status: string;
	authorId: string;
	authorClerkId: string;
	authorName: string;
	name: string;
	participants: Array<{
		userId: string;
		clerkId: string;
		name: string;
		email: string;
	}>;
	invites: Array<{
		id: string;
		email: string;
		status: string;
	}>;
}

interface UserImage {
	clerkId: string;
	imageUrl: string | null;
}

async function fetchGameData(gameId: string): Promise<GameData> {
	const response = await fetch(`/api/games/${gameId}`);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch game data");
	}

	const data = await response.json();
	return data.data;
}

async function fetchUserImages(clerkIds: string[]): Promise<UserImage[]> {
	const response = await fetch("/api/users/images", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ clerkIds }),
	});

	if (!response.ok) {
		console.error("Failed to fetch user images");
		return [];
	}

	const data = await response.json();
	return data.users;
}

async function fetchMatch(gameId: string) {
	const response = await fetch(`/api/games/${gameId}/match`);

	if (!response.ok) {
		return null;
	}

	const data = await response.json();
	return data.matched ? data.data : null;
}

// Placeholder avatar image (blank silhouette)
const BLANK_AVATAR =
	'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

export default function IndividualGamePage({ params }: GamePageProps) {
	const { gameId } = React.use(params);
	const router = useRouter();
	const { user, isLoaded } = useUser();
	const [userImages, setUserImages] = useState<Map<string, string>>(new Map());

	const {
		data: gameData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["game", gameId],
		queryFn: () => fetchGameData(gameId),
		enabled: !!gameId && isLoaded,
		refetchInterval: 5000, // Poll every 5 seconds for real-time updates
	});

	// Fetch user images when game data changes
	useEffect(() => {
		if (!gameData) return;

		const clerkIds = [
			gameData.authorClerkId,
			...gameData.participants.map((p) => p.clerkId),
		];

		fetchUserImages(clerkIds).then((images) => {
			const imageMap = new Map<string, string>();
			images.forEach(({ clerkId, imageUrl }) => {
				imageMap.set(clerkId, imageUrl || BLANK_AVATAR);
			});
			setUserImages(imageMap);
		});
	}, [gameData]);

	if (!isLoaded || isLoading) {
		return (
			<div className="  dark:bg-black flex items-center justify-center">
				<p className="text-muted-foreground">Loading game details...</p>
			</div>
		);
	}

	if (error || !gameData) {
		return (
			<div className="  dark:bg-black flex flex-col items-center justify-center p-4">
				<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
					Game not found
				</h1>
				<p className="text-muted-foreground mb-6">
					{error instanceof Error
						? error.message
						: "This game could not be found."}
				</p>
				<Button onClick={() => router.push("/")} variant="outline">
					Go Home
				</Button>
			</div>
		);
	}

	const isOwner = user?.id && gameData.authorClerkId === user.id;

	// Filter out the host from participants (only accepted participants)
	const acceptedParticipants = (gameData.participants || []).filter(
		(p) => p.userId !== gameData.authorId,
	);

	const pendingInvites = (gameData.invites || []).filter(
		(i) => i.status === "PENDING",
	);
	const pendingCount = pendingInvites.length;

	// Prepare users for circular display with Clerk images or blank avatar
	// Include pending invites as grey placeholders
	const circularUsers = [
		{
			userImage: userImages.get(gameData.authorClerkId) || BLANK_AVATAR,
			id: gameData.authorId,
			isPlaceholder: false,
		},
		...acceptedParticipants.map((p) => ({
			userImage: userImages.get(p.clerkId) || BLANK_AVATAR,
			id: p.userId,
			isPlaceholder: false,
		})),
		...pendingInvites.map((invite) => ({
			userImage: BLANK_AVATAR,
			id: `pending-${invite.id}`,
			isPlaceholder: true,
		})),
	];

	// Build a unified people list for display
	const allPeople = [
		{
			name: gameData.authorName,
			email: "",
			status: "host" as const,
		},
		...acceptedParticipants.map((p) => ({
			name: p.name,
			email: p.email,
			status: "accepted" as const,
		})),
		...pendingInvites.map((invite) => ({
			name: invite.email,
			email: invite.email,
			status: "pending" as const,
		})),
	];

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className=" dark:bg-black">
			<main className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
				<div className="text-center mb-8 space-y-2">
					<h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
						{gameData.name}
					</h1>
					<p className="text-muted-foreground">
						{gameData.status === "DRAFT" && "Waiting for everyone to join..."}
						{gameData.status === "ACTIVE" && "The game is active!"}
						{gameData.status === "COMPLETED" && "This game has been completed"}
					</p>
				</div>

				{/* Circular Avatars */}
				<div className="mb-8">
					<CircularUserImages users={circularUsers} size={80} radius={150} />
					{pendingCount > 0 && (
						<p className="text-center text-muted-foreground mt-4">
							{pendingCount} {pendingCount === 1 ? "person" : "people"} still
							pending…
						</p>
					)}
				</div>

				{/* People List */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
						People ({allPeople.length})
					</h2>
					<ul className="space-y-2">
						{allPeople.map((person, index) => (
							<li
								key={`${person.email || person.name}-${index}`}
								className="flex items-center gap-3 rounded-xl bg-gray-100 dark:bg-zinc-800 px-4 py-3"
							>
								<span className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-zinc-600">
									{person.status === "host" ? (
										<Crown className="h-5 w-5 text-amber-500" />
									) : (
										<User2 className="h-5 w-5" />
									)}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
										{person.name}
									</p>
									{person.email && person.status !== "host" && (
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
											{person.email}
										</p>
									)}
								</div>
								<span
									className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
										person.status === "host"
											? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
											: person.status === "accepted"
												? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
												: "bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-400"
									}`}
								>
									{person.status === "host" && (
										<>
											<Crown className="h-3 w-3" />
											Host
										</>
									)}
									{person.status === "accepted" && (
										<>
											<Check className="h-3 w-3" />
											Joined
										</>
									)}
									{person.status === "pending" && (
										<>
											<Clock className="h-3 w-3" />
											Pending
										</>
									)}
								</span>
							</li>
						))}
					</ul>
				</div>

				{/* Game Details */}
				<div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 mb-6">
					<h2 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
						Game Details
					</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div className="flex items-center gap-3">
							<span className="text-2xl">💰</span>
							<div>
								<p className="text-sm text-muted-foreground">Price Limit</p>
								<p className="text-base font-semibold text-gray-900 dark:text-gray-100">
									${gameData.priceLimit || "25"}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<span className="text-2xl">📅</span>
							<div>
								<p className="text-sm text-muted-foreground">Gift Deadline</p>
								<p className="text-base font-semibold text-gray-900 dark:text-gray-100">
									{formatDate(gameData.deadline)}
								</p>
							</div>
						</div>

						{gameData.categories && gameData.categories.length > 0 && (
							<div className="flex items-center gap-3 sm:col-span-2">
								<span className="text-2xl">🎁</span>
								<div>
									<p className="text-sm text-muted-foreground">Categories</p>
									<p className="text-base font-semibold text-gray-900 dark:text-gray-100">
										{gameData.categories.join(", ")}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="space-y-3">
					{isOwner && (
						<Button
							onClick={() => router.push(`/games/${gameId}/manage`)}
							className="w-full"
							size="lg"
						>
							Manage Game
						</Button>
					)}

					{(gameData.status === "ACTIVE" || gameData.status === "MATCHED") && (
						<Button
							onClick={async () => {
								const match = await fetchMatch(gameId);
								if (match?.buyingFor?.id) {
									router.push(
										`/gifts/search?userId=${match.buyingFor.id}&gameId=${gameId}`,
									);
								}
							}}
							className="w-full"
							size="lg"
							variant="outline"
						>
							View Your Match
						</Button>
					)}
				</div>

				{/* Status Messages */}
				{gameData.status === "DRAFT" && (
					<div className="mt-6 bg-muted border-l-4 border-primary p-4 rounded">
						<p className="text-sm text-muted-foreground">
							{isOwner
								? "Waiting for participants to accept their invites. You can manually start matching from the Manage Game page."
								: "The host is waiting for everyone to join before starting the game."}
						</p>
					</div>
				)}

				{(gameData.status === "ACTIVE" || gameData.status === "MATCHED") && (
					<div className="mt-6 bg-muted border-l-4 border-primary p-4 rounded">
						<p className="text-sm text-muted-foreground">
							Matches have been created! Click "View Your Match" above to see
							who you're buying for.
						</p>
					</div>
				)}
			</main>
		</div>
	);
}
