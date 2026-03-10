import os
import random
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import math
import argparse

# Project specific palettes for the "cartridge left in the rain" 16-bit aesthetic
PALETTES = {
    'RUST': [(139, 69, 19), (160, 82, 45), (205, 133, 63), (210, 105, 30), (107, 62, 36), (61, 31, 14)],
    'VOID': [(10, 10, 10), (25, 25, 25), (40, 40, 40), (15, 20, 25)],
    'VERDIGRIS': [(64, 224, 208), (72, 209, 204), (0, 206, 209), (32, 178, 170), (0, 139, 139)],
    'CORRUPTED_NEON': [(255, 0, 255), (148, 0, 211), (138, 43, 226), (255, 20, 147)]
}

def closest_color(rgb, palette_name):
    """Finds the closest color in a given palette."""
    palette = PALETTES[palette_name]
    r, g, b = rgb
    color_diffs = []
    for pr, pg, pb in palette:
        diff = math.sqrt((r - pr)**2 + (g - pg)**2 + (b - pb)**2)
        color_diffs.append((diff, (pr, pg, pb)))
    return min(color_diffs)[1]

def apply_blight_filter_png(image_path, output_path, base_palette='RUST', decay_chance=0.08, resize_to=None):
    try:
        # Load image
        img = Image.open(image_path).convert("RGBA")

        # Optionally resize
        if resize_to:
            img = img.resize(resize_to, Image.Resampling.NEAREST)

        # We need a new image to draw on
        out_img = Image.new("RGBA", img.size)
        pixels = img.load()
        out_pixels = out_img.load()

        width, height = img.size

        # Pre-calculate 4x4 block chunks for Zone 5 (CORRUPTED_NEON)
        # We will randomly select 4x4 chunks to remove (make transparent)
        removed_blocks = set()
        if base_palette == 'CORRUPTED_NEON':
            for by in range(0, height, 4):
                for bx in range(0, width, 4):
                    if random.random() < decay_chance:
                        removed_blocks.add((bx, by))

        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]

                # Skip fully transparent pixels
                if a == 0:
                    continue

                # Check if this pixel is inside a removed 4x4 block for Zone 5
                bx, by = (x // 4) * 4, (y // 4) * 4
                if (bx, by) in removed_blocks:
                    continue # Removed by blocky chunk logic (hole)

                # Masking logic for GLITCH space or certain effects
                # Example: If very bright red, maybe neon
                if r > 200 and g < 100 and b < 100 and base_palette == 'CORRUPTED_NEON':
                    out_pixels[x, y] = (255, 0, 255, 255) # Force neon
                    continue

                # 1. Blight/Decay (for other zones/regular decay)
                # Skip normal random decay if it's already handled blocky for CORRUPTED_NEON
                if base_palette != 'CORRUPTED_NEON' and random.random() < decay_chance:
                    if base_palette == 'VERDIGRIS':
                        # Glass gardens prefers "cracking" rather than simple holes
                        # If a decay hits, we don't necessarily make it a hole.
                        # We turn the pixel into pure Void, or a very dark grey to simulate deep cracks
                        if random.random() < 0.3:
                             continue # Occasional actual hole
                        else:
                             out_pixels[x, y] = (10, 10, 10, 255) # Dark crack line instead of full hole
                             continue
                    else:
                        if random.random() < 0.5:
                            continue # hole
                        else:
                            out_pixels[x, y] = (15, 15, 15, 255) # Void
                            continue

                # 2. Color Mapping
                brightness = (r + g + b) / 3

                # Darken
                dark_factor = 0.5
                r = int(r * dark_factor)
                g = int(g * dark_factor)
                b = int(b * dark_factor)

                if brightness < 60:
                    new_r, new_g, new_b = closest_color((r,g,b), 'VOID')
                else:
                    new_r, new_g, new_b = closest_color((r,g,b), base_palette)

                # Add some grit
                if random.random() < 0.2:
                    noise = random.randint(-15, 15)
                    new_r = max(0, min(255, new_r + noise))
                    new_g = max(0, min(255, new_g + noise))
                    new_b = max(0, min(255, new_b + noise))

                out_pixels[x, y] = (new_r, new_g, new_b, a)

        # 3. Outline (1px Void Outline)
        final_img = Image.new("RGBA", out_img.size)
        final_pixels = final_img.load()

        for y in range(height):
            for x in range(width):
                r, g, b, a = out_pixels[x, y]
                if a > 0:
                    final_pixels[x, y] = (r, g, b, a)
                else:
                    # Check neighbors
                    is_edge = False
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if out_pixels[nx, ny][3] > 0:
                                is_edge = True
                                break
                    if is_edge:
                        final_pixels[x, y] = (10, 10, 10, 255) # Void Outline

        out_dir = os.path.dirname(output_path)
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        final_img.save(output_path)
        print(f"Processed: {os.path.basename(image_path)} -> {output_path}")

    except Exception as e:
        print(f"Error processing {image_path}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", help="Directory of raw assets", default="assets/sprites/raw/iso_starter")
    parser.add_argument("--palette", help="Palette to use", default="RUST")
    parser.add_argument("--decay", type=float, help="Decay chance", default=0.08)
    parser.add_argument("--resize", help="Resize (e.g. 64x32 or 64x64 or 128x128)", default=None)
    args = parser.parse_args()

    raw_dir = args.dir
    out_dir = "assets/sprites/isometric"

    resize_tuple = None
    if args.resize:
        w, h = args.resize.split('x')
        resize_tuple = (int(w), int(h))

    if os.path.exists(raw_dir):
        for filename in os.listdir(raw_dir):
            if filename.endswith(".png") and not filename.startswith("Preview"):
                raw_path = os.path.join(raw_dir, filename)
                base_name = os.path.splitext(filename)[0]
                out_path = os.path.join(out_dir, f"{os.path.basename(raw_dir)}_{base_name}_decayed.png")

                apply_blight_filter_png(raw_path, out_path, base_palette=args.palette, decay_chance=args.decay, resize_to=resize_tuple)
    else:
        print(f"Raw directory not found: {raw_dir}")
