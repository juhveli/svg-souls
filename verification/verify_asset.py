import os
from playwright.sync_api import sync_playwright

def verify_asset():
    cwd = os.getcwd()
    file_path = f"file://{cwd}/verification/view_asset.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(file_path)

        # Wait for image to load
        page.wait_for_selector("img")

        screenshot_path = f"{cwd}/verification/cube_regret_render.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        browser.close()

if __name__ == "__main__":
    verify_asset()
