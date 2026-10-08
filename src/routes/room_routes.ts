
import { Router } from "express";

import RoomController from "../controllers/room_controller.js";

const roomRoutes = Router();

roomRoutes.get(
    "/public",
    RoomController.getPublicRooms,
);

export default roomRoutes;
