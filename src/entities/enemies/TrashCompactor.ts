import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class TrashCompactor extends Enemy {
    target: Player;
    hp: number = 100;
    maxHp: number = 100;
    state: 'IDLE' | 'CRUSHING' | 'RECOVERING' = 'IDLE';

    // For Shader
    // p1: Crush Param (0.0 = Up/Open, 1.0 = Down/Crushed)
    crushParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 80;
        this.height = 100;
        this.typeID = 24;
        this.target = target;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + 40) {
                this.takeDamage(10);
            }
        }) as EventListener;
        document.addEventListener('player-attack', this.attackListener);
    }

    takeDamage(amount: number) {
        // Reduced damage when crushed (armored)
        if (this.state === 'RECOVERING' || this.crushParam > 0.8) {
             amount = Math.ceil(amount / 2);
             UIManager.getInstance().showBark(this.x, this.y - 50, "CLANG!");
        }

        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#555', 5);
        }

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'trash_compactor', id: this.id, x: this.x, y: this.y });
            this.destroy();
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'IDLE') {
            if (dist < 150) {
                this.state = 'CRUSHING';
                UIManager.getInstance().showBark(this.x, this.y, "CRUSH!");
            }
        }
        // Logic for state transitions handles in update
    }

    update(dt: number) {
        if (this.state === 'CRUSHING') {
            // Slam down fast
            this.crushParam += dt * 5.0;
            if (this.crushParam >= 1.0) {
                this.crushParam = 1.0;
                this.checkHit();
                // TODO: Add crushing sound effect on impact
                this.state = 'RECOVERING';
            }
        } else if (this.state === 'RECOVERING') {
            // Rise up slowly
            this.crushParam -= dt * 0.5;
            if (this.crushParam <= 0.0) {
                this.crushParam = 0.0;
                this.state = 'IDLE';
            }
        }

        super.update(dt);
    }

    checkHit() {
        // Hitbox check
        const dx = Math.abs(this.target.x - this.x);
        const dy = Math.abs(this.target.y - this.y); // Vertical alignment matters less for a slam, but let's check

        // 80 width, so 40 half-width. Height check?
        if (dx < 50 && dy < 60) {
            this.target.takeDamage(20);
            // Knockback
            this.target.x += (this.target.x > this.x ? 50 : -50);
        }
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
