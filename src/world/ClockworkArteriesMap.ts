import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { SteamVent } from '../entities/RhythmHazard';
import { SVGAssets } from './SVGAssets';

export class ClockworkArteriesMap extends GameMap {
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
        // 1. Base Floor (Iron Plate - Dark Grey)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', '800');
        rect.setAttribute('height', '600');
        rect.setAttribute('fill', '#151515');
        this.el.appendChild(rect);

        // 2. Pipes and Grills
        for (let i = 0; i < 5; i++) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const x = 100 + i * 150;
            path.setAttribute('d', `M${x},0 L${x},600`);
            path.setAttribute('stroke', '#333');
            path.setAttribute('stroke-width', '20');
            this.el.appendChild(path);
        }

        // 3. Ambient Gears (Static/Visual)
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const r = 30 + Math.random() * 50;
            const gear = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gear.setAttribute('d', SVGAssets.gear(x, y, r, 12));
            gear.setAttribute('fill', '#222');
            gear.setAttribute('opacity', '0.5');
            this.el.appendChild(gear);
        }

        // 4. Rhythm Hazards (Steam Vents)
        const game = Game.getInstance();
        if (game && game.entityManager) {
            const positions = [
                { x: 200, y: 300 },
                { x: 400, y: 150 },
                { x: 400, y: 450 },
                { x: 600, y: 300 }
            ];

            positions.forEach(pos => {
                game.entityManager.add(new SteamVent(pos.x, pos.y, game.player));
            });
        }
    }

    destroy() {
        this.el.remove();
    }
}
