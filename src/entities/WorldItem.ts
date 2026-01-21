import { Entity } from './Entity';

export class WorldItem extends Entity {
    itemId: string;

    constructor(x: number, y: number, itemId: string) {
        super(x, y);
        this.itemId = itemId;
        this.width = 32;
        this.height = 32;
        this.typeID = 0; // Will be assigned by Renderer or manually
    }
}
