from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait for potential init
        time.sleep(5)

        # Take screenshot
        page.screenshot(path="verification.png")

        # Check for error text (if WebGPU failed)
        content = page.content()
        if "WebGPU Not Supported" in content:
            print("WebGPU Not Supported message found (Expected in this env).")
        else:
            print("No error message found (Unexpected if env lacks WebGPU).")

        browser.close()

if __name__ == "__main__":
    run()
