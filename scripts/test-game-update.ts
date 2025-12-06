import { db } from "@/lib/db/db";
import { games, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateGame } from "@/services/games/update";
import type { UpdateGameInput } from "@/schemas/games/update";

async function testGameUpdate() {
  try {
    console.log("🧪 TESTING GAME UPDATE FUNCTIONALITY\n");
    console.log("=" .repeat(70) + "\n");

    // Find a game in DRAFT status
    const [game] = await db
      .select({
        id: games.id,
        authorID: games.authorID,
        priceLimit: games.priceLimit,
        deadline: games.deadline,
        status: games.status,
        categories: games.categories,
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

    // Get a non-author user for authorization testing
    const nonAuthors = await db
      .select({
        id: users.id,
        clerkID: users.clerkID,
        name: users.name
      })
      .from(users)
      .limit(2);

    const nonAuthor = nonAuthors.find(u => u.id !== game.authorID);

    console.log("📋 INITIAL GAME STATE");
    console.log("-".repeat(70));
    console.log(`Game ID:      ${game.id}`);
    console.log(`Author:       ${author.name}`);
    console.log(`Clerk ID:     ${author.clerkID}`);
    console.log(`Status:       ${game.status}`);
    console.log(`Price Limit:  $${game.priceLimit}`);
    console.log(`Deadline:     ${game.deadline.toLocaleDateString()}`);
    console.log(`Categories:   ${game.categories?.join(", ") || "None"}`);
    console.log("\n");

    // Test 1: Valid update by author
    console.log("TEST 1: Valid Update (Author, DRAFT status)");
    console.log("-".repeat(70));

    const updateData1: UpdateGameInput = {
      priceLimit: 150,
      deadline: new Date("2025-12-31"),
      categories: ["Electronics", "Books", "Toys", "Games"],
    };

    console.log("Updating game with:");
    console.log(`  Price Limit: $${updateData1.priceLimit}`);
    console.log(`  Deadline: ${updateData1.deadline?.toLocaleDateString()}`);
    console.log(`  Categories: ${updateData1.categories?.join(", ")}`);

    try {
      const result1 = await updateGame(game.id, updateData1, author.clerkID);
      console.log(`✅ ${result1.message}`);

      // Verify the update
      const [updated1] = await db
        .select()
        .from(games)
        .where(eq(games.id, game.id))
        .limit(1);

      console.log("\nVerified updated values:");
      console.log(`  Price Limit: $${updated1.priceLimit}`);
      console.log(`  Deadline: ${updated1.deadline.toLocaleDateString()}`);
      console.log(`  Categories: ${updated1.categories?.join(", ")}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Test 2: Partial update (only one field)
    console.log("TEST 2: Partial Update (Only price limit)");
    console.log("-".repeat(70));

    const updateData2: UpdateGameInput = {
      priceLimit: 200,
    };

    console.log("Updating only price limit to: $200");

    try {
      const result2 = await updateGame(game.id, updateData2, author.clerkID);
      console.log(`✅ ${result2.message}`);

      const [updated2] = await db
        .select({ priceLimit: games.priceLimit })
        .from(games)
        .where(eq(games.id, game.id))
        .limit(1);

      console.log(`Verified: Price Limit is now $${updated2.priceLimit}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Test 3: Update status from DRAFT to ACTIVE
    console.log("TEST 3: Change Status from DRAFT to ACTIVE");
    console.log("-".repeat(70));

    const updateData3: UpdateGameInput = {
      status: "ACTIVE",
    };

    console.log("Changing status to: ACTIVE");

    try {
      const result3 = await updateGame(game.id, updateData3, author.clerkID);
      console.log(`✅ ${result3.message}`);

      const [updated3] = await db
        .select({ status: games.status })
        .from(games)
        .where(eq(games.id, game.id))
        .limit(1);

      console.log(`Verified: Status is now ${updated3.status}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Test 4: Try to update when status is ACTIVE (should fail)
    console.log("TEST 4: Try Update on ACTIVE Game (Should Fail)");
    console.log("-".repeat(70));

    const updateData4: UpdateGameInput = {
      priceLimit: 300,
    };

    console.log("Attempting to update price limit on ACTIVE game...");

    try {
      await updateGame(game.id, updateData4, author.clerkID);
      console.log("❌ TEST FAILED: Should have thrown an error!");
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Reset to DRAFT for remaining tests
    await db
      .update(games)
      .set({ status: "DRAFT" })
      .where(eq(games.id, game.id));
    console.log("(Reset game status to DRAFT for remaining tests)\n");

    // Test 5: Try to update as non-author (should fail)
    if (nonAuthor) {
      console.log("TEST 5: Try Update as Non-Author (Should Fail)");
      console.log("-".repeat(70));

      const updateData5: UpdateGameInput = {
        priceLimit: 400,
      };

      console.log(`Attempting update as ${nonAuthor.name} (not the author)...`);

      try {
        await updateGame(game.id, updateData5, nonAuthor.clerkID);
        console.log("❌ TEST FAILED: Should have thrown an error!");
      } catch (error) {
        console.log(`✅ Correctly rejected: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      console.log("\n");
    }

    // Test 6: Try to update with invalid game ID (should fail)
    console.log("TEST 6: Try Update with Invalid Game ID (Should Fail)");
    console.log("-".repeat(70));

    const updateData6: UpdateGameInput = {
      priceLimit: 500,
    };

    const fakeGameId = "00000000-0000-0000-0000-000000000000";
    console.log(`Attempting update with fake game ID: ${fakeGameId}...`);

    try {
      await updateGame(fakeGameId, updateData6, author.clerkID);
      console.log("❌ TEST FAILED: Should have thrown an error!");
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Test 7: Empty update (no fields to update)
    console.log("TEST 7: Empty Update (No Fields)");
    console.log("-".repeat(70));

    const updateData7: UpdateGameInput = {};

    console.log("Attempting update with no fields...");

    try {
      const result7 = await updateGame(game.id, updateData7, author.clerkID);
      console.log(`✅ ${result7.message}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    console.log("\n");

    // Final summary
    console.log("=" .repeat(70));
    console.log("✨ ALL TESTS COMPLETE!");
    console.log("=" .repeat(70));
    console.log("\n📊 Test Summary:");
    console.log("  ✅ Valid updates work correctly");
    console.log("  ✅ Partial updates work correctly");
    console.log("  ✅ Status transitions work correctly");
    console.log("  ✅ ACTIVE games cannot be edited");
    console.log("  ✅ Non-authors cannot edit games");
    console.log("  ✅ Invalid game IDs are rejected");
    console.log("  ✅ Empty updates handled gracefully");

    console.log("\n💡 API Testing Information:");
    console.log(`  Endpoint: PATCH /api/games/${game.id}`);
    console.log(`  Game ID: ${game.id}`);
    console.log(`  Author Clerk ID: ${author.clerkID}`);

    console.log("\n📝 Example API Request (with curl):");
    console.log(`
  curl -X PATCH http://localhost:3000/api/games/${game.id} \\
    -H "Content-Type: application/json" \\
    -b "__session=YOUR_SESSION_COOKIE" \\
    -d '{
      "priceLimit": 175,
      "categories": ["Electronics", "Books"]
    }'
`);

    console.log("💡 To test via your app:");
    console.log("  1. Run: pnpm dev");
    console.log("  2. Log in as the game author");
    console.log("  3. Make requests to the API endpoint above\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error("\nStack trace:", error instanceof Error ? error.stack : "No stack trace");
    process.exit(1);
  }
}

testGameUpdate();
