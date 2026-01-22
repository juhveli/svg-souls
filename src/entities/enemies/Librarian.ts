import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class Librarian extends Enemy {
    target: Player;
    hp: number = 60;
    maxHp: number = 60;
    state: 'IDLE' | 'READ' | 'THROW' = 'IDLE';

    // Shader Params
    // p1: Book Hover Height
    // p2: Attack Active
    hoverParam: number = 0;
    attackParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 50;
        this.height = 70;
        this.typeID = 23;
        this.target = target;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + 25) {
                this.takeDamage(10);
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#eee', 5); // Paper white
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'librarian', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
            if (Math.random() < 0.3) {
                this.state = 'THROW';
                UIManager.getInstance().showBark(this.x, this.y, "Shhh!");
                // Deal damage immediately for simplicity, or spawn projectile
                if (dist < 150) {
                     this.target.takeDamage(10);
                }
            } else {
                this.state = 'READ';
            }
        } else {
            this.state = 'IDLE';
        }
    }

    update(dt: number) {
        this.hoverParam += dt * 2; // Continuous hover

        if (this.state === 'THROW') {
            this.attackParam = Math.min(1.0, this.attackParam + dt * 5.0);
            if (this.attackParam >= 1.0) this.state = 'READ';
        } else {
            this.attackParam = Math.max(0.0, this.attackParam - dt * 2.0);
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
