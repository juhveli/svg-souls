import { Entity } from '../entities/Entity';

export class EntityManager {
    entities: Entity[] = [];

    add(e: Entity) {
        this.entities.push(e);
    }

    update(dt: number) {
        // Update all
        for (const e of this.entities) {
            e.update(dt);
        }

        // Cleanup dead
        for (const e of this.entities) {
            if (e.isDead) {
                e.destroy();
            }
        }
        this.entities = this.entities.filter(e => !e.isDead);
    }
}
