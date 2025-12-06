"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CalendarCheck2,
	DollarSign,
	MoreVertical,
	Plus,
	Sparkles,
	User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";

interface ManagePageProps {
	params: Promise<{
		gameId: string;
	}>;
}

interface GameData {
	id: string;
	name: string;
	priceLimit: string | null;
	deadline: Date;
	categories: string[] | null;
	status: string;
	authorId: string;
	authorClerkId: string;
	authorName: string;
	participants: Array<{
		userId: string;
		name: string;
		email: string;
	}>;
	invites: Array<{
		id: string;
		email: string;
		status: string;
	}>;
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

async function sendInvite(gameId: string, email: string) {
	const response = await fetch(`/api/games/${gameId}/invite`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to send invite");
	}

	return response.json();
}

async function createMatchesForGame(gameId: string) {
	const response = await fetch(`/api/games/${gameId}/match`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to create matches");
	}

	return response.json();
}

export default function ManageGamePage({ params }: ManagePageProps) {
	const { gameId } = React.use(params);
	const router = useRouter();
	const { user, isLoaded } = useUser();
	const queryClient = useQueryClient();

	const {
		data: gameData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["game", gameId],
		queryFn: () => fetchGameData(gameId),
		enabled: !!gameId && isLoaded,
	});

	const { mutate: invitePlayer, isPending: isInviting } = useMutation({
		mutationFn: (email: string) => sendInvite(gameId, email),
		onSuccess: () => {
			toast.success("Invitation sent!", {
				description: `Invitation email has been sent`,
			});
			setInviteEmail("");
			queryClient.invalidateQueries({ queryKey: ["game", gameId] });
		},
		onError: (error) => {
			toast.error("Failed to send invite", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		},
	});

	const { mutate: createMatches, isPending: isMatching } = useMutation({
		mutationFn: () => createMatchesForGame(gameId),
		onSuccess: (data) => {
			toast.success("Matches created!", {
				description: `${data.data.matchCount} participants have been matched`,
			});
			queryClient.invalidateQueries({ queryKey: ["game", gameId] });
		},
		onError: (error) => {
			toast.error("Failed to create matches", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		},
	});

	const [priceLimit, setPriceLimit] = useState("");
	const [deadline, setDeadline] = useState("");
	const [category, setCategory] = useState("");
	const [inviteEmail, setInviteEmail] = useState("");

	useEffect(() => {
		if (gameData) {
			setPriceLimit(gameData.priceLimit || "25");
			setDeadline(new Date(gameData.deadline).toISOString().split("T")[0]);
			setCategory(gameData.categories?.[0] || "General");
		}
	}, [gameData]);

	const handleInvite = () => {
		if (inviteEmail) {
			invitePlayer(inviteEmail);
		}
	};

	const handleMatch = () => {
		createMatches();
	};

	const handleInputChange =
		(setter: React.Dispatch<React.SetStateAction<string>>) =>
		(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			setter(e.target.value);
		};

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

	// Redirect non-owners
	if (!isOwner) {
		router.push(`/games/${gameId}`);
		return null;
	}

	// Filter out the host from participants and combine with pending invites
	const allPlayers = [
		...(gameData.participants || [])
			.filter((p) => p.userId !== gameData.authorId)
			.map((p) => ({
				name: p.name,
				email: p.email,
				status: "Accepted" as const,
			})),
		...(gameData.invites || []).map((i) => ({
			name: i.email,
			email: i.email,
			status:
				i.status === "DECLINED" ? ("Declined" as const) : ("Invited" as const),
		})),
	];

	const formatDeadlineLabel = (date: Date) =>
		new Date(date).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
		});

	const statusStyles: Record<(typeof allPlayers)[number]["status"], string> = {
		Accepted: "bg-emerald-100 text-emerald-900",
		Invited: "bg-amber-100 text-amber-900",
		Declined: "bg-rose-100 text-rose-900",
	};

	const skeletonCount = Math.max(0, 5 - allPlayers.length);

