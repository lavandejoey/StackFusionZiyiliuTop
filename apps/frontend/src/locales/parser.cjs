const fs = require('fs');
const path = require('path');

const pathProjectRoot = path.join(__dirname, '..');
const ignoreFolders = ['node_modules', 'locales', '.git', '.idea'];

// Start logging
console.log('🔍 Starting locale parser...');
console.time('Total Duration');

// Read all JSON files in the locales directory
console.time('Load Existing Locales');
const localeDir = path.join(pathProjectRoot, 'locales');
const jsonFiles = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
console.log(`Found ${jsonFiles.length} locale files:`, jsonFiles);

let existingKeys = new Set();
let mapFileJson = [];
for (const file of jsonFiles) {
    const filePath = path.join(localeDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.keys(data).forEach(key => existingKeys.add(key));
    mapFileJson.push({file, data});
}
console.log(`Loaded ${existingKeys.size} unique existing keys.`);
console.timeEnd('Load Existing Locales');

// Walk project to gather TS and TSX files
console.time('Scan Project Files');
const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(name => {
        if (ignoreFolders.includes(name)) return;
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            walkSync(full, filelist);
        } else {
            filelist.push(full);
        }
    });
    return filelist;
};

const allFiles = walkSync(pathProjectRoot);
const tsFiles = allFiles.filter(f => f.endsWith('.ts'));
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));
console.log(`Scanned ${allFiles.length} files: ${tsFiles.length} TS and ${tsxFiles.length} TSX.`);
console.timeEnd('Scan Project Files');

// Extract translation keys from useTranslation and cv functions
console.time('Extract Translation Keys');
const keyRegex = /\bt\(\s*['"`](.+?)['"`]\s*\)/g;
let allKeys = new Set();
for (const file of [...tsFiles, ...tsxFiles]) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
        allKeys.add(match[1]);
    }
}
console.log(`Extracted ${allKeys.size} unique translation keys.`);
console.timeEnd('Extract Translation Keys');

// Update locale JSONs: add missing, remove obsolete
console.time('Update Locale Files');
for (const {file, data} of mapFileJson) {
    let added = 0, removed = 0;
    for (const key of allKeys) {
        if (!data.hasOwnProperty(key)) {
            data[key] = '';
            added++;
        }
    }
    Object.keys(data).forEach(key => {
        if (!allKeys.has(key)) {
            delete data[key];
            removed++;
        }
    });
    fs.writeFileSync(path.join(localeDir, file), JSON.stringify(data, null, 4));
    console.log(`📄 ${file}: +${added}, -${removed}`);
}
console.timeEnd('Update Locale Files');

// Sort keys with classification
console.time('Sort Locale Files');
const monthYearRegex = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/;
const priorityGroups = [
    { // Dates & times: pure numbers, ISO dates, times, month-year formats
        test: k => /^\d+$/.test(k)
            || /\d{4}-\d{2}-\d{2}/.test(k)
            || /\d{2}:\d{2}/.test(k)
            || monthYearRegex.test(k)
    },
    { // Long sentences (>60 chars)
        test: k => k.length > 60
    },
    { // Short keys (<=20 chars)
        test: k => k.length <= 20
    }
];
const getOrder = key => {
    for (let i = 0; i < priorityGroups.length; i++) {
        if (priorityGroups[i].test(key)) return i;
    }
    return priorityGroups.length;
};
for (const {file, data} of mapFileJson) {
    const sortedKeys = Array.from(Object.keys(data)).sort((a, b) => {
        const oa = getOrder(a), ob = getOrder(b);
        if (oa !== ob) return oa - ob;
        return a.localeCompare(b);
    });
    const sortedData = {};
    sortedKeys.forEach(k => {
        sortedData[k] = data[k];
    });
    fs.writeFileSync(path.join(localeDir, file), JSON.stringify(sortedData, null, 4));
    console.log(`🔃 ${file}: grouped and sorted (${sortedKeys.length} keys).`);
}
console.timeEnd('Sort Locale Files');

// Report new keys missing in default locale
console.time('Report Missing Keys');
const missing = Array.from(allKeys).filter(k => !existingKeys.has(k));
if (missing.length) {
    console.log(`⚠️ ${missing.length} new keys missing in default locale:`);
    missing.forEach(k => console.log(` - ${k}`));
} else console.log('✅ No missing keys.');
console.timeEnd('Report Missing Keys');

// Finish
console.timeEnd('Total Duration');
console.log('✅ Locale parser completed.');
