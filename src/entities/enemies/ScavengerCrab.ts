import { Enemy } from './Enemy';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';
import { StateMachine } from '../../engine/StateMachine';
import { ScavengerCrabIdleState, ScavengerCrabChaseState, ScavengerCrabAttackState } from './ScavengerCrabStates';
import { ShardEntity } from '../ShardEntity';

export class ScavengerCrab extends Enemy {
    target: Player;
    speed: number = 40; // Slow
    hp: number = 50; // Tanky
    fsm: StateMachine;
    private attackListener: EventListener;
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 40; // Slightly wider
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

            if (dist < atk.range + 15) {
                // Armored: takes less damage? For now standard.
                this.takeDamage(10);
            }
        }) as EventListener;

        document.addEventListener('player-attack', this.attackListener);

        this.fsm = new StateMachine();
        this.fsm.addState(new ScavengerCrabIdleState(this));
        this.fsm.addState(new ScavengerCrabChaseState(this));
        this.fsm.addState(new ScavengerCrabAttackState(this));
        this.fsm.changeState('IDLE');
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
            game.particles.emit(this.x, this.y, '#c53', 5); // Orange sparks
        }

        EventManager.getInstance().emit('ENTITY_DAMAGED', {
            type: 'scavenger_crab',
            id: this.id,
            x: this.x,
            y: this.y
        });

        // Knockback
        this.x += (Math.random() - 0.5) * 10; // Resistant to knockback
        this.y += (Math.random() - 0.5) * 10;

        if (this.hp <= 0) {
            EventManager.getInstance().emit('ENTITY_DIED', {
                type: 'scavenger_crab',
                id: this.id,
                x: this.x,
                y: this.y
            });

            if (game && game.particles) {
                game.particles.emit(this.x, this.y, '#c53', 25);
            }

            const shardCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < shardCount; i++) {
                const shard = new ShardEntity(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    1 + Math.floor(Math.random() * 2),
                    this.target
                );
                game.entityManager.add(shard);
            }

            this.destroy();
        }
    }

    onBeat() {
        // Maybe click claws?
        // Shader can handle visual pulse
    }

    update(dt: number) {
        this.fsm.update(dt);
        super.update(dt);
    }
}
