import { pgTable, text, integer, uuid, timestamp, pgEnum, numeric, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for game status
export const gameStatusEnum = pgEnum('game_status', ['CANCELLED', 'DRAFT', 'ACTIVE', 'COMPLETED']);
export const inviteStatusEnum = pgEnum('invite_status', ['PENDING', 'ACCEPTED', 'DECLINED']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkID: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  age: integer('age').notNull(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  giftPreferences: text('gift_preferences').array(),
  clothingSize: text('clothing_size'),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
});

export const gameInvites = pgTable('game_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameID: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  invitedAt: timestamp('invited_at').defaultNow(),
  status: inviteStatusEnum(),
});

// Games table
export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorID: uuid('author_id').notNull().references(() => users.id),
  priceLimit: numeric('price_limit'),
  deadline: timestamp('deadline').notNull(),
  status: gameStatusEnum('status').notNull().default('DRAFT'),
  categories: text('categories').array(),
});

// GameParticipants junction table
export const gameParticipants = pgTable('game_participants', {
  gameID: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userID: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: {
    columns: [table.gameID, table.userID],
  },
}));

// UserMatches table
export const gameUserMatches = pgTable('game_user_matches', {
  gameID: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  buyerID: uuid('user_id').notNull().references(() => users.id),
  recipientID: uuid('target_id').notNull().references(() => users.id),
}, (table) => ({
  pk: {
    columns: [table.gameID, table.buyerID],
  },
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  gamesAuthored: many(games),
  gameParticipations: many(gameParticipants),
  matches: many(gameUserMatches),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  author: one(users, {
    fields: [games.authorID],
    references: [users.id],
  }),
  participants: many(gameParticipants),
  matches: many(gameUserMatches),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameID],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userID],
    references: [users.id],
  }),
}));

export const userMatchesRelations = relations(gameUserMatches, ({ one }) => ({
  game: one(games, {
    fields: [gameUserMatches.gameID],
    references: [games.id],
  }),
  giver: one(users, {
    fields: [gameUserMatches.buyerID],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [gameUserMatches.recipientID],
    references: [users.id],
  }),
}));

