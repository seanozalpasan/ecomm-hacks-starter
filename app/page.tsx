"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Minus } from "lucide-react";
import { motion } from "motion/react";
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

function HomeContent() {
	const searchParams = useSearchParams();
	const { data: games, isLoading } = useQuery({
		queryKey: ["userGames"],
		queryFn: fetchUserGames,
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
		<div className="min-h-screen bg-white dark:bg-zinc-900">
			<div className="container mx-auto px-4 py-8">
				<SignedOut>
					<Navbar />

					<div className="max-w-md mx-auto text-center pt-12">
						<div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-8">
							<h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
								Get Started
							</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-6">
								Sign in to create and join Secret Santa games with your friends
								and family.
							</p>
							<div className="flex flex-col gap-3">
								<Button asChild size="lg" className="w-full">
									<Link href="/sign-in">Sign In</Link>
								</Button>
								<Button asChild variant="outline" size="lg" className="w-full">
									<Link href="/sign-up">Sign Up</Link>
								</Button>
							</div>
						</div>
					</div>
				</SignedOut>

				<SignedIn>
					<div className="max-w-4xl mx-auto">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Logo />
								<h1 className="text-3xl font-bold text-black dark:text-white mb-2">
									Unwrappd
								</h1>
							</div>
							<UserButton />
						</div>

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

						{isLoading ? (
							<div className="text-center py-12">
								<p className="text-gray-600 dark:text-gray-300">
									Loading your games...
								</p>
							</div>
						) : activeGames.length > 0 || pastGames.length > 0 ? (
							<>
								{/* Active Games */}
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
														<div>
															<h3 className="text-lg font-bold text-black dark:text-white mb-1">
																{game.name}
															</h3>
															<p className="text-sm text-black dark:text-gray-300">
																Buy in time for{" "}
																<b>
																	{new Date(game.deadline).toLocaleDateString(
																		"en-US",
																		{
																			day: "numeric",
																			month: "long",
																		},
																	)}
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
												showPastGames ? "Hide past games" : "Show past games"
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
																	<div>
																		<h3 className="text-lg font-bold text-black dark:text-white mb-1">
																			{game.name}
																		</h3>
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
