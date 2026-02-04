from playwright.sync_api import sync_playwright
import time
import sys

def verify_item_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to game...")
        try:
            page.goto("http://localhost:5173", timeout=30000)
        except Exception as e:
            print(f"Error navigating: {e}")
            print("Ensure the dev server is running (npm run dev).")
            sys.exit(1)

        # Wait for ItemDatabase to be available
        print("Waiting for ItemDatabase...")
        try:
            page.wait_for_function("window.ItemDatabase !== undefined", timeout=10000)
        except:
            print("Timed out waiting for ItemDatabase.")
            sys.exit(1)

        # Wait for ItemDatabase to load items
        time.sleep(2)

        print("Checking item description for 'porcelain_mask'...")
        # Evaluate JS to get the description
        item_data = page.evaluate("""() => {
            const db = window.ItemDatabase;
            if (!db) return null;
            return {
                name: db.getName('porcelain_mask'),
                description: db.getDescription('porcelain_mask')
            };
        }""")

        if not item_data:
            print("FAILURE: ItemDatabase not accessible.")
            browser.close()
            sys.exit(1)

        print(f"Item Name: {item_data['name']}")
        print(f"Item Description: {item_data['description']}")

        if "Shattered Porcelain Mask" in item_data['name'] and "structural smiles" in item_data['description']:
            print("SUCCESS: Porcelain Mask lore verified.")
        else:
            print("FAILURE: Item data mismatch or not found.")
            sys.exit(1)

        browser.close()

if __name__ == "__main__":
    verify_item_data()
