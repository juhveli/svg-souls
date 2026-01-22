import { Enemy } from './Enemy';

export class Cantor extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 100;
        this.typeID = 16;
    }
}
