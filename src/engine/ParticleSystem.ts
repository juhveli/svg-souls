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
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.life > 0) {
                if (i !== writeIdx) {
                    this.particles[writeIdx] = p;
                }
                writeIdx++;
            }
        }
        this.particles.length = writeIdx;

        // 2. Build Paths
        const pathData = new Map<string, string>();

        for (const p of this.particles) {
            const r = p.life * 5;
            if (r <= 0) continue;

            // Circle Path: M cx, cy m -r, 0 a r,r 0 1,0 (r*2),0 a r,r 0 1,0 -(r*2),0
            const d = `M${p.x},${p.y}m${-r},0a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0`;

            const current = pathData.get(p.color) || '';
            pathData.set(p.color, current + d);
        }

        // 3. Render
        // Clear old paths for colors not present this frame
        for (const [color, pathEl] of this.pathEls) {
            if (!pathData.has(color)) {
                pathEl.setAttribute('d', '');
            }
        }

        // Update active paths
        for (const [color, d] of pathData) {
            let pathEl = this.pathEls.get(color);
            if (!pathEl) {
                pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.setAttribute('fill', color);
                this.el.appendChild(pathEl);
                this.pathEls.set(color, pathEl);
            }
            pathEl.setAttribute('d', d);
        }

    }
}
