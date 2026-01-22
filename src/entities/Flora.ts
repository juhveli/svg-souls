import { Entity } from './Entity';
import { Game } from '../engine/Game';
import { EventManager } from '../engine/EventManager';

// TODO: Refactor Flora to use WebGPU instancing instead of legacy SVG injection for better performance and consistency.
export class Flora extends Entity {
    type: string;
    hp: number = 1;

    constructor(x: number, y: number, type: string, svgContent: string) {
        super(x, y, svgContent);
        this.type = type;
    }

    takeDamage(amount: number): void {
        this.hp -= amount;
        if (this.hp <= 0 && !this.markedForDeletion) {
            this.shatter();
        }
    }

    shatter(): void {
        const game = Game.getInstance();
        if (game && game.particles) {
            // Emitting glass-like cyan particles
            game.particles.emit(this.x, this.y, '#4ff', 10);
        }

        // Emit Loot Event
        EventManager.getInstance().emit('LOOT_GAINED', {
            type: 'vibration',
            amount: 5 + Math.floor(Math.random() * 5)
        });

        this.destroy();
    }
}

export class CrystalFlora extends Flora {
    constructor(x: number, y: number) {
        const size = 5 + Math.random() * 10;
        const hue = 160 + Math.random() * 40;
        const animDuration = 2 + Math.random() * 2; // 2-4s random sway
        const svg = `
            <g style="animation: crystal-sway ${animDuration}s ease-in-out infinite; transform-origin: center bottom;">
                <path d="M0,0 l${size / 2},${-size * 2} l${size / 2},${size * 2} z" 
                      fill="hsl(${hue}, 70%, 50%)" opacity="0.9" filter="url(#glow)"/>
            </g>
        `;
        super(x, y, 'crystal_flora', svg);
    }
}
