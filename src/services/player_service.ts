import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { players } from '../db/schema.js';
import type { Player } from '../db/types.js';

class PlayerService {
    // ===========================================================================
    // Create Player
    // ===========================================================================

    async createPlayer(): Promise<Player> {
        const [player] = await db
            .insert(players)
            .values({})
            .returning();

        if (!player) {
            throw new Error('Failed to create player');
        }

        return player;
    }

    // ===========================================================================
    // Get Player
    // ===========================================================================

    async getPlayer(
        id: string,
    ): Promise<Player | null> {
        const [player] = await db
            .select()
            .from(players)
            .where(eq(players.id, id))
            .limit(1);

        return player ?? null;
    }

    // ===========================================================================
    // Get Players
    // ===========================================================================

    async getPlayers(): Promise<Player[]> {
        return db
            .select()
            .from(players);
    }

    // ===========================================================================
    // Delete Player
    // ===========================================================================

    async deletePlayer(
        id: string,
    ): Promise<Player | null> {
        const [player] = await db
            .delete(players)
            .where(eq(players.id, id))
            .returning();

        return player ?? null;
    }
}

export default new PlayerService();