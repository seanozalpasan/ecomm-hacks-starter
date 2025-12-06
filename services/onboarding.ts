import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import {
	type BasicsInput,
	basicsInputSchema,
} from "@/schemas/onboarding";

type BasicsResult = {
	data: BasicsInput;
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
	interests: string[];
};

type OnboardingDeps = {
	dbClient?: OnboardingDbClient;
};

const BASICS_SAVED_MESSAGE = "Basics information saved successfully";

function normalizeBasics(
	input: CompleteOnboardingInput["basics"],
): BasicsInput {
	return basicsInputSchema.parse(input);
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

function buildGiftPreferences(interests: string[]): string[] {
	return interests;
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
	email: string,
	interests: string[],
): {
	email: string;
	age: number;
	name: string;
	location: string;
	giftPreferences: string[];
} {
	return {
		email,
		age: calculateAge(basics.birthday),
		name: basics.name,
		location: basics.location,
		giftPreferences: buildGiftPreferences(interests),
	};
}

export function saveBasics(
	input: CompleteOnboardingInput["basics"],
): BasicsResult {
	const data = normalizeBasics(input);
	return { data, message: BASICS_SAVED_MESSAGE };
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

	return !!user;
}

export async function completeOnboarding(
	input: CompleteOnboardingInput,
	deps: OnboardingDeps = {},
) {
	const { clerkId, email, interests } = input;

	if (!clerkId) throw new Error("Missing Clerk user id");
	if (!email) throw new Error("Missing user email");
	if (!interests || interests.length === 0) throw new Error("Missing interests");

	const basics = normalizeBasics(input.basics);
	const updateData = buildUserData(basics, email, interests);

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

export type { BasicsResult };
