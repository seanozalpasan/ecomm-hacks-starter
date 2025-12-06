"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface InviteDetails {
	id: string;
	email: string;
	status: string;
	game: {
		name: string | null;
		priceLimit: string | null;
		deadline: Date;
		categories: string[] | null;
		author: {
			name: string;
		};
	};
}

function getOrdinalSuffix(day: number): string {
	if (day > 3 && day < 21) return "th";
	switch (day % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function formatDateOrdinal(date: Date): string {
	const day = date.getDate();
	const month = date.toLocaleDateString("en-US", { month: "long" });
	return `${day}${getOrdinalSuffix(day)} ${month}`;
}

async function fetchInviteDetails(inviteId: string): Promise<InviteDetails> {
	const response = await fetch(`/api/games/invite/${inviteId}`);

	if (!response.ok) {
		if (response.status === 404) {
			const error = new Error("Invite not found");
			(error as Error & { status?: number }).status = 404;
			throw error;
		}
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

async function declineInvite(inviteId: string) {
	const response = await fetch("/api/games/invite/decline", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ inviteId }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to decline invite");
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

	// Handle 404 by calling notFound()
	if (error && (error as Error & { status?: number }).status === 404) {
		notFound();
	}

	const { mutate: respond, isPending } = useMutation({
		mutationFn: (action: "accept" | "decline") =>
			respondToInvite(inviteId, action),
		onSuccess: (data) => {
			if (data.data.status === "accepted" && data.data.gameId) {
				toast.success("Invitation accepted!", {
					description: "Redirecting to your game...",
				});
				router.push(`/games/${data.data.gameId}`);
			} else {
				toast.success("Invitation declined");
				router.push("/");
			}
		},
		onError: (error) => {
			toast.error("Failed to respond to invitation", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		},
	});

	const { mutate: decline, isPending: isDeclining } = useMutation({
		mutationFn: () => declineInvite(inviteId),
		onSuccess: () => {
			toast.success("Invitation declined");
			router.push("/");
		},
		onError: (error) => {
			toast.error("Failed to decline invitation", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		},
	});

	const handleAccept = () => {
		if (!isSignedIn) {
			// Store the invite ID in localStorage so we can auto-accept after onboarding
			localStorage.setItem("pendingInviteAccept", inviteId);
			router.push(`/sign-up?redirect_url=/onboarding/basics`);
		} else {
			respond("accept");
		}
	};

	const handleDecline = () => {
		if (!isSignedIn) {
			decline();
		} else {
			respond("decline");
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-zinc-600">Loading invitation...</p>
				</div>
			</div>
		);
	}

	if (error && (error as Error & { status?: number }).status !== 404) {
		// Show error state for non-404 errors
		return (
			<div className="min-h-screen bg-white flex items-center justify-center p-4">
				<div className="bg-white rounded-lg p-8 max-w-md">
					<h1 className="text-2xl font-bold mb-4 text-red-600">
						Error Loading Invitation
					</h1>
					<p className="text-zinc-600 mb-6">
						{error instanceof Error
							? error.message
							: "Failed to load invitation details."}
					</p>
					<button
						type="button"
						onClick={() => router.push("/")}
						className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	if (!invite) {
		// If we get here and there's no invite, it's likely a 404
		// (other errors would have been caught above)
		notFound();
		return null; // This won't be reached, but satisfies TypeScript
	}

	const deadlineDate = new Date(invite.game.deadline);
	const formattedDeadline = formatDateOrdinal(deadlineDate);
	const gameName = invite.game.name || "Secret Santa";
	const hasResponded = invite.status !== "PENDING";

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-4">
			<div className="bg-white rounded-lg max-w-md w-full">
				{/* Large image placeholder */}
				<div className="w-full h-48 bg-zinc-100 rounded-lg mb-6" />

				{/* Title */}
				<h1 className="text-2xl font-bold text-center mb-8 text-zinc-900">
					You've been invited to join {gameName} Secret Santa
				</h1>

				{hasResponded ? (
					<div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 mb-6">
						<p className="text-center text-zinc-900">
							You have already{" "}
							<span className="font-semibold">
								{invite.status === "ACCEPTED" ? "accepted" : "declined"}
							</span>{" "}
							this invitation.
						</p>
					</div>
				) : (
					<>
						{/* Info sections */}
						<div className="flex gap-6 mb-8">
							{/* Calendar section */}
							<div className="flex-1 flex items-start gap-3">
								<Calendar className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
								<div>
									<p className="text-sm text-zinc-600">Buy in time for</p>
									<p className="text-base font-medium text-zinc-900">
										{formattedDeadline}
									</p>
								</div>
							</div>

							{/* Budget section */}
							{invite.game.priceLimit && (
								<div className="flex-1 flex items-start gap-3">
									<DollarSign className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
									<div>
										<p className="text-sm text-zinc-600">Budget</p>
										<p className="text-base font-medium text-zinc-900">
											${invite.game.priceLimit}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Author section */}
						<div className="flex items-center gap-3 mb-8">
							<div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
							<p className="text-sm text-zinc-600">
								Invited by{" "}
								<span className="font-medium text-zinc-900">
									{invite.game.author.name}
								</span>
							</p>
						</div>

						{/* Action buttons */}
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleDecline}
								disabled={isPending || isDeclining}
								className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
							>
								{isPending || isDeclining ? "Processing..." : "Decline"}
							</button>
							<button
								type="button"
								onClick={handleAccept}
								disabled={isPending || isDeclining}
								className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
							>
								{isPending || isDeclining ? "Processing..." : "Accept"}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
