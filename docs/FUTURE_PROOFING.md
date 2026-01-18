# Future-Proofing Strategy: Loot & Progression

**Objective:** Transform `LootSystem.ts` and `ProgressionSystem.ts` from prototype hardcoded logic into scalable, data-driven engines suitable for production.

## 1. LootSystem Improvements
### A. Externalized Loot Tables (Data-Driven)
*   **Current:** Hardcoded `DROP_TABLES` dictionary in TypeScript.
*   **Problem:** Designers cannot balance drop rates without a programmer recompiling code.
*   **Solution:** Move tables to `assets/data/loot_tables.json`.
    *   *Implementation:* Fetch JSON on init. Parse into a `Map<string, LootTable>`.
    *   *Benefit:* Rapid iteration, hot-reloading of drop rates.

### B. Weighted Drop Pools (RNG)
*   **Current:** Simple `Math.random() < chance` linear check.
*   **Problem:** Global drops (0.1%) are independent of mob drops. Hard to guarantee "Bad Luck Protection".
*   **Solution:** Implement a "Deck of Cards" or "Entropy" system.
    *   *Implementation:* `EntropySystem` that tracks "dry streaks". If player hasn't seen a rare in X kills, boost chance.

### C. Item Factory Pattern
*   **Current:** Emits string IDs (`'Vial of Liquid Seconds'`).
*   **Problem:** No metadata (Icon, Description, Sell Value) attached to the drop event.
*   **Solution:** `ItemDatabase` service.
    *   `LootSystem` emits `{ itemId: 'vial_01' }`.
    *   UI listens and queries `ItemDatabase.get('vial_01')` to show tooltip.

## 2. ProgressionSystem Improvements
### A. Entity Component System (ECS) for Stats
*   **Current:** `ProgressionSystem` stores `maxResonance` directly.
*   **Problem:** Enemies also need stats. Having player stats in a singleton `ProgressionSystem` and enemy stats in `SerumBot.ts` is inconsistent.
*   **Solution:** generic `StatsComponent`.
    *   `Player` has `StatsComponent`. `SerumBot` has `StatsComponent`.
    *   `ProgressionSystem` only manages *XP and Layout*, then applies modifiers to the Player's `StatsComponent`.

### B. Persistence (Save/Load)
*   **Current:** Memory only. Refreshing page resets level.
*   **Solution:** `PersistenceManager`.
    *   *Schema:* 
        ```json
        {
          "version": 1,
          "vibration": 1500,
          "level": 5,
          "inventory": ["vial_01", "shard_glass"],
          "flags": { "boss_killed": false }
        }
        ```
    *   *Storage:* `localStorage` (Web) or FileSystem (Electron).

### C. Modifier Pipeline (Buffs/Debuffs)
*   **Current:** `maxResonance` is a raw number calculated on level up.
*   **Problem:** How do we handle "Ring of Strength (+10%)"?
*   **Solution:** `StatModifier` system.
    *   `Value = (Base + Flat) * Multiplier`.
    *   `ProgressionSystem` recalculates these dirty flags whenever inventory changes.

## 3. Recommended Roadmap
1.  **Refactor Stats:** Extract `stats` properties from `ProgressionSystem` and `SerumBot` into a shared `StatsComponent` class.
2.  **JSON Loader:** Create a simple `ResourceManager` to load `loot.json`.
3.  **Save System:** Implement basic `localStorage` dumping for `ProgressionSystem`.
