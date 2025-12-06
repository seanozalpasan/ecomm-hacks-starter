import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function hasCompletedOnboarding(
	clerkId: string,
): Promise<boolean> {
	if (!clerkId) {
		return false;
	}

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.clerkID, clerkId))
		.limit(1);

	return !!user;
}
