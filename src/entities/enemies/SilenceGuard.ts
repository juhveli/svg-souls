import { Enemy } from './Enemy';

export class SilenceGuard extends Enemy {
    // TODO: Implement Silence Guard mechanics (Elite Enemy for World 4) to match the lore description.
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 64;
        this.typeID = 15;
    }
}
