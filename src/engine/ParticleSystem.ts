interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    el?: SVGCircleElement;
}

export class ParticleSystem {
    el: SVGGElement;
    particles: Particle[] = [];
    private pool: SVGCircleElement[] = [];

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

            // Get from pool or create
            let circle = this.pool.pop();
            if (!circle) {
                circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                this.el.appendChild(circle);
            }
            circle.setAttribute('style', 'display: block');
            circle.setAttribute('fill', color);

            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                color,
                el: circle
            });
        }
    }

    update(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.life <= 0) {
                if (p.el) {
                    p.el.setAttribute('style', 'display: none');
                    this.pool.push(p.el);
                }
                this.particles.splice(i, 1);
                continue;
            }

            if (p.el) {
                p.el.setAttribute('cx', p.x.toString());
                p.el.setAttribute('cy', p.y.toString());
                p.el.setAttribute('r', (p.life * 5).toString());
            }
        }
    }
}
