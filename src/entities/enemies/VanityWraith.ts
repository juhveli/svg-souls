import { Enemy } from './Enemy';

export class VanityWraith extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 48;
        this.textureId = 'enemy_wraith'; // TODO: Replace with high-quality 16-bit PNG asset
    }
}
