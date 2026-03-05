import { Entity } from './Entity';

export class WorldItem extends Entity {
    itemId: string;

    constructor(x: number, y: number, itemId: string) {
        super(x, y);
        this.itemId = itemId;
        this.width = 32;
        this.height = 32;
        this.textureId = this.getTextureIdFromItem(itemId);
    }

    private getTextureIdFromItem(itemId: string): string {
        // Default to a generic item texture or specific ones based on ID
        switch (itemId) {
            case 'vial_liquid_seconds':
                return 'item_vial';
            case 'wireframe_apple':
                return 'item_apple';
            case 'pixelated_tear':
                return 'item_tear';
            // TODO: Add particle effects (glitch sparks) for Glitch items when spawned.
            // TODO: Add more specific mappings for other items
            default:
                // Fallback to generic item sprite
                return 'item_generic';
        }
    }
}
