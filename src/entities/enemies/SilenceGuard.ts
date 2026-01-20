import { Enemy } from './Enemy';

export class SilenceGuard extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 64;
    }
}
