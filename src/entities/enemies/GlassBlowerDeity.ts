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
    state: 'IDLE' | 'INHALING' | 'BLOWING' = 'IDLE';
    breathTimer: number = 0;

    // Shader Params
    // p1: Expansion/Heat Level (0..1)
    heatParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 80;
        this.height = 120;
        this.typeID = 25;
        this.target = Game.getInstance().player;
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
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#aaf', 10); // Glass shards
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
                this.state = 'INHALING';
                UIManager.getInstance().showBark(this.x, this.y, "Inhaling...");
                this.breathTimer = 0;
            } else {
                 // Float closer slowly
                this.x += dx * 0.01;
                this.y += dy * 0.01;
            }
        } else if (this.state === 'INHALING') {
            this.breathTimer++;
            if (this.breathTimer >= 3) {
                this.state = 'BLOWING';
                UIManager.getInstance().showBark(this.x, this.y, "MOLTEN GLASS!");
            }
        } else if (this.state === 'BLOWING') {
            this.state = 'IDLE';
            // Spawn Projectile logic would go here, for now direct hit if in line
            // Or simple distance check for heat wave
            if (dist < 200) {
                this.target.takeDamage(15);
                const game = Game.getInstance();
                game.particles.emit(this.target.x, this.target.y, '#fa0', 10); // Burn
            }
        }
    }

    update(dt: number) {
        if (this.state === 'INHALING') {
            this.heatParam = Math.min(1.0, this.heatParam + dt * 0.5);
        } else if (this.state === 'BLOWING') {
            this.heatParam = Math.max(0.0, this.heatParam - dt * 2.0);
        } else {
             this.heatParam = Math.max(0.0, this.heatParam - dt * 0.2);
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
