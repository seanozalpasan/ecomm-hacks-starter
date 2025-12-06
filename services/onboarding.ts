import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import {
	type BasicsInput,
	basicsInputSchema,
	type LikesInput,
	likesInputSchema,
} from "@/schemas/onboarding";

type BasicsResult = {
	data: BasicsInput;
	message: string;
};

type LikesResult = {
	data: LikesInput;
	message: string;
};

type OnboardingDbClient = typeof db;

export type CompleteOnboardingInput = {
	clerkId: string;
	email: string;
	basics:
		| BasicsInput
		| {
				birthday: string | Date;
				name: string;
				location: string;
		  };
	likes:
		| LikesInput
		| {
				favoriteColor: string;
				favoriteHobby: string;
				favoriteGift: string;
		  };
};

type OnboardingDeps = {
	dbClient?: OnboardingDbClient;
};

const BASICS_SAVED_MESSAGE = "Basics information saved successfully";
const LIKES_SAVED_MESSAGE = "Likes information saved successfully";

function normalizeBasics(
	input: CompleteOnboardingInput["basics"],
): BasicsInput {
	return basicsInputSchema.parse(input);
}

function normalizeLikes(input: CompleteOnboardingInput["likes"]): LikesInput {
	return likesInputSchema.parse(input);
}

function calculateAge(birthday: Date) {
	const now = new Date();
	const age =
		now.getFullYear() -
		birthday.getFullYear() -
		(now < new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())
			? 1
			: 0);

	return age;
}

function buildGiftPreferences(likes: LikesInput) {
	return [likes.favoriteColor, likes.favoriteHobby, likes.favoriteGift].filter(
		Boolean,
	);
}

function getDb(dbClient?: OnboardingDbClient): OnboardingDbClient {
	return dbClient ?? db;
}

async function findUserByClerkId(
	client: OnboardingDbClient,
	id: string,
): Promise<typeof users.$inferSelect | null> {
	const [user] = await client
		.select()
		.from(users)
		.where(eq(users.clerkID, id))
		.limit(1);

	return user ?? null;
}

function buildUserData(
	basics: BasicsInput,
	likes: LikesInput,
	email: string,
): {
	email: string;
	age: number;
	name: string;
	location: string;
	giftPreferences: string[];
	isOnboarded: boolean;
} {
	return {
		email,
		age: calculateAge(basics.birthday),
		name: basics.name,
		location: basics.location,
		giftPreferences: buildGiftPreferences(likes),
		isOnboarded: true,
	};
}

export function saveBasics(
	input: CompleteOnboardingInput["basics"],
): BasicsResult {
	const data = normalizeBasics(input);
	return { data, message: BASICS_SAVED_MESSAGE };
}

export function saveLikes(
	input: CompleteOnboardingInput["likes"],
): LikesResult {
	const data = normalizeLikes(input);
	return { data, message: LIKES_SAVED_MESSAGE };
}

export async function hasCompletedOnboarding(
	clerkId: string,
	deps: OnboardingDeps = {},
): Promise<boolean> {
	if (!clerkId) {
		return false;
	}

	const dbClient = getDb(deps.dbClient);
	const user = await findUserByClerkId(dbClient, clerkId);

	return !!user && user.isOnboarded;
}

export async function completeOnboarding(
	input: CompleteOnboardingInput,
	deps: OnboardingDeps = {},
) {
	const { clerkId, email } = input;

	if (!clerkId) throw new Error("Missing Clerk user id");
	if (!email) throw new Error("Missing user email");

	const basics = normalizeBasics(input.basics);
	const likes = normalizeLikes(input.likes);
	const updateData = buildUserData(basics, likes, email);

	const dbClient = getDb(deps.dbClient);
	const existing = await findUserByClerkId(dbClient, clerkId);

	if (existing) {
		const [updated] = await dbClient
			.update(users)
			.set(updateData)
			.where(eq(users.clerkID, clerkId))
			.returning();

		return { user: updated, created: false };
	}

	const [created] = await dbClient
		.insert(users)
		.values({ clerkID: clerkId, ...updateData })
		.returning();

	return { user: created, created: true };
}

export type { BasicsResult, LikesResult };
