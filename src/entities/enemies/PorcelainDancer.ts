import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { EventManager } from '../../engine/EventManager';

const DANCER_SVG = `
    <g class="dancer-body">
        <!-- Porcelain Figure -->
        <ellipse cx="0" cy="0" rx="6" ry="18" fill="#fdf" stroke="#ccc" />
        <!-- Head -->
        <circle cx="0" cy="-22" r="6" fill="#fdf" stroke="#ccc" />
        <!-- Joints (Cyan glow) -->
        <circle cx="0" cy="-10" r="2" fill="#0ff" class="glow" />
        <circle cx="0" cy="10" r="2" fill="#0ff" class="glow" />
    </g>
`;

export class PorcelainDancer extends Enemy {
    target: Player;
    speed: number = 60;
    hp: number = 20;
    isVisible: boolean = false; // Hidden by default in Area 2
    state: 'IDLE' | 'WALTZ' | 'STRIKE' = 'IDLE';

    private attackListener: EventListener;
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y, DANCER_SVG);
        this.target = target;
        this.el.setAttribute('opacity', '0'); // Start invisible

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.isDead || !this.isVisible) return;
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
        this.el.setAttribute('opacity', '1');
        this.el.style.filter = 'drop-shadow(0 0 5px #0ff)';
        // Reset visibility after 5 seconds if not in combat?
        // For now, keep it simple.
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

        // Visual pulse on beat
        const glows = this.el.querySelectorAll('.glow');
        glows.forEach(g => {
            g.setAttribute('r', '4');
            setTimeout(() => g.setAttribute('r', '2'), 100);
        });
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
        this.render();
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
