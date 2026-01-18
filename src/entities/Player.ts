import { Entity } from './Entity';
import { InputSystem } from '../engine/InputSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { EventManager } from '../engine/EventManager';

const PLAYER_SVG = `
  <defs>
    <filter id="glow-soft">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- SHADOW -->
  <ellipse cx="0" cy="15" rx="15" ry="8" fill="#000" opacity="0.4" />

  <!-- LEGS: Cthulhu-like Tentacle Mass (Rotates with Movement) -->
  <g id="legs-group">
     <style>
       /* Whipping Mass Effect: Multiple overlapping squiggles with offset timings */
       .tentacle { fill: none; stroke-linecap: round; }
       .t1 { animation: whip1 0.8s infinite alternate ease-in-out; stroke: #1a3; stroke-width: 5; }
       .t2 { animation: whip2 0.7s infinite alternate ease-in-out; stroke: #2d4; stroke-width: 4; }
       .t3 { animation: whip3 0.9s infinite alternate ease-in-out; stroke: #0f2; stroke-width: 3; }

       @keyframes whip1 {
         0% { d: path("M0,10 Q-10,20 -15,35"); }
         100% { d: path("M0,10 Q-5,25 -20,30"); }
       }
       @keyframes whip2 {
         0% { d: path("M0,10 Q10,20 15,35"); }
         100% { d: path("M0,10 Q5,25 20,30"); }
       }
       @keyframes whip3 {
         0% { d: path("M0,12 Q-5,25 0,40"); }
         100% { d: path("M0,12 Q5,25 0,35"); }
       }
     </style>

     <!-- Base mass -->
     <circle cx="0" cy="10" r="8" fill="#112" />

     <!-- Writhing Tentacles -->
     <path class="tentacle t1" d="M0,10 Q-10,20 -15,35" transform="rotate(10)" />
     <path class="tentacle t2" d="M0,10 Q10,20 15,35" transform="rotate(-10)" />
     <path class="tentacle t3" d="M0,12 Q-5,25 0,40" />

     <!-- Extra small ones for volume -->
     <path class="tentacle t1" d="M0,10 Q-10,20 -15,35" transform="rotate(45) scale(0.7)" style="animation-delay: -0.2s" />
     <path class="tentacle t2" d="M0,10 Q10,20 15,35" transform="rotate(-45) scale(0.7)" style="animation-delay: -0.5s" />
  </g>

  <!-- UPPER BODY (Rotates with Mouse) -->
  <g id="aim-group">

      <!-- WEAPON: Tuning Fork Greatsword -->
      <!-- Positioned slightly offset to the right, facing Forward (-Y) -->
      <g id="weapon-group" transform="translate(12, -10)">
          <!-- Handle -->
          <path d="M0,20 L0,-20" stroke="#444" stroke-width="4" />
          <!-- Fork -->
          <path d="M-6,-20 L-6,-60 L-2,-60 L-2,-20 M2,-20 L2,-60 L6,-60 L6,-20"
                stroke="#4ff" stroke-width="3" fill="none" filter="url(#glow-soft)" shape-rendering="geometricPrecision" />
          <rect x="-8" y="-22" width="16" height="6" fill="#66f" />
          <circle cx="0" cy="-20" r="4" fill="#aff" />
      </g>

      <!-- TORSO / HEAD -->
      <g id="body-visual">
          <!-- Cloak Body -->
          <path d="M-10,-10 L10,-10 L14,10 L-14,10 Z" fill="#222" stroke="#111" stroke-width="2" />
          <!-- Hood -->
          <circle cx="0" cy="-10" r="11" fill="#222" stroke="#111" stroke-width="2" />
          <!-- Face/Void -->
          <circle cx="0" cy="-10" r="8" fill="#000" />
          <!-- Eyes -->
          <rect x="-4" y="-12" width="3" height="3" fill="#4ff" filter="url(#glow-soft)" />
          <rect x="1" y="-12" width="3" height="3" fill="#4ff" filter="url(#glow-soft)" />
      </g>
  </g>
`;

export class Player extends Entity {
    // Stats
    baseSpeed: number = 150;
    rollSpeed: number = 450;
    attackMoveSpeed: number = 60; // Slow movement while attacking

    // Resonance (Stamina)
    maxResonance: number = 100;
    currentResonance: number = 100;
    regenRate: number = 30;
    regenDelay: number = 1.0;
    lastActionTime: number = 0;

    // Overheat (Area 3)
    heat: number = 0;
    maxHeat: number = 100;
    heatIncreaseRate: number = 40;
    heatDecreaseRate: number = 20;

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

