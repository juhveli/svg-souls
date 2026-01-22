import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class GlassBlowerDeity extends Enemy {
    target: Player;
    hp: number = 120;
    maxHp: number = 120;
    state: 'IDLE' | 'BLOWING' | 'COOLDOWN' = 'IDLE';

    // For Shader
    // p1: Blow Param (0.0 = No Bubble, 1.0 = Max Size)
    blowParam: number = 0;

    // Alias
    get heatParam(): number { return this.blowParam; }

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number, target?: Player) {
        super(x, y);
        this.width = 80;
        this.height = 120;
        this.typeID = 25;
        this.target = target || Game.getInstance().player;
        this.radius = 40;

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
        // If bubble is up, it might pop and deal area damage or just negate damage?
        if (this.state === 'BLOWING' && this.blowParam > 0.5) {
            amount = Math.ceil(amount * 0.7);
            // Pop early
            this.state = 'COOLDOWN';
            this.blowParam = 0;
            UIManager.getInstance().showBark(this.x, this.y, "POP!");
            // TODO: Add glass shattering sound effect when bubble pops
        }

        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#aff', 8); // Glass shards
        }

        if (this.hp <= 0) {
            UIManager.getInstance().showBark(this.x, this.y, "SHATTERED...");
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'glass_blower', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'IDLE') {
            if (dist < 300) {
                this.state = 'BLOWING';
                this.blowParam = 0;
                UIManager.getInstance().showBark(this.x, this.y, "MOLTEN GLASS!");
            } else {
                // Float around
                this.x += (Math.random() - 0.5) * 5;
                this.y += Math.sin(performance.now() / 500) * 10;
            }
        }
    }

    update(dt: number) {
        if (this.state === 'BLOWING') {
            // Expand bubble
            this.blowParam += dt * 0.8;

            // Check collision with bubble
            const bubbleRadius = this.blowParam * 80; // Max 80px radius
            const dx = this.target.x - this.x;
            const dy = this.target.y - (this.y - 20); // Bubble is slightly above center?
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bubbleRadius) {
                // Player trapped inside - Damage
                this.target.takeDamage(1); // Continuous damage
            }

            if (this.blowParam >= 1.2) {
                // Pop naturally
                this.state = 'COOLDOWN';
                this.blowParam = 0;
            }
        } else if (this.state === 'COOLDOWN') {
            this.blowParam = 0;
            if (Math.random() < 0.05) { // Random chance to return to idle
                 this.state = 'IDLE';
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
