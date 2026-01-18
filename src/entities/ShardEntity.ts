import { Entity } from './Entity';
import { Player } from './Player';
import { EventManager } from '../engine/EventManager';

const SHARD_SVG = `
    <g class="shard">
        <polygon points="0,-8 6,4 -6,4" fill="#4ff" stroke="#fff" stroke-width="1" />
        <polygon points="0,-8 6,4 -6,4" fill="#4ff" opacity="0.5" class="pulse" />
    </g>
`;

export class ShardEntity extends Entity {
    value: number;
    lifetime: number = 30; // Despawn after 30s
    collectRadius: number = 30;
    attractRadius: number = 80;
    target: Player;

    // Animation
    private pulsePhase: number = Math.random() * Math.PI * 2;
    private bobPhase: number = Math.random() * Math.PI * 2;
    private baseY: number;

    constructor(x: number, y: number, value: number, target: Player) {
        super(x, y, SHARD_SVG);
        this.value = value;
        this.target = target;
        this.baseY = y;

        // Random initial velocity (scatter effect)
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200 - 100; // Upward bias
    }

    update(dt: number) {
        // Lifetime countdown
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.destroy();
            return;
        }

        // Visual warning when about to despawn
        if (this.lifetime < 5) {
            this.el.style.opacity = (0.3 + Math.sin(this.lifetime * 10) * 0.7).toString();
        }

        // Distance to player
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Collect if close enough
        if (dist < this.collectRadius) {
            this.collect();
            return;
        }

        // Attract towards player when in range
        if (dist < this.attractRadius) {
            const attractStrength = 1 - (dist / this.attractRadius);
            this.vx += dx * attractStrength * dt * 10;
            this.vy += dy * attractStrength * dt * 10;
        }

        // Physics: friction + gravity
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.vy += 50 * dt; // Light gravity

        // Bob animation
        this.bobPhase += dt * 3;
        const bobOffset = Math.sin(this.bobPhase) * 3;

        // Pulse animation
        this.pulsePhase += dt * 5;
        const pulse = this.el.querySelector('.pulse');
        if (pulse) {
            const scale = 1 + Math.sin(this.pulsePhase) * 0.2;
            pulse.setAttribute('transform', `scale(${scale})`);
        }

        // Update position
        super.update(dt);
        this.y = this.baseY + bobOffset;

        // Clamp to ground
        if (this.y > this.baseY + 10) {
            this.y = this.baseY + 10;
            this.vy = 0;
        }

        this.render();
    }

    private collect() {
        EventManager.getInstance().emit('SHARD_COLLECTED', {
            value: this.value,
            x: this.x,
            y: this.y
        });

        // Visual feedback: quick flash before removal
        this.el.style.filter = 'brightness(3)';
        setTimeout(() => this.destroy(), 50);
    }
}
