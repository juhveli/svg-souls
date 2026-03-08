import { Entity } from './Entity';

export class WorldItem extends Entity {
    itemId: string;

    constructor(x: number, y: number, itemId: string) {
        super(x, y);
        this.itemId = itemId;
        this.width = 32;
        this.height = 32;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
