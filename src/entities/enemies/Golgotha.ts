import { Entity } from '../Entity';
import { Player } from '../Player';
import { AudioController } from '../../engine/AudioController';
import { Game } from '../../engine/Game';
import { EventManager } from '../../engine/EventManager';
import { UIManager } from '../../ui/UIManager';
import { ShardEntity } from '../ShardEntity';

export class Golgotha extends Entity {
    target: Player;
    hp: number = 200;
    maxHp: number = 200;
    state: 'IDLE' | 'CHASE' | 'ATTACK' | 'PHASE2' = 'IDLE';

    private beatListener: () => void;
    private attackListener: EventListener;

    constructor(x: number, y: number, target: Player) {
        super(x, y);
        this.width = 100;
        this.height = 100;
        this.target = target;
        this.radius = 40;

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

    destroy() {
        document.removeEventListener('player-attack', this.attackListener);
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }

    takeDamage(amount: number) {
        this.hp -= amount;

        const game = Game.getInstance();
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, '#fff', 10);
        }

        if (this.hp <= 100 && this.state !== 'PHASE2') {
            this.state = 'PHASE2';
            UIManager.getInstance().showBark(this.x, this.y, "THE SILENCE IS DEAFENING!");
            this.x += (Math.random() - 0.5) * 100;
            this.y += (Math.random() - 0.5) * 100;
        }

        if (this.hp <= 0) {
            UIManager.getInstance().showBark(this.x, this.y, "Finally... I can sleep.");
            EventManager.getInstance().emit('ENTITY_DIED', { type: 'golgotha', id: this.id, x: this.x, y: this.y });
            game.particles.emit(this.x, this.y, '#000', 50);

            const shardCount = 15 + Math.floor(Math.random() * 11);
            for (let i = 0; i < shardCount; i++) {
                const shard = new ShardEntity(
                    this.x + (Math.random() - 0.5) * 60,
                    this.y + (Math.random() - 0.5) * 60,
                    10 + Math.floor(Math.random() * 10),
                    this.target
                );
                game.entityManager.add(shard);
            }

            this.destroy();
        }
    }

    onBeat() {
        if (this.state === 'IDLE' || this.state === 'CHASE') {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                this.state = 'ATTACK';
                UIManager.getInstance().showBark(this.x, this.y, "CRUSH.");
            } else {
                this.x += dx * 0.05;
                this.y += dy * 0.05;
            }
        } else if (this.state === 'ATTACK') {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.x += dx * 0.3;
            this.y += dy * 0.3;
            this.target.takeDamage(20);
            this.state = 'IDLE';
        } else if (this.state === 'PHASE2') {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.x += dx * 0.1;
            this.y += dy * 0.1;
            if (Math.random() < 0.3) {
                this.state = 'ATTACK';
            }
        }
    }

    update(dt: number) {
        super.update(dt);
    }
}
