"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getGameData, saveGameData } from "@/lib/utils/game-storage";
import { gameInviteSchema } from "@/schemas/games/create";
import { toast } from 'sonner';

type InviteFormData = z.infer<typeof gameInviteSchema>;

export default function CreateGameInvitesPage() {
	const router = useRouter();
	const idPrefix = useId();
	const { user } = useUser();
	const [invites, setInvites] = useState<string[]>([]);
	const [selfInviteError, setSelfInviteError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<InviteFormData>({
		resolver: zodResolver(gameInviteSchema),
		defaultValues: {
			email: "",
		},
	});

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getGameData();
		if (saved.invites) {
			setInvites(saved.invites);
		}
	}, []);

	const onAddEmail = (data: InviteFormData) => {
		const email = data.email.toLowerCase().trim();
		setSelfInviteError(null);

		// Get current user's email
		const currentUserEmail = user?.emailAddresses?.[0]?.emailAddress
			?.toLowerCase()
			.trim();

		// Check if user is trying to invite themselves
		if (currentUserEmail && email === currentUserEmail) {
			setSelfInviteError("You cannot invite yourself to the game");
			return;
		}

		// Check for duplicates
		if (invites.includes(email)) {
			setSelfInviteError("This email has already been added");
			return;
		}

		const updatedInvites = [...invites, email];
		setInvites(updatedInvites);
		saveGameData({ invites: updatedInvites });
		reset();
	};

	const onRemoveEmail = (email: string) => {
		const updatedInvites = invites.filter((e) => e !== email);
		setInvites(updatedInvites);
		saveGameData({ invites: updatedInvites });
	};

	const onNext = () => {
		if (invites.length === 0) {
			toast.error("No invites added", {
				description: "Please add at least one email to continue",
			});
			return;
		}
		router.push("/create/confirm");
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
				Invite Participants
			</h1>
			<p className="text-gray-600 dark:text-gray-300 mb-8">
				Add email addresses of people you want to invite to your Secret Santa.
			</p>

			<form onSubmit={handleSubmit(onAddEmail)} className="space-y-4 mb-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-email`}>Email Address</FieldLabel>
					<FieldContent>
						<div className="flex gap-2">
							<Input
								id={`${idPrefix}-email`}
								type="email"
								{...register("email")}
								placeholder="friend@example.com"
								aria-invalid={errors.email ? "true" : "false"}
								className="flex-1"
							/>
							<Button type="submit" className="whitespace-nowrap">
								Add
							</Button>
						</div>
						{selfInviteError && (
							<p className="text-sm text-red-600 dark:text-red-400 mt-1">
								{selfInviteError}
							</p>
						)}
						<FieldError errors={errors.email ? [errors.email] : []} />
					</FieldContent>
				</Field>
			</form>

			{invites.length > 0 && (
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-3 text-black dark:text-white">
						Invited ({invites.length})
					</h2>
					<ul className="space-y-2">
						{invites.map((email) => (
							<li
								key={email}
								className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg"
							>
								<span className="text-black dark:text-white">{email}</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onRemoveEmail(email)}
									className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
								>
									Remove
								</Button>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="flex justify-end gap-4 pt-4">
				<Button type="button" variant="ghost" onClick={() => router.back()}>
					Back
				</Button>
				<Button type="button" onClick={onNext} disabled={invites.length === 0}>
					Next
				</Button>
			</div>
		</div>
	);
}
