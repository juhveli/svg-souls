import { Entity } from './Entity';

export class WorldItem extends Entity {
    itemId: string;

    constructor(x: number, y: number, itemId: string) {
        super(x, y);
        this.itemId = itemId;
        this.width = 32;
        this.height = 32;
        this.typeID = this.getTypeIDFromItem(itemId);
    }

    private getTypeIDFromItem(itemId: string): number {
        switch (itemId) {
            case 'vial_liquid_seconds':
                return 20;
            case 'wireframe_apple':
                return 29;
            case 'pixelated_tear':
                return 30;
            // TODO: Add particle effects (glitch sparks) for Glitch items when spawned.
            // TODO: Add more specific mappings for other items
            default:
                // Fallback to generic Vial/Loot Bag if no specific ID exists
                // 20 is Vial, which is a safe generic 'item' look for now
                return 20;
        }
    }
}
