CREATE TYPE "public"."player_symbol" AS ENUM('x', 'o');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('waiting', 'playing', 'result');--> statement-breakpoint
CREATE TYPE "public"."room_theme" AS ENUM('classic', 'inferno', 'cyber');--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"name" varchar(20) NOT NULL,
	"symbol" "player_symbol" NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"is_ready" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_players_room_player_unique" UNIQUE("room_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(6) NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"host_player_id" uuid NOT NULL,
	"theme" "room_theme" NOT NULL,
	"max_players" integer DEFAULT 2 NOT NULL,
	"max_rounds" integer DEFAULT 5 NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"round_status" "room_status" DEFAULT 'waiting' NOT NULL,
	"turn_player_id" uuid,
	"turn_index" integer DEFAULT 0 NOT NULL,
	"board_size" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_player_id_players_id_fk" FOREIGN KEY ("host_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_turn_player_id_players_id_fk" FOREIGN KEY ("turn_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;