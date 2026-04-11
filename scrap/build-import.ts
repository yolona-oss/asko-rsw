// Build a device-import JSON compatible with `POST /devices/import`
// (apps/repair-service/src/services/device.service.ts::importDevices).
//
// Source:   ./asko_products.json  (scraped catalog, 260 items across 7 types)
// Output:   ./asko_products.import.json
//
// Rules:
// - Remap `refrigerator` → `fridge` (DB category name)
// - Remap `hood` → `other` (no matching DB category)
// - Target at least 50 devices per DB category. For short categories we pad
//   with variants of real items — model suffix `-V2`, `-V3` … — so each
//   padded item keeps real specifications/images but resolves to a unique
//   slug (slug = `${brand}-${model}-${name}`).
// - Categories already ≥50 (e.g. `other`) pass through untouched.

import fs from 'node:fs';
import path from 'node:path';

type Product = Record<string, any>;

const MIN_PER_CATEGORY = 50;

const TYPE_REMAP: Record<string, string> = {
    refrigerator: 'fridge',
    hood: 'other',
};

const DB_CATEGORIES = [
    'washing_machine',
    'oven',
    'fridge',
    'dishwasher',
    'cooktop',
    'other',
] as const;

const SRC = path.join(__dirname, 'asko_products.json');
const OUT = path.join(__dirname, 'asko_products.import.json');

const raw: Product[] = JSON.parse(fs.readFileSync(SRC, 'utf-8'));

// 1. Remap types.
const remapped = raw.map((p) => ({
    ...p,
    type: TYPE_REMAP[p.type as string] ?? p.type ?? 'other',
}));

// 2. Group by DB category (fall anything unknown into `other`).
const byCat = new Map<string, Product[]>();
for (const c of DB_CATEGORIES) byCat.set(c, []);
for (const p of remapped) {
    const cat = (DB_CATEGORIES as readonly string[]).includes(p.type) ? p.type : 'other';
    byCat.get(cat)!.push(p);
}

// 3. Pad short categories with model-suffixed variants.
// Variant N appends `-V${N+1}` to model and name so slugs stay unique.
// Guards against base items that are duplicates of each other — those
// would otherwise produce colliding variants and fall under the 50-mark
// after dedupe.
function padCategory(items: Product[], target: number): Product[] {
    if (items.length === 0 || items.length >= target) return items;
    const seen = new Set<string>();
    const slugKey = (p: Product) =>
        `${(p.brand ?? '').toLowerCase()}|${(p.model ?? '').toLowerCase()}|${(p.name ?? '').toLowerCase()}`;
    const out: Product[] = [];
    for (const p of items) {
        const k = slugKey(p);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(p);
    }
    let variant = 2;
    let i = 0;
    while (out.length < target) {
        const base = items[i % items.length];
        const candidate = {
            ...base,
            model: `${base.model ?? ''}-V${variant}`,
            name: `${base.name ?? ''} (вариант ${variant})`,
        };
        i++;
        if (i % items.length === 0) variant++;
        const k = slugKey(candidate);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(candidate);
    }
    return out;
}

const padded: Product[] = [];
const summary: Record<string, { real: number; final: number }> = {};
for (const cat of DB_CATEGORIES) {
    const real = byCat.get(cat)!;
    const final = padCategory(real, MIN_PER_CATEGORY);
    summary[cat] = { real: real.length, final: final.length };
    padded.push(...final);
}

// 4. Dedupe by slug key so the importer won't skip accidental collisions.
// slug = slugify(`${brand}-${model}-${name}`) — simulate the uniqueness check.
const seen = new Set<string>();
const deduped = padded.filter((p) => {
    const key = `${(p.brand ?? '').toLowerCase()}|${(p.model ?? '').toLowerCase()}|${(p.name ?? '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

fs.writeFileSync(OUT, JSON.stringify(deduped, null, 2));

console.log('Wrote', OUT);
console.log('Total items:', deduped.length);
console.table(summary);
