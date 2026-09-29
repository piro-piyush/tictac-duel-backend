import type {
  Response as ExpressResponse,
  Request,
} from "express";
import Logger from "../core/utils/logger.js";
import Response from "../core/utils/response.js";
import PlayerService from "../services/player_service.js";
import { playerIdValidator } from "../validators/player_validator.js";

class PlayerController {
  // ===========================================================================
  // CREATE PLAYER
  // ===========================================================================

  async create(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const player = await PlayerService.createPlayer();

      return Response.success(res, {
        message: "Player created",
        data: player,
      });
    } catch (error: unknown) {
      return this._handleError(
        res,
        "Failed to create player",
        error,
      );
    }
  }

  // ===========================================================================
  // GET PLAYER
  // ===========================================================================

  async getPlayer(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const id = this._validatePlayerId(req.params.id);

      if (!id) {
        return Response.badRequest(res, "Invalid player ID");
      }

      const player = await PlayerService.getPlayer(id);

      if (!player) {
        return Response.notFound(res, "Player not found");
      }

      return Response.success(res, {
        message: "Player found",
        data: player,
      });
    } catch (error: unknown) {
      return this._handleError(
        res,
        "Failed to get player",
        error,
      );
    }
  }

  // ===========================================================================
  // GET PLAYERS
  // ===========================================================================

  async getPlayers(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const players = await PlayerService.getPlayers();

      return Response.success(res, {
        message: "Players found",
        data: players,
      });
    } catch (error: unknown) {
      return this._handleError(
        res,
        "Failed to get players",
        error,
      );
    }
  }

  // ===========================================================================
  // DELETE PLAYER
  // ===========================================================================

  async deletePlayer(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    try {
      const id = this._validatePlayerId(req.params.id);

      if (!id) {
        return Response.badRequest(res, "Invalid player ID");
      }

      const player = await PlayerService.deletePlayer(id);

      if (!player) {
        return Response.notFound(res, "Player not found");
      }

      return Response.success(res, {
        message: "Player deleted",
        data: player,
      });
    } catch (error: unknown) {
      return this._handleError(
        res,
        "Failed to delete player",
        error,
      );
    }
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private _validatePlayerId(
    value: unknown,
  ): string | null {
    const result = playerIdValidator.safeParse(value);

    return result.success ? result.data : null;
  }

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  private _handleError(
    res: ExpressResponse,
    message: string,
    error: unknown,
  ): ExpressResponse {
    Logger.error(message, error);

    return Response.error(res, {
      message: this._getErrorMessage(error, message),
    });
  }

  private _getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    return error instanceof Error
      ? error.message
      : fallback;
  }
}

export default new PlayerController();