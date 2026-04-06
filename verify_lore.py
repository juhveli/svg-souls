from playwright.sync_api import sync_playwright
import time
import sys

def verify_item_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to game...")
        try:
            page.goto("http://localhost:5173")
        except Exception as e:
            print(f"Failed to connect to game: {e}")
            sys.exit(1)

        # Wait for ItemDatabase to be available
        print("Waiting for ItemDatabase...")
        try:
            page.wait_for_function("window.ItemDatabase !== undefined", timeout=10000)
        except Exception:
             print("ItemDatabase not found on window.")
             sys.exit(1)

        time.sleep(2)

        print("Checking items...")

        # Check Tuning Fork Spear
        tfs_desc = page.evaluate("window.ItemDatabase.getDescription('tuning_fork_spear')")
        print(f"Tuning Fork Spear Desc: {tfs_desc}")

        # Check Metronome Oil
        mo_desc = page.evaluate("window.ItemDatabase.getDescription('metronome_oil')")
        print(f"Metronome Oil Desc: {mo_desc}")

        failures = 0

        if "pulverized into silence" in tfs_desc:
            print("✅ Tuning Fork Spear verified.")
        else:
            print("❌ Tuning Fork Spear mismatch.")
            failures += 1

        if "scorched resin" in mo_desc:
            print("✅ Metronome Oil verified.")
        else:
            print("❌ Metronome Oil mismatch.")
            failures += 1

        if failures == 0:
            print("SUCCESS: All lore verified.")
        else:
            print(f"FAILURE: {failures} lore checks failed.")
            sys.exit(1)

        browser.close()

if __name__ == "__main__":
    verify_item_data()
