interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
}

export class ParticleSystem {
    el: SVGGElement;
    particles: Particle[] = [];
    private pathEls: Map<string, SVGPathElement> = new Map();

    constructor() {
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.id = 'particle-layer';

        const world = document.getElementById('world-layer');
        if (world) world.appendChild(this.el);
    }

    emit(x: number, y: number, color: string, count: number = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;

            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                color
            });
        }
    }

    update(dt: number) {
        // 1. Update Physics & Filter Dead
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 2. Build Paths
        const pathData = new Map<string, string[]>();

        for (const p of this.particles) {
            const r = (p.life * 5) | 0;
            if (r <= 0) continue;

            const px = p.x | 0;
            const py = p.y | 0;

            // Circle Path: M cx, cy m -r, 0 a r,r 0 1,0 (r*2),0 a r,r 0 1,0 -(r*2),0
            const d = `M${px},${py}m${-r},0a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0`;

            let current = pathData.get(p.color);
            if (!current) {
                current = [];
                pathData.set(p.color, current);
            }
            current.push(d);
        }

        // 3. Render
        // Clear old paths for colors not present this frame
        for (const [color, pathEl] of this.pathEls) {
            if (!pathData.has(color)) {
                pathEl.setAttribute('d', '');
            }
        }

        // Update active paths
        for (const [color, paths] of pathData) {
            let pathEl = this.pathEls.get(color);
            if (!pathEl) {
                pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.setAttribute('fill', color);
                this.el.appendChild(pathEl);
                this.pathEls.set(color, pathEl);
            }
            pathEl.setAttribute('d', paths.join(''));
        }

    }
}
