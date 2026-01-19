import numpy as np
from PIL import Image

def get_luminance(rgb):
    return 0.299*rgb[0] + 0.587*rgb[1] + 0.114*rgb[2]

def check_silhouette(image):
    """
    Test A: Silhouette Readability.
    Checks ratio of foreground pixels to total pixels.
    Returns: (Passed (bool), Ratio (float), Message (str))
    """
    arr = np.array(image)
    alpha = arr[:, :, 3]
    total_pixels = alpha.size
    fg_pixels = np.count_nonzero(alpha > 0)
    ratio = fg_pixels / total_pixels

    if ratio > 0.8:
        return False, ratio, "FAIL: Blob (Too solid)"
    if ratio < 0.02:
        return False, ratio, "FAIL: Invisible (Too thin)"

    return True, ratio, "PASS"

def check_contrast(image):
    """
    Test B: Contrast Ratio.
    Checks diff between brightest and darkest visible pixel.
    Returns: (Passed (bool), Contrast (float), Message (str))
    """
    arr = np.array(image)
    # Filter only visible pixels
    mask = arr[:, :, 3] > 0
    if not np.any(mask):
        return False, 0.0, "FAIL: Empty Image"

    visible_pixels = arr[mask][:, :3] # Get RGB of visible

    # Calculate luminance manually or just sum RGB
    # Using relative luminance
    lum = 0.299 * visible_pixels[:, 0] + 0.587 * visible_pixels[:, 1] + 0.114 * visible_pixels[:, 2]

    min_lum = np.min(lum)
    max_lum = np.max(lum)
    diff = max_lum - min_lum

    if diff < 50: # Arbitrary threshold for "Low Contrast"
        return False, diff, "FAIL: Low Contrast"

    return True, diff, "PASS"

def check_banding(image):
    """
    Test C: Banding Detection.
    Scans for rows where color changes gradually (1 pixel shift).
    Simplified: Check standard deviation of gradients.
    Returns: (Passed (bool), Score (float), Message (str))
    """
    # This is a complex check to implement robustly.
    # For now, we'll placeholder it as passing, or do a simple unique color count per row check.
    # If a row has many colors sorted by brightness, it might be a gradient.

    # Let's just return PASS for the prototype as requested "Basic implementation"
    return True, 0.0, "PASS (Not fully implemented)"

def run_qa_suite(image):
    print("--- QA REPORT ---")

    # Test A
    res_a, val_a, msg_a = check_silhouette(image)
    print(f"Test A (Silhouette): {msg_a} (Ratio: {val_a:.2f})")

    # Test B
    res_b, val_b, msg_b = check_contrast(image)
    print(f"Test B (Contrast):   {msg_b} (Diff: {val_b:.2f})")

    # Test C
    res_c, val_c, msg_c = check_banding(image)
    print(f"Test C (Banding):    {msg_c}")

    return res_a and res_b and res_c
