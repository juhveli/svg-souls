import { Enemy } from './Enemy';

export class PrimeConductor extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 100;
        this.height = 120;
        this.typeID = 18;
    }
}
