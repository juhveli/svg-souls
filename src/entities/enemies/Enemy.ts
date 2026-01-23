import { Entity } from '../Entity';

export class Enemy extends Entity {
    // TODO: Implement missing Sub-Boss: The Gatekeeper (W5).
    // TODO: Add unique death animations/particle bursts for different enemy types.
    constructor(x: number, y: number, svgString?: string) {
        super(x, y, svgString);
    }
}
