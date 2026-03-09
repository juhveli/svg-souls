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
    width: number = 1600;
    height: number = 600;

    constructor() {
        super();
        this.generateGeometry();
    }

    private generateGeometry() {
        // Generate a grid of placeholder isometric floor tiles
        const cols = Math.ceil(this.width / 64);
        const rows = Math.ceil(this.height / 32);

        // A simple procedural mix of the new decayed tiles for the Scrapyard
        const tileOptions = [
            'concrete368a_decayed',
            'cretebrick970_decayed',
            'stone_decayed',
            'rock_decayed',
            'dirt_decayed'
        ];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // We map logical grid coords to world coords.
                // Isometric grid usually treats 1 unit as a tile.
                // Let's use world coordinates directly, and map them in the renderer.

                // Pick a random tile to give that ruined/scavenged scrapyard floor look
                const randomTile = tileOptions[Math.floor(Math.random() * tileOptions.length)];

                this.tiles.push({
                    x: x * 64,
                    y: y * 64, // using 64x64 logical square grid that projects to 64x32 isometric
                    z: 0,
                    textureId: randomTile
                });
            }
        }

        // TODO: Replace with Tiled map parsing to layout specific chunks of Scrapyard assets.
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
             game.entityManager.add(new Golgotha(1500, 300, game.player));
        }
    }

    destroy() {
        this.tiles = [];
    }
}
