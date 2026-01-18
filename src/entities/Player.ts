import { Entity } from './Entity';
import { InputSystem } from '../engine/InputSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { EventManager } from '../engine/EventManager';

const PLAYER_SVG = `
  <!-- The Echo Walker (Soft One) -->
  <defs>
    <radialGradient id="player-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#4ff;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#4ff;stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="weapon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a0f"/>
      <stop offset="50%" style="stop-color:#4ff"/>
      <stop offset="100%" style="stop-color:#a0f"/>
    </linearGradient>
  </defs>
  
  <!-- Ambient Glow -->
  <circle cx="0" cy="0" r="40" fill="url(#player-glow)" opacity="0.5" />
  
  <!-- Cloak/Body (with breathing animation) -->
  <g style="animation: breathe 3s ease-in-out infinite; transform-origin: center bottom;">
    <path d="M-12,5 Q-15,-5 -10,-15 L0,-20 L10,-15 Q15,-5 12,5 L8,20 Q0,25 -8,20 Z" 
          fill="#1a1a1a" stroke="#333" stroke-width="1"/>
    <!-- Cloak Inner Shadow -->
    <path d="M-8,0 Q-10,-8 -5,-15 L0,-18 L5,-15 Q10,-8 8,0 L5,18 Q0,22 -5,18 Z" 
          fill="#111" opacity="0.7"/>
  </g>
  
  <!-- Hood -->
  <ellipse cx="0" cy="-12" rx="10" ry="8" fill="#222" stroke="#333" stroke-width="1"/>
  <path d="M-8,-10 Q0,-18 8,-10" fill="none" stroke="#333" stroke-width="1"/>
  
  <!-- Glowing Eyes (with pulse animation) -->
  <ellipse cx="-4" cy="-11" rx="2" ry="1.5" fill="#4ff" filter="url(#glow)" style="animation: glow-pulse 2s ease-in-out infinite;"/>
  <ellipse cx="4" cy="-11" rx="2" ry="1.5" fill="#4ff" filter="url(#glow)" style="animation: glow-pulse 2s ease-in-out infinite; animation-delay: 0.5s;"/>
  
  <!-- Tuning Fork Greatsword (Weapon) - Scaled Up -->
  <g id="weapon" transform="translate(20, -10) rotate(-45)">
    <!-- Handle -->
    <rect x="-3" y="0" width="6" height="50" fill="#444" stroke="#333" stroke-width="1"/>
    <!-- Fork Prongs (Left) -->
    <path d="M-12,-25 L-12,5 L-3,5 L-3,-18 Z" fill="url(#weapon-gradient)" stroke="#88f" stroke-width="1" filter="url(#glow)"/>
    <!-- Fork Prongs (Right) -->
    <path d="M12,-25 L12,5 L3,5 L3,-18 Z" fill="url(#weapon-gradient)" stroke="#88f" stroke-width="1" filter="url(#glow)"/>
    <!-- Center Crystal -->
    <ellipse cx="0" cy="-8" rx="4" ry="6" fill="#4ff" opacity="0.9" filter="url(#glow)"/>
    <!-- Cross Guard -->
    <rect x="-15" y="-2" width="30" height="4" fill="#555" stroke="#333" stroke-width="1"/>
  </g>
  
  <!-- Diegetic Resonance Ring -->
  <circle id="resonance-ring" cx="0" cy="0" r="25" fill="none" stroke="#4ff" stroke-width="2" stroke-dasharray="100 100" opacity="0.6" />
`;

export class Player extends Entity {
    // Stats
    baseSpeed: number = 150;
    rollSpeed: number = 450;

    // Resonance (Stamina)
    maxResonance: number = 100;
    currentResonance: number = 100;
    regenRate: number = 30;
    regenDelay: number = 1.0;
    lastActionTime: number = 0;

    // Overheat (Area 3)
    heat: number = 0;
    maxHeat: number = 100;
    heatIncreaseRate: number = 40; // Per second of stillness
    heatDecreaseRate: number = 20; // Per second of movement

    // State
    state: 'ASLEEP' | 'ACTIVE' = 'ASLEEP';
    isRolling: boolean = false;
    isInvulnerable: boolean = false;
    isSneaking: boolean = false;
    rollTimer: number = 0;
    rollDir: { x: number, y: number } = { x: 0, y: 0 };

    // Attack
    isAttacking: boolean = false;
    attackCooldown: number = 0;

    // Parry (Tunge)
    isBlocking: boolean = false;
    blockWindow: number = 0; // Active parry window in seconds
    private readonly PARRY_WINDOW: number = 0.3;
    private readonly PARRY_RESONANCE_RESTORE: number = 25;

    // Harmonic Dash
    isPhasing: boolean = false;
    private phaseDamageDealt: Set<string> = new Set(); // Track what we've hit this roll

