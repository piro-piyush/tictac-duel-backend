import type {
  Response as ExpressResponse,
  Request,
} from 'express';
import Response from '../core/utils/response.js';
import PlayerService from '../services/player_service.js';
import {
  playerIdValidator,
} from '../validators/player_validator.js';

class PlayerController {
  // ===========================================================================
  // Create Player
  // ===========================================================================

  async create(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const player = await PlayerService.createPlayer();

    return Response.created(res, {
      message: 'Player created successfully',
      data: player,
    });
  }

  // ===========================================================================
  // Get Player
  // ===========================================================================

  async getPlayer(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const id = this._validatePlayerId(
      req.params.id,
    );

    if (!id) {
      return Response.badRequest(
        res,
        'Invalid player ID',
      );
    }

    const player = await PlayerService.getPlayer(id);

    if (!player) {
      return Response.notFound(
        res,
        'Player not found',
      );
    }

    return Response.success(res, {
      message: 'Player retrieved successfully',
      data: player,
    });
  }

  // ===========================================================================
  // Get Players
  // ===========================================================================

  async getPlayers(
    _req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const players = await PlayerService.getPlayers();

    return Response.success(res, {
      message: 'Players retrieved successfully',
      data: players,
    });
  }

  // ===========================================================================
  // Delete Player
  // ===========================================================================

  async deletePlayer(
    req: Request,
    res: ExpressResponse,
  ): Promise<ExpressResponse> {
    const id = this._validatePlayerId(
      req.params.id,
    );

    if (!id) {
      return Response.badRequest(
        res,
        'Invalid player ID',
      );
    }

    const player = await PlayerService.deletePlayer(id);

    if (!player) {
      return Response.notFound(
        res,
        'Player not found',
      );
    }

    return Response.success(res, {
      message: 'Player deleted successfully',
      data: player,
    });
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  private _validatePlayerId(
    value: unknown,
  ): string | null {
    const result = playerIdValidator.safeParse(value);

    return result.success
      ? result.data
      : null;
  }
}

export default new PlayerController();