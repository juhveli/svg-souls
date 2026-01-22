import { Entity } from '../Entity';

export class Enemy extends Entity {
    // TODO: Implement missing Sub-Bosses: The Trash-Compactor (W1), The Glass-Blower Deity (W2), The Gatekeeper (W5).
    constructor(x: number, y: number, svgString?: string) {
        super(x, y, svgString);
    }
}