    constructor(x: number, y: number) {
        super(x, y, PLAYER_SVG);

        // Sync with Progression System
        const prog = ProgressionSystem.getInstance();
        this.maxResonance = prog.maxResonance;
        this.currentResonance = this.maxResonance;

        // Listen for Attunement (Level Up)
        EventManager.getInstance().on('PLAYER_ATTUNED', (_data: any) => {
            this.maxResonance = prog.maxResonance;
            // Full heal on level up? Lore-accurate: Resonance Spike.
            this.currentResonance = this.maxResonance;
            console.log(`[Player] Attuned! New Max Resonance: ${this.maxResonance}`);
        });
    }

    update(dt: number) {
        const input = InputSystem.getInstance();
        const now = Date.now() / 1000;

        // --- 0. State: Asleep (Awakening Sequence) ---
        if (this.state === 'ASLEEP') {
            this.el.setAttribute('opacity', '0.5');
            const line = this.el.querySelector('line');
            if (line) line.setAttribute('opacity', '0'); // Hide facing line

            if (input.isKeyDown('Space')) {
                this.state = 'ACTIVE';
                this.el.setAttribute('opacity', '1.0');
                if (line) line.setAttribute('opacity', '1');
                // Instead, let's just emit an event or wait for next loop
            }
            super.render();
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // --- 1. State: Rolling ---
        if (this.isRolling) {
            this.rollTimer -= dt;

            // I-Frame Logic
            if (this.rollTimer <= 0.3) {
                this.isInvulnerable = false;
            }

            // End Roll
            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.isInvulnerable = false;
                this.isPhasing = false; // End Harmonic Dash
            }

            // Apply Velocity (Ease-Out)
            const t = this.rollTimer / 0.6;
            const easeOut = t * t;
            const currentSpeed = this.rollSpeed * easeOut;

            this.x += this.rollDir.x * currentSpeed * dt;
            this.y += this.rollDir.y * currentSpeed * dt;

            super.render();
            return;
        }

        // --- 2. Input: Movement ---
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
        }

        // --- 3. Input: Action (Attack) - E Key ---
        if (input.isKeyDown('KeyE') && this.attackCooldown <= 0 && this.currentResonance >= 10 && this.heat < 100) {
            this.performAttack(now);
        }

        // --- 4. Input: Action (Roll) ---
        else if (input.isKeyDown('Space') && this.currentResonance >= 15 && this.heat < 100) {
            this.startRoll(dx, dy, now);
        }
        // --- 5. Input: Block (Parry/Tunge) ---
        else if (input.isKeyDown('KeyQ') || input.isKeyDown('ShiftLeft')) {
            if (!this.isBlocking) {
                this.isBlocking = true;
                this.blockWindow = this.PARRY_WINDOW;
            }
            // Slow movement while blocking
            this.isSneaking = true;
            const speed = this.baseSpeed * 0.3;
            this.x += dx * speed * dt;
            this.y += dy * speed * dt;
        } else {
            // Not blocking anymore
            this.isBlocking = false;
            this.blockWindow = 0;

            // Check Sneak
            this.isSneaking = false;
            const speed = this.baseSpeed;

            // Normal Run/Sneak
            this.x += dx * speed * dt;
            this.y += dy * speed * dt;

            // Visual: Lower opacity when sneaking
            this.el.setAttribute('opacity', this.isSneaking ? '0.6' : '1.0');
        }

        // --- 4.5 Overheat Logic (Area 3) ---
        const zoneSystem = (window as any).ZoneSystem;
        if (zoneSystem && zoneSystem.currentZoneIndex === 2) {
            if (dx === 0 && dy === 0 && !this.isRolling) {
                this.heat = Math.min(this.maxHeat, this.heat + this.heatIncreaseRate * dt);
            } else {
                this.heat = Math.max(0, this.heat - this.heatDecreaseRate * dt);
            }

            // Visual Overheat Feedback
            if (this.heat >= 100) {
                this.el.style.filter = 'drop-shadow(0 0 10px orange) brightness(1.5)';
            } else {
                this.el.style.filter = 'none';
            }

            // Update UI
            const ui = (window as any).UIManager?.getInstance();
            if (ui) ui.updateOverheat(this.heat);
        } else {
            this.heat = 0; // Reset if not in Area 3
        }

        // --- 5. Resonance Regen ---
        const regenBonus = this.isSneaking ? 0.5 : 1.0; // Slower regen while sneaking (focusing)
        if (now - this.lastActionTime > this.regenDelay) {
            this.currentResonance = Math.min(this.maxResonance, this.currentResonance + (this.regenRate * dt * regenBonus));
        }

