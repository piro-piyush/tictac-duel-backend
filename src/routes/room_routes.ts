import { Router } from 'express';

import RoomController from '../controllers/room_controller.js';

const roomRoutes = Router();

// =============================================================================
// Room Routes
// =============================================================================

roomRoutes.get('/', RoomController.getRooms);

roomRoutes.get('/public', RoomController.getPublicRooms);

roomRoutes.get('/:id', RoomController.getRoom);

roomRoutes.post('/', RoomController.createRoom);

roomRoutes.post('/join', RoomController.joinRoom);

roomRoutes.delete('/:id', RoomController.deleteRoom);

export default roomRoutes;