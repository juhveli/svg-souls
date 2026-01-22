from playwright.sync_api import sync_playwright
import time

def verify_entities():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--enable-unsafe-webgpu'])
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait for game to load
        page.wait_for_timeout(5000)

        # Verify TrashCompactor exists in EntityManager
        # Using evaluate to inspect window.Game
        result = page.evaluate("""() => {
            const game = window.Game ? window.Game.getInstance() : null;
            if (!game) return "Game not found";
            const entities = game.entityManager.entities;
            const compactor = entities.find(e => e.constructor.name === 'TrashCompactor');
            return compactor ? "Found TrashCompactor at " + compactor.x : "TrashCompactor not found";
        }""")
        print(f"Verification Result: {result}")

        browser.close()

if __name__ == "__main__":
    verify_entities()
