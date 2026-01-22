import { SVGAssets } from './SVGAssets';
import { GameMap } from './GameMap';

export class CrystalBelfryMap extends GameMap {
    el: SVGGElement;
    width: number = 1600;
    height: number = 600;

    constructor() {
        super();
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.id = 'map-layer';

        this.generateGeometry();

        // Add to World
        const world = document.getElementById('world-layer');
        if (world) {
            // Insert before entities so they walk on top
            world.insertBefore(this.el, world.firstChild);
        }
    }

    private generateGeometry() {
        // 1. Background (The Singularity)
        this.addRect(0, 0, this.width, this.height, '#1a1a1a');

        // 2. Floor (Fractured Glass)
        this.addRect(0, 500, this.width, 100, '#0a0a0a'); // Void floor

        // 3. Crystal Spires (Background)
        for (let i = 0; i < 15; i++) {
            const w = 40 + Math.random() * 60;
            const h = 200 + Math.random() * 300;
            const x = Math.random() * (this.width - w);
            const y = 500 - h; // Rising from floor

            const spirePath = SVGAssets.crystalSpire(x, y, w, h);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', spirePath);

            // Color: Deep Magic or Pale Bone with transparency
            // Using a mix of dark and bright to simulate glimmering in void
            const isBright = Math.random() > 0.7;
            const color = isBright ? '#3296c8' : '#2a2a3a';
            const opacity = isBright ? '0.3' : '0.5';

            path.setAttribute('fill', color);
            path.setAttribute('opacity', opacity);
            path.setAttribute('stroke', '#44ffff'); // Resonance Cyan outline
            path.setAttribute('stroke-width', '1');

            // Add CSS class for sway animation
            path.classList.add('crystal-sway');

            this.el.appendChild(path);
        }

        // 4. Chains (Binding the Reality)
        // Hanging from top
         for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.width;
            const len = 100 + Math.random() * 300;
            const chainPath = SVGAssets.chain(x, -50, x, len, 50);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', chainPath);
            path.setAttribute('stroke', '#222');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            this.el.appendChild(path);
         }

        // Walls
        this.addRect(0, 0, 20, 600, '#00000088');
        this.addRect(this.width - 20, 0, 20, 600, '#00000088');

        // TODO: Spawn Gatekeeper entity when implemented (W5 Sub-Boss)
    }

    private addRect(x: number, y: number, w: number, h: number, color: string) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', w.toString());
        rect.setAttribute('height', h.toString());
        rect.setAttribute('fill', color);
        this.el.appendChild(rect);
    }

    destroy() {
        this.el.remove();
    }
}
