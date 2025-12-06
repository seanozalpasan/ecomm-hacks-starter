"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { SearchLoading } from "@/components/search-loading";
import { Logo } from "@/components/ui/logo";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Game {
	id: string;
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
	const { isLoaded } = useUser();

	const { data: games, isLoading } = useQuery({
		queryKey: ["user-games"],
		queryFn: fetchUserGames,
		enabled: isLoaded,
	});

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
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950">
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center mb-12">
					<Logo />
					<h1 className="text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
						Unwrappd
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
						Make gift-giving magical
					</p>
				</div>

				<SignedOut>
					<div className="max-w-md mx-auto text-center">
						<div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
							<h2 className="text-2xl font-semibold mb-4">Get Started</h2>
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
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold">Your Games</h2>
							<Button asChild>
								<Link href="/create">Create New Game</Link>
							</Button>
						</div>

						{isLoading ? (
							<div className="text-center py-12">
								<p className="text-gray-600 dark:text-gray-300">
									Loading your games...
								</p>
							</div>
						) : games && games.length > 0 ? (
							<div className="grid gap-4">
								{games.map((game) => (
									<Link
										key={game.id}
										href={`/games/${game.id}`}
										className="block"
									>
										<div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
											<div className="flex justify-between items-start">
												<div>
													<h3 className="text-xl font-semibold mb-2">
														Secret Santa Game
													</h3>
													<p className="text-sm text-gray-600 dark:text-gray-300">
														Hosted by {game.authorName}
													</p>
													<div className="mt-3 space-y-1 text-sm">
														{game.priceLimit && (
															<p className="text-gray-700 dark:text-gray-300">
																Price Limit: ${game.priceLimit}
															</p>
														)}
														<p className="text-gray-700 dark:text-gray-300">
															Deadline:{" "}
															{new Date(game.deadline).toLocaleDateString()}
														</p>
													</div>
												</div>
												<div>
													<span
														className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
															game.status === "DRAFT"
																? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
																: game.status === "ACTIVE"
																	? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																	: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
														}`}
													>
														{game.status}
													</span>
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						) : (
							<div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-12 text-center">
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
