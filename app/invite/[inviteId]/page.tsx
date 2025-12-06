"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign } from "lucide-react";
import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
			clerkId: string;
		};
	};
}

interface UserImage {
	clerkId: string;
	imageUrl: string | null;
}

// Placeholder avatar image (blank silhouette)
const BLANK_AVATAR =
	'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

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

async function fetchPostcardImage(inviteId: string): Promise<string | null> {
	try {
		const response = await fetch(`/api/invites/${inviteId}/postcard`);
		if (!response.ok) {
			let errorMessage = "Failed to fetch postcard image";
			try {
				const text = await response.text();
				try {
					const errorData = JSON.parse(text);
					const parts = [
						errorMessage,
						errorData?.message,
						errorData?.error,
						errorData?.details,
					].filter(Boolean);
					errorMessage = parts.join(" - ");
				} catch {
					// Response was not JSON; include raw text
					errorMessage = `${errorMessage}: ${text}`;
				}
			} catch {
				// ignore parse errors
			}
			console.error(errorMessage);
			return null;
		}
		const data = await response.json();
		return data.image || null;
	} catch (error) {
		console.error("Error fetching postcard:", error);
		return null;
	}
}

export default function InvitePage() {
	const params = useParams();
	const router = useRouter();
	const { isSignedIn } = useUser();
	const inviteId = params.inviteId as string;
	const [authorImageUrl, setAuthorImageUrl] = useState<string>(BLANK_AVATAR);
	const [postcardImage, setPostcardImage] = useState<string | null>(null);
	const [isGeneratingPostcard, setIsGeneratingPostcard] = useState(false);

	const {
		data: invite,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["invite", inviteId],
		queryFn: () => fetchInviteDetails(inviteId),
	});

	// Fetch author's image when invite data is available
	useEffect(() => {
		if (!invite?.game?.author?.clerkId) return;

		fetchUserImages([invite.game.author.clerkId]).then((images) => {
			const authorImage = images.find(
				(img) => img.clerkId === invite.game.author.clerkId,
			);
			setAuthorImageUrl(authorImage?.imageUrl || BLANK_AVATAR);
		});
	}, [invite?.game?.author?.clerkId]);

	// Fetch postcard image (no caching - just fetch once per session)
	useEffect(() => {
		if (!inviteId) return;

		let isMounted = true;

		async function loadPostcard() {
			try {
				// Clean up any old localStorage entries from previous implementation
				const oldStorageKey = `postcard_${inviteId}`;
				try {
					localStorage.removeItem(oldStorageKey);
				} catch {
					// Ignore errors from localStorage cleanup
				}

				setIsGeneratingPostcard(true);

				const image = await fetchPostcardImage(inviteId);

				if (image && isMounted) {
					setPostcardImage(image);
				}
			} catch (error) {
				console.error("Failed to load postcard:", error);
			} finally {
				if (isMounted) {
					setIsGeneratingPostcard(false);
				}
			}
		}

		loadPostcard();

		return () => {
			isMounted = false;
		};
	}, [inviteId]);

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
			<div className=" bg-white flex items-center justify-center p-4">
				<div className="bg-white rounded-lg max-w-md w-full space-y-6">
					<Skeleton className="w-full h-48 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-3/4 mx-auto" />
						<Skeleton className="h-6 w-1/2 mx-auto" />
					</div>
					<div className="flex gap-6">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-6 w-24" />
						</div>
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-6 w-16" />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Skeleton className="w-10 h-10 rounded-full shrink-0" />
						<Skeleton className="h-4 w-32" />
					</div>
					<div className="flex gap-3">
						<Skeleton className="flex-1 h-11 rounded-lg" />
						<Skeleton className="flex-1 h-11 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (error && (error as Error & { status?: number }).status !== 404) {
		// Show error state for non-404 errors
		return (
			<div className="bg-white flex items-center justify-center p-4">
				<div className="bg-white rounded-lg p-8 max-w-md">
					<h1 className="text-2xl font-bold mb-4 text-red-600">
						Error Loading Invitation
					</h1>
					<p className="text-zinc-600 mb-6">
						{error instanceof Error
							? error.message
							: "Failed to load invitation details."}
					</p>
					<Button onClick={() => router.push("/")} variant="default">
						Go Home
					</Button>
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
		<div className=" bg-white flex items-center justify-center p-4">
			<div className="bg-white rounded-lg max-w-md w-full">
				{/* Postcard image */}
				<div className="w-full h-48 bg-zinc-100 rounded-lg mb-6 overflow-hidden relative">
					{isGeneratingPostcard ? (
						<div className="w-full h-full flex items-center justify-center">
							<p className="text-zinc-500 text-sm">Generating postcard...</p>
						</div>
					) : postcardImage ? (
						<Image
							src={postcardImage}
							alt="Christmas postcard invitation"
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, 448px"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<p className="text-zinc-500 text-sm">Loading postcard...</p>
						</div>
					)}
				</div>

				{/* Title */}
				<h1 className="text-2xl font-bold text-center mb-8 text-zinc-900">
					You've been invited to join {gameName}
				</h1>

				{hasResponded ? (
					<div className=" border border-zinc-200 rounded-lg p-6 mb-6">
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
							<div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-200">
								<Image
									src={authorImageUrl}
									alt={`${invite.game.author.name}'s avatar`}
									fill
									className="object-cover"
									sizes="40px"
								/>
							</div>
							<p className="text-sm text-zinc-600">
								Invited by{" "}
								<span className="font-medium text-zinc-900">
									{invite.game.author.name}
								</span>
							</p>
						</div>

						{/* Action buttons */}
						<div className="flex gap-3">
							<Button
								type="button"
								onClick={handleDecline}
								disabled={isPending || isDeclining}
								variant="destructive"
								size="lg"
								className="flex-1"
							>
								{isPending || isDeclining ? "Processing..." : "Decline"}
							</Button>
							<Button
								type="button"
								onClick={handleAccept}
								disabled={isPending || isDeclining}
								variant="default"
								size="lg"
								className="flex-1 bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-600"
							>
								{isPending || isDeclining ? "Processing..." : "Accept"}
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
