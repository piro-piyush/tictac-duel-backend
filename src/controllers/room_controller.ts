
import type {
  Response as ExpressResponse,
  Request,
} from "express";
import Response from "../core/utils/response.js";
import { roomService } from "../services/room_service.js";

class RoomController {
  async getPublicRooms(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const rooms = roomService.getPublicRooms();

    return Response.success(res, {
      message: "Public rooms retrieved successfully",
      data: rooms,
    });
  }
}

export default new RoomController();