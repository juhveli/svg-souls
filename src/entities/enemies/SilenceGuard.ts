import { Enemy } from './Enemy';
import { Player } from '../Player';
import { Game } from '../../engine/Game';
import { UIManager } from '../../ui/UIManager';
import { AudioController } from '../../engine/AudioController';
import { EventManager } from '../../engine/EventManager';

export class SilenceGuard extends Enemy {
    target: Player;
    hp: number = 80;
    maxHp: number = 80;

    // States
    state: 'PATROL' | 'ALERT' | 'ATTACK' = 'PATROL';
    patrolDir: number = 1;
    patrolTimer: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 64;
        this.typeID = 15;
        this.target = Game.getInstance().player;
        this.radius = 30;

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
        this.hp -= amount;
        this.state = 'ATTACK'; // Aggro on hit

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#111', 8); // Void particles
        }

        if (this.hp <= 0) {
            UIManager.getInstance().showBark(this.x, this.y, "..."); // Silent death
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'silence_guard', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'PATROL') {
            // Check for player
            if (dist < 300) {
                this.state = 'ALERT';
                UIManager.getInstance().showBark(this.x, this.y, "!");
            } else {
                // Patrol movement
                this.x += this.patrolDir * 10;
                this.patrolTimer++;
                if (this.patrolTimer > 10) {
                    this.patrolDir *= -1;
                    this.patrolTimer = 0;
                }
            }
        } else if (this.state === 'ALERT') {
             this.state = 'ATTACK';
        } else if (this.state === 'ATTACK') {
             // Charge logic
             if (dist > 50) {
                 this.vx = (dx / dist) * 8;
                 this.vy = (dy / dist) * 8;
             } else {
                 // Attack hit
                 this.target.takeDamage(10);
                 const game = Game.getInstance();
                 game.particles.emit(this.target.x, this.target.y, '#f00', 5);
             }
        }
    }

    update(dt: number) {
        if (this.state === 'ATTACK') {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.8;
            this.vy *= 0.8;
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