    // Parry
    isBlocking: boolean = false;
    blockWindow: number = 0;
    private readonly PARRY_WINDOW: number = 0.3;
    private readonly PARRY_RESONANCE_RESTORE: number = 25;

    // Harmonic Dash
    isPhasing: boolean = false;
    private phaseDamageDealt: Set<string> = new Set();

    // Independent Rotation State
    private moveAngle: number = 0; // Direction legs are facing
    private aimAngle: number = 0;  // Direction body/weapon is facing

    // DOM References
    private legsGroup: SVGGElement | null = null;
    private aimGroup: SVGGElement | null = null;
    private weaponGroup: SVGGElement | null = null;

    constructor(x: number, y: number) {
        super(x, y, PLAYER_SVG);

        // Cache Sub-Elements
        this.legsGroup = this.el.querySelector('#legs-group');
        this.aimGroup = this.el.querySelector('#aim-group');
        this.weaponGroup = this.el.querySelector('#weapon-group');

        // Sync with Progression System
        const prog = ProgressionSystem.getInstance();
        this.maxResonance = prog.maxResonance;
        this.currentResonance = this.maxResonance;

        EventManager.getInstance().on('PLAYER_ATTUNED', (_data: any) => {
            this.maxResonance = prog.maxResonance;
            this.currentResonance = this.maxResonance;
            console.log(`[Player] Attuned! New Max Resonance: ${this.maxResonance}`);
        });
    }

    // Override Render to handle detached rotation
    render(): void {
        // Base Entity handles X/Y translation logic if we didn't override,
        // but Entity.render() includes rotation on the root.
        // We want ROOT to only translate, and sub-groups to rotate.

        // 1. Root Translation (No Rotation)
        this.el.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // 2. Legs Rotation (Movement Direction)
        if (this.legsGroup) {
            // Tentacles are drawn pointing DOWN (+Y) in SVG.
            // Movement Angle 0 is RIGHT (+X).
            // To make tentacles trail BEHIND (point Left), we want +90 deg.
            // To make tentacles face FORWARD (point Right), we want -90 deg.
            // User requested "feet face direction". So we rotate -90.
            const deg = (this.moveAngle * 180 / Math.PI) - 90;
            this.legsGroup.setAttribute('transform', `rotate(${deg})`);
        }

        // 3. Aim Rotation (Mouse Direction)
        if (this.aimGroup) {
            // Body points UP (-Y) in SVG.
            // Mouse angle 0 is RIGHT.
            // To face RIGHT, we rotate +90.
            const deg = (this.aimAngle * 180 / Math.PI) + 90;
            this.aimGroup.setAttribute('transform', `rotate(${deg})`);
        }
    }

