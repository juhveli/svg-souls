import { Enemy } from './Enemy';
import { Player } from '../Player';
import { Game } from '../../engine/Game';
import { UIManager } from '../../ui/UIManager';
import { AudioController } from '../../engine/AudioController';
import { EventManager } from '../../engine/EventManager';

export class BookMimic extends Enemy {
    target: Player;
    hp: number = 50;
    maxHp: number = 50;

    // States: IDLE (looks like book), AGGRO (chasing/biting)
    state: 'IDLE' | 'AGGRO' = 'IDLE';

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 40;
        this.height = 40;
        this.typeID = 32;
        this.target = Game.getInstance().player;
        this.radius = 25;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

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
        if (this.state === 'IDLE') {
             // Wake up immediately if hit
             this.state = 'AGGRO';
             UIManager.getInstance().showBark(this.x, this.y, "CRUNCH!");
        }

        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#eee', 5); // Paper/Dust
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'book_mimic', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        if (this.state === 'IDLE') {
            // Check for player proximity
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                this.state = 'AGGRO';
                UIManager.getInstance().showBark(this.x, this.y, "KNOWLEDGE BITES!");
                // Jump at player
                this.vx = (dx / dist) * 10;
                this.vy = (dy / dist) * 10;
            }
        } else {
             // Chase logic on beat (lunge)
             const dx = this.target.x - this.x;
             const dy = this.target.y - this.y;
             const dist = Math.sqrt(dx * dx + dy * dy);

             if (dist < 300) {
                 this.vx = (dx / dist) * 5;
                 this.vy = (dy / dist) * 5;
             }
        }
    }

    update(dt: number) {
        // Apply velocity decay (friction)
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9;
        this.vy *= 0.9;

        if (this.state === 'AGGRO') {
             // Damage player on contact
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.radius + 20) {
                this.target.takeDamage(8);
                // Bounce back
                this.vx = -this.vx * 1.5;
                this.vy = -this.vy * 1.5;
            }
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
