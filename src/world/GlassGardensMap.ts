import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { CrystalFlora } from '../entities/Flora';
import { PorcelainDancer } from '../entities/enemies/PorcelainDancer';
import { NPCEntity } from '../entities/NPCEntity';

export class GlassGardensMap extends GameMap {
    el: SVGGElement;

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
            const tickTockSVG = `<g class="npc"><circle cx="0" cy="0" r="15" fill="#8af" stroke="#fff" stroke-width="2" /><circle cx="-4" cy="-3" r="2" fill="#000" /><circle cx="4" cy="-3" r="2" fill="#000" /><path d="M-5,5 Q0,10 5,5" stroke="#000" stroke-width="1" fill="none" /><line x1="0" y1="15" x2="0" y2="30" stroke="#8af" stroke-width="3" /></g>`;
            const tickTockDialogue = [
                "One, two. One, two. You're off beat, little soft one.",
                "They say the Carillon will ring again. But I like the quiet between the ticks.",
                "Do you know why the dancers broke? They couldn't hear the silence.",
                "You don't reflect. How curious. Are you even real?"
            ];
            game.entityManager.add(new NPCEntity(400, 500, tickTockSVG, "Tick-Tock", tickTockDialogue, game.player));
        }
    }

    destroy() {
        this.el.remove();
    }
}
