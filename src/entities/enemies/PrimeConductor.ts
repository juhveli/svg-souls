import { Enemy } from './Enemy';

export class PrimeConductor extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 100;
        this.height = 120;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
