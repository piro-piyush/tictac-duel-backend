import type {
  Response as ExpressResponse,
  Request,
} from "express";
import Logger from "../core/utils/logger.js";
import Response from "../core/utils/response.js";
import RoomService from "../services/room_service.js";
import {
  createRoomValidator,
  joinRoomValidator,
  uuidValidator,
} from "../validators/room_validator.js";

class RoomController {
  // ===========================================================================
  // GET ROOMS
  // ===========================================================================

  async getRooms(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const rooms = await RoomService.getRooms();

      return Response.success(res, {
        message: "Rooms found",
        data: rooms,
      });
    } catch (error: unknown) {
      Logger.error("Failed to get rooms", error);

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // GET PUBLIC ROOMS
  // ===========================================================================

  async getPublicRooms(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const rooms = await RoomService.getPublicRooms();

      return Response.success(res, {
        message: "Public rooms found",
        data: rooms,
      });
    } catch (error: unknown) {
      Logger.error("Failed to get public rooms", error);

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // GET ROOM
  // ===========================================================================

  async getRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const result = uuidValidator.safeParse(req.params.id);

      if (!result.success) {
        return Response.badRequest(
          res,
          "Invalid room ID",
        );
      }

      const room = await RoomService.getRoom(result.data);

      if (!room) {
        return Response.notFound(
          res,
          "Room not found",
        );
      }

      return Response.success(res, {
        message: "Room found",
        data: room,
      });
    } catch (error: unknown) {
      Logger.error("Failed to get room", error);

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // CREATE ROOM
  // ===========================================================================

  async createRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const result = createRoomValidator.safeParse(
        req.body,
      );

      if (!result.success) {
        return Response.badRequest(
          res,
          result.error.issues[0]?.message ??
          "Invalid request data",
        );
      }

      const room = await RoomService.createRoom(
        result.data,
      );

      return Response.created(res, {
        message: "Room created successfully",
        data: room,
      });
    } catch (error: unknown) {
      Logger.error(
        "Failed to create room",
        error,
      );

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // JOIN ROOM
  // ===========================================================================

  async joinRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const result = joinRoomValidator.safeParse(
        req.body,
      );

      if (!result.success) {
        return Response.badRequest(
          res,
          result.error.issues[0]?.message ??
          "Invalid request data",
        );
      }

      const room = await RoomService.joinRoom(
        result.data,
      );

      return Response.success(res, {
        message: "Room joined successfully",
        data: room,
      });
    } catch (error: unknown) {
      Logger.error(
        "Failed to join room",
        error,
      );

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // DELETE ROOM
  // ===========================================================================

  async deleteRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const result = uuidValidator.safeParse(
        req.params.id,
      );

      if (!result.success) {
        return Response.badRequest(
          res,
          "Invalid room ID",
        );
      }

      const room = await RoomService.deleteRoom(
        result.data,
      );

      if (!room) {
        return Response.notFound(
          res,
          "Room not found",
        );
      }

      return Response.success(res, {
        message: "Room deleted successfully",
        data: room,
      });
    } catch (error: unknown) {
      Logger.error(
        "Failed to delete room",
        error,
      );

      return Response.error(res, {
        message: this._getErrorMessage(error),
      });
    }
  }

  // ===========================================================================
  // PRIVATE: ERROR MESSAGE
  // ===========================================================================

  private _getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "An unexpected error occurred";
  }
}

export default new RoomController();