import { Enemy } from './Enemy';

export class ChronoWraith extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 64;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
