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
        this.entities.push(entity);

        if (entity instanceof Player) {
            this.players.push(entity);
        } else if (entity instanceof Enemy) {
            this.enemies.push(entity);
        } else if (entity instanceof NarrativeItem) {
            this.narrativeItems.push(entity);
        }
    }

    update(dt: number) {
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.players = this.players.filter(e => !e.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.narrativeItems = this.narrativeItems.filter(e => !e.markedForDeletion);

        this.entities.sort((a, b) => a.y - b.y);

        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
}
