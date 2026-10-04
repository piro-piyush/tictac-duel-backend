import { Router } from 'express';

import PlayerController from '../controllers/player_controller.js';

const playerRoutes = Router();

// =============================================================================
// Player Routes
// =============================================================================

playerRoutes.post(
    '/',
    PlayerController.create.bind(PlayerController),
);

playerRoutes.get(
    '/',
    PlayerController.getPlayers.bind(PlayerController),
);

playerRoutes.get(
    '/:id',
    PlayerController.getPlayer.bind(PlayerController),
);

playerRoutes.delete(
    '/:id',
    PlayerController.deletePlayer.bind(PlayerController),
);

export default playerRoutes;