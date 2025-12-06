import { db } from "@/lib/db/db";
import { users, games, gameParticipants, gameUserMatches, gameInvites } from "@/lib/db/schema";
import { like, inArray } from "drizzle-orm";

async function cleanup() {
  try {
    console.log("🧹 Starting cleanup process...\n");

    // First, get all test user IDs
    console.log("Finding test users...");
    const testUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.clerkID, "clerk_test_%"));

    if (testUsers.length === 0) {
      console.log("ℹ️  No test data found.\n");
      process.exit(0);
    }

    console.log(`Found ${testUsers.length} test users\n`);

    // Delete games created by test users (will cascade delete participants, matches, invites)
    console.log("Deleting games created by test users...");
    const testUserIds = testUsers.map(u => u.id);

    const deletedGames = await db
      .delete(games)
      .where(inArray(games.authorID, testUserIds))
      .returning({ id: games.id });

    console.log(`✅ Deleted ${deletedGames.length} games`);
    console.log("   (Cascade deleted: participants, matches, invites)\n");

    // Now delete test users
    console.log("Deleting test users...");
    const result = await db
      .delete(users)
      .where(like(users.clerkID, "clerk_test_%"))
      .returning({ id: users.id });

    console.log(`✅ Deleted ${result.length} test users\n`);

    console.log("=" .repeat(60));
    console.log("✨ CLEANUP COMPLETE!");
    console.log("=" .repeat(60));
    console.log("\nAll test data has been removed from the database.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error cleaning up database:", error);
    process.exit(1);
  }
}

cleanup();
