import { Enemy } from './Enemy';

export class RustMite extends Enemy {
    constructor(x: number, y: number) {
        super(x, y);
        this.width = 16;
        this.height = 16;
        this.textureId = 'character_placeholder'; // TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.
    }
}
