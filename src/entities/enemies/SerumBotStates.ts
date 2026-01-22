import { State } from '../../engine/StateMachine';
import { SerumBot } from './SerumBot';

export class SerumBotIdleState extends State {
    bot: SerumBot;

    constructor(bot: SerumBot) {
        super('IDLE');
        this.bot = bot;
    }

    enter() {
        this.bot.vx = 0;
        this.bot.vy = 0;
    }

    exit() { }

    update(_dt: number) {
        const dx = this.bot.target.x - this.bot.x;
        const dy = this.bot.target.y - this.bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detect player
        const baseRange = 300;
        const range = this.bot.target.isSneaking ? baseRange * 0.4 : baseRange;

        if (dist < range) {
            this.fsm?.changeState('CHASE');
        }
    }
}

export class SerumBotChaseState extends State {
    bot: SerumBot;

    constructor(bot: SerumBot) {
        super('CHASE');
        this.bot = bot;
    }

    enter() {
        console.log(`[SerumBot] ${this.bot.id} is chasing!`);
    }

    exit() { }

    update(dt: number) {
        const dx = this.bot.target.x - this.bot.x;
        const dy = this.bot.target.y - this.bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            this.fsm?.changeState('ATTACK');
            return;
        }

        if (dist > 400) {
            this.fsm?.changeState('IDLE');
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.bot.rotation = angle + Math.PI / 2;

        // Move towards center
        this.bot.vx += Math.cos(angle) * this.bot.speed * dt * 5;
        this.bot.vy += Math.sin(angle) * this.bot.speed * dt * 5;

        this.bot.vx *= 0.9;
        this.bot.vy *= 0.9;
    }
}

export class SerumBotAttackState extends State {
    bot: SerumBot;
    timer: number = 0;

    constructor(bot: SerumBot) {
        super('ATTACK');
        this.bot = bot;
    }

    enter() {
        this.timer = 0.5; // Attack duration
        this.bot.target.takeDamage(15);

        // Lunge
        const dx = this.bot.target.x - this.bot.x;
        const dy = this.bot.target.y - this.bot.y;
        const angle = Math.atan2(dy, dx);
        this.bot.vx = Math.cos(angle) * 200;
        this.bot.vy = Math.sin(angle) * 200;
    }

    exit() { }

    update(dt: number) {
        this.timer -= dt;
        this.bot.vx *= 0.8;
        this.bot.vy *= 0.8;

        if (this.timer <= 0) {
            this.fsm?.changeState('CHASE');
        }
    }
}
