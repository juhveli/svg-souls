import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { CrystalFlora } from '../entities/Flora';
import { PorcelainDancer } from '../entities/enemies/PorcelainDancer';
import { NPCEntity } from '../entities/NPCEntity';

export class GlassGardensMap extends GameMap {
    el: SVGGElement;
    width: number = 800;
    height: number = 600;

    constructor() {
        super();
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.id = 'map-layer';

        this.generateGeometry();

        // Add to World
        const world = document.getElementById('world-layer');
        if (world) {
            world.insertBefore(this.el, world.firstChild);
        }
    }

    private generateGeometry() {
        // 1. Base Floor (Silica Sand - Dark Teal)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', '800');
        rect.setAttribute('height', '600');
        rect.setAttribute('fill', '#0a1a1f');
        this.el.appendChild(rect);

        // 2. Crystal Flora (Procedural Entities)
        const game = Game.getInstance();
        for (let i = 0; i < 20; i++) {
            const x = 50 + Math.random() * 700;
            const y = 50 + Math.random() * 500;

            if (game && game.entityManager) {
                game.entityManager.add(new CrystalFlora(x, y));
            }

            // Reflection Pool puddles (Visual only)
            if (i % 4 === 0) {
                const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                ellipse.setAttribute('cx', (x + 30).toString());
                ellipse.setAttribute('cy', (y + 10).toString());
                ellipse.setAttribute('rx', '30');
                ellipse.setAttribute('ry', '8');
                ellipse.setAttribute('fill', '#4ff');
                ellipse.setAttribute('opacity', '0.1');
                this.el.appendChild(ellipse);
            }
        }

        // 3. Porcelain Dancers (Enemies)
        if (game && game.entityManager) {
            for (let i = 0; i < 4; i++) {
                const x = 150 + Math.random() * 500;
                const y = 100 + Math.random() * 400;
                game.entityManager.add(new PorcelainDancer(x, y, game.player));
            }

            // 4. NPC: Tick-Tock the Broken Bard
            game.entityManager.add(new NPCEntity(400, 500, "tick_tock", game.player));
        }
    }

    destroy() {
        this.el.remove();
    }
}
