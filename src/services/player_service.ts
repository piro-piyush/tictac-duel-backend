import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { players } from "../db/schema.js";

class PlayerService {
    // ===========================================================================
    // CREATE PLAYER
    // ===========================================================================

    async createPlayer() {
        const [player] = await db
            .insert(players)
            .values({})
            .returning();

        if (!player) {
            throw new Error("Failed to create player");
        }

        return player;
    }

    // ===========================================================================
    // GET PLAYER
    // ===========================================================================

    async getPlayer(id: string) {
        const [player] = await db
            .select()
            .from(players)
            .where(eq(players.id, id))
            .limit(1);

        return player ?? null;
    }

    // ===========================================================================
    // GET PLAYERS
    // ===========================================================================

    async getPlayers() {
        return db
            .select()
            .from(players);
    }

    // ===========================================================================
    // DELETE PLAYER
    // ===========================================================================

    async deletePlayer(id: string) {
        const [player] = await db
            .delete(players)
            .where(eq(players.id, id))
            .returning();

        return player ?? null;
    }
}

export default new PlayerService();