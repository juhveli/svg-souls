import { SVGAssets } from './SVGAssets';
import { GameMap } from './GameMap';
import { Game } from '../engine/Game';
import { TrashCompactor } from '../entities/enemies/TrashCompactor';
import { Mannequin } from '../entities/enemies/Mannequin';
import { ItemDatabase } from '../systems/ItemDatabase';
import { NarrativeItem } from '../entities/NarrativeItem';
import { NPCEntity } from '../entities/NPCEntity';
import { SerumBot } from '../entities/enemies/SerumBot';
import { WorldItem } from '../entities/WorldItem';
import { Golgotha } from '../entities/enemies/Golgotha';

export class ScrapyardMap extends GameMap {
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
            // Insert before entities so they walk on top
            world.insertBefore(this.el, world.firstChild);
        }
    }

    private generateGeometry() {
        // 0. Background (Global Darkness with Radial Gradient)
        // TODO: Replace with WebGPU textured quad with noise shader for "Smog" effect.

        // Define Gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.id = 'smog-gradient';
        gradient.setAttribute('cx', '50%');
        gradient.setAttribute('cy', '50%');
        gradient.setAttribute('r', '70%');
        gradient.innerHTML = `
            <stop offset="0%" stop-color="#2a1a1a" stop-opacity="1" />
            <stop offset="100%" stop-color="#050505" stop-opacity="1" />
        `;
        defs.appendChild(gradient);
        this.el.appendChild(defs);

        this.addRect(0, 0, this.width, this.height, 'url(#smog-gradient)');

        // 1. Base Floor (The Junk Pile)
        // TODO: Use SpriteBatch or Tiled Map for floor instead of expensive SVG Path.
        const junkPath = SVGAssets.junkPile(0, 500, 1600, 100, 123);
        const floor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        floor.setAttribute('d', junkPath);
        floor.setAttribute('fill', '#1a1111');
        floor.setAttribute('stroke', '#3a2222');
        floor.setAttribute('stroke-width', '2');
        this.el.appendChild(floor);

        // 2. Foreground Debris (Broken Gears)
        this.el.innerHTML += `
            <path d="${SVGAssets.gear(200, 520, 60, 8)}" fill="#221" stroke="#432" stroke-width="2" transform="rotate(15, 200, 520)" />
            <path d="${SVGAssets.gear(600, 550, 40, 12)}" fill="#111" stroke="#432" stroke-width="2" transform="rotate(-10, 600, 550)" />
        `;

        // 3. Hanging Chains (Sense of Depth)
        this.el.innerHTML += `
             <path d="${SVGAssets.chain(100, -10, 100, 300, 0)}" stroke="#222" stroke-width="4" fill="none" />
             <path d="${SVGAssets.chain(700, -10, 700, 250, 0)}" stroke="#222" stroke-width="4" fill="none" />
             <!-- Loose hanging loop -->
             <path d="${SVGAssets.chain(300, 0, 500, 0, 150)}" stroke="#111" stroke-width="3" fill="none" />
        `;

        // 4. Glass Shards (The Shatter)
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 1600;
            const y = 450 + Math.random() * 150;
            const rot = Math.random() * 360;
            const size = 5 + Math.random() * 10;
            this.el.innerHTML += `
                <path d="M${x},${y} l${size},${size * 2} l${-size * 2},${size} z" 
                      fill="#aff" opacity="0.4" 
                      filter="url(#glass-shine)" 
                      transform="rotate(${rot}, ${x}, ${y})" />
            `;
        }

        // Walls (Invisible Collision boundaries, visualized as darker shadows)
        this.addRect(0, 0, 20, 600, '#00000088');
        this.addRect(1580, 0, 20, 600, '#00000088');

        // Mannequin Graves (Visuals)
        this.el.innerHTML += `
            <path d="${SVGAssets.junkPile(700, 480, 300, 50, 555)}" fill="#1a2a2a" stroke="#2a3a3a" opacity="0.8" />
        `;
    }

    spawnEntities(game: Game) {
        // Narrative Items
        const db = ItemDatabase.getInstance();
        const mirrorItem = db.get('cracked_mirror');
        const mirrorDesc = mirrorItem ? mirrorItem.description : "The glass reflects the smog... [DATA MISSING]";
        const mirrorName = mirrorItem ? mirrorItem.name : "Cracked Mirror";
        game.entityManager.add(new NarrativeItem(300, 450, mirrorName, mirrorDesc, game.player));

        const ledgerItem = db.get('foremans_ledger');
        const ledgerDesc = ledgerItem ? ledgerItem.description : "Entries for 'Soft Units'... [DATA MISSING]";
        const ledgerName = ledgerItem ? ledgerItem.name : "Foreman's Ledger";
        game.entityManager.add(new NarrativeItem(600, 520, ledgerName, ledgerDesc, game.player));

        // NPC
        game.entityManager.add(new NPCEntity(250, 400, 'tick_tock', game.player));

        // World Item: Vial
        game.entityManager.add(new WorldItem(200, 400, 'vial_liquid_seconds'));

        // Enemies
        game.entityManager.add(new SerumBot(650, 300, game.player));

        // Spawn Mannequins
        game.entityManager.add(new Mannequin(750, 500));
        game.entityManager.add(new Mannequin(850, 520));
        game.entityManager.add(new Mannequin(950, 480));

        // Spawn Trash Compactor (Sub-Boss)
        if (!game.bossesDefeated.has('trash_compactor')) {
            game.entityManager.add(new TrashCompactor(1400, 500));
        }

        // Spawn Golgotha (Boss) - Was in checkWorld1Spawns
        if (!game.bossesDefeated.has('golgotha')) {
             // Maybe spawn strictly when player reaches the end?
             // Or just spawn him at the end (1500, 300).
             game.entityManager.add(new Golgotha(1500, 300, game.player));
        }
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
