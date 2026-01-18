export class Entity {
    id: string;
    x: number;
    y: number;
    rotation: number = 0;
    el: SVGGElement;

    // Physics
    radius: number = 10;
    vx: number = 0;
    vy: number = 0;
    isDead: boolean = false;

    constructor(x: number, y: number, svgContent: string) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;

        // Create DOM
        const temp = document.createElement('div');
        temp.innerHTML = `<svg><g id="${this.id}">${svgContent}</g></svg>`;
        this.el = temp.querySelector('g')!;

        // Append to World
        const world = document.getElementById('world-layer');
        if (world) world.appendChild(this.el);

        this.render(); // Initial placement
    }

    update(dt: number): void {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    render(): void {
        // Sync DOM with State
        // Translate + Rotate
        this.el.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation * (180 / Math.PI)})`);
    }

    destroy(): void {
        this.isDead = true;
        this.el.remove();
    }

    takeDamage(amount: number): void {
        // Override
    }
}
