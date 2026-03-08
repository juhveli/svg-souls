import { Game } from '../engine/Game';

export interface TileData {
    x: number;
    y: number;
    z: number;
    textureId: string;
}

/**
 * Base Interface for Game Maps
 * Using an abstract class ensures a runtime presence to avoid ESM export errors
 */
export abstract class GameMap {
    abstract width: number;
    abstract height: number;

    // Isometric Tile Map Data
    public tiles: TileData[] = [];

    abstract destroy(): void;

    /**
     * Spawns entities specific to this map.
     * Called after the map is loaded and previous entities are cleared.
     */
    abstract spawnEntities(game: Game): void;

    /**
     * Optional update loop for map-specific logic (e.g. dynamic spawning)
     */
    update(_dt: number, _game: Game): void {}
}
