import { Entity } from '../entities/Entity';

export class EntityManager {
    entities: Entity[] = [];

    add(entity: Entity) {
        this.entities.push(entity);
    }

    update(dt: number) {
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.entities.sort((a, b) => a.y - b.y);

        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
}
