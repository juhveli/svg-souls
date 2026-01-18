from playwright.sync_api import sync_playwright

def verify_game_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Connect to local vite server
            page.goto("http://localhost:5173")

            # Wait for the game container
            page.wait_for_selector("#game-container", state="visible")

            # Wait for Start Screen
            page.wait_for_selector("#start-screen", state="visible")

            print("Game loaded successfully. Taking screenshot.")
            page.screenshot(path="verification_screenshot.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_game_load()
