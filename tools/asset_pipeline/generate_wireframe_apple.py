import sys
import os
import math
import random

# Ensure we can import from tools.asset_pipeline
sys.path.append(os.getcwd())
try:
    from tools.asset_pipeline.palette import GLOOM_PALETTE
except ImportError:
    # Fallback if run directly from within the directory without module context
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
    from tools.asset_pipeline.palette import GLOOM_PALETTE

WIDTH = 32
HEIGHT = 32
SCALE = 16

# Palette Indices
COLOR_WIRE = 15 # Magic Bright (Cyan)
COLOR_DIM = 14  # Magic Dark (Dark Blue)
COLOR_VOID = 0  # Void (Black)

def project(x, y, z):
    # Orthographic projection
    # Map x, y to screen coords
    # Assume object is centered at 0,0,0
    # Scale factor to fit -1.5..1.5 into 32 pixels
    scale_factor = 10.0

    px = int(x * scale_factor + WIDTH / 2)
    py = int(-y * scale_factor + HEIGHT / 2) # Y up in 3D, down in 2D
    return px, py

def draw_line(grid, x0, y0, x1, y1, color):
    # Bresenham's Line Algorithm
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy

    while True:
        if 0 <= x0 < WIDTH and 0 <= y0 < HEIGHT:
            # Depth check? No, simple painter's algorithm order or just overwrite
            # Since wireframe is transparent, we just draw.
            grid[y0][x0] = color

        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy

def generate_apple_wireframe():
    # Initialize grid with None (transparent)
    grid = [[None for _ in range(WIDTH)] for _ in range(HEIGHT)]

    lines = []

    # Apple Geometry
    # Sphere with indentation at top and bottom

    steps_phi = 12    # Latitudes
    steps_theta = 16  # Longitudes

    # Generate points
    mesh = [] # mesh[i][j] -> (x, y, z)

    for i in range(steps_phi + 1):
        phi = math.pi * i / steps_phi

        # Profile radius modulation for apple shape
        # Base sphere radius
        r = 1.1

        # Indent at top (phi=0)
        if phi < 0.5:
            r *= (0.6 + 0.8 * phi)
        # Indent at bottom (phi=pi)
        elif phi > math.pi - 0.5:
            r *= (0.6 + 0.8 * (math.pi - phi))

        row_points = []
        for j in range(steps_theta):
            theta = 2 * math.pi * j / steps_theta

            x = r * math.sin(phi) * math.cos(theta)
            y = r * math.cos(phi)
            z = r * math.sin(phi) * math.sin(theta)

            # Rotation
            # Tilt slightly forward (X axis)
            tilt = 0.3
            y_rot = y * math.cos(tilt) - z * math.sin(tilt)
            z_rot = y * math.sin(tilt) + z * math.cos(tilt)
            y = y_rot
            z = z_rot

            # Spin slightly (Y axis)
            spin = 0.5
            x_rot = x * math.cos(spin) - z * math.sin(spin)
            z_rot = x * math.sin(spin) + z * math.cos(spin)
            x = x_rot
            z = z_rot

            row_points.append((x, y, z))
        mesh.append(row_points)

    # Generate Lines
    # Latitudes
    for i in range(len(mesh)):
        for j in range(len(mesh[i])):
            p1 = mesh[i][j]
            p2 = mesh[i][(j + 1) % len(mesh[i])] # Wrap around

            # Color logic: Back-facing lines are dimmer
            # Check Z depth
            avg_z = (p1[2] + p2[2]) / 2
            color = COLOR_WIRE if avg_z > 0 else COLOR_DIM

            px1, py1 = project(*p1)
            px2, py2 = project(*p2)
            lines.append((px1, py1, px2, py2, color))

    # Longitudes
    for i in range(len(mesh) - 1):
        for j in range(len(mesh[i])):
            p1 = mesh[i][j]
            p2 = mesh[i+1][j]

            avg_z = (p1[2] + p2[2]) / 2
            color = COLOR_WIRE if avg_z > 0 else COLOR_DIM

            px1, py1 = project(*p1)
            px2, py2 = project(*p2)
            lines.append((px1, py1, px2, py2, color))

    # Stem
    # Top indentation is where phi is small.
    # Stem starts from slightly inside the top indent and goes up.
    stem_base = (0, 0.8, 0) # Approx top center
    stem_tip = (0.2, 1.3, 0.1) # Curved stem

    # Project and draw stem (thicker line?)
    s_px1, s_py1 = project(*stem_base)
    s_px2, s_py2 = project(*stem_tip)
    lines.append((s_px1, s_py1, s_px2, s_py2, COLOR_WIRE))

    # Render Lines to Grid
    for x1, y1, x2, y2, color in lines:
        draw_line(grid, x1, y1, x2, y2, color)

    # Add Glitch/Noise
    # "Humming with the faint sound of a tuning fork... composed of edges"
    # Maybe some random pixels shift or appear
    for _ in range(15): # Add some random noise pixels
        rx = random.randint(0, WIDTH-1)
        ry = random.randint(0, HEIGHT-1)
        if grid[ry][rx] is None:
            # Low probability to spawn a pixel near center
            # Or just random noise
            grid[ry][rx] = COLOR_DIM if random.random() > 0.5 else COLOR_WIRE

    # Scanline Glitch
    # Shift a row randomly
    glitch_row = random.randint(5, HEIGHT-5)
    shift = random.choice([-1, 1, 2, -2])
    new_row = [None] * WIDTH
    for x in range(WIDTH):
        src_x = x - shift
        if 0 <= src_x < WIDTH:
            new_row[x] = grid[glitch_row][src_x]
    grid[glitch_row] = new_row

    return grid

def raster_to_svg(grid):
    svg = []
    svg.append(f'<svg width="{WIDTH*SCALE}" height="{HEIGHT*SCALE}" viewBox="0 0 {WIDTH*SCALE} {HEIGHT*SCALE}" xmlns="http://www.w3.org/2000/svg">')

    # Optional: Draw a dark background? No, items are usually transparent.
    # But wireframe might be hard to see.
    # Let's verify visibility later.

    rect_count = 0
    for y in range(HEIGHT):
        for x in range(WIDTH):
            color_idx = grid[y][x]
            if color_idx is not None:
                rgb = GLOOM_PALETTE[color_idx]
                hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)
                rect = f'<rect x="{x*SCALE}" y="{y*SCALE}" width="{SCALE}" height="{SCALE}" fill="{hex_color}" shape-rendering="crispEdges" />'
                svg.append(rect)
                rect_count += 1

    svg.append('</svg>')
    return "\n".join(svg)

if __name__ == "__main__":
    grid = generate_apple_wireframe()
    svg_content = raster_to_svg(grid)

    output_path = "assets/sprites/items/apple.svg"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")
