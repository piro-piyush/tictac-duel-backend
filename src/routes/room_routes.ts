import { Router } from "express";
import RoomController from "../controllers/room_controller.js";

const roomRoutes = Router();

// ============================================================================
// GET ROOMS
// ============================================================================

roomRoutes.get(
  "/",
  RoomController.getRooms.bind(RoomController),
);

// ============================================================================
// GET PUBLIC ROOMS
// ============================================================================

roomRoutes.get(
  "/public",
  RoomController.getPublicRooms.bind(RoomController),
);

// ============================================================================
// GET ROOM
// ============================================================================

roomRoutes.get(
  "/:id",
  RoomController.getRoom.bind(RoomController),
);

// ============================================================================
// CREATE ROOM
// ============================================================================

roomRoutes.post(
  "/",
  RoomController.createRoom.bind(RoomController),
);

// ============================================================================
// JOIN ROOM
// ============================================================================

roomRoutes.post(
  "/join",
  RoomController.joinRoom.bind(RoomController),
);

// ============================================================================
// DELETE ROOM
// ============================================================================

roomRoutes.delete(
  "/:id",
  RoomController.deleteRoom.bind(RoomController),
);

export default roomRoutes;