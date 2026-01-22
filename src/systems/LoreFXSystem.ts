import { Entity } from '../entities/Entity';

export class LoreFXSystem {
    private worldLayer: SVGGElement;
    private cymaticOverlay: SVGPathElement;
    private echoContainer: SVGGElement;
    private causticsOverlay: SVGGElement;

    // Echo State
    private echoTimer: number = 0;
    private readonly echoInterval: number = 0.1; // Spawn echo every 100ms
    private echoes: { el: SVGElement, life: number }[] = [];

    // Caustics State
    private causticTimer: number = 0;

    constructor() {
        const worldRef = document.getElementById('world-layer');

        // 1. Create Containers
        this.echoContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.echoContainer.id = 'echo-layer';
        this.echoContainer.setAttribute('opacity', '0.5');

        this.cymaticOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.cymaticOverlay.id = 'cymatic-floor';
        this.cymaticOverlay.setAttribute('fill', 'none');
        this.cymaticOverlay.setAttribute('stroke', '#4cf');
        this.cymaticOverlay.setAttribute('stroke-width', '1');
        this.cymaticOverlay.setAttribute('opacity', '0');
        this.echoContainer.appendChild(this.cymaticOverlay);

        this.causticsOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.causticsOverlay.id = 'caustics-layer';
        this.causticsOverlay.setAttribute('filter', 'url(#glass-shine)');
        this.causticsOverlay.setAttribute('pointer-events', 'none');

        if (worldRef) {
            this.worldLayer = worldRef as unknown as SVGGElement;
            // Insert at start
            if (this.worldLayer.firstChild) {
                this.worldLayer.insertBefore(this.causticsOverlay, this.worldLayer.firstChild);
                this.worldLayer.insertBefore(this.echoContainer, this.causticsOverlay);
            } else {
                this.worldLayer.appendChild(this.causticsOverlay);
                this.worldLayer.appendChild(this.echoContainer);
            }
        } else {
            console.error("LoreFXSystem: 'world-layer' not found! FX disabled.");
            this.worldLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g'); // Dummy
        }
    }

    update(dt: number, player: Entity) {
        // --- Echo Trails (Visual Time) ---
        // Only spawn if player is moving efficiently
        // Check velocity or just input state? Let's check state.
        // Assuming we can check if player position changed significantly, but for now let's rely on a helper or just public props
        // We'll trust the game calls us.

        this.echoTimer -= dt;
        if (this.echoTimer <= 0) {
            this.spawnEcho(player);
            this.echoTimer = this.echoInterval;
        }

        // Update Echoes (Fade out)
        for (let i = this.echoes.length - 1; i >= 0; i--) {
            const echo = this.echoes[i];
            echo.life -= dt;
            if (echo.life <= 0) {
                echo.el.remove();
                this.echoes.splice(i, 1);
            } else {
                // Fade opacity: Life 0.5 -> 0 => Opacity 0.5 -> 0
                echo.el.setAttribute('opacity', (echo.life).toString());
            }
        }

        // --- Cymatics Decay ---
        const currentOp = parseFloat(this.cymaticOverlay.getAttribute('opacity') || '0');
        if (currentOp > 0) {
            this.cymaticOverlay.setAttribute('opacity', Math.max(0, currentOp - dt * 2).toString());
        }

        // --- Refractive Caustics (Visual "Light/Matter") ---
        this.causticTimer += dt;
        if (this.causticTimer > 0.05) { // 20fps for caustics is enough
            this.updateCaustics();
            this.causticTimer = 0;
        }
    }

    private updateCaustics() {
        // Clear old caustics
        this.causticsOverlay.innerHTML = '';

        // Only show if resonance is high enough (Theme: Light = Resonance)
        const game = (window as any).Game;
        if (game && game.player && game.player.currentResonance < 20) return;

        // Draw 3 shifting geometric pools
        for (let i = 0; i < 3; i++) {
            const time = Date.now() / 1000;
            const x = 400 + Math.sin(time + i) * 100;
            const y = 300 + Math.cos(time * 0.5 + i) * 50;
            const size = 150 + Math.sin(time * 0.8) * 50;

            const path = this.generateCausticPath(x, y, size, time + i);
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', path);
            pathEl.setAttribute('fill', i === 0 ? '#4ff' : (i === 1 ? '#aaf' : '#faf'));
            pathEl.setAttribute('opacity', '0.05');
            this.causticsOverlay.appendChild(pathEl);
        }
    }

    private generateCausticPath(cx: number, cy: number, size: number, seed: number): string {
        let d = "";
        const points = 8;
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const wobble = Math.sin(seed + i) * 20;
            const x = cx + Math.cos(angle) * (size + wobble);
            const y = cy + Math.sin(angle) * (size + wobble);
            d += (i === 0 ? `M${x},${y}` : `L${x},${y}`);
        }
        d += "Z";
        return d;
    }

    triggerImpact(x: number, y: number, strength: number) {
        // "Visualizing Sound"
        // When a heavy impact happens, the floor flashes a geometric pattern

        // 1. Generate a Chladni Pattern (Procedural Mandala)
        // Simple radial sine wave visual
        const r = strength * 50;
        const path = this.generateChladniPath(x, y, r);

        this.cymaticOverlay.setAttribute('d', path);
        this.cymaticOverlay.setAttribute('opacity', '0.8'); // Flash visible
    }

    private spawnEcho(target: Entity) {
        // Clone the entity's looking
        // This is a "Frozen Moment" in time
        // TODO: Update for WebGPU (No DOM 'el')
        if (!(target as any).el) return;

        const clone = (target as any).el.cloneNode(true) as SVGElement;
        clone.removeAttribute('id'); // specific ID not needed
        clone.setAttribute('transform', `translate(${target.x}, ${target.y}) rotate(${target.rotation * 180 / Math.PI})`);

        // Style it as a "Ghost"
        const shape = clone.querySelector('circle') || clone.querySelector('rect');
        if (shape) {
            shape.setAttribute('fill', 'none');
            shape.setAttribute('stroke', '#aef'); // Chrono-blue
            shape.setAttribute('stroke-width', '1');
        }

        this.echoContainer.appendChild(clone);
        this.echoes.push({ el: clone, life: 0.4 }); // Lasts 0.4s
    }

    private generateChladniPath(cx: number, cy: number, r: number): string {
        // Create a geometric flower/wave pattern
        let d = "";
        const petals = 4 + Math.floor(Math.random() * 4) * 2; // 4, 6, 8, 10...
        const step = (Math.PI * 2) / 60; // Resolution

        for (let a = 0; a < Math.PI * 2; a += step) {
            const rad = r + Math.sin(a * petals) * (r * 0.5);
            const x = cx + Math.cos(a) * rad;
            const y = cy + Math.sin(a) * rad;
            d += (a === 0 ? `M${x},${y}` : `L${x},${y}`);
        }
        d += "Z";
        return d;
    }
}
