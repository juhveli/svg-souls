import fs from 'fs';
import path from 'path';

const itemsPath = path.join(process.cwd(), 'assets/data/items.json');
const lootPath = path.join(process.cwd(), 'src/systems/LootSystem.ts');

if (!fs.existsSync(itemsPath)) {
    console.error(`Items file not found at ${itemsPath}`);
    process.exit(1);
}
if (!fs.existsSync(lootPath)) {
    console.error(`LootSystem file not found at ${lootPath}`);
    process.exit(1);
}

const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
const itemKeys = new Set(Object.keys(itemsData));

const lootContent = fs.readFileSync(lootPath, 'utf-8');

// Regex to find items in DROP_TABLES
// Matches: items: ['key1', 'key2']
const itemRegex = /items:\s*\[(.*?)\]/g;
let match;
const lootKeys: string[] = [];

while ((match = itemRegex.exec(lootContent)) !== null) {
    // match[1] is "'key1', 'key2'"
    const keys = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    lootKeys.push(...keys);
}

// Regex for GLOBAL_DROPS
// { item: 'key', ... }
const globalRegex = /item:\s*['"](.*?)['"]/g;
while ((match = globalRegex.exec(lootContent)) !== null) {
    lootKeys.push(match[1]);
}

console.log(`Found ${lootKeys.length} item references in LootSystem.`);
let errors = 0;

lootKeys.forEach(key => {
    if (!itemKeys.has(key)) {
        console.error(`❌ ERROR: LootSystem references missing item: '${key}'`);
        errors++;
    } else {
        console.log(`✅ Verified: '${key}'`);
    }
});

if (errors > 0) {
    console.error(`\nFAILED: Found ${errors} missing items.`);
    process.exit(1);
} else {
    console.log(`\nSUCCESS: All loot items exist in database.`);
    process.exit(0);
}
