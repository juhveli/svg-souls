import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class SteamMarshal extends Enemy {
    target: Player;
    hp: number = 80;
    maxHp: number = 80;
    state: 'IDLE' | 'CHARGE' | 'BLAST' = 'IDLE';
    chargeTime: number = 0;
    blastRadius: number = 0;

    // For Shader
    // p1: Blast Radius (0..1)
    // p2: Charge Level (0..1)
    blastParam: number = 0;
    chargeParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 64;
        this.height = 80;
        this.typeID = 22;
        this.target = target;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + 30) {
                this.takeDamage(10);
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#c53', 5);
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'steam_marshal', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'IDLE') {
            if (dist < 200) {
                this.state = 'CHARGE';
                UIManager.getInstance().showBark(this.x, this.y, "Pressure rising...");
                this.chargeTime = 0;
            } else {
                // Patrol
                this.x += (Math.random() - 0.5) * 20;
                this.y += (Math.random() - 0.5) * 20;
            }
        } else if (this.state === 'CHARGE') {
            this.chargeTime++;
            if (this.chargeTime >= 2) {
                this.state = 'BLAST';
                this.blastRadius = 0;
                UIManager.getInstance().showBark(this.x, this.y, "VENTING!");
            }
        } else if (this.state === 'BLAST') {
            this.state = 'IDLE';
            this.blastRadius = 0;
        }
    }

    update(dt: number) {
        if (this.state === 'CHARGE') {
            this.chargeParam = Math.min(1.0, this.chargeParam + dt * 0.5);
        } else {
            this.chargeParam = Math.max(0.0, this.chargeParam - dt);
        }

        if (this.state === 'BLAST') {
            this.blastRadius += dt * 300; // Fast expand
            this.blastParam = Math.min(1.0, this.blastRadius / 150);

            // Check collision with player
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.blastRadius && dist > this.blastRadius - 20) {
                // Hit by ring
                this.target.takeDamage(15);
            }

            if (this.blastRadius > 150) {
                this.state = 'IDLE';
                this.blastParam = 0;
            }
        } else {
            this.blastParam = 0;
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
