import { State } from '../../engine/StateMachine';
import { ScavengerCrab } from './ScavengerCrab';

export class ScavengerCrabIdleState extends State {
    crab: ScavengerCrab;
    wanderTimer: number = 0;

    constructor(crab: ScavengerCrab) {
        super('IDLE');
        this.crab = crab;
    }

    enter() {
        this.crab.vx = 0;
        this.crab.vy = 0;
        this.wanderTimer = Math.random() * 2 + 1;
    }

    exit() { }

    update(dt: number) {
        // Wandering logic
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            this.crab.vx = Math.cos(angle) * 20;
            this.crab.vy = Math.sin(angle) * 20;
            this.wanderTimer = Math.random() * 2 + 1;
        }

        const dx = this.crab.target.x - this.crab.x;
        const dy = this.crab.target.y - this.crab.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detect player
        const baseRange = 200; // Shorter range than SerumBot
        const range = this.crab.target.isSneaking ? baseRange * 0.4 : baseRange;

        if (dist < range) {
            this.fsm?.changeState('CHASE');
        }
    }
}

export class ScavengerCrabChaseState extends State {
    crab: ScavengerCrab;

    constructor(crab: ScavengerCrab) {
        super('CHASE');
        this.crab = crab;
    }

    enter() {
        // Crab noise?
    }

    exit() { }

    update(dt: number) {
        const dx = this.crab.target.x - this.crab.x;
        const dy = this.crab.target.y - this.crab.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
            this.fsm?.changeState('ATTACK');
            return;
        }

        if (dist > 300) {
            this.fsm?.changeState('IDLE');
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.crab.rotation = angle + Math.PI / 2;

        // Move towards center
        this.crab.vx += Math.cos(angle) * this.crab.speed * dt * 5;
        this.crab.vy += Math.sin(angle) * this.crab.speed * dt * 5;

        this.crab.vx *= 0.9;
        this.crab.vy *= 0.9;
    }
}

export class ScavengerCrabAttackState extends State {
    crab: ScavengerCrab;
    timer: number = 0;

    constructor(crab: ScavengerCrab) {
        super('ATTACK');
        this.crab = crab;
    }

    enter() {
        this.timer = 0.8; // Slower attack
        this.crab.target.takeDamage(20);

        // Heavy pinch
        const dx = this.crab.target.x - this.crab.x;
        const dy = this.crab.target.y - this.crab.y;
        const angle = Math.atan2(dy, dx);
        this.crab.vx = Math.cos(angle) * 100; // Short lunge
        this.crab.vy = Math.sin(angle) * 100;
    }

    exit() { }

    update(dt: number) {
        this.timer -= dt;
        this.crab.vx *= 0.85;
        this.crab.vy *= 0.85;

        if (this.timer <= 0) {
            this.fsm?.changeState('CHASE');
        }
    }
}
