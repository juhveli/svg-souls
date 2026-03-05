import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/enemies/Enemy';
import { NarrativeItem } from '../entities/NarrativeItem';

export class EntityManager {
    entities: Entity[] = [];
    players: Player[] = [];
    enemies: Entity[] = [];
    narrativeItems: NarrativeItem[] = [];

    add(entity: Entity) {
        // Assign UVs from atlas immediately if Game instance has loaded the JSON
        const game = (window as any).Game?.getInstance();
        if (game && game.atlasData && entity.textureId) {
            const data = game.atlasData[entity.textureId];
            if (data) {
                entity.uvOffset = [data.u0, data.v0];
                entity.uvScale = [data.u1 - data.u0, data.v1 - data.v0];
            } else {
                console.warn(`No atlas data found for textureId: ${entity.textureId}`);
            }
        }

        this.entities.push(entity);

        if (entity instanceof Player) {
            this.players.push(entity);
        } else if (entity instanceof Enemy) {
            this.enemies.push(entity);
        } else if (entity instanceof NarrativeItem) {
            this.narrativeItems.push(entity);
        }
    }

    private cleanArray(array: Entity[]) {
        let writeIndex = 0;
        for (let i = 0; i < array.length; i++) {
            const entity = array[i];
            if (!entity.markedForDeletion) {
                if (writeIndex !== i) {
                    array[writeIndex] = entity;
                }
                writeIndex++;
            }
        }
        array.length = writeIndex;
    }

    update(dt: number) {
        this.cleanArray(this.entities);
        this.cleanArray(this.players);
        this.cleanArray(this.enemies);
        this.cleanArray(this.narrativeItems);

        this.entities.sort((a, b) => a.y - b.y);

        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
}
