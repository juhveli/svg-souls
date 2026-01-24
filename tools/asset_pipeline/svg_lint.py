import sys
import xml.etree.ElementTree as ET
import re

def lint_svg(filepath):
    print(f"Linting {filepath}...")
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except Exception as e:
        print(f"FAIL: Could not parse SVG. {e}")
        sys.exit(1)

    # 1. Check for <path> tags
    if any(elem.tag.endswith('path') for elem in root.iter()):
        print("FAIL: Contains <path> tags. usage of paths is forbidden. Use <rect> only.")
        sys.exit(1)

    # 2. Check integer coordinates
    for rect in root.iter('{http://www.w3.org/2000/svg}rect'):
        attrs = ['x', 'y', 'width', 'height']
        for attr in attrs:
            val = rect.get(attr)
            if val:
                try:
                    # Check if float (e.g. "1.5")
                    if '.' in val and float(val) % 1 != 0:
                        print(f"FAIL: Non-integer value found: {attr}='{val}'. The Grid is Law.")
                        sys.exit(1)
                except ValueError:
                    pass

    print("PASS: valid 16-bit aesthetic SVG.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python svg_lint.py <filepath>")
        sys.exit(1)

    lint_svg(sys.argv[1])
