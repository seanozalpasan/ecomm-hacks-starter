import { db } from "@/lib/db/db";
import { users, games } from "@/lib/db/schema";

// Generate 100 diverse test users
const names = [
  "Alice Johnson", "Bob Smith", "Charlie Davis", "Diana Martinez", "Evan Wilson",
  "Fiona Chen", "George Brown", "Hannah Lee", "Isaac Taylor", "Julia Anderson",
  "Kevin Thomas", "Laura White", "Michael Harris", "Nina Jackson", "Oscar Martin",
  "Patricia Thompson", "Quinn Garcia", "Rachel Robinson", "Samuel Clark",
  "Tara Rodriguez", "Uma Lewis", "Victor Walker", "Wendy Hall", "Xavier Allen",
  "Yara Young", "Zachary King", "Aria Wright", "Blake Lopez", "Chloe Hill",
  "Dylan Scott", "Emma Green", "Felix Adams", "Grace Baker", "Henry Nelson",
  "Iris Carter", "Jack Mitchell", "Kelly Perez", "Liam Roberts", "Maya Turner",
  "Noah Phillips", "Olivia Campbell", "Parker Evans", "Quinn Edwards", "Riley Collins",
  "Sophia Stewart", "Tyler Morris", "Unity Rogers", "Violet Reed", "Wesley Cook",
  "Xander Morgan", "Yasmin Bell", "Zoe Murphy", "Adrian Bailey", "Bella Rivera",
  "Carter Cooper", "Daisy Richardson", "Ethan Cox", "Faith Howard", "Grayson Ward",
  "Harper Torres", "Ivan Peterson", "Jade Gray", "Kyle Ramirez", "Luna James",
  "Mason Watson", "Nora Brooks", "Owen Kelly", "Piper Sanders", "Quincy Price",
  "Ruby Bennett", "Sebastian Wood", "Tessa Barnes", "Ulysses Ross", "Vera Henderson",
  "Wade Coleman", "Willow Jenkins", "Xyla Perry", "York Powell", "Zara Long",
  "Austin Patterson", "Brooke Hughes", "Cole Flores", "Delilah Washington", "Eli Butler",
  "Freya Simmons", "Graham Foster", "Haven Gonzales", "Isaiah Bryant", "Josie Alexander",
  "Knox Russell", "Layla Griffin", "Miles Hayes", "Natalie Myers", "Orion Ford",
  "Penelope Hamilton", "Quentin Graham", "Reagan Sullivan", "Silas Wallace", "Thea Woods",
  "Aiden Cruz",
];

const locations = [
  "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Chicago, IL",
  "Boston, MA", "Denver, CO", "Portland, OR", "Miami, FL", "Atlanta, GA",
  "Los Angeles, CA", "Phoenix, AZ", "Nashville, TN", "Philadelphia, PA", "San Diego, CA",
  "Dallas, TX", "Houston, TX", "Minneapolis, MN", "Detroit, MI", "Washington, DC",
  "Boulder, CO", "Raleigh, NC", "Charlotte, NC", "Salt Lake City, UT", "Columbus, OH",
  "Indianapolis, IN", "San Antonio, TX", "Jacksonville, FL", "Las Vegas, NV", "Kansas City, MO",
  "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Sacramento, CA",
  "Cleveland, OH", "Pittsburgh, PA", "Cincinnati, OH", "Oakland, CA", "Omaha, NE",
];

const giftPreferenceOptions = [
  "Books", "Tech Gadgets", "Coffee", "Sports", "Gaming", "Cooking",
  "Music", "Art", "Photography", "Fitness", "Travel", "Gardening",
  "Movies", "Board Games", "Craft Beer", "Wine", "Fashion", "Jewelry",
  "Home Decor", "Kitchen Tools", "Outdoor Gear", "Cycling", "Yoga",
  "Collectibles", "Vinyl Records", "Skincare", "Candles", "Plants",
  "Pet Supplies", "Comics", "Puzzles", "DIY Crafts", "Stationery",
];

const clothingSizes = ["XS", "S", "M", "L", "XL", "2XL"];

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const testUsers = Array.from({ length: 100 }, (_, i) => {
  const name = names[i];
  const firstName = name.split(" ")[0].toLowerCase();
  const num = String(i + 1).padStart(3, "0");

  return {
    clerkID: `clerk_test_${firstName}_${num}`,
    email: `${firstName}.test${num}@example.com`,
    name,
    age: Math.floor(Math.random() * 47) + 18, // Random age between 18-64
    location: locations[Math.floor(Math.random() * locations.length)],
    giftPreferences: getRandomItems(giftPreferenceOptions, 3),
    clothingSize: clothingSizes[Math.floor(Math.random() * clothingSizes.length)],
  };
});

async function seed() {
  try {
    console.log("🌱 Starting seed process...\n");

    // Create test users
    console.log("Creating test users...");
    const createdUsers = [];

    for (const userData of testUsers) {
      const [user] = await db.insert(users).values(userData).returning();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log(`\n📊 Created ${createdUsers.length} test users\n`);

    // Create a test game (author is the first user - Alice)
    console.log("Creating test game...");

    const [testGame] = await db
      .insert(games)
      .values({
        authorID: createdUsers[0].id,
        priceLimit: "50.00",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "DRAFT",
        categories: ["Electronics", "Books", "Home & Garden"],
      })
      .returning();

    console.log(`✅ Created game: ${testGame.id}`);
    console.log(`   Author: ${createdUsers[0].name}`);
    console.log(`   Status: ${testGame.status}`);
    console.log(`   Deadline: ${testGame.deadline.toLocaleDateString()}\n`);

    // Add all users as participants (including the author)
    console.log("Adding participants to game...");

    const { gameParticipants } = await import("@/lib/db/schema");

    for (const user of createdUsers) {
      await db.insert(gameParticipants).values({
        gameID: testGame.id,
        userID: user.id,
      });
      console.log(`✅ Added participant: ${user.name}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✨ SEED COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 Test Data Summary:");
    console.log(`   • Users created: ${createdUsers.length}`);
    console.log(`   • Game ID: ${testGame.id}`);
    console.log(`   • Author: ${createdUsers[0].name} (${createdUsers[0].id})`);
    console.log(`   • Participants: ${createdUsers.length}`);
    console.log("\n💡 Next steps:");
    console.log(`   1. Test game updates: pnpm db:test-update`);
    console.log(`   2. Run matching: pnpm db:test-match`);
    console.log(`   3. Clean up: pnpm db:cleanup`);
    console.log("\n🔑 Important IDs:");
    console.log(`   Game ID: ${testGame.id}`);
    console.log(`   Author ID: ${createdUsers[0].id}`);
    console.log(`   Author Clerk ID: ${createdUsers[0].clerkID}`);
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
