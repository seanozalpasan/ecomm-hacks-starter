CREATE TABLE "saved_gift_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"giver_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"title" text NOT NULL,
	"price" text NOT NULL,
	"price_usd" numeric,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"image_url" text,
	"images" text[],
	"source_query" text NOT NULL,
	"category" text,
	"delivery_date" text,
	"days_to_ship" integer,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_gift_suggestions" ADD CONSTRAINT "saved_gift_suggestions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_gift_suggestions" ADD CONSTRAINT "saved_gift_suggestions_giver_id_users_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_gift_suggestions" ADD CONSTRAINT "saved_gift_suggestions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;