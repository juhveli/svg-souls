import { Enemy } from './Enemy';

export class Vitria extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 80;
        this.textureId = 'boss_vitria'; // TODO: Replace with high-quality 16-bit PNG asset
    }
}
