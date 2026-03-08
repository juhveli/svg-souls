import { Enemy } from './Enemy';

export class Banshee extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 48;
        this.height = 48;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
