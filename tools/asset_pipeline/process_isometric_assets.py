import os
import random
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import math

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

def apply_blight_filter_png(image_path, output_path, base_palette='RUST', decay_chance=0.08, resize_to=(64, 32)):
    """
    Applies the game's isometric decay/blight aesthetic to a raw PNG image.

    1. Loads the PNG.
    2. Resizes and maintains isometric aspect if required (64x32 or 64x64).
    3. Quantizes/maps colors to the dark fantasy palette (Rust/Void).
    4. Applies 'decay' noise (blight_filter pixel removal/darkening).
    5. Saves the final 16-bit stylized image.
    """
    try:
        # Load image
        img = Image.open(image_path).convert("RGBA")

        # Resize to match our isometric grid (64x64 usually for a 64x32 projection if it's a cube, or 64x32 for flat floor)
        # Assuming the starter pack tiles are 64x32 or similar flat isometric tiles. Let's just fit them to 64x32.
        img = img.resize(resize_to, Image.Resampling.NEAREST)

        # We need a new image to draw on
        out_img = Image.new("RGBA", img.size)
        pixels = img.load()
        out_pixels = out_img.load()

        width, height = img.size

        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]

                # Skip fully transparent pixels
                if a == 0:
                    continue

                # 1. Blight/Decay (Holes or Void spots)
                # We don't remove pixels at the very center, mostly edges or random spots
                if random.random() < decay_chance:
                    # Either make it fully transparent (hole) or pure Void (black)
                    if random.random() < 0.5:
                        continue # hole
                    else:
                        out_pixels[x, y] = (15, 15, 15, 255) # Void
                        continue

                # 2. Color Mapping
                # Base pixel brightness to determine if it should be an accent or base
                brightness = (r + g + b) / 3

                new_r, new_g, new_b = r, g, b

                # Heavily heavily darken everything (dark fantasy)
                dark_factor = 0.5
                r = int(r * dark_factor)
                g = int(g * dark_factor)
                b = int(b * dark_factor)

                # Map to our palettes based on the dominant tone or just force to a palette
                # Let's map everything to Rust/Void primarily.
                if brightness < 60:
                    new_r, new_g, new_b = closest_color((r,g,b), 'VOID')
                else:
                    new_r, new_g, new_b = closest_color((r,g,b), base_palette)

                # Add some grit (random tiny noise)
                if random.random() < 0.2:
                    noise = random.randint(-15, 15)
                    new_r = max(0, min(255, new_r + noise))
                    new_g = max(0, min(255, new_g + noise))
                    new_b = max(0, min(255, new_b + noise))

                out_pixels[x, y] = (new_r, new_g, new_b, a)

        # 3. Outline (1px Void Outline) - required by the art style docs
        # We will do a simple edge detect
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
    raw_dir = "assets/sprites/raw/iso_starter"
    out_dir = "assets/sprites/isometric"

    if os.path.exists(raw_dir):
        for filename in os.listdir(raw_dir):
            if filename.endswith(".png"):
                raw_path = os.path.join(raw_dir, filename)
                # Use base name without extension for the output
                base_name = os.path.splitext(filename)[0]
                out_path = os.path.join(out_dir, f"{base_name}_decayed.png")

                # For stone/concrete, maybe use a more grey/void palette, but Rust is our theme.
                palette = 'RUST' if 'dirt' in filename or 'brick' in filename else 'VOID'
                if 'concrete' in filename or 'stone' in filename:
                    palette = 'VOID'

                # Most standard isometric floor tiles are 64x32
                apply_blight_filter_png(raw_path, out_path, base_palette=palette, resize_to=(64, 32))
    else:
        print(f"Raw directory not found: {raw_dir}")
