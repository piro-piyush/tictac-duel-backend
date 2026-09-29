ALTER TABLE "room_players" ALTER COLUMN "is_ready" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "board_size" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "max_players" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_player_unique" UNIQUE("room_id","player_id");