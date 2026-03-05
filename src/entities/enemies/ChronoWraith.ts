import { Enemy } from './Enemy';

export class ChronoWraith extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 64;
        this.textureId = 'enemy_wraith'; // TODO: Replace with high-quality 16-bit PNG asset
    }
}
