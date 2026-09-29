import { Router } from "express";
import PlayerController from "../controllers/player_controller.js";

const playerRoutes = Router();

// ============================================================================
// CREATE PLAYER
// ============================================================================

playerRoutes.post(
    "/",
    PlayerController.create.bind(PlayerController),
);

// ============================================================================
// GET PLAYER
// ============================================================================

playerRoutes.get(
    "/:id",
    PlayerController.getPlayer.bind(PlayerController),
);

// ============================================================================
// GET PLAYERS
// ============================================================================

playerRoutes.get(
    "/",
    PlayerController.getPlayers.bind(PlayerController),
);

// ============================================================================
// DELETE PLAYER
// ============================================================================

playerRoutes.delete(
    "/:id",
    PlayerController.deletePlayer.bind(PlayerController),
);

export default playerRoutes;