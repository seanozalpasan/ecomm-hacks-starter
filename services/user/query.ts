import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

/**
 * Get a user by their database ID (UUID)
 * @param userId - The user's database ID
 * @returns The user object or null if not found
 */
export async function getUserById(
  userId: string,
): Promise<typeof users.$inferSelect | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

/**
 * Get a user by their email address
 * @param email - The user's email address
 * @returns The user object or null if not found
 */
export async function getUserByEmail(
  email: string,
): Promise<typeof users.$inferSelect | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}
