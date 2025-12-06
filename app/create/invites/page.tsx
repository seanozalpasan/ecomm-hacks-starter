"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { getGameData, saveGameData } from "@/lib/utils/game-storage";
import { gameInviteSchema } from "@/schemas/games/create";

type InviteFormData = z.infer<typeof gameInviteSchema>;

export default function CreateGameInvitesPage() {
	const router = useRouter();
	const idPrefix = useId();
	const [invites, setInvites] = useState<string[]>([]);

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

		// Check for duplicates
		if (invites.includes(email)) {
			alert("This email has already been added");
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
			alert("Please add at least one email");
			return;
		}
		router.push("/create/confirm");
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Invite Participants
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Add email addresses of people you want to invite to your Secret Santa.
			</p>

			<form onSubmit={handleSubmit(onAddEmail)} className="space-y-4 mb-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-email`}>Email Address</FieldLabel>
					<FieldContent>
						<div className="flex gap-2">
							<input
								id={`${idPrefix}-email`}
								type="email"
								{...register("email")}
								className={cn(
									"flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",
									"ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
									"placeholder:text-muted-foreground",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									"disabled:cursor-not-allowed disabled:opacity-50",
									errors.email && "border-destructive",
								)}
								placeholder="friend@example.com"
							/>
							<button
								type="submit"
								className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors whitespace-nowrap"
							>
								Add
							</button>
						</div>
						<FieldError errors={errors.email ? [errors.email] : []} />
					</FieldContent>
				</Field>
			</form>

			{invites.length > 0 && (
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
						Invited ({invites.length})
					</h2>
					<ul className="space-y-2">
						{invites.map((email) => (
							<li
								key={email}
								className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
							>
								<span className="text-zinc-900 dark:text-zinc-50">{email}</span>
								<button
									type="button"
									onClick={() => onRemoveEmail(email)}
									className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
								>
									Remove
								</button>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="flex justify-end gap-4 pt-4">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={invites.length === 0}
					className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>
		</div>
	);
}
