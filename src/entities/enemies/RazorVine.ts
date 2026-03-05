import { Enemy } from './Enemy';

export class RazorVine extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.textureId = 'enemy_vine'; // TODO: Replace with high-quality 16-bit PNG asset
    }
}
