from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_gatekeeper(page: Page):
    page.goto("http://localhost:5173")

    # Wait for game to initialize
    page.wait_for_function("() => window.GameInstance !== undefined")

    # Start Game
    page.keyboard.press("Space")
    time.sleep(1)

    # Switch to Crystal Belfry
    page.evaluate("""
        window.GameInstance.handleZoneChange("The Crystal Belfry", 4);
    """)

    time.sleep(2)

    # Teleport player near Gatekeeper (1000, 300)
    page.evaluate("""
        const player = window.GameInstance.player;
        if (player) {
            player.x = 900;
            player.y = 300;
        }
    """)

    time.sleep(1)

    # Verify Gatekeeper exists in entity manager
    exists = page.evaluate("""
        window.GameInstance.entityManager.enemies.some(e => e.typeID === 26)
    """)
    print(f"Gatekeeper exists: {exists}")

    if not exists:
        raise Exception("Gatekeeper not found in EntityManager")

    # Take screenshot
    page.screenshot(path="verification/gatekeeper_screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_gatekeeper(page)
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()
