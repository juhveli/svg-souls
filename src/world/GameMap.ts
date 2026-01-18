/**
 * Base Interface for Game Maps
 * Using an abstract class ensures a runtime presence to avoid ESM export errors
 */
export abstract class GameMap {
    abstract el: SVGGElement;
    abstract destroy(): void;
}
