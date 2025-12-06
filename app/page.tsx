"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Crown, Mail, Minus, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { SearchLoading } from "@/components/search-loading";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

interface Game {
	id: string;
	name: string;
	priceLimit: string | null;
	deadline: Date;
	categories: string[] | null;
	status: string;
	authorId: string;
	authorName: string;
	isHost: boolean;
}

interface PendingInvite {
	id: string;
	gameId: string;
	gameName: string;
	priceLimit: string | null;
	deadline: Date;
	categories: string[] | null;
	status: string;
	invitedAt: Date;
	hostName: string;
}

async function fetchUserGames(): Promise<Game[]> {
	const response = await fetch("/api/games/user");
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch games");
	}
	const data = await response.json();
	return data.data;
}

async function fetchPendingInvites(): Promise<PendingInvite[]> {
	const response = await fetch("/api/games/invites/pending");
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch pending invites");
	}
	const data = await response.json();
	return data.data;
}

function HomeContent() {
	const searchParams = useSearchParams();
	const { data: games, isLoading } = useQuery({
		queryKey: ["userGames"],
		queryFn: fetchUserGames,
	});
	const { data: pendingInvites, isLoading: isLoadingInvites } = useQuery({
		queryKey: ["pendingInvites"],
		queryFn: fetchPendingInvites,
	});
	const [showPastGames, setShowPastGames] = useState(false);

	const { activeGames, pastGames } = useMemo(() => {
		if (!games) return { activeGames: [], pastGames: [] };

		const active: Game[] = [];
		const past: Game[] = [];

		games.forEach((game) => {
			if (game.status === "COMPLETED") {
				past.push(game);
			} else {
				active.push(game);
			}
		});

		return { activeGames: active, pastGames: past };
	}, [games]);

	useEffect(() => {
		const onboardingRedirect = searchParams.get("onboarding_redirect");
		if (onboardingRedirect === "true") {
			toast.error("Onboarding already completed", {
				description:
					"You have already completed onboarding. You cannot access those pages again.",
			});
		}
	}, [searchParams]);

	return (
		<div className=" bg-white dark:bg-zinc-900">
			<div className="container mx-auto px-4 py-8">
				<SignedOut>
					<div className="max-w-4xl mx-auto flex gap-4 flex-col mt-20">
						<Logo size={128} />
						<Image
							src="/unwrappd-text.svg"
							alt="Unwrapped"
							width={300}
							height={128}
						/>
						<p className="text-gray-500">
							Most Secret Santa apps just give you a name. Unwrappd gives you a
							plan. Our intelligent AI Santa handles the logistics and scans the
							web to find unique, personalized gifts based on each user's
							specific vibe. <br />
							<br />
							We bridge the gap between knowing who to buy for and knowing what
							to buy. By integrating AI directly with unique sellers, we ensure
							every gift is a hit, not a generic last-minute grab.
						</p>

						<Button asChild size="lg" className="w-full">
							<Link href="/sign-in">Sign In</Link>
						</Button>
					</div>
				</SignedOut>

				<SignedIn>
					<div className="max-w-4xl mx-auto">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-black dark:text-white">
								Your Games
							</h2>
							<Button
								asChild
								variant="outline"
								className="border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800"
							>
								<Link href="/create">Create game</Link>
							</Button>
						</div>

						{isLoading || isLoadingInvites ? (
							<div className="text-center py-12">
								<p className="text-gray-600 dark:text-gray-300">
									Loading your games...
								</p>
							</div>
						) : (
							<>
								{/* Pending Invites Section */}
								{pendingInvites && pendingInvites.length > 0 && (
									<div className="mb-8">
										<h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
											<Mail className="w-5 h-5" />
											Pending Invitations
										</h3>
										<div className="grid gap-4">
											{pendingInvites.map((invite) => (
												<Link
													key={invite.id}
													href={`/invite/${invite.id}`}
													className="block"
												>
													<div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
														<div className="flex justify-between items-start">
															<div className="flex-1">
																<div className="flex items-center gap-2 mb-2">
																	<h3 className="text-lg font-bold text-black dark:text-white">
																		{invite.gameName}
																	</h3>
																	<span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
																		New
																	</span>
																</div>
																<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
																	Hosted by{" "}
																	<span className="font-medium">
																		{invite.hostName}
																	</span>
																</p>
																<p className="text-sm text-black dark:text-gray-300">
																	Buy in time for{" "}
																	<b>
																		{new Date(
																			invite.deadline,
																		).toLocaleDateString("en-US", {
																			day: "numeric",
																			month: "long",
																		})}
																	</b>
																</p>
															</div>
															<Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
														</div>
													</div>
												</Link>
											))}
										</div>
									</div>
								)}

								{/* Active Games */}
								{activeGames.length > 0 || pastGames.length > 0 ? (
									<>
										{activeGames.length > 0 && (
											<div className="grid gap-4 mb-6">
												{activeGames.map((game) => (
													<Link
														key={game.id}
														href={`/games/${game.id}`}
														className="block"
													>
														<div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
															<div className="flex justify-between items-center">
																<div className="flex-1">
																	<div className="flex items-center gap-2 mb-1">
																		<h3 className="text-lg font-bold text-black dark:text-white">
																			{game.name}
																		</h3>
																		{game.isHost ? (
																			<span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
																				<Crown className="w-3 h-3" />
																				Host
																			</span>
																		) : (
																			<span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
																				<Users className="w-3 h-3" />
																				Participant
																			</span>
																		)}
																	</div>
																	<p className="text-sm text-black dark:text-gray-300">
																		Buy in time for{" "}
																		<b>
																			{new Date(
																				game.deadline,
																			).toLocaleDateString("en-US", {
																				day: "numeric",
																				month: "long",
																			})}
																		</b>
																	</p>
																</div>
															</div>
														</div>
													</Link>
												))}
											</div>
										)}

										{/* Past Games Dropdown */}
										{pastGames.length > 0 && (
											<div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
												<button
													type="button"
													onClick={() => setShowPastGames(!showPastGames)}
													className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
													aria-expanded={showPastGames}
													aria-label={
														showPastGames
															? "Hide past games"
															: "Show past games"
													}
												>
													<h3 className="text-xl font-bold text-black dark:text-white">
														Previous
													</h3>
													<div className="relative w-5 h-5 inline-flex items-center justify-center">
														<motion.div
															animate={{
																opacity: showPastGames ? 0 : 1,
																scale: showPastGames ? 0.6 : 1,
															}}
															transition={{
																duration: 0.3,
																ease: [0.4, 0, 0.2, 1],
															}}
															className="absolute"
														>
															<ChevronDown className="w-5 h-5 text-black dark:text-white" />
														</motion.div>
														<motion.div
															animate={{
																opacity: showPastGames ? 1 : 0,
																scale: showPastGames ? 1 : 0.6,
															}}
															transition={{
																duration: 0.3,
																ease: [0.4, 0, 0.2, 1],
															}}
															className="absolute"
														>
															<Minus className="w-5 h-5 text-black dark:text-white" />
														</motion.div>
													</div>
												</button>

												{showPastGames && (
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: "auto" }}
														exit={{ opacity: 0, height: 0 }}
														transition={{
															duration: 0.3,
															ease: [0.4, 0, 0.2, 1],
														}}
														className="overflow-hidden"
													>
														<div className="grid gap-4">
															{pastGames.map((game) => (
																<Link
																	key={game.id}
																	href={`/games/${game.id}`}
																	className="block"
																>
																	<div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
																		<div className="flex justify-between items-center">
																			<div className="flex-1">
																				<div className="flex items-center gap-2 mb-1">
																					<h3 className="text-lg font-bold text-black dark:text-white">
																						{game.name}
																					</h3>
																					{game.isHost ? (
																						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
																							<Crown className="w-3 h-3" />
																							Host
																						</span>
																					) : (
																						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
																							<Users className="w-3 h-3" />
																							Participant
																						</span>
																					)}
																				</div>
																				<p className="text-sm text-black dark:text-gray-300">
																					Due{" "}
																					<b>
																						{new Date(
																							game.deadline,
																						).toLocaleDateString("en-US", {
																							day: "numeric",
																							month: "long",
																						})}
																					</b>
																				</p>
																			</div>
																		</div>
																	</div>
																</Link>
															))}
														</div>
													</motion.div>
												)}
											</div>
										)}
									</>
								) : (
									<div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-12 text-center">
										<p className="text-gray-600 dark:text-gray-300 mb-4">
											You haven't joined any games yet.
										</p>
										<Button asChild>
											<Link href="/create">Create Your First Game</Link>
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</SignedIn>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<Suspense fallback={<SearchLoading />}>
			<HomeContent />
		</Suspense>
	);
}
