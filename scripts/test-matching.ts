import { db } from "@/lib/db/db";
import { games, users, gameUserMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createMatches } from "@/services/games/match";

async function testMatching() {
  try {
    console.log("🎲 TESTING GAME MATCHING FUNCTIONALITY\n");
    console.log("=" .repeat(70) + "\n");

    // Find a game in DRAFT status
    const [game] = await db
      .select({
        id: games.id,
        authorID: games.authorID,
        status: games.status,
      })
      .from(games)
      .where(eq(games.status, "DRAFT"))
      .limit(1);

    if (!game) {
      console.log("❌ No DRAFT games found.");
      console.log("💡 Run 'pnpm db:seed' first to create test data.\n");
      process.exit(1);
    }

    // Get the author's info
    const [author] = await db
      .select({
        id: users.id,
        clerkID: users.clerkID,
        name: users.name
      })
      .from(users)
      .where(eq(users.id, game.authorID))
      .limit(1);

    console.log("📋 GAME INFORMATION");
    console.log("-".repeat(70));
    console.log(`Game ID:  ${game.id}`);
    console.log(`Author:   ${author.name}`);
    console.log(`Status:   ${game.status}`);
    console.log("\n");

    // Create matches
    console.log("🎲 Creating matches...");
    console.log("-".repeat(70));

    const result = await createMatches({
      gameId: game.id,
      userId: author.id,
    });

    console.log(`✅ Matches created successfully!`);
    console.log(`   Participants: ${result.participantCount}`);
    console.log(`   Matches: ${result.matches.length}`);
    console.log(`   New Status: ${result.game.status}\n`);

    // Display all matches
    console.log("📋 MATCH ASSIGNMENTS");
    console.log("-".repeat(70));

    const matches = await db
      .select()
      .from(gameUserMatches)
      .where(eq(gameUserMatches.gameID, game.id));

    for (const match of matches) {
      const [buyer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, match.buyerID))
        .limit(1);

      const [recipient] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, match.recipientID))
        .limit(1);

      console.log(`🎁 ${buyer.name} → ${recipient.name}`);
    }

    console.log("\n");
    console.log("=" .repeat(70));
    console.log("✨ MATCHING TEST COMPLETE!");
    console.log("=" .repeat(70));
    console.log(`\nGame status changed from DRAFT to ${result.game.status}`);
    console.log(`Total matches created: ${matches.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    console.error("\nStack trace:", error instanceof Error ? error.stack : "No stack trace");
    process.exit(1);
  }
}

testMatching();
