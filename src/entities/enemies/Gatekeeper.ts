import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class Gatekeeper extends Enemy {
    target: Player;
    hp: number = 100;
    maxHp: number = 100;
    state: 'IDLE' | 'CHARGING' | 'FLASH' | 'COOLDOWN' = 'IDLE';

    // Shader Params
    // p1: Flash Intensity (0..1)
    flashParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;
    private stateTimer: number = 0;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 80;
        this.height = 80;
        this.typeID = 26;
        this.target = Game.getInstance().player;
        this.radius = 35;

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

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#3296c8', 10); // Magic shards
        }

        if (this.hp <= 0) {
            UIManager.getInstance().showBark(this.x, this.y, "THE LIE FADES...");
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'gatekeeper', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'IDLE') {
            if (dist < 400) {
                this.state = 'CHARGING';
                UIManager.getInstance().showBark(this.x, this.y, "CHARGING...");
                this.stateTimer = 0;
            } else {
                 // Float towards player slowly
                this.x += dx * 0.005;
                this.y += dy * 0.005;
            }
        } else if (this.state === 'CHARGING') {
            this.stateTimer++;
            if (this.stateTimer >= 3) { // 3 beats charge
                this.state = 'FLASH';
                UIManager.getInstance().showBark(this.x, this.y, "FLASHBANG!");

                // Damage Logic: If player is looking at Gatekeeper?
                // Simplification: Area damage
                if (dist < 300) {
                    this.target.takeDamage(20);
                }
            }
        } else if (this.state === 'FLASH') {
            this.state = 'COOLDOWN';
            this.stateTimer = 0;
        } else if (this.state === 'COOLDOWN') {
            this.stateTimer++;
            if (this.stateTimer >= 4) {
                this.state = 'IDLE';
            }
        }
    }

    update(dt: number) {
        if (this.state === 'CHARGING') {
            this.flashParam = Math.min(1.0, this.flashParam + dt * 0.5);
        } else if (this.state === 'FLASH') {
             this.flashParam = 1.0;
        } else {
             this.flashParam = Math.max(0.0, this.flashParam - dt * 2.0);
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
