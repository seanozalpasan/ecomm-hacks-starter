import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

type BasicsPayload = {
	birthday: string;
	name: string;
	location: string;
};

type LikesPayload = {
	favoriteColor: string;
	favoriteHobby: string;
	favoriteGift: string;
};

export type CompleteOnboardingInput = {
	clerkId: string;
	email: string;
	basics: BasicsPayload;
	likes: LikesPayload;
};

function calculateAge(birthdayIso: string) {
	const birthDate = new Date(birthdayIso);
	if (Number.isNaN(birthDate.getTime())) {
		throw new Error("Invalid birthday");
	}

	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	const dayDiff = today.getDate() - birthDate.getDate();
	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age -= 1;
	}
	return age;
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
	const { clerkId, email, basics, likes } = input;

	if (!clerkId) throw new Error("Missing Clerk user id");
	if (!email) throw new Error("Missing user email");
	if (!basics) throw new Error("Missing basics data");
	if (!likes) throw new Error("Missing likes data");

	const age = calculateAge(basics.birthday);

	const giftPreferences = [
		likes.favoriteColor,
		likes.favoriteHobby,
		likes.favoriteGift,
	].filter(Boolean);

	const [existing] = await db
		.select()
		.from(users)
		.where(eq(users.clerkID, clerkId))
		.limit(1);

	if (existing) {
		const [updated] = await db
			.update(users)
			.set({
				email,
				age,
				name: basics.name,
				location: basics.location,
				giftPreferences,
			})
			.where(eq(users.clerkID, clerkId))
			.returning();

		return { user: updated, created: false };
	}

	const [created] = await db
		.insert(users)
		.values({
			clerkID: clerkId,
			email,
			age,
			name: basics.name,
			location: basics.location,
			giftPreferences,
		})
		.returning();

	return { user: created, created: true };
}
