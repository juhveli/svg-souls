import { Entity } from './Entity';
import { InputSystem } from '../engine/InputSystem';
import { EventManager } from '../engine/EventManager';

export class Player extends Entity {
    // Stats
    maxResonance: number = 100;
    currentResonance: number = 50;
    heat: number = 0;
    maxHeat: number = 100;

    // Movement
    baseSpeed: number = 200;
    attackMoveSpeed: number = 50;
    moveAngle: number = 0;
    aimAngle: number = 0;

    // State
    state: 'ASLEEP' | 'ACTIVE' = 'ACTIVE';
    isRolling: boolean = false;
    isAttacking: boolean = false;
    isBlocking: boolean = false;
    isSneaking: boolean = false;
    isInvulnerable: boolean = false;
    isPhasing: boolean = false;

    // Timers
    attackCooldown: number = 0;
    rollTimer: number = 0;
    lastActionTime: number = 0;
    blockWindow: number = 0;

    // Constants
    PARRY_WINDOW = 0.2;
    PARRY_RESONANCE_RESTORE = 20;
    regenRate = 5;
    regenDelay = 2.0;
    heatIncreaseRate = 20;
    heatDecreaseRate = 10;

    // Logic
    rollDir = { x: 0, y: 0 };
    phaseDamageDealt = new Set<string>();

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 64;
        this.height = 64;
        this.typeID = 1;
    }

    update(dt: number) {
        const input = InputSystem.getInstance();
        const now = Date.now() / 1000;

        // State: Asleep
        if (this.state === 'ASLEEP') {
            if (input.isKeyDown('Space')) {
                this.state = 'ACTIVE';
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Roll Logic
        if (this.isRolling) {
            this.rollTimer -= dt;
            if (this.rollTimer <= 0.3) this.isInvulnerable = false;
            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.isInvulnerable = false;
                this.isPhasing = false;
            }

            const t = this.rollTimer / 0.6;
            const easeOut = t * t;
            const currentSpeed = 600 * easeOut;

            this.x += this.rollDir.x * currentSpeed * dt;
            this.y += this.rollDir.y * currentSpeed * dt;
            return;
        }

        // Movement Input
        let dx = 0;
        let dy = 0;
        if (input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('KeyD')) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
            this.moveAngle = Math.atan2(dy, dx);
        }

        // Actions
        if (input.isKeyDown('KeyE') && this.attackCooldown <= 0 && this.currentResonance >= 10 && this.heat < 100) {
            this.performAttack(now);
        } else if (input.isKeyDown('Space') && this.currentResonance >= 15 && this.heat < 100) {
            this.startRoll(dx, dy, now);
        } else if (input.isKeyDown('KeyQ') || input.isKeyDown('ShiftLeft')) {
            if (!this.isBlocking) {
                this.isBlocking = true;
                this.blockWindow = this.PARRY_WINDOW;
            }
            this.isSneaking = true;
            const speed = this.baseSpeed * 0.3;
            this.x += dx * speed * dt;
            this.y += dy * speed * dt;
        } else {
            this.isBlocking = false;
            this.blockWindow = 0;
            this.isSneaking = false;

            let speed = this.baseSpeed;
            if (this.isAttacking) speed = this.attackMoveSpeed;

            this.x += dx * speed * dt;
            this.y += dy * speed * dt;
        }

        // Mouse Aim
        const mouseVec = input.getVectorToMouse(this.x, this.y);
        this.aimAngle = Math.atan2(mouseVec.y, mouseVec.x);

        // Heat & Regen Logic
        const zoneSystem = (window as any).ZoneSystem;
        if (zoneSystem && zoneSystem.currentZoneIndex === 2) {
             if (dx === 0 && dy === 0 && !this.isRolling) {
                this.heat = Math.min(this.maxHeat, this.heat + this.heatIncreaseRate * dt);
             } else {
                this.heat = Math.max(0, this.heat - this.heatDecreaseRate * dt);
             }
             const ui = (window as any).UIManager?.getInstance();
             if (ui) ui.updateOverheat(this.heat);
        } else {
            this.heat = 0;
        }

        if (now - this.lastActionTime > this.regenDelay) {
            const regenBonus = this.isSneaking ? 0.5 : 1.0;
            this.currentResonance = Math.min(this.maxResonance, this.currentResonance + (this.regenRate * dt * regenBonus));
        }
    }

    private startRoll(dx: number, dy: number, now: number) {
        this.isRolling = true;
        this.isInvulnerable = true;
        this.isPhasing = true;
        this.rollTimer = 0.6;
        this.lastActionTime = now;
        this.phaseDamageDealt.clear();
        this.currentResonance -= 15;

        if (dx === 0 && dy === 0) {
            const input = InputSystem.getInstance();
            const vec = input.getVectorToMouse(this.x, this.y);
            this.rollDir = vec;
        } else {
            this.rollDir = { x: dx, y: dy };
        }
        EventManager.getInstance().emit('HARMONIC_DASH_START', { x: this.x, y: this.y });
    }

    takeDamage(amount: number) {
        if (this.isInvulnerable) return;

        if (this.isBlocking && this.blockWindow > 0) {
            this.currentResonance += this.PARRY_RESONANCE_RESTORE;
            if (this.currentResonance > this.maxResonance) this.currentResonance = this.maxResonance;
            EventManager.getInstance().emit('PARRY_SUCCESS', { x: this.x, y: this.y });
            return;
        }

        this.currentResonance -= amount;
        EventManager.getInstance().emit('ENTITY_DAMAGED', { type: 'player', x: this.x, y: this.y, id: this.id });
    }

    private performAttack(now: number) {
        this.currentResonance -= 10;
        this.lastActionTime = now;
        this.attackCooldown = 0.5;
        this.isAttacking = true;

        setTimeout(() => {
            this.isAttacking = false;
        }, 300);

        const attackEvent = new CustomEvent('player-attack', {
            detail: { x: this.x, y: this.y, rot: this.aimAngle, range: 70, angle: Math.PI / 2 }
        });
        document.dispatchEvent(attackEvent);
    }
}
