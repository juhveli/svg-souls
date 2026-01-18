export class Camera {
    x: number = 0;
    y: number = 0;

    // Viewport Dimensions (Fixed by Game Design)
    width: number = 800;
    height: number = 600;

    // World Bounds (Set by Map)
    worldWidth: number = 800;
    worldHeight: number = 600;

    // Target to follow
    target: { x: number, y: number } | null = null;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    setBounds(worldWidth: number, worldHeight: number) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    follow(target: { x: number, y: number }) {
        this.target = target;
    }

    update() {
        if (!this.target) return;

        // 1. Center Camera on Target
        // We want target to be at center (width/2, height/2)
        // CameraX = TargetX - HalfScreen
        let targetX = this.target.x - (this.width / 2);
        let targetY = this.target.y - (this.height / 2);

        // 2. Clamp to World Bounds
        // Can't go less than 0
        targetX = Math.max(0, targetX);
        targetY = Math.max(0, targetY);

        // Can't go more than WorldSize - ScreenSize
        targetX = Math.min(targetX, this.worldWidth - this.width);
        targetY = Math.min(targetY, this.worldHeight - this.height);

        // 3. Smooth (Lerp) - Optional, for now Instant
        this.x = targetX;
        this.y = targetY;
    }

    // Helper: Returns the SVG Transform string
    getTransform(): string {
        // SVG translate moves the coordinate system.
        // If camera is at (100, 100), we want to draw the world at (-100, -100)
        return `translate(${-this.x}, ${-this.y})`;
    }
}
