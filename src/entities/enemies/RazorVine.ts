import { Enemy } from './Enemy';

export class RazorVine extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
