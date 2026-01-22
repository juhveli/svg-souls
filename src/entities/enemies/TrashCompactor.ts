import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { UIManager } from '../../ui/UIManager';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';

export class TrashCompactor extends Enemy {
    target: Player;
    hp: number = 150;
    maxHp: number = 150;
    state: 'IDLE' | 'COMPRESSING' | 'SLAM' = 'IDLE';
    compressTimer: number = 0;

    // Shader Params
    // p1: Compression Level (0..1) - controls visual squashing
    compressionParam: number = 0;

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 120;
        this.height = 100;
        this.typeID = 24;
        this.target = Game.getInstance().player;
        this.radius = 50;

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
            game.particles.emit(this.x, this.y, '#555', 8);
        }

        if (this.hp <= 0) {
            UIManager.getInstance().showBark(this.x, this.y, "SYSTEM... HALTED.");
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'trash_compactor', id: this.id, x: this.x, y: this.y });
            this.destroy();
        } else {
             if (Math.random() < 0.3) {
                 UIManager.getInstance().showBark(this.x, this.y, "OBSTRUCTION DETECTED.");
             }
        }
    }

    onBeat() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'IDLE') {
            if (dist < 150) {
                this.state = 'COMPRESSING';
                UIManager.getInstance().showBark(this.x, this.y, "COMPRESSING...");
                this.compressTimer = 0;
            } else {
                // Slow lumbering movement
                this.x += dx * 0.02;
                this.y += dy * 0.02;
            }
        } else if (this.state === 'COMPRESSING') {
            this.compressTimer++;
            if (this.compressTimer >= 2) {
                this.state = 'SLAM';
            }
        } else if (this.state === 'SLAM') {
            // Damage check handled in update/visual sync, resetting here
            this.state = 'IDLE';
            this.compressionParam = 0;

            // Check hit
            if (dist < 100) {
                 this.target.takeDamage(25);
                 const game = Game.getInstance();
                 game.particles.emit(this.target.x, this.target.y, '#f00', 10);
            }
        }
    }

    update(dt: number) {
        if (this.state === 'COMPRESSING') {
            this.compressionParam = Math.min(1.0, this.compressionParam + dt);
        } else if (this.state === 'SLAM') {
            this.compressionParam = 0; // Snap back
        } else {
            this.compressionParam = Math.max(0.0, this.compressionParam - dt);
        }

        // Pass params to shader
        // Assuming the renderer picks up properties, but Entity base class might not map them automatically
        // The Renderer typically checks typeID and maps specific props.
        // We'll need to update WebGPURenderer to map 'compressionParam' to p1 if it's not generic.
        // Actually, looking at WebGPURenderer in memory, it maps manually.
        // I'll need to check WebGPURenderer.ts later or assume standard param slots.

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
