import { Enemy } from './Enemy';
import { Player } from '../Player';
import { Game } from '../../engine/Game';
import { UIManager } from '../../ui/UIManager';
import { EventManager } from '../../engine/EventManager';

export class Mannequin extends Enemy {
    target: Player;
    hp: number = 40;
    maxHp: number = 40;
    speed: number = 0.5;

    // Shader Params
    // p1: visibility/cracks (optional, for now just 0)

    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 40;
        this.height = 80;
        this.typeID = 27; // Mannequin ID
        this.target = Game.getInstance().player;
        this.radius = 20;

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + this.radius) {
                this.takeDamage(20);
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#aaf', 5); // Glass shards
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'mannequin', id: this.id, x: this.x, y: this.y });
            this.destroy();
        } else {
             if (Math.random() < 0.2) {
                 UIManager.getInstance().showBark(this.x, this.y, "Why...");
             }
        }
    }

    update(dt: number) {
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 400 && dist > 30) {
            // Chase
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (dist < 40) {
            // Touch damage
            if (Math.random() < 0.05) {
                this.target.takeDamage(5);
            }
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        super.destroy();
    }
}
