import { Entity } from '../Entity';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';
import { StateMachine } from '../../engine/StateMachine';
import { SerumBotIdleState, SerumBotChaseState, SerumBotAttackState } from './SerumBotStates';
import { ShardEntity } from '../ShardEntity';

// A 32x32 Pixel Art Representation of a "Scrapyard Serum Bot"
// Palette: Rust (#5a3a2a), Shadow (#2a1a1a), Highlight (#8a5a4a), Metal (#777), Glow (#f00)
const BOT_SVG = `
    <g class="bot-body">
        <!-- 1. SHADOW (Offset Background) -->
        <path d="M-12,-8 h24 v24 h-24 z" fill="#000" opacity="0.4" transform="translate(4,4)" />

        <!-- 2. TREADS / LEGS (Dark Metal) -->
        <!-- Left Tread -->
        <path d="M-14,6 h6 v10 h-6 z M-14,14 h6 v2 h-6 z" fill="#2a2a2a" />
        <path d="M-16,8 h2 v6 h-2 z" fill="#1a1a1a" /> <!-- Detail -->
        <!-- Right Tread -->
        <path d="M8,6 h6 v10 h-6 z M8,14 h6 v2 h-6 z" fill="#2a2a2a" />
        <path d="M14,8 h2 v6 h-2 z" fill="#1a1a1a" />

        <!-- 3. MAIN CHASSIS (Rust Body) -->
        <!-- Base Block -->
        <path d="M-10,-16 h20 v22 h-20 z" fill="#5a3a2a" />
        <!-- Shadow Layer (Bottom/Right) -->
        <path d="M-10,0 h20 v6 h-20 z M6,-16 h4 v22 h-4 z" fill="#3a2a1a" opacity="0.5" />
        <!-- Highlight Layer (Top/Left edge) -->
        <path d="M-10,-16 h20 v2 h-20 z M-10,-14 h2 v18 h-2 z" fill="#8a5a4a" opacity="0.8" />

        <!-- Texture: Rust Spots (Dithering) -->
        <rect x="-6" y="-10" width="2" height="2" fill="#3a2a1a" />
        <rect x="0" y="-4" width="2" height="2" fill="#3a2a1a" />
        <rect x="4" y="-12" width="2" height="2" fill="#3a2a1a" />

        <!-- 4. HEAD UNIT -->
        <!-- Neck/Collar -->
        <rect x="-6" y="-20" width="12" height="4" fill="#333" />
        <!-- Face Plate -->
        <rect x="-8" y="-26" width="16" height="8" fill="#444" stroke="#222" stroke-width="2" />
        <!-- The Eye (Animated) -->
        <circle cx="0" cy="-22" r="3" fill="#ff0000" id="eye" stroke="#500" stroke-width="1" />
        <!-- Antenna -->
        <path d="M4,-26 v-6 h2 v6 z" fill="#666" />
        <rect x="4" y="-34" width="2" height="2" fill="#f00" opacity="0.5" class="blink" />

        <!-- 5. ARMS (Asymmetrical) -->
        <!-- Left: Pincer (Heavy Industrial) -->
        <g transform="translate(-12, -8)">
            <path d="M-4,0 h4 v4 h-4 z" fill="#444" /> <!-- Joint -->
            <path d="M-8,-4 h4 v12 h-4 z" fill="#555" /> <!-- Arm -->
            <path d="M-10,6 h6 v2 h-6 z M-10,10 h6 v2 h-6 z" fill="#888" /> <!-- Claws -->
        </g>

        <!-- Right: Serum Injector (Fragile/Medical) -->
        <g transform="translate(12, -8)">
            <path d="M0,0 h6 v4 h-6 z" fill="#444" /> <!-- Joint -->
            <!-- Glass Vial Body -->
            <path d="M6,-2 h10 v8 h-10 z" fill="#88aa88" opacity="0.6" />
            <!-- Fluid Level -->
            <path d="M6,2 h10 v4 h-10 z" fill="#44ff44" opacity="0.8" />
            <!-- Needle -->
            <path d="M16,1 h6 v2 h-6 z" fill="#ccc" />
        </g>

        <!-- 6. OUTLINE (The "Sticker" effect for pop) -->
        <!-- We use a subtle filter or just distinct contrasting strokes in the paths above.
             Here, we add a few key black lines to define separation. -->
        <path d="M-10,-16 v22 M10,-16 v22 M-10,6 h20" stroke="#1a0a0a" stroke-width="1" fill="none" opacity="0.5" />

    </g>
`;

export class SerumBot extends Entity {
    target: Player;
    speed: number = 80;
    hp: number = 30;
    fsm: StateMachine;

    // Rhythm
    moveTimer: number = 0;

    // Event Listeners
    private attackListener: EventListener;
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y, BOT_SVG);
        this.target = target;

        // Subscribe to Beat
        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        // Create bound listener
        this.attackListener = ((e: CustomEvent) => {
            if (this.isDead) return; // double safety

            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Simple range check
            if (dist < atk.range + 10) {
                this.takeDamage(10);
            }
        }) as EventListener;

        // Listen for Attacks
        document.addEventListener('player-attack', this.attackListener);

        // Initialize State Machine
        this.fsm = new StateMachine();
        this.fsm.addState(new SerumBotIdleState(this));
        this.fsm.addState(new SerumBotChaseState(this));
        this.fsm.addState(new SerumBotAttackState(this));
        this.fsm.changeState('IDLE');

        // Events
        this.fsm.onStateChanged = (oldState, newState) => {
            if (oldState === 'IDLE' && newState === 'CHASE') {
                EventManager.getInstance().emit('ENTITY_AGGRO', { type: 'serum_bot', id: this.id, x: this.x, y: this.y });
            }
        };
    }

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        // BLOOD PARTICLES (Visual Juice)
        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#f00', 5);
        }

        // EMIT DAMAGE EVENT (Replaces direct UI call)
        EventManager.getInstance().emit('ENTITY_DAMAGED', {
            type: 'serum_bot',
            id: this.id,
            x: this.x,
            y: this.y
        });

        // Flash White
        this.el.style.filter = 'brightness(10)';
        setTimeout(() => this.el.style.filter = 'none', 100);

        // Knockback
        this.x += (Math.random() - 0.5) * 30;
        this.y += (Math.random() - 0.5) * 30;

        if (this.hp <= 0) {
            // EMIT DEATH EVENT
            EventManager.getInstance().emit('ENTITY_DIED', {
                type: 'serum_bot',
                id: this.id,
                x: this.x,
                y: this.y
            });

            // Death Explosion
            if (game && game.particles) {
                game.particles.emit(this.x, this.y, '#fff', 20);
            }

            // SPAWN SHARDS (Collectible vibration)
            const shardCount = 3 + Math.floor(Math.random() * 3); // 3-5 shards
            for (let i = 0; i < shardCount; i++) {
                const shard = new ShardEntity(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    2 + Math.floor(Math.random() * 3), // 2-4 value each
                    this.target
                );
                game.entityManager.add(shard);
            }

            this.destroy();
        }
    }

    onBeat() {
        // Visual pulse
        const eye = this.el.querySelector('#eye');
        if (eye) {
            eye.setAttribute('r', '6');
            setTimeout(() => eye.setAttribute('r', '3'), 100);
        }
    }


    update(dt: number) {
        this.fsm.update(dt);
        super.update(dt);
        this.render();
    }
}
