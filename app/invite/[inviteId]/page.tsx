"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface InviteDetails {
	id: string;
	email: string;
	status: string;
	game: {
		priceLimit: string | null;
		deadline: Date;
		categories: string[] | null;
		author: {
			name: string;
		};
	};
}

async function fetchInviteDetails(inviteId: string): Promise<InviteDetails> {
	const response = await fetch(`/api/games/invite/${inviteId}`);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch invite details");
	}

	const data = await response.json();
	return data.data;
}

async function respondToInvite(inviteId: string, action: "accept" | "decline") {
	const response = await fetch("/api/games/invite/respond", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ inviteId, action }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to respond to invite");
	}

	return response.json();
}

export default function InvitePage() {
	const params = useParams();
	const router = useRouter();
	const { isSignedIn } = useUser();
	const inviteId = params.inviteId as string;

	const {
		data: invite,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["invite", inviteId],
		queryFn: () => fetchInviteDetails(inviteId),
	});

	const { mutate: respond, isPending } = useMutation({
		mutationFn: (action: "accept" | "decline") =>
			respondToInvite(inviteId, action),
		onSuccess: (data) => {
			alert(data.data.message);
			router.push("/");
		},
		onError: (error) => {
			alert(error instanceof Error ? error.message : "Failed to respond");
		},
	});

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950 flex items-center justify-center">
				<div className="text-center">
					<div className="text-2xl mb-2">🎁</div>
					<p className="text-zinc-600 dark:text-zinc-400">
						Loading invitation...
					</p>
				</div>
			</div>
		);
	}

	if (error || !invite) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950 flex items-center justify-center">
				<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-md">
					<h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
						Invitation Not Found
					</h1>
					<p className="text-zinc-600 dark:text-zinc-400 mb-6">
						{error instanceof Error ? error.message : "This invitation could not be found or is no longer valid."}
					</p>
					<button
						onClick={() => router.push("/")}
						className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	const deadlineDate = new Date(invite.game.deadline);
	const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const hasResponded = invite.status !== "PENDING";

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-md w-full">
				<div className="text-center mb-6">
					<div className="text-5xl mb-4">🎁</div>
					<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
						Secret Santa Invitation
					</h1>
					<p className="text-zinc-600 dark:text-zinc-400">
						You've been invited by{" "}
						<span className="font-semibold">{invite.game.author.name}</span>
					</p>
				</div>

				{hasResponded ? (
					<div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 mb-6">
						<p className="text-center text-zinc-900 dark:text-zinc-50">
							You have already{" "}
							<span className="font-semibold">
								{invite.status === "ACCEPTED" ? "accepted" : "declined"}
							</span>{" "}
							this invitation.
						</p>
					</div>
				) : (
					<>
						<div className="space-y-4 mb-8">
							<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
										GIFT EXCHANGE DEADLINE
									</span>
								</div>
								<p className="text-lg font-bold text-purple-900 dark:text-purple-100">
									{formattedDeadline}
								</p>
							</div>

							{invite.game.priceLimit && (
								<div className="flex justify-between items-center">
									<span className="text-zinc-600 dark:text-zinc-400">
										Price Limit
									</span>
									<span className="font-medium text-zinc-900 dark:text-zinc-50">
										${invite.game.priceLimit}
									</span>
								</div>
							)}

							{invite.game.categories && invite.game.categories.length > 0 && (
								<div>
									<span className="text-zinc-600 dark:text-zinc-400 block mb-2">
										Gift Categories
									</span>
									<div className="flex flex-wrap gap-2">
										{invite.game.categories.map((category) => (
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

						{!isSignedIn ? (
							<div className="space-y-3">
								<p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
									Please sign in to respond to this invitation
								</p>
								<button
									type="button"
									onClick={() => router.push(`/sign-in?redirect_url=/invite/${inviteId}`)}
									className="w-full px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
								>
									Sign In to Respond
								</button>
							</div>
						) : (
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => respond("decline")}
									disabled={isPending}
									className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isPending ? "Processing..." : "Decline"}
								</button>
								<button
									type="button"
									onClick={() => respond("accept")}
									disabled={isPending}
									className="flex-1 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isPending ? "Processing..." : "Accept"}
								</button>
							</div>
						)}
					</>
				)}

				<button
					onClick={() => router.push("/")}
					className="w-full mt-4 px-6 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors text-sm"
				>
					Go to Home
				</button>
			</div>
		</div>
	);
}
