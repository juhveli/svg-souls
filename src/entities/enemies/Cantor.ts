import { Enemy } from './Enemy';

export class Cantor extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 100;
        this.textureId = 'boss_cantor'; // TODO: Replace with high-quality 16-bit PNG asset
    }
}
