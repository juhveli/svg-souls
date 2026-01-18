/**
 * Base Interface for Game Maps
 * Using an abstract class ensures a runtime presence to avoid ESM export errors
 */
export abstract class GameMap {
    abstract el: SVGGElement;
    abstract width: number;
    abstract height: number;
    abstract destroy(): void;
}
