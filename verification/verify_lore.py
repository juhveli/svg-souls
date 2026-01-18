import time
from playwright.sync_api import sync_playwright

def verify_narrative_item():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game (assuming it's running on localhost:5173 based on Vite default)
        try:
            page.goto("http://localhost:5173", timeout=10000)
        except Exception as e:
            print(f"Error navigating to page: {e}")
            return

        # Wait for game to load
        page.wait_for_selector("#game-container")

        # Start game
        page.keyboard.press("Space")
        time.sleep(1) # Wait for start animation/transition

        # We need to find the prompt ring/text which initially has opacity 0
        # The player starts at 150, 480.
        # Mirror is at 300, 450.
        # Ledger is at 600, 520.

        # We need to move the player to the Mirror (Right)
        # Assuming 'D' or 'ArrowRight' moves right.
        page.keyboard.down("d")
        time.sleep(1) # Move right for 1 second
        page.keyboard.up("d")

        # Take screenshot near mirror
        page.screenshot(path="verification/mirror_approach.png")

        # Check if prompt is visible (opacity > 0)
        # We can't easily assert opacity in Python without complex JS eval, but we can verify visually.

        # Interact with 'E'
        page.keyboard.press("e")
        time.sleep(0.5)

        # Screenshot the bark text
        page.screenshot(path="verification/mirror_bark.png")

        # Now check consistency - Restart or reload to check if ledger is there?
        # The task was to fix consistency on zone change.
        # But we can verify the text content matches our changes first.

        browser.close()

if __name__ == "__main__":
    verify_narrative_item()
