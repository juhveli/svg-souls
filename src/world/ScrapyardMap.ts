import { SVGAssets } from './SVGAssets';
import { GameMap } from './GameMap';

export class ScrapyardMap extends GameMap {
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
        // 1. Base Floor (The Junk Pile)
        // Expanded to 1600 width
        const junkPath = SVGAssets.junkPile(0, 500, 1600, 100, 123);
        const floor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        floor.setAttribute('d', junkPath);
        floor.setAttribute('fill', '#1a1111');
        floor.setAttribute('stroke', '#3a2222');
        floor.setAttribute('stroke-width', '2');
        this.el.appendChild(floor);

        // 2. Foreground Debris (Broken Gears)
        this.el.innerHTML += `
            <path d="${SVGAssets.gear(200, 520, 60, 8)}" fill="#221" stroke="#432" stroke-width="2" transform="rotate(15, 200, 520)" />
            <path d="${SVGAssets.gear(600, 550, 40, 12)}" fill="#111" stroke="#432" stroke-width="2" transform="rotate(-10, 600, 550)" />
        `;

        // 3. Hanging Chains (Sense of Depth)
        this.el.innerHTML += `
             <path d="${SVGAssets.chain(100, -10, 100, 300, 0)}" stroke="#222" stroke-width="4" fill="none" />
             <path d="${SVGAssets.chain(700, -10, 700, 250, 0)}" stroke="#222" stroke-width="4" fill="none" />
             <!-- Loose hanging loop -->
             <path d="${SVGAssets.chain(300, 0, 500, 0, 150)}" stroke="#111" stroke-width="3" fill="none" />
        `;

        // 4. Glass Shards (The Shatter)
        for (let i = 0; i < 30; i++) { // Doubled shards
            const x = Math.random() * 1600;
            const y = 450 + Math.random() * 150; // Only on floor
            const rot = Math.random() * 360;
            const size = 5 + Math.random() * 10;
            // Use glass filter
            this.el.innerHTML += `
                <path d="M${x},${y} l${size},${size * 2} l${-size * 2},${size} z" 
                      fill="#aff" opacity="0.4" 
                      filter="url(#glass-shine)" 
                      transform="rotate(${rot}, ${x}, ${y})" />
            `;
        }

        // Walls (Invisible Collision boundaries, visualized as darker shadows)
        this.addRect(0, 0, 20, 600, '#00000088');
        this.addRect(1580, 0, 20, 600, '#00000088');
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
