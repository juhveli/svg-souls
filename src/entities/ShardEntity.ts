import { Entity } from './Entity';
import { Player } from './Player';
import { EventManager } from '../engine/EventManager';

export class ShardEntity extends Entity {
    value: number;
    lifetime: number = 30;
    collectRadius: number = 30;
    attractRadius: number = 80;
    target: Player;

    // Animation
    private bobPhase: number = Math.random() * Math.PI * 2;

    constructor(x: number, y: number, value: number, target: Player) {
        super(x, y);
        this.width = 16;
        this.height = 16;
        this.value = value;
        this.target = target;

        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200 - 100;
    }

    update(dt: number) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.destroy();
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.collectRadius) {
            this.collect();
            return;
        }

        if (dist < this.attractRadius) {
            const attractStrength = 1 - (dist / this.attractRadius);
            this.vx += dx * attractStrength * dt * 10;
            this.vy += dy * attractStrength * dt * 10;
        }

        this.vx *= 0.95;
        this.vy *= 0.95;
        this.vy += 50 * dt;

        this.bobPhase += dt * 3;
        // const bobOffset = Math.sin(this.bobPhase) * 3; // Unused for now

        super.update(dt);
    }

    private collect() {
        EventManager.getInstance().emit('SHARD_COLLECTED', {
            value: this.value,
            x: this.x,
            y: this.y
        });
        this.destroy();
    }
}
