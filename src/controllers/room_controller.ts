import type {
  Response as ExpressResponse,
  Request
} from 'express';
import Response from '../core/utils/response.js';
import RoomService from '../services/room_service.js';
import {
  createRoomValidator,
  joinRoomValidator,
  uuidValidator,
} from '../validators/room_validator.js';

class RoomController {
  // ===========================================================================
  // Get Rooms
  // ===========================================================================

  async getRooms(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const rooms = await RoomService.getRooms();

    return Response.success(res, {
      message: 'Rooms retrieved successfully',
      data: rooms,
    });
  }

  // ===========================================================================
  // Get Public Rooms
  // ===========================================================================

  async getPublicRooms(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const rooms = await RoomService.getPublicRooms();

    return Response.success(res, {
      message: 'Public rooms retrieved successfully',
      data: rooms,
    });
  }

  // ===========================================================================
  // Get Room
  // ===========================================================================

  async getRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const result = uuidValidator.safeParse(
      req.params.id,
    );

    if (!result.success) {
      return Response.badRequest(
        res,
        'Invalid room ID',
      );
    }

    const room = await RoomService.getRoom(
      result.data,
    );

    if (!room) {
      return Response.notFound(
        res,
        'Room not found',
      );
    }

    return Response.success(res, {
      message: 'Room retrieved successfully',
      data: room,
    });
  }

  // ===========================================================================
  // Create Room
  // ===========================================================================

  async createRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const result = createRoomValidator.safeParse(
      req.body,
    );

    if (!result.success) {
      return Response.badRequest(
        res,
        result.error.issues[0]?.message ??
        'Invalid request data',
      );
    }

    const room = await RoomService.createRoom(
      result.data,
    );

    return Response.created(res, {
      message: 'Room created successfully',
      data: room,
    });
  }

  // ===========================================================================
  // Join Room
  // ===========================================================================

  async joinRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const result = joinRoomValidator.safeParse(
      req.body,
    );

    if (!result.success) {
      return Response.badRequest(
        res,
        result.error.issues[0]?.message ??
        'Invalid request data',
      );
    }

    const room = await RoomService.joinRoom(
      result.data,
    );

    return Response.success(res, {
      message: 'Room joined successfully',
      data: room,
    });
  }

  // ===========================================================================
  // Delete Room
  // ===========================================================================

  async deleteRoom(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const result = uuidValidator.safeParse(
      req.params.id,
    );

    if (!result.success) {
      return Response.badRequest(
        res,
        'Invalid room ID',
      );
    }

    const deleted = await RoomService.deleteRoom(
      result.data,
    );

    if (!deleted) {
      return Response.notFound(
        res,
        'Room not found',
      );
    }

    return Response.noContent(res);
  }
}

export default new RoomController();