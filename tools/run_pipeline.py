import os
import sys
from tools.asset_pipeline.generator import generate_sword_svg
from tools.asset_pipeline.processor import process_pipeline
from tools.asset_pipeline.qa import run_qa_suite

def main():
    print("Starting Asset Generation Pipeline...")

    # 0. Setup
    output_dir = "assets/generated"
    os.makedirs(output_dir, exist_ok=True)

    # 1. Stage A: Generator
    print("Stage A: Generating Vector Skeleton...")
    svg_data = generate_sword_svg()

    # Save SVG for debugging
    with open(f"{output_dir}/sword_debug.svg", "w") as f:
        f.write(svg_data)

    # 2. Stage B, C, D: Processing
    print("Stage B-D: Crunching, Palette Mapping, Cleanup...")
    final_image = process_pipeline(svg_data)

    # 3. QA
    print("Running QA...")
    qa_passed = run_qa_suite(final_image)

    if qa_passed:
        print("QA STATUS: PASSED")
    else:
        print("QA STATUS: FAILED (Check logs)")

    # 4. Save
    output_path = f"{output_dir}/sword_final.png"
    final_image.save(output_path)
    print(f"Saved asset to {output_path}")

if __name__ == "__main__":
    main()