    update(dt: number) {
        const input = InputSystem.getInstance();
        const now = Date.now() / 1000;

        // --- 0. State: Asleep ---
        if (this.state === 'ASLEEP') {
            this.el.setAttribute('opacity', '0.5');
            if (input.isKeyDown('Space')) {
                this.state = 'ACTIVE';
                this.el.setAttribute('opacity', '1.0');
            }
            this.render(); // Use our overridden render
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // --- 1. State: Rolling ---
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
            const currentSpeed = this.rollSpeed * easeOut;

            this.x += this.rollDir.x * currentSpeed * dt;
            this.y += this.rollDir.y * currentSpeed * dt;

            // In roll, legs match roll dir
            this.moveAngle = Math.atan2(this.rollDir.y, this.rollDir.x);
            // Body also spins or faces forward? Let's keep body facing aim for skill shots
            // or maybe spin for effect? Let's just face roll dir for consistency
            // this.aimAngle = this.moveAngle;

            this.render();
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

            // Update Move Angle only when moving
            this.moveAngle = Math.atan2(dy, dx);
        }

        // --- 3. Input: Action (Attack) ---
        if (input.isKeyDown('KeyE') && this.attackCooldown <= 0 && this.currentResonance >= 10 && this.heat < 100) {
            this.performAttack(now);
        }

        // --- 4. Input: Action (Roll) ---
        else if (input.isKeyDown('Space') && this.currentResonance >= 15 && this.heat < 100) {
            this.startRoll(dx, dy, now);
        }

        // --- 5. Input: Block ---
        else if (input.isKeyDown('KeyQ') || input.isKeyDown('ShiftLeft')) {
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

            // MOVE LOGIC
            // If attacking, slow down
            let speed = this.baseSpeed;
            if (this.isAttacking) {
                speed = this.attackMoveSpeed;
            }

            // Normal Run
            this.x += dx * speed * dt;
            this.y += dy * speed * dt;

            this.el.setAttribute('opacity', this.isSneaking ? '0.6' : '1.0');
        }

        // --- Overheat ---
        const zoneSystem = (window as any).ZoneSystem;
        if (zoneSystem && zoneSystem.currentZoneIndex === 2) {
            if (dx === 0 && dy === 0 && !this.isRolling) {
                this.heat = Math.min(this.maxHeat, this.heat + this.heatIncreaseRate * dt);
            } else {
                this.heat = Math.max(0, this.heat - this.heatDecreaseRate * dt);
            }
            if (this.heat >= 100) {
                this.el.style.filter = 'drop-shadow(0 0 10px orange) brightness(1.5)';
            } else {
                this.el.style.filter = 'none';
            }
            const ui = (window as any).UIManager?.getInstance();
            if (ui) ui.updateOverheat(this.heat);
        } else {
            this.heat = 0;
        }

        // --- Resonance Regen ---
        const regenBonus = this.isSneaking ? 0.5 : 1.0;
        if (now - this.lastActionTime > this.regenDelay) {
            this.currentResonance = Math.min(this.maxResonance, this.currentResonance + (this.regenRate * dt * regenBonus));
        }

        // --- Resonance Overload ---
        if (this.currentResonance >= this.maxResonance) {
            EventManager.getInstance().emit('RESONANCE_BURST', {
                x: this.x,
                y: this.y,
                damage: 30,
                radius: 100
            });
            this.currentResonance = this.maxResonance * 0.5;
        }

        // --- Rotation Logic ---
        // Body/Aim always faces mouse
        const mouseVec = input.getVectorToMouse(this.x, this.y);
        this.aimAngle = Math.atan2(mouseVec.y, mouseVec.x);

        // Update UI
        this.updateDiegeticUI(dt);

        // Render (updates transforms)
        this.render();
    }

    private updateDiegeticUI(_dt: number) {
        // Since we changed the SVG structure, the old #resonance-ring might be gone or needs to be re-added.
        // In the new SVG, I removed the resonance ring for a cleaner look, assuming UI HUD is enough
        // OR I should add it back if it's critical.
        // The prompt asked for "Better looking", maybe HUD is better.
        // But the code calls updateDiegeticUI. Let's make it safe.
        const ring = this.el.querySelector('#resonance-ring');
        if (!ring) return;

        // ... (rest of logic if ring exists)
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
            if (this.currentResonance > this.maxResonance) {
                this.currentResonance = this.maxResonance;
            }
            EventManager.getInstance().emit('PARRY_SUCCESS', { x: this.x, y: this.y });

            const body = this.el.querySelector('#body-visual circle'); // Adjust selector
            if (body) {
                body.setAttribute('fill', '#4ff');
                setTimeout(() => body.setAttribute('fill', '#222'), 200);
            }
            return;
        }

        const body = this.el.querySelector('#body-visual circle');
        if (body) {
            body.setAttribute('fill', '#f00');
            setTimeout(() => body.setAttribute('fill', '#222'), 100);
        }
        this.currentResonance -= amount;
    }

    private performAttack(now: number) {
        this.currentResonance -= 10;
        this.lastActionTime = now;
        this.attackCooldown = 0.5;
        this.isAttacking = true;

        // Visual Feedback: Weapon Thrust (Detached)
        if (this.weaponGroup) {
            // Reset transition
            this.weaponGroup.style.transition = 'none';

            // Thrust Forward (Relative to Aim Group)
            // The Aim Group is rotated so -Y is Forward.
            // Initial Pos: translate(12, -10)
            // Thrust Target: translate(12, -40) (Move "Up" in local space, which is Forward visually)

            // Use CSS transitions for smooth thrust
            this.weaponGroup.style.transition = 'transform 0.05s ease-out';
            this.weaponGroup.setAttribute('transform', 'translate(12, -50)');

            // Retract
            setTimeout(() => {
                 this.weaponGroup!.style.transition = 'transform 0.2s ease-in';
                 this.weaponGroup!.setAttribute('transform', 'translate(12, -10)');
            }, 80);

            setTimeout(() => {
                this.isAttacking = false;
            }, 300);
        }

        // Emit Global Event for Hitbox Check
        // Attack direction is strictly Aim Angle
        const attackEvent = new CustomEvent('player-attack', {
            detail: { x: this.x, y: this.y, rot: this.aimAngle, range: 70, angle: Math.PI / 2 }
        });
        document.dispatchEvent(attackEvent);
    }
}
