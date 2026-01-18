import { Entity } from '../Entity';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';
import { StateMachine } from '../../engine/StateMachine';
import { SerumBotIdleState, SerumBotChaseState, SerumBotAttackState } from './SerumBotStates';
import { ShardEntity } from '../ShardEntity';

const BOT_SVG = `
    <g class="bot-body">
        <!-- Main Chassis (Rusty Block) -->
        <rect x="-14" y="-16" width="28" height="24" fill="#5a3a2a" stroke="#2a1a1a" stroke-width="2" />

        <!-- Industrial Vents -->
        <rect x="-10" y="-10" width="20" height="2" fill="#1a0a0a" />
        <rect x="-10" y="-6" width="20" height="2" fill="#1a0a0a" />
        <rect x="-10" y="-2" width="20" height="2" fill="#1a0a0a" />

        <!-- Head Unit (Turret-like) -->
        <rect x="-8" y="-24" width="16" height="8" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="2" />

        <!-- Eye (The Soul) -->
        <circle cx="0" cy="-20" r="3" fill="#ff2200" id="eye" stroke="#000" stroke-width="1"/>

        <!-- Left Arm: Pincer -->
        <rect x="-22" y="-8" width="8" height="4" fill="#4a4a4a" />
        <rect x="-26" y="-14" width="4" height="16" fill="#7a5a4a" />
        <rect x="-28" y="-16" width="2" height="6" fill="#9a9a9a" />
        <rect x="-28" y="-2" width="2" height="6" fill="#9a9a9a" />

        <!-- Right Arm: Serum Injector -->
        <rect x="14" y="-8" width="8" height="4" fill="#4a4a4a" />
        <rect x="22" y="-10" width="12" height="8" fill="#88aa88" opacity="0.8" />
        <rect x="24" y="-8" width="8" height="4" fill="#aaffaa" opacity="0.5" />
        <rect x="34" y="-6" width="6" height="2" fill="#cccccc" />

        <!-- Exhaust Pipe -->
        <rect x="6" y="8" width="4" height="6" fill="#333" />
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
