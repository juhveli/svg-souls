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
        <!-- Rust Body -->
        <rect x="-10" y="-15" width="20" height="30" fill="#632" rx="5" />
        <!-- Head -->
        <circle cx="0" cy="-20" r="8" fill="#444" />
        <!-- Eye (Glows on beat) -->
        <circle cx="0" cy="-20" r="3" fill="#f00" id="eye" />
        <!-- Arms -->
        <line x1="-15" y1="-10" x2="-10" y2="-5" stroke="#543" stroke-width="3" />
        <line x1="15" y1="-10" x2="10" y2="-5" stroke="#543" stroke-width="3" />
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
