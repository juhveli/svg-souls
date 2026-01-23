import { SVGAssets } from './SVGAssets';
import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { SilenceGuard } from '../entities/enemies/SilenceGuard';
import { BookMimic } from '../entities/enemies/BookMimic';

export class HushedHallsMap extends GameMap {
    el: SVGGElement;
    width: number = 1600;
    height: number = 600;

    constructor() {
        super();
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.id = 'map-layer';

        this.generateGeometry();
        this.spawnEntities();

        // Add to World
        const world = document.getElementById('world-layer');
        if (world) {
            // Insert before entities so they walk on top
            world.insertBefore(this.el, world.firstChild);
        }
    }

    private generateGeometry() {
        // 1. Background (Void of Silence)
        this.addRect(0, 0, this.width, this.height, '#050505');

        // 2. Floor (Polished Dark Stone)
        this.addRect(0, 500, this.width, 100, '#111');

        // 3. Background Bookshelves (The Archive)
        // Repeat every ~250px
        for (let x = 50; x < this.width; x += 250) {
            const h = 300 + Math.random() * 100;
            const w = 150;
            const y = 500 - h;

            const shelfPath = SVGAssets.bookshelf(x, y, w, h);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', shelfPath);
            path.setAttribute('fill', '#151515'); // Very dark grey
            path.setAttribute('stroke', '#2a2a2a');
            path.setAttribute('stroke-width', '1');
            this.el.appendChild(path);
        }

        // 4. Pillars (imposing structure)
        for (let x = 0; x < this.width; x += 400) {
             const h = 550;
             const w = 40;
             const y = 0; // Ceiling to floor

             const pillarPath = SVGAssets.pillar(x + 100, y, w, h);
             const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
             path.setAttribute('d', pillarPath);
             path.setAttribute('fill', '#222');
             path.setAttribute('stroke', '#111');
             path.setAttribute('stroke-width', '2');
             this.el.appendChild(path);
        }

        // Walls
        this.addRect(0, 0, 20, 600, '#00000088');
        this.addRect(this.width - 20, 0, 20, 600, '#00000088');
    }

    private spawnEntities() {
        // TODO: Implement 'Book Swarm' hazard in Hushed Halls (flying books that attack in groups).
        const game = Game.getInstance();
        if (!game || !game.entityManager) return;

        // Spawn Silence Guards
        game.entityManager.add(new SilenceGuard(400, 500));
        game.entityManager.add(new SilenceGuard(800, 500));
        game.entityManager.add(new SilenceGuard(1200, 500));
        game.entityManager.add(new SilenceGuard(1500, 500));

        // Spawn Book Mimics (near shelves)
        game.entityManager.add(new BookMimic(200, 480));
        game.entityManager.add(new BookMimic(600, 480));
        game.entityManager.add(new BookMimic(1000, 480));
        game.entityManager.add(new BookMimic(1350, 480));
    }

    private addRect(x: number, y: number, w: number, h: number, color: string) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', w.toString());
        rect.setAttribute('height', h.toString());
        rect.setAttribute('fill', color);
        this.el.appendChild(rect);
    }

    destroy() {
        this.el.remove();
    }
}
