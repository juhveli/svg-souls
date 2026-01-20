import { Enemy } from './Enemy';

export class RustDragon extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 128;
        this.height = 64;
    }
}
