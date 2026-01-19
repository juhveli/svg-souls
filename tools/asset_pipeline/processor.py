import cairosvg
import io
import numpy as np
from PIL import Image
from tools.asset_pipeline.palette import get_palette_image_data, GLOOM_PALETTE, get_nearest_color

def rasterize_svg(svg_data):
    """
    Stage B1: Converts SVG string to a high-res RGBA Pillow Image.
    """
    png_data = cairosvg.svg2png(bytestring=svg_data.encode('utf-8'))
    return Image.open(io.BytesIO(png_data)).convert("RGBA")

def resize_image(image, target_size=(64, 64)):
    """
    Stage B2: 'Pixel Crunch' - Downscale using Nearest Neighbor.
    """
    return image.resize(target_size, resample=Image.NEAREST)

def cleanup_edges(image, threshold=25):
    """
    Stage D: Hard threshold for alpha channel.
    If alpha > threshold, set to 255, else 0.
    """
    arr = np.array(image)
    # arr shape is (H, W, 4)
    alpha = arr[:, :, 3]
    mask = alpha > threshold
    arr[:, :, 3] = np.where(mask, 255, 0)
    return Image.fromarray(arr)

def apply_palette(image, noise_level=20):
    """
    Stage C: The 'Souls' Pass.
    Injects noise and maps to GLOOM_PALETTE.
    """
    # 1. Convert to RGB to handle colors (ignore alpha for calculation temporarily)
    # We work on a copy
    work_img = image.convert("RGB")
    arr = np.array(work_img, dtype=np.int16) # int16 to prevent overflow on noise add

    # 2. Inject Noise ("Salt and Pepper" - actually just random gaussian/uniform here)
    noise = np.random.randint(-noise_level, noise_level, arr.shape)
    arr = arr + noise
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    # 3. Index Mapping
    # Optimization: Pre-calculate a lookup table (LUT) for all 256x256x256 colors is too big.
    # Instead, we iterate pixels. For 64x64, it's 4096 pixels. Fast enough.

    out_arr = np.zeros_like(arr)

    height, width, _ = arr.shape
    for y in range(height):
        for x in range(width):
            pixel = tuple(arr[y, x])
            nearest = get_nearest_color(pixel)
            out_arr[y, x] = nearest

    # Re-apply Alpha from original (cleaned) image
    res_img = Image.fromarray(out_arr, mode="RGB")

    # Combine with Alpha
    r, g, b = res_img.split()
    a = image.split()[3]
    return Image.merge("RGBA", (r, g, b, a))

def process_pipeline(svg_data):
    """
    Runs the full B -> C -> D pipeline.
    """
    # 1. Rasterize
    high_res = rasterize_svg(svg_data)

    # 2. Crunch
    crunched = resize_image(high_res)

    # 3. Edge Cleanup (Do this BEFORE palette so we don't map semi-transparent edge colors)
    cleaned = cleanup_edges(crunched)

    # 4. Souls Pass
    final = apply_palette(cleaned)

    return final
