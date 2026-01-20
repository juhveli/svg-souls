import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { EventManager } from '../../engine/EventManager';

export class PorcelainDancer extends Enemy {
    target: Player;
    speed: number = 60;
    hp: number = 20;
    isVisible: boolean = false; // Hidden by default in Area 2. WebGPURenderer reads this.
    state: 'IDLE' | 'WALTZ' | 'STRIKE' = 'IDLE';

    private attackListener: EventListener;
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y); // No SVG, handled by WebGPU TypeID 5
        this.target = target;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion || !this.isVisible) return; // Logic check for visibility
            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < atk.range + 10) {
                this.takeDamage(10);
            }
        }) as EventListener;

        document.addEventListener('player-attack', this.attackListener);

        // Listen for Resonance Bursts
        EventManager.getInstance().on('RESONANCE_BURST', (data: any) => {
            const dx = this.x - data.x;
            const dy = this.y - data.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                this.reveal();
            }
        });
    }

    reveal() {
        this.isVisible = true;
        // Visuals handled by WebGPU shader params
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        // Particle feedback
        const game = (window as any).game; // Global access fallback
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#fff', 5);
        }

        EventManager.getInstance().emit('ENTITY_DAMAGED', {
            type: 'porcelain_dancer',
            id: this.id,
            x: this.x,
            y: this.y
        });

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', {
                type: 'porcelain_dancer',
                id: this.id,
                x: this.x,
                y: this.y
            });
            this.destroy();
        }
    }

    onBeat() {
        if (!this.isVisible) return;

        // "Waltz" Movement: Change direction on beat
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
            this.state = 'STRIKE';
            this.target.takeDamage(10);
        } else if (dist < 300) {
            this.state = 'WALTZ';
        } else {
            this.state = 'IDLE';
        }
        // Visual pulse handled by shader
    }

    update(dt: number) {
        if (this.isVisible && this.state === 'WALTZ') {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const angle = Math.atan2(dy, dx);

            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            this.rotation = angle + Math.PI / 2;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        super.update(dt);
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
