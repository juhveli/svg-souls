import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { SteamVent } from '../entities/RhythmHazard';
import { SVGAssets } from './SVGAssets';
import { SteamMarshal } from '../entities/enemies/SteamMarshal';
import { GearKeeper } from '../entities/enemies/GearKeeper';
import { MetronomeGeneral } from '../entities/enemies/MetronomeGeneral';

export class ClockworkArteriesMap extends GameMap {
    el: SVGGElement;
    width: number = 1600;
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
        // 1. Base Floor (Iron Plate - Dark Grey)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', '1600');
        rect.setAttribute('height', '600');
        rect.setAttribute('fill', '#151515');
        this.el.appendChild(rect);

        // 2. Pipes and Grills (Expanded)
        for (let i = 0; i < 10; i++) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const x = 100 + i * 150;
            path.setAttribute('d', `M${x},0 L${x},600`);
            path.setAttribute('stroke', '#333');
            path.setAttribute('stroke-width', '20');
            this.el.appendChild(path);
        }

        // 3. Ambient Gears (Static/Visual)
        for (let i = 0; i < 16; i++) {
            const x = Math.random() * 1600;
            const y = Math.random() * 600;
            const r = 30 + Math.random() * 50;
            const gear = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gear.setAttribute('d', SVGAssets.gear(x, y, r, 12));
            gear.setAttribute('fill', '#222');
            gear.setAttribute('opacity', '0.5');
            this.el.appendChild(gear);
        }
    }

    spawnEntities(game: Game) {
        // Rhythm Hazards (Steam Vents)
        const ventPositions = [
            { x: 200, y: 300 },
            { x: 400, y: 150 },
            { x: 400, y: 450 },
            { x: 600, y: 300 },
            { x: 800, y: 150 },
            { x: 1000, y: 450 },
            { x: 1200, y: 300 }
        ];

        ventPositions.forEach(pos => {
            game.entityManager.add(new SteamVent(pos.x, pos.y, game.player));
        });

        // Gear Keepers (Trash mobs)
        game.entityManager.add(new GearKeeper(700, 300));
        game.entityManager.add(new GearKeeper(1100, 300));

        // Steam Marshal (Sub Boss)
        if (!game.bossesDefeated.has('steam_marshal')) {
             game.entityManager.add(new SteamMarshal(1300, 300, game.player));
        }

        // Metronome General (Boss)
        if (!game.bossesDefeated.has('metronome_general')) {
             // Maybe spawn him further back or handle in a specific boss arena room?
             // For now, spawn him at the end
             game.entityManager.add(new MetronomeGeneral(1500, 300));
        }
    }

    destroy() {
        this.el.remove();
    }
}
