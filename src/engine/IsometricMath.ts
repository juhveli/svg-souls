export class IsometricMath {
    public static TILE_WIDTH = 64;
    public static TILE_HEIGHT = 32;

    public static worldToScreen(worldX: number, worldY: number, worldZ: number = 0): { x: number, y: number } {
        const halfWidth = this.TILE_WIDTH / 2;
        const halfHeight = this.TILE_HEIGHT / 2;
        const screenX = (worldX - worldY) * halfWidth;
        const screenY = (worldX + worldY) * halfHeight - worldZ;
        return { x: screenX, y: screenY };
    }

    public static screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
        const halfWidth = this.TILE_WIDTH / 2;
        const halfHeight = this.TILE_HEIGHT / 2;
        const worldX = (screenX / halfWidth + screenY / halfHeight) / 2;
        const worldY = (screenY / halfHeight - screenX / halfWidth) / 2;
        return { x: worldX, y: worldY };
    }

    public static calculateDepth(worldX: number, worldY: number, worldZ: number): number {
        return worldX + worldY + worldZ;
    }
}
