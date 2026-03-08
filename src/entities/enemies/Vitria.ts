import { Enemy } from './Enemy';

export class Vitria extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 80;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
