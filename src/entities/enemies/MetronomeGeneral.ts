import { Enemy } from './Enemy';

export class MetronomeGeneral extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 80;
        this.height = 80;
    }
}
