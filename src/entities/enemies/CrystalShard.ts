import { Enemy } from './Enemy';
import { Player } from '../Player';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class CrystalShard extends Enemy {
    target: Player;
    hp: number = 30;
    maxHp: number = 30;

    // Movement vars
    angle: number = 0;
    speed: number = 1.5;

    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 40;
        this.height = 40;
        this.typeID = 31;
        this.target = Game.getInstance().player;
        this.radius = 20;

        // Random initial angle
        this.angle = Math.random() * Math.PI * 2;

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + this.radius) {
                this.takeDamage(10);
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#aff', 5);
        }

        if (this.hp <= 0) {
            // Shatter sound would go here
            // TODO: Implement 'Fractured Time' elite enemy for World 5 that splits into multiple Shards.
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'crystal_shard', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    update(dt: number) {
        // Drifting behavior
        // Move in current angle
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Bounce off world bounds (approximate)
        if (this.x < 0 || this.x > 1600) this.angle = Math.PI - this.angle;
        if (this.y < 0 || this.y > 600) this.angle = -this.angle;

        // If player is close, turn slightly towards them
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
            const targetAngle = Math.atan2(dy, dx);
            // Lerp angle
            let diff = targetAngle - this.angle;
            // Normalize diff
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            this.angle += diff * 0.05;
        }

        // Damage player on contact
        if (dist < this.radius + 20) { // Player radius approx 20
             this.target.takeDamage(5);
             // Bounce back
             this.angle = this.angle + Math.PI;
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        super.destroy();
    }
}
