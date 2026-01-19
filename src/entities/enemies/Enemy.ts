import { Entity } from '../Entity';

export class Enemy extends Entity {
    constructor(x: number, y: number, svgString?: string) {
        super(x, y, svgString);
    }
}
