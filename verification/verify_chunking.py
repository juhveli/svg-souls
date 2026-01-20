from playwright.sync_api import sync_playwright
import time

def verify_chunking():
    with sync_playwright() as p:
        # Launch with some args that might help, though WebGPU in headless is tricky
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        logs = []
        page.on("console", lambda msg: logs.append(msg.text))
        page.on("pageerror", lambda exc: logs.append(f"ERROR: {exc}"))

        try:
            page.goto("http://localhost:5173")
            # Wait a bit for JS to execute
            time.sleep(3)

            page.screenshot(path="verification/verification.png")

            content = page.content()

            print("--- CONSOLE LOGS ---")
            for l in logs:
                print(l)
            print("--------------------")

            if "WebGPU Not Supported" in content:
                print("Result: WebGPU not supported (Expected in this env). Renderer class loaded.")
            elif "Starting Game..." in logs:
                print("Result: Game started successfully! WebGPU seemingly working.")
            else:
                print("Result: Unknown state. Check logs.")

        except Exception as e:
            print(f"Exception: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_chunking()
