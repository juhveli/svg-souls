import { Enemy } from './Enemy';
import { Player } from '../Player';
import { Game } from '../../engine/Game';
import { AudioController } from '../../engine/AudioController';
import { EventManager } from '../../engine/EventManager';

export class PistonDrone extends Enemy {
    target: Player;
    hp: number = 30;
    maxHp: number = 30;

    // Shader Params
    // p1: Extension (0..1) for piston visual
    extensionParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 40;
        this.height = 60;
        this.typeID = 28; // PistonDrone ID
        this.target = Game.getInstance().player;
        this.radius = 20;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + this.radius) {
                this.takeDamage(30); // Dies easily
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#da4', 5); // Brass sparks
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'piston_drone', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        // Jump/Thrust on beat
        this.extensionParam = 1.0;

        // Move towards player in bursts
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
             this.x += (dx / dist) * 20;
             this.y += (dy / dist) * 20;
        }
    }

    update(dt: number) {
        // Retract piston
        this.extensionParam = Math.max(0.0, this.extensionParam - dt * 3.0);

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