        // --- 6. Resonance Overload (Forced AoE at 100%) ---
        if (this.currentResonance >= this.maxResonance) {
            // Trigger Shatter Pulse!
            EventManager.getInstance().emit('RESONANCE_BURST', {
                x: this.x,
                y: this.y,
                damage: 30,
                radius: 100
            });

            // Cost: Lose 50% resonance
            this.currentResonance = this.maxResonance * 0.5;

            // Visual feedback
            const ring = this.el.querySelector('#resonance-ring');
            if (ring) {
                ring.setAttribute('stroke', '#ff0');
                ring.setAttribute('stroke-width', '5');
                setTimeout(() => {
                    ring.setAttribute('stroke', '#4ff');
                    ring.setAttribute('stroke-width', '2');
                }, 300);
            }

            console.log('[Player] RESONANCE OVERLOAD! Shatter Pulse emitted.');
        }

        // Rotation
        const mouseVec = input.getVectorToMouse(this.x, this.y);
        this.rotation = Math.atan2(mouseVec.y, mouseVec.x);

        this.updateDiegeticUI(dt);
        super.render();
    }

    private updateDiegeticUI(_dt: number) {
        const ring = this.el.querySelector('#resonance-ring');
        if (!ring) return;

        const pct = this.currentResonance / this.maxResonance;

        // Update Dash Displacement (Circular progress)
        const circumference = 2 * Math.PI * 18;
        const offset = circumference * (1 - pct);
        ring.setAttribute('stroke-dasharray', `${circumference}`);
        ring.setAttribute('stroke-dashoffset', `${offset}`);

        // Update Color
        if (pct < 0.2) {
            ring.setAttribute('stroke', '#f44');
        } else {
            ring.setAttribute('stroke', '#4ff');
        }

        // Pulse if high resonance
        if (pct > 0.9) {
            const scale = 1 + Math.sin(Date.now() / 100) * 0.1;
            ring.setAttribute('stroke-width', (2 * scale).toString());
        } else {
            ring.setAttribute('stroke-width', '2');
        }
    }

    private startRoll(dx: number, dy: number, now: number) {
        this.isRolling = true;
        this.isInvulnerable = true;
        this.isPhasing = true; // HARMONIC DASH: Can pass through enemies
        this.rollTimer = 0.6;
        this.lastActionTime = now;
        this.phaseDamageDealt.clear(); // Reset which enemies we've hit

        // Cost
        this.currentResonance -= 15;

        if (dx === 0 && dy === 0) {
            const input = InputSystem.getInstance();
            const vec = input.getVectorToMouse(this.x, this.y);
            this.rollDir = vec;
        } else {
            this.rollDir = { x: dx, y: dy };
        }

        // Emit Dash Start for VFX
        EventManager.getInstance().emit('HARMONIC_DASH_START', { x: this.x, y: this.y });
    }

    takeDamage(amount: number) {
        if (this.isInvulnerable) return;

        // PARRY CHECK - Tunge Mechanic
        if (this.isBlocking && this.blockWindow > 0) {
            // Successful Parry!
            this.currentResonance += this.PARRY_RESONANCE_RESTORE;
            if (this.currentResonance > this.maxResonance) {
                this.currentResonance = this.maxResonance;
            }
            EventManager.getInstance().emit('PARRY_SUCCESS', { x: this.x, y: this.y });
            console.log(`[Player] PARRY! +${this.PARRY_RESONANCE_RESTORE} Resonance`);

            // Flash Cyan (Tuned)
            const body = this.el.querySelector('circle');
            if (body) {
                body.setAttribute('fill', '#4ff');
                setTimeout(() => body.setAttribute('fill', '#dcb'), 200);
            }
            return; // No damage taken
        }

        // Flash Red
        const body = this.el.querySelector('circle');
        if (body) {
            body.setAttribute('fill', '#f00');
            setTimeout(() => body.setAttribute('fill', '#dcb'), 100);
        }

        // Take Damage
        this.currentResonance -= amount;

        // Simple Knockback
        this.x -= Math.cos(this.rotation) * 20;
        this.y -= Math.sin(this.rotation) * 20;
    }

    private performAttack(now: number) {
        this.currentResonance -= 10;
        this.lastActionTime = now;
        this.attackCooldown = 0.5; // 500ms swing speed
        this.isAttacking = true;

        // Visual Feedback: Weapon Thrust Animation
        const weapon = this.el.querySelector('#weapon');
        if (weapon) {
            // Thrust forward and retract (translation-based, not rotation)
            weapon.setAttribute('transform', 'translate(35, -15) rotate(-45)'); // Thrust out
            setTimeout(() => {
                weapon.setAttribute('transform', 'translate(45, -20) rotate(-45)'); // Full extension
            }, 80);
            setTimeout(() => {
                weapon.setAttribute('transform', 'translate(20, -10) rotate(-45)'); // Retract to rest
                this.isAttacking = false;
            }, 200);
        }

        // Emit Global Event for Hitbox Check
        const attackEvent = new CustomEvent('player-attack', {
            detail: { x: this.x, y: this.y, rot: this.rotation, range: 60, angle: Math.PI / 2 }
        });
        document.dispatchEvent(attackEvent);
    }
}
