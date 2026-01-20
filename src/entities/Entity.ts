export class Entity {
    id: string;
    x: number;
    y: number;
    rotation: number = 0;
    width: number = 64;
    height: number = 64;

    // Physics
    radius: number = 10;
    vx: number = 0;
    vy: number = 0;

    // Lifecycle
    markedForDeletion: boolean = false;

    constructor(x: number, y: number, svgString?: string) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
    }

    update(dt: number): void {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    destroy(): void {
        this.markedForDeletion = true;
    }

    takeDamage(amount: number): void {
        // Override
    }
}
