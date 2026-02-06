import fs from 'fs';
import path from 'path';

const LOOT_SYSTEM_PATH = path.join('src', 'systems', 'LootSystem.ts');
const ITEMS_JSON_PATH = path.join('assets', 'data', 'items.json');

function verifyLootIntegrity() {
    console.log('Verifying Loot System integrity...');

    if (!fs.existsSync(LOOT_SYSTEM_PATH)) {
        console.error(`ERROR: Could not find ${LOOT_SYSTEM_PATH}`);
        process.exit(1);
    }

    if (!fs.existsSync(ITEMS_JSON_PATH)) {
        console.error(`ERROR: Could not find ${ITEMS_JSON_PATH}`);
        process.exit(1);
    }

    // 1. Read LootSystem.ts
    const lootSystemContent = fs.readFileSync(LOOT_SYSTEM_PATH, 'utf-8');

    // 2. Read items.json
    const itemsJsonContent = fs.readFileSync(ITEMS_JSON_PATH, 'utf-8');
    const itemsData = JSON.parse(itemsJsonContent);
    const validItemKeys = new Set(Object.keys(itemsData));

    // 3. Extract referenced items from LootSystem.ts
    // Regex for: items: ['Item Name']
    // Also handles multiple items if comma separated? The code has ['Item'] usually.
    // Let's make it robust enough for the current code style.
    // The current code has: items: ['Glass Shard']
    const itemsArrayRegex = /items:\s*\[(.*?)\]/g;

    // Regex for: { item: 'Item Name' } in global drops
    const globalDropsRegex = /item:\s*['"]([^'"]+)['"]/g;

    const referencedItems = new Set<string>();

    // Parse items arrays
    let match;
    while ((match = itemsArrayRegex.exec(lootSystemContent)) !== null) {
        const content = match[1];
        // Split by comma and strip quotes
        const items = content.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        items.forEach(i => {
            if (i) referencedItems.add(i);
        });
    }

    // Parse global drops objects
    while ((match = globalDropsRegex.exec(lootSystemContent)) !== null) {
        referencedItems.add(match[1]);
    }

    console.log(`Found ${referencedItems.size} referenced items in LootSystem.ts:`, Array.from(referencedItems));

    let errors = 0;
    referencedItems.forEach(item => {
        if (!validItemKeys.has(item)) {
            console.error(`ERROR: Item '${item}' referenced in LootSystem.ts does NOT exist in items.json!`);
            errors++;
        } else {
            console.log(`OK: '${item}' exists.`);
        }
    });

    if (errors > 0) {
        console.error(`Verification FAILED with ${errors} errors.`);
        process.exit(1);
    } else {
        console.log('Verification PASSED: All referenced items exist.');
        process.exit(0);
    }
}

verifyLootIntegrity();
