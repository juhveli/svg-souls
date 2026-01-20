import { Enemy } from './Enemy';

export class RustMite extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 16;
        this.height = 16;
    }
}