	return (
		<div className=" bg-white text-gray-900">
			<main className="max-w-5xl mx-auto px-6 pb-16 pt-6 space-y-10">
				<section className="space-y-4">
					<div className="space-y-3">
						<p className="text-sm uppercase tracking-wide text-gray-500">
							Manage Secret Santa
						</p>
						<h1 className="text-4xl font-black leading-tight tracking-tight">
							{gameData.name}
						</h1>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 max-w-xl">
						<div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
								<CalendarCheck2 className="h-5 w-5" aria-hidden />
							</span>
							<div>
								<p className="text-sm font-semibold">
									Buy in time for {formatDeadlineLabel(gameData.deadline)}
								</p>
								<p className="text-xs text-gray-500">Gift deadline</p>
							</div>
						</div>

						<div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
								<DollarSign className="h-5 w-5" aria-hidden />
							</span>
							<div>
								<p className="text-sm font-semibold">
									${gameData.priceLimit || "25"} budget
								</p>
								<p className="text-xs text-gray-500">Per person</p>
							</div>
						</div>
					</div>
				</section>

				<section className="rounded-3xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm sm:p-8">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-xl font-semibold">People</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								className="text-base font-semibold"
								onClick={() => router.push(`/games/${gameId}`)}
							>
								View Pairings
							</Button>
						</div>
					</div>

					<div className="mb-6 flex flex-col gap-3 sm:flex-row">
						<input
							type="email"
							inputMode="email"
							name="inviteEmail"
							placeholder="email@example.com"
							value={inviteEmail}
							autoComplete="email"
							onChange={(e) => setInviteEmail(e.target.value.trim())}
							className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
						/>
						<Button
							onClick={handleInvite}
							disabled={!inviteEmail || isInviting}
							className="h-12 rounded-xl px-6 text-base font-semibold"
						>
							{isInviting ? "Sending…" : "Add"}
							<Plus className="ml-2 h-4 w-4" aria-hidden />
						</Button>
					</div>

					<ul className="space-y-3">
						{allPlayers.map((player, index) => (
							<li
								key={`${player.email}-${index}`}
								className="flex items-center gap-3 rounded-2xl bg-gray-200 px-4 py-3"
							>
								<span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 ring-1 ring-gray-300">
									<User2 className="h-5 w-5" aria-hidden />
								</span>
								<div className="flex-1">
									<p className="text-base font-semibold">{player.name}</p>
									<p className="text-sm text-gray-600">{player.email}</p>
								</div>
								<span
									className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[player.status]}`}
								>
									{player.status}
								</span>
								<button
									type="button"
									className="rounded-full p-2 text-gray-600 transition hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
									aria-label={`More options for ${player.name}`}
								>
									<MoreVertical className="h-4 w-4" aria-hidden />
								</button>
							</li>
						))}

						{Array.from({ length: skeletonCount }).map((_, idx) => (
							<li
								key={`placeholder-${idx}`}
								className="flex items-center gap-3 rounded-2xl bg-gray-200 px-4 py-3"
							>
								<span className="h-10 w-10 rounded-full bg-gray-300" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-40 rounded-full bg-gray-300" />
									<div className="h-3 w-24 rounded-full bg-gray-300" />
								</div>
								<span className="h-7 w-20 rounded-full bg-gray-300" />
								<span className="h-9 w-9 rounded-full bg-gray-300" />
							</li>
						))}
					</ul>
				</section>

				<section className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-sm uppercase tracking-wide text-gray-500">
									Settings
								</p>
								<h2 className="text-xl font-semibold">Game details</h2>
							</div>
							<Sparkles className="h-5 w-5 text-gray-500" aria-hidden />
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="priceLimit">Price Limit ($)</FieldLabel>
								<FieldContent>
									<input
										type="number"
										id="priceLimit"
										value={priceLimit}
										onChange={handleInputChange(setPriceLimit)}
										className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
									/>
								</FieldContent>
							</Field>

							<Field>
								<FieldLabel htmlFor="deadline">Gift Deadline</FieldLabel>
								<FieldContent>
									<input
										type="date"
										id="deadline"
										value={deadline}
										onChange={handleInputChange(setDeadline)}
										className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
									/>
								</FieldContent>
							</Field>

							<Field>
								<FieldLabel htmlFor="category">Gift Category</FieldLabel>
								<FieldContent>
									<select
										id="category"
										value={category}
										onChange={handleInputChange(setCategory)}
										className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
									>
										<option>Tech</option>
										<option>Books</option>
										<option>Experiences</option>
										<option>General</option>
									</select>
								</FieldContent>
							</Field>

							<Field>
								<FieldLabel htmlFor="status">Game Status</FieldLabel>
								<FieldContent>
									<input
										type="text"
										id="status"
										value={gameData.status}
										disabled
										className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 text-base text-gray-600"
									/>
								</FieldContent>
							</Field>
						</div>

						<Button
							onClick={() =>
								toast.success("Settings saved", {
									description: "Frontend only",
								})
							}
							className="mt-6 h-12 rounded-xl px-6 text-base font-semibold"
						>
							Save Settings
						</Button>
					</div>

					<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-sm uppercase tracking-wide text-gray-500">
									Matching
								</p>
								<h2 className="text-xl font-semibold">Ready to match?</h2>
							</div>
							<Sparkles className="h-5 w-5 text-gray-500" aria-hidden />
						</div>

						<p className="text-gray-700">
							Once everyone has joined, create pairings and we will send out
							assignments. This action can&apos;t be undone.
						</p>

						<Button
							onClick={handleMatch}
							disabled={gameData.status !== "DRAFT" || isMatching}
							className="mt-6 h-12 w-full rounded-xl bg-red-600 text-base font-semibold hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							{isMatching
								? "Creating matches…"
								: "Match people and create groups"}
						</Button>

						{(gameData.status === "ACTIVE" ||
							gameData.status === "MATCHED") && (
							<p className="mt-3 text-center text-sm font-medium text-emerald-600">
								✓ Matches have been created! View them on the main game page.
							</p>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}
