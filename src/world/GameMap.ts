import { Game } from '../engine/Game';

/**
 * Base Interface for Game Maps
 * Using an abstract class ensures a runtime presence to avoid ESM export errors
 */
export abstract class GameMap {
    abstract el: SVGGElement;
    abstract width: number;
    abstract height: number;
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
