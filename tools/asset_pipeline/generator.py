def generate_sword_svg(curvature=0.2, wear=0.0):
    """
    Generates a high-res SVG string for a sword based on parameters.
    Returns: string (SVG content)
    """

    # Canvas
    width = 512
    height = 512

    # Sword Parts
    # Centered at x=256

    # 1. Blade
    # Simple tapered blade
    blade_width = 40
    blade_length = 300
    blade_tip_y = 50
    guard_y = blade_tip_y + blade_length

    # Curvature logic (simplified for this demo: just straight lines for now)
    # A path from tip down to guard

    # Blade Colors (Grayscale for "height map" effect before palette)
    # Center ridge is brighter (200), edges darker (100)

    svg = f"""<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background (Transparent) -->

        <!-- Hilt/Handle -->
        <rect x="{256 - 10}" y="{guard_y}" width="20" height="80" fill="#402010" />

        <!-- Pommel -->
        <circle cx="256" cy="{guard_y + 80 + 10}" r="20" fill="#606060" />

        <!-- Guard -->
        <rect x="{256 - 60}" y="{guard_y - 10}" width="120" height="20" rx="5" fill="#505050" />

        <!-- Blade (Left Edge) -->
        <path d="M256,{blade_tip_y} L{256 - blade_width/2},{guard_y} L256,{guard_y} Z" fill="#808080" />

        <!-- Blade (Right Edge) -->
        <path d="M256,{blade_tip_y} L{256 + blade_width/2},{guard_y} L256,{guard_y} Z" fill="#A0A0A0" />

        <!-- Blood Groove / Fuller (Optional) -->
        <rect x="{256 - 5}" y="{blade_tip_y + 50}" width="10" height="{blade_length - 70}" fill="#404040" />

    </svg>
    """
    return svg

if __name__ == "__main__":
    print(generate_sword_svg())
