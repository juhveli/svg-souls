from playwright.sync_api import sync_playwright
import time

def verify_item_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to game...")
        page.goto("http://localhost:5173")

        # Wait for ItemDatabase to be available
        print("Waiting for ItemDatabase...")
        page.wait_for_function("window.ItemDatabase !== undefined")

        # Wait for ItemDatabase to load (it has a 'loaded' property)
        # But 'loaded' is private in the class I read earlier?
        # Let's check the code again.
        # "private loaded: boolean = false;"
        # But maybe I can check if 'get' returns something.

        # Actually, let's just wait a bit and try to get the item.
        time.sleep(2)

        print("Checking item description...")
        # Evaluate JS to get the description
        description = page.evaluate("""() => {
            const db = window.ItemDatabase;
            if (!db) return "Database not found";
            return db.getDescription('tuning_fork_spear');
        }""")

        name = page.evaluate("""() => {
            const db = window.ItemDatabase;
            if (!db) return "Database not found";
            return db.getName('tuning_fork_spear');
        }""")

        print(f"Item Name: {name}")
        print(f"Item Description: {description}")

        if "Tuning Fork Spear" in name and "headache-inducing frequency" in description:
            print("SUCCESS: Item data verified.")
        else:
            print("FAILURE: Item data mismatch.")

        page.screenshot(path="verification.png")
        browser.close()

if __name__ == "__main__":
    verify_item_data()
