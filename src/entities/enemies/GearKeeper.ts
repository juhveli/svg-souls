import { Enemy } from './Enemy';

export class GearKeeper extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 48;
        this.height = 48;
    }
}
