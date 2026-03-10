/**
 * IsometricMath.ts
 *
 * Core utilities for converting between 2D Cartesian World Coordinates
 * and 2.5D Isometric Screen Coordinates.
 *
 * Target Grid: 2:1 ratio (e.g., 64x32 pixel tiles).
 */

export class IsometricMath {
    // Default tile dimensions for a 2:1 isometric grid
    public static TILE_WIDTH = 64;
    public static TILE_HEIGHT = 32;

    /**
     * Converts a 3D world position to a 2D isometric screen position.
     *
     * @param worldX The Cartesian X coordinate.
     * @param worldY The Cartesian Y coordinate.
     * @param worldZ The Cartesian Z (height) coordinate.
     * @returns An object containing the corresponding screen X and Y coordinates.
     */
    public static worldToScreen(worldX: number, worldY: number, worldZ: number = 0): { x: number, y: number } {
        const halfWidth = this.TILE_WIDTH / 2;
        const halfHeight = this.TILE_HEIGHT / 2;

        const screenX = (worldX - worldY) * halfWidth;
        // Z-axis goes "up" visually, subtracting from screen Y
        const screenY = (worldX + worldY) * halfHeight - worldZ;

        return { x: screenX, y: screenY };
    }

    /**
     * Converts a 2D isometric screen position to a 2D Cartesian world position.
     * Note: This assumes Z=0 (picking a point on the flat floor).
     *
     * @param screenX The screen X coordinate.
     * @param screenY The screen Y coordinate.
     * @returns An object containing the corresponding world X and Y coordinates.
     */
    public static screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
        const halfWidth = this.TILE_WIDTH / 2;
        const halfHeight = this.TILE_HEIGHT / 2;

        const worldX = (screenX / halfWidth + screenY / halfHeight) / 2;
        const worldY = (screenY / halfHeight - screenX / halfWidth) / 2;

        return { x: worldX, y: worldY };
    }

    /**
     * Calculates the rendering depth (Z-index) for isometric sorting.
     * Sprites further back or higher up should be drawn first.
     *
     * @param worldX The Cartesian X coordinate.
     * @param worldY The Cartesian Y coordinate.
     * @param worldZ The Cartesian Z (height) coordinate.
     * @returns A scalar value representing the depth order.
     */
    public static calculateDepth(worldX: number, worldY: number, worldZ: number): number {
        // Sorting should primarily be based on the object's base (worldX + worldY).
        // A tiny fraction of worldZ is added to break ties or ensure entities at the same X/Y
        // but different heights sort correctly, without breaking base sorting.
        return worldX + worldY + (worldZ * 0.001);
    }
}
