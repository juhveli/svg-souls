import { Entity } from '../Entity';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';
import { StateMachine } from '../../engine/StateMachine';
import { SerumBotIdleState, SerumBotChaseState, SerumBotAttackState } from './SerumBotStates';
import { ShardEntity } from '../ShardEntity';

export class SerumBot extends Entity {
    target: Player;
    speed: number = 80;
    hp: number = 30;
    fsm: StateMachine;
    moveTimer: number = 0;
    private attackListener: EventListener;
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.target = target;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);

        this.attackListener = ((e: CustomEvent) => {
            if (this.markedForDeletion) return;

            const atk = e.detail;
            const dx = this.x - atk.x;
            const dy = this.y - atk.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < atk.range + 10) {
                this.takeDamage(10);
            }
        }) as EventListener;

        document.addEventListener('player-attack', this.attackListener);

        this.fsm = new StateMachine();
        this.fsm.addState(new SerumBotIdleState(this));
        this.fsm.addState(new SerumBotChaseState(this));
        this.fsm.addState(new SerumBotAttackState(this));
        this.fsm.changeState('IDLE');

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

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#f00', 5);
        }

        EventManager.getInstance().emit('ENTITY_DAMAGED', {
            type: 'serum_bot',
            id: this.id,
            x: this.x,
            y: this.y
        });

        this.x += (Math.random() - 0.5) * 30;
        this.y += (Math.random() - 0.5) * 30;

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', {
                type: 'serum_bot',
                id: this.id,
                x: this.x,
                y: this.y
            });

            if (game && game.particles) {
                game.particles.emit(this.x, this.y, '#fff', 20);
            }

            const shardCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < shardCount; i++) {
                const shard = new ShardEntity(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    2 + Math.floor(Math.random() * 3),
                    this.target
                );
                game.entityManager.add(shard);
            }

            this.destroy();
        }
    }

    onBeat() {
        // Shader Pulse
    }

    update(dt: number) {
        this.fsm.update(dt);
        super.update(dt);
    }
}
